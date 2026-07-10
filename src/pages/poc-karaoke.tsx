import { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import YouTube from 'react-youtube';

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
  const [showCC, setShowCC] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volumes, setVolumes] = useState({ vocals: 100, instrumental: 100 });

  const instrumentalRef = useRef<HTMLAudioElement | null>(null);
  const vocalRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  const [instLoaded, setInstLoaded] = useState(false);
  const [vocLoaded, setVocLoaded] = useState(false);

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

  // Resilient Volume Sync
  useEffect(() => {
    if (vocalRef.current) vocalRef.current.volume = volumes.vocals / 100;
    if (instrumentalRef.current) instrumentalRef.current.volume = volumes.instrumental / 100;
  }, [volumes.vocals, volumes.instrumental]);

  // Sync Interval (Slave to YT Time to avoid drift)
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        if (!ytPlayerRef.current || !instrumentalRef.current || !vocalRef.current) return;
        const state = ytPlayerRef.current.getPlayerState();
        if (state !== 1) return; // Only sync if actually playing
        
        const ytTime = ytPlayerRef.current.getCurrentTime();
        if (typeof ytTime !== 'number' || ytTime === 0 && duration > 0) return; // Prevent bad sync at 0
        
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
      // Let onStateChange handle audio pausing
    } else {
      ytPlayerRef.current.playVideo();
      // Let onStateChange handle audio playing
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
  
  const toggleCC = () => {
    if (!ytPlayerRef.current) return;
    if (showCC) ytPlayerRef.current.unloadModule('captions');
    else {
      ytPlayerRef.current.loadModule('captions');
      ytPlayerRef.current.setOption('captions', 'track', { languageCode: 'th' });
    }
    setShowCC(!showCC);
  };

  // -----------------------------------------
  // NEW QUEUE & SEARCH SYSTEM
  // -----------------------------------------
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`http://127.0.0.1:5050/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.status === "success") {
        setSearchResults(data.results);
      }
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถเชื่อมต่อระบบค้นหาได้ กรุณาตรวจสอบว่า Backend (server.py) รันอยู่");
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

  // Background Processor (Pre-loader)
  useEffect(() => {
    const pendingItem = queue.find(q => q.status === 'pending');
    if (!pendingItem) return;

    // Process the first pending item
    let isPolling = true;

    const processItem = async () => {
      // Mark as processing
      setQueue(prev => prev.map(q => q.id === pendingItem.id ? { ...q, status: 'processing', message: 'กำลังเริ่มทำงาน...' } : q));

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

    // Remove the currently playing song (first in queue)
    setQueue(prev => {
      if (prev.length > 0 && prev[0].status === 'playing') {
        return prev.slice(1);
      }
      return prev;
    });
  };

  // Queue Player Logic (Play first ready if nothing is playing)
  useEffect(() => {
    // If we already have a current video playing, do nothing
    if (currentVideoId) return;

    // We must find the first item in the queue.
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
      
      // Fallback for load
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center py-10 px-4">
      <Head>
        <title>YouOKE Mini Player - Queue System</title>
      </Head>

      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-slate-200 dark:border-zinc-800 shadow-xl">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
            Mini Player (PoC)
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">
            ระบบคิวเพลง ค้นหาและแยกเสียงร้องเบื้องหลังอัตโนมัติ
          </p>
        </div>
        
        {/* Search & Input Box */}
        <div className="mb-8 p-6 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800">
          <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">
            ค้นหาเพลงจาก YouTube หรือใส่ URL
          </label>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="เช่น รักแรกพบ หรือ https://youtube.com/..."
              className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 transition-colors"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]"
            >
              {isSearching ? "..." : "ค้นหา"}
            </button>
            <button 
              onClick={addUrlToQueue}
              className="px-4 py-3 rounded-xl font-bold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
              title="เพิ่ม URL โดยตรง"
            >
              +
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-zinc-900 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-colors">
                  <img src={item.thumbnails[0]?.url} alt="" className="w-16 h-12 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate">{item.channel?.name} • {item.duration}</p>
                  </div>
                  <button 
                    onClick={() => addToQueue(item)}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all"
                  >
                    + คิว
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {readyAudioId && currentVideoId && (
          <div className="mb-6 rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-zinc-800 relative pointer-events-none">
            <div className="absolute inset-0 z-10"></div>
            <YouTube
              videoId={currentVideoId}
              opts={{
                width: '100%',
                height: '360',
                playerVars: { autoplay: 0, controls: 0, disablekb: 1, rel: 0, modestbranding: 1, fs: 0 }
              }}
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
                } else if (e.data === 0) { // ENDED
                  setIsPlaying(false);
                  handleNext();
                } else if (e.data === 3) { // BUFFERING
                  setIsPlaying(false);
                }
              }}
            />
            {readyAudioId && (
              <>
                <audio 
                  ref={vocalRef} 
                  src={readyAudioId ? `http://127.0.0.1:5050/files/${readyAudioId}/vocals.m4a` : ""} 
                  preload="auto" 
                  onLoadedData={(e) => {
                    e.currentTarget.volume = volumes.vocals / 100;
                    if (isPlaying) e.currentTarget.play().catch(()=>{});
                    setVocLoaded(true);
                  }} 
                />
                <audio 
                  ref={instrumentalRef} 
                  src={readyAudioId ? `http://127.0.0.1:5050/files/${readyAudioId}/no_vocals.m4a` : ""} 
                  preload="auto" 
                  onLoadedData={(e) => {
                    e.currentTarget.volume = volumes.instrumental / 100;
                    if (isPlaying) e.currentTarget.play().catch(()=>{});
                    setInstLoaded(true);
                  }} 
                />
              </>
            )}
          </div>
        )}

        {isLoaded && currentVideoId && (
          <div className="space-y-8 animate-in fade-in duration-500 mb-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handlePlayPause}
                  className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/30"
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
                  ) : (
                    <svg className="w-8 h-8 translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <button 
                  onClick={handleNext}
                  className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-[20px] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
                  title="ข้ามคิว (Next)"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="w-10 text-right">{Math.floor((progress / 100) * (Number(duration) || 0) / 60) || 0}:{Math.floor(((progress / 100) * (Number(duration) || 0)) % 60).toString().padStart(2, '0')}</span>
              <input 
                type="range" 
                min="0" max="100" 
                value={progress || 0} 
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                onChange={handleSeekChange} 
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                onKeyUp={handleSeekEnd}
                className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600" 
              />
              <span className="w-10">{Math.floor((Number(duration) || 0) / 60) || 0}:{Math.floor((Number(duration) || 0) % 60).toString().padStart(2, '0')}</span>
              <button onClick={toggleCC} className={`px-3 py-1 rounded-full border transition-colors ${showCC ? 'bg-blue-500 border-blue-500 text-white' : 'bg-transparent border-slate-300 text-slate-500 hover:bg-slate-100'}`}>CC</button>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 rounded-2xl p-6 border border-slate-100 dark:border-zinc-800 space-y-6">
              <div className="flex items-center gap-2 mb-2"><h3 className="font-black text-xs tracking-wider text-slate-400 uppercase">Audio Mixer</h3></div>
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold text-pink-500">🎤 เสียงร้อง (Vocals)</span>
                  <span className="text-slate-500 border px-2 py-0.5 rounded text-xs">{volumes.vocals}%</span>
                </div>
                <input type="range" min="0" max="100" value={volumes.vocals} onChange={(e) => handleVolumeChange('vocals', parseInt(e.target.value))} className="w-full h-2 accent-pink-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold text-blue-500">🎸 ดนตรี (Instrumental)</span>
                  <span className="text-slate-400 border px-2 py-0.5 rounded text-xs">{volumes.instrumental}%</span>
                </div>
                <input type="range" min="0" max="100" value={volumes.instrumental} onChange={(e) => handleVolumeChange('instrumental', parseInt(e.target.value))} className="w-full h-2 accent-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Queue List UI */}
        <div className="border-t border-slate-200 dark:border-zinc-800 pt-8 mt-8">
          <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 mb-4 flex items-center justify-between">
            <span>คิวเพลง ({queue.length})</span>
          </h2>
          <div className="space-y-3">
            {queue.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">ไม่มีเพลงในคิว</p>
            ) : (
              queue.map((item, index) => (
                <div key={item.id + index} className={`flex items-center gap-4 p-3 rounded-xl border ${item.status === 'playing' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'}`}>
                  <div className="font-bold text-slate-400 w-4 text-center">{index + 1}</div>
                  <img src={item.thumbnail} alt="" className="w-16 h-12 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${item.status === 'playing' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'}`}>{item.title}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-500 truncate">{item.message}</span>
                      {item.status === 'processing' && <span className="text-xs font-bold text-blue-500">{item.percent}%</span>}
                    </div>
                    {item.status === 'processing' && (
                      <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-1 mt-2">
                        <div className="bg-blue-500 h-1 rounded-full transition-all duration-300" style={{ width: `${item.percent}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="w-16 flex justify-end">
                    {item.status === 'ready' && <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold rounded uppercase">Ready</span>}
                    {item.status === 'playing' && <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded uppercase animate-pulse">Playing</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
