# ✅ ทดสอบว่าใช้ Firebase ถูกต้อง

## 🧪 วิธีที่ 1: เช็คผ่าน Browser Console (ง่ายที่สุด!)

### Local Development (localhost:3000)

1. เปิด http://localhost:3000
2. กด **F12** เปิด DevTools
3. ไปที่แท็บ **Console**
4. Copy-paste โค้ดนี้:

```javascript
console.log('🔥 Firebase Project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('🔗 Database URL:', process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
```

**ผลลัพธ์ที่ถูกต้อง:**
```
🔥 Firebase Project: playokeforyou-dev
🔗 Database URL: https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app
```

✅ ถ้าเห็นแบบนี้ = ใช้ Firebase Dev ถูกต้อง!
❌ ถ้าเห็น `playokeforyou` (ไม่มี -dev) = ยังใช้ Production อยู่!

---

### youoke.vercel.app (หลัง deploy)

1. เปิด https://youoke.vercel.app
2. กด **F12** เปิด DevTools
3. Console → พิมพ์โค้ดเดียวกัน

**ผลลัพธ์ที่ถูกต้อง:**
```
🔥 Firebase Project: playokeforyou-dev
```

---

## 🧪 วิธีที่ 2: เช็คผ่าน Network Tab

1. เปิด http://localhost:3000
2. กด **F12** → แท็บ **Network**
3. กรอง: `firebase`
4. ดู request ที่เกิดขึ้น

**ควรเห็น URLs เหล่านี้:**
- `playokeforyou-dev.firebaseapp.com`
- `playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app`
- `playokeforyou-dev.firebasestorage.app`

✅ ถ้าเห็น `-dev` = ถูกต้อง!
❌ ถ้าไม่เห็น `-dev` = ผิด!

---

## 🧪 วิธีที่ 3: ทดสอบ Authentication

### 3.1 สร้าง Test User

1. เปิด http://localhost:3000
2. กด **สมัครสมาชิก** หรือ **Sign up**
3. กรอก:
   - Email: `test@dev.com`
   - Password: `test1234`
4. สมัครเข้าระบบ

### 3.2 เช็คใน Firebase Console

1. เปิด [Firebase Console](https://console.firebase.google.com/)
2. เลือก project: **playokeforyou-dev**
3. ไปที่ **Authentication** → **Users**
4. **ควรเห็น** `test@dev.com` ในรายการ

✅ ถ้าเห็น = ใช้ Firebase Dev ถูกต้อง!
❌ ถ้าไม่เห็น = ยังใช้ Production อยู่!

---

## 🧪 วิธีที่ 4: ทดสอบ Realtime Database

### 4.1 ทดสอบสร้างห้อง Cast

1. เปิด http://localhost:3000
2. Login เข้าระบบ
3. กด **Cast to TV**
4. สร้างห้องใหม่

### 4.2 เช็คใน Firebase Console

1. เปิด [Firebase Console](https://console.firebase.google.com/)
2. เลือก project: **playokeforyou-dev**
3. ไปที่ **Realtime Database** → **Data**
4. **ควรเห็น** `/rooms/{roomCode}` ถูกสร้างขึ้น

✅ ถ้าเห็น = ใช้ Firebase Dev ถูกต้อง!
❌ ถ้าไม่เห็น = ยังใช้ Production อยู่!

---

## 📊 ตารางสรุป

| Environment | URL | Firebase Project | ตรวจสอบ |
|-------------|-----|------------------|---------|
| **Local** | localhost:3000 | `playokeforyou-dev` | ✅ |
| **Vercel** | youoke.vercel.app | `playokeforyou-dev` | ⏳ รอ deploy |
| **Plesk** | play.okeforyou.com | `playokeforyou` (เดิม) | ✅ ไม่ได้แก้ |

---

## 🆘 ถ้าเจอปัญหา

### ปัญหา: ยังเห็น `playokeforyou` (ไม่มี -dev)

**แก้:**
1. ตรวจสอบไฟล์ `.env`:
```bash
cat .env | grep FIREBASE_PROJECT_ID
```
ควรเห็น: `NEXT_PUBLIC_FIREBASE_PROJECT_ID=playokeforyou-dev`

2. Restart dev server:
```bash
pkill -f "next dev"
npm run dev
```

3. Clear browser cache (Ctrl+Shift+R)

### ปัญหา: ข้อมูลหาย / ไม่มีข้อมูล

**นี่ไม่ใช่ปัญหา!**
- Firebase Dev เป็นฐานข้อมูลใหม่ (ว่างเปล่า)
- ไม่มีข้อมูลเก่า = ถูกต้อง!
- ทดสอบสร้างข้อมูลใหม่ได้เลย

### ปัญหา: Login ไม่ได้

**สาเหตุ:**
- Firebase Dev ยังไม่มี user accounts
- user เก่าอยู่ที่ Firebase Production

**แก้:**
- สมัครสมาชิกใหม่ (เพื่อทดสอบ)
- หรือไปเพิ่ม test user ใน Firebase Console

---

## ✅ Checklist

ก่อนเริ่มพัฒนา Admin Dashboard ตรวจสอบให้แน่ใจว่า:

- [ ] Local dev ใช้ Firebase Dev (`playokeforyou-dev`)
- [ ] Vercel ใช้ Firebase Dev (หลัง deploy)
- [ ] Plesk ยังใช้ Firebase Production (`playokeforyou`)
- [ ] ทดสอบสร้าง user ใหม่ได้
- [ ] ทดสอบสร้างห้อง Cast ได้
- [ ] ไม่กระทบผู้ใช้งานบน play.okeforyou.com

---

**พร้อมแล้ว? เริ่มทำ Admin Dashboard ได้เลย!** 🚀
