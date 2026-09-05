from fastapi import APIRouter, HTTPException, UploadFile, File
import os
import shutil
import re
import sys
import torch
import json
import subprocess
from utils.config import CACHE_DIR, LIBRARY_DIR, load_config
from utils.logger import log_download_attempt
from utils.audio import convert_audio, is_valid_audio, get_ffmpeg_path, mix_audio
from services.downloader import download_audio
from routes.library_cache import load_library, enforce_cache_limit
from models import SeparateRequest
from server_state import progress_store, rapidapi_quota, active_processes

router = APIRouter()

import threading
import time

# ------------------------------------------------------------------
# COOKIES MANAGER: Export Chrome cookies → cookies.txt (Netscape fmt)
# Cache lasts 24h. Used by ALL download strategies so YouTube sees
# a real logged-in browser session, not a bot.
# ------------------------------------------------------------------
_COOKIES_TXT_PATH = os.path.join(os.path.dirname(__file__), '..', 'yt_cookies.txt')
_COOKIES_TXT_PATH = os.path.normpath(_COOKIES_TXT_PATH)
_COOKIES_LOCK = threading.Lock()
_COOKIES_LAST_EXPORT = 0
_COOKIES_TTL = 86400  # 24 hours

def _refresh_cookies_if_needed():
    """Export YouTube cookies from Chrome once per 24h. Thread-safe."""
    global _COOKIES_LAST_EXPORT
    with _COOKIES_LOCK:
        now = time.time()
        if now - _COOKIES_LAST_EXPORT < _COOKIES_TTL and os.path.exists(_COOKIES_TXT_PATH):
            return _COOKIES_TXT_PATH  # still fresh
        try:
            import yt_dlp as yt_dlp_mod
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'cookiesfrombrowser': ('chrome',),
                'cookiefile': _COOKIES_TXT_PATH,
                # Dummy extract: just export cookies without downloading
                'skip_download': True,
                'extract_flat': True,
            }
            with yt_dlp_mod.YoutubeDL(ydl_opts) as ydl:
                # Force cookie export by extracting a playlist page (cheap)
                try:
                    ydl.extract_info('https://www.youtube.com/feed/library', download=False)
                except Exception:
                    pass  # we only care about the cookie file being written
            if os.path.exists(_COOKIES_TXT_PATH) and os.path.getsize(_COOKIES_TXT_PATH) > 100:
                _COOKIES_LAST_EXPORT = now
                print(f'[Cookies] ✅ Exported Chrome cookies → {_COOKIES_TXT_PATH}')
                return _COOKIES_TXT_PATH
            else:
                print('[Cookies] ⚠️ Chrome cookie export produced empty file (Chrome may not be logged in to YouTube)')
        except Exception as e:
            print(f'[Cookies] ⚠️ Could not export Chrome cookies: {e}')
        return None  # cookies unavailable

def get_cookies_path():
    """Return a valid cookies.txt path, or None if unavailable."""
    # Use cached file if fresh enough (avoids Chrome lock on every request)
    if os.path.exists(_COOKIES_TXT_PATH) and (time.time() - _COOKIES_LAST_EXPORT) < _COOKIES_TTL:
        return _COOKIES_TXT_PATH
    return _refresh_cookies_if_needed()

# ------------------------------------------------------------------
# DEMUCS PATCH: Fix pad1d NaN-assertion bug (IEEE 754: NaN != NaN)
# The original assertion `(out == x0).all()` fails when input contains NaN
# (e.g., silent/zero audio after STFT normalization on zero-padded segments).
# Root cause: --segment value < model training segment (~7.8s) causes zero-padding
# which produces NaN via std=0 normalization. Fixed by: (1) using --segment 7,
# and (2) replacing == with nan_to_num comparison in the assertion.
# ------------------------------------------------------------------
try:
    import demucs.hdemucs as _hdemucs
    from torch.nn import functional as _F

    def _patched_pad1d(x, paddings, mode='constant', value=0.):
        x0 = x
        length = x.shape[-1]
        padding_left, padding_right = paddings
        if mode == 'reflect':
            max_pad = max(padding_left, padding_right)
            if length <= max_pad:
                extra_pad = max_pad - length + 1
                extra_pad_right = min(padding_right, extra_pad)
                extra_pad_left = extra_pad - extra_pad_right
                paddings = (padding_left - extra_pad_left, padding_right - extra_pad_right)
                x = _F.pad(x, (extra_pad_left, extra_pad_right))
        out = _F.pad(x, paddings, mode, value)
        assert out.shape[-1] == length + padding_left + padding_right
        assert (out[..., padding_left: padding_left + length].nan_to_num() == x0.nan_to_num()).all()
        return out

    _hdemucs.pad1d = _patched_pad1d
    print("[Demucs] pad1d NaN-safe patch applied successfully.")
