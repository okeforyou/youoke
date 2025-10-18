# 🚀 Plesk Deployment Guide - play.okeforyou.com

## 📋 ข้อมูลสำคัญ

- **Domain**: play.okeforyou.com
- **Node Version**: v18.x (ต้องใช้ Node 18 หรือสูงกว่า)
- **ขนาดโปรเจค**: ~10-15 MB (ไม่รวม node_modules)
- **เดิม**: 6GB → **ใหม่**: <1GB (ลบของเก่าได้เลย!)

---

## 🎯 ขั้นตอนการ Deploy

### **1. SSH เข้า Server**

```bash
ssh user@your-server-ip
cd /var/www/vhosts/play.okeforyou.com/httpdocs
```

### **2. ลบโปรเจคเก่า (ถ้ามี)**

```bash
# Backup ก่อน (ถ้าต้องการ)
cd /var/www/vhosts/play.okeforyou.com/
mv httpdocs httpdocs_backup_old

# หรือลบเลย
rm -rf httpdocs/*
```

### **3. Clone โปรเจคใหม่จาก GitHub**

```bash
cd /var/www/vhosts/play.okeforyou.com/
git clone https://github.com/okeforyou/youoke.git httpdocs
cd httpdocs
```

### **4. ติดตั้ง Dependencies**

```bash
# ตรวจสอบ Node version (ต้องเป็น v18+)
node -v

# ติดตั้ง dependencies
npm install
```

### **5. สร้างไฟล์ .env**

```bash
nano .env
```

แล้ว copy ค่านี้:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY=AIzaSyAtUvNGX9ibvl4YCNURA9q3XYJusa-iYDc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=playokeforyou.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=playokeforyou
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=playokeforyou.firebasestorage.app

# Spotify API Configuration
SPOTIFY_CLIENT_ID=be495e578f89486e9d3c8ca7be1b1e27
SPOTIFY_CLIENT_SECRET=c880a42058e2464bbd6f38674cfc59cd
SPOTIFY_REFRESH_TOKEN=AQCl7a03983U_SqFlXh66o-5G7OA-jKRcP8LKPDu5M_TM3sKAdYsKNU0LltizCFTExgNPXXO8gDKom6P-q-R1rXfWqZBLkHo37S7cRJn0GFFMCH8EPspgw03aoxAnNT7tpc
SPOTIFY_REDIRECT_URI=https://play.okeforyou.com/api/spotify/callback

# Invidious API Configuration
NEXT_PUBLIC_INVIDIOUS_URL=https://invidious.privacyredirect.com/

# YouTube Data API v3 (OPTIONAL - for better search results)
# YOUTUBE_API_KEYS=key1,key2,key3
```

บันทึก: `Ctrl+O` → `Enter` → `Ctrl+X`

### **6. Build Production**

```bash
npm run build
```

### **7. ตั้งค่า PM2 (Process Manager)**

```bash
# ติดตั้ง PM2 (ถ้ายังไม่มี)
npm install -g pm2

# Start แอป
pm2 start npm --name "youoke" -- start

# Save process list
pm2 save

# ตั้งให้ auto-start เมื่อ reboot
pm2 startup
```

### **8. ตั้งค่า Nginx/Apache Proxy**

#### **ถ้าใช้ Nginx:**

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

#### **ถ้าใช้ Apache (Plesk default):**

Enable proxy module:
```bash
a2enmod proxy
a2enmod proxy_http
systemctl restart apache2
```

เพิ่มใน `.htaccess` หรือ VirtualHost config:
```apache
ProxyPreserveHost On
ProxyPass / http://localhost:3000/
ProxyPassReverse / http://localhost:3000/
```

---

## ✅ ตรวจสอบว่าทำงาน

### **1. ตรวจสอบ PM2**

```bash
pm2 list
pm2 logs youoke
```

### **2. ทดสอบ Local**

```bash
curl http://localhost:3000
```

### **3. ทดสอบ Domain**

เปิดเบราว์เซอร์: **https://play.okeforyou.com**

---

## 🔄 อัปเดตโปรเจค (ครั้งต่อไป)

```bash
cd /var/www/vhosts/play.okeforyou.com/httpdocs
git pull origin main
npm install
npm run build
pm2 restart youoke
```

---

## 🐛 Troubleshooting

### **ปัญหา: Port 3000 ถูกใช้งาน**

```bash
# หา process ที่ใช้ port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### **ปัญหา: Permission denied**

```bash
# เปลี่ยน owner
chown -R www-data:www-data /var/www/vhosts/play.okeforyou.com/httpdocs

# หรือ
chown -R plesk:psaserv /var/www/vhosts/play.okeforyou.com/httpdocs
```

### **ปัญหา: Build failed**

```bash
# ลบ cache แล้ว build ใหม่
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

---

## 📊 ขนาดไฟล์

**ก่อน:** ~6GB ❌
**ตอนนี้:** <1GB ✅

**ทำไมเดิมใหญ่?**
- `node_modules` หลายชุด (ติดตั้งซ้ำ)
- `.next` build cache เก่าๆ
- Log files สะสม

**วิธีลดขนาด:**
- ใช้ `.gitignore` ไม่ commit `node_modules`, `.next`
- `npm install` ใหม่ทุกครั้ง deploy
- ลบ `node_modules` เก่าๆ

---

## 🎯 หมายเหตุสำคัญ

1. ✅ **ลบโปรเจคเก่าได้เลย** - โค้ดทั้งหมดอยู่ใน GitHub แล้ว
2. ✅ **ไม่ต้องมี YouTube API Key** - ใช้ web scraping (ฟรี, ไม่จำกัด)
3. ⚠️ **DNS Update** - รอ DNS propagate 24-48 ชม.
4. ✅ **HTTPS** - ให้ Plesk จัดการ SSL Certificate อัตโนมัติ

---

## 📞 ติดปัญหา?

ถ้ามีปัญหาตอน deploy:
1. เช็ค logs: `pm2 logs youoke`
2. เช็ค port: `netstat -tulpn | grep 3000`
3. Restart: `pm2 restart youoke`
