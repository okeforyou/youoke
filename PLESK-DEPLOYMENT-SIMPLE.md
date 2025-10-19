# 🚀 การ Deploy YouOke ไปที่ play.okeforyou.com (แบบง่าย)

## 📋 ขั้นตอนการทำงาน (5 นาทีเสร็จ!)

### **ขั้นที่ 1: ลบ Subdomain เก่า** (1 นาที)

1. เข้า Plesk → **Websites & Domains**
2. หา `play.okeforyou.com`
3. คลิก **⚙️ (เกียร์)** หรือ **⋮ (3 จุด)** ด้านขวา
4. เลือก **"Remove Subscription"** หรือ **"Remove Website"**
5. ✅ ยืนยันการลบ

---

### **ขั้นที่ 2: สร้าง Subdomain ใหม่** (1 นาที)

1. กลับไปที่ **Websites & Domains**
2. คลิก **"Add Subdomain"**
3. กรอก:
   - Subdomain name: `play`
   - Parent domain: `okeforyou.com`
4. ✅ กด **OK/Create**

---

### **ขั้นที่ 3: SSH เข้า Server** (30 วินาที)

**ใช้ข้อมูล SSH:**
```bash
Host: 139.99.114.128
User: okefor
Password: $0rHSuQujx8fzu?w
```

**วิธีที่ 1: ใช้ Terminal บนเครื่อง**
```bash
ssh okefor@139.99.114.128
# กด Enter → ใส่ password: $0rHSuQujx8fzu?w
```

**วิธีที่ 2: ใช้ Web Terminal ใน Plesk**
- คลิก **Files** → **Web Terminal**

---

### **ขั้นที่ 4: รัน Deployment Script** (3 นาที)

หลัง SSH login แล้ว รันคำสั่งนี้:

```bash
# เข้าไปที่ directory
cd /var/www/vhosts/play.okeforyou.com/httpdocs

# ดาวน์โหลด deployment script
curl -O https://raw.githubusercontent.com/okeforyou/youoke/main/deploy-to-plesk.sh

# ให้สิทธิ์รัน
chmod +x deploy-to-plesk.sh

# รัน script
./deploy-to-plesk.sh
```

**Script จะทำอะไรบ้าง?**
- ✅ Clone code จาก GitHub (branch main)
- ✅ Install dependencies
- ✅ Build โปรเจกต์
- ✅ ติดตั้ง PM2
- ✅ รัน Next.js
- ✅ Setup auto-restart

**รอประมาณ 3 นาที** (ขึ้นอยู่กับความเร็ว internet ของ server)

---

### **ขั้นที่ 5: ตั้งค่า Environment Variables** (1 นาที)

1. กลับไปที่ Plesk
2. เข้า `play.okeforyou.com` → **Node.js**
3. เพิ่ม Environment Variables:

```bash
NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxx
NODE_ENV=production
```

4. กด **Save**
5. กด **Restart App**

---

## ✅ เสร็จสิ้น!

เข้าดูเว็บได้ที่: **https://play.okeforyou.com**

---

## 🔧 คำสั่งที่ใช้บ่อย

```bash
# เช็คสถานะ
pm2 status

# ดู logs
pm2 logs youoke-prod

# Restart แอพ
pm2 restart youoke-prod

# Stop แอพ
pm2 stop youoke-prod

# Update code ใหม่จาก GitHub
cd /var/www/vhosts/play.okeforyou.com/httpdocs
git pull origin main
npm install --production
npm run build
pm2 restart youoke-prod
```

---

## 🆘 แก้ปัญหา

### ❌ ถ้า script ไม่ทำงาน

รันคำสั่งทีละบรรทัด:

```bash
cd /var/www/vhosts/play.okeforyou.com/httpdocs
git clone -b main https://github.com/okeforyou/youoke.git .
npm install --production
npm run build
npm install -g pm2
pm2 start npm --name "youoke-prod" -- start
pm2 save
```

### ❌ ถ้า port ติดกัน

```bash
pm2 delete all
pm2 start npm --name "youoke-prod" -- start
```

### ❌ ถ้าต้องการเปลี่ยน port

แก้ไฟล์ `package.json`:
```json
"scripts": {
  "start": "next start -p 3001"
}
```

---

## 📞 ติดต่อ

ถ้ามีปัญหา หรือต้องการความช่วยเหลือ:
- 📧 Email: support@okeforyou.com
- 💬 LINE: @okeforyou

---

**สร้างโดย Claude Code** 🤖
