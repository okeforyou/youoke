import json
import os
from datetime import datetime
from .config import HISTORY_FILE

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
