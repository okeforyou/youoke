const fs = require('fs');
let code = fs.readFileSync('src/core/version.ts', 'utf8');
const newLog = `        {
            version: 'v5.5.235',
            date: new Date().toISOString().split('T')[0],
            changes: [
                "fix(ui): Bypassed Tailwind CSS constraints by using strict inline styles for the AI Cache 2CH/4CH badge, guaranteeing it exactly matches the QueueList design and maintains a 14px distance from the corners without being clipped by parent overflow rules."
            ]
        },`;
code = code.replace(/export const CHANGELOG: VersionLog\[\] = \[/, 'export const CHANGELOG: VersionLog[] = [\n' + newLog);
fs.writeFileSync('src/core/version.ts', code);
