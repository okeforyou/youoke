const fs = require('fs');

let content = fs.readFileSync('src/pages/creator.tsx', 'utf8');

// 1. Add Google Fonts to Head
content = content.replace(
    "<Head><title>Creator Studio - YouOke</title></Head>",
    `<Head>
        <title>Creator Studio - YouOke</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&family=Prompt:wght@400;700&family=Sarabun:wght@400;700&family=Mali:wght@400;700&family=Itim&display=swap" rel="stylesheet" />
    </Head>`
);

// 2. Update Font Dropdown
const oldSelect = `<select 
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="bg-transparent text-xs text-white outline-none w-full text-right cursor-pointer"
                                >
                                    <option value="Sukhumvit Set">Sukhumvit Set</option>
                                    <option value="Kanit">Kanit</option>
                                    <option value="Prompt">Prompt</option>
                                    <option value="Sarabun">Sarabun</option>
                                </select>`;
const newSelect = `<select 
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
                                </select>`;
content = content.replace(oldSelect, newSelect);

// 3. Update Render Logic for Alternating Lines
const oldLyricsRender = `[0, 1].map(offset => {
                                                const lineIdx = activeLineIndex + offset;
                                                if (lineIdx < 0 || lineIdx >= lyricLines.length) return null;
                                                const line = lyricLines[lineIdx];
                                                
                                                return (
                                                    <p key={lineIdx} 
                                                        style={{ 
                                                            fontSize: offset === 0 ? \`\${fontSize}px\` : \`\${fontSize * 0.8}px\`, 
                                                            fontFamily: fontFamily,
                                                            WebkitTextStroke: \`\${fontOutline}px black\`,
                                                        }}
                                                        className={clsx(
                                                        "font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] leading-relaxed transition-all duration-300",
                                                        offset === 0 ? "opacity-100" : "opacity-60"
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
                                            })`;

const newLyricsRender = `[0, 1].map(position => {
                                                const baseIdx = Math.max(0, activeLineIndex);
                                                let lineIdx = position === 0 
                                                    ? (baseIdx % 2 === 0 ? baseIdx : baseIdx + 1)
                                                    : (baseIdx % 2 === 1 ? baseIdx : baseIdx + 1);

                                                if (lineIdx >= lyricLines.length) {
                                                    return <p key={\`empty-\${position}\`} style={{ fontSize: \`\${fontSize}px\`, opacity: 0 }}>&nbsp;</p>;
                                                }

                                                const line = lyricLines[lineIdx];
                                                const isActive = lineIdx === activeLineIndex;
                                                
                                                return (
                                                    <p key={lineIdx} 
                                                        style={{ 
                                                            fontSize: \`\${fontSize}px\`, 
                                                            fontFamily: fontFamily,
                                                            WebkitTextStroke: \`\${fontOutline}px black\`,
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
                                            })`;

content = content.replace(oldLyricsRender, newLyricsRender);

fs.writeFileSync('src/pages/creator.tsx', content);
console.log('Patched creator.tsx');
