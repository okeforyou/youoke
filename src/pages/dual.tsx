/**
 * Dual Screen (2 หน้าจอ) - DJ Mode
 *
 * Second screen that syncs with main screen using "Pure State Sync" (Store Replication)
 * - Directly listens to usePlayerStore updates
 * - No manual command parsing
 */

import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { useRouter } from 'next/router';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '@/firebase';
import clsx from 'clsx';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { useShallow } from 'zustand/react/shallow';
import {
  SpeakerXMarkIcon,
  SpeakerWaveIcon,
  MusicalNoteIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';
import { ConnectionBadge } from '../modules/tv/components/ConnectionBadge';

export default function DualScreen() {
  const router = useRouter();
  const { room: roomCode } = router.query;
  const [syncMode, setSyncMode] = useState<'local' | 'remote'>('local');

  // Bind to PlayerStore (Single Source of Truth)
  const {
    currentVideo,
    currentSource,
    isPlaying,
    isMuted,
    queue,
    currentIndex,
    currentTime,
    setCurrentTime,
    playNext,
    playPrevious,
    togglePlay,
    setMuted
  } = usePlayerStore(
    useShallow(state => ({
      currentVideo: state.currentVideo,
      currentSource: state.currentSource,
      isPlaying: state.isPlaying,
      isMuted: state.isMuted,
      queue: state.queue,
      currentIndex: state.currentIndex,
      currentTime: state.currentTime,
      setCurrentTime: state.setCurrentTime,
      playNext: state.playNext,
      playPrevious: state.playPrevious,
      togglePlay: state.togglePlay,
      setMuted: state.setMuted
    }))
  );

  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [showQueue, setShowQueue] = useState(true);
  const [forceShowQueue, setForceShowQueue] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPassive, setIsPassive] = useState(false);

  const lastQueueLengthRef = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<YouTubePlayer | null>(null);

  // Track local ID to prevent unnecessary re-renders/loads
  const currentVideoIdRef = useRef<string>('');

  // 1. Initial Setup
  useEffect(() => {
    localStorage.setItem('youoke-dual-active', 'true');
    console.log('📺 Dual Screen: Initializing...');

    if (roomCode) {
      setSyncMode('remote');
      console.log(`🌐 Dual Screen: Switching to REMOTE mode (Room: ${roomCode})`);
    }

    const handleBeforeUnload = () => {
      localStorage.removeItem('youoke-dual-active');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      localStorage.removeItem('youoke-dual-active');
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomCode]);

  // 1.1 Remote Sync (Firebase)
  useEffect(() => {
    if (!roomCode || !realtimeDb) return;

    const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.timestamp) {
        console.log('📥 Dual (Remote): Received State Update', data.currentVideo?.title);
        // Sync to local store so other effects can handle video/time sync
        usePlayerStore.getState().syncState(data);
      }
    });

    return () => {
      off(stateRef);
      unsubscribe();
    };
  }, [roomCode]);


  // 2. VIDEO SYNC: Watch `currentSource`
  useEffect(() => {
    if (!currentSource || !videoPlayerRef.current) return;

    // Is it a new video?
    if (currentSource !== currentVideoIdRef.current) {
      console.log(`🔀 Dual: Source changed to ${currentSource}. Loading...`);
      videoPlayerRef.current.loadVideoById(currentSource);
      currentVideoIdRef.current = currentSource;
    }
  }, [currentSource]);

  // 3. STATE SYNC: Watch `isPlaying`
  useEffect(() => {
    const syncState = async () => {
      if (!videoPlayerRef.current) return;
      const pState = await videoPlayerRef.current.getPlayerState();

      // If Store says Play but Player is Paused/Cued (2 or 5 or -1)
      if (isPlaying && (pState !== 1 && pState !== 3)) {
        console.log("▶️ Dual: Sync Play");
        videoPlayerRef.current.playVideo();
      }
      // If Store says Pause but Player is Playing (1)
      else if (!isPlaying && pState === 1) {
        console.log("⏸️ Dual: Sync Pause");
        videoPlayerRef.current.pauseVideo();
      }
    };
    syncState();
  }, [isPlaying]);


  // 4. TIME SYNC: Watch `currentTime` (for Seeking)
  useEffect(() => {
    const syncTime = async () => {
      if (!videoPlayerRef.current || !isPlaying) return;

      try {
        const playerTime = await videoPlayerRef.current.getCurrentTime();
        const diff = Math.abs(playerTime - currentTime);

        // SEEK if difference is significant (> 3s)
        // AND ignore jumps to 0 (Circuit Breaker logic)
        if (diff > 3 && currentTime > 0.1) {
          console.log(`⏩ Dual: Sync Seek ${playerTime.toFixed(1)} -> ${currentTime.toFixed(1)}`);
          videoPlayerRef.current.seekTo(currentTime, true);
        }
      } catch (e) {
        // Ignore errors during loading
      }
    };
    syncTime();
  }, [currentTime, isPlaying]);

  // 5. MUTE SYNC
  useEffect(() => {
    if (!videoPlayerRef.current) return;
    if (isMuted) videoPlayerRef.current.mute();
    else videoPlayerRef.current.unMute();
  }, [isMuted]);

  // 6. HEARTBEAT: Update Store Time (Master Mode)
  // Since this IS the active player, it must report time to the store
  useEffect(() => {
    // Only broadcast heartbeat if in LOCAL mode. 
    // In REMOTE mode, the Host is authoritative.
    if (!player || !isPlaying || syncMode === 'remote') return;

    const interval = setInterval(async () => {
      try {
        // Check Player State: Only broadcast if PLAYING (1)
        // Avoid broadcasting during BUFFERING (3) or CUED (5)
        const pState = await player.getPlayerState();
        if (pState !== 1) return;

        const time = await player.getCurrentTime();
        if (time && time > 0) {
          // Determine if we should update store
          // We want to broadcast to Main Screen so Progress bar updates.
          // Main Screen listens via `bc.onmessage`.
          setCurrentTime(time);
        }
      } catch (e) { }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, isPlaying, setCurrentTime, syncMode]);


  // --- UI LOGIC (Queue, Controls) ---

  // Temporarily show queue when songs are added or removed
  useEffect(() => {
    const currentLength = queue.length;
    const previousLength = lastQueueLengthRef.current;

    if (currentLength !== previousLength && previousLength !== 0) {
      setForceShowQueue(true);
      setShowQueue(true);
      const timer = setTimeout(() => setForceShowQueue(false), 20000);
      lastQueueLengthRef.current = currentLength;
      return () => clearTimeout(timer);
    }
    lastQueueLengthRef.current = currentLength;
  }, [queue.length]);

  // Check remaining time and show/hide queue
  useEffect(() => {
    if (!player || !isPlaying) {
      setShowQueue(true);
      return;
    }
    const checkTime = setInterval(async () => {
      try {
        const t = await player.getCurrentTime();
        const d = await player.getDuration();
        const remaining = d - t;
        const showAtStart = t < 15;
        const showAtEnd = remaining < 60;
        setShowQueue(forceShowQueue || showAtStart || showAtEnd);
      } catch (error) { }
    }, 1000);
    return () => clearInterval(checkTime);
  }, [player, isPlaying, forceShowQueue]);

  // Mouse auto-hide
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // UI Handlers (Directly call Store Actions)
  const handleToggleFullscreen = async () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      await playerContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePassive = () => {
    setIsPassive(!isPassive);
  };

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    console.log('✅ Dual: YouTube player ready (Pure Store Sync)');
    setPlayer(event.target);
    videoPlayerRef.current = event.target;
    // Start muted ONLY if store is muted, or let effects sync it
    const s = usePlayerStore.getState();
    if (s.isMuted) event.target.mute();
    else event.target.unMute();

    // Initial Load if source exists
    const state = usePlayerStore.getState();
    if (state.currentSource) {
      event.target.loadVideoById(state.currentSource);
      currentVideoIdRef.current = state.currentSource;
    }
  };

  const onPlayerStateChange = (event: { data: number }) => {
    // 0=Ended, 1=Playing, 2=Paused
    if (event.data === 0) {
      console.log('🎬 Dual: Video ended');
      // Store should handle auto-next via Master Logic?
      // NO. We are the Master now (Active Player).
      // Main Screen is Passive (Zombie).
      // So WE must trigger Next.
      playNext();
    }
    if (event.data === 1 && !isPlaying) togglePlay(); // Sync local play to store
    if (event.data === 2 && isPlaying) togglePlay(); // Sync local pause to store
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1 as 1,
      controls: 0 as 0,
      modestbranding: 1 as 1,
      rel: 0 as 0,
      disablekb: 1 as 1,
    },
  };

  // Safe Queue Access
  const currentQVideo = queue[currentIndex];

  return (
    <>
      <Head>
        <title>YouOKE - 2 หน้าจอ (Dual Screen)</title>
      </Head>

      {/* Waiting Screen */}
      {!currentSource ? (
        <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🖥️</div>
            <h1 className="text-3xl font-bold mb-2">2 หน้าจอ (Dual Screen)</h1>
            <p className="text-gray-400 mb-6">รอเพลงจากหน้าจอหลัก...</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Connected to Store</span>
            </div>
          </div>
        </div>
      ) : (
        /* Player Screen */
        <div className="h-screen w-screen bg-black text-white flex flex-col">
          {/* Connection Status Badge */}
          <div className="absolute top-6 right-6 z-[60]">
            <ConnectionBadge mode={syncMode} />
          </div>
          <div ref={playerContainerRef} className="flex-1 relative">
            <YouTube
              videoId={currentSource}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              className="w-full h-full"
            />

            {/* Controls Overlay */}
            {currentSource && showControls && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-300">
                <div className="bg-black/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl border border-white/10">
                  <button onClick={playPrevious} disabled={currentIndex === 0} className="p-3 rounded-full hover:bg-white/20 disabled:opacity-30">
                    <BackwardIcon className="w-6 h-6 text-white" />
                  </button>
                  <button onClick={togglePlay} className="p-4 rounded-full bg-primary hover:bg-primary/80">
                    {isPlaying ? <PauseIcon className="w-7 h-7 text-white" /> : <PlayIcon className="w-7 h-7 text-white" />}
                  </button>
                  <button onClick={playNext} disabled={currentIndex >= queue.length - 1} className="p-3 rounded-full hover:bg-white/20 disabled:opacity-30">
                    <ForwardIcon className="w-6 h-6 text-white" />
                  </button>
                  <div className="ml-2 pl-2 border-l border-white/20"></div>
                  <button onClick={() => setMuted(!isMuted)} className="p-3 rounded-full hover:bg-white/20">
                    {isMuted ? <SpeakerXMarkIcon className="w-6 h-6 text-white" /> : <SpeakerWaveIcon className="w-6 h-6 text-white" />}
                  </button>
                  <button onClick={handleToggleFullscreen} className="p-3 rounded-full hover:bg-white/20">
                    {isFullscreen ? <ArrowsPointingInIcon className="w-6 h-6 text-white" /> : <ArrowsPointingOutIcon className="w-6 h-6 text-white" />}
                  </button>
                  <button
                    onClick={togglePassive}
                    className={clsx(
                      "p-3 rounded-full transition-colors",
                      isPassive ? "bg-primary text-white" : "hover:bg-white/20 text-white/60"
                    )}
                    title={isPassive ? "ปิดโหมด Passive" : "เปิดโหมด Passive (ซ่อน UI ทั้งหมด)"}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black uppercase">Passive</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Queue Display */}
            {queue.length > 0 && showQueue && !isPassive && (
              <div className="absolute top-0 right-0 h-full w-80 lg:w-96 z-50 bg-gradient-to-l from-black/90 via-black/80 to-transparent backdrop-blur-md p-6 overflow-y-auto transition-all duration-500">
                <div className="space-y-6">
                  {/* Now Playing */}
                  {currentQVideo && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">กำลังเล่น</p>
                      <div className="bg-primary/20 border border-primary/30 rounded-xl p-4">
                        <h2 className="text-lg font-bold mb-1 line-clamp-2">{currentQVideo.title}</h2>
                        {currentQVideo.author && <p className="text-sm text-gray-300 truncate">{currentQVideo.author}</p>}
                      </div>
                    </div>
                  )}
                  {/* Next in Queue */}
                  {queue.length > currentIndex + 1 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <MusicalNoteIcon className="w-5 h-5" />
                        <span>คิวถัดไป</span>
                        <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">{queue.length - currentIndex - 1} เพลง</span>
                      </p>
                      <div className="space-y-2">
                        {queue.slice(currentIndex + 1, currentIndex + 8).map((video, index) => (
                          <div key={video.uuid || index} className="bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-all">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                                <span className="text-primary font-bold text-xs">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm line-clamp-2 mb-0.5">{video.title}</p>
                                {video.author && <p className="text-xs text-gray-400 truncate">{video.author}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
