from fastapi import APIRouter
import torch
import os
import signal
import threading
import time
from utils.config import CACHE_DIR, load_config, save_config
from server_state import VERSION, rapidapi_quota

router = APIRouter()

@router.get("/health")
def health():
    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
    return {"status": "ok", "message": "YouOke Local AI Bridge is running.", "device": device, "quota": rapidapi_quota}

@router.get("/config")
def get_config():
    cfg = load_config()
    return {"cache_dir": CACHE_DIR, "custom_storage_path": cfg.get("custom_storage_path")}

@router.get("/select_folder")
def select_folder():
    import subprocess
    import sys
    folder_path = None
    try:
        if sys.platform == 'darwin':
            script = 'POSIX path of (choose folder with prompt "Select YouOke Storage Folder")'
            res = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            if res.returncode == 0 and res.stdout.strip():
                folder_path = res.stdout.strip()
        elif sys.platform == 'win32':
            script = 'Add-Type -AssemblyName System.windows.forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.ShowDialog() | Out-Null; $f.SelectedPath'
            res = subprocess.run(['powershell', '-Command', script], capture_output=True, text=True, creationflags=subprocess.CREATE_NO_WINDOW)
            if res.returncode == 0 and res.stdout.strip():
                folder_path = res.stdout.strip()
        
        if folder_path:
            cfg = load_config()
            cfg['custom_storage_path'] = folder_path
            save_config(cfg)
            return {"status": "success", "path": folder_path}
        return {"status": "cancelled"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/version")
def get_version():
    return {"status": "success", "version": VERSION}

@router.post("/shutdown")
def shutdown_server():
    def kill_it():
        time.sleep(0.5)
        os.kill(os.getpid(), signal.SIGTERM)
    threading.Thread(target=kill_it).start()
    return {"status": "success", "message": "Shutting down old server instance..."}
