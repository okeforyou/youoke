import re

with open('src/pages/creator.tsx', 'r') as f:
    content = f.read()

# 1. Add color states
if 'const [fillColor, setFillColor]' not in content:
    content = content.replace(
        "const [fontFamily, setFontFamily] = useState('Sukhumvit Set');",
        "const [fontFamily, setFontFamily] = useState('Sukhumvit Set');\n    const [fillColor, setFillColor] = useState('#ffffff');\n    const [activeColor, setActiveColor] = useState('#E50914');"
    )

# 2. Update colors system-wide
content = content.replace('bg-purple-600', 'bg-primary')
content = content.replace('bg-purple-500', 'bg-primary/80')
content = content.replace('text-purple-400', 'text-primary')
content = content.replace('text-purple-300', 'text-primary')
content = content.replace('text-purple-200', 'text-red-200')
content = content.replace('border-purple-500', 'border-primary')
content = content.replace('border-purple-400', 'border-primary')
content = content.replace('shadow-purple-950/20', 'shadow-primary/20')
content = content.replace('bg-purple-500/10', 'bg-primary/10')
content = content.replace('bg-purple-500/20', 'bg-primary/20')
content = content.replace('bg-purple-500/5', 'bg-primary/5')
content = content.replace('bg-purple-950/20', 'bg-red-950/20')
content = content.replace('accent-purple-500', 'accent-primary')
content = content.replace('from-purple-400 to-pink-500', 'from-primary to-orange-500')
content = content.replace('from-purple-900/20', 'from-red-900/20')
content = content.replace('text-pink-400', 'text-orange-400')
content = content.replace('bg-pink-600', 'bg-primary')
content = content.replace('bg-pink-500', 'bg-primary/80')
content = content.replace('shadow-[0_0_15px_rgba(168,85,247,0.3)]', 'shadow-[0_0_15px_rgba(229,9,20,0.3)]')

# 3. Replace Lyrics Empty State in Canvas
empty_lyrics_replacement = """
                                        ) : (
                                            <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
                                                <div className="text-center">
                                                    <h3 className="text-2xl font-black text-white mb-2">ยังไม่มีเนื้อร้อง</h3>
                                                    <p className="text-zinc-400 text-sm">เลือกวิธีสร้างเนื้อร้องสำหรับโปรเจกต์นี้</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button onClick={handleTranscribe} disabled={isTranscribing} className="flex flex-col items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-primary/50 p-6 rounded-2xl transition-all shadow-xl disabled:opacity-50 group">
                                                        {isTranscribing ? <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div> : <Mic size={32} className="text-primary group-hover:scale-110 transition-transform" />}
                                                        <span className="font-bold text-white">AI แกะเนื้อร้อง</span>
                                                    </button>
                                                    <button onClick={() => setShowPasteModal(true)} className="flex flex-col items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 p-6 rounded-2xl transition-all shadow-xl group">
                                                        <FileText size={32} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                                                        <span className="font-bold text-white">วางเนื้อร้องเอง</span>
                                                    </button>
                                                    <button onClick={handleImportFromWiki} className="flex flex-col items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-sky-500/50 p-6 rounded-2xl transition-all shadow-xl group">
                                                        <UploadCloud size={32} className="text-sky-500 group-hover:scale-110 transition-transform" />
                                                        <span className="font-bold text-white">ดึงจาก Wiki</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
"""
content = re.sub(
    r'\) : \(\s*<span className="text-zinc-600 text-3xl font-bold">ไม่มีเนื้อเพลง.*?</span>\s*\)}',
    empty_lyrics_replacement.strip(),
    content,
    flags=re.DOTALL
)

# 4. Remove Lyric Source from Right Sidebar
content = re.sub(
    r'\{/\* Section 1: Lyric Source Selector \*/\}.*?(?=\{/\* Section 2: Canvas Text Overlay Styling \*/\})',
    '',
    content,
    flags=re.DOTALL
)

# Fix Section 2 numbering since Section 1 is gone
content = content.replace('2. รูปแบบตัวอักษรบนพรีวิว', 'การจัดรูปแบบ (Properties)')

