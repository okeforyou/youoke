
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInAnonymously } from 'firebase/auth';
import { ref, onValue, off, set, serverTimestamp } from 'firebase/database';
import { auth, realtimeDb } from '../../../firebase';
import { QueueItem } from '../../../modules/player/types';
import {
    ListMusic, User, Share2, Maximize, RefreshCw, Volume2, VolumeX, SkipForward, SkipBack, Play, Pause, Trash2, GripVertical, Search, Sun, Moon, Music, Mic
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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
}

export default function RemoteControlApp() {
    const router = useRouter();
    const { room: roomCode } = router.query;

    // State
    const [status, setStatus] = useState<RemoteStatus>('connecting');
    const [roomState, setRoomState] = useState<RoomState>({
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: false, volume: 100 },
        isQueueVisible: false
    });
    const [guestName, setGuestName] = useState('');
    const [showNameModal, setShowNameModal] = useState(false);
    const [loading, setLoading] = useState(true); // Added loading state

    const [isSearchOpen, setSearchOpen] = useState(false);
    const [showLocalQr, setShowLocalQr] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to Dark (V1 Classic)

    // Search Logic (V1 Integrated)
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchType, setSearchType] = useState<'video' | 'karaoke'>('video');
    const debounceRef = React.useRef<NodeJS.Timeout>();

    // Load theme preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('remote_theme') as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('remote_theme', newTheme);
    };

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

    const handleTypeToggle = (type: 'video' | 'karaoke') => {
        setSearchType(type);
        if (searchTerm) performSearch(searchTerm, type);
    };

    // Initial Setup
    useEffect(() => {
        const storedName = localStorage.getItem('youoke_guest_name');
        if (storedName) {
            setGuestName(storedName);
        } else {
            setShowNameModal(true);
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
                            isQueueVisible: data.isQueueVisible
                        });
                        setStatus('connected');
                        setLoading(false); // Set loading to false once connected
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
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (unsubscribePresence) unsubscribePresence();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            const { remove } = require('firebase/database');
            remove(myPresenceRef).catch(() => { });
        };
    }, [roomCode, guestName, currentUser]);

    // Command Sender
    const sendCommand = async (type: string, payload: any = {}) => {
        if (!roomCode || !realtimeDb) return;
        const currentUser = auth?.currentUser;
        if (!currentUser) return;

        const cmdId = Date.now().toString();
        const command = {
            id: cmdId,
            command: {
                type,
                payload: {
                    ...payload,
                    addedBy: { uid: currentUser.uid, name: guestName }
                }
            },
            status: 'pending',
            timestamp: serverTimestamp(),
            senderId: currentUser.uid
        };

        console.log('📤 Sending command:', { type, roomCode, cmdId });

        // Write directly to commands list
        const cmdRef = ref(realtimeDb, `rooms/${roomCode}/commands/${cmdId}`);
        await set(cmdRef, command);

        console.log('✅ Command sent successfully');
    };

    // Handlers
    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const input = (e.target as any).name.value;
        if (input.trim()) {
            localStorage.setItem('youoke_guest_name', input.trim());
            setGuestName(input.trim());
            setShowNameModal(false);
        }
    };

    const handleAddVideo = (video: any) => {
        console.log('➕ Adding video to queue:', video.title);
        sendCommand('ADD_TO_QUEUE', { video });
        setSearchTerm('');
        setSearchResults([]);
    };

    // Drag & Drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
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
            return itemId === over.id;
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

        console.log('🔄 Reordering queue:', { oldIndex, newIndex, newQueueLength: fullQueue.length });

        // Send REORDER_QUEUE command with full queue
        sendCommand('REORDER_QUEUE', { queue: fullQueue });
    };

    if (!roomCode) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-gray-500 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่พบรหัสห้อง</h2>
                <p className="text-sm text-center">กรุณาเข้าใช้งานผ่าน QR Code หรือลิงก์ที่มีรหัสห้อง</p>
                <p className="text-xs text-gray-400 mt-4">URL ต้องมี: ?room=1234</p>
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

                {/* Header (V1 Style) */}
                <div className={`px-5 py-4 sticky top-0 z-10 border-b flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-stone-900 border-white/10 shadow-lg' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div>
                        <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'}`}></span>
                            ห้อง {roomCode}
                        </h1>
                        <div className={`text-[10px] font-black uppercase tracking-widest mt-0.5 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span className="flex items-center gap-1">
                                {guestName}
                            </span>
                            <span className="opacity-30">|</span>
                            <span>คิว: {roomState.queue.length}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2.5 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-sm'}`}
                            title="สลับโหมด"
                        >
                            {theme === 'dark' ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className={`p-2.5 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 shadow-sm'}`}
                            title="รีเฟรช"
                        >
                            <RefreshCw size={20} strokeWidth={2.5} />
                        </button>

                        <button
                            onClick={() => setShowLocalQr(true)}
                            className={`p-2.5 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 shadow-sm'}`}
                        >
                            <Share2 size={20} strokeWidth={2.5} />
                        </button>

                        <button
                            onClick={() => sendCommand('TOGGLE_FULLSCREEN')}
                            className={`p-2.5 rounded-full transition-all active:scale-90 ${theme === 'dark' ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 shadow-sm'}`}
                        >
                            <Maximize size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* V1 Integrated Search Section (Sticky-linked) */}
                <div className={`px-4 pb-4 sticky top-[77px] z-10 transition-colors border-b ${theme === 'dark' ? 'bg-stone-900 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-lg'}`}>
                    <div className="flex items-center gap-3">
                        {/* Search Bar (Thai + Dynamic Placeholder) */}
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
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                                <Search size={20} strokeWidth={3} />
                            </div>
                            {isSearching && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* V1 SLIDING Toggle */}
                        <div className={`relative flex p-1 rounded-full gap-1 shrink-0 ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
                            {/* Sliding Background */}
                            <div
                                className={`absolute inset-1 w-[46px] h-[46px] bg-primary rounded-full transition-all duration-300 ease-out shadow-lg ${searchType === 'karaoke' ? 'translate-x-[50px]' : 'translate-x-0'
                                    }`}
                            />

                            <button
                                onClick={() => handleTypeToggle('video')}
                                className={`relative z-10 w-[46px] h-[46px] rounded-full flex items-center justify-center transition-colors duration-300 ${searchType === 'video' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Music size={20} strokeWidth={3} />
                            </button>
                            <button
                                onClick={() => handleTypeToggle('karaoke')}
                                className={`relative z-10 w-[46px] h-[46px] rounded-full flex items-center justify-center transition-colors duration-300 ${searchType === 'karaoke' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Mic size={20} strokeWidth={3} />
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
                                        // CRITICAL: Prioritize uuid for stable reordering
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
                        {roomState.isQueueVisible ? 'ซ่อนแผงควบคุม' : 'แสดงแผงควบคุม'}
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
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6">
                        <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold">เข้าร่วมปาร์ตี้</h2>
                                <p className="text-gray-500 text-sm mt-1">ใส่ชื่อเล่นของคุณเพื่อเริ่มขอเพลง</p>
                            </div>
                            <form onSubmit={handleNameSubmit} className="space-y-4">
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="ชื่อเล่น (เช่น ตั้ม)"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                    maxLength={15}
                                    autoFocus
                                />
                                <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
                                    ไปลุยกันเลย!
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {/* QR Share Modal */}
                {showLocalQr && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6" onClick={() => setShowLocalQr(false)}>
                        <div className="bg-white p-6 rounded-3xl text-center space-y-4" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg">สแกนเพื่อเข้าร่วม</h3>
                            <div className="bg-gray-100 p-2 rounded-xl inline-block">
                                {/* @ts-ignore */}
                                {roomCode && <QRCodeSVG value={`${window.location.origin}/remote?room=${roomCode}`} size={200} />}
                            </div>
                            <p className="text-sm text-gray-500">ให้เพื่อนสแกนเพื่อช่วยกันเพิ่มเพลง</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
