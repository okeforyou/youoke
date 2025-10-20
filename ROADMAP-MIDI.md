# YouOke MIDI & Commercial Roadmap

## วิสัยทัศน์
**เป้าหมาย:** โปรแกรมคาราโอเกะอันดับ 1 ในประเทศไทย
- Home Version: สำหรับใช้บ้าน ฝึกซ้อม งานเลี้ยง
- Commercial Version: สำหรับร้านคาราโอเกะมอืชีพ

---

## Phase 1: MIDI Player Foundation (4-6 สัปดาห์)

### Week 1-2: MIDI File Player
- [ ] ติดตั้ง MIDI.js หรือ ToneJS
- [ ] Upload MIDI file (.mid, .kar)
- [ ] Play/Pause/Stop controls
- [ ] Volume control
- [ ] Tempo adjustment (เร็ว/ช้า)
- [ ] Transpose (เปลี่ยน Key สูง/ต่ำ)

### Week 3-4: Lyrics Display
- [ ] อ่าน Karaoke MIDI format (.kar)
- [ ] แสดงเนื้อเพลง sync กับดนตรี
- [ ] Highlight คำที่กำลังร้อง (Karaoke style)
- [ ] แสดงคอร์ดประกอบ (optional)

### Week 5-6: File Management
- [ ] Local File Upload (Drag & Drop)
- [ ] IndexedDB สำหรับเก็บ MIDI files
- [ ] My MIDI Library (รายการเพลงที่อัพโหลด)
- [ ] Search/Filter MIDI files
- [ ] Delete/Rename files

**Deliverable:** ผู้ใช้สามารถอัพโหลดและเล่น MIDI karaoke ได้

---

## Phase 2: Google Drive Integration (2-3 สัปดาห์)

### Week 1: Google Drive API
- [ ] Google OAuth 2.0 login
- [ ] Browse Google Drive folders
- [ ] Select MIDI files from Drive
- [ ] Download & cache MIDI files

### Week 2-3: Drive Manager
- [ ] Upload MIDI to Google Drive
- [ ] Sync library with Google Drive
- [ ] Auto-backup MIDI files
- [ ] Shared Drive support (สำหรับร้าน)

**Deliverable:** ผู้ใช้สามารถจัดการ MIDI ผ่าน Google Drive ได้

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
- **SoundFont** - เสียงเครื่องดนตรี high-quality

### Google Drive
- **Google Drive API v3** - File management
- **Google OAuth 2.0** - Authentication

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

## Timeline สรุป

| Phase | ระยะเวลา | ฟีเจอร์หลัก |
|-------|----------|-------------|
| Phase 1 | 4-6 สัปดาห์ | MIDI Player + Lyrics |
| Phase 2 | 2-3 สัปดาห์ | Google Drive Integration |
| Phase 3 | 3-4 สัปดาห์ | Advanced MIDI Features |
| Phase 4 | 6-8 สัปดาห์ | Commercial Foundation |
| Phase 5 | 4-6 สัปดาห์ | Advanced Commercial |
| **รวม** | **5-7 เดือน** | **ครบทุกฟีเจอร์** |

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
