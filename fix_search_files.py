import os
import re

file_path = "scripts/local-bridge/routes/search_files.py"
with open(file_path, "r") as f:
    content = f.read()

# Add a check for "original.audio"
replacement = """    legacy_path = os.path.join(active_dir, video_id)
    if os.path.exists(legacy_path) and os.path.isdir(legacy_path):
        if filename == "original.audio":
            for f in os.listdir(legacy_path):
                if f not in ["vocals.m4a", "bass.m4a", "drums.m4a", "other.m4a", "lyrics_timeline.json", "youoke.json", "mode.txt", "title.txt"]:
                    if f.endswith(('.m4a', '.mp3', '.webm', '.wav', '.ogg')):
                        return FileResponse(os.path.join(legacy_path, f), headers={"Accept-Ranges": "bytes"})
                        
        filepath = os.path.join(legacy_path, filename)"""

content = content.replace('    legacy_path = os.path.join(active_dir, video_id)\n    if os.path.exists(legacy_path) and os.path.isdir(legacy_path):\n        filepath = os.path.join(legacy_path, filename)', replacement)

with open(file_path, "w") as f:
    f.write(content)

print("Patched search_files.py")
