import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeDb } from '../firebase';
import { ref, set, remove, onValue, onDisconnect, serverTimestamp, off } from 'firebase/database';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { useUIStore } from '../stores/useUIStore';
import { useToast } from '../context/ToastContext';

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
    playerRef: any,
    controlRef: any,
    addToQueue: (video: any) => void,
    queue: any[],
    currentVideoId: string,
    isPlaying: boolean,
    isFullscreen: boolean,
    setPlaylist: (newQueue: any[]) => void,
    user: any,
    roomCode?: string
) => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [connectedClients, setConnectedClients] = useState<number>(0);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'active' | 'background'>('disconnected');

    // Keep strict refs for callbacks to avoid effect churn
    const addToQueueRef = useRef(addToQueue);
    const setPlaylistRef = useRef(setPlaylist);
    const queueRef = useRef(queue);

    useEffect(() => { addToQueueRef.current = addToQueue; }, [addToQueue]);
    useEffect(() => { setPlaylistRef.current = setPlaylist; }, [setPlaylist]);
    useEffect(() => { queueRef.current = queue; }, [queue]);

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
            const safeQueue = Array.isArray(queue) ? queue : [];
            const currentVideo = safeQueue.find(v => v.videoId === currentVideoId);
            const title = currentVideo?.title || "Unknown Title";
            const currentIndex = safeQueue.findIndex(v => v.videoId === currentVideoId);

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
                roomCode: sessionId,
                timestamp: Date.now()
            };

            set(ref(realtimeDb, `rooms/${sessionId}/state`), statePayload)
                .catch(e => console.error('❌ Host: State sync failed', e));

        } catch (e) { console.error('❌ Host: Sync Logic Error', e); }

    }, [sessionId, currentVideoId, queue, isPlaying, isFullscreen, user]);

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
            const clientValues = Object.values(clients) as any[];
            const count = clientValues.length;

            setConnectedClients(count);

            const hasActive = clientValues.some(c => c.state === 'active');
            const hasBackground = clientValues.some(c => c.state === 'background' || !c.state);

            if (hasActive) {
                setConnectionStatus('active');
            } else if (hasBackground) {
                setConnectionStatus('background');
            } else if (count > 0) {
                setConnectionStatus('active');
            } else {
                setConnectionStatus('disconnected');
            }
        };

        const unsubscribe = onValue(connectedRef, handleSnapshot);

        return () => unsubscribe();
    }, [sessionId]);

    const handleCommand = (cmd: RemoteCommand) => {
        console.log('[RemoteHost] Executing:', cmd.type);
        const store = usePlayerStore.getState();

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

                handleCommand(envelope.command);
                if (realtimeDb) {
                    remove(ref(realtimeDb, `rooms/${sessionId}/commands/${cmdId}`));
                }
            });
        });

        return () => off(commandsRef);
    }, [sessionId]);

    return {
        sessionId,
        connectedClients,
        connectionStatus
    };
};
