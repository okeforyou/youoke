import { ref, off, get, set, update, push, child, remove, onChildAdded, onValue, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../../../firebase';
import { usePlayerStore } from '../../../modules/player/stores/usePlayerStore';
import { Video } from '../../../modules/player/types';

export class CastService {
    private roomCode: string | null = null;
    private unsubscribe: (() => void) | null = null;
    private pollInterval: NodeJS.Timeout | null = null;
    private commandListenerOff: (() => void) | null = null;
    private role: 'host' | 'monitor' = 'host';
    private stateListenerOff: (() => void) | null = null;
    private processedCommandIds = new Set<string>();

    constructor() { }

    public async initialize(roomCode: string, role: 'host' | 'monitor' = 'host'): Promise<string> {
        // Cleanup previous session if any
        this.cleanup();
        this.role = role;

        if (!auth) {
            console.warn("🔥 Firebase Auth not initialized. Casting disabled.");
            return "";
        }

        if (!auth.currentUser) await signInAnonymously(auth).catch(e => console.error("🔥 Auth failed:", e));

        this.roomCode = roomCode;
        console.log(`📡 Initializing CastService (${role}) for Room:`, this.roomCode);

        await this.createRoomIfNotExists(this.roomCode);

        // BOTH roles need to poll their own specific fields
        this.startStatePolling();

        // BOTH roles need to listen for the other's fields
        this.startStateListener();

        if (role === 'monitor') {
            this.startCommandListener();
        }

        return this.roomCode;
    }

    public cleanup() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.commandListenerOff) this.commandListenerOff();
        if (this.stateListenerOff) this.stateListenerOff();

        if (this.roomCode && realtimeDb) {
            off(ref(realtimeDb, `rooms/${this.roomCode}/commands`));
            off(ref(realtimeDb, `rooms/${this.roomCode}/state`));
        }

        this.roomCode = null;
        console.log('🛑 CastService Cleaned Up');
    }

    private generateRoomCode(): string {
        return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    }

    private async createRoomIfNotExists(roomCode: string) {
        if (!realtimeDb) return;
        const dbURL = realtimeDb.app.options.databaseURL;

        try {
            // Use SDK for initial check to avoid REST latency
            const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
            const snapshot = await get(roomRef);

            if (!snapshot.exists()) {
                console.log('📝 Room not found, creating new...');
                const initialData = {
                    hostId: auth?.currentUser?.uid || 'monitor',
                    isHost: true,
                    state: {
                        queue: [],
                        currentIndex: 0,
                        controls: { isPlaying: false, isMuted: false },
                        currentVideo: null,
                        layoutMode: 'split',
                        isQueueVisible: false
                    },
                    createdAt: Date.now()
                };
                await set(roomRef, initialData);
            }
        } catch (e) {
            console.error('❌ Room access failed:', e);
        }
    }

    private startStatePolling() {
        if (!realtimeDb || !this.roomCode) return;

        // Keep state polling via REST or SDK? SDK is better but let's stick to REST for state writes to avoid listener loops if we were listening too.
        // Actually, for "Writing State", setInterval is fine to throttle updates (debounce).
        this.pollInterval = setInterval(async () => {
            try {
                this.syncLocalStateToFirebase();
            } catch (e) {
                console.error('State Sync Error:', e);
            }
        }, 500); // 500ms Poll for smoother Monitor sync
    }

    private startStateListener() {
        if (!realtimeDb || !this.roomCode) return;

        console.log(`👂 ${this.role}: Listening for ${this.role === 'host' ? 'Monitor' : 'Host'} updates...`);
        const stateRef = ref(realtimeDb, `rooms/${this.roomCode}/state`);

        const listener = onValue(stateRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (this.role === 'host') {
                // Host listens for Progress (Time, Duration) from Monitor
                const progress = data.controls;
                if (progress) {
                    usePlayerStore.setState((prev) => ({
                        ...prev,
                        currentTime: progress.currentTime ?? prev.currentTime,
                        duration: progress.duration ?? prev.duration,
                    }));
                }
            } else {
                // Monitor listens for Master State (Queue, Video, Play/Pause) from Host
                usePlayerStore.setState((prev) => ({
                    ...prev,
                    queue: data.queue !== undefined ? data.queue : prev.queue,
                    currentIndex: data.currentIndex !== undefined ? data.currentIndex : prev.currentIndex,
                    currentVideo: data.currentVideo !== undefined ? data.currentVideo : prev.currentVideo,
                    currentSource: data.currentSource !== undefined ? data.currentSource : prev.currentSource,
                    isPlaying: data.isPlaying !== undefined ? data.isPlaying : prev.isPlaying,
                }));
            }
        });

        this.stateListenerOff = () => off(stateRef, 'value', listener);
    }

    private async syncLocalStateToFirebase() {
        if (!this.roomCode || !realtimeDb) return;

        const store = usePlayerStore.getState();
        const stateRef = ref(realtimeDb, `rooms/${this.roomCode}/state`);

        if (this.role === 'host') {
            // Host pushes Master Record (Queue, Video, Playback Status)
            const masterState = {
                queue: store.queue || [],
                currentIndex: store.currentIndex ?? 0,
                currentVideo: store.currentVideo || null,
                currentSource: store.currentSource || null,
                isPlaying: store.isPlaying ?? false,
                lastUpdated: Date.now()
            };

            // Only update if something changed to reduce writes
            update(stateRef, masterState).catch(e => console.warn('Host Sync failed', e));
        } else {
            // Monitor pushes Progress (Time, Duration)
            const progressState = {
                currentTime: store.currentTime || 0,
                duration: store.duration || 0,
                isPlaying: store.isPlaying ?? false, // Echo back for confirmation
                lastUpdated: Date.now()
            };

            // Push to nested 'controls' for progress to avoid overwriting Host's master state keys
            update(ref(realtimeDb, `rooms/${this.roomCode}/state/controls`), progressState).catch(e => console.warn('Monitor Sync failed', e));
        }
    }

    private startCommandListener() {
        if (!realtimeDb || !this.roomCode) return;

        console.log("👂 Listening for remote commands...");
        const commandsRef = ref(realtimeDb, `rooms/${this.roomCode}/commands`);

        // Listen to last 20 commands and filter locally for robustness
        const pendingQuery = query(commandsRef, limitToLast(20));

        const listener = onChildAdded(pendingQuery, (snapshot) => {
            const cmdId = snapshot.key;
            const data = snapshot.val();

            if (!cmdId || !data || !data.command) return;
            // Local Filter: Only execute 'pending' commands
            if (data.status !== 'pending') return;

            // Prevent double execution (local Set cache)
            if (this.processedCommandIds.has(cmdId)) return;

            // Execute
            this.executeCommand(data.command);

            // Mark Complete
            this.markCommandComplete(cmdId);
            this.processedCommandIds.add(cmdId);
        });

        this.commandListenerOff = () => off(commandsRef, 'child_added', listener);
    }

    private async markCommandComplete(cmdId: string) {
        if (!realtimeDb || !this.roomCode) return;
        console.log(`✅ Marking command ${cmdId} as completed`);
        const statusRef = ref(realtimeDb, `rooms/${this.roomCode}/commands/${cmdId}/status`);
        set(statusRef, 'completed').catch(e => console.error('Failed to mark command complete', e));
    }

    private executeCommand(command: any) {
        if (!command || !command.type) return;
        console.log('⚡ [CastService] Executing Remote Command:', command.type, command.payload || '');
        const store = usePlayerStore.getState();

        try {
            switch (command.type) {
                case 'PLAY': store.play(); break;
                case 'PAUSE': store.pause(); break;
                case 'NEXT': store.playNext(); break;
                case 'PREVIOUS': store.playPrevious(); break;
                case 'PLAY_NOW':
                    if (command.payload?.video) {
                        store.playVideo(command.payload.video.videoId || command.payload.video.id);
                    }
                    break;
                case 'ADD_TO_QUEUE':
                    console.log('📥 Processing ADD_TO_QUEUE:', command.payload);
                    if (command.payload?.video) {
                        const videoPayload = command.payload.video;
                        // Force UUID generation if missing, relying on Store to double check
                        // But ensure the object is clean
                        const videoToAdd = {
                            id: videoPayload.id || videoPayload.videoId,
                            videoId: videoPayload.videoId,
                            sourceType: videoPayload.sourceType || 'youtube',
                            title: videoPayload.title || "Unknown Title",
                            author: videoPayload.author || "Unknown",
                            thumbnail: videoPayload.thumbnail || "", // Firebase hates undefined
                            addedBy: command.payload.addedBy || videoPayload.addedBy || null
                        };

                        if (!videoToAdd.videoId && !videoToAdd.id) {
                            console.error("❌ Invalid Video Payload (Minimal ID missing):", videoPayload);
                            return;
                        }

                        console.log('🎵 Adding to Store:', videoToAdd);
                        store.addToQueue(videoToAdd as any);

                        // Force immediate sync to update Remote UI
                        this.syncLocalStateToFirebase();

                    } else {
                        console.error('❌ ADD_TO_QUEUE missing video payload:', command.payload);
                    }
                    break;
                case 'SKIP_TO':
                    if (typeof command.payload?.index === 'number') store.setCurrentIndex(command.payload.index);
                    break;
                case 'REMOVE_AT':
                    // Need UUID to remove safely
                    if (command.payload?.uuid) store.removeFromQueue(command.payload.uuid);
                    break;
                case 'SET_VOLUME':
                    if (command.payload?.volume) store.setVolume(command.payload.volume);
                    break;
                case 'TOGGLE_QR':
                    store.setQrVisibility(command.payload?.show ?? true);
                    break;

                case 'SYNC_STATE':
                    console.log('🔄 Processing SYNC_STATE:', command.payload);
                    if (command.payload?.queue) {
                        // Atomic sync to avoid intermediate states
                        store.reorderQueue(command.payload.queue);
                        if (typeof command.payload.currentIndex === 'number') {
                            store.setCurrentIndex(command.payload.currentIndex);
                        }
                        if (typeof command.payload.isPlaying === 'boolean') {
                            if (command.payload.isPlaying) store.play();
                            else store.pause();
                        }
                        this.syncLocalStateToFirebase();
                    }
                    break;
                case 'CLEAR_QUEUE':
                    store.clearQueue();
                    break;
                case 'REORDER_QUEUE':
                    if (Array.isArray(command.payload?.queue)) {
                        store.reorderQueue(command.payload.queue);
                    }
                    break;
                case 'TOGGLE_FULLSCREEN':
                    console.log('📺 Toggle Fullscreen Request');
                    store.triggerFullscreen();
                    break;
            }
        } catch (e) {
            console.error("Error executing command:", e);
        }
    }
}

export const castService = new CastService();