# 5. Add Color Pickers to Properties
color_pickers = """
                            <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">สีข้อความ (Fill)</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-zinc-500 uppercase">{fillColor}</span>
                                        <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">สีไฮไลท์ (Active)</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-zinc-500 uppercase">{activeColor}</span>
                                        <input type="color" value={activeColor} onChange={(e) => setActiveColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                                    </div>
                                </div>
                            </div>
"""
content = content.replace(
    '</select>\n                            </div>',
    '</select>\n                            </div>\n' + color_pickers
)

# 6. Apply Colors to Canvas Lyrics Rendering
span_regex = r'<span key=\{i\}\s*className=\{clsx\([^)]+\)\}\s*>\s*\{l\.word\}\s*</span>'

def span_replacement(match):
    return """<span key={i} className={clsx("transition-colors duration-100 mx-1 inline-block")} style={{ color: isPast ? activeColor : isCurrent2 ? activeColor : fillColor, opacity: isPast ? 1 : isCurrent2 ? 0.9 : 0.8 }}>{l.word}</span>"""

content = re.sub(
    r'<span key=\{i\} className=\{clsx\([\s\S]*?isPast \? "text-primary" : isCurrent2 \? "text-orange-400" : "text-white"[\s\S]*?\)\}>\{l\.word\}</span>',
    span_replacement,
    content
)

content = re.sub(
    r'<span key=\{i\} className="mx-1 inline-block">\{l\.word\}</span>',
    r'<span key={i} className="mx-1 inline-block" style={{ color: fillColor }}>{l.word}</span>',
    content
)

# 7. Move Toolbar
# Remove Canvas Toolbar exactly
canvas_toolbar_regex = r'\{/\* Canvas Toolbar with Quick Controls \*/\}\s*<div className="w-full max-w-4xl mt-3 flex items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 p-2\.5 rounded-xl font-sans shrink-0">.*?บันทึกข้อมูล\s*</button>\s*</div>\s*</div>'
content = re.sub(canvas_toolbar_regex, '', content, flags=re.DOTALL)

# Add Save to Top Nav
nav_bar_target = '<button \n                        onClick={handleExport}'
save_button = """
                    <button
                        onClick={handleSaveToWiki}
                        disabled={!selectedSong || lyrics.length === 0}
                        className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save
                    </button>
                    """
content = content.replace(nav_bar_target, save_button + nav_bar_target)

# Add controls to Timeline Toolbar
timeline_toolbar_target = '<div className="flex items-center gap-4 text-zinc-400">'
timeline_buttons = """
                        <div className="flex items-center gap-2 mr-4 border-r border-zinc-800 pr-4">
                            <button 
                                onClick={handleAddBlockAtPlayhead}
                                disabled={!selectedSong}
                                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
                                title="เพิ่มบล็อกเนื้อร้องตรงเวลาที่กำลังเล่นปัจจุบัน"
                            >
                                <Plus size={16} />
                            </button>
                            <button
                                onClick={handleToggleRecording}
                                disabled={!selectedSong || lyrics.length === 0}
                                className={`p-1.5 rounded-lg transition-colors ${isRecording ? "bg-red-600/20 text-red-500 animate-pulse" : "hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50"}`}
                                title="เริ่ม/หยุด Tap-to-Sync"
                            >
                                {isRecording ? <Square size={16} /> : <Target size={16} />}
                            </button>
                            {isRecording && (
                                <button
                                    onClick={handleTap}
                                    className="px-2 py-1 rounded-md bg-primary text-white text-xs font-black transition-all active:scale-95 shadow"
                                >
                                    Tap! ({recordingIndex + 1})
                                </button>
                            )}
                            <button 
                                onClick={() => setIsRippleEdit(!isRippleEdit)}
                                className={`p-1.5 rounded-lg transition-colors ${isRippleEdit ? "bg-amber-600/20 text-amber-500" : "hover:bg-zinc-800 text-zinc-400 hover:text-white"}`}
                                title="ลากกลุ่ม (Ripple)"
                            >
                                <Link size={16} />
                            </button>
                        </div>
"""
content = content.replace(timeline_toolbar_target, timeline_toolbar_target + timeline_buttons)

with open('src/pages/creator.tsx', 'w') as f:
    f.write(content)

print("Patched creator.tsx completely!")
