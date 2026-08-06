import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useWikiLyricsStore, WikiLyricsSync } from '@/modules/player/stores/useWikiLyricsStore';
import { useLyricsStore, LyricLine } from '@/modules/player/stores/useLyricsStore';
import { usePlayerStore } from '@/modules/player/stores/usePlayerStore';
import YouTube from 'react-youtube';
import { Play, Pause, Save, ArrowLeft, RefreshCw, ZoomIn, ZoomOut, GripVertical } from 'lucide-react';
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
    const [duration, setDuration] = useState(300); // default 5 mins
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    
    // Tap to sync state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingIndex, setRecordingIndex] = useState(0);

    // Timeline state
    const timelineRef = useRef<HTMLDivElement>(null);
    const [pixelsPerSecond, setPixelsPerSecond] = useState(100);
    
    // Drag state
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const [startX, setStartX] = useState(0);
    const [startTime, setStartTime] = useState(0);

    const { saveSync } = useWikiLyricsStore();
    const fetchLyrics = useLyricsStore(state => state.fetchLyrics);
    const originalLyrics = useLyricsStore(state => state.lyrics);
    const currentVideo = usePlayerStore(state => state.currentVideo);

    useEffect(() => {
        if (!videoId || typeof videoId !== 'string') return;
        const songTitle = currentVideo?.title || "Unknown Title";
        fetchLyrics(videoId, songTitle);
    }, [videoId, currentVideo?.title, fetchLyrics]);

    useEffect(() => {
        if (originalLyrics && originalLyrics.length > 0 && lyrics.length === 0) {
            setLyrics(originalLyrics);
        }
    }, [originalLyrics]);

    // Tracker
    useEffect(() => {
        let interval: any;
        if (isPlaying || draggingIdx !== null) {
            interval = setInterval(() => {
                if (playerRef.current?.getCurrentTime && isPlaying) {
                    const time = playerRef.current.getCurrentTime();
                    setCurrentTime(time);
                    
                    if (playerRef.current?.getDuration) {
                        setDuration(playerRef.current.getDuration() || 300);
                    }
                    
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
    }, [isPlaying, lyrics, draggingIdx]);

    // Auto-scroll timeline
    useEffect(() => {
        if (isPlaying && timelineRef.current && draggingIdx === null) {
            const scrollLeft = currentTime * pixelsPerSecond - timelineRef.current.clientWidth / 2;
            // Only auto-scroll if it's off-center by a bit to avoid jitter
            if (Math.abs(timelineRef.current.scrollLeft - scrollLeft) > 10) {
                timelineRef.current.scrollLeft = scrollLeft;
            }
        }
    }, [currentTime, isPlaying, pixelsPerSecond, draggingIdx]);

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

    // Drag Logic
    const handlePointerDown = (e: React.PointerEvent, idx: number) => {
        e.preventDefault();
        setDraggingIdx(idx);
        setStartX(e.clientX);
        setStartTime(lyrics[idx].time);
    };

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (draggingIdx === null) return;
            const deltaX = e.clientX - startX;
            const deltaTime = deltaX / pixelsPerSecond;
            let newTime = Math.max(0, startTime + deltaTime);
            
            setLyrics(prev => {
                const next = [...prev];
                next[draggingIdx].time = newTime;
                return next;
            });
        };

        const handlePointerUp = () => {
            setDraggingIdx(null);
        };

        if (draggingIdx !== null) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        }

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [draggingIdx, startX, startTime, pixelsPerSecond]);

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
        <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
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
                    className="flex items-center gap-2 px-4 py-2 bg-primary rounded-full font-bold hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20"
                >
                    <Save size={18} /> Publish to Wiki
                </button>
            </header>

            {/* Top Half: Video & Controls */}
            <div className="flex-[0.6] flex flex-col md:flex-row gap-4 p-4 border-b border-white/10 bg-zinc-950/50 min-h-[40vh]">
                {/* Left: Video */}
                <div className="w-full md:w-2/3 h-full rounded-xl overflow-hidden bg-zinc-900 shadow-xl relative group border border-white/5">
                    {videoId && (
                        <YouTube
                            videoId={videoId as string}
                            opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0, controls: 0, cc_load_policy: 0, iv_load_policy: 3 } }}
                            onReady={(e) => { playerRef.current = e.target; }}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            className="w-full h-full absolute inset-0 pointer-events-none"
                        />
                    )}
                    
                    {/* Single-line Lyric Overlay */}
                    <div className="absolute bottom-8 left-0 right-0 px-8 text-center pointer-events-none z-20 flex flex-col items-center">
                        <span className="bg-black/80 px-6 py-3 rounded-2xl text-2xl md:text-3xl font-bold text-white mb-2 shadow-2xl border border-white/10" style={{ textShadow: '0px 2px 8px rgba(0,0,0,0.8)' }}>
                            {isRecording 
                                ? lyrics[recordingIndex]?.text || "..." 
                                : lyrics[activeLineIndex]?.text || ""}
                        </span>
                        {isRecording && <span className="text-yellow-400 font-bold text-sm bg-black/80 px-4 py-1.5 rounded-full border border-yellow-400/20 shadow-lg">บรรทัดที่จะถูกบันทึกเมื่อกด Spacebar</span>}
                    </div>
                </div>
                
                {/* Right: Controls */}
                <div className="w-full md:w-1/3 flex flex-col gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5 overflow-y-auto">
                    <h3 className="font-bold text-lg text-white mb-2">Sync Controls</h3>
                    
                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <button
                            onClick={() => {
                                if (isPlaying) playerRef.current?.pauseVideo();
                                else playerRef.current?.playVideo();
                            }}
                            className="w-14 h-14 bg-white hover:scale-105 active:scale-95 text-black rounded-full flex items-center justify-center transition-transform shadow-lg shadow-white/10 shrink-0"
                        >
                            {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                        </button>
                        <div>
                            <p className="font-mono text-xl font-bold text-white">{currentTime.toFixed(2)}s</p>
                            <p className="text-xs text-zinc-400">Play/Pause to test sync</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                        <button
                            onClick={() => {
                                setIsRecording(!isRecording);
                                if (!isRecording && !isPlaying) {
                                    playerRef.current?.playVideo();
                                }
                            }}
                            className={`px-6 py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/15'}`}
                        >
                            <span className="flex items-center gap-2 text-lg">
                                {isRecording ? "🔴 STOP RECORDING" : "🎯 START TAP-TO-SYNC"}
                            </span>
                            <span className="text-xs font-normal opacity-70">
                                {isRecording ? "Press Spacebar to mark each line" : "Or drag blocks on the timeline below"}
                            </span>
                        </button>
                        
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => setPixelsPerSecond(prev => Math.max(20, prev - 20))}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm text-zinc-300"
                            >
                                <ZoomOut size={16} /> ซูมออก
                            </button>
                            <button
                                onClick={() => setPixelsPerSecond(prev => Math.min(300, prev + 20))}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm text-zinc-300"
                            >
                                <ZoomIn size={16} /> ซูมเข้า
                            </button>
                            <button
                                onClick={() => {
                                    setLyrics(originalLyrics);
                                    setRecordingIndex(0);
                                    setIsRecording(false);
                                }}
                                className="w-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-zinc-300 transition-colors"
                                title="Reset to Original"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Half: Horizontal Timeline */}
            <div 
                className="flex-[0.4] bg-zinc-950 relative overflow-x-auto overflow-y-hidden select-none border-t border-white/5 custom-scrollbar" 
                ref={timelineRef}
            >
                {/* Timeline Track Container */}
                <div 
                    className="relative h-full min-h-[200px]" 
                    style={{ width: `${Math.max(duration, 300) * pixelsPerSecond}px` }}
                    onClick={(e) => {
                        // Click to seek
                        if (e.target === e.currentTarget && playerRef.current) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const newTime = x / pixelsPerSecond;
                            playerRef.current.seekTo(newTime, true);
                        }
                    }}
                >
                    {/* Time Scale Markers (Every 5 seconds) */}
                    {Array.from({ length: Math.ceil(Math.max(duration, 300) / 5) }).map((_, i) => (
                        <div 
                            key={`marker-${i}`}
                            className="absolute top-0 bottom-0 border-l border-white/5 pointer-events-none flex flex-col"
                            style={{ left: `${i * 5 * pixelsPerSecond}px` }}
                        >
                            <span className="text-[10px] text-zinc-500 p-1 font-mono">{i * 5}s</span>
                        </div>
                    ))}

                    {/* Playhead (Red Line) */}
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        style={{ left: `${currentTime * pixelsPerSecond}px` }}
                    >
                        <div className="w-3 h-3 bg-red-500 rounded-full absolute top-0 -left-[5px] shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                    </div>

                    {/* Lyric Blocks */}
                    {lyrics.map((line, idx) => {
                        const nextTime = lyrics[idx+1]?.time || (line.time + 3);
                        const width = Math.max((nextTime - line.time) * pixelsPerSecond, 50); // min width 50px
                        const left = line.time * pixelsPerSecond;
                        const isActive = isRecording ? idx === recordingIndex : idx === activeLineIndex;
                        const isDone = isRecording && idx < recordingIndex;
                        
                        return (
                            <div 
                                key={`block-${idx}`}
                                className={`absolute top-10 h-14 rounded-lg flex overflow-hidden transition-colors z-20
                                    ${isActive ? 'bg-primary/40 border-2 border-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]' : 
                                      isDone ? 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-400' : 
                                      'bg-zinc-800/80 border border-white/10 hover:border-white/30 text-white'}`}
                                style={{ 
                                    left: `${left}px`, 
                                    width: `${width - 4}px`, // Add slight margin between blocks
                                    cursor: draggingIdx === idx ? 'grabbing' : 'default',
                                    transform: draggingIdx === idx ? 'scale(1.02)' : 'scale(1)',
                                    zIndex: draggingIdx === idx ? 50 : (isActive ? 30 : 20)
                                }}
                            >
                                {/* Drag Handle */}
                                <div 
                                    className="w-6 h-full bg-black/20 hover:bg-black/40 cursor-ew-resize flex items-center justify-center border-r border-black/20 shrink-0"
                                    onPointerDown={(e) => handlePointerDown(e, idx)}
                                >
                                    <GripVertical size={14} className="opacity-50" />
                                </div>
                                
                                {/* Text Input */}
                                <input 
                                    className={`bg-transparent outline-none w-full h-full px-3 text-sm font-medium
                                        ${isDone ? 'text-zinc-400' : 'text-white'}`}
                                    value={line.text}
                                    onChange={(e) => {
                                        const next = [...lyrics];
                                        next[idx].text = e.target.value;
                                        setLyrics(next);
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag when focusing input
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 12px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #09090b; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a; 
                    border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46; 
                }
            `}</style>
        </div>
    );
}
