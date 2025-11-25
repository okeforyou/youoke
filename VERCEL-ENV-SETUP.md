# 🚀 Vercel Environment Variables Setup

อัพเดท Environment Variables บน Vercel ให้ youoke.vercel.app ใช้ Firebase Dev

---

## ✅ ขั้นตอน (3 นาที)

### 1. เข้า Vercel Dashboard

1. ไปที่: https://vercel.com/dashboard
2. เลือกโปรเจกต์: **youoke** (หรือ play.okeforyou.com)
3. คลิก **Settings** (แถบด้านบน)
4. เลือก **Environment Variables** (เมนูด้านซ้าย)

---

### 2. ลบหรือแก้ไข Environment Variables เหล่านี้

ค้นหาและ **แก้ไข** (หรือลบแล้วเพิ่มใหม่) ตัวแปรเหล่านี้:

#### **NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY**
- ค่าเก่า: `AIzaSyAtUvNGX9ibvl4YCNURA9q3XYJusa-iYDc`
- **ค่าใหม่**: `AIzaSyBBIhI9VCi3OEgP5mxWotuAJYqJ46MG2gw`
- Environments: ✅ Production ✅ Preview ✅ Development

#### **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
- ค่าเก่า: `playokeforyou.firebaseapp.com`
- **ค่าใหม่**: `playokeforyou-dev.firebaseapp.com`
- Environments: ✅ Production ✅ Preview ✅ Development

#### **NEXT_PUBLIC_FIREBASE_PROJECT_ID**
- ค่าเก่า: `playokeforyou`
- **ค่าใหม่**: `playokeforyou-dev`
- Environments: ✅ Production ✅ Preview ✅ Development

#### **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
- ค่าเก่า: `playokeforyou.firebasestorage.app`
- **ค่าใหม่**: `playokeforyou-dev.firebasestorage.app`
- Environments: ✅ Production ✅ Preview ✅ Development

#### **NEXT_PUBLIC_FIREBASE_DATABASE_URL**
- ค่าเก่า: `https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app`
- **ค่าใหม่**: `https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app`
- Environments: ✅ Production ✅ Preview ✅ Development

---

### 3. ตัวอย่างหน้าจอ

```
┌─────────────────────────────────────────────────────────┐
│ Environment Variables                                   │
├─────────────────────────────────────────────────────────┤
│ Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID                   │
│ Value: playokeforyou-dev                                │
│ □ Encrypted                                             │
│ Environments:                                           │
│   ☑ Production  ☑ Preview  ☑ Development               │
├─────────────────────────────────────────────────────────┤
│           [Cancel]                         [Save]       │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Redeploy

หลังจากแก้ Environment Variables แล้ว:

**Option A: Trigger Redeploy ผ่าน Git**
```bash
git commit --allow-empty -m "Update Firebase to Dev environment"
git push origin main
```

**Option B: Redeploy ผ่าน Vercel UI**
1. ไปที่แท็บ **Deployments**
2. คลิก **...** (3 จุด) ของ deployment ล่าสุด
3. คลิก **Redeploy**

---

## ✅ ตรวจสอบว่าใช้ Firebase ถูกต้อง

### วิธีที่ 1: เช็คผ่าน Console

1. เปิด https://youoke.vercel.app
2. กด **F12** เปิด DevTools
3. ไปที่แท็บ **Console**
4. พิมพ์:
```javascript
console.log('Firebase Project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
```
5. ควรเห็น: `playokeforyou-dev`

### วิธีที่ 2: เช็คผ่าน Network

1. เปิด https://youoke.vercel.app
2. กด **F12** เปิด DevTools
3. ไปที่แท็บ **Network**
4. Refresh หน้า
5. ดู Firebase requests ควรเห็น:
   - `playokeforyou-dev.firebaseapp.com`
   - `playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app`

---

## 📊 สรุป

หลังจากทำเสร็จ:

| URL | Firebase Project | Environment |
|-----|------------------|-------------|
| **youoke.vercel.app** | `playokeforyou-dev` | Development/Staging |
| **play.okeforyou.com** | `playokeforyou` | Production |

✅ youoke.vercel.app ใช้ Firebase Dev (ทดสอบได้เต็มที่)
✅ play.okeforyou.com ใช้ Firebase Production (ไม่กระทบ)
✅ ปลอดภัย 100%

---

## 🆘 Troubleshooting

### ปัญหา: Vercel ยังใช้ Firebase Production

**สาเหตุ:**
- ยังไม่ได้แก้ Environment Variables
- หรือแก้แล้วแต่ยังไม่ redeploy

**แก้:**
1. เช็คว่าแก้ Environment Variables ครบทั้ง 5 ตัว
2. Redeploy ใหม่ (push code หรือ manual redeploy)
3. Clear browser cache แล้วลองใหม่

### ปัญหา: Firebase Dev ไม่มีข้อมูล

**นี่ไม่ใช่ปัญหา!**
- Firebase Dev เป็นฐานข้อมูลใหม่ (ว่างเปล่า)
- สร้างข้อมูลทดสอบใหม่ได้เลย
- ไม่กระทบ production

---

**สร้างโดย Claude Code** 🤖
**Version:** 1.0.0
