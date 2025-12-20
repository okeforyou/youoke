# Testing Checklist

เอกสารนี้รวบรวมรายการทดสอบสำหรับ YouOke Karaoke Web App

## ✅ Completed Sprints

### Sprint 14: UX Polish - Loading States
- [x] LoadingScreen component with variants (fullscreen, inline, skeleton)
- [x] Loading states in all admin pages
- [x] Skeleton loading for lazy-loaded components

### Sprint 15: Error Handling - Toast Notifications
- [x] ToastContext with success/error/warning/info types
- [x] Replaced 30 alerts with toast notifications across admin pages
- [x] Smooth slide-in animations for toasts

### Sprint 16: Firebase Optimization
- [x] Fixed N+1 query problem (201 → 52 queries, -75%)
- [x] Batch fetch pattern with Map caching
- [x] Created FIREBASE-OPTIMIZATION.md documentation

### Sprint 17: Code Splitting
- [x] Dynamic imports for admin pages
- [x] Lazy loading SearchResultGrid
- [x] Homepage bundle: 69.2 kB → 53.1 kB (-23%)

### Sprint 18: Image Optimization
- [x] Next.js Image component for all images
- [x] Blur placeholders for thumbnails
- [x] Smart loading strategy (priority/eager/lazy)
- [x] Homepage bundle: 53.1 kB → 50.1 kB (total -27.6%)

### Sprint 19: Smooth Transitions & Animations
- [x] Global animation utilities (.card-hover, .btn-hover, etc.)
- [x] Toast slide-in animations
- [x] Modal scale-in animations
- [x] All interactive elements have smooth transitions

### Sprint 20: Accessibility Improvements
- [x] ARIA labels for screen readers
- [x] Keyboard navigation (Tab, Enter, Space)
- [x] Focus indicators (:focus-visible)
- [x] role attributes and aria-pressed states

### Bugfixes (Localhost Testing)
- [x] Add i.scdn.co to image domains (Spotify)
- [x] Fix serialization errors in account.tsx
- [x] Fix serialization errors in admin/payments.tsx
- [x] Fix serialization errors in admin/settings.tsx
- [x] Fix serialization errors in admin/subscriptions.tsx

---

## 🧪 Manual Testing Checklist

### 1. Functional Testing

#### Authentication & User Management
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Register new account
- [ ] Logout
- [ ] View user profile
- [ ] Edit user profile

#### Search & Video Selection
- [ ] Search for videos
- [ ] Toggle between grid/list view
- [ ] Click video to open modal
- [ ] Close modal with X button
- [ ] Close modal with backdrop click
- [ ] Close modal with ESC key

#### Queue Management
- [ ] Add videos to queue
- [ ] Play video from queue
- [ ] Delete video from queue
- [ ] Reorder queue (if implemented)

#### Admin Pages (requires admin role)
- [ ] `/admin` - Dashboard loads
- [ ] `/admin/users` - User list displays
- [ ] `/admin/payments` - Payment list displays (check for N+1 fix)
- [ ] `/admin/subscriptions` - Plans list displays
- [ ] `/admin/settings` - Settings load and save

### 2. Accessibility Testing

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Grid/List toggle works with keyboard
- [ ] Play video thumbnail with Enter/Space
- [ ] Delete from queue with keyboard
- [ ] Modal closes with ESC
- [ ] All buttons focusable and have visible focus ring

#### Screen Reader Testing (VoiceOver/NVDA)
- [ ] ARIA labels announce correctly
- [ ] Button states (pressed/not pressed) announced
- [ ] Icons marked as decorative (aria-hidden)
- [ ] Headings have proper hierarchy

#### Visual Accessibility
- [ ] Focus indicators clearly visible
- [ ] Text contrast meets WCAG AA standards
- [ ] Interactive elements have min 44x44px touch target (mobile)

### 3. Responsive Testing

#### Desktop (1920x1080, 1440x900, 1366x768)
- [ ] Homepage layout correct
- [ ] Search results display properly
- [ ] Admin pages responsive
- [ ] Modals centered and sized correctly

#### Tablet (iPad: 768x1024, iPad Pro: 1024x1366)
- [ ] Grid layout adapts (3-4 columns)
- [ ] Navigation accessible
- [ ] Touch targets adequate size

#### Mobile (iPhone: 375x667, 390x844, Android: 360x640)
- [ ] Grid layout adapts (2-3 columns)
- [ ] Thumbnails display correctly
- [ ] Toast notifications positioned correctly
- [ ] Buttons large enough for touch

