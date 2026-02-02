import { useState, useEffect, useRef } from 'react';
import { YouTubePlayer } from 'react-youtube';
import { signInAnonymously } from 'firebase/auth';
import { ref, set, get, onValue, Unsubscribe } from 'firebase/database';
import { auth, realtimeDb } from '../firebase';
import { CastState } from '../types/castCommands';
import { useCommandExecutor } from './useCommandExecutor';

export const useReceiverLogic = (playerRef: YouTubePlayer | null) => {
    const [roomCode, setRoomCode] = useState<string>('');
    const [state, setState] = useState<CastState>({
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: true },
    });
    const [isConnected, setIsConnected] = useState(false);
    const [mode, setMode] = useState<'CAST' | 'WEB'>('WEB');
    const [debugMsg, setDebugMsg] = useState('');

    // Check if we are in a Cast Environment
    const isCastEnvironment = useRef(false);
    const castContextRef = useRef<any>(null); // To hold CastReceiverContext

    // --- GOOGLE CAST LOGIC ---
    useEffect(() => {
        // Wait for Cast SDK to be ready
        const initCast = () => {
            // @ts-ignore - Cast is injected by external script
            if (!window.cast || !window.cast.framework) return;

            try {
                console.log('📺 Initializing Cast Receiver Context...');
                setMode('CAST');
                isCastEnvironment.current = true;
                setIsConnected(true);

                // @ts-ignore
                const context = window.cast.framework.CastReceiverContext.getInstance();
                castContextRef.current = context; // Save ref

                // Options
                // @ts-ignore
                const options = new window.cast.framework.CastReceiverOptions();
                options.disableIdleTimeout = true;

                // --- CUSTOM MESSAGE BUS ---
                const NAMESPACE = 'urn:x-cast:com.youoke.cast';

                context.addCustomMessageListener(NAMESPACE, (event: any) => {
                    console.log('📩 Received Cast Message:', event.data);
                    const command = event.data;

                    if (command.type === 'UPDATE_PLAYLIST') {
                        // Sender pushed a new playlist/state
                        const newState = command.payload;
                        setState(prev => ({ ...prev, ...newState }));
                    }
                });

                // Start
                context.start(options);
                setDebugMsg('Cast Receiver Started');
            } catch (e) {
                console.error('Cast Init Error:', e);
                setDebugMsg('Cast Init Failed');
            }
        };

        // Poll for cast framework
        const interval = setInterval(() => {
            // @ts-ignore
            if (window.cast && window.cast.framework) {
                initCast();
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);

    }, []);

    // --- DETECT MODE (Fallback for Web) ---
    useEffect(() => {
        // We ALWAYS generate a room code now, to allow Hybrid Mode (Phone joins Cast session via Web/Firebase)
        // In the future, we might want to sync this with the Cast Session ID, but random is fine for now.
        if (!roomCode) {
            const newCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setRoomCode(newCode);
        }
    }, []);

    // --- BROADCAST STATE ---
    // Whenever state or roomCode changes, tell all connected Senders
    useEffect(() => {
        if (mode !== 'CAST' || !castContextRef.current) return;

        const NAMESPACE = 'urn:x-cast:com.youoke.cast';
        const payload = {
            type: 'RECEIVER_STATE',
            roomCode: roomCode, // <--- CRITICAL: Send Room Code to Sender
            queue: state.queue,
            currentIndex: state.currentIndex,
            currentVideoId: state.currentVideo?.videoId,
            controls: state.controls
        };

        try {
            console.log('📡 Broadcasting State to Senders:', payload);
            castContextRef.current.sendCustomMessage(NAMESPACE, undefined, payload); // undefined = broadcast to all
        } catch (e) {
            console.error('Broadcast Error:', e);
        }
    }, [state, roomCode, mode]);

    // --- FIREBASE LOGIC (Hybrid - Sync for Web Clients) ---
    useEffect(() => {
        if (!roomCode || !realtimeDb) return;

        let cleanup: Unsubscribe | undefined;

        const setupFirebase = async () => {
            // 0. Ensure Auth first!
            if (!auth.currentUser) {
                try {
                    console.log('🔐 TV: Signing in anonymously...');
                    await signInAnonymously(auth);
                    console.log('✅ TV: Signed in as', auth.currentUser?.uid);
                } catch (e) {
                    console.error('❌ TV: Auth failed', e);
                    return;
                }
            }

            const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

            // 1. INITIALIZE ROOM (Create if not exists)
            try {
                const snapshot = await get(roomRef);
                if (!snapshot.exists()) {
                    console.log('✨ Creating new room in Firebase:', roomCode);
                    // Set initial state
                    await set(roomRef, {
                        state: {
                            queue: [],
                            currentIndex: 0,
                            currentVideo: null,
                            controls: { isPlaying: false, isMuted: false } // Default Unmuted so Sync Loop tries to enable audio
                        },
                        hostId: auth.currentUser?.uid || 'anonymous-tv',
                        createdAt: Date.now(),
                        lastConnected: Date.now()
                    });
                    console.log('✅ Room created successfully');
                } else {
                    console.log('✅ Reconnected to existing room:', roomCode);
                }
            } catch (e) {
                console.error("❌ Room Creation Error (Permission/Network):", e);
            }

            // 2. LISTEN FOR STATE UPDATES FROM FIREBASE (Crucial for remote control)
            const unsubscribe = onValue(roomRef, (snapshot: any) => {
                const data = snapshot.val();
                if (data && data.state) {
                    setState(prev => {
                        // Deep check equality to prevent re-renders (Optional but good)
                        if (JSON.stringify(prev) === JSON.stringify(data.state)) {
                            return prev;
                        }
                        return { ...prev, ...data.state };
                    });
                }
            });

            cleanup = unsubscribe;
        };

        setupFirebase();

        return () => {
            if (cleanup) cleanup();
        };
    }, [roomCode]); // Removed mode/state dependencies to avoid re-subscription loops



    // --- COMMAND EXECUTOR ---
    // Enable for BOTH Web and Cast modes to support QR Code guests
    useCommandExecutor({
        roomCode: roomCode || '',
        playerRef,
        currentState: state,
        onStateChange: async (newState) => {
            console.log('🔄 Command Executed -> Updating Firebase:', newState);
            // We DO NOT set local state here immediately.
            // We rely on CommandExecutor to update Firebase, and our Listener (above) to update Local State.
            // This ensures Single Source of Truth.
        },
        onStopSession: () => {
            console.log('🛑 session stopped');
            setState({
                queue: [],
                currentIndex: 0,
                currentVideo: null,
                controls: { isPlaying: false, isMuted: true },
            });
            setRoomCode(''); // Optional: clear room code to force re-join or idle
            // window.location.reload(); // Hard reset if needed, but state clear is better
        }
    });

    return {
        roomCode,
        state,
        isConnected,
        mode,
        setState,
        debugMsg
    };
};
