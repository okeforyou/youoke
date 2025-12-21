# YouOke Architecture Documentation

> **Status:** Phase 0 - Foundation Document
> **Purpose:** Document current architecture and plan future improvements
> **Last Updated:** 2025-12-21

---

## 📋 Table of Contents

1. [Current Architecture](#current-architecture)
2. [Folder Structure](#folder-structure)
3. [Data Flow](#data-flow)
4. [Technology Stack](#technology-stack)
5. [Component Organization](#component-organization)
6. [Service Layer](#service-layer)
7. [State Management](#state-management)
8. [Performance Optimizations](#performance-optimizations)
9. [Planned Improvements](#planned-improvements)

---

## 🏗️ Current Architecture

### Overview

YouOke follows a **hybrid architecture** combining:
- **Next.js Pages Router** for routing and SSR
- **React Context** for global state management
- **Firebase** for backend services (Auth, Firestore, Realtime DB)
- **DaisyUI + Tailwind** for styling
- **React Query** for data fetching and caching

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  (Pages: index, account, pricing, admin/*, etc.)           │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              Component Layer                                 │
│  ┌───────────┐  ┌──────────┐  ┌─────────────────┐          │
│  │ UI        │  │ Layout   │  │ Feature-Specific│          │
│  │ (Button,  │  │ (AppShell│  │ (PackageCard,   │          │
│  │  Card,    │  │  Header) │  │  VideoCard)     │          │
│  │  Input)   │  └──────────┘  └─────────────────┘          │
│  └───────────┘                                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│               Context Layer (Global State)                   │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐       │
│  │ AuthContext  │  │ CastContext │  │ToastContext  │       │
│  │ (User auth)  │  │(Cast state) │  │(Notifications│       │
│  └──────────────┘  └─────────────┘  └──────────────┘       │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                Service Layer                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐        │
│  │userService  │  │paymentService│  │pricingService        │
│  │(User CRUD)  │  │(Payments)    │  │(Plans)      │        │
│  └─────────────┘  └──────────────┘  └─────────────┘        │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                Backend Services                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │ Firebase     │  │ Invidious    │  │ Spotify     │       │
│  │ (Auth, DB)   │  │ (YouTube API)│  │ (Music API) │       │
│  └──────────────┘  └──────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

### Current Structure

```
play.okeforyou.com/
├── components/           # React components
│   ├── ui/              # Reusable UI components (Button, Card, Input)
│   ├── layout/          # Layout components (AppShell, PageHeader)
│   ├── subscription/    # Subscription-specific components
│   ├── admin/           # Admin-specific components
│   └── *.tsx            # Feature components (SearchResultGrid, etc.)
│
├── pages/               # Next.js pages (routing)
│   ├── admin/           # Admin pages (payments, subscriptions, users)
│   ├── api/             # API routes
│   ├── monitor/         # Monitor pages
│   └── *.tsx            # Public pages (index, account, pricing, login)
│
├── context/             # React Context providers
│   ├── AuthContext.tsx  # Authentication state
│   ├── CastContext.tsx  # Cast state (Firebase/YouTube)
│   └── ToastContext.tsx # Toast notifications
│
├── services/            # Business logic and API calls
│   ├── userService.ts   # User operations
│   ├── paymentService.ts # Payment operations
│   ├── pricingService.ts # Pricing/subscription logic
│   └── spotify.ts       # Spotify API integration
│
├── hooks/               # Custom React hooks
│   ├── karaoke.ts       # Karaoke state management
│   ├── myPlaylist.ts    # Playlist management
│   ├── room.ts          # Room state (for multi-user)
│   └── useGuestLimit.ts # Guest limit checking
│
├── types/               # TypeScript type definitions
│   ├── index.ts         # Shared types
│   └── invidious.ts     # Invidious API types
│
├── utils/               # Utility functions
│   ├── api.ts           # API helper functions
│   └── firebase.ts      # Firebase initialization
│
├── styles/              # Global styles
│   └── global.css       # Tailwind + custom CSS
│
├── public/              # Static assets
│   └── assets/          # Images, icons
│
└── const/               # Constants
    └── index.ts         # App constants
```

### Folder Purpose Summary

| Folder | Purpose | Example Files |
|--------|---------|---------------|
| `components/ui/` | Reusable UI primitives | Button.tsx, Card.tsx, Input.tsx |
| `components/layout/` | Layout wrappers | AppShell.tsx, PageHeader.tsx |
| `components/subscription/` | Subscription features | PackageCard.tsx |
| `components/admin/` | Admin features | AdminLayout.tsx, AdminSidebar.tsx |
| `pages/` | Routes and page components | index.tsx, account.tsx, pricing.tsx |
| `pages/admin/` | Admin routes | payments.tsx, users.tsx |
| `pages/api/` | API endpoints | /api/videos, /api/spotify |
| `context/` | Global state providers | AuthContext, ToastContext |
| `services/` | Business logic | userService, paymentService |
| `hooks/` | Custom hooks | karaoke, myPlaylist |
| `types/` | TypeScript types | index.ts, invidious.ts |
| `utils/` | Helper functions | api.ts, firebase.ts |
| `styles/` | Global CSS | global.css |

---

## 🔄 Data Flow

### User Authentication Flow

```
1. User visits app
   ↓
2. AuthContext checks Firebase Auth state
   ↓
3. If authenticated:
   - Load user profile from Firestore
   - Check subscription status (pricingService)
   - Redirect to /account or /
   ↓
4. If not authenticated:
   - Redirect to /login
   - User signs in (email/password or Google)
   - Create/update user profile
   - Redirect to /account
```

### Subscription Purchase Flow

```
1. User selects package on /pricing
   ↓
2. Check authentication (AuthContext)
   ↓
3. Display payment information modal
   ↓
4. User uploads payment slip
   ↓
5. paymentService.submitPayment()
   - Upload slip to Firebase Storage
   - Create payment document in Firestore
   - Status: "pending"
   ↓
6. Admin reviews on /admin/payments
   ↓
7. Admin approves/rejects payment
   ↓
8. Update user subscription in Firestore
   ↓
9. User sees updated status on /account
```

### Video Search & Play Flow

```
1. User searches on homepage (/)
   ↓
2. React Query fetches from Invidious API
   ↓
3. Display results in SearchResultGrid
   ↓
4. User clicks video
   ↓
5. Check guest limit (useGuestLimit hook)
   ↓
6. If allowed:
   - Add to playlist (myPlaylist hook)
   - Update queue display
   - Play video (YoutubePlayer component)
   ↓
7. If Cast enabled:
   - Send to Cast device (CastContext)
```

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 13.5.6 | React framework, SSR, routing |
| **React** | 18.3.1 | UI library |
| **TypeScript** | 4.9.5 | Type safety |
| **Tailwind CSS** | 3.3.6 | Utility-first CSS |
| **DaisyUI** | 2.6.0 | Component library |
| **React Query** | 3.39.3 | Data fetching, caching |
| **Heroicons** | 2.0.14 | Icon library |
| **Zustand** | 4.3.3 | Lightweight state management |

### Backend

| Technology | Purpose |
|------------|---------|
| **Firebase Auth** | User authentication |
| **Firebase Firestore** | NoSQL database (users, payments, plans) |
| **Firebase Realtime DB** | Real-time data (cast state, playlists) |
| **Firebase Storage** | File storage (payment slips, avatars) |
| **Invidious API** | YouTube data proxy |
| **Spotify API** | Music metadata |

### Performance & Optimization

| Technology | Purpose |
|------------|---------|
| **next/image** | Image optimization |
| **@next/bundle-analyzer** | Bundle size analysis |
| **React.lazy()** | Code splitting |
| **Sharp** | Image processing |

---

## 🧩 Component Organization

### Component Hierarchy

```
App (_app.tsx)
└── Context Providers
    ├── AuthContext
    ├── ToastContext
    ├── AdsContext
    └── ConditionalCastProviders
        ├── FirebaseCastContext
        └── YouTubeCastContext
        │
        └── Page Component
            ├── AppShell (Layout)
            │   ├── PageHeader
            │   └── BottomNavigation
            │
            └── Page Content
                ├── SearchResultGrid
                │   ├── VideoCard (Grid/List)
                │   └── SearchResultHorizontalCard
                ├── VideoHorizontalCard (Queue)
                └── YoutubePlayer
```

### Component Types

#### 1. UI Components (Presentational)

**Location:** `components/ui/`

Pure presentational components with no business logic:

```tsx
// Example: Button.tsx
<Button variant="primary" size="lg" loading={isLoading}>
  Save
</Button>
```

**Characteristics:**
- ✅ Accept props
- ✅ No direct Firebase/API calls
- ✅ Reusable across features
- ✅ Fully typed with TypeScript

#### 2. Layout Components

**Location:** `components/layout/`

Structural components for page layout:

```tsx
// Example: AppShell.tsx
<AppShell>
  <PageHeader title="บัญชีของฉัน" />
  <main>{children}</main>
  <BottomNavigation />
</AppShell>
```

#### 3. Feature Components

**Location:** `components/[feature]/` or `components/*.tsx`

Domain-specific components with business logic:

```tsx
// Example: PackageCard.tsx (subscription feature)
<PackageCard
  plan={plan}
  isCurrentPlan={isCurrentPlan}
  onSelect={handleSelectPlan}
/>
```

#### 4. Page Components

**Location:** `pages/*.tsx`

Full pages with data fetching and composition:

```tsx
// Example: account.tsx
export async function getServerSideProps(context) {
  // Fetch user data, payments, subscription
  return { props: { user, payments, subscription } };
}

export default function AccountPage({ user, payments, subscription }) {
  return (
    <AppShell>
      <PageHeader title="บัญชีของฉัน" />
      <SubscriptionStatusCard subscription={subscription} />
      <PaymentHistoryTable payments={payments} />
    </AppShell>
  );
}
```

---

## 🔧 Service Layer

### Service Pattern

All Firebase operations and business logic are centralized in service files:

```typescript
// services/userService.ts
export const userService = {
  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile> {
    const doc = await db.collection('users').doc(userId).get();
    return doc.data() as UserProfile;
  },

  // Update user profile
  async updateUserProfile(userId: string, data: Partial<UserProfile>) {
    await db.collection('users').doc(userId).update(data);
  },

  // ... more methods
};
```

### Current Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **userService** | User operations | getUserProfile, updateUserProfile, createUser |
| **paymentService** | Payment operations | submitPayment, getPaymentHistory, approvePayment |
| **pricingService** | Subscription logic | getPlans, calculateExpiry, checkExpired |
| **spotify** | Spotify API | searchTracks, getArtist, getAlbum |
| **adsServices** | Ad configuration | getAdSettings |

### Service Benefits

✅ **Separation of Concerns** - Business logic separate from UI
✅ **Reusability** - Services can be called from any component/page
✅ **Testability** - Easy to mock and test
✅ **Type Safety** - All methods fully typed
✅ **Error Handling** - Centralized error handling patterns

---

## 🌐 State Management

### Global State (React Context)

We use React Context for app-wide state:

#### 1. AuthContext

```typescript
// Provides:
- user: UserProfile | null
- loading: boolean
- signIn(email, password)
- signOut()
- updateProfile(data)
```

**Usage:** Authentication state across all pages

#### 2. CastContext (Firebase & YouTube)

```typescript
// Provides:
- castState: 'idle' | 'connecting' | 'connected'
- currentVideo: Video | null
- playlist: Video[]
- playVideo(video)
- addToQueue(video)
```

**Usage:** Cast functionality, video playback state

#### 3. ToastContext

```typescript
// Provides:
- success(message)
- error(message)
- warning(message)
- info(message)
```

**Usage:** Global notifications (replaced alert())

### Local State (React Query)

For server data, we use React Query:

```typescript
// Example: Fetch search results
const { data: searchResults, isLoading } = useQuery(
  ['searchResult', searchTerm],
  () => getSearchResult({ q: searchTerm })
);
```

**Benefits:**
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Loading states
- ✅ Error handling

### Component State (useState/Zustand)

For local component state, we use:
- **useState** - Simple local state
- **Zustand** - Complex local state (karaoke mode, playlist)

```typescript
// Example: Zustand store (hooks/karaoke.ts)
export const useKaraokeState = create((set) => ({
  isKaraoke: false,
  searchTerm: '',
  curVideoId: null,
  setKaraokeMode: (mode) => set({ isKaraoke: mode }),
}));
```

---

## ⚡ Performance Optimizations

### Completed Optimizations (Phase 4)

#### 1. Code Splitting (Sprint 17)

```tsx
// Lazy load admin pages
const LazyAdminLayout = dynamic(
  () => import('./components/admin/LazyAdminLayout'),
  { loading: () => <LoadingScreen variant="fullscreen" /> }
);

// Lazy load heavy components
const SearchResultGrid = lazy(() => import('./components/SearchResultGrid'));
```

**Result:** Homepage bundle 69.2 kB → 50.1 kB (-27.6%)

#### 2. Image Optimization (Sprint 18)

```tsx
// Use Next.js Image component
<Image
  src={thumbnail}
  alt={title}
  fill
  sizes="(max-width: 640px) 33vw, 20vw"
  loading={i < 6 ? "eager" : "lazy"}
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..."
/>
```

**Result:** Optimized bandwidth, smooth loading with blur effect

#### 3. Firebase Query Optimization (Sprint 16)

```typescript
// Batch fetch pattern (avoid N+1 queries)
const userIds = [...new Set(payments.map(p => p.userId))];
const userDocs = await Promise.all(
  userIds.map(id => db.collection('users').doc(id).get())
);
const userMap = new Map(userDocs.map(doc => [doc.id, doc.data()]));

// Use cached data
payments.forEach(payment => {
  const user = userMap.get(payment.userId);
  // ...
});
```

**Result:** Queries reduced 201 → 52 (-75%)

#### 4. React Query Caching

```typescript
// Cache search results for 5 minutes
const { data } = useQuery(
  ['searchResult', searchTerm],
  () => getSearchResult({ q: searchTerm }),
  {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  }
);
```

### Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Homepage Bundle | 69.2 kB | 50.1 kB | -27.6% |
| Admin Queries | 201 queries | 52 queries | -75% |
| Lighthouse Score | Unknown | Target: 90+ | TBD |
| First Contentful Paint | Unknown | Target: <2s | TBD |

---

## 🚀 Planned Improvements

### Phase 1: Component Library (Next)

**Goal:** Create comprehensive component library

```
components/ui/
├── Button.tsx      ✅ (exists)
├── Card.tsx        ✅ (exists)
├── Input.tsx       ✅ (exists)
├── Badge.tsx       ✅ (exists)
├── Modal.tsx       ✅ (exists)
├── Alert.tsx       ⏩ (enhance)
├── Tabs.tsx        ⏩ (create)
├── Table.tsx       ⏩ (create)
└── Dropdown.tsx    ⏩ (create)
```

### Phase 2: Utilities & Services (Future)

**Goal:** Centralize utility functions

```
utils/
├── formatting.ts   ⏩ (create)
│   ├── formatCurrency()
│   ├── formatDate()
│   └── formatTimeRemaining()
├── validation.ts   ⏩ (create)
│   ├── validateEmail()
│   └── validatePassword()
└── constants.ts    ⏩ (create)
    ├── SUBSCRIPTION_PLANS
    └── BANK_INFO
```

### Phase 3: Features-Based Structure (Future)

**Goal:** Organize by feature instead of type

```
Current:                    Proposed:
components/                features/
├── ui/                   ├── subscription/
├── layout/               │   ├── components/
├── subscription/         │   ├── hooks/
└── *.tsx                 │   ├── services/
                          │   └── types.ts
services/                 ├── karaoke/
├── userService.ts        │   ├── components/
├── paymentService.ts     │   ├── hooks/
└── ...                   │   └── services/
                          └── admin/
                              ├── components/
                              └── services/
```

**Benefits:**
- ✅ Feature isolation
- ✅ Easier to find related code
- ✅ Better code splitting
- ✅ Clearer dependencies

### Architecture Improvements

#### 1. API Layer Abstraction

Create unified API client:

```typescript
// utils/api-client.ts
export const apiClient = {
  get: (url, config) => axios.get(url, config),
  post: (url, data, config) => axios.post(url, data, config),
  // ... with error handling, retries, etc.
};
```

#### 2. Error Boundary Enhancement

Add error tracking:

```tsx
// components/layout/ErrorBoundary.tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log to error tracking service (e.g., Sentry)
    logError(error, errorInfo);
  }}
>
  {children}
</ErrorBoundary>
```

#### 3. Type Safety Improvements

Create strict types for all APIs:

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export interface UserApiResponse extends ApiResponse<UserProfile> {}
export interface PaymentApiResponse extends ApiResponse<Payment> {}
```

---

## 📈 Scalability Considerations

### Current Capacity

- **Users:** Designed for 100-1000 concurrent users
- **Database:** Firestore (auto-scaling)
- **Storage:** Firebase Storage (auto-scaling)
- **Hosting:** Vercel (auto-scaling)

### Future Scaling Points

1. **Database Indexing**
   - Add composite indexes for complex queries
   - Monitor query performance

2. **CDN for Media**
   - Use Cloudflare/CloudFront for video thumbnails
   - Cache YouTube embeds

3. **API Rate Limiting**
   - Add rate limiting to API routes
   - Prevent abuse

4. **Background Jobs**
   - Move heavy operations to background jobs
   - Use Firebase Functions for async tasks

---

## 🔒 Security Architecture

### Current Security Measures

1. **Authentication**
   - Firebase Auth (secure, industry-standard)
   - Email/password + Google Sign-In

2. **Authorization**
   - Protected routes with AuthContext
   - Admin routes check user role

3. **Data Validation**
   - TypeScript types
   - Form validation on client
   - Server-side validation in API routes

4. **Firestore Security Rules**
   ```javascript
   // Example rules
   match /users/{userId} {
     allow read: if request.auth.uid == userId;
     allow write: if request.auth.uid == userId;
   }

   match /payments/{paymentId} {
     allow read: if request.auth.uid != null;
     allow write: if request.auth.uid != null;
   }
   ```

### Security Improvements Needed

⚠️ **High Priority:**
- [ ] Add CSRF protection to API routes
- [ ] Implement rate limiting
- [ ] Add input sanitization for user-generated content
- [ ] Review and strengthen Firestore security rules

⚠️ **Medium Priority:**
- [ ] Add Content Security Policy (CSP) headers
- [ ] Implement secure session management
- [ ] Add audit logs for admin actions

---

## 📊 Monitoring & Analytics

### Current Monitoring

- **Vercel Analytics:** Basic page views and performance
- **Firebase Console:** Database queries, auth events

### Planned Monitoring

1. **Error Tracking**
   - Add Sentry or similar service
   - Track errors, warnings, performance issues

2. **User Analytics**
   - Track user journeys
   - Monitor conversion funnels
   - A/B testing support

3. **Performance Monitoring**
   - Real User Monitoring (RUM)
   - Core Web Vitals tracking
   - API response times

---

## 🎯 Next Steps

### Immediate (Phase 0 Completion)

- [x] Create DESIGN-SYSTEM.md
- [x] Create ARCHITECTURE.md
- [ ] Create 3 reference components
- [ ] Update REFACTOR-PLAN.md

### Short Term (Phase 1-2)

- [ ] Build complete component library
- [ ] Create utility functions
- [ ] Refactor service layer
- [ ] Add comprehensive testing

### Long Term (Phase 3+)

- [ ] Migrate to features-based structure
- [ ] Add MIDI player functionality
- [ ] Implement advanced caching
- [ ] Build commercial version

---

## 📚 Additional Resources

- [REFACTOR-PLAN.md](REFACTOR-PLAN.md) - Overall refactor strategy
- [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) - Design system documentation
- [FIREBASE-OPTIMIZATION.md](FIREBASE-OPTIMIZATION.md) - Firebase optimization patterns
- [TESTING-CHECKLIST.md](TESTING-CHECKLIST.md) - Testing guidelines
- [PHASE-4-SUMMARY.md](PHASE-4-SUMMARY.md) - Performance optimization results

---

**Last Updated:** 2025-12-21 | **Version:** 1.0.0 | **Status:** ✅ Complete
