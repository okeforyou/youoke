import { create } from 'zustand';

export interface LyricWord {
    word: string;
    start: number;
    end: number;
}

export interface LyricLine {
    time: number;
    text: string;
    words?: LyricWord[];
}

interface LyricsState {
    isEnabled: boolean;
    isKaraokeMode: boolean;
    isLoading: boolean;
    lyrics: LyricLine[];
    lyricsType: 'synced' | 'plain' | null;
    source: 'lrclib' | 'youtube' | null;
    preferredSource: 'auto' | 'youtube' | 'local';
    error: string | null;
    isGeneratingAI: boolean;
    
    syncOffset: number;
    
    toggleLyrics: () => void;
    toggleKaraokeMode: () => void;
    setLyricsEnabled: (enabled: boolean) => void;
    setPreferredSource: (src: 'auto' | 'youtube' | 'local') => void;
    setSyncOffset: (offset: number) => void;
    fetchLyrics: (videoId: string, title: string, prefer?: 'auto' | 'youtube' | 'local') => Promise<void>;
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

        if (line.words && line.words.length > 0) {
            // Chunk based on actual words from AI
            let currentLineText = "";
            let currentLineWords: LyricWord[] = [];
            
            for (const w of line.words) {
                if ((currentLineText + w.word).length > maxLength) {
                    if (currentLineWords.length > 0) {
                        result.push({
                            time: currentLineWords[0].start,
                            text: currentLineText.trim(),
                            words: currentLineWords
                        });
                        currentLineText = w.word + " ";
                        currentLineWords = [w];
                    } else {
                        // single word is larger than max len
                        result.push({ time: w.start, text: w.word, words: [w] });
                        currentLineText = "";
                        currentLineWords = [];
                    }
                } else {
                    currentLineText += w.word + " ";
                    currentLineWords.push(w);
                }
            }
            if (currentLineWords.length > 0) {
                result.push({
                    time: currentLineWords[0].start,
                    text: currentLineText.trim(),
                    words: currentLineWords
                });
            }
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
    isLoading: false, isGeneratingAI: false,
    isGeneratingAI: false,
    lyrics: [],
    source: null,
    preferredSource: 'auto',
    error: null,
    syncOffset: 0,
    
    toggleLyrics: () => set((state) => ({ isEnabled: !state.isEnabled })),
    toggleKaraokeMode: () => set((state) => ({ isKaraokeMode: !state.isKaraokeMode })),
    setLyricsEnabled: (enabled) => set({ isEnabled: enabled }),
    setPreferredSource: (src) => set({ preferredSource: src }),
    setSyncOffset: (offset) => set({ syncOffset: offset }),

    clearLyrics: () => set({ lyrics: [], source: null, error: null, lyricsType: null, isLoading: false, isGeneratingAI: false, isGeneratingAI: false, syncOffset: 0 }),

    alignPlainLyricsWithDeepgram: (plainLines: string[], words: any[]) => {
        // Simple Alignment Algorithm
        // 1. Join deepgram words to find indices
        let deepgramStr = "";
        
        for (const w of words) {
            const cleanWord = w.word.replace(/\s+/g, '');
            deepgramStr += cleanWord;
        }

        // 2. Map plain lines
        const newLyrics: LyricLine[] = [];

        for (const line of plainLines) {
            const cleanLine = line.replace(/\s+/g, '');
            if (cleanLine.length === 0) continue;

            let matchedWords = [];
            let currentLineLength = 0;
            let startTime = -1;
            
            // Just take words until we cover the character length
            for (let i = 0; i < words.length; i++) {
                if (words[i].used) continue;
                
                if (startTime === -1) startTime = words[i].start;
                matchedWords.push(words[i]);
                currentLineLength += words[i].word.replace(/\s+/g, '').length;
                words[i].used = true;

                if (currentLineLength >= cleanLine.length * 0.7) {
                    break;
                }
            }

            if (matchedWords.length > 0) {
                newLyrics.push({
                    time: startTime,
                    text: line,
                    words: matchedWords
                });
            } else {
                // If we ran out of words, just use the last time or 0
                const lastTime = newLyrics.length > 0 ? newLyrics[newLyrics.length - 1].time + 2 : 0;
                newLyrics.push({ time: lastTime, text: line });
            }
        }

        return newLyrics;
    },

    fetchLyrics: async (videoId: string, title: string, prefer?: 'auto' | 'youtube' | 'local', duration?: number) => {
        set({ isLoading: true, error: null, lyrics: [], source: null, lyricsType: null, isGeneratingAI: false });
        try {
            const pref = prefer || get().preferredSource;

            // 1. Fetch Online APIs (LRCLIB / YouTube)
            let onlineData: any = null;
            if (pref !== 'local') {
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
            }

            // 2. Fetch Local AI
            let localData: any = null;
            let localDataType: 'edited' | 'ai' | null = null;
            
            // Check localStorage for browser-generated AI lyrics
            if (typeof window !== 'undefined') {
                const cachedAi = localStorage.getItem(`ai_lyrics_${videoId}`);
                if (cachedAi) {
                    try {
                        localData = { words: JSON.parse(cachedAi) };
                        // Treat browser cache as 'edited' so it gets highest priority and isn't overwritten by online plain text
                        localDataType = 'edited';
                    } catch(e) {}
                }
            }

            if (!localData && pref !== 'youtube') {
                try {
                    const { getActiveBridgeBaseUrl } = await import('../../../stores/useAIVocalStore');
                    const baseUrl = await getActiveBridgeBaseUrl();
                    if (baseUrl) {
                        // Try lyrics.json first (user edited in Creator)
                        let localRes = await fetch(`${baseUrl}/files/${videoId}/lyrics.json?t=${Date.now()}`, { cache: 'no-store' });
                        if (localRes.ok) {
                            localData = await localRes.json();
                            localDataType = 'edited';
                        } else {
                            // Fallback to lyrics_timeline.json (raw AI generation)
                            localRes = await fetch(`${baseUrl}/files/${videoId}/lyrics_timeline.json?t=${Date.now()}`, { cache: 'no-store' });
                            if (localRes.ok) {
                                localData = await localRes.json();
                                localDataType = 'ai';
                            }
                        }
                    }
                } catch (e) {
                    console.log('Local AI bridge offline or file not found.');
                }
            }

            // Fallback mapper for deepgram words -> lines
            const mapDeepgramToLines = (words: any[]) => {
                const mappedLyrics: LyricLine[] = [];
                let currentLineText = "";
                let currentLineTime = -1;
                let currentLineWords: LyricWord[] = [];
                let lastWordEnd = -1;

                for (const w of words) {
                    if (currentLineTime === -1) {
                        currentLineTime = w.start;
                    }
                    if (lastWordEnd !== -1 && (w.start - lastWordEnd > 0.4 || currentLineText.length > 40)) {
                        mappedLyrics.push({ time: currentLineTime, text: currentLineText.trim(), words: currentLineWords });
                        currentLineText = "";
                        currentLineTime = w.start;
                        currentLineWords = [];
                    }
                    currentLineText += w.word + " ";
                    currentLineWords.push({ word: w.word, start: w.start, end: w.end });
                    lastWordEnd = w.end;
                }
                if (currentLineText.trim() !== "") {
                    mappedLyrics.push({ time: currentLineTime, text: currentLineText.trim(), words: currentLineWords });
                }
                return mappedLyrics;
            };

            // 3. Decision Tree
            if (localData?.words?.length > 0 && localDataType === 'edited') {
                // User explicitly edited in Creator - HIGHEST PRIORITY
                const mappedLyrics = mapDeepgramToLines(localData.words);
                set({
                    lyrics: normalizeLyrics(mappedLyrics),
                    source: 'lrclib', // Trick UI
                    lyricsType: 'synced',
                    isLoading: false, isGeneratingAI: false
                });
            } else if (localData?.words?.length > 0 && localDataType === 'ai' && onlineData?.type === 'plain') {
                // ALIGNMENT: LRCLIB Plain + Deepgram Time
                const plainLines = onlineData.lyrics.map((l: any) => l.text);
                const alignedLyrics = (get() as any).alignPlainLyricsWithDeepgram(plainLines, localData.words);
                set({
                    lyrics: normalizeLyrics(alignedLyrics),
                    source: 'lrclib', // Treat as lrclib synced
                    lyricsType: 'synced',
                    isLoading: false, isGeneratingAI: false
                });
            } else if (localData?.words?.length > 0 && localDataType === 'ai') {
                // Local AI Only (Overrides LRCLIB synced because AI is usually more accurate for Thai MVs)
                const mappedLyrics = mapDeepgramToLines(localData.words);
                set({
                    lyrics: normalizeLyrics(mappedLyrics),
                    source: 'lrclib', // Trick UI
                    lyricsType: 'synced',
                    isLoading: false, isGeneratingAI: false
                });
            } else if (onlineData?.type === 'synced') {
                set({ 
                    lyrics: normalizeLyrics(onlineData.lyrics), 
                    source: onlineData.source, 
                    lyricsType: 'synced',
                    isLoading: false, isGeneratingAI: false 
                });
            } else if (onlineData?.type === 'plain') {
                // Plain Lyrics Only
                set({ 
                    lyrics: onlineData.lyrics, 
                    source: onlineData.source, 
                    lyricsType: 'plain',
                    isLoading: false, isGeneratingAI: false 
                });
            } else if (onlineData?.source === 'youtube') {
                // YouTube Transcript
                set({ 
                    lyrics: normalizeLyrics(onlineData.lyrics), 
                    source: 'youtube', 
                    lyricsType: 'synced',
                    isLoading: false, isGeneratingAI: false 
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

            // Fetch vocals audio from local bridge
            const audioRes = await fetch(`${baseUrl}/files/${videoId}/vocals.m4a`);
            if (!audioRes.ok) {
                throw new Error("ไม่พบไฟล์เสียงร้อง (vocals.m4a) กรุณาแยกเสียงเพลงนี้ก่อนให้ AI แกะเนื้อเพลง");
            }
            const audioBlob = await audioRes.blob();

            // Call Deepgram directly from browser
            const dgRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=th&smart_format=true', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${deepgramKey}`,
                    'Content-Type': 'audio/m4a'
                },
                body: audioBlob
            });

            if (!dgRes.ok) {
                const errData = await dgRes.json().catch(() => ({}));
                throw new Error(errData.err_msg || "เกิดข้อผิดพลาดในการเชื่อมต่อ Deepgram API");
            }

            const dgData = await dgRes.json();
            const words = dgData.results?.channels[0]?.alternatives[0]?.words || [];

            if (words.length === 0) {
                throw new Error("AI ไม่สามารถแกะเนื้อเพลงจากไฟล์เสียงร้องได้");
            }

            // Cache locally so we don't need to re-transcribe
            if (typeof window !== 'undefined') {
                localStorage.setItem(`ai_lyrics_${videoId}`, JSON.stringify(words));
            }

            // Once generated, re-fetch normally
            await get().fetchLyrics(videoId, '', 'auto');
            
        } catch (e: any) {
            set({ error: e.message || 'เกิดข้อผิดพลาด', isGeneratingAI: false });
        }
    }
}));
