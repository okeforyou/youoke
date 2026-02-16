import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { useShallow } from 'zustand/react/shallow';
import { DigitalSignage } from '../modules/tv/components/DigitalSignage';
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
  SignalIcon,
} from '@heroicons/react/24/outline';

export default function DualScreen() {
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
  const [showSplash, setShowSplash] = useState(false);

  const lastQueueLengthRef = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<YouTubePlayer | null>(null);

  // Track local ID to prevent unnecessary re-renders/loads
  const currentVideoIdRef = useRef<string>('');

  // 1. Initial Setup
  useEffect(() => {
    // Mark dual mode as active
    localStorage.setItem('youoke-dual-active', 'true');
    console.log('📺 Dual Screen: Connected to PlayerStore (State Sync Mode)');

    const handleBeforeUnload = () => {
      localStorage.removeItem('youoke-dual-active');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      localStorage.removeItem('youoke-dual-active');
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 2. VIDEO SYNC: Watch `currentSource`
  useEffect(() => {
    if (!currentSource || !videoPlayerRef.current) return;

    // Is it a new video?
    if (currentSource !== currentVideoIdRef.current) {
      console.log(`🔀 Dual: Source changed to ${currentSource}. Loading...`);
      videoPlayerRef.current.loadVideoById(currentSource);
      currentVideoIdRef.current = currentSource;

      // 🎬 Phase 3: Trigger Cinematic Splash
      setShowSplash(true);
      const timer = setTimeout(() => setShowSplash(false), 6000);
      return () => clearTimeout(timer);
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
        // We increased threshold to 3s to prevent small jitter from triggering loops
        // since Dual Screen is now the Master time reporter.
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
    if (!player || !isPlaying) return;

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
  }, [player, isPlaying, setCurrentTime]);


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

      {/* Layer 1: Idle Screen (Digital Signage) */}
      {!currentSource ? (
        <DigitalSignage
          roomCode="HDMI"
          template="classic"
          messages={[
            "ยินดีต้อนรับสู่ YouOke DJ Mode",
            "เชื่อมต่อจอเสริมเพื่อประสบการณ์ที่เหนือกว่า",
            "ควบคุมเพลงผ่านหน้าจอหลักของคุณเดี๋ยวนี้",
            "ขอให้สนุกกับการร้องเพลง!"
          ]}
        />
      ) : (
        /* Player Screen */
        <div className="h-screen w-screen bg-black text-white flex flex-col">
          <div ref={playerContainerRef} className="flex-1 relative">
            <YouTube
              videoId={currentSource}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              className="w-full h-full"
            />

            {/* Layer 3: Cinematic Song Splash (Phase 3) */}
            {currentQVideo && showSplash && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in zoom-in duration-700">
                <div className="max-w-4xl text-center px-12 py-16 bg-black/60 backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] transform -translate-y-12">
                  <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-12 duration-1000 ease-out fill-mode-both">
                    <div className="px-6 py-2 bg-primary/20 backdrop-blur-md rounded-full border border-primary/30 flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                      <span className="text-xs font-black text-primary uppercase tracking-[0.4em]">กำลังเริ่มการแสดง</span>
                    </div>

                    <h1 className="text-7xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl">
                      {currentQVideo.title}
                    </h1>

                    {currentQVideo.author && (
                      <div className="flex items-center gap-4">
                        <div className="h-px w-12 bg-white/20" />
                        <p className="text-2xl font-bold text-white/60 italic tracking-wide">
                          {currentQVideo.author}
                        </p>
                        <div className="h-px w-12 bg-white/20" />
                      </div>
                    )}

                    <div className="mt-8 flex items-center gap-8 text-white/20 font-black text-[10px] tracking-[0.5em] uppercase">
                      <span>YouOke Professional</span>
                      <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                      <span>Beyond the Stage</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls Overlay (Minimalist - Fullscreen Only) */}
            {currentSource && showControls && (
              <div className="absolute top-4 right-4 z-50 transition-opacity duration-300">
                <div className="bg-black/60 backdrop-blur-md rounded-xl p-1 flex items-center gap-1 shadow-2xl border border-white/10 group">
                  <button
                    onClick={handleToggleFullscreen}
                    className="p-3 rounded-lg hover:bg-white/20 transition-all active:scale-90"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5 text-white/70 group-hover:text-white" /> : <ArrowsPointingOutIcon className="w-5 h-5 text-white/70 group-hover:text-white" />}
                  </button>
                </div>
              </div>
            )}

            {/* Layer 2: Queue HUD (Glassmorphism) */}
            {queue.length > 0 && showQueue && (
              <div className="absolute inset-y-0 right-0 w-[420px] z-40 p-8 flex flex-col justify-center pointer-events-none">
                <div className="w-full bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl p-8 space-y-8 animate-in slide-in-from-right-full duration-1000 ease-out pointer-events-auto">

                  {/* Now Playing HUD */}
                  {currentQVideo && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(234,88,12,0.8)]" />
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">กำลังเล่น</p>
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white leading-tight line-clamp-2 tracking-tighter">
                          {currentQVideo.title}
                        </h2>
                        {currentQVideo.author && (
                          <p className="text-sm text-primary/80 font-bold truncate">
                            {currentQVideo.author}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-white/10" />

                  {/* Next in Queue HUD */}
                  {queue.length > currentIndex + 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                          <MusicalNoteIcon className="w-4 h-4 text-primary" />
                          <span>คิวถัดไป</span>
                        </p>
                        <span className="text-[10px] bg-white/10 text-white/60 px-2 py-1 rounded-lg font-bold">
                          {queue.length - currentIndex - 1} SONGS
                        </span>
                      </div>

                      <div className="space-y-3">
                        {queue.slice(currentIndex + 1, currentIndex + 5).map((video, index) => (
                          <div
                            key={video.uuid || index}
                            className="flex items-center gap-4 group transition-all duration-300 transform hover:translate-x-1"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-[10px] font-black text-white/30 group-hover:text-primary transition-colors">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-white/80 line-clamp-1 group-hover:text-white transition-colors">
                                {video.title}
                              </p>
                              {video.author && (
                                <p className="text-[10px] text-white/30 truncate mt-0.5 font-medium uppercase tracking-wider">
                                  {video.author}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="pt-4 flex items-center gap-2 text-[10px] font-black italic text-white/20 tracking-widest">
                    <SignalIcon className="w-3 h-3 text-green-500/50" />
                    BEYOND THE STAGE • YOUOKE PRO
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
