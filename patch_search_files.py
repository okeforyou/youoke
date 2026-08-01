import os
import re

path = "scripts/local-bridge/routes/search_files.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

def inject_fallback(code):
    # We will replace the original.audio handling completely
    pattern = r'if filename == "original\.audio":.*?filepath = os\.path\.join\(song_dir, filename\)'
    
    replacement = """if filename == "original.audio":
                                # Try exact original first
                                orig_explicit = os.path.join(song_dir, f"{video_id}.m4a")
                                if os.path.exists(orig_explicit):
                                    return FileResponse(orig_explicit, headers={"Accept-Ranges": "bytes"})
                                orig_explicit2 = os.path.join(song_dir, "original.m4a")
                                if os.path.exists(orig_explicit2):
                                    return FileResponse(orig_explicit2, headers={"Accept-Ranges": "bytes"})
                                    
                                for f in os.listdir(song_dir):
                                    if f not in ["vocals.m4a", "no_vocals.m4a", "bass.m4a", "drums.m4a", "other.m4a", "lyrics_timeline.json", "youoke.json", "mode.txt", "title.txt"] and not f.endswith(".yok"):
                                        if f.endswith(('.m4a', '.mp3', '.webm', '.wav', '.ogg')):
                                            return FileResponse(os.path.join(song_dir, f), headers={"Accept-Ranges": "bytes"})
                                # Fallback so it doesn't crash the player
                                if os.path.exists(os.path.join(song_dir, "vocals.m4a")):
                                    return FileResponse(os.path.join(song_dir, "vocals.m4a"), headers={"Accept-Ranges": "bytes"})
                            
                            if filename == "no_vocals.m4a" and not os.path.exists(os.path.join(song_dir, "no_vocals.m4a")):
                                if os.path.exists(os.path.join(song_dir, "other.m4a")):
                                    return FileResponse(os.path.join(song_dir, "other.m4a"), headers={"Accept-Ranges": "bytes"})
                            
                            filepath = os.path.join(song_dir, filename)"""
    
    return re.sub(pattern, replacement, code, flags=re.DOTALL)

# Do it for both legacy_path and song_dir blocks
content = inject_fallback(content)

# We need to adapt the legacy_path part too since the regex targets song_dir.
pattern_legacy = r'if filename == "original\.audio":.*?filepath = os\.path\.join\(legacy_path, filename\)'
replacement_legacy = """if filename == "original.audio":
            orig_explicit = os.path.join(legacy_path, f"{video_id}.m4a")
            if os.path.exists(orig_explicit):
                return FileResponse(orig_explicit, headers={"Accept-Ranges": "bytes"})
            for f in os.listdir(legacy_path):
                if f not in ["vocals.m4a", "no_vocals.m4a", "bass.m4a", "drums.m4a", "other.m4a", "lyrics_timeline.json", "youoke.json", "mode.txt", "title.txt"] and not f.endswith(".yok"):
                    if f.endswith(('.m4a', '.mp3', '.webm', '.wav', '.ogg')):
                        return FileResponse(os.path.join(legacy_path, f), headers={"Accept-Ranges": "bytes"})
            if os.path.exists(os.path.join(legacy_path, "vocals.m4a")):
                return FileResponse(os.path.join(legacy_path, "vocals.m4a"), headers={"Accept-Ranges": "bytes"})
                
        if filename == "no_vocals.m4a" and not os.path.exists(os.path.join(legacy_path, "no_vocals.m4a")):
            if os.path.exists(os.path.join(legacy_path, "other.m4a")):
                return FileResponse(os.path.join(legacy_path, "other.m4a"), headers={"Accept-Ranges": "bytes"})
                
        filepath = os.path.join(legacy_path, filename)"""

content = re.sub(pattern_legacy, replacement_legacy, content, flags=re.DOTALL)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("search_files.py patched")
