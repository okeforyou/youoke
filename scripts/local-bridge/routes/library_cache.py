from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import time
import uuid
import shutil
import json
from utils.config import load_config, get_active_storage_dir, CACHE_DIR, LIBRARY_DIR, LIBRARY_DB_PATH

router = APIRouter()

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

@router.post("/library/upload")
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

@router.get("/library")
async def get_library():
    return load_library()

@router.get("/library/stream/{song_id}")
async def stream_library(song_id: str):
    library = load_library()
    song = next((s for s in library if s["id"] == song_id), None)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    filepath = os.path.join(LIBRARY_DIR, song["filename"])
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(filepath)

@router.delete("/library/{song_id}")
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

@router.get("/cache/list")
def list_cache():
    try:
        active_dir = get_active_storage_dir()
        if not os.path.exists(active_dir):
            return {"status": "success", "results": []}
        
        results = []
        for folder_name in os.listdir(active_dir):
            song_dir = os.path.join(active_dir, folder_name)
            if not os.path.isdir(song_dir):
                continue
                
            vocal_m4a = os.path.join(song_dir, "vocals.m4a")
            if not os.path.exists(vocal_m4a):
                continue
                
            youoke_json_path = os.path.join(song_dir, "youoke.json")
            vid = folder_name
            title = f"{folder_name}"
            
            if os.path.exists(youoke_json_path):
                try:
                    with open(youoke_json_path, "r", encoding="utf-8") as yf:
                        ydata = json.load(yf)
                        vid = ydata.get("videoId", folder_name)
                        title = ydata.get("title", folder_name)
                except:
                    pass
            else:
                title_path = os.path.join(song_dir, "title.txt")
                if os.path.exists(title_path):
                    with open(title_path, "r", encoding="utf-8") as f:
                        title = f.read().strip()
                
                # Fallback: scan for original youtube m4a file (11 characters) to recover the video ID
                try:
                    for f in os.listdir(song_dir):
                        if f.endswith(".m4a") and f not in ["vocals.m4a", "no_vocals.m4a", "bass.m4a", "drums.m4a", "other.m4a"]:
                            possible_vid = f.replace(".m4a", "")
                            if len(possible_vid) == 11 and all(c.isalnum() or c in "-_" for c in possible_vid):
                                vid = possible_vid
                                break
                except Exception:
                    pass

            total_size = sum(os.path.getsize(os.path.join(song_dir, f)) for f in os.listdir(song_dir) if os.path.isfile(os.path.join(song_dir, f)))
            size_mb = total_size / (1024 * 1024)
            
            mode = "basic"
            if os.path.exists(os.path.join(song_dir, "drums.m4a")):
                mode = "pro"
                
            created_at = os.path.getctime(vocal_m4a)
            
            results.append({
                "video_id": vid,
                "title": title,
                "mode": mode,
                "size_mb": round(size_mb, 2),
                "created_at": created_at
            })
            
        results.sort(key=lambda x: x["created_at"], reverse=True)
        return {"status": "success", "results": results}
    except Exception as e:
        return {"status": "error", "message": f"Failed to list cache: {str(e)}"}

@router.delete("/cache/{video_id}")
def delete_cache(video_id: str):
    try:
        if not video_id or ".." in video_id or "/" in video_id:
            raise HTTPException(status_code=400, detail="Invalid video_id")
            
        deleted = False
        
        # Scan CACHE_DIR and custom active storage dir (avoiding duplicates)
        dirs_to_scan = [CACHE_DIR]
        active_dir = get_active_storage_dir()
        if active_dir and active_dir not in dirs_to_scan:
            dirs_to_scan.append(active_dir)
            
        for base_dir in dirs_to_scan:
            if not base_dir or not os.path.exists(base_dir):
                continue
                
            for folder_name in os.listdir(base_dir):
                sub_dir = os.path.join(base_dir, folder_name)
                if not os.path.isdir(sub_dir):
                    continue
                
                # 1. Match by youoke.json metadata videoId
                json_path = os.path.join(sub_dir, "youoke.json")
                if os.path.exists(json_path):
                    try:
                        with open(json_path, "r", encoding="utf-8") as yf:
                            ydata = json.load(yf)
                            if ydata.get("videoId") == video_id:
                                shutil.rmtree(sub_dir)
                                deleted = True
                                print(f"[Cache Delete] Deleted custom storage folder by youoke.json: {sub_dir}")
                                continue
                    except Exception as e:
                        print(f"[Cache Delete] Failed to delete custom folder {sub_dir}: {e}")
                
                # 2. Match by exact folder name
                if folder_name == video_id:
                    shutil.rmtree(sub_dir)
                    deleted = True
                    print(f"[Cache Delete] Deleted folder by name: {sub_dir}")
                    continue
                    
                # 3. Match by name prefixes (e.g. video_id_basic, video_id_pro)
                if folder_name.startswith(video_id) and any(folder_name.endswith(s) for s in ["_basic", "_pro"]):
                    shutil.rmtree(sub_dir)
                    deleted = True
                    print(f"[Cache Delete] Deleted folder by suffix pattern: {sub_dir}")
                    continue
        
        if deleted:
            return {"status": "success", "message": f"Deleted cache for {video_id}"}
        else:
            return {"status": "error", "message": "Cache not found"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to delete cache: {str(e)}"}
