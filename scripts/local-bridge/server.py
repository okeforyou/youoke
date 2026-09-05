import sys
import os
import socket
import urllib.request
import urllib.error
import time
import ssl
import threading
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

# ------------------------------------------------------------------
# MONKEY-PATCH: torchaudio load/save to handle missing torchcodec/ffmpeg backends
# Must be applied globally at the very top before any routers import demucs or torchaudio
# ------------------------------------------------------------------
try:
    import torchaudio
    import torch
    
    _orig_load = torchaudio.load
    _orig_save = torchaudio.save
    
    def robust_load(uri, *args, **kwargs):
        channels_first = kwargs.get("channels_first", True)
        
        # Strategy 1: soundfile (handles WAV, FLAC, OGG without TorchCodec dependency)
        try:
            import soundfile as sf
            data, samplerate = sf.read(uri, dtype='float32')
            tensor = torch.from_numpy(data)
            if channels_first:
                if tensor.ndim == 2:
                    tensor = tensor.t()
                elif tensor.ndim == 1:
                    tensor = tensor.unsqueeze(0)
            else:
                if tensor.ndim == 1:
                    tensor = tensor.unsqueeze(1)
            return tensor, samplerate
        except Exception:
            pass

        # Strategy 2: Built-in wave module (standard library, zero dependencies for WAV files)
        try:
            import wave
            import numpy as np
            with wave.open(str(uri), 'rb') as w:
                params = w.getparams()
                nchannels, sampwidth, framerate, nframes = params[:4]
                content = w.readframes(nframes)
                if sampwidth == 2:
                    data = np.frombuffer(content, dtype=np.int16).astype(np.float32) / 32768.0
                elif sampwidth == 4:
                    data = np.frombuffer(content, dtype=np.int32).astype(np.float32) / 2147483648.0
                elif sampwidth == 1:
                    data = (np.frombuffer(content, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
                else:
                    raise ValueError(f"Unsupported sample width: {sampwidth}")
                data = data.reshape(-1, nchannels)
                tensor = torch.from_numpy(data)
                if channels_first:
                    if tensor.ndim == 2:
                        tensor = tensor.t()
                    elif tensor.ndim == 1:
                        tensor = tensor.unsqueeze(0)
                else:
                    if tensor.ndim == 1:
                        tensor = tensor.unsqueeze(1)
                return tensor, framerate
        except Exception:
            pass

        # Strategy 3: Original torchaudio loader
        try:
            return _orig_load(uri, *args, **kwargs)
        except Exception:
            pass

        # Strategy 4: pydub fallback (handles M4A, MP3, AAC, and non-standard WAV via ffmpeg)
        try:
            from pydub import AudioSegment
            import numpy as np
            seg = AudioSegment.from_file(uri)
            samples = np.array(seg.get_array_of_samples(), dtype=np.float32)
            if seg.sample_width == 2:
                samples = samples / 32768.0
            elif seg.sample_width == 4:
                samples = samples / 2147483648.0
            elif seg.sample_width == 1:
                samples = (samples - 128.0) / 128.0
            samples = samples.reshape((-1, seg.channels))
            tensor = torch.from_numpy(samples)
            if channels_first:
                if tensor.ndim == 2:
                    tensor = tensor.t()
                elif tensor.ndim == 1:
                    tensor = tensor.unsqueeze(0)
            else:
                if tensor.ndim == 1:
                    tensor = tensor.unsqueeze(1)
            return tensor, seg.frame_rate
        except Exception as e:
            raise RuntimeError(f"Failed to load audio file {uri}: {e}")

    def robust_save(uri, src, sample_rate, *args, **kwargs):
        channels_first = kwargs.get("channels_first", True)

        # Strategy 1: soundfile (handles WAV, FLAC directly)
        try:
            import soundfile as sf
            data = src.detach().cpu().numpy()
            if channels_first and data.ndim == 2:
                data = data.T
            sf.write(uri, data, sample_rate)
            return
        except Exception:
            pass

        # Strategy 2: Standard wave module (for standard WAV)
        try:
            import wave
            import numpy as np
            data = src.detach().cpu().numpy()
            if channels_first and data.ndim == 2:
                data = data.T
            nchannels = data.shape[1] if data.ndim > 1 else 1
            with wave.open(str(uri), 'wb') as w:
                w.setnchannels(nchannels)
                w.setsampwidth(2)  # 16-bit PCM
                w.setframerate(sample_rate)
                scaled = np.clip(data * 32768.0, -32768.0, 32767.0).astype(np.int16)
                w.writeframes(scaled.tobytes())
            return
        except Exception:
            pass

        # Strategy 3: Original torchaudio save
        try:
            return _orig_save(uri, src, sample_rate, *args, **kwargs)
        except Exception as e:
            raise RuntimeError(f"Failed to save audio file {uri}: {e}")

    torchaudio.load = robust_load
    torchaudio.save = robust_save
    print("[torchaudio patch] Successfully applied torchaudio load/save monkey-patch (with robust soundfile/wave/pydub fallbacks) globally.")
except Exception as e:
    print(f"[torchaudio patch] Critical Error: Failed to apply global monkey-patch: {e}")

# Fix SSL: CERTIFICATE_VERIFY_FAILED on macOS
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# ------------------------------------------------------------------
# AUTO-UPDATE: yt-dlp binary (runs in background on startup)
# Keeps the bundled binary fresh so YouTube's weekly client changes
# don't permanently break downloads.
# ------------------------------------------------------------------
def _get_ytdlp_path():
    binary_name = 'yt-dlp.exe' if sys.platform == 'win32' else 'yt-dlp_macos'
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, binary_name)
    return os.path.join(os.path.dirname(__file__), 'scripts', 'local-bridge', binary_name)

def _update_ytdlp_binary():
    """Download the latest yt-dlp release from GitHub if newer than local copy."""
    try:
        local_binary = os.path.join(os.path.dirname(__file__), 'yt-dlp_macos') \
            if not (getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS')) \
            else os.path.join(sys._MEIPASS, 'yt-dlp_macos')

        # Check current local version
        local_version = None
        if os.path.exists(local_binary):
            try:
                import subprocess
                r = subprocess.run([local_binary, '--version'],
                                   capture_output=True, text=True, timeout=5)
                local_version = r.stdout.strip()
            except Exception:
                pass

        # Get latest version from GitHub API
        api_url = 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(api_url,
            headers={'User-Agent': 'YouOke-Bridge/1.0', 'Accept': 'application/vnd.github+json'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        latest_version = data.get('tag_name', '').lstrip('v')
        if not latest_version:
            print('[yt-dlp updater] Could not parse latest version from GitHub.')
            return

        if local_version and local_version == latest_version:
            print(f'[yt-dlp updater] Already up-to-date: {local_version}')
            return

        print(f'[yt-dlp updater] Updating {local_version!r} → {latest_version!r}...')

        # Find the macOS binary asset
        assets = data.get('assets', [])
        asset_url = None
        for asset in assets:
            name = asset.get('name', '')
            if name == 'yt-dlp_macos':
                asset_url = asset.get('browser_download_url')
                break

        if not asset_url:
            print('[yt-dlp updater] Could not find yt-dlp_macos asset in GitHub release.')
            return

        tmp_path = local_binary + '.tmp'
        dl_req = urllib.request.Request(asset_url,
            headers={'User-Agent': 'YouOke-Bridge/1.0'})
        with urllib.request.urlopen(dl_req, context=ctx, timeout=120) as resp, \
             open(tmp_path, 'wb') as f:
            f.write(resp.read())

        os.chmod(tmp_path, 0o755)
        os.replace(tmp_path, local_binary)  # atomic replace
        print(f'[yt-dlp updater] ✅ Updated to {latest_version} at {local_binary}')

    except Exception as e:
        print(f'[yt-dlp updater] ⚠️ Update failed (non-fatal): {e}')


# ------------------------------------------------------------------
# LIFESPAN: runs startup tasks then yields for the app lifetime
# ------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Kick off yt-dlp update in background (non-blocking)
    t = threading.Thread(target=_update_ytdlp_binary, daemon=True, name='ytdlp-updater')
    t.start()
    yield  # app runs here
    # (shutdown cleanup can go here if needed)


# Initialize FastAPI app
app = FastAPI(title="YouOke Local AI Bridge", lifespan=lifespan)

# Import routes
from routes.system import router as system_router
from routes.separation import router as separation_router
from routes.library_cache import router as library_cache_router
from routes.search_files import router as search_files_router
from routes.creator import router as creator_router

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_pna_headers(request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=204)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        response.headers["Access-Control-Max-Age"] = "86400"
        return response
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

# Include routers
app.include_router(system_router)
app.include_router(separation_router)
app.include_router(library_cache_router)
app.include_router(search_files_router)
app.include_router(creator_router)

if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()
    
    if len(sys.argv) > 1 and sys.argv[1] == "demucs_worker":
        try:
            import torchaudio
            torchaudio.load = robust_load
            torchaudio.save = robust_save
        except Exception:
            pass
        try:
            import demucs.separate
            demucs.separate.load_track = lambda track, *args, **kwargs: robust_load(track, *args, **kwargs)
        except Exception:
            pass
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
