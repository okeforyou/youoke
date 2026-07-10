import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TrackState {
    muted: boolean;
    solo: boolean;
}

interface MixerState {
    volumes: {
        vocals: number;
        instrumental: number;
    };
    trackStates: {
        vocals: TrackState;
        instrumental: TrackState;
    };
    setVolume: (type: 'vocals' | 'instrumental', value: number) => void;
    toggleMute: (type: 'vocals' | 'instrumental') => void;
    toggleSolo: (type: 'vocals' | 'instrumental') => void;
    getEffectiveVolume: (type: 'vocals' | 'instrumental') => number;
}

export const useMixerStore = create<MixerState>()(
    persist(
        (set, get) => ({
            volumes: { vocals: 100, instrumental: 100 },
            trackStates: {
                vocals: { muted: false, solo: false },
                instrumental: { muted: false, solo: false }
            },
            setVolume: (type, value) => {
                const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
                set((state) => ({
                    volumes: { ...state.volumes, [type]: safeValue }
                }));
            },
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
                        instrumental: { ...state.trackStates.instrumental, solo: type === 'instrumental' ? newSolo : false }
                    }
                };
            }),
            getEffectiveVolume: (type) => {
                const state = get();
                const isAnySolo = state.trackStates.vocals.solo || state.trackStates.instrumental.solo;
                if (isAnySolo && !state.trackStates[type].solo) return 0;
                if (state.trackStates[type].muted) return 0;
                return state.volumes[type];
            }
        }),
        {
            name: 'youoke-mixer-storage',
        }
    )
);
