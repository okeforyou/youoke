# YouOke Design System

> **Status:** Phase 0 - Foundation Document
>
> **Purpose:** Single source of truth for all design decisions, ensuring consistency across the app
>
> **Last Updated:** 2025-12-21

---

## 🎨 Brand Identity

### Project Name
**YouOke** - YouTube Karaoke Platform (Home Version)

### Design Philosophy
- **Mobile-First:** Designed for mobile devices, scales to desktop
- **Simple & Clean:** Minimal UI, focus on content (songs/videos)
- **Fast & Responsive:** Optimized for performance
- **Thai-Friendly:** Support Thai typography and language

---

## 🎨 Color Palette

### Primary Colors

Our color system is built on **DaisyUI** theme with custom primary color.

```css
/* Primary - Red (Brand Color) */
--primary: #ef4444;        /* red-500 - Main brand color */
--primary-focus: #dc2626;  /* red-600 - Hover/Active state */
--primary-light: #fef2f2;  /* red-50 - Light background */

/* Secondary - Gray (Supporting Color) */
--secondary: #6b7280;      /* gray-500 - Secondary actions */
--secondary-focus: #4b5563; /* gray-600 - Hover state */

/* Base Colors (from DaisyUI Light theme) */
--base-100: #ffffff;       /* Background */
--base-200: #f9fafb;       /* Slightly darker background */
--base-300: #e5e7eb;       /* Border color */
--base-content: #1f2937;   /* Text on base background */
```

### Semantic Colors

Colors that convey meaning in the UI:

```css
/* Success - Green */
--success: #10b981;        /* green-500 - Success states */
--success-content: #ffffff; /* Text on success background */

/* Error - Red */
--error: #ef4444;          /* red-500 - Error states */
--error-content: #ffffff;   /* Text on error background */

/* Warning - Yellow */
--warning: #f59e0b;        /* amber-500 - Warning states */
--warning-content: #ffffff; /* Text on warning background */

/* Info - Blue */
--info: #3b82f6;           /* blue-500 - Info states */
--info-content: #ffffff;    /* Text on info background */
```

### Usage Guidelines

| Color | Usage | Example |
|-------|-------|---------|
| **Primary** | CTAs, active states, brand elements | "เลือกแพ็กเกจ" button, active nav item |
| **Secondary** | Secondary actions, less important elements | "ยกเลิก" button |
| **Success** | Confirmations, success messages | Payment approved toast |
| **Error** | Errors, destructive actions | Delete button, error toast |
| **Warning** | Warnings, caution | Subscription expiring soon |
| **Info** | Informational messages | Tips, hints |

---

## 📝 Typography

### Font Family

```css
font-family: "IBM Plex Sans Thai Looped", sans-serif;
```

**Why IBM Plex Sans Thai Looped?**
- ✅ Beautiful Thai glyphs (clear, modern, looped style)
- ✅ Excellent readability on mobile screens
- ✅ Good Latin support for English text
- ✅ Free and open source

### Type Scale

Based on **Tailwind CSS** default scale with semantic naming:

| Element | Class | Size | Line Height | Weight | Usage |
|---------|-------|------|-------------|--------|-------|
| **H1** | `text-3xl` | 30px (1.875rem) | 36px (1.2) | 700 (bold) | Page titles |
| **H2** | `text-2xl` | 24px (1.5rem) | 32px (1.33) | 600 (semibold) | Section titles |
| **H3** | `text-xl` | 20px (1.25rem) | 28px (1.4) | 600 (semibold) | Card titles |
| **H4** | `text-lg` | 18px (1.125rem) | 28px (1.56) | 600 (semibold) | Subsection titles |
| **Body** | `text-base` | 16px (1rem) | 24px (1.5) | 400 (normal) | Body text |
| **Small** | `text-sm` | 14px (0.875rem) | 20px (1.43) | 400 (normal) | Helper text, labels |
| **Tiny** | `text-xs` | 12px (0.75rem) | 16px (1.33) | 400 (normal) | Captions, meta info |

### Font Weights

```css
font-weight: 400; /* normal - Body text */
font-weight: 500; /* medium - Emphasized text */
font-weight: 600; /* semibold - Headings, buttons */
font-weight: 700; /* bold - Important headings */
```

### Usage Examples

