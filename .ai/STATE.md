# 📍 Active State (RAM)
*Last Updated: 2026-08-11 10:46*

## 🚀 Current Objective
- [x] Fix Sara I clipping issue where blue sweep sliver appears prematurely.
- [x] Prevent lyrics wrapping and ensure they display on a single line (flex-nowrap).
- [x] Limit interpolation sweep speed for unaligned words (max 220ms/char) to prevent slow drags.
- [x] End-anchor the sweep window of unaligned words to the start of the next aligned word for better timing.
- [x] Fix vertical clipping on tall Thai vowels and tone marks (e.g. ฟื้น) by expanding inset bounds to -100%.
- [x] Implement responsive dynamic font sizing based on character length of the line.
- [x] Move "เนื้อเพลงจาก..." source indicator to the top-left of the player view.
- [x] Replace sync offset controls with inline vocal, backing, drums, bass, and other stem controls directly on the bar.
- [x] Implement expandable-on-hover horizontal sliders for each stem directly inside FullscreenControlBar.tsx.
- [x] Implement a 3-tab segmented lyrics toggle (`ปิดเนื้อ`, `LRCLIB`, `AI Sync`) directly on the bar.
- [x] Fix hover flickering on stem sliders by placing the slider card directly *above* the button with a contiguous hover bridge.
- [x] Fix overlapping bug where all volume sliders rendered simultaneously by using React state hover detection (`onMouseEnter`/`onMouseLeave`) instead of CSS `group-hover`.

## 📋 Action Plan
- [x] `src/modules/player/components/LyricsOverlay.tsx`: Conditional render sweeping span only when `wordProgress > 0`, adjust container wrapping, reposition source badge to top-left, and increase clip-path margins to -100%.
- [x] `src/modules/lyrics/engines/deepgramAlignEngine.ts`: Update missing timestamp interpolation capping logic and end-anchoring.
- [x] `src/modules/player/components/FullscreenControlBar.tsx`: Move all stem tracks inline with React state-controlled floating volume sliders positioned above the buttons, and add lyrics 3-pill segment selector.
- [ ] Investigate Local Whisper Separation Engine (Pathway B) in the future.

## ⚠️ Blockers
- None.

## 📌 Next AI Action
- [ ] Gather user feedback on the floating hover-expandable stem sliders and segmented lyrics bar UX.
