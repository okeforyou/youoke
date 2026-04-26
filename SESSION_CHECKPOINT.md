# 🔄 SESSION CHECKPOINT: YouOKE & Karaoke Shop Project
*บันทึกเมื่อ: 2026-04-16 (Context Save)*

## 1. สถานะล่าสุดของ YouOKE (Production)
- **Stability Hardening:** ติดตั้งระบบ **"Double Shield"** และใช้ `safeSplit` ทั่วทั้งโปรเจกต์เพื่อป้องกัน runtime crashes จากข้อมูล Firebase/URL
- **Quota Optimization:** ปรับลด Heartbeat ของ `CastService` จาก 1s เป็น 5-10s และเพิ่ม Pagination ในหน้า Admin Users เพื่อประหยัด Firestore Reads
- **LINE Login:** ทราบปัญหาเรื่อง Custom Token ใน Plesk (Production) และมีแผนจะเปลี่ยนไปใช้ระบบ Linking (UID) แทนการทำ Auth เต็มรูปแบบเพื่อความนิ่ง

## 2. สถานะโครงการ "ร้านคาราโอเกะ" (Future Shop System)
- **Architecture:** ตกลงใช้ Codebase เดิมของ YouOKE เป็นฐาน (Foundation)
- **Master Plan:** บันทึกไว้แล้วที่ `KARAOKE_SHOP_PLAN.md`
- **Key Concepts:**
    - สแกน QR เข้าหน้า `/remote` ทันที (Auto-Pairing)
    - รองรับ Native Video Player (เล่นไฟล์ MP4/MKV จาก Local Server)
    - ระบบ Admin คุมเวลาจากเคาน์เตอร์ (Timer Sync)
- **Pending Tasks:** การสร้าง `NativePlayer.tsx` และระบบดึงข้อมูลเพลง (Indexer) จากไฟล์ในเครื่อง

## 3. ข้อมูลทางเทคนิคที่สำคัญ (Technical Context)
- **Root Path:** `/Users/boonyanone/Documents/GitHub/play.okeforyou.com`
- **Utility:** `src/utils/stringUtils.ts` (มี `safeSplit` ที่ต้องใช้เสมอ)
- **Cast Engine:** `src/services/CastService.ts` (หัวใจของการ Sync ระหว่างอุปกรณ์)

---
**เป้าหมายถัดไป:** พร้อมสลับไปทำโปรเจกต์อื่น หรือเริ่มลุย Phase 1 ของร้านค้า (Native Player)
