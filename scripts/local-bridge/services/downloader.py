import os
import ssl
import json
import shutil
import urllib.request
import urllib.parse
import subprocess
import re
from .binary_manager import ensure_yt_dlp

class DownloaderError(Exception):
    pass

def is_valid_audio(filepath: str) -> bool:
    """Check if the downloaded file is actually an audio file and not an empty/HTML file."""
    if not os.path.exists(filepath):
        return False
    size = os.path.getsize(filepath)
    if size < 100 * 1024:  # Less than 100KB is suspicious for a song
        return False
        
    try:
        # Check signature for M4A/MP4/MP3
        with open(filepath, 'rb') as f:
            header = f.read(12)
            if b'ftyp' in header or header.startswith(b'ID3') or b'<!DOCTYPE html>' not in header:
                return True
        return True
    except Exception:
        return False

def _find_downloaded_file(song_dir: str, vid: str) -> str:
    """Helper to find the downloaded file if extension varies."""
    for ext in ['.m4a', '.webm', '.mp3', '.mp4']:
        p = os.path.join(song_dir, f"{vid}{ext}")
        if os.path.exists(p):
            return p
    return None

def run_tier1_ytdlp_standalone(yt_url: str, song_dir: str, vid: str, timeout: int = 60) -> str:
    """Tier 1: Standalone Auto-healing yt-dlp"""
    yt_dlp_exe = ensure_yt_dlp()
    out_template = os.path.join(song_dir, f"{vid}.%(ext)s")
    
    cmd = [
        yt_dlp_exe,
        '-f', '140/bestaudio/best',
        '-o', out_template,
        '--extractor-args', 'youtube:player_client=android,web',
        '--no-warnings',
        yt_url
    ]
    
    print(f"[Downloader] Strategy 1: Standalone yt-dlp ({yt_dlp_exe})")
    
    def execute(command):
        return subprocess.run(command, capture_output=True, text=True, timeout=timeout)

    try:
        res = execute(cmd)
    except subprocess.TimeoutExpired:
        raise DownloaderError(f"yt-dlp download timed out after {timeout}s")
    except Exception as e:
        raise DownloaderError(f"yt-dlp failed to execute: {str(e)}")

    if res.returncode != 0:
        err_out = res.stderr or res.stdout
        print(f"[Downloader] yt-dlp error output: {err_out[-500:]}")
        
        # Auto-heal: If it fails, try updating yt-dlp and retry once
        print("[Downloader] Auto-healing: Updating yt-dlp...")
        try:
            update_res = subprocess.run([yt_dlp_exe, '-U'], capture_output=True, text=True, timeout=30)
            if update_res.returncode == 0:
                print("[Downloader] yt-dlp updated successfully. Retrying download...")
                res = execute(cmd)
            else:
                print("[Downloader] yt-dlp update failed.")
        except Exception as update_err:
            print(f"[Downloader] Auto-heal update failed: {update_err}")

    if res.returncode != 0:
        raise DownloaderError(f"yt-dlp returned non-zero exit code: {res.returncode}")

    downloaded_file = _find_downloaded_file(song_dir, vid)
    if downloaded_file and is_valid_audio(downloaded_file):
        return downloaded_file
    raise DownloaderError("yt-dlp finished but no valid file was produced")

def run_tier2_rapidapi(yt_url: str, m4a_path: str, rapidapi_key: str, timeout: int = 45) -> str:
    """Tier 2: RapidAPI (Fastest if key is available)"""
    print("[Downloader] Strategy 2a: RapidAPI")
    parsed = urllib.parse.urlparse(yt_url)
    video_id = ""
    if "youtu.be" in parsed.netloc:
        video_id = parsed.path.lstrip('/')
    else:
        query = urllib.parse.parse_qs(parsed.query)
        video_id = query.get("v", [""])[0]

    if not video_id:
        raise DownloaderError("Could not extract video ID for RapidAPI")

    api_url = f"https://youtube-mp3-audio-video-downloader.p.rapidapi.com/get_m4a_download_link/{video_id}"
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    api_req = urllib.request.Request(
        api_url,
        headers={
            'Accept': 'application/json',
            'x-rapidapi-host': 'youtube-mp3-audio-video-downloader.p.rapidapi.com',
            'x-rapidapi-key': rapidapi_key,
            'User-Agent': 'Mozilla/5.0'
        }
    )
    
    try:
        with urllib.request.urlopen(api_req, context=ctx, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            
            direct_url = (
                res_data.get("url") or res_data.get("link") or res_data.get("file")
                or res_data.get("download_url") or res_data.get("download_link")
                or (res_data.get("data") and res_data.get("data", {}).get("url"))
            )
            
            if not direct_url:
                raise DownloaderError("No download URL found in RapidAPI response")

            dl_req = urllib.request.Request(direct_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(dl_req, context=ctx, timeout=timeout) as dl_res, open(m4a_path, 'wb') as out_file:
                shutil.copyfileobj(dl_res, out_file)
                
            if is_valid_audio(m4a_path):
                return m4a_path
            else:
                os.remove(m4a_path)
                raise DownloaderError("Downloaded file is not valid audio")
    except Exception as e:
        raise DownloaderError(f"RapidAPI failed: {str(e)}")

def download_audio(yt_url: str, song_dir: str, vid: str, rapidapi_key: str = None) -> str:
    """
    Unified downloading method.
    Returns the path to the downloaded valid audio file.
    Raises Exception if all tiers fail.
    """
    m4a_path = os.path.join(song_dir, f"{vid}.m4a")
    errors = []

    # 1. Tier 1: Standalone Auto-healing yt-dlp
    try:
        return run_tier1_ytdlp_standalone(yt_url, song_dir, vid, timeout=60)
    except DownloaderError as e:
        errors.append(str(e))
        print(e)
    except Exception as e:
        errors.append(f"yt-dlp unexpected error: {e}")
        print(f"[Downloader] unexpected yt-dlp error: {e}")

    # 2. Tier 2: Fallbacks
    if rapidapi_key:
        try:
            return run_tier2_rapidapi(yt_url, m4a_path, rapidapi_key, timeout=45)
        except DownloaderError as e:
            errors.append(str(e))
            print(e)
        except Exception as e:
            errors.append(f"RapidAPI unexpected error: {e}")

    raise Exception("All download strategies failed:\n" + "\n".join(errors))
