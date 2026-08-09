import re

with open('src/pages/creator.tsx', 'r') as f:
    content = f.read()

# Fix fetchSongs
bad_fetch = r'''const baseUrl = await getActiveBridgeBaseUrl\(\);
        if \(\!baseUrl && song\.mode \!\=\= 'youtube'\) return;
        
        if \(song\.mode === 'youtube'\) \{
            setDuration\(240\); // 4 minutes mock duration for youtube POC
            return;
        \}'''
good_fetch = r'''const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) return;'''
content = re.sub(bad_fetch, good_fetch, content)

# Fix handlePlayPause missing definition
# (Wait, there was no handlePlayPause before! It was just inline in the button)
# Ah! In the original code, the play button was: onClick={() => wavesurfer.current?.playPause()}
# I changed it to `handlePlayPause`. Let me add `handlePlayPause`.
play_pause_hook = r'const handleImportFromWiki = async \(\) => \{'
new_play_pause_hook = """
    const handlePlayPause = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };
    
    const handleImportFromWiki = async () => {
"""
content = re.sub(play_pause_hook, new_play_pause_hook.strip() + '\n', content)

# Fix handlePlayPause call issue in button (if not fixed by above)
# Just to be sure, I will write the content back.

with open('src/pages/creator.tsx', 'w') as f:
    f.write(content)
print("Fixed TS errors")