except Exception as _e:
    print(f"[Demucs] Warning: Could not apply pad1d patch: {_e}")

# ------------------------------------------------------------------
# QUEUE SYSTEM (Strict Concurrency = 1) & PAUSE/RESUME SUPPORT
# ------------------------------------------------------------------
job_queue = []
queue_lock = threading.Lock()
paused_vids = set()
current_running_vid = None
worker_thread = None

def set_progress(vid: str, status: str, percent: int, message: str, mode: str = None, title: str = None, engine: str = None):
    current = progress_store.get(vid, {})
    current_title = title or current.get("title", vid)
    data = {
        "status": status,
        "percent": percent,
        "message": message,
        "title": current_title
    }
    if mode:
        data["mode"] = mode
    elif "mode" in current:
        data["mode"] = current["mode"]
        
    if engine:
        data["engine"] = engine
    elif "engine" in current:
        data["engine"] = current["engine"]
        
    progress_store[vid] = data

def update_queue_positions():
    with queue_lock:
        for idx, req in enumerate(job_queue):
            vid = req.video_id
            eng = getattr(req, 'engine', 'roformer')
            if vid in paused_vids:
                set_progress(vid, "paused", 0, "หยุดชั่วคราว", mode=req.mode, title=req.title, engine=eng)
            else:
                pos = idx + 1
                set_progress(vid, "queued", 0, f"รอคิว... (ลำดับที่ {pos})", mode=req.mode, title=req.title, engine=eng)

def worker_loop():
    global current_running_vid
    while True:
        target_req = None
        with queue_lock:
            # Find first job in queue that is NOT paused
            for idx, req in enumerate(job_queue):
                if req.video_id not in paused_vids:
                    target_req = job_queue.pop(idx)
                    break
            
            if target_req:
                current_running_vid = target_req.video_id

        if not target_req:
            current_running_vid = None
            time.sleep(1)
            continue

        vid = target_req.video_id
        # Double check if cancelled or paused while waiting
        if vid in paused_vids or progress_store.get(vid, {}).get("status") == "cancelled":
            current_running_vid = None
            update_queue_positions()
            continue

        try:
            update_queue_positions()
            _execute_separation(target_req)
        except Exception as e:
            print(f"[Queue Worker] Error executing separation for {vid}: {e}")
        finally:
            current_running_vid = None
            update_queue_positions()
            time.sleep(0.5)

def ensure_worker_running():
    global worker_thread
    if worker_thread is None or not worker_thread.is_alive():
        worker_thread = threading.Thread(target=worker_loop, daemon=True)
        worker_thread.start()

@router.get("/jobs")
def list_jobs():
    return [{"video_id": vid, **info} for vid, info in progress_store.items()]

@router.post("/pause/{video_id}")
def pause_job(video_id: str):
    paused_vids.add(video_id)
    # If it's currently running, kill process so worker can move on
    if video_id in active_processes:
        process = active_processes[video_id]
        try:
            process.kill()
            print(f"[Pause] Suspended active process for {video_id}")
        except Exception as e:
            print(f"[Pause] Process kill failed: {e}")
        active_processes.pop(video_id, None)

    set_progress(video_id, "paused", 0, "หยุดชั่วคราว")
    update_queue_positions()
    return {"status": "success", "message": f"Paused separation for {video_id}"}

