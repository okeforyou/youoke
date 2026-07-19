import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, X, Play, Pause, Music, User, Sparkles, Loader2 } from 'lucide-react'; // Player V2.8.0 Vanish
import Image from "next/image";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { UniversalPlayer } from "./UniversalPlayer";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { usePlayerStore } from "../stores/usePlayerStore";
import { playerService } from "../services/playerService";
import { YouTubeAdapter } from "../adapters/YouTubeAdapter";
import { useSystemConfig } from "../../../hooks/useSystemConfig";
import { useUIStore } from "../../../stores/useUIStore";
import { safeSplit } from '@/utils/stringUtils';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';
import { AIVocalJobsIndicator } from './AIVocalJobsIndicator';

import { useShallow } from 'zustand/react/shallow';
import { QuotaIndicator } from "./QuotaIndicator";

// Hooks
import { usePlayerLifecycle } from "../hooks/usePlayerLifecycle";
import { usePlayerSync } from "../hooks/usePlayerSync";
import { useAiProcessor } from "../../../hooks/useAiProcessor";
import { useCast } from "../../../plugins/cast/context/CastContext";
import { ToastNotification } from './ToastNotification';
import { MiniControls } from './MiniControls';

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
    const { user } = useAuthStore();
    const playerRef = useRef<any>(null);
    const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showMiniControls, setShowMiniControls] = useState(false);
    const cast = useCast();

    // AI Vocal Store
    const aiVocal = useAIVocalStore();



    // Start background AI processing loop
    useAiProcessor();

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
                const rawQuery = currentSource.replace('search:', '');
                
                // Dynamic Import to avoid cyclic if possible, or just standard import
                const { getSearchResult, cleanSearchQuery } = await import('../../../utils/api');
                const query = cleanSearchQuery(rawQuery);
                console.log("🕵️ Resolving Search Query (Cleaned):", query);

                const results = await getSearchResult({ q: query, page: 0 });
                if (results && results.length > 0) {
                    // 🛡️ Compilation/Medley Filter Strategy: Avoid playing compiled tracks/mixes
                    const compilationKeywords = [
                        "รวมเพลง", "ฟังยาว", "longplay", "non-stop", "nonstop", "รวมฮิต",
                        "เมดเล่ย์", "เมดเลย์", "2 ชม", "3 ชม", "ชั่วโมง", "hour", "full album",
                        "รวมอัลบั้ม", "เพลงฟังต่อเนื่อง", "เพลงเพราะๆฟังต่อเนื่อง", "playlist", "เพลย์ลิสต์"
                    ];

                    const firstHit = results.find((item: any) => {
                        const titleLower = (item.title || "").toLowerCase();
                        return !compilationKeywords.some(keyword => titleLower.includes(keyword));
                    }) || results[0];

                    console.log("✅ Resolved (Single Filter Applied):", firstHit.title, firstHit.videoId);

                    // ✅ RESOLVE & SYNC: Update the store so UniversalPlayer can mount the YouTube IFrame
                    const playerStore = usePlayerStore.getState();
                    const { queue, currentIndex, currentSource: latestSource } = playerStore;

                    // 🛡️ Safety: Only update if we are still on the same search item
                    if (latestSource === currentSource && queue[currentIndex]) {
                        const newQueue = [...queue];
                        newQueue[currentIndex] = {
                            ...newQueue[currentIndex],
                            videoId: firstHit.videoId,
                            sourceType: 'youtube', // Ensure it's marked as youtube for UniversalPlayer
                            thumbnail: firstHit.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${firstHit.videoId}/mqdefault.jpg`
                        };

                        // Update store immediately to trigger YouTube mount and persistent state
                        playerStore.setPlayerState({
                            queue: newQueue,
                            currentVideo: newQueue[currentIndex],
                            currentSource: firstHit.videoId,
                            isPlaying: true // Ensure it plays after resolving
                        });

                        console.log("🎯 Store Updated with Resolved ID:", firstHit.videoId);
                    } else {
                        console.warn("⏳ Search resolved but user already moved to next song or source changed.");
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

        // Reset AI Vocal state when changing song
        useAIVocalStore.getState().reset();

        const target = playerRef.current;
        // 🛡️ CRITICAL SAFETY: Ensure the player's internal iframe/element still exists
        if (typeof target.getIframe === 'function' && !target.getIframe()) {
            playerRef.current = null;
            return;
        }

        // For standard IDs, UniversalPlayer already updates via props.
        // We only use playerRef.current for play/pause/seek controls.
    }, [currentSource]);
    // 🔇 LOCAL MUTE BRIDGE: Prevent sound on Dashboard when casting to Monitor (Handled inside UniversalPlayer)
    // 🍞 Toast Logic
    // 🍞 Toast Logic (Moved to ToastNotification.tsx)


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
            <div className={`absolute inset-0 w-full h-full z-0 youtube-player-wrapper bg-black`}>
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
                        forceMute={castMode === 'smarttv' || castMode === 'webmonitor'}
                        className="w-full h-full pointer-events-auto"
                    />
                ) : (
                    /* 📺 Casting Overlay (Minimalist Design - Aligned with /dual) */
                    <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center space-y-8 z-30 animate-in fade-in duration-700">
                        <div className="relative">
                            <div className="text-6xl mb-4 relative z-10">🖥️</div>
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

                            <div className="flex items-center gap-3 px-5 py-2.5 bg-red-500/10 rounded-full border border-red-500/20">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse border border-red-400/20"></div>
                                <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em]">Casting Active</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>


            {/* Casting Overlays REMOVED (Phase 6) */}

            {/* 🤖 AI Processing Background Jobs Tracker */}
            <AIVocalJobsIndicator />


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
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="p-2">
                                    <Music className="w-8 h-8 text-white animate-bounce" style={{ animationDuration: '3s' }} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-white tracking-wide">ยังไม่มีรายการเพลง</p>
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em]">รอเลือกเพลงจากรายการ...</p>
                                </div>
                            </div>
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



            {/* Limit Indicator Removed (v2.10.3) */}

            {/* 🎯 YOUTUBE-STYLE MINI CONTROLS (Fullscreen Only - Rounded Capsule - VANISHING MODE) */}
            {/* 🎯 YOUTUBE-STYLE MINI CONTROLS */}
            {!isPassive && (
                <MiniControls showMiniControls={showMiniControls} layoutMode={layoutMode} />
            )}

            {/* 🏝️ iOS DYNAMIC ISLAND STYLE NOTIFICATION */}
            {!isPassive && <ToastNotification />}


        </div >
    );
};
