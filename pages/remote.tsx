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

    // Presence Logic
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
        updatePresence('active');

        // Auto-remove on disconnect
        onDisconnect(presenceRef).remove();

        // Listen for Visibility Change
        const handleVisibilityChange = () => {
            const state = document.visibilityState === 'hidden' ? 'background' : 'active';
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

        if (document.visibilityState === 'visible') {
            requestWakeLock();
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [sessionId, isConnected, realtimeDb]);

    // Wrapper to use the shared utility
    const handleSendCommand = async (type: string, payload: any = {}) => {
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
            const prefix = searchType === 'karaoke' ? '"karaoke" ' : '';
            const effectiveQuery = prefix + query;

            const res = await axios.get('/api/search', { params: { q: effectiveQuery } });
            let data: any[] = [];
            if (res.data && res.data.data) {
                data = res.data.data;
            } else if (Array.isArray(res.data)) {
                data = res.data;
            }

            // Filter
            data = data.filter((video: any) => {
                if (!video.author || video.author.toLowerCase().includes('unknown')) return false;
                return true;
            });

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
            setErrorMessage('ค้นหาล้มเหลว');
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (searchQuery.trim()) {
            handleSearch(searchQuery);
        }
    }, [searchType]);

    const handleAddQueue = (video: SearchResult) => {
        const queueVideo = {
            videoId: video.videoId,
            title: video.title,
            author: 'YouTube',
            key: Date.now(),
            addedBy: {
                uid: 'remote-user',
                displayName: 'Mobile User',
                isGuest: true
            }
        };
        sendCommand('ADD_QUEUE', { video: queueVideo });
        setAddedId(video.videoId);
        setTimeout(() => setAddedId(null), 2000);
    };

    if (!sessionId) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <DevicePhoneMobileIcon className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">เชื่อมต่อกับห้อง</h1>
                <input
                    type="number"
                    placeholder="กรอกรหัสห้อง"
                    className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl text-center text-2xl tracking-widest w-full max-w-xs mb-4 focus:ring-2 focus:ring-primary focus:outline-none"
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val.length >= 4) setSessionId(val);
                    }}
                />
            </div>
        );
    }

    // Derived State
    let queueList: any[] = [];
    if (status?.queue) {
        if (Array.isArray(status.queue)) {
            queueList = status.queue;
        } else if (typeof status.queue === 'object') {
            queueList = Object.values(status.queue);
        }
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

    return (
        <div className="h-screen bg-black text-white flex flex-col font-sans overflow-hidden relative">
            <Head>
                <title>รีโมทคอนโทรล</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            {/* Background Atmosphere */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-150 pointer-events-none transition-all duration-1000 z-0"
                style={{ backgroundImage: `url(${highResThumbnail})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black z-0 pointer-events-none" />


            {/* Top Bar */}
            <div className="px-5 py-3 flex items-center justify-between z-20 shrink-0 border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-bold tracking-wider text-gray-300">ROOM {sessionId}</span>
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

            {/* Main Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0 z-10 pb-32"> {/* pb-32 for Bottom Bar space */}

                {/* 1. Mini-Hero Card Section */}
                <div className="flex flex-col items-center justify-center pt-8 pb-6 px-6">
                    <div className="w-40 h-40 rounded-2xl shadow-2xl overflow-hidden border border-white/10 relative group mb-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={highResThumbnail} className="w-full h-full object-cover" alt="" />
                    </div>
                    <h1 className="text-xl font-bold text-center leading-tight line-clamp-2 px-4 mb-1 text-shadow-md">
                        {status?.title || "รอเพลง..."}
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">{status?.currentVideo?.author || "Karaoke System"}</p>
                </div>

                {/* 2. Controls (Inline option - removed per request to move to bottom, but we can keep Search here) */}

                {/* 3. Search Section */}
                <div className="px-5 mb-6">
                    {/* Search Input */}
                    <div className="relative mb-3">
                        <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                        <DebounceInput
                            minLength={2}
                            debounceTimeout={500}
                            placeholder="ค้นหาเพลง..."
                            className="w-full bg-white/10 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:bg-white/20 focus:text-white transition-all backdrop-blur-md font-medium"
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setSearchType('song')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${searchType === 'song' ? 'bg-white text-black border-white' : 'text-gray-400 border-white/10 hover:bg-white/5'}`}
                        >เพลงทั่วไป</button>
                        <button
                            onClick={() => setSearchType('karaoke')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${searchType === 'karaoke' ? 'bg-primary text-white border-primary shadow-lg' : 'text-gray-400 border-white/10 hover:bg-white/5'}`}
                        >คาราโอเกะ</button>
                    </div>

                    {/* Results */}
                    <div className="space-y-2">
                        {isSearching && (
                            <div className="text-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
                        )}
                        {!isSearching && searchResults.map((video: any) => (
                            <div
                                key={video.videoId}
                                onClick={() => handleAddQueue({ ...video, thumbnail: getThumbnail(video) })}
                                className={`flex items-center gap-3 p-3 rounded-xl active:scale-[0.98] transition-all cursor-pointer ${addedId === video.videoId ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
                            >
                                <img src={getThumbnail(video)} className="w-12 h-12 rounded-lg object-cover bg-black" alt="" />
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-sm line-clamp-1 ${addedId === video.videoId ? 'text-green-400' : 'text-white'}`}>{video.title}</h3>
                                    <p className="text-[10px] text-gray-400">{video.author?.name || video.author || "YouTube"}</p>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${addedId === video.videoId ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                    {addedId === video.videoId ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-5 h-5" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Queue Section */}
                {upcomingQueue.length > 0 && (
                    <div className="px-5">
                        <div className="flex items-center gap-2 mb-3 opacity-60">
                            <div className="h-[1px] flex-1 bg-white/20"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">คิวเพลงถัดไป</span>
                            <div className="h-[1px] flex-1 bg-white/20"></div>
                        </div>
                        <div className="space-y-2">
                            {upcomingQueue.map((video: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg opacity-80">
                                    <span className="text-xs font-mono text-gray-500 w-4 text-center">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-300 truncate">{video.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Fixed Controls Bar (Glassmorphism) */}
            <div className="absolute bottom-0 inset-x-0 p-5 z-50 bg-gradient-to-t from-black via-black/95 to-transparent pt-12 pointer-events-none">
                <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 shadow-2xl flex items-center justify-between pointer-events-auto max-w-md mx-auto">
                    {/* Replay */}
                    <button onClick={() => sendCommand('REPLAY')} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all">
                        <BackwardIcon className="w-6 h-6" />
                    </button>

                    {/* Play/Pause (Hero) */}
                    <button
                        onClick={() => {
                            const nextState = !(status?.isPlaying || false);
                            lastInteractionRef.current = Date.now();
                            setStatus(prev => prev ? ({ ...prev, isPlaying: nextState }) : null);
                            sendCommand(nextState ? 'PLAY' : 'PAUSE');
                        }}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${status?.isPlaying ? 'bg-white text-black' : 'bg-primary text-white border-4 border-black'}`}
                        style={{ marginTop: -20, boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}
                    >
                        {status?.isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
                    </button>

                    {/* Next */}
                    <button onClick={() => sendCommand('NEXT')} className="w-12 h-12 flex items-center justify-center text-white hover:text-primary active:scale-90 transition-all">
                        <ForwardIcon className="w-8 h-8" />
                    </button>
                </div>
            </div>

        </div>
    );
}
