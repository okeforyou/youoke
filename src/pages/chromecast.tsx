import React, { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import clsx from 'clsx';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { QueueItem } from '../modules/player/types';

// Icons ported from dual.tsx
import { MusicalNoteIcon, TvIcon } from '@heroicons/react/24/solid';
import { ListMusic } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

const CAST_NAMESPACE = 'urn:x-cast:com.youoke.cast';

/**
 * Lightweight YouTube player for Chromecast receiver.
 * Does NOT use UniversalPlayer to avoid heavy MidiEngine dependency.
 * Smart TV's have limited resources so we keep this as lean as possible.
 */
function ReceiverYouTubePlayer({
    onEnded,
    onTimeUpdate
}: {
    onEnded: () => void;
    onTimeUpdate?: (time: number, duration: number) => void;
}) {
    const currentSource = usePlayerStore(state => state.currentSource);
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const volume = usePlayerStore(state => state.volume);
    const isMuted = usePlayerStore(state => state.isMuted);
    const seekTarget = usePlayerStore(state => state.seekTarget);
    const playerRef = useRef<any>(null);
    const isPlayerReadyRef = useRef(false);
    const [ytReady, setYtReady] = useState(false);

    // Load YouTube IFrame API once
    useEffect(() => {
        if ((window as any).YT?.Player) {
            setYtReady(true);
            return;
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);

        (window as any).onYouTubeIframeAPIReady = () => {
            console.log('📺 [Receiver] YouTube IFrame API Ready');
            setYtReady(true);
        };
    }, []);

    // Create/update player when source changes
    useEffect(() => {
        if (!ytReady || !currentSource) return;

        // Destroy old player
        isPlayerReadyRef.current = false;
        if (playerRef.current?.destroy) {
            try { playerRef.current.destroy(); } catch (e) { /* ignore */ }
            playerRef.current = null;
        }

        // Recreate the target div (YouTube replaces it with iframe)
        const container = document.getElementById('receiver-yt-player-container');
        if (container) {
            const oldDiv = document.getElementById('receiver-yt-player');
            if (oldDiv) container.removeChild(oldDiv);
            const newDiv = document.createElement('div');
            newDiv.id = 'receiver-yt-player';
            newDiv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
            container.appendChild(newDiv);
        }

        console.log('🎬 [Receiver] Loading YouTube video:', currentSource);

        playerRef.current = new (window as any).YT.Player('receiver-yt-player', {
            videoId: currentSource,
            width: '100%',
            height: '100%',
            playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                origin: window.location.origin,
                enablejsapi: 1,
                playsinline: 1,
            },
            events: {
                onReady: (event: any) => {
                    console.log('✅ [Receiver] YouTube player ready');
                    isPlayerReadyRef.current = true;
                    // Always play when ready (receiver should always play)
                    event.target.playVideo();
                },
                onStateChange: (event: any) => {
                    if (event.data === 0) { // ENDED
                        console.log('🏁 [Receiver] Video ended');
                        onEnded();
                    }
                },
                onError: (event: any) => {
                    console.error('❌ [Receiver] YouTube player error:', event.data);
                    setTimeout(() => onEnded(), 2000);
                },
            },
        });
    }, [ytReady, currentSource, onEnded]);

    // Play/Pause control
    useEffect(() => {
        if (!isPlayerReadyRef.current || !playerRef.current) return;
        try {
            if (isPlaying) {
                playerRef.current.playVideo();
            } else {
                playerRef.current.pauseVideo();
            }
        } catch (e) { /* player not ready yet */ }
    }, [isPlaying]);

    // Volume & Mute control
    useEffect(() => {
        if (!isPlayerReadyRef.current || !playerRef.current) return;
        try {
            playerRef.current.setVolume(volume);
            if (isMuted) {
                playerRef.current.mute();
            } else {
                playerRef.current.unMute();
            }
        } catch (e) { }
    }, [volume, isMuted]);

    // Seek control
    useEffect(() => {
        if (!isPlayerReadyRef.current || !playerRef.current || seekTarget === null) return;
        try {
            playerRef.current.seekTo(seekTarget, true);
        } catch (e) { }
    }, [seekTarget]);

    // Time tracking
    useEffect(() => {
        if (!isPlayerReadyRef.current || !playerRef.current) return;
        const interval = setInterval(async () => {
            try {
                if (isPlaying) {
                    const time = await playerRef.current.getCurrentTime();
                    const duration = await playerRef.current.getDuration();
                    if (onTimeUpdate) onTimeUpdate(time, duration);
                }
            } catch (e) { }
        }, 1000);
        return () => clearInterval(interval);
    }, [isPlaying, onTimeUpdate]);

    return (
        // Use absolute positioning to guarantee 100% fill on TV
        <div
            id="receiver-yt-player-container"
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                overflow: 'hidden',
            }}
        >
            <div
                id="receiver-yt-player"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
        </div>
    );
}


