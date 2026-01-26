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
  SpeakerXMarkIcon
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
    if (player.isMuted()) {
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
            setIsMuted(p.isMuted());
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
    console.log('🎬 [Dual] Video Ended. Requesting Next...');
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
        {queue && queue.length > 0 && (
          <div className={`absolute top-4 right-4 w-80 bg-black/60 backdrop-blur-md rounded-xl p-4 z-40 transition-opacity duration-500 pointer-events-none ${showQueue ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-lg font-bold mb-3 text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              คิวเพลง ({queue.length})
            </h2>
            <div className="space-y-2">
              {queue.slice(0, 7).map((v, i) => (
                <div key={i} className={`flex gap-3 text-sm p-2 rounded-lg ${v.videoId === videoId ? 'bg-primary/20 text-white font-bold border border-primary/50' : 'text-gray-300'}`}>
                  <span className="opacity-70">{i + 1}.</span>
                  <span className="line-clamp-1">{v.title}</span>
                </div>
              ))}
              {queue.length > 7 && <p className="text-xs text-center text-gray-400 mt-2">+ อีก {queue.length - 7} เพลง</p>}
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
            <button onClick={toggleMute} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              {isMuted ? <SpeakerXMarkIcon className="w-6 h-6 text-white/80" /> : <SpeakerWaveIcon className="w-6 h-6 text-white/80" />}
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-white/20"></div>

            {/* Fullscreen (Seamless) */}
            <button
              onClick={() => toggleFullscreen()}
              className="p-1 hover:bg-white/20 rounded-full transition-colors group"
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
