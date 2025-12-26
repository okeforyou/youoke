# ✅ Refactor Complete: Simple & Scalable Playlist System

## สรุปการแก้ไข (What We Fixed)

### ปัญหาเดิม (Old Architecture)
```
❌ Playlist ลบเพลงที่เล่นแล้วออก
❌ ต้องใช้ currentVideo workaround
❌ ปุ่ม Previous ไม่ได้
❌ State กระจายทุกที่
❌ Logic ยากต่อการ maintain
```

### วิธีแก้ (New Architecture)
```
✅ Playlist เก็บเพลงทั้งหมด (ไม่ลบ)
✅ ใช้ currentIndex track ตำแหน่ง
✅ ปุ่ม Previous/Next ทำงานได้
✅ State รวมศูนย์
✅ Logic เรียบง่าย scalable
```

---

## การเปลี่ยนแปลง (Changes Made)

### 1. State Management (`hooks/karaoke.ts`)

**เพิ่ม currentIndex:**
```typescript
const { value: currentIndex, set: setCurrentIndex } = useLocalStorageValue(
  "currentIndex",
  { defaultValue: 0 }
);
```

**ก่อน:**
- playlist ลดลงเรื่อยๆ (ลบเพลงที่เล่น)
- ใช้ curVideoId เป็นหลัก

**หลัง:**
- playlist คงที่ (เก็บทุกเพลง)
- ใช้ currentIndex + curVideoId ร่วมกัน

---

### 2. Playlist Logic (`components/YoutubePlayer.tsx`)

**ลบ Logic ที่ลบเพลง:**
```typescript
// ❌ ก่อน (บรรทัด 311-319)
const [video, ...newPlaylist] = playlist;
setCurVideoId(video.videoId);
setPlaylist(newPlaylist); // ลบเพลงออก!

// ✅ หลัง
// Removed: Now using currentIndex in parent component
```

---

### 3. Navigation Functions (`pages/index.tsx`)

**เพิ่มฟังก์ชัน Next/Previous:**
```typescript
const playNext = () => {
  if (!playlist || playlist.length === 0) return;
  const nextIndex = currentIndex + 1;
  if (nextIndex < playlist.length) {
    const nextVideo = playlist[nextIndex];
    setCurVideoId(nextVideo.videoId);
    setCurrentIndex(nextIndex);
  } else {
    // End of playlist
    setCurVideoId("");
    setCurrentIndex(0);
  }
};

const playPrevious = () => {
  if (!playlist || playlist.length === 0) return;
  const prevIndex = currentIndex - 1;
  if (prevIndex >= 0) {
    const prevVideo = playlist[prevIndex];
    setCurVideoId(prevVideo.videoId);
    setCurrentIndex(prevIndex);
  }
};
```

---

### 4. Playlist Operations Integration

#### 4.1 Add Song (เพิ่มเพลง)
```typescript
function addVideoToPlaylist(video) {
  // เพิ่มท้าย playlist (ไม่ต้องจัดการ currentIndex)
  setPlaylist(playlist.concat([video]));
}
```

#### 4.2 Play Now (เล่นทันที)
```typescript
function priorityVideo(video, videoIndex?) {
  // เพิ่มหน้าสุด + เล่นทันที
  const newPlaylist = videoIndex !== undefined
    ? playlist.filter((_, i) => i !== videoIndex) // ลบของเดิมถ้ามี
    : playlist;

  setPlaylist([video, ...newPlaylist]);
  setCurVideoId(video.videoId);
  setCurrentIndex(0); // เล่นตำแหน่งแรก
}
```

#### 4.3 Skip To (กระโดดไปเล่น)
```typescript
function skipVideoTo(video, videoIndex?) {
  if (videoIndex !== undefined) {
    setCurVideoId(video.videoId);
    setCurrentIndex(videoIndex); // กระโดดไปตำแหน่งที่เลือก
  }
}
```

#### 4.4 Delete Song (ลบเพลง)
```typescript
onDelete: () => {
  setPlaylist(playlist.filter((_, i) => i !== realIndex));

  // อัพเดท currentIndex ตามตำแหน่งที่ลบ
  if (realIndex < currentIndex) {
    // ลบก่อนหน้า → เลื่อน index ลง
    setCurrentIndex(currentIndex - 1);
  } else if (realIndex === currentIndex) {
    // ลบเพลงปัจจุบัน → เล่นเพลงถัดไป
    if (playlist.length > 1) {
      const nextVideo = playlist[currentIndex + 1] || playlist[0];
      setCurVideoId(nextVideo.videoId);
    } else {
      setCurVideoId("");
      setCurrentIndex(0);
    }
  }
  // ลบหลังหน้า → ไม่ต้องทำอะไร
}
```

