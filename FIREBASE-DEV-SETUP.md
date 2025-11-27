# Firebase DEV Setup Guide (playokeforyou-dev)
## คู่มือการตั้งค่า Firebase Development Project

---

## 🎯 วัตถุประสงค์

ตั้งค่า Firebase **playokeforyou-dev** สำหรับการพัฒนาบน **youoke.vercel.app**

- ✅ แยกจาก Production (play.okeforyou.com)
- ✅ ทดสอบได้โดยไม่กระทบสมาชิกจริง
- ✅ ใช้ข้อมูลทดสอบเท่านั้น

---

## ขั้นตอนที่ 1: เปิดใช้งาน Anonymous Authentication

### 1.1 เข้า Firebase Console
- URL: https://console.firebase.google.com
- เลือก Project: **playokeforyou-dev**

### 1.2 เปิด Anonymous Sign-in
1. คลิกเมนูซ้าย → **Build** → **Authentication**
2. คลิกแท็บ **Sign-in method**
3. หา **Anonymous** ในรายการ
4. คลิก **Anonymous** → คลิก **Enable**
5. คลิก **Save**

**ทำไมต้องเปิด?**
- Monitor page ต้องใช้ Anonymous sign-in เพื่อเขียนข้อมูลไลงฃา Firebase
- ถ้าไม่เปิดจะเจอ error: `auth/admin-restricted-operation`

---

## ขั้นตอนที่ 2: สร้าง Realtime Database

### 2.1 เข้าหน้า Realtime Database
1. เมนูซ้าย → **Build** → **Realtime Database**
2. คลิก **Create Database**

### 2.2 เลือก Location
- เลือก: **asia-southeast1 (Singapore)**
- ⚠️ **สำคัญ:** ต้องเป็น `asia-southeast1` เท่านั้น (ตรงกับ Environment Variable)

### 2.3 เลือก Security Rules
- เลือก: **Start in test mode** (หรือ **Start in locked mode** แล้วตั้งค่า rules เอง)
- คลิก **Enable**

### 2.4 ตรวจสอบ Database URL
หลังสร้างเสร็จ จะเห็น URL:
```
https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app
```

✅ ต้องตรงกับที่ใน `.env`:
```bash
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app
```

---

## ขั้นตอนที่ 3: ตั้งค่า Security Rules

### 3.1 ไปที่แท็บ Rules
- คลิกแท็บ **Rules** ในหน้า Realtime Database

### 3.2 วาง Rules นี้:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "auth != null",
        "commands": {
          ".indexOn": ["timestamp", "status"]
        },
        "state": {
          ".read": true,
          ".write": "auth != null"
        },
        "participants": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

### 3.3 คลิก Publish

**คำอธิบาย Rules:**
- `".read": true` - ทุกคนอ่านได้ (Remote ดู state ได้)
- `".write": "auth != null"` - เขียนได้เฉพาะผู้ที่ login (Monitor login anonymously)
- `"participants"` - อนุญาตให้เขียนได้สำหรับ Guest Mode
- `".indexOn"` - Index เพื่อให้ query commands เร็วขึ้น

---

## ขั้นตอนที่ 4: เปิดใช้งาน Firestore (สำหรับ Admin Panel)

### 4.1 เข้าหน้า Firestore
1. เมนูซ้าย → **Build** → **Firestore Database**
2. คลิก **Create database**

### 4.2 เลือก Location
- เลือก: **asia-southeast1 (Singapore)**
- เลือก **Start in production mode**
- คลิก **Create**

