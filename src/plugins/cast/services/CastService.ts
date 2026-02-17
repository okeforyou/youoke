import { ref, off, get, set, update, push, child, remove, onChildAdded, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../../../firebase';
import { usePlayerStore } from '../../../modules/player/stores/usePlayerStore';
import { Video } from '../../../modules/player/types';

export class CastService {
    private roomCode: string | null = null;
    private unsubscribe: (() => void) | null = null;
    private pollInterval: NodeJS.Timeout | null = null;
    private commandListenerOff: (() => void) | null = null;
    private processedCommandIds = new Set<string>();

    constructor() { }

    public async initialize(roomCode?: string): Promise<string> {
        // Cleanup previous session if any
        this.cleanup();

        if (!auth) {
            console.warn("🔥 Firebase Auth not initialized. Casting disabled. Check .env.local file.");
            return "";
        }

        if (!auth.currentUser) {
            try {
                await signInAnonymously(auth);
            } catch (e) {
                console.error("🔥 Anonymous Auth failed:", e);
                return "";
            }
        }

        this.roomCode = roomCode || this.generateRoomCode();
        console.log('📡 Initializing CastService for Room:', this.roomCode);

        await this.createRoomIfNotExists(this.roomCode);

        this.startStatePolling();
        this.startCommandListener();

        return this.roomCode;
    }

    public cleanup() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.commandListenerOff) this.commandListenerOff();

        if (this.roomCode && realtimeDb) {
            const commandsRef = ref(realtimeDb, `rooms/${this.roomCode}/commands`);
            off(commandsRef);
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
        }, 1000);
    }

    private async syncLocalStateToFirebase() {
        if (!this.roomCode || !realtimeDb) return;


        const minimalState = {
            queue: store.queue,
            currentIndex: store.currentIndex,
            currentVideo: store.currentVideo,
            controls: {
                isPlaying: store.isPlaying,
                isMuted: store.isMuted,
                volume: store.volume
            },
            layoutMode: store.layoutMode,
            isQueueVisible: store.isQueueVisible,
            notification: store.notification, // Sync toasts
            timestamp: Date.now()
        };

        // Use SDK set/update for reliability
        const stateRef = ref(realtimeDb, `rooms/${this.roomCode}/state`);
        // update() is safer than set() to merge keys if structure changes slightly, but we want authoritative override here.
        set(stateRef, minimalState).catch(e => console.warn('Sync failed', e));
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
        const statusRef = ref(realtimeDb, `rooms/${this.roomCode}/commands/${cmdId}/status`);
        set(statusRef, 'completed').catch(e => console.error('Failed to mark command complete', e));
    }

    private executeCommand(command: any) {
        console.log('⚡ Executing Remote Command:', command.type);
        const store = usePlayerStore.getState();

        try {
            switch (command.type) {
                case 'PLAY': store.play(); break;
                case 'PAUSE': store.pause(); break;
                case 'NEXT': store.playNext(); break;
                case 'PREVIOUS': store.playPrevious(); break;
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

                case 'CLEAR_QUEUE':
                    store.clearQueue();
                    break;
                case 'REORDER_QUEUE':
                    if (Array.isArray(command.payload?.queue)) {
                        store.reorderQueue(command.payload.queue);
                    }
                    break;
                case 'SET_LAYOUT':
                    if (command.payload?.mode) store.setLayoutMode(command.payload.mode);
                    break;
                case 'TOGGLE_QUEUE_OVERLAY':
                    store.toggleQueueVisibility();
                    break;
                case 'TOGGLE_QR':
                    console.log('📱 Toggle QR:', command.payload);
                    store.toggleQr(command.payload?.visible);
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
