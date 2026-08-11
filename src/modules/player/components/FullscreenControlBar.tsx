import React, { useState, useRef, useEffect } from 'react';
import { Minimize2, X, Play, Pause, Wand2, Mic, MicOff, Music, Type, Drum, Guitar, Piano, Sparkles } from 'lucide-react';
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

    // State to track which track is being hovered to prevent parent group-hover conflicts
    const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
    // State to keep track of active dragging to keep slider visible even if mouse leaves container
    const [activeDraggingTrack, setActiveDraggingTrack] = useState<string | null>(null);

    // Global listener to release dragging state when mouse is released anywhere
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setActiveDraggingTrack(null);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalMouseUp);
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

    if (layoutMode !== 'fullscreen') return null;

    // Hover-expandable Slider Track Component (Positioned above the button)
    const TrackControl = ({ 
        track, 
        icon: Icon, 
        label, 
        colorClass 
    }: { 
        track: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other', 
        icon: any, 
        label: string, 
        colorClass: string 
    }) => {
        const isMuted = trackStates[track].muted;
        const vol = volumes[track];
        const isHovered = hoveredTrack === track || activeDraggingTrack === track;
        
        return (
            <div 
                onMouseEnter={() => setHoveredTrack(track)}
                onMouseLeave={() => setHoveredTrack(null)}
                className="relative flex flex-col items-center pointer-events-auto shrink-0"
            >
                {/* Floating Volume Box (Positioned above with a contiguous hover wrapper to prevent flickering) */}
                {isHovered && (
                    <div className="absolute bottom-[44px] left-1/2 -translate-x-1/2 pb-2 z-50">
                        <div className="bg-black/90 backdrop-blur-md border border-white/10 p-2.5 rounded-xl shadow-xl flex flex-col items-center gap-1.5 w-32 pointer-events-auto">
                            <span className="text-[10px] text-white/70 font-semibold">{label}: {vol}%</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={isMuted ? 0 : vol}
                                onChange={(e) => setVolume(track, parseInt(e.target.value))}
                                onMouseDown={() => setActiveDraggingTrack(track)}
                                onTouchStart={() => setActiveDraggingTrack(track)}
                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    </div>
                )}
                
                {/* Button */}
                <button
                    onClick={() => toggleMute(track)}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90 ${isMuted ? 'text-white/30 bg-white/5 border border-white/5' : colorClass}`}
                    title={`${label} (คลิกเพื่อ เปิด/ปิด, ชี้เพื่อปรับเสียง)`}
                >
                    <Icon size={20} />
                </button>
            </div>
        );
    };

    return (
        <div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 md:gap-2.5 p-1.5 md:p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
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

            {/* 3. Audio & Vocal Controls */}
            {isAiReady ? (
                <div className="flex items-center gap-1.5">
                    {/* Vocal Control */}
                    <TrackControl 
                        track="vocals" 
                        icon={trackStates.vocals.muted ? MicOff : Mic} 
                        label="เสียงร้อง" 
                        colorClass="text-green-400 bg-green-500/10 border-green-500/20" 
                    />
                    
                    {/* Stems Controls based on Mode (Basic 2CH vs Pro 4CH) */}
                    {!isProMode ? (
                        <TrackControl 
                            track="instrumental" 
                            icon={Music} 
                            label="ดนตรี" 
                            colorClass="text-blue-400 bg-blue-500/10 border-blue-500/20" 
                        />
                    ) : (
                        <>
                            <TrackControl 
                                track="drums" 
                                icon={Drum} 
                                label="กลอง" 
                                colorClass="text-amber-400 bg-amber-500/10 border-amber-500/20" 
                            />
                            <TrackControl 
                                track="bass" 
                                icon={Guitar} 
                                label="เบส" 
                                colorClass="text-purple-400 bg-purple-500/10 border-purple-500/20" 
                            />
                            <TrackControl 
                                track="other" 
                                icon={Piano} 
                                label="อื่นๆ" 
                                colorClass="text-teal-400 bg-teal-500/10 border-teal-500/20" 
                            />
                        </>
                    )}
                </div>
            ) : (
                /* Quick Separate Trigger Button when AI stems are offline */
                <button
                    onClick={() => {
                        if (currentVideo) {
                            const uuid = currentVideo.uuid || currentVideo.id;
                            if (uuid && activeVideoId) {
                                useUIStore.getState().showVocalModeModal(uuid, activeVideoId);
                            }
                        }
                    }}
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 transition-all pointer-events-auto shrink-0"
                    title="แยกเสียงร้อง/ดนตรีด้วย AI"
                >
                    <Sparkles size={20} />
                </button>
            )}

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
