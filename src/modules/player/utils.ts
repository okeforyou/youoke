import { PlayerStore } from './types';

export const generateUUID = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Broadcast Channel for Cross-Tab Sync (DJ Mode)
export const bc = typeof window !== 'undefined' ? new BroadcastChannel('youoke_player_sync') : null;

// Helper to broadcast changes
export const broadcast = (state: Partial<PlayerStore>) => {
    bc?.postMessage({ type: 'SYNC', state });
};
