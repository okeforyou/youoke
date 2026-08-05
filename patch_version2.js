const fs = require('fs');
let code = fs.readFileSync('src/core/version.ts', 'utf8');
const newLog = `        {
            version: 'v5.5.236',
            date: new Date().toISOString().split('T')[0],
            changes: [
                "fix(ui): Moved the AI Cache badge from the floating image overlay to a simple inline label below the title, matching the exact styling and placement logic of the Queue list, completely eliminating any overlapping or edge-clipping issues."
            ]
        },`;
code = code.replace(/export const CHANGELOG: VersionLog\[\] = \[/, 'export const CHANGELOG: VersionLog[] = [\n' + newLog);
code = code.replace(/export const SYSTEM_VERSION = 'v5\.5\.[0-9]+';/g, "export const SYSTEM_VERSION = 'v5.5.236';");
fs.writeFileSync('src/core/version.ts', code);
