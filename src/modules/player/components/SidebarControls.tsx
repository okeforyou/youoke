import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Maximize, Cast, Mic, MicOff, ChevronUp, Mic2, Music, SlidersHorizontal, Type, Drum, Guitar, Piano, MicVocal, X, Sparkles, FileQuestion, Edit2 } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useLyricsStore } from "../stores/useLyricsStore";
import { useMixerStore, type TrackType } from "../stores/useMixerStore";
import { useShallow } from "zustand/react/shallow";
import { useUIStore } from "../../../stores/useUIStore";
import { useCast } from "../../../plugins/cast/context/CastContext";
import clsx from 'clsx';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';
import { useDeepgramLyricsStore } from "../../lyrics/stores/useDeepgramLyricsStore";


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
    const router = useRouter();
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

    const { isEnabled: showLyrics, isKaraokeMode, toggleLyrics, toggleKaraokeMode, syncOffset, setSyncOffset, preferredSource, setPreferredSource, fetchLyrics, error: lyricsError, isLoading: lyricsLoading, lyricsType, source, activeLineText, lyrics } = useLyricsStore();
    const { alignHybridLyrics, isAligning, alignmentStatus, hybridModeEnabled, setHybridModeEnabled, errorMessage } = useDeepgramLyricsStore();

    const handleSourceChange = (src: 'auto' | 'youtube') => {
        setPreferredSource(src);
        const activeId = currentVideo?.videoId || currentVideo?.id;
        if (activeId) {
            fetchLyrics(activeId, currentVideo?.title || '', src, currentVideo?.duration);
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
            aiVocalStore.processAudio(activeVideoId, currentVideo?.title || "Unknown Title", aiVocalStore.defaultMode).catch(console.error);
        }
    }, [currentVideo?.aiVocalRequested, currentVideo?.title, activeVideoId, aiJob, aiVocalStore]);

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
                            "text-xs font-medium uppercase tracking-wide transition-colors duration-200 mt-0.5",
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
            {showVocalMixer && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        ref={mixerRef} 
                        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[24px] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-hidden"
                    >
                        <div className="p-6 overflow-y-auto overscroll-contain flex flex-col h-full w-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 shrink-0">
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
                                "w-full py-2.5 px-4 rounded-xl flex items-center gap-4 text-sm font-bold transition-colors border",
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
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-bold text-black dark:text-white">เสียงร้อง (Vocals)</span>
                                </div>
                                <VolumeSlider value={trackStates.vocals.muted ? 0 : volumes.vocals} onChange={(val) => handleVolumeChange('vocals', val)} muted={trackStates.vocals.muted} />
                            </div>
                        </div>

                        {/* Instrumental (Basic Mode or Karaoke) */}
                        {!isProMode && (
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => toggleMute('instrumental')}
                                    className={clsx(
                                        "w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all border",
                                        trackStates.instrumental.muted 
                                            ? "bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 border-transparent opacity-60 hover:opacity-80" 
                                            : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                    )}
                                >
                                    <div className="relative flex items-center justify-center">
                                        <Music size={18} />
                                    </div>
                                </button>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-bold text-black dark:text-white">ดนตรี (Instrumental)</span>
                                    </div>
                                    <VolumeSlider value={trackStates.instrumental.muted ? 0 : volumes.instrumental} onChange={(val) => handleVolumeChange('instrumental', val)} muted={trackStates.instrumental.muted} />
                                </div>
                            </div>
                        )}

                        {/* Pro Mode Tracks */}
                        {isProMode && (
                            <>
                                {/* Drums */}
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => toggleMute('drums')}
                                        className={clsx(
                                            "w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all border",
                                            trackStates.drums.muted 
                                                ? "bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 border-transparent opacity-60 hover:opacity-80" 
                                                : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <Drum size={18} />
                                        </div>
                                    </button>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-bold text-black dark:text-white">กลอง (Drums)</span>
                                        </div>
                                        <VolumeSlider value={trackStates.drums.muted ? 0 : volumes.drums} onChange={(val) => handleVolumeChange('drums', val)} muted={trackStates.drums.muted} />
                                    </div>
                                </div>

                                {/* Bass */}
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => toggleMute('bass')}
                                        className={clsx(
                                            "w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all border",
                                            trackStates.bass.muted 
                                                ? "bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 border-transparent opacity-60 hover:opacity-80" 
                                                : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <Guitar size={18} />
                                        </div>
                                    </button>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-bold text-black dark:text-white">เบส (Bass)</span>
                                        </div>
                                        <VolumeSlider value={trackStates.bass.muted ? 0 : volumes.bass} onChange={(val) => handleVolumeChange('bass', val)} muted={trackStates.bass.muted} />
                                    </div>
                                </div>

                                {/* Other */}
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => toggleMute('other')}
                                        className={clsx(
                                            "w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all border",
                                            trackStates.other.muted 
                                                ? "bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 border-transparent opacity-60 hover:opacity-80" 
                                                : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <Piano size={18} />
                                        </div>
                                    </button>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-bold text-black dark:text-white">ดนตรีอื่นๆ (Other)</span>
                                        </div>
                                        <VolumeSlider value={trackStates.other.muted ? 0 : volumes.other} onChange={(val) => handleVolumeChange('other', val)} muted={trackStates.other.muted} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                        <div className={clsx("mt-6 pt-5", isAiReady || isConnected ? "border-t border-gray-100 dark:border-zinc-800" : "")}>
                            <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/50 rounded-2xl overflow-hidden flex flex-row items-center justify-between p-2">
                                {/* Lyrics Toggle */}
                                <button 
                                    onClick={toggleLyrics}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-colors",
                                        showLyrics ? "text-primary" : "text-black/70 dark:text-zinc-300"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Type size={16} className={showLyrics ? "text-primary" : "opacity-60"} />
                                        <span>เนื้อเพลง</span>
                                        {showLyrics && source && (
                                            <span className={clsx("hidden sm:inline-block ml-1 text-[9px] px-1.5 py-0.5 rounded font-black", lyricsType === 'synced' ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-gray-500/10 text-gray-500 dark:text-gray-400")}>
                                                {lyricsType === 'synced' ? 'SYNC' : 'PLAIN'}
                                            </span>
                                        )}
                                    </div>
                                    <div className={clsx(
                                        "w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center shadow-inner ml-2",
                                        showLyrics ? "bg-primary" : "bg-gray-300 dark:bg-zinc-700"
                                    )}>
                                        <div className={clsx(
                                            "w-3.5 h-3.5 bg-white rounded-full transition-transform shadow-sm",
                                            showLyrics ? "translate-x-3.5" : "translate-x-0"
                                        )} />
                                    </div>
                                </button>
                                
                                {showLyrics && (
                                    <div className="w-[1px] h-8 bg-gray-200 dark:bg-zinc-700/50 mx-1" />
                                )}
                                
                                {/* Sweep Toggle */}
                                {showLyrics && (
                                    <button 
                                        onClick={toggleKaraokeMode}
                                        className={clsx(
                                            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold transition-colors",
                                            isKaraokeMode ? "text-primary" : "text-black/70 dark:text-zinc-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles size={16} className={isKaraokeMode ? "text-primary" : "opacity-60"} />
                                            <span>ปาดสี</span>
                                        </div>
                                        <div className={clsx(
                                            "w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center shadow-inner ml-2",
                                            isKaraokeMode ? "bg-primary" : "bg-gray-300 dark:bg-zinc-700"
                                        )}>
                                            <div className={clsx(
                                                "w-3.5 h-3.5 bg-white rounded-full transition-transform shadow-sm",
                                                isKaraokeMode ? "translate-x-3.5" : "translate-x-0"
                                            )} />
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {(lyricsError && showLyrics) && (
                            <div className="mt-3 shrink-0 overflow-hidden rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/50">
                                <div className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-gray-400 mb-1">
                                        <FileQuestion size={20} strokeWidth={1.5} />
                                    </div>
                                    <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200">
                                        ไม่พบเนื้อเพลงในระบบ
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-[200px] leading-relaxed mx-auto">
                                        {preferredSource === 'youtube' 
                                            ? "เพลงนี้ยังไม่มีคำบรรยาย (CC) บน YouTube" 
                                            : "เพลงนี้ยังไม่มีเนื้อเพลงในฐานข้อมูล LRCLIB"}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {lyricsLoading && showLyrics && (
                            <div className="mt-3 p-4 flex flex-col items-center justify-center gap-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 rounded-2xl">
                                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">กำลังค้นหาเนื้อเพลง...</span>
                            </div>
                        )}
                        
                        {/* Lyrics Details Controls */}
                        {showLyrics && (
                            <div className="mt-3 p-4 bg-gray-50/80 dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-700/50 flex flex-col gap-4">
                                {/* Edit in Studio Button */}
                                {currentVideo && (
                                    <div className="flex flex-col gap-2 w-full">
                                        <button
                                            onClick={() => {
                                                router.push(`/creator?edit=${currentVideo.id}`);
                                            }}
                                            className="w-full py-2.5 bg-zinc-900 hover:bg-black dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit2 size={14} />
                                            <span>แก้ไขเนื้อเพลงใน Studio</span>
                                        </button>

                                        <button
                                            onClick={async () => {
                                                if (hybridModeEnabled) {
                                                    setHybridModeEnabled(false);
                                                } else {
                                                    await alignHybridLyrics(activeVideoId!, lyrics);
                                                }
                                            }}
                                            disabled={isAligning || !lyrics || lyrics.length === 0}
                                            className={clsx(
                                                "w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2",
                                                hybridModeEnabled 
                                                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50" 
                                                    : "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                            )}
                                        >
                                            <Sparkles size={14} className={clsx(isAligning && "animate-pulse")} />
                                            <span>{isAligning ? "กำลังปรับจังหวะ..." : (hybridModeEnabled ? "ปิดโหมด AI Sync" : "ปรับจังหวะด้วย AI (Hybrid)")}</span>
                                        </button>
                                        
                                        {errorMessage && (
                                            <p className="text-[10px] text-red-500 text-center font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                                                {errorMessage}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Source Selector */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <div className="w-1 h-3 rounded-full bg-gray-300 dark:bg-zinc-600" />
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 tracking-wider">แหล่งข้อมูล (SOURCE)</span>
                                    </div>
                                    <div className="flex items-center p-1 bg-gray-200/50 dark:bg-zinc-900/50 rounded-lg">
                                        <button 
                                            onClick={() => handleSourceChange('auto')}
                                            className={clsx(
                                                "flex-1 py-1.5 rounded-md shadow-sm text-[10px] font-bold transition-all",
                                                preferredSource === 'auto' 
                                                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow" 
                                                    : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white shadow-none"
                                            )}
                                        >
                                            LRCLIB
                                        </button>
                                        <button 
                                            onClick={() => handleSourceChange('youtube')}
                                            className={clsx(
                                                "flex-1 py-1.5 rounded-md shadow-sm text-[10px] font-bold transition-all",
                                                preferredSource === 'youtube' 
                                                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow" 
                                                    : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white shadow-none"
                                            )}
                                        >
                                            YouTube CC
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            ,
            document.body
        )}
        </div>
    );
};

