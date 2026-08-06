import React, { useEffect, useState, useMemo } from 'react';
import { useLyricsStore } from '../stores/useLyricsStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useDeepgramLyricsStore } from '../../lyrics/stores/useDeepgramLyricsStore';
import clsx from 'clsx';

interface LyricsOverlayProps {
    playerRef: React.MutableRefObject<any>;
}

export const LyricsOverlay = ({ playerRef }: LyricsOverlayProps) => {
    const { isEnabled, isKaraokeMode, lyrics: originalLyrics, lyricsType, source, fetchLyrics, syncOffset, setActiveLineText } = useLyricsStore();
    const { alignedLyrics, hybridModeEnabled } = useDeepgramLyricsStore();
    
    // Switch between original lyrics and aligned lyrics based on Hybrid mode
    const lyrics = hybridModeEnabled && alignedLyrics.length > 0 ? alignedLyrics : originalLyrics;
    
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

    const activeIndex = Math.max(0, currentLineIndex);
    const activeLine = lyrics && lyrics.length > 0 ? lyrics[activeIndex] : null;

    // Sync active line text to store so other components (like Mixer modal) can show it in real-time!
    // MUST BE CALLED BEFORE ANY EARLY RETURN to obey React Hook Rules
    useEffect(() => {
        if (activeLine && isEnabled && lyricsType !== 'plain') {
            setActiveLineText(activeLine.text);
        } else {
            setActiveLineText('');
        }
    }, [activeLine, isEnabled, lyricsType, setActiveLineText]);

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
                style={{ minHeight: 'clamp(1.5rem, 6.5cqw, 4rem)' }}
            >
                <div 
                    className={clsx(
                        "relative inline-block font-black tracking-wide",
                        "transition-colors duration-200 break-words whitespace-pre-wrap max-w-full text-center"
                    )}
                    style={{
                        fontSize: 'clamp(1.5rem, 8cqw, 5.5rem)',
                        lineHeight: '1.2',
                        WebkitTextStroke: 'clamp(2px, 0.4cqw, 4px) black',
                        paintOrder: 'stroke fill',
                    }}
                >
                    {line.words && line.words.length > 0 ? (
                        <span className="text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] flex flex-wrap justify-center">
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
                                        "text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] whitespace-pre-wrap break-words max-w-full transition-colors duration-200 text-center",
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

    const handleOneTapSync = () => {
        if (activeLine) {
            // Calc offset so that the active line's start time perfectly matches currentTime
            const newOffset = currentTime - activeLine.time;
            setSyncOffset(Math.round(newOffset * 10) / 10);
        }
    };

    const handleAdjustOffset = (amount: number) => {
        setSyncOffset(Math.round((syncOffset + amount) * 10) / 10);
    };

    return (
        <div 
            className="absolute inset-0 pointer-events-none z-40 flex items-end justify-center" 
            style={{ 
                paddingBottom: 'clamp(4rem, 15vh, 15rem)' // Use vh so it scales with player height
            }}
        >
            {/* Lyrics Container */}
            <div 
                className="w-[95%] max-w-5xl flex flex-col space-y-1 px-4 sm:px-6 relative group"
                style={{ containerType: 'inline-size' }}
            >
                {source && (
                    <div className="absolute -top-6 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-white/50 font-medium">
                        เนื้อเพลงจาก: {hybridModeEnabled ? 'Deepgram AI (HYBRID)' : (source === 'lrclib' ? (lyricsType === 'synced' ? 'LRCLIB (SYNC)' : 'LRCLIB (PLAIN)') : 'YouTube CC')}
                    </div>
                )}

                {/* Floating Sync Pill (Visual Sync) */}
                {lyricsType === 'synced' && (
                    <div className="absolute -top-8 right-4 pointer-events-auto flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-2 py-1 shadow-lg border border-white/5 opacity-40 hover:opacity-100 transition-opacity duration-300 z-50">
                        <button onClick={() => handleAdjustOffset(-0.5)} className="px-2 py-1 hover:bg-white/20 rounded-full text-[11px] text-white/80 font-medium transition-colors" title="-0.5s">
                            -0.5
                        </button>
                        <button onClick={() => handleAdjustOffset(-0.1)} className="px-2 py-1 hover:bg-white/20 rounded-full text-[11px] text-white/80 font-medium transition-colors" title="-0.1s">
                            -0.1
                        </button>
                        
                        <div className="w-px h-3 bg-white/20 mx-1" />
                        
                        <button 
                            onClick={handleOneTapSync} 
                            className="px-3 py-1 hover:bg-[#2563eb]/80 bg-[#2563eb]/30 text-white rounded-full text-[11px] font-bold transition-colors flex items-center gap-1.5" 
                            title="กดเมื่อนักร้องเริ่มร้องท่อนนี้ (Sync to Now)"
                        >
                            <span>🎯</span> <span>Sync</span>
                        </button>

                        <div className="w-px h-3 bg-white/20 mx-1" />

                        <button onClick={() => handleAdjustOffset(0.1)} className="px-2 py-1 hover:bg-white/20 rounded-full text-[11px] text-white/80 font-medium transition-colors" title="+0.1s">
                            +0.1
                        </button>
                        <button onClick={() => handleAdjustOffset(0.5)} className="px-2 py-1 hover:bg-white/20 rounded-full text-[11px] text-white/80 font-medium transition-colors" title="+0.5s">
                            +0.5
                        </button>
                        
                        {/* Offset indicator */}
                        {syncOffset !== 0 && (
                            <div className="absolute -top-5 right-0 bg-black/60 rounded px-1.5 text-[9px] text-blue-300 border border-white/10 font-mono">
                                {syncOffset > 0 ? '+' : ''}{syncOffset}s
                            </div>
                        )}
                    </div>
                )}

                {renderLine(activeLine, activeIndex)}
            </div>
        </div>
    );
};
