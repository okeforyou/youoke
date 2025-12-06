# วิธีตั้งค่า SSR สำหรับหน้า Subscription

SSR (Server-Side Rendering) จะทำให้หน้า subscription โหลดเร็วมาก เพราะข้อมูลจะถูกโหลดที่ server แล้วส่งมาพร้อม HTML ไม่ต้องรอ Firebase init หรือ auth check ที่ client

## ขั้นตอนการตั้งค่า

### 1. ดาวน์โหลด Firebase Service Account Key

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือก project ของคุณ
3. คลิก ⚙️ (Settings) > Project settings
4. ไปที่แท็บ **Service accounts**
5. คลิกปุ่ม **Generate new private key**
6. คลิก **Generate key** เพื่อดาวน์โหลดไฟล์ JSON

### 2. คัดลอกข้อมูลจากไฟล์ JSON

เปิดไฟล์ JSON ที่ดาวน์โหลดมา จะมีข้อมูลแบบนี้:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  ...
}
```

### 3. เพิ่มข้อมูลใน .env.local

แก้ไขไฟล์ `.env.local` โดยคัดลอกค่าจากไฟล์ JSON:

```bash
# Firebase Admin SDK (สำหรับ SSR)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**⚠️ สำคัญ:**
- คัดลอก `private_key` ทั้งหมด รวมถึง `-----BEGIN PRIVATE KEY-----` และ `-----END PRIVATE KEY-----`
- ต้องมี `\n` (newline) อยู่ในค่านั้นด้วย
- ใส่เครื่องหมาย `"` ครอบทั้งหมด

### 4. Restart Dev Server

```bash
# หยุด dev server ปัจจุบัน (Ctrl+C)
# จากนั้นเริ่มใหม่
npm run dev
```

### 5. ทดสอบ

1. เข้าสู่ระบบ
2. ไปที่หน้า `/subscription`
3. เปิด DevTools Console
4. ดูว่ามีข้อความ `✅ SSR Enabled - Data loaded from server!` หรือไม่

## การ Deploy ไป Vercel

ต้องเพิ่ม environment variables ใน Vercel Dashboard:

1. ไปที่ Vercel Dashboard > Your Project > Settings > Environment Variables
2. เพิ่ม:
   - `FIREBASE_CLIENT_EMAIL` = ค่าจาก service account JSON
   - `FIREBASE_PRIVATE_KEY` = ค่า private_key จาก JSON (รวม `\n` ด้วย)
3. คลิก **Save**
4. Redeploy project

## ผลลัพธ์ที่คาดหวัง

- ✅ **ไม่มี skeleton loading**: ข้อมูลมาพร้อม HTML เลย
- ✅ **โหลดเร็วมาก**: ~100-200ms แทนที่จะเป็น 500ms
- ✅ **ทำงานได้ทุกครั้ง**: รวมถึง incognito mode, first-time users
- ✅ **SEO-friendly**: ข้อมูลอยู่ใน HTML source

## Troubleshooting

### ถ้าเห็น "กรุณาตั้งค่า Firebase Admin SDK"

- ตรวจสอบว่าใส่ `FIREBASE_CLIENT_EMAIL` และ `FIREBASE_PRIVATE_KEY` ใน `.env.local` แล้ว
- Restart dev server

### ถ้า redirect ไปหน้า login ตลอด

- ตรวจสอบว่า AuthContext เก็บ `uid` ใน cookies แล้ว (ควรเห็น cookie ชื่อ `uid` ใน DevTools > Application > Cookies)

### ถ้าเห็น error "Firebase Admin initialization error"

- ตรวจสอบรูปแบบของ `FIREBASE_PRIVATE_KEY` ให้แน่ใจว่ามี `\n` ครบถ้วน
- ต้องมี `"` ครอบทั้งหมด

## ไฟล์ที่เกี่ยวข้อง

- `firebase-admin.ts` - Firebase Admin SDK initialization
- `pages/subscription.tsx` - SSR implementation with getServerSideProps
- `context/AuthContext.tsx` - เก็บ uid ใน cookies
- `.env.local` - Environment variables (ไม่ commit ขึ้น Git!)
