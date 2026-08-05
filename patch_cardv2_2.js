const fs = require('fs');
let code = fs.readFileSync('src/components/CardV2.tsx', 'utf8');

const oldBadgeRegex = /\{aiBadgeText && \(\s*<div className="absolute top-[^]+?<\/div>\s*\)\}/;

const newBadge = `{aiBadgeText && (
                    <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 30, pointerEvents: 'none' }}>
                        <div style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(4px)'
                        }}>
                            {aiBadgeText}
                        </div>
                    </div>
                )}`;

code = code.replace(oldBadgeRegex, newBadge);
fs.writeFileSync('src/components/CardV2.tsx', code);
