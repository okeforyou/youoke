import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { realtimeDb } from '../firebase';
import { ref, set, push, onValue, remove, onDisconnect } from 'firebase/database';
import {
    PlayIcon, PauseIcon, ForwardIcon, BackwardIcon,
    MagnifyingGlassIcon, PlusIcon, CheckIcon,
    SignalIcon, SignalSlashIcon, DevicePhoneMobileIcon,
    ArrowsPointingOutIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { DebounceInput } from 'react-debounce-input';
import axios from 'axios';

// Types
type RemoteState = {
    isPlaying: boolean;
    videoId: string;
    title: string;
    queue?: any[];
    currentIndex?: number;
    currentVideo?: any;
};

type SearchResult = {
    videoId: string;
    title: string;
    thumbnail: string;
    duration?: string;
};

export default function RemotePage() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string>('');
    const [status, setStatus] = useState<RemoteState | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Sync Suppression
    const lastInteractionRef = useRef<number>(0);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [addedId, setAddedId] = useState<string | null>(null);

    // New Features State
    const [searchType, setSearchType] = useState<'song' | 'karaoke'>('song');

    // Initial Load - Get Session ID from URL
    useEffect(() => {
        if (router.isReady) {
            const { session, room } = router.query;
            // Support both ?session= and ?room=
            const code = session || room;
            if (code && typeof code === 'string') {
                setSessionId(code);
            }
        }
    }, [router.isReady, router.query]);

    // Connect to Firebase & Auth (Failover: REST API Polling)
    useEffect(() => {
        if (!sessionId) return;

        console.log('🔗 Remote: Initializing connection to', sessionId);

        let isActive = true;

        // 1. Sign in anonymously (required for write access if rules enforce it)
        const initAuth = async () => {
            // Dynamic import auth to avoid SSR issues if needed
            const { auth } = await import('../firebase');
            const { signInAnonymously } = await import('firebase/auth');
            if (auth && !auth.currentUser) {
                try {
                    await signInAnonymously(auth);
                    console.log('✅ Remote: Signed in anonymously');
                } catch (e) {
                    console.error('❌ Remote: Auth failed', e);
                }
            }
        };
        initAuth();

        // 2. Poll for room state (REST API)
        const pollRoomInterval = setInterval(async () => {
            if (!isActive) return;

            try {
                // Get DB URL dynamically
                const { realtimeDb } = await import('../firebase');
                const dbURL = realtimeDb?.app?.options?.databaseURL;

                if (!dbURL) return;

                const response = await fetch(`${dbURL}/rooms/${sessionId}/state.json`);
                if (response.ok) {
                    const data = await response.json();
                    if (data) {
                        // SYNC SUPPRESSION: Ignore isPlaying update if user interacted recently
                        const isInteracting = Date.now() - lastInteractionRef.current < 2000;

                        setStatus(prev => {
                            if (!prev) return data;
                            // If interacting, keep optimistic isPlaying, update everything else
                            if (isInteracting && prev) {
                                return { ...data, isPlaying: prev.isPlaying };
                            }
                            return data;
                        });

                        setIsConnected(true);
                    } else {
                        // Room might not exist or state is empty
                        setIsConnected(false);
                    }
                } else {
                    // console.warn('⚠️ Remote: Poll failed', response.status);
                    setIsConnected(false);
                }
            } catch (e) {
                console.error('❌ Remote: Poll error', e);
                setIsConnected(false);
            }
        }, 1000);

        // Realtime Listener (Optional if Polling covers it, but good for speed)
        const stateRef = ref(realtimeDb, `rooms/${sessionId}/state`);
        const unsubscribe = onValue(stateRef, (snapshot) => {
            const val = snapshot.val();
            console.log('🔥 [Remote] Firebase State Update:', val);
            if (val) {
                // SYNC SUPPRESSION match polling logic
                const isInteracting = Date.now() - lastInteractionRef.current < 2000;
                setStatus(prev => {
                    if (isInteracting && prev) {
                        return { ...val, isPlaying: prev.isPlaying };
                    }
                    return val;
                });
            }
        });

        return () => {
            isActive = false;
            clearInterval(pollRoomInterval);
            unsubscribe();
        };
    }, [sessionId, realtimeDb]);

    // Presence Logic: Register as "Connected" with Status (Active/Background)
    useEffect(() => {
        if (!sessionId || !isConnected || !realtimeDb) return;

        let clientId = localStorage.getItem('remote_client_id');
        if (!clientId) {
            clientId = Math.random().toString(36).substring(2, 10);
            localStorage.setItem('remote_client_id', clientId);
        }

        const presenceRef = ref(realtimeDb, `rooms/${sessionId}/connected/${clientId}`);

        // Helper to update presence
        const updatePresence = (state: 'active' | 'background') => {
            set(presenceRef, {
                connectedAt: Date.now(),
                userAgent: navigator.userAgent,
                state: state
            }).catch(e => console.error('❌ Presence update failed', e));
        };

        // Initial Registration
        console.log('🔌 Remote: Starting presence registration for', clientId);
        updatePresence('active');
        console.log('✅ Remote: Presence registered successfully');

        // Auto-remove on disconnect
        onDisconnect(presenceRef).remove();

        // Listen for Visibility Change (Screen Off / Background)
        const handleVisibilityChange = () => {
            const state = document.visibilityState === 'hidden' ? 'background' : 'active';
            console.log(`💡 Remote: Visibility changed to ${state}`);
            updatePresence(state);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Anti-Sleep: Request Wake Lock
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    const wakeLock = await (navigator as any).wakeLock.request('screen');
                    console.log('💡 Remote: Screen Wake Lock active');
                } catch (err) {
                    console.warn('⚠️ Remote: Wake Lock failed', err);
                }
            }
        };
        requestWakeLock();

        // Re-request wake lock when becoming active
        if (document.visibilityState === 'visible') {
            requestWakeLock();
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Optional: remove presence on unmount? 
            // Better to let onDisconnect handle it in case of refresh vs close.
            // But if we perform a clean unmount (e.g. navigation), we might want to remove.
            // For now, let's keep it robust.
        };
    }, [sessionId, isConnected, realtimeDb]);

    // Wrapper to use the shared utility
    const handleSendCommand = async (type: string, payload: any = {}) => {
        if (!sessionId) return;

        try {
            // Import dynamically to ensure we get the latest singleton
            const { sendCommand } = await import('../utils/castCommands');

            // Map simple types to CastCommand strict types
            // @ts-ignore - Temporary loose typing for quick migration
            await sendCommand(sessionId, { type, payload });
            console.log('✅ Remote: Command sent', type);
        } catch (e) {
            console.error('Failed to send command:', e);
            setErrorMessage('เชื่อมต่อล้มเหลว กำลังลองใหม่...');
        }
    };

    // Alias for compatibility with existing JSX calls
    const sendCommand = handleSendCommand;

    // Search Handler
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setErrorMessage('');
        try {
            // Match logic from SearchResultGrid.tsx: Prepend "karaoke" (quoted)
            // Match logic from SearchResultGrid.tsx: Prepend "karaoke" (quoted)
            // Use exact same logic as Host
            const prefix = searchType === 'karaoke' ? '"karaoke" ' : '';
            const effectiveQuery = prefix + query;

            // Reusing existing API
            const res = await axios.get('/api/search', { params: { q: effectiveQuery } });

            let data: any[] = [];
            if (res.data && res.data.data) {
                data = res.data.data;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }

            // Client-side filtering to match SearchResultGrid.tsx
            // 1. Filter out Unknown authors (Critical for quality)
            // 1. Filter out Unknown authors (Critical for quality)
            data = data.filter((video: any) => {
                if (!video.author || video.author.toLowerCase().includes('unknown')) return false;
                return true;
            });

            // 2. Filter for Karaoke mode (Strict match to Host)
            if (searchType === 'karaoke') {
                data = data.filter((video: any) => {
                    if (!video.title) return false;
                    const lcTitle = video.title.toLowerCase();
                    return (
                        lcTitle.includes("karaoke") ||
                        lcTitle.includes("beat") ||
                        lcTitle.includes("คาราโอเกะ")
                    );
                });
            }

            setSearchResults(data);
        } catch (e: any) {
            console.error('Search failed', e);
            setErrorMessage(e.response?.data?.error || e.message || 'ค้นหาล้มเหลว');
        } finally {
            setIsSearching(false);
        }
    };

    // Auto-refresh search when Toggle changes
    useEffect(() => {
        if (searchQuery.trim()) {
            handleSearch(searchQuery);
        }
    }, [searchType]);

    const handleAddQueue = (video: SearchResult) => {
        // Send ADD_TO_QUEUE with correct payload structure
        // Payload must contain { video: QueueVideo }
        // We map SearchResult to QueueVideo format
        const queueVideo = {
            videoId: video.videoId,
            title: video.title,
            author: 'YouTube', // Search result might not have channel title, default to YouTube
            key: Date.now(), // Unique key for React lists
            addedBy: {
                uid: 'remote-user', // Placeholder, could be real auth ID
                displayName: 'Mobile User',
                isGuest: true
            }
        };

        sendCommand('ADD_QUEUE', { video: queueVideo });
        setAddedId(video.videoId);
        setTimeout(() => setAddedId(null), 2000);
    };

    // Login Screen
    if (!sessionId) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <DevicePhoneMobileIcon className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">เชื่อมต่อกับห้อง</h1>
                <p className="text-gray-400 mb-6 text-center">กรอกรหัส PIN ที่แสดงบนหน้าจอ</p>
                <input
                    type="number"
                    placeholder="กรอกรหัสห้อง"
                    className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl text-center text-2xl tracking-widest w-full max-w-xs mb-4 focus:ring-2 focus:ring-primary focus:outline-none"
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val.length >= 4) setSessionId(val);
                    }}
                />
                <p className="text-xs text-gray-500 mt-2">รหัสห้องเป็นตัวเลข 4 หรือ 6 หลัก</p>
            </div>
        );
    }

    // Derived State for Queue - Robust Parsing
    let queueList: any[] = [];
    if (status?.queue) {
        if (Array.isArray(status.queue)) {
            queueList = status.queue;
        } else if (typeof status.queue === 'object') {
            // Firebase parses arrays with holes as objects or sparse arrays
            queueList = Object.values(status.queue);
        }
    }

    const currentIndex = typeof status?.currentIndex === 'number' ? status.currentIndex : -1;
    // Get upcoming queue (items AFTER current index)
    const upcomingQueue = queueList.slice(currentIndex + 1);

    // Helper to get thumbnail (Robust)
    const getThumbnail = (video: any) => {
        if (!video) return 'https://i.ytimg.com/img/no_thumbnail.jpg';
        if (video.thumbnail) return video.thumbnail;
        return `https://i.ytimg.com/vi/${video.videoId}/default.jpg`;
    };

    const currentVideo = status?.currentVideo || {};
    const currentThumbnail = getThumbnail(currentVideo);
    // Use high-res if available in currentVideo object from host
    const highResThumbnail = currentVideo.videoThumbnails?.find((t: any) => t.quality === 'high' || t.width > 300)?.url || currentThumbnail;

    return (
        <div className="h-screen bg-black text-white flex flex-col font-sans overflow-hidden enhanced-remote-ui">
            <Head>
                <title>รีโมทคอนโทรล</title>
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            {/* Top Bar: Connection & Room */}
            <div className="px-6 py-4 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-bold tracking-wider text-gray-200">ROOM {sessionId}</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Fullscreen Toggle (Host Only) */}
                    <button
                        onClick={() => sendCommand('TOGGLE_FULLSCREEN')}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-all"
                    >
                        <ArrowsPointingOutIcon className="w-4 h-4 text-white" />
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-all text-gray-400"
                    >
                        <ArrowPathIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Middle Section: Player Card & Controls */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0 relative shrink-0">

                {/* Now Playing Card */}
                <div className="w-full max-w-sm aspect-square bg-zinc-900/80 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl mb-6 group">
                    {/* Background Blur */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-60 blur-xl scale-125 transition-all duration-700"
                        style={{ backgroundImage: `url(${highResThumbnail})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col">
                        <div className="flex-1" />

                        {/* Status Label */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-1 h-4 bg-primary rounded-full"></span>
                            <span className="text-xs font-bold uppercase tracking-widest text-primary-content/80 text-shadow">กำลังเล่น</span>
                        </div>

                        <h1 className="text-2xl font-bold leading-tight line-clamp-2 mb-1 text-shadow-lg relative z-10 w-full break-words">
                            {status?.title || "รอเพลง..."}
                        </h1>
                        <p className="text-sm text-gray-300 line-clamp-1">{status?.currentVideo?.author || "Karaoke System"}</p>
                    </div>

                    {/* Center Play Button Overlay (Optional, maybe keep clean) */}
                </div>

                {/* Main Controls Row */}
                <div className="w-full max-w-sm flex items-center justify-between mb-2">
                    {/* Restart / Prev */}
                    <button
                        onClick={() => sendCommand('REPLAY')}
                        className="w-14 h-14 rounded-full flex items-center justify-center text-gray-400 hover:text-white active:bg-white/10 transition-all"
                    >
                        <BackwardIcon className="w-8 h-8" />
                    </button>

                    {/* Play / Pause (Hero) */}
                    <button
                        onClick={() => {
                            const currentState = status?.isPlaying || false;
                            const nextState = !currentState;
                            lastInteractionRef.current = Date.now();
                            setStatus(prev => prev ? ({ ...prev, isPlaying: nextState }) : null);
                            sendCommand(nextState ? 'PLAY' : 'PAUSE');
                        }}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all ${status?.isPlaying ? 'bg-white text-black' : 'bg-primary text-white'}`}
                    >
                        {status?.isPlaying ? (
                            <PauseIcon className="w-10 h-10" />
                        ) : (
                            <PlayIcon className="w-10 h-10 ml-1" />
                        )}
                    </button>

                    {/* Next */}
                    <button
                        onClick={() => sendCommand('NEXT')}
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white hover:text-primary active:bg-white/10 transition-all"
                    >
                        <ForwardIcon className="w-8 h-8" />
                    </button>
                </div>
            </div>

            {/* Bottom Sheet: Queue & Search */}
            <div className="flex-none bg-zinc-900 rounded-t-[2.5rem] border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[45vh] transition-all overflow-hidden relative">

                {/* Drag Handle / Indicator */}
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2 shrink-0"></div>

                {/* Content Container */}
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Queue Preview (Horizontal or Compact List) */}
                    {upcomingQueue.length > 0 && (
                        <div className="px-6 py-2 shrink-0">
                            <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">คิวถัดไป ({upcomingQueue.length})</h3>
                            <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
                                {upcomingQueue.slice(0, 5).map((video: any, idx: number) => (
                                    <div key={idx} className="flex-none w-48 bg-white/5 rounded-xl p-2 flex items-center gap-2 snap-start border border-white/5">
                                        <div className="w-10 h-10 bg-black rounded-lg overflow-hidden shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={getThumbnail(video)} className="w-full h-full object-cover opacity-80" alt="" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate text-gray-200">{video.title}</p>
                                            <p className="text-[10px] text-gray-500">#{idx + 1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Bar Area */}
                    <div className="p-6 pt-2 bg-zinc-900 flex-1 flex flex-col min-h-0">
                        {/* Toggle */}
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => setSearchType('song')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${searchType === 'song' ? 'bg-zinc-800 text-white border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                            >เพลงทั่วไป</button>
                            <button
                                onClick={() => setSearchType('karaoke')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${searchType === 'karaoke' ? 'bg-gradient-to-r from-primary/80 to-primary/40 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >คาราโอเกะ</button>
                        </div>

                        {/* Input */}
                        <div className="relative shrink-0">
                            <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
                            <DebounceInput
                                minLength={2}
                                debounceTimeout={500}
                                placeholder={searchType === 'karaoke' ? "ค้นหาเพลงคาราโอเกะ..." : "ค้นหาเพลง..."}
                                className="w-full bg-black/50 border border-zinc-700/50 rounded-2xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-gray-600 transition-all font-medium"
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        {/* Search Results List (Scrollable) */}
                        <div className="flex-1 overflow-y-auto mt-4 space-y-2 pb-8 min-h-0 remote-scroll">
                            {isSearching && (
                                <div className="text-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
                            )}

                            {!isSearching && searchResults.map((video: any) => (
                                <div
                                    key={video.videoId}
                                    onClick={() => handleAddQueue({ ...video, thumbnail: getThumbnail(video) })}
                                    className={`flex items-center gap-3 p-3 rounded-2xl active:scale-[0.98] transition-all cursor-pointer ${addedId === video.videoId ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5 border border-white/5'}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={getThumbnail(video)} className="w-12 h-12 rounded-xl object-cover bg-black" alt="" />
                                    <div className="flex-1 min-w-0 text-left">
                                        <h3 className={`font-bold text-sm line-clamp-1 ${addedId === video.videoId ? 'text-green-400' : 'text-white'}`}>{video.title}</h3>
                                        <p className="text-xs text-gray-500">{video.author?.name || video.author || "YouTube"}</p>
                                    </div>
                                    <button className={`w-8 h-8 rounded-full flex items-center justify-center ${addedId === video.videoId ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                        {addedId === video.videoId ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
