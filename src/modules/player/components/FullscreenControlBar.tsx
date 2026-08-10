import React, { useState, useRef, useEffect } from 'react';
import { Minimize2, X, Play, Pause, Wand2, SlidersHorizontal, Mic, MicOff, Music, Type, Drum, Guitar, Piano, Sparkles } from 'lucide-react';
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
    const { isEnabled: showLyrics, toggleLyrics, isKaraokeMode, toggleKaraokeMode, lyrics: originalLyrics } = useLyricsStore();
    const { 
        alignedLyrics, 
        isAligning, 
        alignmentStatus, 
        errorMessage, 
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

    // UI States
    const [showMixerPopover, setShowMixerPopover] = useState(false);
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    if (layoutMode !== 'fullscreen') return null;

    return (
        <div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
            {/* Popover Mixer Panel (Floating above the control bar, positioned absolutely relative to the bar) */}
            {showMixerPopover && (
                <div 
                    ref={popoverRef}
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-4 w-[280px] z-50 pointer-events-auto transition-all"
                >
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-white text-xs font-bold flex items-center gap-1.5">
                            <SlidersHorizontal size={14} className="text-primary" />
                            ปรับแต่งระบบคาราโอเกะ
                        </span>
                        <button onClick={() => setShowMixerPopover(false)} className="text-white/40 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>

                    {/* Part 1: Mixer Levels */}
                    <div className="flex flex-col gap-3.5">
                        {isAiReady ? (
                            <>
                                {/* 1. Vocals Slider */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[11px] text-white/70">
                                        <span className="flex items-center gap-1">
                                            {trackStates.vocals.muted ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-green-400" />}
                                            เสียงร้องหลัก (Guide)
                                        </span>
                                        <span className="font-mono text-[10px]">{volumes.vocals}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" value={volumes.vocals} 
                                        onChange={(e) => setVolume('vocals', parseInt(e.target.value))}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                {/* 2. Instrumental Slider */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-[11px] text-white/70">
                                        <span className="flex items-center gap-1">
                                            <Music size={12} className="text-blue-400" />
                                            เสียงดนตรี (Backing)
                                        </span>
                                        <span className="font-mono text-[10px]">{volumes.instrumental}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" value={volumes.instrumental} 
                                        onChange={(e) => setVolume('instrumental', parseInt(e.target.value))}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                {isProMode && (
                                    <>
                                        {/* 3. Drums Slider */}
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between text-[11px] text-white/70">
                                                <span className="flex items-center gap-1">
                                                    <Drum size={12} className="text-amber-400" />
                                                    เสียงกลอง (Drums)
                                                </span>
                                                <span className="font-mono text-[10px]">{volumes.drums}%</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="100" value={volumes.drums} 
                                                onChange={(e) => setVolume('drums', parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>

                                        {/* 4. Bass Slider */}
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between text-[11px] text-white/70">
                                                <span className="flex items-center gap-1">
                                                    <Guitar size={12} className="text-purple-400" />
                                                    เสียงเบส (Bass)
                                                </span>
                                                <span className="font-mono text-[10px]">{volumes.bass}%</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="100" value={volumes.bass} 
                                                onChange={(e) => setVolume('bass', parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>

                                        {/* 5. Other Stems Slider */}
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between text-[11px] text-white/70">
                                                <span className="flex items-center gap-1">
                                                    <Piano size={12} className="text-teal-400" />
                                                    เครื่องดนตรีอื่น (Other)
                                                </span>
                                                <span className="font-mono text-[10px]">{volumes.other}%</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="100" value={volumes.other} 
                                                onChange={(e) => setVolume('other', parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-2 text-center gap-3">
                                <Sparkles className="text-amber-400 animate-pulse" size={24} />
                                <div className="text-[11px] text-white/60 leading-relaxed px-2">ยังไม่ได้ทำแยกเสียงด้วย AI เพื่อควบคุมระดับเสียงเครื่องดนตรีแต่ละชนิด</div>
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
                                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/80 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-lg shadow-primary/20 pointer-events-auto"
                                >
                                    <Wand2 size={13} />
                                    แยกเสียงด้วย AI ตอนนี้
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Part 2: Lyrics Display & AI Sync Settings */}
                    <div className="flex flex-col gap-3.5 border-t border-white/10 pt-3">
                        <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider">
                            ตั้งค่าเนื้อร้อง
                        </span>

                        {/* 1. Toggle Karaoke Sweeping */}
                        <div className="flex justify-between items-center text-xs text-white/90">
                            <span>ปาดสีเนื้อร้อง (คาราโอเกะ)</span>
                            <button 
                                onClick={toggleKaraokeMode}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${isKaraokeMode ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/15'}`}
                            >
                                {isKaraokeMode ? 'เปิด' : 'ปิด'}
                            </button>
                        </div>

                        {/* 2. AI Sync (Hybrid) Trigger & Toggle */}
                        {originalLyrics && originalLyrics.length > 0 && (
                            <div className="flex flex-col gap-2 border-t border-white/5 pt-2">
                                <div className="flex justify-between items-center text-xs text-white/90">
                                    <span className="flex items-center gap-1">
                                        <Sparkles size={12} className={hybridModeEnabled ? "text-amber-400" : "text-white/40"} />
                                        ซิงก์เนื้อร้องตรงด้วย AI
                                    </span>
                                    {alignedLyrics.length > 0 ? (
                                        <button 
                                            onClick={() => setHybridModeEnabled(!hybridModeEnabled)}
                                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${hybridModeEnabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/15'}`}
                                        >
                                            {hybridModeEnabled ? 'เปิดใช้งาน' : 'ปิด'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                if (activeVideoId) {
                                                    alignHybridLyrics(activeVideoId, originalLyrics).catch(console.error);
                                                }
                                            }}
                                            disabled={isAligning}
                                            className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-primary hover:bg-primary/80 disabled:opacity-50 text-white shadow-md shadow-primary/10 transition-all flex items-center gap-1"
                                        >
                                            {isAligning ? 'กำลังซิงก์...' : 'เริ่มซิงก์'}
                                        </button>
                                    )}
                                </div>
                                {isAligning && (
                                    <div className="text-[9px] text-amber-400 animate-pulse text-center">
                                        AI กำลังวิเคราะห์และซิงก์เวลาตรง...
                                    </div>
                                )}
                                {alignmentStatus === 'error' && errorMessage && (
                                    <div className="text-[9px] text-red-400 leading-tight text-center">
                                        ข้อผิดพลาด: {errorMessage}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 1. Toggle Lyrics */}
            <button
                onClick={toggleLyrics}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto ${showLyrics ? 'bg-primary/20 text-primary border border-primary/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                title={showLyrics ? "ปิดการแสดงเนื้อร้อง" : "เปิดการแสดงเนื้อร้อง"}
            >
                <Type size={20} />
            </button>

            {/* 2. Toggle Guide Vocal */}
            <button
                onClick={() => {
                    if (isAiReady) {
                        toggleMute('vocals');
                    } else if (currentVideo) {
                        const uuid = currentVideo.uuid || currentVideo.id;
                        if (uuid && activeVideoId) {
                            useUIStore.getState().showVocalModeModal(uuid, activeVideoId);
                        }
                    }
                }}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto ${isAiReady && trackStates.vocals.muted ? 'bg-red-500/20 text-red-400 border border-red-500/20' : (isAiReady ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'text-white/40 hover:text-white hover:bg-white/10')}`}
                title={isAiReady ? (trackStates.vocals.muted ? "เปิดเสียงร้องไกด์" : "ปิดเสียงร้องไกด์") : "แยกเสียงร้องด้วย AI"}
            >
                {isAiReady ? (trackStates.vocals.muted ? <MicOff size={20} /> : <Mic size={20} />) : <Mic size={20} className="opacity-50" />}
            </button>

            {/* 3. Open Popover Mixer */}
            <button
                ref={mixerBtnRef}
                onClick={() => setShowMixerPopover(!showMixerPopover)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto ${showMixerPopover ? 'bg-white/10 text-white border border-white/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                title="เปิดแผงมิกเซอร์ระดับเสียง"
            >
                <SlidersHorizontal size={20} />
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

            {/* 4. Play/Pause */}
            <button
                onClick={handlePlayPause}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-90 pointer-events-auto ${isPlaying ? 'text-white/90 hover:text-white hover:bg-white/10 bg-white/5' : 'bg-primary text-white shadow-lg shadow-primary/30'}`}
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
            </button>

            <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

            {/* 5. Minimize Toggle */}
            <button
                onClick={toggleFullscreen}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90 pointer-events-auto"
                title="ย่อหน้าจอ"
            >
                <Minimize2 size={20} />
            </button>

            {/* 6. Exit Fullscreen to Split Mode */}
            <button
                onClick={() => usePlayerStore.getState().setLayoutMode('split')}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400/80 hover:text-white hover:bg-red-500/85 transition-all active:scale-90 pointer-events-auto"
                title="ออกจากหน้าจอเต็มจอ"
            >
                <X size={20} strokeWidth={2.5} />
            </button>
        </div>
    );
};
