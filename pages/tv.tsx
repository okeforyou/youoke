import Head from 'next/head';
import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { useFullscreen, useToggle } from 'react-use';
import UnifiedPlayerInterface from '../components/UnifiedPlayerInterface';
import { ref, onValue, set } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import Script from 'next/script';

// ========================================
// TV Page - Cross-Device Dual Screen
// ========================================
// Uses Firebase SDK onValue for real-time sync
// Same concept as Dual but works across devices
// ========================================

interface QueueVideo {
    videoId: string;
    title: string;
    author?: string;
    key: number;
}

interface RoomState {
    queue: QueueVideo[];
    currentIndex: number;
    currentVideo: QueueVideo | null;
    controls: {
        isPlaying: boolean;
        isMuted: boolean;
    };
}

export default function TVPage() {
    // State
    const [roomCode, setRoomCode] = useState<string>('');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');

    // Remote State (from Firebase)
    const [remoteState, setRemoteState] = useState<RoomState | null>(null);

    // Local UI State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Queue Auto-Hide
    const [showQueue, setShowQueue] = useState(false);
    const queueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Mouse Auto-Hide
    const [showControls, setShowControls] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Refs
    const playerRef = useRef<YouTube>(null);
    const fullscreenRef = useRef<HTMLDivElement>(null);

    // Hooks
    const [showFullscreen, toggleFullscreen] = useToggle(false);
    const isFullscreen = useFullscreen(fullscreenRef, showFullscreen, { onClose: () => toggleFullscreen(false) });

    // Player Options
    const opts = React.useMemo(() => ({
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1 as 1,
            controls: 0 as 0,
            modestbranding: 1 as 1,
            rel: 0 as 0,
            fs: 0 as 0,
            disablekb: 1 as 1,
            enablejsapi: 1 as 1,
        },
    }), []);

    // =============================================
    // 1. INITIALIZATION
    // =============================================
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }

        // Anonymous Auth
        const login = async () => {
            try {
                if (!auth.currentUser) await signInAnonymously(auth);
                console.log('✅ TV: Signed in');
                setIsAuthReady(true);
            } catch (error) {
                console.error('❌ TV: Auth failed:', error);
            }
        };
        login();

        // Room Code from URL or generate
        const urlParams = new URLSearchParams(window.location.search);
        const codeParam = urlParams.get('room');
        if (codeParam) {
            setRoomCode(codeParam);
        } else {
            const newCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setRoomCode(newCode);
        }
    }, []);

    // =============================================
    // 2. FIREBASE REAL-TIME SYNC
    // =============================================
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        console.log('📡 TV: Subscribing to room:', roomCode);
        const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);

        // Real-time listener - just update remoteState
        const unsubscribe = onValue(stateRef, (snapshot) => {
            const state = snapshot.val() as RoomState | null;

            if (state) {
                console.log('📨 TV: State received', {
                    video: state.currentVideo?.title,
                    isPlaying: state.controls?.isPlaying,
                    queueLen: state.queue?.length
                });
                setRemoteState(state);

                // Update queue with auto-hide
                if (state.queue) {
                    handleQueueUpdate(state.queue);
                }
            }
        });

        return () => {
            console.log('🛑 TV: Unsubscribing');
            unsubscribe();
        };
    }, [roomCode, isAuthReady]);

    // Create room if needed
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        const initRoom = async () => {
            const dbURL = realtimeDb.app.options.databaseURL;
            try {
                const res = await fetch(`${dbURL}/rooms/${roomCode}.json`);
                const data = await res.json();
                if (!data) {
                    console.log('✨ TV: Creating room');
                    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
                    await set(roomRef, {
                        hostId: 'tv',
                        createdAt: Date.now(),
                        state: {
                            queue: [],
                            currentIndex: 0,
                            currentVideo: null,
                            controls: { isPlaying: false, isMuted: false }
                        }
                    });
                }
            } catch (e) {
                console.error('Room init error:', e);
            }
        };
        initRoom();
    }, [roomCode, isAuthReady]);

    // =============================================
    // 3. SYNC PLAYER TO REMOTE STATE (Separate Effect!)
    // =============================================
    // Watch isPlaying from remoteState and sync to player
    useEffect(() => {
        if (!playerRef.current || !remoteState) return;

        const player = playerRef.current.getInternalPlayer();
        if (!player) return;

        const targetPlaying = remoteState.controls?.isPlaying ?? false;

        console.log('🎮 TV: Syncing play state:', { targetPlaying, currentIsPlaying: isPlaying });

        const sync = async () => {
            try {
                const state = await player.getPlayerState();
                const currentlyPlaying = state === 1;

                if (targetPlaying && !currentlyPlaying) {
                    console.log('▶️ TV: Playing video');
                    await player.playVideo();
                    setIsPlaying(true);
                } else if (!targetPlaying && currentlyPlaying) {
                    console.log('⏸️ TV: Pausing video');
                    await player.pauseVideo();
                    setIsPlaying(false);
                }
            } catch (e) {
                console.warn('⚠️ TV: Player sync error:', e);
                // Fallback: just try to play/pause anyway
                try {
                    if (targetPlaying) {
                        await player.playVideo();
                        setIsPlaying(true);
                    } else {
                        await player.pauseVideo();
                        setIsPlaying(false);
                    }
                } catch (e2) { }
            }
        };
        sync();
    }, [remoteState?.controls?.isPlaying]);

    // Watch isMuted from remoteState
    useEffect(() => {
        if (!playerRef.current || !remoteState) return;

        const player = playerRef.current.getInternalPlayer();
        if (!player) return;

        const targetMuted = remoteState.controls?.isMuted ?? false;

        const sync = async () => {
            try {
                if (targetMuted) {
                    await player.mute();
                    setIsMuted(true);
                } else {
                    await player.unMute();
                    setIsMuted(false);
                }
            } catch (e) { }
        };
        sync();
    }, [remoteState?.controls?.isMuted]);

    // Queue Auto-Hide Helper
    const handleQueueUpdate = (newQueue: QueueVideo[]) => {
        setShowQueue(true);
        if (queueTimeoutRef.current) clearTimeout(queueTimeoutRef.current);
        queueTimeoutRef.current = setTimeout(() => {
            setShowQueue(false);
        }, 5000);
    };

    // =============================================
    // 4. LOCAL PLAYER CONTROLS (for on TV interaction)
    // =============================================
    const togglePlay = async () => {
        if (!playerRef.current) return;
        const player = playerRef.current.getInternalPlayer();
        try {
            const state = await player.getPlayerState();
            if (state === 1) {
                await player.pauseVideo();
                setIsPlaying(false);
            } else {
                await player.playVideo();
                setIsPlaying(true);
            }
        } catch (e) { }
    };

    const toggleMute = async () => {
        if (!playerRef.current) return;
        const player = playerRef.current.getInternalPlayer();
        try {
            if (isMuted) {
                await player.unMute();
                setIsMuted(false);
            } else {
                await player.mute();
                setIsMuted(true);
            }
        } catch (e) { }
    };

    // Mouse Auto-Hide
    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    // Player Ready
    const onPlayerReady = async (event: any) => {
        console.log('✅ TV: Player ready');

        // Unmute and set volume
        try {
            await event.target.unMute();
            await event.target.setVolume(100);
        } catch (e) { }

        // Start playing if remote says so
        if (remoteState?.controls?.isPlaying) {
            console.log('▶️ TV: Auto-playing on ready');
            try {
                await event.target.playVideo();
                setIsPlaying(true);
            } catch (e) { }
        }

        // Aggressive retry
        setTimeout(async () => {
            try {
                const state = await event.target.getPlayerState();
                if (remoteState?.controls?.isPlaying && state !== 1 && state !== 3) {
                    console.log('🔄 TV: Force playing (retry)');
                    await event.target.playVideo();
                }
            } catch (e) { }
        }, 1000);
    };

    // Video End - Auto Next
    const onPlayerEnd = async () => {
        console.log('🎬 TV: Video ended. Playing next...');

        if (!remoteState) return;
        const nextIndex = remoteState.currentIndex + 1;
        if (nextIndex < remoteState.queue.length) {
            const nextVideo = remoteState.queue[nextIndex];

            // Write to Firebase
            const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
            await set(stateRef, {
                ...remoteState,
                currentIndex: nextIndex,
                currentVideo: nextVideo,
                controls: { ...remoteState.controls, isPlaying: true }
            });
        }
    };

    // Request Next/Previous
    const requestNext = async () => {
        if (!remoteState) return;
        console.log('⏭️ TV: Next requested');
        const nextIndex = remoteState.currentIndex + 1;
        if (nextIndex < remoteState.queue.length) {
            const nextVideo = remoteState.queue[nextIndex];
            const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
            await set(stateRef, {
                ...remoteState,
                currentIndex: nextIndex,
                currentVideo: nextVideo,
                controls: { ...remoteState.controls, isPlaying: true }
            });
        }
    };

    const requestPrevious = async () => {
        if (!remoteState) return;
        console.log('⏮️ TV: Previous requested');
        const prevIndex = remoteState.currentIndex - 1;
        if (prevIndex >= 0) {
            const prevVideo = remoteState.queue[prevIndex];
            const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
            await set(stateRef, {
                ...remoteState,
                currentIndex: prevIndex,
                currentVideo: prevVideo,
                controls: { ...remoteState.controls, isPlaying: true }
            });
        }
    };

    // Derived values
    const videoId = remoteState?.currentVideo?.videoId || '';
    const queue = remoteState?.queue || [];
    const qrCodeUrl = baseUrl ? `${baseUrl}/?castRoom=${roomCode}` : '';

    return (
        <>
            <Head>
                <title>YouOKE TV - Cross-Device Player</title>
            </Head>

            <div
                ref={fullscreenRef}
                className="h-screen w-screen bg-black text-white relative overflow-hidden group cursor-none hover:cursor-default"
            >
                {/* Waiting Screen */}
                {!videoId && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
                        <div className="w-full max-w-5xl mx-auto px-6">
                            <div className="text-center mb-10">
                                <h1 className="text-6xl font-bold mb-2 text-primary">YouOke TV</h1>
                                <p className="text-base text-gray-400">คาราโอเกะออนไลน์</p>
                            </div>

                            <div className="bg-black/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                                <div className="grid md:grid-cols-2 gap-0">
                                    <div className="flex flex-col items-center justify-center p-12 bg-black">
                                        {qrCodeUrl && (
                                            <div className="bg-white p-6 rounded-2xl shadow-2xl mb-6">
                                                <QRCodeSVG value={qrCodeUrl} size={220} level="M" />
                                            </div>
                                        )}
                                        <div className="text-center">
                                            <p className="text-sm text-white/70 mb-2">เลขห้อง</p>
                                            <p className="text-6xl font-bold tracking-widest text-primary">{roomCode}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center p-12 space-y-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <DevicePhoneMobileIcon className="w-8 h-8 text-primary" />
                                            วิธีใช้งาน
                                        </h2>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                    <span className="text-primary font-bold">1</span>
                                                </div>
                                                <p className="text-white">
                                                    <span className="font-semibold text-primary">Scan QR Code</span> ด้วยกล้องมือถือ
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                    <span className="text-primary font-bold">2</span>
                                                </div>
                                                <p className="text-white">ควบคุมผ่านมือถือได้ทันที</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-sm text-green-500">Real-time Sync Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Player Container */}
                <div className={`w-full h-full transition-opacity duration-500 ${videoId ? 'opacity-100' : 'opacity-0'}`}>
                    <YouTube
                        key={videoId}
                        videoId={videoId}
                        opts={opts}
                        onReady={onPlayerReady}
                        onEnd={onPlayerEnd}
                        className="w-full h-full"
                        ref={playerRef}
                    />
                </div>

                {/* Unified Interface */}
                {videoId && (
                    <UnifiedPlayerInterface
                        videoId={videoId}
                        queue={queue}
                        isPlaying={isPlaying}
                        isMuted={isMuted}
                        onPlayPause={togglePlay}
                        onNext={requestNext}
                        onPrevious={requestPrevious}
                        onMuteToggle={toggleMute}
                        onToggleFullscreen={() => toggleFullscreen()}
                        isFullscreen={isFullscreen}
                    />
                )}
            </div>

            <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" />
        </>
    );
}
