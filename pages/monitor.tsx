/**
 * Monitor (TV Display) - Command Pattern Version
 *
 * Responsibilities:
 * 1. Execute commands from Remote
 * 2. Update state in Firebase
 * 3. Control YouTube player
 * 4. Display current video and queue
 */

import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { ref, onValue, off, set, update } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import { realtimeDb, auth } from '../firebase';
import { useCommandExecutor } from '../hooks/useCommandExecutor';
import { CastState } from '../types/castCommands';

const Monitor = () => {
  const router = useRouter();
  const { room: roomCodeParam } = router.query;

  // State
  const [roomCode, setRoomCode] = useState<string>('');
  const [state, setState] = useState<CastState>({
    queue: [],
    currentIndex: 0,
    currentVideo: null,
    controls: { isPlaying: false, isMuted: true },
  });
  const [isConnected, setIsConnected] = useState(false);
  const [playerRef, setPlayerRef] = useState<YouTubePlayer | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isQueueEmpty, setIsQueueEmpty] = useState(false);
  const lastLoadedVideoIdRef = useRef<string | null>(null);
  const initialVideoIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Anonymous login
  // NOTE: Required for Firebase Realtime Database access
  // Monitor needs to authenticate to create/manage rooms
  useEffect(() => {
    const loginAnonymously = async () => {
      try {
        await signInAnonymously(auth);
        console.log('✅ Monitor signed in anonymously');
        setIsAuthReady(true);
      } catch (error) {
        console.error('❌ Anonymous sign-in failed:', error);
      }
    };
    loginAnonymously();
  }, []);

  // Generate room code
  useEffect(() => {
    if (roomCodeParam && typeof roomCodeParam === 'string') {
      setRoomCode(roomCodeParam);
    } else {
      const newCode = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      setRoomCode(newCode);
      console.log('🎲 Generated room code:', newCode);
    }
  }, [roomCodeParam]);

  // Initialize room
  useEffect(() => {
    if (!roomCode || !realtimeDb || !isAuthReady) return;

    console.log('📺 Monitoring room:', roomCode);
    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

    // Create room if doesn't exist
    // Create room in Firebase Realtime Database
    // IMPORTANT: Requires NEXT_PUBLIC_FIREBASE_DATABASE_URL to be set correctly
    // See: FIREBASE-CAST-TROUBLESHOOTING.md
    const initializeRoom = async () => {
      try {
        // Use flat structure (same as old working version)
        await set(roomRef, {
          hostId: 'monitor',
          isHost: true,
          queue: [],
          currentIndex: 0,
          currentVideo: null,
          controls: { isPlaying: false },  // Remove isMuted - same as old version
          createdAt: Date.now()
        });
        console.log('✅ Room created:', roomCode);
      } catch (error) {
        console.error('❌ Error creating room:', error);
      }
    };

    initializeRoom();

    // Listen to room changes (flat structure, not nested in state)
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('📦 Room data updated:', data);
        // Map flat structure to state
        const newState: CastState = {
          queue: data.queue || [],
          currentIndex: data.currentIndex || 0,
          currentVideo: data.currentVideo || null,
          controls: data.controls || { isPlaying: false }
        };
        setState(newState);
        setIsConnected(
          (newState.queue && newState.queue.length > 0) || newState.currentVideo !== null
        );
      }
    });

    return () => {
      off(roomRef);
      unsubscribe();
    };
  }, [roomCode, isAuthReady]);

  // State change handler for CommandExecutor
  const handleStateChange = useCallback(
    (newState: Partial<CastState>) => {
      setState((prev) => ({ ...prev, ...newState }));
    },
    []
  );

  // Command Executor
  useCommandExecutor({
    roomCode,
    playerRef,
    currentState: state,
    onStateChange: handleStateChange,
  });

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('❌ Fullscreen toggle failed:', error);
    }
  };

  // YouTube player ready
  const onPlayerReady = async (event: { target: YouTubePlayer }) => {
    setPlayerRef(event.target);
    console.log('🎬 Player ready');

    // Only mute on first load (before user unlocks audio)
    // After unlock, keep audio unmuted even if component remounts
    if (!audioUnlocked) {
      try {
        await event.target.mute();
        console.log('🔇 Player muted (waiting for user unlock)');
      } catch (error) {
        console.error('❌ Mute failed:', error);
      }
    } else {
      // Audio already unlocked, keep unmuted
      console.log('🔊 Audio unlocked, keeping sound on');
      try {
        await event.target.unMute();
      } catch (error) {
        console.error('❌ Unmute failed:', error);
      }
    }

    // Auto-play if there's a current video
    if (state.currentVideo && state.controls.isPlaying) {
      try {
        await event.target.playVideo();
        console.log('▶️ Auto-playing video');
      } catch (error) {
        console.error('❌ Auto-play failed:', error);
      }
    }
  };

  // Load video when currentVideo changes
  useEffect(() => {
    if (!playerRef || !state.currentVideo) return;

    const currentVideoId = state.currentVideo.videoId;

    // Skip if already loaded
    if (lastLoadedVideoIdRef.current === currentVideoId) {
      console.log('⏭️ Video already loaded:', currentVideoId);
      return;
    }

    const loadVideo = async () => {
      try {
        // Check player state
        const playerState = await playerRef.getPlayerState();
        if (playerState === -1) {
          console.log('⏳ Player not ready, waiting...');
          return;
        }

        console.log('🎵 Loading video:', state.currentVideo?.title);
        lastLoadedVideoIdRef.current = currentVideoId;

        // No need to mute - keep user's volume preference
        // Mute only happens once on player ready before unlock overlay

        if (state.controls.isPlaying) {
          await playerRef.loadVideoById({
            videoId: currentVideoId,
            startSeconds: 0,
          });
          console.log('▶️ Playing:', state.currentVideo?.title);
        } else {
          await playerRef.cueVideoById(currentVideoId);
          console.log('⏸️ Cued:', state.currentVideo?.title);
        }
      } catch (error) {
        console.error('❌ Load video failed:', error);
      }
    };

    loadVideo();
  }, [playerRef, state.currentVideo?.videoId, state.controls.isPlaying]);

  // NOTE: Mute state is handled by Command Executor
  // No need to sync mute here to avoid conflicts with browser autoplay policy

  // Sync play/pause state
  useEffect(() => {
    if (!playerRef || !state.currentVideo) return;

    const syncPlayPause = async () => {
      try {
        const playerState = await playerRef.getPlayerState();
        if (playerState === -1) return;

        if (state.controls.isPlaying && playerState !== 1) {
          await playerRef.playVideo();
        } else if (!state.controls.isPlaying && playerState === 1) {
          await playerRef.pauseVideo();
        }
      } catch (error) {
        console.error('❌ Play/Pause sync failed:', error);
      }
    };

    syncPlayPause();
  }, [playerRef, state.controls.isPlaying, state.currentVideo]);

  // Reset empty state when new songs added to queue
  useEffect(() => {
    const hasUpcomingSongs = state.queue && state.currentIndex + 1 < state.queue.length;
    if (hasUpcomingSongs && isQueueEmpty) {
      console.log('🎵 New songs added, hiding empty state');
      setIsQueueEmpty(false);
    }
  }, [state.queue?.length, state.currentIndex, isQueueEmpty]);

  // Queue visibility
  useEffect(() => {
    if (!playerRef || !state.controls.isPlaying) {
      setShowQueue(true);
      return;
    }

    const checkTime = setInterval(async () => {
      try {
        const currentTime = await playerRef.getCurrentTime();
        const duration = await playerRef.getDuration();
        const remaining = duration - currentTime;

        const showAtStart = currentTime < 15;
        const showAtEnd = remaining < 60;

        setShowQueue(showAtStart || showAtEnd);
      } catch (error) {
        // Ignore
      }
    }, 1000);

    return () => clearInterval(checkTime);
  }, [playerRef, state.controls.isPlaying]);

  // Player state change
  const onPlayerStateChange = async (event: { data: number }) => {
    if (event.data === 0 && state.currentVideo) {
      // Video ended - play next
      console.log('🎬 Video ended');
      const nextIndex = state.currentIndex + 1;
      if (state.queue && nextIndex < state.queue.length) {
        setIsQueueEmpty(false);
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        try {
          // Update flat structure (no state/ prefix)
          await update(roomRef, {
            currentIndex: nextIndex,
            currentVideo: state.queue[nextIndex],
            'controls/isPlaying': true,
          });
        } catch (error) {
          console.error('❌ Auto-next failed:', error);
        }
      } else {
        // No more songs in queue
        console.log('📭 Queue is empty');
        setIsQueueEmpty(true);
      }
    } else if (event.data === 1) {
      console.log('▶️ Playing');
    } else if (event.data === 2) {
      console.log('⏸️ Paused');
    }
  };

  const onPlayerError = (event: { data: number }) => {
    console.error('❌ Player error:', event.data);
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1 as const,
      controls: 1 as const,
      modestbranding: 1 as const,
      rel: 0 as const,
      fs: 0 as const, // Disable YouTube's fullscreen button (we'll use our own)
    },
  };

  // Show loading
  if (!roomCode) {
    return (
      <div className="relative h-screen bg-black text-white">
        <div className="absolute text-center inset-0 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold mb-4">YouOke TV</h1>
          <p className="text-2xl text-gray-400">กำลังเริ่มต้น...</p>
        </div>
      </div>
    );
  }

  // Show waiting for connection
  if (!isConnected) {
    // Generate Cast URL for QR Code
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'https://youoke.vercel.app';
    const castUrl = `${baseUrl}/?castRoom=${roomCode}`;

    return (
      <div className="relative h-screen bg-black text-white">
        <div className="absolute text-center inset-0 flex flex-col items-center justify-center p-8">
          <h1 className="text-6xl font-bold mb-8">YouOke TV</h1>

          {/* QR Code + Room Number */}
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-center mb-8">
            {/* QR Code */}
            <div className="bg-white p-6 rounded-2xl shadow-2xl">
              <QRCodeSVG
                value={castUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Room Number */}
            <div className="bg-primary/20 border-4 border-primary rounded-2xl px-12 py-8">
              <p className="text-2xl text-gray-300 mb-2">เลขห้อง</p>
              <p className="text-8xl font-bold tracking-widest text-primary">
                {roomCode}
              </p>
            </div>
          </div>

          <div className="space-y-3 max-w-2xl">
            <p className="text-2xl text-gray-300 mb-4">📱 วิธีใช้งาน:</p>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Method 1: QR Code */}
              <div className="text-left bg-primary/10 rounded-lg p-4 border-2 border-primary/30">
                <p className="text-xl font-bold text-primary mb-3">วิธีที่ 1: Scan QR Code</p>
                <div className="space-y-2 text-base">
                  <p>1. เปิดกล้องบนมือถือ</p>
                  <p>2. Scan QR Code</p>
                  <p>3. เชื่อมต่ออัตโนมัติ! 🎉</p>
                </div>
              </div>

              {/* Method 2: Manual */}
              <div className="text-left bg-base-200/10 rounded-lg p-4">
                <p className="text-xl font-bold text-gray-300 mb-3">วิธีที่ 2: กรอกเลขห้อง</p>
                <div className="space-y-2 text-base">
                  <p>1. เปิด youoke.vercel.app</p>
                  <p>2. กดปุ่ม &quot;Cast to TV&quot;</p>
                  <p>3. กรอกเลขห้อง <span className="text-primary font-bold">{roomCode}</span></p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xl text-gray-500 mt-8 animate-pulse">
            รอเชื่อมต่อจากมือถือ...
          </p>

          {/* Debug Panel */}
          <div className="fixed bottom-4 left-4 bg-gray-900/80 text-xs text-gray-300 p-3 rounded-lg border border-gray-700 max-w-md">
            <p className="font-bold text-yellow-400 mb-2">🔍 Debug Info:</p>
            <div className="space-y-1 font-mono">
              <p>DATABASE_URL: {process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ? '✅ SET' : '❌ MISSING'}</p>
              <p className="text-[10px] break-all">
                {process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'Not configured'}
              </p>
              <p>PROJECT_ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ MISSING'}</p>
              <p>API_KEY: {process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY ? '✅ SET' : '❌ MISSING'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Set initial video ID (only once, never change it to prevent remount)
  if (state.currentVideo && !initialVideoIdRef.current) {
    initialVideoIdRef.current = state.currentVideo.videoId;
  }

  // Show player
  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col">
      <div ref={containerRef} className="flex-1 relative">
        {initialVideoIdRef.current ? (
          <YouTube
            videoId={initialVideoIdRef.current}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            onError={onPlayerError}
            className="w-full h-full"
          />
        ) : state.currentVideo ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-4">YouOke TV</h1>
              <p className="text-3xl mb-6">เลขห้อง: {roomCode}</p>
              <p className="text-2xl text-gray-400">กำลังโหลดเพลง...</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-4">YouOke TV</h1>
              <p className="text-3xl mb-6">เลขห้อง: {roomCode}</p>
              <p className="text-2xl text-gray-400">เชื่อมต่อแล้ว ✅</p>
              <p className="text-xl text-gray-500 mt-4">
                เพิ่มเพลงจากมือถือเพื่อเริ่มเล่น
              </p>
            </div>
          </div>
        )}

        {/* Audio Unlock Overlay - Show first time only */}
        {state.currentVideo && !audioUnlocked && (
        <div
          className="absolute inset-0 bg-black/95 flex items-center justify-center cursor-pointer z-50 backdrop-blur-sm"
          onClick={async () => {
            if (playerRef) {
              try {
                await playerRef.playVideo();
                await playerRef.unMute();
                setAudioUnlocked(true);
                console.log('🔓 Audio unlocked by user interaction');
              } catch (error) {
                // If unmute fails, still unlock and let user use YouTube controls
                setAudioUnlocked(true);
                console.log('🔓 Audio unlocked (mute control via YouTube)');
              }
            }
          }}
        >
          <div className="text-center animate-pulse">
            <div className="mb-6">
              <div className="text-8xl mb-4">🎤</div>
              <h2 className="text-5xl font-bold mb-4">กดที่นี่เพื่อเริ่มเล่น</h2>
              <p className="text-2xl text-gray-400">คลิกเพื่อเปิดเสียงและเริ่มต้นระบบ</p>
            </div>
            <div className="mt-8 text-sm text-gray-500">
              <p>ควบคุมระดับเสียงได้ที่ปุ่มด้านล่างวิดีโอ</p>
            </div>
          </div>
        </div>
        )}

        {/* Empty Queue State */}
        {isQueueEmpty && audioUnlocked && roomCode && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-40">
          <div className="text-center">

            {/* Icon with pulse animation */}
            <div className="mb-8 animate-pulse">
              <div className="text-9xl mb-4">🎤</div>
            </div>

            {/* Main Message */}
            <h2 className="text-6xl font-bold mb-4 text-white">
              ไม่มีเพลงในคิว
            </h2>

            {/* Subtitle */}
            <p className="text-3xl text-gray-400 mb-8">
              เพิ่มเพลงจากมือถือเพื่อเล่นต่อ
            </p>

            {/* Room Code */}
            <div className="bg-primary/20 border-2 border-primary rounded-xl px-8 py-4 inline-block">
              <p className="text-xl text-gray-300 mb-1">เลขห้อง</p>
              <p className="text-5xl font-bold tracking-widest text-primary">
                {roomCode}
              </p>
            </div>

            {/* Song count */}
            {state?.currentIndex > 0 && (
              <p className="text-lg text-gray-500 mt-8">
                เล่นไปแล้ว {state.currentIndex} เพลง
              </p>
            )}
          </div>
        </div>
        )}

        {/* Fullscreen Button */}
        {state.currentVideo && audioUnlocked && (
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-6 right-6 bg-black/80 hover:bg-black/90 backdrop-blur-md rounded-lg p-3 transition-all hover:scale-110 z-50 border border-white/20"
          title={isFullscreen ? "ออกจาก Fullscreen" : "เข้าสู่ Fullscreen"}
        >
          {isFullscreen ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
        )}

        {/* Queue Display */}
        {showQueue && state.queue && state.queue.length > state.currentIndex + 1 && (
        <div className="absolute top-6 right-6 w-80 bg-black/90 backdrop-blur-md rounded-xl shadow-2xl border border-primary/30 p-5 z-40">
          <div className="mb-4 pb-3 border-b border-primary/30">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <span>🎵</span>
              <span>เพลงถัดไป</span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {state.queue
              .slice(state.currentIndex + 1, state.currentIndex + 6)
              .map((video, idx) => (
                <div
                  key={video.key}
                  className="flex items-start gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3"
                >
                  <div className="flex-shrink-0 w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {video.title}
                    </p>
                    {video.author && (
                      <p className="text-xs text-gray-400 truncate">
                        {video.author}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {state.queue && state.queue.length > state.currentIndex + 6 && (
            <div className="mt-3 pt-3 border-t border-white/10 text-center">
              <p className="text-xs text-gray-400">
                + อีก {state.queue.length - state.currentIndex - 6} เพลง
              </p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default Monitor;
