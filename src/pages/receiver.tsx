/**
 * Monitor (TV Display) - Command Pattern Version
 *
 * Responsibilities:
 * 1. Execute commands from Remote
 * 2. Update state in Firebase
 * 3. Control YouTube player
 * 4. Display current video and queue
 */

import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import Image from 'next/image';
import Head from 'next/head';
import Script from 'next/script';
import { ref, onValue, off, set, update } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import { MusicalNoteIcon, UserIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { realtimeDb, auth } from '@/firebase';
import { useCommandExecutor } from '../hooks/useCommandExecutor';
import { CastState, QueueVideo } from '../types/castCommands';
import { VideoItem } from '../modules/tv/types';
import { SmartTVPlayer } from '../modules/tv/components/SmartTVPlayer';


const Monitor = () => {
  const router = useRouter();
  const { room: roomCodeParam } = router.query;

  // State
  const [roomCode, setRoomCode] = useState<string>('');
  const [state, setState] = useState<CastState>({
    queue: [],
    currentIndex: 0,
    currentVideo: null,
    controls: { isPlaying: false, isMuted: true },
  });
  const [isConnected, setIsConnected] = useState(false);
  const [playerRef, setPlayerRef] = useState<YouTubePlayer | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const lastLoadedVideoIdRef = useRef<string | null>(null);

  // UI State
  const [time, setTime] = useState(new Date());
  const [showInfoToast, setShowInfoToast] = useState(false);
  const [addedToastItem, setAddedToastItem] = useState<{ title: string, addedBy: any } | null>(null);
  const prevQueueLength = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [lastDebugMsg, setLastDebugMsg] = useState<string>('No msg yet');
  const [lastDebugTime, setLastDebugTime] = useState<string>('-');

  // Sync state ref for Cast Listener
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Anonymous login
  useEffect(() => {
    const loginAnonymously = async () => {
      try {
        if (auth) await signInAnonymously(auth);
        console.log('✅ Monitor signed in anonymously');
        setIsAuthReady(true);
      } catch (error) {
        console.error('❌ Anonymous sign-in failed:', error);
      }
    };
    loginAnonymously();
  }, []);

  // Generate room code
  useEffect(() => {
    if (roomCodeParam && typeof roomCodeParam === 'string') {
      setRoomCode(roomCodeParam);
    } else {
      const newCode = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      setRoomCode(newCode);
      console.log('🎲 Generated room code:', newCode);
    }
  }, [roomCodeParam]);

  // Initialize room
  useEffect(() => {
    if (!roomCode || !realtimeDb || !isAuthReady) return;

    console.log('📺 Monitoring room:', roomCode);
    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

    // Create room if doesn't exist
    const initializeRoom = async () => {
      try {
        await set(roomRef, {
          hostId: 'monitor',
          isHost: true,
          state: {
            queue: [],
            currentIndex: 0,
            currentVideo: null,
            controls: { isPlaying: false, isMuted: true },
          },
          commands: {},
          createdAt: Date.now(),
        });
        console.log('✅ Room created:', roomCode);
      } catch (error) {
        console.error('❌ Error creating room:', error);
      }
    };

    initializeRoom();

    // Listen to state changes
    const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const newState = snapshot.val() as CastState | null;
      if (newState) {
        console.log('📦 State updated:', newState);
        setState(newState);
        setIsConnected(
          (newState.queue || []).length > 0 || newState.currentVideo !== null
        );
      }
    });

    return () => {
      off(stateRef);
      unsubscribe();
    };
  }, [roomCode, isAuthReady]);

  // Handle Fullscreen Toggle from Remote
  useEffect(() => {
    if (!state.layoutMode) return;

    if (state.layoutMode === 'fullscreen') {
      // Enter fullscreen
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('⚠️ Fullscreen request denied (user gesture required):', err);
        });
      }
    } else if (state.layoutMode === 'split') {
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err =>
          console.warn('⚠️ Exit fullscreen failed:', err)
        );
      }
    }
  }, [state.layoutMode]);

  // Initialize Cast Receiver SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const CAST_NAMESPACE = 'urn:x-cast:com.youoke.cast';

    const initCast = () => {
      const cast = (window as any).cast;
      if (!cast || !cast.framework) return;

      try {
        console.log('🎬 Initializing Cast Receiver SDK...');
        const context = cast.framework.CastReceiverContext.getInstance();

        // Message Listener
        context.addCustomMessageListener(CAST_NAMESPACE, async (event: any) => {
          const message = event.data;
          console.log('📨 [Receiver] Message received:', message);
          setLastDebugMsg(JSON.stringify(message).slice(0, 100));
          setLastDebugTime(new Date().toLocaleTimeString());

          if (!realtimeDb) {
            console.error('❌ RealtimeDB not initialized');
            return;
          }
          const currentState = stateRef.current;
          const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

          try {
            switch (message.type) {
              case 'LOAD_QUEUE':
              case 'UPDATE_QUEUE': {
                const newQueue = (message.videos || []).map((v: any) => ({
                  videoId: v.videoId,
                  title: v.title || 'Unknown',
                  author: v.author || 'Unknown',
                  addedBy: v.addedBy || { name: 'Remote' },
                  uuid: v.uuid || Math.random().toString(36).substr(2, 9)
                }));

                const startIndex = typeof message.startIndex === 'number' ? message.startIndex : currentState.currentIndex;

                const updates: any = {
                  'state/queue': newQueue,
                };

                if (message.type === 'LOAD_QUEUE') {
                  updates['state/currentIndex'] = startIndex;
                  updates['state/currentVideo'] = newQueue[startIndex] || null;
                  updates['state/controls/isPlaying'] = true;
                }

                await update(roomRef, updates);
                console.log('✅ Queue updated from Cast Sender');
                break;
              }

              case 'LOAD_VIDEO': {
                const { videoId } = message;
                const index = currentState.queue.findIndex((v: any) => v.videoId === videoId);
                if (index !== -1) {
                  await update(roomRef, {
                    'state/currentIndex': index,
                    'state/currentVideo': currentState.queue[index],
                    'state/controls/isPlaying': true
                  });
                }
                break;
              }

              case 'PLAY':
                await update(roomRef, { 'state/controls/isPlaying': true });
                break;
              case 'PAUSE':
                await update(roomRef, { 'state/controls/isPlaying': false });
                break;
              case 'NEXT': {
                const nextIndex = currentState.currentIndex + 1;
                if (nextIndex < currentState.queue.length) {
                  await update(roomRef, {
                    'state/currentIndex': nextIndex,
                    'state/currentVideo': currentState.queue[nextIndex],
                    'state/controls/isPlaying': true
                  });
                }
                break;
              }
              case 'PREVIOUS': {
                const prevIndex = currentState.currentIndex - 1;
                if (prevIndex >= 0) {
                  await update(roomRef, {
                    'state/currentIndex': prevIndex,
                    'state/currentVideo': currentState.queue[prevIndex],
                    'state/controls/isPlaying': true
                  });
                }
                break;
              }
            }
          } catch (err) {
            console.error('❌ Error handling Cast Message:', err);
          }
        });

        // Start Receiver
        const options = new cast.framework.CastReceiverOptions();
        options.disableIdleTimeout = true;
        context.start(options);
        console.log('✅ Cast Receiver Started');

        // Handle Sender Connection
        context.addEventListener(cast.framework.system.EventType.SENDER_CONNECTED, (event: any) => {
          console.log('📱 Sender Connected:', event);
          setIsConnected(true);

          // HANDSHAKE: Tell Sender we are ready to receive queue
          // We broadcast to all connected senders on our custom namespace
          const senders = context.getSenders();
          console.log('📡 Broadcasting RECEIVER_READY to', senders.length, 'senders');

          // Broadcast to all senders
          context.sendCustomMessage(CAST_NAMESPACE, undefined, {
            type: 'RECEIVER_READY',
            status: 'ready'
          });
        });

        context.addEventListener(cast.framework.system.EventType.SENDER_DISCONNECTED, (event: any) => {
          console.log('📱 Sender Disconnected:', event);
          if (context.getSenders().length === 0) {
            setIsConnected(false);
          }
        });
      } catch (error) {
        console.warn('⚠️ Cast SDK initialization failed (expected in dev):', error);
        // This is normal when running in dev/testing - Cast SDK only works on Chromecast devices
        // We use Firebase RTDB for dev testing instead
      }
    };

    const interval = setInterval(() => {
      if ((window as any).cast && (window as any).cast.framework) {
        clearInterval(interval);
        initCast();
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [roomCode, realtimeDb]);

  // State change handler for CommandExecutor
  const handleStateChange = useCallback(
    (newState: Partial<CastState>) => {
      setState((prev) => ({ ...prev, ...newState }));
    },
    []
  );

  // Mounted effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Command Executor
  useCommandExecutor({
    roomCode,
    playerRef,
    currentState: state,
    onStateChange: handleStateChange,
  });

  const isIdle = !state.currentVideo && (state.queue || []).length === 0;

  const qrUrl = useMemo(() =>
    typeof window !== 'undefined' ? `${window.location.origin}/remote?room=${roomCode}` : '',
    [roomCode]);

  if (!roomCode || !mounted) {

    return (
      <div className="relative h-screen bg-black text-white flex items-center justify-center">
        <p className="text-2xl text-gray-500 animate-pulse">Loading TV...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative font-sans text-white selection:bg-white selection:text-black">
      <Head>
        <title>YouOke TV {roomCode}</title>
      </Head>
      <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="beforeInteractive" />

      {/* 1. Main UI (Idle vs Active) */}
      {isIdle ? (
        /* 2. Idle Layer (Ambient with QR - Premium Style) */
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-1000">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />

          <div className="relative z-20 text-center space-y-12 animate-in zoom-in-90 fade-in duration-1000">
            <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20 drop-shadow-2xl">
              YouOke TV
            </h1>
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-[60px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="bg-white/5 p-6 rounded-[56px] backdrop-blur-3xl border border-white/10 shadow-2xl relative">
                <div className="bg-white p-4 rounded-[40px] shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                  {roomCode && <QRCodeSVG value={qrUrl} size={280} level="H" />}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-3xl text-white/40 font-bold tracking-widest uppercase">Party Room Code</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-8xl font-black text-white px-8 py-4 bg-white/5 rounded-3xl border border-white/10 shadow-inner">{roomCode}</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-12 flex items-center gap-3 text-white/20 text-sm font-black tracking-[0.4em] uppercase">
            <MusicalNoteIcon className="w-5 h-5 animate-bounce" />
            รอนักร้อง... สแกนด่วน!
          </div>
        </div>
      ) : (
        /* 3. Smart TV Player Layer (Premium Video & Overlays) */
        <div className="absolute inset-0 z-0">
          <SmartTVPlayer
            currentVideo={state.currentVideo as unknown as VideoItem}
            nextVideo={state.queue?.[state.currentIndex + 1] as unknown as VideoItem}
            isPlaying={state.controls.isPlaying}
            isMuted={state.controls.isMuted}
            queue={state.queue as unknown as VideoItem[]}
            isQueueVisible={state.isQueueVisible}
            notification={state.notification as any}
            onReady={(player) => setPlayerRef(player)}
            onStateChange={async (playerState) => {
              if (playerState === 0) {
                // Video Ended logic
                const nextIndex = state.currentIndex + 1;
                if (nextIndex < (state.queue?.length || 0)) {
                  if (!realtimeDb) return;
                  const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
                  await update(roomRef, {
                    'state/currentIndex': nextIndex,
                    'state/currentVideo': state.queue[nextIndex],
                    'state/controls/isPlaying': true,
                  });
                }
              }
            }}
            onError={(err) => console.error('❌ Player Error:', err)}
          />
        </div>
      )}


      {/* Debug Overlay (Auto-hidden in production) */}
      <div className="absolute top-0 left-0 p-4 z-[100] bg-black/80 text-white text-[10px] pointer-events-none font-mono max-w-lg border border-white/10 m-4 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
        <p className="font-bold text-primary mb-1 tracking-widest">RECEIVER DEBUG</p>
        <div className="space-y-0.5 opacity-60">
          <p>Room: {roomCode}</p>
          <p>Sender: <span className={isConnected ? "text-green-400" : "text-red-400"}>{String(isConnected)}</span></p>
          <p>Idx: {state.currentIndex} | Q: {state.queue?.length}</p>
          <div className="border-t border-white/10 pt-1 mt-1">
            <p className="text-yellow-400">Last Msg ({lastDebugTime}):</p>
            <pre className="whitespace-pre-wrap break-all">{lastDebugMsg}</pre>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Monitor;