@router.post("/resume/{video_id}")
def resume_job(video_id: str):
    paused_vids.discard(video_id)
    # Check if job is still in progress_store or needs re-enqueuing
    current = progress_store.get(video_id, {})
    title = current.get("title", video_id)
    mode = current.get("mode", "basic")

    with queue_lock:
        in_queue = any(req.video_id == video_id for req in job_queue)
        if not in_queue and current_running_vid != video_id and current.get("status") != "ready":
            req = SeparateRequest(video_id=video_id, title=title, mode=mode)
            job_queue.append(req)

    ensure_worker_running()
    update_queue_positions()
    return {"status": "success", "message": f"Resumed separation for {video_id}"}

@router.post("/cancel/{video_id}")
def cancel_job(video_id: str):
    paused_vids.discard(video_id)
    with queue_lock:
        global job_queue
        job_queue = [req for req in job_queue if req.video_id != video_id]

    if video_id in active_processes:
        process = active_processes[video_id]
        try:
            process.kill()
            print(f"[Cancel] Terminated process for {video_id}")
        except Exception as e:
            print(f"[Cancel] Process kill failed: {e}")
        active_processes.pop(video_id, None)
    
    set_progress(video_id, "cancelled", 0, "ยกเลิกแล้ว")
    update_queue_positions()
    return {"status": "success", "message": f"Cancelled separation for {video_id}"}

@router.get("/progress/{video_id}")
def get_progress(video_id: str):
    if video_id in progress_store:
        return progress_store[video_id]
    return {"status": "unknown", "percent": 0, "message": "รอคิว..."}

