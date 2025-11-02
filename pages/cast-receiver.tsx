import { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';

interface QueueVideo {
  videoId: string;
  title: string;
  author?: string;
  key: number;
}

type CastMessage =
  | { type: 'QUEUE_UPDATE'; queue: QueueVideo[]; currentIndex: number }
  | { type: 'PLAY_VIDEO'; videoId: string; index: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' };

export default function CastReceiver() {
  const [queue, setQueue] = useState<QueueVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVideoId, setCurrentVideoId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const contextRef = useRef<any>(null);

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') return;

    // Check if Cast Receiver API is available
    if (!window.cast || !window.cast.framework) {
      console.error('Cast Receiver API not loaded');
      return;
    }

    initializeCastReceiver();

    return () => {
      // Cleanup
      if (contextRef.current) {
        contextRef.current.stop();
      }
    };
  }, []);

  const initializeCastReceiver = () => {
    const context = (window as any).cast.framework.CastReceiverContext.getInstance();
    contextRef.current = context;

    const options = new (window as any).cast.framework.CastReceiverOptions();
    options.disableIdleTimeout = true;

    // Custom message namespace
    const CAST_NAMESPACE = 'urn:x-cast:com.youoke.karaoke';

    // Listen for custom messages from sender
    context.addCustomMessageListener(CAST_NAMESPACE, (event: any) => {
      console.log('Received message:', event.data);
      handleMessage(event.data as CastMessage);
    });

    // Start the receiver
    context.start(options);
    console.log('Cast Receiver started');
  };

  const handleMessage = (message: CastMessage) => {
    switch (message.type) {
      case 'QUEUE_UPDATE':
        setQueue(message.queue);
        setCurrentIndex(message.currentIndex);
        if (message.queue.length > message.currentIndex) {
          setCurrentVideoId(message.queue[message.currentIndex].videoId);
        }
        break;

      case 'PLAY_VIDEO':
        setCurrentVideoId(message.videoId);
        setCurrentIndex(message.index);
        setIsPlaying(true);
        break;

      case 'PLAY':
        setIsPlaying(true);
        playerRef.current?.playVideo();
        break;

      case 'PAUSE':
        setIsPlaying(false);
        playerRef.current?.pauseVideo();
        break;

      case 'NEXT':
        playNext();
        break;

      case 'PREVIOUS':
        playPrevious();
        break;
    }
  };

  const playNext = () => {
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentVideoId(queue[nextIndex].videoId);
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentVideoId(queue[prevIndex].videoId);
      setIsPlaying(true);
    }
  };

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    console.log('Player ready');
  };

  const onPlayerStateChange = (event: { target: YouTubePlayer; data: number }) => {
    // YouTube player state: 0 = ended, 1 = playing, 2 = paused
    if (event.data === 0) {
      // Video ended, play next
      console.log('Video ended, playing next...');
      playNext();
    } else if (event.data === 1) {
      setIsPlaying(true);
    } else if (event.data === 2) {
      setIsPlaying(false);
    }
  };

  const onPlayerError = (event: { target: YouTubePlayer; data: number }) => {
    console.error('Player error:', event.data);
    // Try to play next video on error
    playNext();
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1 as const,
      controls: 0 as const,
      modestbranding: 1 as const,
      rel: 0 as const,
      showinfo: 0 as const,
    },
  };

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col">
      {/* YouTube Player */}
      <div className="flex-1 relative">
        {currentVideoId ? (
          <YouTube
            videoId={currentVideoId}
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
              <p className="text-2xl text-gray-400">รอเชื่อมต่อจากมือถือ...</p>
              <p className="text-xl text-gray-500 mt-4">กด Cast บนมือถือเพื่อเริ่มต้น</p>
            </div>
          </div>
        )}
      </div>

      {/* Queue Display */}
      {queue.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
          <div className="max-w-6xl mx-auto">
            {/* Now Playing */}
            {queue[currentIndex] && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">กำลังเล่น:</p>
                <h2 className="text-3xl font-bold truncate">{queue[currentIndex].title}</h2>
                {queue[currentIndex].author && (
                  <p className="text-xl text-gray-300">{queue[currentIndex].author}</p>
                )}
              </div>
            )}

            {/* Next in Queue */}
            {queue.length > currentIndex + 1 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">คิวถัดไป:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {queue.slice(currentIndex + 1, currentIndex + 4).map((video, index) => (
                    <div key={video.key} className="bg-gray-900/50 rounded-lg p-3">
                      <p className="text-sm text-gray-400">#{currentIndex + index + 2}</p>
                      <p className="text-lg font-semibold truncate">{video.title}</p>
                      {video.author && (
                        <p className="text-sm text-gray-400 truncate">{video.author}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Queue count */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                {currentIndex + 1} / {queue.length} เพลง
                {queue.length > currentIndex + 4 && ` (เหลืออีก ${queue.length - currentIndex - 1} เพลง)`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cast Receiver SDK Script */}
      <script
        src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js"
        defer
      />
    </div>
  );
}
