# 📍 Active State (RAM)
*Last Updated: 2026-08-10 20:20*

## 🚀 Current Objective
- [x] Fix Sara I clipping issue where blue sweep sliver appears prematurely.
- [x] Prevent lyrics wrapping and ensure they display on a single line (flex-nowrap).
- [x] Limit interpolation sweep speed for unaligned words (max 220ms/char) to prevent slow drags.
- [x] End-anchor the sweep window of unaligned words to the start of the next aligned word for better timing.
- [x] Fix vertical clipping on tall Thai vowels and tone marks (e.g. ฟื้น) by expanding inset bounds to -100%.
- [x] Implement responsive dynamic font sizing based on character length of the line.
- [x] Move "เนื้อเพลงจาก..." source indicator to the top-left of the player view.

## 📋 Action Plan
- [x] `src/modules/player/components/LyricsOverlay.tsx`: Conditional render sweeping span only when `wordProgress > 0`, adjust container wrapping, reposition source badge to top-left, and increase clip-path margins to -100%.
- [x] `src/modules/lyrics/engines/deepgramAlignEngine.ts`: Update missing timestamp interpolation capping logic and end-anchoring.
- [ ] Add vocal control commands directly to the main player control bar (Mute vocals, Show/Hide lyrics) for all-in-one control.
- [ ] Investigate Local Whisper Separation Engine (Pathway B) in the future.

## ⚠️ Blockers
- None.

## 📌 Next AI Action
- [ ] Implement integrated player bar vocal controls (Mute, Toggle Lyrics, Toggle Karaoke).
