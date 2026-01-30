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

            {/* Top Stat Bar */}
            <div className="px-5 py-3 flex items-center justify-between z-20 shrink-0 bg-zinc-900/50 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-bold tracking-wider text-gray-400">ROOM {sessionId}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => sendCommand('TOGGLE_FULLSCREEN')} className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-gray-400">
                        <ArrowsPointingOutIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => window.location.reload()} className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-gray-400">
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Compact Player Header (Fixed at Top) */}
            <div className="p-4 bg-zinc-900 border-b border-white/5 shrink-0 shadow-xl z-20 relative">
                <div className="flex items-center gap-4">
                    {/* Thumbnail (Left) */}
                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-lg relative group bg-black/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={highResThumbnail} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />
                    </div>

                    {/* Info & Controls (Right) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center h-20">
                        <div className="mb-1.5">
                            <h1 className="text-base font-bold leading-tight truncate text-white">{status?.title || "รอเพลง..."}</h1>
                            <p className="text-[10px] text-gray-400 truncate uppercase tracking-widest">{status?.currentVideo?.author || "KARAOKE SYSTEM"}</p>
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center gap-6">
                            <button onClick={() => sendCommand('REPLAY')} className="text-gray-400 hover:text-white active:scale-90 transition-all">
                                <BackwardIcon className="w-6 h-6" />
                            </button>

                            <button
                                onClick={() => {
                                    const nextState = !(status?.isPlaying || false);
                                    lastInteractionRef.current = Date.now();
                                    setStatus(prev => prev ? ({ ...prev, isPlaying: nextState }) : null);
                                    sendCommand(nextState ? 'PLAY' : 'PAUSE');
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${status?.isPlaying ? 'bg-white text-black' : 'bg-primary text-white'}`}
                            >
                                {status?.isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
                            </button>

                            <button onClick={() => sendCommand('NEXT')} className="text-white hover:text-primary active:scale-90 transition-all">
                                <ForwardIcon className="w-7 h-7" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Main Content (Queue + Search) */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-black">

                {/* 1. Vertical Queue Section */}
                {upcomingQueue.length > 0 && (
                    <div className="p-5 border-b border-white/5 bg-zinc-900/20">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">คิวถัดไป ({upcomingQueue.length})</h3>
                        </div>
                        <div className="flex flex-col gap-2">
                            {upcomingQueue.slice(0, 3).map((video: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                    <span className="text-[10px] font-mono text-gray-600 w-4 text-center">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-300 truncate">{video.title}</p>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                                </div>
                            ))}
                            {upcomingQueue.length > 3 && (
                                <p className="text-[10px] text-center text-gray-600 pt-2 italic">
                                    +{upcomingQueue.length - 3} เพลงในคิว...
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Search Section (Takes remaining space) */}
                <div className="p-5 pb-16">
                    <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">ค้นหาเพลงใหม่</h3>

                    {/* Input */}
                    <div className="relative mb-4">
                        <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
                        <DebounceInput
                            minLength={2}
                            debounceTimeout={500}
                            placeholder="พิมพ์ชื่อเพลง..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-gray-600 transition-all font-medium text-sm"
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    {/* Type Toggles */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setSearchType('song')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${searchType === 'song' ? 'bg-white text-black border-white' : 'text-gray-500 border-zinc-800 hover:border-zinc-700'}`}
                        >เพลงทั่วไป</button>
                        <button
                            onClick={() => setSearchType('karaoke')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${searchType === 'karaoke' ? 'bg-primary/10 text-primary border-primary border-opacity-30' : 'text-gray-500 border-zinc-800 hover:border-zinc-700'}`}
                        >คาราโอเกะ</button>
                    </div>

                    {/* Results List */}
                    <div className="space-y-2">
                        {isSearching && (
                            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
                        )}

                        {!isSearching && searchResults.map((video: any) => (
                            <div
                                key={video.videoId}
                                onClick={() => handleAddQueue({ ...video, thumbnail: getThumbnail(video) })}
                                className={`flex items-center gap-3 p-3 rounded-xl active:scale-[0.98] transition-all cursor-pointer ${addedId === video.videoId ? 'bg-green-500/10 border border-green-500/30' : 'bg-zinc-900/40 border border-transparent hover:border-white/5'}`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={getThumbnail(video)} className="w-12 h-12 rounded-lg object-cover bg-black shadow-sm flex-none" alt="" />
                                <div className="flex-1 min-w-0 text-left">
                                    <h3 className={`font-bold text-sm line-clamp-1 ${addedId === video.videoId ? 'text-green-400' : 'text-gray-200'}`}>{video.title}</h3>
                                    <p className="text-[10px] text-gray-500">{video.author?.name || video.author || "YouTube"}</p>
                                </div>
                                <button className={`w-8 h-8 rounded-full flex items-center justify-center flex-none ${addedId === video.videoId ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                                    {addedId === video.videoId ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        ))}

                        {!isSearching && searchResults.length === 0 && searchQuery && (
                            <div className="text-center py-10 text-gray-600 text-sm">ไม่พบเพลงที่ค้นหา</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
