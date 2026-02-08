import { decodeThai } from './textDecoder';


export interface LyricEvent {
    time: number; // Seconds
    tick: number; // Original Ticks
    text: string;
    type: 'lyric' | 'text' | 'marker';
}

interface TempoEvent {
    tick: number;
    microsecondsPerBeat: number;
}

/**
 * Scans a MIDI buffer for Lyric (0x05), Text (0x01), etc. AND Tempo events.
 * Converts Ticks to Seconds for precise playback sync.
 */
export const extractLyrics = (buffer: ArrayBuffer): LyricEvent[] => {
    const data = new Uint8Array(buffer);
    const lyricsRaw: { tick: number; text: string; type: any }[] = [];
    const tempoMap: TempoEvent[] = [];

    let offset = 0;

    // 1. Parse Header
    if (data[0] !== 0x4d || data[1] !== 0x54 || data[2] !== 0x68 || data[3] !== 0x64) {
        throw new Error("Invalid MIDI Header");
    }
    offset += 8;
    const format = (data[offset] << 8) | data[offset + 1];
    const trackCount = (data[offset + 2] << 8) | data[offset + 3];
    const timeDivision = (data[offset + 4] << 8) | data[offset + 5]; // Ticks per beat (PPQ)
    offset += 6;

    if (timeDivision & 0x8000) {
        throw new Error("SMPTE time division not supported yet");
    }

    // 2. Iterate Tracks to gather ALL events (Lyrics & Tempo)
    for (let t = 0; t < trackCount; t++) {
        if (offset >= data.length) break;

        if (data[offset] !== 0x4d || data[offset + 1] !== 0x54 || data[offset + 2] !== 0x72 || data[offset + 3] !== 0x6b) {
            // console.warn("Invalid Track Header at", offset);
            break;
        }
        offset += 4;
        const trackLen = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
        offset += 4;

        const trackEnd = offset + trackLen;
        let currentTick = 0;
        let status = 0;

        while (offset < trackEnd) {
            // Read Delta Time
            let delta = 0;
            let byte = 0;
            do {
                if (offset >= trackEnd) break;
                byte = data[offset++];
                delta = (delta << 7) | (byte & 0x7f);
            } while (byte & 0x80);

            currentTick += delta;

            if (offset >= trackEnd) break;

            // Read Event
            let eventType = data[offset];

            if ((eventType & 0x80)) {
                status = eventType;
                offset++;
            } else {
                // Running status
            }

            // Handle Events
            if (status === 0xFF) {
                // Meta Event
                const metaType = data[offset++];
                // Read Length (Variable)
                let len = 0;
                let lByte = 0;
                do {
                    lByte = data[offset++];
                    len = (len << 7) | (lByte & 0x7f);
                } while (lByte & 0x80);

                if (metaType === 0x51) {
                    // Set Tempo
                    const mpb = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
                    tempoMap.push({ tick: currentTick, microsecondsPerBeat: mpb });
                } else if (metaType === 0x01 || metaType === 0x05 || metaType === 0x06) {
                    // 01: Text, 05: Lyric, 06: Marker
                    const textBytes = data.slice(offset, offset + len);
                    const decoded = decodeThai(textBytes);

                    // Filter empty or whitespace
                    if (decoded.trim().length > 0) {
                        const lower = decoded.toLowerCase();

                        // Debug Log
                        // console.log(`[TextScan] Type: ${metaType.toString(16)} | Text: "${decoded}"`);

                        // Junk Filters (Copyright, GENG, etc)
                        // NCN files spam these.
                        const isJunk = lower.includes("copyright") ||
                            lower.includes("sequenced") ||
                            lower.includes("geng") ||
                            lower.includes("roland") ||
                            lower.includes("yamaha") ||
                            lower.includes("karaoke"); // Often "Thai Karaoke"

                        if (!isJunk) {
                            lyricsRaw.push({
                                tick: currentTick,
                                text: decoded,
                                type: metaType === 0x05 ? 'lyric' : (metaType === 0x06 ? 'marker' : 'text')
                            });
                        } else {
                            console.log(`🗑️ Filtered Junk: "${decoded}"`);
                        }
                    }
                }

                offset += len;
            } else if ((status & 0xF0) === 0xF0) {
                // Sysex (Skip)
                let len = 0;
                let lByte = 0;
                do {
                    lByte = data[offset++];
                    len = (len << 7) | (lByte & 0x7f);
                } while (lByte & 0x80);
                offset += len;
            } else {
                // Channel Event
                const cmd = status & 0xF0;
                if (cmd === 0xC0 || cmd === 0xD0) {
                    offset += 1;
                } else {
                    offset += 2;
                }
            }
        }
        offset = trackEnd;
    }

    // 3. Sort Events by Tick
    tempoMap.sort((a, b) => a.tick - b.tick);
    lyricsRaw.sort((a, b) => a.tick - b.tick);

    // Prioritization Removed. We accept all Lyrics/Text that passed the Junk Filter.

    // 4. Convert Ticks to Seconds using Tempo Map
    const lyrics: LyricEvent[] = [];

    // Helper to get time at tick
    let currentTempo = 500000; // Default 120 BPM
    let lastTempoTick = 0;
    let lastTempoTime = 0;
    let tempoIndex = 0;

    const tickToSeconds = (tick: number) => {
        while (tempoIndex < tempoMap.length && tempoMap[tempoIndex].tick <= tick) {
            const nextTempo = tempoMap[tempoIndex];
            const ticksSinceLast = nextTempo.tick - lastTempoTick;
            const timeSinceLast = ticksSinceLast * (currentTempo / 1000000.0) / timeDivision;

            lastTempoTime += timeSinceLast;
            lastTempoTick = nextTempo.tick;
            currentTempo = nextTempo.microsecondsPerBeat;
            tempoIndex++;
        }

        const ticksRem = tick - lastTempoTick;
        const timeRem = ticksRem * (currentTempo / 1000000.0) / timeDivision;
        return lastTempoTime + timeRem;
    };

    // Note: This linear scan is efficient because filteredLyrics is sorted by tick
    for (const raw of lyricsRaw) {
        const seconds = tickToSeconds(raw.tick);
        lyrics.push({
            time: seconds,
            tick: raw.tick,
            text: raw.text,
            type: raw.type
        });
    }

    return lyrics;
};
