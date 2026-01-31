import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { QRCodeSVG } from 'qrcode.react';
import {
    DevicePhoneMobileIcon,
    SpeakerXMarkIcon,
    SpeakerWaveIcon,
    MusicalNoteIcon,
    LightBulbIcon,
    PlayIcon,
    PauseIcon,
    ForwardIcon,
    BackwardIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    ListBulletIcon,
} from '@heroicons/react/24/outline';
import Script from 'next/script';
import { useReceiverLogic } from '../hooks/useReceiverLogic';

const TVPage = () => {
    // --- NO SSR GUARD ---
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    const { roomCode, state, isConnected, setState, mode, debugMsg } = useReceiverLogic(player);

    // UI State (mirrored from monitor.tsx)
    const [hasUserInteraction, setHasUserInteraction] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showQueue, setShowQueue] = useState(true);
    const [baseUrl, setBaseUrl] = useState<string>('');

    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastQueueLengthRef = useRef(0);

    // Detect base URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    // --- PLAYER SYNC ---
    useEffect(() => {
        if (!player || !state) return;
        try {
            if (state.controls.isPlaying) player.playVideo();
            else player.pauseVideo();

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

    // Auto-hide controls
    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Queue visibility logic (Auto show on change)
    useEffect(() => {
        if (!state.queue) return;
        const currentLength = state.queue.length;
        if (currentLength !== lastQueueLengthRef.current && lastQueueLengthRef.current !== 0) {
            setShowQueue(true);
        }
        lastQueueLengthRef.current = currentLength;
    }, [state.queue?.length]);


    // --- UI HELPERS ---
    const currentVideo = state.currentVideo;
    const qrCodeUrl = baseUrl ? `${baseUrl}/remote?session=${roomCode}` : '';

    const onStateChange = (e: any) => {
        if (e.data === 0) {
            // Video ended - logic handled by ReceiverLogic via DB updates or local prediction
            // We implement local optimistic update here for instant feedback
            const nextIndex = state.currentIndex + 1;
            if (state.queue && nextIndex < state.queue.length) {
                const nextVideo = state.queue[nextIndex];
                setState(prev => ({
                    ...prev,
                    currentIndex: nextIndex,
                    currentVideo: nextVideo,
                    controls: { ...prev.controls, isPlaying: true }
                }));
            }
        }
    };

    if (!mounted) return <div className="bg-black w-screen h-screen" />;

    // 1. IDLE SCREEN (Matched to Monitor.tsx)
    if (!currentVideo) {
        return (
            <div
                className="relative h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white cursor-pointer overflow-hidden font-sans"
                onClick={() => setHasUserInteraction(true)}
            >
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
                                        <div className="flex items-center gap-3 pl-11">
                                            <div className="flex-1 border-t border-white/30"></div>
                                            <span className="text-xs text-white/70">หรือ</span>
                                            <div className="flex-1 border-t border-white/30"></div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                <span className="text-primary font-bold">2</span>
                                            </div>
                                            <p className="text-white">เปิด <span className="font-mono font-semibold text-primary">{baseUrl ? `${new URL(baseUrl).hostname}/tv` : 'youoke.vercel.app/tv'}</span></p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                <span className="text-primary font-bold">3</span>
                                            </div>
                                            <p className="text-white">กดปุ่ม <span className="font-semibold text-primary">&quot;Cast to TV&quot;</span></p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                <span className="text-primary font-bold">4</span>
                                            </div>
                                            <p className="text-white">กรอกเลขห้อง <span className="font-bold text-primary">{roomCode}</span></p>
                                        </div>
                                    </div>

                                    {!hasUserInteraction && (
                                        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                                            <p className="text-sm text-primary flex items-center gap-2">
                                                <LightBulbIcon className="w-5 h-5" />
                                                <span className="font-medium">คลิกหน้าจอเพื่อเริ่มเสียง</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-lg text-white/70 mt-8 animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full animate-ping"></span>
                        รอเชื่อมต่อจากมือถือ...
                    </p>

                    {/* Mode Debugger */}
                    <div className="absolute top-4 right-4 text-[10px] text-gray-600 font-mono">
                        Mode: {mode} | {isConnected ? 'Online' : 'Offline'}
                    </div>
                </div>
                <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" />
            </div>
        );
    }

    // 2. PLAYER SCREEN (Matched to Monitor.tsx)
    const handlePrevious = async () => {
        if (!state.queue || state.currentIndex <= 0) return;
        const newIndex = state.currentIndex - 1;
        const newVideo = state.queue[newIndex];

        // Optimistic
        setState(prev => ({ ...prev, currentIndex: newIndex, currentVideo: newVideo, controls: { ...prev.controls, isPlaying: true } }));

        // Firebase
        const { update, ref } = await import('firebase/database');
        const { realtimeDb } = await import('../firebase');
        if (roomCode && realtimeDb) {
            update(ref(realtimeDb, `rooms/${roomCode}/state`), {
                currentIndex: newIndex,
                currentVideo: newVideo,
                controls: { ...state.controls, isPlaying: true }
            });
        }
    };

    const handleNext = async () => {
        if (!state.queue || state.currentIndex >= state.queue.length - 1) return;
        const newIndex = state.currentIndex + 1;
        const newVideo = state.queue[newIndex];

        // Optimistic
        setState(prev => ({ ...prev, currentIndex: newIndex, currentVideo: newVideo, controls: { ...prev.controls, isPlaying: true } }));

        // Firebase
        const { update, ref } = await import('firebase/database');
        const { realtimeDb } = await import('../firebase');
        if (roomCode && realtimeDb) {
            update(ref(realtimeDb, `rooms/${roomCode}/state`), {
                currentIndex: newIndex,
                currentVideo: newVideo,
                controls: { ...state.controls, isPlaying: true }
            });
        }
    };

    const handlePlayPause = async () => {
        const newIsPlaying = !state.controls.isPlaying;

        // Optimistic
        setState(prev => ({ ...prev, controls: { ...prev.controls, isPlaying: newIsPlaying } }));

        // Firebase
        const { update, ref } = await import('firebase/database');
        const { realtimeDb } = await import('../firebase');
        if (roomCode && realtimeDb) {
            update(ref(realtimeDb, `rooms/${roomCode}/state/controls`), {
                isPlaying: newIsPlaying
            });
        }
    };

    const handleMuteToggle = async () => {
        const newIsMuted = !state.controls.isMuted;
        // Optimistic
        setState(prev => ({ ...prev, controls: { ...prev.controls, isMuted: newIsMuted } }));

        // Firebase
        const { update, ref } = await import('firebase/database');
        const { realtimeDb } = await import('../firebase');
        if (roomCode && realtimeDb) {
            update(ref(realtimeDb, `rooms/${roomCode}/state/controls`), {
                isMuted: newIsMuted
            });
        }
    };


    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden font-sans text-white">
            {/* YouTube Player */}
            <div className="absolute inset-0">
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
                            disablekb: 1,
                            fs: 0,
                        }
                    }}
                    className="w-full h-full pointer-events-none"
                    onReady={(e) => {
                        setPlayer(e.target);
                        if (!hasUserInteraction) e.target.mute();
                        else e.target.unMute();
                    }}
                    onStateChange={onStateChange}
                />
            </div>

            {/* Audio Hint Overlay */}
            {!hasUserInteraction && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 cursor-pointer" onClick={() => {
                    setHasUserInteraction(true);
                    try { player?.unMute(); } catch (e) { }
                }}>
                    <div className="text-center bg-primary/90 px-12 py-8 rounded-3xl shadow-xl animate-pulse">
                        <SpeakerXMarkIcon className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold">กดเพื่อเปิดเสียง</h2>
                    </div>
                </div>
            )}

            {/* Top Right: Queue Widget (Dual Style) */}
            {state.queue && state.queue.length > 0 && (
                <div className={`absolute top-8 right-8 w-96 bg-black/80 backdrop-blur-xl rounded-3xl p-6 z-40 shadow-2xl transition-all duration-500 pointer-events-none transform ${showQueue ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>

                    {/* Styles for Infinite Marquee */}
                    <style>{`
                      @keyframes marquee-infinite {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                      }
                      .animate-marquee-infinite {
                        animation: marquee-infinite 20s linear infinite;
                        display: flex;
                        width: max-content;
                        will-change: transform;
                      }
                    `}</style>

                    {/* Header: Now Playing */}
                    <div className="mb-4 overflow-hidden relative">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <MusicalNoteIcon className="w-5 h-5 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-widest">Now Playing</span>
                        </div>

                        {currentVideo ? (
                            (() => {
                                const title = currentVideo.title || "";
                                const isLong = title.length > 30;
                                return (
                                    <div className="relative w-full overflow-hidden">
                                        {isLong ? (
                                            <div className="animate-marquee-infinite">
                                                <h1 className="text-white font-medium text-sm whitespace-nowrap mr-16">{title}</h1>
                                                <h1 className="text-white font-medium text-sm whitespace-nowrap mr-16">{title}</h1>
                                            </div>
                                        ) : (
                                            <h1 className="text-white font-medium text-sm truncate">{title}</h1>
                                        )}
                                    </div>
                                );
                            })()
                        ) : (
                            <h1 className="text-white font-medium text-sm truncate">Loading...</h1>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/10 w-full mb-3"></div>

                    {/* Up Next List */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <ListBulletIcon className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Up Next</span>
                        </div>

                        {(() => {
                            const currentIndex = state.currentIndex;
                            const nextSongs = state.queue.slice(currentIndex + 1, currentIndex + 4);

                            if (nextSongs.length === 0) return <p className="text-xs text-gray-500 italic">No more songs.</p>;

                            return (
                                <>
                                    {nextSongs.map((v, i) => (
                                        <div key={i} className="flex gap-3 text-sm text-gray-300 items-center">
                                            <span className="text-xs text-gray-500 font-mono">{(currentIndex + 1) + (i + 1)}</span>
                                            <span className="line-clamp-1 opacity-80">{v.title}</span>
                                        </div>
                                    ))}
                                    {(state.queue.length - (currentIndex + 1 + nextSongs.length) > 0) && (
                                        <p className="text-xs text-gray-500 mt-2 pl-6">+ อีก {state.queue.length - (currentIndex + 1 + nextSongs.length)} เพลง</p>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Top Left: Room Code (Keep this form TV style, it's useful) */}
            <div className="absolute top-8 left-8 z-40 opacity-50 hover:opacity-100 transition-opacity">
                <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10 flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">Room</span>
                    <span className="text-lg font-bold text-primary tracking-widest">{roomCode}</span>
                </div>
            </div>

            {/* Bottom Center: Floating Controls (Dual Style) */}
            <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="bg-black/60 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-6 border border-white/10 shadow-2xl">

                    {/* Play/Pause */}
                    <button onClick={handlePlayPause} className="p-1 hover:bg-white/20 rounded-full transition-colors group">
                        {state.controls.isPlaying ? (
                            <PauseIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        ) : (
                            <PlayIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        )}
                    </button>

                    {/* Mute (Dynamic Icon) */}
                    <button onClick={handleMuteToggle} className="p-1 hover:bg-white/20 rounded-full transition-colors order-3">
                        {state.controls.isMuted ? <SpeakerXMarkIcon className="w-6 h-6 text-white/80" /> : <SpeakerWaveIcon className="w-6 h-6 text-white/80" />}
                    </button>

                    {/* Next Song */}
                    <button onClick={handleNext} className="p-1 hover:bg-white/20 rounded-full transition-colors order-2 block">
                        <ForwardIcon className="w-8 h-8 text-white hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" />
        </div>
    );
};

export default TVPage;
