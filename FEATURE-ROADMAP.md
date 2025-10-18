# 🚀 Feature Roadmap - YouOke Karaoke System

## 📋 สรุปฟีเจอร์ที่ต้องการพัฒนา

### **ปัญหาปัจจุบัน:**
- ❌ ต้องจัดการ users ใน Firebase Console (ยุ่งยาก)
- ❌ ต้องจัดการ Ads ใน Firebase (ลำบาก)
- ❌ ระบบ Cast ไม่เสถียร (sync ไม่ได้บางครั้ง)
- ❌ Auto-play queue ไม่ทำงาน
- ❌ ไม่มีหน้าจัดการ User Profile
- ❌ ไม่มีระบบตั้งค่า (Settings)

---

## 🎯 ฟีเจอร์ที่ต้องพัฒนา (ลำดับความสำคัญ)

### **Priority 1: ระบบ User & Subscription (สำคัญที่สุด)** 🔐

#### **ปัญหา:**
- ตอนนี้ต้องเข้า Firebase Console เพื่อกำหนด role ให้ user
- ไม่มีระบบชำระเงินและการตรวจสอบ

#### **โซลูชัน:**

**1.1 ระบบสมัครสมาชิก (Registration)**
```
หน้า: /register
- ฟอร์มสมัครสมาชิก (Email, Password, Name, Phone)
- เลือกแพ็กเกจ: FREE / MONTHLY / YEARLY / LIFETIME
- ยืนยันผ่าน Email
- สร้าง User ใน Firebase Auth + Firestore
```

**Database Schema:**
```typescript
// Collection: users
{
  uid: string,
  email: string,
  displayName: string,
  phone: string,
  role: "free" | "premium",
  subscription: {
    plan: "free" | "monthly" | "yearly" | "lifetime",
    startDate: timestamp,
    endDate: timestamp,
    status: "active" | "expired" | "pending",
    paymentProof: string, // URL รูปหลักฐานการโอน
  },
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

**1.2 ระบบชำระเงิน (Payment)**
```
หน้า: /pricing
- แสดงแพ็กเกจทั้งหมด:
  • FREE: 0 บาท (มี Ads)
  • MONTHLY: 99 บาท/เดือน (ไม่มี Ads)
  • YEARLY: 990 บาท/ปี (ไม่มี Ads, ประหยัด 198 บาท)
  • LIFETIME: 2,990 บาท (ไม่มี Ads, ใช้ตลอดชีพ)

หน้า: /payment
- Upload หลักฐานการโอนเงิน
- ระบุวันที่โอน, เวลา, จำนวนเงิน
- ส่งไปให้ Admin ตรวจสอบ
```

**1.3 Admin Panel (ตรวจสอบการชำระเงิน)**
```
หน้า: /admin/payments
- แสดงรายการรอตรวจสอบ
- ดูหลักฐานการโอน
- อนุมัติ/ปฏิเสธ
- เมื่ออนุมัติ → Update subscription status
```

**1.4 User Profile**
```
หน้า: /profile
- แสดงข้อมูลส่วนตัว
- แสดงสถานะสมาชิก:
  • แพ็กเกจปัจจุบัน
  • วันหมดอายุ
  • จำนวนวันเหลือ
- ปุ่ม "ต่ออายุ" (ถ้าใกล้หมดอายุ)
- ประวัติการชำระเงิน
- ประวัติการใช้งาน
```

---

### **Priority 2: ระบบ Ads Management** 📺

#### **ปัญหา:**
- ต้องเข้า Firebase เพื่อกรอก Ads URLs
- ไม่มีระบบจัดการ Ads ที่ดี

#### **โซลูชัน:**

**2.1 Admin Ads Management**
```
หน้า: /admin/ads
- CRUD (Create, Read, Update, Delete) Ads
- ฟิลด์:
  • Ads Type: image, video, iframe (Google AdSense)
  • Ads URL/Code: ลิงก์รูป/วิดีโอ หรือ AdSense code
  • Display Duration: 5s, 10s, 15s, 30s
  • Frequency: ทุก X เพลง
  • Active/Inactive
  • Start Date / End Date (กำหนดช่วงเวลาแสดง)