```tsx
{/* Page Title */}
<h1 className="text-3xl font-bold text-gray-900">บัญชีของฉัน</h1>

{/* Section Title */}
<h2 className="text-2xl font-semibold text-gray-900">แพ็กเกจปัจจุบัน</h2>

{/* Card Title */}
<h3 className="text-xl font-semibold">แพ็กเกจ Free</h3>

{/* Body Text */}
<p className="text-base text-gray-700">ข้อความเนื้อหาทั่วไป</p>

{/* Helper Text */}
<span className="text-sm text-gray-500">ข้อความช่วยเหลือ</span>

{/* Caption */}
<span className="text-xs text-gray-400">อัปเดตล่าสุด: 21 ธ.ค. 2568</span>
```

---

## 📏 Spacing System

Based on **Tailwind CSS** spacing scale (4px base unit):

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px (0.25rem) | Tight spacing, icon gaps |
| `sm` | 8px (0.5rem) | Small gaps between elements |
| `md` | 16px (1rem) | Default spacing, gaps |
| `lg` | 24px (1.5rem) | Section spacing |
| `xl` | 32px (2rem) | Large section spacing |
| `2xl` | 48px (3rem) | Page sections |

### Padding/Margin Classes

```css
/* Padding */
p-1  /* 4px */
p-2  /* 8px */
p-4  /* 16px */
p-6  /* 24px */
p-8  /* 32px */

/* Margin */
m-1  /* 4px */
m-2  /* 8px */
m-4  /* 16px */
m-6  /* 24px */
m-8  /* 32px */

/* Gap (for flex/grid) */
gap-1  /* 4px */
gap-2  /* 8px */
gap-4  /* 16px */
gap-6  /* 24px */
```

### Layout Spacing Guidelines

| Context | Spacing | Example |
|---------|---------|---------|
| **Icons to Text** | `gap-2` (8px) | Button with icon |
| **Form Fields** | `gap-4` (16px) | Vertical spacing between inputs |
| **Card Padding** | `p-4` to `p-6` (16-24px) | Card body padding |
| **Section Spacing** | `mb-6` to `mb-8` (24-32px) | Between page sections |
| **Page Padding** | `p-4` (16px mobile), `p-6` (24px desktop) | Container padding |

---

## 🎭 Component Patterns

### Button Variants

We use **DaisyUI** button classes with standardized patterns:

```tsx
{/* Primary - Main CTAs */}
<button className="btn btn-primary">เลือกแพ็กเกจ</button>

{/* Secondary - Less important actions */}
<button className="btn btn-secondary">ดูรายละเอียด</button>

{/* Success - Positive actions */}
<button className="btn btn-success">อนุมัติ</button>

{/* Error - Destructive actions */}
<button className="btn btn-error">ลบ</button>

{/* Outline - Alternative style */}
<button className="btn btn-outline btn-primary">ยกเลิก</button>

{/* Ghost - Minimal style */}
<button className="btn btn-ghost">ปิด</button>
```

**Button Sizes:**

```tsx
<button className="btn btn-sm">Small</button>
<button className="btn">Default (Medium)</button>
<button className="btn btn-lg">Large</button>
```

**Button States:**

```tsx
{/* Loading */}
<button className="btn btn-primary">
  <span className="loading loading-spinner loading-sm"></span>
  กำลังโหลด...
</button>

{/* Disabled */}
<button className="btn btn-primary" disabled>ปิดการใช้งาน</button>

{/* Full Width */}
<button className="btn btn-primary btn-block">เต็มความกว้าง</button>
```

### Card Variants

Cards are the primary content containers:

```tsx
{/* Default - Standard card with shadow and border */}
<div className="card bg-white shadow-xl border border-base-300">
  <div className="card-body">
    <h2 className="card-title">Title</h2>
    <p>Content</p>
  </div>
</div>

{/* Elevated - Deeper shadow, no border */}
<div className="card bg-white shadow-2xl">
  <div className="card-body">Content</div>
</div>

{/* Bordered - Border only, minimal shadow */}
<div className="card bg-white border border-base-300">
  <div className="card-body">Content</div>
</div>

{/* Gradient - Highlight/CTA cards */}
<div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
  <div className="card-body">Highlighted content</div>
</div>
```

