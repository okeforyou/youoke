import { PlayerStore } from './types';

export const generateUUID = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Broadcast Channel for Cross-Tab Sync (DJ Mode)
// CRITICAL: Disable on receiver pages (/tv, /dual, /monitor) to prevent
// BroadcastChannel interference with Firebase-based sync on those pages.
const isReceiverPage = typeof window !== 'undefined' &&
    /\/(tv|dual|monitor|receiver)/.test(window.location.pathname);

export const bc = (typeof window !== 'undefined' && !isReceiverPage)
    ? new BroadcastChannel('youoke_player_sync')
    : null;

// Helper to broadcast changes
export const broadcast = (state: Partial<PlayerStore>) => {
    bc?.postMessage({ type: 'SYNC', state });
};
