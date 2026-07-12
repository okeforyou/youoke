# YouOke Plugin - Build & Release Guide

เอกสารนี้รวบรวมขั้นตอนการ Build และ Release สำหรับ YouOke Plugin เพื่อไม่ให้เกิดความสับสนและปัญหาซ้ำอีกในอนาคต

## ปัญหาเรื่อง Mac Gatekeeper (Damaged App)
เนื่องจากแอปของเรา **ไม่ได้** จ่ายเงินสมัคร Apple Developer Program ($99/ปี) ทำให้ไม่มี Digital Signature (ลายเซ็นดิจิทัล) และไม่ได้ทำ Notarization
ส่งผลให้ระบบรักษาความปลอดภัยของ macOS (Gatekeeper) จะมองว่าแอปของเราไม่น่าเชื่อถือ

**สิ่งที่ต้องรู้:**
- ❌ **ห้ามใช้ไฟล์ `.pkg` เด็ดขาด:** สำหรับ macOS รุ่นใหม่ (Sonoma ขึ้นไป) ถ้าไฟล์ `.pkg` ไม่มีลายเซ็น มันจะขึ้นข้อความว่า "Damaged" และบังคับให้ลบทิ้ง (Move to Trash) โดยไม่มีทางเลือก "Open Anyway" ในตั้งค่าเลย
- ✅ **ต้องใช้ไฟล์ `.dmg` หรือ `.zip` เท่านั้น:** เพราะมันเป็น App Bundle ธรรมดา แม้จะขึ้นเตือนตอนแรก แต่ผู้ใช้สามารถ **คลิกขวา (Right-click) ที่ไอคอนแอป -> เลือก Open** เพื่อบังคับเปิดได้ 

ดังนั้น ใน `youoke-plugin/package.json` จึงต้องตั้งค่า:
```json
"mac": {
  "target": ["dmg", "zip"],
  "identity": null
}
```

## ขั้นตอนการปล่อยเวอร์ชันใหม่ (Release)

ระบบ GitHub Actions ของเราตั้งค่าไว้ให้ Build อัตโนมัติ **เฉพาะตอนที่สร้าง Release ใหม่บน GitHub เท่านั้น** (ไม่ทำงานตอนแค่ Push Code)

1. **อัปเดตเวอร์ชันโค้ด:**
   เข้าไปที่ไฟล์ `youoke-plugin/package.json` และเปลี่ยนเลขเวอร์ชัน:
   ```json
   "version": "1.0.x"
   ```

2. **Commit & Push ลง GitHub:**
   ```bash
   git add youoke-plugin/package.json
   git commit -m "chore: bump plugin version to 1.0.x"
   git push origin main
   ```

3. **สร้าง GitHub Release เพื่อกระตุ้นการ Build:**
   รันคำสั่ง `gh` ใน Terminal (หรือไปสร้างผ่านหน้าเว็บ GitHub > Releases):
   ```bash
   gh release create v1.0.x --title "v1.0.x" --notes "Release v1.0.x" --target main
   ```

4. **รอระบบสร้างไฟล์:**
   ไปที่แถบ **Actions** บน GitHub เพื่อดูสถานะการ Build ใช้เวลาประมาณ 10-15 นาที ระบบจะสร้างไฟล์ `.dmg`, `.zip` (Mac) และ `.exe` (Windows) อัตโนมัติและแนบไปกับ Release นั้น

5. **ระบบ Auto Update ของผู้ใช้:**
   เมื่อไฟล์เสร็จ แอปที่ติดตั้งอยู่ในเครื่องผู้ใช้ จะตรวจสอบเจอเวอร์ชันใหม่ผ่าน `/api/updates/...` ของเว็บไซต์ และโหลดมาติดตั้งให้เอง (ถ้าเป็น Windows จะติดตั้งง่าย แต่ Mac ผู้ใช้อาจต้องลากลง Applications เองอีกรอบ)

## ทางเลือกในอนาคต (แก้ไขถาวร)
หากในอนาคตต้องการให้ผู้ใช้ Mac ดาวน์โหลดแล้วเปิดได้เลยโดยไม่ต้องมานั่งคลิกขวา:
1. สมัคร Apple Developer Program ($99/ปี)
2. นำ Certificate มาใส่ใน GitHub Actions secrets (`CSC_LINK`, `CSC_KEY_PASSWORD`)
3. ลบ `"identity": null` ออกจาก package.json 
4. เพิ่ม `"hardenedRuntime": true`
5. ติดตั้ง `@electron/notarize` และตั้งค่า `afterSign` hook ให้ส่งแอปไปให้ Apple ตรวจสอบ
