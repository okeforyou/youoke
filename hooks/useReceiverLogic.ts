import { useState, useEffect, useRef } from 'react';
import { YouTubePlayer } from 'react-youtube';
import { signInAnonymously } from 'firebase/auth';
import { ref, set, update, onValue } from 'firebase/database';
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
            const newCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
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
                // Mark as Connected once Auth confirms
                setIsConnected(true);
            } catch (e) {
                console.error("Auth Fail", e);
                setDebugMsg("Auth Failed");
            }
        };
        initAuth();

        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

        // Create Room (Host)
        set(roomRef, {
            hostId: 'tv-' + Date.now(),
            isHost: true,
            state: state,
            createdAt: Date.now(),
            mode: mode
        }).then(() => {
            console.log('✅ Room Created:', roomCode);
            // Also set connected here to be sure
            setIsConnected(true);
        }).catch(e => {
            console.error('❌ Room Create Fail:', e);
            setDebugMsg("DB Write Failed");
        });

    }, [roomCode, mode]);

    // --- PRESENCE LISTENER ---
    const [remoteStatus, setRemoteStatus] = useState<'offline' | 'active' | 'background'>('offline');

    useEffect(() => {
        if (!roomCode || !realtimeDb) return;

        const connectedRef = ref(realtimeDb, `rooms/${roomCode}/connected`);
        const unsubscribe = onValue(connectedRef, (snapshot) => {
            const val = snapshot.val();
            if (!val) {
                setRemoteStatus('offline');
                return;
            }

            // Check if any client is active
            const clients = Object.values(val) as any[];
            const hasActive = clients.some(c => c.state === 'active');

            if (hasActive) {
                setRemoteStatus('active');
            } else {
                setRemoteStatus('background');
            }
        });

        return () => unsubscribe();
    }, [roomCode]);

    return {
        roomCode,
        state,
        isConnected, // Receiver connection status
        remoteStatus, // Remote device presence status
        mode,
        setState,
        debugMsg
    };
};
