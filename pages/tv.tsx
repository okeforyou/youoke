import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { ref, onValue, set } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { DevicePhoneMobileIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import Script from 'next/script';
import UnifiedPlayerInterface from '../components/UnifiedPlayerInterface';

// ========================================
// TV Page - State-Driven DJ Mode Receiver
// ========================================
// 
// Architecture: State-Driven (NOT Command-Driven)
// 
// Data Flow:
//   Host writes state to Firebase → TV subscribes (real-time) → TV mirrors state
//
// Design Principles:
// 1. NO commands, NO executor - just state synchronization
// 2. Firebase SDK real-time listener (not REST polling)
// 3. Simple useEffects that respond to state changes
// 4. TV is a "dumb" player - it just does what the state says
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
        volume?: number;
    };
}

const TVPage = () => {
    // --- SSR Guard ---
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // --- Core State ---
    const [roomCode, setRoomCode] = useState<string>('');
    const [roomState, setRoomState] = useState<RoomState>({
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: false, volume: 100 }
    });
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    const [baseUrl, setBaseUrl] = useState<string>('');
    const [needsInteraction, setNeedsInteraction] = useState(false);

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

        // Room Code
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
    // 2. FIREBASE REAL-TIME SUBSCRIPTION
    // =============================================
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        console.log('📡 TV: Subscribing to room:', roomCode);

        // Create room if not exists
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);

        // One-time room creation check
        const initRoom = async () => {
            const dbURL = realtimeDb.app.options.databaseURL;
            try {
                const res = await fetch(`${dbURL}/rooms/${roomCode}.json`);
                const data = await res.json();
                if (!data) {
                    console.log('✨ TV: Creating room');
                    await set(roomRef, {
                        hostId: auth.currentUser?.uid || 'tv',
                        createdAt: Date.now(),
                        state: roomState
                    });
                }
            } catch (e) {
                console.error('Room init error:', e);
            }
        };
        initRoom();

        // Real-time listener (THE ONLY WAY TV GETS STATE)
        const unsubscribe = onValue(stateRef, (snapshot) => {
            const state = snapshot.val();
            if (state) {
                console.log('📥 TV: State received', {
                    video: state.currentVideo?.title,
                    isPlaying: state.controls?.isPlaying,
                    queueLen: state.queue?.length
                });
                setRoomState(state);
            }
        });

        return () => {
            console.log('🛑 TV: Unsubscribing');
            unsubscribe();
        };
    }, [roomCode, isAuthReady]);

    // =============================================
    // 3. PLAYER CONTROL: Video Loading
    // =============================================
    const lastVideoIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!player || !roomState.currentVideo) return;

        const newVideoId = roomState.currentVideo.videoId;
        if (lastVideoIdRef.current === newVideoId) return;

        console.log('📺 TV: Loading video:', roomState.currentVideo.title);
        lastVideoIdRef.current = newVideoId;

        // Load and play
        player.loadVideoById(newVideoId);

        // Force play after load (YouTube needs this sometimes)
        setTimeout(() => {
            try {
                player.playVideo();
                console.log('▶️ TV: Force play after load');
            } catch (e) { /* ignore */ }
        }, 500);
    }, [player, roomState.currentVideo?.videoId]);

    // =============================================
    // 4. PLAYER CONTROL: Play/Pause
    // =============================================
    const lastIsPlayingRef = useRef<boolean | null>(null);

    useEffect(() => {
        if (!player) return;

        const targetPlaying = roomState.controls.isPlaying;

        // Skip if state hasn't changed
        if (lastIsPlayingRef.current === targetPlaying) return;
        lastIsPlayingRef.current = targetPlaying;

        console.log('🎮 TV: Play/Pause =', targetPlaying);

        try {
            if (targetPlaying) {
                player.playVideo();
            } else {
                player.pauseVideo();
            }
        } catch (e) {
            console.error('❌ TV: Play/Pause failed:', e);
        }
    }, [player, roomState.controls.isPlaying]);

    // =============================================
    // 5. PLAYER CONTROL: Mute/Unmute
    // =============================================
    useEffect(() => {
        if (!player) return;

        const targetMuted = roomState.controls.isMuted;

        try {
            if (targetMuted) {
                player.mute();
                console.log('🔇 TV: Muted');
            } else {
                player.unMute();
                // Check if browser blocked unmute
                setTimeout(async () => {
                    try {
                        const isMuted = await player.isMuted();
                        setNeedsInteraction(isMuted);
                    } catch (e) { /* ignore */ }
                }, 300);
                console.log('🔊 TV: Unmuted');
            }
        } catch (e) { /* Player not ready */ }
    }, [player, roomState.controls.isMuted]);

    // =============================================
    // 6. PLAYER CONTROL: Volume
    // =============================================
    useEffect(() => {
        if (!player) return;
        const vol = roomState.controls.volume ?? 100;
        try {
            player.setVolume(vol);
        } catch (e) { /* ignore */ }
    }, [player, roomState.controls.volume]);

    // =============================================
    // 7. AUTO-NEXT (When video ends)
    // =============================================
    const handleVideoEnd = async () => {
        const nextIndex = roomState.currentIndex + 1;
        if (nextIndex < roomState.queue.length) {
            const nextVideo = roomState.queue[nextIndex];
            const newState = {
                ...roomState,
                currentIndex: nextIndex,
                currentVideo: nextVideo,
                controls: { ...roomState.controls, isPlaying: true }
            };

            // Write to Firebase (Host will see it too)
            const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
            await set(stateRef, newState);
            console.log('⏭️ TV: Auto-next:', nextVideo.title);
        }
    };

    // =============================================
    // 8. CAST CONTEXT (For real Chromecast - keep for future)
    // =============================================
    useEffect(() => {
        const initCast = () => {
            const cast = (window as any).cast;
            if (cast?.framework) {
                try {
                    const ctx = cast.framework.CastReceiverContext.getInstance();
                    const opts = new cast.framework.CastReceiverOptions();
                    opts.disableIdleTimeout = true;
                    ctx.start(opts);
                    console.log('✅ TV: Cast Context started');
                } catch (e) { /* Already started */ }
            }
        };

        const interval = setInterval(() => {
            if ((window as any).cast) {
                initCast();
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // =============================================
    // RENDER
    // =============================================
    const qrCodeUrl = baseUrl ? `${baseUrl}/?castRoom=${roomCode}` : '';

    if (!mounted) return <div className="bg-black w-screen h-screen" />;

    // IDLE SCREEN
    if (!roomState.currentVideo) {
        return (
            <div className="relative h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden font-sans">
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
                </div>

                <div className="relative h-full flex flex-col items-center justify-center px-6">
                    <div className="text-center mb-10">
                        <h1 className="text-6xl font-bold mb-2 text-primary">YouOke TV</h1>
                        <p className="text-base text-gray-400">คาราโอเกะออนไลน์</p>
                    </div>

                    <div className="w-full max-w-5xl mx-auto">
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" />
            </div>
        );
    }

    // PLAYER SCREEN
    const playerOpts: any = {
        width: '100%',
        height: '100%',
        playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playsinline: 1
        }
    };

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden font-sans text-white">
            <div className="absolute inset-0">
                <YouTube
                    videoId={roomState.currentVideo.videoId}
                    opts={playerOpts}
                    className="w-full h-full pointer-events-none"
                    onReady={(e) => {
                        console.log('✅ TV: YouTube ready');
                        setPlayer(e.target);
                        e.target.unMute();
                        e.target.setVolume(100);
                        // Auto-play on ready
                        e.target.playVideo();
                    }}
                    onStateChange={(e) => {
                        if (e.data === 0) handleVideoEnd();
                    }}
                    onError={(e) => {
                        console.error('YouTube Error:', e.data);
                        handleVideoEnd();
                    }}
                />
            </div>

            {/* Audio Blocked Overlay */}
            {needsInteraction && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
                    onClick={() => {
                        if (player) {
                            player.unMute();
                            player.setVolume(100);
                            setNeedsInteraction(false);
                        }
                    }}
                >
                    <div className="bg-white/10 p-8 rounded-full animate-pulse border-4 border-primary">
                        <SpeakerXMarkIcon className="w-24 h-24 text-white" />
                        <p className="mt-4 text-xl font-bold text-center">แตะเพื่อเปิดเสียง</p>
                    </div>
                </div>
            )}

            <UnifiedPlayerInterface
                videoId={roomState.currentVideo.videoId}
                queue={roomState.queue}
                isPlaying={roomState.controls.isPlaying}
                isMuted={roomState.controls.isMuted}
                onPlayPause={() => { }}
                onNext={() => { }}
                onPrevious={() => { }}
                onMuteToggle={() => { }}
                onToggleFullscreen={() => { }}
                isFullscreen={false}
                hidePlaybackControls={true}
            />
            <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" />
        </div>
    );
};

export default TVPage;
