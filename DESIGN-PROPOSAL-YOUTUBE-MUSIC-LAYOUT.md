# 🎨 Design Proposal: YouTube Music Style Layout

## 📊 สถานะปัจจุบัน (Current State)

### หน้าหลัก (Home Page)
```
┌─────────────────────────────────────┐
│                                     │
│  Search Bar + Video Player          │
│                                     │
│  (Full Width Content)               │
│                                     │
│  Playlist / Queue                   │
│                                     │
└─────────────────────────────────────┘
┌───────────────────────┬─────────────┐
│ Bottom Navigation     │             │
│ (ทางซ้าย Mobile)      │ (ทางขวา)    │
│ แนะนำ | มาแรง | ฯลฯ   │             │
└───────────────────────┴─────────────┘
```

**ปัญหา:**
- Bottom Nav อยู่ล่าง ทางขวาบน Desktop (w-1/2)
- ไม่สอดคล้องกับหน้า Admin ที่มี Sidebar ซ้าย
- Video Player + Queue ใช้พื้นที่เต็มจอ ทำให้พื้นที่ซ้ำซ้อน

### หน้า Admin
```
┌───────┬─────────────────────────────┐
│       │                             │
│ Side  │  Admin Dashboard            │
│ bar   │  Stats / Tables             │
│       │  Content Area               │
│ (ซ้าย)│                             │
│       │                             │
└───────┴─────────────────────────────┘
```

**ดี:**
- Sidebar ซ้าย สะดวกใช้งาน
- Content area กว้าง
- Layout สอดคล้อง

---

## 🎯 แนวทางใหม่: YouTube Music Style

### Desktop Layout (>= lg)
```
┌────────┬─────────────────────────┬────────────┐
│        │                         │            │
│ Side   │  Main Content Area      │  Queue /   │
│ bar    │  - Search Results       │  Playlist  │
│        │  - Artists Grid         │  (Optional │
│ - หน้า │  - Playlists           │   Toggle)  │
│ - แนะนำ│  - Topics              │            │
│ - มาแรง│                         │            │
│ - ห้อง │                         │            │
│ - บัญชี│                         │            │
│        │                         │            │
├────────┴─────────────────────────┴────────────┤
│  Mini Video Player (Bottom Left)              │
│  [Thumbnail] Song Title - Artist   [Controls] │
└───────────────────────────────────────────────┘
```

### Mobile Layout (< lg)
```
┌─────────────────────────────────────┐
│                                     │
│  Main Content Area                  │
│  - Search Results                   │
│  - Grid Layout                      │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  Mini Video Player (Bottom)         │
│  [Thumb] Title      [⏯️ Skip →]    │
├─────────────────────────────────────┤
│  Bottom Navigation (ด้านล่าง)       │
│  🎵 แนะนำ | 🏆 มาแรง | 📋 ฯลฯ    │
└─────────────────────────────────────┘
```

---

## 🎨 Component Architecture

### 1. **MainLayout Component** (ใหม่)
**Path:** `components/layout/MainLayout.tsx`

**Props:**
```typescript
interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showMiniPlayer?: boolean;
  showQueuePanel?: boolean;  // Optional right panel for queue
}
```

**Features:**
- Responsive Sidebar (hidden on mobile, visible on desktop)
- Mini Video Player (bottom sticky)
- Optional Queue Panel (toggle on/off)
- Mobile: Bottom Navigation + Mini Player

**Layout Structure:**
```tsx
<div className="flex h-screen">
  {/* Sidebar - Hidden on Mobile */}
  <MainSidebar className="hidden lg:flex" />

  {/* Main Content */}
  <main className="flex-1 overflow-y-auto pb-32 lg:pb-20">
    {children}
  </main>

  {/* Optional Queue Panel */}
  {showQueuePanel && (
    <QueuePanel className="hidden xl:flex w-80" />
  )}

  {/* Mini Player - Bottom Sticky */}
  <MiniPlayer className="fixed bottom-0 lg:bottom-0 left-0 lg:left-64 right-0 z-40" />

  {/* Bottom Nav - Mobile Only */}
  <BottomNavigation className="lg:hidden fixed bottom-16" />
</div>
```

