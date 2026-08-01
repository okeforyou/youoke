import sys
import os
import socket
import urllib.request
import time
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI(title="YouOke Local AI Bridge")

# Import routes
from routes.system import router as system_router
from routes.separation import router as separation_router
from routes.library_cache import router as library_cache_router
from routes.search_files import router as search_files_router
from routes.creator import router as creator_router

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://play.okeforyou.com"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Include routers
app.include_router(system_router)
app.include_router(separation_router)
app.include_router(library_cache_router)
app.include_router(search_files_router)
app.include_router(creator_router)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "demucs_worker":
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
