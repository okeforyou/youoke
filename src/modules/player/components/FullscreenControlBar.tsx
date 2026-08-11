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

    // Handles volume adjustments (auto-mute at 0, auto-unmute above 0 managed by store)
    const handleVolumeChange = (track: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other', value: number) => {
        setVolume(track, value);
    };

    // Music Quick Mute helper (mutes instrumental in 2ch, or drums+bass+other in 4ch pro mode)
    const isMusicMuted = isProMode 
        ? (trackStates.drums.muted && trackStates.bass.muted && trackStates.other.muted)
        : trackStates.instrumental.muted;

    const toggleMusicMute = () => {
        if (isProMode) {
            const shouldMute = !isMusicMuted;
            if (trackStates.drums.muted !== shouldMute) toggleMute('drums');
            if (trackStates.bass.muted !== shouldMute) toggleMute('bass');
            if (trackStates.other.muted !== shouldMute) toggleMute('other');
        } else {
            toggleMute('instrumental');
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

    // Lyrics Sliding Segment Indicator properties
    const activeTabIndex = !showLyrics ? 0 : (hybridModeEnabled ? 2 : 1);
    
    const handleLyricsTabClick = (index: number) => {
        if (index === 0) {
            setLyricsEnabled(false);
        } else if (index === 1) {
            setLyricsEnabled(true);
            setHybridModeEnabled(false);
        } else if (index === 2) {
            if (alignedLyrics.length === 0) {
                if (activeVideoId) {
                    alignHybridLyrics(activeVideoId, originalLyrics).catch(console.error);
                }
            } else {
                setLyricsEnabled(true);
                setHybridModeEnabled(true);
            }
        }
    };

    const getIndicatorColor = () => {
        if (activeTabIndex === 0) return 'bg-white/10 border border-white/5';
        if (activeTabIndex === 1) return 'bg-primary shadow-lg shadow-primary/25';
        return 'bg-amber-500 shadow-lg shadow-amber-500/25';
    };

    return (
        <div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 md:gap-2.5 p-1.5 md:p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
            {/* Popover Mixer Panel (Floating above the control bar, positioned absolutely relative to the bar) */}
            {showMixerPopover && (
                <div 
                    ref={popoverRef}
                    className="absolute bottom-16 right-0 bg-black/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-4 w-[280px] z-50 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
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

                    {/* Pointing Tooltip Arrow aligned to the Mixer button (right side) */}
                    <div className="absolute -bottom-1.5 right-[18px] w-3 h-3 bg-black/95 border-r border-b border-white/10 rotate-45 z-[-1]" />
                </div>
            )}

            {/* 1. Lyrics Selection Segmented Pill Control (Animate-sliding active tab indicator) */}
            <div className="relative flex bg-white/5 border border-white/10 rounded-xl p-0.5 pointer-events-auto shrink-0 select-none w-[244px] h-[38px] items-center">
                {/* Sliding background indicator */}
                <div 
                    className={`absolute top-0.5 bottom-0.5 left-0.5 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${getIndicatorColor()}`}
                    style={{
                        transform: `translateX(${activeTabIndex * 80}px)`,
                        width: '80px'
                    }}
                />
                
                <button 
                    onClick={() => handleLyricsTabClick(0)}
                    className={`relative z-10 w-[80px] h-full rounded-lg text-xs font-bold transition-colors ${activeTabIndex === 0 ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    ปิดเนื้อ
                </button>
                <button 
                    onClick={() => handleLyricsTabClick(1)}
                    className={`relative z-10 w-[80px] h-full rounded-lg text-xs font-bold transition-colors ${activeTabIndex === 1 ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    เนื้อปกติ
                </button>
                {originalLyrics && originalLyrics.length > 0 && (
                    <button 
                        onClick={() => handleLyricsTabClick(2)}
                        disabled={isAligning}
                        className={`relative z-10 w-[80px] h-full rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-0.5 ${activeTabIndex === 2 ? 'text-white' : 'text-white/40 hover:text-white/70'} ${isAligning ? 'animate-pulse' : ''}`}
                    >
                        <Sparkles size={11} />
                        {isAligning ? 'ซิงก์...' : 'ซิงก์ AI'}
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

            {/* 3. Quick Vocal & Music Mute Toggles directly on the bar */}
            {isAiReady && (
                <div className="flex items-center gap-1.5">
                    {/* Quick Vocals Toggle */}
                    <button
                        onClick={() => toggleMute('vocals')}
                        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${trackStates.vocals.muted ? 'text-white/30 bg-white/5 border border-white/5' : 'text-green-400 bg-green-500/10 border border-green-500/15'}`}
                        title={trackStates.vocals.muted ? "เปิดเสียงร้องไกด์" : "ปิดเสียงร้องไกด์"}
                    >
                        {trackStates.vocals.muted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    
                    {/* Quick Music Toggle */}
                    <button
                        onClick={toggleMusicMute}
                        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${isMusicMuted ? 'text-white/30 bg-white/5 border border-white/5' : 'text-blue-400 bg-blue-500/10 border border-blue-500/15'}`}
                        title={isMusicMuted ? "เปิดเสียงดนตรี" : "ปิดเสียงดนตรี"}
                    >
                        <Music size={20} className={isMusicMuted ? "opacity-30" : ""} />
                    </button>
                </div>
            )}

            {/* 4. Main Mixer Toggle Button */}
            <button
                ref={mixerBtnRef}
                onClick={() => setShowMixerPopover(!showMixerPopover)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${showMixerPopover ? 'bg-primary/25 text-primary border border-primary/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                title="ตั้งค่าเสียง (MIXER)"
            >
                <SlidersHorizontal size={20} />
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0" />

            {/* 5. Play/Pause */}
            <button
                onClick={handlePlayPause}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${isPlaying ? 'text-white/90 hover:text-white hover:bg-white/10 bg-white/5' : 'bg-primary text-white shadow-lg shadow-primary/30'}`}
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0" />

            {/* 6. Minimize Screen */}
            <button
                onClick={toggleFullscreen}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90 pointer-events-auto shrink-0"
                title="ย่อหน้าจอ"
            >
                <Minimize2 size={20} />
            </button>

            {/* 7. Close Fullscreen (Return to Split Mode) */}
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
