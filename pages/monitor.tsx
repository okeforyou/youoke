import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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

      // Check if anyone has joined (besides monitor)
      const participants = data.participants || {};
      const participantCount = Object.keys(participants).length;
      const hasGuests = participantCount > 0; // Any participant means someone joined

      console.log('👥 Participants:', participantCount);
      setIsConnected(hasGuests);
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

    // Auto-play the video with retry
    try {
      // Small delay to ensure player is fully ready
      await new Promise(resolve => setTimeout(resolve, 500));

      await event.target.playVideo();
      console.log('▶️ Auto-playing video');

      // Verify it's actually playing
      const playerState = await event.target.getPlayerState();
      if (playerState !== 1) {
        console.warn('⚠️ Player not playing, retrying...');
        await event.target.playVideo();
      }
    } catch (error) {
      console.error('❌ Auto-play failed:', error);
      console.log('ℹ️ User may need to click play button (browser auto-play policy)');
    }
  };

  // Auto-play when currentVideo changes and controls say to play
  useEffect(() => {
    if (!playerRef || !roomData?.currentVideo || !roomData?.controls?.isPlaying) {
      return;
    }

    const autoPlay = async () => {
      try {
        console.log('🎵 New video detected, auto-playing:', roomData.currentVideo.title);

        // Small delay to ensure video is loaded
        await new Promise(resolve => setTimeout(resolve, 500));

        await playerRef.playVideo();

        // Verify it's actually playing
        const playerState = await playerRef.getPlayerState();
        if (playerState !== 1) {
          console.warn('⚠️ Player not playing, retrying...');
          await playerRef.playVideo();
        }
      } catch (error) {
        console.error('❌ Auto-play failed:', error);
      }
    };

    autoPlay();
  }, [playerRef, roomData?.currentVideo?.key, roomData?.controls?.isPlaying]);

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

        // Show queue if less than 30 seconds remaining
        if (remaining < 30) {
          setShowQueue(true);
        } else {
          setShowQueue(false);
        }
      } catch (error) {
        // Player not ready yet
      }
    }, 1000);

    return () => clearInterval(checkTime);
  }, [playerRef, isPlaying]);

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
        {roomData.currentVideo ? (
          <YouTube
            key={roomData.currentVideo.videoId}
            videoId={roomData.currentVideo.videoId}
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

      {/* Queue Display - Show when paused or near end */}
      {showQueue && roomData.queue.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 transition-opacity duration-500">
          <div className="max-w-6xl mx-auto">
            {/* Now Playing */}
            {roomData.currentVideo && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">กำลังเล่น:</p>
                <h2 className="text-2xl font-bold truncate">
                  {roomData.currentVideo.title}
                </h2>
                {roomData.currentVideo.author && (
                  <p className="text-lg text-gray-300">{roomData.currentVideo.author}</p>
                )}
              </div>
            )}

            {/* Next in Queue */}
            {roomData.queue.length > roomData.currentIndex + 1 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">คิวถัดไป:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {roomData.queue
                    .slice(roomData.currentIndex + 1, roomData.currentIndex + 4)
                    .map((video, index) => (
                      <div
                        key={video.key}
                        className="bg-gray-900/50 rounded p-2 text-sm"
                      >
                        <p className="text-xs text-gray-400">
                          #{roomData.currentIndex + index + 2}
                        </p>
                        <p className="font-semibold truncate">{video.title}</p>
                        {video.author && (
                          <p className="text-xs text-gray-400 truncate">
                            {video.author}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Queue count */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-400">
                {roomData.currentIndex + 1} / {roomData.queue.length} เพลง
                {roomData.queue.length > roomData.currentIndex + 4 &&
                  ` (เหลืออีก ${roomData.queue.length - roomData.currentIndex - 1} เพลง)`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection indicator - Show when not playing or queue visible */}
      {showQueue && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm shadow-lg transition-opacity duration-500">
          🔗 เชื่อมต่อแล้ว
        </div>
      )}
    </div>
  );
};

export default Monitor;