```

**Database Schema:**
```typescript
// Collection: ads
{
  id: string,
  type: "image" | "video" | "adsense",
  content: string, // URL หรือ AdSense code
  duration: number, // seconds
  frequency: number, // แสดงทุก X เพลง
  isActive: boolean,
  startDate: timestamp,
  endDate: timestamp,
  createdAt: timestamp,
}
```

**2.2 Ads Display Logic**
```typescript
// แสดง Ads สำหรับ FREE users เท่านั้น
if (user.subscription.plan === "free") {
  // แสดง Ads ทุก X เพลง
  if (playedSongsCount % adsFrequency === 0) {
    showAds();
  }
}
```

**2.3 Google AdSense Integration**
```typescript
// Component: AdsenseAd.tsx
<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
  crossOrigin="anonymous"
/>
<ins
  className="adsbygoogle"
  style={{ display: "block" }}
  data-ad-client="ca-pub-XXXXXXXX"
  data-ad-slot="XXXXXXXXXX"
/>
```

---

### **Priority 3: Auto-Play Queue** 🎵

#### **ปัญหา:**
- พอเพลงจบ + มี Queue → ไม่เล่นต่ออัตโนมัติ
- ต้อง Cast ใหม่

#### **โซลูชัน:**

**3.1 YouTube Player API Integration**
```typescript
// hooks/useYouTubePlayer.ts
const player = useRef<YouTubePlayer>();

player.current.on("stateChange", (event) => {
  if (event.data === YouTubePlayerState.ENDED) {
    // เพลงจบ → เล่นเพลงถัดไปใน Queue
    playNextInQueue();
  }
});

function playNextInQueue() {
  const nextSong = playlist[currentIndex + 1];
  if (nextSong) {
    player.current.loadVideoById(nextSong.videoId);
    setCurrentIndex(currentIndex + 1);
  }
}
```

**3.2 Queue Management**
```typescript
// เพิ่มเพลงเข้า Queue
function addToQueue(video: Video) {
  setPlaylist([...playlist, video]);

  // ถ้าไม่มีเพลงกำลังเล่น → เล่นทันที
  if (!currentVideoId) {
    playVideo(video.videoId);
  }
}

// Remove จาก Queue
function removeFromQueue(index: number) {
  setPlaylist(playlist.filter((_, i) => i !== index));
}
```

**3.3 YouTube Cast API**
```typescript
// ใช้ YouTube Cast API แทน Custom Socket
import { YouTubeCastSender } from '@youtube/cast';

const castSender = new YouTubeCastSender({
  applicationId: 'YOUTUBE_CAST_APP_ID'
});

// Cast to TV/Device
castSender.cast(videoId, {
  autoplay: true,
  playlist: playlistVideoIds,
});
```

---

### **Priority 4: ระบบ Cast ข้ามอุปกรณ์แบบใหม่** 📱➡️📺

#### **ปัญหา:**
- Socket.io ไม่เสถียร
- Sync ไม่ได้บางครั้ง
- ใช้งานยาก

#### **โซลูชัน:**

**4.1 ใช้ Firebase Realtime Database แทน Socket.io**

```typescript
// สร้างห้อง (Room)
async function createRoom() {
  const roomCode = generateRoomCode(); // 6 หลัก เช่น "ABC123"

  await firebase.database().ref(`rooms/${roomCode}`).set({
    hostId: user.uid,
    createdAt: Date.now(),
    status: "active",
    currentVideo: null,
    playlist: [],
    controls: {
      isPlaying: false,
      currentTime: 0,
    }
  });

  return roomCode;
}

// เข้าร่วมห้อง (Join Room)
async function joinRoom(roomCode: string) {
  const roomRef = firebase.database().ref(`rooms/${roomCode}`);

  // Listen to changes
  roomRef.on("value", (snapshot) => {
    const room = snapshot.val();

    // Sync player
    if (room.currentVideo) {
      player.loadVideoById(room.currentVideo);
    }

    // Sync controls
    if (room.controls.isPlaying) {
      player.play();
    } else {
      player.pause();
    }

    // Sync time
    player.seekTo(room.controls.currentTime);
  });
}

