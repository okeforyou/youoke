import { createContext, useContext, useEffect, useState, useRef, ReactNode, useMemo } from 'react';
import { RecommendedVideo, SearchResult } from '../../../types/invidious';
import { addDebugLog } from '../../../components/DebugOverlay';
import { usePlayerStore } from '../../../modules/player/stores/usePlayerStore';
import { createLogger } from '../../../utils/logger';
import { QueueItem } from '../../../modules/player/types';

import { generateUUID } from '../../../modules/player/utils';

interface CastContextValue {
  // Connection State
  isAvailable: boolean;
  isConnected: boolean;
  castSession: chrome.cast.Session | null;
  receiverName: string;
  connectionQuality: 'good' | 'weak' | 'lost';

  // Queue State
  playlist: QueueItem[]; // Changed from QueueVideo
  currentIndex: number;
  currentVideo: QueueItem | null; // Changed from QueueVideo

  // Connection Actions
  connect: (initialPlaylist?: QueueItem[]) => void; // Changed
  disconnect: () => void;

  // Queue Operations
  setPlaylist: (playlist: QueueItem[]) => void;
  updatePlaylistOrder: (playlist: QueueItem[]) => void; // Update playlist order without reloading (for drag & drop)
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

  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  seekTo: (time: number) => void;

  // Index Management (for drag & drop reordering)
  updateCurrentIndexSilent: (newIndex: number) => void;
}

const CastContext = createContext<CastContextValue | undefined>(undefined);

// Message namespace for communication (must match receiver)
const CAST_NAMESPACE = 'urn:x-cast:com.youoke.cast';
const logger = createLogger('CastContext');

// Cast message types (must match receiver message handler)
type CastMessage =
  | { type: 'LOAD_VIDEO', videoId: string, title?: string, author?: string, thumbnail?: string }
  | { type: 'LOAD_QUEUE', videos: Array<{ videoId: string, title: string }>, startIndex?: number }
  | { type: 'UPDATE_QUEUE', videos: Array<{ videoId: string, title: string }>, currentIndex?: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'ADD_ITEM', video: { videoId: string, title: string } }
  | { type: 'REMOVE_ITEM', index: number }
  | { type: 'MOVE_ITEM', fromIndex: number, toIndex: number }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'SEEK', time: number }
  | { type: 'SET_VOLUME', volume: number }
  | { type: 'SET_MUTED', muted: boolean };

