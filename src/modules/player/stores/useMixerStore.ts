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
        drums: number;
        bass: number;
        other: number;
    };
    trackStates: {
        vocals: TrackState;
        instrumental: TrackState;
        drums: TrackState;
        bass: TrackState;
        other: TrackState;
    };
    setVolume: (type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other', value: number) => void;
    toggleMute: (type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other') => void;
    toggleSolo: (type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other') => void;
    getEffectiveVolume: (type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other') => number;
}

export const useMixerStore = create<MixerState>()(
    persist(
        (set, get) => ({
            volumes: { vocals: 100, instrumental: 100, drums: 100, bass: 100, other: 100 },
            trackStates: {
                vocals: { muted: false, solo: false },
                instrumental: { muted: false, solo: false },
                drums: { muted: false, solo: false },
                bass: { muted: false, solo: false },
                other: { muted: false, solo: false }
            },
            setVolume: (type, value) => {
                const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
                set((state) => ({
                    volumes: { ...state.volumes, [type]: safeValue },
                    trackStates: {
                        ...state.trackStates,
                        [type]: {
                            ...state.trackStates?.[type],
                            muted: safeValue === 0 ? true : (state.trackStates?.[type]?.muted && safeValue > 0 ? false : state.trackStates?.[type]?.muted)
                        }
                    }
                }));
            },
            toggleMute: (type) => set((state) => {
                const willBeMuted = !(state.trackStates?.[type]?.muted ?? false);
                const currentVolume = state.volumes[type];
                return {
                    volumes: {
                        ...state.volumes,
                        [type]: (!willBeMuted && currentVolume === 0) ? 100 : currentVolume
                    },
                    trackStates: {
                        ...state.trackStates,
                        [type]: { ...state.trackStates?.[type], muted: willBeMuted }
                    }
                };
            }),
            toggleSolo: (type) => set((state) => {
                const newSolo = !(state.trackStates?.[type]?.solo ?? false);
                return {
                    trackStates: {
                        vocals: { ...state.trackStates?.vocals, solo: type === 'vocals' ? newSolo : false },
                        instrumental: { ...state.trackStates?.instrumental, solo: type === 'instrumental' ? newSolo : false },
                        drums: { ...state.trackStates?.drums, solo: type === 'drums' ? newSolo : false },
                        bass: { ...state.trackStates?.bass, solo: type === 'bass' ? newSolo : false },
                        other: { ...state.trackStates?.other, solo: type === 'other' ? newSolo : false }
                    }
                };
            }),
            getEffectiveVolume: (type) => {
                const state = get();
                const isAnySolo = state.trackStates?.vocals?.solo || state.trackStates?.instrumental?.solo || state.trackStates?.drums?.solo || state.trackStates?.bass?.solo || state.trackStates?.other?.solo;
                if (isAnySolo && !state.trackStates?.[type]?.solo) return 0;
                if (state.trackStates?.[type]?.muted) return 0;
                return state.volumes[type];
            }
        }),
        {
            name: 'youoke-mixer-storage-v2',
            merge: (persistedState: any, currentState: MixerState) => {
                return {
                    ...currentState,
                    ...persistedState,
                    volumes: {
                        ...currentState.volumes,
                        ...(persistedState?.volumes || {})
                    },
                    trackStates: {
                        ...currentState.trackStates,
                        ...(persistedState?.trackStates || {})
                    }
                };
            }
        }
    )
);
