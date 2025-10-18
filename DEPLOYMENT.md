# 🚀 คู่มือการ Deploy บน Vercel

## ขั้นตอนการ Deploy

### 1. Push Code ไปยัง GitHub

```bash
git push -u origin main
```

**หมายเหตุ:** ถ้า repository ยังไม่มีอยู่บน GitHub กรุณาสร้างก่อนที่ https://github.com/okeforyou/youoke

---

### 2. เข้าสู่ Vercel และเชื่อมต่อ Repository

1. ไปที่ [Vercel Dashboard](https://vercel.com)
2. คลิก **"Add New Project"**
3. เลือก **"Import Git Repository"**
4. เลือก repository: `okeforyou/youoke`
5. คลิก **"Import"**

---

### 3. ตั้งค่า Environment Variables

ใน Vercel Dashboard ให้เพิ่ม Environment Variables ต่อไปนี้:

#### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
```

#### Google Analytics (Optional)
```
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX
```

#### Spotify Configuration (Optional)
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.vercel.app/api/spotify/callback
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

#### API Configuration
```
NEXT_PUBLIC_INVIDIOUS_URL=https://invidious.example.com
PROXY_URL=your_proxy_url
```

---

### 4. Build Configuration (Auto-detected)

Vercel จะตรวจจับ configuration อัตโนมัติจาก `vercel.json`:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

---

### 5. Deploy

1. คลิก **"Deploy"**
2. รอให้ Vercel build และ deploy (ประมาณ 2-5 นาที)
3. เมื่อเสร็จแล้วจะได้ URL สำหรับเข้าถึงแอพ เช่น: `https://youoke.vercel.app`

---

## 🔧 การแก้ไขปัญหาที่อาจเกิดขึ้น

### ปัญหา: Build Failed

**สาเหตุที่เป็นไปได้:**
1. ขาด Environment Variables
2. Dependencies ติดตั้งไม่สำเร็จ
3. TypeScript errors

**วิธีแก้:**
- ตรวจสอบ Build Logs ใน Vercel Dashboard
- ตรวจสอบว่า Environment Variables ครบถ้วน
- ลองรัน `npm run build` ใน local เพื่อดู errors

### ปัญหา: Socket.IO ไม่ทำงาน

Vercel รองรับ Serverless Functions ดังนั้น Socket.IO จะทำงานแตกต่างจากการ host แบบปกติ

**แนะนำ:** ใช้ external service สำหรับ WebSocket เช่น:
- Pusher
- Ably
- Socket.IO on Railway/Render

### ปัญหา: API Routes Timeout

Vercel Serverless Functions มี timeout limit:
- **Free Plan:** 10 วินาที
- **Pro Plan:** 60 วินาที

**วิธีแก้:**
- ปรับปรุง API ให้ทำงานเร็วขึ้น
- ใช้ Background Jobs สำหรับงานที่ใช้เวลานาน

---

## 🎯 การ Deploy ครั้งต่อไป

เมื่อมีการแก้ไขโค้ด:

```bash
git add .
git commit -m "คำอธิบายการเปลี่ยนแปลง"
git push
```

Vercel จะ **auto-deploy** ทุกครั้งที่มีการ push ไปยัง `main` branch

---

## 📱 PWA Support

Progressive Web App (PWA) จะทำงานโดยอัตโนมัติบน Vercel:
- Service Worker จะถูก generate ตอน build
- รองรับการติดตั้งแอพบนมือถือ
- ทำงาน offline ได้

---

## 🌐 Custom Domain

ถ้าต้องการใช้ domain ของตัวเอง:

1. ไปที่ Project Settings > Domains
2. เพิ่ม domain ของคุณ
3. ตั้งค่า DNS ตามที่ Vercel แนะนำ

---

## 📊 Performance & Analytics

Vercel มี built-in analytics:
- Real User Monitoring
- Web Vitals
- Traffic Analytics

เปิดใช้งานได้ที่: Project Settings > Analytics

---

## 🆘 ต้องการความช่วยเหลือ?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
