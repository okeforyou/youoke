import React, { useMemo, useEffect, useState, useRef } from 'react';
import { LyricEvent } from '../../../utils/MidiLyricsParser';

interface KaraokeDisplayProps {
    lyrics: LyricEvent[];
    currentTime: number;
}

export const KaraokeDisplay: React.FC<KaraokeDisplayProps> = ({ lyrics, currentTime }) => {
    // Optimization: Find current lyric index efficiently
    // Since lyrics are sorted by time, we can binary search or just linear search near last index.
    // For 200 lines, linear scan is trivial.

    // Group lyrics into lines (assuming '\r' or new events implicitly start lines? 
    // In NCN/MIDI, lyrics are syllables. A "Line" is usually terminated by a '/' or implied by pause?
    // Standard MIDI lyrics: '/' or '\r' starts a new line. '\' might start a new page.
    // Let's first group syllables into "Lines".

    const lines = useMemo(() => {
        const grouped: { start: number, end: number, text: string, syllables: LyricEvent[] }[] = [];
        let currentLine: LyricEvent[] = [];

        lyrics.forEach(evt => {
            // Check for line break markers
            // Standard: text starts with / or \ means new line
            const txt = evt.text;
            let isNewLine = false;

            // Clean text and check prefix
            let cleanText = txt;
            if (txt.startsWith('/') || txt.startsWith('\\')) {
                isNewLine = true;
                cleanText = txt.substring(1);
            }

            // Some files use special marker events? 
            // Let's assume '/' prefix rule for now.

            if (isNewLine && currentLine.length > 0) {
                grouped.push({
                    start: currentLine[0].time,
                    end: currentLine[currentLine.length - 1].time + 2, // Approximate duration
                    text: currentLine.map(s => s.text.replace(/^[/\\]/, '')).join(''),
                    syllables: [...currentLine]
                });
                currentLine = [];
            }

            // Add syllable
            currentLine.push({ ...evt, text: cleanText });
        });

        // Flush last
        if (currentLine.length > 0) {
            grouped.push({
                start: currentLine[0].time,
                end: currentLine[currentLine.length - 1].time + 2,
                text: currentLine.map(s => s.text).join(''),
                syllables: [...currentLine]
            });
        }

        return grouped;
    }, [lyrics]);

    // Find active line
    // We want the line where: start <= currentTime <= end
    // Or just the line that started most recently
    const activeLineIndex = lines.findIndex((line, idx) => {
        const nextLine = lines[idx + 1];
        if (nextLine) {
            return currentTime >= line.start && currentTime < nextLine.start;
        }
        return currentTime >= line.start;
    });

    const activeLine = lines[activeLineIndex];
    const nextLine = lines[activeLineIndex + 1];

    if (!activeLine) {
        return (
            <div className="w-full h-32 flex items-center justify-center text-gray-500">
                Waiting for Lyrics...
            </div>
        );
    }

    return (
        <div className="w-full p-6 bg-black/80 rounded-xl border border-white/10 text-center flex flex-col items-center justify-center space-y-4">
            {/* Current Line */}
            <div className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-wide font-thai leading-relaxed transition-all duration-300 transform">
                {activeLine.syllables.map((syl, i) => {
                    // Highlight passed syllables
                    // Future: Interpolate color based on time?
                    const isPast = currentTime >= syl.time;
                    return (
                        <span key={i} className={`${isPast ? 'text-blue-400' : 'text-yellow-400'} transition-colors duration-100`}>
                            {syl.text}
                        </span>
                    );
                })}
            </div>

            {/* Next Line (Preview) */}
            {nextLine && (
                <div className="text-xl md:text-2xl text-gray-500 font-thai opacity-60 mt-4">
                    {nextLine.text}
                </div>
            )}
        </div>
    );
};
