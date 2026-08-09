import re

with open('src/pages/creator.tsx', 'r') as f:
    content = f.read()

# 1. Update Wiki Studio logic
wiki_func_regex = r'const handleGoToWikiStudio = \(\) => \{.*?\};'
new_wiki_func = """
    const handleGoToWikiStudio = () => {
        const videoId = extractYoutubeVideoId(ytUrl);
        if (!videoId) {
            addToast("กรุณากรอกลิงก์ YouTube หรือ Video ID ที่ถูกต้อง");
            return;
        }
        // Instead of redirecting to /studio, load it in Creator!
        const mockSong: CachedSong = {
            video_id: videoId,
            title: `YouTube Video: ${videoId}`,
            mode: 'youtube',
            size_mb: 0,
            created_at: Date.now()
        };
        setSelectedSong(mockSong);
        // Automatically import lyrics if available
        useLyricsStore.getState().fetchLyrics(videoId, mockSong.title).then(() => {
            const cloudLyrics = useLyricsStore.getState().lyrics;
            if (cloudLyrics && cloudLyrics.length > 0) {
                const converted = cloudLyrics.map((line: any) => {
                    const duration = line.endTime ? (line.endTime - line.time) : 3.0;
                    return { word: line.text, start: line.time, end: line.endTime || (line.time + duration), confidence: 1.0 };
                });
                setLyrics(converted);
            }
        });
    };
"""
content = re.sub(wiki_func_regex, new_wiki_func.strip(), content, flags=re.DOTALL)

# 2. Fix WaveSurfer Init
ws_init_regex = r'const baseUrl = await getActiveBridgeBaseUrl\(\);\s*if \(\!baseUrl\) return;'
new_ws_init = """
        const baseUrl = await getActiveBridgeBaseUrl();
        if (!baseUrl && song.mode !== 'youtube') return;
        
        if (song.mode === 'youtube') {
            setDuration(240); // 4 minutes mock duration for youtube POC
            return;
        }
"""
content = re.sub(ws_init_regex, new_ws_init.strip(), content)

# 3. Fix Ripple logic
ripple_target = r'if \(isRippleEdit\) \{\s*const shift = item\.start - prev\[draggingIdx\]\.start;\s*for \(let i = draggingIdx \+ 1; i < updated\.length; i\+\+\) \{\s*updated\[i\] = \{\s*\.\.\.updated\[i\],\s*start: Math\.round\(\(updated\[i\]\.start \+ shift\) \* 100\) / 100,\s*end: Math\.round\(\(updated\[i\]\.end \+ shift\) \* 100\) / 100\s*\};\s*\}\s*\}'
new_ripple = """
                    if (isRippleEdit) {
                        const shift = item.start - initialDragLyrics[draggingIdx].start;
                        for (let i = draggingIdx + 1; i < updated.length; i++) {
                            updated[i] = {
                                ...initialDragLyrics[i],
                                start: Math.round((initialDragLyrics[i].start + shift) * 100) / 100,
                                end: Math.round((initialDragLyrics[i].end + shift) * 100) / 100
                            };
                        }
                    }
"""
content = re.sub(ripple_target, new_ripple.strip(), content)

# 4. Multi-track Timeline Redesign
old_wave_container = r'\{/\* Waveform Background \(WaveSurfer\) \*/\}\s*<div className="absolute inset-x-0 top-0 bottom-6 pointer-events-none opacity-40">\s*<div ref=\{containerRef\} className="w-full h-full" />\s*</div>'
new_wave_container = """
                            {/* Waveform Background (Channel 1) */}
                            <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none opacity-80 border-b border-zinc-800 bg-zinc-950/50">
                                <div ref={containerRef} className="w-full h-full" />
                            </div>
"""
content = re.sub(old_wave_container, new_wave_container.strip(), content, flags=re.DOTALL)

old_lyric_blocks = r'\{/\* Lyric Blocks \(Absolute Positioned React Components - Studio Style\) \*/\}\s*\{lyrics\.map\(\(word, idx\) => \{.*?const left = word\.start \* zoom;\s*const width = Math\.max\(\(word\.end - word\.start\) \* zoom, 40\);'
new_lyric_blocks = """
                            {/* Lyric Blocks (Track 2) */}
                            {lyrics.map((word, idx) => {
                                const left = word.start * zoom;
                                const width = Math.max((word.end - word.start) * zoom, 40);
                                let row = 0;
                                if (idx > 0 && word.start < lyrics[idx - 1].end) {
                                    row = 1;
                                }
"""
content = re.sub(old_lyric_blocks, new_lyric_blocks.strip(), content, flags=re.DOTALL)

old_lyric_block_style = r'<div\s*key=\{idx\}\s*style=\{\{\s*left: `\$\{left\}px`,\s*width: `\$\{width\}px`\s*\}\}'
new_lyric_block_style = """
                            <div 
                                key={idx} 
                                style={{ 
                                    left: `${left}px`, 
                                    width: `${width}px`,
                                    top: `${70 + (row * 36)}px` 
                                }}
"""
content = re.sub(old_lyric_block_style, new_lyric_block_style.strip(), content, flags=re.DOTALL)

