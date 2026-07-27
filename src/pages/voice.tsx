import React, { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import YouTube from 'react-youtube';
import clsx from 'clsx';
import { Search, X, Mic, Music, Mic2, Smartphone, Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, ChevronUp, Maximize, ListMusic, Trash2, Menu, SlidersHorizontal } from 'lucide-react';
import { Sidebar } from '../components/navigation/Sidebar';
import Modal, { ModalHandler } from '../components/Modal';
import { DebounceInput } from 'react-debounce-input';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { HomePageContent } from '../components/home/HomePageContent';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';

const fetchWithFallback = async (endpoint: string, options?: RequestInit) => {
    let res5050;
    try {
        res5050 = await fetch(`http://127.0.0.1:5050${endpoint}`, options);
        if (res5050.ok) return res5050;
    } catch (e) {}

    let res8055;
    try {
        res8055 = await fetch(`http://127.0.0.1:8055${endpoint}`, options);
        if (res8055.ok) return res8055;
    } catch (e) {}

    if (res5050) return res5050;
    if (res8055) return res8055;
    throw new Error("AI Server is unreachable.");
};

interface QueueItem {
  id: string;
  title: string;
  thumbnail: string;
  status: 'pending' | 'processing' | 'ready' | 'playing' | 'error';
  percent?: number;
  message?: string;
}

interface SearchResult {
  id: string;
  title: string;
  thumbnails: any[];
  channel: any;
  duration: string;
  viewCount: { short: string };
}

export default function PocKaraoke() {
  const { user, signInWithGoogle } = useAuthStore();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  
  const handleAddToLocalQueue = (video: any) => {
    const vid = video.videoId || video.id;
    if (!vid) return;
    
    setQueue(prev => {
      // If already in queue, ignore
      if (prev.some(item => item.id === vid)) return prev;
      
      return [...prev, {
        id: vid,
        title: video.title,
        thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
        status: 'pending',
        percent: 0,
        message: 'รอดำเนินการ...'
      }];
    });
  };

  const [currentVideoId, setCurrentVideoId] = useState('');
  const [readyAudioId, setReadyAudioId] = useState('');

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volumes, setVolumes] = useState({ vocals: 100, instrumental: 100 });
  const [trackStates, setTrackStates] = useState({
    vocals: { muted: false, solo: false },
    instrumental: { muted: false, solo: false }
  });
  const [isMuted, setIsMuted] = useState(false);

  const [showVocalMixer, setShowVocalMixer] = useState(false);
  const mixerRef = useRef<HTMLDivElement>(null);
  const vocalBtnRef = useRef<HTMLButtonElement>(null);

  const instrumentalRef = useRef<HTMLAudioElement | null>(null);
  const vocalRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  const [instLoaded, setInstLoaded] = useState(false);
  const [vocLoaded, setVocLoaded] = useState(false);

  // Click outside to close mixer popover
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
          if (mixerRef.current && !mixerRef.current.contains(event.target as Node) && vocalBtnRef.current && !vocalBtnRef.current.contains(event.target as Node)) {
              setShowVocalMixer(false);
          }
      };
      if (showVocalMixer) {
          document.addEventListener("mousedown", handleClickOutside);
          document.addEventListener("touchstart", handleClickOutside);
      }
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
          document.removeEventListener("touchstart", handleClickOutside);
      };
  }, [showVocalMixer]);

  const handleLaunchPlugin = () => {
    window.location.href = "youoke://open";
  };

  const handleDownloadPlugin = () => {
    setShowInstallGuide(true);
    if (downloadOS === 'mac') {
        window.open('https://github.com/okeforyou/youoke-ai-plugin/releases/download/v1.0.0/YouOke-Plugin-Mac.dmg', '_blank');
    } else {
        window.open('https://github.com/okeforyou/youoke-ai-plugin/releases/download/v1.0.0/YouOke-Plugin-Windows.exe', '_blank');
    }
  };

  // Auto next logic when song ends
  useEffect(() => {
    const instAudio = instrumentalRef.current;
    if (instAudio) {
      const updateProgress = () => {
        if (instAudio.duration && !isDragging) {
          setProgress((instAudio.currentTime / instAudio.duration) * 100);
        }
      };
      instAudio.addEventListener('timeupdate', updateProgress);
      return () => instAudio.removeEventListener('timeupdate', updateProgress);
    }
  }, [currentVideoId, isDragging]);

  const handleVolumeChange = (type: 'vocals' | 'instrumental', value: number) => {
    try {
      const safeValue = Number(value) || 0;
      setVolumes(prev => ({ ...prev, [type]: safeValue }));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMute = (type: 'vocals' | 'instrumental') => {
    setTrackStates(prev => ({ ...prev, [type]: { ...prev[type], muted: !prev[type].muted } }));
  };

  const toggleSolo = (type: 'vocals' | 'instrumental') => {
    setTrackStates(prev => {
      const newSolo = !prev[type].solo;
      return { 
        vocals: { ...prev.vocals, solo: type === 'vocals' ? newSolo : false },
        instrumental: { ...prev.instrumental, solo: type === 'instrumental' ? newSolo : false }
      };
    });
  };

  const getEffectiveVolume = useCallback((type: 'vocals' | 'instrumental') => {
    if (isMuted) return 0;
    const isAnySolo = trackStates.vocals.solo || trackStates.instrumental.solo;
    if (isAnySolo && !trackStates[type].solo) return 0;
    if (trackStates[type].muted) return 0;
    return volumes[type];
  }, [trackStates, volumes, isMuted]);

  // Resilient Volume Sync
  useEffect(() => {
    if (vocalRef.current) vocalRef.current.volume = getEffectiveVolume('vocals') / 100;
    if (instrumentalRef.current) instrumentalRef.current.volume = getEffectiveVolume('instrumental') / 100;
  }, [getEffectiveVolume]);

  // Sync Interval (Slave to YT Time to avoid drift)
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        if (!ytPlayerRef.current || !instrumentalRef.current || !vocalRef.current) return;
        const state = ytPlayerRef.current.getPlayerState();
        if (state !== 1) return; // Only sync if actually playing
        
        const ytTime = ytPlayerRef.current.getCurrentTime();
        if (typeof ytTime !== 'number' || (ytTime === 0 && duration > 0)) return; // Prevent bad sync at 0
        
        if (Math.abs(instrumentalRef.current.currentTime - ytTime) > 0.3) {
          instrumentalRef.current.currentTime = ytTime;
        }
        if (Math.abs(vocalRef.current.currentTime - ytTime) > 0.3) {
          vocalRef.current.currentTime = ytTime;
        }
        if (instrumentalRef.current.paused) instrumentalRef.current.play().catch(e=>console.error(e));
        if (vocalRef.current.paused) vocalRef.current.play().catch(e=>console.error(e));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Ultimate Sync
  useEffect(() => {
    if (!vocalRef.current || !instrumentalRef.current || !ytPlayerRef.current) return;
    if (isPlaying) {
      const ytTime = ytPlayerRef.current.getCurrentTime();
      if (typeof ytTime === 'number' && ytTime > 0) {
        if (Math.abs(vocalRef.current.currentTime - ytTime) > 0.3) vocalRef.current.currentTime = ytTime;
        if (Math.abs(instrumentalRef.current.currentTime - ytTime) > 0.3) instrumentalRef.current.currentTime = ytTime;
      }
      vocalRef.current.play().catch(e=>console.error(e));
      instrumentalRef.current.play().catch(e=>console.error(e));
    } else {
      vocalRef.current.pause();
      instrumentalRef.current.pause();
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (!isLoaded || !ytPlayerRef.current) return;
    const state = ytPlayerRef.current.getPlayerState();
    if (state === 1 || state === 3) { // Playing or Buffering
      ytPlayerRef.current.pauseVideo();
    } else {
      ytPlayerRef.current.playVideo();
    }
  };

  const handleSeekChange = (e: any) => setProgress(parseFloat(e.target.value) || 0);
  const handleSeekEnd = (e: any) => {
    setIsDragging(false);
    const val = parseFloat(e.currentTarget.value) || 0;
    const time = (val / 100) * (Number(duration) || 0);
    if (ytPlayerRef.current) ytPlayerRef.current.seekTo(time, true);
    if (vocalRef.current && vocalRef.current.readyState >= 1) vocalRef.current.currentTime = time;
    if (instrumentalRef.current && instrumentalRef.current.readyState >= 1) instrumentalRef.current.currentTime = time;
  };
  
  // -----------------------------------------
  // NEW QUEUE & SEARCH SYSTEM
  // -----------------------------------------
  
  const [backendError, setBackendError] = useState('');
  const launchModalRef = useRef<ModalHandler>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [downloadOS, setDownloadOS] = useState<'win' | 'mac' | null>(null);

  const removeFromQueue = (id: string, idx: number) => {
    setQueue(prev => prev.filter((_, i) => i !== idx));
  };

  // Background Processor (Pre-loader)
  useEffect(() => {
    const pendingItem = queue.find(q => q.status === 'pending');
    if (!pendingItem) return;

    let isPolling = true;

    const processItem = async () => {
      setQueue(prev => prev.map(q => q.id === pendingItem.id && q.status === 'pending' ? { ...q, status: 'processing', message: 'กำลังเริ่มทำงาน...' } : q));

      const pollProgress = async () => {
        while (isPolling) {
          try {
            const res = await fetchWithFallback(`/progress/${pendingItem.id}`);
            if (res.ok) {
              const data = await res.json();
              setQueue(prev => prev.map(q => q.id === pendingItem.id ? { ...q, message: data.message, percent: data.percent } : q));
            }
          } catch (e) { }
          await new Promise(r => setTimeout(r, 1000));
        }
      };
      pollProgress();

      try {
        const res = await fetchWithFallback("/separate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ video_id: pendingItem.id })
        });
        isPolling = false;
        const data = await res.json();
        
        if (res.ok && (data.status === "success" || data.status === "cached")) {
          setQueue(prev => prev.map(q => q.id === pendingItem.id ? { ...q, status: 'ready', message: 'พร้อมเล่น!', percent: 100 } : q));
        } else {
          console.error("Separation failed detail:", data.detail || data);
          setQueue(prev => prev.map(q => q.id === pendingItem.id ? { ...q, status: 'error', message: data.detail || data.message || data.error || 'เกิดข้อผิดพลาดในการแยกเสียง' } : q));
        }
      } catch (e) {
        isPolling = false;
        setQueue(prev => prev.map(q => q.id === pendingItem.id ? { ...q, status: 'error', message: 'เชื่อมต่อ AI Server ไม่สำเร็จ' } : q));
      }
    };

    processItem();
  }, [queue]);

  const handleNext = () => {
    if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
    if (instrumentalRef.current) instrumentalRef.current.pause();
    if (vocalRef.current) vocalRef.current.pause();
    
    setIsPlaying(false);
    setProgress(0);
    setCurrentVideoId('');
    setReadyAudioId('');

    setQueue(prev => {
      if (prev.length > 0 && prev[0].status === 'playing') {
        return prev.slice(1);
      }
      return prev;
    });
  };

  // Queue Player Logic (Play first ready if nothing is playing)
  useEffect(() => {
    if (currentVideoId) return;

    const firstItem = queue[0];
    if (firstItem && firstItem.status === 'ready') {
      setQueue(prev => prev.map(q => q.id === firstItem.id ? { ...q, status: 'playing' } : q));
      setCurrentVideoId(firstItem.id);
      setReadyAudioId(firstItem.id);
      setIsLoaded(false);
      setIsPlaying(false);
      setInstLoaded(false);
      setVocLoaded(false);
      setProgress(0);
      
      setTimeout(() => {
        setIsLoaded(true);
      }, 3000);
    }
  }, [queue, currentVideoId]);

  useEffect(() => {
    if (instLoaded && vocLoaded) {
      setIsLoaded(true);
      if (ytPlayerRef.current) setDuration(ytPlayerRef.current.getDuration() || 0);
      else if (instrumentalRef.current) setDuration(instrumentalRef.current.duration);
    }
  }, [instLoaded, vocLoaded]);

  useEffect(() => {
    if (vocalRef.current) vocalRef.current.load();
    if (instrumentalRef.current) instrumentalRef.current.load();
  }, [readyAudioId]);

  const progressPercent = duration > 0 ? (progress / 100) * 100 : 0;
  
  const currentVideo = queue.find(q => q.id === currentVideoId && q.status === 'playing');

  return (
    <div className="flex h-screen w-full text-text-base overflow-hidden selection:bg-primary/10 bg-white dark:bg-zinc-950">
      <Head>
        <title>YouOKE Mini Player - POC</title>
      </Head>

      {/* Left Sidebar (Reused from MainApp) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-zinc-950 transition-colors">
        
        {/* Main Interface: HomePageContent */}
        <div className="flex-1 overflow-y-auto lg:pr-[420px] pb-24 lg:pb-0 relative z-10 w-full h-full custom-scrollbar">
            {/* Top Navigation Wrapper for Search Box injection */}
            <div className="sticky top-0 z-50 w-full px-4 pt-4 pb-2 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-zinc-900 mb-4 flex items-center gap-4">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาเพลง ศิลปิน (AI Vocal Mode)..."
                        className="block w-full pl-12 pr-12 h-12 bg-gray-100/50 dark:bg-zinc-900/50 hover:bg-gray-100 dark:hover:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 border border-transparent focus:border-primary/30 rounded-2xl text-sm font-medium transition-all shadow-sm focus:outline-none"
                        onChange={(e) => usePlayerStore.getState().setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Fake Mode Switch */}
                <div className="hidden md:flex relative items-center bg-gray-100/50 dark:bg-zinc-900/50 rounded-xl p-1 h-12 w-[180px]">
                    <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-zinc-800 rounded-lg shadow-sm left-[calc(50%+2px)]" />
                    <button className="relative flex-1 flex items-center justify-center gap-1.5 h-full text-[11px] font-black uppercase text-gray-500"><Music className="w-3.5 h-3.5" /><span>เพลง</span></button>
                    <button className="relative flex-1 flex items-center justify-center gap-1.5 h-full text-[11px] font-black uppercase text-primary"><Mic2 className="w-3.5 h-3.5" /><span>AI ร้อง</span></button>
                </div>
            </div>

            <div className="px-4 pb-20">
                <HomePageContent onAddToQueue={handleAddToLocalQueue} />
            </div>
        </div>


        {/* Global Video Player Container (Right docked) */}
        <div id="global-video-player-container" className="lg:fixed lg:top-0 lg:w-[420px] lg:h-[300px] lg:right-0 bg-black z-[100] overflow-hidden lg:border-l lg:border-gray-200 lg:dark:border-zinc-800 shrink-0 origin-top-right transition-all duration-500">
            <div className="relative w-full h-full flex flex-col transition-all duration-500 bg-black">
                <div className="w-full bg-black shrink-0 relative overflow-hidden transition-all duration-500 aspect-video group">
                    
                    {/* The YouTube Player layer */}
                    {readyAudioId && currentVideoId ? (
                        <>
                            <div className="absolute inset-0 z-10 pointer-events-none group-hover:bg-black/10 transition-colors"></div>
                            <YouTube
                                videoId={currentVideoId}
                                opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, controls: 0, disablekb: 1, rel: 0, modestbranding: 1, fs: 0 } }}
                                className="w-full h-full"
                                onReady={(e) => {
                                    try {
                                        ytPlayerRef.current = e.target;
                                        e.target.mute();
                                        const d = e.target.getDuration();
                                        if (typeof d === 'number') setDuration(d);
                                    } catch (err) {}
                                }}
                                onPlay={(e) => {
                                    setIsPlaying(true);
                                    try { e.target.mute(); } catch (err) {}
                                }}
                                onStateChange={(e) => {
                                    if (e.data === 1) { 
                                        setIsPlaying(true);
                                        const d = e.target.getDuration();
                                        if (typeof d === 'number' && d > 0) setDuration(d);
                                    } else if (e.data === 2) { 
                                        setIsPlaying(false);
                                    } else if (e.data === 0) {
                                        setIsPlaying(false);
                                        handleNext();
                                    } else if (e.data === 3) {
                                        setIsPlaying(false);
                                    }
                                }}
                            />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                            <ListMusic className="w-12 h-12 mb-2 opacity-20" />
                            <span className="text-sm font-medium opacity-50">รอเล่นเพลงจากคิว (POC)</span>
                        </div>
                    )}
                </div>

                {/* Desktop Controls (Under the video) */}
                <div className="hidden lg:flex flex-col flex-1 bg-white dark:bg-zinc-950 relative border-t border-gray-100 dark:border-zinc-900">
                    {currentVideoId && currentVideo ? (
                        <div className="absolute inset-0 flex flex-col">
                            {/* Seekbar at the top of controls */}
                            <div className="h-1 bg-gray-200 dark:bg-zinc-800 relative cursor-pointer" onMouseDown={(e:any)=>{
                                const rect = e.currentTarget.getBoundingClientRect();
                                const p = ((e.clientX - rect.left) / rect.width) * 100;
                                setProgress(p);
                                handleSeekEnd({ currentTarget: { value: p }});
                            }}>
                                <div className="absolute top-0 left-0 bottom-0 bg-primary pointer-events-none" style={{ width: `${progressPercent}%` }} />
                            </div>

                            {/* Horizontal Controls Row - Matching SidebarControls style */}
                            <div className="relative flex items-center justify-between px-2 flex-1">
                                {[
                                    {
                                        id: 'play',
                                        icon: isPlaying ? Pause : Play,
                                        label: "เล่น/หยุด",
                                        onClick: handlePlayPause,
                                        active: isPlaying,
                                    },
                                    {
                                        id: 'repeat',
                                        icon: RotateCcw,
                                        label: "ร้องซ้ำ",
                                        onClick: () => {
                                            if (ytPlayerRef.current) ytPlayerRef.current.seekTo(0);
                                            setIsPlaying(true);
                                        },
                                        active: false,
                                    },
                                    {
                                        id: 'next',
                                        icon: SkipForward,
                                        label: "ถัดไป",
                                        onClick: handleNext,
                                        active: false,
                                    },
                                    {
                                        id: 'vocals',
                                        icon: Mic2,
                                        label: "ร้อง",
                                        onClick: () => toggleMute('vocals'),
                                        active: !trackStates.vocals.muted,
                                        activeColor: "text-primary bg-primary/10",
                                        textColor: !trackStates.vocals.muted ? "text-primary" : "text-black/60 dark:text-zinc-400"
                                    },
                                    {
                                        id: 'instrumental',
                                        icon: Music,
                                        label: "ดนตรี",
                                        onClick: () => toggleMute('instrumental'),
                                        active: !trackStates.instrumental.muted,
                                        activeColor: "text-blue-500 bg-blue-500/10",
                                        textColor: !trackStates.instrumental.muted ? "text-blue-500" : "text-black/60 dark:text-zinc-400"
                                    },
                                    {
                                        id: 'mixer',
                                        icon: SlidersHorizontal,
                                        label: "มิกเซอร์",
                                        onClick: () => setShowVocalMixer(!showVocalMixer),
                                        active: showVocalMixer,
                                        activeColor: "text-black dark:text-white bg-gray-100 dark:bg-zinc-800",
                                        textColor: showVocalMixer ? "text-black dark:text-white" : "text-black/60 dark:text-zinc-400",
                                        ref: vocalBtnRef
                                    }
                                ].map((item, index) => (
                                    <button
                                        key={item.id}
                                        ref={item.ref as any}
                                        onClick={item.onClick}
                                        className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-all duration-200 group relative"
                                    >
                                        <div className={clsx(
                                            "p-1.5 rounded-xl transition-all duration-300 relative flex items-center justify-center gap-0.5",
                                            item.active 
                                                ? (item.activeColor || "text-primary bg-primary/10") 
                                                : "text-black dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white"
                                        )}>
                                            <item.icon
                                                size={20}
                                                strokeWidth={item.active ? 2.2 : 1.5}
                                                className={clsx("transition-transform duration-300", item.active && "scale-105")}
                                            />
                                            {item.active && item.id !== 'mixer' && item.id !== 'vocals' && item.id !== 'instrumental' && (
                                                <div className="absolute inset-0 bg-primary/5 blur-md -z-10" />
                                            )}
                                        </div>
                                        <span className={clsx(
                                            "text-[10px] font-medium uppercase tracking-wide transition-colors duration-200 mt-1",
                                            item.textColor || (item.active ? "text-primary" : "text-black/60 dark:text-zinc-400")
                                        )}>
                                            {item.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Flat Mixer Popover */}
                            {showVocalMixer && (
                                <div ref={mixerRef} className="absolute bottom-[60px] right-2 mb-2 w-72 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-xl">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-5">AI Volume Mixer</h4>
                                    
                                    {/* Vocals */}
                                    <div className="mb-5">
                                        <div className="flex justify-between text-xs font-bold mb-2 text-black dark:text-white">
                                            <span>เสียงร้อง (Vocals)</span>
                                            <span className="text-primary">{volumes.vocals}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => toggleMute('vocals')} className={clsx("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors border", trackStates.vocals.muted ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800" : "bg-white dark:bg-zinc-800 text-gray-400 border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700")}>M</button>
                                            <button onClick={() => toggleSolo('vocals')} className={clsx("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors border", trackStates.vocals.solo ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-yellow-200 dark:border-yellow-800" : "bg-white dark:bg-zinc-800 text-gray-400 border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700")}>S</button>
                                            <input type="range" min="0" max="100" value={volumes.vocals} onChange={(e) => handleVolumeChange('vocals', parseInt(e.target.value))} className="flex-1 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full appearance-none accent-primary" />
                                        </div>
                                    </div>

                                    {/* Instrumental */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-2 text-black dark:text-white">
                                            <span>ดนตรี (Instrumental)</span>
                                            <span className="text-blue-500">{volumes.instrumental}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => toggleMute('instrumental')} className={clsx("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors border", trackStates.instrumental.muted ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800" : "bg-white dark:bg-zinc-800 text-gray-400 border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700")}>M</button>
                                            <button onClick={() => toggleSolo('instrumental')} className={clsx("w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors border", trackStates.instrumental.solo ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-yellow-200 dark:border-yellow-800" : "bg-white dark:bg-zinc-800 text-gray-400 border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700")}>S</button>
                                            <input type="range" min="0" max="100" value={volumes.instrumental} onChange={(e) => handleVolumeChange('instrumental', parseInt(e.target.value))} className="flex-1 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full appearance-none accent-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs text-gray-400 font-medium">ไม่มีเพลงเล่นอยู่</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Desktop Queue Layout */}
        <div className="hidden lg:block fixed right-0 top-[300px] bottom-0 w-[420px] bg-white dark:bg-zinc-950 border-l border-gray-100 dark:border-zinc-800 flex flex-col z-40">
             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 shrink-0">
                <div className="flex items-center gap-2">
                    <ListMusic size={14} className="text-primary" />
                    <span className="text-[16px] font-black text-black dark:text-white tracking-tight">
                        คิวเพลง POC {queue.length > 0 && <span className="text-gray-400 dark:text-zinc-500 font-bold ml-1 text-[13px]">({queue.length})</span>}
                    </span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pt-2 pb-6">
                {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-400 min-h-[300px]">
                        <ListMusic className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium">ยังไม่มีคิวเพลงในระบบ POC</p>
                    </div>
                ) : (
                    queue.map((item, index) => (
                        <div key={item.id + index} className={clsx(
                            "group flex items-center gap-4 py-2 px-3 mx-2 my-1 rounded-xl border transition-all",
                            item.status === 'playing' ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm" : "bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700"
                        )}>
                            <div className="font-bold text-gray-300 dark:text-zinc-600 w-4 text-center text-xs">{index + 1}</div>
                            
                            <div className="relative w-28 h-16 bg-black flex-shrink-0 rounded-lg overflow-hidden border border-black/5 dark:border-white/5">
                                <img src={item.thumbnail} alt="" className="object-cover w-full h-full" />
                            </div>

                            <div className="flex-1 min-w-0 py-1">
                                <h4 className={clsx("text-[13px] font-black line-clamp-1 leading-snug mb-0.5", item.status === 'playing' ? "text-primary" : "text-black dark:text-white")}>{item.title}</h4>
                                <div className="flex items-center mt-1">
                                    <span className="text-[10px] font-medium text-gray-500 truncate">{item.message}</span>
                                    {item.status === 'processing' && <span className="text-[10px] font-bold text-blue-500 ml-auto">{item.percent}%</span>}
                                </div>
                                {item.status === 'processing' && (
                                    <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-1 mt-2 overflow-hidden">
                                        <div className="bg-blue-500 h-1 rounded-full transition-all duration-300" style={{ width: `${item.percent}%` }} />
                                    </div>
                                )}
                            </div>

                            <div className="w-16 flex justify-end shrink-0 pr-2">
                                {item.status === 'ready' && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[9px] font-bold rounded uppercase">Ready</span>}
                                {item.status === 'playing' && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-bold rounded uppercase animate-pulse">Playing</span>}
                                {item.status === 'error' && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[9px] font-bold rounded uppercase">Error</span>}
                                
                                {item.status !== 'playing' && (
                                    <button onClick={() => removeFromQueue(item.id, index)} className="ml-2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
        </div>
      {/* Hidden Audio Elements */}
      {readyAudioId && (
        <div className="hidden">
            <audio 
                ref={vocalRef} 
                src={`http://127.0.0.1:5050/files/${readyAudioId}/vocals.m4a`} 
                preload="auto" 
                onLoadedData={(e) => {
                e.currentTarget.volume = getEffectiveVolume('vocals') / 100;
                if (isPlaying) e.currentTarget.play().catch(()=>{});
                setVocLoaded(true);
                }} 
            />
            <audio 
                ref={instrumentalRef} 
                src={`http://127.0.0.1:5050/files/${readyAudioId}/no_vocals.m4a`} 
                preload="auto" 
                onLoadedData={(e) => {
                e.currentTarget.volume = getEffectiveVolume('instrumental') / 100;
                if (isPlaying) e.currentTarget.play().catch(()=>{});
                setInstLoaded(true);
                }} 
            />
        </div>
      )}

      <Modal 
        ref={launchModalRef}
        body={
          showInstallGuide ? (
            <div className="p-6 text-left text-gray-700 dark:text-gray-300">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">กำลังดาวน์โหลด YouOke Plugin...</h3>
              
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 mb-4 text-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  {downloadOS === 'mac' ? '🍎 วิธีติดตั้งสำหรับ Mac' : '🪟 วิธีติดตั้งสำหรับ Windows'}
                </h4>
                {downloadOS === 'mac' ? (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>รอจนกว่าไฟล์ <strong>.dmg</strong> จะดาวน์โหลดเสร็จ และเปิดไฟล์ขึ้นมา</li>
                    <li>ลากไอคอนแอป <strong>YouOke Plugin</strong> ลงในโฟลเดอร์ <strong>Applications</strong></li>
                    <li>เปิดแอป <strong>Terminal</strong> (พิมพ์ Terminal ใน Spotlight/Launchpad) แล้วพิมพ์คำสั่งนี้:</li>
                    <li className="list-none">
                      <code className="block bg-gray-900 text-green-400 p-2.5 rounded-lg text-xs font-mono mt-1 mb-1 select-all cursor-pointer" onClick={(e) => {navigator.clipboard.writeText('xattr -cr /Applications/YouOke\\ Plugin.app && open /Applications/YouOke\\ Plugin.app'); const el = e.currentTarget; el.style.outline='2px solid #22c55e'; setTimeout(()=>el.style.outline='',1000);}}>
                        xattr -cr /Applications/YouOke\ Plugin.app && open /Applications/YouOke\ Plugin.app
                      </code>
                      <span className="text-xs text-gray-500">👆 คลิกเพื่อคัดลอก แล้ววางใน Terminal แล้วกด Enter</span>
                    </li>
                    <li>แอปจะเปิดขึ้นมาโดยอัตโนมัติ ครั้งต่อไปเปิดได้ตามปกติ</li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>รอจนกว่าไฟล์ <strong>.exe</strong> จะดาวน์โหลดเสร็จ</li>
                    <li>เปิดไฟล์ติดตั้ง หากขึ้นหน้าต่างแจ้งเตือนสีฟ้า (Windows Protect)</li>
                    <li>คลิกที่ <strong>More info (ข้อมูลเพิ่มเติม)</strong> จากนั้นกด <strong>Run anyway (เรียกใช้ต่อไป)</strong></li>
                  </ul>
                )}
              </div>
              <p className="text-xs text-center text-gray-500">
                เมื่อติดตั้งเสร็จแล้ว YouOke Plugin จะเชื่อมต่อกับเว็บไซต์โดยอัตโนมัติ
              </p>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-700 dark:text-gray-300">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">จำเป็นต้องใช้ YouOke Plugin</h3>
              <p className="text-sm leading-relaxed">ระบบแยกเสียงด้วย AI ขั้นสูง จำเป็นต้องใช้พลังประมวลผลจากเครื่องของคุณผ่านตัวแอป YouOke Plugin (Desktop) เพื่อให้สามารถแยกเสียงร้องได้อย่างสมบูรณ์แบบและไร้ขีดจำกัด</p>
              <p className="text-sm mt-4 font-semibold text-gray-900 dark:text-white">หากคุณติดตั้งแอปไว้แล้ว กรุณากดปุ่มด้านล่าง</p>
            </div>
          )
        }
        footer={
          showInstallGuide ? (
            <button 
              onClick={() => {
                setShowInstallGuide(false);
                launchModalRef.current?.close();
              }}
              className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors shadow-sm"
            >
              เข้าใจแล้ว ปิดหน้าต่างนี้
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleLaunchPlugin}
                className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold transition-colors shadow-sm"
              >
                เปิด YouOke Plugin
              </button>
              <button 
                onClick={handleDownloadPlugin}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-gray-900 dark:text-white rounded-xl font-bold transition-colors text-center"
              >
                ยังไม่มีแอป? ดาวน์โหลดที่นี่
              </button>
            </div>
          )
        }
      />
    </div>
  );
}
