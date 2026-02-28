import React, { useEffect, useState, useMemo, useRef, memo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { SidebarPlayer } from '../modules/player/components/SidebarPlayer';
import { QRCodeSVG } from 'qrcode.react';
import {
  MusicalNoteIcon,
  UserIcon,
  ListBulletIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import { TvIcon } from '@heroicons/react/24/solid';
import { useShallow } from 'zustand/react/shallow';
import clsx from 'clsx';

const MemoSiderbarPlayer = memo(SidebarPlayer);

export default function MonitorPage() {
  const router = useRouter();

  // 1. Local State
  const [roomCode, setRoomCode] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showInfoToast, setShowInfoToast] = useState(false);
  const [time, setTime] = useState(new Date());
  const [addedToastItem, setAddedToastItem] = useState<{ title: string, addedBy: any } | null>(null);

  // 2. Player Store Hooks
  const { queue, currentVideo, currentSource, isQueueVisible, fullscreenTrigger, isQrVisible } = usePlayerStore(
    useShallow((state) => ({
      queue: state.queue,
      currentVideo: state.currentVideo,
      currentSource: state.currentSource,
      isQueueVisible: state.isQueueVisible,
      fullscreenTrigger: state.fullscreenTrigger,
      isQrVisible: state.isQrVisible,
    }))
  );
  const setQrVisibility = usePlayerStore(state => state.setQrVisibility);

  const prevQueueLength = useRef(0);

  // 3. Initialization & Room Setup
  useEffect(() => {
    if (!router.isReady) return;

    // 🧹 ALWAYS Reset Store on Monitor Mount to prevent "stale" values (remembers old songs)
    usePlayerStore.setState({
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      currentSource: null,
      currentVideo: null,
      queue: []
    });

    const roomFromQuery = router.query.room as string;

    // Room Code Logic: Query -> New (No session fallback for a fresh experience)
    let localCode = roomFromQuery || '';

    if (!localCode) {
      localCode = Math.floor(1000 + Math.random() * 9000).toString();
    }

    setRoomCode(localCode);
    // Still update session storage for the current tab's consistency if needed by other components, 
    // but the logic above ensures we start fresh if no room is in query.
    if (typeof window !== 'undefined') sessionStorage.setItem('youoke_room_code', localCode);

    // Init Cast Receiver
    const initCast = async () => {
      const { castService } = await import('../plugins/cast/services/CastService');
      console.log('🖥️ Monitor: Initializing Receiver Mode (Room:', localCode, ')');
      await castService.initialize(localCode, 'monitor');
    };
    initCast();

    // Give store time to propagate clear before allowing render
    setMounted(true);

    const clockTimer = setInterval(() => setTime(new Date()), 60000);
    return () => {
      import('../plugins/cast/services/CastService').then(({ castService }) => castService.cleanup());
      clearInterval(clockTimer);
    };
  }, [router.isReady, router.query.room]);

  // 4. Wake Lock (Prevent Sleep)
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (err) { }
    };
    requestWakeLock();
    return () => wakeLock?.release();
  }, []);

  // 5. Fullscreen Logic
  useEffect(() => {
    if (fullscreenTrigger > 0) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
      } else {
        document.exitFullscreen().catch(() => { });
      }
    }
  }, [fullscreenTrigger]);

  // 6. Toast & Feed logic
  useEffect(() => {
    if (queue.length > 0 && queue.length > prevQueueLength.current) {
      const latestItem = queue[queue.length - 1];
      if (latestItem) {
        setAddedToastItem({ title: latestItem.title || "Unknown Song", addedBy: latestItem.addedBy });
        setTimeout(() => setAddedToastItem(null), 5000);
      }
    }
    prevQueueLength.current = queue.length;

    if (currentVideo && currentVideo.videoId) {
      setShowInfoToast(true);
      const timer = setTimeout(() => setShowInfoToast(false), 6000); // 6 Seconds for monitor
      return () => clearTimeout(timer);
    }
  }, [currentVideo?.videoId, queue.length]);

  // QR Auto-hide
  useEffect(() => {
    if (isQrVisible) {
      const timer = setTimeout(() => setQrVisibility(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [isQrVisible]);

  // 7. Interaction Handler
  const handleInteraction = () => {
    setHasInteracted(true);
    console.log('🔘 Monitor: User interacted, priming audio');

    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        audioCtx.resume();
      }
    } catch (e) { }

    // Force play via castService signal or adapter
    if (currentSource) {
      import('../modules/player/services/playerService').then(({ playerService }) => {
        const adapter = playerService.getAdapter();
        if (adapter) adapter.play();
      });
    }
  };

  const getAddedByName = (video: any) => {
    if (!video || !video.addedBy) return null;
    return (video.addedBy as any).name || video.addedBy.displayName || 'Guest';
  };

  const isIdle = !currentSource && queue.length === 0;
  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/remote?room=${roomCode}` : '';

  if (!mounted || !roomCode) return <div className="bg-black h-screen w-screen" />;

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative font-sans text-white selection:bg-white selection:text-black">
      <Head>
        <title>YouOke Monitor ({roomCode})</title>
      </Head>

      {/* 1. Fullscreen Player Layer */}
      <div className={clsx(
        "absolute inset-0 z-0 transition-all duration-1000",
        isIdle ? "opacity-0 scale-105 blur-2xl" : "opacity-100 scale-100 blur-0"
      )}>
        <div className="w-full h-full relative">
          <MemoSiderbarPlayer
            isPassive={true}
            onPlayerInit={() => setIsPlayerReady(true)}
            onEnded={() => {
              console.log('🎬 Monitor: Media ended, signaling NEXT');
              import('../plugins/cast/services/CastService').then(({ castService }) => {
                castService.sendCommand({ type: 'NEXT' });
              });
            }}
          />
          {/* Gradients */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* 2. Interaction Layer (Shown only when media is active but not yet confirmed) */}
      {!hasInteracted && !isIdle && (
        <div
          className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in"
          onClick={handleInteraction}
        >
          <div className="bg-zinc-900 border border-white/10 p-12 rounded-[3.5rem] text-center space-y-8 shadow-2xl max-w-md transform active:scale-95 transition-transform">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <TvIcon className="w-14 h-14 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2">เข้าสู่ระบบรับภาพ</h2>
              <p className="text-lg text-white/50">กรุณากดปุ่มเพื่อเริ่มรับชมภาพและเสียงจากหน้าจอหลัก</p>
            </div>
            <div className="btn btn-primary btn-lg rounded-2xl w-full select-none">เริ่มการทำงาน (OK)</div>
          </div>
        </div>
      )}

      {/* 2. Idle Layer (Restored Original Monitor UI) */}
      <div className={clsx(
        "absolute inset-0 z-10 transition-all duration-1000 bg-[#0a0a0a]",
        !isIdle && "opacity-0 pointer-events-none scale-110"
      )}>
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-12">
          <div className="mb-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
              <TvIcon className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Wireless <span className="text-primary">Monitor</span></h1>
            <p className="text-white/40 font-medium leading-relaxed">พร้อมรับภาพและเสียงจากหน้าจอหลักของคุณ</p>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 shadow-2xl flex flex-col items-center gap-8 group hover:border-primary/30 transition-all duration-500">
            <div className="flex flex-col items-center">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mb-4 bg-white/5 px-4 py-1.5 rounded-full">ยืนยันรหัสเชื่อมต่อ</span>
              <div className="text-[12rem] font-black leading-none tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.1)] group-hover:text-primary transition-colors duration-500">
                {roomCode}
              </div>
            </div>

            <div className="max-w-xs space-y-4 pt-8 border-t border-white/5">
              {!hasInteracted ? (
                <button
                  onClick={handleInteraction}
                  className="btn btn-primary btn-lg rounded-2xl w-full text-lg shadow-xl shadow-primary/20 transform hover:scale-105 active:scale-95 space-y-0"
                >
                  เริ่มรับภาพและเสียง (START)
                </button>
              ) : (
                <p className="text-sm text-white/60 leading-relaxed animate-pulse">
                  เปิด Dashboard บนคอมพิวเตอร์ <br />เลือก <span className="text-white font-bold">"Wireless Cast"</span> และกรอกรหัสนี้
                </p>
              )}
            </div>
          </div>

          <div className="mt-16 text-white/20 text-[10px] uppercase font-black tracking-[0.5em] flex items-center gap-4">
            <span className="w-12 h-px bg-white/10"></span>
            {hasInteracted ? 'waiting for connection' : 'ready to start'}
            <span className="w-12 h-px bg-white/10"></span>
          </div>
        </div>
      </div>

      {/* 3. Overlays & Toasts */}

      {/* Toast: Now Playing */}
      <div className={clsx(
        "absolute bottom-12 left-12 z-30 transform transition-all duration-700",
        (showInfoToast && !isIdle && !isQueueVisible) ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      )}>
        {!isIdle && currentVideo && (
          <div className="flex items-end gap-6 bg-black/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-5 duration-700">
            <div className="w-24 h-24 rounded-2xl shadow-xl overflow-hidden border border-white/10 shrink-0 relative bg-zinc-900">
              {/* 💿 THUMBNAIL FALLBACK LOGIC */}
              {(() => {
                const thumb = currentVideo.thumbnail || (currentVideo.videoId ? `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg` : "/icon-cover.png");
                return <Image unoptimized src={thumb} fill className="object-cover" alt="Art" />;
              })()}
            </div>
            <div className="pb-2 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary px-2 py-0.5 rounded text-[10px] font-black uppercase text-white">กำลังเล่น</span>
                {currentVideo.addedBy && (
                  <span className="text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full">เพิ่มโดย {getAddedByName(currentVideo)}</span>
                )}
              </div>
              <h2 className="text-3xl font-black text-white truncate max-w-md">{currentVideo.title}</h2>
              <p className="text-lg text-white/60 font-medium">{currentVideo.author}</p>
            </div>
          </div>
        )}
      </div>

      {/* Toast: Added to Queue */}
      <div className={clsx(
        "absolute top-12 right-12 z-50 transform transition-all duration-500",
        addedToastItem ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      )}>
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-4 rounded-3xl shadow-2xl flex items-center gap-4 max-w-sm">
          <div className="bg-green-500 rounded-full p-2 text-white shadow-lg shadow-green-500/30"><ListBulletIcon className="w-6 h-6" /></div>
          <div className="min-w-0">
            <h4 className="font-bold text-white truncate text-base">{addedToastItem?.title}</h4>
            <p className="text-white/50 text-xs">เพิ่มลงคิวแล้ว</p>
          </div>
        </div>
      </div>

      {/* Queue Drawer */}
      <div className={clsx(
        "absolute top-0 right-0 bottom-0 w-[400px] bg-black/40 backdrop-blur-3xl z-40 border-l border-white/10 shadow-2xl transform transition-transform duration-500",
        isQueueVisible ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-black text-2xl text-white tracking-tight flex items-center gap-3">
            <ListBulletIcon className="w-6 h-6 text-primary" /> คิวเพลง
          </h3>
          <div className="text-right">
            <p className="text-2xl font-black">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-[8px] text-white/40 uppercase font-black tracking-widest">PIN {roomCode}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {queue.slice(1).map((v, i) => (
            <div key={v.uuid || i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-lg font-black text-white/20 w-6">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white truncate text-sm">{v.title}</h4>
                <p className="text-xs text-white/40 truncate">{v.author}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6">
          <div className="bg-primary/10 p-4 rounded-3xl border border-primary/20 flex gap-4 items-center">
            <div className="bg-white p-2 rounded-xl"><QRCodeSVG value={qrUrl} size={60} /></div>
            <div><p className="text-[10px] font-black text-primary uppercase mb-1">สแกนเพื่อขอเพลง</p><p className="text-white/60 text-xs">ใช้มือถือเป็นรีโมท</p></div>
          </div>
        </div>
      </div>

      {/* Global QR (Remote Switch) */}
      <div className={clsx(
        "absolute inset-0 z-[60] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center transition-all duration-500",
        isQrVisible ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      )}>
        <div className="relative group text-center space-y-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-[0_0_100px_rgba(255,255,255,0.1)] transform rotate-1 group-hover:rotate-0 transition-transform">
            <QRCodeSVG value={qrUrl} size={300} level="H" />
          </div>
          <div>
            <h2 className="text-5xl font-black tracking-tighter mb-2">สแกนเพื่อเชื่อมต่อ</h2>
            <p className="text-white/40 text-xl">PIN: <span className="text-primary">{roomCode}</span></p>
          </div>
          <button onClick={() => setQrVisibility(false)} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-white/60 font-bold transition-all">ยกเลิก</button>
        </div>
      </div>

      {/* Fullscreen Toggle */}
      <button onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }} className="absolute bottom-6 right-6 z-50 p-3 bg-white/5 rounded-full hover:bg-white/10 opacity-0 hover:opacity-100 transition-opacity">
        <ArrowsPointingOutIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
