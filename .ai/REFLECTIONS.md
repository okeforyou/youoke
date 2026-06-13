# 🧠 Reflections & Lessons Learned
*Log of errors encountered and their proven solutions to prevent repetition.*
*Rule: Keep a maximum of 15 recent entries. Move older entries to `.ai/docs/reflections_archive.md`.*

---

### ⚠️ TypeError: g.split is not a function (RemoteControlApp)
**Issue:** Client-side exception crashed the remote page when users scanned a QR code. Often triggered by malformed `router.query` parameters or string methods used on non-string data.
**Solution:**
1. Applied "Split Shield" globally via `safeSplit` in `src/utils/stringUtils.ts`.
2. Stripped ALL direct `.split` and `.trim` usage from UI components (especially `RemoteControlApp.tsx`).
3. Ensured `router.query.room` is strictly parsed into a `string` before use. 
**Lesson:** Never trust Next.js `router.query` or minified third-party data to be a perfect string. Always use `safeSplit` or enforce type checking before calling string methods.

### ⚠️ Membership Auto-Downgrade Conflict
**Issue:** Users lost their premium status unexpectedly. The root cause was multiple devices (TV, Remote, Monitor) simultaneously querying Firestore and running an aggressive `auto-downgrade` logic in `useAuthStore.ts` if `expiresAt` had passed, causing race conditions and unauthorized overwrites.
**Solution:**
1. Removed the client-side `updateDoc` for downgrades from `useAuthStore.ts`. Clients now only adjust state in-memory if expired.
2. Centralized Admin updates in `paymentService.ts` to perform a single, direct update (One-shot Update) to both Firestore and Realtime Database without relying on complex triggers.
**Lesson:** Never allow standard client apps to write/downgrade membership data directly to the database. All privilege escalation or revocation must be handled by secure Admin routes, Cron Jobs, or read-only client-side logic.
