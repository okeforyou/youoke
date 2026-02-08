import { useEffect, useState, useCallback } from 'react';

const PRESENCE_CHANNEL = 'youoke_presence';
const HEARTBEAT_INTERVAL = 3000;
const TIMEOUT_GRACE = 5000;

export const useDjPresence = (isDjPage: boolean = false) => {
    const [isDjConnected, setDjConnected] = useState(false);
    const [lastHeartbeat, setLastHeartbeat] = useState<number>(0);
    const [remoteMode, setRemoteMode] = useState<'mirror' | 'dj' | null>(null);

    // Sender Logic (DJ Page)
    useEffect(() => {
        if (!isDjPage) return;
        // ... (keep connect logic same)
        // but Sender side Logic in useDjPresence itself is actually usually just for main screen?
        // Wait, useDjPresence is used by both?
        // Actually if isDjPage=true, it SENDS heartbeats.
        // But we modified dual.tsx to send heartbeats manually.
        // So dual.tsx might NOT be using useDjPresence for sending?
    }, [isDjPage]);

    // Receiver Logic (Main Controller)
    useEffect(() => {
        if (isDjPage) return; // DJ page doesn't need to listen to itself

        const bc = new BroadcastChannel(PRESENCE_CHANNEL);

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'HEARTBEAT') {
                setLastHeartbeat(Date.now());
                setDjConnected(true);
                if (event.data.mode) {
                    setRemoteMode(event.data.mode);
                }
            }
        };

        bc.onmessage = handleMessage;

        // Check for timeout
        const checkInterval = setInterval(() => {
            if (Date.now() - lastHeartbeat > TIMEOUT_GRACE && lastHeartbeat > 0) {
                if (Date.now() - lastHeartbeat > TIMEOUT_GRACE) {
                    setDjConnected(false);
                    setRemoteMode(null);
                }
            }
        }, 1000);

        return () => {
            bc.close();
            clearInterval(checkInterval);
        };
    }, [isDjPage, lastHeartbeat]);

    return { isDjConnected, remoteMode };
};
