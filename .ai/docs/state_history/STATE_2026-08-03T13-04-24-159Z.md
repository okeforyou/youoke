# 📍 Active State (RAM)
*Last Updated: 2026-07-29 11:18*

## 🚀 Current Objective
- [x] Stabilize AI Vocal local bridge with minimal, compatibility-preserving fixes validated on localhost first.

## 📋 Action Plan
- [x] Write `.ai/docs/ai-vocal-v2-architecture.md`.
- [x] Record AI Vocal v2 decisions in `.ai/DECISIONS.md` and `.ai/MEMORY.md`.
- [x] Re-read `server.py`, `useAIVocalStore.ts`, and `UniversalPlayer.tsx` before editing.
- [x] Run initial localhost diagnosis against the active bridge.
- [x] Start the repo version of `scripts/local-bridge/server.py` and compare behavior with the currently running bridge.
- [x] Fix only the confirmed minimal issues in bridge processing and player/bridge integration.
- [x] Re-test localhost after each focused fix before any version bump.
- [x] Bump plugin version only if `scripts/local-bridge/` or `youoke-plugin/` changes are finalized.

## ⚠️ Blockers
- Existing uncommitted changes are present in `scripts/local-bridge/server.py`, so runtime edits must stay minimal and deliberate.
- The active localhost bridge initially reported version `1.0.36`, while the repo file `scripts/local-bridge/server.py` is `1.0.39`; diagnosis had to separate "running plugin state" from "repo source state".
- Localhost download history still shows recurring YouTube acquisition failures for some videos due to format availability, sign-in requirements, and PoToken/SABR protection.
- Even after parsing the RapidAPI `file` field correctly, the sampled direct download URL returned `403 Forbidden`, so acquisition resilience still depends primarily on the non-RapidAPI strategies.

## 📌 Next AI Action
- [x] Confirm initial risk areas: unreachable post-Demucs block in `server.py` and hardcoded bridge port usage in `UniversalPlayer.tsx`.
- [x] Run localhost using the repo bridge code to validate the runtime mismatch and confirm version `1.0.39` is active.
- [x] Apply the minimal patch set:
  - restore the post-Demucs success path in `server.py`
  - parse RapidAPI `file` responses
  - make `UniversalPlayer.tsx` resolve the active bridge base URL instead of hardcoding `5050`
- [x] Run one more end-to-end localhost separation test on a video that is known to pass acquisition reliably after restarting the repo bridge.
