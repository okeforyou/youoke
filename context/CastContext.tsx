import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { RecommendedVideo, SearchResult } from '../types/invidious';

// Extended Video type with queue key
type QueueVideo = (SearchResult | RecommendedVideo) & { key: number };

interface CastContextValue {
  // Connection State
  isAvailable: boolean;
  isConnected: boolean;
  castSession: chrome.cast.Session | null;
  receiverName: string;

  // Queue State
  playlist: QueueVideo[];
  currentIndex: number;
  currentVideo: QueueVideo | null;

  // Connection Actions
  connect: (initialPlaylist?: QueueVideo[]) => void;
  disconnect: () => void;

  // Queue Operations
  setPlaylist: (playlist: QueueVideo[]) => void;
  addToQueue: (video: SearchResult | RecommendedVideo) => void;
  playNow: (video: SearchResult | RecommendedVideo) => void;
  playNext: (video: SearchResult | RecommendedVideo) => void;
  insertAt: (video: SearchResult | RecommendedVideo, index: number) => void;
  removeAt: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;

  // Player Controls
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
}

const CastContext = createContext<CastContextValue | undefined>(undefined);

// Message namespace for communication (must match receiver)
const CAST_NAMESPACE = 'urn:x-cast:com.youoke.cast';

// Cast message types (must match receiver message handler)
type CastMessage =
  | { type: 'LOAD_VIDEO', videoId: string }
  | { type: 'LOAD_QUEUE', videos: Array<{videoId: string, title: string}> }
  | { type: 'UPDATE_QUEUE', videos: Array<{videoId: string, title: string}> }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' };

