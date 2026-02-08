import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Speaker, Laptop } from 'lucide-react';
import { useDjPresence } from '../../../hooks/useDjPresence';
import { usePlayerStore } from '../stores/usePlayerStore';
import { playerService } from '../services/playerService';

export const AudioOutputSwitcher = () => {
    // Check if DJ Mode is active/connected
    // We assume 'dj' mode if we want to show this. 
    // Or we show it always if there's a connection?
    // Let's rely on useDjPresence.
    const { isDjConnected, remoteMode } = useDjPresence();
    const [outputMode, setOutputMode] = useState<'pc' | 'tv' | 'both'>('both');

    // Broadcast Channel for sending commands
    const channelRef = useRef<BroadcastChannel | null>(null);

    useEffect(() => {
        channelRef.current = new BroadcastChannel('youoke-dual-sync');
        return () => channelRef.current?.close();
    }, []);

    // If not in DJ mode (or Mirror), maybe hide?
    // User requested this for the "Dual Screen" experience.
    if (!isDjConnected) return null;

    const handleSwitch = (mode: 'pc' | 'tv' | 'both') => {
        setOutputMode(mode);
        const channel = channelRef.current;
        const player = playerService.getCurrentPlayer(); // Get YouTube Player instance

        // Logic Table
        // PC: Unmute Local, Mute Remote
        // TV: Mute Local, Unmute Remote
        // Both: Unmute Local, Unmute Remote

        switch (mode) {
            case 'pc':
                // Local
                usePlayerStore.getState().setMuted(false);
                if (player && typeof player.unMute === 'function') player.unMute();

                // Remote
                channel?.postMessage({ type: 'MUTE' });
                break;

            case 'tv':
                // Local
                usePlayerStore.getState().setMuted(true);
                if (player && typeof player.mute === 'function') player.mute();

                // Remote
                channel?.postMessage({ type: 'UNMUTE' });
                break;

            case 'both':
                // Local
                usePlayerStore.getState().setMuted(false);
                if (player && typeof player.unMute === 'function') player.unMute();

                // Remote
                channel?.postMessage({ type: 'UNMUTE' });
                break;
        }
    };

    return (
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg border border-gray-200 backdrop-blur-sm mr-2">
            <button
                onClick={() => handleSwitch('pc')}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold transition-all ${outputMode === 'pc'
                        ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                title="Sound on PC Only"
            >
                <Laptop size={14} />
                <span className="hidden xl:inline">PC</span>
            </button>

            <button
                onClick={() => handleSwitch('both')}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold transition-all ${outputMode === 'both'
                        ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                title="Sound on Both"
            >
                <Speaker size={14} />
                <span className="hidden xl:inline">Both</span>
            </button>

            <button
                onClick={() => handleSwitch('tv')}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold transition-all ${outputMode === 'tv'
                        ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                title="Sound on TV Only"
            >
                <Monitor size={14} />
                <span className="hidden xl:inline">TV</span>
            </button>
        </div>
    );
};
