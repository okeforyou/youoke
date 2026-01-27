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
  const lastLoadedVideoIdRef = useRef<string | null>(null);

  // Anonymous login
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
    const initializeRoom = async () => {
      try {
        await set(roomRef, {
          hostId: 'monitor',
          isHost: true,
          state: {
            queue: [],
            currentIndex: 0,
            currentVideo: null,
            controls: { isPlaying: false, isMuted: true },
          },
          commands: {},
          createdAt: Date.now(),
        });
        console.log('✅ Room created:', roomCode);
      } catch (error) {
        console.error('❌ Error creating room:', error);
      }
    };

    initializeRoom();

    // Listen to state changes
    const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const newState = snapshot.val() as CastState | null;
      if (newState) {
        console.log('📦 State updated:', newState);
        setState(newState);
        setIsConnected(
          newState.queue.length > 0 || newState.currentVideo !== null
        );
      }
    });

    return () => {
      off(stateRef);
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

  // YouTube player ready
  const onPlayerReady = async (event: { target: YouTubePlayer }) => {
    setPlayerRef(event.target);
    console.log('🎬 Player ready');

    // Mute initially
    try {
      await event.target.mute();
      console.log('🔇 Player muted');
    } catch (error) {
      console.error('❌ Mute failed:', error);
    }

    // Auto-play if there's a current video
    if (state.currentVideo && state.controls.isPlaying) {
      try {
        await event.target.playVideo();
        console.log('▶️ Auto-playing first video');
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

        // Always mute before loading
        await playerRef.mute();

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

  // Sync mute state
  useEffect(() => {
    if (!playerRef) return;

    const syncMute = async () => {
      try {
        const playerState = await playerRef.getPlayerState();
        if (playerState === -1) return;

        if (state.controls.isMuted) {
          await playerRef.mute();
          console.log('🔇 Muted');
        } else {
          await playerRef.unMute();
          console.log('🔊 Unmuted');
        }
      } catch (error) {
        console.error('❌ Mute sync failed:', error);
      }
    };

    syncMute();
  }, [playerRef, state.controls.isMuted]);

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
      if (nextIndex < state.queue.length) {
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        try {
          await update(roomRef, {
            'state/currentIndex': nextIndex,
            'state/currentVideo': state.queue[nextIndex],
            'state/controls/isPlaying': true,
          });
        } catch (error) {
          console.error('❌ Auto-next failed:', error);
        }
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
    return (
      <div className="relative h-screen bg-black text-white">
        <div className="absolute text-center inset-0 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold mb-8">YouOke TV</h1>

          <div className="bg-primary/20 border-4 border-primary rounded-2xl px-12 py-8 mb-8">
            <p className="text-2xl text-gray-300 mb-2">เลขห้อง</p>
            <p className="text-8xl font-bold tracking-widest text-primary">
              {roomCode}
            </p>
          </div>

          <div className="space-y-3 max-w-xl">
            <p className="text-2xl text-gray-300">📱 วิธีใช้งาน:</p>
            <div className="text-left bg-base-200/10 rounded-lg p-4 space-y-2">
              <p className="text-lg">1. เปิด youoke.vercel.app บนมือถือ</p>
              <p className="text-lg">2. กดปุ่ม &quot;Cast to TV&quot;</p>
              <p className="text-lg">3. กรอกเลขห้อง <span className="text-primary font-bold">{roomCode}</span></p>
              <p className="text-lg">4. เพิ่มเพลงแล้วร้องได้เลย! 🎤</p>
            </div>
          </div>

          <p className="text-xl text-gray-500 mt-8 animate-pulse">
            รอเชื่อมต่อจากมือถือ...
          </p>
        </div>
      </div>
    );
  }

  // Show player
  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col">
      <div className="flex-1 relative">
        {state.currentVideo ? (
          <YouTube
            videoId={state.currentVideo.videoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            onError={onPlayerError}
            className="w-full h-full"
          />
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
      </div>

      {/* Queue Display */}
      {showQueue && state.queue.length > state.currentIndex + 1 && (
        <div className="absolute top-6 right-6 w-80 bg-black/90 backdrop-blur-md rounded-xl shadow-2xl border border-primary/30 p-5">
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

          {state.queue.length > state.currentIndex + 6 && (
            <div className="mt-3 pt-3 border-t border-white/10 text-center">
              <p className="text-xs text-gray-400">
                + อีก {state.queue.length - state.currentIndex - 6} เพลง
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Monitor;
