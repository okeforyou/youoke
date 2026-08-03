import { create } from 'zustand';

export interface LyricLine {
    time: number;
    text: string;
}

interface LyricsState {
    isEnabled: boolean;
    isLoading: boolean;
    lyrics: LyricLine[];
    source: 'lrclib' | 'youtube' | null;
    preferredSource: 'auto' | 'youtube';
    error: string | null;
    
    syncOffset: number;
    
    toggleLyrics: () => void;
    setLyricsEnabled: (enabled: boolean) => void;
    setPreferredSource: (src: 'auto' | 'youtube') => void;
    setSyncOffset: (offset: number) => void;
    fetchLyrics: (videoId: string, title: string, prefer?: 'auto' | 'youtube') => Promise<void>;
    generateAILyrics: (videoId: string) => Promise<void>;
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
    isEnabled: false,
    isLoading: false,
    lyrics: [],
    source: null,
    preferredSource: 'auto',
    syncOffset: 0,
    error: null,

    isGeneratingAI: false,

    toggleLyrics: () => set((state) => ({ isEnabled: !state.isEnabled })),
    setLyricsEnabled: (enabled) => set({ isEnabled: enabled }),
    setPreferredSource: (src) => set({ preferredSource: src }),
    setSyncOffset: (offset) => set({ syncOffset: offset }),

    clearLyrics: () => set({ lyrics: [], source: null, error: null, isLoading: false, isGeneratingAI: false, syncOffset: 0 }),

    fetchLyrics: async (videoId: string, title: string, prefer?: 'auto' | 'youtube') => {
        set({ isLoading: true, error: null, lyrics: [], source: null, isGeneratingAI: false });
        try {
            const pref = prefer || get().preferredSource;

            // --- 1. LOCAL AI LYRICS (Highest Priority if preferredSource is auto) ---
            if (pref !== 'youtube') {
                try {
                    const { getActiveBridgeBaseUrl } = await import('../../../stores/useAIVocalStore');
                    const baseUrl = await getActiveBridgeBaseUrl();
                    if (baseUrl) {
                        const localRes = await fetch(`${baseUrl}/files/${videoId}/lyrics_timeline.json?t=${Date.now()}`, { cache: 'no-store' });
                        if (localRes.ok) {
                            const localData = await localRes.json();
                            // The JSON format is { provider: "deepgram", words: [{word, start, end}] }
                            if (localData && Array.isArray(localData.words) && localData.words.length > 0) {
                                // Group words into lines to match the LRC format behavior?
                                // Actually, KaraokeDisplay expects {time, text}. If we send per-word, it might just show a list of words.
                                // Let's combine them into logical lines based on pauses.
                                const mappedLyrics: LyricLine[] = [];
                                let currentLineText = "";
                                let currentLineTime = -1;
                                let lastWordEnd = -1;

                                for (const w of localData.words) {
                                    if (currentLineTime === -1) {
                                        currentLineTime = w.start;
                                    }
                                    
                                    // If pause is more than 0.8 seconds, start a new line
                                    if (lastWordEnd !== -1 && w.start - lastWordEnd > 0.8) {
                                        mappedLyrics.push({ time: currentLineTime, text: currentLineText.trim() });
                                        currentLineText = "";
                                        currentLineTime = w.start;
                                    }
                                    
                                    currentLineText += w.word + " ";
                                    lastWordEnd = w.end;
                                }
                                
                                // Push the last line
                                if (currentLineText.trim() !== "") {
                                    mappedLyrics.push({ time: currentLineTime, text: currentLineText.trim() });
                                }

                                set({
                                    lyrics: normalizeLyrics(mappedLyrics),
                                    source: 'lrclib', // Trick UI to show synced view
                                    isLoading: false,
                                    isGeneratingAI: false
                                });
                                return; // Stop execution, we found local AI lyrics!
                            }
                        }
                    }
                } catch (e) {
                    // Ignore errors and fallback to online lyrics
                    console.log('Local AI lyrics not found or bridge offline, falling back to online APIs.');
                }
            }

            // --- 2. ONLINE APIs (LRCLIB / YouTube) ---
            const res = await fetch(`/api/lyrics?videoId=${encodeURIComponent(videoId)}&title=${encodeURIComponent(title)}${pref === 'youtube' ? '&forceSource=youtube' : ''}`);
            if (!res.ok) {
                throw new Error('Failed to fetch lyrics');
            }
            const data = await res.json();
            
            if (data.lyrics && data.lyrics.length > 0) {
                set({ 
                    lyrics: normalizeLyrics(data.lyrics), 
                    source: data.source, 
                    isLoading: false,
                    isGeneratingAI: false 
                });
            } else {
                set({ error: 'ไม่พบเนื้อเพลงจากแหล่งใดๆ', isLoading: false, isGeneratingAI: false });
            }
        } catch (e: any) {
            set({ error: e.message || 'เกิดข้อผิดพลาดในการโหลดเนื้อเพลง', isLoading: false, isGeneratingAI: false });
        }
    },

    generateAILyrics: async (videoId: string) => {
        set({ isGeneratingAI: true, error: null });
        try {
            const { useAIVocalStore, getActiveBridgeBaseUrl } = await import('../../../stores/useAIVocalStore');
            const baseUrl = await getActiveBridgeBaseUrl();
            const deepgramKey = useAIVocalStore.getState().deepgramKey;
            
            if (!baseUrl) {
                throw new Error("Local Bridge offline");
            }
            if (!deepgramKey) {
                throw new Error("ไม่พบ Deepgram API Key กรุณาตั้งค่าในหน้า Settings");
            }

            const res = await fetch(`${baseUrl}/transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_id: videoId, api_key: deepgramKey, provider: 'deepgram' })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "เกิดข้อผิดพลาดในการแกะเนื้อเพลง");
            }

            // Once generated, re-fetch normally
            await get().fetchLyrics(videoId, '', 'auto');
            
        } catch (e: any) {
            set({ error: e.message || 'เกิดข้อผิดพลาด', isGeneratingAI: false });
        }
    }
}));
