---
description: Workflow สำหรับการอัปเดตเวอร์ชันและบันทึกการแก้ไข (Commit) อย่างเป็นระบบ
---

# YouOKE Commit Workflow

ใช้ Workflow นี้เมื่อต้องการบันทึกการทำงานหลังจากแก้ไขโค้ดเสร็จสิ้น เพื่อรักษาความต่อเนื่องของระบบเวอร์ชัน

1. **Update Version**:
   - ไปที่ `src/core/version.ts`
   - เพิ่มรายการใน `CHANGELOGS` ที่ตำแหน่งบนสุด
   - ระบุ `version`, `date`, `changes` (หัวข้อการแก้ไข) และ `recent_updates`
   - **สำคัญ**: เลขเวอร์ชันควรจะล้อตามลอจิก Semantic Versioning (เช่น v5.3.62 -> v5.3.63)

2. **Verify Changes**:
   - ตรวจสอบความถูกต้องของโค้ดในเบราว์เซอร์หรือ Terminal
   - เช็คว่าไม่มี Error ตกค้างในหน้า Remote หรือหน้าหลัก

3. **Stage Changes**:
// turbo
   - รันคำสั่ง `git add .` เพื่อเตรียมไฟล์ทั้งหมด

4. **Commit with Message**:
// turbo
   - รันคำสั่ง `git commit -m "[VERSION]: [SUMMARY]"`
   - ตัวอย่าง: `git commit -m "v5.3.62: Fix Remote Control ReferenceError/TypeError (g.split)"`

5. **Final Sync**:
   - ตรวจสอบ `git status` อีกครั้งเพื่อให้แน่ใจว่า Working Tree สะอาดแล้ว
