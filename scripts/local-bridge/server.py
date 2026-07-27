import os
import subprocess
import shutil
import sys
import torch
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import urllib.request
import time
import signal
import socket
import threading
import ssl

# Bypass SSL Verification issues on macOS (resolves pytubefix SSL errors)
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

VERSION = "1.2.0"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://play.okeforyou.com"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import Response

@app.middleware("http")
async def add_pna_headers(request, call_next):
    if request.method == "OPTIONS" and request.headers.get("access-control-request-private-network") == "true":
        response = Response(status_code=204)
        response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        response.headers["Access-Control-Max-Age"] = "86400"
        return response
    response = await call_next(request)
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

class SeparateRequest(BaseModel):
    video_id: str
    title: str = "Unknown Title"
    mode: str = "basic"  # "basic" or "pro"

CACHE_DIR = os.path.expanduser("~/Library/Application Support/YouOke/Cache")
os.makedirs(CACHE_DIR, exist_ok=True)

HISTORY_FILE = os.path.join(CACHE_DIR, "download_history.json")

def log_download_attempt(video_id: str, title: str, attempts: list, status: str):
    try:
        history = []
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                try:
                    history = json.load(f)
                except:
                    history = []
        
        new_entry = {
            "timestamp": datetime.now().isoformat(),
            "video_id": video_id,
            "title": title,
            "status": status,
            "attempts": attempts
        }
        history.insert(0, new_entry)
        history = history[:100]  # Keep last 100 entries
        
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Failed to log download history: {e}")

@app.get("/download/history")
def get_download_history():
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
    return {"status": "ok", "message": "YouOke Local AI Bridge is running.", "device": device}

@app.get("/config")
def get_config():
    return {"cache_dir": CACHE_DIR}

