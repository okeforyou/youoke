# Contributing Guidelines

> Development standards, design system, and best practices for Oke for You karaoke application
> Last Updated: 2025-01-13

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Design System](#design-system)
3. [Code Standards](#code-standards)
4. [Component Guidelines](#component-guidelines)
5. [Git Workflow](#git-workflow)
6. [Testing Requirements](#testing-requirements)
7. [Performance Guidelines](#performance-guidelines)

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 16+ and npm
- Git
- Firebase account (for local development)

### **Local Setup**
```bash
# 1. Clone repository
git clone https://github.com/yourusername/play.okeforyou.com
cd play.okeforyou.com

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config

# 4. Run development server
npm run dev
```

### **Environment Variables**
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=xxx
NEXT_PUBLIC_FIREBASE_DATABASE_URL=xxx

# Invidious API
NEXT_PUBLIC_INVIDIOUS_URL=https://invidious.example.com

# Optional: Analytics
NEXT_PUBLIC_GA_ID=xxx
```

---

## 🎨 Design System

### **Color Palette**

#### **Primary Colors**
```css
/* Brand Colors */
--color-primary: #E11D48;        /* Rose 600 - Main CTA, Links */
--color-primary-light: #FB7185;  /* Rose 400 - Hover states */
--color-primary-dark: #BE123C;   /* Rose 700 - Active states */

/* Semantic Colors */
--color-success: #10B981;        /* Emerald 500 - Success states */
--color-warning: #F59E0B;        /* Amber 500 - Warnings */
--color-error: #EF4444;          /* Red 500 - Errors */
--color-info: #3B82F6;           /* Blue 500 - Info messages */
```

#### **Neutral Colors**
```css
/* DaisyUI base-content (text) */
--text-primary: rgba(0,0,0,0.87);    /* Default text */
--text-secondary: rgba(0,0,0,0.60);  /* Secondary text */
--text-disabled: rgba(0,0,0,0.38);   /* Disabled text */

/* Backgrounds */
--bg-base-100: #ffffff;              /* Main background */
--bg-base-200: #f3f4f6;              /* Secondary background */
--bg-base-300: #e5e7eb;              /* Tertiary background */
```

#### **Usage Guidelines**

**Primary (#E11D48):**
- Main CTAs (Subscribe, Upgrade, Confirm)
- Active states (selected nav items)
- Important badges (Popular plan)
- Links and interactive elements

**Success (#10B981):**
- Current subscription badge
- Success messages
- Active plan card border
- Confirmation buttons

**Warning (#F59E0B):**
- Popular plan badge
- Important notices
- Nearly expired subscription

**Error (#EF4444):**
- Error messages
- Destructive actions (Delete)
- Validation errors

---

### **Typography**

#### **Font Family**
```css
font-family: 'Noto Sans Thai', 'Inter', system-ui, sans-serif;
```

#### **Type Scale**
```css
/* Headings */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }  /* 30px - H1 */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }       /* 24px - H2 */
.text-xl  { font-size: 1.25rem; line-height: 1.75rem; }   /* 20px - H3 */
.text-lg  { font-size: 1.125rem; line-height: 1.75rem; }  /* 18px - H4 */

/* Body */
.text-base { font-size: 1rem; line-height: 1.5rem; }      /* 16px - Default */
.text-sm   { font-size: 0.875rem; line-height: 1.25rem; } /* 14px - Small */
.text-xs   { font-size: 0.75rem; line-height: 1rem; }     /* 12px - Tiny */
```

#### **Font Weights**
```css
.font-bold      { font-weight: 700; }  /* Headings, emphasis */
.font-semibold  { font-weight: 600; }  /* Sub-headings, labels */
.font-medium    { font-weight: 500; }  /* Buttons, badges */
.font-normal    { font-weight: 400; }  /* Body text */
```

#### **Usage Guidelines**

**Headings:**
- H1 (text-3xl): Page titles
- H2 (text-2xl): Section headings
- H3 (text-xl): Subsection headings
- H4 (text-lg): Card titles

**Body:**
- text-base: Main content, form labels
- text-sm: Secondary info, helper text
- text-xs: Captions, badges, metadata

---

### **Spacing System**

#### **Base Unit: 0.25rem (4px)**

```css
/* Padding/Margin Scale */
.p-1  { padding: 0.25rem; }   /* 4px */
.p-2  { padding: 0.5rem; }    /* 8px */
.p-3  { padding: 0.75rem; }   /* 12px */
.p-4  { padding: 1rem; }      /* 16px */
.p-5  { padding: 1.25rem; }   /* 20px */
.p-6  { padding: 1.5rem; }    /* 24px */
.p-8  { padding: 2rem; }      /* 32px */
.p-10 { padding: 2.5rem; }    /* 40px */

/* Gap for Flexbox/Grid */
.gap-1  { gap: 0.25rem; }     /* 4px */
.gap-2  { gap: 0.5rem; }      /* 8px */
.gap-3  { gap: 0.75rem; }     /* 12px */
.gap-4  { gap: 1rem; }        /* 16px */
.gap-6  { gap: 1.5rem; }      /* 24px */
.gap-8  { gap: 2rem; }        /* 32px */
```

#### **Component Spacing Standards**

**Cards:**
```typescript
<div className="card bg-base-100 shadow-xl">
  <div className="card-body p-6">  {/* 24px padding */}
    {/* Content with gap-4 between sections */}
  </div>
</div>
```

**Forms:**
```typescript
<form className="space-y-4">  {/* 16px gap between fields */}
  <div className="form-control">
    <label className="label">
      <span className="label-text">ชื่อ</span>
    </label>
    <input className="input input-bordered" />
  </div>
</form>
```

**Grids:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 16px gap between grid items */}
</div>
```

---

### **Component Patterns**

#### **Package Card Component**

**Three Variants:**

1. **Current Plan** (User's active subscription)
```typescript
<div className="relative cursor-pointer rounded-lg border-2 border-success bg-success/10 p-4 transition-all">
  {/* Badge Row */}
  <div className="flex gap-2 mb-3">
    <div className="badge badge-success badge-sm px-2 py-1 font-medium">
      กำลังใช้งาน
    </div>
  </div>

  {/* Price & Name */}
  <div className="flex items-center justify-between mb-4">
    <div>
      <div className="font-semibold text-lg">รายเดือน</div>
      <div className="text-sm text-base-content/60">/เดือน</div>
    </div>
    <div className="text-2xl font-bold text-primary">฿99</div>
  </div>

  {/* Features (show only first 3) */}
  <ul className="space-y-1.5 mb-4">
    {plan.features.slice(0, 3).map((feature, i) => (
      <li key={i} className="text-xs flex items-start gap-1">
        <span className="text-success mt-0.5">•</span>
        <span>{feature}</span>
      </li>
    ))}
  </ul>

  {/* Action Button */}
  <button
    disabled
    className="btn btn-success btn-block btn-sm opacity-50 cursor-not-allowed"
  >
    แพ็คเกจปัจจุบัน
  </button>
</div>
```

2. **Popular Plan** (Highlighted/Recommended)
```typescript
<div className="relative cursor-pointer rounded-lg border-2 border-primary bg-primary/5 p-4 transition-all hover:border-primary hover:shadow-lg">
  {/* Badge Row */}
  <div className="flex gap-2 mb-3">
    <div className="badge badge-warning badge-sm px-2 py-1 font-medium">
      คุ้มที่สุด
    </div>
  </div>

  {/* Price & Name */}
  <div className="flex items-center justify-between mb-4">
    <div>
      <div className="font-semibold text-lg">รายปี</div>
      <div className="text-sm text-base-content/60">/ปี</div>
    </div>
    <div className="text-2xl font-bold text-primary">฿999</div>
  </div>

  {/* Features (show only first 3) */}
  <ul className="space-y-1.5 mb-4">
    {plan.features.slice(0, 3).map((feature, i) => (
      <li key={i} className="text-xs flex items-start gap-1">
        <span className="text-primary mt-0.5">•</span>
        <span>{feature}</span>
      </li>
    ))}
  </ul>

  {/* Action Button */}
  <button
    onClick={() => handleSelectPlan(plan.id)}
    className="btn btn-primary btn-block btn-sm"
  >
    เลือกแพ็คเกจนี้
  </button>
</div>
```

3. **Regular Plan**
```typescript
<div className="relative cursor-pointer rounded-lg border-2 border-base-300 bg-base-100 p-4 transition-all hover:border-primary/50 hover:shadow-md">
  {/* No badges for regular plans */}

  {/* Price & Name */}
  <div className="flex items-center justify-between mb-4">
    <div>
      <div className="font-semibold text-lg">แพ็คเกจฟรี</div>
      <div className="text-sm text-base-content/60">ฟรี</div>
    </div>
    <div className="text-2xl font-bold text-primary">฿0</div>
  </div>

  {/* Features (show only first 3) */}
  <ul className="space-y-1.5 mb-4">
    {plan.features.slice(0, 3).map((feature, i) => (
      <li key={i} className="text-xs flex items-start gap-1">
        <span className="text-base-content/40 mt-0.5">•</span>
        <span>{feature}</span>
      </li>
    ))}
  </ul>

  {/* Action Button */}
  <button
    onClick={() => handleSelectPlan(plan.id)}
    className="btn btn-outline btn-primary btn-block btn-sm"
  >
    เลือกแพ็คเกจนี้
  </button>
</div>
```

**Key Design Rules:**
- Border: 2px solid
- Padding: p-4 (16px)
- Border radius: rounded-lg (0.5rem / 8px)
- Transition: transition-all
- Features: Show max 3 items
- Button: btn-block btn-sm
- Badge: badge-sm px-2 py-1

---

#### **Button Component**

**Size Standards:**

```typescript
// Small buttons (package cards, compact UIs)
<button className="btn btn-sm">Small Button</button>

// Default buttons (forms, general actions)
<button className="btn">Default Button</button>

// Large buttons (CTAs, important actions)
<button className="btn btn-lg">Large Button</button>
```

**Variant Standards:**

```typescript
// Primary CTA
<button className="btn btn-primary">Subscribe Now</button>

// Secondary action
<button className="btn btn-outline btn-primary">Learn More</button>

// Success action
<button className="btn btn-success">Confirm</button>

// Destructive action
<button className="btn btn-error">Delete</button>

// Disabled state
<button className="btn btn-primary" disabled>Processing...</button>

// Loading state
<button className="btn btn-primary">
  <span className="loading loading-spinner"></span>
  Loading...
</button>
```

**Block Buttons (Full Width):**
```typescript
<button className="btn btn-primary btn-block">
  Full Width Button
</button>
```

---

#### **Badge Component**

**Status Badges:**

```typescript
// Current subscription (Success)
<div className="badge badge-success badge-sm px-2 py-1 font-medium">
  กำลังใช้งาน
</div>

// Popular/Recommended (Warning)
<div className="badge badge-warning badge-sm px-2 py-1 font-medium">
  คุ้มที่สุด
</div>

// Pending approval (Info)
<div className="badge badge-info badge-sm px-2 py-1 font-medium">
  รอตรวจสอบ
</div>

// Expired (Error)
<div className="badge badge-error badge-sm px-2 py-1 font-medium">
  หมดอายุ
</div>
```

**Size Guide:**
- badge-sm: Package cards, compact lists
- (default): Regular lists
- badge-lg: Prominent status displays

---

#### **Navigation Components**

**Bottom Navigation:**

```typescript
<div className="btm-nav fixed bottom-0 w-full sm:w-1/2 h-1/9 text-sm z-50">
  <button className={`text-primary shrink ${isActive ? "active" : ""}`}>
    <MusicalNoteIcon className="w-6 h-6" />
    <span className="btm-nav-label">แนะนำ</span>
  </button>
</div>
```

**Key Rules:**
- Position: fixed (not absolute)
- Z-index: z-50 (above content)
- Width: Full on mobile, half on desktop
- Icon size: w-6 h-6 (24px)
- Text: text-sm

---

### **Responsive Design**

#### **Breakpoints**
```css
/* Tailwind CSS default breakpoints */
sm: 640px   /* Small devices (tablets) */
md: 768px   /* Medium devices (small laptops) */
lg: 1024px  /* Large devices (laptops) */
xl: 1280px  /* Extra large devices (desktops) */
2xl: 1536px /* 2X large devices (large desktops) */
```

#### **Grid Patterns**

**Package Cards Grid:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>
```

**Content Layout:**
```typescript
<div className="container mx-auto px-4 max-w-6xl">
  {/* Centered container with max width */}
</div>
```

**Form Layout:**
```typescript
<div className="w-full max-w-md mx-auto">
  {/* Centered form with max width 448px */}
</div>
```

---

### **Loading States**

#### **Spinner Loading:**
```typescript
{loading && (
  <div className="flex items-center justify-center min-h-screen">
    <div className="loading loading-spinner loading-lg text-primary"></div>
  </div>
)}
```

#### **Button Loading:**
```typescript
<button className="btn btn-primary" disabled={loading}>
  {loading ? (
    <>
      <span className="loading loading-spinner"></span>
      กำลังโหลด...
    </>
  ) : (
    "ยืนยัน"
  )}
</button>
```

#### **Skeleton Loading:**
```typescript
<div className="space-y-4">
  <div className="skeleton h-32 w-full"></div>
  <div className="skeleton h-32 w-full"></div>
  <div className="skeleton h-32 w-full"></div>
</div>
```

---

## 💻 Code Standards

### **TypeScript**

#### **Always use TypeScript**
```typescript
// ✅ Good: Typed props
interface PackageCardProps {
  plan: PricingPackage;
  isCurrentPlan: boolean;
  onSelect: (planId: string) => void;
}

// ❌ Bad: No types
function PackageCard(props) {
  // ...
}
```

#### **Use interfaces for data structures**
```typescript
// types/subscription.ts
export interface PricingPackage {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular: boolean;
}

export type SubscriptionPlan = "free" | "monthly" | "yearly" | "lifetime";
export type SubscriptionStatus = "active" | "inactive" | "expired" | "pending";
```

#### **Avoid `any`, use proper types**
```typescript
// ✅ Good
const handleSubmit = async (data: FormData): Promise<void> => {
  // ...
};

// ❌ Bad
const handleSubmit = async (data: any): Promise<any> => {
  // ...
};
```

---

### **React Best Practices**

#### **Functional Components Only**
```typescript
// ✅ Good: Functional component
export default function AccountPage() {
  return <div>Account</div>;
}

// ❌ Bad: Class component (deprecated)
class AccountPage extends React.Component {
  render() {
    return <div>Account</div>;
  }
}
```

#### **Use Hooks Properly**
```typescript
// ✅ Good: Hooks at top level
function MyComponent() {
  const [data, setData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  return <div>{data}</div>;
}

// ❌ Bad: Hooks in conditionals
function MyComponent() {
  if (condition) {
    const [data, setData] = useState(null); // ERROR!
  }
}
```

#### **Extract Complex Logic to Custom Hooks**
```typescript
// hooks/useSubscription.ts
export function useSubscription(userId: string) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load subscription
  }, [userId]);

  return { subscription, loading };
}

// Usage
function AccountPage() {
  const { subscription, loading } = useSubscription(user.uid);
}
```

---

### **File Naming Conventions**

```
pages/
  index.tsx              # Homepage
  account.tsx            # Account page
  pricing.tsx            # Pricing page
  payment.tsx            # Payment page

components/
  BottomNavigation.tsx   # PascalCase for components
  Alert.tsx
  subscription/
    PackageCard.tsx      # Grouped by feature

services/
  userService.ts         # camelCase for services
  paymentService.ts
  pricingService.ts

types/
  subscription.ts        # camelCase for types
  user.ts

hooks/
  useAuth.ts            # camelCase with 'use' prefix
  useKaraokeState.ts

utils/
  formatDate.ts         # camelCase for utilities
  validators.ts
```

---

### **Import Organization**

```typescript
// 1. External libraries
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

// 2. UI libraries
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

// 3. Internal modules
import { useAuth } from '../context/AuthContext';
import { getPricingPackage } from '../services/pricingService';
import Alert from '../components/Alert';

// 4. Types
import { PricingPackage, SubscriptionPlan } from '../types/subscription';
```

---

### **Error Handling**

#### **Always use try-catch for async operations**
```typescript
async function loadData() {
  setLoading(true);
  try {
    const result = await fetchData();
    setData(result);
  } catch (error) {
    console.error('Error loading data:', error);
    errorRef.current?.open();
  } finally {
    setLoading(false);
  }
}
```

#### **Provide user feedback**
```typescript
// Show success
successRef.current?.open();

// Show error
errorRef.current?.open();

// Redirect after action
setTimeout(() => {
  router.push('/');
}, 2000);
```

---

## 🧩 Component Guidelines

### **Component Structure**

```typescript
// 1. Imports
import { useRouter } from 'next/router';
import { useState } from 'react';

// 2. Types/Interfaces
interface MyComponentProps {
  title: string;
  onSubmit: () => void;
}

// 3. Component
export default function MyComponent({ title, onSubmit }: MyComponentProps) {
  // 4. Hooks
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 5. Event handlers
  const handleClick = () => {
    // ...
  };

  // 6. Effects
  useEffect(() => {
    // ...
  }, []);

  // 7. Render logic
  if (loading) {
    return <div className="loading loading-spinner"></div>;
  }

  // 8. JSX
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Click</button>
    </div>
  );
}
```

---

### **Component Checklist**

Before creating a new component, ask:

- [ ] Is this component reusable across multiple pages?
- [ ] Does it have a single, clear responsibility?
- [ ] Are props properly typed with TypeScript?
- [ ] Does it handle loading and error states?
- [ ] Is it responsive (mobile-first)?
- [ ] Does it follow the design system?
- [ ] Is it accessible (keyboard navigation, ARIA)?

---

## 🔄 Git Workflow

### **Branch Naming**

```bash
# Features
feature/add-midi-player
feature/google-drive-integration

# Bug fixes
fix/subscription-redirect
fix/bottom-nav-positioning

# Refactoring
refactor/extract-package-card
refactor/standardize-colors

# Documentation
docs/update-readme
docs/add-design-system
```

### **Commit Messages**

**Format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change (no functionality change)
- `style`: Formatting, UI changes
- `docs`: Documentation
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat: Add package status badges to account page"

git commit -m "fix: Redirect existing users to payment instead of register"

git commit -m "refactor: Extract PackageCard to reusable component"

git commit -m "style: Update button sizes to match design system"

git commit -m "docs: Add CONTRIBUTING.md with design system guidelines"
```

---

### **Pull Request Template**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Changes Made
- Change 1
- Change 2

## Screenshots (if UI changes)
[Add screenshots]

## Checklist
- [ ] Code follows design system
- [ ] TypeScript types added
- [ ] Responsive on mobile
- [ ] No console errors
- [ ] Tested manually
```

---

## ✅ Testing Requirements

### **Manual Testing Checklist**

Before committing:

- [ ] No TypeScript errors (`npm run build`)
- [ ] No console errors in browser
- [ ] Responsive on mobile (Chrome DevTools)
- [ ] Tested in Chrome and Safari
- [ ] Loading states work correctly
- [ ] Error states show proper messages
- [ ] Authentication flows work
- [ ] Database operations succeed

---

### **Test Scenarios**

**Subscription Flow:**
1. Free user → Upgrade to paid plan
2. Paid user → View current subscription
3. Expired user → Renew subscription
4. Anonymous user → Register with plan

**Payment Flow:**
1. Upload payment proof
2. Admin approval
3. Subscription activation

**Authentication:**
1. Email/password registration
2. Google OAuth registration
3. Login
4. Logout

---

## ⚡ Performance Guidelines

### **Next.js Optimization**

```typescript
// Use Next.js Image
import Image from 'next/image';

<Image
  src="/thumbnail.jpg"
  width={320}
  height={180}
  alt="Video thumbnail"
  loading="lazy"
/>

// Use dynamic imports for heavy components
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => <div className="loading loading-spinner"></div>,
});
```

---

### **Performance Targets**

- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.8s
- **Bundle Size:** < 200KB (gzipped)

---

## 📞 Getting Help

### **Documentation**
- [PLANNING.md](./PLANNING.md) - System Architecture
- [TASK.md](./TASK.md) - Current Tasks & Sprint
- [KNOWLEDGE.md](./KNOWLEDGE.md) - Known Issues & Solutions

### **External Resources**
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [DaisyUI Components](https://daisyui.com/components/)
- [Firebase Docs](https://firebase.google.com/docs)

---

**Document Version:** 1.0
**Last Updated:** 2025-01-13
**Next Review:** 2025-01-20
