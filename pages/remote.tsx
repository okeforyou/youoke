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
    const [addedId, setAddedId] = useState<string | null>(null);

    // Initial Load - Get Session ID from URL
    useEffect(() => {
        if (router.isReady) {
            const { session } = router.query;
            if (session && typeof session === 'string') {
                setSessionId(session);
            }
        }
    }, [router.isReady, router.query]);

    // Connect to Firebase
    useEffect(() => {
        if (!sessionId || !realtimeDb) return;

        const stateRef = ref(realtimeDb, `sessions/${sessionId}/state`);

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
    const sendCommand = (type: string, payload?: any) => {
        if (!sessionId || !realtimeDb) return;
        const cmdRef = ref(realtimeDb, `sessions/${sessionId}/commands`);
        push(cmdRef, {
            type,
            payload,
            timestamp: Date.now()
        });
    };

    // Search Handler
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Reusing existing API
            const res = await axios.get('/api/search', { params: { q: query } });
            if (res.data && res.data.data) {
                setSearchResults(res.data.data);
            }
        } catch (e) {
            console.error('Search failed', e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddQueue = (video: SearchResult) => {
        sendCommand('ADD_QUEUE', video);
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
                    placeholder="Enter 6-digit PIN"
                    className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl text-center text-2xl tracking-widest w-full max-w-xs mb-4 focus:ring-2 focus:ring-primary focus:outline-none"
                    onChange={(e) => e.target.value.length === 6 && setSessionId(e.target.value)}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Head>
                <title>Remote Control</title>
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
                    <MagnifyingGlassIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <DebounceInput
                        minLength={2}
                        debounceTimeout={500}
                        placeholder="Search songs to add..."
                        className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary focus:outline-none placeholder-gray-600"
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto space-y-2 pb-20 scrollbar-hide">
                    {isSearching ? (
                        <div className="text-center py-8 text-gray-500 animate-pulse">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((video) => (
                            <div key={video.videoId} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5 active:bg-zinc-800 transition-colors">
                                <img src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/default.jpg`} alt="" className="w-12 h-12 rounded bg-black object-cover" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm text-white line-clamp-1">{video.title}</h3>
                                    <p className="text-xs text-gray-500">{video.duration || 'YouTube'}</p>
                                </div>
                                <button
                                    onClick={() => handleAddQueue(video)}
                                    className={`p-2 rounded-full ${addedId === video.videoId ? 'bg-green-500 text-white' : 'bg-white/10 text-primary'}`}
                                >
                                    {addedId === video.videoId ? <CheckIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        ))
                    ) : searchQuery && (
                        <div className="text-center py-8 text-gray-600">No results found</div>
                    )}
                </div>
            </div>
        </div>
    );
}
