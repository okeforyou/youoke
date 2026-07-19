import React, { useEffect, useState, useMemo } from 'react';
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
    const { isPlaying } = usePlayerStore();
    
    const [currentTime, setCurrentTime] = useState(0);

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

    if (!isEnabled || !lyrics || lyrics.length === 0) return null;

    // VCD Style Layout Logic
    const activeIndex = Math.max(0, currentLineIndex);
    const isTopActive = activeIndex % 2 === 0;

    const topLineIndex = isTopActive ? activeIndex : activeIndex + 1;
    const bottomLineIndex = isTopActive ? activeIndex + 1 : activeIndex;

    const topLine = lyrics[topLineIndex];
    const bottomLine = lyrics[bottomLineIndex];

    const renderLine = (line: any, index: number, align: 'left' | 'right') => {
        if (!line) return <div className="h-[4.5rem] md:h-[100px] w-full" />; // Empty slot to maintain height

        // Fake sweep duration calculation
        const nextTime = index < lyrics.length - 1 ? lyrics[index + 1].time : line.time + 5;
        const rawDuration = nextTime - line.time;
        // Don't sweep slower than 5 seconds (prevent super slow sweep during instrumental)
        const lineDuration = Math.min(rawDuration, 5); 

        let progress = 0;
        if (index < currentLineIndex) {
            progress = 1;
        } else if (index === currentLineIndex) {
            progress = (currentTime - line.time) / lineDuration;
        }
        progress = Math.min(1, Math.max(0, progress));

        const isActive = index === currentLineIndex;

        return (
            <div className={`flex w-full ${align === 'left' ? 'justify-start' : 'justify-end'} h-[4.5rem] md:h-[100px] items-center`}>
                <div 
                    className={clsx(
                        "relative inline-block font-black text-[32px] md:text-[56px] tracking-wide",
                        "transition-transform duration-200",
                        isActive ? "scale-100" : "scale-[0.95]" // Slight pop when active
                    )}
                    style={{
                        WebkitTextStroke: '4px black', // Thick outline for VCD style
                        paintOrder: 'stroke fill',
                    }}
                >
                    {/* Base Text (White with shadow) */}
                    <span className="text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                        {line.text}
                    </span>
                    
                    {/* Swept Text (Blue) */}
                    <span 
                        className="absolute left-0 top-0 overflow-hidden text-[#2563eb] whitespace-pre drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
                        style={{ 
                            width: `${progress * 100}%`,
                            WebkitTextStroke: '4px black',
                            paintOrder: 'stroke fill',
                            transition: isActive ? 'width 0.1s linear' : 'none'
                        }}
                    >
                        {line.text}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-40 flex items-end justify-center pb-16 md:pb-24">
            {/* Lyrics Container */}
            <div className="w-[95%] max-w-5xl flex flex-col space-y-2 px-6">
                {source && (
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-white/50 font-medium">
                        เนื้อเพลงจาก: {source === 'lrclib' ? 'LRCLIB' : 'YouTube CC'}
                    </div>
                )}
                {renderLine(topLine, topLineIndex, 'left')}
                {renderLine(bottomLine, bottomLineIndex, 'right')}
            </div>
        </div>
    );
};