### 4.3 ตั้งค่า Security Rules

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Default: Deny all
    match /{document=**} {
      allow read, write: if false;
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     (request.auth.uid == userId ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Payments collection
    match /payments/{paymentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null &&
                               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Plans collection
    match /plans/{planId} {
      allow read: if true;
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

คลิก **Publish**

---

## ขั้นตอนที่ 5: Seed ข้อมูลทดสอบ (Optional)

### 5.1 สร้าง Admin User
ใช้ script seed data:
```bash
npm run seed:dev
```

หรือสร้าง manual ใน Firestore Console:
1. ไปที่ Firestore Database → Data
2. สร้าง collection: `users`
3. สร้าง document ใหม่:
   ```json
   {
     "email": "admin@test.com",
     "displayName": "Admin Dev",
     "role": "admin",
     "tier": "lifetime",
     "isPremium": true,
     "isActive": true,
     "createdAt": [Timestamp now]
   }
   ```

### 5.2 สร้าง Plans
สร้าง collection: `plans`

Documents:
- **free** (id: "free")
  ```json
  {
    "displayName": "ฟรี",
    "price": 0,
    "duration": null,
    "features": ["ค้นหาเพลง", "เล่นเพลง"],
    "isActive": true
  }
  ```

- **monthly** (id: "monthly")
  ```json
  {
    "displayName": "รายเดือน",
    "price": 99,
    "duration": 30,
    "features": ["ค้นหาเพลง", "เล่นเพลง", "Monitor Cast"],
    "isActive": true
  }
  ```

---

## ขั้นตอนที่ 6: ทดสอบการทำงาน

### 6.1 ทดสอบด้วย Script
```bash
# แก้ test script ให้ใช้ .env แทน .env.production
node scripts/test-firebase-rtdb.js
```

**ผลลัพธ์ที่คาดหวัง:**
```
✅ Firebase initialized
✅ Anonymous sign-in successful
✅ Database write successful
✅ Database read successful
✅ ALL TESTS PASSED!
```

### 6.2 ทดสอบบน Vercel
1. **เปิดหน้า Monitor:**
   - URL: https://youoke.vercel.app/monitor
   - กด F12 → Console

2. **ตรวจสอบ Console Log:**
   ```
   ✅ Monitor signed in anonymously
   🎲 Auto-generated room code: 1234
   📦 Room data updated
   ```

3. **เชื่อมต่อจากมือถือ:**
   - Scan QR Code
   - กรอกเลขห้อง
   - ควรเห็นข้อความ: "🔗 Remote connected"

4. **ทดสอบเพิ่มเพลง:**
   - ค้นหาเพลง
   - กด "Play Now"
   - วิดีโอควรเล่นบน Monitor

---

## ขั้นตอนที่ 7: ตรวจสอบใน Firebase Console

### 7.1 ตรวจสอบ Realtime Database
1. Firebase Console → Realtime Database → Data
2. ควรเห็น structure:
   ```
   rooms/
     1234/
       createdAt: 1234567890
       hostId: "monitor"
       isHost: true
       state/
         queue: []
         currentIndex: 0
         currentVideo: null
         controls/
           isPlaying: false
           isMuted: true
       commands/
         cmd_xxx/
           ...
   ```

### 7.2 ตรวจสอบ Usage
1. Firebase Console → Realtime Database → Usage
2. ดูจำนวน:
   - Concurrent connections
   - Bandwidth
   - Storage

---

## 🔍 การแก้ปัญหา

### ปัญหา 1: "auth/admin-restricted-operation"

**สาเหตุ:** Anonymous Authentication ยังไม่เปิด

**วิธีแก้:**
1. Firebase Console → Authentication → Sign-in method
2. เปิด **Anonymous** → Save

---

### ปัญหา 2: "Permission denied"

**สาเหตุ:** Security Rules ไม่อนุญาต

**วิธีแก้:**
1. ตรวจสอบ Rules ใน Realtime Database → Rules
2. ตรวจสอบว่า Anonymous sign-in สำเร็จ:
   ```
   ✅ Monitor signed in anonymously
   ```

---

### ปัญหา 3: Database URL ไม่ตรงกัน

**สาเหตุ:** Environment Variable ไม่ตรงกับ Firebase

**วิธีแก้:**
1. ดู URL จาก Firebase Console
2. เทียบกับ `.env`:
   ```bash
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app
   ```
3. ถ้าไม่ตรง → แก้ `.env` + อัปเดต Vercel env vars

---

## ✅ Checklist

- [ ] Anonymous Authentication เปิดแล้ว
- [ ] Realtime Database สร้างแล้ว (asia-southeast1)
- [ ] Security Rules ตั้งค่าแล้ว (Realtime Database)
- [ ] Firestore Database สร้างแล้ว
- [ ] Firestore Rules ตั้งค่าแล้ว
- [ ] Database URL ตรงกับ .env
- [ ] ทดสอบ script ผ่านแล้ว
- [ ] ทดสอบบน Vercel ผ่านแล้ว
- [ ] Monitor เชื่อมต่อได้
- [ ] เพิ่มเพลงได้

---

## 📝 หมายเหตุ

**ความแตกต่างระหว่าง DEV และ PROD:**

| | DEV (playokeforyou-dev) | PROD (playokeforyou) |
|---|---|---|
| **URL** | youoke.vercel.app | play.okeforyou.com |
| **ข้อมูล** | ทดสอบเท่านั้น | สมาชิกจริง |
| **จุดประสงค์** | พัฒนา/ทดสอบ | ใช้งานจริง |
| **การแก้ไข** | ทำได้เลย | **อย่ายุ่ง!** |

**สำคัญ:** อย่าไปแก้ไข Firebase `playokeforyou` (Production) เด็ดขาด!

---

**วันที่สร้าง:** 27 พฤศจิกายน 2025
**สถานะ:** 📝 รอดำเนินการตั้งค่า
**ผู้สร้าง:** Claude Code
