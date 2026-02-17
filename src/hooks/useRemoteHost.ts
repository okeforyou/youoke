import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDb } from '../firebase';
import { ref, set, remove, onValue, onDisconnect, serverTimestamp, off, onChildAdded } from 'firebase/database';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { useUIStore } from '../stores/useUIStore';
import { useToast } from '@/context/ToastContext';

export type RemoteCommand = {
    type: 'PLAY' | 'PAUSE' | 'NEXT' | 'ADD_QUEUE' | 'ADD_TO_QUEUE' | 'SEEK' | 'TOGGLE_FULLSCREEN' | 'SET_FULLSCREEN' | 'REORDER_QUEUE' | 'REMOVE_AT' | 'TOGGLE_QUEUE_OVERLAY';
    payload?: any;
    timestamp: number;
};

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
    playerRef: React.RefObject<any>,
    controlRef: React.RefObject<any>,
    addToQueue: (video: any) => void,
    queue: any[],
    currentVideoId: string | null,
    isPlaying: boolean,
    isFullscreen: boolean,
    reorderQueue: (queue: any[]) => void,
    user: any,
    roomCode?: string,
    onRemoteConnect?: () => void
) => {
    const [sessionId, setSessionId] = useState<string | null>(roomCode || null);
    const [connectedClients, setConnectedClients] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'active' | 'background'>('disconnected');

    // Keep strict refs for callbacks to avoid effect churn
    const addToQueueRef = useRef(addToQueue);
    const setPlaylistRef = useRef(reorderQueue);
    const queueRef = useRef(queue);

    useEffect(() => { addToQueueRef.current = addToQueue; }, [addToQueue]);
    useEffect(() => { setPlaylistRef.current = reorderQueue; }, [reorderQueue]);
    useEffect(() => { queueRef.current = queue; }, [queue]);

    // Use a ref for the connection callback to avoid dependency loops
    const onRemoteConnectRef = useRef(onRemoteConnect);
    useEffect(() => { onRemoteConnectRef.current = onRemoteConnect; }, [onRemoteConnect]);

    // Generate Session ID on mount or use provided roomCode
    useEffect(() => {
        if (roomCode) {
            setSessionId(roomCode);
            return;
        }

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setSessionId(code);

        return () => {
            if (realtimeDb && code) {
                onDisconnect(ref(realtimeDb, `rooms/${code}`)).remove();
                remove(ref(realtimeDb, `rooms/${code}`));
            }
        };
    }, [roomCode]);

    // Sync Host State to Firebase
    useEffect(() => {
        if (!sessionId || !realtimeDb) return;

        try {
            // Ensure we only sync serializable data
            const safeQueue = (Array.isArray(queue) ? queue : []).map(v => ({
                id: v.id || v.videoId,
                videoId: v.videoId || v.id,
                title: v.title || "Unknown",
                author: v.author || "Unknown",
                thumbnail: v.thumbnail || "",
                sourceType: v.sourceType || 'youtube',
                addedBy: v.addedBy || null,
                uuid: v.uuid
            }));

            const currentVideo = safeQueue.find(v => (v.id || v.videoId) === currentVideoId);
            const currentIndex = safeQueue.findIndex(v => (v.id || v.videoId) === currentVideoId);

            const statePayload = {
                queue: safeQueue,
                currentIndex: currentIndex >= 0 ? currentIndex : 0,
                currentVideo: currentVideo || null,
                controls: {
                    isPlaying: !!isPlaying,
                    isMuted: false,
                    currentTime: 0,
                    duration: 0
                },
                videoId: currentVideoId || null,
                title: currentVideo?.title || "Unknown Title",
                isPlaying: !!isPlaying,
                isFullscreen: !!isFullscreen,
                notification: usePlayerStore.getState().notification || null,
                roomCode: sessionId,
                timestamp: Date.now()
            };

            // console.log('📤 [Host] Syncing queue to Firebase:', safeQueue.length);
            set(ref(realtimeDb, `rooms/${sessionId}/state`), statePayload);
            set(ref(realtimeDb, `rooms/${sessionId}/lastActive`), serverTimestamp());
        } catch (e) {
            console.error('Remote Sync Error:', e);
        }
    }, [queue, currentVideoId, isPlaying, isFullscreen, sessionId]);

    // Track Connection Status (Presence Monitoring)
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
            const clientValues = Object.values(clients) as any[];
            const count = clientValues.length;

            setConnectedClients(count);

            const hasActive = clientValues.some(c => c.state === 'active');
            const hasBackground = clientValues.some(c => c.state === 'background');

            if (hasActive) {
                setConnectionStatus('active');
            } else if (hasBackground) {
                setConnectionStatus('background');
            } else if (count > 0) {
                setConnectionStatus('active'); // Fallback if state is missing
            } else {
                setConnectionStatus('disconnected');
            }
        };

        const unsubscribe = onValue(connectedRef, handleSnapshot);

        // EXTRA: Listen for new connections specifically to trigger callback (V1 logic)
        const unsubscribeChild = onChildAdded(connectedRef, (snapshot) => {
            if (snapshot.exists()) {
                console.log('📱 [Host] New client connected via presence:', snapshot.key);
                if (onRemoteConnectRef.current) onRemoteConnectRef.current();
            }
        });

        // NEW: Direct Join Signal (User's suggested simple logic)
        const hostStartTime = Date.now();
        const lastJoinRef = ref(realtimeDb, `rooms/${sessionId}/status/lastJoin`);
        const unsubscribeJoin = onValue(lastJoinRef, (snapshot) => {
            if (snapshot.exists()) {
                const joinTime = snapshot.val();
                // Only trigger if the join event is newer than when this host started (with 10s buffer)
                if (typeof joinTime === 'number' && joinTime > hostStartTime - 10000) {
                    console.log('📱 [Host] Direct Join Signal! Closing modal.');
                    if (onRemoteConnectRef.current) onRemoteConnectRef.current();
                    // Also force status to active immediately
                    setConnectionStatus('active');
                } else {
                    console.log('📱 [Host] Ignoring old join signal:', joinTime);
                }
            }
        });

        return () => {
            unsubscribe();
            unsubscribeChild();
            unsubscribeJoin();
        };
    }, [sessionId]);

    const handleCommand = (cmd: RemoteCommand, from?: string) => {
        // [Loop Prevention] Dashboard should NOT process commands sent by itself
        if (from === 'dashboard') {
            // console.log('🚫 [Host] Ignoring command from self (dashboard)');
            return;
        }

        console.log('[RemoteHost] Executing:', cmd.type);
        const store = usePlayerStore.getState();

        // Any command received is proof of connection - Auto-trigger join callback
        if (onRemoteConnectRef.current) {
            onRemoteConnectRef.current();
        }

        switch (cmd.type) {
            case 'PLAY':
                store.play();
                break;
            case 'PAUSE':
                store.pause();
                break;
            case 'NEXT':
                store.playNext();
                break;
            case 'TOGGLE_QUEUE_OVERLAY':
                useUIStore.getState().toggleQueue();
                break;
            case 'ADD_TO_QUEUE':
            case 'ADD_QUEUE':
                const videoPayload = cmd.payload?.video || cmd.payload;
                if (videoPayload) {
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
                break;
            case 'TOGGLE_FULLSCREEN':
                if (controlRef?.current?.toggleFullscreen) {
                    controlRef.current.toggleFullscreen();
                }
                break;
            case 'SET_FULLSCREEN':
                if (controlRef?.current?.setFullscreen) {
                    controlRef.current.setFullscreen(!!cmd.payload?.state);
                }
                break;
            case 'REORDER_QUEUE':
                const incomingQueue = cmd.payload.queue || cmd.payload.newQueue;
                if (Array.isArray(incomingQueue)) {
                    const cleanQueue = incomingQueue.map((item: any) => ({
                        ...item,
                        id: item.id || item.videoId,
                        videoId: item.videoId || item.id,
                        uuid: item.uuid
                    }));
                    if (setPlaylistRef.current) setPlaylistRef.current(cleanQueue);
                }
                break;
            case 'REMOVE_AT':
                const uuid = cmd.payload?.uuid;
                const index = cmd.payload?.index;
                if (uuid) {
                    const newQueue = queueRef.current.filter(item => item.uuid !== uuid);
                    if (setPlaylistRef.current) setPlaylistRef.current(newQueue);
                } else if (typeof index === 'number') {
                    const newQueue = [...queueRef.current];
                    newQueue.splice(index, 1);
                    if (setPlaylistRef.current) setPlaylistRef.current(newQueue);
                }
                break;
        }
    };

    // Listen for Commands
    const processedCommandIdsRef = useRef<Set<string>>(new Set());
    const { addToast } = useToast() || { addToast: () => { } };

    useEffect(() => {
        if (!sessionId || !realtimeDb) return;

        const commandsRef = ref(realtimeDb, `rooms/${sessionId}/commands`);

        const unsubscribe = onValue(commandsRef, (snapshot) => {
            if (!snapshot.exists()) return;

            const commands = snapshot.val() as Record<string, CastCommandEnvelope>;
            const now = Date.now();

            Object.entries(commands).forEach(([cmdId, envelope]) => {
                if (processedCommandIdsRef.current.has(cmdId)) return;
                if (now - (envelope.timestamp || 0) > 60000) {
                    processedCommandIdsRef.current.add(cmdId);
                    return;
                }
                if (envelope.status !== 'pending') return;

                processedCommandIdsRef.current.add(cmdId);

                if (envelope.command.type === 'ADD_TO_QUEUE' || envelope.command.type === 'ADD_QUEUE') {
                    addToast('รีโมท: เพิ่มเพลงเข้าคิวแล้ว');
                }

                handleCommand(envelope.command, envelope.from);
                if (realtimeDb) {
                    remove(ref(realtimeDb, `rooms/${sessionId}/commands/${cmdId}`));
                }
            });
        });

        return () => unsubscribe();
    }, [sessionId]);

    return {
        sessionId,
        connectedClients,
        connectionStatus
    };
};
