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
    playNext,
    setCurrentTime,
    currentTime,
    setCurrentIndex,
    togglePlay
  } = usePlayerStore(
    useShallow(state => ({
      currentVideo: state.currentVideo,
      queue: state.queue,
      currentIndex: state.currentIndex,
      isPlaying: state.isPlaying,
      isMuted: state.isMuted,
      notification: state.notification,
      isQueueVisible: state.isQueueVisible,
      playNext: state.playNext,
      setCurrentTime: state.setCurrentTime,
      currentTime: state.currentTime,
      setCurrentIndex: state.setCurrentIndex,
      togglePlay: state.togglePlay
    }))
  );

  const [mounted, setMounted] = useState(false);
  const videoPlayerRef = useRef<any>(null);

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

  // 2. HEARTBEAT: Update Store Time (Master Mode)
  // Since this IS the active player, it must report time to the store
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(async () => {
      try {
        if (!videoPlayerRef.current) return;

        // Check Player State: Only broadcast if PLAYING (1)
        const pState = await videoPlayerRef.current.getPlayerState();
        if (pState !== 1) return;

        const time = await videoPlayerRef.current.getCurrentTime();
        if (time && time > 0) {
          // We broadcast to Main Screen so Progress bar updates.
          usePlayerStore.getState().setCurrentTime(time);
        }
      } catch (e) { }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // 3. TIME SYNC: Watch `currentTime` (for Seeking)
  useEffect(() => {
    const syncTime = async () => {
      if (!videoPlayerRef.current || !isPlaying) return;

      try {
        const playerTime = await videoPlayerRef.current.getCurrentTime();
        const diff = Math.abs(playerTime - currentTime);

        // SEEK if difference is significant (> 1s)
        // AND ignore jumps to 0 (Circuit Breaker logic)
        if (diff > 1 && currentTime > 0.1) {
          console.log(`⏩ Dual: Sync Seek ${playerTime.toFixed(1)} -> ${currentTime.toFixed(1)}`);
          videoPlayerRef.current.seekTo(currentTime, true);
        }
      } catch (e) {
        // Ignore errors during loading
      }
    };
    syncTime();
  }, [currentTime, isPlaying]);

  // Handler for Player State (Auto-Next logic)
  const handlePlayerStateChange = (playerState: number) => {
    // 0 = Ended, 1 = Playing, 2 = Paused
    if (playerState === 0) {
      console.log('🎬 Dual: Video ended, playing next...');
      playNext();
    }
    if (playerState === 1 && !isPlaying) togglePlay();
    if (playerState === 2 && isPlaying) togglePlay();
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
          currentVideo={currentVideo as any}
          nextVideo={nextVideo as any}
          queue={queue as any}
          isQueueVisible={isQueueVisible}
          notification={notification}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onStateChange={handlePlayerStateChange}
          onError={handlePlayerError}
          onPlay={setCurrentIndex}
          onReady={(p) => {
            console.log("✅ Dual Unified Player Ready");
            videoPlayerRef.current = p;
          }}
        />
      </div>
    </div>
  );
}
