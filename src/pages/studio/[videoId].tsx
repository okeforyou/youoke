import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useWikiLyricsStore, WikiLyricsSync } from '@/modules/player/stores/useWikiLyricsStore';
import { useLyricsStore, LyricLine } from '@/modules/player/stores/useLyricsStore';
import { usePlayerStore } from '@/modules/player/stores/usePlayerStore';
import YouTube from 'react-youtube';
import { Play, Pause, Save, ArrowLeft, RefreshCw, ZoomIn, ZoomOut, GripVertical, Settings2, Link, Trash2, Plus, FileText, X } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

export default function StudioPage() {
    const router = useRouter();
    const { videoId } = router.query;
    const { user } = useAuthStore();
    const [error, setError] = useState<string | null>(null);
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [rawText, setRawText] = useState('');
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [title, setTitle] = useState("Studio");
    const playerRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(300);
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    
    // Tap to sync state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingIndex, setRecordingIndex] = useState(0);

    // Timeline state
    const timelineRef = useRef<HTMLDivElement>(null);
    const [pixelsPerSecond, setPixelsPerSecond] = useState(100);
    const [isRippleEdit, setIsRippleEdit] = useState(false);
    
    // Drag state
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const [dragAction, setDragAction] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
    const [startX, setStartX] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [startEndTime, setStartEndTime] = useState(0);
    const [initialDragLyrics, setInitialDragLyrics] = useState<LyricLine[]>([]);

    // Style Customizations (Karadeo style)
    const [hasBackground, setHasBackground] = useState(false);
    const [fontSize, setFontSize] = useState(36);
    const [outlineThickness, setOutlineThickness] = useState(3);
    const [lyricPos, setLyricPos] = useState({ x: 50, y: 85 });
    const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
    const overlayDragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
    const videoContainerRef = useRef<HTMLDivElement>(null);

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
            // Populate endTime if missing
            const populated = originalLyrics.map((l, i) => {
                if (l.endTime !== undefined) return l;
                const nextTime = originalLyrics[i+1]?.time || (l.time + 3);
                return { ...l, endTime: nextTime };
            });
            setLyrics(populated);
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
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, lyrics, draggingIdx]);

    // Lyric Overlay Drag Logic
    useEffect(() => {
        const handleMove = (e: PointerEvent) => {
            if (!isDraggingOverlay || !videoContainerRef.current) return;
            const rect = videoContainerRef.current.getBoundingClientRect();
            
            const pointerPctX = ((e.clientX - rect.left) / rect.width) * 100;
            const pointerPctY = ((e.clientY - rect.top) / rect.height) * 100;
            
            setLyricPos({
                x: Math.max(10, Math.min(90, pointerPctX)),
                y: Math.max(10, Math.min(90, pointerPctY))
            });
        };
        
        const handleUp = () => {
            setIsDraggingOverlay(false);
        };

        if (isDraggingOverlay) {
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
        }

        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
    }, [isDraggingOverlay]);

    // Keep activeLineIndex in sync with currentTime
    useEffect(() => {
        if (lyrics.length > 0) {
            let activeIdx = lyrics.findIndex((l) => {
                const end = l.endTime || (l.time + 3);
                return currentTime >= l.time && currentTime < end;
            });
            setActiveLineIndex(activeIdx);
        }
    }, [currentTime, lyrics]);

    // Auto-scroll
    useEffect(() => {
        if (isPlaying && timelineRef.current && draggingIdx === null) {
            const scrollLeft = currentTime * pixelsPerSecond - timelineRef.current.clientWidth / 2;
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
        const oldTime = newLyrics[recordingIndex].time;
        const oldEndTime = newLyrics[recordingIndex].endTime || (oldTime + 3);
        const blockDuration = oldEndTime - oldTime;
        
        newLyrics[recordingIndex] = {
            ...newLyrics[recordingIndex],
            time: currentTime,
            endTime: currentTime + blockDuration
        };
        
        if (recordingIndex > 0) {
            const prev = newLyrics[recordingIndex - 1];
            if (prev.endTime && prev.endTime > currentTime) {
                newLyrics[recordingIndex - 1].endTime = currentTime;
            }
        }
        
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
    const handlePointerDown = (e: React.PointerEvent, idx: number, action: 'move' | 'resize-right' | 'resize-left') => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingIdx(idx);
        setDragAction(action);
        setStartX(e.clientX);
        setStartTime(lyrics[idx].time);
        setStartEndTime(lyrics[idx].endTime || (lyrics[idx].time + 3));
        setInitialDragLyrics(lyrics.map(l => ({...l})));
    };

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (draggingIdx === null || !dragAction || initialDragLyrics.length === 0) return;
            const deltaX = e.clientX - startX;
            const deltaTime = deltaX / pixelsPerSecond;
            
            setLyrics(() => {
                const next = initialDragLyrics.map(l => ({...l}));
                const line = next[draggingIdx];
                const nextLineTime = next[draggingIdx + 1]?.time || Infinity;
                const prevLineEndTime = draggingIdx > 0 ? (next[draggingIdx - 1]?.endTime || 0) : 0;
                
                if (dragAction === 'move') {
                    const blockDuration = startEndTime - startTime;
                    let newTime = Math.max(0, startTime + deltaTime);
                    const actualDelta = newTime - startTime;
                    
                    line.time = newTime;
                    line.endTime = newTime + blockDuration;
                    
                    // Ripple Edit
                    if (isRippleEdit || e.shiftKey) {
                        for (let i = draggingIdx + 1; i < next.length; i++) {
                            const dur = (next[i].endTime || (next[i].time + 3)) - next[i].time;
                            next[i].time = Math.max(0, next[i].time + actualDelta);
                            next[i].endTime = next[i].time + dur;
                        }
                    }
                } else if (dragAction === 'resize-left') {
                    let newTime = Math.max(0, startTime + deltaTime);
                    newTime = Math.min(newTime, startEndTime - 0.2); // Min duration 0.2s
                    line.time = newTime;
                } else if (dragAction === 'resize-right') {
                    let newEnd = Math.max(startTime + 0.2, startEndTime + deltaTime); // Min duration 0.2s
                    line.endTime = newEnd;
                }
                
                return next;
            });
        };

        const handlePointerUp = () => {
            setDraggingIdx(null);
            setDragAction(null);
            setInitialDragLyrics([]);
        };

        if (draggingIdx !== null) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        }

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [draggingIdx, dragAction, startX, startTime, startEndTime, pixelsPerSecond, isRippleEdit, initialDragLyrics]);

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
        for (let i = 0; i < lyrics.length; i++) {
            const line = lyrics[i];
            const min = Math.floor(line.time / 60).toString().padStart(2, '0');
            const sec = (line.time % 60).toFixed(2).padStart(5, '0');
            lrcContent += `[${min}:${sec}]${line.text}\n`;
            
            // Insert blank line if there's a gap before the next line
            if (line.endTime) {
                const nextTime = lyrics[i+1]?.time || Infinity;
                if (line.endTime < nextTime - 0.1) {
                    const endMin = Math.floor(line.endTime / 60).toString().padStart(2, '0');
                    const endSec = (line.endTime % 60).toFixed(2).padStart(5, '0');
                    lrcContent += `[${endMin}:${endSec}] \n`;
                }
            }
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

    const handleAddBlock = () => {
        const newBlock: LyricLine = {
            time: currentTime,
            endTime: currentTime + 3,
            text: "เนื้อร้องใหม่"
        };
        const next = [...lyrics, newBlock].sort((a, b) => a.time - b.time);
        setLyrics(next);
    };

    const handlePasteRaw = () => {
        if (!rawText.trim()) return;
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        let currentOffset = 0;
        const newLyrics: LyricLine[] = lines.map((text) => {
            const block = {
                time: currentOffset,
                endTime: currentOffset + 3,
                text
            };
            currentOffset += 3.5; // space them out
            return block;
        });

        // Ask for confirmation if there are already lyrics
        if (lyrics.length > 0) {
            if (!confirm("คุณต้องการวางทับเนื้อเพลงเดิมทั้งหมดใช่หรือไม่?")) {
                return;
            }
        }
        
        setLyrics(newLyrics);
        setShowPasteModal(false);
        setRawText('');
    };

    return (
        <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
            <Head>
                <title>Wiki Studio - {title}</title>
            </Head>

            {/* Topbar */}
            <header className="h-14 px-6 flex items-center justify-between border-b border-white/10 shrink-0 bg-zinc-900/50">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="font-bold text-sm">Wiki Karaoke Studio</h1>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-1.5 bg-primary rounded-full font-bold hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20 text-sm"
                >
                    <Save size={16} /> Publish
                </button>
            </header>

            {/* Main Workspace (Split into left player and right sidebar) */}
            <div className="flex-1 flex min-h-0 bg-zinc-950/80">
                {/* Left: Player Area */}
                <div className="flex-1 flex flex-col p-4 justify-center items-center min-w-0">
                    <div 
                        ref={videoContainerRef}
                        className="w-full max-w-5xl aspect-video max-h-full rounded-xl overflow-hidden bg-zinc-900 shadow-xl relative group border border-white/5"
                    >
                        {videoId && (
                            <div className="absolute inset-0 z-0 pointer-events-none">
                                <YouTube
                                    videoId={videoId as string}
                                    opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0, controls: 0, cc_load_policy: 3, iv_load_policy: 3, disablekb: 1 } }}
                                    onReady={(e) => { 
                                        playerRef.current = e.target; 
                                        try {
                                            e.target.unloadModule("captions");
                                            e.target.unloadModule("cc");
                                        } catch (err) {}
                                    }}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onStateChange={(e) => {
                                        try {
                                            e.target.unloadModule("captions");
                                            e.target.unloadModule("cc");
                                        } catch(err) {}
                                    }}
                                    className="w-full h-full"
                                />
                            </div>
                        )}

                        {/* Lyric Overlay (Inside video container to scale with the video) */}
                        <div 
                            className={`absolute pointer-events-auto z-20 flex flex-col items-center px-4 cursor-move transition-transform select-none
                                ${isDraggingOverlay ? 'scale-105' : ''}`}
                            style={{ 
                                left: `${lyricPos.x}%`, 
                                top: `${lyricPos.y}%`, 
                                transform: 'translate(-50%, -50%)',
                                touchAction: 'none'
                            }}
                            onPointerDown={(e) => {
                                e.preventDefault(); // Prevent native text dragging
                                setIsDraggingOverlay(true);
                            }}
                        >
                            {(() => {
                                let displayLyric = "";
                                let isFaded = false;
                                
                                if (isRecording) {
                                    displayLyric = lyrics[recordingIndex]?.text || "";
                                } else {
                                    if (activeLineIndex !== -1) {
                                        displayLyric = lyrics[activeLineIndex]?.text || "";
                                    } else {
                                        // Find next upcoming lyric (sort by time to be safe)
                                        const upcoming = [...lyrics].sort((a,b) => a.time - b.time).find(l => l.time > currentTime);
                                        if (upcoming) {
                                            displayLyric = upcoming.text;
                                            isFaded = true;
                                        }
                                    }
                                }

                                if (!displayLyric) return null;

                                return (
                                    <div 
                                        className={`px-6 py-2 transition-all duration-200 text-center tracking-wide font-extrabold text-white
                                            ${isFaded ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
                                            ${hasBackground ? 'bg-black/80 rounded-2xl border border-white/10 shadow-2xl' : ''}`} 
                                        style={{ 
                                            fontSize: `${fontSize}px`,
                                            lineHeight: '1.2',
                                            textShadow: hasBackground ? 'none' : `
                                                ${outlineThickness}px ${outlineThickness}px 0 #000, 
                                                -${outlineThickness}px -${outlineThickness}px 0 #000, 
                                                ${outlineThickness}px -${outlineThickness}px 0 #000, 
                                                -${outlineThickness}px ${outlineThickness}px 0 #000, 
                                                0 ${outlineThickness}px 0 #000, 
                                                0 -${outlineThickness}px 0 #000, 
                                                ${outlineThickness}px 0 0 #000, 
                                                -${outlineThickness}px 0 0 #000, 
                                                0px 4px 12px rgba(0,0,0,0.8)`
                                        }}
                                    >
                                        {displayLyric}
                                    </div>
                                );
                            })()}
                            {isRecording && <span className="text-yellow-400 font-bold text-sm bg-black/90 px-4 py-1.5 rounded-full border border-yellow-400/20 shadow-lg mt-3 z-10">บรรทัดที่จะถูกบันทึกเมื่อกด Spacebar</span>}
                        </div>
                    </div>
                </div>

                {/* Right: Styles Panel (Sidebar like Karadeo) */}
                <div className="w-80 shrink-0 border-l border-white/10 bg-zinc-900/50 flex flex-col z-20 overflow-y-auto custom-scrollbar p-6">
                    <h2 className="font-bold text-sm text-zinc-400 mb-6 uppercase tracking-wider">Style Settings</h2>
                    
                    {/* Background Toggle */}
                    <div className="mb-6">
                        <label className="text-sm font-medium text-zinc-300 block mb-2">Lyric Background</label>
                        <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
                            <button 
                                onClick={() => setHasBackground(false)}
                                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${!hasBackground ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                            >
                                Text Outline
                            </button>
                            <button 
                                onClick={() => setHasBackground(true)}
                                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${hasBackground ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                            >
                                Dark Box
                            </button>
                        </div>
                    </div>

                    {/* Position Tip */}
                    <div className="mb-6 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm text-blue-200">
                        <p className="flex items-center gap-2 font-medium mb-1"><GripVertical size={14} /> Drag to Move</p>
                        <p className="text-xs text-blue-300/80 leading-relaxed">
                            คุณสามารถใช้เมาส์ลากที่ตัวข้อความเนื้อเพลงบนวิดีโอเพื่อปรับตำแหน่งได้อย่างอิสระ
                        </p>
                        <button 
                            onClick={() => setLyricPos({ x: 50, y: 85 })} 
                            className="mt-2 px-3 py-1 bg-black/40 hover:bg-black/60 rounded text-xs transition-colors"
                        >
                            รีเซ็ตตำแหน่ง
                        </button>
                    </div>
                    
                    {/* Font Size Slider */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-zinc-300">Font Size</label>
                            <span className="text-xs font-mono text-zinc-500">{fontSize}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="24" 
                            max="64" 
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="w-full accent-primary bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer" 
                        />
                    </div>

                    {/* Text Stroke Slider */}
                    {!hasBackground && (
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-zinc-300">Outline Thickness</label>
                                <span className="text-xs font-mono text-zinc-500">{outlineThickness}px</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="6" 
                                value={outlineThickness}
                                onChange={(e) => setOutlineThickness(Number(e.target.value))}
                                className="w-full accent-primary bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer" 
                            />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Toolbar */}
            <div className="h-14 shrink-0 bg-zinc-900 border-y border-white/10 px-4 flex items-center justify-between z-30 shadow-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (isPlaying) playerRef.current?.pauseVideo();
                            else playerRef.current?.playVideo();
                        }}
                        className="w-10 h-10 bg-white hover:scale-105 active:scale-95 text-black rounded-full flex items-center justify-center transition-transform shadow-lg shadow-white/10 shrink-0"
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                    </button>
                    <span className="font-mono text-lg font-bold text-white min-w-[80px]">{currentTime.toFixed(2)}s</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPasteModal(true)}
                        className="px-3 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all text-sm flex items-center gap-2"
                        title="วางเนื้อเพลงดิบ (Raw Text)"
                    >
                        <FileText size={16} /> <span className="hidden sm:inline">นำเข้าเนื้อเพลง</span>
                    </button>
                    <button
                        onClick={handleAddBlock}
                        className="px-3 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all text-sm flex items-center gap-2"
                        title="เพิ่มกล่องใหม่ ณ เวลาปัจจุบัน"
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">เพิ่มบรรทัด</span>
                    </button>
                    <button
                        onClick={() => setIsRippleEdit(!isRippleEdit)}
                        className={`px-4 py-1.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 text-sm ${isRippleEdit ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-zinc-300 hover:bg-white/15'}`}
                        title="ลากขยับพร้อมกันทั้งกลุ่ม (หรือกด Shift ค้างตอนลาก)"
                    >
                        <Link size={16} /> <span className="hidden sm:inline">Ripple</span>
                    </button>
                    <button
                        onClick={() => {
                            setIsRecording(!isRecording);
                            if (!isRecording && !isPlaying) {
                                playerRef.current?.playVideo();
                            }
                        }}
                        className={`px-4 py-1.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 text-sm ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/15'}`}
                    >
                        {isRecording ? "🔴 STOP (Spacebar)" : "🎯 START TAP-TO-SYNC"}
                    </button>
                </div>
                
                <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                    <button
                        onClick={() => setPixelsPerSecond(prev => Math.max(20, prev - 20))}
                        className="px-3 py-1.5 hover:bg-white/10 rounded flex items-center gap-2 text-xs text-zinc-300 transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                    <button
                        onClick={() => setPixelsPerSecond(prev => Math.min(300, prev + 20))}
                        className="px-3 py-1.5 hover:bg-white/10 rounded flex items-center gap-2 text-xs text-zinc-300 transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn size={16} />
                    </button>
                    <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                    <button
                        onClick={() => {
                            setLyrics(originalLyrics);
                            setRecordingIndex(0);
                            setIsRecording(false);
                        }}
                        className="px-3 py-1.5 hover:bg-white/10 rounded flex items-center text-zinc-300 transition-colors"
                        title="Reset to Original"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Bottom Half: Horizontal Timeline */}
            <div 
                className="h-32 shrink-0 bg-zinc-950 relative overflow-x-auto overflow-y-hidden select-none custom-scrollbar border-t border-white/5" 
                ref={timelineRef}
            >
                {/* Timeline Track Container */}
                <div 
                    className="relative h-full" 
                    style={{ width: `${Math.max(duration, 300) * pixelsPerSecond}px` }}
                    onClick={(e) => {
                        // Click to seek (only if clicking the background, not the blocks)
                        if (e.target === e.currentTarget && playerRef.current) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const newTime = Math.max(0, x / pixelsPerSecond);
                            playerRef.current.seekTo(newTime, true);
                            setCurrentTime(newTime);
                        }
                    }}
                >
                    {/* Time Scale Markers */}
                    {Array.from({ length: Math.ceil(Math.max(duration, 300) / 5) }).map((_, i) => (
                        <div 
                            key={`marker-${i}`}
                            className="absolute top-0 bottom-0 border-l border-white/10 pointer-events-none flex flex-col"
                            style={{ left: `${i * 5 * pixelsPerSecond}px` }}
                        >
                            <span className="text-[10px] text-zinc-500 px-1 py-0.5 font-mono bg-zinc-950/80 rounded-br">{i * 5}s</span>
                        </div>
                    ))}
                    
                    {/* Minor Scale Markers */}
                    {Array.from({ length: Math.ceil(Math.max(duration, 300)) }).map((_, i) => (
                        i % 5 !== 0 && (
                            <div 
                                key={`minor-${i}`}
                                className="absolute top-0 h-2 border-l border-white/5 pointer-events-none"
                                style={{ left: `${i * pixelsPerSecond}px` }}
                            ></div>
                        )
                    ))}

                    {/* Playhead (Red Line) */}
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        style={{ left: `${currentTime * pixelsPerSecond}px` }}
                    >
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500 absolute top-0 -left-[5px]"></div>
                    </div>

                    {/* Lyric Blocks */}
                    {lyrics.map((line, idx) => {
                        const endTime = line.endTime || (line.time + 3);
                        const width = Math.max((endTime - line.time) * pixelsPerSecond, 30); // min width 30px
                        const left = line.time * pixelsPerSecond;
                        const isActive = isRecording ? idx === recordingIndex : idx === activeLineIndex;
                        const isDone = isRecording && idx < recordingIndex;
                        
                        return (
                            <div 
                                key={`block-${idx}`}
                                className={`absolute top-4 h-16 rounded-md flex overflow-hidden transition-colors z-20 group
                                    ${isActive ? 'bg-primary/40 border border-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]' : 
                                      isDone ? 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-400' : 
                                      'bg-zinc-800/80 border border-white/10 hover:border-white/30 text-white'}`}
                                style={{ 
                                    left: `${left}px`, 
                                    width: `${width}px`,
                                    cursor: draggingIdx === idx && dragAction === 'move' ? 'grabbing' : 'default',
                                    zIndex: draggingIdx === idx ? 50 : (isActive ? 30 : 20)
                                }}
                            >
                                {/* Left Drag Handle (Move Block) */}
                                <div 
                                    className="w-4 h-full bg-black/30 hover:bg-black/50 cursor-grab active:cursor-grabbing flex items-center justify-center border-r border-black/20 shrink-0"
                                    onPointerDown={(e) => handlePointerDown(e, idx, 'move')}
                                >
                                    <GripVertical size={12} className="opacity-50" />
                                </div>
                                
                                {/* Text Input */}
                                <input 
                                    className={`bg-transparent outline-none w-full h-full px-2 text-sm font-medium
                                        ${isDone ? 'text-zinc-400' : 'text-white'}`}
                                    value={line.text}
                                    onChange={(e) => {
                                        const next = [...lyrics];
                                        next[idx].text = e.target.value;
                                        setLyrics(next);
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag when focusing input
                                />
                                
                                {/* Delete Button (appears on hover) */}
                                <button
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`ลบเนื้อร้อง "${line.text}" ใช่ไหม?`)) {
                                            const next = [...lyrics];
                                            next.splice(idx, 1);
                                            setLyrics(next);
                                        }
                                    }}
                                >
                                    <X size={12} />
                                </button>
                                
                                {/* Right Drag Handle (Resize Duration) */}
                                <div 
                                    className="w-4 h-full bg-white/5 hover:bg-white/20 cursor-ew-resize flex items-center justify-center border-l border-white/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onPointerDown={(e) => handlePointerDown(e, idx, 'resize-right')}
                                >
                                    <div className="w-1 h-4 border-l border-r border-white/30 rounded-sm"></div>
                                </div>
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
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a; 
                    border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46; 
                }
            `}</style>
            
            {/* Paste Modal */}
            {showPasteModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-primary" /> นำเข้าเนื้อเพลงดิบ
                        </h2>
                        <p className="text-zinc-400 text-sm mb-4">
                            วางเนื้อเพลงแบบบรรทัดต่อบรรทัดลงในช่องนี้ ระบบจะสร้างกล่องข้อความเรียงคิวไว้ที่ 0.0s ให้คุณกด Tap-to-Sync ไล่ไปทีละบรรทัดได้เลย
                        </p>
                        
                        <textarea 
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-white font-medium resize-none focus:outline-none focus:border-primary/50 flex-1 min-h-[300px]"
                            placeholder="พิมพ์หรือวางเนื้อเพลงที่นี่..."
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                        />
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                onClick={() => setShowPasteModal(false)}
                                className="px-5 py-2.5 rounded-lg text-white bg-white/5 hover:bg-white/10 transition-colors font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={handlePasteRaw}
                                disabled={!rawText.trim()}
                                className="px-5 py-2.5 rounded-lg text-black bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                            >
                                นำเข้าเนื้อเพลง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
