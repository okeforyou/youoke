# 🔥 Firebase Environments Strategy (Backup System)

เอกสารนี้ระบุการเชื่อมต่อระหว่าง **Environment (Server)** และ **Database** เพื่อให้ระบบทำงานเป็น Backup กันได้

---

## 🏛️ System Architecture

| Environment | URL | Database Target | Status |
| :--- | :--- | :--- | :--- |
| **Production (Main)** | `play.okeforyou.com` | ✅ **Production** (`playokeforyou`) | เว็บหลัก |
| **Production (Backup)** | `youoke.vercel.app` | ✅ **Production** (`playokeforyou`) | **Web Backup (Failover)** |
| **Preview (Test)** | `git-*.vercel.app` | 🛠 **Development** (`youoke-dev`) | ทดสอบฟีเจอร์ก่อนรวม |
| **Local** | `localhost:3000` | 🛠 **Development** (`youoke-dev`) | เครื่องนักพัฒนา |

---

## ⚙️ Configuration Setup

### 1. ไฟล์ `.env` (ในเครื่อง)
*   **`.env`**: ให้ใส่ค่าของ **Development DB** (เพื่อความปลอดภัยตอน dev)
*   **`.env.production`**: ให้ใส่ค่าของ **Production DB** (เพื่อให้ build เป็น production ได้)

### 2. การตั้งค่าบน Vercel (สำคัญ!)
ต้องตั้งค่า **Environment Variables** บน Vercel ให้แยกกันตาม Environment:

#### ✅ สำหรับ Production Environment (เพื่อเป็น Backup)
*ค่าเหล่านี้จะถูกใช้เมื่อ Deploy ลง "Production" (Branch `main`)*

| Variable | Value (จาก Production FB) | Target Environment |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | **`playokeforyou`** | ☑️ Production |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app` | ☑️ Production |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `playokeforyou.firebaseapp.com` | ☑️ Production |
| ... (และตัวอื่นๆ) | ... | ☑️ Production |

#### 🛠 สำหรับ Preview Environment (เพื่อการทดสอบ)
*ค่าเหล่านี้จะถูกใช้เมื่อ Deploy ลง "Preview" (Branch อื่นๆ หรือ Pull Request)*

**⚠️ Hybrid Configuration (สำคัญมาก):**
เพื่อให้ระบบทำงานถูกต้องตาม Architecture (Users อยู่ Prod / Rooms อยู่ Dev):
ต้องตั้งค่า Project ID เป็น **Production** แต่ Database URL เป็น **Development**

| Variable | Value (ผสมกัน) | หมายเหตุ |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | **`playokeforyou`** | ✅ ใช้ Auth/Users จริง (Prod) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `playokeforyou.firebaseapp.com` | ✅ ใช้ Auth จริง (Prod) |
| `FIREBASE_PRIVATE_KEY` | (Key ของ **playokeforyou**) | ✅ ใช้ Service Account จริง |
| `FIREBASE_CLIENT_EMAIL` | (Email ของ **playokeforyou**) | ✅ ใช้ Service Account จริง |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app` | 🛠 ใช้ RTDB ทดสอบ (Dev) |

*หมายเหตุ: ต้องแน่ใจว่า Rules ใน RTDB ของ Dev อนุญาตให้ Auth จาก Prod เข้าใช้งานได้ (Open Rules หรือ Cross-project Auth)*

---

## 🔄 Deployment Workflow

1.  **Develop**: แก้ไขโค้ดในเครื่อง -> ใช้ Dev DB
2.  **Test**: Push ขึ้น Feature Branch -> Vercel สร้าง Link Preview -> ใช้ Dev DB
3.  **Deploy**: Merge เข้า `main` -> Vercel Deploy ขึ้น `youoke.vercel.app` -> **ใช้ Prod DB (Backup Ready)**
4.  **Launch**: Pull `main` ไปที่ Plesk -> Deploy ขึ้น `play.okeforyou.com` -> **ใช้ Prod DB (Main Site)**

---

## 📝 บันทึกค่า Config (สำหรับ Copy)

### Production Config (ใช้สำหรับ Target: Production)
```bash
NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY=AIzaSyAtUvNGX9ibvl4YCNURA9q3XYJusa-iYDc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=playokeforyou.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=playokeforyou
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=playokeforyou.firebasestorage.app
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app
```

### Development Config (ใช้สำหรับ Target: Preview, Development)
```bash
NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY=AIzaSyBBIhI9VCi3OEgP5mxWotuAJYqJ46MG2gw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=playokeforyou-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=playokeforyou-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=playokeforyou-dev.firebasestorage.app
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app
```
