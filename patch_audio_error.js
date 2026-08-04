const fs = require('fs');
const file = 'src/modules/player/components/UniversalPlayer.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('handleAudioError')) {
    const handleAudioErrorFn = `
    const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        if (!isAIVocalMode) return;
        console.error("Audio error:", e.currentTarget.src, e.currentTarget.error);
        
        // Fallback to YouTube Audio
        if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
            const { isMuted } = useMixerStore.getState();
            if (!isMuted) {
                ytPlayerRef.current.unMute();
                ytPlayerRef.current.setVolume(100);
            }
        }
    };
`;
    // Insert after const ytPlayerRef = useRef<any>(null);
    code = code.replace('const ytPlayerRef = useRef<any>(null);', 'const ytPlayerRef = useRef<any>(null);\\n' + handleAudioErrorFn);
    
    // Add onError to audio tags
    code = code.replace(/<audio /g, '<audio onError={handleAudioError} ');
    fs.writeFileSync(file, code);
}
