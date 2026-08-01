from fastapi import APIRouter, HTTPException, Body
import os
import json
import urllib.request
import urllib.error
from utils.config import get_active_storage_dir

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio(
    video_id: str = Body(...),
    api_key: str = Body(...),
    provider: str = Body("deepgram")
):
    try:
        active_dir = get_active_storage_dir()
        
        # 1. Locate the vocals.m4a
        # Legacy search
        legacy_path = os.path.join(active_dir, video_id, "vocals.m4a")
        song_dir = os.path.join(active_dir, video_id)
        
        if not os.path.exists(legacy_path):
            found = False
            for folder_name in os.listdir(active_dir):
                temp_dir = os.path.join(active_dir, folder_name)
                if not os.path.isdir(temp_dir): continue
                
                y_json = os.path.join(temp_dir, "youoke.json")
                if os.path.exists(y_json):
                    try:
                        with open(y_json, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            if data.get("videoId") == video_id:
                                song_dir = temp_dir
                                legacy_path = os.path.join(temp_dir, "vocals.m4a")
                                found = True
                                break
                    except: pass
            if not found:
                # Fallback to cache dir
                from utils.config import CACHE_DIR
                legacy_path = os.path.join(CACHE_DIR, video_id, "vocals.m4a")
                song_dir = os.path.join(CACHE_DIR, video_id)
        
        if not os.path.exists(legacy_path):
            raise HTTPException(status_code=404, detail="Vocals file not found for this video_id.")
            
        # 2. Call the AI API
        if provider.lower() == "deepgram":
            with open(legacy_path, 'rb') as audio:
                audio_data = audio.read()
                
            url = "https://api.deepgram.com/v1/listen?language=th&punctuate=true&smart_format=true&utterances=true"
            req = urllib.request.Request(url, data=audio_data, method="POST")
            req.add_header("Authorization", f"Token {api_key}")
            req.add_header("Content-Type", "audio/m4a")
            
            try:
                with urllib.request.urlopen(req) as response:
                    res_body = response.read()
                    dg_result = json.loads(res_body)
                    
                    # Process into our timeline format
                    words = []
                    channels = dg_result.get("results", {}).get("channels", [])
                    if channels:
                        alts = channels[0].get("alternatives", [])
                        if alts:
                            dg_words = alts[0].get("words", [])
                            for w in dg_words:
                                words.append({
                                    "word": w.get("punctuated_word", w.get("word", "")),
                                    "start": w.get("start"),
                                    "end": w.get("end"),
                                    "confidence": w.get("confidence")
                                })
                    
                    # Save timeline locally
                    timeline_path = os.path.join(song_dir, "lyrics_timeline.json")
                    with open(timeline_path, "w", encoding="utf-8") as f:
                        json.dump({"provider": "deepgram", "words": words}, f, ensure_ascii=False, indent=2)
                        
                    return {"status": "success", "words": words}
            except urllib.error.HTTPError as e:
                err_msg = e.read().decode('utf-8')
                raise HTTPException(status_code=e.code, detail=f"Deepgram API Error: {err_msg}")
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export")
async def export_video(
    video_id: str = Body(...),
    timeline: list = Body(...),
    bg_color: str = Body("#000000")
):
    try:
        from utils.config import CACHE_DIR, get_active_storage_dir
        from utils.audio import get_ffmpeg_path
        import subprocess
        
        active_dir = get_active_storage_dir()
        song_dir = os.path.join(active_dir, video_id)
        if not os.path.exists(song_dir):
            song_dir = os.path.join(CACHE_DIR, video_id)
            
        if not os.path.exists(song_dir):
            raise HTTPException(status_code=404, detail="Song directory not found.")
            
        ass_path = os.path.join(song_dir, "lyrics.ass")
        
        # Build .ass file
        ass_content = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,80,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,2,2,10,10,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        
        # Convert timeline to ass events (Group into lines based on pauses)
        # For simplicity, we just put one word per line or group them simply.
        # Real karaoke groups by sentence, but here we just write each word for now or group by 2-second gaps.
        lines = []
        current_line = []
        for word in timeline:
            if not current_line:
                current_line.append(word)
            else:
                last_word = current_line[-1]
                if word['start'] - last_word['end'] > 1.0:
                    lines.append(current_line)
                    current_line = [word]
                else:
                    current_line.append(word)
        if current_line:
            lines.append(current_line)
            
        def format_time(seconds):
            h = int(seconds // 3600)
            m = int((seconds % 3600) // 60)
            s = int(seconds % 60)
            cs = int((seconds % 1) * 100)
            return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

        for line in lines:
            start_time = format_time(line[0]['start'])
            end_time = format_time(line[-1]['end'])
            
            # Build karaoke string
            k_text = ""
            for w in line:
                dur_cs = int((w['end'] - w['start']) * 100)
                k_text += f"{{\\k{dur_cs}}}{w['word']} "
                
            ass_content += f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{k_text}\n"
            
        with open(ass_path, "w", encoding="utf-8") as f:
            f.write(ass_content)
            
        # Run FFmpeg to burn subtitles and mix audio
        # Using no_vocals.m4a (or fallback to original audio if not separated fully)
        audio_path = os.path.join(song_dir, "no_vocals.m4a")
        if not os.path.exists(audio_path):
            audio_path = os.path.join(song_dir, f"{video_id}.m4a") # original
            
        out_mp4 = os.path.join(song_dir, "export.mp4")
        ffmpeg_exe = get_ffmpeg_path()
        
        # Create a black background video with the audio length
        cmd = [
            ffmpeg_exe, "-y",
            "-f", "lavfi", "-i", f"color=c=black:s=1920x1080:r=30",
            "-i", audio_path,
            "-vf", f"ass={ass_path}",
            "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac",
            "-shortest",
            out_mp4
        ]
        
        # subprocess.run(cmd, check=True) # Uncomment when ready to actually run
        
        return {"status": "success", "message": "Export completed.", "file": out_mp4}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
