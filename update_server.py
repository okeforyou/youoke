import sys

def modify_server():
    with open('scripts/local-bridge/server.py', 'r') as f:
        lines = f.readlines()

    out = []
    in_separate = False
    for line in lines:
        if "progress_store[vid] = {\"status\": \"downloading\"," in line:
            out.append(line)
            out.append("    m4a_path = os.path.join(song_dir, f\"{vid}.m4a\")\n")
            out.append("    yt_url = f\"https://www.youtube.com/watch?v={vid}\"\n")
            out.append("    download_success = False\n")
            out.append("    attempts = []\n\n")
            out.append("    if req.use_manual_upload:\n")
            out.append("        manual_path = os.path.join(song_dir, f\"{vid}.manual.m4a\")\n")
            out.append("        if os.path.exists(manual_path) and os.path.getsize(manual_path) > 0:\n")
            out.append("            m4a_path = manual_path\n")
            out.append("            download_success = True\n")
            out.append("            attempts.append({\"method\": \"manual_upload\", \"status\": \"success\"})\n")
            out.append("            progress_store[vid][\"percent\"] = 20\n")
            out.append("            progress_store[vid][\"message\"] = \"ใช้ออดิโอไฟล์ที่อัปโหลด...\"\n")
            out.append("            print(f\"[Manual Upload] Using uploaded file: {manual_path}\")\n\n")
            continue
        
        # We need to drop the original definitions of m4a_path, yt_url, download_success, attempts right after that
        if line.strip() in [
            "m4a_path = os.path.join(song_dir, f\"{vid}.m4a\")",
            "yt_url = f\"https://www.youtube.com/watch?v={vid}\"",
            "download_success = False",
            "attempts = []"
        ]:
            continue

        out.append(line)
        
    with open('scripts/local-bridge/server.py', 'w') as f:
        f.writelines(out)

modify_server()
