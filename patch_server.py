import re
with open("scripts/local-bridge/server.py", "r") as f:
    content = f.read()

# Add Form import
if "from fastapi import FastAPI, HTTPException, UploadFile, File" in content:
    content = content.replace("from fastapi import FastAPI, HTTPException, UploadFile, File", "from fastapi import FastAPI, HTTPException, UploadFile, File, Form")
elif "from fastapi import" in content and "Form" not in content:
    content = content.replace("from fastapi import", "from fastapi import Form,")

# Add library logic after CACHE_DIR setup
library_code = """
import uuid

LIBRARY_DIR = os.path.join(base_dir, 'library')
os.makedirs(LIBRARY_DIR, exist_ok=True)
LIBRARY_DB_PATH = os.path.join(LIBRARY_DIR, 'library.json')

def load_library():
    if os.path.exists(LIBRARY_DB_PATH):
        try:
            with open(LIBRARY_DB_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_library(data):
    with open(LIBRARY_DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.post("/library/upload")
async def upload_library(
    title: str = Form(...),
    artist: str = Form(...),
    file: UploadFile = File(...)
):
    song_id = f"local_{uuid.uuid4().hex[:8]}"
    ext = os.path.splitext(file.filename)[1] or '.m4a'
    filename = f"{song_id}{ext}"
    filepath = os.path.join(LIBRARY_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        import shutil
        shutil.copyfileobj(file.file, buffer)
        
    library = load_library()
    new_song = {
        "id": song_id,
        "title": title,
        "artist": artist,
        "filename": filename,
        "createdAt": int(time.time())
    }
    library.append(new_song)
    save_library(library)
    
    return {"status": "success", "song": new_song}

@app.get("/library")
async def get_library():
    return load_library()

@app.get("/library/stream/{song_id}")
async def stream_library(song_id: str):
    library = load_library()
    song = next((s for s in library if s["id"] == song_id), None)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    filepath = os.path.join(LIBRARY_DIR, song["filename"])
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Return as attachment? No, stream it
    return FileResponse(filepath)

@app.delete("/library/{song_id}")
async def delete_library(song_id: str):
    library = load_library()
    song = next((s for s in library if s["id"] == song_id), None)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
        
    filepath = os.path.join(LIBRARY_DIR, song["filename"])
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception:
            pass
        
    library = [s for s in library if s["id"] != song_id]
    save_library(library)
    
    return {"status": "success"}

"""
if "LIBRARY_DIR = os.path.join(base_dir, 'library')" not in content:
    content = content.replace("app = FastAPI()", "app = FastAPI()\n" + library_code)

# Add local logic in /separate
local_hook = """
    # Hook for local library files
    if vid.startswith("local_"):
        library = load_library()
        song = next((s for s in library if s["id"] == vid), None)
        if not song:
            raise HTTPException(status_code=404, detail="Local song not found in library")
        source_filepath = os.path.join(LIBRARY_DIR, song["filename"])
        if not os.path.exists(source_filepath):
            raise HTTPException(status_code=404, detail="Local file missing")
        import shutil
        shutil.copy2(source_filepath, m4a_path)
        download_success = True
        print(f"[{vid}] Loaded local file for separation.")
"""

if '# Hook for local library files' not in content:
    content = content.replace('download_success = False', 'download_success = False\n' + local_hook)

with open("scripts/local-bridge/server.py", "w") as f:
    f.write(content)
print("Patched server.py successfully")
