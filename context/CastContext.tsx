import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  connect: () => void;
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

// Message namespace for communication
const CAST_NAMESPACE = 'urn:x-cast:com.youoke.karaoke';

// Cast message types
type CastMessage =
  | { type: 'QUEUE_UPDATE', queue: QueueVideo[], currentIndex: number }
  | { type: 'PLAY_VIDEO', videoId: string, index: number }
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

  // Initialize Google Cast API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🎬 CastContext mounted, waiting for Google Cast SDK...');

    let pollCount = 0;
    const maxPolls = 30; // Try for 15 seconds (30 * 500ms)

    // Setup callback for when SDK is available
    window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
      console.log('📡 __onGCastApiAvailable called:', isAvailable);
      if (isAvailable) {
        initializeCastApi();
      }
    };

    // Poll for Cast SDK in case callback doesn't fire
    const pollInterval = setInterval(() => {
      pollCount++;
      const cast = (window as any).chrome?.cast;

      if (cast?.framework) {
        console.log(`✅ Google Cast SDK detected (poll #${pollCount})`);
        clearInterval(pollInterval);
        initializeCastApi();
      } else if (pollCount >= maxPolls) {
        console.warn('⚠️ Google Cast SDK not loaded after 15 seconds');
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

    const cast = window.chrome?.cast as any;
    if (!cast) {
      console.log('⚠️ Google Cast not available on window.chrome');
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
      // Registered at: https://cast.google.com/publish
      const applicationId = '4FB4C174'; // YouOke Karaoke Custom Receiver

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
      console.log('Received message from receiver:', message);
    });

    console.log('Cast session started:', session.getCastDevice().friendlyName);
  };

  const handleSessionEnded = () => {
    setCastSession(null);
    setIsConnected(false);
    setReceiverName('');
    console.log('Cast session ended');
  };

  // Send message to receiver
  const sendMessage = (message: CastMessage) => {
    if (!castSession) {
      console.warn('No cast session available');
      return;
    }

    castSession.sendMessage(
      CAST_NAMESPACE,
      message,
      () => console.log('Message sent:', message.type),
      (error) => console.error('Error sending message:', error)
    );
  };

  // Connection Actions
  const connect = () => {
    const cast = window.chrome?.cast as any;
    if (!cast || !cast.framework) {
      console.error('Google Cast SDK not loaded yet. Please wait a moment and try again.');
      alert('กรุณารอสักครู่และลองใหม่อีกครั้ง\n(Google Cast SDK กำลังโหลด...)');
      return;
    }

    try {
      const context = cast.framework.CastContext.getInstance();
      context.requestSession().then(
        () => console.log('Cast session requested'),
        (error: any) => console.error('Error requesting session:', error)
      );
    } catch (error) {
      console.error('Error connecting to Cast:', error);
      alert('ไม่สามารถเชื่อมต่อ Google Cast ได้\nกรุณาลองใหม่อีกครั้ง');
    }
  };

  const disconnect = () => {
    const cast = window.chrome?.cast as any;
    if (!cast) return;

    const context = cast.framework.CastContext.getInstance();
    context.endCurrentSession(true);
  };

  // Queue Operations
  const setPlaylist = (newPlaylist: QueueVideo[]) => {
    setPlaylistState(newPlaylist);
    if (isConnected) {
      sendMessage({
        type: 'QUEUE_UPDATE',
        queue: newPlaylist,
        currentIndex: 0,
      });
    }
  };

  const addToQueue = (video: SearchResult | RecommendedVideo) => {
    const newVideo = { ...video, key: Date.now() };
    const newPlaylist = [...playlist, newVideo];
    setPlaylistState(newPlaylist);

    if (isConnected) {
      sendMessage({
        type: 'QUEUE_UPDATE',
        queue: newPlaylist,
        currentIndex,
      });
    }
  };

  const playNow = (video: SearchResult | RecommendedVideo) => {
    const newVideo = { ...video, key: Date.now() };
    const newPlaylist = [newVideo, ...playlist];
    setPlaylistState(newPlaylist);
    setCurrentIndex(0);
    setCurrentVideo(newVideo);

    if (isConnected) {
      sendMessage({
        type: 'PLAY_VIDEO',
        videoId: video.videoId,
        index: 0,
      });
      sendMessage({
        type: 'QUEUE_UPDATE',
        queue: newPlaylist,
        currentIndex: 0,
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
        type: 'QUEUE_UPDATE',
        queue: newPlaylist,
        currentIndex,
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
        type: 'QUEUE_UPDATE',
        queue: newPlaylist,
        currentIndex: index <= currentIndex ? currentIndex + 1 : currentIndex,
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

    if (isConnected) {
      sendMessage({
        type: 'QUEUE_UPDATE',
        queue: newPlaylist,
        currentIndex: newCurrentIndex,
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
        type: 'QUEUE_UPDATE',
        queue: newPlaylist,
        currentIndex,
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
        type: 'QUEUE_UPDATE',
        queue: newPlaylist,
        currentIndex,
      });
    }
  };

  // Player Controls
  const play = () => {
    if (isConnected) {
      sendMessage({ type: 'PLAY' });
    }
  };

  const pause = () => {
    if (isConnected) {
      sendMessage({ type: 'PAUSE' });
    }
  };

  const next = () => {
    if (playlist.length === 0) return;

    const newIndex = Math.min(currentIndex + 1, playlist.length - 1);
    setCurrentIndex(newIndex);
    setCurrentVideo(playlist[newIndex]);

    if (isConnected) {
      sendMessage({ type: 'NEXT' });
    }
  };

  const previous = () => {
    if (playlist.length === 0) return;

    const newIndex = Math.max(currentIndex - 1, 0);
    setCurrentIndex(newIndex);
    setCurrentVideo(playlist[newIndex]);

    if (isConnected) {
      sendMessage({ type: 'PREVIOUS' });
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
