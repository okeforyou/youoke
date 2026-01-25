/**
 * Dual Screen (2 หน้าจอ) - DJ Mode
 *
 * Second screen that syncs with main screen using BroadcastChannel
 * - No room code needed (no Firebase)
 * - Instant sync (same device)
 * - Beautiful UI like Web Monitor Cast
 */

import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import YouTube, { YouTubePlayer } from 'react-youtube';
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
} from '@heroicons/react/24/outline';

interface QueueVideo {
  videoId: string;
  title: string;
  author?: string;
  key: number;
}

interface DualMessage {
  type: 'PLAY' | 'PAUSE' | 'NEXT' | 'PREV' | 'QUEUE_UPDATE' | 'MUTE' | 'UNMUTE' | 'REQUEST_STATE';
  videoId?: string;
  queue?: QueueVideo[];
  currentIndex?: number;
  isPlaying?: boolean;
  isMuted?: boolean;
}

export default function DualScreen() {
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const [queue, setQueue] = useState<QueueVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showQueue, setShowQueue] = useState(true);
  const [forceShowQueue, setForceShowQueue] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lastQueueLengthRef = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Listen to BroadcastChannel messages from main screen
  useEffect(() => {
    // Mark dual mode as active
    localStorage.setItem('youoke-dual-active', 'true');

    // Create BroadcastChannel
    const channel = new BroadcastChannel('youoke-dual-sync');
    channelRef.current = channel;

    console.log('📺 Dual Screen: Listening for sync...');
    setIsConnected(true);

    // Listen for messages from main screen
    channel.onmessage = (event: MessageEvent<DualMessage>) => {
      console.log('📨 Dual Screen received:', event.data);

      const { type, videoId, queue: newQueue, currentIndex: newIndex, isPlaying: newIsPlaying, isMuted: newIsMuted } = event.data;

      switch (type) {
        case 'PLAY':
          if (videoId) {
            setCurrentVideoId(videoId);
          }
          setIsPlaying(true);
          if (player) player.playVideo();
          break;

        case 'PAUSE':
          setIsPlaying(false);
          if (player) player.pauseVideo();
          break;

        case 'QUEUE_UPDATE':
          if (newQueue) {
            setQueue(newQueue);
          }
          if (videoId) {
            setCurrentVideoId(videoId);
          }
          if (typeof newIndex === 'number') {
            setCurrentIndex(newIndex);
          }
          if (typeof newIsPlaying === 'boolean') {
            setIsPlaying(newIsPlaying);
          }
          break;

        case 'NEXT':
        case 'PREV':
          if (videoId) {
            setCurrentVideoId(videoId);
          }
          if (typeof newIndex === 'number') {
            setCurrentIndex(newIndex);
          }
          break;

        case 'MUTE':
          setIsMuted(true);
          if (player) {
            player.mute();
          }
          break;

        case 'UNMUTE':
          setIsMuted(false);
          if (player) {
            player.unMute();
          }
          break;
      }
    };

    // Request initial state from main screen
    channel.postMessage({ type: 'REQUEST_STATE' });

    // Clean up when window closes
    const handleBeforeUnload = () => {
      console.log('📺 Dual Screen: Window closing, clearing dual mode');
      localStorage.removeItem('youoke-dual-active');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('📺 Dual Screen: Closing channel');
      localStorage.removeItem('youoke-dual-active');
      channel.close();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [player]);

  // Temporarily show queue when songs are added or removed
  useEffect(() => {
    const currentLength = queue.length;
    const previousLength = lastQueueLengthRef.current;

    if (currentLength !== previousLength && previousLength !== 0) {
      if (currentLength > previousLength) {
        console.log('📋 New song added - forcing queue display for 20 seconds');
      } else {
        console.log('📋 Song removed - forcing queue display for 20 seconds');
      }

      setForceShowQueue(true);
      setShowQueue(true);

      const timer = setTimeout(() => {
        console.log('📋 Returning to normal queue visibility');
        setForceShowQueue(false);
      }, 5000);

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
        const currentTime = await player.getCurrentTime();
        const duration = await player.getDuration();

        // Only calculate logic if duration is valid and positive
        if (duration > 0) {
          const remaining = duration - currentTime;

          const showAtStart = currentTime < 15;
          const showAtEnd = remaining < 60;

          setShowQueue(forceShowQueue || showAtStart || showAtEnd);
        } else {
          // Fallback for loading state - show queue only if forced
          setShowQueue(forceShowQueue);
        }
      } catch (error) {
        console.error('❌ Queue visibility check error:', error);
      }
    }, 1000);

    return () => clearInterval(checkTime);
  }, [player, isPlaying, forceShowQueue]);

  // Mouse movement tracking for auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Control handlers - Send messages to main screen
  const handlePlayPause = () => {
    if (!channelRef.current) return;

    if (isPlaying) {
      channelRef.current.postMessage({ type: 'PAUSE' });
      setIsPlaying(false);
      if (player) {
        player.pauseVideo();
      }
      console.log('⏸️ Dual: Manual pause');
    } else {
      channelRef.current.postMessage({ type: 'PLAY' });
      setIsPlaying(true);
      if (player) {
        player.playVideo();
      }
      console.log('▶️ Dual: Manual play');
    }
  };

  const handleNext = () => {
    if (!channelRef.current || currentIndex >= queue.length - 1) {
      console.log('🏁 Dual: No next song');
      return;
    }

    channelRef.current.postMessage({ type: 'NEXT' });
    console.log('⏭️ Dual: Manual next');
  };

  const handlePrevious = () => {
    if (!channelRef.current || currentIndex <= 0) {
      console.log('🏁 Dual: No previous song');
      return;
    }

    channelRef.current.postMessage({ type: 'PREV' });
    console.log('⏮️ Dual: Manual previous');
  };

  const handleToggleMute = async () => {
    if (!player) return;

    try {
      if (isMuted) {
        await player.unMute();
        setIsMuted(false);
        if (channelRef.current) {
          channelRef.current.postMessage({ type: 'UNMUTE' });
        }
        console.log('🔊 Dual: Unmuted');
      } else {
        await player.mute();
        setIsMuted(true);
        if (channelRef.current) {
          channelRef.current.postMessage({ type: 'MUTE' });
        }
        console.log('🔇 Dual: Muted');
      }
    } catch (error) {
      console.error('❌ Dual: Toggle mute failed:', error);
    }
  };

  const handleToggleFullscreen = async () => {
    if (!playerContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await playerContainerRef.current.requestFullscreen();
        console.log('📺 Dual: Enter fullscreen');
      } else {
        await document.exitFullscreen();
        console.log('📺 Dual: Exit fullscreen');
      }
    } catch (error) {
      console.error('❌ Dual: Fullscreen toggle failed:', error);
    }
  };

  // YouTube Player handlers
  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    console.log('✅ Dual: YouTube player ready');
    setPlayer(event.target);
    // Start UNMUTED as requested
    event.target.unMute();
    setIsMuted(false);
  };

  const onPlayerStateChange = async (event: { data: number }) => {
    if (event.data === 1) {
      console.log('▶️ Dual: Video playing');
      setIsPlaying(true);
    } else if (event.data === 2) {
      console.log('⏸️ Dual: Video paused');
      setIsPlaying(false);
    } else if (event.data === 0) {
      console.log('🎬 Dual: Video ended');
      setIsPlaying(false);
      // Robustness: Request next song from main screen (in case main screen is throttled)
      if (channelRef.current) {
        console.log('⏭️ Dual: requesting NEXT song');
        channelRef.current.postMessage({ type: 'NEXT' });
      }
    }
  };

  const onPlayerError = (event: { data: number }) => {
    console.error('❌ Dual: Player error:', event.data);
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1 as 1,
      controls: 1 as 1,
      modestbranding: 1 as 1,
      rel: 0 as 0,
      disablekb: 1 as 1,
    },
  };

  // Get current video from queue
  const currentVideo = queue[currentIndex];

  return (
    <>
      <Head>
        <title>YouOKE - 2 หน้าจอ (Dual Screen)</title>
      </Head>

      {/* Waiting for connection screen */}
      {!currentVideoId ? (
        <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
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
      ) : (
        /* Main player screen */
        <div className="h-screen w-screen bg-black text-white flex flex-col">
          <div ref={playerContainerRef} className="flex-1 relative">
            {/* YouTube Player */}
            <YouTube
              videoId={currentVideoId}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              onError={onPlayerError}
              className="w-full h-full"
            />

            {/* Mini Control Player REMOVED - Using Native YouTube Controls as requested */}

            {/* Queue Display - Right Side Vertical */}
            {queue.length > 0 && showQueue && (
              <div className="absolute top-0 right-0 h-full w-80 lg:w-96 z-50 bg-gradient-to-l from-black/90 via-black/80 to-transparent backdrop-blur-md p-6 overflow-y-auto transition-all duration-500">
                <div className="space-y-6">
                  {/* Now Playing */}
                  {currentVideo && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">กำลังเล่น</p>
                      <div className="bg-primary/20 border border-primary/30 rounded-xl p-4">
                        <h2 className="text-lg font-bold mb-1 line-clamp-2">
                          {currentVideo.title}
                        </h2>
                        {currentVideo.author && (
                          <p className="text-sm text-gray-300 truncate">{currentVideo.author}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Next in Queue */}
                  {queue.length > currentIndex + 1 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <MusicalNoteIcon className="w-5 h-5" />
                        <span>คิวถัดไป</span>
                        <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">
                          {queue.length - currentIndex - 1} เพลง
                        </span>
                      </p>
                      <div className="space-y-2">
                        {queue
                          .slice(currentIndex + 1, currentIndex + 8)
                          .map((video, index) => (
                            <div
                              key={video.key}
                              className="bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                                  <span className="text-primary font-bold text-xs">
                                    {index + 1}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm line-clamp-2 mb-0.5">
                                    {video.title}
                                  </p>
                                  {video.author && (
                                    <p className="text-xs text-gray-400 truncate">
                                      {video.author}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* More songs indicator */}
                      {queue.length > currentIndex + 9 && (
                        <div className="mt-3 text-center">
                          <p className="text-xs text-gray-400">
                            + อีก {queue.length - currentIndex - 9} เพลง
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
