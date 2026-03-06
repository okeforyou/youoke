import React, { useEffect, useState, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Mic, ListMusic, Maximize2, Shuffle, RotateCcw } from "lucide-react";
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from "../stores/usePlayerStore";
import { useUIStore } from "../../../stores/useUIStore";
import { MarqueeText } from "../../../components/MarqueeText";
import { AudioOutputSwitcher } from "./AudioOutputSwitcher";
import { useCast } from "../../../plugins/cast/context/CastContext";

export const PlayerControls = () => {
    const { isPlaying, volume, isMuted, playNext, playPrevious, currentVideo, togglePlay, setVolume, setMuted, isKaraoke, queue } = usePlayerStore(
        useShallow(state => ({
            isPlaying: state.isPlaying,
            volume: state.volume,
            isMuted: state.isMuted,
            playNext: state.playNext,
            playPrevious: state.playPrevious,
            currentVideo: state.currentVideo,
            togglePlay: state.togglePlay,
            setVolume: state.setVolume,
            setMuted: state.setMuted,
            isKaraoke: state.isKaraoke,
            queue: state.queue
        }))
    );

    // Cast integration: route controls through Cast when connected
    const cast = useCast();
    const isCasting = cast.isConnected;

    const handlePlayPause = () => {
        if (isCasting) {
            // Route through Cast — sends PLAY/PAUSE message to receiver
            isPlaying ? cast.pause() : cast.play();
        } else {
            togglePlay();
        }
    };

    const handleNext = () => {
        if (isCasting) {
            cast.next();
        } else {
            playNext();
        }
    };

    const handlePrevious = () => {
        if (isCasting) {
            cast.previous();
        } else {
            playPrevious();
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseInt(e.target.value);
        setVolume(vol);
    };

    // Real time progress
    const { currentTime, duration, setCurrentTime, seekTo } = usePlayerStore(
        useShallow(state => ({
            currentTime: state.currentTime,
            duration: state.duration,
            setCurrentTime: state.setCurrentTime,
            seekTo: state.seekTo
        }))
    );

    // Local handling for smooth dragging
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(0);

    const progressPercent = useMemo(() => {
        if (isDragging) return dragValue;
        if (!duration || duration === 0) return 0;
        return Math.min((currentTime / duration) * 100, 100);
    }, [currentTime, duration, isDragging, dragValue]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsDragging(true);
        setDragValue(parseFloat(e.target.value));
    };

    const handleSeekCommit = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        setIsDragging(false);
        if (duration > 0) {
            const newTime = (parseFloat((e.target as HTMLInputElement).value) / 100) * duration;
            seekTo(newTime);
        }
    };

    const coverImage = currentVideo?.thumbnail || (currentVideo as any)?.videoThumbnails?.[0]?.url || "";

    return (
        // Transparent BG to allow parent glassmorphism
        <div className="w-full z-20 shrink-0 bg-transparent relative z-[30]">

            {/* Neon Progress Bar (Draggable) */}
            <div className="px-6 sm:px-8 w-full group relative h-3 flex items-center mt-3">

                {/* Visual Track (Background & Active) */}
                <div className="absolute inset-x-4 h-[4px] bg-gray-300/30 rounded-full overflow-hidden pointer-events-none backdrop-blur-sm">
                    <div
                        className="h-full bg-primary transition-all duration-75 relative shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Scrubber Knob (Visual) */}
                <div
                    className="absolute h-3 w-3 bg-white rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] pointer-events-none transition-all duration-75 z-10"
                    style={{
                        left: `calc(16px + ${progressPercent}% * 0.92)`
                    }}
                />

                {/* Input Range (Interaction Layer) */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progressPercent}
                    onChange={handleSeek}
                    onMouseUp={handleSeekCommit}
                    onTouchEnd={handleSeekCommit}
                    className="
                        absolute inset-x-4 h-4 opacity-0 z-20 cursor-pointer text-primary
                    "
                />
            </div>

            <div className="flex items-center justify-between px-4 pb-2 pt-1 max-w-screen-2xl mx-auto gap-4 h-[64px]">

                {/* Left: Song Info (Compact) */}
                <div className="flex items-center gap-3 flex-1 min-w-0 transition-all">

                    {/* Type Icon: Hidden on mobile to save space */}


                    <div
                        onClick={() => useUIStore.getState().setMobilePlayerExpanded(true)}
                        className={`
                        relative w-10 h-10 sm:w-11 sm:h-11 rounded-md overflow-hidden shrink-0 cursor-pointer active:scale-95
                        ${coverImage ? 'bg-gray-200 shadow-sm' : 'bg-gray-100 flex items-center justify-center'}
                        transition-all duration-300
                    `}>
                        {coverImage ? (
                            <img
                                src={coverImage}
                                alt={currentVideo?.title || "Cover"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}

                        {/* Fallback Icon Area (If no image) */}
                        <div className={`absolute inset-0 flex items-center justify-center ${coverImage ? 'hidden' : ''}`}>
                            <div className="flex gap-[2px] items-end h-3 pb-0.5">
                                <div className={`w-0.5 bg-primary rounded-full ${isPlaying ? 'animate-[music-bar_0.6s_ease-in-out_infinite] min-h-[4px]' : 'h-1.5'}`}></div>
                                <div className={`w-0.5 bg-primary rounded-full ${isPlaying ? 'animate-[music-bar_0.8s_ease-in-out_infinite_0.1s] min-h-[6px]' : 'h-2'}`}></div>
                                <div className={`w-0.5 bg-primary rounded-full ${isPlaying ? 'animate-[music-bar_1.0s_ease-in-out_infinite_0.2s] min-h-[3px]' : 'h-1'}`}></div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="flex flex-col min-w-0 justify-center overflow-hidden cursor-pointer"
                        onClick={() => useUIStore.getState().setMobilePlayerExpanded(true)}
                    >
                        <MarqueeText
                            text={currentVideo?.title || "Choose a song"}
                            className="font-bold text-gray-900 text-sm leading-tight"
                            speed={15}
                        />
                        <MarqueeText
                            text={currentVideo?.author || "YouOke"}
                            className="text-xs text-gray-500 mt-0.5 font-medium"
                            speed={20}
                        />
                    </div>
                </div>

                {/* Center: Controls */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 shrink-0">
                    {/* Previous */}
                    <button
                        onClick={() => handlePrevious()}
                        className="hidden sm:block text-gray-400 hover:text-gray-900 transition-colors active:scale-90 p-2"
                    >
                        <SkipBack size={24} fill="currentColor" strokeWidth={0} />
                    </button>

                    <button
                        onClick={handlePlayPause}
                        className="
                            w-11 h-11 sm:w-12 sm:h-12 rounded-full 
                            bg-white text-gray-900 border border-gray-200
                            flex items-center justify-center 
                            shadow-sm hover:shadow-md hover:border-primary/20 hover:text-primary 
                            active:scale-95 transition-all duration-200
                        "
                    >
                        {isPlaying ? (
                            <Pause size={20} fill="currentColor" strokeWidth={0} />
                        ) : (
                            <Play size={20} fill="currentColor" className="ml-0.5" strokeWidth={0} />
                        )}
                    </button>

                    {/* Replay */}
                    <button
                        onClick={() => {
                            if (isCasting && currentVideo) {
                                cast.playNow(currentVideo);
                            } else {
                                seekTo(0);
                                if (!isPlaying) togglePlay();
                            }
                        }}
                        className="text-gray-400 hover:text-primary transition-colors active:scale-90 p-2 rounded-full hover:bg-gray-100"
                        title="ร้องเพลงนี้ซ้ำ"
                    >
                        <RotateCcw size={20} />
                    </button>

                    <button
                        onClick={() => handleNext()}
                        className="hidden sm:block text-gray-400 hover:text-gray-900 transition-colors active:scale-90 p-2"
                    >
                        <SkipForward size={24} fill="currentColor" strokeWidth={0} />
                    </button>

                    <button
                        onClick={() => usePlayerStore.getState().shuffleQueue()}
                        className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-100"
                        title="สุ่มคิวเพลง"
                    >
                        <Shuffle size={20} />
                    </button>
                </div>

                {/* Right: Tools & Queue (Unified for Mobile) */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">

                    {/* Desktop Tools (Fullscreen, Mute, Volume) - Hidden on Mobile */}
                    <div className="hidden sm:flex items-center gap-3">

                        {/* Audio Output Switcher (Only visible in DJ Mode) */}
                        <AudioOutputSwitcher />

                        <button
                            onClick={() => {
                                const isFs = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
                                if (!isFs) {
                                    const elem = document.getElementById('karaoke-video-container') || document.documentElement;
                                    if (elem.requestFullscreen) {
                                        elem.requestFullscreen().catch(err => console.error("Fullscreen failed:", err));
                                    } else if ((elem as any).webkitRequestFullscreen) {
                                        (elem as any).webkitRequestFullscreen();
                                    }
                                } else {
                                    if (document.exitFullscreen) {
                                        document.exitFullscreen().catch(err => console.error("Exit fullscreen failed:", err));
                                    }
                                }
                                usePlayerStore.getState().triggerFullscreen();
                            }}
                            className="text-gray-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-gray-100"
                            title="เล่นเต็มจอ"
                        >
                            <Maximize2 size={18} />
                        </button>

                        <button onClick={() => setMuted(!isMuted)} className="text-gray-400 hover:text-gray-600">
                            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <div className="w-20 group relative py-2 cursor-pointer">
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-400 group-hover:bg-primary transition-colors" style={{ width: `${volume}%` }} />
                            </div>
                            <input type="range" min={0} max={100} value={volume} onChange={handleVolumeChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>



                    {/* Queue Toggle: ALWAYS Visible */}
                    <button
                        onClick={() => useUIStore.getState().setQueueOpen(!useUIStore.getState().isQueueOpen)}
                        className={`p-2 rounded-lg transition-colors relative ${useUIStore((state) => state.isQueueOpen) ? 'bg-gray-200 text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ListMusic size={20} />
                        {queue.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm border border-white">
                                {queue.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes music-bar {
                    0%, 100% { height: 4px; }
                    50% { height: 12px; }
                }
            `}</style>
        </div>
    );
};
