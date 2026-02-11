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
import { CastState } from '../types/castCommands';

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

  // UI Logic: Time Update
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // UI Logic: Toast & Queue Updates
  useEffect(() => {
    const currentQueue = state.queue || [];
    if (currentQueue.length > 0 && currentQueue.length > prevQueueLength.current) {
      const latestItem = currentQueue[currentQueue.length - 1];
      if (latestItem) {
        setAddedToastItem({
          title: latestItem.title || "Unknown Song",
          addedBy: latestItem.addedBy
        });
        setTimeout(() => setAddedToastItem(null), 5000);
      }
    }
    prevQueueLength.current = currentQueue.length;

    if (state.currentVideo) {
      setShowInfoToast(true);
      const timer = setTimeout(() => setShowInfoToast(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [state.currentVideo?.videoId, (state.queue || []).length]);

  // Command Executor
  useCommandExecutor({
    roomCode,
    playerRef,
    currentState: state,
    onStateChange: handleStateChange,
  });

  const isIdle = !state.currentVideo && (state.queue || []).length === 0;

  // Player state change
  const onPlayerStateChange = async (event: { data: number }) => {
    if (event.data === 0 && state.currentVideo) {
      console.log('🎬 Video ended');
      const nextIndex = state.currentIndex + 1;
      const currentQueue = state.queue || [];
      if (nextIndex < currentQueue.length) {
        if (!realtimeDb) return;
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        try {
          await update(roomRef, {
            'state/currentIndex': nextIndex,
            'state/currentVideo': currentQueue[nextIndex],
            'state/controls/isPlaying': true,
          });
        } catch (error) {
          console.error('❌ Auto-next failed:', error);
        }
      }
    } else if (event.data === 1) {
      console.log('▶️ Playing');
    } else if (event.data === 2) {
      console.log('⏸️ Paused');
    }
  };

  const onPlayerError = (event: { data: number }) => {
    console.error('❌ Player error:', event.data);
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

  const isQueueVisible = !state.controls.isPlaying && !isIdle;

  const getAddedByName = (video: any) => {
    if (!video || !video.addedBy) return null;
    return (video.addedBy as any).name || video.addedBy.displayName || 'Guest';
  }

  const qrUrl = useMemo(() =>
    typeof window !== 'undefined' ? `${window.location.origin}/remote?room=${roomCode}` : '',
    [roomCode]);

  const onPlayerReady = async (event: { target: YouTubePlayer }) => {
    setPlayerRef(event.target);
    console.log('🎬 Player ready');
    try {
      await event.target.mute();
      console.log('🔇 Player muted');
    } catch (error) {
      console.error('❌ Mute failed:', error);
    }
    if (state.currentVideo && state.controls.isPlaying) {
      try {
        await event.target.playVideo();
        console.log('▶️ Auto-playing first video');
      } catch (error) {
        console.error('❌ Auto-play failed:', error);
      }
    }
  };

  useEffect(() => {
    if (!playerRef || !state.currentVideo) return;
    const currentVideoId = state.currentVideo.videoId;
    if (lastLoadedVideoIdRef.current === currentVideoId) return;

    const loadVideo = async () => {
      try {
        const playerState = await playerRef.getPlayerState();
        if (playerState === -1) return;

        console.log('🎵 Loading video:', state.currentVideo?.title);
        lastLoadedVideoIdRef.current = currentVideoId;
        await playerRef.mute();

        if (state.controls.isPlaying) {
          await playerRef.loadVideoById({
            videoId: currentVideoId,
            startSeconds: 0,
          });
        } else {
          await playerRef.cueVideoById(currentVideoId);
        }
      } catch (error) {
        console.error('❌ Load video failed:', error);
      }
    };
    loadVideo();
  }, [playerRef, state.currentVideo?.videoId, state.controls.isPlaying]);

  useEffect(() => {
    if (!playerRef) return;
    const syncMute = async () => {
      try {
        const playerState = await playerRef.getPlayerState();
        if (playerState === -1) return;
        if (state.controls.isMuted) await playerRef.mute();
        else await playerRef.unMute();
      } catch (error) {
        console.error('❌ Mute sync failed:', error);
      }
    };
    syncMute();
  }, [playerRef, state.controls.isMuted]);

  useEffect(() => {
    if (!playerRef || !state.currentVideo) return;
    const syncPlayPause = async () => {
      try {
        const playerState = await playerRef.getPlayerState();
        if (playerState === -1) return;
        if (state.controls.isPlaying && playerState !== 1) await playerRef.playVideo();
        else if (!state.controls.isPlaying && playerState === 1) await playerRef.pauseVideo();
      } catch (error) {
        console.error('❌ Play/Pause sync failed:', error);
      }
    };
    syncPlayPause();
  }, [playerRef, state.controls.isPlaying, state.currentVideo]);

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

      {/* 1. Fullscreen Player Layer */}
      <div className={clsx(
        "absolute inset-0 z-0 transition-opacity duration-1000",
        isIdle ? "opacity-0" : "opacity-100"
      )}>
        <div className="w-full h-full relative">
          <div className="w-full h-full pointer-events-none">
            {state.currentVideo && (
              <YouTube
                videoId={state.currentVideo.videoId}
                opts={opts}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                onError={onPlayerError}
                className="w-full h-full"
                iframeClassName="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* 2. Idle Layer (Ambient) */}
      <div className={clsx(
        "absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-1000",
        !isIdle && "opacity-0 pointer-events-none"
      )}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />

        <div className="relative z-20 text-center space-y-8 animate-in zoom-in-50 duration-700">
          <h1 className="text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 drop-shadow-lg">
            YouOke Home
          </h1>
          <div className="bg-white/10 p-4 rounded-[48px] backdrop-blur-xl border border-white/10 shadow-2xl inline-block">
            <div className="bg-white p-2 rounded-[36px]">
              {roomCode && <QRCodeSVG value={qrUrl} size={280} level="H" />}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl text-white/60 font-medium">สแกนเพื่อเริ่มใช้งาน Party Mode</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-mono font-bold text-white tracking-[0.2em]">{roomCode}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 text-white/30 text-sm font-medium tracking-widest uppercase">
          รอนักร้อง... เพิ่มเพลงเลย!
        </div>
      </div>

      {/* Debug Overlay */}
      <div className="absolute top-0 left-0 p-4 z-[100] bg-black/80 text-white text-xs pointer-events-none font-mono max-w-lg border border-white/20 m-4 rounded">
        <p className="font-bold text-green-400 mb-1">🔧 Debug Info:</p>
        <div className="space-y-1 opacity-80">
          <p>Room: {roomCode}</p>
          <p>Connected: <span className={isConnected ? "text-green-400" : "text-red-400"}>{String(isConnected)}</span></p>
          <p>Idx: {state.currentIndex} | Q: {state.queue?.length}</p>
          <div className="border-t border-white/20 pt-1 mt-1">
            <p className="text-yellow-400">Last Msg ({lastDebugTime}):</p>
            <pre className="whitespace-pre-wrap break-all text-[10px]">{lastDebugMsg}</pre>
          </div>
        </div>
      </div>

      {/* 3. Info Toast */}
      <div className={clsx(
        "absolute bottom-0 left-0 right-0 z-30 transition-all duration-700 ease-out",
        (showInfoToast && !isIdle && !isQueueVisible) ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}>
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
        {state.currentVideo && (
          <div className="relative p-12 flex items-end gap-6 max-w-5xl">
            <div className="w-24 h-24 rounded-lg shadow-2xl overflow-hidden border border-white/10 relative shrink-0">
              <Image
                unoptimized
                src={`https://i.ytimg.com/vi/${state.currentVideo.videoId}/mqdefault.jpg`}
                fill
                className="object-cover"
                alt="Album Art"
                onError={(e) => {
                  const target = e.target as HTMLImageElement; // Type assertion for Next.js Image which renders as img
                  // Note: Next/Image handles onError slightly differently than raw img, 
                  // but for unoptimized it passes through.
                  // Ideally we'd use a state for src, but inline fix is requested.
                  // Actually, modifying e.target.src directly on Next/Image might not work well if it re-renders.
                  // Let's use a simpler approach: fallback source in state or just try/catch isn't applicable here.
                  // Reverting to robust solution: using a specific component or valid placeholder.
                  // For now, let's try setting the src/srcset to transparent or placeholder.
                  e.currentTarget.srcset = "/icon-cover.png";
                  e.currentTarget.src = "/icon-cover.png";
                }}
              />
            </div>
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-primary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-primary/40">Now Playing</span>
                {state.currentVideo.addedBy && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-white/70 bg-black/20 px-2 py-0.5 rounded border border-white/5">
                    <UserIcon className="w-3 h-3 text-white/50" /> {getAddedByName(state.currentVideo)}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-md truncate pr-10">{state.currentVideo.title}</h2>
              <p className="text-base text-white/60 mt-0.5 font-medium truncate">{state.currentVideo.author}</p>
            </div>
          </div>
        )}
      </div>

      {/* ADDED TO QUEUE TOAST */}
      <div className={clsx(
        "absolute top-12 right-12 z-50 transform transition-all duration-500 ease-out",
        addedToastItem ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      )}>
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md ring-1 ring-white/5">
          <div className="bg-green-500 rounded-full p-2 text-white shadow-lg shadow-green-500/30 shrink-0">
            <ListBulletIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-bold text-lg leading-tight truncate">
              {addedToastItem?.title || 'เพิ่มเพลงใหม่แล้ว'}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-white/60 text-sm">ต่อคิวแล้วครับ</p>
              {addedToastItem?.addedBy && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 truncate max-w-[100px] border border-white/5">
                  โดย {(addedToastItem.addedBy as any).name || addedToastItem.addedBy.displayName || 'Guest'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Queue Overlay */}
      <div className={clsx(
        "absolute top-0 right-0 bottom-0 w-[420px] bg-zinc-900/95 backdrop-blur-3xl z-40 border-l border-white/10 shadow-2xl transform transition-transform duration-500 will-change-transform flex flex-col",
        isQueueVisible ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black/20">
          <h3 className="font-bold text-2xl text-white tracking-wide flex items-center gap-3">
            <ListBulletIcon className="w-6 h-6 text-primary" />
            คิวเพลงถัดไป
          </h3>
          <div className="text-right">
            <p className="text-3xl font-mono font-bold text-white/90">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-xs text-white/40 uppercase tracking-widest">ห้อง {roomCode}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {(state.queue || []).length <= 1 ? (
            <div className="h-1/2 flex flex-col items-center justify-center text-white/30 space-y-4">
              <MusicalNoteIcon className="w-16 h-16 opacity-50" />
              <p className="text-lg">ยังไม่มีคิวเพลง</p>
            </div>
          ) : (
            (state.queue || []).slice(1).map((video, idx) => (
              <div key={video.videoId + idx} className="group flex gap-4 p-4 rounded-xl bg-black/40 border border-white/5 hover:bg-white/5 transition-colors items-center">
                <span className="text-xl font-bold text-white/30 w-8 text-center">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white line-clamp-2 leading-snug">{video.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-xs text-white/60 truncate max-w-[140px]">{video.author}</p>
                    {video.addedBy && (
                      <span className="text-[10px] text-white/50 border border-white/10 px-1.5 py-0.5 rounded bg-black/30">
                        {getAddedByName(video)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div >

    </div >
  );
};

export default Monitor;
