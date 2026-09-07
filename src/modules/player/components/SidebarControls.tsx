import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../../../context/ToastContext";
import { useRouter } from "next/router";
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Maximize, Cast, Mic, MicOff, ChevronUp, Mic2, Music, SlidersHorizontal, Type, Drum, Guitar, Piano, MicVocal, X, Sparkles, FileQuestion, Edit2, Wand2, Database, Gauge, Minus, Plus } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useLyricsStore } from "../stores/useLyricsStore";
import { useMixerStore, type TrackType } from "../stores/useMixerStore";
import { useShallow } from "zustand/react/shallow";
import { useUIStore } from "../../../stores/useUIStore";
import { useCast } from "../../../plugins/cast/context/CastContext";
import clsx from 'clsx';
import { useAIVocalStore, getActiveBridgeBaseUrl } from '../../../stores/useAIVocalStore';
import { useDeepgramLyricsStore } from "../../lyrics/stores/useDeepgramLyricsStore";


const VolumeSlider = ({ value, onChange, muted }: { value: number, onChange: (val: number) => void, muted: boolean, color?: string }) => {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <div className="relative h-5 flex items-center group w-full select-none"
            onMouseEnter={() => setIsDragging(true)}
            onMouseLeave={() => setIsDragging(false)}
        >
            <div className="absolute w-full h-[4px] bg-gray-200 dark:bg-zinc-700/60 rounded-full overflow-hidden">
                <div 
                    className={clsx(
                        "h-full transition-all duration-75 rounded-full",
                        muted ? "bg-zinc-400 dark:bg-zinc-600" : "bg-primary shadow-sm shadow-primary/30"
                    )} 
                    style={{ width: `${value}%` }} 
                />
            </div>
            
            <div 
                className={clsx(
                    "absolute w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-zinc-900 shadow-md flex items-center justify-center transition-all duration-75 pointer-events-none",
                    isDragging ? "scale-125" : "scale-100",
                    muted ? "border-zinc-400 dark:border-zinc-600" : "border-primary"
                )}
                style={{ left: `calc(${value}% - 7px)` }}
            />

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
                className="absolute w-full h-full opacity-0 cursor-pointer z-20" 
            />
        </div>
    );
};


interface SidebarControlsProps {
    castMode?: string;
}

