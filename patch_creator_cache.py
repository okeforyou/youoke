import os

path = "scripts/local-bridge/routes/creator.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add caching logic right before "2. Call the AI API"
target = "        # 2. Call the AI API"
replacement = """        # Check if already transcribed
        timeline_path = os.path.join(song_dir, "lyrics_timeline.json")
        if os.path.exists(timeline_path):
            try:
                with open(timeline_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "words" in data:
                        return {"status": "success", "words": data["words"], "cached": True}
            except:
                pass # If corrupted, fetch again
                
        # 2. Call the AI API"""

content = content.replace(target, replacement)

# Add timeout and fix blocking call
target_api = """            try:
                with urllib.request.urlopen(req) as response:"""
replacement_api = """            try:
                # Use a timeout to prevent hanging forever
                with urllib.request.urlopen(req, timeout=120) as response:"""

content = content.replace(target_api, replacement_api)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched creator.py with caching and timeout")
