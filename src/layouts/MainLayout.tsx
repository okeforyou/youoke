import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { Menu, Search, ListMusic, Home, X, Monitor, MessageCircle, Shield, Key, Smartphone, Flame, Library, Mic, Mic2, Music, ChevronDown, ChevronRight, ChevronLeft, Cast, Disc, LogOut, UserCheck, Settings, Info, PartyPopper, Star, Trash2, EyeOff, User, Maximize, BarChart2, Headphones } from 'lucide-react'; // V2.28.0-VANISH
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
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Static critical imports
import { GlobalConfirmModal } from '@/components/common/GlobalConfirmModal';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { Sidebar } from '../components/navigation/Sidebar';
import { useCast } from '../plugins/cast/context/CastContext';
import { useToast } from '@/context/ToastContext';
import { useAuthStore } from '../modules/auth/useAuthStore';
import useIsMobile from '../hooks/isMobile';
import { useRemoteHost } from '../hooks/useRemoteHost';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { useShallow } from 'zustand/react/shallow';
import { db, realtimeDb } from '@/firebase';
import { ref, push, set } from 'firebase/database';

// Dynamic (Lazy) Imports for Heavy/hidden Components
const GlobalSettingsModal = dynamic(() => import('../components/settings/GlobalSettingsModal'), { ssr: false });
const ShareRoomModal = dynamic(() => import('../modules/party-system/components/ShareRoomModal').then(mod => mod.ShareRoomModal), { ssr: false });
const CastModeSelector = dynamic(() => import('../plugins/cast/components/CastModeSelector').then(mod => mod.CastModeSelector), { ssr: false });
const LimitReachedModal = dynamic(() => import('../modules/player/components/LimitReachedModal').then(mod => mod.LimitReachedModal), { ssr: false });
const ReceiverInfoModal = dynamic(() => import('../modules/party-system/components/ReceiverInfoModal').then(mod => mod.ReceiverInfoModal), { ssr: false });
// Add UnifiedCastButton dynamic import if needed or import directly
import { UnifiedCastButton } from '../plugins/cast/components/UnifiedCastButton';
import { type CastMode } from '../plugins/cast/components/CastStatusBar';
import { NotificationToast } from '../modules/notifications/components/NotificationToast';
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
        castMode, setCastMode,
        showConfirm
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
        currentVideo, currentIndex,
        searchHistory, addSearchHistory, removeSearchHistory, clearSearchHistory
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
            currentVideo: state.currentVideo,
            searchHistory: state.searchHistory,
            addSearchHistory: state.addSearchHistory,
            removeSearchHistory: state.removeSearchHistory,
            clearSearchHistory: state.clearSearchHistory
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
    const { connect: connectGoogleCast, disconnect: disconnectGoogleCast, isAvailable: isCastAvailable, isConnected, setIsRecovering } = useCast();
    const isMobile = useIsMobile();

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
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        }
    }, [layoutMode, mounted]);

    // v5.4.2: Google Cast SDK <-> UI castMode sync bridge
    // The SDK manages its own session state independently of our UI state.
    // This bridge ensures the 'Disconnect' button appears correctly when Cast is active,
    // and cleans up castMode when the SDK loses the session (e.g. TV off, timeout).
    useEffect(() => {
        if (isConnected && castMode !== 'google') {
            // SDK says we ARE connected, but UI doesn't reflect it → force sync
            console.log('🔄 [CastSync] SDK isConnected=true but castMode is not google. Syncing...');
            setCastMode('google');
        } else if (!isConnected && castMode === 'google') {
            // SDK says we are NOT connected, but UI still shows google → clean up
            console.log('🔄 [CastSync] SDK isConnected=false but castMode=google. Cleaning up UI...');
            setCastMode('none');
        }
    }, [isConnected, castMode, setCastMode]);



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
        if (playerQueue.length === 0) {
            addToast('กรุณาเพิ่มเพลงลงคิวก่อน');
            return;
        }

        // Mock Queue for Cast SDK requirements
        const castPlaylist = playerQueue.map((item, index) => ({
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
        setIsRecovering(false); // v5.5.3: Ensure we stop pulse on manual disconnect

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
        // v5.4.8: Clear all persistence flags
        localStorage.removeItem('youoke_cast_mode');
        localStorage.removeItem('youoke_party_pin');
        localStorage.removeItem('youoke-dual-active');
        
        useUIStore.getState().setIsCastingLocal(false);

        // Cleanup CastService if it exists
        import('../plugins/cast/services/CastService').then(({ castService }) => {
            castService.cleanup();
        });

        addToast('ตัดการเชื่อมต่อสำเร็จ');
    }, [castMode, roomCode, realtimeDb, addToast, setCastMode, setCastModalOpen, disconnectGoogleCast, setIsRecovering]);

    const handleJoinRoom = (code: string) => {
        setPartyPIN(code);
        localStorage.setItem('youoke_party_pin', code);
        localStorage.setItem('youoke_cast_mode', 'smarttv'); // v5.4.8: Remember for auto-recovery
        setCastModalOpen(false);
        setCastMode('smarttv'); // AUTO-ACTIVATE Web Caster mode
        useUIStore.getState().setIsCastingLocal(false);

        // v5.5.3: End the visual pulse once joined
        setIsRecovering(false);

        // Show success notification
        addToast(`เชื่อมต่อหน้าจอทีวี (ห้อง ${code}) สำเร็จ!`);
    };

    // 🛡️ v5.4.8: Multi-Mode Recovery Bridge (On Mount)
    useEffect(() => {
        if (!mounted) return;
        
        // Recover Smart TV / Monitor status
        const savedMode = localStorage.getItem('youoke_cast_mode');
        const savedPIN = localStorage.getItem('youoke_party_pin');

        if (savedMode === 'smarttv' && savedPIN && !partyPIN) {
            console.log('🔄 [Recovery] Restoring Smart TV connection to room:', savedPIN);
            setPartyPIN(savedPIN);
            setCastMode('smarttv');
        } else if (savedMode === 'dual') {
            setCastMode('dual');
        }
    }, [mounted, partyPIN, setCastMode]);

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


    // 💡 v5.0.5: Wake Lock to prevent screen sleep while casting
    useEffect(() => {
        if (!isConnected) return;
        
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                    console.log('💡 [Main] Wake Lock active for Chromecast');
                }
            } catch (err) {
                console.warn('💡 [Main] Wake Lock failed:', err);
            }
        };

        requestWakeLock();

        // Re-request on visibility change
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isConnected) {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLock) wakeLock.release().catch(() => {});
        };
    }, [isConnected]);

    // 🟢 v4.9.50: User Presence Activity Tracker (Throttled)
    const lastUpdateRef = useRef<number>(0);

    useEffect(() => {
        if (!user?.uid || !db) return;
        
        const updateActivity = async () => {
            const now = Date.now();
            // Only update every 5 minutes (300,000ms) to preserve performance
            if (now - lastUpdateRef.current < 300000) return;
            
            try {
                const userRef = doc(db as any, 'users', user.uid as string);
                await updateDoc(userRef, {
                    last_activity: serverTimestamp()
                });
                lastUpdateRef.current = now;
            } catch (err) {
                console.warn("Activity update skipped:", err);
            }
        };

        updateActivity();
        const interval = setInterval(updateActivity, 300000);
        return () => clearInterval(interval);
    }, [user?.uid]);

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
        // v4.9.50: Auto-open queue ONLY for Desktop to show Sidebar Player.
        // For Mobile, we keep it closed to prevent intrusive overlays.
        if (prevQueueLen.current === 0 && playerQueue.length > 0 && !isMobile) {
            useUIStore.getState().setQueueOpen(true);
        } else if (playerQueue.length === 0) {
            useUIStore.getState().setQueueOpen(false);
        }
        prevQueueLen.current = playerQueue.length;
    }, [playerQueue.length, isMobile]);

    // 🛡️ Expiry Alert Logic (Admin v2.1)
    const { showExpiryAlert, setExpiryAlert } = useAuthStore();
    const expiryStatus = user?.expiryStatus;

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
            <div className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-zinc-950 transition-colors">
                
                {/* 🛡️ Membership Expiry Banner (Expiring Soon) */}
                {user && expiryStatus?.isExpiringSoon && (
                    <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 text-white py-1.5 px-4 flex items-center justify-between z-[60] shadow-lg animate-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
                            <Star className="w-3.5 h-3.5 animate-pulse" />
                            <span>พรีเมียมของคุณกำลังจะหมดอายุในอีก {expiryStatus.daysRemaining} วัน!</span>
                        </div>
                        <Link href="/profile" className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded-full text-[10px] font-black transition-all border border-white/30">
                            ต่ออายุเลย
                        </Link>
                    </div>
                )}

                {/* Desktop Header */}
                <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-20 transition-all">
                    <div className="flex-1 max-w-2xl relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-300 dark:text-zinc-600 group-focus-within:text-primary transition-colors" />
                        </div>
                        <DebounceInput
                            minLength={2}
                            debounceTimeout={300}
                            placeholder={activeIndex === 3 ? "ค้นหาเพลงยาว หรือ รวมเพลง..." : (isKaraoke ? "ค้นหาคาราโอเกะ..." : "ค้นหาเพลง หรือ ศิลปิน...")}
                            className="block w-full pl-14 pr-12 h-12 bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 border border-gray-100 dark:border-zinc-800 focus:border-primary/20 rounded-2xl leading-5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none transition-all shadow-sm font-medium"
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
                                        setSearchTerm('');
                                        const { search, ...rest } = router.query;
                                        router.replace({ pathname: '/', query: rest }, undefined, { shallow: true });
                                    }}
                                    className="p-2 text-gray-300 dark:text-zinc-600 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}

                            {isVoiceSupported && (
                                <button
                                    onClick={toggleListening}
                                    className={clsx(
                                        "p-2 rounded-full transition-all flex items-center justify-center",
                                        isListening ? "bg-primary text-white scale-110 animate-pulse shadow-md" : "text-black dark:text-white hover:text-primary"
                                    )}
                                    title="ค้นหาด้วยเสียง"
                                >
                                    <Mic className={clsx("h-5 w-5", isListening && "animate-bounce")} />
                                </button>
                            )}
                        </div>

                        {/* Native App Search History Chips (v4.9.44) */}
                        {searchHistory?.length > 0 && (
                            <div className="absolute -bottom-10 left-0 right-0 flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-1 animate-in fade-in slide-in-from-top-1 duration-300 pointer-events-none">
                                {searchHistory.map((term, i) => (
                                    <div 
                                        key={`${term}-${i}`}
                                        className="flex items-center bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-full pl-3 pr-2 py-1 gap-1.5 cursor-pointer shrink-0 transition-all group/chip pointer-events-auto"
                                        onClick={() => {
                                            setSearchTerm(term);
                                            router.replace({ pathname: '/', query: { ...router.query, search: term } }, undefined, { shallow: true });
                                        }}
                                    >
                                        <span className="text-[10px] font-black text-gray-500 dark:text-zinc-500 uppercase tracking-tight">{term}</span>
                                        <button 
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                removeSearchHistory(term);
                                            }}
                                            className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-300 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={clearSearchHistory}
                                    className="text-[9px] font-black text-gray-300 dark:text-zinc-600 hover:text-primary dark:hover:text-primary uppercase tracking-widest px-2 shrink-0 transition-colors pointer-events-auto"
                                >
                                    ล้างทั้งหมด
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6 ml-6">
                        {/* Search Toggle (Karaoke/Song) - Animated Switch */}
                        <div className="relative flex items-center bg-gray-50 dark:bg-zinc-900 rounded-2xl p-1 h-11 w-[180px] border border-gray-100 dark:border-zinc-800">
                            {/* Sliding Active Background */}
                            <div
                                className={clsx(
                                    "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-zinc-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                    isKaraoke ? "left-[calc(50%+2px)]" : "left-1"
                                )}
                            />

                            {/* Song Option */}
                            <button
                                onClick={() => setIsKaraoke(false)}
                                className={clsx(
                                    "relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-xl text-[11px] font-black tracking-tight uppercase transition-colors z-10",
                                    !isKaraoke ? "text-primary" : "text-black dark:text-zinc-400 hover:text-black dark:hover:text-white"
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
                                    isKaraoke ? "text-primary" : "text-black dark:text-zinc-400 hover:text-black dark:hover:text-white"
                                )}
                            >
                                <Mic2 className="w-3.5 h-3.5" />
                                <span>คาราโอเกะ</span>
                            </button>
                        </div>


                        <button
                            onClick={() => {
                                setShowQRCode(true);
                            }}
                            className="h-11 w-11 rounded-2xl p-0 flex items-center justify-center bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800 text-black dark:text-white hover:text-primary transition-all relative group shadow-sm"
                            title="เชื่อมต่อรีโมท (Mobile Remote)"
                        >
                            <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                            {/* Connection Status Dot */}
                            {mounted && (
                                <div className={clsx(
                                    "absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-white dark:border-zinc-900 transition-colors duration-500",
                                    connectionStatus === 'active' ? "bg-green-500" :
                                        connectionStatus === 'background' ? "bg-orange-500" : "bg-red-500 animate-pulse"
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
                            "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-[100] overflow-hidden lg:border-l lg:border-gray-200 lg:dark:border-zinc-800 shrink-0",

                            // Optimized Fullscreen Transition
                            layoutMode === 'fullscreen'
                                ? "fixed inset-0 w-full h-full border-none bg-black shadow-none ring-0 origin-top-right transition-all duration-300"
                                : [
                                    // Mobile Logic (Inline block at top)
                                    "max-lg:w-full max-lg:opacity-100 max-lg:h-auto max-lg:pointer-events-auto shadow-md",

                                    // Desktop Logic
                                    "lg:fixed lg:top-0 lg:w-[420px] lg:h-[236px] bg-black origin-top-right transition-all duration-500",
                                    "lg:right-0"
                                ]
                        )}>
                        <div className={clsx(
                            "relative w-full flex flex-col transition-all duration-500 bg-black",
                            layoutMode === 'fullscreen' ? "h-full" : "h-full"
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
                                    <div className="lg:hidden flex flex-col bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-900 shadow-sm relative z-20 transition-colors">
                                        <SidebarControls castMode={castMode} />
                                    </div>
                                    <header className="lg:hidden flex flex-col bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-[110] px-3 py-2 shadow-sm transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            {/* Search Input Box */}
                                            <div className="flex-1 relative flex items-center bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 h-10 transition-all focus-within:bg-white dark:focus-within:bg-zinc-800 focus-within:border-black/10 dark:focus-within:border-white/10 shadow-sm">
                                                <Search className="h-4.5 w-4.5 text-gray-400 dark:text-zinc-600 shrink-0" />
                                                <DebounceInput
                                                    minLength={2}
                                                    debounceTimeout={300}
                                                    placeholder={activeIndex === 3 ? "ค้นหาเพลงยาว หรือ รวมเพลง..." : (isKaraoke ? "ค้นหาคาราโอเกะ..." : "ค้นหาเพลง หรือ ศิลปิน...")}
                                                    className="w-full bg-transparent pl-3 pr-2 text-[14px] font-bold text-black dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none"
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
                                                        setSearchTerm('');
                                                        const { search, ...rest } = router.query;
                                                        router.replace({ pathname: '/', query: rest }, undefined, { shallow: true });
                                                    }} className="text-gray-400 dark:text-zinc-500 ml-1.5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
                                                        <X className="h-4.5 w-4.5" />
                                                    </button>
                                                )}

                                                {isVoiceSupported && (
                                                    <button
                                                        onClick={toggleListening}
                                                        className={clsx(
                                                            "ml-1 p-1 rounded-full transition-all flex items-center justify-center",
                                                            isListening ? "bg-primary text-white scale-110 animate-pulse shadow-md" : "text-black dark:text-white hover:text-primary"
                                                        )}
                                                        title="ค้นหาด้วยเสียง"
                                                    >
                                                        <Mic className={clsx("h-4.5 w-4.5", isListening && "animate-bounce")} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Mode Switch (Song/Karaoke) - Animated Sliding Style */}
                                            <div className="relative flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-inner shrink-0 h-10 w-[84px] items-center">
                                                {/* Sliding Background */}
                                                <div
                                                    className={clsx(
                                                        "absolute h-8 w-9 bg-white dark:bg-zinc-800 rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                                        isKaraoke ? "translate-x-9" : "translate-x-0"
                                                    )}
                                                />
                                                <button
                                                    onClick={() => setIsKaraoke(false)}
                                                    className={clsx(
                                                        "relative flex-1 h-8 flex items-center justify-center rounded-xl transition-all duration-300 z-10",
                                                        !isKaraoke ? "text-primary scale-105" : "text-black/40 dark:text-zinc-600"
                                                    )}
                                                >
                                                    <Music size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setIsKaraoke(true)}
                                                    className={clsx(
                                                        "relative flex-1 h-8 flex items-center justify-center rounded-xl transition-all duration-300 z-10",
                                                        isKaraoke ? "text-primary scale-105" : "text-black/40 dark:text-zinc-600"
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
                                                        ? "bg-gray-50 dark:bg-zinc-900 text-black dark:text-white border-black/10 dark:border-white/10 shadow-inner scale-95"
                                                        : "bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-400 border-gray-100 dark:border-zinc-800 shadow-sm active:scale-95"
                                                )}
                                                aria-label="คิวเพลง"
                                            >
                                                <ListMusic className="w-5 h-5" />
                                                {playerQueue.length > 0 && Math.max(0, playerQueue.length - (currentIndex + 1)) > 0 && (
                                                    <div className={clsx(
                                                        "absolute -top-1.5 -right-1.5 text-white text-[9px] font-black h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm transition-all duration-300 animate-bounce",
                                                        isQueueOpen ? "bg-red-500" : "bg-black"
                                                    )} style={{ animationDuration: '3s' }}>
                                                        {Math.max(0, playerQueue.length - (currentIndex + 1))}
                                                    </div>
                                                )}
                                            </button>
                                        </div>

                                        {/* Mobile Recent Search Chips (v4.9.44) */}
                                        {searchHistory?.length > 0 && (
                                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1.5 px-0.5 mt-1 border-t border-gray-50 dark:border-zinc-900 animate-in fade-in duration-500">
                                                {searchHistory.map((term, i) => (
                                                    <div 
                                                        key={`mob-${term}-${i}`}
                                                        className="flex items-center bg-gray-50 dark:bg-zinc-900 active:bg-gray-100 dark:active:bg-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-full pl-3 pr-2 py-0.5 gap-1.5 shrink-0 transition-all"
                                                        onClick={() => {
                                                            setSearchTerm(term);
                                                            router.replace({ pathname: '/', query: { ...router.query, search: term } }, undefined, { shallow: true });
                                                        }}
                                                    >
                                                        <span className="text-[9px] font-black text-gray-500 dark:text-zinc-500 uppercase tracking-tight">{term}</span>
                                                        <button 
                                                            onClick={(e: React.MouseEvent) => {
                                                                e.stopPropagation();
                                                                removeSearchHistory(term);
                                                            }}
                                                            className="p-1 rounded-full active:bg-gray-200 dark:active:bg-zinc-700 text-gray-300 dark:text-zinc-600"
                                                        >
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={clearSearchHistory}
                                                    className="text-[9px] font-black text-gray-300 dark:text-zinc-600 active:text-primary dark:active:text-primary uppercase tracking-widest px-2 shrink-0"
                                                >
                                                    ล้าง
                                                </button>
                                            </div>
                                        )}
                                    </header>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Content Wrapper for Main and Mobile Queue */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    <main id="main-content" className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent relative flex flex-col items-center bg-gray-50/10 dark:bg-zinc-950 transition-colors">
                        <div className="w-full pb-20">
                            {children}
                        </div>
                    </main>

                    {/* Mobile Queue Slide-up Overlay - Contained within content area */}
                    {isMobile && mounted && (
                        <div
                            className={clsx(
                                "absolute inset-0 z-[40] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white dark:bg-zinc-950",
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
                    "hidden lg:flex w-[420px] border-l border-gray-200 dark:border-zinc-800 flex-col z-20 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    (layoutMode !== 'fullscreen') ? "mr-0 opacity-100" : "-mr-[420px] w-0 opacity-0"
                )}
            >
                {/* 236px corresponds to the fixed SidebarPlayer height (16:9 for 420px) */}
                <div className="flex-1 flex flex-col pt-[236px] h-full relative z-10 bg-white dark:bg-zinc-900">
                    {/* Desktop Sidebar Controls (Moved here to prevent blocking QueueList) */}
                    <div className="shrink-0 bg-white dark:bg-zinc-900 relative z-20">
                        <SidebarControls castMode={castMode} />
                    </div>
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900 relative z-10">
                        <QueueList />
                    </div>
                </div>
            </aside>

            {/* Mobile Nav Drawer */}
            <div className={clsx("fixed inset-0 bg-black/60 z-40 transition-opacity lg:hidden backdrop-blur-sm", isNavOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => setNavOpen(false)} />
            <div className={clsx("fixed inset-y-0 left-0 z-50 bg-white dark:bg-zinc-950 w-[280px] shadow-2xl transition-transform duration-300 lg:hidden flex flex-col", isNavOpen ? "translate-x-0" : "-translate-x-full")}>
                <div className="h-16 flex items-center px-6 shrink-0 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-sm">Y</div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold tracking-tight leading-none text-gray-900 dark:text-white">YouOke</h1>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-medium tracking-wide">Karaoke Online</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-zinc-600 uppercase tracking-wider">เมนูหลัก</div>
                    <Link href="/" onClick={() => { handleNav(1); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 1) ? "bg-primary/10 text-primary" : "text-gray-600 dark:text-zinc-400 active:bg-gray-100 dark:active:bg-zinc-900")}> <Home className="w-5 h-5" /> <span>หน้าหลัก</span> </Link>
                    <Link href="/" onClick={() => { handleNav(2); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 2) ? "bg-primary/10 text-primary" : "text-gray-600 dark:text-zinc-400 active:bg-gray-100 dark:active:bg-zinc-900")}> <BarChart2 className="w-5 h-5" /> <span>ชาร์ตเพลง</span> </Link>
                    <Link href="/" onClick={() => { handleNav(3); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 3) ? "bg-primary/10 text-primary" : "text-gray-600 dark:text-zinc-400 active:bg-gray-100 dark:active:bg-zinc-900")}> <Headphones className="w-5 h-5" /> <span>สถานีเพลง</span> </Link>
                    <Link href="/" onClick={() => { handleNav(4); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 4) ? "bg-primary/10 text-primary" : "text-gray-600 dark:text-zinc-400 active:bg-gray-100 dark:active:bg-zinc-900")}> <Library className="w-5 h-5" /> <span>เพลย์ลิสต์</span> </Link>
                    
                    {user?.role === 'admin' && (<><div className="mt-6 px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-zinc-600 uppercase tracking-wider">Admin</div><Link href="/admin" onClick={() => setNavOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 dark:text-zinc-400 active:bg-gray-100 dark:active:bg-zinc-900 font-medium"> <Shield className="w-5 h-5" /> <span>Admin Panel</span> </Link></>)}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-zinc-600 uppercase tracking-wider">บัญชี</div>
                    {mounted && user ? (
                        <div className="flex items-center justify-between gap-2 px-2 py-2">
                            <div onClick={() => { setNavOpen(false); useUIStore.getState().setProfileOpen(true); }} className="flex items-center gap-3 overflow-hidden flex-1 active:bg-gray-100 dark:active:bg-zinc-900 p-1 rounded-lg transition-colors">
                                {user.photoURL ? <img src={user.photoURL} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">{user.email?.[0]}</div>}
                                <div><p className="text-sm font-bold truncate text-gray-900 dark:text-white">{user.displayName}</p><p className="text-[10px] text-gray-500 dark:text-zinc-500 uppercase font-semibold">{isPremium ? 'สมาชิก Pro' : 'สมาชิกทั่วไป'}</p></div>
                            </div>
                            <button 
                                onClick={() => { 
                                    showConfirm({
                                        title: 'ออกจากระบบ',
                                        message: 'คุณต้องการออกจากระบบใช่หรือไม่? คุณจะยังสามารถฟังเพลงฟรีได้ตามโควต้าที่มี',
                                        confirmText: 'ออกจากระบบ',
                                        cancelText: 'ยกเลิก',
                                        type: 'danger',
                                        onConfirm: () => signOut()
                                    });
                                }} 
                                className="p-2 text-gray-400 hover:text-red-500"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (<Link href="/login" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 font-medium shadow-sm justify-center"> <Key className="w-5 h-5" /> <span>เข้าสู่ระบบ</span> </Link>)}
                </div>
            </div>

            {/* Settings Modal */}
            <GlobalSettingsModal
                isOpen={isProfileOpen}
                onClose={() => setProfileOpen(false)}
            />

            {/* Receiver Info Modal */}
            <ReceiverInfoModal />

            {/* 🛡️ Membership Expired Modal (Admin v2.1) */}
            {showExpiryAlert && expiryStatus?.isExpired && (
                <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-zinc-800">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Info className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase">สิทธิ์สมาชิกหมดอายุ</h3>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
                            ขออภัย สิทธิพรีเมียมของคุณสิ้นสุดแล้ว <br/> 
                            ระบบได้ปรับเป็นสมาชิกทั่วไป (แบบฟรี) <br/>
                            เพื่อความสนุกต่อเนื่อง กรุณาเลือกแพ็กเกจใหม่ครับ
                        </p>
                        <div className="space-y-3">
                            <button 
                                onClick={() => {
                                    setExpiryAlert(false);
                                    router.push('/profile');
                                }}
                                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                ดูแพ็กเกจใหม่
                            </button>
                            <button 
                                onClick={() => setExpiryAlert(false)}
                                className="w-full py-3 text-gray-400 dark:text-zinc-600 text-xs font-bold hover:text-gray-600 dark:hover:text-zinc-400 transition-colors"
                            >
                                อ๋อ รับทราบครับ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal for Remote Connect */}
            {
                showQRCode && roomCode && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowQRCode(false)}>
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200 border border-white/20 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">เชื่อมต่อรีโมท</h3>
                                </div>
                                <button onClick={() => setShowQRCode(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                            </div>

                            <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-primary/20 inline-block shadow-sm">
                                {typeof window !== 'undefined' && (
                                    <QRCodeSVG 
                                        value={`${window.location.origin}/remote?room=${roomCode}`}
                                        size={220}
                                        level="H"
                                        includeMargin={false}
                                        className="rounded-lg"
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">สแกนด้วยกล้องมือถือ</p>
                                <p className="text-xs text-gray-500 dark:text-zinc-500">เพื่อใช้มือถือเลือกเพลงและควบคุมการเล่น</p>
                            </div>

                            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                                <p className="text-[10px] text-gray-400 dark:text-zinc-600 font-mono">Room Code: {roomCode}</p>
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
                onSelectYouTube={() => {
                    setCastModalOpen(false);
                    setCastMode('youtube');
                    
                    // Fallback Mode: Open as a one-shot playlist
                    if (playerQueue.length > 0) {
                        const ids = playerQueue
                            .filter(v => v.sourceType === 'youtube')
                            .map(v => v.videoId || v.id)
                            .filter(Boolean)
                            .join(',');
                        
                        if (ids) {
                            // Note: watch_videos?video_ids handles a list of ID strings
                            window.open(`https://www.youtube.com/watch_videos?video_ids=${ids}`, '_blank');
                            addToast('📺 ส่งเพลย์ลิสต์เพลงเข้า YouTube แล้ว (เล่นครั้งเดียวจบ)');
                            return;
                        }
                    }

                    // Open YouTube TV (Leanback) for a specialized big screen experience
                    window.open('https://www.youtube.com/tv', '_blank');
                    addToast('กำลังส่งไปยัง YouTube TV App');
                }}
                onJoinRoom={handleJoinRoom}
                onDisconnect={handleDisconnect}
                castMode={castMode}
            />

            {/* Global Limit Reached Modal */}
            <LimitReachedModal />

            {/* Mobile Bottom Navigation (Hidden in Fullscreen) */}
            {layoutMode !== 'fullscreen' && <MobileBottomNav />}

            {/* BOTTOM FLOATING PLAYER (Apple Music Style - Unified for Mobile/Desktop) */}

            <NotificationToast />
        </div >
    );
}