### 4. Animation & UX Testing

#### Smooth Transitions
- [ ] Cards lift on hover (desktop)
- [ ] Buttons scale on hover (105%) and active (95%)
- [ ] Toast notifications slide in from right
- [ ] Modals scale in smoothly

#### Loading States
- [ ] Fullscreen loading shows logo + spinner
- [ ] Skeleton cards display during lazy loading
- [ ] Admin pages show loading spinners during actions

### 5. Performance Testing

#### Bundle Size
- [ ] Homepage First Load JS: ~50 kB (target: <60 kB)
- [ ] Admin pages lazy loaded (not in main bundle)
- [ ] Images optimized (WebP format)

#### Page Load Speed
- [ ] Homepage loads in <3s (3G network)
- [ ] Admin pages load in <2s (admin usually has good connection)
- [ ] Images load progressively with blur placeholders

#### Firebase Performance
- [ ] Admin payments page: <100 queries (target: ~52)
- [ ] No N+1 query warnings in console
- [ ] Cached data used effectively

### 6. Browser Compatibility

#### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] Animations smooth (60fps)
- [ ] No console errors

#### Firefox
- [ ] All features work
- [ ] CSS Grid/Flexbox renders correctly
- [ ] Animations smooth

#### Safari (macOS/iOS)
- [ ] All features work
- [ ] Next.js Image loads correctly
- [ ] Animations smooth (especially important on iOS)

### 7. Error Handling

#### Toast Notifications
- [ ] Success toasts show green with checkmark
- [ ] Error toasts show red with X
- [ ] Warning toasts show yellow with exclamation
- [ ] Toasts auto-dismiss after 3s
- [ ] Can manually close toasts

#### Form Validation
- [ ] Login form validates email format
- [ ] Required fields show errors
- [ ] Error messages clear and helpful

#### Network Errors
- [ ] Offline mode shows appropriate error
- [ ] Failed API calls show error toast
- [ ] Firebase errors handled gracefully

---

## 🚀 Lighthouse Audit Checklist

### Performance (Target: >90)
- [ ] First Contentful Paint <1.8s
- [ ] Largest Contentful Paint <2.5s
- [ ] Total Blocking Time <200ms
- [ ] Cumulative Layout Shift <0.1
- [ ] Speed Index <3.4s

### Accessibility (Target: >90)
- [ ] All images have alt text
- [ ] ARIA attributes used correctly
- [ ] Color contrast meets standards
- [ ] Form elements have labels
- [ ] Focusable elements have focus indicators

### Best Practices (Target: >90)
- [ ] HTTPS used
- [ ] No console errors
- [ ] Images have correct aspect ratio
- [ ] No deprecated APIs used

### SEO (Target: >90)
- [ ] Meta tags present
- [ ] Headings in logical order
- [ ] Links have descriptive text
- [ ] Mobile-friendly

---

## 📊 Performance Benchmarks

### Before Optimization (Sprint 13)
- Homepage bundle: 69.2 kB
- Admin payments queries: 201
- No loading states
- No animations
- 30 alert() calls

### After Optimization (Sprint 20)
- Homepage bundle: 50.1 kB (-27.6%)
- Admin payments queries: 52 (-75%)
- Loading states: ✅
- Smooth animations: ✅
- Toast notifications: ✅
- Accessibility: ✅

---

## 🐛 Known Issues

None currently. All serialization errors fixed during localhost testing.

---

## 📝 Notes for Testers

1. **Admin Testing**: Need admin role in Firebase RTDB (`users/{uid}/role = "admin"`)
2. **Payment Testing**: Test data should exist in Firestore `payments` collection
3. **Toast Testing**: Trigger by saving settings, deleting items, etc.
4. **Animation Testing**: Best viewed on desktop with mouse hover
5. **Accessibility Testing**: Use Tab key extensively, test with screen reader
6. **Performance Testing**: Use Chrome DevTools Lighthouse, test on 3G throttling

---

## ✨ Testing Tips

- **Clear Cache**: Test with hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- **Incognito Mode**: Test without extensions interfering
- **Mobile Testing**: Use real device, not just Chrome DevTools
- **Screen Reader**: macOS VoiceOver (Cmd+F5), Windows NVDA (free)
- **Network Throttling**: Chrome DevTools > Network > Slow 3G
- **Lighthouse**: Chrome DevTools > Lighthouse > Generate Report

---

Last Updated: Sprint 20 - Accessibility Improvements
