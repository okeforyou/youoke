
import React, { useEffect, useState, useMemo, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { SidebarPlayer } from '../modules/player/components/SidebarPlayer';
import { QRCodeSVG } from 'qrcode.react';
import { MusicalNoteIcon, UserIcon, ClockIcon, ListBulletIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { useShallow } from 'zustand/react/shallow';
import clsx from 'clsx';

const MemoSiderbarPlayer = React.memo(SidebarPlayer);
import { TvIcon } from '@heroicons/react/24/solid';
import { ref, onValue, onChildAdded, set } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { DigitalSignage } from '../modules/tv/components/DigitalSignage';
import { useSystemConfig } from '../hooks/useSystemConfig';


export default function MonitorPage() {
  const router = useRouter();
  const { config } = useSystemConfig();
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  const { queue, currentVideo, currentSource, isQueueVisible, fullscreenTrigger, isPlaying } = usePlayerStore(
    useShallow((state) => ({
      queue: state.queue,
      currentVideo: state.currentVideo,
      currentSource: state.currentSource,
      isQueueVisible: state.isQueueVisible,
      fullscreenTrigger: state.fullscreenTrigger,
      isPlaying: state.isPlaying,
    }))
  );

  // const [isQueueVisible, setQueueVisible] = useState(false); // Removed: Use Store State instead
  const [showInfoToast, setShowInfoToast] = useState(false);
  const [time, setTime] = useState(new Date());

  // Prevent sleep on TV
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // Silently fail if not supported
      }
    };
    requestWakeLock();
    return () => wakeLock?.release();
  }, []);

  // Remote Fullscreen Trigger
  useEffect(() => {
    if (fullscreenTrigger > 0) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error("Fullscreen denied by browser (likely lacking user gesture):", err);
          // Fallback: Show a toast asking user to click? Or just accept limitation.
          // For now, simple logging. Kiosk mode or previous interaction usually allows this.
        });
      } else {
        document.exitFullscreen();
      }
    }
  }, [fullscreenTrigger]);

  // State for Toast Data
  const [addedToastItem, setAddedToastItem] = useState<{ title: string, addedBy: any } | null>(null);
  const prevQueueLength = useRef(0);

  // Store for QR Visibility
  const isQrVisible = usePlayerStore(state => state.isQrVisible);
  const setQrVisibility = usePlayerStore(state => state.setQrVisibility);

  // Auto-hide QR after 30 seconds if it pops up
  useEffect(() => {
    if (isQrVisible) {
      const timer = setTimeout(() => setQrVisibility(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [isQrVisible, setQrVisibility]);

  useEffect(() => {
    // Detect Added Item - Get the LAST item in the queue
    if (queue && queue.length > 0 && queue.length > prevQueueLength.current) {
      const latestItem = queue[queue.length - 1];
      if (latestItem) {
        setAddedToastItem({
          title: latestItem.title || "Unknown Song",
          addedBy: latestItem.addedBy
        });
        setTimeout(() => setAddedToastItem(null), 5000);
      }
    }
    prevQueueLength.current = queue.length;

    console.log('📺 Monitor Queue Updated:', queue);
    console.log('📺 Current Video:', currentVideo);
    if (currentVideo) {
      setShowInfoToast(true);
      const timer = setTimeout(() => setShowInfoToast(false), 8000); // 8s info toast then hide
      return () => clearTimeout(timer);
    }
  }, [currentVideo?.videoId, queue.length]);

  useEffect(() => {
    setMounted(true);

    // 🧹 Aggressive Cleanup: Reset local player to prevent "stale" songs
    if (typeof window !== 'undefined') {
      const store = usePlayerStore.getState();
      store.pause();
      usePlayerStore.setState({
        queue: [],
        currentVideo: null,
        currentSource: null,
        currentIndex: 0,
        isPlaying: false,
        currentTime: 0,
        duration: 0
      });
      console.log('🧹 Monitor: Local State Cleared');
    }

    // 1. Get Room Code: ALWAYS check session storage first, then generation (Fresh PIN)
    const roomFromQuery = router.query.room as string;
    const existingCode = sessionStorage.getItem('youoke_room_code');
    const localCode = roomFromQuery || existingCode || Math.floor(1000 + Math.random() * 8999).toString();

    setRoomCode(localCode);
    if (!existingCode || existingCode !== localCode) {
      sessionStorage.setItem('youoke_room_code', localCode);
    }

    // Ensure PIN is always visible by resetting idle state if needed
    // (Actual reset happens via store clearing above)

    // 2. Wireless Sync Initialization (Receiver Model)
    const initCast = async () => {
      const { castService } = await import('../plugins/cast/services/CastService');
      console.log('🖥️ Monitor: Initializing Receiver Mode (Room:', localCode, ')');
      await castService.initialize(localCode, 'monitor');
    };

    if (localCode) initCast();

    const timer = setInterval(() => setTime(new Date()), 60000);

    return () => {
      import('../plugins/cast/services/CastService').then(({ castService }) => castService.cleanup());
      clearInterval(timer);
    };
  }, [router.isReady, router.query.room]);


  const isIdle = !currentSource && queue.length === 0;

  const [hasInteracted, setHasInteracted] = useState(false);

  const handleInteraction = () => {
    setHasInteracted(true);
    // When user clicks, ensure player starts if something is supposed to be playing
    if (isPlaying && currentVideo) {
      console.log('🔘 Monitor: User interacted, allowing playback');
    }
  };

  const getAddedByName = (video: any) => {
    if (!video || !video.addedBy) return null;
    return (video.addedBy as any).name || video.addedBy.displayName || 'Guest';
  }

  const qrUrl = useMemo(() =>
    typeof window !== 'undefined' ? `${window.location.origin}/remote?room=${roomCode}` : '',
    [roomCode]);

  const host = useMemo(() =>
    typeof window !== 'undefined' ? window.location.host : 'play.okeforyou.com',
    []);

  if (!mounted) return <div className="bg-black h-screen w-screen" />;

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative font-sans text-white selection:bg-white selection:text-black">
      <Head>
        <title>YouOke TV {roomCode}</title>
      </Head>

      {/* 1. Fullscreen Player Layer */}
      <div className={clsx(
        "absolute inset-0 z-0 transition-opacity duration-1000",
        isIdle ? "opacity-0" : "opacity-100"
      )}>
        <div className="w-full h-full relative">
          <MemoSiderbarPlayer isPassive={true} />
          {/* Gradient Overlay for Text Readability (Bottom) */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
          {/* Gradient Overlay for Header (Top) */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* 2. Idle Layer (Minimalist Clean UI - Aligned with Dual Mode) */}
      <div className={clsx(
        "absolute inset-0 z-10 transition-all duration-1000 bg-black",
        !isIdle && "opacity-0 pointer-events-none scale-110"
      )}>
        <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            {/* Animated TV/Monitor Icon */}
            <div className="relative inline-block mb-8">
              <div className="text-7xl mb-4 relative z-10">🖥️</div>
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse z-0" />
            </div>

            <h1 className="text-4xl font-black text-white tracking-tight mb-4">หน้าจอ TV (Wireless Cast)</h1>
            <p className="text-gray-400 text-lg mb-10 font-medium">รอเพลงจากหน้าจอหลัก...</p>

            <div className="inline-flex flex-col items-center gap-6 p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">รหัสเชื่อมต่อ</span>
                <div className="text-8xl font-black leading-none tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  {roomCode}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 w-full">
                <div className="flex items-center justify-center gap-3 text-sm font-bold text-primary/80">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                  <span>พร้อมเชื่อมต่อ</span>
                </div>
              </div>
            </div>

            <div className="mt-16 flex flex-col items-center gap-2 opacity-30">
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">youoke service monitor</p>
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>


      {/* 3. Info Toast (Now Playing) */}
      <div className={clsx(
        "absolute bottom-12 left-12 z-30 max-w-2xl transform transition-all duration-700 ease-out",
        (showInfoToast && !isIdle && !isQueueVisible) ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      )}>
        {!isIdle && currentVideo && (
          <div className="flex items-end gap-6">
            {/* Large Artwork */}
            <div className="w-32 h-32 rounded-lg shadow-2xl overflow-hidden border border-white/20 relative hidden sm:block">
              <Image
                unoptimized
                src={currentVideo.thumbnail || (currentVideo.videoId ? `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg` : "/icon-cover.png")}
                fill
                className="object-cover"
                alt="Album Art"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/icon-cover.png";
                }}
              />
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white">กำลังเล่น</span>
                {currentVideo.addedBy && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-white/80 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                    <UserIcon className="w-3 h-3 text-primary" /> เพิ่มโดย {getAddedByName(currentVideo)}
                  </span>
                )}
              </div>
              <h2 className="text-4xl font-bold text-white leading-tight drop-shadow-md line-clamp-2">{currentVideo.title || "Unknown Song"}</h2>
              <p className="text-xl text-white/70 mt-1 font-medium">{currentVideo.author || "Unknown"}</p>
            </div>
          </div>
        )}
      </div>

      {/* ADDED TO QUEUE TOAST (Dynamic Content) */}
      <div className={clsx(
        "absolute top-12 right-12 z-50 transform transition-all duration-500 ease-out",
        addedToastItem ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      )}>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md">
          <div className="bg-green-500 rounded-full p-2 text-white shadow-lg shadow-green-500/30 shrink-0">
            <ListBulletIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-bold text-lg leading-tight truncate">
              {addedToastItem?.title || 'เพิ่มเพลงใหม่แล้ว'}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-white/60 text-sm">ต่อคิวแล้วครับ</p>
              {addedToastItem?.addedBy && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/80 truncate max-w-[100px]">
                  โดย {(addedToastItem.addedBy as any).name || addedToastItem.addedBy.displayName || 'Guest'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Queue Overlay (Right Side Drawer) */}
      <div className={clsx(
        "absolute top-0 right-0 bottom-0 w-[420px] bg-black/40 backdrop-blur-3xl z-40 border-l border-white/10 shadow-2xl transform transition-transform duration-500 will-change-transform flex flex-col",
        isQueueVisible ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-2xl text-white tracking-wide flex items-center gap-3">
            <ListBulletIcon className="w-6 h-6 text-primary" />
            คิวเพลงถัดไป
          </h3>
          <div className="text-right">
            <p className="text-3xl font-mono font-bold">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-xs text-white/40 uppercase tracking-widest">ห้อง {roomCode}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {queue.length <= 1 ? (
            <div className="h-1/2 flex flex-col items-center justify-center text-white/30 space-y-4">
              <MusicalNoteIcon className="w-16 h-16 opacity-50" />
              <p className="text-lg">ยังไม่มีคิวเพลง</p>
            </div>
          ) : (
            queue.slice(1).map((video, idx) => (
              <div key={video.uuid || idx} className="group flex gap-4 p-4 rounded-xl bg-black/40 border border-white/5 hover:bg-white/5 transition-colors items-center">
                <span className="text-xl font-bold text-white/30 w-8 text-center">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white line-clamp-2 leading-snug">{video.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-xs text-white/60 truncate max-w-[140px]">{video.author}</p>
                    {video.addedBy && (
                      <span className="text-[10px] text-white/50 border border-white/10 px-1.5 py-0.5 rounded bg-black/30">
                        {getAddedByName(video)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gradient-to-t from-black/50 to-transparent">
          <div className="bg-primary/20 p-4 rounded-2xl border border-primary/20 flex gap-4 items-center">
            <div className="bg-white p-1 rounded-lg shrink-0">
              {roomCode && <QRCodeSVG value={qrUrl} size={48} />}
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">เพิ่มเพลง</p>
              <p className="text-white/80 text-sm">สแกนเพื่อขอเพลง</p>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Global QR Code Overlay (Synced from Remote) */}
      <div className={clsx(
        "absolute inset-0 z-[60] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-500",
        (isQrVisible || (isIdle && !mounted)) ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="bg-white p-6 rounded-[48px] shadow-2xl scale-125 mb-8 animate-in zoom-in spin-in-1 duration-500">
          {roomCode && qrUrl && <QRCodeSVG value={qrUrl} size={320} level="H" />}
        </div>
        <p className="text-4xl text-white font-bold tracking-[0.2em] mb-2">{roomCode}</p>
        <p className="text-white/60 text-xl">สแกนเพื่อเริ่มใช้งาน Party Mode</p>
      </div>

      {/* 5. Room Code Watermark (Top Right - Always Visible but subtle) */}
      {!isQueueVisible && !isIdle && (
        <div className="absolute top-8 right-8 z-30 flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Room</p>
            <p className="text-2xl font-mono font-bold text-white tracking-widest drop-shadow-md">{roomCode}</p>
          </div>
          <div className="bg-white/90 p-1.5 rounded-lg shadow-lg">
            <QRCodeSVG value={qrUrl} size={40} />
          </div>
        </div>
      )}

      {/* Autoplay Interaction Overlay */}
      {!hasInteracted && !isIdle && (
        <div
          onClick={handleInteraction}
          className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-500"
        >
          <div className="bg-primary/20 border border-primary/50 text-white p-12 rounded-[3rem] text-center space-y-6 shadow-2xl max-w-lg mx-6 transform transition-all hover:scale-105 active:scale-95">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)]">
              <TvIcon className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight">ระบบพร้อมทำงาน</h2>
              <p className="text-xl text-white/60 leading-relaxed">
                กรุณากด <span className="font-bold text-primary px-3 py-1 bg-white/10 rounded-xl">เริ่มการเชื่อมต่อ</span> <br />
                หรือคลิกที่หน้าจอเพื่อรับชมวิดีโอ
              </p>
            </div>
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all">
                <span>ตกลง (OK)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. PC Fullscreen Toggle (Hidden on TV usually, useful for PC browser) */}
      <button
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }}
        className="absolute bottom-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity"
        title="Toggle Fullscreen"
      >
        <ArrowsPointingOutIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
