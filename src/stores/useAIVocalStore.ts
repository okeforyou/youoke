import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AIVocalJob {
    status: 'idle' | 'processing' | 'ready' | 'error';
    progress: number;
    message: string;
    mode?: 'basic' | 'pro';
}

interface AIVocalState {
    isActive: boolean; // Is the currently playing song using AI Vocal?
    currentVideoId: string | null;
    defaultMode: 'basic' | 'pro';
    
    // Background jobs
    jobs: Record<string, AIVocalJob>;
    
    // Mixing states
    volumes: { vocals: number, instrumental: number, drums: number, bass: number, other: number };
    trackStates: {
        vocals: { muted: boolean, solo: boolean },
        instrumental: { muted: boolean, solo: boolean },
        drums: { muted: boolean, solo: boolean },
        bass: { muted: boolean, solo: boolean },
        other: { muted: boolean, solo: boolean }
    };

    // Actions
    setIsActive: (active: boolean) => void;
    setVolume: (type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other', val: number) => void;
    toggleMute: (type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other') => void;
    toggleSolo: (type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other') => void;
    
    // API Actions
    processAudio: (videoId: string, mode?: 'basic' | 'pro') => Promise<void>;
    reset: () => void;
    setCurrentVideoId: (id: string | null) => void;
    setDefaultMode: (mode: 'basic' | 'pro') => void;
}

export const useAIVocalStore = create<AIVocalState>()(
    persist(
        (set, get) => ({
    isActive: false,
    currentVideoId: null,
    defaultMode: 'basic',
    jobs: {},

    volumes: { vocals: 100, instrumental: 100, drums: 100, bass: 100, other: 100 },
    trackStates: {
        vocals: { muted: false, solo: false },
        instrumental: { muted: false, solo: false },
        drums: { muted: false, solo: false },
        bass: { muted: false, solo: false },
        other: { muted: false, solo: false }
    },

    setIsActive: (active) => set({ isActive: active }),
    setCurrentVideoId: (id) => set({ currentVideoId: id }),

    setVolume: (type, val) => set((state) => ({
        volumes: { ...state.volumes, [type]: val }
    })),

    toggleMute: (type) => set((state) => ({
        trackStates: {
            ...state.trackStates,
            [type]: { ...state.trackStates[type], muted: !state.trackStates[type].muted }
        }
    })),

    toggleSolo: (type) => set((state) => {
        const newSolo = !state.trackStates[type].solo;
        return {
            trackStates: {
                vocals: { ...state.trackStates.vocals, solo: type === 'vocals' ? newSolo : false },
                instrumental: { ...state.trackStates.instrumental, solo: type === 'instrumental' ? newSolo : false },
                drums: { ...state.trackStates.drums, solo: type === 'drums' ? newSolo : false },
                bass: { ...state.trackStates.bass, solo: type === 'bass' ? newSolo : false },
                other: { ...state.trackStates.other, solo: type === 'other' ? newSolo : false }
            }
        };
    }),

    reset: () => set({
        isActive: false,
        currentVideoId: null,
        // We don't reset jobs here so background tasks can continue
        volumes: { vocals: 100, instrumental: 100, drums: 100, bass: 100, other: 100 },
        trackStates: {
            vocals: { muted: false, solo: false },
            instrumental: { muted: false, solo: false },
            drums: { muted: false, solo: false },
            bass: { muted: false, solo: false },
            other: { muted: false, solo: false }
        }
    }),

    processAudio: async (videoId: string, mode?: 'basic' | 'pro') => {
        const { jobs, defaultMode } = get();
        const targetMode = mode || defaultMode;
        const currentJob = jobs[videoId];
        
        // Prevent duplicate calls if already processing
        if (currentJob?.status === 'processing') {
            return;
        }
        // Prevent if already ready in the SAME mode
        if (currentJob?.status === 'ready' && currentJob?.mode === targetMode) {
            return;
        }

        // Init job
        set((state) => ({
            jobs: {
                ...state.jobs,
                [videoId]: { status: 'processing', progress: 0, message: 'กำลังเตรียมการ...', mode: targetMode }
            }
        }));
        
        let isPolling = true;

        const pollProgress = async () => {
            while (isPolling) {
                try {
                    const res = await fetch(`http://127.0.0.1:5050/progress/${videoId}`);
                    if (res.ok) {
                        const data = await res.json();
                        set((state) => ({
                            jobs: {
                                ...state.jobs,
                                [videoId]: { ...state.jobs[videoId], message: data.message, progress: data.percent || 0, mode: data.mode || state.jobs[videoId]?.mode }
                            }
                        }));
                    }
                } catch (e) {
                    console.warn("Polling error:", e);
                }
                await new Promise(r => setTimeout(r, 1000));
            }
        };

        // Start polling in background
        pollProgress();

        try {
            const res = await fetch("http://127.0.0.1:5050/separate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ video_id: videoId, mode: targetMode })
            });
            
            isPolling = false;
            const data = await res.json();
            
            if (res.ok && (data.status === "success" || data.status === "cached" || data.status === "already_exists")) {
                set((state) => ({
                    jobs: {
                        ...state.jobs,
                        [videoId]: { ...state.jobs[videoId], status: 'ready', message: 'พร้อมเล่น!', progress: 100, mode: data.mode || targetMode }
                    }
                }));
            } else {
                set((state) => ({
                    jobs: {
                        ...state.jobs,
                        [videoId]: { ...state.jobs[videoId], status: 'error', message: data.detail || data.message || 'เกิดข้อผิดพลาดในการแยกเสียง' }
                    }
                }));
            }
        } catch (e) {
            isPolling = false;
            set((state) => ({
                jobs: {
                    ...state.jobs,
                    [videoId]: { ...state.jobs[videoId], status: 'error', message: 'เชื่อมต่อ YouOke Plugin ไม่สำเร็จ' }
                }
            }));
        }
    }
}),
    {
        name: 'ai-vocal-storage',
        partialize: (state) => ({ jobs: state.jobs, defaultMode: state.defaultMode }), // Persist jobs and user's default mode preference
    }
));
