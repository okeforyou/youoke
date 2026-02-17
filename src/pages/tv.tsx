import Head from 'next/head';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ref, onValue, off, set, update, onDisconnect } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '@/firebase';
// import { useCommandExecutor } from '../modules/tv/hooks/useCommandExecutor'; 
import { SmartTVPlayer } from '../modules/tv/components/SmartTVPlayer';
import { DigitalSignage } from '../modules/tv/components/DigitalSignage';
import { CastState } from '../types/castCommands';

// Reuse hook types or move to shared
import { useCommandExecutor as useCmdExec } from '../hooks/useCommandExecutor';
import { useSystemConfig } from '@/hooks/useSystemConfig';

const TVPage = () => {
    const router = useRouter();
    const { room: roomCodeParam } = router.query;
    const { config } = useSystemConfig();

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
    const [connectedCount, setConnectedCount] = useState(0);

    // 0. Smart Entry Redirect Logic
    useEffect(() => {
        if (!router.isReady) return;

        const ua = window.navigator.userAgent.toLowerCase();
        const isMobileDevice = /iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua);
        // iPad is tricky as it pretends to be Mac, but for our purpose, Tablet/iPad with NO room param -> Dashboard
        const isTablet = /ipad/i.test(ua) || (navigator.maxTouchPoints > 1 && !/windows/i.test(ua));
        const isSmartTV = /smart-tv|smarttv|googletv|appletv|hbbtv|pizazz|tizen|webos|viera|magelink/.test(ua);
        const hasRoomParam = !!router.query.room;

        if (isMobileDevice && !isSmartTV) {
            console.log('📱 Smart Routing: Mobile -> /remote');
            const target = hasRoomParam ? `/remote?room=${router.query.room}` : '/remote';
            router.replace(target);
            return;
        }

        // PC or Tablet entering /tv manually (no room code) likely wants to control
        if (!isSmartTV && !hasRoomParam) {
            console.log('💻 Smart Routing: PC/Tablet -> /dashboard');
            router.replace('/');
            return;
        }
    }, [router.isReady, router.query.room]);

    // 1. Auth & Room Setup
    useEffect(() => {
        // Room Code Logic (Immediate/Sync)
        if (roomCodeParam && typeof roomCodeParam === 'string') {
            setRoomCode(roomCodeParam);
        } else if (!roomCode) {
            // Generate simple 4-digit code for TV ease of use
            const newCode = Math.floor(1000 + Math.random() * 9000).toString();
            setRoomCode(newCode);
        }

        const initAuth = async () => {
            if (auth) {
                try {
                    console.log('📺 TV: Signing in anonymously...');
                    await signInAnonymously(auth);
                    setIsAuthReady(true);
                    console.log('📺 TV: Auth Ready');
                } catch (err) {
                    console.error('📺 TV: Anonymous Auth Failed:', err);
                    // Fallback: Proceed anyway if we want to show signage at least
                    setIsAuthReady(true);
                }
            }
        };
        initAuth();
    }, [roomCodeParam]);

    // 2. Firebase Connection (Listeners)
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

        // Initialize Connection Record
        const tvConnRef = ref(realtimeDb, `rooms/${roomCode}/connected/tv-${Math.random().toString(36).substr(2, 5)}`);
        set(tvConnRef, true).then(() => {
            // Remove on disconnect
            onDisconnect(tvConnRef).remove();
        });

        // Listen for Updates (State) from Host
        const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
        const unsubscribeState = onValue(stateRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.timestamp) {
                console.log('📥 TV: Received Host State Update', data.currentVideo?.title);
                setState(prev => ({
                    ...prev,
                    ...data,
                    // Keep local controls that might be UI specific, but sync core playback
                    controls: {
                        ...prev.controls,
                        ...data.controls
                    }
                }));
            }
        });

        // Listen for Connections (Remotes)
        const connectedRef = ref(realtimeDb, `rooms/${roomCode}/connected`);
        const unsubscribeConnected = onValue(connectedRef, (snapshot) => {
            if (snapshot.exists()) {
                setConnectedCount(Object.keys(snapshot.val()).length);
            } else {
                setConnectedCount(0);
            }
        });

        return () => {
            off(stateRef);
            off(connectedRef);
            unsubscribeState();
            unsubscribeConnected();
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
        // 0 = Ended, 1 = Playing, 2 = Paused
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
        } else if (playerState === 1) {
            // Playing -> Sync State
            if (!state.controls.isPlaying && realtimeDb) {
                await update(ref(realtimeDb, `rooms/${roomCode}/state/controls`), {
                    isPlaying: true
                });
            }
        } else if (playerState === 2) {
            // Paused -> Sync State
            if (state.controls.isPlaying && realtimeDb) {
                await update(ref(realtimeDb, `rooms/${roomCode}/state/controls`), {
                    isPlaying: false
                });
            }
        }
    };

    const handlePlayerError = (e: any) => {
        console.error("TV Player Error:", e);
        // Auto-skip on error
        handlePlayerStateChange(0);
    };

    // Derived State
    const isIdle = !state.currentVideo && (state.queue || []).length === 0 && connectedCount === 0;
    const nextVideo = (state.queue || [])[state.currentIndex + 1] || null;

    if (!roomCode) return <div className="bg-black text-white h-screen flex items-center justify-center">กำลังโหลด TV...</div>;

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
                    images={config.tv?.signageImages}
                    messages={config.tv?.signageMessages}
                    template={config.tv?.template}
                    ads={config.tv?.ads}
                />
            </div>

            {/* Layer 2: Smart Player (Active) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 bg-black ${!isIdle ? 'opacity-100 z-20' : 'opacity-0 z-0 pointer-events-none'}`}>
                <SmartTVPlayer
                    currentVideo={state.currentVideo}
                    nextVideo={nextVideo}
                    queue={state.queue || []}
                    isQueueVisible={state.isQueueVisible || false}
                    notification={state.notification}
                    isPlaying={state.controls.isPlaying}
                    isMuted={state.controls.isMuted}
                    syncMode="remote"
                    isPassive={true}
                    onStateChange={handlePlayerStateChange}
                    onError={handlePlayerError}
                    onReady={(p: any) => {
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
