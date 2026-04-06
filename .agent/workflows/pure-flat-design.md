---
description: แนวทางการออกแบบ Pure Flat Design (ห้ามใช้เงา/แสงฟุ้ง)
---

# YouOKE Pure Flat Design Workflow

เพื่อให้งานออกแบบของ YouOKE มีความพรีเมียม เรียบง่าย และดูสะอาดตา (Clean & Minimal) ที่สุด ให้ยึดถือมาตรฐานดังนี้:

## 1. กฎเหล็ก "Zero Shadow Policy" (❌ ห้ามใช้เงา)
- **ห้าม** ใช้ Class CSS ดังต่อไปนี้เด็ดขาด: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`
- **ห้าม** ใช้เงาที่ปุ่ม (Buttons) หรือกล่องข้อความ (Modals/Cards)
- **ห้าม** ใช้ `shadow-inner` หรือเงาซ้อนใดๆ

## 2. กฎเหล็ก "No Glow Policy" (❌ ห้ามใช้แสงฟุ้ง)
- **ห้าม** ใช้ `blur-mx` หรือ `backdrop-blur` จนทำให้มองไม่เห็นโครงสร้าง
- **ห้าม** ใช้ Border ที่มาพร้อมกับ Shadow เสมือนแสงนีอน

## 3. สิ่งที่ควรใช้แทน (✅ The Flat Minimalist)
- **Borders (ขอบ)**: ใช้เส้นตัด (Solid Border) บางๆ แทนเงาเพื่อบอกขอบเขต
  - Light Mode: `border border-slate-100` หรือ `border-zinc-100`
  - Dark Mode: `border border-zinc-800`
- **Low-Opacity BG (พื้นหลังโปร่งแสง)**: ใช้พื้นหลังสีบางๆ แทนการยกระดับด้วยเงา
  - ตัวอย่าง: `bg-primary/5` หรือ `bg-zinc-900/50`
- **Radius (ความโค้ง)**: เน้นความมน (Rounded) ที่ชัดเจนเพื่อความพรีเมียม (เช่น `rounded-[24px]` หรือ `rounded-[40px]`)
- **Spacing (ที่ว่าง)**: ใช้ White Space ให้มากเพื่อให้ดูไม่รก

## 4. การตรวจสอบ (Verification)
- ทุกครั้งที่สร้าง Component ใหม่ (เช่น Modal, Card, Button) ต้อง Re-check ว่าไม่มี Class ที่ขึ้นต้นด้วยชื่อ `shadow-` หรือมี CSS property `box-shadow` ครับ

---
*จดจำใว้เสมอ: "ยิ่งเรียบ ยิ่งพรีเมียม"* 🟢✨🏁👑🔍🧪⚠️📱
