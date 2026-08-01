from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
import os
import json
from utils.config import CACHE_DIR, get_active_storage_dir

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
                youoke_json_path = os.path.join(song_dir, "youoke.json")
                if os.path.exists(youoke_json_path):
                    try:
                        with open(youoke_json_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            
                        has_vocals = os.path.exists(os.path.join(song_dir, "vocals.m4a"))
                        has_no_vocals = os.path.exists(os.path.join(song_dir, "no_vocals.m4a"))
                        has_drums = os.path.exists(os.path.join(song_dir, "drums.m4a"))
                        has_bass = os.path.exists(os.path.join(song_dir, "bass.m4a"))
                        has_other = os.path.exists(os.path.join(song_dir, "other.m4a"))
                        
                        mode = "basic"
                        if os.path.exists(os.path.join(song_dir, "mode.txt")):
                            with open(os.path.join(song_dir, "mode.txt"), "r") as mf:
                                mode = mf.read().strip()
                                
                        data["local_status"] = {
                            "has_vocals": has_vocals,
                            "has_no_vocals": has_no_vocals,
                            "has_drums": has_drums,
                            "has_bass": has_bass,
                            "has_other": has_other,
                            "mode": mode
                        }
                        
                        results.append(data)
                    except:
                        pass
                        
    process_dir(active_dir)
    
    if active_dir != CACHE_DIR:
        process_dir(CACHE_DIR)
        
    return {"status": "success", "results": results}

@router.get("/files/{video_id}/{filename}")
async def serve_audio_file(video_id: str, filename: str):
    active_dir = get_active_storage_dir()
    
    legacy_path = os.path.join(active_dir, video_id)
    if os.path.exists(legacy_path) and os.path.isdir(legacy_path):
        if filename == "original.audio":
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
                
        filepath = os.path.join(legacy_path, filename)
        if os.path.exists(filepath):
            return FileResponse(filepath, headers={"Accept-Ranges": "bytes"})
            
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
                                    return FileResponse(orig_explicit, headers={"Accept-Ranges": "bytes"})
                                orig_explicit2 = os.path.join(song_dir, "original.m4a")
                                if os.path.exists(orig_explicit2):
                                    return FileResponse(orig_explicit2, headers={"Accept-Ranges": "bytes"})
                                    
                                for f in os.listdir(song_dir):
                                    if f not in ["vocals.m4a", "no_vocals.m4a", "bass.m4a", "drums.m4a", "other.m4a", "lyrics_timeline.json", "youoke.json", "mode.txt", "title.txt"] and not f.endswith(".yok"):
                                        if f.endswith(('.m4a', '.mp3', '.webm', '.wav', '.ogg')):
                                            return FileResponse(os.path.join(song_dir, f), headers={"Accept-Ranges": "bytes"})
                                if os.path.exists(os.path.join(song_dir, "vocals.m4a")):
                                    return FileResponse(os.path.join(song_dir, "vocals.m4a"), headers={"Accept-Ranges": "bytes"})
                            
                            if filename == "no_vocals.m4a" and not os.path.exists(os.path.join(song_dir, "no_vocals.m4a")):
                                if os.path.exists(os.path.join(song_dir, "other.m4a")):
                                    return FileResponse(os.path.join(song_dir, "other.m4a"), headers={"Accept-Ranges": "bytes"})
                            
                            filepath = os.path.join(song_dir, filename)
                            if os.path.exists(filepath):
                                return FileResponse(filepath, headers={"Accept-Ranges": "bytes"})
                except:
                    pass
                    
    fallback_path = os.path.join(CACHE_DIR, video_id, filename)
    if os.path.exists(fallback_path):
        return FileResponse(fallback_path, headers={"Accept-Ranges": "bytes"})
        
    raise HTTPException(status_code=404, detail="File not found")
