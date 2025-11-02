# 🚀 Deploy YouOke ผ่าน Plesk Git (ไม่ต้องใช้ SSH!)

วิธีนี้ใช้ได้เมื่อ SSH ถูกปิด - deploy ผ่าน Plesk UI ทั้งหมด ง่ายมาก!

---

## 📋 ขั้นตอนการ Deploy (5 นาทีเสร็จ!)

### ขั้นตอนที่ 1: เพิ่ม Git Repository

1. **เข้า Plesk:** https://sgsv15.hostatom.com:8443
2. **ไปที่:** Websites & Domains → **play.okeforyou.com** → **Git Repositories**
3. **คลิก:** ปุ่ม **"Add Repository"** สีฟ้า
4. **กรอกข้อมูล:**
   ```
   Repository name:      YouOke Production
   Repository URL:       https://github.com/okeforyou/youoke.git
   Repository branch:    main
   Deployment mode:      Automatic deployment
   Deploy to:            /
   ```
5. **คลิก:** **OK**

---

### ขั้นตอนที่ 2: Pull Code จาก GitHub

หลังจากเพิ่ม Repository แล้ว:

1. **คลิก:** ปุ่ม **"Pull Updates"** หรือ **"Deploy"**
2. **รอ:** ระบบจะ clone code จาก GitHub (ประมาณ 1-2 นาที)
3. **เช็ค:** ดูว่า Status เป็น **"Deployed successfully"** ✅

---

### ขั้นตอนที่ 3: ตั้งค่า Node.js

1. **ไปที่:** Websites & Domains → **play.okeforyou.com** → **Node.js**
2. **Enable Node.js** ✅
3. **ตั้งค่า:**
   ```
   Node.js version:           18.x (หรือสูงกว่า)
   Application mode:          Production
   Application root:          /httpdocs
   Application URL:           / (เว้นว่างหรือใส่ /)
   Application startup file:  server.js
   Package manager:           npm
   ```
4. **คลิก:** **Enable Node.js** / **Apply**

---

### ขั้นตอนที่ 4: ตั้งค่า Environment Variables

ใน Node.js settings หน้าเดียวกัน:

1. **Scroll ลงไปหา:** **"Environment Variables"**
2. **เพิ่มตัวแปรเหล่านี้:**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   YOUTUBE_API_KEY=your_youtube_api_key
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REFRESH_TOKEN=your_spotify_refresh_token
   ```
3. **คลิก:** **Save**

---

### ขั้นตอนที่ 5: Build และ Start

**วิธีที่ 1: ใช้ NPM Scripts ใน Plesk**

1. **ไปที่:** Node.js → **NPM Scripts**
2. **รันคำสั่งตามลำดับ:**
   - คลิก **"install"** (ติดตั้ง dependencies)
   - รอจนเสร็จ (ประมาณ 3-5 นาที)
   - คลิก **"build"** (build Next.js)
   - รอจนเสร็จ (ประมาณ 2-3 นาที)
3. **Restart Application:**
   - ไปที่ Node.js settings
   - คลิก **"Restart App"** หรือ **"Enable Node.js"** อีกครั้ง

**วิธีที่ 2: ใช้ Custom startup script (แนะนำ)**

ถ้า Plesk ไม่มี NPM Scripts UI:

1. **ไปที่:** Files → File Manager
2. **เข้าไปที่:** `httpdocs` folder
3. **สร้างไฟล์:** `start.sh` (คลิก + → Create File)
4. **Edit ไฟล์ start.sh:**
   ```bash
   #!/bin/bash
   cd /var/www/vhosts/play.okeforyou.com/httpdocs
   npm install --production
   npm run build
   npm start
   ```
5. **Save** และ **Set permissions:** 755 (executable)
6. **กลับไปที่ Node.js settings:**
   - Application startup file: `start.sh`
   - **Restart App**

---

## ✅ เช็คว่า Deploy สำเร็จ

1. **เปิดเว็บ:** https://play.okeforyou.com
2. **ดู Logs:**
   - Node.js → **Logs** tab
   - หรือ **Application Logs**
3. **ตรวจสอบ:**
   - Application Status: **Running** ✅
   - No errors in logs

---

## 🔄 วิธี Update Code ใหม่ (ครั้งต่อไป)

เมื่อมีการ push code ใหม่ไปที่ GitHub:

1. **ไปที่:** Git Repositories
2. **คลิก:** ปุ่ม **"Pull Updates"**
3. **รอ:** ระบบ pull code ใหม่
4. **Restart:** ไปที่ Node.js → คลิก **"Restart App"**

หรือถ้าเปิด **Automatic Deployment:**
- Code จะ auto-update ทุกครั้งที่ push ไปที่ GitHub!
- ไม่ต้องทำอะไรเลย แค่ restart app

---

## ⚠️ Troubleshooting

### ปัญหา: Application ไม่ start

**แก้:**
1. เช็ค Logs ดูว่า error อะไร
2. ตรวจสอบ `package.json` ว่ามี `start` script:
   ```json
   "scripts": {
     "start": "next start"
   }
   ```
3. ลองเปลี่ยน Application startup file เป็น:
   - `node_modules/.bin/next` start
   - หรือสร้าง `server.js` ใหม่

### ปัญหา: Build ไม่ผ่าน

**แก้:**
1. เช็ค Node.js version ≥ 18
2. ลบ `node_modules` และ `.next` แล้ว install ใหม่
3. เช็ค Environment Variables ว่าครบหรือไม่

### ปัญหา: Port conflict

**แก้:**
1. Next.js อาจต้องการ custom port
2. สร้างไฟล์ `ecosystem.config.js`:
   ```js
   module.exports = {
     apps: [{
       name: 'youoke-prod',
       script: 'npm',
       args: 'start',
       env: {
         PORT: 3000,
         NODE_ENV: 'production'
       }
     }]
   }
   ```

---

## 📊 Performance Tips

1. **Enable Passenger/PM2:**
   - Plesk มักมี Passenger หรือ PM2 built-in
   - ใช้ได้เลยไม่ต้องติดตั้ง

2. **Enable Gzip Compression:**
   - ไปที่ Apache/Nginx Settings
   - เปิด Gzip compression

3. **Setup CDN:**
   - ใช้ Cloudflare ร่วมกับ play.okeforyou.com
   - Speed boost + Security

---

## 🎉 สรุป

**การ Deploy ผ่าน Plesk Git มีข้อดีคือ:**
- ✅ ไม่ต้องใช้ SSH
- ✅ ไม่ต้อง upload ไฟล์ใหญ่ (6GB)
- ✅ Auto-update จาก GitHub ได้
- ✅ จัดการง่ายผ่าน UI
- ✅ Logs ดูง่าย
- ✅ Restart ง่าย

**ใช้เวลารวม:** ประมาณ 10-15 นาที (รอ install + build)

---

## 📞 ติดปัญหา?

ถ้ามีปัญหาตอนไหน screenshot มาได้เลยครับ จะช่วยแก้ให้! 🚀
