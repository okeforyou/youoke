import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { QRCodeSVG } from 'qrcode.react';
import { MusicalNoteIcon, UserIcon, SignalIcon, SignalSlashIcon, PlayIcon, PauseIcon, SpeakerXMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';
import { signInAnonymously } from 'firebase/auth';
import { ref, onValue, off, set, update, get } from 'firebase/database';
import { auth, realtimeDb } from '../firebase';

import Script from 'next/script';
// Types
import { CastState, QueueVideo } from '../types/castCommands';
import { useCommandExecutor } from '../hooks/useCommandExecutor';

// --- ADAPTER HOOK (To be extracted later) ---
const useReceiverLogic = (playerRef: YouTubePlayer | null) => {
    const [roomCode, setRoomCode] = useState<string>('');
    const [state, setState] = useState<CastState>({
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: true },
    });
    const [isConnected, setIsConnected] = useState(false);
    const [mode, setMode] = useState<'CAST' | 'WEB'>('WEB');
    const [debugMsg, setDebugMsg] = useState('');

    // Check if we are in a Cast Environment
    const isCastEnvironment = useRef(false);

    // --- GOOGLE CAST LOGIC ---
    useEffect(() => {
        // Wait for Cast SDK to be ready
        const initCast = () => {
            // @ts-ignore - Cast is injected by external script
            if (!window.cast || !window.cast.framework) return;

            try {
                console.log('📺 Initializing Cast Receiver Context...');
                setMode('CAST');
                isCastEnvironment.current = true;
                setIsConnected(true);

                // @ts-ignore
                const context = window.cast.framework.CastReceiverContext.getInstance();

                // Options
                // @ts-ignore
                const options = new window.cast.framework.CastReceiverOptions();
                options.disableIdleTimeout = true;

                // --- CUSTOM MESSAGE BUS ---
                const NAMESPACE = 'urn:x-cast:com.youoke.cast';

                context.addCustomMessageListener(NAMESPACE, (event: any) => {
                    console.log('📩 Received Cast Message:', event.data);
                    const command = event.data;

                    if (command.type === 'UPDATE_PLAYLIST') {
                        // Sender pushed a new playlist/state
                        const newState = command.payload;
                        setState(prev => ({ ...prev, ...newState }));
                    }
                });

                // Start
                context.start(options);
                setDebugMsg('Cast Receiver Started');
            } catch (e) {
                console.error('Cast Init Error:', e);
                setDebugMsg('Cast Init Failed');
            }
        };

        // Poll for cast framework
        const interval = setInterval(() => {
            // @ts-ignore
            if (window.cast && window.cast.framework) {
                initCast();
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);

    }, []);

    // --- DETECT MODE (Fallback for Web) ---
    useEffect(() => {
        // We ALWAYS generate a room code now, to allow Hybrid Mode (Phone joins Cast session via Web/Firebase)
        // In the future, we might want to sync this with the Cast Session ID, but random is fine for now.
        // --- BROADCAST STATE ---
        // Whenever state or roomCode changes, tell all connected Senders
        useEffect(() => {
            if (mode !== 'CAST' || !castContextRef.current) return;

            const NAMESPACE = 'urn:x-cast:com.youoke.cast';
            const payload = {
                type: 'RECEIVER_STATE',
                roomCode: roomCode, // <--- CRITICAL: Send Room Code to Sender
                queue: state.queue,
                currentIndex: state.currentIndex,
                currentVideoId: state.currentVideo?.videoId,
                controls: state.controls
            };

            try {
                console.log('📡 Broadcasting State to Senders:', payload);
                castContextRef.current.sendCustomMessage(NAMESPACE, undefined, payload); // undefined = broadcast to all
            } catch (e) {
                console.error('Broadcast Error:', e);
            }
        }, [state, roomCode, mode]);

        // --- FIREBASE LOGIC (Hybrid - Sync for Web Clients) ---
        useEffect(() => {
            if (!roomCode || !realtimeDb) return;

            const initAuth = async () => {
                try {
                    await signInAnonymously(auth);
                } catch (e) { console.error(e); }
            };
            initAuth();

            const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

            // Create Room (Host)
            // We only set initial state if loop hasn't started
            set(roomRef, {
                hostId: 'tv-' + Date.now(),
                isHost: true,
                state: state,
                createdAt: Date.now(),
                mode: mode
            });

            // Listen (Optional: if we want to sync state back from DB? No, TV is source of truth)
            // But we DO need to update DB when TV state changes.
            // This is handled by onStateChange in the component or Executor.

        }, [roomCode, mode]);

        // --- COMMAND EXECUTOR ---
        // Enable for BOTH Web and Cast modes to support QR Code guests
        useCommandExecutor({
            roomCode: roomCode || '',
            playerRef,
            currentState: state,
            onStateChange: (newState) => {
                console.log('🔄 State Updated via Command:', newState);
                setState(prev => ({ ...prev, ...newState }));
            }
        });

        return {
            roomCode,
            state,
            isConnected,
            mode,
            setState,
            debugMsg
        };
    };

    const TVPage = () => {
        // --- NO SSR GUARD ---
        const [mounted, setMounted] = useState(false);
        useEffect(() => { setMounted(true); }, []);

        const [player, setPlayer] = useState<YouTubePlayer | null>(null);
        const { roomCode, state, isConnected, setState, mode, debugMsg } = useReceiverLogic(player);
        const [showQueue, setShowQueue] = useState(true);

        // --- PLAYER SYNC ---
        useEffect(() => {
            if (!player || !state) return;

            try {
                // Sync Play/Pause
                if (state.controls.isPlaying) player.playVideo();
                else player.pauseVideo();

                // Sync Mute
                if (state.controls.isMuted) player.mute();
                else player.unMute();
            } catch (e) { console.error("Player Sync Error", e); }

        }, [player, state.controls.isPlaying, state.controls.isMuted]);

        // Handle Video Load
        const lastVideoId = useRef<string | null>(null);
        useEffect(() => {
            if (!player || !state.currentVideo) return;
            if (lastVideoId.current !== state.currentVideo.videoId) {
                try {
                    player.loadVideoById(state.currentVideo.videoId);
                    lastVideoId.current = state.currentVideo.videoId;
                } catch (e) { console.error("Video Load Error", e); }
            }
        }, [player, state.currentVideo]);


        // --- UI HELPERS ---
        const currentVideo = state.currentVideo;
        const upcomingQueue = state.queue ? state.queue.slice(state.currentIndex + 1) : [];
        const getThumbnail = (v: any) => `https://img.youtube.com/vi/${v?.videoId}/maxresdefault.jpg`;

        const onStateChange = (e: any) => {
            if (e.data === 0) {
                // Logic to play next (Local prediction)
                const nextIndex = state.currentIndex + 1;
                if (state.queue && nextIndex < state.queue.length) {
                    const nextVideo = state.queue[nextIndex];
                    setState(prev => ({
                        ...prev,
                        currentIndex: nextIndex,
                        currentVideo: nextVideo,
                        controls: { ...prev.controls, isPlaying: true }
                    }));
                    if (realtimeDb && roomCode) {
                        update(ref(realtimeDb, `rooms/${roomCode}/state`), {
                            currentIndex: nextIndex,
                            currentVideo: nextVideo,
                        });
                    }
                } else {
                    setState(prev => ({ ...prev, controls: { ...prev.controls, isPlaying: false } }));
                }
            }
        };

        if (!mounted) return <div className="bg-black w-screen h-screen" />;

        return (
            <div className="relative w-screen h-screen bg-black overflow-hidden font-sans text-white select-none cursor-none">
                <Head>
                    <title>YouOke TV Receiver</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                </Head>

                {/* 1. BACKGROUND LAYER (Video) */}
                <div className="absolute inset-0 z-0">
                    {currentVideo ? (
                        <div className="w-full h-full relative">
                            <YouTube
                                videoId={currentVideo.videoId}
                                opts={{
                                    width: '100%',
                                    height: '100%',
                                    playerVars: {
                                        autoplay: 1,
                                        controls: 0,
                                        modestbranding: 1,
                                        rel: 0,
                                        iv_load_policy: 3,
                                    }
                                }}
                                className="w-full h-full pointer-events-none"
                                onReady={(e) => {
                                    setPlayer(e.target);
                                    e.target.mute();
                                }}
                                onStateChange={onStateChange}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=3456&auto=format&fit=crop')] bg-cover bg-center animate-pulse-slow" />
                        </div>
                    )}
                </div>

                {/* 2. UI LAYER */}
                <div className="relative z-10 w-full h-full flex flex-col p-8 md:p-12 lg:p-16">

                    {/* TOP BAR: Room Info */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-6 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                            <div className="relative">
                                <span className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse"></span>
                                <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_theme(colors.green.500)]"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">ROOM CODE</span>
                                <span className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-wider font-mono">
                                    {roomCode}
                                </span>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="bg-white p-2 rounded-xl shadow-2xl opacity-80">
                            {roomCode && <QRCodeSVG value={`https://youoke.vercel.app/remote?room=${roomCode}`} size={80} />}
                        </div>
                    </div>

                    {/* MIDDLE: Idle Call to Action */}
                    {!currentVideo && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
                            <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 drop-shadow-2xl">
                                YouOke TV
                            </h1>
                            <p className="text-4xl text-gray-300 font-light">
                                Scan to start signing
                            </p>
                            {roomCode && (
                                <div className="p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                                    <QRCodeSVG value={`https://youoke.vercel.app/remote?room=${roomCode}`} size={250} />
                                </div>
                            )}
                            <div className="flex items-center gap-4 text-gray-400 bg-black/40 px-6 py-3 rounded-full backdrop-blur-md">
                                <MusicalNoteIcon className="w-6 h-6" />
                                <span>Waiting for devices...</span>
                            </div>
                            {/* Debug Msg */}
                            {debugMsg && <p className="text-gray-600 text-xs mt-4">{debugMsg}</p>}
                        </div>
                    )}

                    {/* BOTTOM AREA: Now Playing & Queue */}
                    {currentVideo && (
                        <div className="flex-1 flex items-end gap-12 mt-12">
                            {/* NOW PLAYING CARD */}
                            <div className="flex-1 max-w-4xl space-y-6 animate-in slide-in-from-bottom duration-700">
                                <div className="flex gap-8 items-end">
                                    <div className="w-48 h-48 rounded-3xl bg-black shadow-2xl overflow-hidden border-2 border-white/20 relative group">
                                        <img src={getThumbnail(currentVideo)} className="w-full h-full object-cover" alt="Art" />
                                        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center gap-1 pb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="w-1.5 bg-green-400 rounded-full animate-music-bar" style={{ height: '40%', animationDelay: `${i * 0.1}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 mb-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            {state.controls.isPlaying ?
                                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider border border-green-500/20">
                                                    <PlayIcon className="w-3 h-3" /> Playing
                                                </span>
                                                :
                                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider border border-yellow-500/20">
                                                    <PauseIcon className="w-3 h-3" /> Paused
                                                </span>
                                            }
                                        </div>
                                        <h1 className="text-6xl font-black leading-tight line-clamp-2 drop-shadow-xl text-white">
                                            {currentVideo.title}
                                        </h1>
                                        <p className="text-3xl text-gray-300 font-medium mt-2 flex items-center gap-3">
                                            {currentVideo.author || "YouTube Music"}
                                        </p>
                                        {currentVideo.addedBy && (
                                            <div className="mt-6 inline-flex items-center gap-3 bg-pink-500/20 border border-pink-500/30 px-4 py-2 rounded-full">
                                                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                                    {currentVideo.addedBy.displayName?.[0]?.toUpperCase()}
                                                </div>
                                                <span className="text-pink-200 text-lg">
                                                    Requested by <span className="font-bold text-white">{currentVideo.addedBy.displayName}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 w-1/3 animate-progress"></div>
                                </div>
                            </div>

                            {/* QUEUE SIDEBAR */}
                            <div className="w-96 bg-black/40 backdrop-blur-xl border-l border-white/5 h-[60vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-right duration-700">
                                <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                    <h3 className="font-bold text-xl flex items-center gap-2">
                                        <MusicalNoteIcon className="w-5 h-5 text-purple-400" />
                                        Up Next
                                    </h3>
                                    <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-md text-gray-400">
                                        {upcomingQueue.length}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {upcomingQueue.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-50">
                                            <MusicalNoteIcon className="w-12 h-12" />
                                            <p>Queue is empty</p>
                                        </div>
                                    ) : (
                                        upcomingQueue.map((video, idx) => (
                                            <div key={video.key || idx} className="flex gap-3 items-center group p-2 hover:bg-white/5 rounded-xl transition-colors">
                                                <span className="text-gray-500 font-mono w-6 text-center text-lg">{idx + 1}</span>
                                                <img src={getThumbnail(video)} className="w-12 h-12 rounded-lg object-cover bg-black/50" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white truncate text-base group-hover:text-purple-300 transition-colors">
                                                        {video.title}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-gray-400 text-xs truncate max-w-[100px]">{video.author}</p>
                                                        {video.addedBy && (
                                                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">
                                                                {video.addedBy.displayName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cast Receiver SDK */}
                <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" />

                {/* CSS for custom animations if not using Tailwind config */}
                <style jsx global>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(1.05); }
                }
                @keyframes music-bar {
                    0%, 100% { height: 10%; }
                    50% { height: 80%; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 10s infiniteEase-in-out;
                }
                .animate-music-bar {
                    animation: music-bar 1s infinite ease-in-out;
                }
            `}</style>

                {/* Mode Debugger / Info Overlay */}
                <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg ${mode === 'CAST' ? 'bg-blue-600' : 'bg-gray-700'} opacity-70`}>
                        Mode: {mode}
                    </div>
                    <div className="bg-black/50 px-3 py-1 rounded-lg text-[10px] text-gray-400 font-mono backdrop-blur-md">
                        Room: {roomCode || '---'} | Status: {isConnected ? 'Online' : 'Offline'}
                    </div>
                    {debugMsg && (
                        <div className="bg-red-500/20 px-3 py-1 rounded-lg text-[10px] text-red-200 font-mono max-w-[200px]">
                            {debugMsg}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    export default TVPage;
