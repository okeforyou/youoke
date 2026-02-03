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
    const [videoId, setVideoId] = useState<string>('');
    const [queue, setQueue] = useState<QueueVideo[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');

    // UI State
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
    // 2. FIREBASE REAL-TIME SYNC (Like BroadcastChannel)
    // =============================================
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        console.log('📡 TV: Subscribing to room:', roomCode);
        const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);

        // Real-time listener - instant sync like BroadcastChannel
        const unsubscribe = onValue(stateRef, (snapshot) => {
            const state = snapshot.val() as RoomState | null;

            if (state) {
                console.log('📨 TV: State received', {
                    video: state.currentVideo?.title,
                    isPlaying: state.controls?.isPlaying,
                    queueLen: state.queue?.length
                });

                // Update state
                if (state.currentVideo?.videoId && state.currentVideo.videoId !== videoId) {
                    setVideoId(state.currentVideo.videoId);
                }

                if (state.queue) {
                    handleQueueUpdate(state.queue);
                }

                setCurrentIndex(state.currentIndex || 0);
                setIsConnected(true);

                // Sync player state
                if (playerRef.current) {
                    const player = playerRef.current.getInternalPlayer();
                    if (player) {
                        if (state.controls?.isPlaying) {
                            player.playVideo();
                            setIsPlaying(true);
                        } else {
                            player.pauseVideo();
                            setIsPlaying(false);
                        }

                        if (state.controls?.isMuted) {
                            player.mute();
                            setIsMuted(true);
                        }
                    }
                }
            }
        });

        return () => {
            console.log('🛑 TV: Unsubscribing');
            unsubscribe();
        };
    }, [roomCode, isAuthReady, videoId]);

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

    // Queue Auto-Hide Helper
    const handleQueueUpdate = (newQueue: QueueVideo[]) => {
        if (JSON.stringify(newQueue) !== JSON.stringify(queue)) {
            setQueue(newQueue);
            setShowQueue(true);

            if (queueTimeoutRef.current) clearTimeout(queueTimeoutRef.current);
            queueTimeoutRef.current = setTimeout(() => {
                setShowQueue(false);
            }, 5000);
        }
    };

    // =============================================
    // 3. PLAYER CONTROLS
    // =============================================
    const togglePlay = () => {
        if (!playerRef.current) return;
        const player = playerRef.current.getInternalPlayer();
        player.getPlayerState().then((state: number) => {
            if (state === 1) {
                player.pauseVideo();
                setIsPlaying(false);
            } else {
                player.playVideo();
                setIsPlaying(true);
            }
        });
    };

    const toggleMute = () => {
        if (!playerRef.current) return;
        const player = playerRef.current.getInternalPlayer();
        if (isMuted) {
            player.unMute();
            setIsMuted(false);
        } else {
            player.mute();
            setIsMuted(true);
        }
    };

    // Poll UI sync
    useEffect(() => {
        const interval = setInterval(async () => {
            if (playerRef.current) {
                const p = playerRef.current.getInternalPlayer();
                if (p && typeof p.getPlayerState === 'function') {
                    try {
                        const state = await p.getPlayerState();
                        setIsPlaying(state === 1);
                        setIsMuted(await p.isMuted());
                    } catch (e) { }
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

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
    const onPlayerReady = (event: any) => {
        event.target.playVideo();
        event.target.unMute();
        event.target.setVolume(100);

        setTimeout(() => {
            try {
                const state = event.target.getPlayerState();
                if (state !== 1 && state !== 3) {
                    console.log('🔄 TV: Force playing (retry)');
                    event.target.playVideo();
                }
            } catch (e) { }
        }, 1000);
    };

    // Video End - Auto Next
    const onPlayerEnd = async () => {
        console.log('🎬 TV: Video ended. Playing next...');

        const nextIndex = currentIndex + 1;
        if (nextIndex < queue.length) {
            const nextVideo = queue[nextIndex];

            // Write to Firebase
            const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
            await set(stateRef, {
                queue,
                currentIndex: nextIndex,
                currentVideo: nextVideo,
                controls: { isPlaying: true, isMuted }
            });
        }
    };

    // Request Next
    const requestNext = async () => {
        console.log('⏭️ TV: Next requested');
        const nextIndex = currentIndex + 1;
        if (nextIndex < queue.length) {
            const nextVideo = queue[nextIndex];
            const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
            await set(stateRef, {
                queue,
                currentIndex: nextIndex,
                currentVideo: nextVideo,
                controls: { isPlaying: true, isMuted }
            });
        }
    };

    // Request Previous
    const requestPrevious = async () => {
        console.log('⏮️ TV: Previous requested');
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            const prevVideo = queue[prevIndex];
            const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
            await set(stateRef, {
                queue,
                currentIndex: prevIndex,
                currentVideo: prevVideo,
                controls: { isPlaying: true, isMuted }
            });
        }
    };

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
                {/* Waiting Screen (Like Dual) */}
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
