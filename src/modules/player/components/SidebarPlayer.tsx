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

import { Tv, Radio, Monitor, Power, PlayCircle } from 'lucide-react';

interface SidebarPlayerProps {
    isPassive?: boolean;
    isDjMode?: boolean;
    castMode?: string;
    roomCode?: string | null;
    onDisconnect?: () => void;
    onForcePlay?: () => void;
}

export const SidebarPlayer = ({ isPassive = false, isDjMode = false, castMode = 'none', roomCode = null, onDisconnect, onForcePlay }: SidebarPlayerProps) => {
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
    const { showDjOverlay, onPlayerReady, onPlayerStateChange } = usePlayerSync(isPassive, isDjMode, currentTime, setCurrentTime, playerRef, castMode);

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

        // Local player always loads (Phase 6)


        // Video loading is now managed by UniversalPlayer props (Phase 11)
        // We only handle initial playback sync here
        if (isStorePlaying) {
            const savedTime = usePlayerStore.getState().currentTime;

            // Allow a small delay for the player to settle before commanding play/seek
            setTimeout(() => {
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

        // If it's a special source type, handle accordingly
        if (currentSource.startsWith('search:')) return;

        // For standard IDs, UniversalPlayer already updates via props.
        // We only use playerRef.current for play/pause/seek controls.
    }, [currentSource]);
    // 🔇 LOCAL MUTE BRIDGE: Prevent sound on Dashboard when casting to Monitor
    useEffect(() => {
        if (!playerRef.current) return;
        const target = playerRef.current;

        if (castMode === 'smarttv' || castMode === 'webmonitor') {
            console.log('🔇 SidebarPlayer: Local Mute active (Casting Mode)');
            if (typeof target.mute === 'function') target.mute();
        } else {
            if (typeof target.unMute === 'function') target.unMute();
        }
    }, [castMode]);
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
            <div className={`absolute inset-0 max-h-full max-w-full z-0 youtube-player-wrapper`}>
                {(castMode === 'none') ? (
                    <UniversalPlayer
                        onReady={(target) => {
                            if (onPlayerReady) onPlayerReady({ target });
                        }}
                        onStateChange={(event: any) => {
                            if (onPlayerStateChange) onPlayerStateChange(event);
                        }}
                        onEnded={() => {
                            console.log("🎬 Media ended, playing next...");
                            if (!isPassive) {
                                usePlayerStore.getState().playNext();
                            }
                        }}
                        showControls={false}
                        className="w-full h-full pointer-events-auto"
                    />
                ) : (
                    /* 📺 Casting Overlay (Restored - Phase 10 logic with better UI) */
                    <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center space-y-6 z-20">
                        <div className="relative h-24 w-32 flex items-center justify-center">
                            <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                            {/* Dual Screen Icon Composition */}
                            <div className="relative">
                                <Monitor className="w-16 h-16 text-primary/30 -translate-x-6" />
                                <Monitor className="w-16 h-16 text-primary absolute top-0 left-0 translate-x-4 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-white tracking-tight leading-tight">
                                {(castMode === 'smarttv' || castMode === 'webmonitor') ? 'เชื่อมต่อหน้าจอทีวีแล้ว' : castMode === 'dual' ? 'เชื่อมต่อหน้าจอที่สองแล้ว' : 'กำลังเริ่มเชื่อมต่อ...'}
                            </h3>
                        </div>

                        {/* Now Playing Info (Standardized Monitor Style - Clean & Premium) */}
                        {currentVideo && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex flex-col items-center">
                                    <h4 className="text-lg font-black text-white leading-tight px-4 line-clamp-2 drop-shadow-lg opacity-90">{currentVideo.title}</h4>
                                    <p className="text-[11px] text-white/40 font-bold mt-1.5 opacity-60">{currentVideo.author}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-4">
                            {castMode !== 'none' && !isPlaying && (
                                <button
                                    onClick={onForcePlay || (() => usePlayerStore.getState().play())}
                                    className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-primary text-white rounded-2xl transition-all font-black text-sm mx-auto shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 group"
                                >
                                    <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span>กดเพื่อเริ่มเล่นวิดีโอ</span>
                                </button>
                            )}

                            {onDisconnect && (
                                <button
                                    onClick={onDisconnect}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-white/20 hover:text-red-500 rounded-xl transition-all font-bold text-[10px] mx-auto uppercase tracking-widest hover:bg-red-500/10"
                                >
                                    <Power className="w-3 h-3" />
                                    <span>ยกเลิกการเชื่อมต่อ</span>
                                </button>
                            )}
                        </div>

                        <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em] mx-auto leading-relaxed pt-2">
                            วิดีโอและเสียงแสดงผลบนหน้าจอทีวี
                        </p>
                    </div>
                )}

                {/* 📡 SmartTV Casting Indicator Over Player (Subtler V2) */}
                {castMode === 'smarttv' && (
                    <div className="absolute top-4 left-4 z-40">
                        <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-xl border border-white/10 px-3.5 py-1.5 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="relative w-1.5 h-1.5">
                                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
                                <div className="relative w-full h-full bg-primary rounded-full" />
                            </div>
                            <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.15em]">Casting to TV {roomCode && `#${roomCode}`}</span>
                        </div>
                    </div>
                )}
            </div>


            {/* Casting Overlays REMOVED (Phase 6) */}


            {/* Overlay (Waiting) */}
            {
                !currentSource && (

                    <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center text-white/50">
                        <p>รอเลือกเพลง...</p>
                    </div>
                )
            }

            {/* Limit Indicator */}
            {
                mounted && maxDuration > 0 && currentSource && (
                    <div className="absolute top-2 right-2 z-20 badge badge-warning gap-1 opacity-80 text-xs">
                        <span>⏱️ จำกัดเวลา: {maxDuration}วิ</span>
                    </div>
                )
            }

            {/* 🎯 YOUTUBE-STYLE MINI CONTROLS (Fullscreen Only - Rounded Capsule - VANISHING MODE) */}
            {
                layoutMode === 'fullscreen' && (
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
                )
            }

            {/* Added By / Up Next Toast (Top-Right - Sharp V2 Metadata-Rich) */}
            {
                (() => {
                    if (!showToast) return null;
                    const activeVideo = (toastType === 'added' ? currentVideo : upNextVideo);
                    if (!activeVideo) return null;

                    const thumb = activeVideo.thumbnail || (activeVideo.videoId ? `https://i.ytimg.com/vi/${activeVideo.videoId}/mqdefault.jpg` : "/icon-cover.png");

                    return (
                        <div className={`absolute top-6 right-6 z-[60] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showToast ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                            <div className="flex items-center gap-3 bg-stone-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 pr-4 shadow-2xl ring-1 ring-white/5 w-full max-w-[280px]">
                                {/* Thumbnail */}
                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/5 shadow-inner shrink-0 relative bg-black/40">
                                    <Image
                                        unoptimized
                                        src={thumb}
                                        fill
                                        className="object-cover"
                                        alt="Cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/icon-cover.png";
                                        }}
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
                                        {activeVideo.title || "Unknown Title"}
                                    </h3>
                                    <p className="text-[11px] font-bold text-white/50 truncate">
                                        {activeVideo.author || "Unknown"}
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