export const SidebarControls = ({ castMode = 'none' }: SidebarControlsProps) => {
    const router = useRouter();
    const { addToast } = useToast() || {};
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
        pitchShift,
        playbackRate,
        toggleMute,
        toggleSolo,
        setVolume,
        setPitchShift,
        setPlaybackRate,
        resetPitchAndSpeed
    } = useMixerStore();

    const { isEnabled: showLyrics, setLyricsEnabled, isKaraokeMode, toggleLyrics, toggleKaraokeMode, syncOffset, setSyncOffset, preferredSource, setPreferredSource, fetchLyrics, error: lyricsError, isLoading: lyricsLoading, lyricsType, source, activeLineText, lyrics } = useLyricsStore();
    const { alignHybridLyrics, isAligning, alignmentStatus, hybridModeEnabled, setHybridModeEnabled, errorMessage } = useDeepgramLyricsStore();

    const handleSourceChange = (src: 'auto' | 'youtube' | 'deepgram') => {
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
            onClick: async () => {
                const uuid = currentVideo?.uuid || currentVideo?.id;
                const latestJobs = useAIVocalStore.getState().jobs;
                const isReady = Boolean(activeVideoId && (isAiReady || latestJobs[activeVideoId]?.status === 'ready'));

                if (isReady) {
                    if (uuid && !currentVideo?.aiVocalRequested) {
                        usePlayerStore.getState().updateQueueItem(uuid, { aiVocalRequested: true });
                    }
                    toggleMute('vocals');
                } else if (activeVideoId) {
                    // Try checking local cache right now
                    const baseUrl = await getActiveBridgeBaseUrl();
                    if (baseUrl) {
                        try {
                            const res = await fetch(`${baseUrl}/files/${activeVideoId}/vocals.m4a`, { method: 'HEAD', signal: AbortSignal.timeout(1500) });
                            if (res.ok) {
                                useAIVocalStore.setState((state) => ({
                                    jobs: {
                                        ...state.jobs,
                                        [activeVideoId]: { status: 'ready', message: 'พร้อมเล่น!', progress: 100, mode: 'basic' }
                                    }
                                }));
                                if (uuid && !currentVideo?.aiVocalRequested) {
                                    usePlayerStore.getState().updateQueueItem(uuid, { aiVocalRequested: true });
                                }
                                toggleMute('vocals');
                                return;
                            }
                        } catch {}
                    }
                    if (uuid) {
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
            
            {/* Mixer Modal - Comfortable, Readable, Zero Scrollbar */}
            {showVocalMixer && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div 
                        ref={mixerRef} 
                        className="relative w-full max-w-[460px] bg-white dark:bg-[#121218] border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden text-zinc-900 dark:text-white"
                    >
                        <div className="p-4 sm:p-5 flex flex-col w-full gap-3">
                            {/* 1. Header */}
                            <div className="flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                                        <SlidersHorizontal size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black tracking-wide text-zinc-900 dark:text-white leading-tight">
                                            ตั้งค่าเสียง & คีย์เพลง (Mixer)
                                        </h3>
                                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">ปรับคีย์ ความเร็ว และแยกแทร็กเสียง</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => resetPitchAndSpeed()}
                                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                                    >
                                        รีเซ็ต
                                    </button>
                                    <button 
                                        onClick={() => setShowVocalMixer(false)}
                                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* 2. Key Transpose & Speed Console */}
                            <div className="bg-gray-50 dark:bg-zinc-800/40 p-3 rounded-2xl border border-gray-100 dark:border-zinc-700/60 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between gap-3">
                                    {/* Pitch Shift Stepper */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                                            <Music size={14} className="text-primary" />
                                            <span className="text-xs font-bold">คีย์:</span>
                                        </div>
                                        <div className="flex items-center bg-white dark:bg-zinc-900 p-0.5 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
                                            <button
                                                onClick={() => setPitchShift((pitchShift ?? 0) - 1)}
                                                disabled={(pitchShift ?? 0) <= -6}
                                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white text-xs font-bold disabled:opacity-30 transition-all flex items-center justify-center font-mono"
                                                title="ลดคีย์ (-1 semitone)"
                                            >
                                                ♭
                                            </button>
                                            <span className="px-2.5 text-xs font-mono font-black text-primary min-w-[54px] text-center">
                                                {(pitchShift ?? 0) === 0 ? 'ORIG' : ((pitchShift ?? 0) > 0 ? `+${pitchShift}` : `${pitchShift}`)}
                                            </span>
                                            <button
                                                onClick={() => setPitchShift((pitchShift ?? 0) + 1)}
                                                disabled={(pitchShift ?? 0) >= 6}
                                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white text-xs font-bold disabled:opacity-30 transition-all flex items-center justify-center font-mono"
                                                title="เพิ่มคีย์ (+1 semitone)"
                                            >
                                                ♯
                                            </button>
                                        </div>
                                        {(pitchShift ?? 0) !== 0 && (
                                            <button
                                                onClick={() => setPitchShift(0)}
                                                className="text-[10px] text-primary hover:underline font-bold px-1"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>

                                    {/* Playback Speed Segmented Pills */}
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                                            <Gauge size={14} className="text-primary" />
                                            <span className="text-xs font-bold">ความเร็ว:</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 bg-gray-200/80 dark:bg-zinc-900 p-0.5 rounded-xl border border-gray-200 dark:border-zinc-700">
                                            {[0.75, 1.0, 1.25].map(rate => (
                                                <button
                                                    key={rate}
                                                    onClick={() => setPlaybackRate(rate)}
                                                    className={clsx(
                                                        "px-2 py-1 text-[10px] font-bold rounded-lg transition-all",
                                                        (playbackRate ?? 1.0) === rate 
                                                            ? "bg-primary text-white shadow-sm" 
                                                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                                    )}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. AI Stem Channels (Vocals, Instrumental, Pro Mode) */}
                            <div className="flex flex-col gap-2">
                                {/* Vocals */}
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/40 p-2.5 px-3 rounded-2xl border border-gray-100 dark:border-zinc-700/50">
                                    <button 
                                        onClick={() => toggleMute('vocals')}
                                        className={clsx(
                                            "w-8 h-8 shrink-0 flex items-center justify-center rounded-xl transition-all border shadow-sm",
                                            trackStates.vocals.muted 
                                                ? "bg-red-500/15 text-red-500 border-red-500/30" 
                                                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                        )}
                                        title={trackStates.vocals.muted ? "เปิดเสียงร้อง" : "ปิดเสียงร้อง"}
                                    >
                                        {trackStates.vocals.muted ? <MicOff size={15} /> : <MicVocal size={15} />}
                                    </button>
                                    <div className="flex-1 flex flex-col justify-center gap-0.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                                เสียงร้อง (Vocals)
                                                {trackStates.vocals.muted && <span className="text-[10px] text-red-500 font-semibold">[ปิดเสียง]</span>}
                                            </span>
                                            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold">{volumes.vocals}%</span>
                                        </div>
                                        <VolumeSlider value={trackStates.vocals.muted ? 0 : volumes.vocals} onChange={(val) => handleVolumeChange('vocals', val)} muted={trackStates.vocals.muted} />
                                    </div>
                                </div>

                                {/* Instrumental (Basic Mode) */}
                                {!isProMode && (
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/40 p-2.5 px-3 rounded-2xl border border-gray-100 dark:border-zinc-700/50">
                                        <button 
                                            onClick={() => toggleMute('instrumental')}
                                            className={clsx(
                                                "w-8 h-8 shrink-0 flex items-center justify-center rounded-xl transition-all border shadow-sm",
                                                trackStates.instrumental.muted 
                                                    ? "bg-red-500/15 text-red-500 border-red-500/30" 
                                                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                            )}
                                            title={trackStates.instrumental.muted ? "เปิดเสียงดนตรี" : "ปิดเสียงดนตรี"}
                                        >
                                            <Music size={15} />
                                        </button>
                                        <div className="flex-1 flex flex-col justify-center gap-0.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                                    ดนตรี (Instrumental)
                                                    {trackStates.instrumental.muted && <span className="text-[10px] text-red-500 font-semibold">[ปิดเสียง]</span>}
                                                </span>
                                                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold">{volumes.instrumental}%</span>
                                            </div>
                                            <VolumeSlider value={trackStates.instrumental.muted ? 0 : volumes.instrumental} onChange={(val) => handleVolumeChange('instrumental', val)} muted={trackStates.instrumental.muted} />
                                        </div>
                                    </div>
                                )}

                                {/* Pro Mode Tracks (Drums, Bass, Other) */}
                                {isProMode && (
                                    <>
                                        {/* Drums */}
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/40 p-2.5 px-3 rounded-2xl border border-gray-100 dark:border-zinc-700/50">
                                            <button 
                                                onClick={() => toggleMute('drums')}
                                                className={clsx(
                                                    "w-8 h-8 shrink-0 flex items-center justify-center rounded-xl transition-all border shadow-sm",
                                                    trackStates.drums.muted 
                                                        ? "bg-red-500/15 text-red-500 border-red-500/30" 
                                                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                )}
                                            >
                                                <Drum size={15} />
                                            </button>
                                            <div className="flex-1 flex flex-col justify-center gap-0.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">กลอง (Drums)</span>
                                                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold">{volumes.drums}%</span>
                                                </div>
                                                <VolumeSlider value={trackStates.drums.muted ? 0 : volumes.drums} onChange={(val) => handleVolumeChange('drums', val)} muted={trackStates.drums.muted} />
                                            </div>
                                        </div>

                                        {/* Bass */}
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/40 p-2.5 px-3 rounded-2xl border border-gray-100 dark:border-zinc-700/50">
                                            <button 
                                                onClick={() => toggleMute('bass')}
                                                className={clsx(
                                                    "w-8 h-8 shrink-0 flex items-center justify-center rounded-xl transition-all border shadow-sm",
                                                    trackStates.bass.muted 
                                                        ? "bg-red-500/15 text-red-500 border-red-500/30" 
                                                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                )}
                                            >
                                                <Guitar size={15} />
                                            </button>
                                            <div className="flex-1 flex flex-col justify-center gap-0.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">เบส (Bass)</span>
                                                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold">{volumes.bass}%</span>
                                                </div>
                                                <VolumeSlider value={trackStates.bass.muted ? 0 : volumes.bass} onChange={(val) => handleVolumeChange('bass', val)} muted={trackStates.bass.muted} />
                                            </div>
                                        </div>

                                        {/* Other */}
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/40 p-2.5 px-3 rounded-2xl border border-gray-100 dark:border-zinc-700/50">
                                            <button 
                                                onClick={() => toggleMute('other')}
                                                className={clsx(
                                                    "w-8 h-8 shrink-0 flex items-center justify-center rounded-xl transition-all border shadow-sm",
                                                    trackStates.other.muted 
                                                        ? "bg-red-500/15 text-red-500 border-red-500/30" 
                                                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                )}
                                            >
                                                <Piano size={15} />
                                            </button>
                                            <div className="flex-1 flex flex-col justify-center gap-0.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">ดนตรีอื่นๆ (Other)</span>
                                                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold">{volumes.other}%</span>
                                                </div>
                                                <VolumeSlider value={trackStates.other.muted ? 0 : volumes.other} onChange={(val) => handleVolumeChange('other', val)} muted={trackStates.other.muted} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* 4. Lyrics & Karaoke Settings (User-Friendly & Crystal Clear) */}
                            <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/50 rounded-2xl p-3 flex flex-col gap-2.5">
                                {/* Top row: Toggles for Lyrics & Karaoke */}
                                <div className="flex items-center gap-2">
                                    {/* Toggle Lyrics */}
                                    <button 
                                        onClick={toggleLyrics}
                                        className={clsx(
                                            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border shadow-sm",
                                            showLyrics 
                                                ? "bg-primary/10 text-primary border-primary/25" 
                                                : "bg-white dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700/70 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Type size={14} />
                                            <span>แสดงเนื้อร้อง</span>
                                        </div>
                                        <div className={clsx(
                                            "w-7 h-4 rounded-full p-0.5 transition-colors flex items-center",
                                            showLyrics ? "bg-primary" : "bg-gray-300 dark:bg-zinc-700"
                                        )}>
                                            <div className={clsx(
                                                "w-3 h-3 bg-white rounded-full transition-transform",
                                                showLyrics ? "translate-x-3" : "translate-x-0"
                                            )} />
                                        </div>
                                    </button>

                                    {/* Toggle Karaoke Sweep (Active only when lyrics is on) */}
                                    {showLyrics && (
                                        <button 
                                            onClick={toggleKaraokeMode}
                                            className={clsx(
                                                "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border shadow-sm",
                                                isKaraokeMode 
                                                    ? "bg-primary/10 text-primary border-primary/25" 
                                                    : "bg-white dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700/70 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Sparkles size={14} />
                                                <span>ปาดสีตามคำร้อง</span>
                                            </div>
                                            <div className={clsx(
                                                "w-7 h-4 rounded-full p-0.5 transition-colors flex items-center",
                                                isKaraokeMode ? "bg-primary" : "bg-gray-300 dark:bg-zinc-700"
                                            )}>
                                                <div className={clsx(
                                                    "w-3 h-3 bg-white rounded-full transition-transform",
                                                    isKaraokeMode ? "translate-x-3" : "translate-x-0"
                                                )} />
                                            </div>
                                        </button>
                                    )}
                                </div>

                                {/* Bottom row: Smart AI Alignment & Source Selection */}
                                {showLyrics && (
                                    <div className="flex flex-col gap-2 pt-1.5 border-t border-gray-200/60 dark:border-zinc-700/60">
                                        {/* Primary Action: 1-Click AI Sync */}
                                        <button
                                            onClick={async () => {
                                                if (hybridModeEnabled) {
                                                    setHybridModeEnabled(false);
                                                    addToast?.('ปิด AI Sync แล้ว', 'info');
                                                } else {
                                                    addToast?.('AI Sync: กำลังฟังและเทียบจังหวะเนื้อเพลง...', 'info');
                                                    try {
                                                        await alignHybridLyrics(activeVideoId!, lyrics);
                                                        addToast?.('AI Sync: เทียบจังหวะสำเร็จ! เนื้อเพลงตรง 100%', 'success');
                                                    } catch (err: any) {
                                                        addToast?.(`AI Sync ล้มเหลว: ${err.message || 'เกิดข้อผิดพลาด'}`, 'error');
                                                    }
                                                }
                                            }}
                                            disabled={isAligning || !lyrics || lyrics.length === 0}
                                            className={clsx(
                                                "w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border shadow-sm",
                                                hybridModeEnabled 
                                                    ? "bg-primary text-white border-primary shadow-primary/20" 
                                                    : "bg-white dark:bg-zinc-900/80 text-zinc-800 dark:text-zinc-200 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800",
                                                (isAligning || !lyrics || lyrics.length === 0) && "opacity-50 cursor-not-allowed"
                                            )}
                                            title="ให้ AI ฟังเสียงร้องและจัดจังหวะคำร้องให้ตรง 100%"
                                        >
                                            <Wand2 size={13} className={clsx("text-primary", hybridModeEnabled && "text-white", isAligning && "animate-spin")} />
                                            <span>{isAligning ? "กำลังเทียบจังหวะกับเสียงร้อง..." : (hybridModeEnabled ? "✓ จัดจังหวะตรงแล้ว (AI Sync)" : "🪄 ปรับจังหวะให้ตรง (AI Sync)")}</span>
                                        </button>

                                        {/* Secondary Option: Source Mode (Human-Readable) */}
                                        <div className="flex items-center justify-between text-[11px] px-0.5 pt-0.5">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">แหล่งเนื้อเพลง:</span>
                                            <div className="flex items-center p-0.5 bg-gray-200/70 dark:bg-zinc-900/80 rounded-xl gap-0.5">
                                                <button 
                                                    onClick={() => handleSourceChange('auto')}
                                                    className={clsx(
                                                        "py-1 px-2.5 rounded-lg font-bold transition-all flex items-center gap-1 text-[10px]",
                                                        preferredSource === 'auto' || preferredSource === 'youtube'
                                                            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" 
                                                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                                    )}
                                                    title="ค้นหาจากคลังเนื้อเพลงมาตรฐาน (LRCLIB)"
                                                >
                                                    <Database size={11} />
                                                    <span>คลังมาตรฐาน</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleSourceChange('deepgram')}
                                                    className={clsx(
                                                        "py-1 px-2.5 rounded-lg font-bold transition-all flex items-center gap-1 text-[10px]",
                                                        preferredSource === 'deepgram' 
                                                            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" 
                                                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                                    )}
                                                    title="ให้ AI ฟังเสียงร้องสดแล้วถอดเนื้อเพลง (Deepgram)"
                                                >
                                                    <Sparkles size={11} />
                                                    <span>AI ถอดเสียงสด</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ,
            document.body
        )}
        </div>
    );
};

