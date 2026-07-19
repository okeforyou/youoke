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
    clearLyrics: () => void;
}

export const useLyricsStore = create<LyricsState>((set, get) => ({
    isEnabled: false,
    isLoading: false,
    lyrics: [],
    source: null,
    preferredSource: 'auto',
    syncOffset: 0,
    error: null,

    toggleLyrics: () => set((state) => ({ isEnabled: !state.isEnabled })),
    setLyricsEnabled: (enabled) => set({ isEnabled: enabled }),
    setPreferredSource: (src) => set({ preferredSource: src }),
    setSyncOffset: (offset) => set({ syncOffset: offset }),

    clearLyrics: () => set({ lyrics: [], source: null, error: null, isLoading: false, syncOffset: 0 }),

    fetchLyrics: async (videoId: string, title: string, prefer?: 'auto' | 'youtube') => {
        set({ isLoading: true, error: null, lyrics: [], source: null });
        try {
            const pref = prefer || get().preferredSource;
            const res = await fetch(`/api/lyrics?videoId=${encodeURIComponent(videoId)}&title=${encodeURIComponent(title)}${pref === 'youtube' ? '&forceSource=youtube' : ''}`);
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
