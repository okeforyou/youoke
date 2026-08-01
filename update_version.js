const fs = require('fs');
const path = 'src/core/version.ts';
let content = fs.readFileSync(path, 'utf8');

const newVersion = "5.5.215";
const date = new Date().toISOString().split('T')[0];

content = content.replace(
    /export const SYSTEM_VERSION = ".*?";/,
    `export const SYSTEM_VERSION = "${newVersion}";`
);

const newChangelogEntry = `    {
        version: "${newVersion}",
        date: "${date}",
        changes: [
            "feat(creator): Added Zoom slider for precise waveform timing adjustments.",
            "feat(creator): Revamped Lyrics Editor with direct inline text editing.",
            "feat(creator): Added 'Merge' (chain) and 'Delete' controls for AI lyric segments.",
            "fix(creator): Resolved UI layout clipping and syntax errors in the sidebar tab system."
        ]
    },
`;

content = content.replace(
    /export const CHANGELOGS = \[\n/,
    `export const CHANGELOGS = [\n${newChangelogEntry}`
);

fs.writeFileSync(path, content);
console.log('Version updated to ' + newVersion);
