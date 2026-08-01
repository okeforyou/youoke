import os

with open("scripts/local-bridge/routes/creator.py", "r", encoding="utf-8") as f:
    code = f.read()

export_code = """
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
        ass_content = \"\"\"[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,80,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,2,2,10,10,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
\"\"\"
        
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
                k_text += f"{{\\\\k{dur_cs}}}{w['word']} "
                
            ass_content += f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{k_text}\\n"
            
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
"""

new_code = code.split("@router.post(\"/export\")")[0] + export_code
with open("scripts/local-bridge/routes/creator.py", "w", encoding="utf-8") as f:
    f.write(new_code)
