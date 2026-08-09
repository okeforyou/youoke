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
# The section starts with {/* Section 1: Lyric Source Selector */} and ends before {/* Section 2: Canvas Text Overlay Styling */}
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
# We need to replace text-white with fillColor (using inline style) and text-primary/text-orange-400 with activeColor.
# Wait, inline styles are applied at `<p style={{...}}>`. We can pass color there or in spans.
# The current rendering is:
# <span key={i} className={clsx( ... "text-primary" : isCurrent2 ? "text-orange-400" : "text-white" )}>{l.word}</span>

# Let's find this span mapping.
span_regex = r'<span key=\{i\}\s*className=\{clsx\([^)]+\)\}\s*>\s*\{l\.word\}\s*</span>'

def span_replacement(match):
    # Instead of using classes for color, we use inline styles for the exact color pickers
    return """<span key={i} className={clsx("transition-colors duration-100 mx-1 inline-block")} style={{ color: isPast ? activeColor : isCurrent2 ? activeColor : fillColor, opacity: isPast ? 1 : isCurrent2 ? 0.9 : 0.8 }}>{l.word}</span>"""

content = re.sub(
    r'<span key=\{i\} className=\{clsx\([\s\S]*?isPast \? "text-primary" : isCurrent2 \? "text-orange-400" : "text-white"[\s\S]*?\)\}>\{l\.word\}</span>',
    span_replacement,
    content
)

# And for the next line:
content = re.sub(
    r'<span key=\{i\} className="mx-1 inline-block">\{l\.word\}</span>',
    r'<span key={i} className="mx-1 inline-block" style={{ color: fillColor }}>{l.word}</span>',
    content
)


with open('src/pages/creator.tsx', 'w') as f:
    f.write(content)

print("Patched creator.tsx successfully!")
