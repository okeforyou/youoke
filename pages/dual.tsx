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

  // YouTube Player Ref
  const playerRef = useRef<YouTube>(null);

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
          setQueue(payload.queue);
          setIsConnected(true);
        }
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

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1 as 1,
      controls: 1 as 1,
      modestbranding: 1 as 1,
      rel: 0 as 0,
      fs: 1 as 1, // Explicit Fullscreen
      disablekb: 1 as 1,
    },
  };

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
            key={videoId} // Force remount if ID changes (Ensures clean state)
            videoId={videoId}
            opts={opts}
            onReady={onPlayerReady}
            onEnd={onPlayerEnd}
            className="w-full h-full"
          />
        </div>

        {/* Queue Display (Simplified) */}
        {queue.length > 0 && (
          <div className="absolute top-0 right-0 h-full w-80 bg-black/40 p-6 z-40 pointer-events-none">
            <h2 className="text-xl font-bold mb-4 opacity-80">คิวเพลง ({queue.length})</h2>
            <div className="space-y-3">
              {queue.slice(0, 10).map((v, i) => (
                <div key={i} className={`flex gap-3 text-sm ${v.videoId === videoId ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                  <span>{i + 1}.</span>
                  <span className="line-clamp-1">{v.title}</span>
                </div>
              ))}
              {queue.length > 10 && <p className="text-xs text-gray-500 mt-2">+ อีก {queue.length - 10} เพลง</p>}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
