# 🧠 Project Memory (Save Game)

> **CRITICAL INSTRUCTION FOR AI:** This file serves as the long-term memory for the project. You MUST update this file whenever a major feature is completed, a significant architectural decision is made, or when the session is about to end (Save Game). You MUST read this file at the beginning of every new session (Load Game).

## 📊 Project Status
- **Current Phase:** [e.g., Phase 1 - Setup, Phase 2 - MVP, etc.]
- **Key Milestones Achieved:**
  - [x] Initialized AI Coding Protocol
  - [ ] [Feature 1]
  - [ ] [Feature 2]

## 🏗️ High-Level Architecture & Context
- **Tech Stack:** [e.g., Next.js, Tailwind, etc.]
- **Core Business Logic:** [Briefly describe the main purpose of the app]
- **Important Notes:** [Any critical context the AI should not forget across sessions, e.g., "We have 126 RAG files processed"]

## 📝 Recent Context (Last Session)
- **Localhost Runtime Mismatch (2026-07-29):** During diagnosis, the active bridge on `127.0.0.1:5050` responded with version `1.0.36`, while the checked-in `scripts/local-bridge/server.py` currently declares version `1.0.39`. Any debugging must distinguish between the already running plugin instance and the repo source file.
- **Confirmed Minimal Fix Targets (2026-07-29):**
  1. `scripts/local-bridge/server.py` has a post-Demucs output/compression block placed after an early `return` inside the exception area, making the success-path conversion logic unreachable.
  2. `src/modules/player/components/UniversalPlayer.tsx` still hardcodes bridge asset URLs to port `5050`, while `src/stores/useAIVocalStore.ts` supports active-port detection and fallback ports.
- **Minimal Fixes Applied (2026-07-29):**
  1. Restored the post-Demucs success path in `scripts/local-bridge/server.py` so output validation, M4A compression, cache metadata writes, and success progress can execute after Demucs finishes.
  2. Expanded RapidAPI response parsing to accept the returned `file` field; this improved parsing, but the sampled direct download still returned `403 Forbidden`, so RapidAPI is not yet a reliable primary path.
  3. Exported active bridge base URL resolution from `useAIVocalStore.ts` and updated `UniversalPlayer.tsx` to load AI stem files from the detected bridge base URL instead of hardcoding port `5050`.
- **AI Vocal v2 Direction (2026-07-29):** The team confirmed that YouTube remains the core playback source and AI Vocal is a strategic differentiator. We documented a new local-first architecture in `.ai/docs/ai-vocal-v2-architecture.md`.
- **AI Vocal v2 Core Decision:** Direct YouTube download is now treated as a fast path only. The long-term reliable fallback will be browser/tab audio capture feeding the local bridge, while keeping processing local to avoid server cost.
- **Safe Rollout Rule:** Do not refactor the whole playback system to ship AI Vocal. First stabilize the current local bridge pipeline, keep changes isolated, and only then expand to upload/capture-based separation.
- **Current Technical Concern:** The existing `scripts/local-bridge/server.py` likely has a broken post-Demucs block placement, so failures may happen even after download succeeds. There is also a bridge port consistency risk between the AI store and player playback URLs.
- **Localhost Diagnosis (2026-07-29):** The local bridge is running successfully on port `5050` and reports device `mps`. Recent failures are currently dominated by YouTube acquisition issues rather than bridge startup issues:
  1. `yt-dlp` can still succeed for some videos when Chrome cookies work.
  2. Some videos fail with `Requested format is not available`.
  3. No-cookie fallback fails with `Please sign in`.
  4. `pytubefix` WEB path hits `PoToken PENDING` / SABR issues.
  5. `innertube+ffmpeg` currently fails with `400 Bad Request: Precondition check failed.`
- **Vocal Separation & YouOke Plugin (v1.0.5):** We created a local AI bridge Desktop app (using PyInstaller, FastAPI, and `yt-dlp` for download, `demucs` for AI separation). This allows the frontend to send separation requests locally without server costs.
- **Vocal UI (`src/pages/vocal.tsx`):** We built a dedicated page for testing the vocal separation queue. It detects OS (Mac/Win) and directly downloads the `v1.0.5` plugin binary from GitHub Releases for authenticated users. We also added "Vocals" and "Instrumental" quick-mute toggles on the player bar.
- **Unified Versioning Rule:** ANY changes to `youoke-plugin/` or `scripts/local-bridge/` MUST trigger a version bump. **DO NOT modify versions manually.** You MUST use `node scripts/bump-version.js <NEW_VERSION>` to synchronize versions across:
  1. `youoke-plugin/package.json`
  2. `scripts/local-bridge/server.py`
  3. `src/components/ListPlaylistsGrid.tsx` (Frontend version check)
  After bumping, commit the changes and trigger a GitHub Release (`gh release create v<VERSION> --target <BRANCH>`) so GitHub Actions compiles the new `.exe`/`.dmg`.
- **Download Resilience Upgrade (2026-07-27) — Plugin v1.0.32 / Server v1.2.0:**
  - **Problem:** YouTube SABR block caused `/separate` to hang indefinitely. UI stuck at 0%.
  - **Fix 1:** Added 10s fetch timeout in `useAIVocalStore.ts` so UI shows error instead of hanging.
  - **Fix 2:** Rewrote entire download phase in `server.py` with 4 independent strategies:
    1. `yt-dlp binary` + `player_client=web_creator,ios,mweb,web_safari` + timeout 90s + cookies (Chrome/Safari/Firefox)
    2. `yt-dlp Python module` (may be newer than bundled binary) + same extractor-args + timeout via ThreadPoolExecutor
    3. `pytubefix` with 5 clients (MWEB, IOS, ANDROID, WEB, TV) + timeout 60s each
    4. `innertube` library → get stream URL → pipe to `ffmpeg` (fully free, no yt-dlp needed)
  - **Added:** `innertube` to `requirements.txt`
  - **Strategy Docs:** See `.ai/docs/youtube-download-strategy.md` for full guide & checklist
- **Pending Tasks:** Build and release Plugin v1.0.32 via GitHub Actions after committing.
- **Telegram Remote Setup:** We have successfully configured the `remoat` Telegram bot to control Antigravity 2.0 sessions for this project. The workspace base dir in `~/.remoat/config.json` is set to `/Users/boonyanone/Documents/GitHub`. `remoat` has been patched to detect `/c/` URLs. **CRITICAL:** If any agent needs to communicate with the user via mobile, the user will be using the Telegram bot (`@boonyanone_bot`). The agent must expect the user to send messages to the active session. Only 1 active session/window should be kept open for `play.okeforyou.com` to prevent routing conflicts.
