# 🎙️ YouOKE Business: Master Plan (MVP Phase)

พิมพ์เขียวสรุปการเปลี่ยนระบบ YouOKE จากแพลตฟอร์มส่วนตัว สู่ระบบบริหารจัดการร้านคาราโอเกะ

## 1. User Journey (Zero Friction Flow)
- **Scan to Remote:** ลูกค้าสแกน QR Code ที่โต๊ะ -> วิ่งเข้าหน้า `/remote?room=ID` ทันที
- **Auto-Pairing:** ระบบทำการเชื่อมต่อมือถือกับ TV ในห้องอัตโนมัติ โดยไม่ต้องกรอกรหัส
- **Guest Access:** ใช้งานได้ทันทีโดยไม่ต้องสมัครสมาชิก (Session ผูกกับรหัสห้อง)

## 2. Technical Architecture (Native Media Support)
- **Hybrid Player:** พัฒนา Player ให้รองรับทั้ง YouTube (Iframe) และ Local Server (HTML5 Video)
- **Local Provider Plugin:** ตัว Indexer เพลงที่จะกวาดไฟล์ MP4/MKV จาก Server ร้านมาเป็นรายการเพลงในแอป
- **Firestore Sync:** ใช้ระบบ Real-time Sync เดิมเพื่อสั่งงานจาก Remote ไปยัง TV และรับสถานะจาก Admin

## 3. Shop Admin Console (The Counter)
- **Dashboard:** ดูสถานะทุกห้องในหน้าเดียว
- **Time Management:** ระบบสั่งเปิดห้อง/กำหนดเวลา/ต่อเวลา จากเคาน์เตอร์ และสั่ง Reset ระบบได้จากระยะไกล
- **Reporting:** สรุปยอดการใช้งานแต่ละห้องในแต่ละวัน

## 4. Key UX Solutions (Professional Look)
- **Dynamic Assets:** ใช้รูปศิลปินมาแสดงแทนปกเพลงที่ไม่มี เพื่อความพรีเมียม
- **Smart Category:** จัดหมวดหมู่เพลงอัตโนมัติจากชื่อ Folder (ไทย/สากล/ลูกทุ่ง)
- **Instant Search:** ระบบค้นหาเพลงจากไฟล์ในเครื่องที่เน้นความเร็วสูง

## 5. Next Evolution (Future Expansion)
- **Service Integration:** ระบบสั่งอาหารและเครื่องดื่มผ่านหน้า Remote
- **Audio Effects:** การควบคุมเสียง Echo/Reverb และการสลับ Audio Track สำหรับตัดเสียงร้อง

---
*บันทึกเมื่อ: 2026-04-16 โดย AI Antigravity เพื่อเป็นแนวทางในการพัฒนาต่อ*
