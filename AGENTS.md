# YouOke Agent Protocol & Master Plan
<!-- v3.0 Milestone Force Redeploy -->

### 1. 🎯 Master Plan Design (v3.0 - Mobile First & Flat)
- **เรียบง่าย (Minimalist)**: ใช้สีพื้น (Solid Colors) และเส้นขอบ (Borders) แทนการใช้มิติความลึก
- **ไร้เงา (Zero Shadows)**: **ห้าม**ใช้ Utility Class `shadow-*` ทุกชนิดโดยเด็ดขาด ให้ใช้ `border border-slate-100` แทน
- **กระชับ (Compact)**: ลด Padding และ Margin ในส่วนที่เป็นรายการ (Lists) เพื่อให้แสดงข้อมูลได้หนาแน่นขึ้น
- **Mobile Optimized (App-like)**:
    - ออกแบบให้เหมือน Mobile App มากที่สุด (Bottom Nav, Full-screen Modals บนมือถือ)
    - ใช้ Rounded Corners ขนาดใหญ่ (`rounded-2xl`, `rounded-3xl`)
    - ปุ่มกดต้องมีขนาดใหญ่พอสำหรับนิ้วมือ (Min height 44px) และมีการตอบสนอง (Active scale effect)
- **High Performance**: หลีกเลี่ยง Background Blur ที่ซับซ้อนเกินไปบน Mobile เพื่อความลื่นไหล

### 2. 🛡️ กฎเหล็ก (Non-Negotiables)
- **Chromecast Rule**: ห้ามแก้ไขโค้ดที่อาจกระทบต่อระบบการเล่นเพลงและการส่งหน้าจอ (Sync/Dual Screen) โดยเด็ดขาด
- **ห้าม "Nuclear Revert"**: ห้ามใช้คำสั่งย้อนกลับไฟล์ทั้งโปรเจกต์ หรือย้อนกลับทั้งโฟลเดอร์
- **ห้าม "Drive-by Refactor"**: ห้ามแก้โค้ดส่วนที่ไม่เกี่ยวข้อง, ห้ามจัดฟอร์แมตไฟล์ใหม่ และห้ามแอบ "Optimize" โค้ดที่ทำงานได้ดีอยู่แล้ว
- **Surgical Edit เท่านั้น**: ทุกการแก้ไขต้องกระทำแบบ "ผ่าตัดเฉพาะจุด" คือแก้ให้น้อยที่สุดเพื่อผลลัพธ์ที่ตรงจุดที่สุด (Strict Minimalist)
- **Logic Integrity (ห้ามสลับฝั่ง)**: หากงานเป็นเรื่องดีไซน์ (UI/CSS/Tailwind) **ห้ามแตะต้องบรรทัด Logic (onClick, addDoc, fetch, database write)** โดยพลการเด็ดขาด และห้ามตัดสินใจเปลี่ยนวิธีเขียนจาก Client-side ไปเป็น Server-side เอง

### 3. 🚦 ระบบการอนุมัติ (Approval System) - @/follow-md
ทุกครั้งก่อนเริ่มงาน ต้องรายงาน 5 หัวข้อในภาษาไทย:
1. **เป้าหมาย (Goal)**
2. **สิ่งที่ต้องแก้ (To-be-Changed)**
3. **ผลกระทบ (Impact)**
4. **แนวทางแก้ไข (Resolution)**
5. **ความเข้ากันได้ของดีไซน์ (Design Harmony)**
**--> ต้องรอคำสั่ง "ลุย" หรือ "ไป" ก่อนเริ่มแก้ไขทุกครั้ง**
