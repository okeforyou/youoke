import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import {
    DevicePhoneMobileIcon,
    SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';
import Script from 'next/script';
import UnifiedPlayerInterface from '../components/UnifiedPlayerInterface';
import { useCommandExecutor } from '../hooks/useCommandExecutor';
import { CastState } from '../types/castCommands';

// ========================================
// TV Page - Clean "DJ Mode" Receiver
// ========================================
// Architecture: Command-Driven (Single Source of Truth)
// 
// Data Flow:
//   Host/Remote → Firebase /commands → useCommandExecutor → Local State → Player
//
// Key Design Principles:
// 1. TV is the AUTHORITATIVE source for player state (it writes /state, never reads it)
// 2. Only useCommandExecutor controls the player (no fighting loops)
// 3. useEffects are "reactive" - they respond ONCE per state change (not polling)
// 4. Extensible for Chromecast: Cast Context kept for heartbeat/session management
// ========================================

interface QueueVideo {
    videoId: string;
    title: string;
    author?: string;
    key: number;
}

interface RoomData {
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
    const [roomData, setRoomData] = useState<RoomData>({
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: false, volume: 100 }
    });
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    const [baseUrl, setBaseUrl] = useState<string>('');
    const [needsInteraction, setNeedsInteraction] = useState(false);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);

    // Derived state for compatibility with useCommandExecutor
    const castState: CastState = {
        queue: roomData.queue,
        currentIndex: roomData.currentIndex,
        currentVideo: roomData.currentVideo,
        controls: roomData.controls
    };

    // =============================================
    // INITIALIZATION
    // =============================================
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }

        // Anonymous Auth (required for Firebase writes)
        const loginAnonymously = async () => {
            try {
                if (!auth.currentUser) await signInAnonymously(auth);
                console.log('✅ TV signed in anonymously');
                setIsAuthReady(true);
            } catch (error) {
                console.error('❌ Anonymous sign-in failed:', error);
            }
        };
        loginAnonymously();

        // Room Code (from URL or generate new)
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
    // ROOM CREATION (One-time, not polling)
    // =============================================
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        const dbURL = realtimeDb.app.options.databaseURL;

        const initializeRoom = async () => {
            try {
                const response = await fetch(`${dbURL}/rooms/${roomCode}.json`);
                const existingData = await response.json();

                if (!existingData) {
                    console.log('✨ Creating new room:', roomCode);
                    await fetch(`${dbURL}/rooms/${roomCode}.json`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            hostId: auth.currentUser?.uid || 'tv',
                            isHost: true,
                            state: roomData,
                            createdAt: Date.now(),
                            lastConnected: Date.now()
                        })
                    });
                } else {
                    console.log('📺 Room exists, joining:', roomCode);
                    // If room exists, load initial state
                    if (existingData.state) {
                        setRoomData(existingData.state);
                    }
                }
            } catch (e) {
                console.error('Room init error', e);
            }
        };
        initializeRoom();
    }, [roomCode, isAuthReady]);

    // =============================================
    // GOOGLE CAST CONTEXT (Heartbeat for Chromecast)
    // =============================================
    useEffect(() => {
        // Initialize Cast Context to keep session alive & support future Chromecast features
        const initCast = () => {
            const cast = (window as any).cast;
            if (cast && cast.framework) {
                const context = cast.framework.CastReceiverContext.getInstance();
                const options = new cast.framework.CastReceiverOptions();
                options.disableIdleTimeout = true;
                try {
                    context.start(options);
                    console.log('✅ Cast Receiver Context Started');
                } catch (e) {
                    console.warn('Cast start failed (may already be started)', e);
                }
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
    // COMMAND EXECUTOR (THE SINGLE CONTROLLER)
    // =============================================
    // This hook:
    // 1. Polls Firebase /commands every 1s
    // 2. Executes commands directly on player
    // 3. Updates local roomData via callback
    // 4. Writes new state to Firebase /state
    useCommandExecutor({
        roomCode,
        playerRef: player,
        currentState: castState,
        onStateChange: (newState) => {
            console.log('⚡ Command Executed → State Updated:', Object.keys(newState));
            setRoomData(prev => ({ ...prev, ...newState }));
        }
    });

    // =============================================
    // REACTIVE PLAYER SYNC (Monitor-Style)
    // =============================================
    // These useEffects ONLY run when state CHANGES (not polling!)
    // They serve as a backup/correction layer, not primary control.

    // Play/Pause Sync
    useEffect(() => {
        if (!player || isLoadingVideo) return;
        const { isPlaying } = roomData.controls;

        const syncPlayPause = async () => {
            try {
                const state = await player.getPlayerState();
                // 1 = Playing, 2 = Paused
                if (isPlaying && state !== 1 && state !== 3) {
                    console.log('▶️ Sync: Playing video');
                    player.playVideo();
                } else if (!isPlaying && state === 1) {
                    console.log('⏸️ Sync: Pausing video');
                    player.pauseVideo();
                }
            } catch (e) { /* Player not ready */ }
        };
        syncPlayPause();
    }, [player, roomData.controls.isPlaying, isLoadingVideo]);

    // Mute Sync
    useEffect(() => {
        if (!player) return;
        const { isMuted } = roomData.controls;

        const syncMute = async () => {
            try {
                if (isMuted) {
                    await player.mute();
                    console.log('🔇 Sync: Muted');
                } else {
                    await player.unMute();
                    // Check if browser blocked unmute
                    setTimeout(async () => {
                        try {
                            if (await player.isMuted()) {
                                setNeedsInteraction(true);
                            } else {
                                setNeedsInteraction(false);
                            }
                        } catch (e) { /* ignore */ }
                    }, 300);
                    console.log('🔊 Sync: Unmuted');
                }
            } catch (e) { /* Player not ready */ }
        };
        syncMute();
    }, [player, roomData.controls.isMuted]);

    // Volume Sync
    useEffect(() => {
        if (!player) return;
        const targetVol = roomData.controls.volume ?? 100;

        const syncVolume = async () => {
            try {
                await player.setVolume(targetVol);
            } catch (e) { /* ignore */ }
        };
        syncVolume();
    }, [player, roomData.controls.volume]);

    // =============================================
    // VIDEO LOADING (Separate from Play/Pause)
    // =============================================
    const lastVideoIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (!player || !roomData.currentVideo) return;
        if (lastVideoIdRef.current === roomData.currentVideo.videoId) return;

        console.log('📺 Loading new video:', roomData.currentVideo.title);
        setIsLoadingVideo(true);
        lastVideoIdRef.current = roomData.currentVideo.videoId;

        // Load and auto-play
        player.loadVideoById(roomData.currentVideo.videoId);

        // Give player time to load, then ensure playback
        const ensurePlayback = async () => {
            for (let i = 0; i < 5; i++) {
                await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
                try {
                    const state = await player.getPlayerState();
                    if (state !== 1) {
                        console.log(`⚡ Force play attempt ${i + 1}/5`);
                        await player.playVideo();
                    } else {
                        console.log('✅ Video is playing!');
                        break;
                    }
                } catch (e) {
                    try { await player.playVideo(); } catch (e2) { /* ignore */ }
                }
            }
            setIsLoadingVideo(false);
        };
        ensurePlayback();
    }, [player, roomData.currentVideo?.videoId]);

    // =============================================
    // AUTO-NEXT (When video ends)
    // =============================================
    const handleVideoEnd = async () => {
        const nextIndex = roomData.currentIndex + 1;
        if (nextIndex < roomData.queue.length) {
            const nextVideo = roomData.queue[nextIndex];
            const newState = {
                ...roomData,
                currentIndex: nextIndex,
                currentVideo: nextVideo,
                controls: { ...roomData.controls, isPlaying: true }
            };
            setRoomData(newState);

            // Sync to Firebase
            const dbURL = realtimeDb.app.options.databaseURL;
            fetch(`${dbURL}/rooms/${roomCode}/state.json`, {
                method: 'PUT',
                body: JSON.stringify(newState)
            });
            console.log('⏭️ Auto-next:', nextVideo.title);
        }
    };

    // =============================================
    // RENDER
    // =============================================
    const qrCodeUrl = baseUrl ? `${baseUrl}/?castRoom=${roomCode}` : '';

    if (!mounted) return <div className="bg-black w-screen h-screen" />;

    // IDLE SCREEN (No video playing)
    if (!roomData.currentVideo) {
        return (
            <div className="relative h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white cursor-pointer overflow-hidden font-sans">
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
                    videoId={roomData.currentVideo.videoId}
                    opts={playerOpts}
                    className="w-full h-full pointer-events-none"
                    onReady={(e) => {
                        console.log('✅ YouTube Player Ready');
                        setPlayer(e.target);
                        // Initial unmute attempt
                        e.target.unMute();
                        e.target.setVolume(100);
                    }}
                    onStateChange={(e) => {
                        if (e.data === 0) handleVideoEnd(); // ENDED
                    }}
                    onError={(e) => {
                        console.error('YouTube Error:', e.data);
                        // Auto-skip on error
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
                            setRoomData(prev => ({ ...prev, controls: { ...prev.controls, isMuted: false } }));
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
                videoId={roomData.currentVideo.videoId}
                queue={roomData.queue}
                isPlaying={roomData.controls.isPlaying}
                isMuted={roomData.controls.isMuted}
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
