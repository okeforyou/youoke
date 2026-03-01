import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { Menu, Search, ListMusic, Home, X, Monitor, MessageCircle, Shield, Key, Smartphone, Flame, Library, Mic, Music, ChevronDown, ChevronRight, ChevronLeft, Cast, Disc, LogOut, UserCheck, Settings, Info, PartyPopper, Star, Trash2, EyeOff, User, Maximize } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DebounceInput } from 'react-debounce-input';
import { useSystem } from '@/core/container/SystemContext';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { SidebarPlayer } from '../modules/player/components/SidebarPlayer';
import { PlayerControls } from '../modules/player/components/PlayerControls';
import { SidebarControls } from '../modules/player/components/SidebarControls';
import { QueueList } from '../modules/player/components/QueueList';
import { useSystemConfig } from '../hooks/useSystemConfig';
import { useUIStore } from '../stores/useUIStore';
import { sanitizeForFirebase } from '../utils/firebase';
import { useModule } from '../hooks/useModule'; // Added for context logic if needed

import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { Sidebar } from '../components/navigation/Sidebar';
import { useCast } from '../plugins/cast/context/CastContext';
import { useToast } from '@/context/ToastContext';
import useIsMobile from '../hooks/isMobile';
import { useShallow } from 'zustand/react/shallow';
import { useRemoteHost } from '../hooks/useRemoteHost';
import { realtimeDb } from '@/firebase';
import { ref, push, set } from 'firebase/database';

