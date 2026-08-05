const fs = require('fs');
let code = fs.readFileSync('src/components/CardV2.tsx', 'utf8');

const oldBadgeRegex = /\{aiBadgeText && \(\s*<div className="absolute top-[^]+?<\/div>\s*\)\}/;

const newBadge = `{aiBadgeText && (
                    <div className="absolute top-3 left-3 z-30 pointer-events-none">
                        <div className="px-1.5 py-0.5 rounded-[4px] bg-black/60 dark:bg-black/50 text-white text-[9px] font-bold border border-white/10 shadow-sm backdrop-blur-md">
                            {aiBadgeText}
                        </div>
                    </div>
                )}`;

code = code.replace(oldBadgeRegex, newBadge);
fs.writeFileSync('src/components/CardV2.tsx', code);
