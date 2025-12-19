# Oke for You - System Architecture Blueprint

> Online Karaoke Platform with YouTube Integration & Subscription Management
> Last Updated: 2025-01-13

---

## 🎯 Project Vision

Create a seamless online karaoke experience with:
- YouTube-based song library via Invidious API
- Subscription-based access control
- Future MIDI file support with Google Drive integration
- Mobile-first responsive design

---

## 🏗️ System Architecture

### **Core Technology Stack**

```
Frontend:
├── Next.js 13 (React Framework)
├── TypeScript (Type Safety)
├── Tailwind CSS + DaisyUI (Styling)
└── Firebase Client SDK (Auth, Realtime DB)

Backend:
├── Next.js API Routes (Server-side logic)
├── Firebase Admin SDK (Server operations)
├── Firestore (Plans, Payments storage)
└── Realtime Database (User subscriptions)

Deployment:
├── Vercel (Hosting & CI/CD)
└── Firebase (Backend services)
```

---

## 📦 Module Structure

### **1. Authentication Module**
**Purpose:** User identity management
**Tech:** Firebase Auth
**Features:**
- Email/Password authentication
- Google OAuth sign-in
- Session management with `nookies` cookies
- Protected routes via SSR

**Key Files:**
- `context/AuthContext.tsx` - Auth state provider
- `pages/login.tsx` - Login page
- `pages/register.tsx` - Registration page

---

### **2. Subscription Module** ⚠️ CRITICAL - Needs Consistency

**Purpose:** Membership & payment management
**Current State:** INCONSISTENT - Multiple UX patterns
**Goal:** Unified subscription experience

#### **2.1 Data Model**
```typescript
// Firestore: /plans/{planId}
interface Plan {
  id: string;              // "free" | "monthly" | "yearly" | "lifetime"
  displayName: string;     // "รายเดือน", "รายปี"
  price: number;           // 99, 999
  duration: string;        // "/เดือน", "/ปี"
  features: string[];      // List of features
  popular: boolean;        // Highlight flag
  isActive: boolean;       // Enable/disable plan
  isVisible: boolean;      // Show/hide from UI
}

// Realtime DB: /users/{uid}/subscription
interface UserSubscription {
  plan: "free" | "monthly" | "yearly" | "lifetime";
  status: "active" | "inactive" | "expired" | "pending";
  startDate: string | null;   // ISO date
  endDate: string | null;      // ISO date
}

// Firestore: /payments/{paymentId}
interface Payment {
  userId: string;
  plan: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  // ... payment proof details
}
```

#### **2.2 User Flow**
```
[New User]
  → Register (register.tsx)
  → Select Plan (optional)
  → If paid plan → Payment (payment.tsx)
  → Redirect to Home

[Existing User - Upgrade]
  → Account Page (account.tsx)
  → Select Plan
  → Payment (payment.tsx)
  → Admin Approval (admin/payments.tsx)
  → Subscription Updated
```

#### **2.3 Design System** (MUST FOLLOW)
```
Package Card Variants:
1. Current Plan:
   - Border: border-success (green)
   - Background: bg-success/10
   - Badge: "กำลังใช้งาน" (green)
   - Button: disabled "แพ็คเกจปัจจุบัน"

2. Popular Plan:
   - Border: border-primary (red/pink)
   - Background: bg-primary/5
   - Badge: "คุ้มที่สุด" (yellow)
   - Button: btn-primary "เลือกแพ็คเกจนี้"

3. Regular Plan:
   - Border: border-base-300
   - Background: bg-base-100
   - Button: btn-outline btn-primary
```

**Key Files:**
- `pages/account.tsx` - User account & subscription status (SSR)
- `pages/pricing.tsx` - Package selection popup
- `pages/payment.tsx` - Payment confirmation
- `pages/register.tsx` - New user registration
- `pages/admin/payments.tsx` - Admin payment approval
- `services/userService.ts` - User CRUD operations
- `services/paymentService.ts` - Payment operations

---

### **3. Karaoke Module**

