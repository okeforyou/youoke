import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDb } from '../firebase';
import { ref, onValue, set, remove, onDisconnect } from 'firebase/database';

export type RemoteCommand = {
    type: 'PLAY' | 'PAUSE' | 'NEXT' | 'ADD_QUEUE' | 'SEEK';
    payload?: any;
    timestamp: number;
};

export type HostState = {
    isPlaying: boolean;
    videoId: string;
    title: string;
    currentTime: number;
    duration: number;
};

export const useRemoteHost = (
    playerRef: any,
    addToQueue: (video: any) => void,
    queue: any[],
    currentVideoId: string
) => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [connectedClients, setConnectedClients] = useState(0);

    // Generate Session ID on mount
    useEffect(() => {
        // Generate simple 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSessionId(code);

        // Cleanup on unmount
        return () => {
            if (realtimeDb && code) {
                remove(ref(realtimeDb, `sessions/${code}`));
            }
        };
    }, []);

    // Sync Host State to Firebase (So Remote sees what's playing)
    useEffect(() => {
        if (!sessionId || !realtimeDb) return;
        if (!playerRef.current) return;

        try {
            const title = queue.find(v => v.videoId === currentVideoId)?.title || "Unknown Title";

            // Update state
            set(ref(realtimeDb, `sessions/${sessionId}/state`), {
                videoId: currentVideoId,
                title: title,
                isPlaying: true, // Simplified assumption or pass real state
                timestamp: Date.now()
            });
        } catch (e) { console.error(e); }

    }, [sessionId, currentVideoId, queue]);

    // Keep latest addToQueue in ref to avoid re-subscribing listener
    const addToQueueRef = useRef(addToQueue);
    useEffect(() => {
        addToQueueRef.current = addToQueue;
    }, [addToQueue]);

    // Listen for Commands
    useEffect(() => {
        if (!sessionId || !realtimeDb) return;

        const commandsRef = ref(realtimeDb, `sessions/${sessionId}/commands`);

        // Listen
        const unsubscribe = onValue(commandsRef, (snapshot) => {
            const commands = snapshot.val();
            if (!commands) return;

            Object.keys(commands).forEach((key) => {
                const cmd = commands[key] as RemoteCommand;
                // Execute Command
                handleCommand(cmd);
                // Remove executed command
                remove(ref(realtimeDb, `sessions/${sessionId}/commands/${key}`));
            });
        });

        return () => unsubscribe();
    }, [sessionId, playerRef]); // Removed addToQueue from deps

    const handleCommand = (cmd: RemoteCommand) => {
        console.log('[RemoteHost] Received:', cmd);
        if (!playerRef.current) return;

        const internalPlayer = playerRef.current.getInternalPlayer();

        switch (cmd.type) {
            case 'PLAY':
                internalPlayer?.playVideo();
                break;
            case 'PAUSE':
                internalPlayer?.pauseVideo();
                break;
            case 'NEXT':
                // We need a way to trigger NEXT. 
                // If addToQueue is passed, we might need a 'next' function passed too.
                // For now, we can dispatch the BroadcastChannel event which handles Next logic!
                const channel = new BroadcastChannel('youoke-dual-sync');
                channel.postMessage({ type: 'REQUEST_NEXT' });
                channel.close();
                break;
            case 'ADD_QUEUE':
                if (cmd.payload && cmd.payload.video) {
                    addToQueueRef.current(cmd.payload.video);
                }
                break;
        }
    };

    return {
        sessionId,
        connectedClients
    };
};
