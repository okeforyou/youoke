import os
import subprocess
import shutil
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SeparateRequest(BaseModel):
    video_id: str

CACHE_DIR = os.path.expanduser("~/Library/Application Support/YouOke/Cache")
os.makedirs(CACHE_DIR, exist_ok=True)

@app.get("/health")
def health():
    return {"status": "ok", "message": "YouOke Local AI Bridge is running."}

@app.post("/separate")
def separate(req: SeparateRequest):
    vid = req.video_id
    song_dir = os.path.join(CACHE_DIR, vid)
    
    # Check if already cached
    vocal_m4a = os.path.join(song_dir, "vocals.m4a")
    no_vocal_m4a = os.path.join(song_dir, "no_vocals.m4a")
    
    if os.path.exists(vocal_m4a) and os.path.exists(no_vocal_m4a):
        return {"status": "cached", "video_id": vid}
        
    os.makedirs(song_dir, exist_ok=True)
    
    # 1. Download with yt-dlp
    m4a_path = os.path.join(song_dir, f"{vid}.m4a")
    yt_url = f"https://www.youtube.com/watch?v={vid}"
    
    if vid == "PALMY":
        # MOCK FOR POC: Use local file instead of downloading
        palmy_source = os.path.expanduser("~/Desktop/song/PALMY.mp3")
        shutil.copy(palmy_source, m4a_path)
    else:
        # We download specifically m4a format
        dl_cmd = [
            sys.executable,
            "-m", "yt_dlp",
            "-f", "bestaudio[ext=m4a]",
            "-o", m4a_path,
            yt_url
        ]
        try:
            subprocess.run(dl_cmd, check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Download failed: {e.stderr.decode()}")
        
    # 2. Convert to WAV for demucs using afconvert (macOS native)
    wav_path = os.path.join(song_dir, f"{vid}.wav")
    try:
        subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16", m4a_path, wav_path], check=True)
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="afconvert m4a to wav failed.")
        
    # 3. Run Demucs
    try:
        # Note: sys.executable gives the python path running this server
        subprocess.run([sys.executable, "-m", "demucs.separate", "-n", "htdemucs_ft", "--two-stems=vocals", "-o", song_dir, wav_path], check=True)
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="Demucs separation failed.")
        
    # Demucs outputs to song_dir/htdemucs_ft/{vid}/vocals.wav and no_vocals.wav
    demucs_out_dir = os.path.join(song_dir, "htdemucs_ft", vid)
    vocal_wav = os.path.join(demucs_out_dir, "vocals.wav")
    no_vocal_wav = os.path.join(demucs_out_dir, "no_vocals.wav")
    
    if not os.path.exists(vocal_wav) or not os.path.exists(no_vocal_wav):
        raise HTTPException(status_code=500, detail="Demucs output files not found.")
        
    # 4. Convert back to M4A to save space (Mac native conversion, highly compressed)
    try:
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "128000", vocal_wav, vocal_m4a], check=True)
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "128000", no_vocal_wav, no_vocal_m4a], check=True)
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=500, detail="afconvert wav to m4a failed.")
        
    # Cleanup temporary files (WAV is huge)
    try:
        os.remove(m4a_path)
        os.remove(wav_path)
        shutil.rmtree(os.path.join(song_dir, "htdemucs_ft"))
    except:
        pass # ignore cleanup errors
        
    return {"status": "success", "video_id": vid}

@app.get("/files/{video_id}/{track_type}")
def get_file(video_id: str, track_type: str):
    # track_type should be 'vocals' or 'no_vocals'
    if track_type not in ["vocals", "no_vocals"]:
        raise HTTPException(status_code=400, detail="Invalid track type.")
    
    file_path = os.path.join(CACHE_DIR, video_id, f"{track_type}.m4a")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
        
    return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
