import { safeSplit, safeStartsWith, safeSlice } from '@/utils/stringUtils';

// 🛠️ v5.3.42: Industrial-Grade Splitting Shield
export const COMMIT_ID = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
    ? `#${safeSlice(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA, 0, 7)}` 
    : "";

export const CHANGELOGS = [
    {
        version: "v5.5.27 (Build Fix)",
        date: "13 เม.ย. 2569",
        changes: [
            "FIX: Resolved build failure on Plesk by adding missing 'socket.io' dependencies",
            "MAINTENANCE: Synchronized package.json for production deployment stability",
        ],
        recent_updates: "Emergency Build Hotfix"
    },
    {
        version: "v5.5.26 (Domain Harmony)",
        date: "12 เม.ย. 2569",
        changes: [
            "UI: Migrated hardcoded 'youoke.vercel.app' to dynamic hostname detection for 'play.okeforyou.com' readiness",
            "CORE: Implemented Smart Versioning by prioritizing NEXT_PUBLIC_APP_VERSION from package.json",
            "STABILITY: Verified Spotify-first playlist discovery fallback logic for stable production data",
        ],
        recent_updates: "Platform Scaling & Domain Harmony"
    },
    {
        version: "v5.5.25 (Aggressive Split Shield)",
        date: "12 เม.ย. 2569",
        changes: [
            "FIX: Finalized 'g.split' protection by inlining string checks into all version-parsing modules",
            "RELIABILITY: Resolved minified 'split is not a function' error occurring on some mobile browsers",
            "STABILITY: Verified industrial-grade hydration guards for QR-to-Remote transition",
        ],
        recent_updates: "Mobile Runtime Hardening"
    },
    {
        version: "v5.5.24 (Import Fix)",
        date: "12 เม.ย. 2569",
        changes: [
            "FIX: Added missing 'clsx' import in tv.tsx which caused a ReferenceError during runtime",
            "RELIABILITY: Verified all imports across TV modules for Zero-Effect Mode compatibility",
        ],
        recent_updates: "Runtime Stability Patch"
    },
    {
        version: "v5.5.23 (Zero-Effect Mode)",
        date: "12 เม.ย. 2569",
        changes: [
            "PERFORMANCE: Implemented 'Zero-Effect Mode' by stripping all CSS animations (pulse, bounce, slide-in)",
            "OPTIMIZATION: Removed all 'backdrop-blur' filters and replaced with high-performance solid backgrounds",
            "RELIABILITY: Simplified all transitions to basic 'opacity' or 'translate' with zero complex easing",
            "SMOOTHNESS: Optimized background slideshow to be a static switch rather than animated transition",
            "VISUAL: Cleaned up shadows and glows that caused GPU overdraw on Smart TV browsers",
        ],
        recent_updates: "Absolute Minimum Resource Usage"
    },
    {
        version: "v5.5.22 (Hyper-Performance)",
        date: "12 เม.ย. 2569",
        changes: [
            "PERFORMANCE: Implemented 'Hyper-Performance Mode' for Smart TVs by stripping backdrop-blur filters",
            "OPTIMIZATION: Added 'isVisible' gating to DigitalSignage to stop background animations during video playback",
            "RELIABILITY: Set hidden layers to 'display: none' (hidden) to prevent GPU calculation on invisible elements",
            "SMOOTHNESS: Disabled forced HD ('hd720') to allow YouTube's auto-buffer to optimize for TV hardware",
            "STABILITY: Replaced glassmorphism with efficient high-opacity solid backgrounds (98% Stone)",
        ],
        recent_updates: "TV Playback Smoothness Fix"
    },
    {
        version: "v5.5.21 (Clean Leanback)",
        date: "12 เม.ย. 2569",
        changes: [
            "UI: Hidden the debug connection indicator (red/green dot) for a cleaner, production-ready TV experience",
            "MAINTENANCE: Preserved the background connection logic and client tracking while removing visual clutter",
            "OPTIMIZATION: Verified Leanback v2 stability on multiple Smart TV simulations",
        ],
        recent_updates: "Clean UI Optimization"
    },
    {
        version: "v5.5.20 (Leanback v2)",
        date: "12 เม.ย. 2569",
        changes: [
            "FIX: Resolved 'Loading Template' blank screen by implementing a robust fallback to Leanback design",
            "RELIABILITY: Hardened roomCode parsing and splitting to prevent runtime breadcrumb errors",
            "UX: Updated TV instructions with Thai language for better local usability",
            "DESIGN: Refined Leanback UI with improved spacing and high-contrast connection steps",
            "CORE: Added safe-gate for empty configurations to ensure the TV always displays a scan code",
        ],
        recent_updates: "Final TV Signage Polishing"
    },
    {
        version: "v5.5.19 (Leanback Edition)",
        date: "12 เม.ย. 2569",
        changes: [
            "DESIGN: Launched new 'Leanback' TV interface inspired by YouTube TV (Leanback UI)",
            "UX: Implemented glassmorphism connection cards with dynamic split-screen cinematic backgrounds",
            "FIX: Forced 100% viewport-based scaling to ensure the interface fits perfectly on any Smart TV resolution",
            "VISUAL: Added soft glow effects and animated status indicators for a premium 'App-like' feel",
            "RELIABILITY: Hardened room code display with automatic character splitting for maximum readability",
        ],
        recent_updates: "YouTube-Style TV Interface"
    },
    {
        version: "v5.5.18 (TV Redirect Shield)",
        date: "12 เม.ย. 2569",
        changes: [
            "FIX: Resolved issue where Smart TVs were redirected to /remote due to aggressive mobile detection",
            "RELIABILITY: Implemented dual-check TV detection (UA Regex + Touch-Capability check)",
            "STABILITY: Expanded Smart TV UA dictionary to include Bravia, Tizen, Shield, and Nexus Player",
            "CORE: Added 'isTouchDevice' gate to preserve /tv page on non-touch Smart TV browsers",
        ],
        recent_updates: "TV Environment Stability"
    },
    {
        version: "v5.5.17 (TV Responsive Patched)",
        date: "12 เม.ย. 2569",
        changes: [
            "FIX: Overhauled /tv layout to use viewport-based units (vw/vh) for all major components",
            "RELIABILITY: Resolved QR Code overflow issue on small-resolution/high-zoom Smart TVs",
            "UX: Optimized room code visibility with flexible scaling font sizes",
            "STABILITY: Maintained 100% Hook compliance while improving layout robustness",
        ],
        recent_updates: "Smart TV Layout Optimization"
    },
    {
        version: "v5.5.16 (Logic-End Shield)",
        date: "12 เม.ย. 2569",
        changes: [
            "FIX: Relocated hydration gate to the end of the logic block, ensuring 100% compliance with React Rules of Hooks",
            "RELIABILITY: Guaranteed that all 13+ Hooks are invoked in consistent order regardless of router readiness",
            "CORE: Finalized roomCode pairing safety by removing all intermediate early returns",
        ],
        recent_updates: "Final Hook & Logic Synchronization"
    },
    {
        version: "v5.5.15 (Hook Shield)",
        date: "12 เม.ย. 2569",
        changes: [
            "FIX: Resolved Minified React error #310 by moving early returns after all top-level Hooks in RemoteControlApp",
            "STABILITY: Ensured strict compliance with React Rules of Hooks during hydration gate check",
            "CORE: Optimized component initialization order for better mobile device compatibility",
        ],
        recent_updates: "Hook Compliance & Stability"
    },
    {
        version: "v5.5.14 (Hydration & Scan Shield)",
        date: "12 เม.ย. 2569",
        changes: [
            "FIX: Implemented an industrial-grade hydration shield on the /remote page to prevent TypeError: g.split when opening via scan",
            "RELIABILITY: Hardened cleanSearchQuery in API layer with explicit type validation for split operations",
            "STABILITY: Added router.isReady gate to prevent rendering with stale/empty query parameters from QR codes",
            "CORE: Standardized safeRoomCode derivation using useMemo for consistent pairing across all device types",
        ],
        recent_updates: "Remote Stability Hardening"
    },
    {
        version: "v5.5.13 (Aggressive Multi-Wake)",
        date: "12 เม.ย. 2569",
        changes: [
            "STABILITY: Integrated ‘Page Lifecycle API’ with explicit resume listeners to beat iOS Safari background freezing",
            "RECOVERY: Added redundant ‘Pulse Reconnect’ every 5s during the first 60s of screen wake",
            "FIX: Finalized g.split shield across version.ts and SidebarControls to eliminate remaining Remote Control crashes",
            "CI: Unified version logic re-ordering for safer module evaluation order",
        ],
        recent_updates: "Universal Recovery Level 4"
    },
    {
        version: "v5.5.12 (Aggressive Recon)",
        date: "12 เม.ย. 2569",
        changes: [
            "STABILITY: Implemented 'SDK Nudging' which force-refreshes CastContext options every 10s during recovery",
            "STABILITY: Added hidden <google-cast-launcher> to maintain active hardware discovery in mobile browsers",
            "STABILITY: Increased recovery polling frequency to 1s for near-instant reconnection on screen wake",
            "UX: Added deep visibility listeners (Page Lifecycle API) to ensure logic triggers on mobile resume",
        ],
        recent_updates: "Mobile Resiliency Boost"
    },
    {
        version: "v5.5.11 (Deep Recon Fix)",
        date: "12 เม.ย. 2569",
        changes: [
            "STABILITY: Fixed 'Start Over' bug by properly marking receiver state as received during reconnection",
            "STABILITY: Improved Screen Wake-up recovery by checking localStorage persistence flags",
            "UX: Ensured casting session resumes exactly where it left off instead of reloading the queue",
        ],
        recent_updates: "Persistence Lifecycle Fix"
    },
    {
        version: "v5.5.10 (UI Unification)",
        date: "12 เม.ย. 2569",
        changes: [
            "UI: Unified and synchronized the styling of all player control buttons",
            "UI: Applied a consistent red background (bg-primary/10) to the active CAST button to match its neighbors",
            "UI: Ensured total visual harmony across the SidebarControls component",
        ],
        recent_updates: "Visual Consistency Patch"
    },
    {
        version: "v5.5.9 (UI Harmonization)",
        date: "12 เม.ย. 2569",
        changes: [
            "UI: Standardized CAST label font size and weight to match other player controls",
            "UI: Standardized CAST label font size to 10px and weight to font-medium",
            "UI: Aligned CAST active color with the primary theme (Red) to ensure visual consistency",
            "UI: Removed custom green text coloring as per design feedback",
        ],
        recent_updates: "Aesthetics Refinement"
    },
    {
        version: "v5.5.8 (Mobile UI Fix)",
        date: "12 เม.ย. 2569",
        changes: [
            "UI: Fixed missing 'CAST' label on mobile devices by ensuring persistent display regardless of connection state",
            "UI: Refined button labeling logic to prevent overflows while maintaining discovery",
        ],
        recent_updates: "Mobile Navigation Polish"
    },
    {
        version: "v5.5.7 (Stability Boost)",
        date: "12 เม.ย. 2569",
        changes: [
            "STABILITY: Improved Chromecast background persistence by preventing premature session cleanup on screen sleep",
            "UI: Restored 'CAST' label in SidebarControls for better discovery while keeping status labels hidden to prevent overflow",
            "UX: Deep Recon recovery logic now triggers reliably when screen wakes up even if SDK session was terminated",
        ],
        recent_updates: "Universal Recovery Enhancements"
    },
    {
        version: "v5.5.6 (Build Fix)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Resolved ReferenceError by correctly destructuring setIsRecovering in MainLayout",
            "CI/CD: Ensured production-ready build for Vercel deployments",
            "UI: Refactored SidebarControls Cast button to use status dots (Green/Orange) and removed overflowing text labels",
        ],
        recent_updates: "Sidebar UI Polish"
    },
    {
        version: "v5.5.5 (Disconnect Hotfix)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Corrected handleDisconnect hook dependencies to ensure the disconnect button remains responsive",
            "STABILITY: Verified manual disconnection across all modes (Google, Smart TV, Dual Screen)",
        ],
        recent_updates: "Manual Disconnect Fix"
    },
    {
        version: "v5.5.4 (Universal Recovery Pulse)",
        date: "11 เม.ย. 2569",
        changes: [
            "UI: Extended the orange 'Recovering' pulse to Smart TV (/monitor) mode for unified visual feedback",
            "LOGIC: Re-connection status is now global across all cast modes, ensuring a consistent professional experience",
            "STABILITY: Fixed a race condition where the recovery pulse would continue after manual disconnection",
        ],
        recent_updates: "Universal Feedback System"
    },
    {
        version: "v5.5.3 (Tactile Feedback)",
        date: "11 เม.ย. 2569",
        changes: [
            "UI: Implemented visual status pulse on the Cast button (Orange = Reconnecting, Red = Active)",
            "UX: Added 'กำลังเชื่อมต่อ...' label while the app is silently recovering a lost session",
            "LOGIC: Exposed isRecovering state to all navigation components for real-time connection feedback",
        ],
        recent_updates: "Tactile Cast Feedback"
    },
    {
        version: "v5.5.2 (Sticky Core)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Implemented 'Sticky Initial State' to prevent UI sabotage during cold boots (5+ min sleep)",
            "LOGIC: Cast status now defaults to TRUE if previously connected, ensuring UI controls remain visible while SDK scans",
            "STABILITY: Eliminated the race condition where MainLayout would reset castMode before recovery could trigger",
        ],
        recent_updates: "Cold Boot Persistence"
    },
    {
        version: "v5.5.1 (Syntax Hotfix)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Corrected a missing closure brace in CastContext recovery logic preventing production builds",
            "STABILITY: Verified handleVisibilityChange structure for multi-platform compatibility",
        ],
        recent_updates: "Emergency Syntax Fix"
    },
    {
        version: "v5.5.0 (Universal Cast Flow)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Unified the Cast button behavior across all modes (Google, Smart TV, Dual Screen) to always open the selection modal",
            "LOGIC: Removed incorrect auto-reset when clicking the Cast button in Smart TV mode",
            "UX: Standardized the disconnection path: Users now always navigate to the modal to explicitly confirm cancellation",
        ],
        recent_updates: "Universal Cast UX Consistency"
    },
    {
        version: "v5.4.9 (Deep Recovery Pulse)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Implemented 'Deep Wake-up' logic that forces Google Cast SDK to re-scan the network immediately upon screen wake",
            "RECOVERY: Added SDK nudge (options refresh) to eliminate the 5-10 second idle wait time after resuming the app",
            "UI: Synchronized the recovery heartbeat to match the responsiveness of the /remote system",
        ],
        recent_updates: "Chromecast Deep Recon"
    },
    {
        version: "v5.4.8 (Universal Persistence)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Extended persistent recovery to Smart TV (/monitor) mode using localStorage for castMode and partyPIN",
            "RECOVERY: Smart TV mode now automatically reconnects after a screen wake or browser reload, matching /remote behavior",
            "CLEANUP: Ensured handleDisconnect clears all persistent flags across all modes (Google Cast, Smart TV, Dual Screen)",
        ],
        recent_updates: "Universal Recovery Support"
    },
    {
        version: "v5.4.7 (Persistent Sync)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Implemented Persistent UI State for Chromecast using localStorage to remember active sessions",
            "LOGIC: Apps now show 'Connecting/Connected' status immediately on wake or reload, even before SDK finishes scanning",
            "RECOVERY: Added an aggressive Boot-up Polling mechanism to bridge the 5-second SDK init gap",
        ],
        recent_updates: "YouTube-like Persistent Sync"
    },
    {
        version: "v5.4.6 (Correct Cast Flow)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Corrected the Cast button behavior to always open the selection modal instead of triggering an instant disconnect",
            "UX: Enabled users to manage active connections and see status within the modal before deciding to disconnect",
            "UI: Synchronized SidebarControls to focus strictly on UI navigation for casting",
        ],
        recent_updates: "Correct Cast UX Flow"
    },
    {
        version: "v5.4.5 (Reliable Disconnect)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Implemented 'Force Disconnect' logic to prevent UI freeze during periodic session recovery polling",
            "LOGIC: Manual disconnection now explicitly kills all background recovery timers and resets UI state immediately",
            "STABILITY: Ensured the phone returns to local playback mode instantly when 'Cancel' is clicked, even if Chromecast is offline",
        ],
        recent_updates: "Force Disconnect Reliability"
    },
    {
        version: "v5.4.4 (Remote-Style Recovery)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Upgraded Chromecast recovery to a 'Forever-ish' model (20-minute persistent polling) mirroring /remote reliability",
            "LOGIC: Apps will now aggressively scan and re-bind to previous Chromecast sessions every 2s for up to 20 minutes after screen wake",
            "STABILITY: Removed short timeout constraints to prevent premature UI disconnection state",
        ],
        recent_updates: "Remote-Style Chromecast Recovery"
    },
    {
        version: "v5.4.3 (Extra Stability)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Further extended Chromecast recovery window to 15s with 4 re-check points for maximum reliability on mobile wake-up",
            "LOGIC: Improved silent background re-binding logic to match premium streaming app behavior",
        ],
        recent_updates: "Extra Chromecast Stability"
    },
    {
        version: "v5.4.2 (Chromecast Stability)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Extended Chromecast session recovery window from 2s → 8s with intermediate retries at 3s and 5s to prevent premature disconnection after device screen wake",
            "FIX: Added bidirectional sync bridge between Google Cast SDK and UI castMode — disconnect button now always appears correctly for Google Cast",
            "FIX: UI auto-cleans castMode when SDK detects session dropped (e.g. TV powered off)",
        ],
        recent_updates: "Chromecast Stability"
    },
    {
        version: "v5.4.1 (Queue Sync Fix)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Synchronized queue badge count (circles/indicators) across Dashboard, Player Bar, and Remote Control",
            "LOGIC: Changed queue counting to show 'remaining songs' (excluding current) to match the visible list items",
        ],
        recent_updates: "Queue Badge Sync"
    },
    {
        version: "v5.4.0 (UI Restoration & Cast UX)",
        date: "11 เม.ย. 2569",
        changes: [
            "UI: Restored per-item Disconnect button inside the active cast mode item (HDMI, Smart TV, Google Cast, YouTube)",
            "UI: Enhanced active mode indicator with green ring and internal red disconnect button for improved clarity",
            "CLEANUP: Removed redundant global disconnect button at the bottom of the modal",
        ],
        recent_updates: "UI Restoration & Cast UX"
    },
    {
        version: "v5.3.99 (Cast Recovery & Queue Guard)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Corrected Chromecast sender-side session recovery — was incorrectly using CastReceiverContext (TV SDK) instead of CastContext (Sender SDK) causing controls to freeze after phone screen wakes up",
            "FIX: Added safe index guard in QueueList to prevent mismatched queue count display during state transitions",
        ],
        recent_updates: "Cast Recovery & Queue Guard"
    },
    {
        version: "v5.3.98 (Logic Sync Master)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Resolved song duplication by correctly extracting command ID from snapshot.key",
            "RESTORE: Re-implemented the initial Audio Unlocker to bypass autoplay blocks",
            "STABILITY: Finalized v5.3.98 as the stable logic baseline for Host-Monitor sync"
        ],
        recent_updates: "Logic Sync Master"
    },
    {
        version: "v5.3.94 (Audio Recovery)",
        date: "11 เม.ย. 2569",
        changes: [
            "RESTORE: Re-implemented the initial Audio Unlocker (YOUOKE READY) to bypass browser autoplay blocks",
            "FIX: Corrected Host-Monitor sync logic to prevent playback loops",
            "PERFORMANCE: Optimized state updates to ensure seamless transitions between songs",
            "UI: Improved the visual aesthetics of the start-up prompt (Glassmorphism)"
        ],
        recent_updates: "Audio Recovery"
    },
    {
        version: "v5.3.93 (Peace Treaty Sync)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Resolved Host-Monitor race condition by enabling bi-directional sync for the Host role",
            "RELIABILITY: Host now listens to Firebase updates to ensure total parity with Monitor deletions",
            "STABILITY: Added Timestamp Guard to prevent stale states from overwriting newer remote updates",
            "CORE: Zeroed-out queue bouncing issues for 100% reliable deletion persistence"
        ],
        recent_updates: "Peace Treaty Sync"
    },
    {
        version: "v5.3.92 (Unified Command Engine)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Unified Command Engine between Dashboard and TV receivers",
            "FIX: Resolved TV deletion issues by enabling UUID-based removal in useCommandExecutor",
            "RESTORE: Fixed Guest Name visibility on TV and Remote Queue displays",
            "STABILITY: Improved data mapping for ADD_TO_QUEUE to ensure metadata persistence"
        ],
        recent_updates: "Unified Command Engine"
    },
    {
        version: "v5.3.91 (Seamless TV Experience)",
        date: "11 เม.ย. 2569",
        changes: [
            "FIX: Enabled persistent queue deletion by authorizing all devices to update state during commands",
            "RESTORE: Enabled guest user names in the queue display (addedBy injection)",
            "SMOOTH: Removed autoplay-blocked popups from TV display for an uninterrupted singing experience",
            "STABILITY: Hardened Multi-Role Synchronization hierarchy"
        ],
        recent_updates: "Seamless TV Experience"
    },
    {
        version: "v5.3.65 (Remote UI Simplification)",
        date: "10 เม.ย. 2569",
        changes: [
            "UI: Hidden 'LIMIT' display in Remote header to avoid confusion with guest song quotas",
            "UI: Hidden redundant 'Show playlist on TV' toggle button for a cleaner remote experience",
            "STABILITY: Finalized v5.3.65 as the new baseline for remote control simplicity"
        ],
        recent_updates: "Remote Experience Lock"
    },
    {
        version: "v5.3.64 (Workflow Optimization)",
        date: "10 เม.ย. 2569",
        changes: [
            "FEATURE: Finalized Commit & Push Workflow for automated end-to-end deployment",
            "SYNC: Optimized .agent/workflows with explicit remote push instructions"
        ],
        recent_updates: "Complete Commit & Push Implementation"
    },
    {
        version: "v5.3.63 (Skill Integration)",
        date: "10 เม.ย. 2569",
        changes: [
            "FEATURE: Integrated official Commit Workflow (Skill) for standardized versioning and saving",
            "SYNC: Updated .agent/workflows with automated commit procedures"
        ],
        recent_updates: "Workflow Skill Integration"
    },
    {
        version: "v5.3.62 (Remote Stability Fix)",
        date: "10 เม.ย. 2569",
        changes: [
            "FIX: Resolved ReferenceError/TypeError (g.split) on Remote page by correctly importing VERSION_LABEL",
            "STABILITY: Hardened room query parameter handling to prevent crashes when accessed without a room code",
            "SYNC: Verified cross-device version labeling for 100% UI consistency"
        ],
        recent_updates: "Remote Control Stability Lock"
    }
];

export const getLatestVersion = () => {
    // 🛡️ Smart Versioning Priority (v4.7.5+)
    if (process.env.NEXT_PUBLIC_APP_VERSION) {
        return process.env.NEXT_PUBLIC_APP_VERSION.replace(/^v/, '');
    }

    try {
        const latest = CHANGELOGS[0]?.version;
        if (typeof latest !== 'string') return "5.5.26";
        
        // 🛡️ Final Aggressive Shield: Using safeSplit from stringUtils
        const parts = safeSplit(latest, " ");
        const vPart = parts[0] || "5.5.26";
        
        // Remove 'v' prefix safely
        return safeStartsWith(vPart, 'v') ? safeSlice(vPart, 1) : vPart;
    } catch (e) {
        return "5.5.26";
    }
};

export const SYSTEM_VERSION = getLatestVersion();
export const SYSTEM_CODENAME = "Domain Harmony";
export const VERSION_LABEL = `${COMMIT_ID || '#local'} v${SYSTEM_VERSION} (${SYSTEM_CODENAME})`;
