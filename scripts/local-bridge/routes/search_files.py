from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
import json
from utils.config import CACHE_DIR, HISTORY_FILE, get_active_storage_dir

router = APIRouter()

@router.get("/download/history")
def get_download_history():
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
def search_youtube(q: str, limit: int = 5):
    try:
        import yt_dlp
        ydl_opts = {"extract_flat": True, "quiet": True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch{limit}:{q}", download=False)
            results = []
            for entry in info.get("entries", []):
                duration_sec = int(entry.get("duration") or 0)
                if duration_sec:
                    m, s = divmod(duration_sec, 60)
                    h, m = divmod(m, 60)
                    duration_str = f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"
                else:
                    duration_str = ""
                    
                results.append({
                    "id": entry.get("id"),
                    "title": entry.get("title"),
                    "thumbnails": [{"url": f"https://img.youtube.com/vi/{entry.get('id')}/mqdefault.jpg"}],
                    "channel": {"name": entry.get("uploader", "YouTube")},
                    "duration": duration_str,
                    "viewCount": {"short": str(entry.get("view_count", ""))}
                })
        return {"status": "success", "results": results}
    except Exception as e:
        return {"status": "error", "message": f"Search failed: {str(e)}"}

@router.get("/files/{video_id}/{filename}")
async def serve_audio_file(video_id: str, filename: str):
    active_dir = get_active_storage_dir()
    
    legacy_path = os.path.join(active_dir, video_id)
    if os.path.exists(legacy_path) and os.path.isdir(legacy_path):
        if filename == "original.audio":
            for f in os.listdir(legacy_path):
                if f not in ["vocals.m4a", "bass.m4a", "drums.m4a", "other.m4a", "lyrics_timeline.json", "youoke.json", "mode.txt", "title.txt"]:
                    if f.endswith(('.m4a', '.mp3', '.webm', '.wav', '.ogg')):
                        return FileResponse(os.path.join(legacy_path, f), headers={"Accept-Ranges": "bytes"})
                        
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
                            filepath = os.path.join(song_dir, filename)
                            if os.path.exists(filepath):
                                return FileResponse(filepath, headers={"Accept-Ranges": "bytes"})
                except:
                    pass
                    
    fallback_path = os.path.join(CACHE_DIR, video_id, filename)
    if os.path.exists(fallback_path):
        return FileResponse(fallback_path, headers={"Accept-Ranges": "bytes"})
        
    raise HTTPException(status_code=404, detail="File not found")
