import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../../../context/ToastContext";
import { useRouter } from "next/router";
import { Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, Maximize, Cast, Mic, MicOff, ChevronUp, Mic2, Music, SlidersHorizontal, Type, Drum, Guitar, Piano, MicVocal, X, Sparkles, FileQuestion, Edit2, Wand2 } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useLyricsStore } from "../stores/useLyricsStore";
import { useMixerStore, type TrackType } from "../stores/useMixerStore";
import { useShallow } from "zustand/react/shallow";
import { useUIStore } from "../../../stores/useUIStore";
import { useCast } from "../../../plugins/cast/context/CastContext";
import clsx from 'clsx';
import { useAIVocalStore, getActiveBridgeBaseUrl } from '../../../stores/useAIVocalStore';
import { useDeepgramLyricsStore } from "../../lyrics/stores/useDeepgramLyricsStore";


const VolumeSlider = ({ value, onChange, muted, color = 'primary' }: { value: number, onChange: (val: number) => void, muted: boolean, color?: string }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const getTrackGradient = () => {
        if (muted) return 'bg-gray-300 dark:bg-zinc-700';
        if (color === 'cyan') return 'bg-gradient-to-r from-[#00E5FF] to-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.4)]';
        if (color === 'blue') return 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
        if (color === 'purple') return 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]';
        if (color === 'amber') return 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
        return 'bg-gradient-to-r from-primary to-pink-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    };

    const getThumbBorder = () => {
        if (muted) return 'border-gray-400 dark:border-gray-600';
        if (color === 'cyan') return 'border-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.6)]';
        if (color === 'blue') return 'border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]';
        if (color === 'purple') return 'border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]';
        if (color === 'amber') return 'border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]';
        return 'border-primary shadow-[0_0_8px_rgba(239,68,68,0.6)]';
    };

    return (
        <div className="relative h-6 flex items-center group w-full select-none"
            onMouseEnter={() => setIsDragging(true)}
            onMouseLeave={() => setIsDragging(false)}
        >
            <div className="absolute w-full h-[5px] bg-gray-200 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-75 ${getTrackGradient()}`} 
                    style={{ width: `${value}%` }} 
                />
            </div>
            
            <div 
                className={`absolute w-4 h-4 rounded-full border-[2.5px] bg-white dark:bg-zinc-950 shadow-md flex items-center justify-center transition-all duration-75 pointer-events-none ${isDragging ? 'scale-125' : 'scale-100'} ${getThumbBorder()}`}
                style={{ left: `calc(${value}% - 8px)` }}
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
            
            {/* Mixer Modal */}
            {showVocalMixer && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div 
                        ref={mixerRef} 
                        className="relative w-full max-w-md bg-[#0F0F14]/95 dark:bg-[#0B0B10]/98 border border-white/10 dark:border-zinc-800/80 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh] overflow-hidden backdrop-blur-2xl text-white"
                    >
                        <div className="p-6 overflow-y-auto overscroll-contain flex flex-col h-full w-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5 shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-pink-500 flex items-center justify-center shadow-lg shadow-primary/30">
                                        <SlidersHorizontal size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black tracking-wide text-white flex items-center gap-2">
                                            AI Audio Studio Mixer
                                        </h3>
                                        <span className="text-[10px] text-zinc-400 font-medium">Real-Time Key & Multi-Stem DSP</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowVocalMixer(false)}
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors border border-white/5"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* 🎼 Key Transpose & Speed Controls Console */}
                            <div className="bg-gradient-to-br from-zinc-900/90 via-black/80 to-zinc-900/90 p-4 rounded-2xl border border-white/10 shadow-inner flex flex-col gap-3.5 mb-5 relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                                        🎹 คีย์เพลง (Pitch Shift)
                                    </span>
                                    {(pitchShift ?? 0) !== 0 && (
                                        <button
                                            onClick={() => setPitchShift(0)}
                                            className="text-[10px] text-primary hover:text-pink-400 font-bold underline transition-colors"
                                        >
                                            Reset คีย์ปกติ
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-3 bg-black/60 p-2 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setPitchShift((pitchShift ?? 0) - 1)}
                                        disabled={(pitchShift ?? 0) <= -6}
                                        className="flex-1 py-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-white text-sm font-black disabled:opacity-30 transition-all border border-white/5 flex items-center justify-center gap-1 shadow-sm"
                                        title="ลดคีย์ (-1 semitone)"
                                    >
                                        <span className="text-base font-mono">♭</span>
                                        <span className="text-xs font-medium">ลดคีย์</span>
                                    </button>

                                    <div className="px-4 py-1.5 flex flex-col items-center justify-center min-w-[100px] bg-zinc-950 rounded-lg border border-white/10">
                                        <span className="text-xs font-mono font-black text-[#00E5FF] tracking-wider drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                                            {(pitchShift ?? 0) === 0 ? 'ORIGINAL' : ((pitchShift ?? 0) > 0 ? `+${pitchShift} SEMI` : `${pitchShift} SEMI`)}
                                        </span>
                                        <span className="text-[9px] text-zinc-500 font-medium mt-0.5">
                                            {(pitchShift ?? 0) === 0 ? 'คีย์ต้นฉบับ' : ((pitchShift ?? 0) > 0 ? 'เสียงสูงขึ้น' : 'เสียงทุ้มลง')}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setPitchShift((pitchShift ?? 0) + 1)}
                                        disabled={(pitchShift ?? 0) >= 6}
                                        className="flex-1 py-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-white text-sm font-black disabled:opacity-30 transition-all border border-white/5 flex items-center justify-center gap-1 shadow-sm"
                                        title="เพิ่มคีย์ (+1 semitone)"
                                    >
                                        <span className="text-base font-mono">♯</span>
                                        <span className="text-xs font-medium">เพิ่มคีย์</span>
                                    </button>
                                </div>

                                {/* Tempo Selector */}
                                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                    <span className="text-[11px] font-bold text-zinc-400">⚡ ความเร็วเพลง:</span>
                                    <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/5">
                                        {[0.75, 1.0, 1.25].map(rate => (
                                            <button
                                                key={rate}
                                                onClick={() => setPlaybackRate(rate)}
                                                className={clsx(
                                                    "px-3 py-1 text-[11px] font-bold rounded-lg transition-all",
                                                    (playbackRate ?? 1.0) === rate 
                                                        ? "bg-gradient-to-r from-primary to-pink-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                {rate}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        
                            {/* Master Volume Strip */}
                            <div className="mb-4 bg-zinc-900/60 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                                <button 
                                    onClick={() => {
                                        if (isConnected) {
                                            cast.setMuted(!isMuted);
                                        } else {
                                            setMuted(!isMuted);
                                        }
                                    }}
                                    className={clsx(
                                        "py-2 px-3 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-all border shrink-0",
                                        isMuted 
                                            ? "bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                                            : "bg-white/5 text-zinc-200 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-zinc-300" />}
                                    <span>{isMuted ? 'Muted' : 'Master Audio'}</span>
                                </button>
                                <span className="text-[11px] text-zinc-400 font-mono">
                                    {isMuted ? 'ปิดเสียงรวม' : 'เปิดใช้งาน'}
                                </span>
                            </div>

                            {/* AI Stem Channel Strips */}
                            <div className="flex flex-col gap-3">
                                {/* Vocals */}
                                <div className="flex items-center gap-3 bg-zinc-900/70 p-3 rounded-2xl border border-white/5">
                                    <button 
                                        onClick={() => toggleMute('vocals')}
                                        className={clsx(
                                            "w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all border",
                                            trackStates.vocals.muted 
                                                ? "bg-red-500/20 text-red-400 border-red-500/40" 
                                                : "bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/30 hover:bg-[#00E5FF]/25 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                                        )}
                                        title={trackStates.vocals.muted ? "เปิดเสียงร้อง" : "ปิดเสียงร้อง"}
                                    >
                                        <MicVocal size={16} />
                                    </button>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                                                เสียงร้อง (Vocals)
                                                {trackStates.vocals.muted && <span className="text-[10px] text-red-400 font-medium">[ปิด]</span>}
                                            </span>
                                            <span className="text-[11px] font-mono text-zinc-400 font-bold">{volumes.vocals}%</span>
                                        </div>
                                        <VolumeSlider value={trackStates.vocals.muted ? 0 : volumes.vocals} onChange={(val) => handleVolumeChange('vocals', val)} muted={trackStates.vocals.muted} color="cyan" />
                                    </div>
                                </div>

                                {/* Instrumental (Basic Mode) */}
                                {!isProMode && (
                                    <div className="flex items-center gap-3 bg-zinc-900/70 p-3 rounded-2xl border border-white/5">
                                        <button 
                                            onClick={() => toggleMute('instrumental')}
                                            className={clsx(
                                                "w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all border",
                                                trackStates.instrumental.muted 
                                                    ? "bg-red-500/20 text-red-400 border-red-500/40" 
                                                    : "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                            )}
                                        >
                                            <Music size={16} />
                                        </button>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                                                    ดนตรี (Instrumental)
                                                    {trackStates.instrumental.muted && <span className="text-[10px] text-red-400 font-medium">[ปิด]</span>}
                                                </span>
                                                <span className="text-[11px] font-mono text-zinc-400 font-bold">{volumes.instrumental}%</span>
                                            </div>
                                            <VolumeSlider value={trackStates.instrumental.muted ? 0 : volumes.instrumental} onChange={(val) => handleVolumeChange('instrumental', val)} muted={trackStates.instrumental.muted} color="blue" />
                                        </div>
                                    </div>
                                )}

                                {/* Pro Mode Tracks (Drums, Bass, Other) */}
                                {isProMode && (
                                    <>
                                        {/* Drums */}
                                        <div className="flex items-center gap-3 bg-zinc-900/70 p-3 rounded-2xl border border-white/5">
                                            <button 
                                                onClick={() => toggleMute('drums')}
                                                className={clsx(
                                                    "w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all border",
                                                    trackStates.drums.muted 
                                                        ? "bg-red-500/20 text-red-400 border-red-500/40" 
                                                        : "bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25"
                                                )}
                                            >
                                                <Drum size={16} />
                                            </button>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                                                        กลอง (Drums)
                                                    </span>
                                                    <span className="text-[11px] font-mono text-zinc-400 font-bold">{volumes.drums}%</span>
                                                </div>
                                                <VolumeSlider value={trackStates.drums.muted ? 0 : volumes.drums} onChange={(val) => handleVolumeChange('drums', val)} muted={trackStates.drums.muted} color="purple" />
                                            </div>
                                        </div>

                                        {/* Bass */}
                                        <div className="flex items-center gap-3 bg-zinc-900/70 p-3 rounded-2xl border border-white/5">
                                            <button 
                                                onClick={() => toggleMute('bass')}
                                                className={clsx(
                                                    "w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all border",
                                                    trackStates.bass.muted 
                                                        ? "bg-red-500/20 text-red-400 border-red-500/40" 
                                                        : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                                                )}
                                            >
                                                <Guitar size={16} />
                                            </button>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                                                        เบส (Bass)
                                                    </span>
                                                    <span className="text-[11px] font-mono text-zinc-400 font-bold">{volumes.bass}%</span>
                                                </div>
                                                <VolumeSlider value={trackStates.bass.muted ? 0 : volumes.bass} onChange={(val) => handleVolumeChange('bass', val)} muted={trackStates.bass.muted} color="amber" />
                                            </div>
                                        </div>

                                        {/* Other */}
                                        <div className="flex items-center gap-3 bg-zinc-900/70 p-3 rounded-2xl border border-white/5">
                                            <button 
                                                onClick={() => toggleMute('other')}
                                                className={clsx(
                                                    "w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all border",
                                                    trackStates.other.muted 
                                                        ? "bg-red-500/20 text-red-400 border-red-500/40" 
                                                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                                                )}
                                            >
                                                <Piano size={16} />
                                            </button>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                                                        ดนตรีอื่นๆ (Other)
                                                    </span>
                                                    <span className="text-[11px] font-mono text-zinc-400 font-bold">{volumes.other}%</span>
                                                </div>
                                                <VolumeSlider value={trackStates.other.muted ? 0 : volumes.other} onChange={(val) => handleVolumeChange('other', val)} muted={trackStates.other.muted} color="emerald" />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[11px] text-zinc-500">YouOke Engine</span>
                                <button 
                                    onClick={() => resetPitchAndSpeed()}
                                    className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                                >
                                    รีเซ็ตค่าทั้งหมด
                                </button>
                            </div>


                        <div className={clsx("mt-6 pt-5", isAiReady || isConnected ? "border-t border-gray-100 dark:border-zinc-800" : "")}>
                            <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/50 rounded-2xl flex flex-row items-center justify-between p-1.5">
                                {/* Lyrics Toggle */}
                                <button 
                                    onClick={toggleLyrics}
                                    className={clsx(
                                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold transition-colors",
                                        showLyrics ? "text-primary" : "text-black/70 dark:text-zinc-300"
                                    )}
                                >
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Type size={14} className={showLyrics ? "text-primary" : "opacity-60"} />
                                        <span className="whitespace-nowrap">เนื้อเพลง</span>
                                        {showLyrics && source && (
                                            <span className={clsx("ml-1 text-[8px] px-1 py-0.5 rounded font-black", lyricsType === 'synced' ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-gray-500/10 text-gray-500 dark:text-gray-400")}>
                                                {lyricsType === 'synced' ? 'SYNC' : 'PLAIN'}
                                            </span>
                                        )}
                                    </div>
                                    <div className={clsx(
                                        "w-7 h-4 rounded-full p-0.5 transition-colors flex items-center shadow-inner",
                                        showLyrics ? "bg-primary" : "bg-gray-300 dark:bg-zinc-700"
                                    )}>
                                        <div className={clsx(
                                            "w-3 h-3 bg-white rounded-full transition-transform shadow-sm",
                                            showLyrics ? "translate-x-3" : "translate-x-0"
                                        )} />
                                    </div>
                                </button>
                                
                                {showLyrics && (
                                    <div className="w-[1px] h-6 bg-gray-200 dark:bg-zinc-700/50 mx-0.5" />
                                )}
                                
                                {/* Sweep Toggle */}
                                {showLyrics && (
                                    <button 
                                        onClick={toggleKaraokeMode}
                                        className={clsx(
                                            "flex-[0.9] flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold transition-colors",
                                            isKaraokeMode ? "text-primary" : "text-black/70 dark:text-zinc-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Sparkles size={14} className={isKaraokeMode ? "text-primary" : "opacity-60"} />
                                            <span className="whitespace-nowrap">คาราโอเกะ</span>
                                        </div>
                                        <div className={clsx(
                                            "w-7 h-4 rounded-full p-0.5 transition-colors flex items-center shadow-inner",
                                            isKaraokeMode ? "bg-primary" : "bg-gray-300 dark:bg-zinc-700"
                                        )}>
                                            <div className={clsx(
                                                "w-3 h-3 bg-white rounded-full transition-transform shadow-sm",
                                                isKaraokeMode ? "translate-x-3" : "translate-x-0"
                                            )} />
                                        </div>
                                    </button>
                                )}
                                
                                {showLyrics && (
                                    <div className="w-[1px] h-6 bg-gray-200 dark:bg-zinc-700/50 mx-0.5" />
                                )}
                                
                                {/* AI Sync Toggle */}
                                {showLyrics && (
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
                                            "flex-[1.1] flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold transition-colors",
                                            hybridModeEnabled ? "text-primary" : "text-black/70 dark:text-zinc-300",
                                            (isAligning || !lyrics || lyrics.length === 0) && "opacity-50 cursor-not-allowed"
                                        )}
                                        title="ปรับจังหวะอัตโนมัติด้วย AI"
                                    >
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Wand2 size={13} className={clsx(isAligning && "animate-pulse", hybridModeEnabled ? "text-primary" : "opacity-60")} />
                                            <span className="whitespace-nowrap">{isAligning ? "รอ..." : "AI Sync"}</span>
                                        </div>
                                        <div className={clsx(
                                            "w-7 h-4 rounded-full p-0.5 transition-colors flex items-center shadow-inner ml-1",
                                            hybridModeEnabled ? "bg-primary" : "bg-gray-300 dark:bg-zinc-700"
                                        )}>
                                            <div className={clsx(
                                                "w-3 h-3 bg-white rounded-full transition-transform shadow-sm",
                                                hybridModeEnabled ? "translate-x-3" : "translate-x-0"
                                            )} />
                                        </div>
                                    </button>
                                )}
                            </div>
                            
                            {/* Error message for AI Sync */}
                            {errorMessage && (
                                <p className="text-[10px] text-red-500 mt-2 text-center font-medium px-2">
                                    {errorMessage}
                                </p>
                            )}
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
                                    {isAiReady ? (
                                        <button
                                            onClick={async () => {
                                                if (lyricsLoading) return;
                                                const activeId = currentVideo?.videoId || currentVideo?.id;
                                                if (activeId && currentVideo) {
                                                    addToast?.('AI Transcribe: กำลังถอดเนื้อร้องจากเสียงร้องไกด์...', 'info');
                                                    setPreferredSource('deepgram');
                                                    await fetchLyrics(activeId, currentVideo.title || '', 'deepgram', currentVideo.duration);
                                                    setLyricsEnabled(true);
                                                }
                                            }}
                                            disabled={lyricsLoading}
                                            className="mt-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 disabled:opacity-50"
                                        >
                                            <Sparkles size={13} className={lyricsLoading ? 'animate-spin' : ''} />
                                            <span>{lyricsLoading ? 'กำลังแกะเนื้อ...' : 'แกะเนื้อร้องด้วย AI'}</span>
                                        </button>
                                    ) : (
                                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                            💡 กดแยกเสียงร้องก่อนเพื่อใช้ AI แกะเนื้อเพลงได้
                                        </p>
                                    )}
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
                                    <button
                                        onClick={() => {
                                            router.push(`/creator?edit=${currentVideo.id}`);
                                        }}
                                        className="w-full py-2.5 bg-zinc-900 hover:bg-black dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={14} />
                                        <span>แก้ไขเนื้อเพลงใน Studio</span>
                                    </button>
                                )}

                                {/* Source Selector */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <div className="w-1 h-3 rounded-full bg-gray-300 dark:bg-zinc-600" />
                                        <span className="text-[10px] font-bold text-gray-500 dark:bg-zinc-400 tracking-wider">แหล่งข้อมูล (SOURCE)</span>
                                    </div>
                                    <div className="flex items-center p-1 bg-gray-200/50 dark:bg-zinc-900/50 rounded-lg gap-1">
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
                                        <button 
                                            onClick={() => handleSourceChange('deepgram')}
                                            className={clsx(
                                                "flex-1 py-1.5 rounded-md shadow-sm text-[10px] font-bold transition-all",
                                                preferredSource === 'deepgram' 
                                                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow" 
                                                    : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white shadow-none"
                                            )}
                                        >
                                            Deepgram AI
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

