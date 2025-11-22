# Firebase Cast Troubleshooting Guide

## ปัญหา: Maximum call stack size exceeded (พ.ย. 2025)

### อาการ
- เมื่อเข้า `/monitor` page เกิด error: `RangeError: Maximum call stack size exceeded`
- Monitor ไม่สามารถสร้าง Firebase room ได้
- Console log: `❌ Error creating room: RangeError: Maximum call stack size exceeded`

### Root Cause
**ขาด environment variable** `NEXT_PUBLIC_FIREBASE_DATABASE_URL` ใน Vercel

Firebase SDK ใช้ fallback URL ผิด:
- **ต้องการ:** `https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Fallback ผิด:** `https://playokeforyou.firebaseio.com` (ไม่มี region)

### การแก้ไข

#### 1. เพิ่ม Environment Variable ใน .env.production
```bash
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app
```

#### 2. เพิ่ม Environment Variables ใน Vercel
```bash
# Login to Vercel
vercel login

# Link to correct project
vercel link --project youoke --yes

# Add all environment variables
vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL production
# ... (เพิ่มตัวอื่นๆ ตาม .env.production)

# Verify
vercel env ls

# Deploy
vercel --prod --yes
```

#### 3. Code Changes

**ลบ REPLAY command** (ไม่ใช้แล้ว):
- `types/castCommands.ts` - ลบ REPLAY type
- `context/FirebaseCastContext.tsx` - ลบ replay() function
- `components/YoutubePlayer.tsx` - ลบ firebaseCastReplay references
- `components/PlayerControls.tsx` - ทำ onReplay เป็น optional

**Commits:**
- `a073c42` - Fix: Add missing FIREBASE_DATABASE_URL to .env.production
- `d6365fb` - Fix: Remove replay references from YoutubePlayer.tsx
- `d4dbb71` - Fix: Make onReplay prop optional in PlayerControls

### สาเหตุที่ Environment Variables หายไป

**Vercel มี 2 projects:**
1. ✅ `youoke` → https://youoke.vercel.app (Dev/Test - ใช้งานจริง)
2. ⏸️ `play.okeforyou.com` → สำหรับ production บน Plesk (ยังไม่ deploy)

**สิ่งที่ต้องจำ:**
- `.env.production` file ใน Git ≠ Vercel Environment Variables
- ต้องเพิ่ม environment variables ผ่าน Vercel Dashboard หรือ CLI แยกต่างหาก
- การ deploy ใหม่จะไม่ sync environment variables อัตโนมัติ

### Verification

เช็คว่า environment variables ครบหรือไม่:
```bash
vercel env ls
```

ควรมี 10 ตัว:
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL` ⭐ สำคัญที่สุด!
- `NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`
- `SPOTIFY_REDIRECT_URI`
- `NEXT_PUBLIC_INVIDIOUS_URL`

### Testing

1. เปิด https://youoke.vercel.app/monitor
2. ควรเห็นเลขห้อง 4 หลัก + QR Code
3. Scan QR Code ด้วยมือถือ
4. ควรเชื่อมต่อได้โดยไม่มี error

---

## สำหรับอนาคต

เมื่อจะ deploy ไป production (play.okeforyou.com):
1. Copy environment variables ทั้งหมดไปใส่ใน Plesk environment
2. ตรวจสอบว่า Firebase Database URL ถูกต้อง
3. Test บน Vercel ให้ผ่านก่อนเสมอ

---

**วันที่แก้ไข:** 22 พฤศจิกายน 2025
**ผู้บันทึก:** Claude Code
**Status:** ✅ แก้ไขเสร็จสมบูรณ์
