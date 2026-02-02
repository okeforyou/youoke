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
import UnifiedPlayerInterface from '../components/UnifiedPlayerInterface';

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

        {/* Shared Unified Interface */}
        <UnifiedPlayerInterface
          videoId={videoId}
          queue={queue}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onPlayPause={togglePlay}
          onNext={requestNext}
          onMuteToggle={toggleMute}
          onToggleFullscreen={() => toggleFullscreen()}
          isFullscreen={isFullscreen}
        // Dual mode doesn't need prev usually, but we can support it if needed. 
        // Dual mode doesn't show Room Code usually (it's local), but strictly it's fine.
        />

      </div>
    </>
  );
}

