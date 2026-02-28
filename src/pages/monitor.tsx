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
  const { queue, currentVideo, currentSource, isQueueVisible, fullscreenTrigger, isQrVisible, currentIndex } = usePlayerStore(
    useShallow((state) => ({
      queue: state.queue,
      currentVideo: state.currentVideo,
      currentSource: state.currentSource,
      isQueueVisible: state.isQueueVisible,
      fullscreenTrigger: state.fullscreenTrigger,
      isQrVisible: state.isQrVisible,
      currentIndex: state.currentIndex,
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
        </div>
      </div>

      {/* 2. Interaction Layer (Shown only when media is active but not yet confirmed) */}
      {!hasInteracted && !isIdle && (
        <div
          className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in"
          onClick={handleInteraction}
        >
          <div className="bg-zinc-900 border border-white/10 p-12 rounded-[2.5rem] text-center space-y-8 shadow-2xl max-w-md transform active:scale-95 transition-transform">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <TvIcon className="w-14 h-14 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2">เข้าสู่ระบบรับภาพ</h2>
              <p className="text-lg text-white/50">กรุณากดปุ่มเพื่อเริ่มรับชมภาพและเสียงจากหน้าจอหลัก</p>
            </div>
            <div className="btn btn-primary btn-lg rounded-full w-full select-none font-black uppercase tracking-widest">เริ่มการทำงาน (OK)</div>
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

      {/* 4. DESIGN PORT: Permanent Sidebar from /dual */}
      {!isIdle && hasInteracted && (
        <>
          {/* Sidebar Area (Ported from dual.tsx) */}
          <div className={clsx(
            "absolute top-0 right-0 h-full w-80 lg:w-96 z-40 bg-gradient-to-l from-black/90 via-black/80 to-transparent backdrop-blur-md p-8 overflow-y-auto transition-all duration-700",
            (isQueueVisible || showInfoToast) ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
          )}>
            <div className="space-y-8">
              {/* Header with Clock */}
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter">YouOke <span className="text-primary">TV</span></h3>
                  <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">Room {roomCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-white/40 font-bold uppercase">Live</span>
                  </div>
                </div>
              </div>

              {/* Now Playing (Dual Style) */}
              {currentVideo && (
                <div className="animate-in slide-in-from-right-4 duration-700">
                  <p className="text-xs text-white/40 mb-3 uppercase font-black tracking-widest">กำลังเล่น</p>
                  <div className="bg-primary/20 border border-primary/30 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-3xl font-black text-white leading-tight mb-4 line-clamp-2">{currentVideo.title}</h2>
                    {currentVideo.author && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                        <p className="text-xl text-white/60 font-medium truncate">{currentVideo.author}</p>
                      </div>
                    )}
                    {currentVideo.addedBy && (
                      <p className="mt-6 text-[11px] text-white/30 uppercase font-black tracking-widest border-t border-white/5 pt-4">
                        Added by {getAddedByName(currentVideo)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Next in Queue (Dual Style) */}
              {queue.length > currentIndex + 1 && (
                <div className="animate-in slide-in-from-right-4 duration-700 delay-200">
                  <p className="text-xs text-white/40 mb-4 uppercase font-black tracking-widest flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MusicalNoteIcon className="w-4 h-4 text-primary" />
                      คิวถัดไป
                    </span>
                    <span className="bg-white/5 px-2 py-0.5 rounded-md text-[10px]">{queue.length - currentIndex - 1}</span>
                  </p>
                  <div className="space-y-3">
                    {queue.slice(currentIndex + 1, currentIndex + 10).map((video, index) => (
                      <div key={video.uuid || index} className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all border border-white/5">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-primary font-black text-xs">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-lg text-white/90 line-clamp-2 mb-1 group-hover:text-white transition-colors">
                              {video.title}
                            </p>
                            {video.author && <p className="text-sm text-white/40 truncate">{video.author}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remote Connect QR (Subtle) */}
              <div className="pt-8 mt-8 border-t border-white/5">
                <div className="bg-white/5 rounded-3xl p-4 flex items-center gap-4">
                  <div className="bg-white p-1.5 rounded-xl shrink-0"><QRCodeSVG value={qrUrl} size={60} /></div>
                  <div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Scan to Remote</p>
                    <p className="text-primary font-black text-sm">{roomCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 5. QR Overlay (Request Remote) */}
      <div className={clsx(
        "absolute inset-0 z-[60] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center transition-all duration-500",
        isQrVisible ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      )}>
        <div className="relative group text-center space-y-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-[0_0_100px_rgba(255,255,255,0.1)] transform rotate-1 group-hover:rotate-0 transition-transform">
            <QRCodeSVG value={qrUrl} size={300} level="H" />
          </div>
          <div>
            <h2 className="text-5xl font-black tracking-tighter mb-2 text-white">สแกนเพื่อเชื่อมต่อ</h2>
            <p className="text-white/40 text-xl font-medium">Remote PIN: <span className="text-red-500 font-black">{roomCode}</span></p>
          </div>
          <button onClick={() => setQrVisibility(false)} className="px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95">ยกเลิก</button>
        </div>
      </div>

      {/* Fullscreen Toggle (Improved Visibility) */}
      <button
        onClick={() => {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen();
          else document.exitFullscreen();
        }}
        className="absolute bottom-8 right-8 z-50 p-4 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 border border-white/10 transition-all opacity-40 hover:opacity-100 active:scale-95"
        title="Fullscreen"
      >
        <ArrowsPointingOutIcon className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
