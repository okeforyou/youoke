const fs = require('fs');

let content = fs.readFileSync('src/pages/creator.tsx', 'utf8');

// 1. Add activeTab and zoom states
content = content.replace(
    "const [fontFamily, setFontFamily] = useState('Sukhumvit Set');",
    `const [fontFamily, setFontFamily] = useState('Sukhumvit Set');
    const [activeTab, setActiveTab] = useState<'properties' | 'lyrics'>('properties');
    const [zoom, setZoom] = useState(50); // px per second`
);

// 2. Fix addRegion to include ID and use it in region-updated
const oldRegionUpdated = `                wsReg.on('region-updated', (region: any) => {
                    setLyrics(prev => {
                        const newLyrics = [...prev];
                        const idx = newLyrics.findIndex(l => l.word === region.content.innerText);
                        if (idx !== -1) {
                            newLyrics[idx].start = region.start;
                            newLyrics[idx].end = region.end;
                        }
                        return newLyrics;
                    });
                });`;

const newRegionUpdated = `                wsReg.on('region-updated', (region: any) => {
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
                });`;
content = content.replace(oldRegionUpdated, newRegionUpdated);


const oldForEach = `                    data.words.forEach((word: LyricWord) => {
                        wsRegions.current.addRegion({
                            start: word.start,
                            end: word.end,
                            content: word.word,
                            color: 'rgba(168, 85, 247, 0.3)', // purple with opacity
                            drag: true,
                            resize: true
                        });
                    });`;

const newForEach = `                    data.words.forEach((word: LyricWord, i: number) => {
                        wsRegions.current.addRegion({
                            id: \`lyric-\${i}\`,
                            start: word.start,
                            end: word.end,
                            content: word.word,
                            color: 'rgba(168, 85, 247, 0.3)',
                            drag: true,
                            resize: true
                        });
                    });`;
content = content.replace(oldForEach, newForEach);


// 3. Add function to rebuild regions when merging/deleting
content = content.replace(
    "const togglePlay = () => {",
    `const rebuildRegions = (newLyrics: LyricWord[]) => {
        if (wsRegions.current) {
            wsRegions.current.clearRegions();
            newLyrics.forEach((word, i) => {
                wsRegions.current.addRegion({
                    id: \`lyric-\${i}\`,
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
        // Update DOM element directly for speed if possible, or rebuild on blur
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

    const togglePlay = () => {`
);

// 4. Update UI for Sidebar Tabs and Lyrics Editor
const oldSidebar = `<div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 overflow-y-auto hidden lg:flex">
                    <div className="p-4 border-b border-zinc-800">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">คุณสมบัติโปรเจกต์</h3>`;

const newSidebar = `<div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 hidden lg:flex">
                    {/* Tabs */}
                    <div className="flex border-b border-zinc-800 shrink-0">
                        <button 
                            className={\`flex-1 py-3 text-xs font-bold uppercase tracking-wider \${activeTab === 'properties' ? 'text-purple-400 border-b-2 border-purple-500 bg-zinc-900/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20'}\`}
                            onClick={() => setActiveTab('properties')}
                        >
                            คุณสมบัติ
                        </button>
                        <button 
                            className={\`flex-1 py-3 text-xs font-bold uppercase tracking-wider \${activeTab === 'lyrics' ? 'text-purple-400 border-b-2 border-purple-500 bg-zinc-900/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20'}\`}
                            onClick={() => setActiveTab('lyrics')}
                        >
                            เนื้อเพลง (\${lyrics.length})
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
`;
content = content.replace(oldSidebar, newSidebar);

// Close the activeTab condition logic properly at the end of the sidebar
content = content.replace(
    /<\/div>\n                    <\/div>\n                <\/div>\n            <\/div>\n\n            {\/\* Bottom Timeline \*\/}/,
    `</div>
                    </>
                    )}
                    </div>
                </div>
            </div>

            {/* Bottom Timeline */}`
);

// 5. Add Zoom Slider to Timeline Toolbar
const oldTimeline = `<div className="text-xs text-zinc-500">
                        ลากขอบซ้าย-ขวาของกรอบเนื้อเพลงเพื่อปรับจังหวะให้ตรง
                    </div>`;
const newTimeline = `<div className="flex items-center gap-4">
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
                    </div>`;
content = content.replace(oldTimeline, newTimeline);

// Apply fix to initial waveform creation zoom level
content = content.replace(
    /normalize: true,/g,
    `normalize: true,
                    minPxPerSec: 50,`
);

fs.writeFileSync('src/pages/creator.tsx', content);
console.log('Patched creator.tsx with zoom and lyrics editor correctly');
