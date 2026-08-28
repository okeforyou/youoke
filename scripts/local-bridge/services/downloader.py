import os
import time
import ssl
import json
import shutil
import urllib.request
import urllib.parse
from contextlib import contextmanager

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
            # M4A/MP4 typically has ftyp at bytes 4-8
            if b'ftyp' in header:
                return True
            # ID3 (MP3)
            if header.startswith(b'ID3'):
                return True
            # Simple check if it's text (HTML error page)
            if b'<!DOCTYPE html>' in header or b'<html' in header or b'<?xml' in header:
                return False
        # If it's a valid size but unknown signature, assume it's OK for now 
        # (FFmpeg will fail gracefully later if it's bad)
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

def run_tier1_ytdlp(yt_url: str, song_dir: str, vid: str, timeout: int = 45) -> str:
    """Tier 1: Fast Native - yt-dlp Python Module (No browser cookies to avoid macOS keychain blocks)"""
    import yt_dlp
    import concurrent.futures

    out_template = os.path.join(song_dir, f"{vid}.%(ext)s")
    
    # Notice we DO NOT use cookiesfrombrowser to prevent permission popups
    ydl_opts = {
        'format': '140/bestaudio/best',
        'outtmpl': out_template,
        'quiet': True,
        'no_warnings': True,
        'extractor_args': {'youtube': {'player_client': ['web_creator', 'ios', 'mweb']}}
    }

    print("[Downloader] Strategy 1: yt-dlp python module (No Cookies)")
    
    def _download():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([yt_url])

    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(_download)
        try:
            future.result(timeout=timeout)
        except concurrent.futures.TimeoutError:
            raise DownloaderError(f"yt-dlp download timed out after {timeout}s")
        except Exception as e:
            raise DownloaderError(f"yt-dlp failed: {str(e)}")

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

def run_tier2_pytubefix(yt_url: str, m4a_path: str, timeout: int = 15) -> str:
    """Tier 2: pytubefix Fallback"""
    import concurrent.futures
    import pytubefix
    from pytubefix.cli import on_progress
    
    print(f"[Downloader] Strategy 2b: pytubefix (timeout={timeout}s)")
    
    def _download():
        yt = pytubefix.YouTube(
            yt_url,
            use_oauth=False,
            allow_oauth_cache=False,
            on_progress_callback=on_progress
        )
        stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
        if not stream:
            raise DownloaderError("No audio stream found")
        stream.download(output_path=os.path.dirname(m4a_path), filename=os.path.basename(m4a_path))

    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(_download)
        try:
            future.result(timeout=timeout)
        except concurrent.futures.TimeoutError:
            raise DownloaderError("pytubefix timed out")
        except Exception as e:
            raise DownloaderError(f"pytubefix failed: {str(e)}")

    if is_valid_audio(m4a_path):
        return m4a_path
    raise DownloaderError("pytubefix produced invalid file")

def download_audio(yt_url: str, song_dir: str, vid: str, rapidapi_key: str = None) -> str:
    """
    Unified downloading method.
    Returns the path to the downloaded valid audio file.
    Raises Exception if all tiers fail.
    """
    m4a_path = os.path.join(song_dir, f"{vid}.m4a")
    errors = []

    # 1. Tier 1: Fast Native (yt-dlp without strict cookie constraints)
    try:
        return run_tier1_ytdlp(yt_url, song_dir, vid, timeout=45)
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

    try:
        return run_tier2_pytubefix(yt_url, m4a_path, timeout=15)
    except DownloaderError as e:
        errors.append(str(e))
        print(e)
    except Exception as e:
        errors.append(f"pytubefix unexpected error: {e}")

    raise Exception("All download strategies failed:\n" + "\n".join(errors))

