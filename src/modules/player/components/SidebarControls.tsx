import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Maximize, Cast, Mic, MicOff, ChevronUp, Mic2, Music, SlidersHorizontal, Type } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useLyricsStore } from "../stores/useLyricsStore";
import { useMixerStore, type TrackType } from "../stores/useMixerStore";
import { useShallow } from "zustand/react/shallow";
import { useUIStore } from "../../../stores/useUIStore";
import { useCast } from "../../../plugins/cast/context/CastContext";
import clsx from 'clsx';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';



interface SidebarControlsProps {
    castMode?: string;
}

export const SidebarControls = ({ castMode = 'none' }: SidebarControlsProps) => {
    const {
        isPlaying,
        togglePlay,
        playNext,
        isMuted,
        setMuted,
        triggerFullscreen,
        currentTime,
        duration,
        seekTo,
        currentVideo,
        currentIndex,
        play
    } = usePlayerStore(
        useShallow(state => ({
            isPlaying: state.isPlaying,
            togglePlay: state.togglePlay,
            playNext: state.playNext,
            isMuted: state.isMuted,
            setMuted: state.setMuted,
            triggerFullscreen: state.triggerFullscreen,
            currentTime: state.currentTime,
            duration: state.duration,
            seekTo: state.seekTo,
            currentVideo: state.currentVideo,
            currentIndex: state.currentIndex,
            play: state.play
        }))
    );

    const {
        trackStates,
        volumes,
        toggleMute,
        toggleSolo,
        setVolume
    } = useMixerStore();

    const { isEnabled: showLyrics, toggleLyrics, syncOffset, setSyncOffset, preferredSource, setPreferredSource, fetchLyrics, error: lyricsError, isLoading: lyricsLoading } = useLyricsStore();

    const handleSourceChange = (src: 'auto' | 'youtube') => {
        setPreferredSource(src);
        const activeId = currentVideo?.videoId || currentVideo?.id;
        if (activeId) {
            fetchLyrics(activeId, currentVideo?.title || '', src);
        }
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const { setCastModalOpen } = useUIStore();
    const cast = useCast();
    const { isConnected, isRecovering } = cast;

    const isAnyCastOn = (castMode !== 'none' && castMode !== undefined) || isConnected;

    const aiVocalStore = useAIVocalStore();
    const activeVideoId = currentVideo?.videoId || currentVideo?.id;
    const aiJob = activeVideoId ? aiVocalStore.jobs[activeVideoId] : null;

    // Auto-resume job if requested but missing in store (e.g. page refresh)
    useEffect(() => {
        if (currentVideo?.aiVocalRequested && activeVideoId && !aiJob) {
            aiVocalStore.processAudio(activeVideoId, aiVocalStore.defaultMode).catch(console.error);
        }
    }, [currentVideo?.aiVocalRequested, activeVideoId, aiJob, aiVocalStore]);

    const isAiReady = Boolean(activeVideoId && aiJob?.status === 'ready');
    const isProMode = aiJob?.mode === 'pro';



    const [showVocalMixer, setShowVocalMixer] = useState(false);
    const vocalBtnRef = useRef<HTMLButtonElement>(null);
    const mixerRef = useRef<HTMLDivElement>(null);

    // Close mixer when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                mixerRef.current &&
                !mixerRef.current.contains(event.target as Node) &&
                vocalBtnRef.current &&
                !vocalBtnRef.current.contains(event.target as Node)
            ) {
                setShowVocalMixer(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleVolumeChange = (track: TrackType, value: number) => {
        setVolume(track, value);
    };

    // Build control items matching vocal.tsx exactly
    const controlItems = [
        {
            id: 'play',
            icon: isPlaying ? Pause : Play,
            label: "เล่น/หยุด",
            onClick: () => {
                if (isConnected) {
                    isPlaying ? cast.pause() : cast.play();
                } else {
                    togglePlay();
                }
            },
            active: isPlaying,
        },
        {
            id: 'repeat',
            icon: RotateCcw,
            label: "ร้องซ้ำ",
            onClick: () => {
                seekTo(0);
                play();
                if (isConnected) {
                    cast.seekTo(0);
                    cast.play();
                }
            },
            active: false,
        },
        {
            id: 'next',
            icon: SkipForward,
            label: "ถัดไป",
            onClick: () => {
                if (isConnected) {
                    cast.next();
                } else {
                    playNext();
                }
            },
            active: false,
        },
        {
            id: 'vocals',
            icon: (isAiReady && trackStates.vocals.muted) ? MicOff : Mic2,
            label: "ร้อง",
            onClick: () => {
                if (isAiReady) {
                    toggleMute('vocals');
                } else if (currentVideo) {
                    const uuid = currentVideo.uuid || currentVideo.id;
                    if (uuid && activeVideoId) {
                        useUIStore.getState().showVocalModeModal(uuid, activeVideoId);
                    }
                }
            },
            active: isAiReady && trackStates.vocals.muted,
            activeColor: "text-primary bg-primary/10",
            textColor: isAiReady ? (trackStates.vocals.muted ? "text-primary" : "text-black/60 dark:text-zinc-400") : "text-black/60 dark:text-zinc-400",
            disabled: false
        },
        {
            id: 'mixer',
            icon: SlidersHorizontal,
            label: "มิกเซอร์",
            onClick: () => {
                setShowVocalMixer(!showVocalMixer);
            },
            active: showVocalMixer,
            activeColor: "text-black dark:text-white bg-gray-100 dark:bg-zinc-800",
            textColor: showVocalMixer ? "text-black dark:text-white" : "text-black/60 dark:text-zinc-400",
            disabled: false,
            ref: vocalBtnRef
        },
        {
            id: 'fullscreen',
            icon: Maximize,
            label: "เต็มจอ",
            onClick: () => triggerFullscreen(),
            active: false,
        },
        {
            id: 'cast',
            icon: Cast,
            label: "CAST",
            onClick: () => setCastModalOpen(true),
            active: isAnyCastOn,
        }
    ];

    return (
        <div className="shrink-0 select-none relative shadow-sm">
            {/* Glass Background matching Footer */}
            <div className="absolute inset-0 bg-[#f4f4f5]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-zinc-800/50 transition-colors" />

            {/* Horizontal Controls Row - Full Width with depth */}
            <div className="relative flex items-center justify-between px-2 h-[56px]">
                {controlItems.map((item, index) => (
                    <button
                        key={item.id}
                        ref={item.ref as any}
                        onClick={(e) => {
                            if (item.disabled) return;
                            item.onClick();
                        }}
                        disabled={item.disabled}
                        className={clsx(
                            "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 group relative",
                            item.disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95 cursor-pointer"
                        )}
                    >
                        <div className={clsx(
                            "p-1 rounded-xl transition-all duration-300 relative flex items-center justify-center gap-0.5",
                            item.active 
                                ? (item.activeColor || "text-primary bg-primary/10") 
                                : "text-black dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white"
                        )}>
                            <item.icon
                                size={20}
                                strokeWidth={item.active ? 2.2 : 1.5}
                                className={clsx("transition-transform duration-300", item.active && "scale-105")}
                            />
                            {item.active && item.id !== 'mixer' && item.id !== 'vocals' && item.id !== 'instrumental' && (
                                <div className="absolute inset-0 bg-primary/5 blur-md -z-10" />
                            )}
                        </div>
                        <span className={clsx(
                            "text-[10px] font-medium uppercase tracking-wide transition-colors duration-200 mt-0.5",
                            item.textColor || (item.active ? "text-primary" : "text-black/60 dark:text-zinc-400")
                        )}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
            
            {/* Optional Progress Bar (Thin line at bottom) */}
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gray-200/30 dark:bg-zinc-800/30">
                <div
                    className="h-full bg-primary transition-all duration-1000 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
            
            {/* Flat Mixer Popover */}
            {showVocalMixer && (
                <div ref={mixerRef} className="absolute top-[50px] right-2 mt-2 w-72 max-h-[85vh] overflow-y-auto overscroll-contain bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-xl">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">ตั้งค่าเสียง (Audio Settings)</h4>
                    
                    {/* Master Mute */}
                    <div className={clsx("mb-3", isAiReady && "border-b border-gray-100 dark:border-zinc-800 pb-3")}>
                        <button 
                            onClick={() => {
                                if (isConnected) {
                                    cast.setMuted(!isMuted);
                                } else {
                                    setMuted(!isMuted);
                                }
                            }}
                            className={clsx(
                                "w-full py-1.5 px-3 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors border",
                                isMuted 
                                    ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800" 
                                    : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            <span>เสียงหลัก (Master)</span>
                            <span className="ml-auto text-[10px] opacity-70">{isMuted ? 'Muted' : 'On'}</span>
                        </button>
                    </div>

                    {/* AI & Volume Controls (Always Visible) */}
                    <div className="flex flex-col gap-3">
                        {/* Vocals */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => toggleMute('vocals')}
                                className={clsx(
                                    "w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors border",
                                    trackStates.vocals.muted 
                                        ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800" 
                                        : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                )}
                            >
                                {trackStates.vocals.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-black dark:text-white">เสียงร้อง (Vocals)</span>
                                    <span className="text-[10px] font-bold text-primary">{trackStates.vocals.muted ? 0 : volumes.vocals}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={trackStates.vocals.muted ? 0 : volumes.vocals} onChange={(e) => handleVolumeChange('vocals', parseInt(e.target.value))} className="w-full h-1 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none accent-primary" />
                            </div>
                        </div>

                        {/* Instrumental (Basic Mode or Karaoke) */}
                        {!isProMode && (
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => toggleMute('instrumental')}
                                    className={clsx(
                                        "w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors border",
                                        trackStates.instrumental.muted 
                                            ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800" 
                                            : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                    )}
                                >
                                    {trackStates.instrumental.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                </button>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-black dark:text-white">ดนตรี (Instrumental)</span>
                                        <span className="text-[10px] font-bold text-blue-500">{trackStates.instrumental.muted ? 0 : volumes.instrumental}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={trackStates.instrumental.muted ? 0 : volumes.instrumental} onChange={(e) => handleVolumeChange('instrumental', parseInt(e.target.value))} className="w-full h-1 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none accent-blue-500" />
                                </div>
                            </div>
                        )}

                        {/* Pro Mode Tracks */}
                        {isProMode && (
                            <>
                                {/* Drums */}
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => toggleMute('drums')}
                                        className={clsx(
                                            "w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors border",
                                            trackStates.drums.muted 
                                                ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800" 
                                                : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        {trackStates.drums.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-black dark:text-white">กลอง (Drums)</span>
                                            <span className="text-[10px] font-bold text-orange-500">{trackStates.drums.muted ? 0 : volumes.drums}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={trackStates.drums.muted ? 0 : volumes.drums} onChange={(e) => handleVolumeChange('drums', parseInt(e.target.value))} className="w-full h-1 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none accent-orange-500" />
                                    </div>
                                </div>

                                {/* Bass */}
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => toggleMute('bass')}
                                        className={clsx(
                                            "w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors border",
                                            trackStates.bass.muted 
                                                ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800" 
                                                : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        {trackStates.bass.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-black dark:text-white">เบส (Bass)</span>
                                            <span className="text-[10px] font-bold text-purple-500">{trackStates.bass.muted ? 0 : volumes.bass}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={trackStates.bass.muted ? 0 : volumes.bass} onChange={(e) => handleVolumeChange('bass', parseInt(e.target.value))} className="w-full h-1 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none accent-purple-500" />
                                    </div>
                                </div>

                                {/* Other */}
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => toggleMute('other')}
                                        className={clsx(
                                            "w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors border",
                                            trackStates.other.muted 
                                                ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800" 
                                                : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        {trackStates.other.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-black dark:text-white">ดนตรีอื่นๆ (Other)</span>
                                            <span className="text-[10px] font-bold text-blue-500">{trackStates.other.muted ? 0 : volumes.other}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={trackStates.other.muted ? 0 : volumes.other} onChange={(e) => handleVolumeChange('other', parseInt(e.target.value))} className="w-full h-1 bg-gray-200 dark:bg-zinc-700 rounded-full appearance-none accent-blue-500" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Lyrics Toggle */}
                    <div className={clsx("mt-4 pt-3", isAiReady || isConnected ? "border-t border-gray-100 dark:border-zinc-800" : "")}>
                        <button 
                            onClick={toggleLyrics}
                            className={clsx(
                                "w-full py-1.5 px-3 rounded-xl flex items-center justify-between gap-2 text-xs font-bold transition-colors border",
                                showLyrics 
                                    ? "bg-primary text-white border-primary" 
                                    : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Type size={14} />
                                <span>เนื้อเพลง (Lyrics)</span>
                            </div>
                            <span className="text-[10px] opacity-70">{showLyrics ? 'On' : 'Off'}</span>
                        </button>
                        
                        {lyricsError && showLyrics && (
                            <div className="mt-2 text-[10px] text-red-500 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                {lyricsError}
                            </div>
                        )}
                        {lyricsLoading && showLyrics && (
                            <div className="mt-2 text-[10px] text-blue-500 font-medium bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                กำลังค้นหาเนื้อเพลง...
                            </div>
                        )}
                        
                        {/* Lyrics Details Controls */}
                        {showLyrics && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-700/50 flex flex-col gap-2">
                                {/* Source Selector */}
                                <div>
                                    <div className="text-[9px] font-bold mb-1 text-black/70 dark:text-zinc-400 uppercase">
                                        แหล่งข้อมูล (Source)
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={() => handleSourceChange('auto')}
                                            className={clsx(
                                                "flex-1 py-1 rounded shadow-sm text-[9px] font-bold transition-all border",
                                                preferredSource === 'auto' 
                                                    ? "bg-primary text-white border-primary" 
                                                    : "bg-white dark:bg-zinc-700 text-black dark:text-white border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600"
                                            )}
                                        >
                                            LRCLIB
                                        </button>
                                        <button 
                                            onClick={() => handleSourceChange('youtube')}
                                            className={clsx(
                                                "flex-1 py-1 rounded shadow-sm text-[9px] font-bold transition-all border",
                                                preferredSource === 'youtube' 
                                                    ? "bg-blue-600 text-white border-blue-600" 
                                                    : "bg-white dark:bg-zinc-700 text-black dark:text-white border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600"
                                            )}
                                        >
                                            YouTube CC
                                        </button>
                                    </div>
                                </div>

                                {/* Sync Offset Controls */}
                                <div>
                                    <div className="flex justify-between items-center text-[9px] font-bold mb-1 text-black/70 dark:text-zinc-400 uppercase">
                                        <span>ปรับเวลา (Sync)</span>
                                        <span className={syncOffset !== 0 ? "text-primary" : ""}>
                                            {syncOffset > 0 ? '+' : ''}{syncOffset.toFixed(1)}s
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={() => setSyncOffset(syncOffset - 0.5)}
                                            className="flex-1 py-1 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded shadow-sm text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-600 active:scale-95 transition-all text-black dark:text-white"
                                        >
                                            -0.5s
                                        </button>
                                        <button 
                                            onClick={() => setSyncOffset(0)}
                                            className="px-2 py-1 bg-gray-200 dark:bg-zinc-800 rounded text-[9px] font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                                        >
                                            Reset
                                        </button>
                                        <button 
                                            onClick={() => setSyncOffset(syncOffset + 0.5)}
                                            className="flex-1 py-1 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded shadow-sm text-xs font-bold hover:bg-gray-50 dark:hover:bg-zinc-600 active:scale-95 transition-all text-black dark:text-white"
                                        >
                                            +0.5s
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

