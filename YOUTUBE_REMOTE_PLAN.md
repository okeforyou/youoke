# 📺 แผนงาน YouTube Lounge Remote (v5.0 R&D)

โปรเจกต์มหาประลัย (The Final Piece) ที่จะทำให้ YouOke ควบคุม Smart TV ทุกเครื่องผ่านแอป YouTube ได้แบบ 100%

---

## 🔍 1. หลักการทำงาน (Technical Architecture)

เราจะใช้โปรโตคอล **"YouTube Lounge (Screen Pairing)"** ซึ่งเป็นตัวเดียวกับที่คุณใช้แอป YouTube ในมือถือสั่งเปลี่ยนเพลงในทีวีครับ

### 🏗️ โครงสร้างระบบ (Architecture):
1.  **TV Side (YouTube App)**: 
    - ผู้ใช้เปิดแอป YouTube ในทีวี -> Settings -> **"Link with TV code"** (จะได้เลข 12 หลัก)
2.  **YouOke Client (Remote)**:
    - ผู้ใช้กรอกเลข 12 หลักลงใน YouOke
    - YouOke จะทำตัวเป็นเครื่องมือถือที่ได้รับการอนุญาต (Lounge Token Pairing)
3.  **Command Handling (The Queue Bridge)**:
    - เมื่อผู้ใช้กด "เพิ่มลงคิวทีวี" ใน YouOke ระบบจะส่ง HTTP Request ไปที่ `https://www.youtube.com/api/lounge/bc/bind` (Lounge API)
    - ส่งคำสั่ง `addVideo`, `playNext`, หรือ `setPlaylist` ตามที่เราต้องการได้เลยครับ!

---

## 🛠️ 2. แผนการ実装 (Implementation Roadmap)

### เฟสที่ 1: การเชื่อมคู่ (Pairing Sync) - [UNDERWAY]
- สร้างหน้า UI สำหรับกรอก **TV Pairing Code** (12 หลัก)
- เขียนฟังก์ชัน `fetchLoungeToken(code)` เพื่อขอสิทธิ์จาก Server YouTube 
- บันทึก `LoungeToken` ไว้ใช้งานระยะยาว (ไม่ต้องกรอกบ่อยๆ)

### เฟสที่ 2: ระบบคิว (Queue Management)
- พัฒนาฟังก์ชัน `addVideoToTVQueue(videoId)`: สำหรับส่งเพลงใหม่เข้าไปต่อท้ายเพลงที่เล่นอยู่
- พัฒนาฟังก์ชัน `setTVPlaylist(videoIds)`: สำหรับการส่งเพลงทั้งคิวเปลี่ยนในทีวีทันที (กรณีรีเซ็ตคิว)
- พัฒนาฟังก์ชัน `skipTVCurrentVideo()`: สำหรับการสั่งกด "ข้าม" จากมือถือเราครับ

### เฟสที่ 3: สถานะเรียลไทม์ (Real-time Status)
- ฟังสถานะจากทีวีว่า "ตอนนี้กำลังเล่นเพลงอะไรอยู่" และ "เหลือเวลากี่วินาที" เพื่อให้หน้ามือถือ Sync ทันกัน

---

## 🛡️ 3. ความกังวล & ความปลอดภัย (Security & Feasibility)

- **ความเสถียร**: Lounge API เป็นสิ่งที่ Google ใช้อยู่ทุกวัน (ในแอปมือถือ) จึงมีความเสถียรสูงมากครับ
- **ความเสี่ยง**: เป็น Private API ที่อาจมีการเปลี่ยนแปลงชื่อฟิลด์ได้ แต่เราจะเขียนโค้ดเผื่อให้แก้ไขได้ง่ายครับ (Modularized)
- **สิทธิ์การเข้าถึง**: ไม่ต้องล็อกอิน Google ก็สามารถทำได้ครับ แค่มีเลขรหัสจากทีวีก็พอ!

---

### 🚀 Next Steps:
ผมจะเตรียมการสร้าง UI เบื้องต้นใน Branch ใหม่เพื่อให้คุณลูกค้าเห็นภาพครับ! 🟢✨🎯🏁🚀👑
