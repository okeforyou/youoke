import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { realtimeDb } from '../firebase';
import { ref, set, push, onValue, remove, onDisconnect } from 'firebase/database';
import {
    PlayIcon, PauseIcon, ForwardIcon, BackwardIcon,
    MagnifyingGlassIcon, PlusIcon, CheckIcon,
    SignalIcon, SignalSlashIcon, DevicePhoneMobileIcon,
    ArrowsPointingOutIcon, ArrowPathIcon,
    ListBulletIcon, XMarkIcon, MusicalNoteIcon, MicrophoneIcon,
    ArrowsPointingInIcon
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
    isFullscreen?: boolean; // Optional: synced from host
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

    // Filter/UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [addedId, setAddedId] = useState<string | null>(null);
    const [searchType, setSearchType] = useState<'song' | 'karaoke'>('song');

    // Optimistic Fullscreen State
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Sync local fullscreen with host if available
    useEffect(() => {
        if (status?.isFullscreen !== undefined) {
            setIsFullScreen(status.isFullscreen);
        }
    }, [status?.isFullscreen]);

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

    // Presence Logic
    useEffect(() => {
        if (!sessionId || !isConnected || !realtimeDb) return;
        let clientId = localStorage.getItem('remote_client_id');
        if (!clientId) {
            clientId = Math.random().toString(36).substring(2, 10);
            localStorage.setItem('remote_client_id', clientId);
        }
        const presenceRef = ref(realtimeDb, `rooms/${sessionId}/connected/${clientId}`);
        const updatePresence = (state: 'active' | 'background') => {
            set(presenceRef, { connectedAt: Date.now(), userAgent: navigator.userAgent, state: state }).catch(e => console.error('❌ Presence update failed', e));
        };
        updatePresence('active');
        onDisconnect(presenceRef).remove();
        const handleVisibilityChange = () => {
            const state = document.visibilityState === 'hidden' ? 'background' : 'active';
            updatePresence(state);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try { await (navigator as any).wakeLock.request('screen'); } catch (err) { }
            }
        };
        requestWakeLock();
        if (document.visibilityState === 'visible') requestWakeLock();
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [sessionId, isConnected, realtimeDb]);

    // Command Handler
    const sendCommand = async (type: string, payload: any = {}) => {
        if (!sessionId) return;
        try {
            const { sendCommand } = await import('../utils/castCommands');
            // @ts-ignore
            await sendCommand(sessionId, { type, payload });
        } catch (e) {
            console.error('Failed to send command:', e);
            setErrorMessage('เชื่อมต่อล้มเหลว กำลังลองใหม่...');
        }
    };

    // Toggle Fullscreen Wrapper
    const toggleFullscreen = () => {
        const nextState = !isFullScreen;
        setIsFullScreen(nextState); // Optimistic Update
        sendCommand('TOGGLE_FULLSCREEN');
    };

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
            const prefix = searchType === 'karaoke' ? '"karaoke" ' : '';
            const effectiveQuery = prefix + query;

            const res = await axios.get('/api/search', { params: { q: effectiveQuery } });
            let data: any[] = [];
            if (res.data && res.data.data) {
                data = res.data.data;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }

            // Client-side filtering
            data = data.filter((video: any) => {
                if (!video.author || video.author.toLowerCase().includes('unknown')) return false;
                return true;
            });

            if (searchType === 'karaoke') {
                data = data.filter((video: any) => {
                    if (!video.title) return false;
                    const lcTitle = video.title.toLowerCase();
                    return (lcTitle.includes("karaoke") || lcTitle.includes("beat") || lcTitle.includes("คาราโอเกะ"));
                });
            }

            setSearchResults(data);
        } catch (e: any) {
            console.error('Search failed', e);
        } finally {
            setIsSearching(false);
        }
    };

    // Auto-refresh search
    useEffect(() => {
        if (searchQuery.trim()) handleSearch(searchQuery);
    }, [searchType]);

    const handleAddQueue = (video: SearchResult) => {
        const queueVideo = {
            videoId: video.videoId,
            title: video.title,
            author: 'YouTube',
            key: Date.now(),
            addedBy: { uid: 'remote-user', displayName: 'Mobile User', isGuest: true }
        };
        sendCommand('ADD_QUEUE', { video: queueVideo });
        setAddedId(video.videoId);
        setTimeout(() => setAddedId(null), 2000);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    if (!sessionId) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <DevicePhoneMobileIcon className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">เชื่อมต่อกับห้อง</h1>
                <p className="text-gray-400 mb-6 text-center">กรอกรหัส PIN ที่แสดงบนหน้าจอ</p>
                <input type="number" placeholder="กรอกรหัสห้อง" className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl text-center text-2xl tracking-widest w-full max-w-xs mb-4 focus:ring-2 focus:ring-primary focus:outline-none" onChange={(e) => { if (e.target.value.length >= 4) setSessionId(e.target.value); }} />
            </div>
        );
    }

    // Derived State
    let queueList: any[] = [];
    if (status?.queue) {
        if (Array.isArray(status.queue)) queueList = status.queue;
        else if (typeof status.queue === 'object') queueList = Object.values(status.queue);
    }

    const currentIndex = typeof status?.currentIndex === 'number' ? status.currentIndex : -1;
    const upcomingQueue = queueList.slice(currentIndex + 1);

    const getThumbnail = (video: any) => {
        if (!video) return 'https://i.ytimg.com/img/no_thumbnail.jpg';
        if (video.thumbnail) return video.thumbnail;
        return `https://i.ytimg.com/vi/${video.videoId}/default.jpg`;
    };

    const currentVideo = status?.currentVideo || {};
    const currentThumbnail = getThumbnail(currentVideo);
    const highResThumbnail = currentVideo.videoThumbnails?.find((t: any) => t.quality === 'high' || t.width > 300)?.url || currentThumbnail;
    const isShowingResults = searchResults.length > 0 || (searchQuery.length > 0 && isSearching);

    return (
        <div
            className="h-screen bg-black text-white flex flex-col font-sans overflow-hidden relative"
            style={{ overscrollBehaviorY: 'none' }} // Prevent Pull-to-Refresh
        >
            <Head>
                <title>รีโมทคอนโทรล</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-125 pointer-events-none transition-all duration-1000 z-0" style={{ backgroundImage: `url(${highResThumbnail})` }} />
            <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />

            {/* 1. Header (Room Info) */}
            <div className="px-5 py-3 flex items-center justify-between z-20 shrink-0 bg-black/20 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-bold tracking-wider text-gray-300">ROOM {sessionId}</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Fullscreen Toggle with Status & Icon Swap */}
                    <button
                        onClick={toggleFullscreen}
                        className={`p-2 rounded-full active:scale-95 transition-all ${isFullScreen ? 'bg-white text-black' : 'hover:bg-white/10 text-gray-400'}`}
                    >
                        {isFullScreen ? (
                            <ArrowsPointingInIcon className="w-5 h-5" />
                        ) : (
                            <ArrowsPointingOutIcon className="w-5 h-5" />
                        )}
                    </button>
                    <button onClick={() => window.location.reload()} className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-gray-400">
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. Top Search Bar */}
            <div className="p-4 z-20 bg-gradient-to-b from-black/80 to-transparent shrink-0 space-y-3">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    <DebounceInput
                        minLength={2}
                        debounceTimeout={500}
                        placeholder={searchType === 'karaoke' ? "ค้นหาเพลงคาราโอเกะ..." : "ค้นหาเพลง..."}
                        className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-3 pl-12 pr-10 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder-gray-500 transition-all font-medium shadow-lg backdrop-blur-sm"
                        onChange={(e) => handleSearch(e.target.value)}
                        value={searchQuery}
                    />
                    {searchQuery && (
                        <button onClick={handleClearSearch} className="absolute right-3 top-3 p-1 rounded-full bg-white/10 text-gray-400 hover:text-white">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Styled Toggles (Segmented Control with Icons) */}
                <div className="bg-zinc-800/80 p-1 rounded-xl flex shadow-inner border border-white/5 backdrop-blur-sm">
                    <button
                        onClick={() => setSearchType('song')}
                        className={`flex-1 py-1.5 flex items-center justify-center gap-2 text-xs font-bold rounded-lg transition-all ${searchType === 'song' ? 'bg-zinc-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <MusicalNoteIcon className="w-3.5 h-3.5" />
                        ทั่วไป
                    </button>
                    <button
                        onClick={() => setSearchType('karaoke')}
                        className={`flex-1 py-1.5 flex items-center justify-center gap-2 text-xs font-bold rounded-lg transition-all ${searchType === 'karaoke' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <MicrophoneIcon className="w-3.5 h-3.5" />
                        คาราโอเกะ
                    </button>
                </div>
            </div>

            {/* 3. Main List Area (Switch between Queue & Results) */}
            <div className="flex-1 overflow-y-auto min-h-0 z-10 pb-28 px-4 remote-scroll"> {/* pb-28 for Bottom Player */}

                {/* Mode: Search Results */}
                {isShowingResults && (
                    <div className="space-y-2 animate-fadeIn">
                        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3 mt-2">ผลการค้นหา</h3>
                        {isSearching && <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>}

                        {!isSearching && searchResults.length === 0 && <div className="text-center py-10 text-gray-500">ไม่พบเพลง</div>}

                        {!isSearching && searchResults.map((video: any) => (
                            <div key={video.videoId} onClick={() => handleAddQueue({ ...video, thumbnail: getThumbnail(video) })} className={`flex items-center gap-3 p-2 pr-3 rounded-xl active:scale-[0.98] transition-all cursor-pointer ${addedId === video.videoId ? 'bg-green-500/20 border border-green-500/50' : 'bg-zinc-900/60 border border-white/5 hover:bg-white/10'}`}>
                                <img src={getThumbnail(video)} className="w-14 h-14 rounded-lg object-cover bg-black shadow-md" alt="" />
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-sm line-clamp-2 leading-tight ${addedId === video.videoId ? 'text-green-400' : 'text-white'}`}>{video.title}</h3>
                                    <p className="text-xs text-gray-400 mt-1">{video.author?.name || video.author || "YouTube"}</p>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${addedId === video.videoId ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                    {addedId === video.videoId ? <CheckIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mode: Queue (Default) */}
                {!isShowingResults && (
                    <div className="animate-fadeIn">
                        {upcomingQueue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                                <MusicalNoteIcon className="w-16 h-16 text-gray-500" />
                                <p className="text-gray-400">คิวเพลงว่างเปล่า...</p>
                                <p className="text-xs text-gray-600">พิมพ์ชื่อเพลงด้านบนเพื่อเริ่มร้องเพลง!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between mb-3 mt-2">
                                    <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest">คิวเพลง ({upcomingQueue.length})</h3>
                                </div>

                                {upcomingQueue.map((video: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-black/20 border border-white/5">
                                        <span className="text-sm font-mono text-gray-500 w-6 text-center">{idx + 1}</span>
                                        <img src={getThumbnail(video)} className="w-10 h-10 rounded-md object-cover opacity-70" alt="" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-200 truncate">{video.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{video.addedBy?.displayName || "Guest"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 4. Bottom Mini Player (Fixed) */}
            <div className="fixed bottom-0 inset-x-0 z-50 p-3 pb-safe bg-gradient-to-t from-black via-zinc-900 to-transparent pt-6 pointer-events-none">
                <div className="bg-zinc-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3 pointer-events-auto">
                    {/* Tiny Thumb */}
                    <div className="w-12 h-12 rounded-lg bg-black overflow-hidden shrink-0 border border-white/10 relative">
                        <img src={highResThumbnail} className="w-full h-full object-cover" alt="" />
                        {status?.isPlaying && <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_theme(colors.primary.DEFAULT)]"></div>
                        </div>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-[4px] leading-none tracking-wider">PLAYING</div>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate leading-tight">{status?.title || "ไม่ได้เล่นเพลง"}</h3>
                        <p className="text-xs text-gray-400 truncate">{status?.currentVideo?.author || "..."}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 shrink-0 pr-2">
                        {/* Removed Back Button */}

                        <button
                            onClick={() => {
                                const nextState = !(status?.isPlaying || false);
                                lastInteractionRef.current = Date.now();
                                setStatus(prev => prev ? ({ ...prev, isPlaying: nextState }) : null);
                                sendCommand(nextState ? 'PLAY' : 'PAUSE');
                            }}
                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-all"
                        >
                            {status?.isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}
                        </button>

                        <button onClick={() => sendCommand('NEXT')} className="p-2 text-gray-400 hover:text-white active:scale-90 transition-all">
                            <ForwardIcon className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
