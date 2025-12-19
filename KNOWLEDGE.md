# Knowledge Base & Solutions

> Accumulated insights, known issues, and troubleshooting solutions
> Last Updated: 2025-01-13

---

## 🔧 Known Issues & Solutions

### **Subscription Flow Issues**

#### Issue #1: User redirected to /register instead of /payment
**Date:** 2025-01-13
**Status:** ✅ FIXED

**Problem:**
- When existing users clicked "อัพเกรด" (Upgrade) button in account page
- System redirected to `/register?plan=${planId}`
- Existing users don't need to register again

**Root Cause:**
```typescript
// pages/account.tsx:115-117 (OLD)
router.push(`/register?plan=${planId}`);
```

**Solution:**
```typescript
// pages/account.tsx:115-117 (NEW)
router.push(`/payment?plan=${planId}`);
```

**Lesson Learned:**
- Always check user authentication state before routing
- Existing users: `/payment`
- New users: `/register` → `/payment`

---

#### Issue #2: BottomNavigation hidden on large screens
**Date:** 2025-01-13
**Status:** ✅ FIXED

**Problem:**
- Bottom navigation only visible on mobile (`lg:hidden`)
- Users on tablets/desktops couldn't see navigation
- Positioning not stable (used `absolute`)

**Root Cause:**
```typescript
// components/BottomNavigation.tsx:33 (OLD)
<div className="btm-nav absolute bottom-0 w-full sm:w-1/2 h-1/9 text-sm">
```

**Solution:**
```typescript
// components/BottomNavigation.tsx:33 (NEW)
<div className="btm-nav fixed bottom-0 w-full sm:w-1/2 h-1/9 text-sm z-50">
```

**Changes:**
1. `absolute` → `fixed` (stays at bottom even when scrolling)
2. Removed `lg:hidden` (show on ALL devices)
3. Added `z-50` (proper layering above other content)

**Lesson Learned:**
- Use `fixed` for persistent navigation elements
- Don't hide navigation on large screens unless intentional
- Always set z-index for overlays

---

#### Issue #3: Package cards inconsistent across pages
**Date:** 2025-01-13
**Status:** 🟡 IN PROGRESS

**Problem:**
- `/account` page: Compact card design with badges
- `/pricing` page: Different card style
- `/payment` page: Different card style
- `/register` page: Different card style
- No single source of truth

**Impact:**
- Confusing user experience
- Hard to maintain
- Uses excessive tokens to fix repeatedly

**Solution Plan:**
1. Create `components/subscription/PackageCard.tsx`
2. Define 3 variants: Current, Popular, Regular
3. Replace all hardcoded cards with component
4. Document in CONTRIBUTING.md

**Status:** Waiting for Sprint 1 completion

---

### **Firebase & Database Issues**

#### Issue #4: Mixed use of Firestore and Realtime Database
**Date:** Ongoing
**Status:** ⚠️ KNOWN LIMITATION

**Current Setup:**
- **Firestore:** Static data (plans, payments)
- **Realtime DB:** User-specific data (subscriptions, profiles)

**Why This Split:**
- Legacy architecture from original project
- Realtime DB better for live karaoke queue updates
- Firestore better for structured queries (payment history)

**Best Practices:**
- Never duplicate data between both databases
- User subscription: Use Realtime DB as source of truth
- Payment history: Use Firestore
- Plans/Pricing: Use Firestore

**Migration Plan:**
- Not planned for now (works fine)
- If needed: Move everything to Firestore in future sprint

---

### **Design System Issues**

#### Issue #5: No centralized color definitions
**Date:** 2025-01-13
**Status:** 📋 DOCUMENTED (PLANNING.md)

**Problem:**
- Colors hardcoded throughout codebase
- Developers use different shades (primary/90, primary/10, etc.)
- No consistency

**Solution:**
Created design system in PLANNING.md:
```css
Primary: #E11D48 (Rose 600)
Success: #10B981 (Emerald 500)
Warning: #F59E0B (Amber 500)
Error: #EF4444 (Red 500)
```

**Next Step:**
- Document in CONTRIBUTING.md
- Consider creating tailwind.config.js theme extension

---

#### Issue #6: Button sizes inconsistent
**Date:** 2025-01-13
**Status:** 📋 TO DO

**Problem:**
- Some buttons use `btn-sm`
- Some use `btn-md` (default)
- Some use `btn-lg`
- No clear guidelines

**Proposed Standard:**
- Cards: `btn-sm` (compact cards)
- Forms: Default size
- CTAs: `btn-lg` (call-to-action buttons)

**Action:** Document in CONTRIBUTING.md

---

## 💡 Architecture Decisions

### **Decision #1: Why Next.js over React SPA?**
**Date:** Project inception
**Reason:** SEO requirements for karaoke song search

**Benefits:**
- Server-Side Rendering (SSR)
- Better SEO for song pages
- Faster initial page load
- Built-in API routes

**Trade-offs:**
- More complex than CRA
- Need to understand SSR vs CSR
- Cookie-based auth (nookies)

---

### **Decision #2: Why DaisyUI over Material-UI?**
**Date:** Project inception
**Reason:** Faster development, smaller bundle size

**Benefits:**
- Built on Tailwind CSS
- Pre-styled components
- Thai-friendly design
- Easy theme customization

**Trade-offs:**
- Less customizable than MUI
- Smaller community
- Fewer components

---

### **Decision #3: Why Firebase over custom backend?**
**Date:** Project inception
**Reason:** Faster MVP, built-in auth, real-time features

**Benefits:**
- No backend code needed
- Built-in authentication
- Realtime Database for live queue
- Free tier generous for MVP

