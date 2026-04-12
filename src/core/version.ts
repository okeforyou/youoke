export const CHANGELOGS = [
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
    },
    {
        version: "v5.3.60 (Dynamic Trial Sync System)",
        date: "10 เม.ย. 2569",
        changes: [
            "FIX: Handled stale local auth caches by fetching real-time user profile data dynamically",
            "SYNC: PackageStore and the MembershipCard now share the exact same logic and source of truth",
            "UX: Guaranteed the trial banner disappears instantly without requiring a hard refresh"
        ],
        recent_updates: "Dynamic RTDB Trial Synchronization"
    },
    {
        version: "v5.3.59 (Absolute Trial Redundancy Fix)",
        date: "10 เม.ย. 2569",
        changes: [
            "UX: Enforced strict hiding of the trial banner if membership type is 'trial' to eliminate all redundant UI elements",
            "LOGIC: Replaced complex premium checks with simple type-based detection for 100% reliability"
        ],
        recent_updates: "Trial Banner Strict Hiding Fix"
    },
    {
        version: "v5.3.58 (Logic Sync - Hide Active Trial Banner)",
        date: "10 เม.ย. 2569",
        changes: [
            "UI/UX: Completely hide the 'Free Trial' banner across all package stores once a user successfully activates it",
            "LOGIC: Refined boolean logic to accurately detect and clear out the active trial hero components to avoid visual redundancy"
        ],
        recent_updates: "Trial Hero Redundancy Clean-Up"
    },
    {
        version: "v5.3.57 (Premium Trial Design Overhaul)",
        date: "10 เม.ย. 2569",
        changes: [
            "DESIGN: Implemented 'Red Frame' (กรอบสีแดง) high-contrast style for active trial cards",
            "AUTH: Fixed critical data mapping in AuthStore to correctly fetch isPremium and tier from Firestore",
            "UI: Synchronized PackageStore and Packages page to show DARK emerald 'Received' state for active trials",
            "SIDEBAR: Added red 'Active Trial' indicator with pulse animation for better user feedback",
            "STABILITY: Verified 100% logic alignment for trial activation and status detection"
        ],
        recent_updates: "High-Contrast Active Trial Visibility & Logic Fix"
    },
    {
        version: "5.3.48 (Automated QR & Identity Unified)",
        date: "10 เม.ย. 2569",
        changes: [
            "Automated QR Delivery: System now sends the PromptPay QR image directly to member's LINE chat upon payment intent",
            "Unified Notification Identity: Standardized 100% of automated LINE alerts (Approval, Rejection, Welcome, linking) with premium structured layouts",
            "Enhanced API: Upgraded line-push engine to support multi-message payloads (Text + Images) simultaneously"
        ],
        recent_updates: "Direct QR Delivery & Notification Branding"
    },
    {
        version: "#auto v5.3.39 (Auto Notification Hook)",
        date: "10 เม.ย. 2569",
        changes: [
            "AUTOMATION: Linked LINE notifications directly to the Admin 'Approve' action",
            "BILLING: System now automatically sends payment confirmations to LINE users upon approval",
            "BILLING: Auto-notify users with reason if subscription payment gets rejected",
            "FIX: Ensure zero-hardcoded path references using internal fetch API"
        ],
        recent_updates: "Automated LINE Notification on Approval"
    },
    {
        version: "#9a267d9 v5.3.38 (Admin Response Toolkit)",
        date: "10 เม.ย. 2569",
        changes: [
            "UI: Added 'Quick Response' buttons in User Management for instant LINE messaging",
            "UX: Enabled one-click templates for greetings, payment receipts, and troubleshooting",
            "FIX: Synchronized SYSTEM_VERSION logic to always pull the true latest changelog entry",
            "ADMIN: Optimized communication flow for manual subscription approvals"
        ],
        recent_updates: "One-Click Admin Messaging & Version Sync Fix"
    },
    {
        version: "v5.3.37 (Official Version Sync)",
        date: "10 เม.ย. 2569",
        changes: [
            "FIX: Harmonized versioning between package.json and system core",
            "STABILITY: Final deployment of Identity Protection and mobile LINE connection fixes",
            "AUDIT: Verified 'Owner' role shielding across all dashboard layers"
        ],
        recent_updates: "System-wide Version & Identity Alignment"
    },
    {
        version: "v5.3.36 (LINE Identity Fix)",
        date: "10 เม.ย. 2569",
        changes: [
            "FIX: Resolved infinite reconnection loop in profile LINE connection",
            "UI: Added high-visibility 'Connected' state with emerald branding",
            "API: Patched backend crash when processing 'link_account' state via mobile"
        ],
        recent_updates: "Mobile LINE Connection Loop Fix"
    },
    {
        version: "v5.3.35 (Admin Dashboard Identity)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Added 'เจ้าของระบบ' (Owner) styling to the Admin Dashboard user list",
            "DATA: Locked 'owner' role in the AuthStore to prevent database-driven role regressions"
        ],
        recent_updates: "Admin UI Identity Mapping"
    },
    {
        version: "v5.3.34 (Pure Flat Admin Shield)",
        date: "9 เม.ย. 2569",
        changes: [
            "SHIELD: Created infinite auto-sync for Admin/Owner roles to prevent accidental database downgrades",
            "FIX: Corrected the bug where Self-Healing sets Owner emails to 'user' role in Firestore",
            "DATA: Ensured that 'lifetime' and 'active' status is permanently synchronized to the server",
            "DESIGN: Officially adopted 'Pure Flat' convention across operations"
        ],
        recent_updates: "Admin Database Discrepancy Fix"
    },
    {
        version: "v5.3.33 (Firestore Identity Sync)",
        date: "9 เม.ย. 2569",
        changes: [
            "FIX: Resolved critical bug where linked LINE IDs were not saved to Firestore",
            "LOGIC: Forced hard reload (window.location.href) after successful connection",
            "STABILITY: Ensured the AuthStore immediately recognizes the newly linked identity",
            "DATA: Synchronized backwards compatibility between RTDB and Firestore schemas"
        ],
        recent_updates: "Missing Identity Sync Fix"
    },
    {
        version: "v5.3.32 (Final Logic Sync)",
        date: "9 เม.ย. 2569",
        changes: [
            "AUDIT: Synchronized all remaining LINE connection triggers with Official Flow",
            "FIX: Removed legacy manual URLs from profile view and banners",
            "UX: Ensured 'One-Click' connectivity consistency across the entire drawer",
            "STABILITY: Cleaned up reactive states for Profile and Membership views"
        ],
        recent_updates: "Final Logic Audit & Sync Completion"
    },
    {
        version: "v5.3.31 (Official LINE Restoration)",
        date: "9 เม.ย. 2569",
        changes: [
            "FIX: Restored official signInWithLine('link_account') flow in requirement modal",
            "BUG: Terminated the use of incorrect 'liff.me' manual URL redirection",
            "UX: Ensured seamless handoff to secure LINE authorization interface",
            "STABILITY: Verified integration with the core authentication and linking system"
        ],
        recent_updates: "Official LINE Identity Linking Recovery"
    },
    {
        version: "v5.3.30 (Fastest Connection Flow)",
        date: "9 เม.ย. 2569",
        changes: [
            "UX: Implemented direct LIFF connection shortcut from LineRequiredModal",
            "LOGIC: Reduced user friction by removing multi-step manual navigation",
            "UI: Changed call-to-action to 'เชื่อมต่อทันที' with enhanced visibility",
            "PERFORMANCE: Optimized for 'One-Click' connectivity on mobile devices"
        ],
        recent_updates: "Direct Connection Shortcut Implementation"
    },
    {
        version: "v5.3.29 (System Modal Restoration)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Replaced browser alert with custom System Modal (LineRequiredModal)",
            "UX: Restored stable and premium 'Force-Line' warning state",
            "LOGIC: Verified interaction consistency between drawer and store page",
            "STABILITY: Final logic synchronization for the Pure Flat redesign"
        ],
        recent_updates: "System Modal & Logic Consistency Restoration"
    },
    {
        version: "v5.3.28 (LINE Mandatory Recovery)",
        date: "9 เม.ย. 2569",
        changes: [
            "LOGIC: Re-enforced mandatory LINE connection before subscribing",
            "UX: Added alert and guidance for unlinked users attempting to purchase",
            "ADMIN: Ensured all payment records are tied to a valid LINE ID for tracking",
            "STABILITY: Synchronized 'Force-Line' logic across all store entry points"
        ],
        recent_updates: "Mandatory LINE Connection Recovery"
    },
    {
        version: "v5.3.27 (Subscription Recovery)",
        date: "9 เม.ย. 2569",
        changes: [
            "FIX: Restored direct VIP purchase functionality within the Profile Drawer",
            "UX: Re-integrated UploadSlipModal into PackageStore for instant checkout",
            "LOGIC: Repaired trial package (1-day) activation flow",
            "STABILITY: Synchronized pricing logic between standalone and drawer stores"
        ],
        recent_updates: "Direct Drawer Purchase Recovery"
    },
    {
        version: "v5.3.26 (Login Forced Light Mode)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Forced 100% Light Mode on Login page (Removed all Dark Mode classes)",
            "UX: Enforced Zinc-950 (Pure Black) for platform description to match headline",
            "ACCESSIBILITY: Guaranteed 100% legibility via high-contrast black-on-white layout"
        ],
        recent_updates: "Forced Light Mode Login Overhaul"
    },
    {
        version: "v5.3.25 (Thai Copywriting Polish)",
        date: "9 เม.ย. 2569",
        changes: [
            "I18N: Localized VIP invitation subtext to persuasive Thai copy",
            "UX: Updated banner text to 'ร้องเพลงไม่อั้น ไร้โฆษณากวนใจ' for higher conversion",
            "ACCESSIBILITY: Senior-friendly high-contrast Thai messaging"
        ],
        recent_updates: "Persuasive Thai VIP Banner Update"
    },
    {
        version: "v5.3.24 (Instant Smooth Transition)",
        date: "9 เม.ย. 2569",
        changes: [
            "UX: Removed all 'animate-in' and 'fade-in' transitions in Profile Drawer views",
            "PERFORMANCE: Forced instantaneous view switching for a faster, 'plain' feel",
            "ACCESSIBILITY: Eliminated visual stretching/expanding during navigation"
        ],
        recent_updates: "Simple Transition Alignment"
    },
    {
        version: "v5.3.23 (Login Contrast Recovery)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Fixed login description text visibility with Zinc-900 (High Contrast)",
            "UX: Implemented font-black (Ultra Bold) weight for platform description to improve readability",
            "ACCESSIBILITY: Senior-friendly visual adjustments for the initial onboarding flow"
        ],
        recent_updates: "Login High Contrast Fix & Polish"
    },
    {
        version: "v5.3.22 (Stability & Icon Fixes)",
        date: "9 เม.ย. 2569",
        changes: [
            "FIX: Critical React Error #130 crash by correcting QrCode icon import source",
            "STABILITY: Verified all icon components in PackageStore to prevent undefined rendering",
            "SYNC: Standardized localized Thai shopping experience within the drawer"
        ],
        recent_updates: "Critical Stability & Icon Crash Fix"
    },
    {
        version: "v5.3.21 (Drawer Sync & LINE Direct)",
        date: "9 เม.ย. 2569",
        changes: [
            "I18N: Full Thai localization for PackageStore drawer component",
            "UX: Restored 'Click to Connect' shortcut button for LINE LIFF on mobile",
            "UI: Compacted drawer shop cards to match standalone page aesthetics",
            "FIX: Repaired missing connection link in the LINE QR view"
        ],
        recent_updates: "Drawer Shop Thai Sync & LINE Accessibility Fix"
    },
    {
        version: "v5.3.20 (Thai Compact Shop Overhaul)",
        date: "9 เม.ย. 2569",
        changes: [
            "I18N: 100% Thai localization for the Packages page (Zero English labels)",
            "UI: Extreme compaction of package cards with optimized padding and margins",
            "UX: Standardized Thai-specific value badges (e.g., คุ้มค่าที่สุด, ตลอดชีพ)",
            "DESIGN: Normalized color tiers for Thai market alignment and readability"
        ],
        recent_updates: "Full Thai Localization & Shop Compaction"
    },
    {
        version: "v5.3.19 (Ultra-Compact & High-Contrast)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Ultra-compaction of Membership Card to maximize drawing space",
            "UX: Fixed Logout text visibility with explicit high-contrast Rose-600",
            "UI: Normalized menu typography to Font-Bold for better visual crispness",
            "ICON: Updated Membership clock to vivid Primary Red for better clarity"
        ],
        recent_updates: "Ultimate Space Optimization & Typography Fix"
    },
    {
        version: "v5.3.18 (Compact Shop & Visibility Fix)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Compacted /packages page with smaller cards and headlines for better scaling",
            "UX: Updated internal Shop CTAs to link directly to the standalone Packages page",
            "UI: Fixed Logout button visibility with high-contrast Rose-600 typography",
            "LAYOUT: Reduced padding and roundedness for a tighter Pure Flat aesthetic"
        ],
        recent_updates: "Layout Compaction & Critical Visibility Fix"
    },
    {
        version: "v5.3.17 (Shop-Wide Pure Flat)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Full redesign of standalone /packages page into Pure Flat system",
            "UX: Standardized senior-friendly high-contrast titles and pricing (Zinc-950)",
            "UX: Implemented rigid Border-4 card layouts for clear pricing tiers",
            "DESIGN: Replaced legacy gradients with solid Emerald-600 Trial Hero"
        ],
        recent_updates: "Comprehensive Packages Page Overhaul"
    },
    {
        version: "v5.3.16 (Pure Flat Experience)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Complete Pure Flat redesign of the Package Store (No shadows/gradients)",
            "UX: Implemented solid color-coded tiers for different package durations",
            "I18N: senior-friendly high-contrast pricing (Zinc-950) and bold typography",
            "DESIGN: Modernized the Trial Hero and Line Guard modal with official assets"
        ],
        recent_updates: "Pure Flat Package Store Overhaul"
    },
    {
        version: "v5.3.15 (Color & Scale Polish)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Restored compact Membership card scale (Old size) with high-contrast font",
            "UX: Colored Action Buttons (Red/Amber) inside membership for clear CTA",
            "BRAND: Standardized official LINE green (#06C755) for all status icons",
            "LAYOUT: Optimized Profile Drawer padding for high-density mobile viewports"
        ],
        recent_updates: "Final Brand Color & Scale Refinement"
    },
    {
        version: "v5.3.14 (Official Brand Sync)",
        date: "9 เม.ย. 2569",
        changes: [
            "BRAND: Replaced all LINE icons with the high-fidelity Official Wordmark SVG",
            "UI: Synchronized branding across Login and Profile management systems",
            "DESIGN: Finalized visual consistency for third-party integrations"
        ],
        recent_updates: "Official LINE Branding & Visual Polish"
    },
    {
        version: "v5.3.13 (Accessibility Boost)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: High-contrast typography (Zinc-950) for better senior readability",
            "UX: Enlarged and vivid icons for Membership and LINE connection",
            "DESIGN: Implemented thicker borders and shadow-less depth for better separation",
            "UX: Normalized font weight to bold/black for all primary labels"
        ],
        recent_updates: "Senior Accessibility & High-Contrast Visual Hardening"
    },
    {
        version: "v5.3.12 (Action & Upsell Boost)",
        date: "9 เม.ย. 2569",
        changes: [
            "UX: Added explicit 'Upgrade VIP' Action Label inside Membership Card",
            "UI: Integrated high-contrast VIP Invitation Banner for better conversion",
            "Shop: Improved discoverability of Package Store from Profile drawer",
            "DESIGN: Refined information hierarchy for membership dashboard"
        ],
        recent_updates: "Subscription CTA & Shop Visibility Optimization"
    },
    {
        version: "v5.3.11 (Full Thai Branding)",
        date: "9 เม.ย. 2569",
        changes: [
            "BRAND: Integrated official LINE SVG icon into Profile system",
            "I18N: Full Thai localization for all Membership and Profile labels",
            "UI: Improved visual recognition for LINE connection status",
            "UX: Finalized Neutral Base design with Thai terminology"
        ],
        recent_updates: "Thai Localization & Official LINE Branding Sync"
    },
    {
        version: "v5.3.10 (Neutral Base & UI Hardening)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Redesigned Profile Drawer using 'Neutral Base' design for premium look",
            "UX: Replaced informal emojis with professional vector icons in Limit Modals",
            "DESIGN: Finalized accessibility contrast for login description text",
            "UX: Compacted Profile layout for better mobile usability"
        ],
        recent_updates: "Neutral Base Design & Professional UI Hardening"
    },
    {
        version: "v5.3.9 (Brand & Legibility Fix)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Improved text contrast for hero descriptions on login page",
            "BRAND: Updated footer copyright to 'okeforyou.com' for consistency",
            "TECH: Finalized version sync for v5.3.9 production release"
        ],
        recent_updates: "Legibility & Brand Identity Synchronization"
    },
    {
        version: "v5.3.8 (Design Harmony Bundle)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Unified 'Pure Flat' design across Login, Sidebar, and Terms pages",
            "DESIGN: Implemented shadowless component architecture system-wide",
            "SYSTEM: Synchronized package.json and version metadata to v5.3.8",
            "UX: Fixed Google/LINE login button visibility for better accessibility"
        ],
        recent_updates: "Unified Pure Flat Design Synchronization"
    },
    {
        version: "v5.3.7 (Legal Design Refit)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Full renovation of Terms & Conditions page with Pure Flat design",
            "DARK: Implemented Zinc-950 high-contrast theme for all legal pages",
            "FIX: Resolved persistent TS2307 import error in root directory",
            "STABILITY: Updated package.json synchronization to v5.3.7"
        ],
        recent_updates: "Comprehensive Design & Technical Hardening"
    },
    {
        version: "v5.3.6 (DJ Logic Guide)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Added 'DJ Mode' analogy to wireless monitor guide",
            "UX: Clarified QR Scanning logic for Smart TV player control",
            "DESIGN: Refined step-by-step casting descriptions for easier reading",
            "STABILITY: Final verification of Lucide icon rendering after hotfix"
        ],
        recent_updates: "Simplified Wireless Control & Monitoring Guide"
    },
    {
        version: "v5.3.5 (Build Stability Fix)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Detailed /tv vs /monitor logic in user guide",
            "UX: Added specific hardware recommendations for wireless casting",
            "DESIGN: Re-ordered casting methods based on user preference and ease of use",
            "TECH: Ensured dynamic domain mapping in all manual instructions"
        ],
        recent_updates: "Comprehensive Wireless Control & Casting Guide"
    },
    {
        version: "v5.3.3 (UI Consistency Sync)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Synchronized Chart & Station headers for system-wide consistency",
            "UX: Enabled Charts descriptive subtitle on mobile devices",
            "DESIGN: Refined typography and weight for better content hierarchy"
        ],
        recent_updates: "Dashboard UI Consistency Improvements"
    },
    {
        version: "v5.3.2 (Master Responsive Manual)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Fixed responsive title overflow and removed hard-line breaks",
            "UX: Resolved VIP tab truncation by adding horizontal padding and min-width",
            "DESIGN: Expanded container width to max-w-2xl for better content balance",
            "HOTFIX: Restored corrupted tutorial.tsx file structure"
        ],
        recent_updates: "Fully Responsive Premium Manual"
    },
    {
        version: "v5.3.1 (Hotfix: Icon Restoration)",
        date: "9 เม.ย. 2569",
        changes: [
            "FIX: Resolved React Error #130 caused by invalid icon import (Chromecast -> Cast)",
            "STABILITY: Verified component rendering for Tutorial page"
        ],
        recent_updates: "Critical Component Rendering Fix"
    },
    {
        version: "v5.3.0 (The Ultimate Manual)",
        date: "9 เม.ย. 2569",
        changes: [
            "UI: Major User Manual overhaul with premium aesthetic and Head meta",
            "TECH: Added dynamic domain detection for TV casting instructions",
            "UX: Expanded multi-method casting guides (HDMI, Cast, TV Browser, YouTube)",
            "DESIGN: Refined step-by-step logic with high-fidelity Lucide icons"
        ],
        recent_updates: "Fully Comprehensive Interactive Manual"
    },
    {
        version: "v5.2.5 (Wording & Flow Mastery)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Improved Dual Screen instructions with operational flow logic",
            "UX: Fixed awkward 'Player' translations in Remote guide",
            "DESIGN: Refined step-by-step descriptions for better accessibility",
            "STABILITY: Verified tutorial responsiveness on mobile and tablet"
        ],
        recent_updates: "Professional Manual Wording & Flow"
    },
    {
        version: "v5.2.4 (Ultimate Cast Guide)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Expanded Display/Cast section with 3 distinct setup methods",
            "UX: Added detailed HDMI Dual Screen and Smart TV Browser instructions",
            "DESIGN: Refined step descriptions for better clarity and vertical rhythm",
            "GUIDE: Unified all casting possibilities into a single responsive tab"
        ],
        recent_updates: "Comprehensive Display & Casting Guide"
    },
    {
        version: "v5.2.3 (Complete User Guide)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Finalized 5-category Interactive Manual (Search, Remote, Display, Queue, VIP)",
            "UX: Implemented approved Table of Contents with simplified instructions",
            "DESIGN: Applied premium Pure Flat aesthetic with high-density step cards",
            "FEATURE: Added 'Expert Tips' section for advanced system usage"
        ],
        recent_updates: "Complete Interactive Step-by-Step Guide"
    },
    {
        version: "v5.2.2 (Interactive User Guide)",
        date: "8 เม.ย. 2569",
        changes: [
            "CRITICAL: Replaced legacy LimitReachedModal with dynamic version",
            "SYNC: Fully connected production quota modal to Admin Dashboard settings",
            "PURGE: Final elimination of all shadows, gradients, and glows from player modals",
            "STABILITY: Verified real-time Firestore synchronization for upsell messaging"
        ],
        recent_updates: "Fully Dynamic and Pure Flat Quota System"
    },
    {
        version: "v5.1.9 (Full Dynamic Upsell)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Connected GuestLimitModal to real-time Admin Dashboard settings",
            "DYNAMIC: Sync Title, Subtitle, Offer Text, and Button labels from Firestore",
            "CLEANUP: Removed all hard-coded marketing strings from components",
            "DESIGN: Maintained 100% Pure Flat architectural consistency"
        ],
        recent_updates: "Admin-driven Dynamic Marketing Modal"
    },
    {
        version: "v5.1.8 (Compliance & Messaging Polish)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Refined GuestLimitModal wording to emphasize YouOke's role as a queue manager",
            "UI: Integrated Gmail-centric connection language for clarity and legal compliance",
            "POLISH: Further compacted the modal layout for a tighter, more professional feel",
            "STABILITY: Final synchronized design for member-linking components"
        ],
        recent_updates: "Legally-aware and Compact Quota Messaging"
    },
    {
        version: "v5.1.7 (Guest Limit UX Polish)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Streamlined GuestLimitModal with concise, high-impact messaging",
            "DESIGN: Removed all background flows and persistent shadows from buttons and containers",
            "POLISH: Implemented a more compact layout with high-density typography for a premium feel",
            "STABILITY: Final design hardening for quota-limit components"
        ],
        recent_updates: "Compact and Shadowless Quota Modal"
    },
    {
        version: "v5.1.6 (Total Shadow Purge - Final)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Total Shadow Purge across SidebarPlayer, PlayerControls, and Audio Switcher",
            "DESIGN: Achieved 100% Pure Flat Design consistency for both Player and Remote Control ecosystems",
            "POLISH: Eliminated all remaining glows and micro-shadows for a definitive high-end minimalist look"
        ],
        recent_updates: "Project-wide 100% Pure Flat Design reached"
    },
    {
        version: "v5.1.5 (Total Shadow Purge)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Total Shadow Purge for Remote Control (Toasts, Feedback, and Confirmation containers)",
            "DESIGN: Reached 100% Pure Flat consistency in the Remote Control module",
            "POLISH: Removed defensive !shadow-none and replaced with inherently flat structures"
        ],
        recent_updates: "100% Zero-Shadow consistency achieved for Remote UI"
    },
    {
        version: "v5.1.4 (Playlist Width Fix)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Fixed Playlist Modal layout to fill full width, eliminating empty gaps",
            "UI: Enhanced '+' (Create) button visibility with dynamic theme-aware colors",
            "POLISH: Improved input placeholder contrast for better accessibility in Dark Mode",
            "STABILITY: Final alignment of all Playlist management UI components"
        ],
        recent_updates: "Tight and high-contrast Playlist UI with full-width layout"
    },
    {
        version: "v5.1.3 (Playlist UX Overhaul)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Redesigned 'Add to Playlist' modal for a more compact and focused layout",
            "UI: Simplified playlist items by removing broken/complex cover images and using clean icons",
            "POLISH: Enhanced 'Close Window' button visibility with high-contrast flat styling",
            "DESIGN: Stripped all remaining hover shadows from playlist items for a pure flat feel"
        ],
        recent_updates: "Compact and clean Playlist management UI"
    },
    {
        version: "v5.1.2 (Shadow Purify)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: System-wide Shadow Purify for all major modals (GlobalConfirmModal, GuestLimitModal, PremiumUpsell)",
            "UI: Standardized Pure Flat Design for consistent premium look across different modules",
            "DESIGN: Replaced remaining shadow-lg/xl with solid borders and high-density zinc backgrounds"
        ],
        recent_updates: "Unified Pure Flat Design across all main UI popups"
    },
    {
        version: "v5.1.1 (Shadowless Polish)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI/UX: Rewrote confirmation buttons to use inherently shadow-less structures for ultimate flat appearance",
            "UI/UX: Realigned 'Cancel' button styling with the project's cleanest modal patterns",
            "STABILITY: Final polish for Remote Control v5.1 system stability and UX"
        ],
        recent_updates: "Comprehensive shadow-less button overhaul for premium flat design"
    },
    {
        version: "v5.1.0 (Strict Flat UI)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Enforced !shadow-none across confirmation modals to override third-party library defaults (DaisyUI)",
            "UI: Added ring-0 and border-refinement for ultimate pure flat appearance",
            "POLISH: Enhanced visibility and contrast for action buttons in high-glare environments"
        ],
        recent_updates: "Strict Zero-Shadow Policy enforcement for Remote Control"
    },
    {
        version: "v5.0.9 (Pure Flat UI)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI/UX: Applied 'Zero Shadow Policy' to confirmation modals for a cleaner, premium flat look",
            "UI/UX: Re-designed 'Cancel' button with high-contrast colors and solid borders for better visibility",
            "DESIGN: Removed all glows and drop-shadows from action buttons in both light/dark modes"
        ],
        recent_updates: "Confirmation Modal UI overhaul for accessibility and flat design standards"
    },
    {
        version: "v5.0.8 (Nuclear Stability)",
        date: "8 เม.ย. 2569",
        changes: [
            "FIX: Final resolution for 'TypeError: split' by switching to full-refresh (window.location) on room exit",
            "STABILITY: Hardened version parsing and room code entry with strict type guards",
            "STABILITY: Replaced all fragile router.push redirects with clean origin-based navigation for critical state transitions"
        ],
        recent_updates: "Critical stability fix for Remote Control navigation crashes"
    },
    {
        version: "v5.0.7 (Remote UX Fix)",
        date: "8 เม.ย. 2569",
        changes: [
            "UI: Replaced browser native confirm() with custom Premium Modal for better UX",
            "FIX: Improved Search Toggle visibility in Dark Mode (fixed invisible black text)",
            "STABILITY: Hardened RemoteControlApp to prevent TypeError: split on state transitions",
            "UX: Added auto-focus and better contrast for search inputs in both themes"
        ],
        recent_updates: "Premium Custom Modals and Dark Mode UI visibility fixes"
    },
    {
        version: "v5.0.6 (Remote Stability)",
        date: "8 เม.ย. 2569",
        changes: [
            "STABILITY: Fixed 'TypeError: split' crash on Remote Control by hardening roomCode and Search strings",
            "RECOVERY: Added Aggressive Re-session logic in CastService for recovery after long device sleep",
            "UI: Added 'Leave Room' (Disconnect) button in the Remote Control header as requested",
            "SECURITY: Implemented strict type checking for all Firebase state inputs in Remote control module"
        ],
        recent_updates: "Resolved Remote Control crashes and restored the Disconnect button"
    },
    {
        version: "v5.0.5 (Chromecast Presence)",
        date: "8 เม.ย. 2569",
        changes: [
            "PRESENCE: Implemented Bidirectional Heartbeat (PING/PONG) between Sender and TV",
            "UI: Added connection health indicator dot (Green/Yellow/Red) on both Mobile and TV",
            "STABILITY: Added Wake Lock API in MainLayout to prevent screen sleep while casting",
            "RECOVERY: Automatic connection quality tracking (Good/Weak/Lost) with fallback reset",
            "FIX: Standardized connection status UI across Remote Control and Chromecast modes"
        ],
        recent_updates: "Real-time connection health tracking and screen stay-awake system"
    },
    {
        version: "v5.0.4 (Major Stability & Quality Fix)",
        date: "8 เม.ย. 2569",
        changes: [
            "STABILITY: Fixed song title lag (1-song-behind) when auto-playing or removing items",
            "QUALITY: Forced HD video resolution (720p/1080p) for Smart TV/Chromecast display",
            "RECOVERY: Added Long Sleep detection and state recovery for sessions inactive > 5 mins",
            "SYNC: Optimized wake-up synchronization to prevent queue overwriting from sender",
            "FIX: Resolved issue where the Disconnect button would disappear or fail to reset state"
        ],
        recent_updates: "Comprehensive fix for Chromecast sync stability and playback quality"
    },
    {
        version: "v5.0.3 (Chromecast Recovery Fix)",
        date: "8 เม.ย. 2569",
        changes: [
            "STABILITY: Forced Chromecast listener re-binding on mobile screen wake-up",
            "CONNECTIVITY: Added 30s Heartbeat (PING) to maintain Cast session during background/sleep",
            "PWA: Integrated Page Lifecycle API (resume/pageshow) for better Android/iOS standby support"
        ],
        recent_updates: "Fixed critical bug where users lose control of Chromecast after screen sleep"
    },
    {
        version: "v5.0.2 (Optimization & Stability)",
        date: "7 เม.ย. 2569",
        changes: [
            "PERFORMANCE: Optimized MainLayout store subscription to eliminate global redundant re-renders during playback",
            "STABILITY: Implemented 'Echo Loop' filtering in CastContext to prevent message bouncing between TV and App",
            "CLEANUP: Removed legacy queue references and standardized on playerQueue shallow selectors",
            "FIX: Improved session recovery logic when mobile devices wake up from background/sleep"
        ],
        recent_updates: "Significant performance boost for mobile devices"
    },
    {
        version: "v5.0.1 (YouTube TV Playable)",
        date: "7 เม.ย. 2569",
        changes: [
            "FEATURE: YouTube Cast One-shot Playlist (Watch Videos Pool) for a fallback big screen experience",
            "R&D: Started YouTube Lounge Pairing Service (Phase 1-2) for native Smart TV app control",
            "FIX: layoutMode type overlap lint errors in MainLayout for stable deployment",
            "MAJOR: Transitioned to Version 5.0.1 - Optimization for YouTube Smart TV fallback playback"
        ],
        recent_updates: "Added playlist support to native YouTube cast button"
    },
    {
        version: "v5.0.0 (Global Sync & Admin Shield)",
        date: "7 เม.ย. 2569",
        changes: [
            "MAJOR: Transitioned to Version 5.0 - Ready for global parallel deployment (Vercel & HostAtom)",
            "Admin Shielding: Implemented owner-level role protection and forced lifetime membership for admins",
            "Global Analytics: Integrated direct GA4 property tracking with play.okeforyou.com data stream",
            "Universal URLs: Replaced all hardcoded endpoints with dynamic location-based origin detection",
            "Infrastructure Hardening: Corrected role overwrite bugs in membership service and improved sync reliability"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.143 (Real GA4 Setup)",
        date: "7 เม.ย. 2569",
        changes: [
            "Real GA4 Integration: Created and connected Measurement ID (G-W24PCG0903) specifically for the YouOke project",
            "Direct Analytics Linking: Updated the Admin Dashboard to link directly to the YouOke Property reports (p427420173)",
            "Data Stream Setup: Configured a new web stream for play.okeforyou.com in Google Analytics Console",
            "Environment Sync: Updated production variables to ensure tracking is active immediately upon deployment"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.142 (Global Analytics & URL Fix)",
        date: "7 เม.ย. 2569",
        changes: [
            "GA4 Integration: Added Measurement ID (G-LWHGETR85E) to track traffic across both HostAtom and Vercel",
            "Zero Hardcode Policy: Refactored LINE Login and Auth logic to use window.location.origin for seamless multi-domain support",
            "Multi-Stats Dashboard: Added quick-access buttons for both Google Analytics (Total) and Vercel Analytics (Live Staging)",
            "Environment Hardening: Corrected duplicate variable declarations and fixed redundant logic in Auth Store"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.141 (Dashboard Hotfix)",
        date: "7 เม.ย. 2569",
        changes: [
            "Corrected Analytics URL: Updated the Vercel Analytics quick-link to the correct project namespace",
            "Final Role Verification: Confirmed all admin roles are now protected under the new shielding logic"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.140 (Security & Role Hardening)",
        date: "7 เม.ย. 2569",
        changes: [
            "Admin/Owner Shielding: Protected youoke.okeforyou@gmail.com and existing admins from role regressions during data sync",
            "In-Memory Membership Enforcement: Forced 'LIFETIME' membership display and status for all active admins to prevent UI inconsistency",
            "Defensive Service Architecture: Updated AdminService to verify and preserve existing roles when modifying memberships or payments",
            "Expiry Logic Protection: Shielded admin accounts from the automatic membership expiry downgrade system"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.139 (Admin Insights)",
        date: "7 เม.ย. 2569",
        changes: [
            "Integrated Vercel Analytics Quick-Link: Added a live visitor tracking button to the Admin Dashboard header",
            "Enhanced Dashboard Layout: Improved header responsiveness for analytics and time display symbols",
            "Refined Analytics Sync: Ensured seamless transition between app administration and traffic monitoring"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.138 (Remote Debug & Hardening)",
        date: "7 เม.ย. 2569",
        changes: [
            "Debugged and hardened RemoteControlApp with robust type guards for roomCode and localStorage",
            "Prevented TypeError in Auth Store by adding safe-guards for email.split()",
            "Improved resiliency of presence logic and guest name handling"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.137 (MainDashboard Upgrade)",
        date: "7 เม.ย. 2569",
        changes: [
            "Official Renaming: SpotifyDashboard transitioned to MainDashboard to align with YouOKE's independent identity",
            "UI Polish & Symmetry: Standardized all directory cards (Artist, Station, Charts) to a consistent aspect-[1.3/1] ratio",
            "Content Purge: Removed redundant descriptions from artist category cards to achieve a cleaner, flat aesthetic",
            "Native QR Restoration: Replaced external QR API with QRCodeSVG component in MainLayout for instant remote pairing"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.136 (Universal Source Fix)",
        date: "7 เม.ย. 2569",
        changes: [
            "Fixed Artist Module Blank State: Resolved conditional rendering break in SpotifyDashboard from previous edits",
            "Absolute Source of Truth: Eradicated hardcoded version strings from router queries to allow full automation",
            "Ultimate Queue Drag Polish: Stripped away all remaining transition properties to achieve perfectly flat, non-bouncing movement",
            "System-Wide Sync: Verified v4.10.136 alignment across all deployment layers"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.135 (Smooth Integrity)",
        date: "7 เม.ย. 2569",
        changes: [
            "Fixed Bouncing Queue: Removed hover transformation and shadow from queue cards to ensure 100% stable drag-and-drop behavior",
            "Unified Version Hub: Synchronized version labels across all project layers (package.json and changelog) to v4.10.135",
            "Pure Flat Drag: Locked interaction state to simple opacity changes only, maintaining a calm and predictable UI"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.134 (Absolute UX Simplicity)",
        date: "7 เม.ย. 2569",
        changes: [
            "Simplified Queue Drag Interface: Removed all scaling, shadow effects, and decorative rings to match Pure Flat Design standards",
            "Fixed Theme Inconsistency: Removed hardcoded background colors during drag, using only 0.5 opacity for interaction feedback",
            "System Information Integrity: Restored automated version synchronization by using CHANGELOGS as the single source of truth for UI labels"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.132 (Ultimate Desktop Uniformity)",
        date: "7 เม.ย. 2569",
        changes: [
            "Fixed Desktop Scaling: Locked font sizes to text-[10px] sm:text-xs to prevent text from looking huge on wide browser windows",
            "Hardware Standard Grid: Enforced equal grid break-points (grid-cols-2 to sm:grid-cols-4 lg:grid-cols-4) uniformly across Chart, Station, and Artist modules",
            "Permanent Queue & Player: Nullified queue toggling logic on desktop to make the Video Player and Queue permanently docked on the right side for all users"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.131 (Final Layout Unification)",
        date: "7 เม.ย. 2569",
        changes: [
            "Definitive Card Sync: All category cards across Artist, Chart, and Station modules are now locked to aspect-[1.3/1] and text-[9.5px] on mobile",
            "Permanent Video Player: Refined right-side layout so the player and queue are always visible and accessible for elderly users",
            "Design Lockdown: Hard-coded spacing and typography tokens to ensure absolute visual consistency across all modules"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.130 (One Design Standard)",
        date: "7 เม.ย. 2569",
        changes: [
            "Total Unification: Standardized 100% of category cards across Chart, Artist, and Station modules to use identical grid-cols-2 and aspect-[1.3/1] on mobile",
            "Micro-Typography: Reduced headline font to text-[9.5px] for an ultra-compact, professional look that never overlaps",
            "Consistent Gaps: Unified p-2.5 padding and gap-3 for all category containers to ensure a balanced aesthetic"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.129 (Unified Category UI Fix)",
        date: "7 เม.ย. 2569",
        changes: [
            "Card Consistency Fix: ListHitsGrid (Charts) now strictly matches SpotifyDashboard (Artist/Station) card style",
            "Typography Unified: All category headings now use text-[11px] on mobile with black/uppercase styling",
            "Clean Architecture: Removed all lingering description tags inside category cards as per user request"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.128 (Unified UI Architecture)",
        date: "7 เม.ย. 2569",
        changes: [
            "Unified Category Cards: standardizing font size and layout across Artist, Chart, and Station modules",
            "Clean Look: Removed descriptions from all category cards for a more minimalist and consistent aesthetic",
            "Responsive Polish: Balanced text proportions (text-[12px] for small mobile) to prevent overlapping"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.127 (Refined Typography)",
        date: "6 เม.ย. 2569",
        changes: [
            "Card Typography Polish: Scaled down category headlines to text-sm for a cleaner, more minimalist look",
            "Responsive Balance: Adjusted line-height and letter-spacing to improve readability at smaller sizes",
            "Design Consistency: Standardized headtitle sizes across Chart and Station modules"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.126 (Ultimate Mobile Fix)",
        date: "6 เม.ย. 2569",
        changes: [
            "Ultimate Responsive Layout: Switched to 1-column layout for extremely small screens (<440px) to prevent text overlap",
            "Typography Boost: Improved text size and readability on mobile by taking full width of the viewport",
            "Stability Fix: Resolved broken file structure in ListHitsGrid from previous partial edits"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.125 (Extreme Mobile Fix)",
        date: "6 เม.ย. 2569",
        changes: [
            "Extreme Responsive Overhaul: Reduced font sizes and adjusted aspect ratios for small screens to prevent overlapping",
            "Text Scaling: Implemented text-[9px] and better line-height management for Card titles on mobile",
            "Density Adjustments: Refined gap and padding on narrow viewports to give maximum room per card",
            "Station Card Typography: Scaled down h3 titles to text-xs/text-sm for better visual hierarchy on mobile"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.124 (Mobile Layout Fix)",
        date: "6 เม.ย. 2569",
        changes: [
            "Responsive Polish: Fixed overlapping cards in Station/Home screens by adjusting grid layouts for small devices",
            "Adaptive Grids: Implemented min-[400px]:grid-cols-3 to prevent text compression on narrow viewports",
            "UI Refinement: Adjusted icon scaling and padding to ensure readability in Pure Flat design"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.123 (Clean Sidebar)",
        date: "6 เม.ย. 2569",
        changes: [
            "Seamless Sidebar Header: Removed the horizontal divider line under the logo for a smoother, integrated aesthetic",
            "Aligned with Pure Flat Design standards: Direct continuity from Logo to Navigation menu"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.122 (Pure Flat Purge)",
        date: "6 เม.ย. 2569",
        changes: [
            "Pure Flat Design Purge: Removed all box-shadows from Modals, Buttons, and Package Cards",
            "Border Enforcement: Replaced shadows with subtle solid borders to maintain UI hierarchy",
            "Retained ProgressBar structure while cleaning up visual noise in Dashboard and Profile layers"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.121 (Premium Guard Modal)",
        date: "6 เม.ย. 2569",
        changes: [
            "Replaced legacy browser alert with a premium Headless UI Modal for LINE connection guard",
            "Added smooth transitions and custom LINE branding to the connection prompt",
            "Improved UX: Clearer instructions and direct action button to the profile connection page"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.120 (LINE Connection Guard)",
        date: "6 เม.ย. 2569",
        changes: [
            "Mandatory LINE Connection: Users must now connect LINE before selecting or purchasing any package",
            "Enhanced Communication: Ensures Admin can always contact Members via LINE for payment approval",
            "Fixed Security Loophole: Prevented package registration from Email-only logins without LINE verification"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.119 (Smooth Progress Lock)",
        date: "6 เม.ย. 2569",
        changes: [
            "Fixed ProgressBar 'Rubber-banding': Implemented Smart Seek Lock to ignore stale player time updates during seeks",
            "Enhanced Visual Accuracy: ProgressBar now follows the seek target instantly without jumping back",
            "Stabilized Remote Sync: Cross-tab time updates are now filtered for consistency during active user interactions"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.118 (Remote QR Persistence)",
        date: "6 เม.ย. 2569",
        changes: [
            "Fixed Remote QR Modal disappearing act: Disabled partyPIN deletion upon Cast disconnect",
            "Ensured roomCode persists so the Mobile Remote feature remains functional post-Cast session",
            "Fixed Ghost state synchronization by routing UI state clears correctly through useUIStore"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.117 (Cast & QR UI Stability)",
        date: "6 เม.ย. 2569",
        changes: [
            "Fixed Remote QR accessibility: Force clears stale UI castMode when switching from Cast back to Remote pairing",
            "Ensured SidebarControls re-syncs with SDK status immediately upon button click",
            "Stabilized Auto-Version Sync across all Dashboard layout components"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.116 (Sequence Fix)",
        date: "6 เม.ย. 2569",
        changes: [
            "Fixed 'vundefined' version display error by reordering code execution",
            "Ensured SYSTEM_VERSION correctly pulls from CHANGELOGS after initialization",
            "Automated version sync is now fully functional across Dashboard and Changelog"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.115 (Source of Truth)",
        date: "6 เม.ย. 2569",
        changes: [
            "Automated version synchronization: SYSTEM_VERSION now pulls directly from the latest changelog entry",
            "Ensured Dashboard version label matches Changelog for 100% UI consistency",
            "Fixed potential stale state in Cast/Remote pairing"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.114 (Remote Connectivity)",
        date: "6 เม.ย. 2569",
        changes: [
            "Improved Cast/Remote switching logic: Clears stale connection state if SDK is disconnected",
            "Ready-on-demand QR Code: Modal now shows QR Code immediately after canceling Cast",
            "Fixed Dashboard version sync across deployment layers"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.113 (Stability Update)",
        date: "6 เม.ย. 2569",
        changes: [
            "Enhanced Cast/Remote Readiness: Clean disconnect from SDK now triggers UI state reset",
            "Ensured safe logic for song selection during connection transitions"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.112 (Flat Design Phase 2)",
        date: "6 เม.ย. 2569",
        changes: [
            "Total Shadow & Glow removal: Stripped all shadow-xl and neon glow classes for clean aesthetic",
            "Dashboard Sidebar and Player UI now strictly follow Flat Design standards"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.111 (Chart Cover Fix)",
        date: "6 เม.ย. 2569",
        changes: [
            "Fixed Queue thumbnail display logic: Prioritize video.thumbnail for Chart/Firestore songs",
            "Restored stable Playback engine baseline for 100% reliability"
        ],
        recent_updates: ""
    },
    {
        version: "4.10.107 (Stability Patch)",
        date: "6 เม.ย. 2569",
        changes: [
            "Fixed missing thumbnails in queue for songs selected from charts",
            "Refined Guest Permission modal UI with premium shadows and button effects",
            "Unified Guest song quota to standard 10 songs/day across all layers",
            "Fixed potential crash in QueueList component"
        ],
        recent_updates: ""
    }
];

import { safeSplit, safeStartsWith, safeSlice } from '@/utils/stringUtils';

// 🛠️ v5.3.42: Industrial-Grade Splitting Shield
export const COMMIT_ID = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
    ? `#${safeSlice(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA, 0, 7)}` 
    : "";

export const getLatestVersion = () => {
    const latest = CHANGELOGS[0]?.version;
    const cleanVersion = safeStartsWith(latest, 'v') ? (latest as string).substring(1) : latest;
    return safeSplit(cleanVersion, " ", ["5.3.42"])[0];
};

export const SYSTEM_VERSION = getLatestVersion();
export const SYSTEM_CODENAME = "Pure Flat Shield";
export const VERSION_LABEL = `${COMMIT_ID || '#local'} v${SYSTEM_VERSION} (${SYSTEM_CODENAME})`;
