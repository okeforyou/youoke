/**
 * Dual Screen (2 หน้าจอ)
 *
 * Simple second screen that syncs with main screen using BroadcastChannel
 * - No room code needed
 * - Instant sync
 * - Works on same device only
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import YoutubePlayer from '../components/YoutubePlayer';

interface DualMessage {
  type: 'PLAY' | 'PAUSE' | 'NEXT' | 'PREV' | 'QUEUE_UPDATE';
  videoId?: string;
  queue?: any[];
  currentIndex?: number;
}

export default function DualScreen() {
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const [queue, setQueue] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create BroadcastChannel
    const channel = new BroadcastChannel('youoke-dual-sync');

    console.log('📺 Dual Screen: Listening for sync...');
    setIsConnected(true);

    // Listen for messages from main screen
    channel.onmessage = (event: MessageEvent<DualMessage>) => {
      console.log('📨 Dual Screen received:', event.data);

      const { type, videoId, queue: newQueue, currentIndex } = event.data;

      switch (type) {
        case 'PLAY':
          if (videoId) {
            setCurrentVideoId(videoId);
          }
          break;

        case 'QUEUE_UPDATE':
          if (newQueue) {
            setQueue(newQueue);
            // Auto-play first video if available
            if (newQueue.length > 0 && currentIndex !== undefined) {
              setCurrentVideoId(newQueue[currentIndex]?.videoId || '');
            }
          }
          break;

        case 'NEXT':
        case 'PREV':
          if (videoId) {
            setCurrentVideoId(videoId);
          }
          break;
      }
    };

    // Request initial state from main screen
    channel.postMessage({ type: 'REQUEST_STATE' });

    return () => {
      console.log('📺 Dual Screen: Closing channel');
      channel.close();
    };
  }, []);

  const handleNextSong = () => {
    // Next song handled by main screen
    console.log('Next song requested from dual screen');
  };

  return (
    <>
      <Head>
        <title>YouOKE - 2 หน้าจอ</title>
      </Head>

      <div className="min-h-screen bg-black">
        {/* Connection Status */}
        {isConnected && (
          <div className="fixed top-4 right-4 z-50 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">🖥️ 2 หน้าจอ - พร้อมใช้งาน</span>
            </div>
          </div>
        )}

        {/* Player */}
        {currentVideoId ? (
          <YoutubePlayer
            videoId={currentVideoId}
            nextSong={handleNextSong}
            isMoniter={true}
            className="w-full h-screen"
          />
        ) : (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🖥️</div>
              <h1 className="text-3xl font-bold mb-2">2 หน้าจอ (Dual Screen)</h1>
              <p className="text-gray-400 mb-6">
                รอข้อมูลจากหน้าจอหลัก...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Listening on BroadcastChannel</span>
              </div>
            </div>
          </div>
        )}

        {/* Queue Display */}
        {queue.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4 border-t border-gray-700">
            <div className="text-white text-sm mb-2">คิวถัดไป ({queue.length} เพลง)</div>
            <div className="flex gap-2 overflow-x-auto">
              {queue.slice(0, 5).map((video, index) => (
                <div key={index} className="flex-shrink-0 bg-gray-800 rounded p-2 w-40">
                  <div className="text-white text-xs truncate">{video.title}</div>
                  <div className="text-gray-400 text-xs truncate">{video.artist}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