---

### 2. **MainSidebar Component** (ใหม่)
**Path:** `components/layout/MainSidebar.tsx`

**เมนู:**
- 🏠 หน้าหลัก
- 🎵 แนะนำ
- 🏆 มาแรง
- 📋 เพลย์ลิสต์
- 🏠 ห้องของฉัน
- 👤 บัญชี (ถ้า login แล้ว)
- 🔐 เข้าสู่ระบบ (ถ้ายัง)
- 💬 ติดต่อ (LINE)
- ⚙️ Admin (ถ้าเป็น admin)

**Style:**
```tsx
<aside className="w-64 bg-base-200 border-r border-base-300 flex flex-col">
  {/* Logo */}
  <div className="p-4">
    <h1 className="text-2xl font-bold">YouOke</h1>
  </div>

  {/* Navigation Links */}
  <nav className="flex-1 overflow-y-auto">
    <NavLink icon={HomeIcon} href="/" label="หน้าหลัก" />
    <NavLink icon={MusicalNoteIcon} onClick={() => setTab(1)} label="แนะนำ" />
    {/* ... */}
  </nav>

  {/* User Profile (Bottom) */}
  {user && (
    <div className="p-4 border-t">
      <UserCard user={user} />
    </div>
  )}
</aside>
```

---

### 3. **MiniPlayer Component** (ใหม่)
**Path:** `components/MiniPlayer.tsx`

**Features:**
- แสดงเพลงที่กำลังเล่น
- Controls: Play/Pause, Previous, Next, Queue
- Progress Bar
- Volume Control
- Expand to Full Player (Modal/Overlay)

**Desktop Layout:**
```
┌────────────────────────────────────────────────────┐
│ [Thumbnail] Song Title - Artist Name               │
│ [Progress Bar ═══════════●────────]                │
│ [⏮️ ⏯️ ⏭️]  [Queue] [Volume] [Expand] [Cast]      │
└────────────────────────────────────────────────────┘
```

**Mobile Layout:**
```
┌────────────────────────────────────┐
│ [Thumb] Song Title    [⏯️ ⏭️ 📋]  │
└────────────────────────────────────┘
```

**Style:**
```tsx
<div className="bg-base-300 border-t border-base-content/10 px-4 py-3">
  <div className="flex items-center gap-4 max-w-7xl mx-auto">
    {/* Thumbnail */}
    <div className="w-14 h-14 relative rounded overflow-hidden">
      <Image src={thumbnail} alt={title} layout="fill" />
    </div>

    {/* Song Info */}
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold truncate">{title}</h3>
      <p className="text-sm text-base-content/60 truncate">{artist}</p>

      {/* Progress Bar - Desktop Only */}
      <div className="hidden lg:block mt-1">
        <progress className="progress w-full" value={progress} max="100" />
      </div>
    </div>

    {/* Controls */}
    <div className="flex items-center gap-2">
      <button className="btn btn-ghost btn-sm btn-circle">
        <PlayIcon />
      </button>
      <button className="btn btn-ghost btn-sm btn-circle">
        <ForwardIcon />
      </button>
      <button className="btn btn-ghost btn-sm btn-circle hidden lg:flex">
        <QueueListIcon />
      </button>
    </div>
  </div>
</div>
```

---

### 4. **QueuePanel Component** (Optional)
**Path:** `components/QueuePanel.tsx`

**Features:**
- แสดง Playlist/Queue ทางขวา
- Drag & Drop reorder
- Add/Remove songs
- Toggle show/hide

**Desktop Only:** (>= xl breakpoint)
```tsx
<aside className="w-80 bg-base-200 border-l border-base-300 overflow-y-auto">
  <div className="p-4">
    <h2 className="text-lg font-bold mb-4">คิวเพลง</h2>

    {/* Current Playing */}
    <div className="mb-4 p-3 bg-primary/10 rounded">
      <p className="text-xs text-base-content/60">กำลังเล่น</p>
      <h3 className="font-semibold">{currentSong.title}</h3>
    </div>

    {/* Queue List */}
    <DndContext>
      {queue.map((song) => (
        <QueueItem key={song.id} song={song} />
      ))}
    </DndContext>
  </div>
</aside>
```

