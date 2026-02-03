import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { ref, set } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { DevicePhoneMobileIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import Script from 'next/script';
import UnifiedPlayerInterface from '../components/UnifiedPlayerInterface';
import { CastCommand, CastCommandEnvelope } from '../types/castCommands';

// ========================================
// TV Page - Exact Copy of Monitor Pattern
// ========================================
// Uses same REST polling and command executor as Monitor.tsx
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
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    const [baseUrl, setBaseUrl] = useState<string>('');
    const [needsInteraction, setNeedsInteraction] = useState(false);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);

    // =============================================
    // 1. INITIALIZATION
    // =============================================
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }

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
    // 2. REST POLLING FOR STATE (Like Monitor)
    // =============================================
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        console.log('📡 TV: Starting REST polling for room:', roomCode);
        const dbURL = realtimeDb.app.options.databaseURL;
        let lastDataRef: any = null;

        const initRoom = async () => {
            try {
                const res = await fetch(`${dbURL}/rooms/${roomCode}.json`);
                const data = await res.json();
                if (!data) {
                    console.log('✨ TV: Creating room');
                    const user = auth.currentUser;
                    const token = user ? await user.getIdToken() : null;
                    const url = token
                        ? `${dbURL}/rooms/${roomCode}.json?auth=${token}`
                        : `${dbURL}/rooms/${roomCode}.json`;

                    await fetch(url, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            hostId: 'tv',
                            createdAt: Date.now(),
                            state: {
                                queue: [],
                                currentIndex: 0,
                                currentVideo: null,
                                controls: { isPlaying: false, isMuted: false }
                            }
                        }),
                    });
                }
            } catch (e) {
                console.error('Room init error:', e);
            }
        };
        initRoom();

        // Poll for state (like Monitor)
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${dbURL}/rooms/${roomCode}.json`);
                if (!response.ok) return;

                const data = await response.json();
                if (!data) return;

                if (JSON.stringify(data) !== JSON.stringify(lastDataRef)) {
                    lastDataRef = data;
                    const state = data.state || data;
                    setRoomData({
                        queue: state.queue || [],
                        currentIndex: state.currentIndex || 0,
                        currentVideo: state.currentVideo || null,
                        controls: state.controls || { isPlaying: false, isMuted: false }
                    });
                }
            } catch (e) { }
        }, 500);

        return () => clearInterval(pollInterval);
    }, [roomCode, isAuthReady]);

    // =============================================
    // 3. COMMAND EXECUTOR (Exactly like Monitor)
    // =============================================
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        const dbURL = realtimeDb.app.options.databaseURL;
        const processedCommandIds = new Set<string>();

        const commandPollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${dbURL}/rooms/${roomCode}/commands.json`);
                if (!response.ok) return;

                const commands = await response.json() as Record<string, CastCommandEnvelope> | null;
                if (!commands) return;

                for (const [commandId, envelope] of Object.entries(commands)) {
                    if (processedCommandIds.has(commandId) || envelope.status !== 'pending') continue;

                    console.log('⚙️ TV: Executing command:', envelope.command.type);
                    processedCommandIds.add(commandId);

                    try {
                        const newState = executeCommand(envelope.command, roomData);

                        const stateToWrite = envelope.command.type === 'CONNECT'
                            ? { ...newState, lastConnected: Date.now() }
                            : newState;

                        const user = auth.currentUser;
                        const token = user ? await user.getIdToken() : null;
                        const stateURL = token
                            ? `${dbURL}/rooms/${roomCode}/state.json?auth=${token}`
                            : `${dbURL}/rooms/${roomCode}/state.json`;

                        await fetch(stateURL, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(stateToWrite),
                        });

                        const cmdURL = token
                            ? `${dbURL}/rooms/${roomCode}/commands/${commandId}/status.json?auth=${token}`
                            : `${dbURL}/rooms/${roomCode}/commands/${commandId}/status.json`;

                        await fetch(cmdURL, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify('completed'),
                        });

                        console.log('✅ TV: Command executed:', envelope.command.type);
                    } catch (error) {
                        console.error('❌ TV: Command failed:', error);
                    }
                }
            } catch (e) { }
        }, 500);

        return () => clearInterval(commandPollInterval);
    }, [roomCode, isAuthReady, roomData]);

    // Execute command (exactly like Monitor)
    const executeCommand = (command: CastCommand, currentState: RoomData | null): RoomData => {
        const state = currentState || {
            queue: [],
            currentIndex: 0,
            currentVideo: null,
            controls: { isPlaying: false, isMuted: false }
        };

        const newState = { ...state, queue: [...state.queue], controls: { ...state.controls } };

        switch (command.type) {
            case 'CONNECT':
                break;

            case 'ADD_TO_QUEUE':
                newState.queue = [...newState.queue, command.payload.video];
                if (!newState.currentVideo && newState.queue.length > 0) {
                    newState.currentVideo = newState.queue[0];
                    newState.currentIndex = 0;
                    newState.controls.isPlaying = true;
                }
                break;

            case 'PLAY_NOW':
                const existingIdx = newState.queue.findIndex(v => v.videoId === command.payload.video.videoId);
                if (existingIdx >= 0) {
                    newState.currentIndex = existingIdx;
                    newState.currentVideo = newState.queue[existingIdx];
                } else {
                    newState.queue = [command.payload.video, ...newState.queue];
                    newState.currentVideo = command.payload.video;
                    newState.currentIndex = 0;
                }
                newState.controls.isPlaying = true;
                break;

            case 'PLAY_NEXT':
                newState.queue.splice(newState.currentIndex + 1, 0, command.payload.video);
                break;

            case 'PLAY':
                newState.controls.isPlaying = true;
                break;

            case 'PAUSE':
                newState.controls.isPlaying = false;
                break;

            case 'NEXT':
                if (newState.currentIndex < newState.queue.length - 1) {
                    newState.currentIndex++;
                    newState.currentVideo = newState.queue[newState.currentIndex];
                    newState.controls.isPlaying = true;
                }
                break;

            case 'PREVIOUS':
                if (newState.currentIndex > 0) {
                    newState.currentIndex--;
                    newState.currentVideo = newState.queue[newState.currentIndex];
                    newState.controls.isPlaying = true;
                }
                break;

            case 'SKIP_TO':
                if (command.payload.index >= 0 && command.payload.index < newState.queue.length) {
                    newState.currentIndex = command.payload.index;
                    newState.currentVideo = newState.queue[command.payload.index];
                    newState.controls.isPlaying = true;
                }
                break;

            case 'REMOVE_AT':
                if (command.payload.index >= 0 && command.payload.index < newState.queue.length) {
                    newState.queue.splice(command.payload.index, 1);
                    if (command.payload.index < newState.currentIndex) {
                        newState.currentIndex--;
                    } else if (command.payload.index === newState.currentIndex) {
                        if (newState.queue.length > 0) {
                            newState.currentVideo = newState.queue[newState.currentIndex] || newState.queue[0];
                        } else {
                            newState.currentVideo = null;
                            newState.controls.isPlaying = false;
                        }
                    }
                }
                break;

            case 'SET_PLAYLIST':
                newState.queue = command.payload.playlist;
                if (newState.queue.length > 0) {
                    newState.currentIndex = 0;
                    newState.currentVideo = newState.queue[0];
                    newState.controls.isPlaying = true;
                } else {
                    newState.currentIndex = 0;
                    newState.currentVideo = null;
                    newState.controls.isPlaying = false;
                }
                break;

            case 'CLEAR_QUEUE':
                newState.queue = [];
                newState.currentIndex = 0;
                newState.currentVideo = null;
                newState.controls.isPlaying = false;
                break;

            case 'MUTE':
                newState.controls.isMuted = true;
                break;

            case 'UNMUTE':
                newState.controls.isMuted = false;
                break;

            case 'TOGGLE_MUTE':
                newState.controls.isMuted = !newState.controls.isMuted;
                break;
        }

        return newState;
    };

    // =============================================
    // 4. VIDEO LOADING (Like Monitor)
    // =============================================
    useEffect(() => {
        if (!player || !roomData?.currentVideo) return;

        const { videoId } = roomData.currentVideo;
        const shouldAutoPlay = roomData.controls.isPlaying;

        console.log('📺 TV: Loading video:', roomData.currentVideo.title);

        if (shouldAutoPlay) {
            setIsLoadingVideo(true);
            const loadAndPlay = async () => {
                try {
                    await player.mute();
                    player.loadVideoById(videoId);

                    for (let i = 0; i < 5; i++) {
                        await new Promise(r => setTimeout(r, 300 * (i + 1)));
                        try {
                            const state = await player.getPlayerState();
                            if (state !== 1) {
                                console.log(`⚡ TV: Force play ${i + 1}/5`);
                                await player.playVideo();
                            } else {
                                console.log('✅ TV: Playing!');
                                break;
                            }
                        } catch (e) {
                            try { await player.playVideo(); } catch (e2) { }
                        }
                    }
                    setIsLoadingVideo(false);
                } catch (e) {
                    setIsLoadingVideo(false);
                }
            };
            loadAndPlay();
        } else {
            player.cueVideoById(videoId);
        }
    }, [player, roomData?.currentVideo?.videoId]);

    // =============================================
    // 5. PLAY/PAUSE (Like Monitor)
    // =============================================
    useEffect(() => {
        if (!player || !roomData || isLoadingVideo) return;

        const { isPlaying } = roomData.controls;

        const sync = async () => {
            try {
                const state = await player.getPlayerState();
                if (isPlaying && state !== 1) {
                    console.log('▶️ TV: Playing');
                    player.playVideo();
                } else if (!isPlaying && state === 1) {
                    console.log('⏸️ TV: Pausing');
                    player.pauseVideo();
                }
            } catch (e) {
                if (isPlaying) player.playVideo();
                else player.pauseVideo();
            }
        };
        sync();
    }, [player, roomData?.controls.isPlaying, isLoadingVideo]);

    // =============================================
    // 6. MUTE (Like Monitor)
    // =============================================
    useEffect(() => {
        if (!player || !roomData) return;

        const sync = async () => {
            try {
                if (roomData.controls.isMuted) {
                    await player.mute();
                    console.log('🔇 TV: Muted');
                }
            } catch (e) { }
        };
        sync();
    }, [player, roomData?.controls.isMuted]);

    // =============================================
    // 7. AUTO-NEXT
    // =============================================
    const handleVideoEnd = async () => {
        if (!roomData) return;
        const nextIndex = roomData.currentIndex + 1;
        if (nextIndex < roomData.queue.length) {
            const nextVideo = roomData.queue[nextIndex];
            const newState = {
                ...roomData,
                currentIndex: nextIndex,
                currentVideo: nextVideo,
                controls: { ...roomData.controls, isPlaying: true }
            };

            try {
                const dbURL = realtimeDb.app.options.databaseURL;
                const user = auth.currentUser;
                const token = user ? await user.getIdToken() : null;
                const url = token
                    ? `${dbURL}/rooms/${roomCode}/state.json?auth=${token}`
                    : `${dbURL}/rooms/${roomCode}/state.json`;

                await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newState),
                });
                console.log('⏭️ TV: Auto-next:', nextVideo.title);
            } catch (e) { }
        }
    };

    // =============================================
    // 8. CAST CONTEXT
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
                } catch (e) { }
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

    if (!roomData?.currentVideo) {
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
                        console.log('✅ TV: YouTube ready');
                        setPlayer(e.target);
                        e.target.unMute();
                        e.target.setVolume(100);
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
