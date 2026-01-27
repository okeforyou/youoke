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

    // Connect to Firebase & Auth
    useEffect(() => {
        if (!sessionId || !realtimeDb) return;

        // 1. Sign in anonymously (required for write access)
        const initAuth = async () => {
            // Dynamic import auth to avoid SSR issues if needed, or assume it's available from firebase.ts
            const { auth } = await import('../firebase');
            const { signInAnonymously } = await import('firebase/auth');
            if (!auth.currentUser) {
                await signInAnonymously(auth);
            }
        };
        initAuth();

        // 2. Listen for room state (using 'rooms' path instead of 'sessions')
        const stateRef = ref(realtimeDb, `rooms/${sessionId}/state`);

        // Listen for host status
        const unsubscribe = onValue(stateRef, (snapshot) => {
            if (snapshot.exists()) {
                setStatus(snapshot.val());
                setIsConnected(true);
            } else {
                setIsConnected(false);
            }
        }, (error) => {
            console.error(error);
            setIsConnected(false);
        });

        return () => unsubscribe();
    }, [sessionId]);

    // Commands
    const sendCommand = (type: string, payload: any = {}) => {
        if (!sessionId || !realtimeDb) return;

        // Create a unique ID for the command
        const commandId = push(ref(realtimeDb, `rooms/${sessionId}/commands`)).key;
        if (!commandId) return;

        const cmdRef = ref(realtimeDb, `rooms/${sessionId}/commands/${commandId}`);

        // Construct standard Envelope expected by Monitor
        const envelope = {
            id: commandId,
            command: {
                type,
                payload
            },
            status: 'pending',
            timestamp: Date.now(),
            from: 'remote'
        };

        set(cmdRef, envelope);
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
            // Reusing existing API
            const res = await axios.get('/api/search', { params: { q: query } });
            if (res.data && res.data.data) {
                setSearchResults(res.data.data);
            } else if (Array.isArray(res.data)) {
                // Support array response
                setSearchResults(res.data);
            }
        } catch (e: any) {
            console.error('Search failed', e);
            setErrorMessage(e.response?.data?.error || e.message || 'Search failed');
        } finally {
            setIsSearching(false);
        }
    };

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

        sendCommand('ADD_TO_QUEUE', { video: queueVideo });
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
                <h1 className="text-2xl font-bold mb-2">Connect to Host</h1>
                <p className="text-gray-400 mb-6 text-center">Enter the Session PIN displayed on your TV</p>
                <input
                    type="number"
                    placeholder="Enter Room PIN"
                    className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl text-center text-2xl tracking-widest w-full max-w-xs mb-4 focus:ring-2 focus:ring-primary focus:outline-none"
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val.length >= 4) setSessionId(val);
                    }}
                />
                <p className="text-xs text-gray-500 mt-2">PIN is usually 4 or 6 digits</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Head>
                <title>Remote Control</title>
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>

            {/* Header / Status */}
            <div className="p-4 bg-zinc-900 border-b border-white/10 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-mono text-gray-400">PIN: {sessionId}</span>
                </div>
                {!isConnected && <span className="text-xs text-red-500 font-bold">Disconnected</span>}
            </div>

            {/* Now Playing Card */}
            <div className="p-6 flex-none">
                <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/10 shadow-lg text-center">
                    <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Now Playing</p>
                    {status ? (
                        <h1 className="text-lg font-bold leading-tight mb-2 line-clamp-2">{status.title}</h1>
                    ) : (
                        <h1 className="text-lg font-bold text-gray-500 italic">Waiting for status...</h1>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="px-6 pb-6 flex items-center justify-center gap-6 flex-none">
                <button
                    onClick={() => sendCommand(status?.isPlaying ? 'PAUSE' : 'PLAY')}
                    className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-red-900/20 shadow-xl active:scale-95 transition-transform"
                >
                    {status?.isPlaying ? <PauseIcon className="w-10 h-10 text-white" /> : <PlayIcon className="w-10 h-10 text-white pl-1" />}
                </button>

                <button
                    onClick={() => sendCommand('NEXT')}
                    className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10 active:bg-zinc-700 transition-colors"
                >
                    <ForwardIcon className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Search Section */}
            <div className="flex-1 bg-zinc-900/30 rounded-t-3xl border-t border-white/10 p-6 flex flex-col min-h-0">
                <div className="relative mb-4 flex-none">
                    <MagnifyingGlassIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    <DebounceInput
                        minLength={2}
                        debounceTimeout={500}
                        placeholder="Search songs to add..."
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

                {/* Results List */}
                <div className="flex-1 overflow-y-auto space-y-2 pb-20 scrollbar-hide">
                    {isSearching ? (
                        <div className="text-center py-8 text-gray-500 animate-pulse">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((video: any) => {
                            // Fix: Use mqdefault (Medium Quality) as primary to avoid 404s on maxresdefault
                            // mqdefault is 320x180, perfect for mobile list view
                            let thumbUrl = `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`;

                            if (video.videoThumbnails && video.videoThumbnails.length > 0) {
                                // Find mqdefault or fallback to the first one (usually maxres)
                                const mq = video.videoThumbnails.find((t: any) => t.quality === 'medium' || t.url.includes('mqdefault'));
                                if (mq) thumbUrl = mq.url;
                                else thumbUrl = video.videoThumbnails[0].url;
                            } else if (video.thumbnail) {
                                thumbUrl = video.thumbnail;
                            }

                            return (
                                <div key={video.videoId} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5 active:bg-zinc-800 transition-colors">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={thumbUrl}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            // Fallback chain: maxres -> mq -> default
                                            if (target.src.includes('maxresdefault')) {
                                                target.src = target.src.replace('maxresdefault', 'mqdefault');
                                            } else if (target.src.includes('mqdefault')) {
                                                target.src = target.src.replace('mqdefault', 'default');
                                            }
                                        }}
                                        alt=""
                                        className="w-12 h-12 rounded bg-black object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm text-white line-clamp-1">{video.title}</h3>
                                        <p className="text-xs text-gray-500">{video.duration || 'YouTube'}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAddQueue({ ...video, thumbnail: thumbUrl })}
                                        className={`p-2 rounded-full ${addedId === video.videoId ? 'bg-green-500 text-white' : 'bg-white/10 text-primary'}`}
                                    >
                                        {addedId === video.videoId ? <CheckIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            );
                        })
                    ) : searchQuery && (
                        <div className="text-center py-8 text-gray-600">No results found</div>
                    )}
                </div>
            </div >
        </div >
    );
}
