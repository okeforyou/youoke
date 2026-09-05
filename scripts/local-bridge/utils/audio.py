import os
import subprocess

def get_ffmpeg_path():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except:
        return "ffmpeg"

def is_valid_audio(filepath):
    if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
        return False
    # If the file is extremely small (< 50KB), it's highly likely an HTML error page or JSON
    if os.path.getsize(filepath) < 50000:
        return False
    try:
        ffmpeg_exe = get_ffmpeg_path()
        res = subprocess.run([ffmpeg_exe, "-v", "error", "-i", filepath, "-f", "null", "-"], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        return res.returncode == 0
    except:
        return os.path.getsize(filepath) > 50000

def convert_audio(input_path, output_path, fmt="wav"):
    ffmpeg_exe = get_ffmpeg_path()
    try:
        if fmt == "wav":
            subprocess.run([ffmpeg_exe, "-y", "-i", input_path, output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif fmt == "m4a":
            subprocess.run([ffmpeg_exe, "-y", "-i", input_path, "-c:a", "aac", "-b:a", "128k", output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return
    except FileNotFoundError:
        # ffmpeg not found, fallback to afconvert (macOS only)
        try:
            if fmt == "wav":
                subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16", input_path, output_path], check=True)
            elif fmt == "m4a":
                subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "128000", input_path, output_path], check=True)
        except Exception as e:
            raise Exception(f"Audio conversion failed (afconvert): {str(e)}")
    except Exception as e:
        raise Exception(f"FFmpeg conversion failed: {str(e)}")

def mix_audio(input_paths, output_path, fmt="m4a"):
    ffmpeg_exe = get_ffmpeg_path()
    valid_inputs = [p for p in input_paths if os.path.exists(p) and os.path.getsize(p) > 0]
    if not valid_inputs:
        return False
    if len(valid_inputs) == 1:
        try:
            convert_audio(valid_inputs[0], output_path, fmt=fmt)
            return True
        except:
            return False
    try:
        cmd = [ffmpeg_exe, "-y"]
        for p in valid_inputs:
            cmd.extend(["-i", p])
        cmd.extend(["-filter_complex", f"amix=inputs={len(valid_inputs)}:normalize=0", "-c:a", "aac", "-b:a", "192k", output_path])
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return res.returncode == 0 and os.path.exists(output_path)
    except Exception as e:
        print(f"[mix_audio] Failed: {e}")
        return False
