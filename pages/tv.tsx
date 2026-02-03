import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { ref, off } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import {
    DevicePhoneMobileIcon,
    SpeakerXMarkIcon,
    PlayIcon,
    PauseIcon,
} from '@heroicons/react/24/outline';
import Script from 'next/script';
import UnifiedPlayerInterface from '../components/UnifiedPlayerInterface';
import { useCommandExecutor } from '../hooks/useCommandExecutor';
import { CastState } from '../types/castCommands';

// Using exact same types as Monitor
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
    // --- NO SSR GUARD ---
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // --- STATE MANAGEMENT (Mirrored from Monitor.tsx) ---
    const [roomCode, setRoomCode] = useState<string>('');
    const [roomData, setRoomData] = useState<RoomData>({
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: true } // Default muted for TV to allow autoplay
    });
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    const [baseUrl, setBaseUrl] = useState<string>('');
    const [needsInteraction, setNeedsInteraction] = useState(false);

    // Derived state for compatibility
    const castState: CastState = {
        queue: roomData.queue,
        currentIndex: roomData.currentIndex,
        currentVideo: roomData.currentVideo,
        controls: roomData.controls
    };

    // --- INITIALIZATION ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }

        // 1. Auth
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

        // 2. Room Code (Generate or Get)
        // For TV, we usually generate one. But if passed in URL (rare), take it.
        const urlParams = new URLSearchParams(window.location.search);
        const codeParam = urlParams.get('room');
        if (codeParam) {
            setRoomCode(codeParam);
        } else {
            const newCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setRoomCode(newCode);
        }
    }, []);

    // --- FIREBASE SYNC (Mirrored from Monitor.tsx) ---
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        console.log('Monitoring room:', roomCode);
        const dbURL = realtimeDb.app.options.databaseURL;

        // Create Room if not exists
        const createRoom = async () => {
            try {
                const response = await fetch(`${dbURL}/rooms/${roomCode}.json`);
                const existingData = await response.json();
                if (!existingData) {
                    console.log('✨ Creating new room...');
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
                }
            } catch (e) {
                console.error('Room init error', e);
            }
        };
        createRoom();

        // Polling for State Updates
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${dbURL}/rooms/${roomCode}.json`);
                if (!response.ok) return;
                const data = await response.json();

                if (data && data.state) {
                    setRoomData(prev => {
                        if (JSON.stringify(prev) === JSON.stringify(data.state)) return prev;
                        console.log('📦 Room data updated:', data.state);
                        return data.state;
                    });
                    setIsConnected(!!data.lastConnected || (data.state.queue?.length > 0));
                }
            } catch (e) {
                console.error('Poll error', e);
            }
        }, 1000);

        return () => clearInterval(pollInterval);
    }, [roomCode, isAuthReady]);

    // --- GOOGLE CAST INITIALIZATION (Critical for Heartbeat) ---
    useEffect(() => {
        // We only initialize the Cast Context to keep the session alive.
        // We do NOT use Message Bus (we use Firebase/REST for that).
        const initCast = () => {
            // @ts-ignore
            const cast = window.cast;
            if (cast && cast.framework) {
                const context = cast.framework.CastReceiverContext.getInstance();
                const options = new cast.framework.CastReceiverOptions();
                options.disableIdleTimeout = true; // Prevent sleep
                try {
                    context.start(options);
                    console.log('✅ Cast Receiver Context Started (Hybrid Mode)');
                } catch (e) {
                    console.warn('Cast start failed (maybe already started)', e);
                }
            }
        };

        // Retry until cast is available
        const interval = setInterval(() => {
            // @ts-ignore
            if (window.cast) {
                initCast();
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // --- COMMAND EXECUTOR (Direct Integration) ---
    // This is the "secret sauce" of Monitor - it handles commands directly.
    useCommandExecutor({
        roomCode,
        playerRef: player,
        currentState: castState,
        // When executor updates state, we update valid React state
        onStateChange: (newState) => {
            console.log('⚡ Executor State Change:', newState);
            setRoomData(prev => ({
                ...prev,
                ...newState
            }));
        }
    });

    // --- ROBUST PLAYER SYNC LOOP (The "Hybrid" Backup) ---
    useEffect(() => {
        if (!player || !roomData) return;

        const syncPlayerState = async () => {
            try {
                // 1. Play/Pause
                const playerState = await player.getPlayerState();
                const targetIsPlaying = roomData.controls.isPlaying;

                // STUCK IN BUFFERING FIX:
                // If we want to play, and it's buffering (3) or unstarted (-1) or cued (5), FORCE PLAY.
                if (targetIsPlaying) {
                    if (playerState !== 1 && playerState !== 3) {
                        player.playVideo();
                    } else if (playerState === 3) {
                        // Double tap check for buffering lock
                        player.playVideo();
                    }
                } else {
                    if (playerState === 1) {
                        player.pauseVideo();
                    }
                }

                // 2. Mute (Unmute if needed)
                const isPlayerMuted = await player.isMuted();
                const targetIsMuted = roomData.controls.isMuted;

                if (targetIsMuted && !isPlayerMuted) {
                    player.mute();
                } else if (!targetIsMuted && isPlayerMuted) {
                    player.unMute();
                    // Forced interaction check
                    setTimeout(async () => {
                        if (await player.isMuted()) setNeedsInteraction(true);
                        else setNeedsInteraction(false);
                    }, 500);
                }

                // 3. Volume
                const currentVol = await player.getVolume();
                const targetVol = roomData.controls.volume ?? 100;
                if (Math.abs(currentVol - targetVol) > 5) {
                    player.setVolume(targetVol);
                }

            } catch (e) { /* ignore */ }
        };

        const interval = setInterval(syncPlayerState, 800); // Check every 800ms
        return () => clearInterval(interval);
    }, [player, roomData.controls]);

    // --- VIDEO LOADING ---
    const lastVideoId = useRef<string | null>(null);
    useEffect(() => {
        if (!player || !roomData.currentVideo) return;
        if (lastVideoId.current !== roomData.currentVideo.videoId) {
            console.log('📺 Loading:', roomData.currentVideo.title);
            player.loadVideoById(roomData.currentVideo.videoId);
            lastVideoId.current = roomData.currentVideo.videoId;
        }
    }, [player, roomData.currentVideo]);

    const qrCodeUrl = baseUrl ? `${baseUrl}/?castRoom=${roomCode}` : '';

    if (!mounted) return <div className="bg-black w-screen h-screen" />;

    // 1. IDLE SCREEN
    if (!roomData.currentVideo) {
        return (
            <div className="relative h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white cursor-pointer overflow-hidden font-sans">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
                </div>

                <div className="relative h-full flex flex-col items-center justify-center px-6 sm:px-8 md:px-12">
                    <div className="text-center mb-10">
                        <h1 className="text-6xl font-bold mb-2 text-primary">YouOke TV</h1>
                        <p className="text-base text-gray-400">คาราโอเกะออนไลน์</p>
                    </div>

                    <div className="w-full max-w-5xl mx-auto">
                        <div className="bg-black/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                            <div className="grid md:grid-cols-2 gap-0">
                                {/* Left: QR Code */}
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

                                {/* Right: Instructions */}
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

    // 2. PLAYER SCREEN
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
            mute: 1 // Silent start
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
                        console.log('✅ Monitor-Style Player Ready');
                        setPlayer(e.target);
                        e.target.unMute();
                        e.target.setVolume(100);
                    }}
                    onStateChange={async (e) => {
                        // Auto-next logic
                        if (e.data === 0) { // ENDED
                            const nextIndex = roomData.currentIndex + 1;
                            if (nextIndex < roomData.queue.length) {
                                // Optimistic & Firebase Update
                                const nextVideo = roomData.queue[nextIndex];
                                const newState = {
                                    ...roomData,
                                    currentIndex: nextIndex,
                                    currentVideo: nextVideo,
                                    controls: { ...roomData.controls, isPlaying: true }
                                };
                                setRoomData(newState);
                                // Fire and forget update
                                const dbURL = realtimeDb.app.options.databaseURL;
                                fetch(`${dbURL}/rooms/${roomCode}/state.json`, {
                                    method: 'PUT',
                                    body: JSON.stringify(newState)
                                });
                            }
                        }
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
                            // Also update state to reflect unmuted
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
                onPlayPause={() => { }} // TV controls are read-only locally
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
