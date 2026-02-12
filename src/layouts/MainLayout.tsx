import React, { ReactNode, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { Menu, Search, ListMusic, Home, X, Monitor, MessageCircle, Shield, Key, Smartphone, Flame, Library, Mic, Music, ChevronDown, ChevronRight, ChevronLeft, Cast, Disc, LogOut, UserCheck, Settings, Info, PartyPopper, Star, Trash2, EyeOff, User } from 'lucide-react';
import { Square2StackIcon, QrCodeIcon } from '@heroicons/react/24/outline';
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
import { UnifiedCastButton } from '../plugins/cast/components/UnifiedCastButton';
// Static critical imports
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { Sidebar } from '../components/navigation/Sidebar';
import { useCast } from '../plugins/cast/context/CastContext';
import { useToast } from '../context/ToastContext';
import useIsMobile from '../hooks/isMobile';
import { useShallow } from 'zustand/react/shallow';

// Dynamic (Lazy) Imports for Heavy/hidden Components
const ProfileDrawer = dynamic(() => import('../components/profile/ProfileDrawer'), { ssr: false });
const ShareRoomModal = dynamic(() => import('../modules/party-system/components/ShareRoomModal').then(mod => mod.ShareRoomModal), { ssr: false });
const CastModeSelector = dynamic(() => import('../plugins/cast/components/CastModeSelector').then(mod => mod.CastModeSelector), { ssr: false });
const LimitReachedModal = dynamic(() => import('../modules/player/components/LimitReachedModal').then(mod => mod.LimitReachedModal), { ssr: false });
const ReceiverInfoModal = dynamic(() => import('../modules/party-system/components/ReceiverInfoModal').then(mod => mod.ReceiverInfoModal), { ssr: false });

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const router = useRouter();
    // Use Global UI Store instead of local state
    const {
        isQueueOpen, setQueueOpen,
        isNavOpen, setNavOpen,
        isMobileSearchOpen, setMobileSearchOpen,
        isProfileOpen, setProfileOpen,
        isMobilePlayerExpanded, setMobilePlayerExpanded,
        isPlayerHidden, setPlayerHidden,
        isReceiverModalOpen, setReceiverModalOpen
    } = useUIStore();

    // Local state for layout-specific things only
    // const [isMobilePlayerExpanded, setMobilePlayerExpanded] = useState(false); // REMOVED
    const [partyModalOpen, setPartyModalOpen] = useState(false);
    const [partyRoomCode, setPartyRoomCode] = useState('');

    const { searchTerm, setSearchTerm, activeIndex, setActiveIndex, isKaraoke, setIsKaraoke } = usePlayerStore(
        useShallow(state => ({
            searchTerm: state.searchTerm,
            setSearchTerm: state.setSearchTerm,
            activeIndex: state.activeIndex,
            setActiveIndex: state.setActiveIndex,
            isKaraoke: state.isKaraoke,
            setIsKaraoke: state.setIsKaraoke,
        }))
    );

    // Derived state for UI toggle
    const dataSource = isKaraoke ? 'karaoke' : 'mv';
    const toggleSource = (source: 'karaoke' | 'mv') => setIsKaraoke(source === 'karaoke');

    // Helper to handle navigation state
    const handleNav = (index: number) => {
        setSearchTerm(''); // Clear search when changing tabs
        setActiveIndex(index);
    };

    // Auth & Config
    const { user, signOut } = useSystem().auth();
    const isPremium = user?.membership?.type !== 'free';
    const { config } = useSystemConfig();
    const allowRemote = config?.membership?.[isPremium ? 'premium' : 'free']?.allow_remote;

    // Room Code: Use User UID or Generate Guest ID
    const [guestId, setGuestId] = useState<string | null>(null);
    useEffect(() => {
        if (!user) {
            let gid = localStorage.getItem('youoke_guest_id');
            if (!gid) {
                gid = Math.random().toString(36).substring(2, 8).toUpperCase();
                localStorage.setItem('youoke_guest_id', gid);
            }
            setGuestId(gid);
        }
    }, [user]);

    const roomCode = user?.uid || guestId;
    const [showQRCode, setShowQRCode] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Cast & UI Store
    const { isCastModalOpen, setCastModalOpen } = useUIStore();
    const { connect: connectGoogleCast, isAvailable: isCastAvailable } = useCast();
    const { addToast } = useToast() || { addToast: () => { } };
    const isMobile = useIsMobile();
    const { queue } = usePlayerStore();

    // Cast Handlers
    const handleCastSelectWebMonitor = () => {
        setCastModalOpen(false);
        // Toggle QR Code/Instructions for Remote
        setShowQRCode(true);
        // Optionally scroll to top or show a modal?
        // For now, MainLayout header shows QR when showQRCode is true.
    };

    const handleCastSelectDual = () => {
        setCastModalOpen(false);
        localStorage.setItem('youoke-dual-active', 'true');
        window.open('/dual', '_blank');
    };

    const handleCastSelectGoogle = () => {
        setCastModalOpen(false);
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
    };

    const handleCastSelectYouTube = () => {
        setCastModalOpen(false);
        if (queue.length === 0) {
            addToast('กรุณาเพิ่มเพลงลงคิวก่อน');
            return;
        }
        const videoIds = queue.map((v) => v.videoId).join(',');
        const youtubeURL = `https://www.youtube.com/watch_videos?video_ids=${videoIds}`;
        window.open(youtubeURL, '_blank');
    };

    // Initialize Wireless Cast Service (Receiver)
    useEffect(() => {
        if (!roomCode) return;

        const initCast = async () => {
            const { castService } = await import('../plugins/cast/services/CastService');
            // Check if service is already initialized with this room
            // But initialize() handles cleanup internally, so it's safe to call.
            console.log('🔗 MainLayout: Connecting to Remote Room', roomCode);
            await castService.initialize(roomCode);
        };

        if (allowRemote) {
            // initCast(); // DISABLE AUTO-INIT to prevent Guest Login Loop
        }

        return () => {
            // Optional: We might want to keep it alive if navigating within the app? 
            // But MainLayout unmounts rarely (only on full refresh or page change if not in _app).
            // Actually, MainLayout re-renders but doesn't unmount on page transitions in Next.js? 
            // Better to cleanup to avoid memory leaks or double listeners.
            import('../plugins/cast/services/CastService').then(({ castService }) => {
                castService.cleanup();
            });
        };
    }, [roomCode, allowRemote]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-open Queue (and Player) when first song is added
    const prevQueueLen = useRef(0);
    useEffect(() => {
        if (prevQueueLen.current === 0 && queue.length > 0) {
            useUIStore.getState().setQueueOpen(true);
        }
        prevQueueLen.current = queue.length;
    }, [queue.length]);

    // ... (Return statement remains mostly same)

    return (
        <div className="flex h-screen w-full bg-white text-text-base overflow-hidden">
            {/* Left Sidebar (Premium White) - Extracted & Memoized */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative bg-white">
                {/* Mobile Header (Visible only on mobile) */}
                <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-gray-100 bg-white sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        {/* Profile Button instead of Hamburger */}
                        {/* Back Button or Profile Button */}
                        {useUIStore((state) => state.backAction) ? (
                            <button
                                onClick={() => useUIStore.getState().backAction?.()}
                                className="p-2 rounded-full active:bg-gray-100 transition-colors text-gray-900"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setProfileOpen(true)}
                                className="p-0.5 rounded-full active:scale-95 transition-all duration-300 relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary via-purple-500 to-pink-500 rounded-full opacity-70 group-hover:opacity-100 blur-[2px]" />
                                <div className="relative bg-white p-0.5 rounded-full">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border border-gray-100 object-cover" />
                                    ) : (
                                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-gray-400 font-bold border border-gray-100">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        )}

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">Y</div>
                            <span className="font-bold text-lg text-gray-900">YouOke</span>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md hidden sm:inline-block">v2.18.0</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <UnifiedCastButton className="text-gray-600" />
                        <button
                            onClick={() => setMobileSearchOpen(!isMobileSearchOpen)}
                            className={clsx("p-2 rounded-full transition-colors", isMobileSearchOpen ? "bg-primary/10 text-primary" : "text-gray-600 active:bg-gray-100")}
                        >
                            <Search className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* Mobile Search Bar (Floating Island - Google Style) */}
                <div className={clsx(
                    "lg:hidden fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] w-[95%] max-w-2xl",
                    isMobileSearchOpen ? "top-20 opacity-100 scale-100 translate-y-0" : "top-16 opacity-0 scale-95 -translate-y-4 pointer-events-none"
                )}>
                    {/* Main Card - Glassmorphism Style (Mirror Glass) */}
                    <div className="bg-[#f4f4f5]/95 backdrop-blur-3xl p-4 rounded-[32px] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.2)] shadow-primary/10 border border-gray-200/50 ring-1 ring-white/50 space-y-4 relative overflow-hidden">
                        {/* Gradient Mesh - Made slightly more visible */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] -z-10" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-[40px] -z-10" />
                        {/* Search Input */}
                        {/* Search Input Area */}
                        <div className="flex gap-2">
                            <div className="relative group flex-1">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-6 w-6 text-primary/60 group-focus-within:text-primary transition-colors" />
                                </div>
                                <DebounceInput
                                    minLength={2}
                                    debounceTimeout={300}
                                    placeholder="ค้นหาเพลง, ศิลปิน..."
                                    className="block w-full pl-12 pr-12 h-14 bg-white/60 hover:bg-white focus:bg-white border-2 border-transparent focus:border-primary/20 rounded-[24px] text-lg font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-all shadow-inner"
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
                                    }} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors">
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </div>

                            {/* Close Button (New) */}
                            <button
                                onClick={() => setMobileSearchOpen(false)}
                                className="h-14 w-14 flex items-center justify-center bg-gray-100/80 hover:bg-gray-200 text-gray-500 hover:text-red-500 rounded-[24px] transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Mode Toggle (Karaoke/Song) - Sliding Animation */}
                        <div className="relative flex items-center bg-gray-100/80 rounded-[24px] p-1 h-12">
                            {/* Sliding Active Background */}
                            <div
                                className={clsx(
                                    "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                    isKaraoke ? "left-[calc(50%+2px)]" : "left-1"
                                )}
                            />

                            {/* Song Option */}
                            <button
                                onClick={() => setIsKaraoke(false)}
                                className={clsx(
                                    "relative flex-1 flex items-center justify-center gap-2 h-full rounded-[20px] text-sm font-bold transition-colors z-10",
                                    !isKaraoke ? "text-primary" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Music className={clsx("w-4 h-4 transition-transform duration-300", !isKaraoke ? "scale-110" : "scale-100")} strokeWidth={2.5} />
                                <span>เพลงทั่วไป</span>
                            </button>

                            {/* Karaoke Option */}
                            <button
                                onClick={() => setIsKaraoke(true)}
                                className={clsx(
                                    "relative flex-1 flex items-center justify-center gap-2 h-full rounded-[20px] text-sm font-bold transition-colors z-10",
                                    isKaraoke ? "text-primary" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Mic className={clsx("w-4 h-4 transition-transform duration-300", isKaraoke ? "scale-110" : "scale-100")} strokeWidth={2.5} />
                                <span>คาราโอเกะ</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop Header */}
                <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-gray-100 bg-white sticky top-0 z-20 transition-all">
                    <div className="flex-1 max-w-2xl relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <DebounceInput
                            minLength={2}
                            debounceTimeout={300}
                            placeholder="ค้นหาเพลง, ศิลปิน, หรือวางลิงก์ YouTube..."
                            className="block w-full pl-12 pr-12 h-12 bg-gray-100 border-none rounded-2xl leading-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                router.replace({
                                    pathname: '/',
                                    query: { ...router.query, search: e.target.value }
                                }, undefined, { shallow: true });
                            }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    const { search, ...rest } = router.query;
                                    router.replace({ pathname: '/', query: rest }, undefined, { shallow: true });
                                }}
                                className="absolute inset-y-0 right-12 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}

                    </div>

                    <div className="flex items-center gap-4 ml-4">
                        {/* Search Toggle (Karaoke/Song) */}
                        {/* Search Toggle (Karaoke/Song) - Animated Switch */}
                        <div className="relative flex items-center bg-gray-100 rounded-2xl p-1 h-12 w-[200px]">
                            {/* Sliding Active Background */}
                            <div
                                className={clsx(
                                    "absolute top-1.5 bottom-1.5 w-[calc(50%-8px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                    isKaraoke ? "left-[calc(50%+2px)]" : "left-1.5"
                                )}
                            />

                            {/* Song Option */}
                            <button
                                onClick={() => setIsKaraoke(false)}
                                className={clsx(
                                    "relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-xl text-xs font-bold transition-colors z-10",
                                    !isKaraoke ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Music className="w-3.5 h-3.5" />
                                <span>เพลง</span>
                            </button>

                            {/* Karaoke Option */}
                            <button
                                onClick={() => setIsKaraoke(true)}
                                className={clsx(
                                    "relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-xl text-xs font-bold transition-colors z-10",
                                    isKaraoke ? "text-primary" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Mic className="w-3.5 h-3.5" />
                                <span>คาราโอเกะ</span>
                            </button>
                        </div>

                        {/* Party Mode Button */}
                        <button
                            onClick={async () => {
                                const { castService } = await import('../plugins/cast/services/CastService');
                                const code = await castService.initialize();
                                setPartyRoomCode(code);
                                setPartyModalOpen(true);
                            }}
                            className="h-12 w-12 rounded-2xl p-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200 mr-2 text-gray-500 hover:text-primary transition-colors tooltip tooltip-bottom"
                            data-tip="Party Mode (Guests)"
                        >
                            <QrCodeIcon className="w-6 h-6" />
                        </button>



                        {/* Cast Button */}
                        <UnifiedCastButton isCircle={false} className="h-12 w-12 rounded-2xl p-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200" />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pt-4 pb-[64px] lg:pb-0 relative flex flex-col items-center">

                    {/* Floating Player (Moved to Main Column for correct centering) */}


                    <div className="w-full">
                        {children}
                    </div>
                    {/* Floating Player (Moved to Bottom of Main) */}
                    {(() => {
                        const HEADER_HEIGHT = 48;
                        const PLAYER_HEIGHT = 86;
                        const MAX_ITEMS = 5;
                        const queueContentHeight = Math.min(queue.length, MAX_ITEMS) * 60;
                        const effectiveQueueHeight = queue.length === 0 ? 100 : queueContentHeight;
                        const expandedHeight = PLAYER_HEIGHT + HEADER_HEIGHT + effectiveQueueHeight;
                        const finalExpandedHeight = `min(${expandedHeight}px, 70vh)`;
                        const showPlayer = mounted && (queue.length > 0 || isMobilePlayerExpanded || isQueueOpen) && !isPlayerHidden;

                        return (
                            <div
                                className={clsx(
                                    "fixed lg:sticky z-[80] transition-all duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shrink-0 mt-auto mb-0 will-change-transform transform-gpu",
                                    // Mobile: Full width, docked above nav (71px for 1px overlap to prevent gaps)
                                    "bottom-[calc(71px+env(safe-area-inset-bottom))] w-full left-0 right-0",
                                    // Desktop: Floating, centered, reset positioning
                                    "lg:hidden lg:!bottom-6 lg:w-[95%] lg:max-w-2xl lg:mx-auto lg:!h-[86px] lg:left-auto lg:right-auto",
                                    showPlayer ? "translate-y-0 opacity-100 scale-100" : "translate-y-[120%] opacity-0 scale-95 pointer-events-none",
                                    "isolate" // Remove overflow-hidden and bg/border from here to allow tab protrusion
                                )}
                                style={{
                                    height: isQueueOpen ? finalExpandedHeight : '86px'
                                }}
                            >
                                {/* Inner Content Wrapper (Handles BG/Blur/Overflow) */}
                                <div className={clsx(
                                    "flex-1 flex flex-col overflow-hidden relative z-10 w-full h-full shadow-[0_-4px_24px_rgba(0,0,0,0.08)] border-t border-l border-r border-gray-200/50 lg:border lg:shadow-[0_8px_48px_-12px_rgba(0,0,0,0.6)]",
                                    "bg-white",
                                    isQueueOpen ? "rounded-t-[32px] rounded-b-none lg:rounded-[40px] lg:rounded-b-[40px] lg:!rounded-tr-[40px]" : "rounded-t-[24px] rounded-b-none lg:rounded-[32px] lg:rounded-b-[32px]"
                                )}>

                                    {mounted && (
                                        <>
                                            {/* Queue Section */}
                                            <div className={clsx(
                                                "flex-1 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col border-b border-white/10 lg:hidden",
                                                isQueueOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                                            )}>
                                                <div className="px-4 py-3 flex items-center justify-between shrink-0 bg-white h-[48px]">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-gray-800/90 text-sm flex items-center gap-2 drop-shadow-sm">
                                                            <ListMusic className="w-4 h-4 text-primary" />
                                                            คิวเพลง ({queue.length})
                                                        </span>

                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => { if (confirm('ต้องการลบคิวทั้งหมดใช่หรือไม่?')) usePlayerStore.getState().clearQueue(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 text-[11px] font-bold transition-all border border-red-500/10 backdrop-blur-sm shadow-sm">
                                                            <Trash2 className="w-3 h-3" />
                                                            <span>ลบทั้งหมด</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto bg-white">
                                                    <QueueList />
                                                </div>
                                            </div>

                                            {/* Player Controls - Hidden on lg (desktop) if using Sidebar controls */}
                                            {!isMobile && (
                                                <div className="shrink-0 p-2 sm:p-3 relative z-10 bg-white h-[86px] flex lg:hidden items-center">
                                                    <div className="w-full">
                                                        <PlayerControls />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </main>

                {/* MobileMiniPlayer moved to Root Level */}
            </div >

            {/* Global Player (Detached & Persistent) */}
            {
                mounted && (
                    <div
                        id="global-video-player-container"
                        className={clsx(
                            "fixed transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-[70] bg-black overflow-hidden",

                            // Mobile Logic
                            !isMobilePlayerExpanded
                                ? "max-lg:opacity-0 max-lg:pointer-events-none max-lg:fixed max-lg:bottom-0 max-lg:right-0 max-lg:w-1 max-lg:h-1 lg:opacity-100" // Hidden but mounted
                                : "max-lg:inset-0 max-lg:w-full max-lg:h-full max-lg:opacity-100 lg:opacity-100", // Expanded

                            // Desktop Logic
                            "lg:top-0 lg:w-[420px] lg:AspectRatio-[16/9] lg:h-[314px]",
                            (isQueueOpen && queue.length > 0) ? "lg:right-0" : "lg:-right-[420px]"
                        )}>
                        <div className="relative w-full h-full flex flex-col">
                            <SidebarPlayer />
                            {/* Integrated Sidebar Controls directly under video */}
                            <SidebarControls />
                            <button onClick={() => setMobilePlayerExpanded(false)} className="absolute top-4 left-4 z-50 p-2 bg-black/50 text-white rounded-full lg:hidden"><ChevronDown className="w-6 h-6" /></button>
                        </div>
                    </div>
                )
            }

            {/* Right Sidebar (Queue Only - Collapsible) */}
            <aside className={clsx(
                "hidden lg:flex w-[420px] border-l border-gray-100 flex-col z-20 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                isQueueOpen ? "mr-0 w-[420px] opacity-100" : "-mr-[420px] w-0 opacity-0"
            )} style={{ backgroundColor: '#ffffff', background: '#ffffff' }}>
                {/* 236px (Video) + 54px (SidebarControls) + 14px (Space) = 304px */}
                <div className="flex-1 flex flex-col pt-[304px] h-full relative z-10" style={{ backgroundColor: '#ffffff' }}>
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: '#ffffff' }}>
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
                                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">v2.14.0</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium tracking-wide">Karaoke Online</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">เมนูหลัก</div>
                    <Link href="/" onClick={() => { handleNav(1); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 1) ? "bg-primary/10 text-primary" : "text-gray-600 active:bg-gray-100")}> <Home className="w-5 h-5" /> <span>หน้าหลัก</span> </Link>
                    <Link href="/" onClick={() => { handleNav(2); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 2) ? "bg-primary/10 text-primary" : "text-gray-600 active:bg-gray-100")}> <Star className="w-5 h-5" /> <span>แนะนำ</span> </Link>
                    <Link href="/" onClick={() => { handleNav(3); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 3) ? "bg-primary/10 text-primary" : "text-gray-600 active:bg-gray-100")}> <Flame className="w-5 h-5" /> <span>มาแรง</span> </Link>
                    <Link href="/" onClick={() => { handleNav(4); setNavOpen(false); }} className={clsx("flex items-center gap-3 px-3 py-3 rounded-lg transition-all font-medium", (router.pathname === '/' && activeIndex === 4) ? "bg-primary/10 text-primary" : "text-gray-600 active:bg-gray-100")}> <Library className="w-5 h-5" /> <span>เพลย์ลิสต์</span> </Link>
                    <div className="mt-6 px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">ระบบ</div>
                    <Link href="/monitor" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 active:bg-gray-100 font-medium"> <Cast className="w-5 h-5" /> <span>จอแยก (Caster)</span> </Link>
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

            {/* Cast Mode Selector Modal */}
            <CastModeSelector
                isOpen={isCastModalOpen}
                onClose={() => setCastModalOpen(false)}
                isCastAvailable={isCastAvailable}
                isMobile={isMobile}
                onSelectWebMonitor={handleCastSelectWebMonitor}
                onSelectDual={() => window.open('/dual?mode=mirror', 'YouOkeMirror', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no')}
                onSelectDj={() => window.open('/dual?mode=dj', 'YouOkeDJ', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no')}
                onSelectGoogleCast={handleCastSelectGoogle}
                onSelectYouTube={handleCastSelectYouTube}
            />

            {/* Global Limit Reached Modal */}
            <LimitReachedModal />

            {/* Party Share Modal */}
            <ShareRoomModal
                isOpen={partyModalOpen}
                onClose={() => setPartyModalOpen(false)}
                roomCode={partyRoomCode}
                shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/remote?room=${partyRoomCode}` : ''}
            />

            {/* Mobile Bottom Navigation (Always Visible) */}
            <MobileBottomNav />

            {/* BOTTOM FLOATING PLAYER (Apple Music Style - Unified for Mobile/Desktop) */}


        </div >
    );
}
