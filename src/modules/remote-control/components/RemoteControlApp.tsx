
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInAnonymously } from 'firebase/auth';
import { ref, onValue, off, set, serverTimestamp } from 'firebase/database';
import { auth, realtimeDb } from '../../../firebase';
import { QueueItem } from '../../../modules/player/types';
import {
    ListMusic, User, Share2, Maximize, Minimize, RefreshCw, Volume2, VolumeX, SkipForward, SkipBack, Play, Pause, Trash2, GripVertical, Search, Sun, Moon, Music, Mic, Mic2,
    Lock, Chrome, LogIn, AlertCircle
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useVoiceSearch } from '../../../hooks/useVoiceSearch';
import { useAuth } from '@/context/AuthContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { QRCodeSVG } from 'qrcode.react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { castService } from '../../../plugins/cast/services/CastService';

// Components
import { RemoteMiniPlayer } from './RemoteMiniPlayer';
import { DraggableQueueItem } from './DraggableQueueItem';
import { RemoteSearchResultCard } from './RemoteSearchResultCard';
import { DebounceInput } from 'react-debounce-input';

// Types
type RemoteStatus = 'connecting' | 'connected' | 'error';
interface RoomState {
    queue: QueueItem[];
    currentIndex: number;
    currentVideo: QueueItem | null;
    controls: { isPlaying: boolean; isMuted: boolean; volume: number };
    isQueueVisible: boolean;
    layoutMode?: 'split' | 'fullscreen';
    notification?: { type: 'added' | 'upnext', video: any, timestamp: number } | null;
}

