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

def get_dir_size(path: str) -> int:
    """Calculate total byte size of a directory recursively."""
    total = 0
    try:
        for root, _, files in os.walk(path):
            for f in files:
                fp = os.path.join(root, f)
                if not os.path.islink(fp) and os.path.exists(fp):
                    total += os.path.getsize(fp)
    except Exception:
        pass
    return total

def enforce_cache_limit(max_size_gb: float = 10.0, exclude_vids: list = None) -> dict:
    """
    Enforces maximum cache folder size using Least Recently Used (LRU) policy.
    If total cache exceeds max_size_gb, removes oldest accessed/modified song folders
    until total size is below target limit.
    """
    try:
        active_dir = get_active_storage_dir() or CACHE_DIR
        if not os.path.exists(active_dir):
            return {"status": "ok", "deleted_count": 0, "freed_mb": 0}

        max_bytes = int(max_size_gb * 1024 * 1024 * 1024)
        target_bytes = int(max_bytes * 0.85) # Evict down to 85% of limit when threshold reached
        
        current_total = get_dir_size(active_dir)
        if current_total <= max_bytes:
            return {
                "status": "ok", 
                "deleted_count": 0, 
                "freed_mb": 0, 
                "current_mb": round(current_total / (1024 * 1024), 2)
            }

        # List all song directories and their last access/modified time
        folders = []
        for name in os.listdir(active_dir):
            folder_path = os.path.join(active_dir, name)
            if os.path.isdir(folder_path):
                if exclude_vids and name in exclude_vids:
                    continue
                try:
                    mtime = os.path.getmtime(folder_path)
                    try:
                        atime = os.path.getatime(folder_path)
                        last_active = max(mtime, atime)
                    except Exception:
                        last_active = mtime
                    
                    size = get_dir_size(folder_path)
                    folders.append({
                        "path": folder_path,
                        "name": name,
                        "last_active": last_active,
                        "size": size
                    })
                except Exception:
                    pass

        # Sort by oldest accessed first
        folders.sort(key=lambda x: x["last_active"])

        deleted_count = 0
        freed_bytes = 0
        for item in folders:
            if current_total - freed_bytes <= target_bytes:
                break
            try:
                shutil.rmtree(item["path"], ignore_errors=True)
                freed_bytes += item["size"]
                deleted_count += 1
                print(f"[LRU Cache] Evicted old song cache: {item['name']} ({round(item['size'] / (1024*1024), 2)} MB)")
            except Exception as e:
                print(f"[LRU Cache] Failed to evict {item['name']}: {e}")

        freed_mb = round(freed_bytes / (1024 * 1024), 2)
        remaining_mb = round((current_total - freed_bytes) / (1024 * 1024), 2)
        print(f"[LRU Cache] Auto-cleanup complete. Deleted {deleted_count} items, freed {freed_mb} MB. Remaining: {remaining_mb} MB")
        return {"status": "ok", "deleted_count": deleted_count, "freed_mb": freed_mb, "current_mb": remaining_mb}
    except Exception as e:
        print(f"[LRU Cache Error] {e}")
        return {"status": "error", "message": str(e)}

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

@router.post("/cache/clean")
def clean_cache(max_size_gb: float = 10.0):
    return enforce_cache_limit(max_size_gb=max_size_gb)



@router.delete("/cache/{video_id}")
def delete_cache(video_id: str):
    try:
        if not video_id or ".." in video_id or "/" in video_id:
            raise HTTPException(status_code=400, detail="Invalid video_id")
            
        from server_state import progress_store, active_processes
        
        # 1. Kill active process if running
        if video_id in active_processes:
            try:
                active_processes[video_id].kill()
                print(f"[Cache Delete] Killed active process for {video_id}")
            except Exception as e:
                print(f"[Cache Delete] Failed to kill process for {video_id}: {e}")
            active_processes.pop(video_id, None)

        # 2. Clear progress store state
        progress_store.pop(video_id, None)
        
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
                
                is_match = False

                # Check 1: Match by exact folder name or prefix
                if folder_name == video_id or folder_name.startswith(video_id):
                    is_match = True

                # Check 2: Match by youoke.json metadata videoId
                if not is_match:
                    json_path = os.path.join(sub_dir, "youoke.json")
                    if os.path.exists(json_path):
                        try:
                            with open(json_path, "r", encoding="utf-8") as yf:
                                ydata = json.load(yf)
                                if ydata.get("videoId") == video_id:
                                    is_match = True
                        except Exception:
                            pass

                # Check 3: Match by files inside directory (e.g. video_id.m4a)
                if not is_match:
                    try:
                        for f in os.listdir(sub_dir):
                            if f.startswith(video_id):
                                is_match = True
                                break
                    except Exception:
                        pass
                
                if is_match:
                    try:
                        shutil.rmtree(sub_dir, ignore_errors=True)
                        deleted = True
                        print(f"[Cache Delete] Deleted folder: {sub_dir}")
                    except Exception as e:
                        print(f"[Cache Delete] Failed to delete folder {sub_dir}: {e}")

        # Always return success if we deleted or cleared state
        return {"status": "success", "message": f"Deleted cache for {video_id}"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to delete cache: {str(e)}"}