---

## 📱 Responsive Breakpoints

### Mobile (< 1024px)
- ซ่อน Sidebar
- ซ่อน Queue Panel
- แสดง Bottom Navigation (ด้านล่าง)
- Mini Player ด้านล่าง (เหนือ Bottom Nav)

### Desktop (>= 1024px)
- แสดง Sidebar ทางซ้าย (w-64)
- ซ่อน Bottom Navigation
- Mini Player ด้านล่าง (left offset จาก sidebar)

### Large Desktop (>= 1280px)
- เหมือน Desktop
- + Optional Queue Panel ทางขวา (w-80)

---

## 🔄 Migration Plan

### Phase 1: Create New Components
1. ✅ สร้าง `MainLayout.tsx`
2. ✅ สร้าง `MainSidebar.tsx`
3. ✅ สร้าง `MiniPlayer.tsx`
4. ✅ สร้าง `QueuePanel.tsx` (optional)

### Phase 2: Refactor Home Page
1. แยก Video Player logic เป็น context/hook
2. แยก Queue/Playlist logic
3. แปลง `index.tsx` ให้ใช้ `MainLayout`
4. ย้าย navigation logic ไป `MainSidebar`

### Phase 3: Update Other Pages
1. แปลง account page ให้ใช้ `MainLayout`
2. แปลง pricing page ให้ใช้ `MainLayout`
3. Keep Admin pages ใช้ `AdminLayout` (separate)

### Phase 4: Testing
1. ทดสอบ responsive ทุก breakpoint
2. ทดสอบ Cast Mode
3. ทดสอบ Queue management
4. ทดสอบ Navigation flow

---

## 💡 ข้อดีของ Layout ใหม่

### ✅ Consistency
- UI สอดคล้องกันทุกหน้า (เว้น Admin)
- Navigation pattern เดียวกัน
- ไม่สับสน

### ✅ Better UX
- Video Player ไม่บัง Content
- Queue สามารถเปิด/ปิดได้ (Desktop)
- Navigation เข้าถึงง่าย (Sidebar)

### ✅ Mobile-First
- Mobile: Bottom Nav + Mini Player (คุ้นเคย)
- Desktop: Sidebar + Mini Player (เหมือน YT Music)

### ✅ Scalable
- เพิ่ม menu items ใน Sidebar ได้ง่าย
- Support future features (Lyrics, MIDI, etc.)

---

## 🎯 ตัวอย่าง Ref: YouTube Music

**Desktop:**
```
┌────────┬─────────────────────────┬────────────┐
│        │                         │            │
│ [Menu] │  [Search Results]       │  [Queue]   │
│        │                         │            │
│ Home   │  ◼️◼️◼️◼️              │  1. Song A │
│ Explore│  ◼️◼️◼️◼️              │  2. Song B │
│ Library│  ◼️◼️◼️◼️              │  3. Song C │
│        │                         │            │
├────────┴─────────────────────────┴────────────┤
│  🎵 Song Playing... [⏮️ ⏯️ ⏭️] [Queue] [❤️]   │
└───────────────────────────────────────────────┘
```

**คล้ายๆ กับ:**
- Spotify Desktop
- Apple Music Web
- YouTube Music
- SoundCloud

---

## ❓ Next Steps

1. **Review this proposal** - คุณเห็นด้วยกับ design นี้ไหม?
2. **Discuss changes** - มีอะไรต้องปรับเปลี่ยนไหม?
3. **Start implementation** - ถ้า OK แล้ว เริ่มทำเลย

**คำถาม:**
- ต้องการ Queue Panel ทางขวาไหม? (Desktop only)
- Mini Player ควรมี features อะไรบ้าง?
- Sidebar มี menu items อะไรอีก?
- รักษา Bottom Nav บน Desktop ไหม? (ตอนนี้ ซ่อนไปใช้ Sidebar แทน)
