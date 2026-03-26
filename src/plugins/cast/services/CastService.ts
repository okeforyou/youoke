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

        // Auto-reconnect on visibility change
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => this.ensureConnection());
        }

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

    /**
     * 🛡️ Ensure Connection (Heartbeat/Reconnect Logic)
     * Called when visibility changes or before sending a command
     */
    public async ensureConnection(): Promise<boolean> {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return false;
        if (!this.roomCode || !realtimeDb || !auth) return false;

        try {
            // 1. Check Auth
            if (!auth.currentUser) {
                console.log('🔐 [CastService] Session lost, re-signing in...');
                await signInAnonymously(auth);
            }

            // 2. Refresh Listeners if needed (Firebase usually handles this, but we can force it if stale)
            // For now, we rely on Firebase's internal keep-alive, but we track presence here
            const statusRef = ref(realtimeDb, `rooms/${this.roomCode}/status`);
            await set(statusRef, {
                lastSeen: Date.now(),
                role: this.role,
                recovered: true
            });

            console.log('📡 [CastService] Connection verified & recovered');
            return true;
        } catch (e) {
            console.error('❌ [CastService] Reconnection failed:', e);
            return false;
        }
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

        console.log("👑 Master Controller Mode: Pushing local state to Monitor...");

        // 1. Dashboard is the BOSS: Push every change in our local store to Firebase
        let lastSyncKey = '';
        this.unsubscribe = usePlayerStore.subscribe((state, prevState) => {
            if (this.isProcessingSync) return; // Prevent loop if we're updating from monitor progress

            // A. Full State Sync for heavy changes (Queue, Play/Pause, Video Change)
            const syncKey = `${state.currentSource}-${state.isPlaying}-${state.queue.length}-${state.layoutMode}-${state.currentIndex}`;
            if (syncKey !== lastSyncKey) {
                lastSyncKey = syncKey;
                this.syncMasterState(state);
            }

            // B. Manual Seek Detection (Significant jump not caused by progress reporting)
            if (Math.abs(state.currentTime - prevState.currentTime) > 5) {
                console.log('👆 User manual seeked to:', state.currentTime);
                this.sendCommand({ type: 'SEEK', payload: { time: state.currentTime } });
            }
        });

        // 2. Dashboard listens to progress (CurrentTime) reported by the Monitor
        const controlsRef = ref(realtimeDb, `rooms/${this.roomCode}/state/controls`);
        this.stateListenerOff = onValue(controlsRef, (snapshot) => {
            const val = snapshot.val();
            if (val && !usePlayerStore.getState().isPlaying) {
                // Only sync time back if we are the host and need to see progress
                this.isProcessingSync = true;
                usePlayerStore.getState().syncRemoteTime(val.currentTime || 0);
                if (val.duration) usePlayerStore.getState().setDuration(val.duration);
                this.isProcessingSync = false;
            } else if (val) {
                // Just sync the time for the progress bar
                usePlayerStore.getState().syncRemoteTime(val.currentTime || 0);
            }
        });

        // Initial Push
        this.syncMasterState(usePlayerStore.getState());
    }

    private setupMonitorSync() {
        if (!this.roomCode || !realtimeDb) return;

        console.log("📺 Passive Monitor Mode: Following Dashboard commands...");

        // 1. Monitor listens to the Master State (Queue/Video) from the Dashboard
        const stateRef = ref(realtimeDb, `rooms/${this.roomCode}/state`);
        let syncTimeout: NodeJS.Timeout | null = null;

        this.stateListenerOff = onValue(stateRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // 🛡️ Debounce/Safety: If transitioning (source is null), wait a bit before showing 'Waiting' screen
            // This prevents flickering between songs
            if (!data.currentSource) {
                if (syncTimeout) return;
                syncTimeout = setTimeout(() => {
                    const latestData = usePlayerStore.getState();
                    // Only sync null if it's still null after 1.5 seconds
                    if (!latestData.currentSource) {
                        console.log('📡 Monitor: Entering Idle state (Verified)');
                        this.applyMonitorState(data);
                    }
                    syncTimeout = null;
                }, 1500);
                return;
            }

            if (syncTimeout) {
                clearTimeout(syncTimeout);
                syncTimeout = null;
            }

            console.log('📡 Monitor: Syncing with Dashboard state...');
            this.applyMonitorState(data);
        });

        // 2. Monitor reports its playback progress back to the Dashboard
        this.pollInterval = setInterval(() => {
            this.syncProgressToFirebase();
        }, 1000);

        // 3. Monitor listens for direct commands (SEEK, NEXT, etc.)
        this.startCommandListener();
    }

    private applyMonitorState(data: any) {
        usePlayerStore.setState((prev) => ({
            ...prev,
            queue: data.queue || [],
            currentIndex: data.currentIndex ?? 0,
            currentVideo: data.currentVideo || null,
            currentSource: data.currentSource || null,
            isPlaying: data.isPlaying ?? false,
            layoutMode: data.layoutMode || 'split',
        }));
    }

    private syncMasterState(store: any) {
        if (!this.roomCode || !realtimeDb || this.role !== 'host') return; // ONLY Dashboard writes Master State

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
        if (!this.roomCode || !realtimeDb) {
            console.warn('⚠️ [CastService] Send failed: No roomCode or DB');
            return;
        }

        // 🛡️ Pre-flight check: ensure we are connected before pushing
        await this.ensureConnection();

        console.log('📡 Sending Remote Command:', command.type);
        const commandsRef = ref(realtimeDb, `rooms/${this.roomCode}/commands`);
        const newCommandRef = push(commandsRef);
        
        await set(newCommandRef, sanitizeForFirebase({
            command,
            status: 'pending',
            timestamp: Date.now(),
            senderId: auth?.currentUser?.uid || 'guest'
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
                case 'SEEK':
                    if (typeof command.payload?.time === 'number') store.seekTo(command.payload.time);
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
