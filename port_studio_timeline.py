import re

with open('src/pages/creator.tsx', 'r') as f:
    content = f.read()

# 1. Add handlePointerDown
drag_down_func = """
    // Timeline Drag System
    const handlePointerDown = (e: React.PointerEvent, idx: number, action: 'move' | 'resize-right' | 'resize-left') => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingIdx(idx);
        setDragAction(action);
        setStartX(e.clientX);
        setStartTime(lyrics[idx].start);
        setStartEndTime(lyrics[idx].end);
        setInitialDragLyrics(lyrics.map(l => ({...l})));
    };
"""
content = re.sub(r'// Timeline Pointer Drag Move & Resize Event Listeners', drag_down_func + '\n    // Timeline Pointer Drag Move & Resize Event Listeners', content)


# 2. Update handlePointerMove
old_pointer_move_effect = r'// Timeline Pointer Drag Move & Resize Event Listeners.*?if \(draggingIdx !== null\) \{\s*window\.addEventListener\(\'pointermove\', handlePointerMove\);\s*window\.addEventListener\(\'pointerup\', handlePointerUp\);\s*\}\s*return \(\) => \{\s*window\.removeEventListener\(\'pointermove\', handlePointerMove\);\s*window\.removeEventListener\(\'pointerup\', handlePointerUp\);\s*\};\s*\}, \[draggingIdx, dragAction, startX, startTime, startEndTime, zoom, isRippleEdit, lyrics\]\);'

new_pointer_move_effect = """
    // Timeline Pointer Drag Move & Resize Event Listeners
    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (draggingIdx === null || !dragAction || initialDragLyrics.length === 0) return;
            const deltaX = e.clientX - startX;
            const deltaTime = deltaX / zoom;
            
            setLyrics(() => {
                const next = initialDragLyrics.map(l => ({...l}));
                const item = next[draggingIdx];
                
                if (dragAction === 'move') {
                    const blockDuration = startEndTime - startTime;
                    let newTime = Math.max(0, startTime + deltaTime);
                    const actualDelta = newTime - startTime;
                    
                    item.start = newTime;
                    item.end = newTime + blockDuration;
                    
                    // Ripple Edit
                    if (isRippleEdit || e.shiftKey) {
                        for (let i = draggingIdx + 1; i < next.length; i++) {
                            const dur = next[i].end - next[i].start;
                            next[i].start = Math.max(0, next[i].start + actualDelta);
                            next[i].end = next[i].start + dur;
                        }
                    }
                } else if (dragAction === 'resize-left') {
                    let newTime = Math.max(0, startTime + deltaTime);
                    newTime = Math.min(newTime, startEndTime - 0.2);
                    item.start = newTime;
                } else if (dragAction === 'resize-right') {
                    let newEnd = Math.max(startTime + 0.2, startEndTime + deltaTime);
                    item.end = newEnd;
                }
                
                return next;
            });
        };

        const handlePointerUp = () => {
            setDraggingIdx(null);
            setDragAction(null);
            setInitialDragLyrics([]);
            setLyrics(prev => [...prev]); // Trigger update to regions if necessary
            setTimeout(() => {
                const currentLyrics = useLyricsStore.getState().lyrics;
                // Optionally rebuild regions if you use them, but we might not even need regions anymore!
            }, 50);
        };

        if (draggingIdx !== null) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        }

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [draggingIdx, dragAction, startX, startTime, startEndTime, zoom, isRippleEdit, initialDragLyrics]);
"""
content = re.sub(old_pointer_move_effect, new_pointer_move_effect.strip(), content, flags=re.DOTALL)