// Update controls (Host only)
function updateControls(action: "play" | "pause" | "seek", data?: any) {
  if (isHost) {
    firebase.database().ref(`rooms/${roomCode}/controls`).update({
      isPlaying: action === "play",
      currentTime: data?.time || 0,
    });
  }
}
```

**4.2 UI/UX ใหม่**

```
หน้า Host (เปิดห้อง):
┌────────────────────────────┐
│ 🎵 โหมด Cast              │
├────────────────────────────┤
│                            │
│   รหัสห้อง: ABC123        │
│   [คัดลอก]                │
│                            │
│   📱 สแกน QR Code:        │
│   [QR Code Image]          │
│                            │
│   👥 ผู้เข้าร่วม: 3 คน    │
│   • iPhone ของคุณ         │
│   • Smart TV ห้องนั่งเล่น │
│   • iPad ของลูก           │
│                            │
│   [ปิดห้อง]               │
└────────────────────────────┘

หน้า Guest (เข้าร่วมห้อง):
┌────────────────────────────┐
│ 🔗 เข้าร่วมห้อง            │
├────────────────────────────┤
│                            │
│   กรอกรหัสห้อง:            │
│   [______]  [เข้าร่วม]    │
│                            │
│   หรือ                     │
│                            │
│   [สแกน QR Code]          │
│                            │
└────────────────────────────┘
```

**4.3 Database Schema**
```typescript
// Realtime Database: /rooms/{roomCode}
{
  hostId: string,
  createdAt: timestamp,
  status: "active" | "closed",
  currentVideo: {
    videoId: string,
    title: string,
    startTime: timestamp,
  },
  playlist: Video[],
  controls: {
    isPlaying: boolean,
    currentTime: number,
    volume: number,
  },
  participants: {
    [uid]: {
      displayName: string,
      joinedAt: timestamp,
      deviceType: "mobile" | "desktop" | "tv",
    }
  }
}
```

---

### **Priority 5: Settings Panel** ⚙️

#### **ต้องมี:**

**5.1 User Settings**
```
หน้า: /settings

📱 บัญชี
  • แก้ไขโปรไฟล์
  • เปลี่ยนรหัสผ่าน
  • เปลี่ยนอีเมล

💳 สมาชิก
  • แพ็กเกจปัจจุบัน
  • วันหมดอายุ
  • ต่ออายุ
  • ประวัติการชำระเงิน

🎵 การเล่น
  • Auto-play Queue (ON/OFF)
  • Auto-play Next Song (ON/OFF)
  • Default Volume (0-100)
  • Quality: Auto, 720p, 480p, 360p

🎨 ธีม
  • Light Mode
  • Dark Mode (ปัจจุบัน)

🔔 การแจ้งเตือน
  • แจ้งเตือนเมื่อใกล้หมดอายุ (7 วันก่อน)
  • แจ้งเตือน Ads ใหม่

🗑️ ลบบัญชี
  • ลบบัญชีถาวร
```

**5.2 Admin Settings**
```
หน้า: /admin/settings

👥 จัดการ Users
  • รายการ Users ทั้งหมด
  • อนุมัติ/ปฏิเสธการชำระเงิน
  • แบน/ปลดแบน User

📺 จัดการ Ads
  • CRUD Ads
  • ตั้งค่า Frequency

💰 จัดการ Pricing
  • ราคาแพ็กเกจต่างๆ
  • โปรโมชั่น

📊 รายงาน
  • สถิติการใช้งาน
  • รายได้
  • Popular Songs

⚙️ ตั้งค่าระบบ
  • Firebase Config
  • Spotify API Keys
  • YouTube API Keys
