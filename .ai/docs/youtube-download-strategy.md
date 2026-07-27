# 🛡️ YouTube Download Strategy & Resilience Guide

> **สำคัญ:** อัปเดตไฟล์นี้ทุกครั้งที่มีการแก้ไขระบบ Download หรือเมื่อ YouTube เปลี่ยนแปลงระบบป้องกัน

---

## 📊 ภาพรวมปัญหา

YouTube ปรับระบบป้องกัน (Anti-Bot) อยู่ตลอดเวลา ทำให้ tool ที่ใช้ download มักจะหยุดทำงานโดยไม่มีการแจ้งเตือนล่วงหน้า ปัญหาหลักที่พบ:

| ปัญหา | สาเหตุ | อาการ |
|---|---|---|
| **SABR Block** | YouTube บังคับใช้ Server-ABR สำหรับบาง client | ดาวน์โหลดค้าง / ได้ไฟล์เปล่า |
| **403 Forbidden** | Signature/Token หมดอายุ หรือ IP ถูกจำกัด | Error ทันที |
| **Bot Detection** | ไม่มี PoToken หรือ cookies | ถูก rate-limit หรือ block |
| **Client Deprecation** | YouTube ยกเลิก client เก่า (เช่น `android_sdkless`) | ดาวน์โหลดล้มเหลว |

---

## 🏗️ สถาปัตยกรรม Fallback ปัจจุบัน (server.py v1.2.0+)

```
[Request /separate]
        │
        ▼
[Strategy 1] yt-dlp binary (bundled)
        ├── player_client=web_creator,ios,mweb,web_safari
        ├── cookies: Chrome → Safari → Firefox → ไม่มี
        ├── Timeout: 90 วิ/attempt
        │
        ▼ (ถ้าล้มเหลวทั้งหมด)
[Strategy 2] yt-dlp Python module (อาจใหม่กว่า binary)
        ├── player_client=web_creator,ios,mweb
        ├── ThreadPoolExecutor timeout: 90 วิ
        │
        ▼ (ถ้าล้มเหลว)
[Strategy 3] pytubefix (5 clients)
        ├── MWEB → IOS → ANDROID → WEB → TV
        ├── ThreadPoolExecutor timeout: 60 วิ/client
        │
        ▼ (ถ้าล้มเหลว)
[Strategy 4] innertube library + ffmpeg pipe
        ├── ดึง stream URL จาก InnerTube API โดยตรง
        ├── pipe เข้า ffmpeg เพื่อ download
        ├── Timeout: 90 วิ
        │
        ▼ (ถ้าล้มเหลวทั้งหมด)
[ERROR] ดาวน์โหลดล้มเหลวจากทุกช่องทาง
        └── บันทึกรายละเอียดใน /download/history
```

---

## 🔧 ประวัติการแก้ไข

### ✅ 2026-07-27 — Plugin v1.0.32 / Server v1.2.0 (Download Resilience Upgrade)
- **ปัญหา:** YouTube SABR block ทำให้ `/separate` ค้างแบบไม่มีกำหนด UI ติดอยู่ที่ 0%
- **สาเหตุหลัก:** yt-dlp ใช้ player_client เก่าที่ YouTube block แล้ว + ไม่มี timeout
- **สิ่งที่แก้ไข:**
  1. เพิ่ม `player_client=web_creator,ios,mweb,web_safari` ใน yt-dlp binary
  2. เพิ่ม Firefox ใน cookie_sources
  3. เพิ่ม timeout 90s ต่อ yt-dlp attempt, 60s ต่อ pytubefix attempt
  4. เพิ่ม yt-dlp Python module เป็น Strategy 2 (อาจใหม่กว่า binary)
  5. เพิ่ม pytubefix clients: IOS, ANDROID (เดิมมีแค่ MWEB, WEB, TV)
  6. เพิ่ม innertube+ffmpeg เป็น Strategy 4 (ฟรี 100%, ไม่ต้องพึ่ง yt-dlp)
  7. เพิ่ม `innertube` ใน requirements.txt
- **Commit:** (ดู git log)

---

## 🔑 Key Configurations สำหรับ yt-dlp 2026

### Player clients ที่ยังทำงานได้ (อัปเดต: 2026-07)
```bash
# ใช้ใน --extractor-args
youtube:player_client=web_creator,ios,mweb,web_safari

# ถ้า SABR ยังบล็อก ลอง exclude บางตัว
youtube:player_client=web_creator,ios,mweb,-web_creator_embedded

# ดู client ทั้งหมดที่มีใน yt-dlp
yt-dlp --list-extractors | grep youtube
```

### Cookie sources (เรียงตามประสิทธิภาพ)
```bash
--cookies-from-browser chrome    # ดีที่สุด
--cookies-from-browser safari    # รองลงมา
--cookies-from-browser firefox   # fallback
# ไม่ใช้ cookie เลย            # สุดท้าย
```

---

## 🚨 Checklist เมื่อ Download หยุดทำงาน

1. **ดู log ล่าสุด:**
   ```bash
   tail -100 ~/Library/Application\ Support/youoke-plugin/server.log
   ```

2. **ระบุ error type จาก log:**
   - `403 Forbidden` → เปลี่ยน player_client
   - `SABR` → เปลี่ยน extractor-args
   - `Timeout` → YouTube throttle IP เรา (รอหรือเปลี่ยน method)
   - `Sign in to confirm` → ต้องใช้ cookies จาก browser

3. **อัปเดต yt-dlp ก่อนเสมอ:**
   ```bash
   cd scripts/local-bridge && source venv/bin/activate
   pip install yt-dlp --upgrade
   ```

4. **ทดสอบ manual:**
   ```bash
   ./yt-dlp_macos --simulate \
     --extractor-args "youtube:player_client=web_creator,ios,mweb" \
     "https://www.youtube.com/watch?v=VIDEO_ID"
   ```

5. **ถ้า yt-dlp ยังไม่หาย → ทดสอบ pytubefix:**
   ```python
   from pytubefix import YouTube
   yt = YouTube("URL", client="IOS")
   print(yt.streams.get_audio_only())
   ```

6. **ถ้าทุกอย่างล้มเหลว → ทดสอบ innertube:**
   ```python
   import innertube
   client = innertube.InnerTube("ANDROID")
   data = client.player(video_id="VIDEO_ID")
   print(data.get("streamingData", {}).get("adaptiveFormats", [])[:2])
   ```

7. **บันทึกวิธีที่ใช้ได้ในหัวข้อ "ประวัติการแก้ไข" ด้านบน**

---

## 📱 แผน Cloud Fallback (ระยะยาว — เมื่อทุก local method ล้มเหลว)

```
User Browser → youoke.vercel.app → /api/separate-cloud
                                         │
                                         ▼
                              Cloud Worker (Railway / Fly.io)
                              - ดาวน์โหลดเพลง (ไม่โดน block เพราะ IP Cloud)
                              - แยกเสียง (demucs บน GPU)
                              - อัปโหลดผลไป Firebase Storage
                                         │
                                         ▼
                              ส่ง URL กลับมาที่ Browser
```

**ข้อดี:** ไม่ต้องพึ่ง local machine, IP Cloud ไม่โดน block
**ข้อเสีย:** มีค่าใช้จ่าย GPU time, ต้องออกแบบ Auth ใหม่
**ประมาณการค่าใช้จ่าย:** ~฿0.50-1 ต่อเพลง (Bandwidth + GPU)
