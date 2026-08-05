const fs = require('fs');
let code = fs.readFileSync('src/core/version.ts', 'utf8');
const newLog = `        {
            version: 'v5.5.233',
            date: new Date().toISOString().split('T')[0],
            changes: [
                "fix(api): Fixed LRCLIB search query for Thai songs by swapping artist and track names to prevent 'ไม่พบเนื้อเพลงในระบบ' and 'Failed to fetch' errors.",
                "ui(card): Changed CH badge to a perfect pill shape (equal padding) and moved to top-right to avoid sticking to corners."
            ]
        },`;
code = code.replace(/export const CHANGELOG: VersionLog\[\] = \[/, 'export const CHANGELOG: VersionLog[] = [\n' + newLog);
fs.writeFileSync('src/core/version.ts', code);
