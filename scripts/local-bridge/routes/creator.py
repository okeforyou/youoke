from fastapi import APIRouter, HTTPException, Body
import os
import json
import asyncio
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
        
        # 1. Locate the best audio file (vocals preferred, then original/cached audio)
        audio_target_path = None
        
        # Check active directory for direct folder or metadata match
        legacy_path = os.path.join(active_dir, video_id)
        song_dir = legacy_path
        
        def find_audio_in_dir(target_dir):
            if not os.path.exists(target_dir) or not os.path.isdir(target_dir):
                return None
            # Priority 1: Separated Vocals
            for v_name in ["vocals.m4a", "vocals.mp3", "vocals.wav", "vocals.webm", "vocals.ogg"]:
                p = os.path.join(target_dir, v_name)
                if os.path.exists(p) and os.path.getsize(p) > 10000:
                    return p
            # Priority 2: Original Audio
            for o_name in [f"{video_id}.m4a", f"{video_id}.mp3", f"{video_id}.webm", "original.m4a", "original.audio", "no_vocals.m4a", "other.m4a"]:
                p = os.path.join(target_dir, o_name)
                if os.path.exists(p) and os.path.getsize(p) > 10000:
                    return p
            # Priority 3: Any valid audio file
            for f in os.listdir(target_dir):
                if f.endswith(('.m4a', '.mp3', '.webm', '.wav', '.ogg')) and not f.endswith('.yok'):
                    p = os.path.join(target_dir, f)
                    if os.path.getsize(p) > 10000:
                        return p
            return None

        audio_target_path = find_audio_in_dir(song_dir)
        
        if not audio_target_path and os.path.exists(active_dir):
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
                                audio_target_path = find_audio_in_dir(temp_dir)
                                if audio_target_path:
                                    break
                    except: pass

        if not audio_target_path:
            # Fallback to cache dir
            from utils.config import CACHE_DIR
            cache_song_dir = os.path.join(CACHE_DIR, video_id)
            audio_target_path = find_audio_in_dir(cache_song_dir)
            if audio_target_path:
                song_dir = cache_song_dir
            else:
                song_dir = cache_song_dir
                os.makedirs(song_dir, exist_ok=True)
                # Auto-download audio stream via yt-dlp fallback non-blockingly
                try:
                    from services.downloader import download_audio
                    yt_url = f"https://www.youtube.com/watch?v={video_id}"
                    downloaded_file = await asyncio.to_thread(download_audio, yt_url, song_dir, video_id)
                    if downloaded_file and os.path.exists(downloaded_file):
                        audio_target_path = downloaded_file
                except Exception as dl_err:
                    print(f"[Transcribe Downloader Error] {dl_err}")

        if not audio_target_path or not os.path.exists(audio_target_path):
            raise HTTPException(
                status_code=404, 
                detail="ไม่พบไฟล์เสียงร้อง และไม่สามารถดาวน์โหลดเพลงนี้ได้ กรุณาลองกดแยกเสียงเพลงนี้ในโหมด AI ก่อน"
            )
            
        # Check if already transcribed
        timeline_path = os.path.join(song_dir, "lyrics_timeline.json")
        if os.path.exists(timeline_path):
            try:
                with open(timeline_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "words" in data and len(data["words"]) > 0:
                        return {"status": "success", "words": data["words"], "cached": True}
            except:
                pass # If corrupted, fetch again
                
        # 2. Call the AI API
        if provider.lower() == "deepgram":
            with open(audio_target_path, 'rb') as audio:
                audio_data = audio.read()
                
            # Determine content-type from extension
            ext = os.path.splitext(audio_target_path)[1].lower()
            content_type = "audio/m4a"
            if ext == ".mp3":
                content_type = "audio/mpeg"
            elif ext == ".wav":
                content_type = "audio/wav"
            elif ext == ".webm":
                content_type = "audio/webm"
            elif ext == ".ogg":
                content_type = "audio/ogg"

            url = "https://api.deepgram.com/v1/listen?model=nova-3&language=th&punctuate=true&smart_format=true&utterances=true"
            req = urllib.request.Request(url, data=audio_data, method="POST")
            req.add_header("Authorization", f"Token {api_key}")
            req.add_header("Content-Type", content_type)
            
            def perform_deepgram_request():
                with urllib.request.urlopen(req, timeout=600) as response:
                    return response.read()

            try:
                # Use a larger timeout for upload connections, running inside thread pool to prevent blocking loop
                res_body = await asyncio.to_thread(perform_deepgram_request)
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
            
    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e)
        if "timed out" in error_str.lower():
            raise HTTPException(status_code=504, detail="หมดเวลาเชื่อมต่อ (อินเทอร์เน็ตในการอัปโหลดอาจช้าเกินไป) กรุณาลองใหม่อีกครั้ง")
        raise HTTPException(status_code=500, detail=error_str)



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


@router.post("/export")
async def export_video(
    video_id: str = Body(...),
    timeline: list = Body(...)
):
    try:
        from utils.config import CACHE_DIR, get_active_storage_dir
        import zipfile
        from fastapi.responses import FileResponse
        
        active_dir = get_active_storage_dir()
        song_dir = os.path.join(active_dir, video_id)
        if not os.path.exists(song_dir):
            song_dir = os.path.join(CACHE_DIR, video_id)
            
        if not os.path.exists(song_dir):
            raise HTTPException(status_code=404, detail="Song directory not found.")
            
        # 1. Save lyrics.json
        lyrics_path = os.path.join(song_dir, "lyrics.json")
        with open(lyrics_path, "w", encoding="utf-8") as f:
            json.dump({"words": timeline}, f, ensure_ascii=False, indent=2)
            
        # 2. Build metadata.json
        meta_path = os.path.join(song_dir, "metadata.json")
        title = "Unknown"
        title_txt = os.path.join(song_dir, "title.txt")
        if os.path.exists(title_txt):
            with open(title_txt, "r", encoding="utf-8") as f:
                title = f.read().strip()
                
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({"videoId": video_id, "title": title}, f, ensure_ascii=False, indent=2)
            
        # 3. Create .yok (zip) archive
        export_path = os.path.join(song_dir, f"{video_id}.yok")
        
        files_to_zip = ["lyrics.json", "metadata.json", "vocals.m4a", "no_vocals.m4a"]
        # Include all .m4a files in case it's pro mode (drums.m4a, etc) or original
        for f in os.listdir(song_dir):
            if f.endswith(".m4a") and f not in files_to_zip:
                files_to_zip.append(f)
                
        with zipfile.ZipFile(export_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for fname in files_to_zip:
                fpath = os.path.join(song_dir, fname)
                if os.path.exists(fpath):
                    zipf.write(fpath, arcname=fname)
                    
        # Encode filename for headers to avoid ascii errors
        from urllib.parse import quote
        filename = f"{title}.yok"
        encoded_filename = quote(filename)
        
        return FileResponse(
            export_path, 
            media_type="application/zip", 
            filename=filename,
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