**Card with Hover Effect:**

```tsx
<div className="card bg-white shadow-sm hover:shadow-xl transition-shadow cursor-pointer">
  <div className="card-body">Interactive card</div>
</div>
```

### Input Fields

Consistent form input styling:

```tsx
{/* Text Input */}
<div className="form-control">
  <label className="label">
    <span className="label-text">ชื่อ</span>
  </label>
  <input
    type="text"
    className="input input-bordered w-full"
    placeholder="กรอกชื่อ"
  />
  <label className="label">
    <span className="label-text-alt text-gray-500">ข้อความช่วยเหลือ</span>
  </label>
</div>

{/* Input with Error */}
<input
  type="email"
  className="input input-bordered input-error w-full"
/>
<span className="text-sm text-error">อีเมลไม่ถูกต้อง</span>

{/* Input Sizes */}
<input className="input input-bordered input-sm" />
<input className="input input-bordered" /> {/* default */}
<input className="input input-bordered input-lg" />
```

### Badge Variants

Small labels and status indicators:

```tsx
{/* Status Badges */}
<span className="badge badge-primary">Active</span>
<span className="badge badge-success">Approved</span>
<span className="badge badge-error">Expired</span>
<span className="badge badge-warning">Pending</span>

{/* Sizes */}
<span className="badge badge-sm">Small</span>
<span className="badge">Default</span>
<span className="badge badge-lg">Large</span>

{/* Outline */}
<span className="badge badge-outline badge-primary">Outlined</span>
```

### Modal Pattern

```tsx
{/* DaisyUI Modal */}
<dialog className="modal modal-bottom sm:modal-middle">
  <div className="modal-box">
    <h3 className="font-bold text-lg">Modal Title</h3>
    <p className="py-4">Modal content</p>
    <div className="modal-action">
      <button className="btn">Close</button>
    </div>
  </div>
</dialog>
```

---

## ✨ Animations & Transitions

### Animation Timings

We use **3 standard durations** for consistency:

| Speed | Duration | Use Case |
|-------|----------|----------|
| **Fast** | 150ms | Micro-interactions (hover, focus) |
| **Normal** | 300ms | Standard transitions (cards, modals) |
| **Slow** | 500ms | Page transitions, complex animations |

### Global Transition Utilities

Applied to all interactive elements in `global.css`:

```css
/* All interactive elements have smooth transitions */
button, a, input, select, textarea {
  @apply transition-all duration-200 ease-in-out;
}
```

### Hover Effects

**Card Hover:**

```tsx
<div className="card-hover">
  {/* Applies: hover:shadow-xl hover:-translate-y-1 */}
</div>
```

**Button Hover:**

```tsx
<button className="btn btn-primary btn-hover">
  {/* Applies: hover:scale-105 active:scale-95 */}
</button>
```

### Keyframe Animations

#### Fade In

```tsx
<div className="animate-fade-in">
  {/* Fades in from 0.95 scale */}
</div>
```

#### Smooth Fade In

```tsx
<div className="animate-smooth-fade-in">
  {/* Fades in with translateY(10px) */}
</div>
```

#### Slide In (Toasts)

```tsx
<div className="animate-slide-in-right">
  {/* Slides in from right */}
</div>
```

#### Scale In (Modals)

```tsx
<div className="animate-scale-in">
  {/* Scales from 0.9 to 1.0 */}
</div>
```

#### Gentle Pulse (Loading)

```tsx
<div className="animate-gentle-pulse">
  {/* Gentle opacity pulse */}
</div>
```

### Usage Guidelines

| Animation | When to Use | Example |
|-----------|-------------|---------|
| **Fade In** | Page loads, content appearing | New search results |
| **Slide In** | Notifications, toasts | Success message |
| **Scale In** | Modals, popups | Confirmation dialog |
| **Pulse** | Loading states | Loading spinner |
| **Card Hover** | Interactive cards | Video cards, package cards |
| **Button Hover** | All clickable buttons | CTAs, icon buttons |

---

## ♿ Accessibility Standards

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```tsx
{/* Tab Navigation */}
<button tabIndex={0}>Accessible Button</button>

{/* Custom Interactive Elements */}
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom Button
</div>
```

### Focus Indicators

Clear focus states for keyboard users (defined in `global.css`):

