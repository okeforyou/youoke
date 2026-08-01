import os

path = "routes/creator.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Find the start of @router.post("/export")
start_idx = content.find('@router.post("/export")')
if start_idx != -1:
    new_export = """@router.post("/export")
async def export_video(
    video_id: str = Body(...),
    timeline: list = Body(...)
):
    try:
        from utils.config import CACHE_DIR, get_active_storage_dir
        import zipfile
        from fastapi.responses import FileResponse
        
        active_dir = get_active_storage_dir()
        song_dir = os.path.join(active_dir, video_id)
        if not os.path.exists(song_dir):
            song_dir = os.path.join(CACHE_DIR, video_id)
            
        if not os.path.exists(song_dir):
            raise HTTPException(status_code=404, detail="Song directory not found.")
            
        # 1. Save lyrics.json
        lyrics_path = os.path.join(song_dir, "lyrics.json")
        with open(lyrics_path, "w", encoding="utf-8") as f:
            json.dump({"words": timeline}, f, ensure_ascii=False, indent=2)
            
        # 2. Build metadata.json
        meta_path = os.path.join(song_dir, "metadata.json")
        title = "Unknown"
        title_txt = os.path.join(song_dir, "title.txt")
        if os.path.exists(title_txt):
            with open(title_txt, "r", encoding="utf-8") as f:
                title = f.read().strip()
                
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({"videoId": video_id, "title": title}, f, ensure_ascii=False, indent=2)
            
        # 3. Create .yok (zip) archive
        export_path = os.path.join(song_dir, f"{video_id}.yok")
        
        files_to_zip = ["lyrics.json", "metadata.json", "vocals.m4a", "no_vocals.m4a"]
        # Include all .m4a files in case it's pro mode (drums.m4a, etc) or original
        for f in os.listdir(song_dir):
            if f.endswith(".m4a") and f not in files_to_zip:
                files_to_zip.append(f)
                
        with zipfile.ZipFile(export_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for fname in files_to_zip:
                fpath = os.path.join(song_dir, fname)
                if os.path.exists(fpath):
                    zipf.write(fpath, arcname=fname)
                    
        return FileResponse(export_path, media_type="application/zip", filename=f"{title}.yok")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
"""
    content = content[:start_idx] + new_export
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Export route updated successfully.")
else:
    print("Export route not found.")
