import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDb } from '../firebase';
import { ref, set, remove, onValue, onDisconnect, serverTimestamp } from 'firebase/database';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { useToast } from '../context/ToastContext';

export type RemoteCommand = {
    type: 'PLAY' | 'PAUSE' | 'NEXT' | 'ADD_QUEUE' | 'ADD_TO_QUEUE' | 'SEEK' | 'TOGGLE_FULLSCREEN' | 'SET_FULLSCREEN' | 'REORDER_QUEUE' | 'REMOVE_AT' | 'TOGGLE_QUEUE_OVERLAY';
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
                .catch(e => console.error('❌ Host: State sync failed', e));

        } catch (e) { console.error('❌ Host: Sync Logic Error', e); }

    }, [sessionId, currentVideoId, queue, isPlaying, isFullscreen, user, roomCode]); // Added roomCode dependency

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
            } else if (count > 0) {
                setConnectionStatus('active'); // Fallback if count > 0 but state mixed
            } else {
                setConnectionStatus('disconnected');
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

    // Listen for Commands (Real-time SDK Listener)
    const processedCommandIdsRef = useRef<Set<string>>(new Set());

    const { addToast } = useToast() || { addToast: () => { } };

    useEffect(() => {
        if (!sessionId || !realtimeDb) return;

        console.log('👂 [Host] Listening for remote commands on:', sessionId);
        const currentDb = realtimeDb;
        const commandsRef = ref(currentDb, `rooms/${sessionId}/commands`);

        const unsubscribe = onValue(commandsRef, (snapshot) => {
            if (!snapshot.exists()) return;

            const commands = snapshot.val() as Record<string, CastCommandEnvelope>;
            const now = Date.now();

            Object.entries(commands).forEach(([cmdId, envelope]) => {
                // 1. Skip if already processed
                if (processedCommandIdsRef.current.has(cmdId)) return;

                // 2. Skip if too old (> 60 seconds)
                if (now - (envelope.timestamp || 0) > 60000) {
                    processedCommandIdsRef.current.add(cmdId);
                    return;
                }

                // 3. Only process pending
                if (envelope.status !== 'pending') return;

                // 4. Mark processed and execute
                processedCommandIdsRef.current.add(cmdId);

                if (envelope.command.type === 'ADD_TO_QUEUE' || envelope.command.type === 'ADD_QUEUE') {
                    addToast('รีโมท: เพิ่มเพลงเข้าคิวแล้ว');
                } else {
                    console.log('✨ [Remote Command]:', envelope.command.type);
                }

                handleCommand(envelope.command);

                // 5. Cleanup: Delete command using SDK
                remove(ref(currentDb, `rooms/${sessionId}/commands/${cmdId}`))
                    .catch(e => console.error('❌ [Host] Failed to cleanup command:', e));
            });
        });

        return () => {
            unsubscribe();
        };
    }, [sessionId, realtimeDb]);

    const handleCommand = (cmd: RemoteCommand) => {
        console.log('[RemoteHost] Executing:', cmd.type);

        // ADD_TO_QUEUE (Standard) or ADD_QUEUE (Legacy)
        if (cmd.type === 'ADD_TO_QUEUE' || cmd.type === 'ADD_QUEUE') {
            const videoPayload = cmd.payload?.video || cmd.payload;
            if (videoPayload) {
                // Normalize for Store
                const videoToAdd = {
                    id: videoPayload.id || videoPayload.videoId,
                    videoId: videoPayload.videoId || videoPayload.id,
                    sourceType: videoPayload.sourceType || 'youtube',
                    title: videoPayload.title || "Unknown Title",
                    author: videoPayload.author || "Unknown",
                    thumbnail: videoPayload.thumbnail || "",
                    addedBy: cmd.payload?.addedBy || videoPayload.addedBy || null
                };

                if (videoToAdd.videoId || videoToAdd.id) {
                    addToQueueRef.current(videoToAdd);
                }
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
            const incomingQueue = cmd.payload.queue || cmd.payload.newQueue;
            if (cmd.payload && Array.isArray(incomingQueue)) {
                console.log('[RemoteHost] Reordering queue:', incomingQueue.length, 'items');
                if (setPlaylistRef.current) {
                    const cleanQueue = incomingQueue.map((item: any) => ({
                        ...item,
                        id: item.id || item.videoId,
                        uuid: item.uuid // Ensure uuid is explicitly preserved
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

        const store = usePlayerStore.getState();

        switch (cmd.type) {
            case 'PLAY':
                console.log('🎮 [Remote] Executing PLAY command');
                store.play();
                break;
            case 'PAUSE':
                console.log('🎮 [Remote] Executing PAUSE command');
                store.pause();
                break;
            case 'NEXT':
                console.log('🎮 [Remote] Executing NEXT command');
                store.playNext();
                break;
            case 'TOGGLE_QUEUE_OVERLAY':
                console.log('🎮 [Remote] Executing TOGGLE_QUEUE_OVERLAY command');
                store.toggleQueueVisibility();
                break;
        }
    };

    return {
        sessionId,
        connectedClients,
        connectionStatus
    };
};
