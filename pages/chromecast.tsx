
import React, { useEffect, useState, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import UnifiedPlayerInterface from '../components/UnifiedPlayerInterface';
import { ref, onValue } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { realtimeDb, auth } from '../firebase';
import Script from 'next/script';
import Image from 'next/image';

// ========================================
// Chromecast Receiver Page
// ========================================
// 1. Optimized for Cast (No QR Code initially)
// 2. Waits for Sender to provide Room Code
// 3. Fallback: Shows Room Code if no sender message received after timeout
// ========================================

interface QueueVideo {
    videoId: string;
    title: string;
    author?: string;
    key: number;
    videoThumbnails?: Array<{ url: string; quality: string }>;
}

interface RoomState {
    queue: QueueVideo[];
    currentIndex: number;
    currentVideo: QueueVideo | null;
    controls: {
        isPlaying: boolean;
        isMuted: boolean;
    };
}

export default function ChromecastReceiverPage() {
    // State
    const [roomCode, setRoomCode] = useState<string>('');
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Status Logic
    const [status, setStatus] = useState<'CONNECTING' | 'WAITING_FOR_SENDER' | 'READY'>('CONNECTING');

    // Remote State (from Firebase)
    const [remoteState, setRemoteState] = useState<RoomState | null>(null);

    // Local UI State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false); // Start unmuted, but player might auto-mute

    // Refs
    const playerRef = useRef<YouTube>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Player Options
    const opts: YouTubeProps['opts'] = React.useMemo(() => ({
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            disablekb: 1,
            enablejsapi: 1,
            // mute: 1, // Start muted to allow autoplay ? No, let's try unmuted first
        },
    }), []);

    // =============================================
    // 1. INITIALIZATION & CAST RECEIVER
    // =============================================
    useEffect(() => {
        // Anonymous Auth
        const login = async () => {
            try {
                if (!auth.currentUser) await signInAnonymously(auth);
                console.log('✅ Chromecast: Signed in');
                setIsAuthReady(true);
            } catch (error) {
                console.error('❌ Chromecast: Auth failed:', error);
            }
        };
        login();

        // Start timeout to show "Waiting" status clearly
        connectionTimeoutRef.current = setTimeout(() => {
            if (!roomCode) {
                console.log('⚠️ No sender message received yet (5s).');
                // We keep WAITING state, but UI can show "Waiting for sender..."
                setStatus('WAITING_FOR_SENDER');
            }
        }, 5000);

        // Initialize Cast Receiver
        const interval = setInterval(() => {
            const cast = (window as any).cast;
            if (cast && cast.framework) {
                clearInterval(interval);
                console.log('📺 CAST: Framework detected, initializing receiver...');

                try {
                    const context = cast.framework.CastReceiverContext.getInstance();
                    const CUSTOM_NAMESPACE = 'urn:x-cast:com.okeforyou.cast';

                    context.addCustomMessageListener(CUSTOM_NAMESPACE, (event: any) => {
                        console.log('📺 CAST: Message received:', event.data);
                        let data = event.data;
                        if (typeof data === 'string') {
                            try { data = JSON.parse(data); } catch (e) { }
                        }

                        if (data.type === 'JOIN_ROOM' && data.payload?.roomCode) {
                            const code = data.payload.roomCode;
                            console.log('📺 CAST: Creating/Joining Room from Sender:', code);

                            // Clear timeout since we got a valid code
                            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);

                            setRoomCode(code);
                            setStatus('READY');
                        }
                    });

                    // Start Receiver
                    const options = new cast.framework.CastReceiverOptions();
                    options.disableIdleTimeout = true;
                    context.start(options);
                    // setStatus('WAITING_FOR_SENDER'); // Don't override if already READY?
                    console.log('📺 CAST: Receiver Context Started');

                } catch (e) {
                    console.error('📺 CAST: Initialization failed:', e);
                }
            }
        }, 500);

        // Allow manual testing via URL query param
        const urlParams = new URLSearchParams(window.location.search);
        const testRoomCode = urlParams.get('roomCode');
        if (testRoomCode) {
            console.log('🧪 TESTING MODE: Using room code from URL:', testRoomCode);
            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
            setRoomCode(testRoomCode);
            setStatus('READY');
        }

        return () => {
            clearInterval(interval);
            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        }
    }, []);

    // =============================================
    // 2. FIREBASE REAL-TIME SYNC
    // =============================================
    useEffect(() => {
        if (!roomCode || !realtimeDb || !isAuthReady) return;

        console.log('📡 Chromecast: Subscribing to room:', roomCode);
        const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);

        const unsubscribe = onValue(stateRef, (snapshot) => {
            const state = snapshot.val() as RoomState | null;

            if (state) {
                // console.log('📨 Chromecast: State received', state.currentVideo?.title);
                setRemoteState(state);
            }
        });

        return () => unsubscribe();
    }, [roomCode, isAuthReady]);

    // =============================================
    // 3. PLAYER SYNC (Visual Only mostly, relies on onStateChange for robust?)
    // No, here we are just a DISPLAY. The Logic comes from Sender or Cloud Function? 
    // Actually, in the current architecture, the Primary Control (Sender) sends commands to Firebase.
    // The Receiver listens to Firebase and updates Player.
    // =============================================
    useEffect(() => {
        if (!playerRef.current || !remoteState) return;

        // This effect can be used for PLAY/PAUSE sync
        // Seek/Time sync usually needs a separate interval

        const internalPlayer = playerRef.current.getInternalPlayer();
        if (!internalPlayer) return;

        if (remoteState.controls?.isPlaying) {
            // internalPlayer.playVideo();
            setIsPlaying(true);
        } else {
            // internalPlayer.pauseVideo();
            setIsPlaying(false);
        }

    }, [remoteState?.controls?.isPlaying]);


    // Derived values
    const videoId = remoteState?.currentVideo?.videoId || '';
    const queue = remoteState?.queue || [];
    const currentVideo = remoteState?.currentVideo;

    // =============================================
    // RENDER: IDLE / WAITING SCREEN
    // =============================================
    if (!videoId) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
                {/* Ambient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0" />

                {/* Script Loader */}
                <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" />

                <div className="z-10 text-center space-y-8 animate-fade-in flex flex-col items-center">
                    {/* Logo/Icon */}
                    <div className="w-40 h-40 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse backdrop-blur-md border border-white/10">
                        {/* Simple Cast Icon SVG */}
                        <svg className="w-20 h-20 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <div>
                        <h1 className="text-5xl font-bold mb-4 tracking-tight">Ready to Cast</h1>
                        <p className="text-white/50 text-2xl font-light">Select a song on your device to start</p>
                    </div>

                    {/* Room Code Status (Only show if connected but no video) */}
                    {roomCode && (
                        <div className="mt-12 px-8 py-4 bg-white/5 rounded-2xl border border-white/10 inline-block backdrop-blur-sm">
                            <p className="text-sm text-white/40 uppercase tracking-widest mb-2">Connected to Room</p>
                            <p className="text-4xl font-mono font-bold tracking-widest text-[#ef4444]">{roomCode}</p>
                        </div>
                    )}

                    {/* Waiting Status */}
                    {!roomCode && (
                        <div className="mt-12">
                            <p className="text-white/30 text-base animate-pulse flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Waiting for connection...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // =============================================
    // RENDER: PLAYER SCREEN
    // =============================================
    return (
        <div className="h-screen w-screen bg-black overflow-hidden relative">
            <Script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js" strategy="afterInteractive" />

            {/* Background Player */}
            <div className="absolute inset-0 z-0">
                <YouTube
                    videoId={videoId}
                    opts={opts}
                    className="w-full h-full pointer-events-none" // Disable interaction on iframe
                    ref={playerRef}
                    onEnd={() => {
                        // Handle Flow: Auto-Next? 
                        // The Primary Controller (Host/Sender) should detect end and skip?
                        // OR we should have logic here. 
                        // For now, let's keep it dumb display.
                        console.log('📺 Chromecast: Video Ended');
                    }}
                    onStateChange={(event) => {
                        // Sync state back? 
                        // No, Receiver should probably be 'dumb' logic wise if Sender is 'smart'.
                        // But for now we just display.
                    }}
                />
            </div>

            {/* UI Overlay */}
            {/* UI Overlay */}
            <UnifiedPlayerInterface
                videoId={videoId}
                queue={queue}
                isPlaying={isPlaying}
                isMuted={isMuted}
                onPlayPause={() => { }}
                onNext={() => { }}
                onPrevious={() => { }}
                onMuteToggle={() => { }}
                isReceiver={true}
                roomCode={roomCode}
                hidePlaybackControls={true}
                forceShowQueue={true}
            />
        </div>
    );
}
