# 🌿 Git Workflow - Development & Production

## 📋 Branch Strategy

```
Repository: okeforyou/youoke

main branch       → play.okeforyou.com (Production - Stable)
develop branch    → youoke.vercel.app (Staging - Testing)
```

---

## 🎯 Workflow

### **1. พัฒนาฟีเจอร์ใหม่ (Development)**

```bash
# 1. เปลี่ยนไปยัง develop branch
git checkout develop

# 2. Pull ล่าสุด
git pull origin develop

# 3. แก้ไขโค้ด / เพิ่มฟีเจอร์
# ... edit files ...

# 4. Commit & Push
git add .
git commit -m "Add new feature: xxxxx"
git push origin develop
```

**ผลลัพธ์:**
- ✅ Vercel จะ **auto-deploy** ไปที่ **youoke.vercel.app** ทันที
- ✅ ทดสอบได้ทันทีบน staging

---

### **2. ทดสอบบน Vercel (Staging)**

```
https://youoke.vercel.app
```

- ทดสอบฟีเจอร์ใหม่
- ตรวจสอบ bugs
- ทดสอบ performance
- เมื่อมั่นใจ → ไป Step 3

---

### **3. Deploy ไป Production (play.okeforyou.com)**

เมื่อทดสอบเรียบร้อยแล้ว มี 2 วิธี:

#### **วิธีที่ 1: Merge develop → main (แนะนำ)**

```bash
# 1. เปลี่ยนไป main branch
git checkout main

# 2. Pull ล่าสุด
git pull origin main

# 3. Merge develop เข้า main
git merge develop

# 4. Push ไป GitHub
git push origin main
```

**ผลลัพธ์:**
- ✅ Vercel (**youoke.vercel.app**) ยังคงเหมือนเดิม
- ✅ Production (**play.okeforyou.com**) ได้โค้ดใหม่
- ✅ SSH เข้า server แล้ว `git pull origin main`

#### **วิธีที่ 2: Pull Request (สำหรับทีม)**

1. ไปที่ GitHub: https://github.com/okeforyou/youoke
2. สร้าง Pull Request: `develop` → `main`
3. Review code
4. Merge PR
5. SSH เข้า server: `git pull origin main`

---

## 🚀 Deploy ไป play.okeforyou.com

หลังจาก merge develop → main แล้ว:

```bash
# SSH เข้า server
ssh user@play.okeforyou.com

# ไปยัง project folder
cd /var/www/vhosts/play.okeforyou.com/httpdocs

# Pull โค้ดใหม่
git pull origin main

# ติดตั้ง dependencies ใหม่ (ถ้ามี)
npm install

# Build ใหม่
npm run build

# Restart app
pm2 restart youoke
```

---

## 📊 สรุป Flow

```
┌─────────────────────────────────────────────────┐
│ 1. แก้โค้ดใน develop branch                    │
│    ↓                                             │
│ 2. git push origin develop                      │
│    ↓                                             │
│ 3. Vercel auto-deploy → youoke.vercel.app ✅    │
│    ↓                                             │
│ 4. ทดสอบบน Vercel                               │
│    ↓                                             │
│ 5. ถ้าโอเค → git merge develop to main          │
│    ↓                                             │
│ 6. git push origin main                          │
│    ↓                                             │
│ 7. SSH เข้า server → git pull                   │
│    ↓                                             │
│ 8. npm run build && pm2 restart                 │
│    ↓                                             │
│ 9. Production update ✅                          │
└─────────────────────────────────────────────────┘
```

---

## ⚙️ ตั้งค่า Vercel (ครั้งเดียว)

### **ตั้งให้ Vercel deploy จาก develop branch:**

1. ไปที่ Vercel Dashboard: https://vercel.com/okeforyou/youoke
2. ไปที่ **Settings** → **Git**
3. ใน **Production Branch** → เปลี่ยนเป็น `develop`
4. Save

หรือใช้ Vercel CLI:

```bash
# ติดตั้ง Vercel CLI (ถ้ายังไม่มี)
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# ตั้งค่า production branch
vercel --prod --branch develop
```

---

## 🎯 Tips & Best Practices

### **1. ตั้งชื่อ Commit ให้ชัดเจน**

```bash
# ✅ ดี
git commit -m "Add: User authentication feature"
git commit -m "Fix: Search API timeout issue"
git commit -m "Update: Improve search performance"

# ❌ ไม่ดี
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

### **2. Commit บ่อยๆ แต่เฉพาะ develop**

- commit เล็กๆ น้อยๆ ใน `develop`
- merge ใหญ่ๆ ไป `main` เมื่อมั่นใจ

### **3. Test ให้ดีก่อน Merge**

- ทดสอบทุกฟีเจอร์บน Vercel staging
- ตรวจสอบ console errors
- ทดสอบบน mobile และ desktop

### **4. Backup ก่อน Deploy Production**

```bash
# Backup database (ถ้ามี)
# Backup .env files
# Backup โค้ดเดิม (git tag)

git tag -a v1.0.0 -m "Backup before feature X"
git push origin v1.0.0
```

---

## 🐛 Troubleshooting

### **ปัญหา: Vercel deploy ทั้ง main และ develop**

**แก้:**
1. ไปที่ Vercel → Settings → Git
2. เลือก **Production Branch**: `develop`
3. ปิด **Auto Deploy** สำหรับ `main` branch

### **ปัญหา: Merge conflict**

```bash
# ถ้า merge develop → main มี conflict
git checkout main
git merge develop

# แก้ conflict ในไฟล์ที่ขัดแย้ง
# จากนั้น
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### **ปัญหา: Production ไม่ update**

```bash
# SSH เข้า server
ssh user@play.okeforyou.com

# เช็ค git status
cd /var/www/vhosts/play.okeforyou.com/httpdocs
git status
git log -1

# ถ้ายังไม่ใหม่
git pull origin main --force
npm install
npm run build
pm2 restart youoke
```

---

## 📚 คำสั่งที่ใช้บ่อย

### **เปลี่ยน Branch**
```bash
git checkout develop    # ไปที่ develop (สำหรับพัฒนา)
git checkout main       # ไปที่ main (สำหรับ deploy production)
```

### **ดู Branch ปัจจุบัน**
```bash
git branch              # ดู local branches
git branch -a           # ดูทั้ง local และ remote
```

### **ดู History**
```bash
git log                 # ดู commit history
git log --oneline       # ดูแบบย่อ
git log --graph         # ดูแบบกราฟ
```

### **Undo Changes**
```bash
git reset --hard        # ยกเลิกการแก้ไขทั้งหมด (ระวัง!)
git checkout -- file    # ยกเลิกการแก้ไขไฟล์เดียว
```

---

## 🎊 สรุป

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Staging** | `develop` | youoke.vercel.app | ทดสอบ/พัฒนา |
| **Production** | `main` | play.okeforyou.com | เว็บจริง (stable) |

**ข้อดี:**
- ✅ Vercel เป็น staging อัตโนมัติ
- ✅ Production แยกออกมา (ปลอดภัย)
- ✅ ใช้ Git repo เดียวกัน (ง่ายต่อการจัดการ)
- ✅ ทดสอบก่อน deploy จริง
