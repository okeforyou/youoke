import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getActiveBridgeBaseUrl, useAIVocalStore } from '../stores/useAIVocalStore';
import { 
    Mic, Play, Pause, Save, Download, Video, Music, 
    ArrowLeft, Settings, Maximize, Type, UploadCloud, FileAudio,
    Sparkles, FileText
} from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { clsx } from 'clsx';
import { useUIStore } from '@/stores/useUIStore';
import { useToast } from "@/context/ToastContext";

interface CachedSong {
    video_id: string;
    title: string;
    mode: string;
    size_mb: number;
    created_at: number;
}

interface LyricWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
}

export default function CreatorStudioPage() {
    const { addToast } = useToast() || { addToast: (msg: string) => window.alert(msg) };
    const router = useRouter();
    const { deepgramKey } = useAIVocalStore();
    
    // States
    const [songs, setSongs] = useState<CachedSong[]>([]);
    const [selectedSong, setSelectedSong] = useState<CachedSong | null>(null);
    const [lyrics, setLyrics] = useState<LyricWord[]>([]);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState('');
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [ytUrl, setYtUrl] = useState('');

    const extractYoutubeVideoId = (url: string) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : url.trim();
    };

    const handleGoToWikiStudio = () => {
        const videoId = extractYoutubeVideoId(ytUrl);
        if (!videoId) {
            addToast("กรุณากรอกลิงก์ YouTube หรือ Video ID ที่ถูกต้อง");
            return;
        }
        router.push(`/studio/${videoId}`);
    };
    
    // Font settings
    const [fontSize, setFontSize] = useState(48);
    const [fontOutline, setFontOutline] = useState(3);
    const [fontFamily, setFontFamily] = useState('Sukhumvit Set');
    const [activeTab, setActiveTab] = useState<'properties' | 'lyrics'>('properties');
    const [audioTrack, setAudioTrack] = useState<'original' | 'vocals' | 'instrumental'>('vocals');
    const [zoom, setZoom] = useState(50); // px per second
    
    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const wsRegions = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        fetchSongs();
    }, []);

    const fetchSongs = async () => {
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) return;
            const res = await fetch(`${baseUrl}/cache/list`);
            if (res.ok) {
                const data = await res.json();
                setSongs(data.results || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Auto-select song if '?edit=videoId' is passed
    useEffect(() => {
        if (router.isReady && router.query.edit && songs.length > 0 && !selectedSong) {
            const editId = router.query.edit as string;
            const match = songs.find(s => s.video_id === editId);
            if (match) {
                handleSelectSong(match);
                // Remove the query param so refreshing doesn't force re-select
                router.replace('/creator', undefined, { shallow: true });
            } else {
                addToast(`ไม่พบเพลง (ID: ${editId}) ใน Local Bridge`);
            }
        }
    }, [router.isReady, router.query.edit, songs, selectedSong, router]);

    const handleSelectSong = async (song: CachedSong) => {
        // Clone the object so React sees it as a new state and forces re-render if it's the same song
        setSelectedSong({...song});
        
        // Auto-load previously extracted/edited AI lyrics from localStorage
        let initialLyrics: LyricWord[] = [];
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(`ai_lyrics_${song.video_id}`);
            if (cached) {
                try {
                    initialLyrics = JSON.parse(cached);
                } catch(e) {}
            }
        }
        setLyrics(initialLyrics);
        setError('');
        setShowLibraryModal(false);
        
        if (wavesurfer.current) {
            wavesurfer.current.destroy();
            wavesurfer.current = null;
        }
        if (wsRegions.current) {
            wsRegions.current = null;
        }

        const baseUrl = await getActiveBridgeBaseUrl();
        if (!baseUrl) return;

        // Initialize WaveSurfer after a short delay to ensure DOM is ready
        setTimeout(() => {
            if (containerRef.current) {
                containerRef.current.innerHTML = ''; // Force clear container just in case
                const ws = WaveSurfer.create({
                    container: containerRef.current,
                    waveColor: '#6366f1', // Indigo
                    progressColor: '#a855f7', // Purple
                    cursorColor: '#f43f5e', // Rose
                    barWidth: 2,
                    barGap: 2,
                    barRadius: 2,
                    height: 100,
                    url: `${baseUrl}/files/${song.video_id}/${audioTrack === 'vocals' ? 'vocals.m4a' : audioTrack === 'instrumental' ? 'no_vocals.m4a' : 'original.audio'}`,
                    normalize: true,
                    minPxPerSec: 50,
                });
                
                const wsReg = ws.registerPlugin(RegionsPlugin.create());
                
                ws.on('play', () => setIsPlaying(true));
                ws.on('pause', () => setIsPlaying(false));
                ws.on('timeupdate', (time) => setCurrentTime(time));
                ws.on('error', (err: any) => {
                    console.error("WaveSurfer error:", err);
                    setError("ไม่สามารถโหลดไฟล์เสียงได้: " + (err.message || err));
                });
                
                wsReg.on('region-updated', (region: any) => {
                    setLyrics(prev => {
                        const newLyrics = [...prev];
                        if (region.id && region.id.startsWith('lyric-')) {
                            const idx = parseInt(region.id.split('-')[1]);
                            if (!isNaN(idx) && newLyrics[idx]) {
                                newLyrics[idx].start = region.start;
                                newLyrics[idx].end = region.end;
                            }
                        }
                        return newLyrics;
                    });
                });

                wavesurfer.current = ws;
                wsRegions.current = wsReg;
            }
        }, 100);
    };

    useEffect(() => {
        if (wavesurfer.current && selectedSong) {
            const loadTrack = async () => {
                const baseUrl = await getActiveBridgeBaseUrl();
                if (!baseUrl) return;
                const url = `${baseUrl}/files/${selectedSong.video_id}/${audioTrack === 'vocals' ? 'vocals.m4a' : audioTrack === 'instrumental' ? 'no_vocals.m4a' : 'original.audio'}`;
                
                // Save current time
                const time = wavesurfer.current?.getCurrentTime() || 0;
                const isPlayingNow = wavesurfer.current?.isPlaying() || false;
                
                await wavesurfer.current?.load(url);
                
                // Rebuild regions after load since loading new url clears them
                rebuildRegions(lyrics);
                
                wavesurfer.current?.setTime(time);
                if (isPlayingNow) {
                    wavesurfer.current?.play();
                }
            };
            loadTrack();
        }
    }, [audioTrack]);

    // Auto-save lyrics to localStorage when they change
    useEffect(() => {
        if (selectedSong && lyrics.length > 0) {
            localStorage.setItem(`ai_lyrics_${selectedSong.video_id}`, JSON.stringify(lyrics));
        }
    }, [lyrics, selectedSong]);

    const rebuildRegions = (newLyrics: LyricWord[]) => {
        if (wsRegions.current) {
            wsRegions.current.clearRegions();
            newLyrics.forEach((word, i) => {
                wsRegions.current.addRegion({
                    id: `lyric-${i}`,
                    start: word.start,
                    end: word.end,
                    content: word.word,
                    color: 'rgba(168, 85, 247, 0.3)',
                    drag: true,
                    resize: true
                });
            });
        }
    };

    const handleWordChange = (idx: number, newText: string) => {
        setLyrics(prev => {
            const next = [...prev];
            next[idx].word = newText;
            return next;
        });
    };

    const handleWordBlur = () => {
        rebuildRegions(lyrics);
    };

    const handleMergeNext = (idx: number) => {
        if (idx >= lyrics.length - 1) return;
        setLyrics(prev => {
            const next = [...prev];
            next[idx].word = next[idx].word + next[idx+1].word;
            next[idx].end = next[idx+1].end;
            next.splice(idx + 1, 1);
            setTimeout(() => rebuildRegions(next), 0);
            return next;
        });
    };

    const handleDeleteWord = (idx: number) => {
        setLyrics(prev => {
            const next = [...prev];
            next.splice(idx, 1);
            setTimeout(() => rebuildRegions(next), 0);
            return next;
        });
    };

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setZoom(val);
        if (wavesurfer.current) {
            wavesurfer.current.zoom(val);
        }
    };

    const togglePlay = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    const handleTranscribe = async () => {
        if (!selectedSong) return;
        if (!deepgramKey) {
            useUIStore.getState().showConfirm({
                title: "ไม่พบ Deepgram API Key",
                message: "กรุณาไปที่เมนู 'ตั้งค่า > แท็บ AI' เพื่อกรอก Deepgram API Key ก่อนสร้างเนื้อเพลง",
                type: "warning",
                confirmText: "ไปหน้าตั้งค่า",
                cancelText: "ยกเลิก",
                onConfirm: () => {
                    useUIStore.getState().hideConfirm();
                    // Just open settings modal from home in real app, but here we alert
                    addToast("กรุณากดกลับไปหน้าแรก แล้วเปิดเมนูตั้งค่า -> แท็บ AI ครับ");
                }
            });
            return;
        }

        setIsTranscribing(true);
        setError('');
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) throw new Error("Local Bridge offline");

            // 1. Fetch audio from bridge
            const audioRes = await fetch(`${baseUrl}/files/${selectedSong.video_id}/vocals.m4a`);
            if (!audioRes.ok) {
                throw new Error("ไม่พบไฟล์เสียงร้อง (vocals.m4a) กรุณาแยกเสียงเพลงนี้ก่อน");
            }
            const audioBlob = await audioRes.blob();

            // 2. Call Deepgram directly from browser
            const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=th&smart_format=true', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${deepgramKey}`,
                    'Content-Type': 'audio/m4a'
                },
                body: audioBlob
            });

            if (res.ok) {
                const dgData = await res.json();
                const words = dgData.results?.channels[0]?.alternatives[0]?.words || [];
                
                if (words.length === 0) {
                    throw new Error("AI ไม่สามารถแกะเนื้อเพลงจากไฟล์เสียงร้องได้");
                }
                
                // Cache locally so it syncs with the player!
                localStorage.setItem(`ai_lyrics_${selectedSong.video_id}`, JSON.stringify(words));

                setLyrics(words);
                
                if (wsRegions.current) {
                    wsRegions.current.clearRegions();
                    words.forEach((word: LyricWord, i: number) => {
                        wsRegions.current.addRegion({
                            id: `lyric-${i}`,
                            start: word.start,
                            end: word.end,
                            content: word.word,
                            color: 'rgba(168, 85, 247, 0.3)',
                            drag: true,
                            resize: true
                        });
                    });
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.err_msg || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Deepgram API');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleExport = async () => {
        addToast("Exporting MP4 (FFmpeg process will run on Local Bridge) - Coming in next step!");
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };


    // Group words into lines
    const lyricLines = React.useMemo(() => {
        if (lyrics.length === 0) return [];
        const lines = [];
        let currentLine = [];
        let lastEnd = 0;
        for (const word of lyrics) {
            if (currentLine.length > 0 && (word.start - lastEnd > 1.5 || currentLine.length >= 10)) {
                lines.push(currentLine);
                currentLine = [];
            }
            currentLine.push(word);
            lastEnd = word.end;
        }
        if (currentLine.length > 0) lines.push(currentLine);
        return lines;
    }, [lyrics]);

    const activeLineIndex = React.useMemo(() => {
        if (lyricLines.length === 0) return -1;
        for (let i = 0; i < lyricLines.length; i++) {
            const line = lyricLines[i];
            if (currentTime >= line[0].start && currentTime <= line[line.length - 1].end) {
                return i;
            }
        }
        for (let i = 0; i < lyricLines.length; i++) {
            if (currentTime < lyricLines[i][0].start) {
                return Math.max(0, i - 1);
            }
        }
        return lyricLines.length - 1;
    }, [lyricLines, currentTime]);

    return (

        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            <Head>
        <title>Creator Studio - YouOke</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&family=Prompt:wght@400;700&family=Sarabun:wght@400;700&family=Mali:wght@400;700&family=Itim&display=swap" rel="stylesheet" />
    </Head>

            {/* Top Navigation Bar */}
            <header className="h-14 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/')}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="font-bold text-lg flex items-center gap-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">YouOke</span>
                        <span className="text-zinc-300 font-medium text-sm border-l border-zinc-700 pl-2">Creator Studio</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 hidden sm:inline-block">โปรเจกต์: {selectedSong ? selectedSong.title : 'ยังไม่เลือกเพลง'}</span>
                    <button 
                        onClick={handleExport}
                        disabled={lyrics.length === 0}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export Video
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* Center Canvas (Preview) */}
                <div className="flex-1 flex flex-col relative bg-black items-center justify-center overflow-hidden">
                    {!selectedSong ? (
                        <div className="max-w-4xl w-full mx-auto px-4 py-8 animate-in fade-in duration-500">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-3">
                                    YouOke Creator Hub
                                </h2>
                                <p className="text-zinc-400 text-sm max-w-lg mx-auto">
                                    เลือกช่องทางในการสร้างและเตรียมเพลงคาราโอเกะของคุณ 
                                    ระบบจะบันทึกผลงานโดยอัตโนมัติเพื่อให้คุณร้องเพลงได้อย่างราบรื่นที่สุด
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Card 1: Wiki Lyrics Studio */}
                                <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 hover:border-purple-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                                            <Sparkles className="text-purple-400 w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">1. สตูดิโอเนื้อร้องคลาวด์ (Wiki Studio)</h3>
                                        <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                                            จัดเรียงบรรทัดเนื้อเพลง ซิงค์จังหวะให้ตรง และปรับแต่งตำแหน่งแสดงผลแบบเรียลไทม์ เพื่อบันทึกเป็นฐานข้อมูล Wiki ให้ทุกคนร้องได้
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-3 mt-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider text-left">ใส่ลิงก์ YouTube หรือ Video ID</label>
                                            <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 focus-within:border-purple-500/50 transition-all">
                                                <input 
                                                    type="text" 
                                                    placeholder="เช่น https://www.youtube.com/watch?v=..."
                                                    value={ytUrl}
                                                    onChange={(e) => setYtUrl(e.target.value)}
                                                    className="bg-transparent text-sm text-zinc-200 px-3 py-2 w-full outline-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleGoToWikiStudio();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleGoToWikiStudio}
                                            className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-950/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FileText size={16} />
                                            เริ่มแต่งเนื้อร้อง
                                        </button>
                                    </div>
                                </div>

                                {/* Card 2: Local AI Separation */}
                                <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 hover:border-pink-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl group">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                                            <Music className="text-pink-400 w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">2. ถอดเสียงแยกคีย์ด้วย AI (Local Studio)</h3>
                                        <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                                            ตัดเสียงคนร้องออกจากดนตรี และให้ปัญญาประดิษฐ์แกะเนื้อหาทีละพยางค์โดยอัตโนมัติ (เหมาะสำหรับการใช้เสียงร้องคุณภาพสูง)
                                        </p>
                                    </div>
                                    
                                    <div className="mt-8">
                                        <button 
                                            onClick={() => setShowLibraryModal(true)}
                                            className="w-full bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 text-zinc-200 py-3.5 rounded-xl text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/20"
                                        >
                                            <Music size={16} className="text-pink-400" />
                                            เลือกเพลงจากคลัง Local
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center relative p-8">
                            {/* Fake Video Canvas Area */}
                            <div className="aspect-video w-full max-w-4xl bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 relative flex flex-col items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black/40 pointer-events-none" />
                                
                                {/* Lyrics Preview */}
                                <div className="z-10 text-center px-12 pb-16 w-full absolute bottom-0 flex flex-col items-center justify-end pointer-events-none">
                                    <div className="space-y-4 w-full flex flex-col items-center">
                                        {lyrics.length > 0 ? (
                                            [0, 1].map(position => {
                                                const baseIdx = Math.max(0, activeLineIndex);
                                                let lineIdx = position === 0 
                                                    ? (baseIdx % 2 === 0 ? baseIdx : baseIdx + 1)
                                                    : (baseIdx % 2 === 1 ? baseIdx : baseIdx + 1);

                                                if (lineIdx >= lyricLines.length) {
                                                    return <p key={`empty-${position}`} style={{ fontSize: `${fontSize}px`, opacity: 0 }}>&nbsp;</p>;
                                                }

                                                const line = lyricLines[lineIdx];
                                                const isActive = lineIdx === activeLineIndex;
                                                
                                                return (
                                                    <p key={lineIdx} 
                                                        style={{ 
                                                            fontSize: `${fontSize}px`, 
                                                            fontFamily: fontFamily,
                                                            WebkitTextStroke: `${fontOutline}px black`,
                                                        }}
                                                        className={clsx(
                                                        "font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] leading-relaxed transition-all duration-300",
                                                        isActive ? "opacity-100 scale-100" : "opacity-60 scale-95"
                                                    )}>
                                                        {line.map((l, i) => {
                                                            const isPast = currentTime > l.end;
                                                            const isCurrent = currentTime >= l.start && currentTime <= l.end;
                                                            return (
                                                                <span 
                                                                    key={i} 
                                                                    className={clsx(
                                                                        "transition-colors duration-100 mx-1",
                                                                        isPast ? "text-purple-400" : isCurrent ? "text-pink-400" : "text-white"
                                                                    )}
                                                                >
                                                                    {l.word}
                                                                </span>
                                                            )
                                                        })}
                                                    </p>
                                                )
                                            })
                                        ) : (
                                            <span className="text-zinc-600 text-3xl font-bold">ไม่มีเนื้อเพลง (กดสร้างเนื้อเพลงด้านขวา)</span>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute top-4 left-4 text-xs font-mono text-zinc-500">
                                    Canvas 1920x1080
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar (Properties) */}
                <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 hidden lg:flex">
                    {/* Tabs */}
                    <div className="flex border-b border-zinc-800 shrink-0">
                        <button 
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'properties' ? 'text-purple-400 border-b-2 border-purple-500 bg-zinc-900/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20'}`}
                            onClick={() => setActiveTab('properties')}
                        >
                            คุณสมบัติ
                        </button>
                        <button 
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'lyrics' ? 'text-purple-400 border-b-2 border-purple-500 bg-zinc-900/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20'}`}
                            onClick={() => setActiveTab('lyrics')}
                        >
                            เนื้อเพลง (${lyrics.length})
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'lyrics' ? (
                        <div className="p-4 pb-20">
                            {lyrics.length === 0 ? (
                                <p className="text-sm text-zinc-500 text-center py-8">ยังไม่มีเนื้อเพลง</p>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-[11px] text-zinc-500 mb-4 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                                        💡 <b>ทริค:</b> กดปุ่มโซ่เพื่อรวมคำที่ถูกตัดแยกกัน และสามารถพิมพ์แก้คำผิดได้โดยตรง
                                    </div>
                                    {lyrics.map((l, i) => (
                                        <div key={i} className="flex gap-2 items-center group">
                                            <div className="text-[10px] text-zinc-600 font-mono w-10 shrink-0 text-right">
                                                {formatTime(l.start)}
                                            </div>
                                            <input 
                                                value={l.word}
                                                onChange={(e) => handleWordChange(i, e.target.value)}
                                                onBlur={handleWordBlur}
                                                className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 px-3 py-1.5 rounded-lg w-full outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                            />
                                            {i < lyrics.length - 1 && (
                                                <button 
                                                    onClick={() => handleMergeNext(i)} 
                                                    className="p-1.5 text-zinc-500 hover:text-purple-400 hover:bg-purple-400/10 rounded transition-colors shrink-0"
                                                    title="รวมคำนี้เข้ากับคำถัดไป"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteWord(i)} 
                                                className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                                title="ลบคำนี้"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                        <div className="p-4 border-b border-zinc-800">
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">เพลงที่เลือก</label>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm truncate flex items-center justify-between cursor-pointer hover:border-zinc-700" onClick={() => setShowLibraryModal(true)}>
                                    <span className="truncate text-zinc-300">{selectedSong ? selectedSong.title : 'None'}</span>
                                    <FileAudio size={14} className="text-zinc-500 shrink-0" />
                                </div>
                            </div>

                            {selectedSong && (
                                <div>
                                    <label className="text-xs text-zinc-400 mb-1 block">แทร็กเสียงที่ใช้แก้ไข</label>
                                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                                        <button
                                            onClick={() => setAudioTrack('vocals')}
                                            className={clsx(
                                                "flex-1 py-1.5 text-xs font-medium rounded transition-colors",
                                                audioTrack === 'vocals' ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                                            )}
                                        >
                                            เสียงร้อง (Vocals)
                                        </button>
                                        <button
                                            onClick={() => setAudioTrack('instrumental')}
                                            className={clsx(
                                                "flex-1 py-1.5 text-xs font-medium rounded transition-colors",
                                                audioTrack === 'instrumental' ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                                            )}
                                        >
                                            ดนตรี (Backing)
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">AI Lyrics (ถอดเสียงร้อง)</label>
                                <button 
                                    onClick={handleTranscribe}
                                    disabled={isTranscribing || !selectedSong}
                                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {isTranscribing ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-zinc-400"></div> : <Mic size={16} className="text-purple-400" />}
                                    {isTranscribing ? 'กำลังประมวลผล...' : 'สร้างเนื้อเพลง (AI)'}
                                </button>
                                {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-b border-zinc-800">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">รูปแบบตัวอักษร</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                                <span className="text-xs text-zinc-400 flex-shrink-0 mr-2"><Type size={14} className="inline mr-1"/> Font</span>
                                <select 
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="bg-transparent text-xs text-white outline-none w-full text-right cursor-pointer"
                                >
                                    <option value="Sukhumvit Set">Sukhumvit Set (Default)</option>
                                    <option value="'Kanit', sans-serif">Kanit (คณิต)</option>
                                    <option value="'Prompt', sans-serif">Prompt (พร้อม)</option>
                                    <option value="'Sarabun', sans-serif">Sarabun (สารบรรณ)</option>
                                    <option value="'Mali', cursive">Mali (มะลิ)</option>
                                    <option value="'Itim', cursive">Itim (ไอติม)</option>
                                </select>
                            </div>
                            <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-400">ขนาดตัวอักษร ({fontSize}px)</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="24" max="100" 
                                    value={fontSize} 
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-400">ขนาดขอบ ({fontOutline}px)</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="10" step="0.5"
                                    value={fontOutline} 
                                    onChange={(e) => setFontOutline(Number(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                        </div>
                    </>
                    )}
                    </div>
                </div>
            </div>

            {/* Bottom Timeline */}
            <div className="h-48 border-t border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
                {/* Timeline Toolbar */}
                <div className="h-10 border-b border-zinc-800/50 flex items-center justify-between px-4 bg-zinc-900/30">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <button className="hover:text-white transition-colors p-1" onClick={togglePlay}>
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <span className="text-xs font-mono w-16">{formatTime(currentTime)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">ซูมคลื่นเสียง:</span>
                            <input 
                                type="range" 
                                min="10" max="300" 
                                value={zoom} 
                                onChange={handleZoomChange}
                                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Wavesurfer Area */}
                <div className="flex-1 relative bg-zinc-900 overflow-hidden p-2 flex flex-col justify-center">
                    {!selectedSong && (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm z-10">
                            ไม่มีแทร็กเสียง
                        </div>
                    )}
                    <div ref={containerRef} className="w-full"></div>
                </div>
            </div>

            {/* Library Modal */}
            {showLibraryModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white">เลือกเพลงจากคลัง</h2>
                            <button onClick={() => setShowLibraryModal(false)} className="text-zinc-500 hover:text-white">✕</button>
                        </div>
                        <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                            {songs.length === 0 ? (
                                <div className="text-center p-8 text-zinc-500">
                                    ไม่มีเพลงที่แยกเสียงไว้ในระบบ<br/>
                                    <span className="text-sm">ไปที่หน้าค้นหาและเปิดใช้งานปุ่ม "แยกเสียงร้อง" ก่อน</span>
                                </div>
                            ) : (
                                songs.map(song => (
                                    <div 
                                        key={song.video_id}
                                        onClick={() => handleSelectSong(song)}
                                        className="flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-xl cursor-pointer group transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:text-primary text-zinc-500">
                                            <Music size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-zinc-200 truncate">{song.title}</p>
                                            <p className="text-xs text-zinc-500">{song.mode} • {(song.size_mb).toFixed(1)} MB</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
