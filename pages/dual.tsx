import Head from 'next/head';
import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { useFullscreen, useToggle } from 'react-use';
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ForwardIcon,
  MusicalNoteIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

type SyncPayload = {
  videoId: string;
  queue: any[];
  currentIndex: number;
  timestamp: number;
};

export default function DualScreen() {
  // State
  const [videoId, setVideoId] = useState<string>('');
  const [queue, setQueue] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // UI State for Custom Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Queue Auto-Hide Logic
  const [showQueue, setShowQueue] = useState(false);
  const queueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mouse Auto-Hide
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const playerRef = useRef<YouTube>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Hooks
  const [showFullscreen, toggleFullscreen] = useToggle(false);
  const isFullscreen = useFullscreen(fullscreenRef, showFullscreen, { onClose: () => toggleFullscreen(false) });

  // Update opts to HIDE native controls
  const opts = React.useMemo(() => ({
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1 as 1,
      controls: 0 as 0, // HIDE Native Controls
      modestbranding: 1 as 1,
      rel: 0 as 0,
      fs: 0 as 0, // Disable native FS
      disablekb: 1 as 1,
      enablejsapi: 1 as 1,
    },
  }), []);

  // Helper: Update Queue with Auto-Hide
  const handleQueueUpdate = (newQueue: any[]) => {
    // Simple shallow comparison to avoid flicker
    if (JSON.stringify(newQueue) !== JSON.stringify(queue)) {
      setQueue(newQueue);
      setShowQueue(true);

      if (queueTimeoutRef.current) clearTimeout(queueTimeoutRef.current);
      queueTimeoutRef.current = setTimeout(() => {
        setShowQueue(false);
      }, 5000);
    }
  };

  // Connection & Listener Logic
  useEffect(() => {
    const channel = new BroadcastChannel('youoke-dual-sync');

    // Handler for incoming state
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_STATE') {
        const { payload } = event.data;
        console.log('📨 [Dual] Received Sync:', payload);

        if (payload) {
          setVideoId(payload.videoId);
          handleQueueUpdate(payload.queue);
          setIsConnected(true);

          if (playerRef.current) {
            const internalPlayer = playerRef.current.getInternalPlayer();
            // Only force state if Video Changed OR explicitly requested
            if (internalPlayer && payload.videoId !== videoId) {
              // Initial load or change
              if (payload.isPlaying) internalPlayer.playVideo();
              else internalPlayer.pauseVideo();
            }
          }
        }
      } else if (event.data?.type === 'QUEUE_UPDATE') {
        // Fallback
        if (event.data.videoId) setVideoId(event.data.videoId);
        if (event.data.queue) handleQueueUpdate(event.data.queue);
        setIsConnected(true);
      } else if (event.data?.type === 'PLAY') {
        // @ts-ignore
        playerRef.current?.getInternalPlayer()?.playVideo();
        setIsPlaying(true);
      } else if (event.data?.type === 'PAUSE') {
        // @ts-ignore
        playerRef.current?.getInternalPlayer()?.pauseVideo();
        setIsPlaying(false);
      }
    };

    channel.addEventListener('message', handleMessage);
    console.log('📡 [Dual] Requesting State...');
    channel.postMessage({ type: 'REQUEST_STATE' });

    const handleUnload = () => localStorage.setItem('youoke-dual-active', 'false');
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [queue, videoId]);

  // UI Handlers
  const togglePlay = () => {
    if (!playerRef.current) return;
    const player = playerRef.current.getInternalPlayer();
    player.getPlayerState().then((state: number) => {
      if (state === 1) {
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
      }
    });
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    const player = playerRef.current.getInternalPlayer();
    // Optimistic update
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  // Poll for UI sync
  useEffect(() => {
    const interval = setInterval(async () => {
      if (playerRef.current) {
        const p = playerRef.current.getInternalPlayer();
        // @ts-ignore
        if (p && typeof p.getPlayerState === 'function') {
          try {
            const state = await p.getPlayerState();
            setIsPlaying(state === 1);
            setIsMuted(await p.isMuted());
          } catch (e) { /* ignore */ }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mouse Move Listener
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const onPlayerReady = (event: any) => {
    // 1. Immediate Play
    event.target.playVideo();

    // 2. Aggressive Retry (Double Tap)
    setTimeout(() => {
      try {
        const state = event.target.getPlayerState();
        if (state !== 1 && state !== 3) {
          console.log('🔄 [Dual] Force playing (retry)...');
          event.target.playVideo();
        }
      } catch (e) { /* ignore */ }
    }, 1000);
  };

  const onPlayerEnd = () => {
    // Trigger Next Song on Main Screen
    console.log('🎬 [Dual] Video Ended. Requesting Next...');
    const channel = new BroadcastChannel('youoke-dual-sync');
    channel.postMessage({ type: 'REQUEST_NEXT' });
    channel.close();
  };

  const requestNext = () => {
    console.log('⏭️ [Dual] User requested Next...');
    const channel = new BroadcastChannel('youoke-dual-sync');
    channel.postMessage({ type: 'REQUEST_NEXT' });
    channel.close();
  };

  return (
    <>
      <Head>
        <title>YouOKE - Dual Screen (Receiver)</title>
      </Head>

      {/* Wrapper with Fullscreen Ref */}
      <div
        ref={fullscreenRef}
        className="h-screen w-screen bg-black text-white relative overflow-hidden group cursor-none hover:cursor-default"
      >

        {/* Waiting Screen */}
        {(!videoId) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
            <div className="text-center">
              <div className="text-6xl mb-4">🖥️</div>
              <h1 className="text-3xl font-bold mb-2">Dual Screen Connected</h1>
              <p className="text-gray-400">รอเลือกเพลงจากหน้าจอหลัก...</p>
              <div className="mt-4 flex justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-500">Live Sync Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Player Container */}
        <div className={`w-full h-full transition-opacity duration-500 ${videoId ? 'opacity-100' : 'opacity-0'}`}>
          <YouTube
            key={videoId}
            videoId={videoId}
            opts={opts}
            onReady={onPlayerReady}
            onEnd={onPlayerEnd}
            className="w-full h-full"
            ref={playerRef}
          />
        </div>

        {/* Queue Display (Top Right) */}
        {/* Queue Display (Modern Widget Style) */}
        {/* Queue Display (Clean Red Style) */}
        {queue && queue.length > 0 && (
          <div className={`absolute top-8 right-8 w-96 bg-black/80 backdrop-blur-xl rounded-3xl p-6 z-40 shadow-2xl transition-all duration-500 pointer-events-none transform ${showQueue ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>

            {/* Styles for Marquee */}
            {/* Styles for Infinite Marquee */}
            <style>{`
              @keyframes marquee-infinite {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee-infinite {
                animation: marquee-infinite 20s linear infinite;
                display: flex;
                width: max-content;
                will-change: transform;
              }
            `}</style>

            {/* Header: Now Playing */}
            <div className="mb-4 overflow-hidden relative">
              <div className="flex items-center gap-2 text-primary mb-2">
                <MusicalNoteIcon className="w-5 h-5 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">Now Playing</span>
              </div>

              {queue.find(v => v.videoId === videoId) ? (
                (() => {
                  const title = queue.find(v => v.videoId === videoId)?.title || "";
                  const isLong = title.length > 30; // Lower threshold slightly for wider widget
                  return (
                    <div className="relative w-full overflow-hidden">
                      {isLong ? (
                        <div className="animate-marquee-infinite">
                          {/* Render text twice for seamless loop */}
                          <h1 className="text-white font-medium text-sm whitespace-nowrap mr-16">
                            {title}
                          </h1>
                          <h1 className="text-white font-medium text-sm whitespace-nowrap mr-16">
                            {title}
                          </h1>
                        </div>
                      ) : (
                        <h1 className="text-white font-medium text-sm truncate">
                          {title}
                        </h1>
                      )}
                    </div>
                  );
                })()
              ) : (
                <h1 className="text-white font-medium text-sm truncate">Loading...</h1>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10 w-full mb-3"></div>

            {/* Up Next List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <ListBulletIcon className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Up Next</span>
              </div>

              {/* Filter logic: Show next 3 songs after current */}
              {(() => {
                const currentIndex = queue.findIndex(v => v.videoId === videoId);
                const nextSongs = currentIndex !== -1 ? queue.slice(currentIndex + 1, currentIndex + 4) : queue.slice(0, 3);

                if (nextSongs.length === 0) return <p className="text-xs text-gray-500 italic">No more songs.</p>;

                return (
                  <>
                    {nextSongs.map((v, i) => (
                      <div key={i} className="flex gap-3 text-sm text-gray-300 items-center">
                        <span className="text-xs text-gray-500 font-mono">{(currentIndex + 1) + (i + 1)}</span>
                        <span className="line-clamp-1 opacity-80">{v.title}</span>
                      </div>
                    ))}
                    {(queue.length - (currentIndex + 1 + nextSongs.length) > 0) && (
                      <p className="text-xs text-gray-500 mt-2 pl-6">+ อีก {queue.length - (currentIndex + 1 + nextSongs.length)} เพลง</p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Custom Control Pill (Unified UI - Bottom Center) */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-black/60 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-6 border border-white/10 shadow-2xl">

            {/* Play/Pause */}
            <button onClick={togglePlay} className="p-1 hover:bg-white/20 rounded-full transition-colors group">
              {isPlaying ? (
                <PauseIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              ) : (
                <PlayIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              )}
            </button>

            {/* Mute (Dynamic Icon) */}
            <button onClick={toggleMute} className="p-1 hover:bg-white/20 rounded-full transition-colors order-3">
              {isMuted ? <SpeakerXMarkIcon className="w-6 h-6 text-white/80" /> : <SpeakerWaveIcon className="w-6 h-6 text-white/80" />}
            </button>

            {/* Next Song */}
            <button onClick={requestNext} className="p-1 hover:bg-white/20 rounded-full transition-colors order-2 block">
              <ForwardIcon className="w-8 h-8 text-white hover:scale-110 transition-transform" />
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-white/20 order-4"></div>

            {/* Fullscreen (Seamless) */}
            <button
              onClick={() => toggleFullscreen()}
              className="p-1 hover:bg-white/20 rounded-full transition-colors group order-5"
              title="Seamless Fullscreen"
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              ) : (
                <ArrowsPointingOutIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