**Trade-offs:**
- Vendor lock-in
- Complex pricing at scale
- Limited query capabilities

---

## 🐛 Common Errors & Fixes

### **Error #1: "Module not found: Can't resolve '../firebase'"**

**Cause:** Firebase not initialized or wrong import path

**Fix:**
```typescript
// ✅ Correct
import { db, auth } from '../firebase';

// ❌ Wrong
import { db, auth } from './firebase';
```

**Location:** Check relative path from component location

---

### **Error #2: "User is undefined in getServerSideProps"**

**Cause:** Trying to access Firebase client SDK on server

**Fix:**
```typescript
// pages/account.tsx
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cookies = nookies.get(ctx);

  if (!cookies.token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Use Firebase Admin SDK for server-side
  const admin = await import('firebase-admin');
  const decodedToken = await admin.auth().verifyIdToken(cookies.token);

  return {
    props: { uid: decodedToken.uid },
  };
};
```

**Lesson:** Use Firebase Admin SDK on server, Client SDK on browser

---

### **Error #3: "TypeError: Cannot read property 'uid' of null"**

**Cause:** User not logged in, but code assumes user exists

**Fix:**
```typescript
// ✅ Always check user first
if (!user?.uid) {
  router.push('/login');
  return null;
}

// ❌ Don't assume user exists
const userId = user.uid; // Crashes if user is null
```

---

### **Error #4: Tailwind classes not working**

**Cause:** Class names not in safelist, purged in production

**Fix:**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'badge-success',
    'badge-warning',
    'border-success',
    'bg-success/10',
  ],
};
```

**Lesson:** Add dynamic classes to safelist

---

## 📚 Code Patterns & Best Practices

### **Pattern #1: Loading States**

**Always show loading while fetching:**
```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  async function loadData() {
    setLoading(true);
    try {
      const result = await fetchData();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
  loadData();
}, []);

if (loading) {
  return <div className="loading loading-spinner loading-lg"></div>;
}
```

---

### **Pattern #2: Error Handling with Alerts**

**Use Alert component for user feedback:**
```typescript
const successRef = useRef<AlertHandler>(null);
const errorRef = useRef<AlertHandler>(null);

try {
  await doSomething();
  successRef.current?.open();
} catch (error) {
  console.error(error);
  errorRef.current?.open();
}
```

---

### **Pattern #3: Protected Routes**

**Always check auth in useEffect:**
```typescript
useEffect(() => {
  if (!user?.uid) {
    router.push('/login');
  }
}, [user]);
```

---

### **Pattern #4: Date Formatting**

**Use Thai locale for consistency:**
```typescript
// Display date
new Date(subscription.startDate).toLocaleDateString('th-TH', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// Store date (ISO format)
startDate: new Date().toISOString().split('T')[0],
```

---

## 🔒 Security Best Practices

### **Rule #1: Never expose Firebase config with write permissions**

**Always use Firebase Security Rules:**
```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Plans: Read-only for all
    match /plans/{planId} {
      allow read: if true;
      allow write: if false; // Only admin
    }

    // Payments: User can only read own
    match /payments/{paymentId} {
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update, delete: if false; // Only admin
    }
  }
}
```

---

### **Rule #2: Validate user input**

**Never trust client-side data:**
```typescript
// ❌ Bad: No validation
await createPayment({ amount: userInput });

// ✅ Good: Validate first
if (amount <= 0 || amount > 10000) {
  throw new Error('Invalid amount');
}
await createPayment({ amount });
```

---

### **Rule #3: Don't store sensitive data in localStorage**

**Use httpOnly cookies for tokens:**
```typescript
// ✅ Good: Using nookies (httpOnly)
nookies.set(ctx, 'token', idToken, {
  maxAge: 30 * 24 * 60 * 60,
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
});

// ❌ Bad: Accessible by JavaScript
localStorage.setItem('token', idToken);
```

---

## 🎯 Performance Optimizations

### **Optimization #1: Lazy load heavy components**

**Use dynamic imports:**
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div className="loading loading-spinner"></div>,
});
```

---

### **Optimization #2: Optimize images**

**Use Next.js Image component:**
```typescript
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  width={500}
  height={300}
  alt="Description"
  loading="lazy"
/>
```

---

### **Optimization #3: Debounce search input**

**Don't query on every keystroke:**
```typescript
import { useDebounce } from '../hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## 📖 Resources & References

### **Official Documentation**
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [DaisyUI](https://daisyui.com/)

### **Internal Documentation**
- [PLANNING.md](./PLANNING.md) - System Architecture Blueprint
- [TASK.md](./TASK.md) - Current Sprint & Tasks
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development Guidelines

### **External Tools**
- [SuperClaude Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework)
- [Invidious API](https://docs.invidious.io/)

---

## 🔄 Migration Notes

### **From Old Account Page to New Design (2025-01-13)**

**What Changed:**
1. Package cards: Full-width → Grid layout
2. Added status badges (กำลังใช้งาน, คุ้มที่สุด)
3. Button text: "สมัครแพ็คเกจนี้" → "เลือกแพ็คเกจนี้"
4. Redirect: `/register` → `/payment`

**Why:**
- Better mobile UX (compact cards)
- Visual feedback (badges)
- Correct user flow (payment, not register)

---

## 📝 TODO: Document Later

### **Items to add to KNOWLEDGE.md:**
- [ ] Invidious API usage patterns
- [ ] Video thumbnail fallback logic
- [ ] Queue management best practices
- [ ] Realtime Database sync patterns
- [ ] Payment verification workflow
- [ ] Admin dashboard queries

---

**Document Version:** 1.0
**Last Updated:** 2025-01-13
**Next Review:** 2025-01-20
