# Firebase playokeforyou-dev - Quick Setup
## คลิกตามลิงก์เหล่านี้เพื่อให้ Monitor Cast ทำงาน (5 นาที)

---

## ✅ Project ที่ใช้งาน

- **Project ID:** `playokeforyou-dev`
- **Project Name:** playokeforyou-dev
- **Console:** https://console.firebase.google.com/project/playokeforyou-dev

---

## 🔧 ขั้นตอนการตั้งค่า (2 ขั้นตอนเท่านั้น)

### ขั้นตอนที่ 1: เปิด Anonymous Authentication (1 นาที)

**คลิกลิงก์นี้เลย:**
👉 https://console.firebase.google.com/project/playokeforyou-dev/authentication/providers

**แล้วทำตามนี้:**
1. หา **"Anonymous"** ในรายการ (บรรทัดล่างสุด)
2. คลิกที่ **"Anonymous"**
3. สวิตช์ **"Enable"** ให้เป็นสีเขียว
4. คลิก **"Save"**
5. เสร็จ! ✅

**ตัวอย่าง:**
```
┌──────────────────────────────────┐
│ Sign-in providers                │
├──────────────────────────────────┤
│ Email/Password      [  ]         │
│ Google              [  ]         │
│ Anonymous           [  ] ← คลิก  │
└──────────────────────────────────┘

หลังคลิก:
┌──────────────────────────────┐
│ Enable Anonymous sign-in?     │
│                               │
│ [Enable]  [OFF] ← เปิดให้เขียว │
│                               │
│ [Cancel] [Save] ← กด Save     │
└──────────────────────────────┘
```

---

### ขั้นตอนที่ 2: ตรวจสอบ Realtime Database (2 นาที)

**คลิกลิงก์นี้เลย:**
👉 https://console.firebase.google.com/project/playokeforyou-dev/database

**2.1 ตรวจสอบว่ามี Database แล้วหรือยัง:**

**ถ้ายังไม่มี (เห็นปุ่ม "Create Database"):**
1. คลิกปุ่ม **"Create Database"** (สีฟ้าหรือสีเขียว)

**2.2 เลือก Location:**
1. เลือก **"asia-southeast1 (Singapore)"**
   - ⚠️ **สำคัญมาก:** ต้องเป็น `asia-southeast1` เท่านั้น!
   - ถ้าเลือกผิด Monitor Cast จะไม่ทำงาน
2. คลิก **"Next"**

**2.3 เลือก Security Rules:**
1. เลือก **"Start in locked mode"** (ปลอดภัยกว่า)
   - ไม่ต้องกังวล เราจะตั้ง rules ทีหลัง
2. คลิก **"Enable"**

**2.4 รอสักครู่:**
- Firebase กำลังสร้าง database (~30 วินาที)
- เมื่อเสร็จจะเห็นหน้า Data tab

---

**ถ้ามี Database อยู่แล้ว:**
ข้ามไปขั้นตอน 2.5 เลย

---

**2.5 ตั้งค่า Security Rules:**
1. คลิกแท็บ **"Rules"** (ข้างบนสุด)
2. **ลบ** rules เก่าทั้งหมด
3. **วาง** rules นี้แทน:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "auth != null",
        "commands": {
          ".indexOn": ["timestamp", "status"]
        },
        "state": {
          ".read": true,
          ".write": "auth != null"
        },
        "participants": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

4. คลิก **"Publish"** (ปุ่มสีฟ้าด้านบน)
5. เสร็จ! ✅

**ตัวอย่าง Rules:**
```
┌─────────────────────────────────┐
│ Rules  │  Data  │  Usage        │ ← คลิก Rules
├─────────────────────────────────┤
│ {                               │
│   "rules": {                    │
│     "rooms": {            ← วาง │
│       ...                       │
│     }                           │
│   }                             │
│ }                               │
│                                 │
│         [Cancel] [Publish] ← กด │
└─────────────────────────────────┘
```

---

## ✅ ตรวจสอบว่าเสร็จแล้ว

### เช็ค Anonymous Auth:
👉 https://console.firebase.google.com/project/playokeforyou-dev/authentication/providers

ควรเห็น:
- **Anonymous** มีเครื่องหมาย ✅ สีเขียว

### เช็ค Realtime Database:
👉 https://console.firebase.google.com/project/playokeforyou-dev/database

ควรเห็น:
- URL: `https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app`
- มีแท็บ **Data**, **Rules**, **Usage**

---

## 🎉 เสร็จแล้ว!

### ขั้นตอนถัดไป:

หลังจากตั้งค่า Firebase Console เสร็จแล้ว กลับมาที่ Terminal แล้วบอก:

**"เสร็จแล้ว ตั้งค่า Firebase เรียบร้อย"**

ผมจะ:
1. ทดสอบการเชื่อมต่อ Firebase
2. อัปเดต Vercel environment variables (ถ้าจำเป็น)
3. Deploy และทดสอบ Monitor Cast
4. ทุกอย่างจะทำงานแล้ว! ✅

---

## 📋 สรุป

**ที่ต้องทำ:**
- [ ] เปิด Anonymous Authentication (1 นาที)
  - Link: https://console.firebase.google.com/project/playokeforyou-dev/authentication/providers
- [ ] ตรวจสอบ/สร้าง Realtime Database (2 นาที)
  - Link: https://console.firebase.google.com/project/playokeforyou-dev/database
  - Location: **asia-southeast1** (สำคัญ!)
  - Rules: ตั้งค่าตามด้านบน

**เสร็จแล้วบอก:** "เสร็จแล้ว ตั้งค่า Firebase เรียบร้อย"

---

**หมายเหตุ:** ถ้ามีปัญหาหรือไม่เข้าใจขั้นตอนไหน แค่ screenshot หน้าจอมาให้ผมดู ผมจะบอกว่าต้องทำยังไง
