# YouOke MIDI & Commercial Roadmap

## วิสัยทัศน์
**เป้าหมาย:** โปรแกรมคาราโอเกะอันดับ 1 ในประเทศไทย
- Home Version: สำหรับใช้บ้าน ฝึกซ้อม งานเลี้ยง
- Commercial Version: สำหรับร้านคาราโอเกะมอืชีพ

---

## Phase 1: MIDI Player Foundation (3-4 สัปดาห์) ⭐ SIMPLIFIED

### Week 1-2: MIDI File Player (Web Audio API)
- [ ] ใช้ MIDI.js + Web Audio (ไม่ต้อง SoundFont!)
- [ ] เล่นไฟล์ .mid/.kar จาก Extreme Karaoke
- [ ] Play/Pause/Stop controls
- [ ] Volume control
- [ ] Tempo adjustment (เร็ว/ช้า ±50%)
- [ ] Transpose (เปลี่ยน Key -12 ~ +12)
- [ ] Progress bar + Time display

### Week 3: Lyrics Display (Karaoke Style)
- [ ] อ่าน lyrics จาก .kar file
- [ ] แสดงเนื้อเพลง 2-3 บรรทัด
- [ ] Highlight คำที่กำลังร้อง (เปลี่ยนสี)
- [ ] Scroll เนื้อเพลงอัตโนมัติ
- [ ] ปรับขนาดตัวอักษรได้

### Week 4: Multi-Storage Support (ความยืดหยุ่นสูง) 🆕
- [ ] **Google Drive Integration**
  - [ ] Google OAuth 2.0 login
  - [ ] File Picker - เลือกไฟล์จาก Google Drive
  - [ ] Stream MIDI/KAR จาก Drive โดยตรง
- [ ] **Local Storage (File System Access API)**
  - [ ] เลือกโฟลเดอร์ในเครื่อง
  - [ ] Scan ไฟล์ .mid/.kar อัตโนมัติ
  - [ ] จำ path ที่เลือกไว้
- [ ] **External Drive Support**
  - [ ] ตรวจจับ USB/External HDD
  - [ ] Auto-scan เมื่อเสียบ
- [ ] **Network Share (WebDAV)**
  - [ ] เชื่อมต่อ NAS/Network Drive
  - [ ] รองรับ SMB/WebDAV protocol
- [ ] **Cache System (IndexedDB)**
  - [ ] Cache ไฟล์ที่เล่นล่าสุด
  - [ ] ลดการโหลดซ้ำ

**Deliverable:** ผู้ใช้เลือกที่เก็บไฟล์ได้ตามต้องการ (Cloud/Local/Network)

---

## Phase 2: VCD/Video Karaoke Support (2-3 สัปดาห์) ⭐ SIMPLIFIED

### Week 1-2: Video Player from Google Drive
- [ ] Google Drive Video Picker
- [ ] Support: MP4, WebM, OGG (VCD ให้ผู้ใช้ convert เอง)
- [ ] Video player with controls
- [ ] **Vocal Removal (Phase Cancellation)**
  - [ ] ปุ่มสลับ: Original / Karaoke Mode
  - [ ] ตัดเสียงตรงกลาง (Center Channel)
  - [ ] ได้ผล 60-70% (เพียงพอ!)

### Week 3: Lyrics Overlay (Optional)
- [ ] Upload .srt/.lrc file พร้อม video
- [ ] แสดง subtitle บนวิดีโอ
- [ ] Sync เวลาได้
- [ ] ปรับขนาด/สี subtitle

**Deliverable:** เล่น Video Karaoke จาก Google Drive + ตัดเสียงร้องได้

**หมายเหตุ:** VCD → MP4 ให้ผู้ใช้ convert ด้วย HandBrake/FFmpeg ก่อน upload Drive

---

## Phase 3: Enhanced MIDI Features (3-4 สัปดาห์)

### Advanced Controls
- [ ] Multi-track display (แสดงทุก track)
- [ ] Mute/Solo แต่ละ track
- [ ] เปลี่ยน Instrument แต่ละ track
- [ ] SoundFont selector (คุณภาพเสียง)
- [ ] Reverb/Echo effects

### Professional Features
- [ ] Recording (บันทึกเสียงร้อง)
- [ ] Score display (คะแนนการร้อง)
- [ ] Practice mode (ซ้อมเฉพาะบางท่อน)

**Deliverable:** MIDI player ระดับมืออาชีพ

---

## Phase 4: Commercial Version Foundation (6-8 สัปดาห์)

### VCD/Video Karaoke Support
- [ ] VCD file upload (.dat, .mpg)
- [ ] Convert MPEG-1 to MP4 (FFmpeg)
- [ ] Video player with lyrics overlay
- [ ] DVD/Blu-ray Karaoke support

### Multi-Room Management
- [ ] Create multiple rooms
- [ ] Room status (ว่าง/ใช้งาน)
- [ ] Time tracking per room
- [ ] Auto-calculate pricing

