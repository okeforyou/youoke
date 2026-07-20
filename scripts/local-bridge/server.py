import os
import subprocess
import shutil
import sys
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
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
    mode: str = "basic"  # "basic" or "pro"

CACHE_DIR = os.path.expanduser("~/Library/Application Support/YouOke/Cache")
os.makedirs(CACHE_DIR, exist_ok=True)

@app.get("/health")
def health():
    return {"status": "ok", "message": "YouOke Local AI Bridge is running."}

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

    # 1. Download with pytubefix (bypasses YouTube SABR block), fallback to yt-dlp
    progress_store[vid] = {"status": "downloading", "percent": 10, "message": "กำลังดาวน์โหลดวิดีโอจาก YouTube..."}
    m4a_path = os.path.join(song_dir, f"{vid}.m4a")
    yt_url = f"https://www.youtube.com/watch?v={vid}"
    
    download_success = False
    try:
        from pytubefix import YouTube
        yt = YouTube(yt_url, client='TV')
        stream = yt.streams.get_audio_only()
        if stream:
            stream.download(output_path=song_dir, filename=f"{vid}.m4a")
            m4a_path = os.path.join(song_dir, f"{vid}.m4a")
            download_success = True
    except Exception as py_err:
        print(f"pytubefix download failed: {py_err}, falling back to yt-dlp")

    if not download_success:
        try:
            yt_dlp_exe = os.path.join(os.path.dirname(__file__), 'yt-dlp_macos')
            out_template = os.path.join(song_dir, f"{vid}.%(ext)s")
            
            # Using subprocess to run the standalone binary with Chrome cookies
            cmd = [
                yt_dlp_exe,
                "-f", "140/bestaudio/best",
                "-o", out_template,
                "--cookies-from-browser", "chrome",
                "--js-runtimes", "node",
                "--quiet",
                "--no-warnings",
                yt_url
            ]
            
            print(f"Executing yt-dlp standalone: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"yt-dlp_macos failed. stdout: {result.stdout}, stderr: {result.stderr}")
                raise Exception(f"yt-dlp standalone failed with code {result.returncode}")
            
            downloaded_files = [f for f in os.listdir(song_dir) if f.startswith(vid) and f != "vocals.m4a" and f != "no_vocals.m4a" and not f.endswith(".wav")]
            if not downloaded_files:
                raise Exception("File not found after download.")
            downloaded_files.sort(key=lambda x: os.path.getmtime(os.path.join(song_dir, x)), reverse=True)
            m4a_path = os.path.join(song_dir, downloaded_files[0])
            
        except Exception as e:
            progress_store[vid] = {"status": "error", "percent": 0, "message": "ดาวน์โหลดล้มเหลว"}
            return {"status": "error", "message": f"Download failed: {str(e)}"}
        
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
    uvicorn.run(app, host="127.0.0.1", port=5050)
