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
import { useCast } from "../../../plugins/cast/context/CastContext";

import { Tv, Radio, Monitor, Power, PlayCircle } from 'lucide-react';

interface SidebarPlayerProps {
    isPassive?: boolean;
    isDjMode?: boolean;
    castMode?: string;
    roomCode?: string | null;
    onDisconnect?: () => void;
    onForcePlay?: () => void;
    onPlayerInit?: () => void;
    onEnded?: () => void;
}

export const SidebarPlayer = ({ isPassive = false, isDjMode = false, castMode = 'none', roomCode = null, onDisconnect, onForcePlay, onPlayerInit, onEnded }: SidebarPlayerProps) => {
    const { currentSource, isPlaying, isMuted, currentVideo, setCurrentTime, currentTime, layoutMode, queue, currentIndex, duration } = usePlayerStore(
        useShallow(state => ({
            currentSource: state.currentSource,
            isPlaying: state.isPlaying,
            isMuted: state.isMuted,
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
    const cast = useCast();

    const handlePlayPause = () => {
        if (cast.isConnected) {
            isPlaying ? cast.pause() : cast.play();
        } else {
            usePlayerStore.getState().togglePlay();
        }
    };

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
    const { showDjOverlay, onPlayerReady, onPlayerStateChange } = usePlayerSync(isPassive, isDjMode, currentTime, setCurrentTime, playerRef, castMode);

    const { dailyCount, maxDailySongs, maxDuration, showAds, userRole } = usePlayerLifecycle(currentSource, showDjOverlay);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Sync Fullscreen State with Global Store (Native ESC Support)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
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

        // SYNC BODY BACKGROUND & THEME COLOR for "Red Line" issue
        const themeMetas = document.querySelectorAll('meta[name="theme-color"]');
        if (layoutMode === 'fullscreen') {
            document.body.style.backgroundColor = 'black';
            themeMetas.forEach(m => m.setAttribute('content', '#000000'));
        } else {
            document.body.style.backgroundColor = '';
            themeMetas.forEach(m => m.setAttribute('content', '#ef4444'));
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.body.style.backgroundColor = '';
            themeMetas.forEach(m => m.setAttribute('content', '#ef4444'));
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, [layoutMode]);

    const toggleFullscreen = () => {
        // Use Global Store Trigger instead of local DOM manipulation
        // This ensures the remote control and main screen stay perfectly in sync.
        usePlayerStore.getState().triggerFullscreen();
    };

    const handlePlayerReady = (target: any) => {
        playerRef.current = target;
        // Register this player instance with the adapter
        const adapter = playerService.getAdapter();
        if (adapter instanceof YouTubeAdapter) {
            adapter.setPlayer(target);
        }

        // Essential for usePlayerSync logic
        if (onPlayerReady) onPlayerReady({ target });

        // Notify Monitor / Parent
        if (onPlayerInit) onPlayerInit();

        // LOAD VIDEO MANUALLY (Restored: Legacy logic proves more stable)
        const currentSrc = usePlayerStore.getState().currentSource;
        const isStorePlaying = usePlayerStore.getState().isPlaying;

        // Local player always loads (Phase 6)


        // Video loading is now managed by UniversalPlayer props (Phase 11)
        // We only handle initial playback sync here
        if (isStorePlaying) {
            const savedTime = usePlayerStore.getState().currentTime;

            // Allow a small delay for the player to settle before commanding play/seek
            setTimeout(() => {
                // 🛡️ Safety check: Ensure target is still valid and has iframe
                if (typeof target.getIframe === 'function' && !target.getIframe()) {
                    console.log("⏸️ onReady: Player became invalid during timeout, skipping...");
                    return;
                }

                if (savedTime > 2) {
                    console.log("⏩ onReady: Resuming from", savedTime);
                    target.seekTo(savedTime);
                }
                console.log("▶️ onReady: Ensuring playback starts");
                target.playVideo();
            }, 500);
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

    useEffect(() => {
        if (!playerRef.current) return;


        try {
            const adapter = playerService.getAdapter();
            if (!adapter) return;

            // 🛡️ CRITICAL SAFETY: Ensure the player's internal iframe/element still exists
            // This prevents "null reading src" errors when the component unmounts quickly
            const internalPlayer = playerRef.current;
            if (!internalPlayer || (typeof internalPlayer.getIframe === 'function' && !internalPlayer.getIframe())) {
                console.warn("⏯️ SidebarPlayer: Sync skipped - Player not ready or detached");
                return;
            }

            if (isPlaying) {
                console.log("▶️ SidebarPlayer: Syncing Play");
                adapter.play();
            } else {
                console.log("⏸️ SidebarPlayer: Syncing Pause");
                adapter.pause();
            }
        } catch (e) {
            console.warn("Player control error:", e);
        }
    }, [isPlaying, showDjOverlay]);

    // 📺 MANUAL LOAD SYNC: Handled via Props in UniversalPlayer (Phase 11)
    // We only keep the search resolver and search: logic if needed, 
    // but the actual loadVideoById for standard IDs should be managed by UniversalPlayer props.
    useEffect(() => {
        if (!playerRef.current || !currentSource) return;

        const target = playerRef.current;
        // 🛡️ CRITICAL SAFETY: Ensure the player's internal iframe/element still exists
        if (typeof target.getIframe === 'function' && !target.getIframe()) {
            playerRef.current = null;
            return;
        }

        // For standard IDs, UniversalPlayer already updates via props.
        // We only use playerRef.current for play/pause/seek controls.
    }, [currentSource]);
    // 🔇 LOCAL MUTE BRIDGE: Prevent sound on Dashboard when casting to Monitor OR when manually muted
    useEffect(() => {
        const target = playerRef.current;
        if (!target) return;

        // 🛡️ CRITICAL SAFETY: Ensure the player's internal iframe/element still exists
        if (typeof target.getIframe === 'function' && !target.getIframe()) {
            playerRef.current = null;
            return;
        }

        const shouldMute = castMode === 'smarttv' || castMode === 'webmonitor' || isMuted;

        if (shouldMute) {
            console.log(`🔇 SidebarPlayer: Muting (Reason: ${isMuted ? 'Manual' : 'Casting'})`);
            if (typeof target.mute === 'function') target.mute();
        } else {
            console.log('🔊 SidebarPlayer: Unmuting');
            if (typeof target.unMute === 'function') target.unMute();
        }
    }, [castMode, isMuted]);
    // 🍞 Toast Logic
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState<'added' | 'upnext'>('added');
    const [activeToastVideo, setActiveToastVideo] = useState<any>(null);
    const [upNextVideo, setUpNextVideo] = useState<any>(null);
    const hasShownUpNext = useRef<string | null>(null);

    // Update active toast video when showToast becomes true
    useEffect(() => {
        if (showToast) {
            const v = (toastType === 'added' ? currentVideo : upNextVideo);
            if (v) setActiveToastVideo(v);
        } else {
            // Keep the content for 1 second to allow exit animation to finish
            const timer = setTimeout(() => {
                setActiveToastVideo(null);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [showToast, toastType, currentVideo, upNextVideo]);

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

    // DJ Overlay Mode REMOVED (Phase 6)
    // We now always show the local player on Dashboard.


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
            <div className={`absolute inset-0 max-h-full max-w-full z-0 youtube-player-wrapper bg-black`}>
                {(castMode === 'none' || isPassive) ? (
                    <UniversalPlayer
                        onReady={(target) => {
                            handlePlayerReady(target);
                        }}
                        onStateChange={(event: any) => {
                            if (onPlayerStateChange) onPlayerStateChange(event);
                        }}
                        onEnded={() => {
                            console.log("🎬 Media ended, notifying parent...");
                            if (onEnded) onEnded();
                            if (!isPassive) {
                                usePlayerStore.getState().playNext();
                            }
                        }}
                        showControls={false}
                        className="w-full h-full pointer-events-auto"
                    />
                ) : (
                    /* 📺 Casting Overlay (Minimalist Design - Aligned with /dual) */
                    <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center space-y-8 z-30 animate-in fade-in duration-700">
                        <div className="relative">
                            <div className="text-6xl mb-4 relative z-10">🖥️</div>
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse z-0" />
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                                {castMode === 'dual' ? 'จอภาพโหมดสายต่อ (HDMI)'
                                    : castMode === 'google' ? 'Google ChromeCast (TV)'
                                        : 'จอภาพไร้สาย (Wireless Display)'}
                            </h3>
                            <p className="text-white/40 text-[13px] font-bold tracking-wide">
                                {currentSource ? `เชื่อมต่อระบบ ${castMode === 'dual' ? 'HDMI' : castMode === 'google' ? 'Cast' : 'Wireless'} สำเร็จ` : 'รอเพลงจากหน้าจอหลัก...'}
                            </p>
                        </div>

                        {/* Now Playing Info (Standardized Monitor Style - Clean & Premium) */}
                        {currentVideo ? (
                            <div key={currentVideo.uuid} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 w-full max-w-[300px] animate-in slide-in-from-bottom-4 duration-700">
                                <div className="flex flex-col items-center">
                                    <h4 className="text-[15px] font-black text-white leading-tight line-clamp-2 text-center">{currentVideo.title}</h4>
                                    <p className="text-[11px] text-white/40 font-bold mt-2 uppercase tracking-wider">{currentVideo.author}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-white/20 text-xs font-bold animate-pulse">กำลังดึงข้อมูลเพลง...</div>
                        )}

                        <div className="flex flex-col items-center gap-6 pt-4 w-full">

                            <div className="flex items-center gap-3 px-5 py-2.5 bg-red-500/10 rounded-full border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em]">Casting Active</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>


            {/* Casting Overlays REMOVED (Phase 6) */}


            {/* Overlay (Waiting) */}
            {
                !isPassive && !currentSource && (
                    <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center text-white/50 space-y-4">
                        {queue.length > 0 ? (
                            <>
                                <div className="loading loading-spinner text-primary"></div>
                                <p className="text-xs font-bold uppercase tracking-widest animate-pulse">กำลังเตรียมเพลงถัดไป...</p>
                            </>
                        ) : (
                            <p>รอเลือกเพลง...</p>
                        )}
                    </div>
                )
            }

            {/* 🎯 FULL-SCREEN ACTIVITY OVERLAY: Catches taps to show controls since iframe blocks parent clicks */}
            {layoutMode === 'fullscreen' && !showMiniControls && (
                <div
                    className="absolute inset-0 z-40 cursor-pointer"
                    onClick={handleActivity}
                    onTouchStart={handleActivity}
                />
            )}

            {/* Limit Indicator */}
            {
                !isPassive && mounted && maxDuration > 0 && currentSource && (
                    <div className="absolute top-2 right-2 z-20 badge badge-warning gap-1 opacity-80 text-xs">
                        <span>⏱️ จำกัดเวลา: {maxDuration}วิ</span>
                    </div>
                )
            }

            {/* 🎯 YOUTUBE-STYLE MINI CONTROLS (Fullscreen Only - Rounded Capsule - VANISHING MODE) */}
            {
                !isPassive && layoutMode === 'fullscreen' && (
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/60 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-default ${showMiniControls ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                    >
                        {/* Play/Pause */}
                        <button
                            onClick={handlePlayPause}
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
                )
            }

            {/* 🏝️ iOS DYNAMIC ISLAND STYLE NOTIFICATION (Top-Center) */}
            {
                (() => {
                    if (isPassive || !activeToastVideo) return null;
                    const thumb = activeToastVideo.thumbnail || (activeToastVideo.videoId ? `https://i.ytimg.com/vi/${activeToastVideo.videoId}/mqdefault.jpg` : "/icon-cover.png");

                    return (
                        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[110] transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${showToast ? 'opacity-100 translate-y-0 scale-100 blur-0' : 'opacity-0 -translate-y-12 scale-[0.8] pointer-events-none blur-sm'}`}>
                            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-2xl rounded-full py-2 px-3 pl-2 shadow-2xl min-w-[260px] max-w-[90vw]">
                                {/* Thumbnail (Circular) with Ring */}
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shadow-lg shrink-0 relative bg-stone-900 group">
                                    <img
                                        src={thumb}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        alt="Cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex flex-col min-w-0 flex-1 pr-2">
                                    <div className="flex items-center justify-between gap-3 overflow-hidden">
                                        <h3 className="text-[13px] font-black text-white leading-tight truncate">
                                            {activeToastVideo.title || "Unknown Title"}
                                        </h3>
                                        {toastType === 'upnext' && (
                                            <span className="text-[9px] font-black uppercase tracking-tighter shrink-0 px-2 py-0.5 rounded-full shadow-sm bg-amber-500 text-black">
                                                ถัดไป
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-bold text-white/50 truncate mt-1">
                                        {activeToastVideo.author || "Unknown"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })()
            }

        </div >
    );
};
