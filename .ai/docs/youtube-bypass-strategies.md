# YouTube Audio Extraction & Anti-Bot Bypass Strategies

สรุปแนวทางเชิงเทคนิคเพิ่มเติมสำหรับการรับมือกรณี YouTube อัปเดตระบบป้องกันการดาวน์โหลด (Anti-Bot / SABR / PO Token) เพื่อใช้ส่งต่อเป็นข้อมูลอ้างอิง

---

## 1. แนวทางระดับ Browser Capture (ผ่าน YouOke Chrome Extension) 🌟 *แนะนำสูงสุด*
**หลักการ:** ในเมื่อ YouTube บล็อค Script Server-side (เพราะมองว่าส่ง HTTP request มาจากบอท) แต่ถ้าเปิดเล่นใน Google Chrome ของผู้ใช้จริงๆ YouTube จะมองว่าเป็นผู้ใช้ปกติ

- **เทคโนโลยี:** `chrome.tabCapture` API + `MediaRecorder` / Offscreen Document
- **ขั้นตอนการทำงาน:**
  1. เมื่อระบบ Backend ดาวน์โหลดไม่ผ่าน YouOke Plugin (Extension) จะทำการเปิดแท็บ YouTube ซ่อนอยู่เบื้องหลัง (Hidden/Offscreen Tab)
  2. ให้แท็บนั้นเล่นวิดีโอ YouTube ตามปกติ
  3. ใช้ `chrome.tabCapture` บันทึกเฉพาะสัญญาณเสียง (Audio Stream) สดๆ จากแท็บนั้น
  4. ส่งไฟล์เสียง (WebM/WAV) ที่อัดได้จากเบื้องหลังส่งเข้า `server.py` เพื่อนำไปแยกเสียงด้วย Demucs ต่อทันที
- **ข้อดี:** **ไม่มีทางโดนบล็อค 100%** เพราะเป็นการเล่นวิดีโอมนุษย์จริงๆ ผ่านเบราวเซอร์

---

## 2. แนวทางยกระดับ `yt-dlp` (PO Token / Nightly Build)
**หลักการ:** อัปเกรดการทำงานของ `yt-dlp` ให้ส่งหลักฐานยืนยันตัวตน (Proof of Origin) ตามที่ YouTube ต้องการ

- **เทคโนโลยี:** `yt-dlp-get-pot` / `bgutil` / `nightly` build
- **วิธีการ:**
  1. อัปเดต `yt-dlp` เป็นเวอร์ชัน Nightly อัตโนมัติ (`yt-dlp --update-to nightly`)
  2. ใช้ **PO Token (Proof of Origin Token)** สอดไส้ไปกับคำสั่งดาวน์โหลด เพื่อจำลองตัวตนเป็น Web Client หรือ iOS Client ที่ได้รับอนุญาต
  3. สกัด Cookies จาก Browser ของผู้ใช้งานจริงด้วย `--cookies-from-browser`

---

## 3. แนวทางดึง Stream URL ผ่าน Open-Source Proxy API (Piped / Invidious API)
**หลักการ:** ไม่ต้องดาวน์โหลดจาก YouTube ตรงๆ แต่ร้องขอสตรีมผ่าน Server ตัวกลางที่เป็น Open-Source Privacy Frontend

- **เทคโนโลยี:** Piped API (`https://pipedapi.kavin.rocks`) / Invidious API
- **วิธีการ:**
  1. ยิง API ไปหา Server ของ Piped/Invidious เพื่อขอ Link สตรีมเสียงตรง (`audio/webm` หรือ `audio/m4a`)
  2. เมื่อได้ Direct URL มาแล้ว ให้ใช้ `ffmpeg` หรือ `curl` ดึงไฟล์เสียงมาตรงๆ โดยไม่ต้องผ่าน `yt-dlp`
- **ข้อดี:** ฟรี และมี Public Instances จำนวนมากให้เลือกใช้เป็น Fallback

---

## 4. แนวทางใช้ Self-Hosted Microservice (Cobalt API)
**หลักการ:** ตั้ง Service ดาวน์โหลดแยกต่างหากด้วย Cobalt (Open-source Media Downloader)

- **เทคโนโลยี:** **Cobalt** (imputnet/cobalt)
- **วิธีการ:**
  1. Deploy Cobalt Instance บนฟรีเซิร์ฟเวอร์ หรือรันเป็น Docker ในเครื่อง
  2. ยิง API ขอไฟล์เสียงจาก Cobalt API
- **ข้อดี:** Cobalt มีทีมงานคอยอัปเดตแก้วิธีหลบหลีก YouTube อยู่ตลอดเวลา สกิลการสกัด media สูงมาก

---

## สรุปข้อเสนอแนะในการพัฒนาต่อ
| แนวทาง | ความคุ้มค่า | โอกาสโดนบล็อค | หมายเหตุ |
| :--- | :--- | :--- | :--- |
| **1. Browser Tab Capture** | ⭐️⭐️⭐️⭐️⭐️ (สูงมาก) | แทบเป็น 0% | ยั่งยืนที่สุดเพราะอัดเสียงจากหน้าจอเบราว์เซอร์ผู้ใช้ตรงๆ |
| **2. Piped / Invidious API** | ⭐️⭐️⭐️⭐️ (สูง) | ต่ำ | ทำเป็น Fallback อันดับ 5 ได้ง่าย แค่ยิง HTTP Request |
| **3. Cobalt / PO Token** | ⭐️⭐️⭐️ (ปานกลาง) | ปานกลาง | ต้องคอยอัปเดตและบำรุงรักษาตาม YouTube |
