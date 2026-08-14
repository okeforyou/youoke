import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLyricsStore } from '../stores/useLyricsStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useDeepgramLyricsStore } from '../../lyrics/stores/useDeepgramLyricsStore';
import { useCast } from '../../../plugins/cast/context/CastContext';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';
import clsx from 'clsx';

interface LyricsOverlayProps {
    playerRef: React.MutableRefObject<any>;
}

export const LyricsOverlay = ({ playerRef }: LyricsOverlayProps) => {
    const { isEnabled, isKaraokeMode, lyrics: originalLyrics, lyricsType, source, fetchLyrics, syncOffset, setActiveLineText, lyricsLayout } = useLyricsStore();
    const { alignedLyrics, hybridModeEnabled, isAligning, alignHybridLyrics } = useDeepgramLyricsStore();
    const cast = useCast();
    const seekTo = usePlayerStore(state => state.seekTo);
    
    // Switch between original lyrics and aligned lyrics based on Hybrid mode (skip if pure deepgram)
    const lyrics = (hybridModeEnabled && alignedLyrics.length > 0 && source !== 'deepgram') ? alignedLyrics : originalLyrics;
    
    const containerRef = useRef<HTMLDivElement>(null);
    
    const { isPlaying } = usePlayerStore();
    const activeVideoId = usePlayerStore(state => state.currentVideo?.videoId || state.currentVideo?.id);
    const videoTitle = usePlayerStore(state => state.currentVideo?.title);
    const videoDuration = usePlayerStore(state => state.currentVideo?.duration);
    
    const [currentTime, setCurrentTime] = useState(0);

    const aiVocalStore = useAIVocalStore();
    const aiJob = activeVideoId ? aiVocalStore.jobs[activeVideoId] : null;
    const isAiReady = Boolean(activeVideoId && aiJob?.status === 'ready');
    
    const isSynced = useMemo(() => {
        return lyrics && lyrics.some(l => l.time >= 0);
    }, [lyrics]);

    // Smart Auto-Sync: if plain lyrics, AI is ready, and not yet aligned, run aligner silently in the background
    useEffect(() => {
        if (
            lyricsType === 'plain' &&
            isAiReady &&
            activeVideoId &&
            originalLyrics &&
            originalLyrics.length > 0 &&
            alignedLyrics.length === 0 &&
            !isAligning &&
            useDeepgramLyricsStore.getState().alignmentStatus === 'idle'
        ) {
            console.log("[Smart Auto Sync] Cached vocals found! Triggering background AI alignment...");
            alignHybridLyrics(activeVideoId, originalLyrics)
                .then(() => {
                    console.log("[Smart Auto Sync] Background alignment successful!");
                })
                .catch((err) => {
                    console.warn("[Smart Auto Sync] Background alignment failed:", err);
                });
        }
    }, [lyricsType, isAiReady, activeVideoId, originalLyrics, alignedLyrics.length, isAligning, alignHybridLyrics]);

    // Fetch lyrics when video changes
    useEffect(() => {
        if (activeVideoId) {
            // Reset Deepgram hybrid sync state for the new video
            useDeepgramLyricsStore.getState().reset();
            
            if (videoTitle) {
                fetchLyrics(activeVideoId, videoTitle, 'auto', videoDuration);
            }
        }
    }, [activeVideoId, videoTitle, videoDuration, fetchLyrics]);

    // Fast precise time tracking loop for smooth sweep (uses clock interpolation to avoid YouTube API update stutter)
    useEffect(() => {
        if (!isEnabled || !isPlaying) return;
        
        let animationFrameId: number;
        let lastRealTime = 0;
        let lastLocalTime = 0;
        
        const loop = () => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                try {
                    const realTime = playerRef.current.getCurrentTime();
                    if (typeof realTime === 'number') {
                        const now = performance.now();
                        if (realTime !== lastRealTime) {
                            lastRealTime = realTime;
                            lastLocalTime = now;
                            setCurrentTime(realTime);
                        } else {
                            // Interpolate time elapsed since last realTime update
                            const elapsed = (now - lastLocalTime) / 1000;
                            // Limit interpolation to 0.5s to prevent runaway drift
                            if (elapsed < 0.5) {
                                setCurrentTime(realTime + elapsed);
                            }
                        }
                    }
                } catch (e) {}
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();
        
        return () => cancelAnimationFrame(animationFrameId);
    }, [isEnabled, isPlaying, playerRef]);

    // Find current line index (taking syncOffset into account)
    const currentLineIndex = useMemo(() => {
        if (!lyrics || lyrics.length === 0) return -1;
        
        const adjustedTime = currentTime - syncOffset;
        
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (adjustedTime >= lyrics[i].time) {
                return i;
            }
        }
        return -1;
    }, [currentTime, lyrics, syncOffset]);

    const activeIndex = Math.max(0, currentLineIndex);
    const activeLine = lyrics && lyrics.length > 0 && currentLineIndex >= 0 ? lyrics[currentLineIndex] : null;

    // Sync active line text to store so other components (like Mixer modal) can show it in real-time!
    // MUST BE CALLED BEFORE ANY EARLY RETURN to obey React Hook Rules
    useEffect(() => {
        if (activeLine && isEnabled && isSynced) {
            setActiveLineText(activeLine.text);
        } else {
            setActiveLineText('');
        }
    }, [activeLine, isEnabled, isSynced, setActiveLineText]);

    // Auto-scroll logic for plain lyrics layout / scroll layout
    // MUST BE CALLED BEFORE ANY EARLY RETURN to obey React Hook Rules
    useEffect(() => {
        const currentLayout = !isSynced ? 'scroll' : lyricsLayout;
        if (currentLayout === 'scroll' && containerRef.current && currentLineIndex >= 0) {
            const activeEl = containerRef.current.querySelector(`[data-line-index="${currentLineIndex}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [currentLineIndex, lyricsLayout, isSynced]);

    if (!isEnabled || !lyrics || lyrics.length === 0) return null;

    // Click-to-seek logic for interactive lyrics
    const handleLineSeek = (time: number) => {
        if (time >= 0) {
            seekTo(time);
            if (cast && cast.isCasting && typeof cast.seekTo === 'function') {
                cast.seekTo(time);
            }
        }
    };

    const currentLayout = !isSynced ? 'scroll' : lyricsLayout;

    if (currentLayout === 'scroll') {
        return (
            <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center p-4">
                {/* Fading Backdrop Blur background layer */}
                <div 
                    className="absolute inset-y-16 inset-x-4 md:inset-x-20 bg-black/10 backdrop-blur-xl rounded-[2.5rem] pointer-events-none"
                    style={{
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
                        maskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
                    }}
                />

                {/* Source/Sync status badge in top-left corner */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-[10px] sm:text-xs text-white/60 font-medium px-2.5 py-1 rounded-lg shadow-md border border-white/5 flex items-center gap-1.5 pointer-events-none select-none">
                    <div className={clsx(
                        "w-1.5 h-1.5 rounded-full animate-pulse",
                        isSynced ? "bg-amber-400" : "bg-gray-400"
                    )} />
                    <span>
                        {isSynced 
                            ? (hybridModeEnabled ? "เนื้อเพลงซิงก์ด้วย AI Sync" : "เนื้อเพลงแบบเลื่อนตามจังหวะ") 
                            : "เนื้อเพลงแบบอ่านปกติ (กด ซิงก์ AI เพื่อเลื่อนตามเพลง)"
                        }
                    </span>
                </div>

                <div 
                    ref={containerRef}
                    className="w-full max-w-3xl h-[80%] max-h-[600px] overflow-y-auto no-scrollbar text-center flex flex-col gap-8 py-20 pointer-events-auto transition-all"
                    style={{
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 20%, white 80%, transparent 100%)',
                        maskImage: 'linear-gradient(to bottom, transparent 0%, white 20%, white 80%, transparent 100%)',
                    }}
                >
                    {/* Lyric Lines */}
                    <div className="flex flex-col gap-8 py-4">
                        {lyrics.map((line: any, i: number) => {
                            const isActive = isSynced && i === currentLineIndex;
                            return (
                                <div 
                                    key={i} 
                                    data-line-index={i}
                                    onClick={() => handleLineSeek(line.time)}
                                    className={clsx(
                                        "transition-all duration-500 ease-out select-none px-4 origin-center",
                                        isSynced ? "cursor-pointer" : "cursor-default",
                                        isActive 
                                            ? "text-white font-black text-base md:text-xl scale-[1.35] opacity-100 drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)] z-10" 
                                            : isSynced 
                                                ? "text-white/25 hover:text-white/75 font-bold text-base md:text-xl scale-100" 
                                                : "text-white/80 font-bold text-base md:text-xl scale-100 opacity-100"
                                    )}
                                    style={{
                                        lineHeight: '1.4',
                                        WebkitTextStroke: isActive ? '1.5px rgba(0,0,0,0.8)' : '1px rgba(0,0,0,0.5)',
                                        paintOrder: 'stroke fill',
                                    }}
                                >
                                    {line.text}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Single Line Layout Logic

    const renderLine = (line: any, index: number) => {
        if (!line) return <div className="w-full" style={{ minHeight: 'clamp(1.5rem, 6.5cqw, 4rem)' }} />; // Empty slot

        const adjustedTime = currentTime - syncOffset;
        const nextTime = index < lyrics.length - 1 ? lyrics[index + 1].time : line.time + 5;
        const rawDuration = nextTime - line.time;
        const lineDuration = Math.min(rawDuration, 5); 

        let progress = 0;
        if (index < currentLineIndex) {
            progress = 1;
        } else if (index === currentLineIndex) {
            progress = (adjustedTime - line.time) / lineDuration;
        }
        progress = Math.min(1, Math.max(0, progress));

        const isActive = index === currentLineIndex;

        return (
            <div 
                className={`flex w-full justify-center items-center px-4`}
                style={{ minHeight: 'clamp(3rem, 10cqw, 7.5rem)' }}
            >
                <div 
                    className={clsx(
                        "relative inline-block font-black tracking-wide",
                        "transition-colors duration-200 break-words whitespace-pre-wrap max-w-full text-center"
                    )}
                    style={{
                        fontSize: 'clamp(2.2rem, 8cqw, 5.2rem)',
                        lineHeight: '1.4',
                        WebkitTextStroke: 'clamp(2px, 0.4cqw, 4px) black',
                        paintOrder: 'stroke fill',
                    }}
                >
                    {line.words && line.words.length > 0 ? (
                        <span className="text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] flex flex-wrap justify-center select-none leading-relaxed">
                            {line.words.map((w: any, i: number) => {
                                let wordProgress = 0;
                                if (index < currentLineIndex) {
                                    wordProgress = 1;
                                } else if (isActive) {
                                    if (adjustedTime > w.end) wordProgress = 1;
                                    else if (adjustedTime >= w.start) {
                                        wordProgress = (adjustedTime - w.start) / Math.max(0.01, w.end - w.start);
                                    }
                                }
                                
                                return (
                                    <span key={i} className="relative inline-block whitespace-pre">
                                        {/* Base text already includes correct spaces from segmentWords */}
                                        <span>{w.word}</span>
                                        {/* Swept text does NOT include space, so the clip-path hits 100% at the end of the letter, not the space */}
                                        {isKaraokeMode && wordProgress > 0 && (
                                            <span className="absolute left-0 top-0 text-[#2563eb] whitespace-pre" style={{ 
                                                // Using -100% on top/bottom/left to prevent clipping stacked Thai vowels & tone marks (e.g. ฟื้น, พี่)
                                                clipPath: wordProgress >= 0.99 ? 'none' : `inset(-100% ${100 - (wordProgress * 100)}% -100% -100%)`,
                                                transition: 'none',
                                                WebkitTextStroke: 'clamp(2px, 0.4cqw, 4px) black',
                                                paintOrder: 'stroke fill',
                                            }}>
                                                {w.word}
                                            </span>
                                        )}
                                    </span>
                                );
                            })}
                        </span>
                    ) : (
                        <>
                            {/* Simple Line Render (No sweeping to prevent word cutoffs) */}
                                <span 
                                    className={clsx(
                                        "text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] whitespace-pre-wrap break-words max-w-full transition-colors duration-200 text-center leading-relaxed",
                                        isActive && (source === 'youtube' || source === 'lrclib') && "text-[#2563eb]"
                                    )}
                                style={{
                                    WebkitTextStroke: 'clamp(2px, 0.4cqw, 4px) black',
                                    paintOrder: 'stroke fill',
                                }}
                            >
                                {line.text}
                            </span>
                        </>
                    )}
                </div>
            </div>
        );
    };



    return (
        <div 
            className="absolute inset-0 pointer-events-none z-40 flex items-end justify-center" 
            style={{ 
                paddingBottom: 'clamp(4rem, 15vh, 15rem)' // Use vh so it scales with player height
            }}
        >
            {/* Source indicator relocated to top-left corner of the player view */}
            {source && (
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-lg px-2.5 py-1 text-[10px] text-white/60 font-medium shadow-md border border-white/5 pointer-events-none select-none">
                    เนื้อเพลงจาก: {source === 'deepgram' ? 'Deepgram AI (PURE)' : (hybridModeEnabled ? 'Deepgram AI (HYBRID)' : (source === 'lrclib' ? (lyricsType === 'synced' ? 'LRCLIB (SYNC)' : 'LRCLIB (PLAIN)') : 'YouTube CC'))}
                </div>
            )}

            {/* Lyrics Container */}
            <div 
                className="w-[95%] max-w-5xl flex flex-col space-y-1 px-4 sm:px-6 relative group"
                style={{ containerType: 'inline-size' }}
            >
                {renderLine(activeLine, activeIndex)}
            </div>
        </div>
    );
};