@router.post("/upload/{video_id}")
async def upload_audio(video_id: str, file: UploadFile = File(...)):
    if not video_id or ".." in video_id or "/" in video_id or "\\" in video_id:
        raise HTTPException(status_code=400, detail="Invalid video ID")
    try:
        song_dir = os.path.join(CACHE_DIR, video_id)
        os.makedirs(song_dir, exist_ok=True)
        file_location = os.path.join(song_dir, f"{video_id}.manual.m4a")
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        return {"info": f"file '{file.filename}' saved at '{file_location}'"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/separate")
def separate(req: SeparateRequest):
    vid = req.video_id
    if not vid or ".." in vid or "/" in vid or "\\" in vid:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid video_id")
    mode = req.mode
    song_dir = os.path.join(CACHE_DIR, vid)
    vocal_m4a = os.path.join(song_dir, "vocals.m4a")
    drums_m4a = os.path.join(song_dir, "drums.m4a")
    bass_m4a = os.path.join(song_dir, "bass.m4a")
    other_m4a = os.path.join(song_dir, "other.m4a")
    no_vocal_m4a = os.path.join(song_dir, "no_vocals.m4a")
    
    # Helper to check if file exists and is not empty
    def is_valid_file(p):
        return os.path.exists(p) and os.path.getsize(p) > 0
        
    is_cached = False
    if is_valid_file(vocal_m4a) and is_valid_file(drums_m4a) and is_valid_file(bass_m4a) and is_valid_file(other_m4a):
        is_cached = True
        mode = "pro"
    elif mode == "basic" and is_valid_file(vocal_m4a) and is_valid_file(no_vocal_m4a):
        is_cached = True
        
    if is_cached:
        set_progress(vid, "ready", 100, "พร้อมเล่น!", mode=mode, title=req.title)
        return {"status": "cached", "video_id": vid, "mode": mode}

    # 2. Check if already running or in queue
    with queue_lock:
        if current_running_vid == vid:
            return {"status": "processing", "video_id": vid, "message": "กำลังแยกเสียงอยู่ในขณะนี้..."}
        
        in_queue = any(r.video_id == vid for r in job_queue)
        if not in_queue:
            job_queue.append(req)

    ensure_worker_running()
    update_queue_positions()
    
    return {"status": "queued", "video_id": vid, "mode": mode, "message": "เพิ่มลงในคิวการทำงานเรียบร้อยแล้ว"}

def _execute_separation(req: SeparateRequest):
    vid = req.video_id
    mode = req.mode
    engine = getattr(req, "engine", "roformer") or "roformer"
    song_dir = os.path.join(CACHE_DIR, vid)
    vocal_m4a = os.path.join(song_dir, "vocals.m4a")
    drums_m4a = os.path.join(song_dir, "drums.m4a")
    bass_m4a = os.path.join(song_dir, "bass.m4a")
    other_m4a = os.path.join(song_dir, "other.m4a")
    no_vocal_m4a = os.path.join(song_dir, "no_vocals.m4a")
    set_progress(vid, "starting", 0, "กำลังเริ่มประมวลผล...", mode=mode, title=req.title, engine=engine)
    os.makedirs(song_dir, exist_ok=True)

    # Auto-evict old cache if disk limit exceeded (> 10GB)
    try:
        # Prevent deleting the current song, queued songs, or actively processing songs
        active_ids = [vid] + [r.video_id for r in job_queue] + list(active_processes.keys())
        enforce_cache_limit(max_size_gb=10.0, exclude_vids=active_ids)
    except Exception as _ce:
        print(f"[Cache Warning] Failed to run LRU eviction: {_ce}")
    
    # Try downloading cover image
    try:
        import urllib.request
        import socket
        cover_path = os.path.join(song_dir, "cover.jpg")
        if not os.path.exists(cover_path):
            socket.setdefaulttimeout(5)
            try:
                urllib.request.urlretrieve(f"https://img.youtube.com/vi/{vid}/maxresdefault.jpg", cover_path)
            except Exception:
                try:
                    urllib.request.urlretrieve(f"https://img.youtube.com/vi/{vid}/hqdefault.jpg", cover_path)
                except Exception:
                    pass
            finally:
                socket.setdefaulttimeout(None)
    except Exception as e:
        print(f"[Cover] Failed to download cover: {e}")
    
    # Cleanup old temp files
    for ext in ['webm', 'm4a', 'wav', 'mp4', 'mp3']:
        temp_file = os.path.join(song_dir, f"{vid}.{ext}")
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except:
                pass

    # --- DOWNLOAD PHASE (Multi-strategy, resilient) ---
    set_progress(vid, "downloading", 10, "กำลังดาวน์โหลดวิดีโอจาก YouTube...", mode=mode, title=req.title, engine=engine)
    m4a_path = os.path.join(song_dir, f"{vid}.m4a")
    yt_url = f"https://www.youtube.com/watch?v={vid}"
    download_success = False

    # Hook for local library files
    if vid.startswith("local_"):
        library = load_library()
        song = next((s for s in library if s["id"] == vid), None)
        if not song:
            set_progress(vid, "error", 0, "Local song not found in library", mode=mode, title=req.title, engine=engine)
            return {"status": "error", "message": "Local song not found in library"}
        source_filepath = os.path.join(LIBRARY_DIR, song["filename"])
        if not os.path.exists(source_filepath):
            set_progress(vid, "error", 0, "Local file missing", mode=mode, title=req.title, engine=engine)
            return {"status": "error", "message": "Local file missing"}
        import shutil
        shutil.copy2(source_filepath, m4a_path)
        download_success = True
        print(f"[{vid}] Loaded local file for separation.")

    if req.use_manual_upload:
        manual_path = os.path.join(song_dir, f"{vid}.manual.m4a")
        if os.path.exists(manual_path) and os.path.getsize(manual_path) > 0:
            m4a_path = manual_path
            download_success = True
            set_progress(vid, "converting", 20, "ใช้ออดิโอไฟล์ที่อัปโหลด...", mode=mode, title=req.title, engine=engine)
            print(f"[Manual Upload] Using uploaded file: {manual_path}")

    if not download_success:
        try:
            m4a_path = download_audio(yt_url, song_dir, vid, rapidapi_key=req.rapidapi_key)
            download_success = True
        except Exception as e:
            print(f"[Download Error] {e}")
            set_progress(vid, "error", 0, f"ดาวน์โหลดล้มเหลว: {str(e)[:100]}", mode=mode, title=req.title, engine=engine)
            return {"status": "error", "message": f"Download failed: {e}"}
            
    if progress_store.get(vid, {}).get("status") == "cancelled":
        print(f"[Separation] Job {vid} was cancelled during download. Aborting.")
        return {"status": "cancelled"}

    # 2. Convert to WAV for AI separation
    set_progress(vid, "converting", 20, "เตรียมไฟล์สำหรับ AI...", mode=mode, title=req.title, engine=engine)
    try:
        wav_path = os.path.join(song_dir, f"{vid}.wav")
        convert_audio(m4a_path, wav_path, fmt="wav")
    except Exception as e:
        set_progress(vid, "error", 0, "แปลงไฟล์ล้มเหลว", mode=mode, title=req.title, engine=engine)
        return {"status": "error", "message": str(e)}
        
    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")

    if progress_store.get(vid, {}).get("status") == "cancelled":
        print(f"[Separation] Job {vid} was cancelled during conversion. Aborting.")
        return {"status": "cancelled"}

    # 3. Run AI Separation
    engine_label = "Studio Vocal (BS-RoFormer)" if engine == "roformer" else "Fast Mode (MDX-Net)" if engine == "mdxnet" else "Demucs 4CH"
    set_progress(vid, "separating", 25, f"AI ({engine_label}) กำลังแยกเสียงร้อง...", mode=mode, title=req.title, engine=engine)
    try:
        # Construct model arguments based on mode and engine
        demucs_args = ["-n", "htdemucs_ft", "--shifts=0", "-d", device, "--segment", "7", "-j", "1", "-o", song_dir, wav_path]
        if mode == "basic":
            demucs_args = ["-n", "htdemucs_ft", "--shifts=0", "-d", device, "--segment", "7", "-j", "1", "--two-stems=vocals", "-o", song_dir, wav_path]

        if getattr(sys, 'frozen', False):
            cmd = [sys.executable, "demucs_worker"] + demucs_args
        else:
            server_script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "server.py")
            cmd = [sys.executable, server_script, "demucs_worker"] + demucs_args

        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, universal_newlines=True)
        active_processes[vid] = process

        buffer = ""
        full_log = ""
        while True:
            char = process.stdout.read(1)
            if not char:
                break
            full_log += char
            if char == '\r' or char == '\n':
                match = re.search(r'(\d+)%', buffer)
                if match:
                    demucs_pct = int(match.group(1))
                    overall_pct = 25 + int(demucs_pct * 0.70) # AI takes up 70% of total progress (25% to 95%)
                    set_progress(vid, "separating", overall_pct, f"AI ({engine_label}) กำลังแยกเสียงร้อง... {demucs_pct}%", mode=mode, title=req.title, engine=engine)
                buffer = ""
            else:
                buffer += char

        process.wait()
        if process.returncode != 0:
            if progress_store.get(vid, {}).get("status") == "cancelled":
                raise Exception("Job cancelled by user")
            raise Exception(f"Exit code {process.returncode}. Log: {full_log[-1000:]}")

        demucs_out_dir = os.path.join(song_dir, "htdemucs_ft", vid)
        vocal_wav = os.path.join(demucs_out_dir, "vocals.wav")

        if not os.path.exists(vocal_wav):
            raise Exception("AI separation output files not found.")

        # 4. Convert back to M4A to save space
        set_progress(vid, "compressing", 95, "กำลังบีบอัดไฟล์ขั้นสุดท้าย...", mode=mode, title=req.title, engine=engine)

        # Always convert vocals
        convert_audio(vocal_wav, vocal_m4a, fmt="m4a")

        if mode == "basic":
            no_vocal_wav = os.path.join(demucs_out_dir, "no_vocals.wav")
            if os.path.exists(no_vocal_wav):
                convert_audio(no_vocal_wav, no_vocal_m4a, fmt="m4a")
        else:
            # Pro mode (4 stems)
            stems = ["drums", "bass", "other"]
            stem_wav_paths = []
            for stem in stems:
                stem_wav = os.path.join(demucs_out_dir, f"{stem}.wav")
                stem_m4a = os.path.join(song_dir, f"{stem}.m4a")
                if os.path.exists(stem_wav):
                    convert_audio(stem_wav, stem_m4a, fmt="m4a")
                    stem_wav_paths.append(stem_wav)
            
            # Synthesize backing track (no_vocals.m4a) from instrumental stems for universal playback
            try:
                if stem_wav_paths:
                    mix_audio(stem_wav_paths, no_vocal_m4a, fmt="m4a")
            except Exception as mix_err:
                print(f"[Separation] Failed to pre-mix no_vocals.m4a: {mix_err}")

        # Save mode and engine flag for client checks
        with open(os.path.join(song_dir, "mode.txt"), "w") as f:
            f.write(mode)
        with open(os.path.join(song_dir, "engine.txt"), "w") as f:
            f.write(engine)

        # Copy separated files to custom storage path if defined
        cfg = load_config()
        custom_path = cfg.get("custom_storage_path")
        if custom_path and os.path.exists(custom_path):
            try:
                safe_title = re.sub(r'[\\/*?:"<>|]', "", req.title).strip() or vid
                target_folder = os.path.join(custom_path, safe_title)
                os.makedirs(target_folder, exist_ok=True)
                for m4a_file in [f for f in os.listdir(song_dir) if f.endswith('.m4a')]:
                    try:
                        shutil.copyfile(os.path.join(song_dir, m4a_file), os.path.join(target_folder, m4a_file))
                    except Exception as e:
                        print(f"[Storage Error] Failed to copy {m4a_file}: {str(e)}")
                
                try:
                    # Copy mode.txt, engine.txt, and cover.jpg
                    shutil.copyfile(os.path.join(song_dir, "mode.txt"), os.path.join(target_folder, "mode.txt"))
                    shutil.copyfile(os.path.join(song_dir, "engine.txt"), os.path.join(target_folder, "engine.txt"))
                except Exception as e:
                    print(f"[Storage Error] Failed to copy mode/engine: {str(e)}")
                    
                try:
                    shutil.copyfile(os.path.join(song_dir, "cover.jpg"), os.path.join(target_folder, "cover.jpg"))
                except Exception:
                    pass
                    
                # Create youoke.json
                try:
                    import datetime
                    ydata = {
                        "videoId": vid,
                        "title": req.title,
                        "mode": mode,
                        "engine": engine,
                        "createdAt": datetime.datetime.utcnow().isoformat() + "Z",
                        "version": "2.0"
                    }
                    with open(os.path.join(target_folder, "youoke.json"), "w", encoding="utf-8") as yf:
                        json.dump(ydata, yf, ensure_ascii=False, indent=2)
                except Exception as e:
                    print(f"[Storage Error] Failed to create youoke.json: {str(e)}")
                    
                print(f"[Storage] Copied output to {target_folder}")
            except Exception as e:
                print(f"[Storage Error] Failed to create folder {custom_path}/{safe_title}: {str(e)}")

        # Save title for cache listing
        with open(os.path.join(song_dir, "title.txt"), "w", encoding="utf-8") as f:
            f.write(req.title)

        set_progress(vid, "success", 100, "เสร็จสมบูรณ์!", mode=mode, title=req.title, engine=engine)

    except Exception as e:
        print(f"[Separation Error] Failed for {vid}: {str(e)}")
        if progress_store.get(vid, {}).get("status") == "cancelled":
            pass
        else:
            set_progress(vid, "error", 0, "การแยกเสียงล้มเหลว", mode=mode, title=req.title, engine=engine)
        return {"status": "error", "message": f"Separation failed: {str(e)}"}

        
    finally:
        active_processes.pop(vid, None)
        # Cleanup temporary files (WAV is huge) MUST run even if there's an error
        for tmp_file in [m4a_path, wav_path]:
            try:
                if os.path.exists(tmp_file):
                    os.remove(tmp_file)
            except Exception as e:
                print(f"Failed to remove {tmp_file}: {e}")
                
        try:
            demucs_dir = os.path.join(song_dir, "htdemucs_ft")
            if os.path.exists(demucs_dir):
                shutil.rmtree(demucs_dir, ignore_errors=True)
        except Exception as e:
            print(f"Failed to remove demucs dir: {e}")

        # If job was cancelled, delete output folder so we don't leave broken files
        if progress_store.get(vid, {}).get("status") == "cancelled":
            try:
                if os.path.exists(song_dir):
                    shutil.rmtree(song_dir)
                    print(f"[Cancel] Cleaned up cancelled song folder: {song_dir}")
            except Exception as e:
                print(f"[Cancel] Failed to remove cancelled song directory: {e}")
            
    return {"status": "success", "video_id": vid, "mode": mode}

