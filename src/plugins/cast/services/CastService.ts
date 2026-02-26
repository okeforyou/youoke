import { ref, off, get, set, update, push, child, remove, onChildAdded, onValue, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../../../firebase';
import { usePlayerStore } from '../../../modules/player/stores/usePlayerStore';
import { Video } from '../../../modules/player/types';
import { sanitizeForFirebase } from '../../../utils/firebase';

export class CastService {
    private roomCode: string | null = null;
    private unsubscribe: (() => void) | null = null;
    private pollInterval: NodeJS.Timeout | null = null;
    private commandListenerOff: (() => void) | null = null;
    private role: 'host' | 'monitor' = 'host';
    private stateListenerOff: (() => void) | null = null;
    private processedCommandIds = new Set<string>();
    private isProcessingSync = false; // 🔒 Sync Lock to prevent loops

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

        // ROLE DIFFERENTIATION
        if (role === 'host') {
            this.setupHostSync();
        } else {
            this.setupMonitorSync();
        }

        // BOTH roles listen for commands (Monitor might signal 'NEXT' to Host)
        this.startCommandListener();

        return this.roomCode;
    }

    public cleanup() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.unsubscribe) this.unsubscribe();
        if (this.commandListenerOff) this.commandListenerOff();
        if (this.stateListenerOff) this.stateListenerOff();

        if (this.roomCode && realtimeDb) {
            off(ref(realtimeDb, `rooms/${this.roomCode}/commands`));
            off(ref(realtimeDb, `rooms/${this.roomCode}/state`));
            off(ref(realtimeDb, `rooms/${this.roomCode}/state/controls`));
        }

        this.roomCode = null;
        this.unsubscribe = null;
        console.log('🛑 CastService Cleaned Up');
    }

    private generateRoomCode(): string {
        return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    }

    private async createRoomIfNotExists(roomCode: string) {
        if (!realtimeDb) return;

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

    private setupHostSync() {
        if (!this.roomCode || !realtimeDb) return;

        console.log("🎮 Controller Mode: Listening to Receiver (Monitor) state...");

        // 1. Controller listens to its own store for USER INTENTS and forwards them as COMMANDS
        this.unsubscribe = usePlayerStore.subscribe((state, prevState) => {
            if (this.role !== 'host' || this.isProcessingSync) return; // 🔒 Skip if update came from Firebase

            // A. Forward Play/Pause intent
            if (state.isPlaying !== prevState.isPlaying) {
                console.log('👆 User toggled Play/Pause');
                this.sendCommand({ type: state.isPlaying ? 'PLAY' : 'PAUSE' });
            }

            // B. Forward Next/Previous intent (Index change)
            if (state.currentIndex !== prevState.currentIndex && state.queue.length === prevState.queue.length) {
                console.log('👆 User changed track index');
                this.sendCommand({ type: 'SKIP_TO', payload: { index: state.currentIndex } });
            }

            // C. Forward ADD_TO_QUEUE intent (Queue grew)
            // Important: We only send the NEW item to the Receiver
            if (state.queue.length > prevState.queue.length) {
                const addedItem = state.queue[state.queue.length - 1];
                console.log('👆 User added song to queue:', addedItem.title);
                this.sendCommand({ type: 'ADD_TO_QUEUE', payload: { video: addedItem } });

                // Rollback local queue to previous state immediately 
                // because the MASTER (Monitor) will update our queue shortly after processing the command.
                // This prevents duplicate visual entries during the sync lag.
                this.isProcessingSync = true;
                usePlayerStore.setState({ queue: prevState.queue });
                this.isProcessingSync = false;
            }
        });

        // 2. Controller listens to the Master State (Queue/Video) from the Receiver
        const stateRef = ref(realtimeDb, `rooms/${this.roomCode}/state`);
        this.stateListenerOff = onValue(stateRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // 🔒 Start Sync Lock: Don't let our 'subscribe' block react to this update
            this.isProcessingSync = true;
            console.log('📡 Dashboard: Mirroring Monitor state...');

            usePlayerStore.setState((prev) => ({
                ...prev,
                queue: data.queue || [],
                currentIndex: data.currentIndex ?? 0,
                currentVideo: data.currentVideo || null,
                currentSource: data.currentSource || null,
                isPlaying: data.isPlaying ?? false,
                layoutMode: data.layoutMode || 'split',
            }));

            this.isProcessingSync = false; // 🔓 Release lock
        });

        // 2. Controller also listens for playback progress for the seekbar
        const controlsRef = ref(realtimeDb, `rooms/${this.roomCode}/state/controls`);
        onValue(controlsRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                usePlayerStore.getState().syncRemoteTime(val.currentTime || 0);
                if (val.duration) usePlayerStore.getState().setDuration(val.duration);
            }
        });
    }

    private setupMonitorSync() {
        if (!this.roomCode || !realtimeDb) return;

        console.log("📺 Receiver Mode: Master Player active. Reporting state to Firebase...");

        // 1. Receiver is the MASTER: Report its local store changes to Firebase
        let lastSyncKey = '';
        this.unsubscribe = usePlayerStore.subscribe((state) => {
            const syncKey = `${state.currentSource}-${state.isPlaying}-${state.queue.length}-${state.layoutMode}`;
            if (syncKey !== lastSyncKey) {
                lastSyncKey = syncKey;
                this.syncMasterState(state);
            }
        });

        // 2. Poll Progress: Report Time/Duration back to Controller
        this.pollInterval = setInterval(() => {
            this.syncProgressToFirebase();
        }, 1000);
    }

    private syncMasterState(store: any) {
        if (!this.roomCode || !realtimeDb || this.role !== 'monitor') return; // ONLY Monitor writes Master State

        const stateRef = ref(realtimeDb, `rooms/${this.roomCode}/state`);
        const masterState = {
            queue: store.queue || [],
            currentIndex: store.currentIndex ?? 0,
            currentVideo: store.currentVideo || null,
            currentSource: store.currentSource || null,
            isPlaying: store.isPlaying ?? false,
            layoutMode: store.layoutMode || 'split',
            lastUpdated: Date.now()
        };

        console.log('📡 Host: Syncing Master State to Firebase');
        update(stateRef, sanitizeForFirebase(masterState)).catch(e => console.warn('Host Sync failed', e));
    }

    private syncProgressToFirebase() {
        if (!this.roomCode || !realtimeDb || this.role !== 'monitor') return;

        const store = usePlayerStore.getState();
        const progressState = {
            currentTime: store.currentTime || 0,
            duration: store.duration || 0,
            lastUpdated: Date.now()
        };

        // Push to nested 'controls' for progress
        update(ref(realtimeDb, `rooms/${this.roomCode}/state/controls`), sanitizeForFirebase(progressState)).catch(e => console.warn('Monitor Sync failed', e));
    }

    public async sendCommand(command: { type: string; payload?: any }) {
        if (!this.roomCode || !realtimeDb) return;
        console.log('📡 Sending Remote Command:', command.type);
        const commandsRef = ref(realtimeDb, `rooms/${this.roomCode}/commands`);
        const newCommandRef = push(commandsRef);
        await set(newCommandRef, sanitizeForFirebase({
            command,
            status: 'pending',
            timestamp: Date.now()
        }));
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
                        this.syncMasterState(usePlayerStore.getState());

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
                        this.syncMasterState(usePlayerStore.getState());
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