# 3. Replace Toolbar
old_toolbar = r'\{/\* Timeline Toolbar \*/\}.*?\{/\* Wavesurfer & Draggable Block Timeline Area \*/\}'
new_toolbar = """
                {/* Timeline Toolbar (Studio Style) */}
                <div className="h-14 shrink-0 bg-zinc-900 border-y border-white/10 px-4 flex items-center justify-between z-30 shadow-lg select-none">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePlayPause}
                            className="w-10 h-10 bg-white hover:scale-105 active:scale-95 text-black rounded-full flex items-center justify-center transition-transform shadow-lg shadow-white/10 shrink-0"
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                        </button>
                        <span className="font-mono text-lg font-bold text-white min-w-[80px]">{formatTime(currentTime)}s</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {}} 
                            className="px-3 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all text-sm flex items-center gap-2"
                            title="นำเข้าเนื้อเพลง"
                        >
                            <FileText size={16} /> <span className="hidden sm:inline">นำเข้าเนื้อเพลง</span>
                        </button>
                        <button
                            onClick={handleAddBlockAtPlayhead}
                            className="px-3 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all text-sm flex items-center gap-2"
                            title="เพิ่มบรรทัด"
                        >
                            <Plus size={16} /> <span className="hidden sm:inline">เพิ่มบรรทัด</span>
                        </button>
                        <button
                            onClick={() => setIsRippleEdit(!isRippleEdit)}
                            className={`px-4 py-1.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 text-sm ${isRippleEdit ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-zinc-300 hover:bg-white/15'}`}
                            title="ลากขยับพร้อมกันทั้งกลุ่ม"
                        >
                            <Link size={16} /> <span className="hidden sm:inline">Ripple</span>
                        </button>
                        <button
                            onClick={handleToggleTapSync}
                            className={`px-4 py-1.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 text-sm ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/15'}`}
                        >
                            {isRecording ? "🔴 STOP (Spacebar)" : "🎯 START TAP-TO-SYNC"}
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {selectedSong && (
                            <div className="flex items-center bg-black/40 border border-white/5 p-1 rounded-lg hidden md:flex">
                                <button
                                    onClick={() => setAudioTrack('vocals')}
                                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-bold ${audioTrack === 'vocals' ? "bg-primary text-white shadow" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
                                >
                                    <Mic size={14} /> ร้องนำ
                                </button>
                                <button
                                    onClick={() => setAudioTrack('instrumental')}
                                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-bold ${audioTrack === 'instrumental' ? "bg-primary text-white shadow" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
                                >
                                    <Music size={14} /> ดนตรี
                                </button>
                                <button
                                    onClick={() => setAudioTrack('original')}
                                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-bold ${audioTrack === 'original' ? "bg-primary text-white shadow" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
                                >
                                    <Sparkles size={14} /> รวมเสียง
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                            <button
                                onClick={() => handleZoomChange({ target: { value: String(Math.max(10, zoom - 15)) } } as any)}
                                className="px-3 py-1.5 hover:bg-white/10 rounded flex items-center justify-center text-zinc-300 transition-colors"
                            >
                                <ZoomOut size={16} />
                            </button>
                            <button
                                onClick={() => handleZoomChange({ target: { value: String(Math.min(300, zoom + 15)) } } as any)}
                                className="px-3 py-1.5 hover:bg-white/10 rounded flex items-center justify-center text-zinc-300 transition-colors"
                            >
                                <ZoomIn size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Wavesurfer & Draggable Block Timeline Area */}
"""
content = re.sub(old_toolbar, new_toolbar.strip(), content, flags=re.DOTALL)


# 4. Replace Lyric Blocks
old_blocks_area = r'\{/\* Lyric Blocks \(Track 2\) \*/\}.*?(?=\{/\* Ghost Block for previewing tap-to-sync \*/\})'
new_blocks_area = """
                            {/* Lyric Blocks (Studio Style) */}
                            {lyrics.map((line, idx) => {
                                const left = line.start * zoom;
                                const width = Math.max((line.end - line.start) * zoom, 30);
                                const isActive = isRecording ? idx === recordingIndex : false;
                                const isDone = isRecording && idx < recordingIndex;
                                
                                return (
                                    <div 
                                        key={`block-${idx}`}
                                        className={`absolute top-4 h-12 rounded-md flex overflow-hidden transition-colors z-20 group
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
                                            value={line.word}
                                            onChange={(e) => {
                                                const next = [...lyrics];
                                                next[idx].word = e.target.value;
                                                setLyrics(next);
                                            }}
                                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag when focusing input
                                        />
                                        
                                        {/* Delete Button (appears on hover) */}
                                        <button
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`ลบเนื้อร้อง "${line.word}" ใช่ไหม?`)) {
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
                            
"""
content = re.sub(old_blocks_area, new_blocks_area.strip() + '\n                            ', content, flags=re.DOTALL)

if 'GripVertical' not in content:
    content = content.replace('import { Play, Pause, X', 'import { Play, Pause, X, GripVertical')

# Add missing formatTime
if 'const formatTime =' not in content:
    format_time = """
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = (secs % 60).toFixed(2);
        return `${m.toString().padStart(2, '0')}:${s.padStart(5, '0')}`;
    };
"""
    # put it right after togglePlay
    content = content.replace('const togglePlay = () => {\n        if (wavesurfer.current) {\n            wavesurfer.current.playPause();\n        }\n    };', 'const togglePlay = () => {\n        if (wavesurfer.current) {\n            wavesurfer.current.playPause();\n        }\n    };\n' + format_time)

with open('src/pages/creator.tsx', 'w') as f:
    f.write(content)
print("Done patching.")