export function CastProvider({ children }: { children: ReactNode }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [castSession, setCastSession] = useState<chrome.cast.Session | null>(null);
  const [receiverName, setReceiverName] = useState('');

  const [playlist, setPlaylistState] = useState<QueueVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVideo, setCurrentVideo] = useState<QueueVideo | null>(null);

  // Refs to access latest state in event handlers (avoid stale closure)
  const playlistRef = useRef<QueueVideo[]>([]);
  const currentVideoRef = useRef<QueueVideo | null>(null);
  const currentIndexRef = useRef<number>(0);

  // Keep refs in sync with state
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentVideoRef.current = currentVideo;
  }, [currentVideo]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Initialize Google Cast API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🎬 CastContext mounted, waiting for Google Cast SDK...');

    let pollCount = 0;
    const maxPolls = 30; // Try for 15 seconds (30 * 500ms)

    // Setup callback for when SDK is available
    // Note: This callback fires when cast_sender.js loads, but cast.framework
    // may not be ready yet. We still rely on polling to check for cast.framework.
    window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
      console.log('📡 __onGCastApiAvailable called:', isAvailable);
      // Don't call initializeCastApi() here - let polling handle it
      // because cast.framework may not be ready yet
    };

    // Poll for Cast SDK in case callback doesn't fire
    const pollInterval = setInterval(() => {
      pollCount++;
      const chromeCast = (window as any).chrome?.cast;
      const castFramework = (window as any).cast?.framework;

      // Debug: Show what's available
      if (pollCount === 1 || pollCount === 5 || pollCount === 10) {
        const debugInfo = {
          hasChromeCast: !!chromeCast,
          hasCastFramework: !!castFramework,
          hasWindowCast: !!(window as any).cast,
        };
        console.log(`🔍 Debug (poll #${pollCount}):`, JSON.stringify(debugInfo, null, 2));
        console.log(`🔍 window.chrome.cast:`, !!chromeCast);
        console.log(`🔍 window.cast:`, !!(window as any).cast);
        console.log(`🔍 window.cast.framework:`, !!castFramework);
        if (castFramework) {
          console.log(`🔍 cast.framework properties:`, Object.keys(castFramework).join(', '));
        }
      }

      if (castFramework) {
        console.log(`✅ Google Cast SDK detected (poll #${pollCount})`);
        clearInterval(pollInterval);
        initializeCastApi();
      } else if (pollCount >= maxPolls) {
        console.warn('⚠️ Google Cast SDK not loaded after 15 seconds');
        const finalDebug = {
          hasChromeCast: !!chromeCast,
          hasCastFramework: !!castFramework,
          hasWindowCast: !!(window as any).cast,
        };
        console.warn('🔍 Final debug:', JSON.stringify(finalDebug, null, 2));
        console.warn('🔍 window.chrome.cast:', !!chromeCast);
        console.warn('🔍 window.cast:', !!(window as any).cast);
        console.warn('🔍 window.cast.framework:', !!castFramework);
        clearInterval(pollInterval);
      } else {
        console.log(`⏳ Waiting for Cast SDK... (poll #${pollCount}/${maxPolls})`);
      }
    }, 500);

    return () => {
      clearInterval(pollInterval);
      delete window['__onGCastApiAvailable'];
    };
  }, []);

  const initializeCastApi = () => {
    console.log('🎬 Initializing Google Cast API...');

    // Prevent double initialization
    if (isAvailable) {
      console.log('⚠️ Google Cast already initialized, skipping...');
      return;
    }

    const cast = (window as any).cast;
    if (!cast) {
      console.log('⚠️ Google Cast not available on window.cast');
      return;
    }

    if (!cast.framework) {
      console.log('⚠️ Google Cast framework not available');
      return;
    }

    let context;
    try {
      context = cast.framework.CastContext.getInstance();

      // Google Cast Application ID
      // Using Custom Receiver with YouTube IFrame Player support
      // Registered at: https://cast.google.com/publish
      // NOTE: App must be PUBLISHED for production use (not just saved)
      const applicationId = '4FB4C174';

      context.setOptions({
        receiverApplicationId: applicationId,
        autoJoinPolicy: (window as any).chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      setIsAvailable(true);
      console.log('✅ Google Cast SDK initialized successfully!');
      console.log('📱 Application ID:', applicationId);
    } catch (error) {
      console.error('❌ Error initializing Google Cast:', error);
      return;
    }

    // Listen for session state changes
    context.addEventListener(
      cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      (event: any) => {
        switch (event.sessionState) {
          case cast.framework.SessionState.SESSION_STARTED:
          case cast.framework.SessionState.SESSION_RESUMED:
            handleSessionStarted(context.getCurrentSession());
            break;
          case cast.framework.SessionState.SESSION_ENDED:
            handleSessionEnded();
            break;
        }
      }
    );

    // Check if there's an existing session
    const currentSession = context.getCurrentSession();
    if (currentSession) {
      handleSessionStarted(currentSession);
    }
  };

  const handleSessionStarted = (session: any) => {
    if (!session) return;

    setCastSession(session);
    setIsConnected(true);
    setReceiverName(session.getCastDevice().friendlyName);

    // Setup message listener
    session.addMessageListener(CAST_NAMESPACE, (namespace: string, message: string) => {
      console.log('📨 Received message from receiver:', message);

      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case 'VIDEO_ENDED':
            console.log('🎬 Video ended on receiver:', data.videoId);
            // Remove the ended video from playlist
            const latestPlaylist = playlistRef.current;
            const latestIndex = currentIndexRef.current;

            if (latestPlaylist.length > 0 && latestIndex < latestPlaylist.length) {
              // Remove current video from playlist
              const newPlaylist = [...latestPlaylist];
              newPlaylist.splice(latestIndex, 1);

              console.log('🗑️ Removing video from queue. Remaining:', newPlaylist.length);
              setPlaylistState(newPlaylist);
              playlistRef.current = newPlaylist;

              // Keep current index the same (next video now at same index)
              if (newPlaylist.length > 0 && latestIndex < newPlaylist.length) {
                setCurrentVideo(newPlaylist[latestIndex]);
                currentVideoRef.current = newPlaylist[latestIndex];
              } else if (newPlaylist.length > 0) {
                // If at end, go to last video
                setCurrentIndex(newPlaylist.length - 1);
                currentIndexRef.current = newPlaylist.length - 1;
                setCurrentVideo(newPlaylist[newPlaylist.length - 1]);
                currentVideoRef.current = newPlaylist[newPlaylist.length - 1];
              } else {
                // Queue empty
                setCurrentIndex(0);
                currentIndexRef.current = 0;
                setCurrentVideo(null);
                currentVideoRef.current = null;
              }
            }
            break;

          default:
            console.log('Unknown message type from receiver:', data.type);
        }
      } catch (error) {
        console.error('❌ Error parsing receiver message:', error);
      }
    });

    console.log('Cast session started:', session.getCastDevice().friendlyName);

    // ⚠️ IMPORTANT: Read from refs to get latest state (not stale closure values)
    const latestPlaylist = playlistRef.current;
    const latestCurrentVideo = currentVideoRef.current;

    console.log('📊 Current state when connected:', {
      playlistLength: latestPlaylist.length,
      hasCurrentVideo: !!latestCurrentVideo,
      firstVideoId: latestPlaylist[0]?.videoId,
    });

    // Send current playlist to receiver if available
    if (latestPlaylist.length > 0) {
      console.log('📤 Sending playlist to receiver...');
      const videos = latestPlaylist.map(v => ({
        videoId: v.videoId,
        title: v.title || 'Unknown'
      }));

      // Send queue
      session.sendMessage(
        CAST_NAMESPACE,
        { type: 'LOAD_QUEUE', videos },
        () => console.log('✅ Playlist sent:', videos.length, 'videos'),
        (error: any) => console.error('❌ Error sending playlist:', error)
      );

      // Play video: use currentVideo if available, otherwise play first video in queue
      const videoToPlay = latestCurrentVideo || latestPlaylist[0];
      if (videoToPlay) {
        console.log('📤 Sending video to play:', videoToPlay.videoId);
        session.sendMessage(
          CAST_NAMESPACE,
          { type: 'LOAD_VIDEO', videoId: videoToPlay.videoId },
          () => console.log('✅ Video sent:', videoToPlay.videoId),
          (error: any) => console.error('❌ Error sending video:', error)
        );
      } else {
        console.error('❌ No video to play! playlist has items but playlist[0] is undefined');
      }
    } else {
      console.warn('⚠️ Playlist is empty when connected! Nothing to play.');
    }
  };

  const handleSessionEnded = () => {
    setCastSession(null);
    setIsConnected(false);
    setReceiverName('');
    console.log('Cast session ended');
  };

  // Send message to receiver
  const sendMessage = (message: CastMessage) => {
    console.log('🎯 sendMessage called:', message.type, 'isConnected:', isConnected);

    if (!castSession) {
      console.error('❌ No cast session available! isConnected:', isConnected);
      console.error('❌ Please reconnect to Cast');
      return;
    }

    console.log('📤 Sending message to receiver...', message);
    castSession.sendMessage(
      CAST_NAMESPACE,
      message,
      () => console.log('✅ Message sent successfully:', message.type),
      (error) => console.error('❌ Error sending message:', error)
    );
  };

  // Connection Actions
  const connect = (initialPlaylist?: QueueVideo[]) => {
    const cast = (window as any).cast;
    if (!cast || !cast.framework) {
      console.error('Google Cast SDK not loaded yet. Please wait a moment and try again.');
      alert('กรุณารอสักครู่และลองใหม่อีกครั้ง\n(Google Cast SDK กำลังโหลด...)');
      return;
    }

    // If initialPlaylist provided, set it immediately before connecting
    if (initialPlaylist && initialPlaylist.length > 0) {
      console.log('📋 Setting initial playlist before connecting:', initialPlaylist.length, 'videos');
      setPlaylistState(initialPlaylist);
      playlistRef.current = initialPlaylist; // Update ref immediately!

      // Set first video as current if not set
      if (!currentVideo) {
        setCurrentVideo(initialPlaylist[0]);
        currentVideoRef.current = initialPlaylist[0];
      }
    }

    try {
      const context = cast.framework.CastContext.getInstance();
      console.log('🔌 Requesting Cast session...');
      context.requestSession().then(
        () => {
          console.log('✅ Cast session requested successfully');
        },
        (error: any) => {
          console.error('❌ Error requesting session:', error);
          console.error('Error details:', {
            code: error?.code,
            description: error?.description,
            details: error?.details,
            message: error?.message,
          });

          // Show user-friendly error
          let errorMessage = 'ไม่สามารถเชื่อมต่อ Google Cast ได้';
          if (error === 'cancel') {
            errorMessage = 'การเชื่อมต่อถูกยกเลิก';
          } else if (error === 'session_error') {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับอุปกรณ์ได้\n\nกรุณา:\n1. Reboot ทีวี\n2. รอ 5-10 นาที\n3. ลองใหม่อีกครั้ง';
          }
          alert(errorMessage);
        }
      );
    } catch (error) {
      console.error('❌ Error connecting to Cast:', error);
      alert('ไม่สามารถเชื่อมต่อ Google Cast ได้\nกรุณาลองใหม่อีกครั้ง');
    }
  };

  const disconnect = () => {
    const cast = (window as any).cast;
    if (!cast) return;

    const context = cast.framework.CastContext.getInstance();
    context.endCurrentSession(true);
  };

  // Queue Operations
  const setPlaylist = (newPlaylist: QueueVideo[]) => {
    setPlaylistState(newPlaylist);
    if (isConnected && newPlaylist.length > 0) {
      sendMessage({
        type: 'LOAD_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId,
          title: v.title || 'Unknown'
        })),
      });
    }
  };

  const addToQueue = (video: SearchResult | RecommendedVideo) => {
    console.log('➕ addToQueue() called, video:', video.title || video.videoId, 'isConnected:', isConnected);

    const newVideo = { ...video, key: Date.now() };
    const newPlaylist = [...playlist, newVideo];
    setPlaylistState(newPlaylist);

    console.log('📋 New playlist length:', newPlaylist.length);

    if (isConnected) {
      console.log('📤 Sending updated queue to receiver...');
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId,
          title: v.title || 'Unknown'
        })),
      });
    } else {
      console.warn('⚠️ Not connected! Queue not sent to TV');
    }
  };

  const playNow = (video: SearchResult | RecommendedVideo) => {
    const newVideo = { ...video, key: Date.now() };
    const newPlaylist = [newVideo, ...playlist];
    setPlaylistState(newPlaylist);
    setCurrentIndex(0);
    setCurrentVideo(newVideo);

    if (isConnected) {
      // Send LOAD_VIDEO to start playing immediately
      sendMessage({
        type: 'LOAD_VIDEO',
        videoId: video.videoId,
      });
      // Send full queue for reference
      sendMessage({
        type: 'LOAD_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId,
          title: v.title || 'Unknown'
        })),
      });
    }
  };

  const playNext = (video: SearchResult | RecommendedVideo) => {
    const newVideo = { ...video, key: Date.now() };
    const newPlaylist = [
      ...playlist.slice(0, currentIndex + 1),
      newVideo,
      ...playlist.slice(currentIndex + 1),
    ];
    setPlaylistState(newPlaylist);

    if (isConnected) {
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId,
          title: v.title || 'Unknown'
        })),
      });
    }
  };

  const insertAt = (video: SearchResult | RecommendedVideo, index: number) => {
    const newVideo = { ...video, key: Date.now() };
    const newPlaylist = [...playlist];
    newPlaylist.splice(index, 0, newVideo);
    setPlaylistState(newPlaylist);

    if (isConnected) {
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId,
          title: v.title || 'Unknown'
        })),
      });
    }
  };

  const removeAt = (index: number) => {
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylistState(newPlaylist);

    // Adjust current index if needed
    let newCurrentIndex = currentIndex;
    if (index < currentIndex) {
      newCurrentIndex = currentIndex - 1;
    } else if (index === currentIndex) {
      newCurrentIndex = Math.min(currentIndex, newPlaylist.length - 1);
    }
    setCurrentIndex(newCurrentIndex);

    if (isConnected && newPlaylist.length > 0) {
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId,
          title: v.title || 'Unknown'
        })),
      });
    }
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;

    const newPlaylist = [...playlist];
    [newPlaylist[index - 1], newPlaylist[index]] = [newPlaylist[index], newPlaylist[index - 1]];
    setPlaylistState(newPlaylist);

    if (isConnected) {
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId,
          title: v.title || 'Unknown'
        })),
      });
    }
  };

  const moveDown = (index: number) => {
    if (index >= playlist.length - 1) return;

    const newPlaylist = [...playlist];
    [newPlaylist[index], newPlaylist[index + 1]] = [newPlaylist[index + 1], newPlaylist[index]];
    setPlaylistState(newPlaylist);

    if (isConnected) {
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId,
          title: v.title || 'Unknown'
        })),
      });
    }
  };

  // Player Controls
  const play = () => {
    console.log('▶️ play() called, isConnected:', isConnected);
    if (isConnected) {
      sendMessage({ type: 'PLAY' });
    } else {
      console.warn('⚠️ Not connected! Cannot play');
    }
  };

  const pause = () => {
    console.log('⏸️ pause() called, isConnected:', isConnected);
    if (isConnected) {
      sendMessage({ type: 'PAUSE' });
    } else {
      console.warn('⚠️ Not connected! Cannot pause');
    }
  };

  const next = () => {
    // Use refs to get latest state
    const latestPlaylist = playlistRef.current;
    const latestIndex = currentIndexRef.current;

    console.log('⏭️ next() called, playlist.length:', latestPlaylist.length, 'currentIndex:', latestIndex, 'isConnected:', isConnected);

    if (latestPlaylist.length === 0) {
      console.warn('⚠️ Playlist is empty!');
      return;
    }

    const newIndex = Math.min(latestIndex + 1, latestPlaylist.length - 1);
    console.log('📍 Moving to index:', newIndex, 'videoId:', latestPlaylist[newIndex]?.videoId);

    setCurrentIndex(newIndex);
    setCurrentVideo(latestPlaylist[newIndex]);

    if (isConnected && latestPlaylist[newIndex]) {
      // Send LOAD_VIDEO instead of just NEXT to ensure receiver plays the correct video
      sendMessage({
        type: 'LOAD_VIDEO',
        videoId: latestPlaylist[newIndex].videoId
      });
    } else {
      console.warn('⚠️ Not connected or no video at index', newIndex);
    }
  };

  const previous = () => {
    // Use refs to get latest state
    const latestPlaylist = playlistRef.current;
    const latestIndex = currentIndexRef.current;

    console.log('⏮️ previous() called, playlist.length:', latestPlaylist.length, 'currentIndex:', latestIndex, 'isConnected:', isConnected);

    if (latestPlaylist.length === 0) {
      console.warn('⚠️ Playlist is empty!');
      return;
    }

    const newIndex = Math.max(latestIndex - 1, 0);
    console.log('📍 Moving to index:', newIndex, 'videoId:', latestPlaylist[newIndex]?.videoId);

    setCurrentIndex(newIndex);
    setCurrentVideo(latestPlaylist[newIndex]);

    if (isConnected && latestPlaylist[newIndex]) {
      // Send LOAD_VIDEO instead of just PREVIOUS to ensure receiver plays the correct video
      sendMessage({
        type: 'LOAD_VIDEO',
        videoId: latestPlaylist[newIndex].videoId
      });
    } else {
      console.warn('⚠️ Not connected or no video at index', newIndex);
    }
  };

  const value: CastContextValue = {
    isAvailable,
    isConnected,
    castSession,
    receiverName,
    playlist,
    currentIndex,
    currentVideo,
    connect,
    disconnect,
    setPlaylist,
    addToQueue,
    playNow,
    playNext,
    insertAt,
    removeAt,
    moveUp,
    moveDown,
    play,
    pause,
    next,
    previous,
  };

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}

export function useCast() {
  const context = useContext(CastContext);
  if (context === undefined) {
    throw new Error('useCast must be used within a CastProvider');
  }
  return context;
}
