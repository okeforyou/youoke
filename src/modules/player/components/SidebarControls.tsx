import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Maximize, Cast, Mic, MicOff, ChevronUp, Mic2, Music, SlidersHorizontal, Type, Drum, Guitar, Piano, MicVocal, X, Sparkles } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useLyricsStore } from "../stores/useLyricsStore";
import { useMixerStore, type TrackType } from "../stores/useMixerStore";
import { useShallow } from "zustand/react/shallow";
import { useUIStore } from "../../../stores/useUIStore";
import { useCast } from "../../../plugins/cast/context/CastContext";
import clsx from 'clsx';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';


const VolumeSlider = ({ value, onChange, muted }: { value: number, onChange: (val: number) => void, muted: boolean }) => {
    const [isDragging, setIsDragging] = useState(false);
    return (
        <div className="relative h-6 flex items-center group w-full"
            onMouseEnter={() => setIsDragging(true)}
            onMouseLeave={() => setIsDragging(false)}
        >
            <div className="absolute w-full h-[3px] bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-75 ${muted ? 'bg-gray-400 dark:bg-gray-500' : 'bg-primary'}`} 
                    style={{ width: `${value}%` }} 
                />
            </div>
            
            <div 
                className={`absolute w-3.5 h-3.5 rounded-full border-[2px] bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center transition-all duration-75 pointer-events-none ${isDragging ? 'scale-125' : 'scale-100'} ${muted ? 'border-gray-400 dark:border-gray-500' : 'border-primary'}`}
                style={{ left: `calc(${value}% - 7px)` }}
            />

            <div 
                className={`absolute -top-7 px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-md transition-opacity duration-150 pointer-events-none flex flex-col items-center justify-center ${isDragging ? 'opacity-100' : 'opacity-0'} ${muted ? 'bg-gray-500' : 'bg-primary'}`}
                style={{ left: `calc(${value}% - 7px)`, transform: 'translateX(-50%)', zIndex: 50 }}
            >
                {value}%
                <div className={`absolute -bottom-1 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent ${muted ? 'border-t-gray-500' : 'border-t-primary'}`} />
            </div>

            <input 
                type="range" 
                min="0" 
                max="100" 
                value={value} 
                onChange={(e) => onChange(parseInt(e.target.value))}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                className="absolute w-full h-full opacity-0 cursor-pointer" 
            />
        </div>
    );
};


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

    const { isEnabled: showLyrics, toggleLyrics, syncOffset, setSyncOffset, preferredSource, setPreferredSource, fetchLyrics, error: lyricsError, isLoading: lyricsLoading, isGeneratingAI, generateAILyrics } = useLyricsStore();

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
            
            {/* Mixer Modal */}
            {showVocalMixer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        ref={mixerRef} 
                        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-y-auto overscroll-contain"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <SlidersHorizontal size={16} className="text-primary" />
                                ตั้งค่าเสียง (Mixer)
                            </h3>
                            <button 
                                onClick={() => setShowVocalMixer(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        
                        {/* Master Mute */}
                        <div className={clsx("mb-5", isAiReady && "border-b border-gray-100 dark:border-zinc-800 pb-5")}>
                            <button 
                                onClick={() => {
                                    if (isConnected) {
                                        cast.setMuted(!isMuted);
                                    } else {
                                        setMuted(!isMuted);
                                    }
                                }}
                                className={clsx(
                                    "w-full py-2.5 px-4 rounded-xl flex items-center gap-3 text-sm font-bold transition-colors border",
                                    isMuted 
                                        ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800" 
                                        : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                )}
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                <span>เสียงหลัก (Master)</span>
                                <span className="ml-auto text-[11px] opacity-70 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md">
                                    {isMuted ? 'Muted' : 'On'}
                                </span>
                            </button>
                        </div>

                        {/* AI & Volume Controls (Always Visible) */}
                        <div className="flex flex-col gap-4">
                            {/* Vocals */}
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => toggleMute('vocals')}
                                    className={clsx(
                                        "w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all border",
                                        trackStates.vocals.muted 
                                            ? "bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 border-transparent opacity-60 hover:opacity-80" 
                                            : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                    )}
                                >
                                    <div className="relative flex items-center justify-center">
                                        <MicVocal size={18} />
                                    </div>
                                </button>
                                <div className="flex-1 flex flex-col justify-center">
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