**Purpose:** Core karaoke functionality
**Tech:** YouTube via Invidious API
**Current Status:** ✅ Working

**Features:**
- YouTube search (Invidious instances)
- Video queue management
- Playback controls
- Bottom navigation (mobile-first)

**Key Files:**
- `pages/index.tsx` - Main karaoke page (tabs: แนะนำ, มาแรง, เพลย์ลิสต์)
- `components/BottomNavigation.tsx` - Mobile navigation bar
- `hooks/karaoke.ts` - State management
- `services/invidiousService.ts` - YouTube API wrapper

---

### **4. MIDI Module** 🚧 ROADMAP (3-4 months)

**Purpose:** Local MIDI file support
**Status:** PLANNED - See [ROADMAP-MIDI.md](./ROADMAP-MIDI.md)

**Planned Features:**
- Google Drive integration (user-managed storage)
- Local file system access (File System Access API)
- MIDI playback with Web Audio API
- Lyrics display (synchronized)
- Phase Cancellation for vocal removal (60-70% effective)
- Multi-storage support (Drive, Local, External HDD, NAS)

**Technologies:**
- Web Audio API (MIDI synthesis)
- File System Access API (local files)
- Google Drive API (cloud storage)
- WebDAV Client (network shares)
- IndexedDB (local cache)

---

## 🎨 Design System

### **Color Palette** (DaisyUI Theme)
```
Primary (Brand):     #E11D48 (red-600) - Main actions, CTAs
Success:             #10B981 (green-500) - Active status, confirmations
Warning:             #F59E0B (amber-500) - Alerts, popular badges
Error:               #EF4444 (red-500) - Errors, expired status
Info:                #3B82F6 (blue-500) - Informational

Neutral:
  Base-100:          #FFFFFF (Light mode background)
  Base-200:          #F3F4F6 (Card backgrounds)
  Base-300:          #E5E7EB (Borders)
  Base-Content:      #1F2937 (Text)
```

### **Typography**
```
Headings:
  h1: text-3xl lg:text-4xl font-bold
  h2: text-2xl font-bold (card-title)
  h3: text-xl font-bold

Body:
  Regular: text-base (16px)
  Small: text-sm (14px)
  Tiny: text-xs (12px)
```

### **Spacing Scale** (Tailwind)
```
Components:
  Card padding:     p-6 (24px)
  Section spacing:  space-y-6 (24px gap)
  Grid gap:         gap-4 (16px)
  Icon + Text:      gap-2 (8px)
```

### **Component Patterns**

#### **1. Package Card (Compact)**
```tsx
<div className="rounded-lg border-2 p-4">
  {/* Badge Row */}
  <div className="flex gap-2 mb-3">
    <div className="badge badge-success badge-sm">กำลังใช้งาน</div>
  </div>

  {/* Price & Name */}
  <div className="flex items-center justify-between mb-4">
    <div>
      <div className="font-semibold text-lg">รายเดือน</div>
      <div className="text-sm text-base-content/60">/เดือน</div>
    </div>
    <div className="text-2xl font-bold text-primary">฿99</div>
  </div>

  {/* Features (max 3) */}
  <ul className="space-y-1.5 mb-4">
    <li className="text-xs">• Feature 1</li>
    <li className="text-xs">• Feature 2</li>
    <li className="text-xs">• Feature 3</li>
    <li className="text-xs text-base-content/60">และอีก 2 ฟีเจอร์</li>
  </ul>

  {/* Action Button */}
  <button className="btn btn-primary btn-block btn-sm">
    เลือกแพ็คเกจนี้
  </button>
</div>
```

#### **2. Navigation Bar (Bottom)**
```tsx
// Position: fixed bottom-0, z-50
// Width: full on mobile, w-1/2 on sm and up
// Show on: ALL screen sizes (no lg:hidden)
// Active state: Red bar above icon + text
```

---

## 🗄️ Database Schema

### **Firestore Collections**

#### `/plans/{planId}`
```javascript
{
  displayName: "รายเดือน",
  price: 99,
  duration: "/เดือน",
  features: ["ฟีเจอร์ 1", "ฟีเจอร์ 2"],
  popular: false,
  isActive: true,
  isVisible: true
}
```

