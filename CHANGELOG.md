# Changelog

All notable changes to this project will be documented in this file.

## [5.5.182] - 2026-07-23
- **Design**: Redesigned CloudSyncTab to separate local/cloud storage and restore browse input.
- **Design**: Redesigned PackageStore into ultra-compact, scroll-free layout.
- **Design**: Updated notification indicator color in AnnouncementsTab to primary color (removed red).
- **Cleanup**: Removed GeneralSettingsTab and unified settings into ProfileTab.

## [2.19.1] - 2026-01-20
- **Fix (Dual Screen)**: Fixed queue synchronization buffer issues; added `uuid` tracking for reliable updates.
- **Fix (Dual Screen)**: Restored "Heartbeat" signal to ensure main screen detects dual mode automatically.
- **Feat (Audio Routing)**: Smart Audio Routing:
    - **Sound on PC (Mirror)**: Keeps main player active so audio plays from PC.
    - **Sound on TV (DJ)**: Unloads main player to use TV audio, showing "DJ Mode" placeholder.

## [2.19.0] - 2026-01-20
- **Refactor**: Complete **Player Module Migration**.
    - Moved player logic from `src/features/player` to `src/modules/player`.
    - **Removed Legacy Code**: Deleted `YoutubePlayer.tsx` (1600+ lines), reducing bundle size and technical debt.
    - **Hooks**: Extracted `usePlayerLifecycle` and `usePlayerSync` from `SidebarPlayer.tsx` for cleaner logic.
- **Fix**: Resolved build errors in `SidebarPlayer` and `LimitReachedModal` related to imports.
- **Protocol**: Major cleanup of legacy patterns.

## [2.18.0] - 2026-01-19
- **Feat**: Marketplace & Module System 🧱
    - Implemented `installed_modules` schema and `useModule` gating middleware.
    - Added **Admin User Management** UI to Grant/Revoke modules (`youtube-theme`, `remote-control`).
    - Gated **YouTube Theme** behind the new system (Admin only/Purchased).
    - Created placeholder `/store` page.
- **Refactor**: Strict separation of key features into `src/modules/` (starting with YouTube Theme).
- **Architecture**: Separated Core Logic from Pluggable User Modules.

## [2.15.3] - 2026-01-17
- **Feat**: Integrate `Innertube` (YouTube Music) via `api/explore` (Serverless Proxy).
- **UI**: Add `YouTubeDashboard` with horizontal scroll carousel.
- **Dependency**: Added `youtubei.js`.

## [2.15.2] - 2026-01-17
- **Feat**: Implement Logic Wiring for Theme Switching (`useUIStore`, `ProfileDrawer`).
- **UI**: Added "Spotify vs YouTube" toggle in Profile Drawer.

## [2.15.1] - 2026-01-17
- **Refactor**: Split `ListSingerGrid` into `SpotifyDashboard` and `YouTubeDashboard` for strict separation of concerns.
- **Protocol**: Architecture prepared for "Phase 3 Theme Separation".

## [2.15.0] - 2026-01-17 (Revert & Reset)
- **RESET**: Hard reset codebase to commit `30c8594` (approx. 5 hours ago) to restore stable state before YouTube Music (Innertube) integration attempts.
- **Removed**: `youtubei.js` and `scripts/` related to testing.
- **Restored**: Original Spotify-only UI layout (`ListSingerGrid`) and simple API logic.
- **Cast**: Retained recent Cast Receiver fixes (`74c6b3d`).

## [2.15.0] - Previous Stable
- **Feat**: Horizontal scroll carousel for Popular Artists.
- **Fix**: Improved Cast Receiver handshake protocol.
- **Fix**: Debug overlay for Cast Receiver.

---
**Note:** Commits `8d2e025` through `8f86e78` (including "Music Theme Switcher", "Innertube Integration", "Fallback Logic") have been dropped from history.
