import re

with open("scripts/local-bridge/server.py", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add get_active_storage_dir()
if "def get_active_storage_dir" not in code:
    code = code.replace("def load_config():", """def get_active_storage_dir():
    cfg = load_config()
    custom_path = cfg.get("custom_storage_path")
    if custom_path and os.path.exists(custom_path):
        return custom_path
    return CACHE_DIR

def load_config():""")

# 2. Modify list_cache()
list_cache_old = """@app.get("/cache/list")
def list_cache():
    try:
        if not os.path.exists(CACHE_DIR):
            return {"status": "success", "results": []}
        
        results = []
        for vid in os.listdir(CACHE_DIR):
            song_dir = os.path.join(CACHE_DIR, vid)
            if not os.path.isdir(song_dir):
                continue
                
            vocal_m4a = os.path.join(song_dir, "vocals.m4a")
            if not os.path.exists(vocal_m4a):
                continue
                
            # Get folder size
            total_size = sum(os.path.getsize(os.path.join(song_dir, f)) for f in os.listdir(song_dir) if os.path.isfile(os.path.join(song_dir, f)))
            size_mb = total_size / (1024 * 1024)
            
            # Determine mode
            mode = "basic"
            if os.path.exists(os.path.join(song_dir, "drums.m4a")):
                mode = "pro"
                
            title = f"ไฟล์เพลง {vid}"
            title_path = os.path.join(song_dir, "title.txt")
            if os.path.exists(title_path):
                with open(title_path, "r", encoding="utf-8") as f:
                    title = f.read().strip()
                
            # Get created time
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
        return {"status": "error", "message": f"Failed to list cache: {str(e)}"}"""

list_cache_new = """@app.get("/cache/list")
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
                
            # Parse youoke.json if exists
            youoke_json_path = os.path.join(song_dir, "youoke.json")
            vid = folder_name
            title = f"ไฟล์เพลง {folder_name}"
            
            if os.path.exists(youoke_json_path):
                try:
                    import json
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

            # Get folder size
            total_size = sum(os.path.getsize(os.path.join(song_dir, f)) for f in os.listdir(song_dir) if os.path.isfile(os.path.join(song_dir, f)))
            size_mb = total_size / (1024 * 1024)
            
            # Determine mode
            mode = "basic"
            if os.path.exists(os.path.join(song_dir, "drums.m4a")):
                mode = "pro"
                
            # Get created time
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
        return {"status": "error", "message": f"Failed to list cache: {str(e)}"}"""

if list_cache_old in code:
    code = code.replace(list_cache_old, list_cache_new)
else:
    print("Warning: list_cache_old not found exactly.")

# 3. Add youoke.json generation
separate_copy_old = """                try:
                    # Copy mode.txt
                    shutil.copy(os.path.join(song_dir, "mode.txt"), os.path.join(target_folder, "mode.txt"))
                except Exception as e:
                    print(f"[Storage Error] Failed to copy mode.txt: {str(e)}")
                print(f"[Storage] Copied output to {target_folder}")"""

separate_copy_new = """                try:
                    # Copy mode.txt
                    shutil.copy(os.path.join(song_dir, "mode.txt"), os.path.join(target_folder, "mode.txt"))
                except Exception as e:
                    print(f"[Storage Error] Failed to copy mode.txt: {str(e)}")
                    
                # Create youoke.json
                try:
                    import datetime
                    ydata = {
                        "videoId": vid,
                        "title": req.title,
                        "mode": mode,
                        "createdAt": datetime.datetime.utcnow().isoformat() + "Z",
                        "version": "1.0"
                    }
                    with open(os.path.join(target_folder, "youoke.json"), "w", encoding="utf-8") as yf:
                        json.dump(ydata, yf, ensure_ascii=False, indent=2)
                except Exception as e:
                    print(f"[Storage Error] Failed to create youoke.json: {str(e)}")
                    
                print(f"[Storage] Copied output to {target_folder}")"""

if separate_copy_old in code:
    code = code.replace(separate_copy_old, separate_copy_new)
else:
    print("Warning: separate_copy_old not found exactly.")

# 4. Remove StaticFiles mount and add dynamic route
mount_old = """# Mount cache directory for robust static file serving with range request support
app.mount("/files", StaticFiles(directory=CACHE_DIR), name="files")"""

mount_new = """# Dynamic static file serving supporting Range requests and Universal Storage
import mimetypes
from starlette.responses import FileResponse
from fastapi import Path

@app.get("/files/{video_id}/{filename}")
async def serve_audio_file(video_id: str, filename: str):
    active_dir = get_active_storage_dir()
    
    # 1. First, check if there's a legacy folder named directly as video_id
    legacy_path = os.path.join(active_dir, video_id)
    if os.path.exists(legacy_path) and os.path.isdir(legacy_path):
        filepath = os.path.join(legacy_path, filename)
        if os.path.exists(filepath):
            return FileResponse(filepath, headers={"Accept-Ranges": "bytes"})
            
    # 2. If not found, scan folders for youoke.json mapping
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
                    
    # 3. Fallback to default CACHE_DIR just in case active_dir is custom and missing the file
    fallback_path = os.path.join(CACHE_DIR, video_id, filename)
    if os.path.exists(fallback_path):
        return FileResponse(fallback_path, headers={"Accept-Ranges": "bytes"})
        
    raise HTTPException(status_code=404, detail="File not found")
"""

if mount_old in code:
    code = code.replace(mount_old, mount_new)
else:
    print("Warning: mount_old not found exactly.")

with open("scripts/local-bridge/server.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Patching complete.")
