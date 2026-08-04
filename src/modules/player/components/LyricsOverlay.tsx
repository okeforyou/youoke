import React, { useEffect, useState, useMemo } from 'react';
import { useLyricsStore } from '../stores/useLyricsStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import clsx from 'clsx';

interface LyricsOverlayProps {
    playerRef: React.MutableRefObject<any>;
}

export const LyricsOverlay = ({ playerRef }: LyricsOverlayProps) => {
    const { isEnabled, isKaraokeMode, lyrics, lyricsType, source, fetchLyrics, syncOffset } = useLyricsStore();
    const { isPlaying } = usePlayerStore();
    const activeVideoId = usePlayerStore(state => state.currentVideo?.videoId || state.currentVideo?.id);
    const videoTitle = usePlayerStore(state => state.currentVideo?.title);
    const videoDuration = usePlayerStore(state => state.currentVideo?.duration);
    
    const [currentTime, setCurrentTime] = useState(0);

    // Fetch lyrics when video changes
    useEffect(() => {
        if (activeVideoId && videoTitle) {
            fetchLyrics(activeVideoId, videoTitle, 'auto', videoDuration);
        }
    }, [activeVideoId, videoTitle, videoDuration, fetchLyrics]);

    // Fast precise time tracking loop for smooth sweep
    useEffect(() => {
        if (!isEnabled || !isPlaying) return;
        
        let animationFrameId: number;
        const loop = () => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                try {
                    const time = playerRef.current.getCurrentTime();
                    if (typeof time === 'number') {
                        setCurrentTime(time);
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

    if (!isEnabled || !lyrics || lyrics.length === 0) return null;

    if (lyricsType === 'plain') {
        return (
            <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center p-8">
                <div className="w-full max-w-2xl h-[70%] max-h-[500px] overflow-y-auto rounded-2xl bg-black/40 backdrop-blur-md p-6 sm:p-10 scrollbar-hide text-center flex flex-col gap-6 pointer-events-auto shadow-2xl border border-white/10">
                    <div className="sticky top-0 bg-black/80 backdrop-blur-md text-xs text-white/70 font-medium px-4 py-2 rounded-full w-fit mx-auto mb-2 shadow-lg border border-white/5 z-10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                        เนื้อเพลงแบบ PLAIN ธรรมดา
                    </div>
                    <div className="flex flex-col gap-4">
                        {lyrics.map((line: any, i: number) => (
                            <div key={i} className="text-white/90 font-bold text-lg md:text-2xl drop-shadow-md leading-relaxed">
                                {line.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // VCD Style Layout Logic
    const activeIndex = Math.max(0, currentLineIndex);
    const isTopActive = activeIndex % 2 === 0;

    const topLineIndex = isTopActive ? activeIndex : activeIndex + 1;
    const bottomLineIndex = isTopActive ? activeIndex + 1 : activeIndex;

    const topLine = lyrics[topLineIndex];
    const bottomLine = lyrics[bottomLineIndex];

    const renderLine = (line: any, index: number, align: 'left' | 'right') => {
        if (!line) return <div className="w-full" style={{ minHeight: 'clamp(3rem, 12cqw, 6rem)' }} />; // Empty slot

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
            <div className={`flex w-full ${align === 'left' ? 'justify-start' : 'justify-end'} min-h-[12cqh] items-center px-4`}>
                <div 
                    className={clsx(
                        "relative inline-block font-black tracking-wide",
                        "transition-transform duration-200 break-words whitespace-pre-wrap max-w-full text-center md:text-left",
                        isActive ? "scale-100" : "scale-[0.95]"
                    )}
                    style={{
                        fontSize: 'clamp(1rem, 4cqw, 3rem)',
                        lineHeight: '1.2',
                        WebkitTextStroke: 'clamp(2px, 0.4cqw, 4px) black',
                        paintOrder: 'stroke fill',
                    }}
                >
                    {line.words && line.words.length > 0 ? (
                        <span className="text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] flex flex-wrap justify-center md:justify-start">
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
                                    <span key={i} className="inline-block relative">
                                        {/* Base text includes space so the layout is correct */}
                                        <span className="whitespace-pre">{w.word} </span>
                                        {/* Swept text does NOT include space, so the clip-path hits 100% at the end of the letter, not the space */}
                                        {isKaraokeMode && (
                                            <span className="absolute left-0 top-0 text-[#2563eb] whitespace-pre" style={{ 
                                                clipPath: `inset(-20% ${100 - (wordProgress * 100)}% -20% -20%)`,
                                                transition: isActive ? 'clip-path 0.05s linear' : 'none',
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
                                    "text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] whitespace-pre-wrap break-words max-w-full text-center md:text-left transition-colors duration-200",
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
        <div className="absolute inset-0 pointer-events-none z-40 flex items-end justify-center pb-16 md:pb-24 [@container/player]:true" style={{ containerType: 'inline-size' }}>
            {/* Lyrics Container */}
            <div className="w-[95%] max-w-5xl flex flex-col space-y-2 px-6">
                {source && (
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-white/50 font-medium">
                        เนื้อเพลงจาก: {source === 'lrclib' ? (lyricsType === 'synced' ? 'LRCLIB (SYNC)' : 'LRCLIB (PLAIN)') : 'YouTube CC'}
                    </div>
                )}
                {renderLine(topLine, topLineIndex, 'left')}
                {renderLine(bottomLine, bottomLineIndex, 'right')}
            </div>
        </div>
    );
};
