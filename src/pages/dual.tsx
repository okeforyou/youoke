/**
 * Dual Screen (2 หน้าจอ) - HDMI / DJ Mode
 *
 * Second screen that syncs with main screen using "Pure State Sync" (Store Replication)
 * NOW UNIFIED: Using the same high-end UI as Smart TV interface.
 */

import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { useShallow } from 'zustand/react/shallow';
import { useSystemConfig } from '@/hooks/useSystemConfig';

// TV Unified Components
import { SmartTVPlayer } from '../modules/tv/components/SmartTVPlayer';
import { DigitalSignage } from '../modules/tv/components/DigitalSignage';

export default function DualScreen() {
  const { config } = useSystemConfig();

  // Bind to PlayerStore (Single Source of Truth)
  const {
    currentVideo,
    queue,
    currentIndex,
    isPlaying,
    isMuted,
    notification,
    isQueueVisible,
    playNext
  } = usePlayerStore(
    useShallow(state => ({
      currentVideo: state.currentVideo,
      queue: state.queue,
      currentIndex: state.currentIndex,
      isPlaying: state.isPlaying,
      isMuted: state.isMuted,
      notification: state.notification,
      isQueueVisible: state.isQueueVisible,
      playNext: state.playNext
    }))
  );

  const [mounted, setMounted] = useState(false);

  // 1. Initial Setup
  useEffect(() => {
    setMounted(true);
    // Mark dual mode as active
    localStorage.setItem('youoke-dual-active', 'true');
    console.log('📺 Dual Screen: Connected to PlayerStore (Unified TV UI Mode)');

    const handleBeforeUnload = () => {
      localStorage.removeItem('youoke-dual-active');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      localStorage.removeItem('youoke-dual-active');
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handler for Player State (Auto-Next logic)
  const handlePlayerStateChange = (playerState: number) => {
    // 0 = Ended
    if (playerState === 0) {
      console.log('🎬 Dual: Video ended, playing next...');
      playNext();
    }
  };

  const handlePlayerError = (e: any) => {
    console.error("Dual Player Error:", e);
    // Auto-skip on error
    playNext();
  };

  if (!mounted) return null;

  // Derived State
  const isIdle = !currentVideo && queue.length === 0;
  const nextVideo = queue[currentIndex + 1] || null;

  return (
    <div className="h-screen w-screen bg-black overflow-hidden font-sans select-none cursor-none">
      <Head>
        <title>YouOKE - 2 หน้าจอ (Dual Screen)</title>
      </Head>

      {/* Layer 1: Digital Signage (Idle) */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isIdle ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
        <DigitalSignage
          roomCode="HDMI"
          images={config?.tv?.signageImages}
          messages={config?.tv?.signageMessages}
          template={config?.tv?.template}
          ads={config?.tv?.ads}
        />
      </div>

      {/* Layer 2: Smart Player (Active) */}
      <div className={`absolute inset-0 transition-opacity duration-1000 bg-black ${!isIdle ? 'opacity-100 z-20' : 'opacity-0 z-0 pointer-events-none'}`}>
        <SmartTVPlayer
          currentVideo={currentVideo}
          nextVideo={nextVideo}
          queue={queue}
          isQueueVisible={isQueueVisible}
          notification={notification}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onStateChange={handlePlayerStateChange}
          onError={handlePlayerError}
          onReady={(p) => {
            console.log("✅ Dual Unified Player Ready");
          }}
        />
      </div>
    </div>
  );
}