#### `/payments/{paymentId}`
```javascript
{
  userId: "uid123",
  plan: "monthly",
  amount: 99,
  status: "pending", // "approved" | "rejected"
  bankName: "ธนาคารกรุงเทพ",
  transferDate: "2025-01-13",
  transferTime: "14:30:00",
  paymentProof: "https://...", // Firebase Storage URL
  note: "หมายเหตุ",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  approvedAt: Timestamp | null,
  approvedBy: "admin_uid" | null
}
```

### **Realtime Database Paths**

#### `/users/{uid}`
```javascript
{
  email: "user@example.com",
  displayName: "John Doe",
  subscription: {
    plan: "monthly",
    status: "active",
    startDate: "2025-01-01T00:00:00.000Z",
    endDate: "2025-02-01T00:00:00.000Z"
  }
}
```

---

## 🔐 Security Rules

### **Firestore Rules**
```javascript
// Plans: Read-only for all
match /plans/{planId} {
  allow read: if true;
  allow write: if request.auth.token.admin == true;
}

// Payments: Users can create their own, admins can update
match /payments/{paymentId} {
  allow create: if request.auth != null;
  allow read: if request.auth.uid == resource.data.userId
              || request.auth.token.admin == true;
  allow update: if request.auth.token.admin == true;
}
```

### **Realtime Database Rules**
```json
{
  "users": {
    "$uid": {
      ".read": "$uid === auth.uid || auth.token.admin === true",
      ".write": "$uid === auth.uid || auth.token.admin === true"
    }
  }
}
```

---

## 🚀 Deployment Strategy

### **Vercel (Frontend & API)**
- **Auto-deploy:** Push to `main` branch
- **Environment Variables:**
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  NEXT_PUBLIC_FIREBASE_PROJECT_ID
  NEXT_PUBLIC_INVIDIOUS_URL

  FIREBASE_PRIVATE_KEY (Server-side only)
  FIREBASE_CLIENT_EMAIL
  FIREBASE_DATABASE_URL
  ```

### **Firebase (Backend)**
- **Firestore:** Plans & Payments
- **Realtime Database:** User data
- **Storage:** Payment proofs
- **Auth:** User authentication

---

## 📊 Performance Targets

```
Metrics:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

Optimization:
- Server-Side Rendering (SSR) for data pages
- Image optimization (Next.js Image)
- Code splitting (Next.js automatic)
- Lazy loading (React.lazy)
```

---

## 🔄 Development Workflow

```
1. Plan (PLANNING.md)
   ↓
2. Task Breakdown (TASK.md)
   ↓
3. Implementation (following CONTRIBUTING.md)
   ↓
4. Testing (manual + user testing)
   ↓
5. Commit & Push (auto-deploy to Vercel)
   ↓
6. Document (KNOWLEDGE.md)
```

---

## 🎯 Success Metrics

### **User Experience**
- [ ] Subscription flow is clear (max 3 steps)
- [ ] Design is consistent across all pages
- [ ] Mobile experience is smooth
- [ ] Page load < 3 seconds

### **Code Quality**
- [ ] No duplicate UI patterns
- [ ] TypeScript errors = 0
- [ ] ESLint warnings < 10
- [ ] Components are reusable

### **Business**
- [ ] Payment approval time < 24 hours
- [ ] Subscription renewal rate > 60%
- [ ] User retention > 50% (month 2)

---

## 🔮 Future Considerations

### **Phase 2: MIDI Support** (3-4 months)
- Google Drive integration
- Local file management
- MIDI player with lyrics
- Commercial version for karaoke shops

### **Phase 3: Analytics** (6+ months)
- User behavior tracking
- Song popularity metrics
- Subscription analytics
- A/B testing framework

### **Phase 4: Social Features** (9+ months)
- User profiles
- Song sharing
- Playlists sharing
- Leaderboards

---

**Document Version:** 1.0
**Last Review:** 2025-01-13
**Next Review:** 2025-02-01
