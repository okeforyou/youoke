import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { ref } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../../../firebase';
import { QRCodeSVG } from 'qrcode.react';
import {
  MusicalNoteIcon,
  XMarkIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { validateShareToken, ShareToken } from '../../../services/shareService';

interface QueueVideo {
  videoId: string;
  title: string;
  author?: string;
  key: number;
  addedBy?: {
    uid: string;
    displayName: string;
    isGuest: boolean;
  };
}

interface RoomData {
  queue: QueueVideo[];
  currentIndex: number;
  currentVideo: QueueVideo | null;
  controls: {
    isPlaying: boolean;
    isMuted: boolean;
  };
}

const SharedMonitor = () => {
  const router = useRouter();
  const { token: tokenParam } = router.query;

  const [shareToken, setShareToken] = useState<ShareToken | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [hasUserInteraction, setHasUserInteraction] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const lastQueueLengthRef = useRef(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Anonymous login
  useEffect(() => {
    const loginAnonymously = async () => {
      try {
        await signInAnonymously(auth);
        console.log('✅ Shared Monitor signed in anonymously');
        setIsAuthReady(true);
      } catch (error) {
        console.error('❌ Anonymous sign-in failed:', error);
      }
    };
    loginAnonymously();
  }, []);

  // Validate share token
  useEffect(() => {
    if (!tokenParam || typeof tokenParam !== 'string') return;

    const validate = async () => {
      setIsValidating(true);
      setValidationError(null);

      try {
        const token = await validateShareToken(tokenParam);

        if (!token) {
          setValidationError('This share link is invalid or has been revoked.');
          setIsValidating(false);
          return;
        }

        setShareToken(token);
        console.log('✅ Valid share token:', token);
      } catch (error) {
        console.error('❌ Token validation error:', error);
        setValidationError('Failed to validate share link.');
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [tokenParam]);

  // Listen to room data (read-only for guests)
  useEffect(() => {
    if (!shareToken || !realtimeDb || !isAuthReady) return;

    const roomCode = shareToken.roomId;
    console.log('👁️ Monitoring shared room:', roomCode);

    const dbURL = realtimeDb?.app?.options?.databaseURL || '';
    let unsubscribe: (() => void) | null = null;
    let lastDataRef: any = null;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${dbURL}/rooms/${roomCode}.json`);

        if (!response.ok) {
          console.error('❌ Poll failed:', response.status);
          return;
        }

        const data = await response.json();

        if (!data) {
          console.log('Room not found');
          setRoomData(null);
          return;
        }

        // Only log when data changes
        if (JSON.stringify(data) !== JSON.stringify(lastDataRef)) {
          console.log('📦 Shared room data updated:', data);
          lastDataRef = data;
        }

        const state = data.state || data;
        const queueData = state.queue || [];

        setRoomData({
          queue: queueData,
          currentIndex: state.currentIndex || 0,
          currentVideo: state.currentVideo || null,
          controls: state.controls || { isPlaying: false, isMuted: false },
        });
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    }, 1000);

    unsubscribe = () => clearInterval(pollInterval);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [shareToken, isAuthReady]);

  // Video playback sync
  useEffect(() => {
    if (!player || !roomData) return;

    const currentVideo = roomData.currentVideo;
    const isPlaying = roomData.controls.isPlaying;

    if (currentVideo && currentVideo.videoId) {
      // Check if we need to load a new video
      if (currentVideoId !== currentVideo.videoId) {
        console.log('🎬 Loading new video:', currentVideo.title);
        setIsLoadingVideo(true);
        setCurrentVideoId(currentVideo.videoId);
        player.loadVideoById(currentVideo.videoId);
      } else if (isPlaying) {
        player.playVideo();
        setIsPlaying(true);
      } else {
        player.pauseVideo();
        setIsPlaying(false);
      }
    }
  }, [player, roomData, currentVideoId]);

  // Render loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Validating share link...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <XMarkIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-6">{validationError}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!shareToken) {
    return null;
  }

  const currentVideo = roomData?.currentVideo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600">
      {/* Owner Banner */}
      <div className="bg-yellow-400 text-gray-900 py-3 px-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <UserIcon className="h-5 w-5" />
          <p className="font-medium">
            You are using <strong>{shareToken.ownerName}</strong>'s room
          </p>
        </div>
      </div>

      <div className="container mx-auto p-4">
        {/* Video Player */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
          <div ref={playerContainerRef} className="relative">
            {currentVideo ? (
              <div className="aspect-video bg-black">
                <YouTube
                  videoId={currentVideo.videoId}
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: {
                      autoplay: 1,
                      controls: 0,
                      disablekb: 1,
                      modestbranding: 1,
                      rel: 0,
                      fs: 0,
                      playsinline: 1,
                    },
                  }}
                  onReady={(event) => {
                    setPlayer(event.target);
                    setIsLoadingVideo(false);
                  }}
                  onStateChange={(event) => {
                    if (event.data === 1) {
                      setIsLoadingVideo(false);
                      setIsPlaying(true);
                    } else if (event.data === 2) {
                      setIsPlaying(false);
                    }
                  }}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <MusicalNoteIcon className="h-24 w-24 mx-auto mb-4 opacity-50" />
                  <p className="text-2xl font-bold">No video playing</p>
                  <p className="text-sm mt-2 opacity-75">
                    Waiting for songs to be added...
                  </p>
                </div>
              </div>
            )}

            {isLoadingVideo && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white text-xl">Loading video...</p>
                </div>
              </div>
            )}
          </div>

          {/* Current Playing Info */}
          {currentVideo && (
            <div className="p-6 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentVideo.title}
              </h2>
              {currentVideo.author && (
                <p className="text-gray-600">By {currentVideo.author}</p>
              )}
              {currentVideo.addedBy && (
                <p className="text-sm text-gray-500 mt-2">
                  Added by: {currentVideo.addedBy.displayName}
                  {currentVideo.addedBy.isGuest && ' (Guest)'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Queue */}
        {showQueue && roomData && roomData.queue.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Queue ({roomData.queue.length} songs)
              </h3>
              <button
                onClick={() => setShowQueue(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-2">
              {roomData.queue.map((video, index) => (
                <div
                  key={video.key}
                  className={`p-4 rounded-lg transition-all ${
                    index === roomData.currentIndex
                      ? 'bg-red-100 border-2 border-red-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-gray-900">{video.title}</p>
                      {video.author && (
                        <p className="text-sm text-gray-600">{video.author}</p>
                      )}
                      {video.addedBy && (
                        <p className="text-xs text-gray-500">
                          Added by: {video.addedBy.displayName}
                          {video.addedBy.isGuest && ' (Guest)'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Queue Button (when hidden) */}
        {!showQueue && roomData && roomData.queue.length > 0 && (
          <button
            onClick={() => setShowQueue(true)}
            className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <MusicalNoteIcon className="h-5 w-5" />
            Show Queue ({roomData.queue.length})
          </button>
        )}
      </div>
    </div>
  );
};

export default SharedMonitor;
