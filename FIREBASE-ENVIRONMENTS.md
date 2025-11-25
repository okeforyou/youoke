# 🔥 Firebase Environments Setup

เพื่อไม่ให้กระทบผู้ใช้งานบน **play.okeforyou.com** เราแยก Firebase Projects ออกเป็น 2 ตัว:

| Environment | URL | Firebase Project | Purpose |
|-------------|-----|------------------|---------|
| **Development/Staging** | youoke.vercel.app | `youoke-dev` | ทดสอบฟีเจอร์ใหม่ |
| **Production** | play.okeforyou.com | `playokeforyou` | ผู้ใช้จริง |

---

## ✅ Step 1: สร้าง Firebase Dev Project (ทำครั้งเดียว)

### 1.1 สร้าง Project ใหม่

1. เปิด [Firebase Console](https://console.firebase.google.com/)
2. คลิก **"Add project"**
3. ตั้งชื่อ: **`youoke-dev`**
4. ปิด Google Analytics (optional)
5. คลิก **Create project**

---

### 1.2 Enable Authentication

1. เข้า **Authentication** → **Sign-in method**
2. Enable:
   - ✅ **Email/Password**
   - ✅ **Google** (authorized domains: `youoke.vercel.app`)

---

### 1.3 Enable Realtime Database

1. เข้า **Realtime Database** → **Create Database**
2. Region: **`asia-southeast1`** (สำคัญ! ต้องเหมือน Production)
3. Security rules: เริ่มด้วย **Test mode**
4. จดบันทึก Database URL:
   ```
   https://youoke-dev-default-rtdb.asia-southeast1.firebasedatabase.app
   ```

---

### 1.4 Enable Firestore (ถ้าใช้)

1. เข้า **Firestore Database** → **Create Database**
2. Region: **`asia-southeast1`**
3. Security rules: **Test mode**

---

### 1.5 Enable Storage (ถ้าใช้)

1. เข้า **Storage** → **Get Started**
2. Security rules: **Test mode**

---

### 1.6 คัดลอก Firebase Config

1. เข้า **Project Settings** (เกียร์ด้านบน)
2. เลื่อนลงไปที่ **Your apps**
3. คลิก **Web** (`</>`) icon
4. ตั้งชื่อ app: **`youoke-dev-web`**
5. คัดลอก **firebaseConfig**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "youoke-dev.firebaseapp.com",
  databaseURL: "https://youoke-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "youoke-dev",
  storageBucket: "youoke-dev.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

---

## ✅ Step 2: อัพเดท Local Environment

### 2.1 แก้ไข `.env.development`

เปิดไฟล์ `.env.development` และใส่ค่าจาก Firebase Config:

```env
# Firebase Configuration - DEVELOPMENT ONLY
NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY=<คัดลอกจาก apiKey>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=youoke-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=youoke-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=youoke-dev.firebasestorage.app
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://youoke-dev-default-rtdb.asia-southeast1.firebasedatabase.app

# Spotify (ใช้ค่าเดิม)
SPOTIFY_CLIENT_ID=be495e578f89486e9d3c8ca7be1b1e27
SPOTIFY_CLIENT_SECRET=c880a42058e2464bbd6f38674cfc59cd
SPOTIFY_REFRESH_TOKEN=...
SPOTIFY_REDIRECT_URI=https://youoke.vercel.app/api/spotify/callback

# Invidious (ใช้ค่าเดิม)
NEXT_PUBLIC_INVIDIOUS_URL=https://invidious.privacyredirect.com/
```

### 2.2 ทดสอบ Local

```bash
# รัน local dev server
npm run dev

# ตรวจสอบว่าใช้ Firebase Dev
# เปิด Console → Network → ดู Firebase requests
# ควรเห็น youoke-dev.firebaseapp.com
```

---

## ✅ Step 3: อัพเดท Vercel Environment Variables

เนื่องจาก youoke.vercel.app เป็น Staging ต้องใช้ Firebase Dev:

### 3.1 ไปที่ Vercel Dashboard

1. เข้า [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือกโปรเจกต์: **youoke**
3. ไปที่ **Settings** → **Environment Variables**

### 3.2 แก้ไข Environment Variables

**ลบตัวแปรเก่าเหล่านี้ออก** (หรือแก้ค่า):

```
NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_DATABASE_URL
```

**เพิ่มตัวแปรใหม่** (ใช้ค่าจาก Firebase Dev):

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY` | `AIzaSy...` (จาก Firebase Dev) | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `youoke-dev.firebaseapp.com` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `youoke-dev` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `youoke-dev.firebasestorage.app` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `https://youoke-dev-default-rtdb.asia-southeast1.firebasedatabase.app` | Production, Preview, Development |

### 3.3 Redeploy

```bash
# Trigger redeploy
git commit --allow-empty -m "Trigger Vercel redeploy with new env vars"
git push origin main
```

---

## ✅ Step 4: สำหรับ play.okeforyou.com (Production)

**ไม่ต้องทำอะไร!** 🎉

- play.okeforyou.com ใช้ `.env.production` เดิม
- ชี้ไปที่ Firebase Production (`playokeforyou`)
- ไม่กระทบผู้ใช้งานเลย

---

## 📊 สรุป Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Code Repository                      │
│                  github.com/okeforyou/youoke            │
└──────────────────────┬──────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
┌──────────────────────┐  ┌──────────────────────┐
│  youoke.vercel.app   │  │ play.okeforyou.com  │
│   (Auto Deploy)      │  │  (Manual Deploy)    │
│                      │  │                      │
│  Uses:               │  │  Uses:               │
│  .env.development    │  │  .env.production     │
└──────────┬───────────┘  └──────────┬───────────┘
           │                          │
           ▼                          ▼
┌──────────────────────┐  ┌──────────────────────┐
│  Firebase Dev        │  │  Firebase Production │
│  youoke-dev          │  │  playokeforyou       │
│                      │  │                      │
│  - Test data         │  │  - Real users        │
│  - Safe to delete    │  │  - DON'T TOUCH!      │
└──────────────────────┘  └──────────────────────┘
```

---

## 🔒 Firebase Security Rules

### Realtime Database Rules (Production)

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "auth != null || newData.child('hostId').val() === 'monitor'"
      }
    }
  }
}
```

### Realtime Database Rules (Dev)

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**หมายเหตุ:** Dev ใช้ Test mode (อ่าน/เขียนได้ทั้งหมด) เพื่อความสะดวกในการทดสอบ

---

## 🧪 การทดสอบ

### ทดสอบว่าใช้ Firebase ถูกต้อง

```javascript
// เปิด DevTools Console แล้วรัน:
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

// ควรเห็น:
// youoke.vercel.app → "youoke-dev"
// play.okeforyou.com → "playokeforyou"
```

---

## 🆘 Troubleshooting

### ปัญหา: ทดสอบแล้วยังใช้ Firebase Production

**แก้:**
1. ตรวจสอบ `.env.development` ว่าถูกต้อง
2. Restart dev server: `npm run dev`
3. Clear browser cache
4. ตรวจสอบ Vercel Environment Variables

### ปัญหา: Firebase Dev ไม่มีข้อมูล

**แก้:**
1. Firebase Dev เป็นฐานข้อมูลใหม่ (ว่างเปล่า)
2. ต้องสร้างข้อมูลทดสอบเอง หรือ
3. Import ข้อมูลจาก Production (ถ้าต้องการ)

---

## 📞 ติดต่อ

มีปัญหาหรือคำถาม:
- 📧 Email: support@okeforyou.com
- 💬 LINE: @okeforyou

---

**สร้างโดย Claude Code** 🤖
**Version:** 1.0.0
**Last Updated:** 2025-01-25
