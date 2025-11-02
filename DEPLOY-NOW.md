# 🚀 Deploy to play.okeforyou.com - ง่ายที่สุด!

## วิธีการ Deploy (ทำเพียง 2 ขั้นตอน)

### ขั้นตอนที่ 1: SSH เข้า Server
```bash
ssh okefor@139.99.114.128
```
**Password:** `Boonyanone@5561`

---

### ขั้นตอนที่ 2: Copy-Paste คำสั่งนี้ (ทั้งหมดเลย!)

```bash
cd play.okeforyou.com && \
rm -rf * .[^.] .??* 2>/dev/null && \
git clone -b main https://github.com/okeforyou/youoke.git . && \
npm install --production --legacy-peer-deps && \
npm run build && \
npm install -g pm2 2>/dev/null && \
pm2 delete youoke-prod 2>/dev/null || true && \
pm2 start npm --name "youoke-prod" -- start && \
pm2 save && \
pm2 startup && \
echo "" && \
echo "✅ Deployment completed!" && \
pm2 status && \
pm2 logs youoke-prod --lines 20 --nostream
```

---

## เท่านี้เสร็จแล้ว! 🎉

เช็คได้ที่: **https://play.okeforyou.com**

---

## คำสั่งที่มีประโยชน์

```bash
# ดูสถานะ
pm2 status

# ดู logs
pm2 logs youoke-prod

# Restart
pm2 restart youoke-prod

# Stop
pm2 stop youoke-prod
```

---

## Environment Variables

**ถ้าต้องการตั้ง environment variables:**

1. ใน Plesk → Domains → play.okeforyou.com → Node.js
2. เพิ่ม Environment Variables:
   - `NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `YOUTUBE_API_KEY`
   - `NODE_ENV=production`

หรือสร้างไฟล์ `.env.local` บน server:
```bash
cd play.okeforyou.com
nano .env.local
# Paste environment variables
# Ctrl+X, Y, Enter to save
pm2 restart youoke-prod
```
