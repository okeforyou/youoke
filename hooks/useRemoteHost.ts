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
    currentVideoId: string,
    isPlaying: boolean // New argument
) => {
    const [sessionId, setSessionId] = useState<string | null>(null);


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
                // Ensure onDisconnect triggers if user closes tab
                onDisconnect(ref(realtimeDb, `rooms/${code}`)).remove();

                // Also remove immediately on unmount (SPA navigation)
                remove(ref(realtimeDb, `rooms/${code}`));
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
                    isPlaying: isPlaying, // Use logic from argument
                    isMuted: false,
                    currentTime: 0,
                    duration: 0
                },
                // Add legacy fields for backward compat if needed (but we strictly use new schema now)
                videoId: currentVideoId,
                title: title,
                isPlaying: isPlaying, // Critical for Remote compatibility
                timestamp: Date.now()
            };

            // Use REST API for "Set State" to be robust (Write-heavy)
            // Or use SDK since Host usually has stable connection? 
            // Let's stick to SDK for Host Write for now, but to `rooms/` path
            console.log('🔥 [Host] Syncing State to Firebase:', statePayload);
            set(ref(realtimeDb, `rooms/${sessionId}/state`), statePayload)
                .catch(e => console.error('❌ Host: State sync failed', e));

        } catch (e) { console.error(e); }

    }, [sessionId, currentVideoId, queue, isPlaying]);

    // State for connection status
    const [connectedClients, setConnectedClients] = useState<number>(0);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'active' | 'background'>('disconnected');

    // Sync Connected Clients & Calculate Status
    useEffect(() => {
        if (!sessionId || !realtimeDb) return;

        const connectedRef = ref(realtimeDb, `rooms/${sessionId}/connected`);

        const handleSnapshot = (snapshot: any) => {
            if (!snapshot.exists()) {
                setConnectedClients(0);
                setConnectionStatus('disconnected');
                return;
            }

            const clients = snapshot.val();
            const count = Object.keys(clients).length;
            setConnectedClients(count);

            // Determine Status:
            // - If ANY client is 'active' -> active (Green)
            // - If NO 'active' but At Least One 'background' -> background (Orange)
            // - Else -> disconnected (Gray)

            const clientValues = Object.values(clients) as any[];
            const hasActive = clientValues.some(c => c.state === 'active' || !c.state); // Default to active if state missing
            const hasBackground = clientValues.some(c => c.state === 'background');

            if (hasActive) {
                setConnectionStatus('active');
            } else if (hasBackground) {
                setConnectionStatus('background');
            } else {
                setConnectionStatus('active');
            }
        };

        // Subscribe
        const unsubscribe = onValue(connectedRef, handleSnapshot, (error) => {
            console.error("❌ Host: Connected clients listener error", error);
        });

        // Cleanup
        return () => {
            unsubscribe();
        };
    }, [sessionId]);

    // Poll for Commands (REST API Polling - Robust)
    // Use Ref for processed IDs to survive effect re-runs
    const processedCommandIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!sessionId) return;

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

                const now = Date.now();

                for (const [cmdId, envelope] of Object.entries(commands)) {
                    // 1. Skip if already processed in this session
                    if (processedCommandIdsRef.current.has(cmdId)) continue;

                    // 2. Skip if too old (> 30 seconds) - Prevent "replay from grave"
                    if (now - envelope.timestamp > 30000) {
                        // Clean up old junk
                        fetch(`${dbURL}/rooms/${sessionId}/commands/${cmdId}.json`, { method: 'DELETE' }).catch(() => { });
                        processedCommandIdsRef.current.add(cmdId);
                        continue;
                    }

                    // 3. Mark processed immediately
                    processedCommandIdsRef.current.add(cmdId);

                    if (envelope.status !== 'pending') continue;

                    console.log('✨ Host: New Command', envelope.command.type);

                    // 4. Execute
                    handleCommand(envelope.command);

                    // 5. Delete immediately to prevent any other client/logic from seeing it
                    fetch(`${dbURL}/rooms/${sessionId}/commands/${cmdId}.json`, {
                        method: 'DELETE'
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
                console.log('🎮 [Remote] Executing PLAY command');
                if (controlRef?.current?.play) {
                    console.log('🎮 [Remote] Using controlRef.play()');
                    controlRef.current.play();
                } else {
                    console.warn('⚠️ [Remote] controlRef.play missing, falling back to internalPlayer');
                    internalPlayer?.playVideo();
                }
                break;
            case 'PAUSE':
                console.log('🎮 [Remote] Executing PAUSE command');
                if (controlRef?.current?.pause) {
                    console.log('🎮 [Remote] Using controlRef.pause()');
                    controlRef.current.pause();
                } else {
                    console.warn('⚠️ [Remote] controlRef.pause missing, falling back to internalPlayer');
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
        connectedClients,
        connectionStatus
    };
};
