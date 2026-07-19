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
    error: string | null;
    
    toggleLyrics: () => void;
    setLyricsEnabled: (enabled: boolean) => void;
    fetchLyrics: (videoId: string, title: string) => Promise<void>;
    clearLyrics: () => void;
}

export const useLyricsStore = create<LyricsState>((set, get) => ({
    isEnabled: false,
    isLoading: false,
    lyrics: [],
    source: null,
    error: null,

    toggleLyrics: () => set((state) => ({ isEnabled: !state.isEnabled })),
    setLyricsEnabled: (enabled) => set({ isEnabled: enabled }),

    clearLyrics: () => set({ lyrics: [], source: null, error: null, isLoading: false }),

    fetchLyrics: async (videoId: string, title: string) => {
        set({ isLoading: true, error: null, lyrics: [], source: null });
        try {
            const res = await fetch(`/api/lyrics?videoId=${encodeURIComponent(videoId)}&title=${encodeURIComponent(title)}`);
            if (!res.ok) {
                throw new Error('Failed to fetch lyrics');
            }
            const data = await res.json();
            
            if (data.lyrics && data.lyrics.length > 0) {
                set({ 
                    lyrics: data.lyrics, 
                    source: data.source,
                    isLoading: false 
                });
            } else {
                set({ 
                    error: 'ไม่พบเนื้อเพลงสำหรับวิดีโอนี้', 
                    isLoading: false 
                });
            }
        } catch (error: any) {
            set({ error: error.message || 'Error fetching lyrics', isLoading: false });
        }
    }
}));
