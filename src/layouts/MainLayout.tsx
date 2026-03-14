import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { Menu, Search, ListMusic, Home, X, Monitor, MessageCircle, Shield, Key, Smartphone, Flame, Library, Mic, Mic2, Music, ChevronDown, ChevronRight, ChevronLeft, Cast, Disc, LogOut, UserCheck, Settings, Info, PartyPopper, Star, Trash2, EyeOff, User, Maximize, BarChart2 } from 'lucide-react'; // V2.28.0-VANISH
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DebounceInput } from 'react-debounce-input';
import { useSystem } from '@/core/container/SystemContext'; // DI Container
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { SidebarPlayer } from '../modules/player/components/SidebarPlayer';
import { PlayerControls } from '../modules/player/components/PlayerControls';
import { SidebarControls } from '../modules/player/components/SidebarControls';
import { QueueList } from '../modules/player/components/QueueList';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { useUIStore } from '../stores/useUIStore';
import { sanitizeForFirebase } from '../utils/firebase';

// Static critical imports
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { Sidebar } from '../components/navigation/Sidebar';
import { useCast } from '../plugins/cast/context/CastContext';
import { useToast } from '@/context/ToastContext';
import useIsMobile from '../hooks/isMobile';
import { useRemoteHost } from '../hooks/useRemoteHost';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { useShallow } from 'zustand/react/shallow';
import { realtimeDb } from '@/firebase';
import { ref, push, set } from 'firebase/database';

// Dynamic (Lazy) Imports for Heavy/hidden Components
const ProfileDrawer = dynamic(() => import('../components/profile/ProfileDrawer'), { ssr: false });
const ShareRoomModal = dynamic(() => import('../modules/party-system/components/ShareRoomModal').then(mod => mod.ShareRoomModal), { ssr: false });
const CastModeSelector = dynamic(() => import('../plugins/cast/components/CastModeSelector').then(mod => mod.CastModeSelector), { ssr: false });
const LimitReachedModal = dynamic(() => import('../modules/player/components/LimitReachedModal').then(mod => mod.LimitReachedModal), { ssr: false });
const ReceiverInfoModal = dynamic(() => import('../modules/party-system/components/ReceiverInfoModal').then(mod => mod.ReceiverInfoModal), { ssr: false });
// Add UnifiedCastButton dynamic import if needed or import directly
import { UnifiedCastButton } from '../plugins/cast/components/UnifiedCastButton';
import { type CastMode } from '../plugins/cast/components/CastStatusBar';
// useCastCommands removed (Phase 6)


interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const router = useRouter();
    const {
        isQueueOpen, setQueueOpen,
        isNavOpen, setNavOpen,
        isMobileSearchOpen, setMobileSearchOpen,
        isProfileOpen, setProfileOpen,
        isMobilePlayerExpanded, setMobilePlayerExpanded,
        isPlayerHidden, setPlayerHidden,
        isReceiverModalOpen, setReceiverModalOpen,
        castMode, setCastMode
    } = useUIStore();

    // Local state for layout-specific things only
    // const [isMobilePlayerExpanded, setMobilePlayerExpanded] = useState(false); // REMOVED
    const [partyModalOpen, setPartyModalOpen] = useState(false);
    const [partyRoomCode, setPartyRoomCode] = useState('');
    const [mounted, setMounted] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);

    const {
        searchTerm, setSearchTerm, activeIndex, setActiveIndex, isKaraoke, setIsKaraoke,
        queue: playerQueue, addToQueue, reorderQueue, isPlaying, layoutMode, triggerFullscreen,
        currentVideo, currentIndex
    } = usePlayerStore(
        useShallow(state => ({
            searchTerm: state.searchTerm,
            setSearchTerm: state.setSearchTerm,
            activeIndex: state.activeIndex,
            setActiveIndex: state.setActiveIndex,
            isKaraoke: state.isKaraoke,
            setIsKaraoke: state.setIsKaraoke,
            queue: state.queue,
            currentIndex: state.currentIndex,
            addToQueue: state.addToQueue,
            reorderQueue: state.reorderQueue,
            isPlaying: state.isPlaying,
            layoutMode: state.layoutMode,
            triggerFullscreen: state.triggerFullscreen,
            currentVideo: state.currentVideo
        }))
    );

    // Derived state for UI toggle
    const dataSource = isKaraoke ? 'karaoke' : 'mv';
    const toggleSource = (source: 'karaoke' | 'mv') => setIsKaraoke(source === 'karaoke');

    const { addToast } = useToast() || { addToast: (message: string) => { } };

    // Voice Search Callbacks (memoized to prevent re-render loops)
    const handleVoiceResult = useCallback((text: string) => {
        console.log('Voice result:', text);
        setSearchTerm(text);
        // Use router.replace to update URL without adding history entry
        const currentQuery = { ...router.query, search: text };
        router.replace({ pathname: '/', query: currentQuery }, undefined, { shallow: true });
        addToast(`🎙️ ค้นหาแล้ว: ${text}`, 'voice');
    }, [setSearchTerm, router, addToast]);

    const handleVoiceError = useCallback((err: string) => {
        if (err === 'not-allowed') {
            addToast('⚠️ กรุณาอนุญาตการเข้าถึงไมโครโฟน', 'error');
        } else if (err !== 'no-speech' && err !== 'aborted') {
            addToast('⚠️ ไม่สามารถค้นหาด้วยเสียงได้ในขณะนี้', 'error');
        }
    }, [addToast]);

    // Initialize Voice Search (hook uses refs internally, safe from re-render loops)
    const { isListening, toggleListening, isSupported: isVoiceSupported } = useVoiceSearch({
        onResult: handleVoiceResult,
        onError: handleVoiceError
    });

    // Helper to handle navigation state
    const handleNav = (index: number) => {
        setSearchTerm(''); // Clear search when changing tabs

        // Explicit scroll reset for navigation commands
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'instant' });
        }

        // Remove search from URL to prevent index.tsx from restoring it
        if (router.query.search) {
            const { search, ...rest } = router.query;
            router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
        }

        setActiveIndex(index);
    };

    // Auth & Config
    const { user, signOut } = useSystem().auth();
    const isPremium = user?.membership?.type !== 'free';
    const { config } = useSystemConfig();
    const allowRemote = config?.membership?.[isPremium ? 'premium' : 'free']?.allow_remote;

    // Unified Party Room Code (Always numeric PIN)
    // For Monitor/Receiver model, we don't auto-generate on Dashboard. 
    // We wait for the user to enter the PIN from the Monitor page.
    const [partyPIN, setPartyPIN] = useState<string | null>(null);

    const roomCode = partyPIN;

    // Cast & UI Store
    const { isCastModalOpen, setCastModalOpen } = useUIStore();
    const { connect: connectGoogleCast, disconnect: disconnectGoogleCast, isAvailable: isCastAvailable } = useCast();
    const isMobile = useIsMobile();
    const { queue } = usePlayerStore();

    // Stable callback to close QR modals on connection
    const handleRemoteConnected = useCallback(() => {
        if (showQRCode || partyModalOpen) {
            console.log('📱 [Main] Connection detected! Closing modals.');
            addToast('📱 รีโมทเชื่อมต่อแล้ว');
            setShowQRCode(false);
            setPartyModalOpen(false);
        }
    }, [showQRCode, partyModalOpen, addToast]);

    // [Loop Prevention] Ref to track if current store change is from a remote
    const isProcessingRemote = useRef(false);
    const dualWindowRef = useRef<Window | null>(null);

    // Remote Control Integration - Main Screen acts as a Host
    const { connectionStatus, connectedClients } = useRemoteHost(
        { current: null } as any,
        { current: { toggleFullscreen: triggerFullscreen } } as any,
        (video) => {
            isProcessingRemote.current = true;
            addToQueue(video);
            setTimeout(() => { isProcessingRemote.current = false; }, 500);
        },
        playerQueue,
        currentVideo?.videoId || '',
        isPlaying,
        layoutMode === 'fullscreen',
        (newQueue) => {
            isProcessingRemote.current = true;
            reorderQueue(newQueue);
            setTimeout(() => { isProcessingRemote.current = false; }, 500);
        },
        user,
        roomCode || undefined,
        handleRemoteConnected
    );

    // Auto-close QR Modal based on connection status transition
    useEffect(() => {
        if (connectionStatus === 'active') {
            handleRemoteConnected();
        }
    }, [connectionStatus, handleRemoteConnected]);

    // Auto-close QR Modal when someone joins (Count-based Backup)
    const prevConnected = useRef(0);
    useEffect(() => {
        if (connectedClients > prevConnected.current) {
            console.log('📱 [Main] Connection count increased! Auto-closing modals.');
            handleRemoteConnected();
        }
        prevConnected.current = connectedClients;
    }, [connectedClients, handleRemoteConnected]);

    // Sync Fullscreen with Remote Command (layoutMode)
    useEffect(() => {
        if (!mounted) return;
        if (layoutMode === 'fullscreen') {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err) => {
                    console.warn("Fullscreen API failed (Expected on remote cast):", err);
                    addToast('ขยายจอแล้ว (กด ⛶ ที่หน้าจอหลักเพื่อซ่อนแถบเบราว์เซอร์)');
                });
            }
        } else if (layoutMode === 'split') {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        }
    }, [layoutMode, mounted]);



    const handleCastSelectWebMonitor = () => {
        setCastModalOpen(false);
        localStorage.setItem('youoke-dual-active', 'false');
        setCastMode('webmonitor');
        setShowQRCode(true);
    };

    const handleCastSelectSmartTV = () => {
        setCastModalOpen(false);
        useUIStore.getState().setIsCastingLocal(false);
        localStorage.setItem('youoke-dual-active', 'false');
        setCastMode('smarttv');
        // No window.open here. User should open /monitor or /tv on the target device.
        addToast('โหมดจอภาพไร้สายเปิดใช้งานแล้ว กรุณาเปิดหน้าจอรับภาพบนอุปกรณ์อื่น');
    };

    const handleCastSelectDual = () => {
        setCastModalOpen(false);
        useUIStore.getState().setIsCastingLocal(true);
        localStorage.setItem('youoke-dual-active', 'true');
        setCastMode('dual');
        const win = window.open('/dual?mode=dj', 'YouOkeDual', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
        dualWindowRef.current = win;
    };

    const handleCastSelectGoogle = () => {
        setCastModalOpen(false);
        localStorage.setItem('youoke-dual-active', 'false');
        if (queue.length === 0) {
            addToast('กรุณาเพิ่มเพลงลงคิวก่อน');
            return;
        }

        // Mock Queue for Cast SDK requirements
        const castPlaylist = queue.map((item, index) => ({
            ...item,
            videoThumbnails: [{ quality: 'medium', url: item.thumbnail || '', width: 120, height: 90 }],
            authorId: '',
            authorUrl: '',
            lengthSeconds: item.duration || 0,
            viewCountText: '',
            viewCount: 0,
            key: Date.now() + index
        } as any)); // Force cast to avoid strict type checks on mock data

        connectGoogleCast(castPlaylist);
        setCastMode('google');
    };

    const handleDisconnect = useCallback(() => {
        console.log('🔌 [Main] Disconnecting cast mode:', castMode);

        // 🛑 Send PAUSE to the remote room first so it stops playing
        if ((castMode === 'smarttv' || castMode === 'webmonitor') && roomCode && realtimeDb) {
            const commandsRef = ref(realtimeDb, `rooms/${roomCode}/commands`);
            const newCmdRef = push(commandsRef);
            set(newCmdRef, {
                id: newCmdRef.key,
                command: { type: 'PAUSE', timestamp: Date.now() },
                status: 'pending',
                from: 'dashboard',
                timestamp: Date.now()
            });
        }

        if (castMode === 'dual') {
            if (dualWindowRef.current && !dualWindowRef.current.closed) {
                dualWindowRef.current.close();
            }
            localStorage.setItem('youoke-dual-active', 'false');
            useUIStore.getState().setIsCastingLocal(false);
        }

        if (castMode === 'google') {
            disconnectGoogleCast();
        }

        setCastModalOpen(false);
        setCastMode('none');
        setPartyPIN(null);
        localStorage.removeItem('youoke-dual-active');
        localStorage.removeItem('youoke_party_pin');
        useUIStore.getState().setIsCastingLocal(false);

        // Cleanup CastService if it exists
        import('../plugins/cast/services/CastService').then(({ castService }) => {
            castService.cleanup();
        });

        addToast('ตัดการเชื่อมต่อสำเร็จ');
    }, [castMode, roomCode, realtimeDb, addToast, setCastMode, setCastModalOpen]);

    const handleJoinRoom = (code: string) => {
        setPartyPIN(code);
        localStorage.setItem('youoke_party_pin', code);
        setCastModalOpen(false);
        setCastMode('smarttv'); // AUTO-ACTIVATE Web Caster mode
        useUIStore.getState().setIsCastingLocal(false);

        // Show success notification
        addToast(`เชื่อมต่อหน้าจอทีวี (ห้อง ${code}) สำเร็จ!`);
    };

    // 📡 Monitor Sync Bridge (Phase 12: Receiver Model Restoration)
    useEffect(() => {
        if (castMode === 'smarttv' && partyPIN) {
            const initCastSync = async () => {
                const { castService } = await import('../plugins/cast/services/CastService');
                console.log('🔗 [Main] Initializing Master Controller Room:', partyPIN);
                await castService.initialize(partyPIN, 'host');
            };
            initCastSync();
        } else if (castMode === 'none') {
            import('../plugins/cast/services/CastService').then(({ castService }) => castService.cleanup());
        }
    }, [castMode, partyPIN]);


    useEffect(() => {
        setMounted(true);

        // 🆔 Initialize Room Code for Remote Control (Mobile Remote)
        // Check local storage for existing session, otherwise generate one.
        const cachedPin = localStorage.getItem('youoke_party_pin');
        if (cachedPin) {
            setPartyPIN(cachedPin);
        } else {
            const newPin = Math.floor(1000 + Math.random() * 9000).toString();
            setPartyPIN(newPin);
            localStorage.setItem('youoke_party_pin', newPin);
        }
    }, []);

    // Auto-open/close Queue (and Player) based on contents
    const isFirstLoad = useRef(true);
    const prevQueueLen = useRef(0);
    useEffect(() => {
        // Skip auto-open on initial mount if queue exists (avoid starting on queue page)
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            prevQueueLen.current = queue.length;
            return;
        }

        if (prevQueueLen.current === 0 && queue.length > 0) {
            useUIStore.getState().setQueueOpen(true);
        } else if (queue.length === 0) {
            useUIStore.getState().setQueueOpen(false);
        }
        prevQueueLen.current = queue.length;
    }, [queue.length]);

    // ... (Return statement remains mostly same)

    return (
        <div className={clsx(
            "flex h-screen w-full text-text-base overflow-hidden subpixel-antialiased antialiased selection:bg-primary/10 transition-colors duration-500",
            layoutMode === 'fullscreen' ? "bg-black" : "bg-white"
        )}>
            <Head>
                <meta name="theme-color" content={layoutMode === 'fullscreen' ? '#000000' : '#ef4444'} />
            </Head>
            {/* Left Sidebar (Premium White) - Extracted & Memoized */}
            <Sidebar />

            {/* Main Content Area - Single Divider Strategy */}
            <div className="flex-1 flex flex-col min-w-0 relative bg-white">

                {/* Desktop Header */}
                <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-gray-100 bg-white sticky top-0 z-20 transition-all">
                    <div className="flex-1 max-w-2xl relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-300 group-focus-within:text-primary transition-colors" />
                        </div>
                        <DebounceInput
                            minLength={2}
                            debounceTimeout={300}
                            placeholder={activeIndex === 3 ? "ค้นหาเพลงยาว หรือ รวมเพลง..." : (isKaraoke ? "ค้นหาคาราโอเกะ..." : "ค้นหาเพลง หรือ ศิลปิน...")}
                            className="block w-full pl-14 pr-12 h-12 bg-gray-50/50 hover:bg-gray-100/50 focus:bg-white border border-gray-100 focus:border-primary/20 rounded-2xl leading-5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all shadow-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => {
                                router.replace({
                                    pathname: '/',
                                    query: { ...router.query, search: e.target.value }
                                }, undefined, { shallow: true });
                            }}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        const { search, ...rest } = router.query;
                                        router.replace({ pathname: '/', query: rest }, undefined, { shallow: true });
                                    }}
                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}

                            {isVoiceSupported && (
                                <button
                                    onClick={toggleListening}
                                    className={clsx(
                                        "p-2 rounded-full transition-all flex items-center justify-center",
                                        isListening ? "bg-primary text-white scale-110 animate-pulse shadow-md" : "text-black hover:text-primary"
                                    )}
                                    title="ค้นหาด้วยเสียง"
                                >
                                    <Mic className={clsx("h-5 w-5", isListening && "animate-bounce")} />
                                </button>
                            )}
                        </div>

                    </div>

                    <div className="flex items-center gap-6 ml-6">
                        {/* Search Toggle (Karaoke/Song) - Animated Switch */}
                        <div className="relative flex items-center bg-gray-50 rounded-2xl p-1 h-11 w-[180px] border border-gray-100">
                            {/* Sliding Active Background */}
                            <div
                                className={clsx(
                                    "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                    isKaraoke ? "left-[calc(50%+2px)]" : "left-1"
                                )}
                            />

                            {/* Song Option */}
                            <button
                                onClick={() => setIsKaraoke(false)}
                                className={clsx(
                                    "relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-xl text-[11px] font-black tracking-tight uppercase transition-colors z-10",
                                    !isKaraoke ? "text-primary" : "text-black hover:text-black/80"
                                )}
                            >
                                <Music className="w-3.5 h-3.5" />
                                <span>เพลง</span>
                            </button>

                            {/* Karaoke Option */}
                            <button
                                onClick={() => setIsKaraoke(true)}
                                className={clsx(
                                    "relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-xl text-[11px] font-black tracking-tight uppercase transition-colors z-10",
                                    isKaraoke ? "text-primary" : "text-black hover:text-black/80"
                                )}
                            >
                                <Mic2 className="w-3.5 h-3.5" />
                                <span>คาราโอเกะ</span>
                            </button>
                        </div>


                        {/* Mobile Connect Button (Smartphone) */}
                        <button
                            onClick={() => {
                                setShowQRCode(true);
                            }}
                            className="h-11 w-11 rounded-2xl p-0 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-100 text-black hover:text-primary transition-all relative group shadow-sm"
                            title="เชื่อมต่อรีโมท (Mobile Remote)"
                        >
                            <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                            {/* Connection Status Dot */}
                            {mounted && (
                                <div className={clsx(
                                    "absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-white transition-colors duration-500",
                                    connectionStatus === 'active' ? "bg-green-500 animate-pulse" :
                                        connectionStatus === 'background' ? "bg-orange-500" : "bg-gray-300"
                                )} />
                            )}
                        </button>

                    </div>
                </header>




                {/* Global Player Container (Top Docked for Mobile, Fixed for Desktop) */}
                {mounted && (
                    <div
                        id="global-video-player-container"
                        className={clsx(
                            "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-[100] overflow-hidden lg:border-l lg:border-gray-200 shrink-0",

                            // Optimized Fullscreen Transition
                            layoutMode === 'fullscreen'
                                ? "fixed inset-0 w-screen h-[100dvh] border-none bg-black shadow-none ring-0 origin-top-right transition-all duration-300"
                                : [
                                    // Mobile Logic (Inline block at top)
                                    "max-lg:w-full",
                                    queue.length > 0
                                        ? "max-lg:opacity-100 max-lg:h-auto max-lg:pointer-events-auto shadow-sm"
                                        : "max-lg:opacity-0 max-lg:h-0 max-lg:pointer-events-none max-lg:border-none",

                                    // Desktop Logic
                                    "lg:fixed lg:top-0 lg:w-[420px] lg:h-[236px] bg-black origin-top-right transition-all duration-500",
                                    (isQueueOpen && queue.length > 0) ? "lg:right-0" : "lg:-right-[420px]"
                                ]
                        )}>
                        <div className={clsx(
                            "relative w-full flex flex-col transition-all duration-500 bg-black",
                            layoutMode === 'fullscreen' ? "h-[100dvh]" : "h-full"
                        )}>
                            <div className={clsx(
                                "w-full bg-black shrink-0 relative overflow-hidden transition-all duration-500",
                                layoutMode === 'fullscreen' ? "h-full video-fit-contain" : "aspect-video"
                            )}>
                                <SidebarPlayer
                                    castMode={castMode}
                                    roomCode={roomCode}
                                    onDisconnect={handleDisconnect}
                                    onForcePlay={() => {
                                        if (roomCode && realtimeDb) {
                                            const commandsRef = ref(realtimeDb, `rooms/${roomCode}/commands`);
                                            const newCmdRef = push(commandsRef);
                                            set(newCmdRef, {
                                                id: newCmdRef.key,
                                                command: { type: 'PLAY', timestamp: Date.now() },
                                                status: 'pending',
                                                from: 'dashboard',
                                                timestamp: Date.now()
                                            });
                                            // UI update
                                            usePlayerStore.getState().play();
                                        }
                                    }}
                                />
                            </div>
                            {/* Mobile Only Controls Wrapper */}
                            {layoutMode !== 'fullscreen' && (
                                <>
                                    <div className="lg:hidden flex flex-col bg-white border-b border-gray-100 shadow-sm relative z-20">
                                        <SidebarControls castMode={castMode} />
                                    </div>
                                    <header className="lg:hidden flex flex-col bg-white border-b border-gray-100 sticky top-0 z-[110] px-3 py-2 shadow-sm">
                                        <div className="flex items-center gap-2.5">
                                            {/* Search Input Box */}
                                            <div className="flex-1 relative flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 h-10 transition-all focus-within:bg-white focus-within:border-black/10 shadow-sm">
                                                <Search className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                                                <DebounceInput
                                                    minLength={2}
                                                    debounceTimeout={300}
                                                    placeholder={activeIndex === 3 ? "ค้นหาเพลงยาว หรือ รวมเพลง..." : (isKaraoke ? "ค้นหาคาราโอเกะ..." : "ค้นหาเพลง หรือ ศิลปิน...")}
                                                    className="w-full bg-transparent pl-3 pr-2 text-[14px] font-bold text-black placeholder-gray-400 focus:outline-none"
                                                    value={searchTerm}
                                                    onChange={(e) => {
                                                        router.replace({
                                                            pathname: '/',
                                                            query: { ...router.query, search: e.target.value }
                                                        }, undefined, { shallow: true });
                                                    }}
                                                />
                                                {searchTerm && (
                                                    <button onClick={() => {
                                                        const { search, ...rest } = router.query;
                                                        router.replace({ pathname: '/', query: rest }, undefined, { shallow: true });
                                                    }} className="text-gray-400 ml-1.5 p-1 rounded-full hover:bg-gray-100">
                                                        <X className="h-4.5 w-4.5" />
                                                    </button>
                                                )}

                                                {isVoiceSupported && (
                                                    <button
                                                        onClick={toggleListening}
                                                        className={clsx(
                                                            "ml-1 p-1 rounded-full transition-all flex items-center justify-center",
                                                            isListening ? "bg-primary text-white scale-110 animate-pulse shadow-md" : "text-black hover:text-primary"
                                                        )}
                                                        title="ค้นหาด้วยเสียง"
                                                    >
                                                        <Mic className={clsx("h-4.5 w-4.5", isListening && "animate-bounce")} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Mode Switch (Song/Karaoke) - Animated Sliding Style */}
                                            <div className="relative flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner shrink-0 h-10 w-[84px] items-center">
                                                {/* Sliding Background */}
                                                <div
                                                    className={clsx(
                                                        "absolute h-8 w-9 bg-white rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                                        isKaraoke ? "translate-x-9" : "translate-x-0"
                                                    )}
                                                />
                                                <button
                                                    onClick={() => setIsKaraoke(false)}
                                                    className={clsx(
                                                        "relative flex-1 h-8 flex items-center justify-center rounded-xl transition-all duration-300 z-10",
                                                        !isKaraoke ? "text-primary scale-105" : "text-black/40"
                                                    )}
                                                >
                                                    <Music size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setIsKaraoke(true)}
                                                    className={clsx(
                                                        "relative flex-1 h-8 flex items-center justify-center rounded-xl transition-all duration-300 z-10",
                                                        isKaraoke ? "text-primary scale-105" : "text-black/40"
                                                    )}
                                                >
                                                    <Mic2 size={16} />
                                                </button>
                                            </div>

                                            {/* Queue Button - Clean Design with Status Badge (Red: Closed, Green: Open) */}
                                            <button
                                                onClick={() => {
                                                    if (isQueueOpen && !isPlayerHidden) {
                                                        setPlayerHidden(true);
                                                        setQueueOpen(false);
                                                    } else {
                                                        setPlayerHidden(false);
                                                        setQueueOpen(true);
                                                    }
                                                }}
                                                className={clsx(
                                                    "w-10 h-10 flex items-center justify-center rounded-2xl shrink-0 transition-all duration-200 relative border",
                                                    isQueueOpen
                                                        ? "bg-gray-50 text-black border-black/10 shadow-inner scale-95"
                                                        : "bg-white text-gray-700 border-gray-100 shadow-sm active:scale-95"
                                                )}
                                                aria-label="คิวเพลง"
                                            >
                                                <ListMusic className="w-5 h-5" />
                                                {queue.length > 0 && (
                                                    <div className={clsx(
                                                        "absolute -top-1.5 -right-1.5 text-white text-[9px] font-black h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-colors duration-300",
                                                        isQueueOpen ? "bg-green-500" : "bg-red-500"
                                                    )}>
                                                        {queue.length}
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </header>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Content Wrapper for Main and Mobile Queue */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    <main id="main-content" className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative flex flex-col items-center bg-gray-50/30">
                        <div className="w-full pb-20">
                            {children}
                        </div>
                    </main>

                    {/* Mobile Queue Slide-up Overlay - Contained within content area */}
                    {isMobile && mounted && (
                        <div
                            className={clsx(
                                "absolute inset-0 z-[40] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white",
                                isQueueOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
                            )}
                        >
                            <QueueList />
                        </div>
                    )}
                </div>
            </div>

            <aside
                className={clsx(
                    "hidden lg:flex w-[420px] border-l border-gray-200 flex-col z-20 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    (isQueueOpen && queue.length > 0 && layoutMode !== 'fullscreen') ? "mr-0 w-[420px] opacity-100" : "-mr-[420px] w-0 opacity-0"
                )}
                style={{ backgroundColor: '#ffffff', background: '#ffffff' }}
            >
                {/* 236px corresponds to the fixed SidebarPlayer height (16:9 for 420px) */}
                <div className="flex-1 flex flex-col pt-[236px] h-full relative z-10 bg-white" style={{ backgroundColor: '#ffffff' }}>
                    {/* Desktop Sidebar Controls (Moved here to prevent blocking QueueList) */}
                    <div className="shrink-0 bg-white relative z-20">
                        <SidebarControls castMode={castMode} />
                    </div>
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white relative z-10" style={{ backgroundColor: '#ffffff' }}>
                        <QueueList />
                    </div>
                </div>
            </aside>

            {/* Mobile Nav Drawer */}
            <div className={clsx("fixed inset-0 bg-black/60 z-40 transition-opacity lg:hidden backdrop-blur-sm", isNavOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => setNavOpen(false)} />
            <div className={clsx("fixed inset-y-0 left-0 z-50 bg-white w-[280px] shadow-2xl transition-transform duration-300 lg:hidden flex flex-col", isNavOpen ? "translate-x-0" : "-translate-x-full")}>
                <div className="h-16 flex items-center px-6 shrink-0 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-sm">Y</div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold tracking-tight leading-none text-gray-900">YouOke</h1>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium tracking-wide">Karaoke Online</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">เมนูหลัก</div>
                    <Link href="/" onClick={() => { handleNav(1); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 1) ? "bg-primary/10 text-primary" : "text-gray-600 active:bg-gray-100")}> <Home className="w-5 h-5" /> <span>หน้าหลัก</span> </Link>
                    <Link href="/" onClick={() => { handleNav(2); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 2) ? "bg-primary/10 text-primary" : "text-gray-600 active:bg-gray-100")}> <Star className="w-5 h-5" /> <span>แนะนำ</span> </Link>
                    <Link href="/" onClick={() => { handleNav(2); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 2) ? "bg-primary/10 text-primary" : "text-gray-600 active:bg-gray-100")}> <BarChart2 className="w-5 h-5" /> <span>ชาร์ตเพลง</span> </Link>
                    <Link href="/" onClick={() => { handleNav(4); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 4) ? "bg-primary/10 text-primary" : "text-gray-600 active:bg-gray-100")}> <Library className="w-5 h-5" /> <span>เพลย์ลิสต์</span> </Link>
                    {/*
                    <div className="mt-6 px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">ระบบ</div>
                    <Link href="/tv" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 active:bg-gray-100 font-medium"> <Cast className="w-5 h-5" /> <span>หน้าจอ TV (Premium)</span> </Link>
                    */}
                    {user?.role === 'admin' && (<><div className="mt-6 px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</div><Link href="/admin" onClick={() => setNavOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 active:bg-gray-100 font-medium"> <Shield className="w-5 h-5" /> <span>Admin Panel</span> </Link></>)}
                </div>
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">บัญชี</div>
                    {mounted && user ? (
                        <div className="flex items-center justify-between gap-2 px-2 py-2">
                            <div onClick={() => { setNavOpen(false); useUIStore.getState().setProfileOpen(true); }} className="flex items-center gap-3 overflow-hidden flex-1 active:bg-gray-100 p-1 rounded-lg transition-colors">
                                {user.photoURL ? <img src={user.photoURL} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">{user.email?.[0]}</div>}
                                <div><p className="text-sm font-bold truncate text-gray-900">{user.displayName}</p><p className="text-[10px] text-gray-500 uppercase font-semibold">{isPremium ? 'สมาชิก Pro' : 'สมาชิกทั่วไป'}</p></div>
                            </div>
                            <button onClick={() => signOut()} className="p-2 text-gray-400 hover:text-red-500"><LogOut className="w-5 h-5" /></button>
                        </div>
                    ) : (<Link href="/login" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium shadow-sm justify-center"> <Key className="w-5 h-5" /> <span>เข้าสู่ระบบ</span> </Link>)}
                </div>
            </div>





            {/* Profile Drawer (Overlay) */}
            <ProfileDrawer
                isOpen={isProfileOpen}
                onClose={() => setProfileOpen(false)}
            />

            {/* Receiver Info Modal */}
            <ReceiverInfoModal />

            {/* QR Code Modal for Remote Connect */}
            {
                showQRCode && roomCode && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowQRCode(false)}>
                        <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200 border border-white/20" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-bold text-gray-900">เชื่อมต่อรีโมท</h3>
                                </div>
                                <button onClick={() => setShowQRCode(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                            </div>

                            <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-primary/20 inline-block shadow-sm">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/remote?room=${roomCode}`)}`} alt="QR Code" className="w-56 h-56 rounded-lg" />
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900">สแกนด้วยกล้องมือถือ</p>
                                <p className="text-xs text-gray-500">เพื่อใช้มือถือเลือกเพลงและควบคุมการเล่น</p>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-[10px] text-gray-400 font-mono">Room Code: {roomCode}</p>
                            </div>
                        </div>
                    </div>
                )
            }

            <CastModeSelector
                isOpen={isCastModalOpen}
                onClose={() => setCastModalOpen(false)}
                isCastAvailable={isCastAvailable}
                isMobile={isMobile}
                onSelectWebMonitor={handleCastSelectWebMonitor}
                onSelectSmartTV={handleCastSelectSmartTV}
                onSelectDual={handleCastSelectDual}
                onSelectDj={handleCastSelectDual}
                onSelectGoogleCast={handleCastSelectGoogle}
                onSelectYouTube={() => { }}
                onJoinRoom={handleJoinRoom}
                onDisconnect={handleDisconnect}
                castMode={castMode}
            />

            {/* Global Limit Reached Modal */}
            <LimitReachedModal />



            {/* Mobile Bottom Navigation (Hidden in Fullscreen) */}
            {layoutMode !== 'fullscreen' && <MobileBottomNav />}

            {/* BOTTOM FLOATING PLAYER (Apple Music Style - Unified for Mobile/Desktop) */}


        </div >
    );
}
