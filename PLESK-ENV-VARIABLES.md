# 🔐 Environment Variables สำหรับ Plesk

จากรูป **Node 2.png** เห็นหน้า "Edit custom environment variables"

## 📋 วิธีเพิ่ม Environment Variables:

### ในหน้า "Edit custom environment variables":

กรอกทีละตัวแบบนี้:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY` | `AIza...` (คัดลอกจาก Vercel/Firebase) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `youoke-xxx.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `youoke-xxx` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `youoke-xxx.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `https://youoke-xxx.firebaseio.com` |
| `YOUTUBE_API_KEY` | `AIza...` (ถ้ามี) |
| `SPOTIFY_CLIENT_ID` | `xxx` (ถ้ามี) |
| `SPOTIFY_CLIENT_SECRET` | `xxx` (ถ้ามี) |
| `SPOTIFY_REFRESH_TOKEN` | `xxx` (ถ้ามี) |

---

## 🔧 ขั้นตอนการเพิ่ม:

### 1. **เพิ่มตัวแปรแรก:**
   - **Variable:** `NODE_ENV`
   - **Value:** `production`
   - **คลิก:** ✅ Add variable

### 2. **เพิ่ม Firebase Variables:**
   - **Variable:** `NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY`
   - **Value:** (คัดลอกจาก Vercel → Settings → Environment Variables)
   - **คลิก:** ✅ Add variable

   ทำซ้ำกับ:
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`

### 3. **เพิ่ม YouTube API (ถ้ามี):**
   - **Variable:** `YOUTUBE_API_KEY`
   - **Value:** (YouTube API key)
   - **คลิก:** ✅ Add variable

### 4. **เพิ่ม Spotify API (ถ้ามี):**
   - **Variable:** `SPOTIFY_CLIENT_ID`
   - **Value:** (Spotify client ID)
   - **คลิก:** ✅ Add variable

   ทำซ้ำกับ:
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REFRESH_TOKEN`

### 5. **บันทึก:**
   - **คลิก:** ปุ่ม **OK** สีฟ้า

---

## 📍 ที่ไหนหา Environment Variables?

### วิธีที่ 1: คัดลอกจาก Vercel

1. เข้า Vercel: https://vercel.com/
2. เลือก project **youoke**
3. ไปที่ **Settings** → **Environment Variables**
4. คัดลอกค่ามาใส่ใน Plesk

### วิธีที่ 2: ดูจากไฟล์ .env.local (ในเครื่อง)

ถ้ามีไฟล์ `.env.local` ในเครื่อง:
```bash
cat .env.local
```

คัดลอกค่ามาใส่ใน Plesk

---

## ⚠️ สำคัญ!

**ตัวแปรที่จำเป็นต้องมี (ขั้นต่ำ):**
1. ✅ `NODE_ENV=production`
2. ✅ Firebase credentials (ทั้ง 5 ตัว) - ถ้าไม่ใส่ระบบ subscription จะไม่ทำงาน

**ตัวแปรที่ไม่จำเป็น (Optional):**
- `YOUTUBE_API_KEY` - ถ้าไม่ใส่จะใช้ web scraping แทน (ยังทำงานได้)
- `SPOTIFY_*` - ถ้าไม่ใส่ features Spotify จะไม่ทำงาน

---

## 🎯 หลังจากเพิ่มครบแล้ว:

1. **คลิก OK** เพื่อบันทึก
2. **กลับไปหน้า Node.js Dashboard**
3. **คลิก "Restart App"** หรือ **Disable → Enable** Node.js
4. ไปขั้นตอนต่อไป (Install dependencies & Build)

---

## 💡 Tips:

- ถ้าไม่มี Firebase/Spotify credentials **ตอนนี้ก็ใส่แค่ `NODE_ENV=production` ไปก่อนได้**
- แอพจะทำงานได้ แต่ระบบ subscription จะไม่ทำงาน
- ค่อยกลับมาเพิ่ม credentials ทีหลังก็ได้
