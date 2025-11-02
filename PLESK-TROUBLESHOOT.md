# 🔧 Troubleshooting Plesk Node.js Deployment

ปัญหา: ยังได้ **403 Forbidden** แม้ว่า Node.js enabled แล้ว

---

## 🎯 สาเหตุที่เป็นไปได้:

### 1. **Node.js Application ไม่ได้ Running**
   - Plesk enable Node.js แล้ว แต่ server.js ไม่ start
   - มี error ใน server.js ที่ทำให้ crash

### 2. **Document Root ไม่ตรงกับ Application Root**
   - Nginx ไม่รู้ว่าจะ proxy ไปที่ไหน

### 3. **Proxy Settings ไม่ถูกต้อง**
   - Apache/Nginx ยังไม่ได้ตั้งค่า proxy pass ไปที่ localhost:3000

---

## 📋 วิธีแก้ปัญหา (ทำตามลำดับ)

### ขั้นตอนที่ 1: เช็ค Application Status

1. **ไปที่:** Node.js → Dashboard
2. **ดูที่ส่วนบน:** ควรมีข้อความบอกสถานะ
   - ✅ "Node.js is running on this domain" = ดี
   - ❌ "Node.js is enabled but not running" = มีปัญหา
   - ❌ "Startup file error" = server.js มีปัญหา

---

### ขั้นตอนที่ 2: ตรวจสอบ Settings

**เช็คว่าตั้งค่าถูกต้อง:**

```
Node.js Version:          18.20.8 (หรือสูงกว่า)
Package Manager:          npm
Document Root:            /play.okeforyou.com
Application Mode:         production
Application URL:          http://play.okeforyou.com
Application Root:         / [open]
Application Startup File: play.okeforyou.com/server.js
Environment Variables:    - NODE_ENV: production
```

---

### ขั้นตอนที่ 3: ลอง Disable → Enable ใหม่

บางครั้ง Plesk ต้องการ reset:

1. **คลิก "Disable Node.js"**
2. **รอ 5 วินาที**
3. **คลิก "Enable Node.js"**
4. **รอ 30 วินาที**
5. **Refresh เว็บ**

---

### ขั้นตอนที่ 4: ลองใช้ Hosting Settings แทน

บาง Plesk version ต้องตั้งค่าผ่าน Hosting Settings:

1. **ไปที่:** Websites & Domains → play.okeforyou.com → **Hosting Settings**
2. **หา "Node.js"** หรือ **"Application Settings"**
3. **ตั้งค่า:**
   ```
   Node.js support: Enabled
   Application root: /play.okeforyou.com
   Application startup file: server.js
   Application mode: Development (หรือ Production)
   ```
4. **Save**
5. **Restart Web Service** (Apache/Nginx)

---

### ขั้นตอนที่ 5: ตรวจสอบ Apache/Nginx Config

บาง Plesk version ต้องตั้งค่า proxy manually:

**ใน Hosting Settings หรือ Apache/Nginx Settings:**

ต้องมี config คล้ายๆ นี้:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

### ขั้นตอนที่ 6: ลองสร้างไฟล์ทดสอบ

เช็คว่า Node.js ทำงานหรือไม่:

**ใน File Manager สร้างไฟล์ `test.js`:**

```javascript
const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Node.js is working!</h1>');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

**แล้ว:**
1. **Application Startup File:** ใส่ `play.okeforyou.com/test.js`
2. **Restart App**
3. **เปิด https://play.okeforyou.com**
4. **ถ้าเห็น "Node.js is working!"** = Node.js ทำงาน แต่ server.js มีปัญหา
5. **ถ้ายังเป็น 403** = Proxy หรือ Hosting Settings มีปัญหา

---

### ขั้นตอนที่ 7: ติดต่อ Support

ถ้าทำทุกอย่างแล้วยังไม่ได้ ให้ติดต่อ hostatom support:

**ข้อมูลที่ต้องบอก:**
- Domain: play.okeforyou.com
- ปัญหา: Node.js enabled แล้วแต่ยังได้ 403 Forbidden
- ต้องการให้ช่วยตั้งค่า proxy pass ไปที่ localhost:3000
- หรือช่วยเช็ค error logs ของ Node.js application

---

## 🎯 วิธีที่แนะนำสุด (ถ้าทำไม่ได้)

**ใช้ Vercel แทน Plesk:**
- ✅ Deploy ง่ายกว่า (git push → auto deploy)
- ✅ ไม่ต้องตั้งค่า server
- ✅ ฟรี สำหรับ hobby project
- ✅ รองรับ Next.js โดยเฉพาะ
- ✅ URL: https://youoke.vercel.app (ใช้งานได้แล้ว)

**แล้วใช้ play.okeforyou.com เป็น custom domain ใน Vercel:**
1. Vercel → Project Settings → Domains
2. เพิ่ม play.okeforyou.com
3. ตั้งค่า DNS ตามที่ Vercel บอก
4. เสร็จ!

---

## 📞 ติดต่อ Support

**hostatom Support:**
- Website: https://hostatom.com/support
- Knowledge Base: https://kb.hostatom.com
- Email/Ticket: ผ่าน client area

**บอก Support:**
> "สวัสดีครับ ผมต้องการความช่วยเหลือในการ deploy Next.js application บน Node.js ที่ play.okeforyou.com
>
> ปัจจุบันได้ enable Node.js แล้วและตั้งค่า:
> - Application Startup File: play.okeforyou.com/server.js
> - Document Root: /play.okeforyou.com
>
> แต่ยังได้ 403 Forbidden อยู่ ขอความช่วยเหลือ:
> 1. ตรวจสอบว่า Node.js application running หรือไม่
> 2. ตรวจสอบ error logs
> 3. ตั้งค่า proxy pass จาก Nginx ไปที่ localhost:3000
>
> ขอบคุณครับ"

---

## 🎉 สรุป

ปัญหาหลักคือ:
1. Node.js อาจไม่ได้ start (เช็ค logs)
2. Proxy settings อาจไม่ถูกต้อง (ต้องใช้ support ช่วย)
3. Plesk อาจมีข้อจำกัดบางอย่าง

**ทางเลือก:**
- A) ติดต่อ support ให้ช่วยแก้
- B) ใช้ Vercel แทน (แนะนำ)
- C) ลองติดตั้ง PM2 แทน Plesk Node.js

Good luck! 🚀
