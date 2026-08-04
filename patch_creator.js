const fs = require('fs');
const file = 'scripts/local-bridge/routes/creator.py';
let code = fs.readFileSync(file, 'utf8');

const newEndpoint = `
@router.get("/lyrics/{video_id}")
async def get_lyrics(video_id: str):
    try:
        from utils.config import get_active_storage_dir, CACHE_DIR
        
        active_dir = get_active_storage_dir()
        song_dir = os.path.join(active_dir, video_id)
        if not os.path.exists(song_dir):
            song_dir = os.path.join(CACHE_DIR, video_id)
            
        timeline_path = os.path.join(song_dir, "lyrics_timeline.json")
        if os.path.exists(timeline_path):
            with open(timeline_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
                
        raise HTTPException(status_code=404, detail="Lyrics not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
`;

if (!code.includes('@router.get("/lyrics/{video_id}")')) {
    code = code.replace('@router.post("/export")', newEndpoint + '\n\n@router.post("/export")');
    fs.writeFileSync(file, code);
}
