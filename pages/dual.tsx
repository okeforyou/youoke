```typescript
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
} from '@heroicons/react/24/outline'; // Add icons

// ...

export default function DualScreen() {
  // ... existing state ...
  // Need local state for UI toggle (Mute/Play) to reflect immediately even if Sync is delayed
  // const [isMuted, setIsMuted] = useState(false); // Moved below
  // const [isPlaying, setIsPlaying] = useState(false); // Track local play state for UI // Moved below

  // Update handleMessage to update UI state
  // ... (Update existing handleMessage to setIsPlaying/setIsMuted if payload has it? Payload only has isPlaying)
  // Actually, we can just query player status on interaction.

  // Update opts to HIDE native controls
  // const opts = React.useMemo(() => ({ // Moved below
  //   height: '100%',
  //   width: '100%',
  //   playerVars: {
  //     autoplay: 1 as 1,
  //     controls: 0 as 0, // HIDE Native Controls
  //     modestbranding: 1 as 1,
  //     rel: 0 as 0,
  //     fs: 0 as 0,
  //     disablekb: 1 as 1,
  //     enablejsapi: 1 as 1,
  //   },
  // }), []);

  // UI Handlers
  // const togglePlay = () => { // Moved below
  //   if (!playerRef.current) return;
  //   const player = playerRef.current.getInternalPlayer();
  //   player.getPlayerState().then((state: number) => {
  //     if (state === 1) {
  //       player.pauseVideo();
  //       setIsPlaying(false);
  //     } else {
  //       player.playVideo();
  //       setIsPlaying(true);
  //     }
  //   });
  // };

  // const toggleMute = () => { // Moved below
  //   if (!playerRef.current) return;
  //   const player = playerRef.current.getInternalPlayer();
  //   if (player.isMuted()) {
  //     player.unMute();
  //     setIsMuted(false);
  //   } else {
  //     player.mute();
  //     setIsMuted(true);
  //   }
  // };

  // Sync Interval for UI state (Alternative to message pushing)
  // useEffect(() => { // Moved below
  //   const interval = setInterval(async () => {
  //     if (playerRef.current) {
  //       const p = playerRef.current.getInternalPlayer();
  //       if (p && p.getPlayerState) {
  //         const state = await p.getPlayerState();
  //         setIsPlaying(state === 1);
  //         setIsMuted(p.isMuted());
  //       }
  //     }
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, []);

  // ... (Rest of component)

  // Render Section
  {/* ... Queue ... */ }

  {/* Custom Control Pill (Unified UI) */ }
  {/* <div className={`absolute bottom - 8 left - 1 / 2 transform - translate - x - 1 / 2 z - 50 transition - all duration - 300 ${ showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4' } `}>
    <div className="bg-black/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-4 border border-white/10 shadow-2xl">

      {/* Play/Pause *
      <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-full transition-colors">
        {isPlaying ? <PauseIcon className="w-8 h-8 text-white" /> : <PlayIcon className="w-8 h-8 text-white" />}
      </button>

      {/* Mute *
      <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full transition-colors">
        {isMuted ? <SpeakerXMarkIcon className="w-6 h-6 text-white" /> : <SpeakerWaveIcon className="w-6 h-6 text-white" />}
      </button>

      <div className="w-px h-6 bg-white/20 mx-1"></div>

      {/* Fullscreen (Seamless) *
      <button
        onClick={() => toggleFullscreen()}
        className="p-2 hover:bg-white/20 rounded-full transition-colors"
      >
        {isFullscreen ? <ArrowsPointingInIcon className="w-6 h-6 text-white" /> : <ArrowsPointingOutIcon className="w-6 h-6 text-white" />}
      </button>
    </div>
  </div>
      </div > */}

    type SyncPayload = {
      videoId: string;
      queue: any[];
      currentIndex: number;
      timestamp: number;
    };

  // export default function DualScreen() { // Already defined above
    const [videoId, setVideoId] = useState<string>('');
    const [queue, setQueue] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    // Queue Auto-Hide Logic
    const [showQueue, setShowQueue] = useState(false);
    const queueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // YouTube Player Ref
    const playerRef = useRef<YouTube>(null);

    // Fullscreen Logic (Wrapper Strategy)
    const fullscreenRef = useRef<HTMLDivElement>(null);
    const [showFullscreen, toggleFullscreen] = useToggle(false);
    const isFullscreen = useFullscreen(fullscreenRef, showFullscreen, { onClose: () => toggleFullscreen(false) });

    // UI State for Custom Controls
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

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
            setVideoId(payload.videoId); // React handles deduplication

            // Use helper for queue
            handleQueueUpdate(payload.queue);

            setIsConnected(true);

            if (playerRef.current) {
              const internalPlayer = playerRef.current.getInternalPlayer();
              // Only force state if Video Changed OR explicitly requested
              // If just queue update, don't interrupt playback unless needed
              if (internalPlayer && payload.videoId !== videoId) {
                // Initial load or change
                if (payload.isPlaying) internalPlayer.playVideo();
                else internalPlayer.pauseVideo();
              }
            }
          }
        } else if (event.data?.type === 'QUEUE_UPDATE') {
          // Fallback handler for legacy QUEUE_UPDATE messages
          console.log('📨 [Dual] Received QUEUE_UPDATE (fallback):', event.data);
          if (event.data.videoId) setVideoId(event.data.videoId);
          if (event.data.queue) handleQueueUpdate(event.data.queue);
          setIsConnected(true);
        } else if (event.data?.type === 'PLAY') {
          // @ts-ignore
          playerRef.current?.getInternalPlayer()?.playVideo();
        } else if (event.data?.type === 'PAUSE') {
          // @ts-ignore
          playerRef.current?.getInternalPlayer()?.pauseVideo();
        }
      };

      channel.addEventListener('message', handleMessage);

      // Initial Request
      console.log('📡 [Dual] Requesting State...');
      channel.postMessage({ type: 'REQUEST_STATE' });

      // Handle Window Close - Notify Main Screen
      const handleUnload = () => {
        localStorage.setItem('youoke-dual-active', 'false');
      };
      window.addEventListener('beforeunload', handleUnload);

      return () => {
        channel.removeEventListener('message', handleMessage);
        channel.close();
        window.removeEventListener('beforeunload', handleUnload);
      };
    }, [queue, videoId]); // Add deps for handleQueueUpdate context

    // Memoize options to prevent unnecessary re-renders
    const opts = React.useMemo(() => ({
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 1 as 1,
        controls: 0 as 0, // HIDE Native Controls for Seamless UI
        modestbranding: 1 as 1,
        rel: 0 as 0,
        fs: 0 as 0, // Disable native FS
        disablekb: 1 as 1,
        enablejsapi: 1 as 1, // Ensure JS API is enabled
      },
    }), []);


    const onPlayerReady = (event: any) => {
      // 1. Immediate Play
      event.target.playVideo();

      // 2. Aggressive Retry (Double Tap)
      // Ensures playback starts even if browser throttled the first attempt
      setTimeout(() => {
        try {
          const state = event.target.getPlayerState();
          // If not Playing (1) and not Buffering (3)
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

  // UI Handlers for Custom Controls
  const togglePlay = () => {
    if (!playerRef.current) return;
    const player = playerRef.current.getInternalPlayer();
    player.getPlayerState().then((state: number) => {
        if (state === 1) player.pauseVideo();
        else player.playVideo();
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

  // Poll for UI state updates (Simple sync)
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

    // Mouse Auto-Hide (Simulate Native Controls behavior)
    const [showControls, setShowControls] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    return (
      <>
        <Head>
          <title>YouOKE - Dual Screen (Receiver)</title>
        </Head>

        {/* Wrapper with Fullscreen Ref */}
        <div
          ref={fullscreenRef}
          className="h-screen w-screen bg-black text-white relative overflow-hidden group cursor-none hover:cursor-default" // Hide cursor by default, show on hover/move
        >

          {/* Waiting Screen (Overlay when no video or disconnected) */}
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
          <div className={`w - full h - full transition - opacity duration - 500 ${ videoId ? 'opacity-100' : 'opacity-0' } `}>
            <YouTube
              key={videoId} // Restored for 100% Stability
              videoId={videoId}
              opts={opts}
              onReady={onPlayerReady}
              onEnd={onPlayerEnd}
              className="w-full h-full"
              ref={playerRef}
            />
          </div>

          {/* Queue Display */}
          {queue && queue.length > 0 && (
            <div className={`absolute top - 4 right - 4 w - 80 bg - black / 60 backdrop - blur - md rounded - xl p - 4 z - 40 transition - opacity duration - 500 pointer - events - none ${ showQueue ? 'opacity-100' : 'opacity-0' } `}>
              <h2 className="text-lg font-bold mb-3 text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                คิวเพลง ({queue.length})
              </h2>
              <div className="space-y-2">
                {queue.slice(0, 7).map((v, i) => (
                  <div key={i} className={`flex gap - 3 text - sm p - 2 rounded - lg ${ v.videoId === videoId ? 'bg-primary/20 text-white font-bold border border-primary/50' : 'text-gray-300' } `}>
                    <span className="opacity-70">{i + 1}.</span>
                    <span className="line-clamp-1">{v.title}</span>
                  </div>
                ))}
                {queue.length > 7 && <p className="text-xs text-center text-gray-400 mt-2">+ อีก {queue.length - 7} เพลง</p>}
              </div>
            </div>
          )}
          {/* Custom Fullscreen Control (Always Visible on Hover) */}
          {/* Custom Control Pill (Unified UI) */}
         <div className={`absolute bottom - 8 left - 1 / 2 transform - translate - x - 1 / 2 z - 50 transition - all duration - 300 ${ showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4' } `}>
            <div className="bg-black/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-4 border border-white/10 shadow-2xl">

                {/* Play/Pause */}
                <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    {isPlaying ? <PauseIcon className="w-8 h-8 text-white" /> : <PlayIcon className="w-8 h-8 text-white" />}
                </button>

                {/* Mute */}
                <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    {isMuted ? <SpeakerXMarkIcon className="w-6 h-6 text-white" /> : <SpeakerWaveIcon className="w-6 h-6 text-white" />}
                </button>

                <div className="w-px h-6 bg-white/20 mx-1"></div>

                {/* Fullscreen (Seamless) */}
                <button
                    onClick={() => toggleFullscreen()}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                    {isFullscreen ? <ArrowsPointingInIcon className="w-6 h-6 text-white" /> : <ArrowsPointingOutIcon className="w-6 h-6 text-white" />}
                </button>
            </div>
         </div>

        </div>
      </>
    );
  }
```
