# Firebase Realtime Database Setup Guide
## คู่มือการตั้งค่า Firebase Realtime Database สำหรับ Monitor Cast

---

## ⚠️ ปัญหาที่พบ

**อาการ:** Web Monitor Cast ไม่ทำงาน ไม่สามารถสร้างห้องหรือเชื่อมต่อได้

**สาเหตุ:**
1. ❌ Firebase Realtime Database ยังไม่ได้เปิดใช้งานใน Firebase Console
2. ❌ Security Rules ยังไม่ได้ตั้งค่า
3. ✅ Environment Variables มีครบแล้ว (ตรวจสอบแล้ว)

---

## 🛠️ วิธีแก้ไข (Step-by-Step)

### ขั้นตอนที่ 1: เปิดใช้งาน Firebase Realtime Database

#### สำหรับ Production Project (`playokeforyou`)

1. **เข้า Firebase Console:**
   - ไปที่: https://console.firebase.google.com
   - เลือก Project: **`playokeforyou`** (Production)

2. **สร้าง Realtime Database:**
   - คลิกเมนูด้านซ้าย → **Build** → **Realtime Database**
   - คลิก **"Create Database"**

3. **เลือก Location:**
   - เลือก: **`asia-southeast1` (Singapore)**
   - ⚠️ สำคัญมาก: ต้องเลือก `asia-southeast1` เท่านั้น (ตรงกับ Environment Variable)

4. **เลือก Security Rules:**
   - เลือก: **"Start in locked mode"** (เราจะตั้งค่า rules เองภายหลัง)
   - คลิก **"Enable"**

5. **รอให้ Database สร้างเสร็จ:**
   - จะใช้เวลาประมาณ 10-30 วินาที
   - เมื่อเสร็จแล้วจะเห็นหน้า Database URL แบบนี้:
   ```
   https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app
   ```

#### สำหรับ Development Project (`playokeforyou-dev`)

1. เข้า Firebase Console: https://console.firebase.google.com
2. เลือก Project: **`playokeforyou-dev`** (Development)
3. ทำซ้ำขั้นตอนเดียวกับด้านบน
4. ตรวจสอบ URL:
   ```
   https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app
   ```

---

### ขั้นตอนที่ 2: ตั้งค่า Security Rules

1. **ที่หน้า Realtime Database Console:**
   - คลิกแท็บ **"Rules"**

2. **วาง Rules นี้:**

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

**คำอธิบาย Rules:**
- `".read": true` - ทุกคนอ่านได้ (สำหรับ Remote ดู state)
- `".write": "auth != null"` - เขียนได้เฉพาะผู้ที่ login แล้ว (Monitor ต้อง login anonymously)
- `"participants"` - อนุญาตให้เขียนได้เพื่อรองรับ Guest Mode
- `".indexOn"` - Index สำหรับ query commands ให้เร็วขึ้น

3. **คลิก "Publish"**

4. **ตรวจสอบว่า Rules ถูกต้อง:**
   - ควรเห็นข้อความสีเขียว: "Your rules have been published"

---

### ขั้นตอนที่ 3: ทดสอบการทำงาน

#### ทดสอบ Local (Development)

1. **เปิด Terminal:**
   ```bash
   npm run dev
   ```

2. **เปิดหน้า Monitor:**
   - URL: http://localhost:3000/monitor
   - ควรเห็น:
     - เลขห้อง 4 หลัก (เช่น 1234)
     - QR Code
     - คำแนะนำการใช้งาน

3. **เปิดหน้า Remote (แท็บใหม่):**
   - URL: http://localhost:3000
   - คลิก "Cast to TV"
   - กรอกเลขห้องจากหน้า Monitor
   - คลิก "Connect"

4. **ตรวจสอบ Console Log:**
   ```
   Monitor Console:
   ✅ Monitor signed in anonymously
   🎲 Auto-generated room code: 1234
   📦 Room data updated
   🔗 Remote connected

   Remote Console:
   ✅ Joined room via REST API: 1234
   📡 Sent CONNECT command
   ```

5. **ทดสอบเพิ่มเพลง:**
   - ค้นหาเพลงจาก Remote
   - กด "Play Now"
   - วิดีโอควรเล่นบนหน้า Monitor ทันที

#### ทดสอบ Production (Vercel)

1. **เปิดหน้า Monitor:**
   - URL: https://play.okeforyou.com/monitor
   - หรือ: https://youoke.vercel.app/monitor

2. **ทดสอบด้วยมือถือ:**
   - Scan QR Code
   - หรือเปิด play.okeforyou.com แล้วกรอกเลขห้อง
   - เพิ่มเพลง → ควรเล่นบน Monitor

---

### ขั้นตอนที่ 4: ตรวจสอบข้อมูลใน Firebase

1. **เข้า Firebase Console → Realtime Database → Data Tab**

2. **ควรเห็น Structure แบบนี้:**
   ```json
   {
     "rooms": {
       "1234": {
         "createdAt": 1234567890,
         "hostId": "monitor",
         "isHost": true,
         "state": {
           "controls": {
             "isMuted": false,
             "isPlaying": true
           },
           "currentIndex": 0,
           "currentVideo": {
             "author": "Artist Name",
             "key": 1234567890,
             "title": "Song Title",
             "videoId": "abc123xyz"
           },
           "queue": [
             { ... }
           ],
           "lastConnected": 1234567890
         },
         "commands": {
           "cmd_1234567890_abc123": {
             "command": {
               "payload": null,
               "type": "CONNECT"
             },
             "from": "remote",
             "id": "cmd_1234567890_abc123",
             "status": "completed",
             "timestamp": 1234567890
           }
         }
       }
     }
   }
   ```

