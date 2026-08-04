const fs = require('fs');
const file = 'src/modules/player/stores/useLyricsStore.ts';
let code = fs.readFileSync(file, 'utf8');

// Fix isGeneratingAI not resetting
code = code.replace(
    /isLoading: false/g,
    "isLoading: false, isGeneratingAI: false"
);

fs.writeFileSync(file, code);
