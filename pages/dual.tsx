import Head from 'next/head';
import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';

type SyncPayload = {
  videoId: string;
  queue: any[];
  currentIndex: number;
  timestamp: number;
};

export default function DualScreen() {
  const [videoId, setVideoId] = useState<string>('');
  const [queue, setQueue] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Queue Auto-Hide Logic
  const [showQueue, setShowQueue] = useState(false);
  const queueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // YouTube Player Ref
  const playerRef = useRef<YouTube>(null);

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
      controls: 1 as 1,
      modestbranding: 1 as 1,
      rel: 0 as 0,
      fs: 1 as 1, // Explicit Fullscreen
      disablekb: 1 as 1,
      enablejsapi: 1 as 1, // Ensure JS API is enabled
    },
  }), []);


  const onPlayerReady = (event: any) => {
    event.target.playVideo();
  };

  const onPlayerEnd = () => {
    // Do nothing. Wait for Main Screen to change song -> Trigger Sync -> Update Video ID
    console.log('🎬 [Dual] Video Ended. Waiting for sync...');
  };

  return (
    <>
      <Head>
        <title>YouOKE - Dual Screen (Receiver)</title>
      </Head>

      {/* Wrapper */}
      <div className="h-screen w-screen bg-black text-white relative overflow-hidden">

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
        <div className={`w-full h-full transition-opacity duration-500 ${videoId ? 'opacity-100' : 'opacity-0'}`}>
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
      </div>
    </>
  );
}
