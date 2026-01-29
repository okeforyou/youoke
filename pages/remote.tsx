import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { realtimeDb } from '../firebase';
import { ref, set, push, onValue, remove, onDisconnect } from 'firebase/database';
import {
    PlayIcon, PauseIcon, ForwardIcon,
    MagnifyingGlassIcon, PlusIcon, CheckIcon,
    SignalIcon, SignalSlashIcon, DevicePhoneMobileIcon
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
                        setStatus(data);
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

        return () => {
            isActive = false;
            clearInterval(pollRoomInterval);
        };
    }, [sessionId]);

    // Presence Logic: Register as "Connected" so Host knows to close QR Modal
    useEffect(() => {
        if (!sessionId || !isConnected || !realtimeDb) return;

        let clientId = localStorage.getItem('remote_client_id');
        if (!clientId) {
            clientId = Math.random().toString(36).substring(2, 10);
            localStorage.setItem('remote_client_id', clientId);
        }

        const registerPresence = async () => {
            console.log('🔌 Remote: Starting presence registration for', clientId);

            const presenceRef = ref(realtimeDb, `rooms/${sessionId}/connected/${clientId}`);

            // Write presence
            try {
                await set(presenceRef, {
                    connectedAt: Date.now(),
                    userAgent: navigator.userAgent
                });
                console.log('✅ Remote: Presence registered successfully');

                // Set auto-remove on disconnect
                onDisconnect(presenceRef).remove();

                // Anti-Sleep: Request Wake Lock
                if ('wakeLock' in navigator) {
                    try {
                        const wakeLock = await (navigator as any).wakeLock.request('screen');
                        console.log('💡 Remote: Screen Wake Lock active');
                    } catch (err) {
                        console.warn('⚠️ Remote: Wake Lock failed', err);
                    }
                }
            } catch (e) {
                console.error('❌ Remote: Presence registration failed', e);
            }
        };

        registerPresence();
    }, [sessionId, isConnected]);

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

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Head>
                <title>รีโมทคอนโทรล</title>
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            {/* Header / Status */}
            <div className="p-4 bg-zinc-900 border-b border-white/10 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-mono text-gray-400">ห้อง: {sessionId}</span>
                </div>
                {!isConnected && (
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 active:bg-red-500 active:text-white transition-colors"
                    >
                        เชื่อมต่อใหม่
                    </button>
                )}
                {/* Fullscreen Toggle Button */}
                <button
                    onClick={() => sendCommand('TOGGLE_FULLSCREEN')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5"
                >
                    <div className="w-4 h-4 border-2 border-dashed border-gray-400 rounded-sm"></div>
                </button>
            </div>

            {/* Now Playing Card */}
            <div className="p-4 pb-2">
                <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/10 shadow-lg text-center relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>

                    <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3 relative z-10">กำลังเล่น</p>
                    {status ? (
                        <h1 className="text-lg font-bold leading-tight mb-2 line-clamp-2 relative z-10">{status.title}</h1>
                    ) : (
                        <h1 className="text-lg font-bold text-gray-500 italic relative z-10">รอสถานะ...</h1>
                    )}
                </div>
            </div>

            {/* Queue Section (Updated: Show 5 items) */}
            {upcomingQueue.length > 0 && (
                <div className="px-6 py-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest">คิวเพลงถัดไป ({upcomingQueue.length})</h3>
                    </div>
                    <div className="space-y-2">
                        {upcomingQueue.slice(0, 5).map((video: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                                <span className="text-xs text-gray-600 font-mono w-4 text-center">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-300 truncate">{video.title}</p>
                                </div>
                            </div>
                        ))}
                        {upcomingQueue.length > 5 && (
                            <p className="text-xs text-center text-gray-600 italic pt-1">
                                และอีก {upcomingQueue.length - 5} เพลง...
                            </p>
                        )}
                    </div>
                    <div className="h-px bg-white/5 my-4"></div>
                </div>
            )}

            {/* Controls */}
            <div className="px-6 pb-6 flex items-center justify-center gap-6 flex-none">
                {/* Play/Pause */}
                {/* Play/Pause with Optimistic UI */}
                <button
                    onClick={() => {
                        const nextState = !status?.isPlaying;
                        // Optimistic Update
                        if (status) {
                            setStatus({ ...status, isPlaying: nextState });
                        }
                        sendCommand(nextState ? 'PLAY' : 'PAUSE');
                    }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all ${status?.isPlaying
                        ? 'bg-zinc-800 shadow-zinc-900/50'
                        : 'bg-primary shadow-red-900/20'
                        }`}
                >
                    {status?.isPlaying ? (
                        <PauseIcon className="w-10 h-10 text-white" />
                    ) : (
                        <PlayIcon className="w-10 h-10 text-white pl-1" />
                    )}
                </button>

                {/* Next */}
                <button
                    onClick={() => sendCommand('NEXT')}
                    className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10 active:bg-zinc-700 transition-colors"
                >
                    <ForwardIcon className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Search Section (Updated with Toggle) */}
            <div className="flex-1 bg-zinc-900/30 rounded-t-3xl border-t border-white/10 p-6 flex flex-col min-h-0">
                <div className="relative mb-4 flex-none">
                    {/* Search Type Toggle */}
                    <div className="flex justify-center mb-4">
                        <div className="bg-zinc-800 p-1 rounded-xl flex items-center w-full max-w-xs border border-white/5">
                            <button
                                onClick={() => setSearchType('song')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${searchType === 'song' ? 'bg-zinc-700 text-white shadow' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                เพลงทั่วไป
                            </button>
                            <button
                                onClick={() => setSearchType('karaoke')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${searchType === 'karaoke' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                คาราโอเกะ
                            </button>
                        </div>
                    </div>

                    <MagnifyingGlassIcon className="absolute left-3 top-[3.25rem] w-5 h-5 text-gray-400 pointer-events-none" />
                    <DebounceInput
                        minLength={2}
                        debounceTimeout={500}
                        placeholder={searchType === 'karaoke' ? "ค้นหาเพลงคาราโอเกะ..." : "ค้นหาเพลง..."}
                        className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary focus:outline-none placeholder-gray-600"
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                {/* Error Message */}
                {errorMessage && (
                    <div className="p-3 mb-2 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-xs text-center">
                        {errorMessage}
                    </div>
                )}

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pb-6">
                    {/* Loading State */}
                    {isSearching && (
                        <div className="text-center py-8 text-gray-500">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-xs">กำลังค้นหา...</p>
                        </div>
                    )}

                    {/* Results List */}
                    {!isSearching && searchResults.length > 0 ? (
                        searchResults.map((video: any) => {
                            // Fix: Use default.jpg (120x90) which is guaranteed to exist
                            // Since our UI is small (w-12 h-12), this resolution is sufficient and avoids 404s
                            let thumbUrl = `https://i.ytimg.com/vi/${video.videoId}/default.jpg`;

                            if (video.videoThumbnails && video.videoThumbnails.length > 0) {
                                // Try to get the smallest one first (default) to match our UI size
                                const def = video.videoThumbnails.find((t: any) => t.quality === 'default' || t.url.includes('default.jpg'));
                                if (def) thumbUrl = def.url;
                                else thumbUrl = video.videoThumbnails[0].url;
                            } else if (video.thumbnail) {
                                thumbUrl = video.thumbnail;
                            }

                            // Robust Fix: Force downgrade any maxresdefault/hqdefault to default.jpg
                            if (thumbUrl.includes('maxresdefault') || thumbUrl.includes('hqdefault')) {
                                thumbUrl = thumbUrl.replace('maxresdefault', 'default').replace('hqdefault', 'default');
                            }

                            // Final safety check for undefined videoId
                            if (thumbUrl.includes('undefined')) {
                                console.error('❌ Remote: Invalid thumbnail generated (undefined videoId):', video);
                                thumbUrl = 'https://i.ytimg.com/img/no_thumbnail.jpg'; // Generic fallback
                            }

                            return (
                                <div
                                    key={video.videoId}
                                    onClick={() => handleAddQueue({ ...video, thumbnail: thumbUrl })}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group cursor-pointer ${addedId === video.videoId
                                        ? 'bg-green-500/20 border-green-500/50'
                                        : 'bg-zinc-900/50 hover:bg-zinc-800 border-white/5'
                                        } border`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={thumbUrl}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            console.warn('❌ Remote: Image load failed:', target.src);
                                            // Prevent infinite loop
                                            if (!target.src.includes('default.jpg')) {
                                                target.src = `https://i.ytimg.com/vi/${video.videoId}/default.jpg`;
                                            }
                                        }}
                                        alt=""
                                        className="w-12 h-12 rounded bg-black object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm text-white line-clamp-1">{video.title}</h3>
                                        <p className="text-xs text-gray-500">{video.duration || 'YouTube'}</p>
                                    </div>
                                    <div
                                        className={`p-2 rounded-full ${addedId === video.videoId ? 'bg-green-500 text-white' : 'bg-white/10 text-primary'}`}
                                    >
                                        {addedId === video.videoId ? <CheckIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        searchQuery && !isSearching && (
                            <div className="text-center py-8 text-gray-600">ไม่พบเพลง</div>
                        )
                    )}
                </div>
            </div >
        </div >
    );
}