### Coin/Payment System
- [ ] Coin slot integration (optional)
- [ ] QR Payment (PromptPay)
- [ ] Package selection (1hr, 2hr, 3hr)
- [ ] Receipt printing

### Customer Queue System
- [ ] Queue management per room
- [ ] Request song from mobile
- [ ] QR code join room
- [ ] Next song notification

### Admin Dashboard
- [ ] รายได้แต่ละห้อง/วัน/เดือน
- [ ] เพลงยอดนิยม
- [ ] เวลาใช้งานเฉลี่ย
- [ ] Customer analytics

**Deliverable:** พร้อมใช้งานในร้านคาราโอเกะจริง

---

## Phase 5: Advanced Commercial Features (4-6 สัปดาห์)

### Remote Control
- [ ] iPad/Tablet remote app
- [ ] Song search & request
- [ ] Room control (lights, AC)
- [ ] Food/Drink ordering

### Hardware Integration
- [ ] Microphone mixer control
- [ ] Echo/Reverb hardware
- [ ] LED lighting sync
- [ ] Projector/TV control

### Cloud Sync
- [ ] Multi-branch support
- [ ] Central song library
- [ ] Centralized billing
- [ ] Cloud backup

**Deliverable:** ระบบครบวงจรสำหรับเครือข่ายร้านคาราโอเกะ

---

## เทคโนโลยีที่ต้องใช้

### MIDI Player
- **MIDI.js** - MIDI file parser & player
- **ToneJS** - Audio synthesis
- **Web Audio API** - Built-in browser (ไม่ต้อง SoundFont!)

### Multi-Storage Support 🆕
- **Google Drive API v3** - Cloud storage
- **Google OAuth 2.0** - Authentication
- **File System Access API** - Local/External drive access
- **WebDAV Client** - Network share (NAS/SMB)
- **IndexedDB** - Local cache
- **navigator.storage** - Storage quota management

### VCD/Video
- **FFmpeg.js** - Video conversion (browser)
- **FFmpeg** - Server-side conversion (faster)

### Commercial Features
- **Socket.io** - Real-time communication (มีอยู่แล้ว)
- **Firebase Realtime Database** - Multi-room sync (มีอยู่แล้ว)
- **Stripe/Omise** - Payment gateway
- **Thermal Printer API** - Receipt printing

---

## ต้นทุนและทรัพยากร

### Home Version
- ✅ ใช้โครงสร้างปัจจุบัน
- ✅ ไม่ต้องลงทุนเพิ่ม (MIDI.js ฟรี)
- ✅ Deploy บน Vercel ฟรี

### Commercial Version
- 💰 VPS/Dedicated Server (3,000-10,000 บาท/เดือน)
- 💰 SoundFont Premium (1,000-5,000 บาท ครั้งเดียว)
- 💰 FFmpeg Server (ถ้าต้อง convert VCD)
- 💰 Payment Gateway fees (2.5-3% ต่อธุรกรรม)

---

## Timeline สรุป (ปรับใหม่ - SIMPLIFIED)

| Phase | ระยะเวลา | ฟีเจอร์หลัก |
|-------|----------|-------------|
| Phase 1 | 3-4 สัปดาห์ | MIDI Player + Google Drive ⭐ |
| Phase 2 | 2-3 สัปดาห์ | Video Karaoke + Vocal Removal ⭐ |
| Phase 3 | 2-3 สัปดาห์ | Advanced Features (Key/Tempo) |
| Phase 4 | 4-6 สัปดาห์ | Commercial Foundation |
| Phase 5 | 3-4 สัปดาห์ | Multi-Room & Payment |
| **รวม** | **3-4 เดือน** | **Home Version สมบูรณ์** |
| **Commercial** | **+2 เดือน** | **พร้อมขายให้ร้าน** |

⭐ = ง่ายขึ้นมากเพราะใช้ Google Drive แทนการเก็บไฟล์เอง!

---

## Next Steps

1. ✅ รอ support แก้ Plesk deployment
2. ⏳ เริ่ม Phase 1: MIDI Player Foundation
3. ⏳ ออกแบบ UI/UX สำหรับ MIDI player
4. ⏳ Research MIDI.js vs ToneJS

---

## คำแนะนำ

### ✅ ควรทำ
- เริ่มจาก Home Version ให้สมบูรณ์ก่อน
- ใช้โค้ดร่วมกัน (monorepo) เพื่อลด duplicate
- Test กับไฟล์ MIDI จริงจากร้านคาราโอเกะไทย
- เก็บ feedback จากผู้ใช้ Home Version

### ⚠️ ระวัง
- VCD support ซับซ้อน อาจทำทีหลัง
- Commercial version ต้องทดสอบกับร้านจริง
- Hardware integration ต้องมีอุปกรณ์ทดสอบ

### 🎯 เป้าหมายระยะยาว
- **Home Version:** เปิดให้ใช้ฟรี (freemium model)
- **Commercial Version:** ขายแบบ License (50,000-200,000 บาท/ร้าน)
- **Cloud Service:** รายเดือน 2,000-5,000 บาท/ร้าน
