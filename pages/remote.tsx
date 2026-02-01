import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { realtimeDb } from '../firebase';
import { ref, set, push, onValue, remove, onDisconnect } from 'firebase/database';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Video } from '../types';
import GuestNameModal from '../components/Remote/GuestNameModal';
import {
    PlayIcon, PauseIcon, ForwardIcon, BackwardIcon,
    MagnifyingGlassIcon, PlusIcon, CheckIcon,
    SignalIcon, SignalSlashIcon, DevicePhoneMobileIcon,
    ArrowsPointingOutIcon, ArrowPathIcon,
    ListBulletIcon, XMarkIcon, MusicalNoteIcon, MicrophoneIcon,
    ArrowsPointingInIcon, TrashIcon, Bars3Icon,
    UserPlusIcon, QrCodeIcon, ClipboardDocumentCheckIcon, SparklesIcon,
    SunIcon, MoonIcon, TvIcon
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code generator directly if simple Usage needed, or reuse component
import { DebounceInput } from 'react-debounce-input';
import axios from 'axios';

// Sortable Queue Item Component (with Drag Handle)
function SortableQueueItem({ id, video, index, getThumbnail, onRemove }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef, // Handle Ref
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        // touchAction: 'none' // Removed to allow scrolling on the body
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none data-[dragging=true]:bg-gray-100 dark:data-[dragging=true]:bg-white/10 relative text-gray-900 dark:text-gray-200">
            {/* Drag Handle - Left */}
            <div
                ref={setActivatorNodeRef}
                {...listeners}
                {...attributes}
                className="text-gray-600 cursor-grab active:cursor-grabbing p-2 -ml-2 hover:text-white touch-none"
            >
                <Bars3Icon className="w-6 h-6" />
            </div>

            <img src={getThumbnail(video)} className="w-10 h-10 rounded-md object-cover pointer-events-none bg-gray-200 dark:bg-black" alt="" />
            <div className="flex-1 min-w-0 pointer-events-none">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{video.title}</p>
                <p className="text-xs text-gray-500 truncate">{video.addedBy?.displayName || "Guest"}</p>
            </div>

            {/* Remove Button - Right */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent drag start?
                    onRemove(index);
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    );
}

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

const RemotePage = () => {
    const router = useRouter();
    // Support both 'session' and 'room' query params for auto-joining
    const sessionId = (router.query.session || router.query.room) as string;
    const [status, setStatus] = useState<RemoteState | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Prevent Hydration Mismatch
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Guest Identity
    // Guest Identity - Initialize lazily from LocalStorage to prevent flash
    const [guestProfile, setGuestProfile] = useState<{ name: string, uid: string } | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('youoke_guest_profile');
            return saved ? JSON.parse(saved) : null;
        }
        return null;
    });
    const [showNameModal, setShowNameModal] = useState(false);

    // Host Mode Logic
    const isHost = router.query.role === 'host';
    const [isHostMode, setIsHostMode] = useState(false);

    // Theme State
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        // Init theme from storage or default to dark
        const savedTheme = localStorage.getItem('youoke_theme') as 'dark' | 'light' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            document.documentElement.classList.add('dark'); // Default dark
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('youoke_theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Sharing
    const [showQR, setShowQR] = useState(false);

    // Scroll State for Header Shadow
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Wake Lock
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                    console.log('💡 Screen Wake Lock Active');
                } catch (err) {
                    console.error('Wake Lock Error:', err);
                }
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        // Request initial lock (might fail until user interaction, but worth trying)
        requestWakeLock();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('click', requestWakeLock, { once: true }); // Retry on first click

        return () => {
            if (wakeLock) wakeLock.release();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Queue Notification Logic
    const [lastNotifiedVideoId, setLastNotifiedVideoId] = useState<string>('');
    const [showTurnNotification, setShowTurnNotification] = useState<string | null>(null);

    useEffect(() => {
        if (!status?.currentVideo || !guestProfile?.uid) return;

        const currentVideo = status.currentVideo;
        const videoId = currentVideo.videoId;

        // Skip if already notified for this song
        if (videoId === lastNotifiedVideoId) return;

        // Check if added by current user
        // Using loose comparison for IDs just in case
        const addedByUid = currentVideo.addedBy?.uid;

        if (addedByUid && String(addedByUid) === String(guestProfile.uid)) {
            console.log('🔔 User Turn Notification Triggered for:', currentVideo.title);

            // Haptic Feedback
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

            // Show Toast
            setShowTurnNotification(currentVideo.title);
            setLastNotifiedVideoId(videoId);

            // Auto Hide
            setTimeout(() => setShowTurnNotification(null), 5000);
        }
    }, [status?.currentVideo?.videoId, guestProfile?.uid]);

    useEffect(() => {
        if (!router.isReady) return;

        // Check for Host Mode first
        if (router.query.role === 'host') {
            setIsHostMode(true);
            setGuestProfile({ name: 'Host', uid: 'host' });
            return;
        }

        // Check if we need to show modal (if no profile exists)
        if (sessionId && !guestProfile && !isHostMode) {
            setShowNameModal(true);
        }
    }, [router.isReady, router.query.role, sessionId, guestProfile, isHostMode]);

    const handleSaveGuestName = (name: string) => {
        const newProfile = {
            name,
            uid: Math.random().toString(36).substr(2, 9) // Simple random UID
        };
        localStorage.setItem('youoke_guest_profile', JSON.stringify(newProfile));
        setGuestProfile(newProfile);
        setShowNameModal(false);
    };

    // Sync Suppression
    const lastInteractionRef = useRef<number>(0);

    // Filter/UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [addedId, setAddedId] = useState<string | null>(null);
    const [searchType, setSearchType] = useState<'song' | 'karaoke'>('song');

    // Generate Stable IDs for DnD
    const currentIndex = typeof status?.currentIndex === 'number' ? status.currentIndex : -1;
    const queueList = (status?.queue || []).map((item, idx) => {
        // GENERATE STABLE ID: MUST be content-based.
        // using 'idx' or 'key' (if key is just index) breaks DnD reordering.
        // We use a specific prefix to ensure string ID.
        const compositeKey = `v-${item.videoId}-${item.addedBy?.uid || 'anon'}-${item.addedAt || idx}`;
        return {
            ...item,
            // FORCE compositeKey unless key is definitely a UUID (length > 10).
            // Firebase keys for array are usually "0", "1", etc.
            dndId: (item.key && String(item.key).length > 5) ? String(item.key) : compositeKey
        };
    });

    const upcomingQueue = queueList.slice(currentIndex + 1);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Requires 8px movement to start drag (prevents accidental drags on tap)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = () => {
        lastInteractionRef.current = Date.now();
    };

    const handleDragMove = () => {
        lastInteractionRef.current = Date.now();
    };

    const handleDragEnd = (event: DragEndEvent) => {
        lastInteractionRef.current = Date.now(); // Suppress on end too
        const { active, over } = event;
        if (active.id !== over?.id && status?.queue) {
            // Use precise ID lookup (Must match SortableContext ID generation)
            const oldIndex = upcomingQueue.findIndex((item: any) => item.dndId === active.id);
            const newIndex = upcomingQueue.findIndex((item: any) => item.dndId === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // Reorder upcoming queue locally first (Optimistic UI would need more complex state, skipping for now to rely on Host sync)
                // Actually, let's just calculate new full queue and send it

                const reorderedUpcoming = arrayMove(upcomingQueue, oldIndex, newIndex);

                // Reconstruct FULL queue
                // [Played/Current] + [Reordered Upcoming]
                const playedAndCurrent = queueList.slice(0, currentIndex + 1);
                const newFullQueue = [...playedAndCurrent, ...reorderedUpcoming];

                // Send to Host
                sendCommand('REORDER_QUEUE', { newQueue: newFullQueue });

                // Optimistic update locally to prevent jumpiness
                setStatus(prev => prev ? { ...prev, queue: newFullQueue } : null);

                // Suppress incoming sync for 2 seconds to allow Host to process
                lastInteractionRef.current = Date.now();
            }
        }
    };

    // Remove Handler (Robust - Index Based)
    const handleRemove = (localIndex: number) => {
        // Suppress sync immediately
        lastInteractionRef.current = Date.now();

        if (!status?.queue) return;

        const currentIndex = typeof status?.currentIndex === 'number' ? status.currentIndex : -1;

        // Calculate Absolute Index in the Full Queue
        // Upcoming Queue starts at currentIndex + 1
        const absoluteIndex = (currentIndex + 1) + localIndex;

        if (absoluteIndex < 0 || absoluteIndex >= status.queue.length) {
            console.warn('❌ Invalid remove index', absoluteIndex);
            return;
        }

        console.log('🗑️ Removing item at Absolute Index:', absoluteIndex, 'Local:', localIndex);

        // Send Command
        sendCommand('REMOVE_AT', { index: absoluteIndex });

        // Optimistic Update
        const newFullQueue = [...status.queue];
        newFullQueue.splice(absoluteIndex, 1);
        setStatus(prev => prev ? { ...prev, queue: newFullQueue } : null);
    };



    // Optimistic Fullscreen State
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Sync local fullscreen with host if available
    useEffect(() => {
        if (status?.isFullscreen !== undefined) {
            setIsFullScreen(status.isFullscreen);
        }
    }, [status?.isFullscreen]);

    // Initial Load - Get Session ID from URL
    // This useEffect is no longer needed as sessionId is directly from router.query
    // useEffect(() => {
    //     if (router.isReady) {
    //         const { session, room } = router.query;
    //         // Support both ?session= and ?room=
    //         const code = session || room;
    //         if (code && typeof code === 'string') {
    //             setSessionId(code);
    //         }
    //     }
    // }, [router.isReady, router.query]);

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
                        const isInteracting = Date.now() - lastInteractionRef.current < 5000;

                        setStatus(prev => {
                            if (!prev) return data;
                            // If interacting, keep optimistic isPlaying AND queue to prevent jumps
                            if (isInteracting && prev) {
                                return {
                                    ...data,
                                    isPlaying: prev.isPlaying,
                                    // Only keep queue if we have one, otherwise take data's
                                    queue: prev.queue || data.queue
                                };
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
                // Debug: Log incoming state
                // console.log('📱 Remote: Received State Update:', {
                //    queueLen: val.queue?.length || 0,
                //    firstKey: val.queue?.[0]?.key,
                //    isInteracting: Date.now() - lastInteractionRef.current < 2000
                // });

                // SYNC SUPPRESSION match polling logic
                // SYNC SUPPRESSION match polling logic
                const isInteracting = Date.now() - lastInteractionRef.current < 5000;
                setStatus(prev => {
                    if (isInteracting && prev) {
                        return {
                            ...val,
                            isPlaying: prev.isPlaying,
                            queue: prev.queue || val.queue
                        };
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
        sendCommand('SET_FULLSCREEN', { state: nextState });
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
        // Robust Profile Check: Try State -> Try LocalStorage -> Default
        let currentProfile = guestProfile;
        if (!currentProfile && typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('youoke_guest_profile');
                if (saved) currentProfile = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse profile', e);
            }
        }

        const queueVideo = {
            videoId: video.videoId,
            title: video.title,
            author: 'YouTube',
            key: Date.now(),
            addedBy: {
                displayName: currentProfile?.name || "Guest User",
                photoURL: null,
                uid: currentProfile?.uid || "mobile-user-" + Date.now()
            }
        };
        sendCommand('ADD_QUEUE', { video: queueVideo });
        setAddedId(video.videoId);
        setTimeout(() => setAddedId(null), 2000);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    // Turn Notification


    useEffect(() => {
        if (!status?.currentVideo || !guestProfile) return;

        const currentUid = status.currentVideo.addedBy?.uid;
        // Check if current song is added by this user (and we haven't notified for this video yet)
        if (currentUid === guestProfile.uid) {
            // We need a way to track if we already notified for THIS specific video ID to avoid loops
            // Using sessionStorage to track 'lastNotifiedVideoId'
            if (typeof window !== 'undefined') {
                const lastNotified = sessionStorage.getItem('lastNotifiedVideoId');
                if (lastNotified !== status.currentVideo.videoId) {
                    // Trigger Notification
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
                    setShowTurnNotification(status.currentVideo.title);
                    sessionStorage.setItem('lastNotifiedVideoId', status.currentVideo.videoId);

                    // Auto hide after 5s
                    setTimeout(() => setShowTurnNotification(null), 5000);
                }
            }
        }
    }, [status?.currentVideo?.videoId, guestProfile]);


    if (!mounted || !router.isReady) return null;

    if (!sessionId) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <GuestNameModal
                    isOpen={showNameModal}
                    onSave={handleSaveGuestName}
                />
                {/* Header */}
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <DevicePhoneMobileIcon className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">เชื่อมต่อกับห้อง</h1>
                <p className="text-gray-400 mb-6 text-center">กรอกรหัส PIN ที่แสดงบนหน้าจอ</p>
                <input type="number" placeholder="PIN 4 หลัก" className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl text-center text-2xl tracking-widest w-full max-w-xs mb-4 focus:ring-2 focus:ring-primary focus:outline-none" onChange={(e) => { if (e.target.value.length >= 4) router.push(`?session=${e.target.value}`); }} />
            </div>
        );
    }

    const handleInvite = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'ร้องเพลงกันเถอะ! 🎤',
                    text: `มาช่วยกันเลือกเพลงหน่อย! ห้อง: ${sessionId}`,
                    url: url
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            navigator.clipboard.writeText(url);
            // alert('คัดลอกลิ้งค์แล้ว! ส่งให้เพื่อนได้เลย 📋'); // Replaced with custom toast or simpler alert
            alert('คัดลอกลิ้งค์เรียบร้อยแล้ว');
        }
    };

    // Derived State
    // Derived variables (Using top-level queueList)
    const pastQueue = currentIndex > 0 ? queueList.slice(0, currentIndex) : [];
    const currentQueueItem = currentIndex >= 0 && currentIndex < queueList.length ? queueList[currentIndex] : null;
    const totalQueueCount = queueList.length;

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
            className="fixed inset-0 bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex flex-col font-sans overflow-hidden transition-colors duration-300"
            style={{ overscrollBehaviorY: 'none' }} // Prevent Pull-to-Refresh
        >
            <Head>
                <title>รีโมทคอนโทรล</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
            </Head>

            {/* Simple QR Modal for Remote */}
            {showQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setShowQR(false)}>
                    <div className="bg-white p-6 rounded-3xl" onClick={e => e.stopPropagation()}>
                        <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : ''} size={250} level="H" includeMargin />
                        <div className="flex items-center justify-center gap-2 mt-4 text-black font-bold">
                            <QrCodeIcon className="w-6 h-6" />
                            <p>สแกนเพื่อเข้าร่วมห้อง</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Turn Notification Toast - High Contrast Always */}
            {showTurnNotification && (
                <div className="fixed top-24 left-4 right-4 z-[60] animate-bounce-in pointer-events-none">
                    <div className="bg-zinc-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shrink-0 animate-pulse shadow-[0_0_15px_theme(colors.primary.DEFAULT)]">
                            <MicrophoneIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <SparklesIcon className="w-4 h-4 text-yellow-400" />
                                <p className="font-bold text-white text-lg leading-none">ถึงคิวร้องแล้ว!</p>
                            </div>
                            <p className="text-gray-300 text-sm truncate">{showTurnNotification}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Background Atmosphere */}
            {/* Background Atmosphere (Dark Mode Only) */}
            <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-125 pointer-events-none transition-all duration-1000 z-0 hidden dark:block" style={{ backgroundImage: `url(${highResThumbnail})` }} />
            <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none hidden dark:block" />

            {/* Guest Name Modal - Force Input if missing */}
            <GuestNameModal
                isOpen={showNameModal}
                onSave={handleSaveGuestName}
            />

            {/* 1. Header (Room Info - Polished Sticky Glassmorphism) */}
            <div className={`px-4 py-3 sticky top-0 z-30 transition-all duration-300 backdrop-blur-none dark:backdrop-blur-md border-b flex items-center justify-between ${scrolled
                ? 'bg-white dark:bg-black/80 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-lg'
                : 'bg-transparent border-transparent'
                }`}>

                {/* Left: Title + Room Code */}
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                            YouOke
                        </h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded tracking-wide uppercase">
                                ROOM
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono tracking-wider">
                                {sessionId}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Actions Group */}
                <div className="flex items-center gap-1">
                    {/* QR Code */}
                    <button
                        onClick={() => setShowQR(true)}
                        className="p-2 rounded-full text-black dark:text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
                        title="Show QR Code"
                    >
                        <QrCodeIcon className="w-5 h-5" />
                    </button>



                    {/* Share Link (UserPlus for "Invite") */}
                    <button
                        onClick={handleInvite}
                        className="p-2 rounded-full text-black dark:text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
                        title="Invite Friends"
                    >
                        <UserPlusIcon className="w-5 h-5" />
                    </button>

                    {/* Fullscreen (TV Control) */}
                    <button
                        onClick={toggleFullscreen}
                        className={`p-2 rounded-full transition-all active:scale-95 ${isFullScreen ? 'text-primary bg-primary/10' : 'text-black dark:text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                            }`}
                        title={isFullScreen ? "ย่อจอทีวี" : "ขยายจอทีวีเต็มจอ"}
                    >
                        {isFullScreen ? (
                            <ArrowsPointingInIcon className="w-5 h-5" />
                        ) : (
                            <div className="relative flex items-center justify-center">
                                <TvIcon className="w-5 h-5" />
                                <ArrowsPointingOutIcon className="w-2.5 h-2.5 absolute -top-1 -right-1 bg-white dark:bg-black rounded-full p-0.5 border border-current" />
                            </div>
                        )}
                    </button>

                    {/* Refresh / Re-sync */}
                    <button
                        onClick={() => router.reload()}
                        className="p-2 rounded-full text-black dark:text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-95"
                        title="Refresh Page"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>

                    {/* Theme Toggle (Moved to End) */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-black dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? (
                            <SunIcon className="w-5 h-5" />
                        ) : (
                            <MoonIcon className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* 2. Top Search Bar */}
            <div className="p-4 z-20 bg-white dark:bg-transparent dark:bg-gradient-to-b dark:from-black/80 dark:to-transparent shrink-0 space-y-3 border-none shadow-sm dark:shadow-none">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    <DebounceInput
                        minLength={2}
                        debounceTimeout={500}
                        placeholder={searchType === 'karaoke' ? "ค้นหาเพลงคาราโอเกะ..." : "ค้นหาเพลง..."}
                        className="w-full bg-gray-50 dark:bg-zinc-900/80 border border-gray-300 dark:border-white/10 rounded-2xl py-3 pl-12 pr-10 text-black dark:text-white focus:border-primary focus:ring-0 focus:outline-none placeholder-gray-500 dark:placeholder-gray-500 transition-all font-medium shadow-none dark:shadow-lg backdrop-blur-none dark:backdrop-blur-sm"
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
                <div className="bg-gray-100 dark:bg-zinc-800/80 p-1 rounded-xl flex shadow-inner border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                    <button
                        onClick={() => setSearchType('song')}
                        className={`flex-1 py-1.5 flex items-center justify-center gap-2 text-xs font-bold rounded-lg transition-all ${searchType === 'song' ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
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
            <div className="flex-1 overflow-y-auto min-h-0 z-10 pb-44 px-4 remote-scroll"> {/* pb-44 for Bottom Player */}

                {/* Mode: Search Results */}
                {isShowingResults && (
                    <div className="space-y-2 animate-fadeIn">
                        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3 mt-2">ผลการค้นหา</h3>
                        {isSearching && <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>}

                        {!isSearching && searchResults.length === 0 && <div className="text-center py-10 text-gray-500">ไม่พบเพลง</div>}

                        {!isSearching && searchResults.map((video: any) => (
                            <div key={video.videoId} onClick={() => handleAddQueue({ ...video, thumbnail: getThumbnail(video) })} className={`flex items-center gap-3 p-2 pr-3 rounded-xl active:scale-[0.98] transition-all cursor-pointer ${addedId === video.videoId ? 'bg-green-500/20 border border-green-500/50' : 'bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm dark:shadow-none'}`}>
                                <img src={getThumbnail(video)} className="w-14 h-14 rounded-lg object-cover bg-gray-200 dark:bg-black shadow-md" alt="" />
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-sm line-clamp-2 leading-tight ${addedId === video.videoId ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>{video.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{video.author?.name || video.author || "YouTube"}</p>
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
                                    <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest">คิวเพลง ({totalQueueCount})</h3>
                                </div>

                                {/* Past Queue (Hidden per user request, can re-enable later) */}
                                {/* {pastQueue.map((video: any, idx: number) => (
                                    <div key={video.key || idx} className="flex items-center gap-3 p-2 rounded-xl bg-black/10 border border-white/5 opacity-40 grayscale pointer-events-none">
                                        <div className="w-8 flex justify-center text-gray-600">
                                            <CheckIcon className="w-5 h-5" />
                                        </div>
                                        <img src={getThumbnail(video)} className="w-10 h-10 rounded-md object-cover" alt="" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-400 truncate">{video.title}</p>
                                        </div>
                                    </div>
                                ))} */}

                                {/* Current Item (Highlighted) */}
                                {currentQueueItem && (
                                    <div className="flex items-center gap-3 p-2 rounded-xl bg-red-600 dark:bg-primary/20 border-2 border-red-600 dark:border-primary/50 relative overflow-hidden shadow-md dark:shadow-none">
                                        {/* Pulse Effect (Dark Mode Only) */}
                                        <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none hidden dark:block" />

                                        <div className="w-8 flex justify-center text-white dark:text-primary z-10">
                                            <MusicalNoteIcon className="w-5 h-5 animate-bounce" />
                                        </div>
                                        <img src={getThumbnail(currentQueueItem)} className="w-10 h-10 rounded-md object-cover z-10 shadow-sm border border-white/20" alt="" />
                                        <div className="flex-1 min-w-0 z-10">
                                            <p className="text-sm font-bold text-white truncate">{currentQueueItem.title}</p>
                                            <p className="text-xs font-bold text-white/90 dark:font-normal dark:text-primary-content/70">กำลังเล่น...</p>
                                        </div>
                                    </div>
                                )}

                                {/* Upcoming Queue (Sortable) */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragMove={handleDragMove}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={upcomingQueue.map((v: any) => v.dndId)} // Pass IDs, not objects
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {upcomingQueue.map((video: any, idx: number) => {
                                            return (
                                                <SortableQueueItem
                                                    key={video.dndId} // Use stable dndId
                                                    id={video.dndId}  // Use stable dndId
                                                    video={video}
                                                    index={idx}
                                                    getThumbnail={getThumbnail}
                                                    onRemove={() => handleRemove(idx)}
                                                />
                                            );
                                        })}
                                    </SortableContext>
                                </DndContext>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 4. Bottom Mini Player (Fixed) */}
            <div className="fixed bottom-0 inset-x-0 z-50 p-3 pb-safe bg-gradient-to-t from-white via-white/80 dark:via-zinc-900 dark:from-black to-transparent pt-6 pointer-events-none">
                <div className="bg-white dark:bg-zinc-800/90 backdrop-blur-none dark:backdrop-blur-xl border border-gray-300 dark:border-white/10 rounded-2xl p-3 shadow-xl dark:shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-3 pointer-events-auto">
                    {/* Tiny Thumb */}
                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-black overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 relative">
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
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">{status?.title || "ไม่ได้เล่นเพลง"}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{status?.currentVideo?.author || "..."}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 shrink-0 pr-2">
                        <button
                            onClick={() => {
                                const nextState = !(status?.isPlaying || false);
                                lastInteractionRef.current = Date.now();
                                setStatus(prev => prev ? ({ ...prev, isPlaying: nextState }) : null);
                                sendCommand(nextState ? 'PLAY' : 'PAUSE');
                            }}
                            className="w-12 h-12 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-lg active:scale-95 transition-all"
                        >
                            {status?.isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}
                        </button>

                        <button onClick={() => sendCommand('NEXT')} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white active:scale-90 transition-all">
                            <ForwardIcon className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default RemotePage;
