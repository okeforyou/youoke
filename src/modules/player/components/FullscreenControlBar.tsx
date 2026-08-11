import React, { useState, useRef, useEffect } from 'react';
import { Minimize2, X, Play, Pause, Wand2, Mic, MicOff, Music, Type, Drum, Guitar, Piano, Sparkles, SlidersHorizontal } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useCast } from '../../../plugins/cast/context/CastContext';
import { useLyricsStore } from '../stores/useLyricsStore';
import { useMixerStore } from '../stores/useMixerStore';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';
import { useUIStore } from '../../../stores/useUIStore';
import { useDeepgramLyricsStore } from '../../lyrics/stores/useDeepgramLyricsStore';

interface FullscreenControlBarProps {
    showControls: boolean;
    layoutMode: string;
    playerRef?: React.MutableRefObject<any>;
}

export const FullscreenControlBar = ({ showControls, layoutMode }: FullscreenControlBarProps) => {
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const cast = useCast();
    const currentVideo = usePlayerStore(state => state.currentVideo);

    // Lyrics State & Actions
    const { 
        isEnabled: showLyrics, 
        setLyricsEnabled, 
        isKaraokeMode, 
        toggleKaraokeMode, 
        lyrics: originalLyrics 
    } = useLyricsStore();
    
    const { 
        alignedLyrics, 
        isAligning, 
        hybridModeEnabled, 
        setHybridModeEnabled, 
        alignHybridLyrics 
    } = useDeepgramLyricsStore();

    // AI Separation & Mixer Store
    const { trackStates, volumes, setVolume, toggleMute } = useMixerStore();
    const aiVocalStore = useAIVocalStore();
    const activeVideoId = currentVideo?.videoId || currentVideo?.id;
    const aiJob = activeVideoId ? aiVocalStore.jobs[activeVideoId] : null;
    const isAiReady = Boolean(activeVideoId && aiJob?.status === 'ready');
    const isProMode = aiJob?.mode === 'pro';

    // State for the combined Mixer Popover (Click-to-Open)
    const [showMixerPopover, setShowMixerPopover] = useState(false);

    // Refs for click-outside detection
    const popoverRef = useRef<HTMLDivElement>(null);
    const mixerBtnRef = useRef<HTMLButtonElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
                mixerBtnRef.current && !mixerBtnRef.current.contains(event.target as Node)
            ) {
                setShowMixerPopover(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const handlePlayPause = () => {
        if (cast.isConnected) {
            isPlaying ? cast.pause() : cast.play();
        } else {
            usePlayerStore.getState().togglePlay();
        }
    };

    const toggleFullscreen = () => {
        usePlayerStore.getState().triggerFullscreen();
    };

    // Handles volume adjustments and updates the mute status reactively
    const handleVolumeChange = (track: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other', value: number) => {
        setVolume(track, value);
        const isCurrentlyMuted = trackStates[track].muted;
        if (value > 0 && isCurrentlyMuted) {
            toggleMute(track);
        } else if (value === 0 && !isCurrentlyMuted) {
            toggleMute(track);
        }
    };

    if (layoutMode !== 'fullscreen') return null;

    // Helper to render a slider row inside the popover card
    const renderMixerRow = (
        track: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other',
        icon: any,
        label: string
    ) => {
        const isMuted = trackStates[track].muted;
        const vol = volumes[track];
        const Icon = icon;
        const displayValue = isMuted ? 0 : vol;

        return (
            <div className="flex items-center gap-3">
                {/* Mute Toggle Button */}
                <button
                    onClick={() => toggleMute(track)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95 shrink-0 ${isMuted ? 'text-white/30 bg-white/5 border border-white/5' : 'text-primary bg-primary/10 border border-primary/15'}`}
                    title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
                >
                    {isMuted ? <MicOff size={16} /> : <Icon size={16} />}
                </button>

                {/* Slider and Text Info */}
                <div className="flex-1 flex flex-col gap-0.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-white/70">{label}</span>
                        <span className="font-mono text-white/50">{displayValue}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={displayValue}
                        onChange={(e) => handleVolumeChange(track, parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>
            </div>
        );
    };

    return (
        <div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 md:gap-2.5 p-1.5 md:p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
            {/* Popover Mixer Panel (Floating above the control bar, positioned absolutely relative to the bar) */}
            {showMixerPopover && (
                <div 
                    ref={popoverRef}
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-4 w-[280px] z-50 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-white text-xs font-bold flex items-center gap-1.5">
                            <SlidersHorizontal size={14} className="text-primary" />
                            ตั้งค่าเสียง (MIXER)
                        </span>
                        <button onClick={() => setShowMixerPopover(false)} className="text-white/40 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>

                    {/* Audio Separation Sliders */}
                    <div className="flex flex-col gap-3.5">
                        {isAiReady ? (
                            <>
                                {renderMixerRow('vocals', Mic, 'เสียงร้อง (Vocals)')}
                                
                                {!isProMode ? (
                                    renderMixerRow('instrumental', Music, 'เสียงดนตรี (Backing)')
                                ) : (
                                    <>
                                        {renderMixerRow('drums', Drum, 'กลอง (Drums)')}
                                        {renderMixerRow('bass', Guitar, 'เบส (Bass)')}
                                        {renderMixerRow('other', Piano, 'ดนตรีอื่นๆ (Other)')}
                                    </>
                                )}
                            </>
                        ) : (
                            /* Separate Trigger inside Mixer Popover when stems are offline */
                            <div className="py-2 flex flex-col gap-2 items-center text-center">
                                <span className="text-[10px] text-white/40">ยังไม่ได้แยกแทร็กเสียงดนตรีด้วย AI</span>
                                <button
                                    onClick={() => {
                                        setShowMixerPopover(false);
                                        if (currentVideo) {
                                            const uuid = currentVideo.uuid || currentVideo.id;
                                            if (uuid && activeVideoId) {
                                                useUIStore.getState().showVocalModeModal(uuid, activeVideoId);
                                            }
                                        }
                                    }}
                                    className="w-full py-2 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all text-xs font-bold"
                                    title="แยกเสียงร้อง/ดนตรีด้วย AI"
                                >
                                    <Sparkles size={14} />
                                    แยกเสียงด้วย AI
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 1. Lyrics Selection Segmented Pill Control */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 pointer-events-auto shrink-0">
                <button 
                    onClick={() => setLyricsEnabled(false)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${!showLyrics ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    ปิดเนื้อ
                </button>
                <button 
                    onClick={() => {
                        setLyricsEnabled(true);
                        setHybridModeEnabled(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${showLyrics && !hybridModeEnabled ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-white/40 hover:text-white/70'}`}
                >
                    LRCLIB
                </button>
                {originalLyrics && originalLyrics.length > 0 && (
                    <button 
                        onClick={() => {
                            if (alignedLyrics.length === 0) {
                                if (activeVideoId) {
                                    alignHybridLyrics(activeVideoId, originalLyrics).catch(console.error);
                                }
                            } else {
                                setLyricsEnabled(true);
                                setHybridModeEnabled(true);
                            }
                        }}
                        disabled={isAligning}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${showLyrics && hybridModeEnabled ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-white/40 hover:text-white/70'} ${isAligning ? 'animate-pulse' : ''}`}
                    >
                        <Sparkles size={11} />
                        {isAligning ? 'ซิงก์...' : 'AI Sync'}
                    </button>
                )}
            </div>

            {/* 2. Toggle Karaoke Sweeping Mode (Color Sweeping vs Plain Text) */}
            <button
                onClick={toggleKaraokeMode}
                disabled={!showLyrics}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${!showLyrics ? 'opacity-30 cursor-not-allowed' : (isKaraokeMode ? 'bg-primary/20 text-primary border border-primary/20' : 'text-white/50 hover:text-white hover:bg-white/10')}`}
                title={isKaraokeMode ? "ปิดการปาดสี (อ่านข้อความนิ่ง)" : "เปิดการปาดสี (แบบคาราโอเกะ)"}
            >
                <Wand2 size={20} />
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0" />

            {/* 3. Single Mixer Toggle Button (Replaces individual track controls on the bar) */}
            <button
                ref={mixerBtnRef}
                onClick={() => setShowMixerPopover(!showMixerPopover)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${showMixerPopover ? 'bg-primary/20 text-primary border border-primary/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                title="ตั้งค่าเสียง (MIXER)"
            >
                <SlidersHorizontal size={20} />
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0" />

            {/* 4. Play/Pause */}
            <button
                onClick={handlePlayPause}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${isPlaying ? 'text-white/90 hover:text-white hover:bg-white/10 bg-white/5' : 'bg-primary text-white shadow-lg shadow-primary/30'}`}
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0" />

            {/* 5. Minimize Screen */}
            <button
                onClick={toggleFullscreen}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90 pointer-events-auto shrink-0"
                title="ย่อหน้าจอ"
            >
                <Minimize2 size={20} />
            </button>

            {/* 6. Close Fullscreen (Return to Split Mode) */}
            <button
                onClick={() => usePlayerStore.getState().setLayoutMode('split')}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400/80 hover:text-white hover:bg-red-500/85 transition-all active:scale-90 pointer-events-auto shrink-0"
                title="ออกจากหน้าจอเต็มจอ"
            >
                <X size={20} strokeWidth={2.5} />
            </button>
        </div>
    );
};
