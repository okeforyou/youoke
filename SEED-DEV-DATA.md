# 🌱 Seed Development Data

คู่มือสำหรับการสร้างข้อมูลทดสอบใน Firebase Dev

---

## ✅ ขั้นตอนที่ 1: Download Service Account Key (ครั้งเดียว)

### 1.1 เข้า Firebase Console

1. เปิด [Firebase Console](https://console.firebase.google.com/)
2. เลือก project: **playokeforyou-dev**

### 1.2 Download Service Account Key

1. คลิกเกียร์ ⚙️ → **Project settings**
2. ไปที่แท็บ **Service accounts**
3. เลื่อนลงล่าง → คลิก **"Generate new private key"**
4. ยืนยัน → download ไฟล์ JSON

### 1.3 วางไฟล์ที่ Project Root

1. **เปลี่ยนชื่อไฟล์** เป็น: `serviceAccountKey.json`
2. **วางไว้ที่:** `/Users/boonyanone/Documents/GitHub/play.okeforyou.com/serviceAccountKey.json`

**หมายเหตุ:**
- ⚠️ ไฟล์นี้มีสิทธิ์ Full Admin ของ Firebase
- ⚠️ **NEVER commit ไฟล์นี้ลง Git!** (ได้ใส่ใน .gitignore แล้ว)
- ⚠️ เก็บไว้ในเครื่องเท่านั้น

---

## ✅ ขั้นตอนที่ 2: รัน Seed Script (30 วินาที)

```bash
npm run seed:dev
```

**Script จะสร้าง:**

### 👥 Test Users (5 accounts):

| Email | Password | Role | Tier | Description |
|-------|----------|------|------|-------------|
| `boonyanone@gmail.com` | `Boonyanone@5561` | admin | lifetime | ✨ Your main admin account |
| `admin@test.com` | `admin123` | admin | lifetime | 🔐 Backup admin |
| `free@test.com` | `test1234` | user | free | 📦 Free tier user |
| `monthly@test.com` | `test1234` | user | monthly | 💰 Monthly subscriber |
| `yearly@test.com` | `test1234` | user | yearly | 🎉 Yearly subscriber |

### 💰 Subscription Plans (4 plans):
- Free (ฟรี)
- Monthly (รายเดือน) - 99 THB
- Yearly (รายปี) - 990 THB
- Lifetime (ตลอดชีพ) - สำหรับสมาชิกเก่า

### ⚙️ System Settings:
- General settings
- Feature flags

---

## ✅ ขั้นตอนที่ 3: ทดสอบ Login

1. เปิด http://localhost:3000
2. กด **"เข้าสู่ระบบ"**
3. Login ด้วย:
   - Email: `boonyanone@gmail.com`
   - Password: `Boonyanone@5561`

✅ ถ้า login สำเร็จ → พร้อมเริ่มทำ Admin Dashboard แล้ว! 🎉

---

## 🔍 ตรวจสอบข้อมูลใน Firebase Console

### ตรวจสอบ Authentication:
1. เปิด [Firebase Console](https://console.firebase.google.com/)
2. เลือก project: **playokeforyou-dev**
3. ไปที่ **Authentication** → **Users**
4. ควรเห็น 5 users

### ตรวจสอบ Firestore:
1. ไปที่ **Firestore Database** → **Data**
2. ควรเห็น collections:
   - `users` (5 documents)
   - `plans` (4 documents)
   - `settings` (2 documents)

---

## 🔄 ถ้าต้องการ Seed ใหม่

**ลบข้อมูลเก่าก่อน:**

### วิธีที่ 1: ผ่าน Firebase Console (ง่ายที่สุด)

1. **Authentication:**
   - Authentication → Users → เลือกทั้งหมด → Delete

2. **Firestore:**
   - Firestore Database → เลือก collection → Delete

### วิธีที่ 2: รัน seed อีกครั้ง (ถ้า user ยังไม่มี)

```bash
npm run seed:dev
```

- ถ้า email ซ้ำ → script จะแจ้งเตือน (ไม่ error)
- Firestore data จะถูกเขียนทับ

---

## 🆘 Troubleshooting

### ❌ Error: serviceAccountKey.json not found

**แก้:**
- ตรวจสอบว่าไฟล์อยู่ที่ root ของ project
- ตรวจสอบชื่อไฟล์ว่าถูกต้อง (ต้องเป็น `serviceAccountKey.json`)

### ❌ Error: auth/email-already-exists

**นี่ไม่ใช่ปัญหา!**
- Script จะข้าม user ที่มีอยู่แล้ว
- ข้อมูลเดิมจะไม่ถูกลบ

### ❌ Error: Permission denied

**แก้:**
- ตรวจสอบว่า download Service Account Key ถูกต้อง
- ลอง download ใหม่

---

## 📚 ไฟล์ที่เกี่ยวข้อง

- `scripts/seed-dev-data.js` - Seed script
- `serviceAccountKey.json` - Service Account Key (ห้าม commit!)
- `package.json` - มี script `seed:dev`

---

## ✅ Next Steps

**หลังจาก seed เสร็จ:**

1. ✅ Login ด้วย `boonyanone@gmail.com`
2. ✅ เริ่มทำ Admin Dashboard
3. ✅ ทดสอบ features ต่างๆ

**พร้อมแล้ว? เริ่มทำ Admin Dashboard กันเลย!** 🚀

---

**สร้างโดย Claude Code** 🤖
**Version:** 1.0.0