# 5. Toolbar Icons & Order
toolbar_target = r'<div className="flex items-center gap-2 mr-4 border-r border-zinc-800 pr-4">\s*<button \s*onClick=\{handleAddBlockAtPlayhead\}'
play_buttons = """
                        <div className="flex items-center gap-2 mr-4 border-r border-zinc-800 pr-4">
                            <button
                                onClick={handlePlayPause}
                                className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
                            >
                                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-1" />}
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mr-4 border-r border-zinc-800 pr-4">
                            <button 
                                onClick={handleAddBlockAtPlayhead}
"""
content = re.sub(toolbar_target, play_buttons.strip(), content)

old_play_btn = r'<button\s*onClick=\{handlePlayPause\}\s*className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"\s*>\s*\{isPlaying \? <Pause size=\{18\} fill="currentColor" /> : <Play size=\{18\} fill="currentColor" className="ml-1" />\}\s*</button>'
content = re.sub(old_play_btn, '', content)

add_btn = r'<Plus size=\{16\} />\s*</button>'
new_add_btn = r'<Plus size={14} /> เพิ่มบล็อก</button>'
content = re.sub(add_btn, new_add_btn, content)

tap_btn = r'\{isRecording \? <Square size=\{16\} /> : <Target size=\{16\} />\}\s*</button>'
new_tap_btn = r'{isRecording ? <><Square size={14} /> หยุด Tap</> : <><Target size={14} /> Tap-to-Sync</>}</button>'
content = re.sub(tap_btn, new_tap_btn, content)

ripple_btn = r'<Link size=\{16\} />\s*</button>'
new_ripple_btn = r'<Link size={14} /> ลากกลุ่ม</button>'
content = re.sub(ripple_btn, new_ripple_btn, content)

mic_btn = r'<Mic size=\{14\} />\s*</button>'
new_mic_btn = r'<Mic size={14} /> ร้องนำ</button>'
content = re.sub(mic_btn, new_mic_btn, content)

music_btn = r'<Music size=\{14\} />\s*</button>'
new_music_btn = r'<Music size={14} /> ดนตรี</button>'
content = re.sub(music_btn, new_music_btn, content)

sparkles_btn = r'<Sparkles size=\{14\} />\s*</button>'
new_sparkles_btn = r'<Sparkles size={14} /> รวมเสียง</button>'
content = re.sub(sparkles_btn, new_sparkles_btn, content)

content = content.replace('"p-1.5 rounded transition-all"', '"p-1.5 px-3 rounded transition-all flex items-center gap-1.5 text-xs font-bold"')

# 6. Canvas Lyric Drag Fix
canvas_lyric_regex = r"cursor: isDraggingOverlay \? 'grabbing' : 'grab',"
new_canvas_lyric_regex = r"cursor: isDraggingOverlay ? 'grabbing' : 'grab',\n                                        pointerEvents: 'auto',"
content = content.replace(canvas_lyric_regex, new_canvas_lyric_regex)

canvas_overlay_div = r'className="text-center font-black drop-shadow-2xl whitespace-nowrap"'
new_canvas_overlay_div = r'className="text-center font-black drop-shadow-2xl whitespace-nowrap select-none"'
content = content.replace(canvas_overlay_div, new_canvas_overlay_div)

# Fix missing class flex items-center for Add/Tap/Ripple
btn_class = r'className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"'
new_btn_class = r'className="p-1.5 px-2.5 flex items-center gap-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors text-xs font-bold"'
content = content.replace(btn_class, new_btn_class)

btn_class2 = r'className=\{`p-1.5 rounded-lg transition-colors \$\{isRecording \? "bg-red-600/20 text-red-500 animate-pulse" : "hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50"\} `\}'
new_btn_class2 = r'className={`p-1.5 px-2.5 flex items-center gap-1.5 rounded-lg transition-colors text-xs font-bold ${isRecording ? "bg-red-600/20 text-red-500 animate-pulse" : "hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50"}`}'
content = content.replace(btn_class2, new_btn_class2)

btn_class3 = r'className=\{`p-1.5 rounded-lg transition-colors \$\{isRippleEdit \? "bg-amber-600/20 text-amber-500" : "hover:bg-zinc-800 text-zinc-400 hover:text-white"\} `\}'
new_btn_class3 = r'className={`p-1.5 px-2.5 flex items-center gap-1.5 rounded-lg transition-colors text-xs font-bold ${isRippleEdit ? "bg-amber-600/20 text-amber-500" : "hover:bg-zinc-800 text-zinc-400 hover:text-white"}`}'
content = content.replace(btn_class3, new_btn_class3)

with open('src/pages/creator.tsx', 'w') as f:
    f.write(content)

print("Applied POC 2 patches!")