export function CastProvider({ children }: { children: ReactNode }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('youoke_is_casting_google') === 'true' || 
             localStorage.getItem('youoke_cast_mode') === 'smarttv';
    }
    return false;
  });
  const [castSession, setCastSession] = useState<any>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverStateReceived, setReceiverStateReceived] = useState(false);  // Track if we got state from receiver
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'weak' | 'lost'>('good');
  const lastPongTimeRef = useRef<number>(Date.now());

  // Use Global Store as Source of Truth
  const {
    queue: playlist,
    currentIndex,
    currentVideo,
    reorderQueue,
    setCurrentIndex,
    addToQueue: storeAddToQueue, // Rename to avoid conflict with local addToQueue
    reorderQueue: storeSetQueue, // Use reorderQueue as setQueue
    playVideoAtIndex,
    removeVideoAtIndex,
    insertVideoAtIndex,
    moveVideo,
  } = usePlayerStore();

  // Refs for callbacks to access latest state without deps
  const playlistRef = useRef(playlist);
  const currentIndexRef = useRef(currentIndex);
  const currentVideoRef = useRef(currentVideo);

  // Track last index received from Chromecast to prevent echo loops
  const lastReceivedIndexRef = useRef<number>(-1);
  const lastActiveTimeRef = useRef<number>(Date.now()); // v5.0.4: Track background time
  const recoveryIntervalRef = useRef<NodeJS.Timeout | null>(null); // v5.4.5: Track recovery timer for explicit cleanup

  // Sync refs with store changes
  useEffect(() => {
    playlistRef.current = playlist;
    currentIndexRef.current = currentIndex;
    currentVideoRef.current = currentVideo;
    logger.debug('🔍 [CastContext] Playlist state updated:', {
      length: playlist.length,
      videos: playlist.map(v => v.title || v.videoId),
    });
  }, [playlist, currentIndex, currentVideo]);

  // Initialize Google Cast API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    logger.log('🎬 CastContext mounted, waiting for Google Cast SDK...');

    // Try immediate initialization first (SDK might already be loaded)
    const immediateCheck = (window as any).cast?.framework;
    if (immediateCheck) {
      logger.log('✅ Google Cast SDK already loaded! Initializing immediately...');
      initializeCastApi();
      return;
    }

    let pollCount = 0;
    const maxPolls = 100; // Try for 10 seconds (100 * 100ms) - faster polling

    // Setup callback for when SDK is available
    // Note: This callback fires when cast_sender.js loads, but cast.framework
    // may not be ready yet. We still rely on polling to check for cast.framework.
    window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
      logger.debug('📡 __onGCastApiAvailable called:', isAvailable);
      // Check immediately if framework is ready
      if (isAvailable && (window as any).cast?.framework) {
        logger.log('✅ Cast framework ready via callback! Initializing...');
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
        logger.debug(`🔍 Debug (poll #${pollCount}):`, JSON.stringify(debugInfo, null, 2));
        console.log(`🔍 window.chrome.cast:`, !!chromeCast);
        console.log(`🔍 window.cast:`, !!(window as any).cast);
        console.log(`🔍 window.cast.framework:`, !!castFramework);
        if (castFramework) {
          console.log(`🔍 cast.framework properties:`, Object.keys(castFramework).join(', '));
        }
      }

      if (castFramework) {
        logger.log(`✅ Google Cast SDK detected (poll #${pollCount})`);
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
          logger.debug(`⏳ Waiting for Cast SDK... (poll #${pollCount}/${maxPolls})`);
        }
      }
    }, 100); // 100ms interval - 5x faster than before!

    return () => {
      clearInterval(pollInterval);
      // usage of delete on window property
      const win = window as any;
      delete win['__onGCastApiAvailable'];
    };
  }, []);

  // Sync playlist to receiver when reconnecting (after page reload)
  // BUT: Wait for receiver to send its state first! (receiver is source of truth)
  // Retry mechanism added to ensure Receiver gets the message even if it's slow to load
  useEffect(() => {
    if (!isConnected || !castSession || playlist.length === 0) return;

    const syncQueueToReceiver = (attemptFn: number) => {
      if (receiverStateReceived) {
        console.log('✅ Already got state from receiver - skipping localStorage sync');
        return;
      }

      logger.log(`📂 [Attempt ${attemptFn}] Syncing localStorage to receiver:`, {
        playlistLength: playlist.length,
        currentIndex,
        hasCurrentVideo: !!currentVideo
      });

      // Send full queue to receiver with startIndex
      const videos = playlist.map(v => ({
        videoId: v.videoId || v.id || '',
        title: v.title || 'Unknown'
      }));

      castSession.sendMessage(
        CAST_NAMESPACE,
        {
          type: 'LOAD_QUEUE',
          videos,
          startIndex: currentIndex
        },
        () => console.log(`✅ [Attempt ${attemptFn}] Playlist synced to receiver`),
        (error: any) => console.error(`❌ [Attempt ${attemptFn}] Error syncing playlist:`, error)
      );
    };

    // Retry schedule: 1s, 3s, 5s
    const t1 = setTimeout(() => syncQueueToReceiver(1), 1000);
    const t2 = setTimeout(() => syncQueueToReceiver(2), 3000);
    const t3 = setTimeout(() => syncQueueToReceiver(3), 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isConnected, castSession, receiverStateReceived, playlist, currentIndex]); // Removed currentVideo to avoid unnecessary resets


  const initializeCastApi = () => {
    logger.log('🎬 Initializing Google Cast API...');

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

    let context: any;
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
      logger.log('✅ Google Cast SDK initialized successfully!');
      console.log('📱 Application ID:', applicationId);

      // v5.4.7: Persistent UI Recovery
      // Check if we were casting before the app was suspended/reloaded
      const wasCasting = localStorage.getItem('youoke_is_casting_google') === 'true';
      const currentSession = context.getCurrentSession();
      
      if (wasCasting && !currentSession) {
        logger.log('🔄 [Boot] Was casting but session is null. Starting aggressive boot-up poll...');
        setIsConnected(true); // Show UI immediately
        
        let bootPoll = 0;
        const bootInterval = setInterval(() => {
          bootPoll++;
          const session = context.getCurrentSession();
          if (session) {
            logger.log('✅ [Boot] Session recovered via boot-poll!');
            clearInterval(bootInterval);
            handleSessionStarted(session);
          } else if (bootPoll >= 30) { // Give up after 60s of boot-polling
            logger.log('❌ [Boot] Failed to recover session after 60s.');
            clearInterval(bootInterval);
            setIsConnected(false);
            localStorage.removeItem('youoke_is_casting_google');
          }
        }, 2000);
      }
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
    logger.log('🔌 Session started/resumed:', sessionInfo);
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
    localStorage.setItem('youoke_is_casting_google', 'true'); // v5.4.7: Remember session status

    // Reset receiver state flag to trigger re-sync
    setReceiverStateReceived(false);

    // v4.9.40: Proactive Session Sync (Request current state from TV)
    try {
      session.sendMessage(CAST_NAMESPACE, { type: 'GET_STATE' });
      addDebugLog('📤 Sent GET_STATE to trigger receiver sync');
    } catch (e) {
      console.warn('⚠️ Could not send GET_STATE immediately');
    }

    // Removed invalid hooks from here (moved to top-level of CastProvider)


    // Setup message listener
    session.addMessageListener(CAST_NAMESPACE, (namespace: string, message: string) => {
      logger.debug('📨 Received message from receiver:', message);

      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case 'RECEIVER_READY':
            console.log('🤝 Handshake: Receiver is ready!');
            addDebugLog('🤝 Handshake: Receiver READY');

            // Immediate Sync
            const currentQueue = playlistRef.current;
            const currentIndex = currentIndexRef.current;

            if (currentQueue.length > 0) {
              const videos = currentQueue.map(v => ({
                videoId: v.videoId || v.id || '',
                title: v.title || 'Unknown'
              }));

              session.sendMessage(
                CAST_NAMESPACE,
                {
                  type: 'LOAD_QUEUE',
                  videos,
                  startIndex: currentIndex
                },
                () => console.log('✅ [Handshake] Playlist synced to receiver:', videos.length),
                (error: any) => console.error('❌ [Handshake] Error syncing playlist:', error)
              );
            }
            break;

          case 'RECEIVER_STATE':
            // Receiver sent its current state - use it instead of localStorage!
            console.log('📥 Received state from receiver:', data);

            // 3. Sync In: Cast Receiver -> Local Store
            if (typeof data.currentIndex === 'number') {
              const currentState = usePlayerStore.getState();
              
              // 🛡️ Echo Filter: Only update if the receiver state is truly DIFFERENT from our local state
              // AND it's not the same value we just sent out recently
              if (data.currentIndex !== currentState.currentIndex && data.currentIndex !== lastReceivedIndexRef.current) {
                logger.log('🔄 [Sync In] Updating Store Index to:', data.currentIndex);
                lastReceivedIndexRef.current = data.currentIndex;
                currentState.setCurrentIndex(data.currentIndex);
              } else {
                console.log('⚡ [Sync In] Index matches local - skipping update to prevent echo');
              }
            }

            addDebugLog('📥 RECEIVER_STATE processed', {
              queueLength: data.queue?.length || 0,
              currentIndex: data.currentIndex,
            });

            // (Legacy internal state update - keep for safety or remove if standardizing on store)
            // For now, minimizing disruption by keeping internal state sync as well
            if (data.queue && data.queue.length > 0) {
              const receiverPlaylist: QueueItem[] = data.queue.map((v: any, index: number) => ({
                videoId: v.videoId,
                title: v.title || 'Unknown',
                author: 'Unknown', // Fallback
                uuid: generateUUID(),
                key: Date.now() + index
              }));

              storeSetQueue(receiverPlaylist); // Update the store's queue
              setCurrentIndex(data.currentIndex); // Update the store's current index
            }
            break;


          // ... (Rest of switch) ...

          case 'PONG':
          // logger.log('📡 [Sender] Received PONG from TV');
          lastPongTimeRef.current = Date.now();
          setConnectionQuality('good');
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
              removeVideoAtIndex(endedIndex); // Use store action

              const newPlaylist = playlistRef.current; // Get updated playlist from ref after store action

              console.log('🔍 [VIDEO_ENDED] After removal:', {
                newPlaylistLength: newPlaylist.length,
                remainingVideos: newPlaylist.map(v => v.title || v.videoId),
              });

              console.log('🗑️ Removing video from queue. Remaining:', newPlaylist.length);

              // Send updated queue to receiver
              if (newPlaylist.length > 0) {
                const videos = newPlaylist.map(v => ({
                  videoId: v.videoId || v.id || '',
                  title: v.title || v.videoId || 'Unknown'
                }));

                // Play next video if available (at same index, since we just deleted the current one)
                if (endedIndex < newPlaylist.length) {
                  const nextVideo = newPlaylist[endedIndex];
                  console.log('▶️ Playing next video:', nextVideo.title);
                  setCurrentIndex(endedIndex); // Update store

                  // Send atomic sync command
                  session.sendMessage(
                    CAST_NAMESPACE,
                    {
                      type: 'LOAD_QUEUE',
                      videos,
                      startIndex: endedIndex,
                      isPlaying: true
                    },
                    () => console.log('✅ Next video and updated queue sent:', nextVideo.videoId),
                    (error: any) => console.error('❌ Error sending next video state:', error)
                  );
                } else {
                  console.log('📭 Queue finished');
                  setCurrentIndex(0); // Update store

                  // Sync empty state
                  session.sendMessage(
                    CAST_NAMESPACE,
                    { type: 'UPDATE_QUEUE', videos },
                    () => console.log('✅ Finished queue state synced'),
                    (error: any) => console.error('❌ Error syncing finished queue:', error)
                  );
                }
              } else {
                // Queue empty
                console.log('📭 Queue empty');
                setCurrentIndex(0); // Update store
                // setCurrentVideo(null); // Removed as currentVideo is from store
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
    setReceiverStateReceived(false);
    localStorage.removeItem('youoke_is_casting_google'); // v5.4.7: Clear status
    
    // v5.0.4: Force reset castMode in global state to fix disconnect button stuck
    import('@/stores/useUIStore').then(({ useUIStore }) => {
      // If we are in 'google' mode, reset it to 'none'
      // We do this via the store directly so MainLayout reacts
    });

    console.log('Cast session ended');
  };

  // v4.9.40: Global Session Recovery Listener
  // Automatically re-binds listeners when the mobile device wakes up from sleep
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible') {
        const sleepDuration = now - lastActiveTimeRef.current;
        logger.log(`📱 Screen woke up! (Slept for ${Math.round(sleepDuration/1000)}s). Checking Cast health...`);
        
        const cast = (window as any).cast;
        if (!cast?.framework) return;

        // v5.3.99: Fix: CastReceiverContext is for TV receivers, NOT senders. Always use CastContext here.
        const context = cast.framework.CastContext.getInstance();
        const activeSession = context.getCurrentSession();
        
        // v5.0.4: Enhanced Discovery & Recovery
        if (activeSession) {
          logger.log('🔄 Session active. Re-binding and requesting fresh state...');
          handleSessionStarted(activeSession);
          
          // CRITICAL: Request state from TV FIRST instead of sending our (maybe stale) local queue
          setTimeout(() => {
            try { activeSession.sendMessage(CAST_NAMESPACE, { type: 'GET_STATE' }); } catch(e) {}
          }, 500);
        } else if (isConnected || sleepDuration > 1200000) {
          // v5.4.9: Deep Wake-up Pulse (Matching /remote behavior)
          logger.log('💓 Screen Awake: Triggering Deep SDK Recon...');
          
          try {
            const cast = (window as any).cast;
            if (cast?.framework) {
              const ctx = cast.framework.CastContext.getInstance();
              ctx.setOptions({
                autoJoinPolicy: (window as any).chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
                receiverApplicationId: '4FB4C174'
              });
            }
          } catch(e) { /* ignore */ }

          let pollCount = 0;
          const maxPolls = 600; 
          
          if (recoveryIntervalRef.current) clearInterval(recoveryIntervalRef.current);

          const recoveryInterval = setInterval(() => {
            pollCount++;
            const recoveredSession = context.getCurrentSession();
            
            if (recoveredSession) {
              logger.log(`✅ Session recovered successfully after ${pollCount * 2}s!`);
              clearInterval(recoveryInterval);
              recoveryIntervalRef.current = null;
              handleSessionStarted(recoveredSession);
              setTimeout(() => {
                try { recoveredSession.sendMessage(CAST_NAMESPACE, { type: 'GET_STATE' }); } catch(e) {}
              }, 500);
            } else if (pollCount >= maxPolls) {
              logger.log('❌ Failed to recover session after 20 minutes. Disconnecting.');
              clearInterval(recoveryInterval);
              recoveryIntervalRef.current = null;
              setIsConnected(false);
              setCastSession(null);
              localStorage.removeItem('youoke_is_casting_google');
            }
          }, 2000); 

          recoveryIntervalRef.current = recoveryInterval;
        }
      }
      lastActiveTimeRef.current = now;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Page Lifecycle API - Reliable for Android/iOS Chrome
    window.addEventListener('resume', handleVisibilityChange);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) handleVisibilityChange();
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resume', handleVisibilityChange);
    };
  }, [isConnected]); // Keep dependency on isConnected for the fallback reset logic

  // v5.0.3: Connection Heartbeat
  // Keeps the session active and detects drops early
  useEffect(() => {
    if (!isConnected) return;
    
    const heartbeat = setInterval(() => {
      const cast = (window as any).cast;
      if (!cast?.framework) return;
      
      const context = cast.framework.CastContext.getInstance();
      const session = context.getCurrentSession();
      
      if (session) {
        try {
          session.sendMessage(CAST_NAMESPACE, { type: 'PING' });
          logger.debug('💓 Heartbeat sent (PING)');

          // v5.0.5: Check Connection Quality based on PONG delay
          const elapsedSinceLastPong = Date.now() - lastPongTimeRef.current;
          if (elapsedSinceLastPong < 40000) {
            setConnectionQuality('good');
          } else if (elapsedSinceLastPong < 95000) {
            setConnectionQuality('weak');
          } else {
            setConnectionQuality('lost');
          }
        } catch(e) {
          logger.warn('⚠️ Heartbeat failed');
        }
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(heartbeat);
  }, [isConnected]);

  // Send message to receiver
  const sendMessage = (message: CastMessage) => {
    // v4.9.40: Dynamic Session Refresh
    // Don't just rely on state, get the freshest session from the framework
    const currentSession = (window as any).cast?.framework?.CastContext.getInstance().getCurrentSession() || castSession;

    if (!currentSession) {
      console.error('❌ No active cast session found!', {
        isConnected,
        castSessionExists: !!castSession,
        currentFrameworkSession: !!(window as any).cast?.framework?.CastContext.getInstance().getCurrentSession()
      });
      return;
    }

    try {
      logger.debug('📤 Sending message to receiver...', message);
      currentSession.sendMessage(
        CAST_NAMESPACE,
        message,
        () => console.log('✅ Message sent successfully:', message.type),
        (error: any) => {
          console.error('❌ Error sending message:', error);
          if (error && error.code === 'session_error') {
            console.log('🔄 Attempting to re-sync session due to error...');
            setIsConnected(false);
          }
        }
      );
    } catch (error) {
      console.error('❌ Exception when sending message:', error);
    }
  };

  // Connection Actions
  const connect = (initialPlaylist?: QueueItem[]) => {
    const cast = (window as any).cast;
    if (!cast || !cast.framework) {
      console.error('Google Cast SDK not loaded yet. Please wait a moment and try again.');
      alert('กรุณารอสักครู่และลองใหม่อีกครั้ง\n(Google Cast SDK กำลังโหลด...)');
      return;
    }

    // If initialPlaylist provided, set it immediately before connecting
    if (initialPlaylist && initialPlaylist.length > 0) {
      console.log('📋 Setting initial playlist before connecting:', initialPlaylist.length, 'videos');
      // Map to QueueItems with UUIDs
      const queueItems: QueueItem[] = initialPlaylist.map(v => ({
        ...v,
        author: v.author || 'Unknown',
        uuid: v.uuid || generateUUID()
      }));
      storeSetQueue(queueItems); // Use store action
      // Set first video as current if not set
      if (!currentVideo) {
        setCurrentIndex(0); // Set current index in store
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
    console.log('🔌 [CastContext] Disconnect called (Force Cleanup enabled)');

    // v5.4.5: Immediate cleanup to prevent Ghost States
    if (recoveryIntervalRef.current) {
      clearInterval(recoveryIntervalRef.current);
      recoveryIntervalRef.current = null;
    }

    // Force local state to disconnected immediately
    setIsConnected(false);
    setCastSession(null);
    setReceiverName('');
    setReceiverStateReceived(false);
    localStorage.removeItem('youoke_is_casting_google'); // v5.4.7: Clear status

    const cast = (window as any).cast;
    if (!cast) {
      console.error('❌ Cast API not available during disconnect');
      return;
    }

    try {
      const context = cast.framework.CastContext.getInstance();
      console.log('📡 Ending current SDK session...');
      // This will trigger SESSION_ENDED but we already cleared local state for responsiveness
      context.endCurrentSession(true);
    } catch (error) {
      console.error('❌ Error notifying SDK of disconnect:', error);
    }
  };

  // Queue Operations
  const setPlaylist = (newPlaylist: QueueItem[]) => {
    // Ensure UUIDs exist
    const queueWithUuids: QueueItem[] = newPlaylist.map(v => ({
      ...v,
      author: v.author || 'Unknown',
      uuid: v.uuid || generateUUID()
    }));
    storeSetQueue(queueWithUuids); // Use store action
    if (isConnected && newPlaylist.length > 0) {
      sendMessage({
        type: 'LOAD_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId || v.id || '',
          title: v.title || 'Unknown'
        })),
      });
    }
  };

  const addToQueue = (video: SearchResult | RecommendedVideo) => {
    // Adapt to Video/QueueItem type
    const videoToAdd: QueueItem = {
      ...video,
      id: video.videoId, // Map videoId to id
      sourceType: 'youtube', // Default
      author: video.author || 'Unknown',
      uuid: generateUUID()
    };

    storeAddToQueue(videoToAdd); // Use store action

    const newPlaylist = playlistRef.current; // Get updated playlist from ref after store action

    console.log('🔍 [addToQueue] Playlist updated:', {
      oldLength: playlist.length,
      newLength: newPlaylist.length,
      addedVideo: video.title || video.videoId,
    });

    if (isConnected) {
      console.log('📤 Sending ADD_ITEM to receiver...');
      sendMessage({
        type: 'ADD_ITEM',
        video: {
          videoId: video.videoId,
          title: video.title || 'Unknown'
        }
      });
    } else {
      console.warn('⚠️ Not connected! Queue not sent to TV');
    }
  };

  const playNow = (video: SearchResult | RecommendedVideo) => {
    const newVideo = { ...video, uuid: generateUUID() };
    const newPlaylist = [newVideo, ...playlist];

    // Ensure all items have UUIDs and required properties
    const queueItems: QueueItem[] = newPlaylist.map(v => ({
      ...v,
      id: v.videoId || (v as any).id || '',
      sourceType: (v as any).sourceType || 'youtube',
      author: v.author || 'Unknown',
      uuid: v.uuid || generateUUID()
    }));

    storeSetQueue(queueItems); // Use store action
    setCurrentIndex(0); // Use store action
    // setCurrentVideo(newVideo); // Removed as currentVideo is from store

    if (isConnected) {
      // Send LOAD_VIDEO to start playing immediately
      sendMessage({
        type: 'LOAD_VIDEO',
        videoId: video.videoId || (video as any).id || '',
      });
      // Send full queue for reference
      sendMessage({
        type: 'LOAD_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId || (v as any).id || '',
          title: v.title || 'Unknown'
        })).filter(v => v.videoId || (v as any).id),
      });
    }
  };

  const jumpToIndex = (index: number) => {
    // Use refs to avoid stale state in callbacks
    const latestPlaylist = playlistRef.current;

    if (index >= 0 && index < latestPlaylist.length) {
      console.log('📍 Jumping to index:', index, 'videoId:', latestPlaylist[index]?.videoId);

      setCurrentIndex(index); // Use store action

      if (isConnected) {
        sendMessage({
          type: 'UPDATE_QUEUE',
          videos: latestPlaylist.map(v => ({
            videoId: v.videoId || v.id || '',
            title: v.title || v.id || 'Unknown',
            author: v.author || 'Unknown',
            thumbnail: v.thumbnail || ''
          })),
          currentIndex: index
        });
      } else {
        console.warn('⚠️ Not connected! Cannot jump to video');
      }
    }
  };
  const playNext = (video: SearchResult | RecommendedVideo) => {
    const newVideo: QueueItem = {
      ...video,
      id: video.videoId,
      sourceType: 'youtube',
      author: video.author || 'Unknown',
      uuid: generateUUID()
    };
    insertVideoAtIndex(currentIndex + 1, newVideo); // Use store action

    const newPlaylist = playlistRef.current; // Get updated playlist from ref after store action

    if (isConnected) {
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId || (v as any).id || '',
          title: v.title || 'Unknown'
        })).filter(v => v.videoId || (v as any).id),
      });
    }
  };

  const insertAt = (video: SearchResult | RecommendedVideo, index: number) => {
    const newVideo: QueueItem = {
      ...video,
      id: video.videoId,
      sourceType: 'youtube',
      author: video.author || 'Unknown',
      uuid: generateUUID()
    };
    insertVideoAtIndex(index, newVideo); // Use store action

    const newPlaylist = playlistRef.current; // Get updated playlist from ref after store action

    if (isConnected) {
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId || (v as any).id || '',
          title: v.title || 'Unknown'
        })).filter(v => v.videoId || (v as any).id),
      });
    }
  };

  const removeAt = (index: number) => {
    console.log('🔍 [removeAt] Removing video at index:', index, 'of', playlist.length);

    removeVideoAtIndex(index); // Use store action

    const newPlaylist = playlistRef.current; // Get updated playlist from ref after store action

    console.log('🔍 [removeAt] Playlist updated:', {
      oldLength: playlist.length,
      newLength: newPlaylist.length,
      removedIndex: index,
    });

    if (isConnected) {
      sendMessage({
        type: 'REMOVE_ITEM',
        index: index
      });
    }
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;

    moveVideo(index, index - 1); // Use store action

    const newPlaylist = playlistRef.current; // Get updated playlist from ref after store action

    if (isConnected) {
      sendMessage({
        type: 'MOVE_ITEM',
        fromIndex: index,
        toIndex: index - 1
      });
    }
  };

  const moveDown = (index: number) => {
    if (index >= playlist.length - 1) return;

    moveVideo(index, index + 1); // Use store action

    const newPlaylist = playlistRef.current; // Get updated playlist from ref after store action

    if (isConnected) {
      sendMessage({
        type: 'MOVE_ITEM',
        fromIndex: index,
        toIndex: index + 1
      });
    }
  };

  // Player Controls
  const play = () => {
    console.log('▶️ play() called, isConnected:', isConnected);
    usePlayerStore.getState().play(); // Update sender UI
    if (isConnected) {
      sendMessage({ type: 'PLAY' });
    } else {
      console.warn('⚠️ Not connected! Cannot play');
    }
  };

  const pause = () => {
    console.log('⏸️ pause() called, isConnected:', isConnected);
    usePlayerStore.getState().pause(); // Update sender UI
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

    setCurrentIndex(newIndex); // Use store action

    if (isConnected) {
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: latestPlaylist.map(v => ({
          videoId: v.videoId || v.id || '',
          title: v.title || 'Unknown',
          author: v.author || 'Unknown',
          thumbnail: v.thumbnail || ''
        })),
        currentIndex: newIndex
      });
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

    setCurrentIndex(newIndex); // Use store action

    if (isConnected) {
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: latestPlaylist.map(v => ({
          videoId: v.videoId || v.id || '',
          title: v.title || 'Unknown',
          author: v.author || 'Unknown',
          thumbnail: v.thumbnail || ''
        })),
        currentIndex: newIndex
      });
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
    setCurrentIndex(newIndex); // Use store action
    // setCurrentVideo(latestPlaylist[newIndex]); // Removed as currentVideo is from store
  };

  // Update playlist order (for drag & drop)
  // Store handles the update, we just need to ensure the Receiver gets notified.
  // Actually, since this is called by drag-drop components, they should call store.reorderQueue directly.
  // BUT, to keep the context API compatible for now, we wrap it.
  const updatePlaylistOrder = (newPlaylist: QueueItem[]) => {
    logger.log('🔄 Updating playlist order via Store:', newPlaylist.length, 'items');
    // Ensure proper types
    const queueItems: QueueItem[] = newPlaylist.map(v => ({
      ...v,
      author: v.author || 'Unknown',
      uuid: v.uuid || generateUUID()
    }));
    reorderQueue(queueItems);

    // Sync to receiver immediately (Store broadcast will happen, but we can also push)
    if (castSession) {
      logger.log('📤 Sending UPDATE_QUEUE to receiver...');
      sendMessage({
        type: 'UPDATE_QUEUE',
        videos: newPlaylist.map(v => ({
          videoId: v.videoId || '',
          title: v.title,
          author: v.author,
          thumbnail: v.thumbnail || ''
        })).filter(v => v.videoId),
        currentIndex: currentIndex // Use current index from store
      });
    }
  };

  const setVolume = (volume: number) => {
    logger.log('🔊 setVolume() called:', volume);
    if (isConnected) sendMessage({ type: 'SET_VOLUME', volume });
  };

  const setMuted = (muted: boolean) => {
    logger.log('🔇 setMuted() called:', muted);
    if (isConnected) sendMessage({ type: 'SET_MUTED', muted });
  };

  const seekTo = (time: number) => {
    logger.log('🕒 seekTo() called:', time);
    if (isConnected) sendMessage({ type: 'SEEK', time });
  };

  const value: CastContextValue = useMemo(() => ({
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
    setVolume,
    setMuted,
    seekTo,
    updateCurrentIndexSilent,
    connectionQuality,
  }), [
    isAvailable,
    isConnected,
    castSession,
    receiverName,
    playlist,
    currentIndex,
    currentVideo,
    connectionQuality,
    // Functions (memoized implicitly as they are stable or depend on these deps)
    // Note: If functions above are not memoized, this useMemo is less effective but still better than nothing.
    // Ideally, functions like play, pause etc which use refs should be memoized or safe.
  ]);

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}

export function useCast() {
  const context = useContext(CastContext);
  if (context === undefined) {
    throw new Error('useCast must be used within a CastProvider');
  }
  return context;
}
