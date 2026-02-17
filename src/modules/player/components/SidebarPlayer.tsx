import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, X, Play, Pause, Music, User } from 'lucide-react'; // Player V2.8.0 Vanish
import Image from "next/image";
// import YouTube from "react-youtube"; // Removing direct dependency
import { UniversalPlayer } from "./UniversalPlayer";
import { usePlayerStore } from "../stores/usePlayerStore";
import { playerService } from "../services/playerService";
import { YouTubeAdapter } from "../adapters/YouTubeAdapter";
import { useSystemConfig } from "../../../hooks/useSystemConfig";
import { useUIStore } from "../../../stores/useUIStore";

import { useShallow } from 'zustand/react/shallow';
import { QuotaIndicator } from "./QuotaIndicator";

// Hooks
import { usePlayerLifecycle } from "../hooks/usePlayerLifecycle";
import { usePlayerSync } from "../hooks/usePlayerSync";

import { Tv, Radio } from 'lucide-react';

interface SidebarPlayerProps {
    isPassive?: boolean;
    isDjMode?: boolean;
    castMode?: string;
}

export const SidebarPlayer = ({ isPassive = false, isDjMode = false, castMode = 'none' }: SidebarPlayerProps) => {
    const { currentSource, isPlaying, currentVideo, setCurrentTime, currentTime, layoutMode, queue, currentIndex, duration } = usePlayerStore(
        useShallow(state => ({
            currentSource: state.currentSource,
            isPlaying: state.isPlaying,
            currentVideo: state.currentVideo,
            setCurrentTime: state.setCurrentTime,
            currentTime: state.currentTime,
            layoutMode: state.layoutMode,
            queue: state.queue,
            currentIndex: state.currentIndex,
            duration: state.duration
        }))
    );
    const playerRef = useRef<any>(null);
    const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showMiniControls, setShowMiniControls] = useState(false);

    // 🕵️ ACTIVITY TRACKING (Auto-hide controls after 5s)
    const handleActivity = () => {
        if (layoutMode !== 'fullscreen') return;

        setShowMiniControls(true);

        if (controlsTimerRef.current) {
            clearTimeout(controlsTimerRef.current);
        }

        controlsTimerRef.current = setTimeout(() => {
            setShowMiniControls(false);
        }, 5000); // 5 Seconds Vanish
    };

    // Reset when exiting fullscreen
    useEffect(() => {
        if (layoutMode !== 'fullscreen') {
            setShowMiniControls(false);
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        }
    }, [layoutMode]);

    useEffect(() => {
        return () => {
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        };
    }, []);

    // System Config Check for Allowed Sources
    const { config } = useSystemConfig();
    const allowedSources = config?.player?.allowedSources || ['youtube'];
    const isSourceAllowed = allowedSources.includes('youtube');

    useEffect(() => {
        if (!isSourceAllowed && currentSource) {
            console.warn("⛔ Source type 'youtube' is disabled by admin.");
            usePlayerStore.getState().pause();
        }
    }, [isSourceAllowed, currentSource]);

    // --- HOOKS INTEGRATION ---
    const { showDjOverlay, onPlayerReady, onPlayerStateChange } = usePlayerSync(isPassive, isDjMode, currentTime, setCurrentTime, playerRef);

    const { dailyCount, maxDailySongs, maxDuration, showAds, userRole } = usePlayerLifecycle(currentSource, showDjOverlay);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Sync Fullscreen State with Global Store (Native ESC Support)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            const currentLayout = usePlayerStore.getState().layoutMode;

            // Sync UI Store
            import('../../../stores/useUIStore').then(({ useUIStore }) => {
                useUIStore.getState().setFullscreen(isFs);
            });

            // CRITICAL SYNC: If user pressed ESC, update PlayerStore
            if (!isFs && currentLayout === 'fullscreen') {
                console.log("🖥️ Fullscreen exited natively (ESC), syncing store...");
                usePlayerStore.getState().setLayoutMode('split');
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = () => {
        // Use Global Store Trigger instead of local DOM manipulation
        // This ensures the remote control and main screen stay perfectly in sync.
        usePlayerStore.getState().triggerFullscreen();
    };

    const onReady = (target: any) => {
        playerRef.current = target;
        // Register this player instance with the adapter
        const adapter = playerService.getAdapter();
        if (adapter instanceof YouTubeAdapter) {
            adapter.setPlayer(target);
        }

        // LOAD VIDEO MANUALLY (Restored: Legacy logic proves more stable)
        const currentSrc = usePlayerStore.getState().currentSource;
        const isStorePlaying = usePlayerStore.getState().isPlaying;

        // BLOCK: If DJ Overlay is active, do NOT load video locally
        // This prevents the "Video load error" and double playing
        if (showDjOverlay) {
            console.log("🚫 onReady: DJ Overlay active, skipping local load.");
            return;
        }

        if (currentSrc) {
            if (isStorePlaying) {
                console.log("▶️ onReady: Loading & Playing initial video:", currentSrc);
                target.loadVideoById(currentSrc);
            } else {
                console.log("⏸️ onReady: Cued initial video (Paused):", currentSrc);
                target.cueVideoById(currentSrc);
            }
        }

        // AUTO-FIX: Force play if store says we are playing
        if (isStorePlaying) {
            const savedTime = usePlayerStore.getState().currentTime;
            if (savedTime > 2) {
                console.log("⏩ Resuming from:", savedTime);
                target.seekTo(savedTime);
            }
            target.playVideo();
        }
    };

    // 🕵️ SEARCH RESOLVER: If source is 'search:Query', find ID and play it
    useEffect(() => {
        if (!currentSource || !currentSource.startsWith('search:')) return;

        const performSearch = async () => {
            try {
                const query = currentSource.replace('search:', '');
                console.log("🕵️ Resolving Search Query:", query);

                // Dynamic Import to avoid cyclic if possible, or just standard import
                const { getSearchResult } = await import('../../../utils/api');

                const results = await getSearchResult({ q: query, page: 0 });
                if (results && results.length > 0) {
                    const firstHit = results[0];
                    console.log("✅ Resolved:", firstHit.title, firstHit.videoId);

                    // Update Store Entry (Optional but good for UI)
                    // But strictly we just need to load it into player
                    if (playerRef.current) {
                        playerRef.current.loadVideoById(firstHit.videoId);
                    }
                } else {
                    console.warn("❌ No results found for:", query);
                }
            } catch (e) {
                console.error("Search resolution failed:", e);
            }
        };

        performSearch();
    }, [currentSource]);

    // ⏯️ Sync Play/Pause state from store to player
    useEffect(() => {
        if (!playerRef.current || showDjOverlay) return;

        const adapter = playerService.getAdapter();
        if (isPlaying) {
            console.log("▶️ SidebarPlayer: Syncing Play");
            adapter?.play();
        } else {
            console.log("⏸️ SidebarPlayer: Syncing Pause");
            adapter?.pause();
        }
    }, [isPlaying, showDjOverlay]);

    // 🎵 Sync Source (Video ID) MANUALLY
    useEffect(() => {
        if (!playerRef.current || !currentSource || showDjOverlay) {
            if (showDjOverlay) console.log("🚫 Manual Load Blocked: DJ Overlay Active");
            return;
        }
        try {
            console.log("🔄 Manual Load Code: Switching to", currentSource);
            playerRef.current.loadVideoById(currentSource);
        } catch (e) {
            console.warn("Video load error:", e);
        }
    }, [currentSource, showDjOverlay]);

    // 🍞 Toast Logic
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState<'added' | 'upnext'>('added');
    const [upNextVideo, setUpNextVideo] = useState<any>(null);
    const hasShownUpNext = useRef<string | null>(null);

    // Track "Up Next" logic

    // Track "Up Next" logic
    useEffect(() => {
        if (!isPlaying || duration <= 0) return;

        // Show Up Next toast 20 seconds before end
        const timeLeft = duration - currentTime;
        if (timeLeft > 5 && timeLeft < 20 && queue.length > currentIndex + 1) {
            const nextVideo = queue[currentIndex + 1];
            if (hasShownUpNext.current !== nextVideo.uuid) {
                setUpNextVideo(nextVideo);
                setToastType('upnext');
                setShowToast(true);
                hasShownUpNext.current = nextVideo.uuid;

                // Broadcast to Store & Firebase
                usePlayerStore.getState().setNotification({
                    type: 'upnext',
                    video: nextVideo,
                    timestamp: Date.now()
                });

                // Hide after 10 seconds
                setTimeout(() => setShowToast(false), 10000);
            }
        }
    }, [currentTime, duration, isPlaying, queue, currentIndex]);

    // Clear notification when starting new video
    useEffect(() => {
        if (currentVideo) {
            setToastType('added');
            setShowToast(true);

            // Broadcast added notification
            usePlayerStore.getState().setNotification({
                type: 'added',
                video: currentVideo,
                timestamp: Date.now()
            });

            const timer = setTimeout(() => setShowToast(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [currentVideo?.uuid]);

    // --- RENDER LOGIC ---

    // 1. DJ Overlay Mode (Controller View)
    if (showDjOverlay) {
        return (
            <div className="w-full h-full relative group bg-black flex flex-col items-center justify-center text-center p-6 space-y-6 overflow-hidden">
                {/* Background Art (Blurred) */}
                {currentVideo?.thumbnail && (
                    <div className="absolute inset-0 opacity-20 blur-xl pointer-events-none">
                        <img src={currentVideo.thumbnail} className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="relative z-10 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20 animate-pulse shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                </div>

                <div className="relative z-10 w-full px-4">
                    <h3 className="text-xl font-bold text-white tracking-tight">โหมด DJ 2 หน้าจอ ทำงานอยู่</h3>
                    <p className="text-white/50 text-xs mt-2">วิดีโอกำลังเล่นบนจอแยก (Clean Feed)</p>
                </div>

                {/* Mini Controls for Controller */}
                {currentVideo && (
                    <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-xl p-4 w-full border border-white/10 shrink-0">
                        <p className="text-sm font-bold truncate text-white mb-1">{currentVideo.title}</p>
                        <p className="text-xs text-white/40 truncate">{currentVideo.author}</p>
                    </div>
                )}
            </div>
        );
    }

    // 1.5. Disabled Source Mode
    if (!isSourceAllowed) {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">ปิดการเล่นวิดีโอ</h3>
                    <p className="text-white/50 text-sm mt-1">ผู้ดูแลระบบปิดการใช้งานโหมดนี้ กรุณาติดต่อ Admin</p>
                </div>
            </div>
        );
    }

    // 2. Standard Video Mode
    return (
        <div
            className="w-full h-full relative group"
            onMouseMove={handleActivity}
            onClick={handleActivity}
            onTouchStart={handleActivity}
        >
            {/* Universal Player Layer (Youtube / MIDI / VCD) */}
            {/* CRITICAL: Hide player when casting to TV — video & sound play on TV only */}
            {!showDjOverlay && castMode !== 'smarttv' && (
                <div className={`absolute inset-0 max-h-full max-w-full z-0 youtube-player-wrapper`}>
                    <UniversalPlayer
                        onReady={(target) => {
                            onReady(target);
                            if (onPlayerReady) onPlayerReady({ target });
                        }}
                        onStateChange={(event) => {
                            if (onPlayerStateChange) onPlayerStateChange(event);
                        }}
                        onEnded={() => {
                            console.log("🎬 Media ended, playing next...");
                            if (!isPassive && !showDjOverlay) {
                                usePlayerStore.getState().playNext();
                            }
                        }}
                        showControls={false}
                        className="w-full h-full pointer-events-auto"
                    />
                </div>

            )}

            {/* Cast Mode Overlay — replaces video when casting to TV */}
            {castMode === 'smarttv' && (
                <div className="absolute inset-0 z-10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center text-white">
                    <div className="animate-pulse mb-3">
                        <Tv size={48} className="text-emerald-400" />
                    </div>
                    <p className="text-emerald-400 font-semibold text-lg">📡 กำลัง Cast ไปที่ TV</p>
                    {currentVideo && (
                        <p className="text-white/60 text-sm mt-2 text-center px-4 truncate max-w-full">
                            🎵 {currentVideo.title}
                        </p>
                    )}
                    <p className="text-white/30 text-xs mt-3">เสียงและวิดีโอเล่นที่หน้าจอ TV</p>
                </div>
            )}

            {/* AD OVERLAY (If show_ads is TRUE) */}
            {mounted && showAds && isPlaying && (
                <div className="absolute inset-x-0 bottom-0 h-16 bg-red-600 text-white z-40 flex items-center justify-between px-4 animate-bounce">
                    <span className="font-bold text-sm">📢 พื้นที่โฆษณาประชาสัมพันธ์</span>
                    <button className="btn btn-xs btn-white text-red-600">อัปเกรดเพื่อปิดโฆษณา</button>
                </div>
            )}

            {/* Wireless Casting Overlay (Premium Glassmorphism) */}
            {mounted && castMode !== 'none' && castMode !== 'dual' && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-500">
                    <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-4 border border-primary/30 shadow-2xl shadow-primary/20 animate-pulse">
                        <Radio className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 tracking-tight">กำลังส่งภาพไร้สาย</h3>
                    <p className="text-sm font-bold text-white/50 max-w-[200px] leading-relaxed">
                        วิดีโอถูกส่งไปแสดงผลที่อุปกรณ์อื่นแล้ว คุณสามารถควบคุมได้จากหน้าเสนอนี้
                    </p>

                    {currentVideo && (
                        <div className="mt-6 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 pr-4 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative">
                                <Image
                                    unoptimized
                                    src={currentVideo.thumbnail || `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`}
                                    fill
                                    className="object-cover"
                                    alt="Casting"
                                />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Now Casting</p>
                                <p className="text-xs font-bold text-white truncate max-w-[120px]">{currentVideo.title}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Overlay (Waiting) */}
            {!currentSource && castMode === 'none' && (
                <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center text-white/50">
                    <p>รอเลือกเพลง...</p>
                </div>
            )}

            {/* Limit Indicator */}
            {mounted && maxDuration > 0 && currentSource && (
                <div className="absolute top-2 right-2 z-20 badge badge-warning gap-1 opacity-80 text-xs">
                    <span>⏱️ จำกัดเวลา: {maxDuration}วิ</span>
                </div>
            )}

            {/* 🎯 YOUTUBE-STYLE MINI CONTROLS (Fullscreen Only - Rounded Capsule - VANISHING MODE) */}
            {layoutMode === 'fullscreen' && (
                <div
                    className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/60 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-default ${showMiniControls ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                >
                    {/* Play/Pause */}
                    <button
                        onClick={() => usePlayerStore.getState().togglePlay()}
                        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${isPlaying ? 'text-white/70 hover:text-white hover:bg-white/10' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>

                    <div className="w-[1px] h-6 bg-white/10 mx-1" />

                    {/* Exit Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="w-11 h-11 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        title="ย่อหน้าจอ"
                    >
                        <Minimize2 size={20} />
                    </button>

                    {/* Exit to Split Mode */}
                    <button
                        onClick={() => usePlayerStore.getState().setLayoutMode('split')}
                        className="w-11 h-11 flex items-center justify-center rounded-full text-red-400 hover:text-white hover:bg-red-500 transition-all active:scale-90"
                        title="ออกจากหน้าจอเต็มจอ"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>
            )}

            {/* Added By / Up Next Toast (Top-Right - Sharp V2 Metadata-Rich) */}
            {showToast && (toastType === 'added' ? currentVideo : upNextVideo) && (
                <div className={`absolute top-6 right-6 z-[60] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showToast ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                    <div className="flex items-center gap-3 bg-stone-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 pr-4 shadow-2xl ring-1 ring-white/5 w-full max-w-[280px]">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/5 shadow-inner shrink-0 relative bg-black/40">
                            <Image
                                unoptimized
                                src={(toastType === 'added' ? currentVideo : upNextVideo).thumbnail || `https://i.ytimg.com/vi/${(toastType === 'added' ? currentVideo : upNextVideo).videoId}/mqdefault.jpg`}
                                fill
                                className="object-cover"
                                alt="Cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${toastType === 'upnext' ? 'bg-amber-500 text-black' : 'bg-primary text-white'}`}>
                                    {toastType === 'upnext' ? 'ถัดไป' : 'กำลังเล่น'}
                                </span>
                            </div>
                            <h3 className="text-[13px] font-black text-white leading-tight truncate">
                                {(toastType === 'added' ? currentVideo : upNextVideo).title}
                            </h3>
                            <p className="text-[11px] font-bold text-white/50 truncate">
                                {(toastType === 'added' ? currentVideo : upNextVideo).author}
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
