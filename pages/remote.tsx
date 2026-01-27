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
            setErrorMessage('Connection failed. Retrying...');
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
                            // The API often returns maxresdefault even if it doesn't exist (404).
                            // Since we only need a small thumbnail (w-12), default.jpg is always safer and faster.
                            if (thumbUrl.includes('maxresdefault') || thumbUrl.includes('hqdefault')) {
                                thumbUrl = thumbUrl.replace('maxresdefault', 'default').replace('hqdefault', 'default');
                            }

                            return (
                                <div key={video.videoId} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5 active:bg-zinc-800 transition-colors">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={thumbUrl}
                                        onError={(e) => {
                                            // Fallback just in case, monitoring
                                            const target = e.target as HTMLImageElement;
                                            console.warn('Image load failed:', target.src);
                                            // If default failed, maybe try mqdefault as backup? (Rare)
                                            if (target.src.includes('default.jpg') && !target.src.includes('mqdefault')) {
                                                target.src = target.src.replace('default.jpg', 'mqdefault.jpg');
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
