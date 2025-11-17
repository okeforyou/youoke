import { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';

interface QueueVideo {
  videoId: string;
  title: string;
  author?: string;
  key: number;
}

type CastMessage =
  | { type: 'LOAD_QUEUE'; videos: { videoId: string; title: string }[] }
  | { type: 'UPDATE_QUEUE'; videos: { videoId: string; title: string }[] }
  | { type: 'LOAD_VIDEO'; videoId: string }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'QUEUE_UPDATE'; queue: QueueVideo[]; currentIndex: number }  // Legacy support
  | { type: 'PLAY_VIDEO'; videoId: string; index: number };  // Legacy support

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

    // Custom message namespace (MUST match CastContext.tsx)
    const CAST_NAMESPACE = 'urn:x-cast:com.youoke.cast';

    // Listen for custom messages from sender
    context.addCustomMessageListener(CAST_NAMESPACE, (event: any) => {
      console.log('📨 Received message:', event.data);
      handleMessage(event.data as CastMessage);
    });

    // Start the receiver
    context.start(options);
    console.log('Cast Receiver started');
  };

  const sendMessageToSender = (message: any) => {
    if (!contextRef.current) return;

    try {
      const CAST_NAMESPACE = 'urn:x-cast:com.youoke.cast';
      contextRef.current.getSenders().forEach((senderId: string) => {
        contextRef.current.sendCustomMessage(CAST_NAMESPACE, senderId, message);
      });
      console.log('📤 Sent to sender:', message);
    } catch (error) {
      console.error('Error sending message to sender:', error);
    }
  };

  const handleMessage = (message: CastMessage) => {
    console.log('📨 Receiver got message:', message.type);

    switch (message.type) {
      case 'LOAD_QUEUE':
      case 'UPDATE_QUEUE':
        // Convert videos array to queue format
        const newQueue: QueueVideo[] = message.videos.map((v, index) => ({
          videoId: v.videoId,
          title: v.title || 'Unknown Track',
          author: '',
          key: Date.now() + index
        }));
        setQueue(newQueue);

        // Only change video if LOAD_QUEUE (not UPDATE_QUEUE)
        if (message.type === 'LOAD_QUEUE' && newQueue.length > 0) {
          setCurrentIndex(0);
          setCurrentVideoId(newQueue[0].videoId);
          setIsPlaying(true);
          console.log('📺 Loading first video:', newQueue[0].title);
        } else {
          console.log('📺 Updated queue, keeping current video');
        }
        break;

      case 'LOAD_VIDEO':
        const videoIndex = queue.findIndex(v => v.videoId === message.videoId);
        if (videoIndex >= 0) {
          setCurrentIndex(videoIndex);
          setCurrentVideoId(message.videoId);
          setIsPlaying(true);
          console.log('📺 Loading video at index:', videoIndex);
        } else {
          console.warn('⚠️ Video not found in queue:', message.videoId);
        }
        break;

      case 'QUEUE_UPDATE':  // Legacy support
        setQueue(message.queue);
        setCurrentIndex(message.currentIndex);
        if (message.queue.length > message.currentIndex) {
          setCurrentVideoId(message.queue[message.currentIndex].videoId);
        }
        break;

      case 'PLAY_VIDEO':  // Legacy support
        setCurrentVideoId(message.videoId);
        setCurrentIndex(message.index);
        setIsPlaying(true);
        break;

      case 'PLAY':
        setIsPlaying(true);
        playerRef.current?.playVideo();
        console.log('▶️ Playing');
        break;

      case 'PAUSE':
        setIsPlaying(false);
        playerRef.current?.pauseVideo();
        console.log('⏸ Paused');
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
      // Video ended, notify sender and play next
      console.log('🎬 Video ended:', currentVideoId, 'at index:', currentIndex);

      // Send VIDEO_ENDED message to sender
      sendMessageToSender({
        type: 'VIDEO_ENDED',
        videoId: currentVideoId,
        currentIndex: currentIndex
      });

      // Play next video
      playNext();
    } else if (event.data === 1) {
      setIsPlaying(true);
      console.log('▶️ Playing:', currentVideoId);
    } else if (event.data === 2) {
      setIsPlaying(false);
      console.log('⏸ Paused');
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
