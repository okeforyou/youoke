import { create } from 'zustand';

export interface LyricLine {
    time: number;
    text: string;
}

interface LyricsState {
    isEnabled: boolean;
    isKaraokeMode: boolean;
    isLoading: boolean;
    lyrics: LyricLine[];
    lyricsType: 'synced' | 'plain' | null;
    source: 'lrclib' | 'youtube' | null;
    preferredSource: 'auto' | 'youtube';
    error: string | null;
    
    syncOffset: number;
    activeLineText: string;
    
    toggleLyrics: () => void;
    toggleKaraokeMode: () => void;
    setLyricsEnabled: (enabled: boolean) => void;
    setPreferredSource: (src: 'auto' | 'youtube') => void;
    setSyncOffset: (offset: number) => void;
    setActiveLineText: (text: string) => void;
    fetchLyrics: (videoId: string, title: string, prefer?: 'auto' | 'youtube', duration?: number) => Promise<void>;
    clearLyrics: () => void;
}

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
    
    toggleLyrics: () => set((state) => ({ isEnabled: !state.isEnabled })),
    toggleKaraokeMode: () => set((state) => ({ isKaraokeMode: !state.isKaraokeMode })),
    setLyricsEnabled: (enabled) => set({ isEnabled: enabled }),
    setPreferredSource: (src) => set({ preferredSource: src }),
    setSyncOffset: (offset) => set({ syncOffset: offset }),
    setActiveLineText: (text) => set({ activeLineText: text }),

    clearLyrics: () => set({ lyrics: [], source: null, error: null, lyricsType: null, isLoading: false, syncOffset: 0, activeLineText: '' }),

    fetchLyrics: async (videoId: string, title: string, prefer?: 'auto' | 'youtube', duration?: number) => {
        set({ isLoading: true, error: null, lyrics: [], source: null, lyricsType: null });
        try {
            const pref = prefer || get().preferredSource;
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

            // 2. Decision Tree (Online Synced > Online Plain > YouTube)
            if (onlineData?.type === 'synced') {
                set({ 
                    lyrics: normalizeLyrics(onlineData.lyrics), 
                    source: onlineData.source, 
                    lyricsType: 'synced',
                    isLoading: false
                });
            } else if (onlineData?.type === 'plain') {
                set({ 
                    lyrics: onlineData.lyrics,
                    source: onlineData.source, 
                    lyricsType: 'plain',
                    isLoading: false
                });
            } else if (onlineData?.source === 'youtube') {
                set({ 
                    lyrics: normalizeLyrics(onlineData.lyrics), 
                    source: 'youtube', 
                    lyricsType: 'synced',
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
