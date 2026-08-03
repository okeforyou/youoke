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
from utils.audio import convert_audio, is_valid_audio, get_ffmpeg_path
from routes.library_cache import load_library
from models import SeparateRequest
from server_state import progress_store, rapidapi_quota

router = APIRouter()

progress_store = {}

@router.get("/progress/{video_id}")
def get_progress(video_id: str):
    if video_id in progress_store:
        return progress_store[video_id]
    return {"status": "unknown", "percent": 0, "message": "รอคิว..."}

@router.post("/upload/{video_id}")
async def upload_audio(video_id: str, file: UploadFile = File(...)):
    try:
        song_dir = os.path.join(CACHE_DIR, video_id)
        os.makedirs(song_dir, exist_ok=True)
        # We save it as .manual.m4a so the normal cleanup loop won't delete it
        file_location = os.path.join(song_dir, f"{video_id}.manual.m4a")
        with open(file_location, "wb+") as file_object:
            import shutil
            shutil.copyfileobj(file.file, file_object)
        return {"info": f"file '{file.filename}' saved at '{file_location}'"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/separate")
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

    attempts = []

    if req.use_manual_upload:
        manual_path = os.path.join(song_dir, f"{vid}.manual.m4a")
        if os.path.exists(manual_path) and os.path.getsize(manual_path) > 0:
            m4a_path = manual_path
            download_success = True
            attempts.append({"method": "manual_upload", "status": "success"})
            progress_store[vid]["percent"] = 20
            progress_store[vid]["message"] = "ใช้ออดิโอไฟล์ที่อัปโหลด..."
            print(f"[Manual Upload] Using uploaded file: {manual_path}")


    YTDLP_TIMEOUT = 45  # seconds per yt-dlp attempt
    PYTUBEFIX_TIMEOUT = 30  # seconds per pytubefix attempt

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

    # ── Strategy 0: EXTERNAL API FALLBACK (RapidAPI) ──────────────────────────
    # Reads from RapidAPI using the user's provided key.
    # Fallback to hardcoded free key if the user didn't provide one.
    RAPIDAPI_KEY = req.rapidapi_key
    if RAPIDAPI_KEY and not download_success:
        try:
            print(f"[Strategy 0] Trying RapidAPI (youtube-mp3-audio-video-downloader)... Using Custom Key: {bool(req.rapidapi_key)}")
            import urllib.request
            import urllib.parse
            import json
            import ssl
            
            # Extract Video ID from URL
            parsed = urllib.parse.urlparse(yt_url)
            video_id = ""
            if "youtu.be" in parsed.netloc:
                video_id = parsed.path.lstrip('/')
            else:
                query = urllib.parse.parse_qs(parsed.query)
                video_id = query.get("v", [""])[0]

            if video_id:
                api_url = f"https://youtube-mp3-audio-video-downloader.p.rapidapi.com/get_m4a_download_link/{video_id}"
                
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                
                api_req = urllib.request.Request(
                    api_url,
                    headers={
                        'Accept': 'application/json',
                        'x-rapidapi-host': 'youtube-mp3-audio-video-downloader.p.rapidapi.com',
                        'x-rapidapi-key': RAPIDAPI_KEY,
                        'User-Agent': 'Mozilla/5.0'
                    }
                )
                
                with urllib.request.urlopen(api_req, context=ctx, timeout=30) as response:
                    # Catch rate limit headers
                    
                    remaining = response.getheader('x-ratelimit-requests-remaining')
                    limit = response.getheader('x-ratelimit-requests-limit')
                    if remaining is not None and limit is not None:
                        try:
                            rapidapi_quota['remaining'] = int(remaining)
                            rapidapi_quota['limit'] = int(limit)
                            print(f"[RapidAPI Quota] {remaining}/{limit}")
                        except ValueError:
                            pass

                    res_data = json.loads(response.read().decode('utf-8'))
                    print(f"[Strategy 0] API Response: {res_data}")
                    
                    # Extract the actual download link (the key might be 'link', 'url', 'download_link', etc.)
                    direct_url = (
                        res_data.get("url")
                        or res_data.get("link")
                        or res_data.get("file")
                        or res_data.get("download_url")
                        or res_data.get("download_link")
                        or (res_data.get("data") and res_data.get("data", {}).get("url"))
                    )
                    
                    if direct_url:
                        print(f"[Strategy 0] Found direct URL. Downloading...")
                        
                        dl_req = urllib.request.Request(direct_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(dl_req, context=ctx, timeout=120) as dl_res, open(m4a_path, 'wb') as out_file:
                            import shutil
                            shutil.copyfileobj(dl_res, out_file)
                            
                        if is_valid_audio(m4a_path):
                            download_success = True
                            attempts.append({"method": "rapidapi", "status": "success"})
                            print("[Strategy 0] SUCCESS!")
                        else:
                            print(f"[Strategy 0] FAILED: File is not a valid audio file (size: {os.path.getsize(m4a_path)} bytes)")
                            try: os.remove(m4a_path)
                            except: pass
                    else:
                        print("[Strategy 0] FAILED: Could not find download URL in API response.")
        except Exception as e:
            attempts.append({"method": "rapidapi", "status": "failed", "error": str(e)})
            print(f"[Strategy 0] FAILED: {e}")

    # ── Strategy 1: yt-dlp BINARY (bundled) with new 2026 player_clients ──────
    try:
        binary_name = 'yt-dlp.exe' if sys.platform == 'win32' else 'yt-dlp_macos'
        if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
            yt_dlp_exe = os.path.join(sys._MEIPASS, binary_name)
        else:
            yt_dlp_exe = os.path.join(os.path.dirname(__file__), binary_name)

        if not os.path.exists(yt_dlp_exe):
            yt_dlp_exe = "yt-dlp"
        elif sys.platform != 'win32':
            try:
                os.chmod(yt_dlp_exe, 0o755)
            except Exception:
                pass

        out_template = os.path.join(song_dir, f"{vid}.%(ext)s")
        # 2026-era client list: web_creator & ios bypass most SABR blocks
        extractor_args = "youtube:player_client=web_creator,ios,mweb,web_safari;youtubepot-wpc:browser_path=none"
        cookie_sources = [None, "chrome"]

        for source in cookie_sources:
            if download_success:
                break
            cmd = [
                yt_dlp_exe,
                "-f", "140/bestaudio/best",
                "-o", out_template,
                "--no-warnings",
                "--extractor-args", extractor_args,
                "--compat-options", "no-youtube-po-token-browser",
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
            import concurrent.futures
            out_template = os.path.join(song_dir, f"{vid}.%(ext)s")
            cookie_sources = [None, "chrome"]
            
            for source in cookie_sources:
                if download_success:
                    break
                ydl_opts = {
                    "format": "bestaudio/best",
                    "outtmpl": out_template,
                    "quiet": True,
                    "no_warnings": True,
                    "compat_opts": ["no-youtube-po-token-browser"],
                    "extractor_args": {
                        "youtube": {"player_client": ["web_creator", "ios", "mweb", "web_safari"]},
                        "youtubepot-wpc": {"browser_path": ["none"]}
                    },
                    "postprocessors": [{
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "m4a",
                    }],
                }
                if source:
                    ydl_opts["cookiesfrombrowser"] = (source,)
                
                print(f"[Strategy 2] yt-dlp Python module v{yt_dlp_mod.version.__version__} | cookies={source}")
                
                def _ytdlp_mod_download(opts):
                    with yt_dlp_mod.YoutubeDL(opts) as ydl:
                        ydl.download([yt_url])

                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                    future = ex.submit(_ytdlp_mod_download, ydl_opts)
                    try:
                        future.result(timeout=YTDLP_TIMEOUT)
                        found = _find_downloaded_file(song_dir, vid)
                        if found:
                            m4a_path = found
                            download_success = True
                            attempts.append({"method": f"yt-dlp-python-module (cookies={source})", "status": "success"})
                            print(f"[Strategy 2] SUCCESS cookies={source}")
                        else:
                            attempts.append({"method": f"yt-dlp-python-module (cookies={source})", "status": "failed", "error": "No file found"})
                    except concurrent.futures.TimeoutError:
                        future.cancel()
                        attempts.append({"method": f"yt-dlp-python-module (cookies={source})", "status": "failed", "error": f"Timeout after {YTDLP_TIMEOUT}s"})
                        print(f"[Strategy 2] TIMEOUT cookies={source}")
                    except Exception as e:
                        err_str = str(e)[:300]
                        attempts.append({"method": f"yt-dlp-python-module (cookies={source})", "status": "error", "error": err_str})
                        print(f"[Strategy 2] ERROR cookies={source}: {e}")
        except Exception as e:
            attempts.append({"method": "yt-dlp-python-module", "status": "error", "error": str(e)})
            print(f"[Strategy 2] ERROR: {e}")

    # ── Strategy 3: pytubefix (expanded client list) ──────────────────────────
    if not download_success:
        for client_name in ['WEB_CREATOR', 'IOS', 'ANDROID']:
            if download_success:
                break
            try:
                if os.path.exists(m4a_path) and os.path.getsize(m4a_path) == 0:
                    os.remove(m4a_path)
                from pytubefix import YouTube
                print(f"[Strategy 3] pytubefix client={client_name}")

                def _pytubefix_download():
                    # Set use_po_token=False and use_oauth=False to prevent browser spam
                    yt = YouTube(yt_url, client=client_name, use_po_token=False, use_oauth=False)
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

        demucs_out_dir = os.path.join(song_dir, "htdemucs_ft", vid)
        vocal_wav = os.path.join(demucs_out_dir, "vocals.wav")

        if not os.path.exists(vocal_wav):
            raise Exception("Demucs output files not found.")

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
                        shutil.copy(os.path.join(song_dir, m4a_file), os.path.join(target_folder, m4a_file))
                    except Exception as e:
                        print(f"[Storage Error] Failed to copy {m4a_file}: {str(e)}")
                
                try:
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
                    
                print(f"[Storage] Copied output to {target_folder}")
            except Exception as e:
                print(f"[Storage Error] Failed to create folder {custom_path}/{safe_title}: {str(e)}")

        # Save title for cache listing
        with open(os.path.join(song_dir, "title.txt"), "w", encoding="utf-8") as f:
            f.write(req.title)

        progress_store[vid] = {"status": "success", "percent": 100, "message": "เสร็จสมบูรณ์!", "mode": mode}

    except Exception as e:
        progress_store[vid] = {"status": "error", "percent": 0, "message": "การแยกเสียงล้มเหลว"}
        return {"status": "error", "message": f"Demucs separation failed: {str(e)}"}
        
    finally:
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
            
    return {"status": "success", "video_id": vid, "mode": mode}

