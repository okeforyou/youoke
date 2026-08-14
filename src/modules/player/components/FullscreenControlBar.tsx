import React, { useState, useRef, useEffect } from 'react';
import { Minimize2, X, Play, Pause, Wand2, Mic, MicOff, Music, Type, Drum, Guitar, Piano, Sparkles, SlidersHorizontal, AlignLeft, Paintbrush } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useCast } from '../../../plugins/cast/context/CastContext';
import { useLyricsStore } from '../stores/useLyricsStore';
import { useMixerStore } from '../stores/useMixerStore';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';
import { useUIStore } from '../../../stores/useUIStore';
import { useDeepgramLyricsStore } from '../../lyrics/stores/useDeepgramLyricsStore';
import { useToast } from '../../../context/ToastContext';

interface FullscreenControlBarProps {
    showControls: boolean;
    layoutMode: string;
    playerRef?: React.MutableRefObject<any>;
}

export const FullscreenControlBar = ({ showControls, layoutMode }: FullscreenControlBarProps) => {
    const { addToast } = useToast() || {};
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const cast = useCast();
    const currentVideo = usePlayerStore(state => state.currentVideo);

    // Lyrics State & Actions
    const { 
        isEnabled: showLyrics, 
        setLyricsEnabled, 
        isKaraokeMode, 
        toggleKaraokeMode, 
        lyrics: originalLyrics,
        lyricsType,
        lyricsLayout,
        setLyricsLayout
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

    // Lyrics Layout tab index: 0 = Off, 1 = Karaoke, 2 = Scroll
    const activeLayoutTab = !showLyrics ? 0 : (lyricsLayout === 'scroll' ? 2 : 1);
    
    const handleLayoutTabClick = (index: number) => {
        if (index === 0) {
            setLyricsEnabled(false);
        } else if (index === 1) {
            if (!isSynced) {
                addToast?.('🪄 กรุณากด ซิงก์ AI ก่อนเพื่อร้องแบบปาดคาราโอเกะ!', 'warning');
                // Stay on scroll layout
                setLyricsEnabled(true);
                setLyricsLayout('scroll');
                return;
            }
            setLyricsEnabled(true);
            setLyricsLayout('karaoke');
        } else if (index === 2) {
            setLyricsEnabled(true);
            setLyricsLayout('scroll');
        }
    };

    const getIndicatorColor = () => {
        if (activeLayoutTab === 0) return 'bg-white/10 border border-white/5';
        if (activeLayoutTab === 1) return 'bg-primary shadow-lg shadow-primary/25';
        return 'bg-amber-500 shadow-lg shadow-amber-500/25';
    };

    const isSynced = (originalLyrics && originalLyrics.some(l => l.time >= 0)) || (alignedLyrics && alignedLyrics.length > 0);

    const tooltipClassName = "absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/tooltip:block bg-black/90 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 whitespace-nowrap shadow-xl z-50 pointer-events-none transition-all";

    return (
        <div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 md:gap-2.5 p-1.5 md:p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >


            {/* 1. Lyrics Selection Segmented Pill Control (Animate-sliding active tab indicator) */}
            <div className="relative flex bg-white/5 border border-white/10 rounded-xl p-0.5 pointer-events-auto shrink-0 select-none w-[274px] h-[38px] items-center">
                {/* Sliding background indicator */}
                <div 
                    className={`absolute top-0.5 bottom-0.5 left-0.5 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${getIndicatorColor()}`}
                    style={{
                        transform: `translateX(${activeLayoutTab * 90}px)`,
                        width: '90px'
                    }}
                />
                
                <button 
                    onClick={() => handleLayoutTabClick(0)}
                    className={`group/tooltip relative z-10 w-[90px] h-full rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${activeLayoutTab === 0 ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    <MicOff size={12} />
                    ปิดเนื้อ
                    <span className={tooltipClassName}>ปิดเนื้อร้อง</span>
                </button>
                <button 
                    onClick={() => handleLayoutTabClick(1)}
                    className={`group/tooltip relative z-10 w-[90px] h-full rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${activeLayoutTab === 1 ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    <Mic size={12} />
                    คาราโอเกะ
                    <span className={tooltipClassName}>โหมดคาราโอเกะ</span>
                </button>
                <button 
                    onClick={() => handleLayoutTabClick(2)}
                    className={`group/tooltip relative z-10 w-[90px] h-full rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${activeLayoutTab === 2 ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    <AlignLeft size={12} />
                    แบบสไลด์
                    <span className={tooltipClassName}>โหมดสไลด์แนวตั้ง</span>
                </button>
            </div>

            {/* AI Sync Action Button */}
            {originalLyrics && originalLyrics.length > 0 && (
                <button
                    onClick={async () => {
                        if (isAligning) return;
                        if (activeVideoId) {
                            addToast?.('AI Sync: กำลังฟังและเทียบจังหวะเนื้อเพลง...', 'info');
                            try {
                                await alignHybridLyrics(activeVideoId, originalLyrics);
                                addToast?.('AI Sync: เทียบจังหวะสำเร็จ! เนื้อเพลงตรง 100%', 'success');
                                setLyricsEnabled(true);
                                setLyricsLayout('karaoke');
                            } catch (err: any) {
                                addToast?.(`AI Sync ล้มเหลว: ${err.message || 'เกิดข้อผิดพลาด'}`, 'error');
                            }
                        }
                    }}
                    disabled={isAligning}
                    className={`group/tooltip relative h-11 px-4 flex items-center justify-center gap-1.5 rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 font-bold text-xs ${isAligning ? 'animate-pulse text-white/50 bg-white/5 border border-white/5' : (!isSynced ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/25 border border-amber-500/30' : 'text-white/60 hover:text-white bg-white/5 border border-white/10')}`}
                >
                    <Sparkles size={14} className={isAligning ? 'animate-spin' : ''} />
                    <span>{isAligning ? 'กำลังซิงก์...' : 'ซิงก์ AI'}</span>
                    <span className={tooltipClassName}>ซิงก์จังหวะด้วย AI</span>
                </button>
            )}

            {/* 2. Toggle Karaoke Sweeping Mode (Color Sweeping vs Plain Text) */}
            {showLyrics && lyricsLayout === 'karaoke' && (
                <button
                    onClick={toggleKaraokeMode}
                    className={`group/tooltip relative w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${isKaraokeMode ? 'bg-primary/20 text-primary border border-primary/20' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                >
                    <Paintbrush size={20} />
                    <span className={tooltipClassName}>{isKaraokeMode ? "ปิดการปาดสี" : "เปิดการปาดสี"}</span>
                </button>
            )}

            <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0" />

            {/* 3. Quick Vocal & Music Mute Toggles directly on the bar */}
            {isAiReady && (
                <div className="flex items-center gap-1.5">
                    {/* Quick Vocals Toggle */}
                    <button
                        onClick={() => toggleMute('vocals')}
                        className={`group/tooltip relative w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${trackStates.vocals.muted ? 'text-white/30 bg-white/5 border border-white/5' : 'text-green-400 bg-green-500/10 border border-green-500/15'}`}
                    >
                        {trackStates.vocals.muted ? <MicOff size={20} /> : <Mic size={20} />}
                        <span className={tooltipClassName}>{trackStates.vocals.muted ? "เปิดเสียงร้องไกด์" : "ปิดเสียงร้องไกด์"}</span>
                    </button>
                    
                    {/* Quick Music Toggle */}
                    <button
                        onClick={toggleMusicMute}
                        className={`group/tooltip relative w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${isMusicMuted ? 'text-white/30 bg-white/5 border border-white/5' : 'text-blue-400 bg-blue-500/10 border border-blue-500/15'}`}
                    >
                        <Music size={20} className={isMusicMuted ? "opacity-30" : ""} />
                        <span className={tooltipClassName}>{isMusicMuted ? "เปิดเสียงดนตรีหลัก" : "ปิดเสียงดนตรีหลัก"}</span>
                    </button>
                </div>
            )}

            {/* 4. Main Mixer Toggle Button — popover is relative to this wrapper */}
            <div className="relative shrink-0">
                {showMixerPopover && (
                    <div 
                        ref={popoverRef}
                        className="absolute bottom-14 right-0 bg-black/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-4 w-[280px] z-50 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
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
                                    >
                                        <Sparkles size={14} />
                                        แยกเสียงด้วย AI
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tooltip Arrow pointing down toward the Mixer button */}
                        <div className="absolute -bottom-1.5 right-[18px] w-3 h-3 bg-black/95 border-r border-b border-white/10 rotate-45" />
                    </div>
                )}

                <button
                    ref={mixerBtnRef}
                    onClick={() => setShowMixerPopover(!showMixerPopover)}
                    className={`group/tooltip relative w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto ${showMixerPopover ? 'bg-primary/25 text-primary border border-primary/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                    <SlidersHorizontal size={20} />
                    <span className={tooltipClassName}>แผงตั้งค่าเสียง (Mixer)</span>
                </button>
            </div>

            <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0" />

            {/* 5. Play/Pause */}
            <button
                onClick={handlePlayPause}
                className={`group/tooltip relative w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto shrink-0 ${isPlaying ? 'text-white/90 hover:text-white hover:bg-white/10 bg-white/5' : 'bg-primary text-white shadow-lg shadow-primary/30'}`}
            >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                <span className={tooltipClassName}>{isPlaying ? "หยุดเพลง" : "เล่นเพลง"}</span>
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0" />

            {/* 6. Minimize Screen */}
            <button
                onClick={toggleFullscreen}
                className="group/tooltip relative w-11 h-11 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90 pointer-events-auto shrink-0"
            >
                <Minimize2 size={20} />
                <span className={tooltipClassName}>ย่อหน้าจอ</span>
            </button>

            {/* 7. Close Fullscreen (Return to Split Mode) */}
            <button
                onClick={() => usePlayerStore.getState().setLayoutMode('split')}
                className="group/tooltip relative w-11 h-11 mr-3.5 md:mr-5 flex items-center justify-center rounded-xl text-red-400/80 hover:text-white hover:bg-red-500/85 transition-all active:scale-90 pointer-events-auto shrink-0"
            >
                <X size={20} strokeWidth={2.5} />
                <span className={tooltipClassName}>ออกจากหน้าจอเต็มจอ</span>
            </button>
        </div>
    );
};
