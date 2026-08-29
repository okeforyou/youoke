# 📍 Active State (RAM)
*Last Updated: 2026-08-29 11:48*

## 🚀 Current Objective
- [x] Refactor backend to use Standalone `yt-dlp` executable (Auto-healing architecture).
- [x] Fix Mac/Windows SSL Certificate errors `[SSL: CERTIFICATE_VERIFY_FAILED]`.
- [x] Hide Windows CMD popup window during subprocess execution.
- [x] Add path traversal sanitization to `/separate` and `/upload` video IDs.
- [x] Patch cancellation logic to prevent zombie demucs tasks from reviving.
- [x] Route explicit `yt-dlp` stderr messages to the Frontend UI for better debugging.
- [ ] Monitor crashlytics/user feedback for v1.0.70 stability.

## 📋 Action Plan
- [x] `scripts/local-bridge/services/downloader.py`: Implemented `ensure_yt_dlp()` and auto-update fallback.
- [x] `scripts/local-bridge/routes/library_cache.py`: Protected active/queued tracks from LRU cache eviction.
- [x] `scripts/local-bridge/routes/separation.py`: Cancelled jobs correctly abort before WAV conversion.

## ⚠️ Blockers
- None at this time (System is Production-Ready v1.0.70).

## 📌 Next AI Action
- [ ] Gather user feedback on the floating Click-to-Open stem sliders and segmented lyrics bar UX.
