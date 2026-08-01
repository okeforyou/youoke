import os
import json

APP_SUPPORT_DIR = os.path.expanduser("~/Library/Application Support/YouOke")
LIBRARY_DIR = os.path.join(APP_SUPPORT_DIR, 'Library')
os.makedirs(LIBRARY_DIR, exist_ok=True)
LIBRARY_DB_PATH = os.path.join(LIBRARY_DIR, 'library.json')

CACHE_DIR = os.path.join(APP_SUPPORT_DIR, 'Cache')
os.makedirs(CACHE_DIR, exist_ok=True)

HISTORY_FILE = os.path.join(CACHE_DIR, "download_history.json")
CONFIG_FILE = os.path.join(APP_SUPPORT_DIR, "config.json")

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_config(cfg):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)

def get_active_storage_dir():
    cfg = load_config()
    custom_path = cfg.get("custom_storage_path")
    if custom_path and os.path.exists(custom_path):
        return custom_path
    return CACHE_DIR