export default function ChromecastReceiver() {
    const [isReceiverReady, setIsReceiverReady] = useState(false);
    const [initStatus, setInitStatus] = useState('Loading...');
    const [time, setTime] = useState(new Date());
    const castContextRef = useRef<any>(null);
    const initCalledRef = useRef(false);
    const messageHandlerRef = useRef<any>(null);

    const [showQueue, setShowQueue] = useState(false);
    const [forceShowQueue, setForceShowQueue] = useState(false);
    const lastQueueLengthRef = useRef(0);

    // Toast Notification System
    const [toast, setToast] = useState<{ title: string; author: string; type: 'added' | 'info' } | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = useCallback((title: string, author: string, type: 'added' | 'info' = 'added') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ title, author, type });
        toastTimerRef.current = setTimeout(() => {
            setToast(null);
        }, 6000);
    }, []);

    const {
        queue, currentIndex, currentVideo, currentSource, isPlaying,
        play, pause, playVideo, reorderQueue, setCurrentIndex, playNext
    } = usePlayerStore(useShallow(state => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        currentVideo: state.currentVideo,
        currentSource: state.currentSource,
        isPlaying: state.isPlaying,
        play: state.play,
        pause: state.pause,
        playVideo: state.playVideo,
        reorderQueue: state.reorderQueue,
        setCurrentIndex: state.setCurrentIndex,
        playNext: state.playNext,
        setVolume: state.setVolume,
        setMuted: state.setMuted,
        seekTo: state.seekTo
    })));

    // Clock removed due to accuracy issues on different devices.
    /*
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    */

    // Watch queue length changes
    useEffect(() => {
        const currentLength = queue.length;
        const prevLength = lastQueueLengthRef.current;
        if (currentLength !== prevLength) {
            if (prevLength !== 0 && currentLength > prevLength) {
                setForceShowQueue(true);
                setShowQueue(true);
                const timer = setTimeout(() => {
                    setForceShowQueue(false);
                }, 8000); // 8s is enough

                // Show notification for the last added item
                const lastItem = queue[queue.length - 1];
                if (lastItem) {
                    showToast(lastItem.title, lastItem.author || '');
                }

                lastQueueLengthRef.current = currentLength;
                return () => clearTimeout(timer);
            }
            lastQueueLengthRef.current = currentLength;
        }
    }, [queue.length, queue, showToast]);

    const handleTimeUpdate = useCallback((t: number, d: number) => {
        if (d <= 0) return;
        const remaining = d - t;
        const hasNext = queue.length > currentIndex + 1;

        if (forceShowQueue) {
            setShowQueue(true);
        } else if (hasNext && (t < 12 || remaining < 45)) {
            setShowQueue(true);
        } else {
            setShowQueue(false);
        }
    }, [queue.length, currentIndex, forceShowQueue]);

    // Handle incoming Cast messages
    const handleCastMessage = useCallback((event: any) => {
        try {
            const message = event.data;
            console.log('📡 [Chromecast] Received Message:', JSON.stringify(message));
            const store = usePlayerStore.getState();

            switch (message.type) {
                case 'LOAD_VIDEO':
                    if (message.videoId) {
                        const videoItem: QueueItem = {
                            uuid: `cc-${Date.now()}`,
                            id: message.videoId,
                            videoId: message.videoId,
                            title: message.title || 'Playing Video',
                            author: message.author || '',
                            thumbnail: message.thumbnail || `https://i.ytimg.com/vi/${message.videoId}/mqdefault.jpg`,
                            sourceType: 'youtube'
                        };
                        store.reorderQueue([videoItem]);
                        store.setCurrentIndex(0);
                    }
                    break;
                case 'PLAY': store.play(); break;
                case 'PAUSE': store.pause(); break;
                case 'LOAD_QUEUE':
                case 'UPDATE_QUEUE':
                    if (message.videos && Array.isArray(message.videos)) {
                        const newQueue = message.videos.map((v: any, index: number) => ({
                            uuid: v.uuid || `cc-${Date.now()}-${index}`,
                            id: v.videoId || v.id || '',
                            videoId: v.videoId || v.id || '',
                            title: v.title || 'Unknown',
                            author: v.author || '',
                            thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
                            sourceType: 'youtube'
                        }));
                        store.reorderQueue(newQueue);
                        if (typeof message.currentIndex === 'number') store.setCurrentIndex(message.currentIndex);
                    }
                    break;
                case 'ADD_ITEM':
                    if (message.video) {
                        const newItem = {
                            uuid: message.video.uuid || `cc-${Date.now()}`,
                            id: message.video.videoId || message.video.id,
                            videoId: message.video.videoId || message.video.id,
                            title: message.video.title || 'Unknown',
                            author: message.video.author || '',
                            thumbnail: message.video.thumbnail || `https://i.ytimg.com/vi/${message.video.videoId}/mqdefault.jpg`,
                            sourceType: 'youtube'
                        } as QueueItem;
                        store.addToQueue(newItem);
                        showToast(newItem.title, newItem.author || '');
                    }
                    break;
                case 'NEXT': store.playNext(); break;
                case 'PREVIOUS': store.playPrevious(); break;
                case 'SET_VOLUME': store.setVolume(message.volume); break;
                case 'SET_MUTED': store.setMuted(message.muted); break;
                case 'SEEK': store.seekTo(message.time); break;
            }
        } catch (err) { console.error('📡 Error:', err); }
    }, [showToast]);

    // Update handler ref whenever dependencies change to solve stale closure issue
    useEffect(() => {
        messageHandlerRef.current = handleCastMessage;
    }, [handleCastMessage]);

    // Send RECEIVER_READY handshake back to sender
    const sendReceiverReady = useCallback(() => {
        const context = castContextRef.current;
        if (!context) return;

        try {
            // Get all connected senders
            const senders = context.getSenders();
            const readyMessage = JSON.stringify({ type: 'RECEIVER_READY' });

            if (senders && senders.length > 0) {
                senders.forEach((sender: any) => {
                    context.sendCustomMessage(CAST_NAMESPACE, sender.id, readyMessage);
                });
                console.log('🤝 [Chromecast] RECEIVER_READY sent to', senders.length, 'sender(s)');
            } else {
                // Broadcast to all
                context.sendCustomMessage(CAST_NAMESPACE, undefined, readyMessage);
                console.log('🤝 [Chromecast] RECEIVER_READY broadcast');
            }
        } catch (e) {
            console.warn('⚠️ [Chromecast] Could not send RECEIVER_READY:', e);
        }
    }, []);

    // Initialize Cast Receiver - runs ONCE only
    useEffect(() => {
        if (initCalledRef.current) return;
        initCalledRef.current = true;

        const initCast = (retries = 0) => {
            if (typeof window === 'undefined') return;

            const cast = (window as any).cast;

            if (!cast || !cast.framework) {
                if (retries < 150) { // Try for 15 seconds (150 * 100ms) — Smart TVs are slow
                    if (retries % 10 === 0) {
                        setInitStatus(`Loading Cast SDK... (${retries / 10}s)`);
                        console.log(`⏳ [Chromecast] Framework not ready, retrying (${retries})...`);
                    }
                    setTimeout(() => initCast(retries + 1), 100);
                } else {
                    console.error('❌ [Chromecast] Cast Framework failed to load after 15 seconds.');
                    setInitStatus('Failed to load Cast Framework. Please reload.');
                }
                return;
            }

            try {
                setInitStatus('Starting receiver...');
                const context = cast.framework.CastReceiverContext.getInstance();
                castContextRef.current = context;

                // Register message listener using the ref to bridge React and Cast SDK
                context.addCustomMessageListener(CAST_NAMESPACE, (event: any) => {
                    if (messageHandlerRef.current) messageHandlerRef.current(event);
                });

                // Listen for sender connected events to send RECEIVER_READY
                context.addEventListener(
                    cast.framework.system.EventType.SENDER_CONNECTED,
                    () => {
                        console.log('📱 [Chromecast] Sender connected!');
                        // Small delay to ensure message channel is ready
                        setTimeout(sendReceiverReady, 500);
                    }
                );

                // Configure receiver options for lightweight operation
                const options = new cast.framework.CastReceiverOptions();
                options.disableIdleTimeout = true;
                options.maxInactivity = 3600; // 1 hr
                options.skipPlayersLoad = true; // Skip built-in media player (we use our own)

                context.start(options);
                setIsReceiverReady(true);
                setInitStatus('');
                console.log('📺 [Chromecast] ✅ Receiver Started Successfully!');

                // If senders already connected, send ready immediately
                setTimeout(sendReceiverReady, 1000);

            } catch (initErr) {
                console.error('❌ [Chromecast] Context initialization error:', initErr);
                setInitStatus(`Error: ${initErr}`);
            }
        };

        // Check if Cast SDK is already available (e.g., Chromecast device injects it)
        const cast = (window as any).cast;
        if (cast?.framework) {
            console.log('📦 [Chromecast] Receiver SDK already available!');
            initCast(0);
        } else {
            // SDK will be loaded via next/Script in the JSX below
            // Start polling - initCast will retry until the script loads
            setInitStatus('Loading Cast Receiver SDK...');
            console.log('⏳ [Chromecast] Waiting for Receiver SDK to load via Script tag...');
            initCast(0);
        }

        // Cleanup
        return () => {
            if (castContextRef.current) {
                try {
                    castContextRef.current.stop();
                } catch (e) { /* ignore cleanup errors */ }
            }
        };
    }, [handleCastMessage, sendReceiverReady]);

    const handlePlayerEnded = useCallback(() => {
        console.log('🏁 [Chromecast] Media ended, processing next step.');
        const store = usePlayerStore.getState();
        const context = castContextRef.current;
        let sentToSender = false;

        // Notify senders that video ended so they can manage the queue
        if (context && store.currentSource) {
            const senders = context.getSenders();
            if (senders && senders.length > 0) {
                const message = JSON.stringify({
                    type: 'VIDEO_ENDED',
                    videoId: store.currentSource,
                    currentIndex: store.currentIndex
                });
                try {
                    // Send to all connected senders
                    senders.forEach((sender: any) => {
                        context.sendCustomMessage(CAST_NAMESPACE, sender.id, message);
                    });
                    console.log('📤 [Chromecast] VIDEO_ENDED sent to senders');
                    sentToSender = true;
                } catch (e) {
                    console.error('Error sending VIDEO_ENDED:', e);
                }
            }
        }

        // If no sender took control, play next locally as a fallback
        // we ALWAYS try to playNext on the receiver if items exist, 
        // because smart TVs often lose connection or senders go to sleep.
        if (store.queue.length > store.currentIndex + 1) {
            console.log('⏭️ [Chromecast] Auto-playing next song...');
            const nextTimer = setTimeout(() => {
                store.playNext();
            }, 1000);
            return () => clearTimeout(nextTimer);
        } else {
            console.log('⏹️ [Chromecast] End of queue reached or no sender available.');
        }
    }, []);

    const isIdle = !currentSource;

    return (
        <div className="h-screen w-screen bg-black overflow-hidden relative font-sans text-white">
            <Head>
                <title>YouOke Chromecast Receiver</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            </Head>

            {/* Cast Receiver SDK - loaded ONLY on this page via next/Script */}
            <Script
                src="https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log('📦 [Chromecast] Receiver SDK script loaded via next/Script!');
                }}
            />

            {/* 1. Fullscreen Player Layer - always rendered */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    backgroundColor: '#000',
                }}
            >
                <div style={{ position: 'absolute', inset: 0 }}>
                    <ReceiverYouTubePlayer
                        onEnded={handlePlayerEnded}
                        onTimeUpdate={handleTimeUpdate}
                    />
                </div>
            </div>

            {/* 2. Idle Layer - ONLY render when idle to prevent obscuring video */}
            {isIdle && (
                <div className="absolute inset-0 z-10 bg-[#0a0a0a] flex flex-col items-center justify-center text-center p-12">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 border border-primary/20 mx-auto">
                            <TvIcon className="w-12 h-12 text-primary animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tight mb-2">YouOke <span className="text-primary">Cast</span></h1>
                        <p className="text-xl text-white/40 font-medium tracking-wide">รอรับคำสั่งจากโทรศัพท์มือถือของคุณ...</p>

                        {!isReceiverReady && (
                            <div className="mt-16 flex flex-col items-center">
                                <div className="loading loading-spinner text-primary loading-lg"></div>
                                <p className="text-sm font-bold text-white/30 uppercase tracking-widest mt-6">{initStatus}</p>
                            </div>
                        )}

                        {isReceiverReady && (
                            <div className="mt-12 flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 mx-auto w-fit">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                                <p className="text-sm text-green-400 font-bold uppercase tracking-widest">พร้อมรับคำสั่งแล้ว</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. Global Overlay Layer (Always on top of video) */}
            {!isIdle && (
                <>
                    {/* Top Left: Logo & Branding */}
                    <div className="absolute top-6 left-8 z-50">
                        <span className="text-white text-xs font-bold tracking-[0.2em] uppercase drop-shadow-md">
                            YouOke ChromeCast
                        </span>
                    </div>

                    {/* Top Right: Precise Time REMOVED */}
                    <div className="absolute top-6 right-8 z-50 text-right">
                        {/* Next Up Badge - Dark Semi-transparent */}
                        <div className={clsx(
                            "mt-3 bg-black/85 px-4 py-3 rounded-xl shadow-2xl text-left transition-all duration-700 w-72",
                            showQueue && queue.length > currentIndex + 1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"
                        )}>
                            {queue.length > currentIndex + 1 && (
                                <>
                                    <div className="flex items-center gap-2 mb-1">
                                        <MusicalNoteIcon className="w-4 h-4 text-primary" />
                                        <p className="text-[10px] text-primary uppercase font-bold tracking-widest leading-none">Next Up</p>
                                    </div>
                                    <p className="text-base font-bold text-white line-clamp-1 truncate leading-tight">{queue[currentIndex + 1].title}</p>
                                    <p className="text-[11px] text-white/70 truncate mt-1 leading-none">{queue[currentIndex + 1].author}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom Left: Added Toast Notification (Dark Semi-transparent) */}
                    <div className={clsx(
                        "absolute bottom-10 left-10 z-[60] transition-all duration-700",
                        toast ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
                    )}>
                        {toast && (
                            <div className="bg-black/85 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4">
                                <ListMusic size={20} className="text-primary" />
                                <div className="min-w-0">
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mb-1">Song Added</p>
                                    <p className="text-sm font-bold text-white truncate max-w-[250px] leading-tight">{toast.title}</p>
                                    <p className="text-[11px] text-white/70 truncate leading-none mt-1">{toast.author}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
