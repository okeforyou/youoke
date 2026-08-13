import { create } from 'zustand';
import { useWikiLyricsStore } from './useWikiLyricsStore';
import { groupDeepgramWordsIntoLines } from '../../lyrics/engines/deepgramAlignEngine';

export interface LyricLine {
    time: number;
    text: string;
    endTime?: number;
    words?: any[];
}

interface LyricsState {
    isEnabled: boolean;
    isKaraokeMode: boolean;
    isLoading: boolean;
    lyrics: LyricLine[];
    lyricsType: 'synced' | 'plain' | null;
    source: 'lrclib' | 'youtube' | 'deepgram' | null;
    preferredSource: 'auto' | 'youtube' | 'deepgram';
    error: string | null;
    
    syncOffset: number;
    activeLineText: string;
    lyricsLayout: 'scroll' | 'karaoke';
    
    toggleLyrics: () => void;
    toggleKaraokeMode: () => void;
    setLyricsEnabled: (enabled: boolean) => void;
    setPreferredSource: (src: 'auto' | 'youtube' | 'deepgram') => void;
    setSyncOffset: (offset: number) => void;
    nudgeOffset: (delta: number) => void;
    updateLineTime: (index: number, newTime: number) => void;
    markLineTimestamp: (currentPlaybackTime: number, lineIndex: number) => void;
    setActiveLineText: (text: string) => void;
    setLyricsLayout: (layout: 'scroll' | 'karaoke') => void;
    fetchLyrics: (videoId: string, title: string, prefer?: 'auto' | 'youtube' | 'deepgram', duration?: number) => Promise<void>;
    clearLyrics: () => void;
}

const parseLRC = (lrc: string): LyricLine[] => {
    const lines = lrc.split('\n');
    const result: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2}\.\d{2,3})\]/;
    
    for (const line of lines) {
        const match = timeRegex.exec(line);
        if (match) {
            const min = parseInt(match[1], 10);
            const sec = parseFloat(match[2]);
            const text = line.replace(timeRegex, '').trim();
            if (text) {
                result.push({
                    time: min * 60 + sec,
                    text
                });
            }
        }
    }
    return result;
};

const normalizeLyrics = (lyrics: LyricLine[], maxLength = 40): LyricLine[] => {
    if (!lyrics || lyrics.length === 0) return [];
    
    const result: LyricLine[] = [];
    
    const chunkText = (text: string, maxLen: number) => {
        if (text.length <= maxLen) return [text];
        
        // Try Intl.Segmenter for native Thai word breaking
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            try {
                const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
                const segments = Array.from(segmenter.segment(text));
                const chunks: string[] = [];
                let currentChunk = "";
                for (const { segment } of segments) {
                    if (currentChunk.length + segment.length > maxLen) {
                        if (currentChunk.length > 0) {
                            chunks.push(currentChunk.trim());
                            currentChunk = segment;
                        } else {
                            chunks.push(segment.trim());
                            currentChunk = "";
                        }
                    } else {
                        currentChunk += segment;
                    }
                }
                if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
                return chunks;
            } catch (e) {
                // Fallback if Intl.Segmenter fails
            }
        }
        
        // Fallback split by space if possible
        const words = text.split(' ');
        if (words.length > 1) {
            const chunks: string[] = [];
            let currentChunk = "";
            for (const word of words) {
                if ((currentChunk + " " + word).length > maxLen) {
                    if (currentChunk.length > 0) {
                        chunks.push(currentChunk.trim());
                        currentChunk = word;
                    } else {
                        chunks.push(word);
                        currentChunk = "";
                    }
                } else {
                    currentChunk += (currentChunk.length > 0 ? " " : "") + word;
                }
            }
            if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
            return chunks;
        }

        // Hard fallback: split exactly at maxLen
        const chunks: string[] = [];
        let remaining = text;
        while(remaining.length > 0) {
            chunks.push(remaining.substring(0, maxLen));
            remaining = remaining.substring(maxLen);
        }
        return chunks;
    };

    for (let i = 0; i < lyrics.length; i++) {
        const line = lyrics[i];
        
        if (!line.text || line.text.length <= maxLength) {
            result.push(line);
            continue;
        }

        const chunks = chunkText(line.text, maxLength);
        if (chunks.length === 1) {
            result.push({ time: line.time, text: chunks[0] });
            continue;
        }

        // Calculate time distribution
        const nextTime = i < lyrics.length - 1 ? lyrics[i + 1].time : line.time + (line.text.length * 0.15); // Assume 150ms per char if last line
        const totalDuration = nextTime - line.time;
        const totalChars = line.text.length;
        
        let currentTime = line.time;
        for (const chunk of chunks) {
            result.push({ time: currentTime, text: chunk });
            // Add proportional time based on character count of this chunk
            const chunkDuration = (chunk.length / totalChars) * totalDuration;
            currentTime += chunkDuration;
        }
    }
    
    return result;
}

