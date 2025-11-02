# 📧 Support Ticket สำหรับ hostatom

---

## เรื่อง: ขอความช่วยเหลือ Node.js Application บน play.okeforyou.com

สวัสดีครับทีม hostatom

ผมต้องการความช่วยเหลือในการ deploy Next.js application (Node.js) บน subdomain **play.okeforyou.com**

---

## 📋 สถานะปัจจุบัน:

### ✅ สิ่งที่ทำสำเร็จแล้ว:

1. **Enable Node.js:**
   - Node.js version: 18.20.8
   - Package Manager: npm
   - Application Mode: production

2. **Deploy Code:**
   - Git Repository: https://github.com/okeforyou/youoke.git
   - Branch: main
   - Deploy path: /play.okeforyou.com
   - Status: ✅ Deployed successfully

3. **Install Dependencies:**
   - Command: `npm install --prefix /var/www/vhosts/okeforyou.com/play.okeforyou.com`
   - Result: ✅ 834 packages installed successfully

4. **Build Application:**
   - Command: `npm run build --prefix /var/www/vhosts/okeforyou.com/play.okeforyou.com`
   - Result: ✅ Build completed successfully (production build)

5. **Configuration:**
   - Document Root: `/play.okeforyou.com`
   - Application Root: `/`
   - Application Startup File: `app.js` (tried both `app.js`, `test.js`, `server.js`)
   - Environment Variables: `NODE_ENV=production`

---

## ❌ ปัญหาที่พบ:

เมื่อเปิดเว็บ https://play.okeforyou.com หรือ http://play.okeforyou.com ได้ข้อความ:

```
Server Error
403
Forbidden
You do not have permission to access this document.
```

---

## 🔍 การทดสอบที่ทำแล้ว:

1. ✅ ลองใช้ `app.js` (default Plesk filename) - ยังได้ 403
2. ✅ ลองใช้ `test.js` (simple HTTP server) - ยังได้ 403
3. ✅ ลองใช้ `server.js` (Next.js startup file) - ยังได้ 403
4. ✅ ลอง Disable → Enable Node.js ใหม่ - ยังได้ 403
5. ✅ ลอง Restart App หลายครั้ง - ยังได้ 403

---

## 🙏 ขอความช่วยเหลือ:

1. **ตรวจสอบว่า Node.js process กำลัง running หรือไม่**
   - เช็คว่า application start แล้วหรือยัง
   - ถ้าไม่ start มี error อะไรหรือไม่

2. **ดู Error Logs ของ Node.js application**
   - Application logs
   - System logs
   - Error logs

3. **ตรวจสอบ Nginx/Apache Proxy Configuration**
   - ต้อง proxy request ไปที่ `http://localhost:3000`
   - Config อาจยังไม่ถูกต้อง

4. **ตรวจสอบ Permissions/Security Settings**
   - File permissions
   - Directory permissions
   - Security restrictions

5. **แนะนำวิธีแก้ไข**
   - Configuration ที่ต้องแก้
   - หรือช่วยแก้ให้ด้วยก็ดีมากครับ

---

## 📂 ไฟล์สำคัญที่สร้างไว้:

1. **app.js** - Simple Node.js HTTP server สำหรับทดสอบ
2. **test.js** - Diagnostic server แสดงข้อมูล environment
3. **server.js** - Next.js production server (ไฟล์หลัก)

---

## 🎯 เป้าหมาย:

ต้องการให้ Next.js application ทำงานที่ https://play.okeforyou.com เพื่อให้ผู้ใช้เข้าถึงได้

---

## 💡 ข้อมูลเพิ่มเติม:

- **โปรเจค:** Next.js Karaoke Online Application
- **Framework:** Next.js 12.1.1
- **Node.js Required:** >= 18.0.0
- **Production URL (Vercel):** https://youoke.vercel.app (ใช้งานได้ปกติ)

---

## 📞 ติดต่อกลับ:

- **Email:** [ใส่ email ของคุณ]
- **Phone:** [ใส่เบอร์โทรของคุณ]
- **Domain:** play.okeforyou.com
- **Plesk Username:** okefor

---

ขอบคุณมากครับสำหรับความช่วยเหลือ 🙏

รอคำตอบจากทีมครับ

---

**หมายเหตุ:** ผมเคยใช้ Node.js บน Plesk ได้มาก่อน จึงคิดว่าระบบควรรองรับ แต่อาจมี configuration บางอย่างที่ต้องแก้ไข