@app.get("/search")
def search_youtube(q: str, limit: int = 5):
    try:
        import yt_dlp
        ydl_opts = {"extract_flat": True, "quiet": True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch{limit}:{q}", download=False)
            results = []
            for entry in info.get("entries", []):
                # Convert duration from seconds to string format for frontend if needed, but it's just display
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

@app.get("/cache/list")
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
        return {"status": "error", "message": f"Failed to list cache: {str(e)}"}

@app.delete("/cache/{video_id}")
def delete_cache(video_id: str):
    try:
        # validate video_id format to prevent directory traversal
        if not video_id or ".." in video_id or "/" in video_id:
            raise HTTPException(status_code=400, detail="Invalid video_id")
            
        song_dir = os.path.join(CACHE_DIR, video_id)
        if os.path.exists(song_dir):
            shutil.rmtree(song_dir)
            return {"status": "success", "message": f"Deleted cache for {video_id}"}
        else:
            return {"status": "error", "message": "Cache not found"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to delete cache: {str(e)}"}

@app.get("/version")
def get_version():
    return {"status": "success", "version": VERSION}

@app.post("/shutdown")
def shutdown_server():
    def kill_it():
        time.sleep(0.5)
        os.kill(os.getpid(), signal.SIGTERM)
    threading.Thread(target=kill_it).start()
    return {"status": "success", "message": "Shutting down old server instance..."}

def get_ffmpeg_path():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except:
        return "ffmpeg"

def convert_audio(input_path, output_path, fmt="wav"):
    ffmpeg_exe = get_ffmpeg_path()
    try:
        if fmt == "wav":
            subprocess.run([ffmpeg_exe, "-y", "-i", input_path, output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif fmt == "m4a":
            subprocess.run([ffmpeg_exe, "-y", "-i", input_path, "-c:a", "aac", "-b:a", "128k", output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return
    except FileNotFoundError:
        # ffmpeg not found, fallback to afconvert (macOS only)
        try:
            if fmt == "wav":
                subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16", input_path, output_path], check=True)
            elif fmt == "m4a":
                subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "128000", input_path, output_path], check=True)
        except Exception as e:
            raise Exception(f"Audio conversion failed (afconvert): {str(e)}")
    except Exception as e:
        raise Exception(f"FFmpeg conversion failed: {str(e)}")

import re

progress_store = {}

@app.get("/progress/{video_id}")
def get_progress(video_id: str):
    if video_id in progress_store:
        return progress_store[video_id]
    return {"status": "unknown", "percent": 0, "message": "รอคิว..."}

@app.post("/separate")
def separate(req: SeparateRequest):
    vid = req.video_id
    mode = req.mode
    song_dir = os.path.join(CACHE_DIR, vid)
    
    progress_store[vid] = {"status": "starting", "percent": 0, "message": "กำลังตรวจสอบข้อมูล..."}
    
    # Check if already cached
    vocal_m4a = os.path.join(song_dir, "vocals.m4a")
    no_vocal_m4a = os.path.join(song_dir, "no_vocals.m4a")
    drums_m4a = os.path.join(song_dir, "drums.m4a")
    bass_m4a = os.path.join(song_dir, "bass.m4a")
    other_m4a = os.path.join(song_dir, "other.m4a")
    
    # Cache hit logic
    is_cached = False
    if os.path.exists(vocal_m4a) and os.path.exists(drums_m4a) and os.path.exists(bass_m4a) and os.path.exists(other_m4a):
        # We already have Pro stems, so even if basic is requested, use Pro
        is_cached = True
        mode = "pro"
    elif mode == "basic" and os.path.exists(vocal_m4a) and os.path.exists(no_vocal_m4a):
        is_cached = True
        
    if is_cached:
        progress_store[vid] = {"status": "success", "percent": 100, "message": "ดึงข้อมูลจากแคชสำเร็จ!", "mode": mode}
        return {"status": "cached", "video_id": vid, "mode": mode}
        
    os.makedirs(song_dir, exist_ok=True)
    
    # Cleanup old temp files
    for ext in ['webm', 'm4a', 'wav', 'mp4', 'mp3']:
        temp_file = os.path.join(song_dir, f"{vid}.{ext}")
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except:
                pass

    # --- DOWNLOAD PHASE (Multi-strategy, resilient) ---
    # Strategy order: yt-dlp binary (new clients) → yt-dlp Python module → pytubefix (many clients) → innertube+ffmpeg
    progress_store[vid] = {"status": "downloading", "percent": 10, "message": "กำลังดาวน์โหลดวิดีโอจาก YouTube..."}
    m4a_path = os.path.join(song_dir, f"{vid}.m4a")
    yt_url = f"https://www.youtube.com/watch?v={vid}"

    download_success = False
    attempts = []
    YTDLP_TIMEOUT = 90  # seconds per yt-dlp attempt
    PYTUBEFIX_TIMEOUT = 60  # seconds per pytubefix attempt

    def _find_downloaded_file(song_dir, vid):
        """Scan song_dir for any successfully downloaded audio file for this video."""
        exclude = {"vocals.m4a", "no_vocals.m4a", "drums.m4a", "bass.m4a", "other.m4a"}
        candidates = [
            f for f in os.listdir(song_dir)
            if f.startswith(vid) and f not in exclude and not f.endswith(".wav")
        ]
        if candidates:
            candidates.sort(key=lambda x: os.path.getmtime(os.path.join(song_dir, x)), reverse=True)
            path = os.path.join(song_dir, candidates[0])
            if os.path.getsize(path) > 0:
                return path
        return None

    # ── Strategy 1: yt-dlp BINARY (bundled) with new 2026 player_clients ──────
    try:
        if hasattr(sys, '_MEIPASS'):
            yt_dlp_exe = os.path.join(sys._MEIPASS, 'yt-dlp_macos')
        else:
            yt_dlp_exe = os.path.join(os.path.dirname(__file__), 'yt-dlp_macos')
        if not os.path.exists(yt_dlp_exe):
            yt_dlp_exe = "yt-dlp"

        out_template = os.path.join(song_dir, f"{vid}.%(ext)s")
        # 2026-era client list: web_creator & ios bypass most SABR blocks
        extractor_args = "youtube:player_client=web_creator,ios,mweb,web_safari"
        cookie_sources = ["chrome", "safari", "firefox", None]

        for source in cookie_sources:
            if download_success:
                break
            cmd = [
                yt_dlp_exe,
                "-f", "140/bestaudio/best",
                "-o", out_template,
                "--no-warnings",
                "--extractor-args", extractor_args,
            ]
            if source:
                cmd += ["--cookies-from-browser", source]
            cmd.append(yt_url)

            print(f"[Strategy 1] yt-dlp binary | client=web_creator,ios,mweb | cookies={source}")
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=YTDLP_TIMEOUT)
                if result.returncode == 0:
                    found = _find_downloaded_file(song_dir, vid)
                    if found:
                        m4a_path = found
                        download_success = True
                        attempts.append({"method": f"yt-dlp-binary (cookies={source})", "status": "success"})
                        print(f"[Strategy 1] SUCCESS with cookies={source}")
                    else:
                        attempts.append({"method": f"yt-dlp-binary (cookies={source})", "status": "failed", "error": "No file found"})
                else:
                    err = (result.stderr or "").strip()[:300]
                    attempts.append({"method": f"yt-dlp-binary (cookies={source})", "status": "failed", "error": err})
                    print(f"[Strategy 1] FAILED cookies={source}: {err}")
            except subprocess.TimeoutExpired:
                attempts.append({"method": f"yt-dlp-binary (cookies={source})", "status": "failed", "error": f"Timeout after {YTDLP_TIMEOUT}s"})
                print(f"[Strategy 1] TIMEOUT cookies={source}")
    except Exception as e:
        attempts.append({"method": "yt-dlp-binary", "status": "error", "error": str(e)})
        print(f"[Strategy 1] ERROR: {e}")

    # ── Strategy 2: yt-dlp PYTHON MODULE (may be newer than bundled binary) ────
    if not download_success:
        try:
            import yt_dlp as yt_dlp_mod
            out_template = os.path.join(song_dir, f"{vid}.%(ext)s")
            ydl_opts = {
                "format": "140/bestaudio/best",
                "outtmpl": out_template,
                "quiet": True,
                "no_warnings": True,
                "extractor_args": {"youtube": {"player_client": ["web_creator", "ios", "mweb"]}},
            }
            print(f"[Strategy 2] yt-dlp Python module v{yt_dlp_mod.version.__version__}")
            # Run in thread to enforce timeout
            import concurrent.futures
            def _ytdlp_mod_download():
                with yt_dlp_mod.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([yt_url])

            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                future = ex.submit(_ytdlp_mod_download)
                try:
                    future.result(timeout=YTDLP_TIMEOUT)
                    found = _find_downloaded_file(song_dir, vid)
                    if found:
                        m4a_path = found
                        download_success = True
                        attempts.append({"method": "yt-dlp-python-module", "status": "success"})
                        print("[Strategy 2] SUCCESS")
                    else:
                        attempts.append({"method": "yt-dlp-python-module", "status": "failed", "error": "No file found"})
                except concurrent.futures.TimeoutError:
                    future.cancel()
                    attempts.append({"method": "yt-dlp-python-module", "status": "failed", "error": f"Timeout after {YTDLP_TIMEOUT}s"})
                    print("[Strategy 2] TIMEOUT")
        except Exception as e:
            attempts.append({"method": "yt-dlp-python-module", "status": "error", "error": str(e)})
            print(f"[Strategy 2] ERROR: {e}")

    # ── Strategy 3: pytubefix (expanded client list) ──────────────────────────
    if not download_success:
        for client_name in ['MWEB', 'IOS', 'ANDROID', 'WEB', 'TV']:
            if download_success:
                break
            try:
                if os.path.exists(m4a_path) and os.path.getsize(m4a_path) == 0:
                    os.remove(m4a_path)
                from pytubefix import YouTube
                print(f"[Strategy 3] pytubefix client={client_name}")

                def _pytubefix_download():
                    yt = YouTube(yt_url, client=client_name)
                    stream = yt.streams.get_audio_only()
                    if stream:
                        stream.download(output_path=song_dir, filename=f"{vid}.m4a")
                        return True
                    return False

                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                    future = ex.submit(_pytubefix_download)
                    try:
                        ok = future.result(timeout=PYTUBEFIX_TIMEOUT)
                        dl_path = os.path.join(song_dir, f"{vid}.m4a")
                        if ok and os.path.exists(dl_path) and os.path.getsize(dl_path) > 0:
                            m4a_path = dl_path
                            download_success = True
                            attempts.append({"method": f"pytubefix ({client_name})", "status": "success"})
                            print(f"[Strategy 3] SUCCESS client={client_name}")
                        else:
                            attempts.append({"method": f"pytubefix ({client_name})", "status": "failed", "error": "Empty or missing file"})
                    except concurrent.futures.TimeoutError:
                        future.cancel()
                        attempts.append({"method": f"pytubefix ({client_name})", "status": "failed", "error": f"Timeout after {PYTUBEFIX_TIMEOUT}s"})
                        print(f"[Strategy 3] TIMEOUT client={client_name}")
            except Exception as py_err:
                attempts.append({"method": f"pytubefix ({client_name})", "status": "failed", "error": str(py_err)})
                print(f"[Strategy 3] ERROR client={client_name}: {py_err}")

    # ── Strategy 4: innertube library → ffmpeg stream pipe ───────────────────
    if not download_success:
        try:
            import innertube
            import urllib.request as urlreq
            print("[Strategy 4] innertube + ffmpeg stream")
            client = innertube.InnerTube("ANDROID")
            player_data = client.player(video_id=vid)
            formats = player_data.get("streamingData", {}).get("adaptiveFormats", [])
            # Prefer audio/mp4 (m4a) stream
            audio_formats = [f for f in formats if f.get("mimeType", "").startswith("audio/mp4")]
            if not audio_formats:
                audio_formats = [f for f in formats if "audio" in f.get("mimeType", "")]
            audio_formats.sort(key=lambda f: f.get("bitrate", 0), reverse=True)

            if audio_formats:
                stream_url = audio_formats[0].get("url")
                if stream_url:
                    ffmpeg_exe = get_ffmpeg_path()
                    out_path = os.path.join(song_dir, f"{vid}.m4a")
                    result = subprocess.run(
                        [ffmpeg_exe, "-y", "-i", stream_url, "-c", "copy", out_path],
                        capture_output=True, text=True, timeout=YTDLP_TIMEOUT
                    )
                    if result.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 0:
                        m4a_path = out_path
                        download_success = True
                        attempts.append({"method": "innertube+ffmpeg", "status": "success"})
                        print("[Strategy 4] SUCCESS via innertube+ffmpeg")
                    else:
                        attempts.append({"method": "innertube+ffmpeg", "status": "failed", "error": result.stderr[:200]})
                else:
                    attempts.append({"method": "innertube+ffmpeg", "status": "failed", "error": "No stream URL in response"})
            else:
                attempts.append({"method": "innertube+ffmpeg", "status": "failed", "error": "No audio format found"})
        except ImportError:
            attempts.append({"method": "innertube+ffmpeg", "status": "skipped", "error": "innertube not installed"})
            print("[Strategy 4] SKIPPED (innertube not installed)")
        except subprocess.TimeoutExpired:
            attempts.append({"method": "innertube+ffmpeg", "status": "failed", "error": f"Timeout after {YTDLP_TIMEOUT}s"})
            print("[Strategy 4] TIMEOUT")
        except Exception as e:
            attempts.append({"method": "innertube+ffmpeg", "status": "error", "error": str(e)})
            print(f"[Strategy 4] ERROR: {e}")

    # Log all attempts to download_history.json
    log_download_attempt(vid, req.title, attempts, "success" if download_success else "failed")
    print(f"[Download] Final status: {'SUCCESS' if download_success else 'FAILED'} | Attempts: {len(attempts)}")

    if not download_success or not os.path.exists(m4a_path) or os.path.getsize(m4a_path) == 0:
        if os.path.exists(m4a_path) and os.path.getsize(m4a_path) == 0:
            try:
                os.remove(m4a_path)
            except:
                pass
        progress_store[vid] = {"status": "error", "percent": 0, "message": "ดาวน์โหลดล้มเหลวจากทุกช่องทาง"}
        return {"status": "error", "message": f"Download failed from all {len(attempts)} sources. Check /download/history for details."}
        
    # 2. Convert to WAV for demucs
    progress_store[vid] = {"status": "converting", "percent": 20, "message": "เตรียมไฟล์สำหรับ AI..."}
    try:
        wav_path = os.path.join(song_dir, f"{vid}.wav")
        convert_audio(m4a_path, wav_path, fmt="wav")
    except Exception as e:
        progress_store[vid] = {"status": "error", "percent": 0, "message": "แปลงไฟล์ล้มเหลว"}
        return {"status": "error", "message": str(e)}
        
    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")

    # 3. Run Demucs
    progress_store[vid] = {"status": "separating", "percent": 25, "message": "AI กำลังแยกเสียงร้องและดนตรี (อาจใช้เวลา 2-3 นาที)..."}
    try:
        demucs_args = ["-n", "htdemucs_ft", "--shifts=0", "-d", device, "-o", song_dir, wav_path]
        if mode == "basic":
            demucs_args = ["-n", "htdemucs_ft", "--shifts=0", "-d", device, "--two-stems=vocals", "-o", song_dir, wav_path]
            
        if getattr(sys, 'frozen', False):
            cmd = [sys.executable, "demucs_worker"] + demucs_args
        else:
            cmd = [sys.executable, "-m", "demucs.separate"] + demucs_args

        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, universal_newlines=True)
        
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
                    overall_pct = 25 + int(demucs_pct * 0.70) # Demucs takes up 70% of total progress (25% to 95%)
                    progress_store[vid] = {"status": "separating", "percent": overall_pct, "message": f"AI กำลังแยกเสียงร้องและดนตรี... {demucs_pct}%"}
                buffer = ""
            else:
                buffer += char
                
        process.wait()
        if process.returncode != 0:
            raise Exception(f"Exit code {process.returncode}. Log: {full_log[-1000:]}")
            
    except Exception as e:
        progress_store[vid] = {"status": "error", "percent": 0, "message": "การแยกเสียงล้มเหลว"}
        return {"status": "error", "message": f"Demucs separation failed: {str(e)}"}
        
    demucs_out_dir = os.path.join(song_dir, "htdemucs_ft", vid)
    vocal_wav = os.path.join(demucs_out_dir, "vocals.wav")
    
    if not os.path.exists(vocal_wav):
        progress_store[vid] = {"status": "error", "percent": 0, "message": "ไม่พบไฟล์ผลลัพธ์จาก AI"}
        return {"status": "error", "message": "Demucs output files not found."}
        
    # 4. Convert back to M4A to save space
    progress_store[vid] = {"status": "compressing", "percent": 95, "message": "กำลังบีบอัดไฟล์ขั้นสุดท้าย..."}
    
    # Always convert vocals
    convert_audio(vocal_wav, vocal_m4a, fmt="m4a")
    
    if mode == "basic":
        no_vocal_wav = os.path.join(demucs_out_dir, "no_vocals.wav")
        if os.path.exists(no_vocal_wav):
            convert_audio(no_vocal_wav, no_vocal_m4a, fmt="m4a")
    else:
        # Pro mode (4 stems)
        stems = ["drums", "bass", "other"]
        for stem in stems:
            stem_wav = os.path.join(demucs_out_dir, f"{stem}.wav")
            stem_m4a = os.path.join(song_dir, f"{stem}.m4a")
            if os.path.exists(stem_wav):
                convert_audio(stem_wav, stem_m4a, fmt="m4a")
    
    # Save mode flag for client checks
    with open(os.path.join(song_dir, "mode.txt"), "w") as f:
        f.write(mode)
        
    # Save title for cache listing
    with open(os.path.join(song_dir, "title.txt"), "w", encoding="utf-8") as f:
        f.write(req.title)

        
    # Cleanup temporary files (WAV is huge)
    for tmp_file in [m4a_path, wav_path]:
        try:
            if os.path.exists(tmp_file):
                os.remove(tmp_file)
        except Exception as e:
            print(f"Failed to remove {tmp_file}: {e}")
            
    try:
        demucs_dir = os.path.join(song_dir, "htdemucs_ft")
        if os.path.exists(demucs_dir):
            shutil.rmtree(demucs_dir)
    except Exception as e:
        print(f"Failed to remove demucs dir: {e}")
        
    progress_store[vid] = {"status": "success", "percent": 100, "message": "เสร็จสมบูรณ์!", "mode": mode}
    return {"status": "success", "video_id": vid, "mode": mode}

# Mount cache directory for robust static file serving with range request support
app.mount("/files", StaticFiles(directory=CACHE_DIR), name="files")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "demucs_worker":
        import demucs.pretrained
        from demucs.separate import main
        sys.argv = ["demucs"] + sys.argv[2:]
        main()
        sys.exit(0)

    import uvicorn
    
    def check_and_kill_old_instance():
        port = 5050
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            in_use = s.connect_ex(('127.0.0.1', port)) == 0
        if in_use:
            print(f"Port {port} is in use. Attempting to shutdown old instance...")
            try:
                req = urllib.request.Request("http://127.0.0.1:5050/shutdown", method="POST")
                urllib.request.urlopen(req, timeout=2)
                print("Shutdown command sent. Waiting for it to exit...")
                time.sleep(2) # wait for old instance to die
            except Exception as e:
                print(f"Could not gracefully shutdown old instance: {e}")

    check_and_kill_old_instance()
    uvicorn.run(app, host="127.0.0.1", port=5050)