const ProfileDrawer = dynamic(() => import('../components/profile/ProfileDrawer'), { ssr: false });
const ShareRoomModal = dynamic(() => import('../modules/party-system/components/ShareRoomModal').then(mod => mod.ShareRoomModal), { ssr: false });
const CastModeSelector = dynamic(() => import('../plugins/cast/components/CastModeSelector').then(mod => mod.CastModeSelector), { ssr: false });
const LimitReachedModal = dynamic(() => import('../modules/player/components/LimitReachedModal').then(mod => mod.LimitReachedModal), { ssr: false });
const ReceiverInfoModal = dynamic(() => import('../modules/party-system/components/ReceiverInfoModal').then(mod => mod.ReceiverInfoModal), { ssr: false });
import { UnifiedCastButton } from '../plugins/cast/components/UnifiedCastButton';
import { type CastMode } from '../plugins/cast/components/CastStatusBar';

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

    const [partyModalOpen, setPartyModalOpen] = useState(false);
    const [partyRoomCode, setPartyRoomCode] = useState('');
    const [mounted, setMounted] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);

    const {
        searchTerm, setSearchTerm, activeIndex, setActiveIndex, isKaraoke, setIsKaraoke,
        queue: playerQueue, addToQueue, reorderQueue, isPlaying, layoutMode, triggerFullscreen,
        currentVideo
    } = usePlayerStore(
        useShallow(state => ({
            searchTerm: state.searchTerm,
            setSearchTerm: state.setSearchTerm,
            activeIndex: state.activeIndex,
            setActiveIndex: state.setActiveIndex,
            isKaraoke: state.isKaraoke,
            setIsKaraoke: state.setIsKaraoke,
            queue: state.queue,
            addToQueue: state.addToQueue,
            reorderQueue: state.reorderQueue,
            isPlaying: state.isPlaying,
            layoutMode: state.layoutMode,
            triggerFullscreen: state.triggerFullscreen,
            currentVideo: state.currentVideo
        }))
    );

    const handleNav = (index: number) => {
        setSearchTerm('');
        setActiveIndex(index);
    };

    const { user, signOut } = useSystem().auth();
    const isPremium = user?.membership?.type !== 'free';
    const { config } = useSystemConfig();
    const [partyPIN, setPartyPIN] = useState<string | null>(null);
    const roomCode = partyPIN;

    const { isCastModalOpen, setCastModalOpen } = useUIStore();
    const { connect: connectGoogleCast, isAvailable: isCastAvailable } = useCast();
    const { addToast } = useToast() || { addToast: () => { } };
    const isMobile = useIsMobile();
    const { queue } = usePlayerStore();
    const mainScrollRef = useRef<HTMLElement>(null);

    // CENTRALIZED SCROLL TO TOP LOGIC
    // When switching tabs, reset scroll position of the main container
    useEffect(() => {
        if (mainScrollRef.current) {
            // Use a slight delay to ensure content has started rendering
            const timer = setTimeout(() => {
                mainScrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [activeIndex]); // Only on tab change, NOT on searchTerm to avoid jumping while typing on desktop

    // Auto-open/close Queue (and Player) based on contents (Desktop Only)
    const isFirstLoad = useRef(true);
    const prevQueueLen = useRef(0);
    useEffect(() => {
        if (!mounted || isMobile || (typeof window !== 'undefined' && window.innerWidth < 1024)) return;

        // Skip auto-open on initial mount if queue exists
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            prevQueueLen.current = playerQueue.length;
            return;
        }

        if (prevQueueLen.current === 0 && playerQueue.length > 0) {
            setQueueOpen(true);
        } else if (playerQueue.length === 0) {
            setQueueOpen(false);
        }
        prevQueueLen.current = playerQueue.length;
    }, [playerQueue.length, isMobile, mounted]);

    const handleRemoteConnected = useCallback(() => {
        if (showQRCode || partyModalOpen) {
            setShowQRCode(false);
            setPartyModalOpen(false);
        }
    }, [showQRCode, partyModalOpen]);

    const isProcessingRemote = useRef(false);
    const dualWindowRef = useRef<Window | null>(null);

    const toggleNativeFullscreen = useCallback(() => {
        const isFs = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
        if (!isFs) {
            const elem = document.getElementById('karaoke-video-container-dashboard') || document.getElementById('karaoke-video-container') || document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => console.error("Fullscreen failed:", err));
            } else if ((elem as any).webkitRequestFullscreen) {
                (elem as any).webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => console.error("Exit fullscreen failed:", err));
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            }
        }
        triggerFullscreen();
    }, [triggerFullscreen]);

    const { connectionStatus, connectedClients } = useRemoteHost(
        { current: null } as any,
        { current: { toggleFullscreen: toggleNativeFullscreen } } as any,
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

    useEffect(() => {
        if (connectionStatus === 'active') { handleRemoteConnected(); }
    }, [connectionStatus, handleRemoteConnected]);

    useEffect(() => {
        setMounted(true);
        const cachedPin = localStorage.getItem('youoke_party_pin');
        if (cachedPin) {
            setPartyPIN(cachedPin);
        } else {
            const newPin = Math.floor(1000 + Math.random() * 9000).toString();
            setPartyPIN(newPin);
            localStorage.setItem('youoke_party_pin', newPin);
        }
    }, []);

    const handleCastSelectWebMonitor = () => {
        setCastModalOpen(false);
        setCastMode('webmonitor');
        setShowQRCode(true);
    };

    const handleCastSelectSmartTV = () => {
        setCastModalOpen(false);
        setCastMode('smarttv');
        addToast('โหมดจอภาพไร้สายเปิดใช้งานแล้ว กรุณาเปิดหน้าจอรับภาพบนอุปกรณ์อื่น');
    };

    const handleCastSelectDual = () => {
        setCastModalOpen(false);
        useUIStore.getState().setIsCastingLocal(true);
        setCastMode('dual');
        window.open('/dual?mode=dj', 'YouOkeDual', 'width=1280,height=720');
    };

    const handleCastSelectGoogle = () => {
        setCastModalOpen(false);
        if (queue.length === 0) {
            addToast('กรุณาเพิ่มเพลงลงคิวก่อน');
            return;
        }
        connectGoogleCast(queue.map(item => ({ ...item, videoThumbnails: [], authorId: '', authorUrl: '', lengthSeconds: 0, viewCount: 0 } as any)));
        setCastMode('google');
    };

    const handleDisconnect = useCallback(() => {
        if (castMode === 'dual') useUIStore.getState().setIsCastingLocal(false);
        setCastModalOpen(false);
        setCastMode('none');
        addToast('ตัดการเชื่อมต่อสำเร็จ');
    }, [castMode, addToast, setCastModalOpen]);

    const handleJoinRoom = (code: string) => {
        setPartyPIN(code);
        setCastMode('smarttv');
        addToast(`เชื่อมต่อห้อง ${code} สำเร็จ!`);
    };

    // Auto-sync theme color for red line removal
    useEffect(() => {
        if (!mounted) return;
        const color = layoutMode === 'fullscreen' ? '#000000' : '#ef4444';
        const metas = document.querySelectorAll('meta[name="theme-color"]');
        metas.forEach(m => m.setAttribute('content', color));
    }, [layoutMode, mounted]);

    return (
        <div className={clsx(
            "flex max-lg:flex-col lg:h-screen lg:overflow-hidden min-h-screen w-full text-text-base subpixel-antialiased antialiased transition-colors duration-500",
            layoutMode === 'fullscreen' ? "bg-black" : "bg-white"
        )}>
            <Head>
                <meta name="theme-color" content={layoutMode === 'fullscreen' ? '#000000' : '#ef4444'} />
                <title>YouOke - คาราโอเกะออนไลน์</title>
            </Head>

            {layoutMode !== 'fullscreen' && <Sidebar />}

            {/* Main content wrapper */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-white z-10">
                {/* Main Scroll Area */}
                <main ref={mainScrollRef} className="flex-1 overflow-y-auto relative flex flex-col bg-gray-50/20">
                    <div className="w-full pb-20">
                        {/* 🏝️ STICKY GLASS HEADERS */}

                        {/* Desktop Header */}
                        <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-gray-100/50 bg-white/70 backdrop-blur-xl sticky top-0 z-30 transition-all">
                            <div className="flex-1 max-w-2xl relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                <DebounceInput
                                    minLength={2} debounceTimeout={300} placeholder="ค้นหาเพลง, ศิลปิน, หรือวางลิงก์ YouTube..."
                                    className="block w-full pl-14 pr-12 h-12 bg-white/50 hover:bg-white focus:bg-white border border-gray-100 focus:border-primary/20 rounded-2xl leading-5 text-gray-900 placeholder-gray-400 focus:outline-none transition-all shadow-sm font-medium"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        router.replace({ pathname: '/', query: { ...router.query, search: e.target.value } }, undefined, { shallow: true });
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-6 ml-6">
                                <div className="relative flex items-center bg-gray-100/50 rounded-2xl p-1 h-11 w-[200px] border border-gray-200/50 shadow-inner">
                                    <div className={clsx(
                                        "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-lg transition-all duration-300",
                                        isKaraoke ? "left-[calc(50%+2px)]" : "left-1"
                                    )} />
                                    <button onClick={() => setIsKaraoke(false)} className={clsx("relative flex-1 text-sm font-black uppercase z-10 transition-all no-underline", !isKaraoke ? "text-primary scale-105" : "text-black hover:text-primary/70")}>เพลง</button>
                                    <button onClick={() => setIsKaraoke(true)} className={clsx("relative flex-1 text-sm font-black uppercase z-10 transition-all no-underline", isKaraoke ? "text-primary scale-105" : "text-black hover:text-primary/70")}>คาราโอเกะ</button>
                                </div>
                                <button
                                    onClick={() => setShowQRCode(true)}
                                    className="group relative h-11 w-11 rounded-2xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all text-black hover:scale-105 active:scale-95"
                                    title="เชื่อมต่อรีโมท"
                                >
                                    <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    {mounted && (
                                        <div className={clsx(
                                            "absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-white transition-colors duration-500 shadow-sm",
                                            connectionStatus === 'active' ? "bg-green-500 animate-pulse" :
                                                connectionStatus === 'background' ? "bg-orange-500" : "bg-gray-300"
                                        )} />
                                    )}
                                </button>
                            </div>
                        </header>

                        {/* Mobile Header/Controls */}
                        {layoutMode !== 'fullscreen' && (
                            <div className="lg:hidden flex flex-col pb-2.5 bg-[#f4f4f5]/95 backdrop-blur-xl border-b border-gray-100/50 shadow-sm sticky top-0 z-30">
                                <SidebarControls />
                                <div className="px-3 pt-1 flex gap-2.5">
                                    <div className="flex-1 relative flex items-center bg-black/[0.04] border border-gray-100 rounded-2xl px-4 h-11 transition-all focus-within:bg-white shadow-inner">
                                        <Search className="h-4.5 w-4.5 text-gray-400" />
                                        <DebounceInput
                                            minLength={2}
                                            debounceTimeout={300}
                                            placeholder="ค้นหาเพลง..."
                                            className="w-full bg-transparent pl-3 text-[15px] font-bold focus:outline-none"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                router.replace({ pathname: '/', query: { ...router.query, search: e.target.value } }, undefined, { shallow: true });
                                            }}
                                        />
                                    </div>
                                    <div className="relative flex bg-gray-200/50 p-1 rounded-full border border-gray-200/50 shrink-0 h-11 items-center shadow-inner overflow-hidden w-[100px]">
                                        {/* Premium Sliding Background */}
                                        <div className={clsx(
                                            "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                            isKaraoke ? "left-[calc(50%+2px)]" : "left-1"
                                        )} />
                                        <button
                                            onClick={() => setIsKaraoke(false)}
                                            className={clsx(
                                                "relative flex-1 h-full flex items-center justify-center z-10 transition-all duration-300",
                                                !isKaraoke ? "text-primary scale-110" : "text-gray-400"
                                            )}
                                        >
                                            <Music size={18} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => setIsKaraoke(true)}
                                            className={clsx(
                                                "relative flex-1 h-full flex items-center justify-center z-10 transition-all duration-300",
                                                isKaraoke ? "text-primary scale-110" : "text-gray-400"
                                            )}
                                        >
                                            <Mic size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Page Content */}
                        <div className="px-0 relative overflow-hidden min-h-[calc(100vh-200px)]">
                            {/* Main Content Layer */}
                            <div className={clsx(
                                isMobile && "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                                (isMobile && isQueueOpen) ? "opacity-0 -translate-y-10 pointer-events-none" : "opacity-100 translate-y-0"
                            )}>
                                {children}
                            </div>

                            {/* Mobile Slide-up Queue Layer */}
                            {isMobile && (
                                <div className={clsx(
                                    "absolute inset-0 bg-white z-20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                                    isQueueOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
                                )}>
                                    <div className="bg-white h-full px-1 flex flex-col overflow-hidden">
                                        <QueueList />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <MobileBottomNav />
            </div>

            {/* Desktop/Mobile Fixed Player Layer (z-[60] above everything) */}
            {mounted && (
                <div className={clsx(
                    "transition-all duration-500 z-[60] overflow-hidden lg:border-l lg:border-gray-200 shrink-0 relative",
                    layoutMode === 'fullscreen'
                        ? "fixed top-0 right-0 w-full h-[100dvh] z-[100] bg-black"
                        : [
                            "max-lg:-order-1 max-lg:w-full",
                            queue.length > 0 ? "max-lg:h-[236px] shadow-xl" : "max-lg:h-0",
                            "lg:fixed lg:top-0 lg:w-[420px] lg:h-[236px] bg-transparent transition-all duration-500",
                            (isQueueOpen && queue.length > 0) ? "lg:right-0" : "lg:-right-[420px]"
                        ]
                )}>
                    <div className={clsx("relative w-full flex flex-col bg-black", layoutMode === 'fullscreen' ? "h-[100dvh]" : "h-full")}>
                        <div id="karaoke-video-container-dashboard" className={clsx("w-full bg-black shrink-0 relative overflow-hidden transition-all", layoutMode === 'fullscreen' ? "h-full" : "aspect-video")}>
                            <SidebarPlayer
                                roomCode={roomCode}
                                onDisconnect={handleDisconnect}
                                onForcePlay={() => {
                                    if (roomCode && realtimeDb) {
                                        const newCmdRef = push(ref(realtimeDb, `rooms/${roomCode}/commands`));
                                        set(newCmdRef, { id: newCmdRef.key, command: { type: 'PLAY', timestamp: Date.now() }, status: 'pending', from: 'dashboard', timestamp: Date.now() });
                                        usePlayerStore.getState().play();
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Right Sidebar */}
            <aside className={clsx(
                "hidden lg:flex w-[420px] shrink-0 border-l border-gray-200 flex-col z-20 transition-all duration-500",
                (isQueueOpen && queue.length > 0 && layoutMode !== 'fullscreen') ? "mr-0 opacity-100" : "-mr-[420px] opacity-0"
            )}>
                <div className="flex-1 pt-[236px] flex flex-col bg-white">
                    <SidebarControls />
                    <div className="flex-1 overflow-hidden flex flex-col"><QueueList /></div>
                </div>
            </aside>

            {/* Modals & Overlays */}
            <ProfileDrawer isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
            <ReceiverInfoModal />
            <ShareRoomModal isOpen={partyModalOpen} onClose={() => setPartyModalOpen(false)} roomCode={roomCode || ''} shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/remote?room=${roomCode}`} />
            <LimitReachedModal />
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
                onJoinRoom={handleJoinRoom}
                onSelectYouTube={() => { }}
            />

            {showQRCode && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowQRCode(false)}>
                    <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200 border border-white/20" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-bold text-gray-900">เชื่อมต่อรีโมท</h3>
                            </div>
                            <button onClick={() => setShowQRCode(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {roomCode ? (
                            <>
                                <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-primary/20 inline-block shadow-sm">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/remote?room=${roomCode}`)}`} className="w-56 h-56 rounded-lg" alt="QR Code" />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-900">สแกนด้วยกล้องมือถือ</p>
                                    <p className="text-[12px] text-gray-500">เพื่อใช้มือถือเลือกเพลงและควบคุมการเล่น</p>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Room Code: {roomCode}</p>
                                </div>
                            </>
                        ) : (
                            <div className="py-12 flex flex-col items-center gap-4">
                                <div className="loading loading-spinner text-primary"></div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">กำลังสร้างห้อง...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
