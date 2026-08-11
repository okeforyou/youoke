# 📍 Active State (RAM)
*Last Updated: 2026-08-11 11:17*

## 🚀 Current Objective
- [x] Fix Sara I clipping issue where blue sweep sliver appears prematurely.
- [x] Prevent lyrics wrapping and ensure they display on a single line (flex-nowrap).
- [x] Limit interpolation sweep speed for unaligned words (max 220ms/char) to prevent slow drags.
- [x] End-anchor the sweep window of unaligned words to the start of the next aligned word for better timing.
- [x] Fix vertical clipping on tall Thai vowels and tone marks (e.g. ฟื้น) by expanding inset bounds to -100%.
- [x] Implement responsive dynamic font sizing based on character length of the line.
- [x] Move "เนื้อเพลงจาก..." source indicator to the top-left of the player view.
- [x] Replace sync offset controls with inline vocal, backing, drums, bass, and other stem controls directly on the bar.
- [x] Implement a 3-tab segmented lyrics toggle (`ปิดเนื้อ`, `LRCLIB`, `AI Sync`) directly on the bar.
- [x] Re-architect stem controllers to use Click-to-Open and Click-Outside-to-Close popovers directly above the buttons, preventing all slider dragging stutter/lag.
- [x] Fix range slider click-to-drag bugs by removing wrapper event blockers and binding value directly to track volume (vol) instead of locking to 0 when muted.

## 📋 Action Plan
- [x] `src/modules/player/components/LyricsOverlay.tsx`: Conditional render sweeping span only when `wordProgress > 0`, adjust container wrapping, reposition source badge to top-left, and increase clip-path margins to -100%.
- [x] `src/modules/lyrics/engines/deepgramAlignEngine.ts`: Update missing timestamp interpolation capping logic and end-anchoring.
- [x] `src/modules/player/components/FullscreenControlBar.tsx`: Move all stem tracks inline with React state-controlled click-to-open volume sliders positioned above the buttons, and add lyrics 3-pill segment selector.
- [ ] Investigate Local Whisper Separation Engine (Pathway B) in the future.

## ⚠️ Blockers
- None.

## 📌 Next AI Action
- [ ] Gather user feedback on the floating Click-to-Open stem sliders and segmented lyrics bar UX.