export default function RemoteControlApp() {
    const router = useRouter();
    const queryRoom = router.query.room;
    const roomCode = typeof queryRoom === 'string' ? queryRoom : Array.isArray(queryRoom) ? queryRoom[0] : '';

    // State
    const [status, setStatus] = useState<RemoteStatus>('connecting');
    const [roomState, setRoomState] = useState<RoomState>({
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: false, volume: 100 },
        isQueueVisible: false
    });
    const { addToast } = useToast() || { addToast: () => { } };
    const [guestName, setGuestName] = useState('');
    const [showNameModal, setShowNameModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);

    // Auth & Limit State
    const { user, signInWithGoogle, logIn } = useAuth();
    const { config } = useSystemConfig();
    const [guestSongCount, setGuestSongCount] = useState(0);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const SONG_LIMIT = config.tv?.guestSongLimit || 5;

    const [isSearchOpen, setSearchOpen] = useState(false);
    const [showLocalQr, setShowLocalQr] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // Toast State
    const [remoteToast, setRemoteToast] = useState<{ message: string, sub: string, type: 'added' | 'upnext' } | null>(null);
    const lastToastTs = React.useRef(0);

    // Search Logic (V1 Integrated)
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchType, setSearchType] = useState<'video' | 'karaoke'>('video');
    const debounceRef = React.useRef<NodeJS.Timeout>();

    // Load theme preference and set mounted
    useEffect(() => {
        setHasMounted(true);
        const savedTheme = localStorage.getItem('remote_theme') as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('remote_theme', newTheme);
        // Sync body background to prevent white line on notch/overscroll
        document.body.style.backgroundColor = newTheme === 'dark' ? '#0c0a09' : '#fafaf9';
    };

    useEffect(() => {
        if (hasMounted) {
            document.body.style.backgroundColor = theme === 'dark' ? '#0c0a09' : '#fafaf9';
        }
    }, [theme, hasMounted]);

    // Search Handlers
    const performSearch = async (value: string, type: 'video' | 'karaoke' = searchType) => {
        if (!value.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            const { getSearchResult } = await import('../../../utils/api');
            const effectiveQuery = type === 'karaoke' ? `${value} karaoke` : value;
            const data = await getSearchResult({ q: effectiveQuery, type: 'video' });
            setSearchResults(data);
        } catch (e) {
            console.error('Search Error:', e);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchInput = (value: string) => {
        setSearchTerm(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        debounceRef.current = setTimeout(() => performSearch(value, searchType), 600);
    };

    // Voice Search Callbacks (memoized)
    const handleVoiceResult = React.useCallback((text: string) => {
        setSearchTerm(text);
        handleSearchInput(text);
        addToast(`🎙️ ค้นหาแล้ว: ${text}`, 'voice');
    }, [addToast]);

    const handleVoiceError = React.useCallback((err: string) => {
        if (err === 'not-allowed') {
            addToast('⚠️ กรุณาอนุญาตการเข้าถึงไมโครโฟน', 'error');
        } else if (err !== 'no-speech' && err !== 'aborted') {
            addToast('⚠️ ไม่สามารถค้นหาด้วยเสียงได้', 'error');
        }
    }, [addToast]);

    // Voice Search Integration (hook uses refs internally, safe from re-render loops)
    const { isListening, toggleListening, isSupported: isVoiceSupported } = useVoiceSearch({
        onResult: handleVoiceResult,
        onError: handleVoiceError
    });

    const handleTypeToggle = (type: 'video' | 'karaoke') => {
        setSearchType(type);
        if (searchTerm) performSearch(searchTerm, type);
    };


    // Initial Setup
    useEffect(() => {
        // Prevent body from being white during load in dark mode
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('remote_theme');
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
                document.body.style.backgroundColor = '#0c0a09';
            }
        }

        const storedName = typeof window !== 'undefined' ? localStorage.getItem('youoke_guest_name') : null;
        if (storedName && typeof storedName === 'string') {
            setGuestName(storedName);
        } else {
            setShowNameModal(true);
        }

        // Load Guest Song Count
        if (typeof window !== 'undefined') {
            const storedCount = localStorage.getItem('youoke_guest_song_count');
            const count = parseInt(typeof storedCount === 'string' ? storedCount : '0');
            const lastReset = localStorage.getItem('youoke_guest_last_reset');
            const now = new Date();

            // Reset every 24 hours
            if (lastReset) {
                const lastDate = new Date(lastReset);
                const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
                if (diffHours >= 24) {
                    localStorage.setItem('youoke_guest_song_count', '0');
                    localStorage.setItem('youoke_guest_last_reset', now.toISOString());
                    setGuestSongCount(0);
                } else {
                    setGuestSongCount(count);
                }
            } else {
                localStorage.setItem('youoke_guest_last_reset', now.toISOString());
            }
        }

        // 🛡️ SAFETY TIMEOUT: Force UI unlock if Firebase is slow/stuck
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn('⚠️ [RemoteApp] Init Timeout (10s). Forcing unlock.');
                setLoading(false);
            }
        }, 10000);

        return () => clearTimeout(safetyTimeout);
    }, []);

    // Firebase Connection (Realtime Listener)
    useEffect(() => {
        if (!roomCode || typeof roomCode !== 'string') return;
        if (showNameModal) return;

        const connect = async () => {
            if (!auth || !realtimeDb) {
                setStatus('error');
                return;
            }

            try {
                if (!auth.currentUser) {
                    console.log('🔐 [Remote] Signing in anonymously...');
                    await signInAnonymously(auth);
                }

                // Initialize CastService (Centralized logic)
                await castService.initialize(roomCode, 'monitor');

                // Signal to Host that we've joined (Direct Trigger for closing QR)
                const statusRef = ref(realtimeDb, `rooms/${roomCode}/status`);
                set(statusRef, {
                    lastJoin: serverTimestamp(),
                    lastJoinBy: auth.currentUser?.uid || 'anonymous'
                });

                // Listen to State
                const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
                const unsubscribe = onValue(stateRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        // Normalize Queue
                        const rawQueue = data.queue || [];
                        const queue = Array.isArray(rawQueue) ? rawQueue : Object.values(rawQueue);

                        console.log('🔥 [Remote] Syncing state from Firebase', {
                            queueSize: queue.length,
                            idx: data.currentIndex,
                            ts: data.timestamp
                        });

                        setRoomState({
                            queue: queue.filter((i: any) => i && (i.videoId || i.id || i.uuid)),
                            currentIndex: data.currentIndex ?? 0,
                            currentVideo: data.currentVideo,
                            controls: data.controls || { isPlaying: false, isMuted: false, volume: 100 },
                            isQueueVisible: data.isQueueVisible,
                            layoutMode: data.layoutMode || data.isFullscreen ? 'fullscreen' : 'split',
                            notification: data.notification
                        });

                        // Show Notification Toast if new
                        if (data.notification && data.notification.timestamp > lastToastTs.current) {
                            lastToastTs.current = data.notification.timestamp;
                            const type = data.notification.type;
                            const video = data.notification.video;

                            setRemoteToast({
                                message: type === 'upnext' ? 'เพลงถัดไปกำลังจะเริ่ม' : 'กำลังเล่นเพลงใหม่',
                                sub: video.title,
                                type
                            });

                            setTimeout(() => setRemoteToast(null), 5000);
                        }

                        setStatus('connected');
                        setLoading(false); // Set loading to false once connected

                        // Persist Last Successful Room Code
                        localStorage.setItem('youoke_last_room_code', roomCode);
                    } else {
                        setStatus('connecting'); // Room might not exist yet
                    }
                }, (error) => {
                    console.error("Firebase Read Error:", error);
                    setStatus('error');
                    setLoading(false); // Set loading to false on error
                });

                return () => off(stateRef, 'value', unsubscribe);

            } catch (e) {
                console.error("Connection Error:", e);
                setStatus('error');
                setLoading(false); // Set loading to false on error
            }
        };

        const cleanup = connect();
        return () => { cleanup.then(unsub => unsub && unsub()); };
    }, [roomCode, showNameModal]);


    // Track Current User state for presence
    const [currentUser, setCurrentUser] = useState(auth?.currentUser);
    useEffect(() => {
        if (!auth) return;
        return auth.onAuthStateChanged((user) => setCurrentUser(user));
    }, []);

    // Wake Lock to prevent screen sleep
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                    console.log('💡 Wake Lock active');
                }
            } catch (err) {
                console.warn('💡 Wake Lock failed:', err);
            }
        };

        requestWakeLock();

        // Re-request on visibility change (V1 logic: Tab switch/Minimize might kill it)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLock) wakeLock.release();
        };
    }, []);

    // Presence / Connection Status Heartbeat (V1-Inspired Reliability)
    useEffect(() => {
        if (!roomCode || !realtimeDb || !currentUser) return;

        // Use a consistent clientId for this device to prevent duplicate entries
        let clientId = localStorage.getItem('youoke_remote_client_id');
        if (!clientId) {
            clientId = currentUser.uid;
            localStorage.setItem('youoke_remote_client_id', clientId);
        }

        const myPresenceRef = ref(realtimeDb, `rooms/${roomCode}/connected/${clientId}`);
        const connectedRef = ref(realtimeDb, '.info/connected');

        let unsubscribePresence: () => void;

        const updatePresence = async (presenceState: 'active' | 'background') => {
            try {
                await set(myPresenceRef, {
                    uid: currentUser.uid,
                    name: guestName || 'Guest',
                    state: presenceState,
                    lastSeen: serverTimestamp(),
                    userAgent: navigator.userAgent
                });
            } catch (e) {
                console.error("Presence update failed:", e);
            }
        };

        const setupPresence = async () => {
            const { onDisconnect, onValue: onFirebaseValue } = await import('firebase/database');

            unsubscribePresence = onFirebaseValue(connectedRef, (snap) => {
                if (snap.val() === true) {
                    onDisconnect(myPresenceRef).remove();
                    updatePresence('active');
                }
            });
        };

        setupPresence();

        // Listen for visibility changes (V1 logic: Screen off/Tab hidden = background)
        const handleVisibilityChange = () => {
            const newState = document.visibilityState === 'hidden' ? 'background' : 'active';
            updatePresence(newState);
            
            // 🛡️ RECOVER CONNECTION: If we come back from sleep, tell castService to verify state
            if (document.visibilityState === 'visible') {
                console.log('🔄 [Remote] App visible: Verifying connection state...');
                castService.ensureConnection();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (unsubscribePresence) unsubscribePresence();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            const { remove } = require('firebase/database');
            remove(myPresenceRef).catch(() => { });
        };
    }, [roomCode, guestName, currentUser]);

    // Command Sender (Refactored to use CastService)
    const sendCommand = async (type: string, payload: any = {}) => {
        if (!roomCode) return;
        
        await castService.sendCommand({
            type,
            payload: {
                ...payload,
                addedBy: { uid: currentUser?.uid || 'guest', name: guestName }
            }
        });
    }

    // Handlers
    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const input = (e.target as any).name.value;
        if (input.trim()) {
            localStorage.setItem('youoke_guest_name', input.trim());
            setGuestName(input.trim());
            setShowNameModal(false);

            // 📱 AUTO-FULLSCREEN TRIGGER (Piggyback on Join Gesture)
            // Mobile browsers require a user gesture to enter fullscreen.
            // By calling this here, we use the "Join" tap to hide the address bar.
            try {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.log('📱 Auto-Fullscreen blocked (expected on iOS Safari without PWA):', err);
                    });
                } else if ((document.documentElement as any).webkitRequestFullscreen) {
                    (document.documentElement as any).webkitRequestFullscreen(); // Safari Fallback
                }
            } catch (err) {
                console.warn('📱 Auto-Fullscreen failed:', err);
            }
        }
    };


    const handleAddVideo = (video: any) => {
        // Check Limit for Anonymous Users (Guest)
        const isAnonymous = !user || !user.email || user.displayName === 'Guest';

        if (isAnonymous && guestSongCount >= SONG_LIMIT) {
            setShowLimitModal(true);
            return;
        }

        console.log('➕ Adding video to queue:', video.title);
        sendCommand('ADD_TO_QUEUE', { video });

        // Increment guest count
        if (isAnonymous) {
            const newCount = guestSongCount + 1;
            setGuestSongCount(newCount);
            localStorage.setItem('youoke_guest_song_count', newCount.toString());
        }

        setSearchTerm('');
        setSearchResults([]);
    };

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await signInWithGoogle();
            setShowLimitModal(false);
        } catch (error) {
            console.error('Google Login Error:', error);
        } finally {
            setIsLoggingIn(false);
        }
    };

    // Drag & Drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Up Next songs are those after currentIndex
        const queueWithoutFirst = roomState.queue.slice(roomState.currentIndex + 1);

        const oldIndex = queueWithoutFirst.findIndex((item) => {
            const itemId = item.uuid || item.videoId || `${item.title}-${item.author}`;
            return itemId === active.id;
        });

        const newIndex = queueWithoutFirst.findIndex((item) => {
            const itemId = item.uuid || item.videoId || `${item.title}-${item.author}`;
            return itemId === over?.id;
        });

        if (oldIndex === -1 || newIndex === -1) {
            console.warn('⚠️ Drag indices not found:', { oldIndex, newIndex, activeId: active.id, overId: over.id });
            return;
        }

        // Reorder only the queue without the first item
        const reorderedQueue = arrayMove(queueWithoutFirst, oldIndex, newIndex);

        // Reconstruct full queue: [0...currentIndex, ...reorderedItems]
        const fullQueue = [
            ...roomState.queue.slice(0, roomState.currentIndex + 1),
            ...reorderedQueue
        ];

        // OPTIMISTIC UPDATE: Update local state immediately to prevent "bounce"
        setRoomState(prev => ({
            ...prev,
            queue: fullQueue
        }));

        console.log('🔄 Reordering queue (Optimistic):', { oldIndex, newIndex, newQueueLength: fullQueue.length });

        // Send REORDER_QUEUE command with full queue
        sendCommand('REORDER_QUEUE', { queue: fullQueue });
    };

    if (!hasMounted) {
        return <div className="h-screen bg-stone-950 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>;
    }

    if (!roomCode) {
        const lastRoom = typeof window !== 'undefined' ? localStorage.getItem('youoke_last_room_code') : null;

        return (
            <div className={`h-screen flex flex-col items-center justify-center p-8 transition-colors ${theme === 'dark' ? 'bg-stone-950 text-white' : 'bg-stone-50 text-gray-900'}`}>
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 rotate-12 shadow-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-primary/10'}`}>
                    <AlertCircle className={`w-10 h-10 ${theme === 'dark' ? 'text-white/20' : 'text-primary'}`} />
                </div>

                <h2 className="text-3xl font-black mb-3 tracking-tight">ไม่พบรหัสห้อง</h2>
                <p className="text-sm text-center opacity-60 mb-10 max-w-xs">กรุณาสแกน QR Code จากหน้าจอทีวี หรือพิมพ์รหัส 4 หลักที่ปรากฏบนหน้าจอครับ</p>

                <div className="w-full max-w-xs space-y-4">
                    {/* Manual Entry */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const codeInput = (e.target as any).code;
                            const code = codeInput && typeof codeInput.value === 'string' ? codeInput.value.trim() : '';
                            if (code.length >= 4) {
                                router.push(`/remote?room=${code}`);
                            }
                        }}
                        className="relative"
                    >
                        <input
                            name="code"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="พิมพ์รหัส 4 หลัก..."
                            className={`w-full py-4 px-6 rounded-2xl font-black text-center text-xl outline-none transition-all ${theme === 'dark'
                                ? 'bg-white/5 border border-white/10 focus:border-primary/50'
                                : 'bg-white border border-gray-200 shadow-sm focus:border-primary/50 ring-primary/20 focus:ring-4'
                                }`}
                            maxLength={6}
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-xl shadow-lg active:scale-90 transition-transform">
                            <LogIn size={18} strokeWidth={3} />
                        </button>
                    </form>

                    {lastRoom && (
                        <button
                            onClick={() => router.push(`/remote?room=${lastRoom}`)}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-900 text-white shadow-xl'
                                }`}
                        >
                            <RefreshCw size={16} />
                            กลับเข้าห้องล่าสุด ({lastRoom})
                        </button>
                    )}

                    <div className="pt-8 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-20">YouOke v2.22.0-FINAL</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`fixed inset-0 font-sans transition-colors duration-300 overflow-hidden ${theme === 'dark' ? 'bg-stone-950 text-white' : 'bg-stone-50 text-gray-900'}`}
            style={{
                overscrollBehavior: 'none',
                touchAction: 'none'
            }}
        >
            <div className="h-full overflow-y-auto pb-24" style={{ overscrollBehavior: 'none', touchAction: 'pan-y' }}>

                {/* UNIFIED Sticky Header & Search Block */}
                <div className={`sticky top-0 z-30 transition-colors shadow-xl ${theme === 'dark' ? 'bg-stone-900 border-none' : 'bg-white border-b border-gray-100'}`} style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}>
                    {/* Room Info Section */}
                    <div className="px-4 py-3 flex items-center justify-between gap-2">
                        <div className="flex-shrink-0 min-w-0">
                            <h1 className={`text-base font-black tracking-tight flex items-center gap-1.5 truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${status === 'connected' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`}></span>
                                ห้อง {roomCode}
                            </h1>
                            <div className={`text-[9px] font-black uppercase tracking-widest mt-0.5 flex items-center gap-1.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                <span className="truncate max-w-[60px]">{guestName}</span>
                                <span className="opacity-30">|</span>
                                <span>Q: {roomState.queue.length}</span>
                                {(!user || !user.email) && (
                                    <>
                                        <span className="opacity-30">|</span>
                                        <span className={guestSongCount >= SONG_LIMIT ? 'text-primary' : ''}>
                                            Limit: {guestSongCount}/{SONG_LIMIT}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 text-yellow-400' : 'bg-gray-100 text-gray-600 shadow-sm'}`}
                                title="สลับโหมด"
                            >
                                {theme === 'dark' ? <Sun size={18} strokeWidth={3} /> : <Moon size={18} strokeWidth={3} />}
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className={`p-2 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-500 shadow-sm'}`}
                                title="รีเฟรช"
                            >
                                <RefreshCw size={18} strokeWidth={3} />
                            </button>
                            <button
                                onClick={() => setShowLocalQr(true)}
                                className={`p-2 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-500 shadow-sm'}`}
                            >
                                <Share2 size={18} strokeWidth={3} />
                            </button>
                            <button
                                onClick={() => sendCommand('TOGGLE_FULLSCREEN')}
                                className={`p-2 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-500 shadow-sm'}`}
                            >
                                {roomState.layoutMode === 'fullscreen' ? (
                                    <Minimize size={18} strokeWidth={3} />
                                ) : (
                                    <Maximize size={18} strokeWidth={3} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* V1 Search & Toggle Section (Unified) */}
                    <div className="px-4 pb-3.5">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <DebounceInput
                                    minLength={1}
                                    debounceTimeout={500}
                                    value={searchTerm}
                                    onChange={(e) => handleSearchInput(e.target.value)}
                                    placeholder={searchType === 'video' ? 'ค้นหาเพลงหรือศิลปิน...' : 'ค้นหาเพลงคาราโอเกะ...'}
                                    className={`w-full border-none rounded-[1.5rem] px-11 py-3.5 text-sm font-black outline-none transition-all placeholder:font-bold tracking-tight ${theme === 'dark'
                                        ? 'bg-black text-white focus:ring-2 focus:ring-primary/40 placeholder:text-gray-700'
                                        : 'bg-gray-100 text-gray-900 focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400'
                                        }`}
                                />
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-black`}>
                                    <Search size={20} strokeWidth={3} />
                                </div>
                                {isSearching && (
                                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                {isVoiceSupported && (
                                    <button
                                        onClick={toggleListening}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all active:scale-95 ${isListening ? 'bg-primary text-white shadow-lg shadow-primary/40 animate-pulse' : 'text-black hover:text-primary'
                                            }`}
                                    >
                                        <Mic size={20} strokeWidth={3} className={isListening ? 'animate-bounce' : ''} />
                                    </button>
                                )}
                            </div>

                            <div className={`relative flex p-1 rounded-full gap-1 shrink-0 ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
                                <div className={`absolute inset-1 w-[46px] h-[46px] transition-all duration-300 ease-out ${searchType === 'karaoke' ? 'translate-x-[50px]' : 'translate-x-0'} ${theme === 'dark' ? 'bg-primary/20 border border-primary/40' : 'bg-red-50 border border-red-100 shadow-sm'}`} style={{ borderRadius: '9999px' }} />
                                <button
                                    onClick={() => handleTypeToggle('video')}
                                    className={`relative z-10 w-[46px] h-[46px] rounded-full flex items-center justify-center transition-colors duration-300 ${searchType === 'video' ? 'text-primary' : 'text-black hover:text-black/80'}`}
                                >
                                    <Music size={20} strokeWidth={3} />
                                </button>
                                <button
                                    onClick={() => handleTypeToggle('karaoke')}
                                    className={`relative z-10 w-[46px] h-[46px] rounded-full flex items-center justify-center transition-colors duration-300 ${searchType === 'karaoke' ? 'text-primary' : 'text-black hover:text-black/80'}`}
                                >
                                    <Mic2 size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Inline Search Results (V1 Style - Super Rounded) */}
                        {searchResults.length > 0 && (
                            <div className={`mt-4 grid grid-cols-1 gap-2 p-1.5 rounded-[2rem] overflow-hidden border ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-gray-50/80 border-gray-100'}`}>
                                <div className="flex items-center justify-between px-4 py-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">ผลการค้นหา</span>
                                    <button onClick={() => { setSearchTerm(''); setSearchResults([]); }} className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-gray-400 hover:text-black'}`}>ล้างข้อมูล</button>
                                </div>
                                <div className="space-y-2 max-h-[350px] overflow-y-auto px-1.5 pb-2 custom-scrollbar">
                                    {searchResults.map((video, idx) => (
                                        <RemoteSearchResultCard
                                            key={`${video.videoId}-${idx}`}
                                            video={video}
                                            onClick={() => handleAddVideo(video)}
                                            theme={theme}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Queue List (V1 Aesthetic - Super Rounded) */}
                <div className="p-4 space-y-5">
                    <div className="flex items-center justify-between px-2">
                        <h2 className={`text-[12px] font-black uppercase tracking-[0.2em] flex items-center gap-3 ${theme === 'dark' ? 'text-white/90' : 'text-black/80'}`}>
                            <div className="w-1.5 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(229,9,20,0.4)]"></div>
                            คิวต่อไป
                        </h2>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border tracking-widest ${theme === 'dark' ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-white border-gray-200 text-gray-400 shadow-sm'}`}>
                            {Math.max(0, roomState.queue.length - (roomState.currentIndex + 1))} เพลง
                        </span>
                    </div>

                    {roomState.queue.length <= 1 ? (
                        <div className={`text-center py-24 border-2 border-dashed rounded-[2.5rem] transition-colors ${theme === 'dark' ? 'border-white/5 bg-white/[0.01]' : 'border-gray-100 bg-gray-50'}`}>
                            <h3 className={`font-black text-xl mb-2 tracking-tight ${theme === 'dark' ? 'text-white/40' : 'text-gray-300'}`}>ยังไม่มีเพลงในคิว</h3>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-600">ค้นหาเพื่อเพิ่มเพลงที่ด้านบน</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={roomState.queue.slice(roomState.currentIndex + 1).map(v => v.uuid || v.videoId || `${v.title}-${v.author}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {roomState.queue.slice(roomState.currentIndex + 1).map((video, idx) => {
                                        const uniqueId = video.uuid || video.videoId || `${video.title}-${video.author}`;
                                        return (
                                            <DraggableQueueItem
                                                key={uniqueId}
                                                video={video}
                                                index={idx}
                                                uniqueId={uniqueId}
                                                onRemove={(id) => {
                                                    if (confirm('ลบเพลงนี้ออกจากคิว?')) {
                                                        sendCommand('REMOVE_AT', { uuid: id });
                                                    }
                                                }}
                                                theme={theme}
                                            />
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>

                {/* Action Buttons Toggle (Ultimate Rounded Thai) */}
                <div className="px-4 pb-6">
                    <button
                        onClick={() => sendCommand('TOGGLE_QUEUE_OVERLAY')}
                        className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${roomState.isQueueVisible
                            ? 'bg-primary text-white shadow-[0_12px_32px_rgba(229,9,20,0.5)]'
                            : (theme === 'dark' ? 'bg-stone-900 border border-white/5 text-gray-500' : 'bg-white shadow-lg border border-gray-100 text-gray-400')
                            }`}
                    >
                        <ListMusic size={20} />
                        {roomState.isQueueVisible ? 'ซ่อนรายการเพลง' : 'แสดงรายการเพลง ใน TV'}
                    </button>
                </div>

                {/* Bottom Player (V1 Control Bar) */}
                <RemoteMiniPlayer
                    currentVideo={roomState.currentVideo || roomState.queue[roomState.currentIndex] || (roomState.queue.length > 0 ? roomState.queue[0] : null)}
                    isPlaying={roomState.controls.isPlaying}
                    onTogglePlay={() => sendCommand(roomState.controls.isPlaying ? 'PAUSE' : 'PLAY')}
                    onNext={() => sendCommand('NEXT')}
                    onToggleQueue={() => sendCommand('TOGGLE_QUEUE_OVERLAY')}
                    theme={theme}
                />

                {/* Name Modal */}
                {showNameModal && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
                        <div className={`w-full max-w-sm rounded-[2rem] p-8 shadow-2xl transition-colors ${theme === 'dark' ? 'bg-stone-900 text-white border border-white/10' : 'bg-white text-gray-900'}`}>
                            <div className="text-center mb-8">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-primary/10'}`}>
                                    <User className={`w-10 h-10 ${theme === 'dark' ? 'text-white' : 'text-primary'}`} />
                                </div>
                                <h2 className="text-3xl font-black mb-2 tracking-tight">เข้าร่วมปาร์ตี้</h2>
                                <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ใส่ชื่อเล่นของคุณเพื่อเริ่มขอเพลง</p>
                            </div>
                            <form onSubmit={handleNameSubmit} className="space-y-6">
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="ชื่อเล่น (เช่น ตั้ม)"
                                    className={`w-full rounded-2xl px-6 py-4 text-center font-bold text-lg outline-none transition-all placeholder:font-normal ${theme === 'dark'
                                        ? 'bg-black border border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50'
                                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/20'}`}
                                    maxLength={15}
                                    autoFocus
                                />
                                <button type="submit" className="w-full bg-primary hover:bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-primary/30 active:scale-[0.98] transition-all">
                                    ไปลุยกันเลย! 🚀
                                </button>
                            </form>
                        </div>
                    </div>
                )}


                {/* QR Share Modal */}
                {showLocalQr && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6" onClick={() => setShowLocalQr(false)}>
                        <div className="bg-white p-6 rounded-3xl text-center space-y-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                                <span className="font-bold text-lg text-gray-900">YouOke</span>
                                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md hidden sm:inline-block">v2.22.0-FINAL</span>
                            </div>
                            <div className="bg-gray-100 p-2 rounded-xl inline-block">
                                {/* @ts-ignore */}
                                {roomCode && typeof window !== 'undefined' && <QRCodeSVG value={`${window.location.origin}/remote?room=${roomCode}`} size={200} />}
                            </div>
                            <p className="text-sm text-gray-500">ให้เพื่อนสแกนเพื่อช่วยกันเพิ่มเพลง</p>
                        </div>
                    </div>
                )}
                {/* Remote Toast Overlay */}
                {remoteToast && (
                    <div className="fixed top-20 left-4 right-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-4 ${theme === 'dark' ? 'bg-stone-900/95 border-white/10 text-white' : 'bg-white/95 border-gray-100 text-gray-900'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${remoteToast.type === 'upnext' ? 'bg-amber-500 text-black' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}>
                                {remoteToast.type === 'upnext' ? <RefreshCw className="animate-spin-slow" /> : <Music />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{remoteToast.message}</p>
                                <p className="text-sm font-black truncate">{remoteToast.sub}</p>
                            </div>
                        </div>
                    </div>
                )}
                {/* Song Limit Modal */}
                {showLimitModal && (
                    <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-6 backdrop-blur-md">
                        <div className={`w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl transition-all scale-in-center ${theme === 'dark' ? 'bg-stone-900 border border-white/10' : 'bg-white'}`}>
                            <div className="text-center mb-8">
                                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                    <Music className="w-12 h-12 text-primary" />
                                    <div className="absolute -top-1 -right-1 bg-primary text-white p-2 rounded-full shadow-lg">
                                        <Lock size={16} strokeWidth={3} />
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black mb-3 tracking-tighter">ขีดจำกัดเพลงฟรี</h2>
                                <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    คุณร้องครบ {SONG_LIMIT} เพลงสำหรับวันนี้แล้ว <br />
                                    เข้าสู่ระบบเพื่อร้องต่อได้ไม่จำกัด! 🎤✨
                                </p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={isLoggingIn}
                                    className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-gray-100 border border-gray-200"
                                >
                                    {isLoggingIn ? (
                                        <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Chrome size={22} strokeWidth={3} />
                                            เข้าสู่ระบบด้วย Google
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => router.push('/login')}
                                    className={`w-full py-4 rounded-2xl font-black text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                                >
                                    <LogIn size={22} strokeWidth={3} />
                                    เข้าสู่ระบบด้วย Email
                                </button>

                                <button
                                    onClick={() => setShowLimitModal(false)}
                                    className="w-full py-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors mt-2"
                                >
                                    ไว้ทีหลัง
                                </button>
                            </div>

                            <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-[11px] text-primary/80 leading-relaxed font-bold uppercase tracking-wider">
                                    สิทธิพิเศษสมาชิก: ไม่มีโฆษณา, คิวเพลงไม่จำกัด, และรองรับการควบคุมจากทุกที่
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
