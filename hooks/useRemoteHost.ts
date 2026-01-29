import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDb } from '../firebase';
import { ref, set, remove, onValue, onDisconnect, serverTimestamp } from 'firebase/database';

export type RemoteCommand = {
    type: 'PLAY' | 'PAUSE' | 'NEXT' | 'ADD_QUEUE' | 'SEEK' | 'TOGGLE_FULLSCREEN';
    payload?: any;
    timestamp: number;
};
// Add compatibility for CastCommandEnvelope
interface CastCommandEnvelope {
    id: string;
    command: RemoteCommand;
    status: 'pending' | 'completed';
    timestamp: number;
    from: string;
}

export type HostState = {
    isPlaying: boolean;
    videoId: string;
    title: string;
    currentTime: number;
    duration: number;
};

export const useRemoteHost = (
    playerRef: any,
    controlRef: any,
    addToQueue: (video: any) => void,
    queue: any[],
    currentVideoId: string
) => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [connectedClients, setConnectedClients] = useState(0);

    // Keep strict refs for callbacks to avoid effect churn
    const addToQueueRef = useRef(addToQueue);
    useEffect(() => { addToQueueRef.current = addToQueue; }, [addToQueue]);

    // Generate Session ID on mount
    useEffect(() => {
        // Generate simple 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSessionId(code);
        console.log('🌟 Host: Generated Session ID', code);

        // Cleanup on unmount
        return () => {
            // Note: We might want to keep the room alive for a bit, but for now clean up
            // Using SDK is fine for cleanup as it's fire-and-forget
            if (realtimeDb && code) {
                // remove(ref(realtimeDb, `rooms/${code}`));
            }
        };
    }, []);

    // Sync Host State to Firebase (rooms/{code}/state)
    useEffect(() => {
        if (!sessionId || !realtimeDb) return;

        // Don't sync if player not ready
        // if (!playerRef.current) return; 

        try {
            const currentVideo = queue.find(v => v.videoId === currentVideoId);
            const title = currentVideo?.title || "Unknown Title";

            // Structure matches what Monitor sends to rooms/{code}/state
            const statePayload = {
                queue: queue, // Pass simplified queue or full queue
                currentIndex: queue.findIndex(v => v.videoId === currentVideoId),
                currentVideo: currentVideo || null,
                controls: {
                    isPlaying: true, // Need real state from player
                    isMuted: false,
                    currentTime: 0,
                    duration: 0
                },
                // Add legacy fields for backward compat if needed (but we strictly use new schema now)
                videoId: currentVideoId,
                title: title,
                timestamp: Date.now()
            };

            // Use REST API for "Set State" to be robust (Write-heavy)
            // Or use SDK since Host usually has stable connection? 
            // Let's stick to SDK for Host Write for now, but to `rooms/` path
            set(ref(realtimeDb, `rooms/${sessionId}/state`), statePayload)
                .catch(e => console.error('❌ Host: State sync failed', e));

        } catch (e) { console.error(e); }

    }, [sessionId, currentVideoId, queue]);

    // Listen for Connected Clients (Presence)
    useEffect(() => {
        if (!sessionId || !realtimeDb) return;

        const connectedRef = ref(realtimeDb, `rooms/${sessionId}/connected`);

        const handleSnapshot = (snapshot: any) => {
            const count = snapshot.exists() ? snapshot.size : 0;
            console.log(`👥 Host: Connected clients update for ${sessionId}:`, count);
            setConnectedClients(count);
        };

        // Subscribe
        const unsubscribe = onValue(connectedRef, handleSnapshot, (error) => {
            console.error("❌ Host: Connected clients listener error", error);
        });

        // Cleanup
        return () => {
            // In Firebase v9 modular, onValue returns the unsubscribe function directly
            unsubscribe();
            // or use off(connectedRef, 'value', handleSnapshot) if storing callback reference
        };
    }, [sessionId]);

    // Poll for Commands (REST API Polling - Same robustness as Monitor)
    useEffect(() => {
        if (!sessionId) return;

        let processedCommandIds = new Set<string>();
        let isActive = true;

        const pollInterval = setInterval(async () => {
            if (!isActive) return;

            try {
                // Get DB URL
                const { realtimeDb } = await import('../firebase');
                const dbURL = realtimeDb?.app?.options?.databaseURL;
                if (!dbURL) return;

                const response = await fetch(`${dbURL}/rooms/${sessionId}/commands.json`);
                if (!response.ok) return;

                const commands = await response.json() as Record<string, CastCommandEnvelope> | null;
                if (!commands) return;

                for (const [cmdId, envelope] of Object.entries(commands)) {
                    if (processedCommandIds.has(cmdId)) continue;

                    // Mark processed locally immediately
                    processedCommandIds.add(cmdId);

                    if (envelope.status !== 'pending') continue;

                    console.log('✨ Host: New Command', envelope.command.type);

                    // Execute
                    handleCommand(envelope.command);

                    // Mark completed in DB
                    // Delete or update status? Monitor updates status.
                    // Let's delete it to keep DB clean, or update status 'completed'
                    fetch(`${dbURL}/rooms/${sessionId}/commands/${cmdId}/status.json`, {
                        method: 'PUT',
                        body: JSON.stringify('completed')
                    }).catch(console.error);
                }

            } catch (e) {
                console.error('❌ Host: Command poll error', e);
            }
        }, 1000);

        return () => {
            isActive = false;
            clearInterval(pollInterval);
        };
    }, [sessionId]);

    const handleCommand = (cmd: RemoteCommand) => {
        console.log('[RemoteHost] Executing:', cmd.type);

        // ADD_QUEUE does NOT need the player to be ready
        if (cmd.type === 'ADD_QUEUE') {
            if (cmd.payload && cmd.payload.video) {
                addToQueueRef.current(cmd.payload.video);
            } else if (cmd.payload && cmd.payload.videoId) {
                addToQueueRef.current(cmd.payload);
            }
            return;
        }

        // TOGGLE_FULLSCREEN uses controlRef
        if (cmd.type === 'TOGGLE_FULLSCREEN') {
            if (controlRef?.current?.toggleFullscreen) {
                controlRef.current.toggleFullscreen();
            } else {
                console.warn('[RemoteHost] controlRef not ready or missing toggleFullscreen');
            }
            return;
        }

        // Other commands need the player
        if (!playerRef.current) {
            console.warn('[RemoteHost] Player not ready, ignoring command:', cmd.type);
            return;
        }

        const internalPlayer = playerRef.current.getInternalPlayer();

        switch (cmd.type) {
            case 'PLAY':
                if (controlRef?.current?.play) {
                    controlRef.current.play();
                } else {
                    internalPlayer?.playVideo();
                }
                break;
            case 'PAUSE':
                if (controlRef?.current?.pause) {
                    controlRef.current.pause();
                } else {
                    internalPlayer?.pauseVideo();
                }
                break;
            case 'NEXT':
                const channel = new BroadcastChannel('youoke-dual-sync');
                channel.postMessage({ type: 'REQUEST_NEXT' });
                channel.close();
                break;
        }
    };

    return {
        sessionId,
        connectedClients
    };
};
