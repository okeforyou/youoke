from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
import os
import json
from utils.config import CACHE_DIR, get_active_storage_dir
from utils.audio import mix_audio

def _ensure_no_vocals(dir_path: str):
    no_vocal_path = os.path.join(dir_path, "no_vocals.m4a")
    if os.path.exists(no_vocal_path):
        return no_vocal_path
    stems = [os.path.join(dir_path, f"{s}.m4a") for s in ["drums", "bass", "other"]]
    existing_stems = [s for s in stems if os.path.exists(s) and os.path.getsize(s) > 0]
    if existing_stems:
        if len(existing_stems) > 1:
            try:
                if mix_audio(existing_stems, no_vocal_path, fmt="m4a"):
                    return no_vocal_path
            except Exception as e:
                print(f"[_ensure_no_vocals] mix failed: {e}")
        other_path = os.path.join(dir_path, "other.m4a")
        if os.path.exists(other_path):
            return other_path
        return existing_stems[0]
    return None

router = APIRouter()

@router.get("/cache/list")
async def list_cached_songs():
    active_dir = get_active_storage_dir()
    
    results = []
    
    def process_dir(directory):
        if not os.path.exists(directory):
            return
            
        for folder_name in os.listdir(directory):
            song_dir = os.path.join(directory, folder_name)
            if os.path.isdir(song_dir):
                has_vocals = os.path.exists(os.path.join(song_dir, "vocals.m4a"))
                if not has_vocals:
                    continue
                
                vid = folder_name
                title = f"{folder_name}"
                data = {}
                youoke_json_path = os.path.join(song_dir, "youoke.json")
                
                if os.path.exists(youoke_json_path):
                    try:
                        with open(youoke_json_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            vid = data.get("videoId", folder_name)
                            title = data.get("title", folder_name)
                    except:
                        pass
                
                if not data:
                    title_path = os.path.join(song_dir, "title.txt")
                    if os.path.exists(title_path):
                        try:
                            with open(title_path, "r", encoding="utf-8") as f:
                                title = f.read().strip()
                        except:
                            pass
                    
                    # Fallback video_id: scan for m4a that is not a stem
                    try:
                        for f in os.listdir(song_dir):
                            if f.endswith(".m4a") and f not in ["vocals.m4a", "no_vocals.m4a", "bass.m4a", "drums.m4a", "other.m4a"]:
                                possible_vid = f.replace(".m4a", "")
                                if len(possible_vid) == 11 and all(c.isalnum() or c in "-_" for c in possible_vid):
                                    vid = possible_vid
                                    break
                    except:
                        pass
                
                try:
                    import time
                    has_no_vocals = os.path.exists(os.path.join(song_dir, "no_vocals.m4a"))
                    has_drums = os.path.exists(os.path.join(song_dir, "drums.m4a"))
                    has_bass = os.path.exists(os.path.join(song_dir, "bass.m4a"))
                    has_other = os.path.exists(os.path.join(song_dir, "other.m4a"))
                    
                    mode = "basic"
                    if os.path.exists(os.path.join(song_dir, "mode.txt")):
                        with open(os.path.join(song_dir, "mode.txt"), "r") as mf:
                            mode = mf.read().strip()
                    elif has_drums:
                        mode = "pro"

                    # Compute size_mb
                    total_size = sum(
                        os.path.getsize(os.path.join(song_dir, f))
                        for f in os.listdir(song_dir)
                        if os.path.isfile(os.path.join(song_dir, f))
                    )
                    size_mb = round(total_size / (1024 * 1024), 2)

                    # created_at as unix timestamp (for JS: new Date(created_at * 1000))
                    vocals_path = os.path.join(song_dir, "vocals.m4a")
                    created_at = os.path.getctime(vocals_path)

                    results.append({
                        "video_id": vid,
                        "title": title,
                        "mode": mode,
                        "size_mb": size_mb,
                        "created_at": created_at,
                        "local_status": {
                            "has_vocals": has_vocals,
                            "has_no_vocals": has_no_vocals,
                            "has_drums": has_drums,
                            "has_bass": has_bass,
                            "has_other": has_other,
                            "mode": mode
                        }
                    })
                except:
                    pass
                        
    process_dir(active_dir)
    
    if active_dir != CACHE_DIR:
        process_dir(CACHE_DIR)

    results.sort(key=lambda x: x.get("created_at", 0), reverse=True)
    return {"status": "success", "results": results}

def _make_file_response(filepath: str) -> FileResponse:
    ext = os.path.splitext(filepath)[1].lower()
    media_type = "audio/mp4"
    if ext == ".mp3":
        media_type = "audio/mpeg"
    elif ext == ".wav":
        media_type = "audio/wav"
    elif ext == ".webm":
        media_type = "audio/webm"
    elif ext == ".ogg":
        media_type = "audio/ogg"
    elif ext in [".jpg", ".jpeg"]:
        media_type = "image/jpeg"
    elif ext == ".png":
        media_type = "image/png"
    elif ext == ".json":
        media_type = "application/json"
    elif ext == ".txt":
        media_type = "text/plain"

    headers = {
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Private-Network": "true"
    }
    return FileResponse(filepath, media_type=media_type, headers=headers)

@router.get("/files/{video_id}/{filename}")
async def serve_audio_file(video_id: str, filename: str):
    active_dir = get_active_storage_dir()
    
    legacy_path = os.path.join(active_dir, video_id)
    if os.path.exists(legacy_path) and os.path.isdir(legacy_path):
        if filename == "original.audio":
            orig_explicit = os.path.join(legacy_path, f"{video_id}.m4a")
            if os.path.exists(orig_explicit):
                return _make_file_response(orig_explicit)
            for f in os.listdir(legacy_path):
                if f not in ["vocals.m4a", "no_vocals.m4a", "bass.m4a", "drums.m4a", "other.m4a", "lyrics_timeline.json", "youoke.json", "mode.txt", "title.txt"] and not f.endswith(".yok"):
                    if f.endswith(('.m4a', '.mp3', '.webm', '.wav', '.ogg')):
                        return _make_file_response(os.path.join(legacy_path, f))
            if os.path.exists(os.path.join(legacy_path, "vocals.m4a")):
                return _make_file_response(os.path.join(legacy_path, "vocals.m4a"))
                
        if filename == "no_vocals.m4a":
            resolved_nv = _ensure_no_vocals(legacy_path)
            if resolved_nv and os.path.exists(resolved_nv):
                return _make_file_response(resolved_nv)
                
        filepath = os.path.join(legacy_path, filename)
        if os.path.exists(filepath):
            return _make_file_response(filepath)
            
    if os.path.exists(active_dir):
        for folder_name in os.listdir(active_dir):
            song_dir = os.path.join(active_dir, folder_name)
            if not os.path.isdir(song_dir):
                continue
                
            youoke_json_path = os.path.join(song_dir, "youoke.json")
            if os.path.exists(youoke_json_path):
                try:
                    with open(youoke_json_path, "r", encoding="utf-8") as yf:
                        ydata = json.load(yf)
                        if ydata.get("videoId") == video_id:
                            if filename == "original.audio":
                                orig_explicit = os.path.join(song_dir, f"{video_id}.m4a")
                                if os.path.exists(orig_explicit):
                                    return _make_file_response(orig_explicit)
                                orig_explicit2 = os.path.join(song_dir, "original.m4a")
                                if os.path.exists(orig_explicit2):
                                    return _make_file_response(orig_explicit2)
                                    
                                for f in os.listdir(song_dir):
                                    if f not in ["vocals.m4a", "no_vocals.m4a", "bass.m4a", "drums.m4a", "other.m4a", "lyrics_timeline.json", "youoke.json", "mode.txt", "title.txt"] and not f.endswith(".yok"):
                                        if f.endswith(('.m4a', '.mp3', '.webm', '.wav', '.ogg')):
                                            return _make_file_response(os.path.join(song_dir, f))
                                if os.path.exists(os.path.join(song_dir, "vocals.m4a")):
                                    return _make_file_response(os.path.join(song_dir, "vocals.m4a"))
                            
                            if filename == "no_vocals.m4a":
                                resolved_nv = _ensure_no_vocals(song_dir)
                                if resolved_nv and os.path.exists(resolved_nv):
                                    return _make_file_response(resolved_nv)
                            
                            filepath = os.path.join(song_dir, filename)
                            if os.path.exists(filepath):
                                return _make_file_response(filepath)
                except:
                    pass
                    
    fallback_dir = os.path.join(CACHE_DIR, video_id)
    if filename == "no_vocals.m4a" and os.path.exists(fallback_dir):
        resolved_nv = _ensure_no_vocals(fallback_dir)
        if resolved_nv and os.path.exists(resolved_nv):
            return _make_file_response(resolved_nv)

    fallback_path = os.path.join(CACHE_DIR, video_id, filename)
    if os.path.exists(fallback_path):
        return _make_file_response(fallback_path)
        
    raise HTTPException(status_code=404, detail="File not found")
