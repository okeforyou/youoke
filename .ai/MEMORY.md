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
- **Vocal Separation & YouOke Plugin (v1.0.5):** We created a local AI bridge Desktop app (using PyInstaller, FastAPI, and `yt-dlp` for download, `demucs` for AI separation). This allows the frontend to send separation requests locally without server costs.
- **Vocal UI (`src/pages/vocal.tsx`):** We built a dedicated page for testing the vocal separation queue. It detects OS (Mac/Win) and directly downloads the `v1.0.5` plugin binary from GitHub Releases for authenticated users. We also added "Vocals" and "Instrumental" quick-mute toggles on the player bar.
- **Plugin Release Rule:** Remember that any code changes in the `youoke-plugin/` directory or `scripts/local-bridge/` require bumping the version in `youoke-plugin/package.json` and triggering a GitHub Release (`gh release create v<VERSION> --target <BRANCH>`) to let GitHub Actions compile the new installer.
- **Pending Tasks:** The user is starting a new session to focus on fixing bugs/issues reported by customers on the main code.
- **Telegram Remote Setup:** We have successfully configured the `remoat` Telegram bot to control Antigravity 2.0 sessions for this project. The workspace base dir in `~/.remoat/config.json` is set to `/Users/boonyanone/Documents/GitHub`. `remoat` has been patched to detect `/c/` URLs. **CRITICAL:** If any agent needs to communicate with the user via mobile, the user will be using the Telegram bot (`@boonyanone_bot`). The agent must expect the user to send messages to the active session. Only 1 active session/window should be kept open for `play.okeforyou.com` to prevent routing conflicts.
