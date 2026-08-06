import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useWikiLyricsStore, WikiLyricsSync } from '@/modules/player/stores/useWikiLyricsStore';
import { useLyricsStore, LyricLine } from '@/modules/player/stores/useLyricsStore';
import YouTube from 'react-youtube';
import { Play, Pause, Save, ArrowLeft, RefreshCw } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

export default function StudioPage() {
    const router = useRouter();
    const { videoId } = router.query;
    const { user } = useAuthStore();
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [title, setTitle] = useState("Studio");
    const playerRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    
    // Tap to sync state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingIndex, setRecordingIndex] = useState(0);

    const { saveSync } = useWikiLyricsStore();
    const fetchLyrics = useLyricsStore(state => state.fetchLyrics);
    const originalLyrics = useLyricsStore(state => state.lyrics);

    useEffect(() => {
        if (!videoId || typeof videoId !== 'string') return;
        // Fetch base lyrics
        fetchLyrics(videoId, "Unknown Title");
    }, [videoId, fetchLyrics]);

    useEffect(() => {
        if (originalLyrics && originalLyrics.length > 0 && lyrics.length === 0) {
            setLyrics(originalLyrics);
        }
    }, [originalLyrics]);

    // Tracker
    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                    const time = playerRef.current.getCurrentTime();
                    setCurrentTime(time);
                    
                    // Update active line for display
                    if (lyrics.length > 0) {
                        let activeIdx = lyrics.findIndex((l, i) => {
                            const nextTime = lyrics[i+1]?.time || Infinity;
                            return time >= l.time && time < nextTime;
                        });
                        setActiveLineIndex(activeIdx);
                    }
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, lyrics]);

    const handleTap = () => {
        if (!isRecording) return;
        if (recordingIndex >= lyrics.length) {
            setIsRecording(false);
            return;
        }

        const newLyrics = [...lyrics];
        newLyrics[recordingIndex] = {
            ...newLyrics[recordingIndex],
            time: currentTime
        };
        setLyrics(newLyrics);
        setRecordingIndex(prev => prev + 1);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && isRecording && e.target === document.body) {
            e.preventDefault();
            handleTap();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRecording, recordingIndex, currentTime, lyrics]);

    const handleSave = async () => {
        if (!user) {
            useUIStore.getState().showConfirm({
                title: "เข้าสู่ระบบ",
                message: "คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถบันทึกเนื้อเพลงลงใน Wiki ได้",
                type: "warning",
                confirmText: "ตกลง",
                cancelText: "none",
                onConfirm: () => {}
            });
            return;
        }

        if (typeof videoId !== 'string') return;

        // Convert lyrics back to LRC string
        let lrcContent = "";
        for (const line of lyrics) {
            const min = Math.floor(line.time / 60).toString().padStart(2, '0');
            const sec = (line.time % 60).toFixed(2).padStart(5, '0');
            lrcContent += `[${min}:${sec}]${line.text}\n`;
        }

        try {
            await saveSync({
                videoId,
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                lrcContent,
                globalOffset: 0
            });

            useUIStore.getState().showConfirm({
                title: "บันทึกสำเร็จ",
                message: "ขอบคุณที่ร่วมแก้ไขเนื้อเพลงให้ดีขึ้น!",
                type: "success",
                confirmText: "กลับไปหน้าเล่นเพลง",
                cancelText: "ปิด",
                onConfirm: () => router.push('/')
            });
        } catch (err) {
            console.error("Save error", err);
            useUIStore.getState().showConfirm({
                title: "เกิดข้อผิดพลาด",
                message: "ไม่สามารถบันทึกเนื้อเพลงได้",
                type: "danger",
                confirmText: "ตกลง",
                cancelText: "none",
                onConfirm: () => {}
            });
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Head>
                <title>Wiki Studio - {title}</title>
            </Head>

            {/* Topbar */}
            <header className="h-16 px-6 flex items-center justify-between border-b border-white/10 shrink-0 bg-zinc-900/50">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg">Wiki Karaoke Studio</h1>
                        <p className="text-xs text-zinc-400">Editing: {videoId}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-primary rounded-full font-bold hover:bg-primary/80 transition-colors"
                >
                    <Save size={18} /> Publish to Wiki
                </button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Side: Video & Controls */}
                <div className="w-full md:w-1/2 p-4 flex flex-col gap-4 border-r border-white/10">
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 shadow-xl relative">
                        {videoId && (
                            <YouTube
                                videoId={videoId as string}
                                opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0, controls: 0 } }}
                                onReady={(e) => { playerRef.current = e.target; }}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="w-full h-full absolute inset-0"
                            />
                        )}
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 bg-zinc-900/50 p-4 rounded-xl">
                        <button
                            onClick={() => {
                                if (isPlaying) playerRef.current?.pauseVideo();
                                else playerRef.current?.playVideo();
                            }}
                            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center"
                        >
                            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                        </button>

                        <button
                            onClick={() => {
                                setIsRecording(!isRecording);
                                if (!isRecording && !isPlaying) {
                                    playerRef.current?.playVideo();
                                }
                            }}
                            className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white'}`}
                        >
                            {isRecording ? "🔴 Stop Recording (Tap Spacebar)" : "🎯 Start Tap-to-Sync"}
                        </button>
                        
                        <button
                            onClick={() => {
                                setLyrics(originalLyrics);
                                setRecordingIndex(0);
                                setIsRecording(false);
                            }}
                            className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center"
                            title="Reset to Original"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                    
                    {isRecording && (
                        <div className="mt-4 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                            <p className="text-blue-300 font-bold text-lg mb-2">Recording Mode Active</p>
                            <p className="text-zinc-400 mb-4">Press <kbd className="px-2 py-1 bg-zinc-800 rounded">Spacebar</kbd> or the button below when the active line starts playing.</p>
                            
                            <button
                                onClick={handleTap}
                                className="w-full h-24 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-2xl shadow-lg active:scale-95 transition-all"
                            >
                                TAP!
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side: Timeline Editor */}
                <div className="w-full md:w-1/2 overflow-y-auto p-4 flex flex-col gap-2 relative scroll-smooth" id="lyrics-container">
                    {lyrics.map((line, idx) => {
                        const isActive = isRecording ? idx === recordingIndex : idx === activeLineIndex;
                        const isDone = isRecording && idx < recordingIndex;
                        return (
                            <div 
                                key={idx}
                                className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${isActive ? 'bg-primary/20 border-primary scale-[1.02] shadow-lg shadow-primary/10' : isDone ? 'bg-white/5 border-white/10 text-white/50' : 'bg-transparent border-transparent text-white/80 hover:bg-white/5'}`}
                            >
                                <span className="font-mono text-sm min-w-[60px] text-zinc-400">
                                    {(line.time || 0).toFixed(2)}s
                                </span>
                                <input 
                                    className="flex-1 bg-transparent border-none outline-none text-lg"
                                    value={line.text}
                                    onChange={(e) => {
                                        const newLyrics = [...lyrics];
                                        newLyrics[idx].text = e.target.value;
                                        setLyrics(newLyrics);
                                    }}
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            const newLyrics = [...lyrics];
                                            newLyrics[idx].time = Math.max(0, newLyrics[idx].time - 0.1);
                                            setLyrics(newLyrics);
                                        }}
                                        className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center font-mono text-xs"
                                    >-0.1</button>
                                    <button 
                                        onClick={() => {
                                            const newLyrics = [...lyrics];
                                            newLyrics[idx].time = newLyrics[idx].time + 0.1;
                                            setLyrics(newLyrics);
                                        }}
                                        className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center font-mono text-xs"
                                    >+0.1</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