#### 4.5 Reorder (จัดเรียงใหม่)
```typescript
handleDragEnd: (event) => {
  const newPlaylist = arrayMove(playlist, oldIndex, newIndex);
  const newCurrentIndex = calculateNewCurrentIndex(
    oldIndex,
    newIndex,
    currentIndex
  );

  setPlaylist(newPlaylist);

  if (newCurrentIndex !== currentIndex) {
    setCurrentIndex(newCurrentIndex);
  }
}
```

---

### 5. Auto-Sync (ป้องกัน Desync)

```typescript
// Sync currentIndex เมื่อ curVideoId เปลี่ยน
useEffect(() => {
  if (curVideoId && playlist && playlist.length > 0) {
    const index = playlist.findIndex(v => v.videoId === curVideoId);
    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index); // Sync ตำแหน่ง
    }
  }
}, [curVideoId, playlist]);
```

---

## ข้อดี (Benefits)

### 1. เรียบง่าย (Simple)
- Logic ชัดเจน: playlist[currentIndex]
- ไม่ต้อง workaround
- ง่ายต่อการเข้าใจ

### 2. ทำงานครบ (Functional)
- ✅ เล่นเพลงถัดไป (Next)
- ✅ เล่นเพลงก่อนหน้า (Previous)
- ✅ กระโดดไปเพลงใดก็ได้ (Skip To)
- ✅ ลบเพลงได้ (Delete)
- ✅ จัดเรียงได้ (Drag & Drop)
- ✅ เล่นทันที (Play Now)

### 3. ปลอดภัย (Safe)
- ป้องกัน index out of bounds
- Auto-sync ป้องกัน desync
- Edge cases ครอบคลุม

### 4. พัฒนาต่อได้ (Scalable)
- เพิ่ม features ง่าย
- เข้าใจ logic ไว
- Debug ง่าย (state รวมศูนย์)

---

## ตัวอย่างการใช้งาน (Usage Examples)

### User Scenario 1: เล่นเพลงปกติ
```
1. User เพิ่มเพลง 3 เพลง
   playlist = [A, B, C]
   currentIndex = 0
   curVideoId = A

2. เพลง A จบ → playNext()
   playlist = [A, B, C]     // ไม่ลบ
   currentIndex = 1         // +1
   curVideoId = B

3. กด Previous
   playlist = [A, B, C]     // ไม่ลบ
   currentIndex = 0         // -1
   curVideoId = A           // กลับไปเล่น A
```

### User Scenario 2: ลบเพลงขณะเล่น
```
1. กำลังเล่นเพลง B
   playlist = [A, B, C]
   currentIndex = 1
   curVideoId = B

2. User ลบเพลง B
   playlist = [A, C]        // ลบ B
   currentIndex = 1         // ไม่เปลี่ยน
   curVideoId = C           // เล่นเพลงถัดไป (C)
```

### User Scenario 3: Play Now
```
1. กำลังเล่นเพลง B
   playlist = [A, B, C]
   currentIndex = 1

2. User กด "Play Now" เพลง D
   playlist = [D, A, B, C]  // D ขึ้นหน้าสุด
   currentIndex = 0         // เล่นตำแหน่ง 0
   curVideoId = D
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│           useKaraokeState()                 │
│  ┌───────────────────────────────────────┐  │
│  │ playlist: [A, B, C, D, E]             │  │
│  │ currentIndex: 2                       │  │
│  │ curVideoId: "C"                       │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│             index.tsx                       │
│  ┌───────────────────────────────────────┐  │
│  │ currentVideo = playlist[currentIndex] │  │
│  │ hasNext = currentIndex < length - 1   │  │
│  │ hasPrevious = currentIndex > 0        │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ playNext() → currentIndex + 1         │  │
│  │ playPrevious() → currentIndex - 1     │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          MiniPlayer / YoutubePlayer         │
│  - แสดงเพลงปัจจุบัน (currentVideo)          │
│  - ปุ่ม Previous/Next ทำงานได้             │
│  - Progress bar แสดงถูกต้อง                │
└─────────────────────────────────────────────┘
```

---

## ต่อไป (Next Steps - Optional)

ระบบตอนนี้ **ทำงานได้เต็มที่** แต่ถ้าต้องการพัฒนาต่อ:

### Phase 2: Simplify Player Rendering (ลดความซับซ้อน)
- เปลี่ยนจาก 2 players → 1 player
- ใช้ CSS responsive แทน conditional rendering
- ประมาณ 2-3 ชั่วโมง

### Phase 3: Player Context (Advanced)
- สร้าง PlayerContext
- Centralize player state
- ง่ายต่อการเพิ่ม features ขั้นสูง
- ประมาณ 4-6 ชั่วโมง

**แนะนำ:** ใช้ระบบปัจจุบันไปก่อน รอจนกว่าจะมีความต้องการที่ชัดเจนค่อย refactor Phase 2-3

---

## สรุป

✅ **Phase 1 เสร็จสมบูรณ์**
- Playlist logic เรียบง่าย
- Previous button ทำงานได้
- State management ชัดเจน
- พร้อมพัฒนาต่อ

🎉 **ระบบพร้อมใช้งาน!**
