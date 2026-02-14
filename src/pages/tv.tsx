import Head from 'next/head';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ref, onValue, off, set, update } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '@/firebase';
import { useCommandExecutor } from '../modules/tv/hooks/useCommandExecutor'; // Note: Reusing hook
import { SmartTVPlayer } from '../modules/tv/components/SmartTVPlayer';
import { DigitalSignage } from '../modules/tv/components/DigitalSignage';
import { CastState } from '../types/castCommands';

// Reuse hook types or move to shared
import { useCommandExecutor as useCmdExec } from '../hooks/useCommandExecutor';

const TVPage = () => {
    const router = useRouter();
    const { room: roomCodeParam } = router.query;

    const [roomCode, setRoomCode] = useState<string>('');
    const [state, setState] = useState<CastState>({
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: true }, // Start muted for autoplay policy
    });

    const [isAuthReady, setIsAuthReady] = useState(false);
    const [player, setPlayer] = useState<any>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    // 1. Auth & Room Setup
    useEffect(() => {
        const init = async () => {
            if (auth) {
                await signInAnonymously(auth);
                setIsAuthReady(true);
            }
            // Room Code Logic
            if (roomCodeParam && typeof roomCodeParam === 'string') {
                setRoomCode(roomCodeParam);
            } else {
                // Generate simple 4-digit code for TV ease of use
                const newCode = Math.floor(1000 + Math.random() * 9000).toString();
                setRoomCode(newCode);
            }
        };
        init();
    }, [roomCodeParam]);

    // 2. Firebase Connection (Listeners)
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

        // Ensure Room Exists
        set(roomRef, {
            hostId: 'smart-tv',
            isHost: true,
            type: 'tv',
            state: {
                queue: [],
                currentIndex: 0,
                currentVideo: null,
                controls: { isPlaying: false, isMuted: true },
            },
            updatedAt: Date.now(),
        }).catch(err => console.error("Room init failed:", err));

        // Listen for Updates
        const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
        const unsubscribe = onValue(stateRef, (snapshot) => {
            const data = snapshot.val();
            if (data) setState(data);
        });

        return () => {
            off(stateRef);
            unsubscribe();
            // Optional: Delete room on disconnect? No, keep it for persistence.
        };
    }, [roomCode, isAuthReady]);

    // 3. Command Executor (Sync with Remote)
    useCmdExec({
        roomCode,
        playerRef: player, // Pass player directly
        currentState: state,
        onStateChange: (newState) => setState(prev => ({ ...prev, ...newState })),
    });

    // 4. Auto-Next Logic
    const handlePlayerStateChange = async (playerState: number) => {
        // 0 = Ended
        if (playerState === 0 && state.currentVideo) {
            const nextIndex = state.currentIndex + 1;
            const queue = state.queue || [];

            if (nextIndex < queue.length) {
                // Play Next
                if (realtimeDb) {
                    await update(ref(realtimeDb, `rooms/${roomCode}`), {
                        'state/currentIndex': nextIndex,
                        'state/currentVideo': queue[nextIndex],
                        'state/controls/isPlaying': true
                    });
                }
            } else {
                // End of Queue -> Return to Signage
                if (realtimeDb) {
                    await update(ref(realtimeDb, `rooms/${roomCode}`), {
                        'state/currentVideo': null,
                        'state/controls/isPlaying': false
                    });
                }
            }
        }
    };

    const handlePlayerError = (e: any) => {
        console.error("TV Player Error:", e);
        // Auto-skip on error
        handlePlayerStateChange(0);
    };

    // Derived State
    const isIdle = !state.currentVideo && (state.queue || []).length === 0;
    const nextVideo = (state.queue || [])[state.currentIndex + 1] || null;

    if (!roomCode) return <div className="bg-black text-white h-screen flex items-center justify-center">Loading TV...</div>;

    return (
        <div className="relative h-screen w-screen bg-black overflow-hidden font-sans select-none cursor-none">
            <Head>
                <title>YouOke TV ({roomCode})</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            {/* Layer 1: Digital Signage (Idle) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${isIdle ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <DigitalSignage
                    roomCode={roomCode}
                    // Future: Fetch these from Admin Config
                    images={[
                        'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070',
                        'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=2070',
                        'https://images.unsplash.com/photo-1514525253440-b393452e8d03?q=80&w=2070'
                    ]}
                    messages={[
                        "ยินดีต้อนรับสู่ YouOke Karaoke! 🎤",
                        "โปรโมชั่น: สั่งอาหารครบ 500 บาท รับฟรีเฟรนช์ฟรายส์ 🍟",
                        "สแกนเพื่อเริ่มร้องเพลงได้เลย ->"
                    ]}
                />
            </div>

            {/* Layer 2: Smart Player (Active) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 bg-black ${!isIdle ? 'opacity-100 z-20' : 'opacity-0 z-0 pointer-events-none'}`}>
                <SmartTVPlayer
                    currentVideo={state.currentVideo}
                    nextVideo={nextVideo}
                    isPlaying={state.controls.isPlaying}
                    isMuted={state.controls.isMuted}
                    onStateChange={handlePlayerStateChange}
                    onError={handlePlayerError}
                    onReady={(p) => {
                        setPlayer(p);
                        setIsPlayerReady(true);
                    }}
                />
            </div>

            {/* Debug (Hidden in Prod) */}
            {/* <div className="absolute top-2 left-2 text-xs text-white/50 z-50">Room: {roomCode} | State: {isIdle ? 'Idle' : 'Active'}</div> */}
        </div>
    );
};

export default TVPage;
