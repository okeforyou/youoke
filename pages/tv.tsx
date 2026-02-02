import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { useFullscreen, useToggle } from 'react-use';
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
} from '@heroicons/react/24/outline';
import Script from 'next/script';
import { useReceiverLogic } from '../hooks/useReceiverLogic';
import UnifiedPlayerInterface from '../components/UnifiedPlayerInterface';

const TVPage = () => {
    // --- NO SSR GUARD ---
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);



    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    const { roomCode, state, isConnected, setState, mode, debugMsg } = useReceiverLogic(player);

    // UI State (mirrored from monitor.tsx)
    const [showControls, setShowControls] = useState(true);
    const [showQueue, setShowQueue] = useState(true);
    const [baseUrl, setBaseUrl] = useState<string>('');
    const fullscreenRef = useRef<HTMLDivElement>(null);

    // Aggressive Auto-Unmute Removed - conflicts with remote control
    // Player sync effect below handles mute state correctly using Firebase state

    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastQueueLengthRef = useRef(0);

    // Fullscreen Logic
    const [showFullscreen, toggleFullscreen] = useToggle(false);
    const isFullscreen = useFullscreen(fullscreenRef, showFullscreen, { onClose: () => toggleFullscreen(false) });


    // --- DETECT BASE URL ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    // --- SCREEN WAKE LOCK ---
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    // @ts-ignore
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('✅ Screen wake lock activated');
                } catch (err: any) {
                    console.error(`❌ Wake Lock error: ${err.name}, ${err.message}`);
                }
            }
        };

        requestWakeLock();

        const handleVisibilityChange = () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLock !== null) wakeLock.release().then(() => console.log('✅ Wake lock released'));
        };
    }, []);

    // --- ROBUST PLAYER SYNC LOOP ---
    // Instead of relying solely on reactive updates (which can be missed if player isn't ready),
    // we use a loop to ENFORCE the desired state. This fixes "multiple clicks needed" and "stuck on mute".
    const [needsInteraction, setNeedsInteraction] = useState(false);

    // --- ROBUST PLAYER SYNC LOOP ---
    useEffect(() => {
        if (!player || !state) return;

        const syncPlayerState = async () => {
            try {
                // 1. Sync Play/Pause
                const playerState = await player.getPlayerState();
                const targetIsPlaying = state.controls.isPlaying;

                // YT Player States: 1 = Playing, 2 = Paused, 3 = Buffering, 5 = Cued
                if (targetIsPlaying) {
                    if (playerState !== 1 && playerState !== 3) { // If not playing/buffering
                        player.playVideo();
                    }
                } else {
                    if (playerState === 1) { // If playing
                        player.pauseVideo();
                    }
                }

                // 2. Sync Mute (Aggressive Unmute)
                const isPlayerMuted = await player.isMuted();
                const targetIsMuted = state.controls.isMuted;

                if (targetIsMuted && !isPlayerMuted) {
                    player.mute();
                    setNeedsInteraction(false);
                } else if (!targetIsMuted && isPlayerMuted) {
                    // Try to unmute
                    player.unMute();
                    // If still muted after attempt, it means browser blocked it -> Show Overlay
                    // We check again next tick, but setting flag here helps UI
                    setTimeout(async () => {
                        const stillMuted = await player.isMuted();
                        if (stillMuted) setNeedsInteraction(true);
                        else setNeedsInteraction(false);
                    }, 100);
                } else {
                    setNeedsInteraction(false);
                }

            } catch (e) {
                // Ignore transient errors (e.g. player destroying)
            }
        };

        // Execute IMMEDIATELY on state change (instant response)
        syncPlayerState();

        // And keep polling for drift/errors (robustness)
        const syncInterval = setInterval(syncPlayerState, 500);

        return () => clearInterval(syncInterval);
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


    // Stable Options to prevent re-renders
    const playerOpts = React.useMemo(() => ({
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
            // @ts-ignore - 'mute' is valid for YouTube Player API but missing in Types definition
            mute: 1
        }
    } as any), []);

    // --- UI HELPERS ---
    const currentVideo = state.currentVideo;
    const qrCodeUrl = baseUrl ? `${baseUrl}/?castRoom=${roomCode}` : '';

    const onStateChange = async (e: any) => {
        if (e.data === 0) {
            // Video ended - Move to next song
            const nextIndex = state.currentIndex + 1;
            if (state.queue && nextIndex < state.queue.length) {
                const nextVideo = state.queue[nextIndex];

                // 1. Optimistic Update (Local)
                setState(prev => ({
                    ...prev,
                    currentIndex: nextIndex,
                    currentVideo: nextVideo,
                    controls: { ...prev.controls, isPlaying: true }
                }));

                // 2. Sync to Firebase (Global)
                const { update, ref } = await import('firebase/database');
                const { realtimeDb } = await import('../firebase');
                if (roomCode && realtimeDb) {
                    try {
                        await update(ref(realtimeDb, `rooms/${roomCode}/state`), {
                            currentIndex: nextIndex,
                            currentVideo: nextVideo,
                            controls: { ...state.controls, isPlaying: true }
                        });
                        console.log('✅ Auto-Next: Synced to Firebase');
                    } catch (error) {
                        console.error('❌ Auto-Next Sync Failed:', error);
                    }
                }
            } else {
                // End of queue logic (optional: clear current video or stop)
                console.log('🏁 Queue finished');
            }
        }
    };

    if (!mounted) return <div className="bg-black w-screen h-screen" />;

    // 1. IDLE SCREEN (Matched to Monitor.tsx)
    if (!currentVideo) {
        return (
            <div
                className="relative h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white cursor-pointer overflow-hidden font-sans"
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


    // 2. PLAYER SCREEN (Matched to Monitor.tsx)
    // ... handlers ...

    return (
        <div ref={fullscreenRef} className="relative w-screen h-screen bg-black overflow-hidden font-sans text-white">
            {/* YouTube Player */}
            <div className="absolute inset-0">
                <YouTube
                    videoId={currentVideo.videoId}
                    opts={playerOpts}
                    className="w-full h-full pointer-events-none"
                    onReady={(e) => {
                        setPlayer(e.target);
                        // Auto-unmute aggressive attempt
                        e.target.unMute();
                        e.target.setVolume(100);
                        setTimeout(() => e.target.unMute(), 1000);
                    }}
                    onStateChange={onStateChange}
                />
            </div>

            {/* Audio Blocked Overlay */}
            {needsInteraction && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
                    onClick={() => {
                        if (player) {
                            player.unMute();
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

            {/* Shared Unified Interface (Queue, Controls, Status) */}
            <UnifiedPlayerInterface
                videoId={currentVideo.videoId}
                queue={state.queue}
                isPlaying={state.controls.isPlaying}
                isMuted={state.controls.isMuted}
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onMuteToggle={handleMuteToggle}
                onToggleFullscreen={() => toggleFullscreen()}
                isFullscreen={isFullscreen}
                hidePlaybackControls={true}
            // roomCode={roomCode} // Hide Room Code on SmartTV for clean view
            // forceShowQueue={true} // Revert to Auto-Hide (only show on update/add)
            />

            <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" />
        </div>
    );
};

export default TVPage;
