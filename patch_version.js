const fs = require('fs');
let code = fs.readFileSync('src/core/version.ts', 'utf8');
const newLog = `        {
            version: 'v5.5.234',
            date: new Date().toISOString().split('T')[0],
            changes: [
                "fix(ui): Removed a hacky wrapper in ListPlaylistsGrid that was forcing the 2CH/4CH badge to stick to the top-left corner.",
                "style(ui): Adjusted the AI Cache 2CH/4CH badge on thumbnail cards to match the exact minimalist rectangular style used in the QueueList, positioned cleanly without touching the edges."
            ]
        },`;
code = code.replace(/export const CHANGELOG: VersionLog\[\] = \[/, 'export const CHANGELOG: VersionLog[] = [\n' + newLog);
fs.writeFileSync('src/core/version.ts', code);