```

---

## 🗺️ Database Schema Summary

### **Collections:**

```typescript
// 1. users
{
  uid: string,
  email: string,
  displayName: string,
  phone: string,
  photoURL: string,
  role: "admin" | "premium" | "free",
  subscription: {
    plan: "free" | "monthly" | "yearly" | "lifetime",
    startDate: timestamp,
    endDate: timestamp,
    status: "active" | "expired" | "pending",
    paymentProof: string,
  },
  settings: {
    autoPlayQueue: boolean,
    defaultVolume: number,
    quality: string,
    theme: "light" | "dark",
  },
  createdAt: timestamp,
  updatedAt: timestamp,
}

// 2. payments
{
  id: string,
  userId: string,
  plan: "monthly" | "yearly" | "lifetime",
  amount: number,
  paymentProof: string,
  status: "pending" | "approved" | "rejected",
  transactionDate: timestamp,
  approvedBy: string, // admin uid
  approvedAt: timestamp,
  createdAt: timestamp,
}

// 3. ads
{
  id: string,
  type: "image" | "video" | "adsense",
  content: string,
  duration: number,
  frequency: number, // แสดงทุก X เพลง
  isActive: boolean,
  startDate: timestamp,
  endDate: timestamp,
  impressions: number, // จำนวนครั้งที่แสดง
  clicks: number,
  createdAt: timestamp,
}

// 4. playlists (เดิมมีอยู่แล้ว)
{
  id: string,
  userId: string,
  name: string,
  videos: Video[],
  isPublic: boolean,
  createdAt: timestamp,
}

// 5. usage_logs (สำหรับ analytics)
{
  id: string,
  userId: string,
  videoId: string,
  action: "play" | "add_queue" | "skip" | "cast",
  timestamp: timestamp,
}
```

---

## 📅 Development Timeline

### **Phase 1: User & Subscription (2-3 สัปดาห์)**
- Week 1: Registration, Login, Profile
- Week 2: Subscription, Payment Upload
- Week 3: Admin Panel (Payment Approval)

### **Phase 2: Ads Management (1 สัปดาห์)**
- Week 4: Admin Ads CRUD, Display Logic, AdSense Integration

### **Phase 3: Auto-Play Queue (3-5 วัน)**
- Week 5: YouTube Player Integration, Queue Management

### **Phase 4: Cast System (1-2 สัปดาห์)**
- Week 6-7: Firebase Realtime DB, Room System, Sync Logic

### **Phase 5: Settings Panel (3-5 วัน)**
- Week 8: User Settings, Admin Settings

**Total: ~8 สัปดาห์ (2 เดือน)**

---

## 🎯 Priority Order (แนะนำ)

```
1. User & Subscription (สำคัญที่สุด - สร้างรายได้)
2. Ads Management (สร้างรายได้จาก FREE users)
3. Auto-Play Queue (ปรับปรุง UX)
4. Settings Panel (จำเป็นสำหรับ user management)
5. Cast System (ปรับปรุง feature เดิมให้ดีขึ้น)
```

---

## 💡 Recommendations

### **ควรทำก่อน:**
1. ✅ ระบบ User & Subscription → สร้างรายได้
2. ✅ Ads Management → สร้างรายได้จาก FREE users
3. ✅ Auto-Play Queue → ทำให้ app ใช้งานได้ดีขึ้น

### **ทำทีหลัง:**
4. Settings Panel
5. Cast System Redesign

### **Tools & Libraries ที่แนะนำ:**

**Payment:**
- PromptPay QR Code: `promptpay-qr`
- Upload Images: Firebase Storage

**Ads:**
- Google AdSense
- React AdSense: `react-adsense`

**YouTube:**
- YouTube IFrame API: `react-youtube`
- YouTube Cast API

**Realtime:**
- Firebase Realtime Database (แทน Socket.io)

**UI:**
- Existing: DaisyUI, TailwindCSS
- Charts: `recharts` (สำหรับ analytics)

---

## 🚀 Next Steps

1. **Review roadmap นี้** - เห็นด้วยหรือต้องการเปลี่ยนแปลง?
2. **เลือก Phase ที่จะเริ่มก่อน** - แนะนำ Phase 1 (User & Subscription)
3. **Start development** - เริ่มจาก Registration Form

---

**คุณต้องการให้ผมเริ่มพัฒนาตั้งแต่ Phase ไหนก่อนครับ?** 🎯