3. **ตรวจสอบว่า:**
   - ✅ มี `rooms` node
   - ✅ มีห้องที่สร้างขึ้น (เช่น "1234")
   - ✅ มี `state` และ `commands`
   - ✅ `lastConnected` มีค่า timestamp

---

## 🔍 การแก้ปัญหา (Troubleshooting)

### ปัญหา 1: "Permission denied" error

**อาการ:**
```
❌ REST API failed: 401 Unauthorized
Permission denied
```

**วิธีแก้:**
1. ตรวจสอบ Security Rules ว่าตั้งค่าถูกต้อง
2. ตรวจสอบว่า Monitor ทำ Anonymous Sign-in สำเร็จ:
   ```
   ✅ Monitor signed in anonymously
   ```
3. ตรวจสอบว่า Firebase Authentication เปิดใช้งาน Anonymous Sign-in:
   - Firebase Console → Authentication → Sign-in method
   - เปิด "Anonymous" → Save

---

### ปัญหา 2: "Database URL not found"

**อาการ:**
```
❌ Failed to create room: 404 Not Found
```

**วิธีแก้:**
1. ตรวจสอบ Environment Variable:
   ```bash
   # .env.production
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app
   ```

2. ตรวจสอบว่า URL ตรงกับที่แสดงใน Firebase Console

3. Rebuild & Redeploy:
   ```bash
   # Local
   rm -rf .next
   npm run dev

   # Vercel
   vercel --prod --yes
   ```

---

### ปัญหา 3: Monitor แสดง "รอเชื่อมต่อ..." ตลอดเวลา

**อาการ:** Monitor ไม่รู้ว่า Remote เชื่อมต่อแล้ว

**วิธีแก้:**
1. ตรวจสอบว่า Remote ส่ง CONNECT command สำเร็จ:
   - ดูใน Firebase Console → Data → rooms → [roomCode] → commands
   - ควรเห็น command ที่ type="CONNECT"

2. ตรวจสอบว่า Monitor polling commands:
   - เปิด Console → ควรเห็น log ทุก 1 วินาที:
   ```
   📦 Room data updated: {...}
   ```

3. ตรวจสอบ `lastConnected` timestamp:
   - ใน Firebase → rooms → [roomCode] → state → lastConnected
   - ควรมีค่า timestamp

---

### ปัญหา 4: "Maximum call stack size exceeded"

**อาการ:** Error แบบนี้ใน Console

**วิธีแก้:**
1. ตรวจสอบว่า Database URL มี region:
   ```
   ❌ https://playokeforyou.firebaseio.com (ไม่มี region)
   ✅ https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app (มี region)
   ```

2. อัปเดต Environment Variable:
   ```bash
   # .env.production
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app
   ```

3. Redeploy

---

## ✅ Checklist สำหรับการตรวจสอบ

### Firebase Console Setup
- [ ] Realtime Database สร้างแล้ว (Production)
- [ ] Realtime Database สร้างแล้ว (Development)
- [ ] Region: `asia-southeast1` ✅
- [ ] Security Rules ตั้งค่าแล้ว ✅
- [ ] Anonymous Authentication เปิดใช้งานแล้ว ✅

### Environment Variables
- [ ] `.env` - DATABASE_URL มีครบ (Development)
- [ ] `.env.production` - DATABASE_URL มีครบ (Production)
- [ ] Vercel Environment Variables - DATABASE_URL เพิ่มแล้ว

### Testing
- [ ] Local: Monitor หน้าแสดงเลขห้อง + QR Code ✅
- [ ] Local: Remote เชื่อมต่อได้ ✅
- [ ] Local: เพิ่มเพลง → เล่นบน Monitor ✅
- [ ] Production: Monitor ทำงานบน Vercel ✅
- [ ] Production: Mobile Scan QR Code ได้ ✅

---

## 📚 เอกสารที่เกี่ยวข้อง

- [FIREBASE-CAST-SYSTEM.md](./FIREBASE-CAST-SYSTEM.md) - Architecture & ระบบทำงาน
- [FIREBASE-CAST-TROUBLESHOOTING.md](./FIREBASE-CAST-TROUBLESHOOTING.md) - แก้ปัญหาเพิ่มเติม
- [FIREBASE-ENVIRONMENTS.md](./FIREBASE-ENVIRONMENTS.md) - การจัดการ Environments

---

## 🎯 สรุป

**ขั้นตอนสำคัญ:**
1. เปิดใช้งาน Realtime Database ใน Firebase Console (Region: asia-southeast1)
2. ตั้งค่า Security Rules
3. เปิดใช้งาน Anonymous Authentication
4. ทดสอบ Local → ทดสอบ Production

**หลังจากตั้งค่าเสร็จแล้ว:**
- ✅ Monitor สามารถสร้างห้องได้
- ✅ Remote เชื่อมต่อได้
- ✅ เพิ่มเพลง → เล่นทันที
- ✅ Controls ทำงานปกติ

---

**วันที่สร้าง:** 27 พฤศจิกายน 2025
**ผู้สร้าง:** Claude Code
**สถานะ:** 📝 รอดำเนินการตั้งค่า Firebase Console
