import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { QRCodeSVG } from 'qrcode.react';
import { MusicalNoteIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import Script from 'next/script';
import { auth, realtimeDb } from '../firebase'; // Keep imports for consistent build context if needed, though strictly used in hook
import { ref, update } from 'firebase/database';
import { useReceiverLogic } from '../hooks/useReceiverLogic';

const TVPage = () => {
    // --- NO SSR GUARD ---
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    // Use the extracted logic hook - SAFE and PRESERVED functionality
    const { roomCode, state, isConnected, setState, mode, debugMsg } = useReceiverLogic(player);

    // --- PLAYER SYNC (Visuals Only - Logic is in hook) ---
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

    // Local state change handler (e.g., video ended)
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
                // We update DB here because the Receiver (TV) is the source of truth for "what's playing"
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
                                    disablekb: 1, // Disable keyboard controls
                                    fs: 0, // Disable fullscreen button
                                }
                            }}
                            className="w-full h-full pointer-events-none transform scale-[1.01]" // Slight scale to avoid 1px gaps
                            onReady={(e) => {
                                setPlayer(e.target);
                                e.target.mute(); // Mute for autoplay policy initially
                            }}
                            onStateChange={onStateChange}
                        />
                        {/* Subtle overlay to make text readable but keep video clear */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
                    </div>
                ) : (
                    // IDLE BACKGROUND: Dynamic Gradient
                    <div className="w-full h-full bg-[#050505] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40 animate-pulse-slow" />
                        <div className="absolute inset-0 bg-[url('/bg-noise.png')] opacity-10 mix-blend-overlay" />
                        {/* Fallback abstract subtle shapes if no image */}
                        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[100px] animate-blob" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-pink-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
                    </div>
                )}
            </div>

            {/* 2. UI LAYER: IDLE STATE */}
            {!currentVideo && (
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-12">
                    {/* PREMIUM LOGO / TITLE */}
                    <div className="space-y-2">
                        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tighter drop-shadow-2xl">
                            YouOke
                        </h1>
                        <p className="text-2xl text-gray-400 font-light tracking-[0.2em] uppercase">Private Karaoke Room</p>
                    </div>

                    {/* CENTER PIECE: QR & CODE */}
                    <div className="flex flex-col items-center gap-8 animate-in zoom-in duration-700 fade-in">
                        <div className="p-6 bg-white rounded-[3rem] shadow-[0_0_80px_rgba(255,255,255,0.15)] ring-4 ring-white/10">
                            {roomCode && <QRCodeSVG value={`https://youoke.vercel.app/remote?room=${roomCode}`} size={280} />}
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">Connect with Code</span>
                            <span className="text-7xl font-mono font-bold text-white tracking-widest drop-shadow-lg">
                                {roomCode.split('').join(' ')}
                            </span>
                        </div>
                    </div>

                    {/* URL INSTRUCTION */}
                    <div className="absolute bottom-16 flex items-center gap-3 bg-white/5 backdrop-blur-md px-8 py-4 rounded-full border border-white/5">
                        <span className="text-gray-400">or visit</span>
                        <span className="text-white font-bold text-xl tracking-wide">play.okeforyou.com</span>
                    </div>
                </div>
            )}

            {/* 3. UI LAYER: PLAYER STATE */}
            {currentVideo && (
                <div className="relative z-10 w-full h-full p-8 md:p-12 flex flex-col justify-between">

                    {/* TOP RIGHT: Mini QR & Code (Always visible for joiners) */}
                    <div className="absolute top-8 right-8 flex items-center gap-4 animate-in fade-in slide-in-from-top duration-700 delay-500">
                        <div className="flex flex-col items-end text-right">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Join Room</span>
                            <span className="text-2xl font-mono font-bold text-white tracking-widest">{roomCode}</span>
                        </div>
                        <div className="bg-white/90 p-1.5 rounded-lg shadow-lg">
                            {roomCode && <QRCodeSVG value={`https://youoke.vercel.app/remote?room=${roomCode}`} size={50} />}
                        </div>
                    </div>

                    {/* SPACER */}
                    <div className="flex-1" />

                    {/* BOTTOM AREA: INFO & QUEUE */}
                    <div className="flex items-end justify-between gap-12">

                        {/* BOTTOM LEFT: Now Playing */}
                        <div className="flex-1 max-w-2xl animate-in slide-in-from-bottom duration-700">
                            <div className="flex items-end gap-6">
                                {/* Status Chip */}
                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md mb-2 w-fit ${state.controls.isPlaying
                                        ? 'bg-green-500/20 text-green-300 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                    }`}>
                                    {state.controls.isPlaying ? 'Now Playing' : 'Paused'}
                                </div>
                            </div>

                            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight line-clamp-2 drop-shadow-xl mt-4 mb-2">
                                {currentVideo.title}
                            </h1>
                            <p className="text-2xl text-gray-300 font-medium line-clamp-1 opacity-80 mb-6">
                                {currentVideo.author || "YouTube Music"}
                            </p>

                            {/* Added By Badge */}
                            {currentVideo.addedBy && (
                                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/5 px-4 py-2 rounded-full w-fit">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                        {currentVideo.addedBy.displayName?.[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-gray-300 text-sm">
                                        Requested by <span className="font-bold text-white">{currentVideo.addedBy.displayName}</span>
                                    </span>
                                </div>
                            )}

                            {/* Progress Bar (Visual Only) */}
                            <div className="mt-8 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full bg-white animate-progress-indeterminate opacity-50 ${!state.controls.isPlaying && 'paused'}`}></div>
                            </div>
                        </div>


                        {/* BOTTOM RIGHT: Up Next (Minimal) */}
                        <div className="w-80 flex flex-col gap-4 animate-in slide-in-from-right duration-700 delay-200">
                            {upcomingQueue.length > 0 && (
                                <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-5 rounded-3xl shadow-2xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <MusicalNoteIcon className="w-3 h-3 text-purple-400" />
                                        Up Next
                                    </p>
                                    <div className="space-y-4">
                                        {upcomingQueue.slice(0, 2).map((item, idx) => (
                                            <div key={idx} className="flex gap-3 items-center opacity-80">
                                                <img src={getThumbnail(item)} className="w-10 h-10 rounded-lg object-cover bg-gray-800" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-white truncate leading-tight">{item.title}</p>
                                                    <p className="text-[10px] text-gray-400 truncate">{item.author}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {upcomingQueue.length > 2 && (
                                            <p className="text-xs text-gray-500 text-center pt-1">
                                                + {upcomingQueue.length - 2} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* Cast Receiver SDK */}
            <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" />

            {/* Global Styles for Animations */}
            <style jsx global>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 15s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s infinite ease-in-out;
                }
                @keyframes progress-indet {
                    0% { width: 0%; margin-left: 0%; }
                    50% { width: 50%; margin-left: 25%; }
                    100% { width: 0%; margin-left: 100%; }
                }
                .animate-progress-indeterminate {
                    animation: progress-indet 3s infinite ease-in-out;
                }
                .paused {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default TVPage;
