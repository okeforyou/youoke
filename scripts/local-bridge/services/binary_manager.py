import os
import sys
import stat
import urllib.request
import platform

def get_youoke_bin_dir():
    home = os.path.expanduser("~")
    bin_dir = os.path.join(home, ".youoke", "bin")
    os.makedirs(bin_dir, exist_ok=True)
    return bin_dir

def get_ytdlp_path():
    bin_dir = get_youoke_bin_dir()
    is_windows = platform.system() == "Windows"
    filename = "yt-dlp.exe" if is_windows else "yt-dlp"
    return os.path.join(bin_dir, filename)

def ensure_yt_dlp():
    """
    Ensures that the standalone yt-dlp executable exists.
    Downloads it from GitHub if missing.
    Returns the absolute path to the executable.
    """
    exe_path = get_ytdlp_path()
    if os.path.exists(exe_path) and os.path.getsize(exe_path) > 1000000:
        return exe_path

    is_windows = platform.system() == "Windows"
    is_mac = platform.system() == "Darwin"
    
    if is_windows:
        url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    elif is_mac:
        url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
    else:
        url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"

    print(f"[BinaryManager] Downloading yt-dlp from {url} to {exe_path}...")
    
    try:
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 YouOke/1.0'})
        with urllib.request.urlopen(req, context=ctx) as response, open(exe_path, 'wb') as out_file:
            out_file.write(response.read())
            
        if not is_windows:
            st = os.stat(exe_path)
            os.chmod(exe_path, st.st_mode | stat.S_IEXEC)
            
        print(f"[BinaryManager] yt-dlp downloaded successfully.")
    except Exception as e:
        print(f"[BinaryManager] Failed to download yt-dlp: {e}")
        if os.path.exists(exe_path):
            os.remove(exe_path)
        raise e
        
    return exe_path
