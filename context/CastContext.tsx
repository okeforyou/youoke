import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { RecommendedVideo, SearchResult } from '../types/invidious';
import { addDebugLog } from '../components/DebugOverlay';

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
  updatePlaylistOrder: (playlist: QueueVideo[]) => void; // Update playlist order without reloading (for drag & drop)
  addToQueue: (video: SearchResult | RecommendedVideo) => void;
  playNow: (video: SearchResult | RecommendedVideo) => void;
  playNext: (video: SearchResult | RecommendedVideo) => void;
  jumpToIndex: (index: number) => void; // Jump to specific song in queue without modifying queue
  insertAt: (video: SearchResult | RecommendedVideo, index: number) => void;
  removeAt: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;

  // Player Controls
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;

  // Index Management (for drag & drop reordering)
  updateCurrentIndexSilent: (newIndex: number) => void;
}

const CastContext = createContext<CastContextValue | undefined>(undefined);

// Message namespace for communication (must match receiver)
const CAST_NAMESPACE = 'urn:x-cast:com.youoke.cast';

// Cast message types (must match receiver message handler)
type CastMessage =
  | { type: 'LOAD_VIDEO', videoId: string }
  | { type: 'LOAD_QUEUE', videos: Array<{videoId: string, title: string}>, startIndex?: number }
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
  const [receiverStateReceived, setReceiverStateReceived] = useState(false);  // Track if we got state from receiver

  // Load playlist from localStorage on mount (for resume after app close)
  const [playlist, setPlaylistState] = useState<QueueVideo[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('cast_playlist');
      if (saved) {
        console.log('📂 Loaded playlist from localStorage');
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading playlist from localStorage:', error);
    }
    return [];
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = localStorage.getItem('cast_currentIndex');
      return saved ? parseInt(saved) : 0;
    } catch {
      return 0;
    }
  });

  const [currentVideo, setCurrentVideo] = useState<QueueVideo | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('cast_currentVideo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Refs to access latest state in event handlers (avoid stale closure)
  const playlistRef = useRef<QueueVideo[]>([]);
  const currentVideoRef = useRef<QueueVideo | null>(null);
  const currentIndexRef = useRef<number>(0);

  // Keep refs in sync with state AND save to localStorage
  useEffect(() => {
    playlistRef.current = playlist;
    console.log('🔍 [CastContext] Playlist state updated:', {
      length: playlist.length,
      videos: playlist.map(v => v.title || v.videoId),
    });

    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        if (playlist.length > 0) {
          localStorage.setItem('cast_playlist', JSON.stringify(playlist));
          console.log('💾 Saved playlist to localStorage');
        } else {
          localStorage.removeItem('cast_playlist');
        }
      } catch (error) {
        console.error('Error saving playlist to localStorage:', error);
      }
    }
  }, [playlist]);

  useEffect(() => {
    currentVideoRef.current = currentVideo;

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        if (currentVideo) {
          localStorage.setItem('cast_currentVideo', JSON.stringify(currentVideo));
        } else {
          localStorage.removeItem('cast_currentVideo');
        }
      } catch (error) {
        console.error('Error saving currentVideo to localStorage:', error);
      }
    }
  }, [currentVideo]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cast_currentIndex', currentIndex.toString());
      } catch (error) {
        console.error('Error saving currentIndex to localStorage:', error);
      }
    }
  }, [currentIndex]);

  // Initialize Google Cast API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🎬 CastContext mounted, waiting for Google Cast SDK...');

    // Try immediate initialization first (SDK might already be loaded)
    const immediateCheck = (window as any).cast?.framework;
    if (immediateCheck) {
      console.log('✅ Google Cast SDK already loaded! Initializing immediately...');
      initializeCastApi();
      return;
    }

    let pollCount = 0;
    const maxPolls = 100; // Try for 10 seconds (100 * 100ms) - faster polling

    // Setup callback for when SDK is available
    // Note: This callback fires when cast_sender.js loads, but cast.framework
    // may not be ready yet. We still rely on polling to check for cast.framework.
    window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
      console.log('📡 __onGCastApiAvailable called:', isAvailable);
      // Check immediately if framework is ready
      if (isAvailable && (window as any).cast?.framework) {
        console.log('✅ Cast framework ready via callback! Initializing...');
        clearInterval(pollInterval);
        initializeCastApi();
      }
    };

    // Poll for Cast SDK with faster interval (100ms instead of 500ms)
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
        console.warn('⚠️ Google Cast SDK not loaded after 10 seconds');
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
        // Only log every 10th poll to reduce console spam
        if (pollCount % 10 === 0) {
          console.log(`⏳ Waiting for Cast SDK... (poll #${pollCount}/${maxPolls})`);
        }
      }
    }, 100); // 100ms interval - 5x faster than before!

    return () => {
      clearInterval(pollInterval);
      delete window['__onGCastApiAvailable'];
    };
  }, []);

  // Sync playlist to receiver when reconnecting (after page reload)
  // BUT: Wait for receiver to send its state first! (receiver is source of truth)
  useEffect(() => {
    if (!isConnected || !castSession || playlist.length === 0) return;

    // Wait 1 second for receiver to send RECEIVER_STATE
    const timeout = setTimeout(() => {
      if (receiverStateReceived) {
        console.log('✅ Already got state from receiver - skipping localStorage sync');
        return;
      }

      console.log('📂 No RECEIVER_STATE received - syncing localStorage to receiver:', {
        playlistLength: playlist.length,
        currentIndex,
        hasCurrentVideo: !!currentVideo
      });

      // Send full queue to receiver with startIndex
      const videos = playlist.map(v => ({
        videoId: v.videoId,
        title: v.title || 'Unknown'
      }));

      castSession.sendMessage(
        CAST_NAMESPACE,
        {
          type: 'LOAD_QUEUE',
          videos,
          startIndex: currentIndex
        },
        () => console.log('✅ Playlist synced to receiver:', videos.length, 'videos', 'starting at index:', currentIndex),
        (error: any) => console.error('❌ Error syncing playlist:', error)
      );
    }, 1000); // Wait 1 second for RECEIVER_STATE

    return () => clearTimeout(timeout);
  }, [isConnected, castSession, receiverStateReceived]); // Removed playlist.length - we don't want to reload queue on every add

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
    if (!session) {
      console.error('❌ handleSessionStarted called with null session!');
      addDebugLog('❌ handleSessionStarted: null session');
      return;
    }

    const sessionInfo = {
      deviceName: session.getCastDevice().friendlyName,
      sessionId: session.sessionId,
    };
    console.log('🔌 Session started/resumed:', sessionInfo);
    addDebugLog('🔌 Session started/resumed', sessionInfo);

    // IMPORTANT: Remove old listener before adding new one to prevent duplicates
    try {
      session.removeMessageListener(CAST_NAMESPACE);
      console.log('✅ Removed old message listener');
      addDebugLog('✅ Removed old message listener');
    } catch (e) {
      console.log('ℹ️ No old listener to remove (first connection)');
      addDebugLog('ℹ️ First connection - no old listener');
    }

    setCastSession(session);
    setIsConnected(true);
    setReceiverName(session.getCastDevice().friendlyName);

    // Reset receiver state flag to trigger re-sync
    setReceiverStateReceived(false);

    // Setup message listener
    session.addMessageListener(CAST_NAMESPACE, (namespace: string, message: string) => {
      console.log('📨 Received message from receiver:', message);

      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case 'RECEIVER_STATE':
            // Receiver sent its current state - use it instead of localStorage!
            console.log('📥 Received state from receiver:', data);
            addDebugLog('📥 RECEIVER_STATE received', {
              queueLength: data.queue?.length || 0,
              currentIndex: data.currentIndex,
            });

            if (data.queue && data.queue.length > 0) {
              // Convert receiver's queue format to our playlist format
              const receiverPlaylist: QueueVideo[] = data.queue.map((v: any, index: number) => ({
                videoId: v.videoId,
                title: v.title || 'Unknown',
                key: Date.now() + index
              }));

              const syncInfo = {
                queueLength: receiverPlaylist.length,
                currentIndex: data.currentIndex,
                currentVideo: data.currentVideoId
              };
              console.log('✅ Syncing state FROM receiver:', syncInfo);
              addDebugLog('✅ Synced FROM receiver', syncInfo);

              // Update our state to match receiver
              setPlaylistState(receiverPlaylist);
              playlistRef.current = receiverPlaylist;

              setCurrentIndex(data.currentIndex);
              currentIndexRef.current = data.currentIndex;

              const currentVid = receiverPlaylist[data.currentIndex];
              if (currentVid) {
                setCurrentVideo(currentVid);
                currentVideoRef.current = currentVid;
              }

              // Mark that we received state from receiver (don't overwrite it!)
              setReceiverStateReceived(true);
            } else {
              console.log('⚠️ Receiver has empty queue - will send our playlist');
              setReceiverStateReceived(false);  // Receiver empty, we can send our playlist
            }
            break;

          case 'VIDEO_ENDED':
            console.log('🎬 Video ended on receiver:', data.videoId, 'at index:', data.currentIndex);
            // Remove the ended video from playlist
            const latestPlaylist = playlistRef.current;
            const endedIndex = data.currentIndex;

            console.log('🔍 [VIDEO_ENDED] Before removal:', {
              latestPlaylistLength: latestPlaylist.length,
              endedIndex,
              videoToRemove: latestPlaylist[endedIndex]?.title || latestPlaylist[endedIndex]?.videoId,
            });

            if (latestPlaylist.length > 0 && endedIndex < latestPlaylist.length) {
              // Remove video that just ended
              const newPlaylist = [...latestPlaylist];
              newPlaylist.splice(endedIndex, 1);

              console.log('🔍 [VIDEO_ENDED] After removal:', {
                newPlaylistLength: newPlaylist.length,
                remainingVideos: newPlaylist.map(v => v.title || v.videoId),
              });

              console.log('🗑️ Removing video from queue. Remaining:', newPlaylist.length);
              setPlaylistState(newPlaylist);
              playlistRef.current = newPlaylist;

              // Send updated queue to receiver
              if (newPlaylist.length > 0) {
                const videos = newPlaylist.map(v => ({
                  videoId: v.videoId,
                  title: v.title || 'Unknown'
                }));
                session.sendMessage(
                  CAST_NAMESPACE,
                  { type: 'UPDATE_QUEUE', videos },
                  () => console.log('✅ Updated queue sent after VIDEO_ENDED:', videos.length, 'videos'),
                  (error: any) => console.error('❌ Error sending updated queue:', error)
                );

                // Play next video if available (at same index, since we just deleted the current one)
                if (endedIndex < newPlaylist.length) {
                  const nextVideo = newPlaylist[endedIndex];
                  console.log('▶️ Playing next video:', nextVideo.title);
                  setCurrentIndex(endedIndex);
                  currentIndexRef.current = endedIndex;
                  setCurrentVideo(nextVideo);
                  currentVideoRef.current = nextVideo;

                  session.sendMessage(
                    CAST_NAMESPACE,
                    { type: 'LOAD_VIDEO', videoId: nextVideo.videoId },
                    () => console.log('✅ Next video sent:', nextVideo.videoId),
                    (error: any) => console.error('❌ Error sending next video:', error)
                  );
                } else {
                  console.log('📭 Queue finished');
                  setCurrentIndex(0);
                  currentIndexRef.current = 0;
                  setCurrentVideo(null);
                  currentVideoRef.current = null;
                }
              } else {
                // Queue empty
                console.log('📭 Queue empty');
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

    console.log('✅ Cast session started/resumed:', session.getCastDevice().friendlyName);

    // Don't send LOAD_QUEUE here - let the useEffect (line 250-279) handle it after waiting for RECEIVER_STATE
    // This prevents sending LOAD_QUEUE when resuming from background (which would restart the video)
    console.log('⏳ Waiting for RECEIVER_STATE from receiver before syncing...');
  };

  const handleSessionEnded = () => {
    setCastSession(null);
    setIsConnected(false);
    setReceiverName('');
    setReceiverStateReceived(false);  // Reset flag for next connection
    console.log('Cast session ended');
  };

  // Send message to receiver
  const sendMessage = (message: CastMessage) => {
    console.log('🎯 sendMessage called:', {
      type: message.type,
      isConnected,
      hasCastSession: !!castSession,
      sessionId: castSession?.sessionId,
    });

    if (!castSession) {
      console.error('❌ No cast session available!', {
        isConnected,
        castSessionExists: !!castSession,
      });
      console.error('❌ Please reconnect to Cast');
      return;
    }

    try {
      console.log('📤 Sending message to receiver...', message);
      castSession.sendMessage(
        CAST_NAMESPACE,
        message,
        () => console.log('✅ Message sent successfully:', message.type),
        (error) => console.error('❌ Error sending message:', error)
      );
    } catch (error) {
      console.error('❌ Exception when sending message:', error);
    }
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
    console.log('🔌 Disconnect called');

    const cast = (window as any).cast;
    if (!cast) {
      console.error('❌ Cast API not available');
      return;
    }

    try {
      const context = cast.framework.CastContext.getInstance();
      console.log('📡 Ending current session...');
      context.endCurrentSession(true);
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  };

  // Queue Operations
  const setPlaylist = (newPlaylist: QueueVideo[]) => {
    setPlaylistState(newPlaylist);
    playlistRef.current = newPlaylist; // ✅ Update ref immediately!
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
    playlistRef.current = newPlaylist; // ✅ Update ref immediately!

    console.log('🔍 [addToQueue] Playlist updated:', {
      oldLength: playlist.length,
      newLength: newPlaylist.length,
      addedVideo: video.title || video.videoId,
    });

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
    playlistRef.current = newPlaylist; // ✅ Update ref immediately!
    setCurrentIndex(0);
    currentIndexRef.current = 0; // ✅ Update ref immediately!
    setCurrentVideo(newVideo);
    currentVideoRef.current = newVideo; // ✅ Update ref immediately!

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

  const jumpToIndex = (index: number) => {
    // Use refs to get latest state
    const latestPlaylist = playlistRef.current;

    console.log('🎯 jumpToIndex() called, index:', index, 'playlist.length:', latestPlaylist.length, 'isConnected:', isConnected);

    if (index < 0 || index >= latestPlaylist.length) {
      console.warn('⚠️ Invalid index:', index);
      return;
    }

    const video = latestPlaylist[index];
    console.log('📍 Jumping to video:', video.title || video.videoId);

    // Update state and refs
    setCurrentIndex(index);
    currentIndexRef.current = index;
    setCurrentVideo(video);
    currentVideoRef.current = video;

    if (isConnected) {
      // Send LOAD_VIDEO to play the video at this index
      sendMessage({
        type: 'LOAD_VIDEO',
        videoId: video.videoId,
      });
    } else {
      console.warn('⚠️ Not connected! Cannot jump to video');
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
    playlistRef.current = newPlaylist; // ✅ Update ref immediately!

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
    playlistRef.current = newPlaylist; // ✅ Update ref immediately!

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
    console.log('🔍 [removeAt] Removing video at index:', index, 'of', playlist.length);

    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylistState(newPlaylist);
    playlistRef.current = newPlaylist; // ✅ Update ref immediately!

    console.log('🔍 [removeAt] Playlist updated:', {
      oldLength: playlist.length,
      newLength: newPlaylist.length,
      removedIndex: index,
    });

    // Adjust current index if needed
    let newCurrentIndex = currentIndex;
    if (index < currentIndex) {
      newCurrentIndex = currentIndex - 1;
    } else if (index === currentIndex) {
      newCurrentIndex = Math.min(currentIndex, newPlaylist.length - 1);
    }
    setCurrentIndex(newCurrentIndex);
    currentIndexRef.current = newCurrentIndex; // ✅ Update ref immediately!

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
    playlistRef.current = newPlaylist; // ✅ Update ref immediately!

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
    playlistRef.current = newPlaylist; // ✅ Update ref immediately!

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
    currentIndexRef.current = newIndex; // ✅ Update ref immediately!
    setCurrentVideo(latestPlaylist[newIndex]);
    currentVideoRef.current = latestPlaylist[newIndex]; // ✅ Update ref immediately!

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
    currentIndexRef.current = newIndex; // ✅ Update ref immediately!
    setCurrentVideo(latestPlaylist[newIndex]);
    currentVideoRef.current = latestPlaylist[newIndex]; // ✅ Update ref immediately!

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

  // Update current index silently (for drag & drop reordering) without sending message to receiver
  const updateCurrentIndexSilent = (newIndex: number) => {
    const latestPlaylist = playlistRef.current;

    if (newIndex < 0 || newIndex >= latestPlaylist.length) {
      console.warn('⚠️ Invalid index for silent update:', newIndex);
      return;
    }

    console.log('🔄 Updating currentIndex silently:', currentIndexRef.current, '→', newIndex);
    setCurrentIndex(newIndex);
    currentIndexRef.current = newIndex;
    setCurrentVideo(latestPlaylist[newIndex]);
    currentVideoRef.current = latestPlaylist[newIndex];
  };

  // Update playlist order (for drag & drop) - sends UPDATE_QUEUE instead of LOAD_QUEUE
  // This prevents the receiver from restarting the current video
  const updatePlaylistOrder = (newPlaylist: QueueVideo[]) => {
    console.log('🔄 Updating playlist order (drag & drop):', newPlaylist.length, 'items');
    setPlaylistState(newPlaylist);
    playlistRef.current = newPlaylist;

    if (isConnected && newPlaylist.length > 0) {
      console.log('📤 Sending UPDATE_QUEUE to receiver...');
      sendMessage({
        type: 'UPDATE_QUEUE', // Use UPDATE_QUEUE instead of LOAD_QUEUE to avoid restarting video
        videos: newPlaylist.map(v => ({
          videoId: v.videoId,
          title: v.title || 'Unknown'
        })),
      });
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
    updatePlaylistOrder,
    addToQueue,
    playNow,
    playNext,
    jumpToIndex,
    insertAt,
    removeAt,
    moveUp,
    moveDown,
    play,
    pause,
    next,
    previous,
    updateCurrentIndexSilent,
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
