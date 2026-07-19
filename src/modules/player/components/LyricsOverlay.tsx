import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLyricsStore } from '../stores/useLyricsStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import clsx from 'clsx';

interface LyricsOverlayProps {
    playerRef: React.MutableRefObject<any>;
    activeVideoId?: string;
    videoTitle?: string;
}

export const LyricsOverlay = ({ playerRef, activeVideoId, videoTitle }: LyricsOverlayProps) => {
    const { isEnabled, lyrics, source, fetchLyrics } = useLyricsStore();
    const { isPlaying, currentSource } = usePlayerStore();
    
    const [currentTime, setCurrentTime] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);

    // Fetch lyrics when video changes
    useEffect(() => {
        if (activeVideoId && videoTitle) {
            fetchLyrics(activeVideoId, videoTitle);
        }
    }, [activeVideoId, videoTitle, fetchLyrics]);

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

    // Find current line index
    const currentLineIndex = useMemo(() => {
        if (!lyrics || lyrics.length === 0) return -1;
        // Find the last line whose time is <= currentTime
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= lyrics[i].time) {
                return i;
            }
        }
        return -1;
    }, [currentTime, lyrics]);

    // Auto-scroll
    useEffect(() => {
        if (activeLineRef.current && containerRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentLineIndex]);

    if (!isEnabled || !lyrics || lyrics.length === 0) return null;

    // Determine the visible lines (window around the current line)
    // Traditional karaoke shows about 2-4 lines
    const startIdx = Math.max(0, currentLineIndex - 1);
    const visibleLines = lyrics.slice(startIdx, startIdx + 3);

    return (
        <div className="absolute inset-0 pointer-events-none z-40 flex items-end justify-center pb-20">
            {/* Lyrics Container */}
            <div 
                ref={containerRef}
                className="w-[90%] max-w-4xl text-center space-y-4 px-4 py-8"
            >
                {/* Source Attribution (only show briefly or keep small) */}
                {source && (
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-white/50 font-medium">
                        เนื้อเพลงจาก: {source === 'lrclib' ? 'LRCLIB' : 'YouTube CC'}
                    </div>
                )}

                {lyrics.map((line, index) => {
                    // Only render lines near the current one to save DOM nodes
                    if (Math.abs(index - currentLineIndex) > 3) return null;

                    const isActive = index === currentLineIndex;
                    const isPassed = index < currentLineIndex;
                    
                    // For sweep effect on LRCLIB synced lyrics:
                    // We need the duration of the line. Approximate it by next line time.
                    const nextTime = index < lyrics.length - 1 ? lyrics[index + 1].time : line.time + 5;
                    const lineDuration = nextTime - line.time;
                    const progress = isActive ? Math.min(1, Math.max(0, (currentTime - line.time) / lineDuration)) : (isPassed ? 1 : 0);

                    return (
                        <div 
                            key={index} 
                            ref={isActive ? activeLineRef : null}
                            className={clsx(
                                "transition-all duration-300 ease-out font-black transform",
                                isActive ? "text-3xl md:text-5xl scale-110 opacity-100" : "text-2xl md:text-3xl opacity-50 scale-100"
                            )}
                            style={{
                                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 4px 10px rgba(0,0,0,0.8)'
                            }}
                        >
                            {/* The Sweep Background Text (White/Gray) */}
                            <div className="relative inline-block">
                                <span className={isActive ? "text-white" : "text-gray-300"}>
                                    {line.text}
                                </span>
                                
                                {/* The Swept Foreground Text (Yellow/Primary) */}
                                {source === 'lrclib' && (
                                    <span 
                                        className="absolute left-0 top-0 overflow-hidden text-yellow-400 whitespace-pre"
                                        style={{ 
                                            width: `${progress * 100}%`,
                                            transition: isActive ? 'width 0.1s linear' : 'none'
                                        }}
                                    >
                                        {line.text}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