export const useLyricsStore = create<LyricsState>((set, get) => ({
    isEnabled: true,
    isKaraokeMode: true,
    isLoading: false,
    lyrics: [],
    source: null,
    lyricsType: null,
    preferredSource: 'auto',
    error: null,
    syncOffset: 0,
    activeLineText: '',
    lyricsLayout: 'karaoke',
    
    toggleLyrics: () => set((state) => ({ isEnabled: !state.isEnabled })),
    toggleKaraokeMode: () => set((state) => ({ isKaraokeMode: !state.isKaraokeMode })),
    setLyricsEnabled: (enabled) => set({ isEnabled: enabled }),
    setPreferredSource: (src) => set({ preferredSource: src }),
    setSyncOffset: (offset) => set({ syncOffset: offset }),
    nudgeOffset: (delta) => set((state) => ({ syncOffset: Math.round((state.syncOffset + delta) * 10) / 10 })),
    updateLineTime: (index, newTime) => set((state) => {
        const newLyrics = [...state.lyrics];
        if (newLyrics[index]) {
            newLyrics[index] = { ...newLyrics[index], time: Math.max(0, newTime) };
        }
        return { lyrics: newLyrics };
    }),
    markLineTimestamp: (currentPlaybackTime, lineIndex) => set((state) => {
        const newLyrics = [...state.lyrics];
        if (newLyrics[lineIndex]) {
            newLyrics[lineIndex] = { ...newLyrics[lineIndex], time: Math.max(0, currentPlaybackTime - state.syncOffset) };
        }
        return { lyrics: newLyrics };
    }),
    setActiveLineText: (text) => set({ activeLineText: text }),
    setLyricsLayout: (layout) => set({ lyricsLayout: layout }),

    clearLyrics: () => set({ lyrics: [], source: null, error: null, lyricsType: null, isLoading: false, syncOffset: 0, activeLineText: '', lyricsLayout: 'karaoke' }),

    fetchLyrics: async (videoId: string, title: string, prefer?: 'auto' | 'youtube' | 'deepgram', duration?: number) => {
        set({ isLoading: true, error: null, lyrics: [], source: null, lyricsType: null, syncOffset: 0, lyricsLayout: 'karaoke' });
        try {
            const pref = prefer || get().preferredSource;

            if (pref === 'deepgram') {
                try {
                    let deepgramWords = [];
                    const cached = localStorage.getItem(`ai_lyrics_${videoId}`);
                    if (cached) {
                        deepgramWords = JSON.parse(cached);
                    } else {
                        const { deepgramKey } = (await import('../../../stores/useAIVocalStore')).useAIVocalStore.getState();
                        if (!deepgramKey) {
                            throw new Error("ยังไม่ได้ตั้งค่า Deepgram API Key กรุณาตั้งค่าในหน้า AI Settings");
                        }
                        const baseUrl = await (await import('../../../stores/useAIVocalStore')).getActiveBridgeBaseUrl();
                        if (!baseUrl) {
                            throw new Error("Local Bridge ออฟไลน์ หรือยังไม่ได้เปิดโปรแกรม");
                        }
                        
                        const res = await fetch(`${baseUrl}/transcribe`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ video_id: videoId, api_key: deepgramKey, provider: 'deepgram' })
                        });
                        
                        if (!res.ok) {
                            const errData = await res.json().catch(() => ({}));
                            throw new Error(errData.detail || `Local Bridge /transcribe Error (${res.status})`);
                        }
                        const dgData = await res.json();
                        deepgramWords = dgData.words || [];
                        if (deepgramWords.length === 0) {
                            throw new Error("AI ไม่สามารถแกะเนื้อเพลงจากไฟล์เสียงร้องได้");
                        }
                        localStorage.setItem(`ai_lyrics_${videoId}`, JSON.stringify(deepgramWords));
                    }
                    
                    const groupedLines = groupDeepgramWordsIntoLines(deepgramWords);
                    set({
                        lyrics: groupedLines,
                        source: 'deepgram',
                        lyricsType: 'synced',
                        isLoading: false
                    });
                    return;
                } catch (e: any) {
                    set({ error: e.message || 'เกิดข้อผิดพลาดในการถอดเสียงร้องของ AI', isLoading: false });
                    return;
                }
            }

            // 0. Check Wiki / Crowdsourced Sync first
            try {
                const wikiStore = useWikiLyricsStore.getState();
                const bestSync = await wikiStore.fetchBestSync(videoId);
                if (bestSync?.lrcContent) {
                    const parsedLyrics = parseLRC(bestSync.lrcContent);
                    if (parsedLyrics.length > 0) {
                        set({
                            lyrics: normalizeLyrics(parsedLyrics),
                            source: 'lrclib', // UI still thinks it's lrclib style, but we apply our offset
                            lyricsType: 'synced',
                            syncOffset: bestSync.globalOffset || 0,
                            isLoading: false
                        });
                        return; // Exit early if we have a valid wiki sync!
                    }
                }
            } catch (wikiErr) {
                console.warn("Failed to fetch Wiki Lyrics", wikiErr);
            }

            let onlineData: any = null;

            // 1. Fetch from our API route (handles LRCLIB + YouTube CC)
            if (pref !== 'youtube') {
                try {
                    const res = await fetch(`/api/lyrics?videoId=${encodeURIComponent(videoId)}&title=${encodeURIComponent(title)}${duration ? '&duration=' + duration : ''}`);
                    if (res.ok) {
                        onlineData = await res.json();
                    }
                } catch (e) {
                    console.warn("Failed to fetch online lyrics", e);
                }
            } else {
                // If youtube preferred
                try {
                    const res = await fetch(`/api/lyrics?videoId=${encodeURIComponent(videoId)}&title=${encodeURIComponent(title)}&forceSource=youtube`);
                    if (res.ok) onlineData = await res.json();
                } catch(e) {}
            }

            // Get local offset fallback if any
            const localOffset = useWikiLyricsStore.getState().getLocalOffset(videoId);

            // 2. Decision Tree (Online Synced > Online Plain > YouTube)
            if (onlineData?.type === 'synced') {
                set({ 
                    lyrics: normalizeLyrics(onlineData.lyrics), 
                    source: onlineData.source, 
                    lyricsType: 'synced',
                    syncOffset: localOffset,
                    isLoading: false
                });
            } else if (onlineData?.type === 'plain') {
                set({ 
                    lyrics: onlineData.lyrics,
                    source: onlineData.source, 
                    lyricsType: 'plain',
                    syncOffset: localOffset,
                    isLoading: false
                });
            } else if (onlineData?.source === 'youtube') {
                set({ 
                    lyrics: normalizeLyrics(onlineData.lyrics), 
                    source: 'youtube', 
                    lyricsType: 'synced',
                    syncOffset: localOffset,
                    isLoading: false
                });
            } else {
                set({ error: 'ไม่พบเนื้อเพลงจากแหล่งใดๆ', isLoading: false });
            }
        } catch (e: any) {
            set({ error: e.message || 'เกิดข้อผิดพลาดในการโหลดเนื้อเพลง', isLoading: false });
        }
    }
}));
