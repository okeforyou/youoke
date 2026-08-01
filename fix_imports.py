with open("scripts/local-bridge/server.py", "r", encoding="utf-8") as f:
    code = f.read()

bad_imports = """import mimetypes
from starlette.responses import FileResponse
from fastapi import Path"""
code = code.replace(bad_imports, "")

with open("scripts/local-bridge/server.py", "w", encoding="utf-8") as f:
    f.write(code)
