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
        isReceiverModalOpen, setReceiverModalOpen
    } = useUIStore();

    const [partyModalOpen, setPartyModalOpen] = useState(false);
    const [partyRoomCode, setPartyRoomCode] = useState('');
    const [mounted, setMounted] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [castMode, setCastMode] = useState<CastMode>('none');

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

    const handleRemoteConnected = useCallback(() => {
        if (showQRCode || partyModalOpen) {
            setShowQRCode(false);
            setPartyModalOpen(false);
        }
    }, [showQRCode, partyModalOpen]);

    const isProcessingRemote = useRef(false);
    const dualWindowRef = useRef<Window | null>(null);

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
            "flex h-screen w-full text-text-base overflow-hidden subpixel-antialiased antialiased transition-colors duration-500",
            layoutMode === 'fullscreen' ? "bg-black" : "bg-white"
        )}>
            <Head>
                <meta name="theme-color" content={layoutMode === 'fullscreen' ? '#000000' : '#ef4444'} />
                <title>YouOke - คาราโอเกะออนไลน์</title>
            </Head>

            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 relative bg-white z-10">
                {/* Fixed/Docked Player Container */}
                {mounted && (
                    <div className={clsx(
                        "transition-all duration-500 z-[60] overflow-hidden lg:border-l lg:border-gray-200 shrink-0",
                        layoutMode === 'fullscreen'
                            ? "fixed top-0 right-0 w-full h-[100dvh] z-[100] bg-black"
                            : [
                                "max-lg:w-full",
                                queue.length > 0 ? "max-lg:h-auto" : "max-lg:h-0",
                                "lg:fixed lg:top-0 lg:w-[420px] lg:h-[236px] bg-transparent transition-all duration-500",
                                (isQueueOpen && queue.length > 0) ? "lg:right-0" : "lg:-right-[420px]"
                            ]
                    )}>
                        <div className={clsx("relative w-full flex flex-col bg-white", layoutMode === 'fullscreen' ? "h-[100dvh] bg-black" : "h-full")}>
                            <div className={clsx("w-full bg-black shrink-0 relative overflow-hidden transition-all", layoutMode === 'fullscreen' ? "h-full" : "aspect-video")}>
                                <SidebarPlayer
                                    castMode={castMode}
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

                {/* Main Scroll Area */}
                <main className="flex-1 overflow-y-auto relative flex flex-col bg-gray-50/20">
                    <div className="w-full pb-20">
                        {/* 🏝️ STICKY GLASS HEADERS */}

                        {/* Desktop Header */}
                        <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-gray-100/50 bg-[#f4f4f5]/95 backdrop-blur-xl sticky top-0 z-30">
                            <div className="flex-1 max-w-2xl relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                <DebounceInput
                                    minLength={2} debounceTimeout={300} placeholder="ค้นหาเพลง, ศิลปิน..."
                                    className="w-full pl-14 pr-12 h-12 bg-gray-100/30 hover:bg-white focus:bg-white border border-gray-100/50 rounded-2xl focus:outline-none transition-all shadow-sm font-medium"
                                    value={searchTerm} onChange={(e) => router.replace({ pathname: '/', query: { ...router.query, search: e.target.value } }, undefined, { shallow: true })}
                                />
                            </div>
                            <div className="flex items-center gap-6 ml-6">
                                <div className="relative flex items-center bg-gray-50/50 rounded-2xl p-1 h-11 w-[180px] border border-gray-100/50">
                                    <div className={clsx("absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all", isKaraoke ? "left-[calc(50%+2px)]" : "left-1")} />
                                    <button onClick={() => setIsKaraoke(false)} className={clsx("relative flex-1 text-[11px] font-black uppercase z-10", !isKaraoke ? "text-primary" : "text-black/40")}>เพลง</button>
                                    <button onClick={() => setIsKaraoke(true)} className={clsx("relative flex-1 text-[11px] font-black uppercase z-10", isKaraoke ? "text-primary" : "text-black/40")}>คาราโอเกะ</button>
                                </div>
                                <button onClick={() => setShowQRCode(true)} className="h-11 w-11 rounded-2xl flex items-center justify-center bg-gray-50/50 hover:bg-white border border-gray-100/50"><Smartphone className="w-5 h-5" /></button>
                            </div>
                        </header>

                        {/* Mobile Header/Controls */}
                        {layoutMode !== 'fullscreen' && (
                            <div className="lg:hidden flex flex-col pb-2.5 bg-[#f4f4f5]/95 backdrop-blur-xl border-b border-gray-100/50 shadow-sm sticky top-0 z-30">
                                <SidebarControls castMode={castMode} />
                                <div className="px-3 pt-2.5 flex gap-2.5">
                                    <div className="flex-1 relative flex items-center bg-black/[0.04] border border-gray-100 rounded-2xl px-4 h-11 transition-all focus-within:bg-white shadow-inner">
                                        <Search className="h-4.5 w-4.5 text-gray-400" />
                                        <DebounceInput minLength={2} debounceTimeout={300} placeholder="ค้นหาเพลง..." className="w-full bg-transparent pl-3 text-[15px] font-bold focus:outline-none" value={searchTerm} onChange={(e) => router.replace({ pathname: '/', query: { ...router.query, search: e.target.value } }, undefined, { shallow: true })} />
                                    </div>
                                    <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shrink-0 h-11 items-center">
                                        <button onClick={() => setIsKaraoke(false)} className={clsx("w-9 h-9 flex items-center justify-center rounded-xl", !isKaraoke ? "bg-white text-primary shadow-sm" : "text-gray-400")}><Music size={16} /></button>
                                        <button onClick={() => setIsKaraoke(true)} className={clsx("w-9 h-9 flex items-center justify-center rounded-xl", isKaraoke ? "bg-white text-primary shadow-sm" : "text-gray-400")}><Mic size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Page Content */}
                        <div className="px-0">
                            {isMobile && isQueueOpen ? <div className="bg-white min-h-screen px-4"><QueueList /></div> : children}
                        </div>
                    </div>
                </main>

                <MobileBottomNav />
            </div>

            {/* Desktop Right Sidebar */}
            <aside className={clsx(
                "hidden lg:flex w-[420px] border-l border-gray-200 flex-col z-20 transition-all duration-500",
                (isQueueOpen && queue.length > 0 && layoutMode !== 'fullscreen') ? "mr-0 opacity-100" : "-mr-[420px] opacity-0"
            )}>
                <div className="flex-1 pt-[236px] flex flex-col bg-white">
                    <SidebarControls castMode={castMode} />
                    <div className="flex-1 overflow-hidden flex flex-col"><QueueList /></div>
                </div>
            </aside>

            {/* Modals & Overlays */}
            <ProfileDrawer isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
            <ReceiverInfoModal />
            <ShareRoomModal isOpen={partyModalOpen} onClose={() => setPartyModalOpen(false)} roomCode={roomCode || ''} />
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

            {showQRCode && roomCode && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQRCode(false)}>
                    <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center text-gray-900"><h3 className="font-bold">เชื่อมต่อรีโมท</h3><X onClick={() => setShowQRCode(false)} className="w-5 h-5 cursor-pointer" /></div>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/remote?room=${roomCode}`)}`} className="w-48 h-48 mx-auto" />
                        <p className="text-xs text-gray-500">สแกนเพื่อควบคุม (PIN: {roomCode})</p>
                    </div>
                </div>
            )}
        </div>
    );
}
