import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { ref, onValue, off, set, update } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../firebase';

interface QueueVideo {
  videoId: string;
  title: string;
  author?: string;
  key: number;
}

interface RoomData {
  queue: QueueVideo[];
  currentIndex: number;
  currentVideo: QueueVideo | null;
  controls: {
    isPlaying: boolean;
    isMuted?: boolean;
  };
}

const Monitor = () => {
  const router = useRouter();
  const { room: roomCodeParam } = router.query;

  // Generate random room code if not provided
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerRef, setPlayerRef] = useState<YouTubePlayer | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialVideoId, setInitialVideoId] = useState<string | null>(null);
  const lastLoadedVideoIdRef = useRef<string | null>(null);

  // Anonymous login for monitor
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

  // Generate room code on mount if not provided in URL
  useEffect(() => {
    if (roomCodeParam && typeof roomCodeParam === 'string') {
      setRoomCode(roomCodeParam);
    } else {
      // Generate random 4-digit code (0000-9999)
      const generateRoomCode = () => {
        const randomNum = Math.floor(Math.random() * 10000);
        return randomNum.toString().padStart(4, '0');
      };
      const newCode = generateRoomCode();
      setRoomCode(newCode);
      console.log('🎲 Generated room code:', newCode);
    }
  }, [roomCodeParam]);

  // Auto-create room and listen to room data
  useEffect(() => {
    if (!roomCode || !realtimeDb || !isAuthReady) return;

    console.log('Monitoring room:', roomCode);
    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

    // Create room if it doesn't exist
    const initializeRoom = async () => {
      try {
        await set(roomRef, {
          hostId: 'monitor',
          isHost: true,
          queue: [],
          currentIndex: 0,
          currentVideo: null,
          controls: { isPlaying: false },
          createdAt: Date.now(),
        });
        console.log('✅ Room created:', roomCode);
      } catch (error) {
        console.error('❌ Error creating room:', error);
      }
    };

    // Initialize room first
    initializeRoom();

    // Then listen to changes
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        console.log('Room not found');
        setIsConnected(false);
        setRoomData(null);
        return;
      }

      console.log('📦 Room data received:', data);
      console.log('🎵 Queue:', data.queue);
      console.log('🎬 Current video:', data.currentVideo);
      console.log('📍 Current index:', data.currentIndex);

      // Check if anyone has joined by checking if there's any content
      const hasQueue = data.queue && data.queue.length > 0;
      const hasCurrentVideo = data.currentVideo !== null && data.currentVideo !== undefined;
      const hasContent = hasQueue || hasCurrentVideo;

      console.log('✅ Has content (queue or video):', hasContent);
      setIsConnected(hasContent);
      setRoomData({
        queue: data.queue || [],
        currentIndex: data.currentIndex || 0,
        currentVideo: data.currentVideo || null,
        controls: data.controls || { isPlaying: false },
      });
    });

    return () => {
      off(roomRef);
      unsubscribe();
    };
  }, [roomCode, isAuthReady]);

  // Handle player ready
  const onPlayerReady = async (event: { target: YouTubePlayer }) => {
    setPlayerRef(event.target);
    console.log('🎬 Player ready');

    // Mute player initially (will be controlled by Remote)
    try {
      await event.target.mute();
      console.log('🔇 Player muted and ready');
    } catch (error) {
      console.error('❌ Mute failed:', error);
    }
  };

  // Sync mute state from Remote
  useEffect(() => {
    if (!playerRef || !roomData?.controls) return;

    const shouldMute = roomData.controls.isMuted !== false; // Default to muted

    const syncMute = async () => {
      try {
        if (shouldMute) {
          await playerRef.mute();
          console.log('🔇 Muted from Remote');
        } else {
          await playerRef.unMute();
          console.log('🔊 Unmuted from Remote');
        }
      } catch (error) {
        console.error('❌ Mute/Unmute failed:', error);
      }
    };

    syncMute();
  }, [playerRef, roomData?.controls?.isMuted]);

  // Load and play new video when currentVideo changes
  useEffect(() => {
    if (!playerRef || !roomData?.currentVideo) {
      return;
    }

    const currentVideoId = roomData.currentVideo.videoId;

    // Set initial video ID on first video
    if (!initialVideoId) {
      console.log('🎬 Setting initial video:', currentVideoId);
      setInitialVideoId(currentVideoId);
    }

    // Skip if this video is already loaded
    if (lastLoadedVideoIdRef.current === currentVideoId) {
      console.log('⏭️ Same video, skipping load:', currentVideoId);
      return;
    }

    const loadAndPlay = async () => {
      try {
        console.log('🎵 Loading new video:', roomData.currentVideo.title);
        lastLoadedVideoIdRef.current = currentVideoId;

        // Mute before loading to ensure autoplay works
        await playerRef.mute();

        // Always auto-play when video changes (default to isPlaying if undefined)
        const shouldPlay = roomData.controls?.isPlaying !== false;

        if (shouldPlay) {
          // loadVideoById auto-plays by default
          await playerRef.loadVideoById({
            videoId: currentVideoId,
            startSeconds: 0
          });
          console.log('▶️ Loading and auto-playing (muted)');
        } else {
          // Use cueVideoById only if explicitly paused
          await playerRef.cueVideoById(currentVideoId);
          console.log('⏸️ Video cued (paused)');
        }
      } catch (error) {
        console.error('❌ Failed to load video:', error);
      }
    };

    loadAndPlay();
  }, [playerRef, roomData?.currentVideo?.key, initialVideoId]);

  // Check remaining time and show/hide queue
  useEffect(() => {
    if (!playerRef || !isPlaying) {
      setShowQueue(true); // Show queue when not playing
      return;
    }

    const checkTime = setInterval(async () => {
      try {
        const currentTime = await playerRef.getCurrentTime();
        const duration = await playerRef.getDuration();
        const remaining = duration - currentTime;

        // Show queue at the beginning (first 15s) OR near the end (last 60s)
        const showAtStart = currentTime < 15;
        const showAtEnd = remaining < 60;

        // Debug log every 10 seconds
        if (Math.floor(currentTime) % 10 === 0) {
          console.log(`⏱️ Time: ${Math.floor(currentTime)}s / ${Math.floor(duration)}s, Remaining: ${Math.floor(remaining)}s, Queue: ${showQueue}`);
        }

        if (showAtStart || showAtEnd) {
          if (!showQueue) {
            console.log(`📋 Showing queue (${showAtStart ? 'start' : 'ending soon'}) - Remaining: ${Math.floor(remaining)}s`);
            setShowQueue(true);
          }
        } else {
          if (showQueue) {
            console.log('📋 Hiding queue (middle of song)');
            setShowQueue(false);
          }
        }
      } catch (error) {
        console.error('❌ Queue check error:', error);
      }
    }, 1000);

    return () => clearInterval(checkTime);
  }, [playerRef, isPlaying, showQueue]);


  // Handle player state change
  const onPlayerStateChange = async (event: { data: number }) => {
    // YouTube player states: 0 = ended, 1 = playing, 2 = paused
    if (event.data === 0 && roomData) {
      // Video ended - play next song
      console.log('🎬 Video ended, playing next...');
      setIsPlaying(false);
      setShowQueue(true);

      const nextIndex = roomData.currentIndex + 1;
      if (nextIndex < roomData.queue.length) {
        // Play next song
        const nextVideo = roomData.queue[nextIndex];
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

        try {
          await update(roomRef, {
            currentIndex: nextIndex,
            currentVideo: nextVideo,
            controls: { isPlaying: true },
          });
          console.log('✅ Auto-played next song:', nextVideo.title);
        } catch (error) {
          console.error('❌ Error playing next song:', error);
        }
      } else {
        console.log('🏁 Queue finished');
      }
    } else if (event.data === 1) {
      console.log('▶️ Video playing');
      setIsPlaying(true);
      // Don't unmute - browser blocks it and pauses video
      // User can unmute manually via YouTube controls
    } else if (event.data === 2) {
      console.log('⏸️ Video paused');
      setIsPlaying(false);
      setShowQueue(true);
    }
  };

  // Handle player error
  const onPlayerError = (event: { data: number }) => {
    console.error('Player error:', event.data);
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

  // Show loading if room code not ready yet
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
  if (!isConnected || !roomData) {
    return (
      <div className="relative h-screen bg-black text-white">
        <div className="absolute text-center inset-0 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold mb-8">YouOke TV</h1>

          {/* Room Code Display */}
          <div className="bg-primary/20 border-4 border-primary rounded-2xl px-12 py-8 mb-8">
            <p className="text-2xl text-gray-300 mb-2">เลขห้อง</p>
            <p className="text-8xl font-bold tracking-widest text-primary">{roomCode}</p>
          </div>

          {/* Instructions */}
          <div className="space-y-3 max-w-xl">
            <p className="text-2xl text-gray-300">📱 วิธีใช้งาน:</p>
            <div className="text-left bg-base-200/10 rounded-lg p-4 space-y-2">
              <p className="text-lg">1. เปิด youoke.vercel.app บนมือถือ</p>
              <p className="text-lg">2. กดปุ่ม "Cast to TV"</p>
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

  // Show player when connected
  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col">
      {/* YouTube Player */}
      <div className="flex-1 relative">
        {initialVideoId ? (
          <YouTube
            videoId={initialVideoId}
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

      {/* Queue Display - Top Right Corner (show when near end) */}
      {showQueue && roomData.queue.length > roomData.currentIndex + 1 && (
        <div className="absolute top-6 right-6 w-80 bg-black/90 backdrop-blur-md rounded-xl shadow-2xl border border-primary/30 p-5 transition-all duration-500">
          {/* Header */}
          <div className="mb-4 pb-3 border-b border-primary/30">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <span>🎵</span>
              <span>เพลงถัดไป</span>
            </h3>
          </div>

          {/* Queue List */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
            {roomData.queue
              .slice(roomData.currentIndex + 1, roomData.currentIndex + 6)
              .map((video, idx) => (
                <div
                  key={video.key}
                  className="flex items-start gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-all"
                >
                  {/* Number Badge */}
                  <div className="flex-shrink-0 w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate leading-snug">
                      {video.title}
                    </p>
                    {video.author && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {video.author}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Footer - More songs indicator */}
          {roomData.queue.length > roomData.currentIndex + 6 && (
            <div className="mt-3 pt-3 border-t border-white/10 text-center">
              <p className="text-xs text-gray-400">
                + อีก {roomData.queue.length - roomData.currentIndex - 6} เพลง
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Monitor;