```css
/* All focusable elements get ring on keyboard focus */
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-primary;
}

button:focus-visible,
a:focus-visible,
input:focus-visible {
  @apply ring-2 ring-primary ring-offset-2;
}
```

### ARIA Labels

All interactive elements need descriptive labels:

```tsx
{/* Icon Buttons */}
<button aria-label="Close modal">
  <XMarkIcon className="w-5 h-5" aria-hidden="true" />
</button>

{/* Toggle Buttons */}
<button
  aria-label="Switch to grid view"
  aria-pressed={viewMode === "grid"}
>
  <Squares2X2Icon className="w-5 h-5" aria-hidden="true" />
</button>

{/* Decorative icons should be hidden */}
<CheckIcon className="w-4 h-4" aria-hidden="true" />
```

### Screen Reader Support

```tsx
{/* Screen Reader Only Text */}
<span className="sr-only">Hidden from visual users</span>

{/* Skip to Main Content */}
<a href="#main" className="skip-to-main">
  Skip to main content
</a>
```

---

## 🎯 Responsive Design

### Breakpoints

Following **Tailwind CSS** default breakpoints:

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Small tablets, landscape phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops, small desktops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
{/* Mobile: Stack vertically, Desktop: 2 columns */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

{/* Mobile: Small text, Desktop: Larger */}
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>

{/* Mobile: Hidden, Desktop: Visible */}
<div className="hidden md:block">Desktop Only</div>

{/* Mobile: Visible, Desktop: Hidden */}
<div className="block md:hidden">Mobile Only</div>
```

### Container Sizing

```tsx
{/* Max width container with responsive padding */}
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  Content
</div>

{/* Full width on mobile, constrained on desktop */}
<div className="w-full max-w-7xl mx-auto">
  Content
</div>
```

---

## 📦 Component Library Structure

### File Organization

```
components/
├── ui/               # Basic reusable components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── Modal.tsx
│   └── Alert.tsx
├── layout/           # Layout components
│   ├── AppShell.tsx
│   ├── PageHeader.tsx
│   ├── LoadingScreen.tsx
│   └── ErrorBoundary.tsx
├── subscription/     # Feature-specific components
│   ├── PackageCard.tsx
│   ├── PaymentHistoryTable.tsx
│   └── SubscriptionStatusCard.tsx
└── [feature]/        # Other feature components
```

### Component Naming Convention

- **PascalCase** for component files: `VideoHorizontalCard.tsx`
- **kebab-case** for utility CSS classes: `.card-hover`, `.btn-hover`
- **camelCase** for TypeScript interfaces: `ButtonProps`, `CardVariant`

### Props Pattern

All components should accept:

```tsx
interface ComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
  // ... specific props
}
```

---

## 🎨 Design Tokens Summary

### Quick Reference

```typescript
// Design Tokens (for reference)
export const DESIGN_TOKENS = {
  colors: {
    primary: '#ef4444',
    secondary: '#6b7280',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  borderRadius: {
    sm: '0.2rem',  // --rounded-btn
    md: '0.5rem',
    lg: '1rem',
  },
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },
};
```

---

## 📋 Usage Checklist

When creating new components, ensure:

- [ ] **Colors:** Use design system colors (primary, secondary, etc.)
- [ ] **Typography:** Use type scale (text-xs to text-3xl)
- [ ] **Spacing:** Use spacing system (gap-2, p-4, m-6)
- [ ] **Animations:** Apply standard transitions (card-hover, btn-hover)
- [ ] **Accessibility:** Add ARIA labels, keyboard navigation, focus states
- [ ] **Responsive:** Mobile-first, use breakpoints (sm:, md:, lg:)
- [ ] **Consistency:** Follow component patterns (Button, Card, Input)
- [ ] **Documentation:** Add JSDoc comments with usage examples

---

## 🚀 Next Steps

After completing this design system:

1. ✅ **Reference Components** - Create example components using this system
2. ⏩ **Component Library** - Build full UI component library (Phase 1)
3. ⏩ **Page Refactor** - Apply design system to all pages (Phase 3)
4. ⏩ **Testing** - Ensure consistency across all components

---

**Last Updated:** 2025-12-21 | **Version:** 1.0.0 | **Status:** ✅ Complete
