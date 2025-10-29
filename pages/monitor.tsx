import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '../firebase';

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
  const roomCode = typeof roomCodeParam === 'string' ? roomCodeParam : '';

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerRef, setPlayerRef] = useState<YouTubePlayer | null>(null);

  // Listen to room data
  useEffect(() => {
    if (!roomCode || !realtimeDb) return;

    console.log('Monitoring room:', roomCode);
    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        console.log('Room not found');
        setIsConnected(false);
        setRoomData(null);
        return;
      }

      console.log('Room data received:', data);
      setIsConnected(true);
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
  }, [roomCode]);

  // Handle player ready
  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    setPlayerRef(event.target);
    console.log('Player ready');
  };

  // Handle player state change
  const onPlayerStateChange = (event: { data: number }) => {
    // YouTube player states: 0 = ended, 1 = playing, 2 = paused
    if (event.data === 0) {
      // Video ended
      console.log('Video ended');
      // Note: Auto-play next is handled by the sender updating currentIndex
    } else if (event.data === 1) {
      console.log('Video playing');
    } else if (event.data === 2) {
      console.log('Video paused');
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
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  // Show waiting screen if no room code
  if (!roomCode) {
    return (
      <div className="relative h-screen bg-black text-white">
        <div className="absolute text-center inset-0 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold mb-4">YouOke TV</h1>
          <p className="text-2xl text-gray-400">Monitor Mode</p>
          <p className="text-xl text-gray-500 mt-4">
            กรุณาเพิ่ม ?room=XXXXXX ใน URL
          </p>
        </div>
      </div>
    );
  }

  // Show waiting for connection
  if (!isConnected || !roomData) {
    return (
      <div className="relative h-screen bg-black text-white">
        <div className="absolute text-center inset-0 flex flex-col items-center justify-center">
          <h1 className="text-6xl font-bold mb-4">YouOke TV</h1>
          <p className="text-3xl mb-6">เลขห้อง: {roomCode}</p>
          <p className="text-xl text-gray-400">รอเชื่อมต่อจากมือถือ...</p>
          <p className="text-lg text-gray-500 mt-4">
            กด "Cast to TV" บนมือถือและกรอกเลขห้อง
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

      {/* Queue Display */}
      {roomData.queue.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
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

      {/* Connection indicator */}
      <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
        🔗 เชื่อมต่อแล้ว
      </div>
    </div>
  );
};

export default Monitor;
