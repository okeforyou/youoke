import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDb } from '../firebase';
import { ref, set, remove, onValue, onDisconnect, serverTimestamp } from 'firebase/database';

export type RemoteCommand = {
    type: 'PLAY' | 'PAUSE' | 'NEXT' | 'ADD_QUEUE' | 'SEEK' | 'TOGGLE_FULLSCREEN' | 'SET_FULLSCREEN' | 'REORDER_QUEUE' | 'REMOVE_AT';
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
    isPlaying: boolean,
    isFullscreen: boolean,
    setPlaylist: (newQueue: any[]) => void,

    user: any, // New argument for Auth reactivity
    roomCode?: string // Optional: Force specific room code (from UI)
) => {
    const [sessionId, setSessionId] = useState<string | null>(null);


    // Keep strict refs for callbacks to avoid effect churn
    const addToQueueRef = useRef(addToQueue);
    const setPlaylistRef = useRef(setPlaylist); // Ref for setPlaylist
    const queueRef = useRef(queue); // Ref for Queue to avoid stale closures in polling
    useEffect(() => { addToQueueRef.current = addToQueue; }, [addToQueue]);
    useEffect(() => { setPlaylistRef.current = setPlaylist; }, [setPlaylist]);
    useEffect(() => { queueRef.current = queue; }, [queue]);

    // Generate Session ID on mount
    // Generate Session ID on mount (or use provided roomCode)
    useEffect(() => {
        if (roomCode) {
            setSessionId(roomCode);
            // console.log('🌟 Host: Using provided Room Code', roomCode);
            return;
        }

        // Generate simple 6-digit code if none provided
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
    }, [roomCode]);

    // Sync Host State to Firebase (rooms/{code}/state)
    useEffect(() => {
        if (!sessionId || !realtimeDb) return;

        try {
            const safeQueue = Array.isArray(queue) ? queue : [];
            const currentVideo = safeQueue.find(v => v.videoId === currentVideoId);
            const title = currentVideo?.title || "Unknown Title";
            const currentIndex = safeQueue.findIndex(v => v.videoId === currentVideoId);

            // Structure matches what Monitor sends to rooms/{code}/state
            const statePayload = {
                queue: safeQueue,
                currentIndex: currentIndex,
                currentVideo: currentVideo || null,
                controls: {
                    isPlaying: !!isPlaying,
                    isMuted: false,
                    currentTime: 0,
                    duration: 0
                },
                videoId: currentVideoId || null,
                title: title || "Unknown Title",
                isPlaying: !!isPlaying,
                isFullscreen: !!isFullscreen,
                timestamp: Date.now()
            };

            // console.log('🔥 [Host] Syncing State to Firebase:', { 
            //     q: safeQueue.length, 
            //     idx: currentIndex, 
            //     vid: currentVideoId 
            // });

            set(ref(realtimeDb, `rooms/${sessionId}/state`), statePayload)
                .catch(e => console.error('❌ Host: State sync failed (Auth ready?)', e));

        } catch (e) { console.error('❌ Host: Sync Logic Error', e); }

    }, [sessionId, currentVideoId, queue, isPlaying, isFullscreen, user]); // Added user dependency

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

        // SET_FULLSCREEN (Explicit State)
        if (cmd.type === 'SET_FULLSCREEN') {
            if (controlRef?.current?.setFullscreen) {
                const targetState = cmd.payload?.state;
                console.log('[RemoteHost] Setting fullscreen explicitly:', targetState);
                controlRef.current.setFullscreen(!!targetState);
            } else {
                console.warn('[RemoteHost] controlRef not ready or missing setFullscreen');
            }
            return;
        }

        // REORDER_QUEUE
        if (cmd.type === 'REORDER_QUEUE') {
            if (cmd.payload && Array.isArray(cmd.payload.newQueue)) {
                console.log('[RemoteHost] Reordering queue:', cmd.payload.newQueue.length, 'items');
                if (setPlaylistRef.current) {
                    // SANITIZE: Strip 'key', 'dndId' and other transient props to prevent corruption cycles
                    // Only keep core data: videoId, title, thumbnail, duration, addedBy, addedAt
                    const cleanQueue = cmd.payload.newQueue.map((item: any) => ({
                        videoId: item.videoId,
                        title: item.title,
                        thumbnail: item.thumbnail,
                        duration: item.duration,
                        addedBy: item.addedBy,
                        addedAt: item.addedAt,
                        // uuid: item.uuid // Keep if used
                    }));
                    setPlaylistRef.current(cleanQueue);
                }
            }
            return;
        }

        // REMOVE_AT
        if (cmd.type === 'REMOVE_AT') {
            const index = cmd.payload?.index;
            // Use queueRef.current to get LATEST queue state
            const currentQueue = queueRef.current || [];
            if (typeof index === 'number' && index >= 0 && index < currentQueue.length) {
                console.log('[RemoteHost] Removing item at index:', index, 'from queue of length:', currentQueue.length);
                const newQueue = [...currentQueue];
                newQueue.splice(index, 1);
                if (setPlaylistRef.current) {
                    setPlaylistRef.current(newQueue);
                }
            } else {
                console.warn('[RemoteHost] Remove failed: Invalid index or queue mismatch', index, currentQueue.length);
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
