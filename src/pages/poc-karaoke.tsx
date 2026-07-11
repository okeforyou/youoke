import React, { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import YouTube from 'react-youtube';
import clsx from 'clsx';
import { Search, X, Mic, Music, Mic2, Smartphone, Play, Pause, SkipForward, RotateCcw, Volume2, VolumeX, ChevronUp, Maximize, ListMusic, Trash2, Menu } from 'lucide-react';
import { Sidebar } from '../components/navigation/Sidebar';
import { DebounceInput } from 'react-debounce-input';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  
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
          if (
              showVocalMixer &&
              mixerRef.current &&
              !mixerRef.current.contains(event.target as Node) &&
              vocalBtnRef.current &&
              !vocalBtnRef.current.contains(event.target as Node)
          ) {
              setShowVocalMixer(false);
          }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
          document.removeEventListener("touchstart", handleClickOutside);
      };
  }, [showVocalMixer]);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setBackendError('');
    try {
      const res = await fetch(`http://127.0.0.1:5050/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.status === "success") {
        setSearchResults(data.results);
      }
    } catch (e) {
      console.error(e);
      setBackendError("ไม่สามารถเชื่อมต่อ YouOke Plugin ได้ กรุณาเปิดแอปบนเครื่องของคุณก่อนค้นหา");
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : null;
  };

  const addToQueue = (item: SearchResult) => {
    setQueue(prev => [...prev, {
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnails[0]?.url || '',
      status: 'pending',
      percent: 0,
      message: 'รอดำเนินการ...'
    }]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const addUrlToQueue = () => {
    const vid = extractVideoId(searchQuery);
    if (!vid) return alert("URL ไม่ถูกต้อง กรุณาใส่ URL YouTube");
    setQueue(prev => [...prev, {
      id: vid,
      title: "Unknown Song (URL)",
      thumbnail: `https://img.youtube.com/vi/${vid}/mqdefault.jpg`,
      status: 'pending',
      percent: 0,
      message: 'รอดำเนินการ...'
    }]);
    setSearchQuery('');
  };

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
            const res = await fetch(`http://127.0.0.1:5050/progress/${pendingItem.id}`);
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
        const res = await fetch("http://127.0.0.1:5050/separate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ video_id: pendingItem.id })
        });
        isPolling = false;
        const data = await res.json();
        
        if (res.ok && (data.status === "success" || data.status === "cached")) {
          setQueue(prev => prev.map(q => q.id === pendingItem.id ? { ...q, status: 'ready', message: 'พร้อมเล่น!', percent: 100 } : q));
        } else {
          setQueue(prev => prev.map(q => q.id === pendingItem.id ? { ...q, status: 'error', message: 'เกิดข้อผิดพลาด' } : q));
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
        
        {/* Desktop Header Mimic */}
        <header className="hidden lg:flex h-20 items-center justify-between px-8 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-20 transition-all">
            <div className="flex-1 max-w-2xl relative group flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-300 dark:text-zinc-600 group-focus-within:text-primary transition-colors" />
                    </div>
                    <DebounceInput
                        minLength={2}
                        debounceTimeout={300}
                        placeholder="ค้นหาเพลง (POC Search Server)..."
                        className="block w-full pl-14 pr-12 h-12 bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 border border-gray-100 dark:border-zinc-800 focus:border-primary/20 rounded-2xl leading-5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none transition-all shadow-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e: any) => e.key === 'Enter' && handleSearch()}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-2 text-gray-300 dark:text-zinc-600 hover:text-red-500 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-2 h-12 rounded-2xl font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]"
                >
                  {isSearching ? "..." : "ค้นหา"}
                </button>
                <button 
                  onClick={addUrlToQueue}
                  className="px-4 py-2 h-12 rounded-2xl font-bold text-slate-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                  title="เพิ่ม URL โดยตรง"
                >
                  + URL
                </button>
            </div>
            
            <div className="flex items-center gap-6 ml-6">
                 {/* Fake Mode Switch to look like main app */}
                 <div className="relative flex items-center bg-gray-50 dark:bg-zinc-900 rounded-2xl p-1 h-11 w-[180px] border border-gray-100 dark:border-zinc-800 opacity-50 cursor-not-allowed">
                    <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-zinc-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] left-[calc(50%+2px)]" />
                    <button className="relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-xl text-[11px] font-black tracking-tight uppercase transition-colors z-10 text-black dark:text-zinc-400"><Music className="w-3.5 h-3.5" /><span>เพลง</span></button>
                    <button className="relative flex-1 flex items-center justify-center gap-1.5 h-full rounded-xl text-[11px] font-black tracking-tight uppercase transition-colors z-10 text-primary"><Mic2 className="w-3.5 h-3.5" /><span>คาราโอเกะ</span></button>
                 </div>
            </div>
        </header>

        {/* Global Video Player Container (Right docked) */}
        <div id="global-video-player-container" className="lg:fixed lg:top-0 lg:w-[420px] lg:h-[236px] lg:right-0 bg-black z-[100] overflow-hidden lg:border-l lg:border-gray-200 lg:dark:border-zinc-800 shrink-0 origin-top-right transition-all duration-500">
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
                            {/* Seekbar */}
                            <div className="h-1 bg-gray-200 dark:bg-zinc-800 relative cursor-pointer" onMouseDown={(e:any)=>{
                                const rect = e.currentTarget.getBoundingClientRect();
                                const p = ((e.clientX - rect.left) / rect.width) * 100;
                                setProgress(p);
                                handleSeekEnd({ currentTarget: { value: p }});
                            }}>
                                <div className="absolute top-0 left-0 bottom-0 bg-primary pointer-events-none" style={{ width: `${progressPercent}%` }} />
                            </div>

                            <div className="flex-1 flex items-center justify-between px-4">
                                {/* Left: Info */}
                                <div className="flex items-center gap-3 w-1/3 min-w-0">
                                    <div className="w-10 h-10 bg-black rounded-lg overflow-hidden shrink-0">
                                        <img src={currentVideo.thumbnail} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[13px] font-black text-black dark:text-white truncate">{currentVideo.title}</span>
                                        <span className="text-[10px] font-medium text-gray-500 truncate">AI Processing POC</span>
                                    </div>
                                </div>
                                
                                {/* Center: Controls */}
                                <div className="flex items-center justify-center gap-4 w-1/3">
                                    <button onClick={() => {}} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"><RotateCcw size={16} /></button>
                                    <button onClick={handlePlayPause} className="w-9 h-9 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                                        {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-1" />}
                                    </button>
                                    <button onClick={handleNext} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"><SkipForward size={16} /></button>
                                </div>

                                {/* Right: Mixers */}
                                <div className="flex items-center justify-end gap-3 w-1/3 relative">
                                    <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    </button>
                                    
                                    {/* VOCAL MIXER TOGGLE */}
                                    <div className="relative">
                                        <button 
                                            ref={vocalBtnRef}
                                            onClick={() => setShowVocalMixer(!showVocalMixer)}
                                            className={clsx(
                                                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border transition-colors",
                                                showVocalMixer || trackStates.vocals.muted ? "bg-primary/10 text-primary border-primary/20" : "text-gray-500 border-gray-200 dark:border-zinc-800"
                                            )}
                                        >
                                            <Mic2 size={14} />
                                            เสียงร้อง
                                        </button>

                                        {/* Vocal Mixer Popover */}
                                        {showVocalMixer && (
                                            <div ref={mixerRef} className="absolute bottom-full right-0 mb-3 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">AI Vocal Mixer</h4>
                                                
                                                {/* Vocals */}
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-xs font-bold mb-2 text-black dark:text-white">
                                                        <span>เสียงร้อง (Vocals)</span>
                                                        <span className="text-primary">{volumes.vocals}%</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => toggleMute('vocals')} className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors", trackStates.vocals.muted ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200")}>M</button>
                                                        <button onClick={() => toggleSolo('vocals')} className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors", trackStates.vocals.solo ? "bg-yellow-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200")}>S</button>
                                                        <input type="range" min="0" max="100" value={volumes.vocals} onChange={(e) => handleVolumeChange('vocals', parseInt(e.target.value))} className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full appearance-none accent-primary" />
                                                    </div>
                                                </div>

                                                {/* Instrumental */}
                                                <div>
                                                    <div className="flex justify-between text-xs font-bold mb-2 text-black dark:text-white">
                                                        <span>ดนตรี (Instrumental)</span>
                                                        <span className="text-blue-500">{volumes.instrumental}%</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => toggleMute('instrumental')} className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors", trackStates.instrumental.muted ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200")}>M</button>
                                                        <button onClick={() => toggleSolo('instrumental')} className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors", trackStates.instrumental.solo ? "bg-yellow-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200")}>S</button>
                                                        <input type="range" min="0" max="100" value={volumes.instrumental} onChange={(e) => handleVolumeChange('instrumental', parseInt(e.target.value))} className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full appearance-none accent-blue-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
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
        <div className="hidden lg:block fixed right-0 top-[236px] bottom-0 w-[420px] bg-white dark:bg-zinc-950 border-l border-gray-100 dark:border-zinc-800 flex flex-col z-40">
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

        {/* Content Area (Search Results) - Push Right 420px on Desktop to avoid covering queue */}
        <div className="flex-1 lg:mr-[420px] p-4 md:p-8 overflow-y-auto">
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-black dark:text-white tracking-tight">POC AI Vocal Search Results</h2>
                    <p className="text-sm text-gray-500 mt-1">Search for a song above to separate vocals and instrumentals locally.</p>
                </div>

                {backendError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
                        <X className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm">ข้อผิดพลาดในการเชื่อมต่อ</h4>
                            <p className="text-xs mt-1">{backendError}</p>
                        </div>
                    </div>
                )}
                
                {searchResults.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {searchResults.map((item, idx) => (
                            <div key={idx} className="group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-md transition-all cursor-pointer" onClick={() => addToQueue(item)}>
                                <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-zinc-800">
                                    <img src={item.thumbnails[0]?.url} alt="" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] font-bold text-white">{item.duration}</div>
                                </div>
                                <div className="p-3">
                                    <h3 className="text-[13px] font-black text-black dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">{item.title}</h3>
                                    <p className="text-[11px] font-medium text-gray-500 mt-1 truncate">{item.channel?.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl bg-gray-50/50 dark:bg-zinc-900/50">
                        <Mic2 className="w-12 h-12 text-gray-300 mb-3" />
                        <span className="text-gray-400 font-bold text-sm">พิมพ์ค้นหาด้านบน เพื่อเพิ่มเพลงเข้า POC AI Queue</span>
                    </div>
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
    </div>
  );
}
