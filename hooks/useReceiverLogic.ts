import { useState, useEffect, useRef } from 'react';
import { YouTubePlayer } from 'react-youtube';
import { signInAnonymously } from 'firebase/auth';
import { ref, set, update } from 'firebase/database';
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

        const initAuth = async () => {
            try {
                await signInAnonymously(auth);
            } catch (e) { console.error(e); }
        };
        initAuth();

        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

        // Create Room (Host) - Only if not exists/first time?
        // Actually, preventing overwrite on every render is key, but typical use case is mount.
        // We added a check to only set if we are sure (or just rely on useCommandExecutor for updates)
        // But here we set initial state.

        // Listeners are handled elsewhere.

        // SYNC STATE BACK TO FIREBASE
        // Whenever state changes (e.g. Video Ends, AutoNext), update DB so Controller knows.
        if (state) {
            update(roomRef, { state }).catch(e => console.error("State Sync Error:", e));
        }

    }, [roomCode, mode, state]);

    // --- COMMAND EXECUTOR ---
    // Enable for BOTH Web and Cast modes to support QR Code guests
    useCommandExecutor({
        roomCode: roomCode || '',
        playerRef,
        currentState: state,
        onStateChange: (newState) => {
            console.log('🔄 State Updated via Command:', newState);
            setState(prev => ({ ...prev, ...newState }));
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
