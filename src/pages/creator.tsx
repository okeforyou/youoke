import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getActiveBridgeBaseUrl, useAIVocalStore } from '../stores/useAIVocalStore';
import { 
    Mic, Play, Pause, Save, Download, Video, Music, 
    ArrowLeft, Settings, Maximize, Type, UploadCloud, FileAudio 
} from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { clsx } from 'clsx';
import { useUIStore } from '@/stores/useUIStore';

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
    const router = useRouter();
    const { deepgramKey } = useAIVocalStore();
    
    // States
    const [songs, setSongs] = useState<CachedSong[]>([]);
    const [selectedSong, setSelectedSong] = useState<CachedSong | null>(null);
    const [lyrics, setLyrics] = useState<LyricWord[]>([]);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState('');
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    
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

    const handleSelectSong = async (song: CachedSong) => {
        setSelectedSong(song);
        setLyrics([]);
        setError('');
        setShowLibraryModal(false);
        
        if (wavesurfer.current) {
            wavesurfer.current.destroy();
        }

        const baseUrl = await getActiveBridgeBaseUrl();
        if (!baseUrl) return;

        // Initialize WaveSurfer after a short delay to ensure DOM is ready
        setTimeout(() => {
            if (containerRef.current) {
                const ws = WaveSurfer.create({
                    container: containerRef.current,
                    waveColor: '#6366f1', // Indigo
                    progressColor: '#a855f7', // Purple
                    cursorColor: '#f43f5e', // Rose
                    barWidth: 2,
                    barGap: 2,
                    barRadius: 2,
                    height: 100,
                    url: `${baseUrl}/files/${song.video_id}/vocals.m4a`,
                    normalize: true,
                });
                
                const wsReg = ws.registerPlugin(RegionsPlugin.create());
                
                ws.on('play', () => setIsPlaying(true));
                ws.on('pause', () => setIsPlaying(false));
                ws.on('timeupdate', (time) => setCurrentTime(time));
                
                wsReg.on('region-updated', (region: any) => {
                    setLyrics(prev => {
                        const newLyrics = [...prev];
                        const idx = newLyrics.findIndex(l => l.word === region.content.innerText);
                        if (idx !== -1) {
                            newLyrics[idx].start = region.start;
                            newLyrics[idx].end = region.end;
                        }
                        return newLyrics;
                    });
                });

                wavesurfer.current = ws;
                wsRegions.current = wsReg;
            }
        }, 100);
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
                    alert("กรุณากดกลับไปหน้าแรก แล้วเปิดเมนูตั้งค่า -> แท็บ AI ครับ");
                }
            });
            return;
        }

        setIsTranscribing(true);
        setError('');
        try {
            const baseUrl = await getActiveBridgeBaseUrl();
            const res = await fetch(`${baseUrl}/transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: selectedSong.video_id,
                    api_key: deepgramKey,
                    provider: 'deepgram'
                })
            });

            if (res.ok) {
                const data = await res.json();
                setLyrics(data.words);
                
                if (wsRegions.current) {
                    wsRegions.current.clearRegions();
                    data.words.forEach((word: LyricWord) => {
                        wsRegions.current.addRegion({
                            start: word.start,
                            end: word.end,
                            content: word.word,
                            color: 'rgba(168, 85, 247, 0.3)', // purple with opacity
                            drag: true,
                            resize: true
                        });
                    });
                }
            } else {
                const errData = await res.json();
                setError(errData.detail || 'Transcription failed');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleExport = async () => {
        alert("Exporting MP4 (FFmpeg process will run on Local Bridge) - Coming in next step!");
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            <Head><title>Creator Studio - YouOke</title></Head>

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
                        <div className="text-center p-8">
                            <h2 className="text-2xl font-bold text-zinc-400 mb-4">เริ่มต้นสร้างคาราโอเกะ</h2>
                            <p className="text-zinc-500 mb-8 text-sm">ดึงเพลงที่เคยแยกเสียงร้องไว้ในระบบมาทำคาราโอเกะได้ทันที</p>
                            <button 
                                onClick={() => setShowLibraryModal(true)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl shadow-lg border border-zinc-700 transition-colors flex items-center gap-3 mx-auto"
                            >
                                <Music className="text-purple-400" />
                                เลือกเพลงจากคลัง (Library)
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center relative p-8">
                            {/* Fake Video Canvas Area */}
                            <div className="aspect-video w-full max-w-4xl bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 relative flex flex-col items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black/40 pointer-events-none" />
                                
                                {/* Lyrics Preview */}
                                <div className="z-10 text-center px-12 pb-16 w-full absolute bottom-0">
                                    <p className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-relaxed">
                                        {lyrics.length > 0 ? (
                                            // Find current word based on time
                                            lyrics.map((l, i) => {
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
                                            })
                                        ) : (
                                            <span className="text-zinc-600">ไม่มีเนื้อเพลง (กดสร้างเนื้อเพลงด้านขวา)</span>
                                        )}
                                    </p>
                                </div>

                                <div className="absolute top-4 left-4 text-xs font-mono text-zinc-500">
                                    Canvas 1920x1080
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar (Properties) */}
                <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 overflow-y-auto hidden lg:flex">
                    <div className="p-4 border-b border-zinc-800">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">คุณสมบัติโปรเจกต์</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">เพลงที่เลือก</label>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm truncate flex items-center justify-between cursor-pointer hover:border-zinc-700" onClick={() => setShowLibraryModal(true)}>
                                    <span className="truncate text-zinc-300">{selectedSong ? selectedSong.title : 'None'}</span>
                                    <FileAudio size={14} className="text-zinc-500 shrink-0" />
                                </div>
                            </div>
                            
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
                                <span className="text-xs text-zinc-400"><Type size={14} className="inline mr-2"/> Font</span>
                                <span className="text-xs text-white">Sukhumvit Set</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800 flex items-center justify-between">
                                    <span className="text-xs text-zinc-400">ขนาด</span>
                                    <span className="text-xs text-white">72px</span>
                                </div>
                                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800 flex items-center justify-between">
                                    <span className="text-xs text-zinc-400">ขอบ</span>
                                    <span className="text-xs text-white">3px</span>
                                </div>
                            </div>
                        </div>
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
                    <div className="text-xs text-zinc-500">
                        ลากขอบซ้าย-ขวาของกรอบเนื้อเพลงเพื่อปรับจังหวะให้ตรง
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
