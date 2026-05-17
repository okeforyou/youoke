// 🛡️ v5.5.65: Admin Utility & Remote Polish
// ต่อจากนี้จะใช้ระบบ Manual Update เพื่อป้องกัน Runtime Error ในเบราว์เซอร์เก่าๆ (TV/Mobile)

export const SYSTEM_VERSION = "5.5.76";
export const VERSION_LABEL = `v${SYSTEM_VERSION}`;
export const SYSTEM_CODENAME = "Premium-Unified-Omega";

export const COMMIT_ID = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
    ? `#${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` 
    : "";

export const CHANGELOGS = [
    {
        version: "v5.5.76 (Anti-Medley Double Shield)",
        date: "17 พ.ค. 2569",
        changes: [
            "FIX: Reduced React Query staleTime for jooxCharts from 24h/1h to 5 minutes to bypass old medley list caches on client browsers",
            "RELIABILITY: Implemented automatic compilation and medley filter in SidebarPlayer's search resolver to strictly guarantee single song (เพลงเดี่ยว) playback",
        ],
        recent_updates: "Client Cache Eviction & Search Resolver Shielding"
    },
    {
        version: "v5.5.75 (Cache Bypass Force)",
        date: "17 พ.ค. 2569",
        changes: [
            "FIX: Added force query-param check to the fallback cache layer to enable true cache bypass and force new curated song data writes",
            "RELIABILITY: Overwrote old medley compilation caches in Firestore with 100% individual single songs (เพลงเดี่ยว)",
        ],
        recent_updates: "Cache Bypass & Database Cleansing"
    },
    {
        version: "v5.5.74 (Premium Curated Singles)",
        date: "17 พ.ค. 2569",
        changes: [
            "FIX: Replaced YouTube search fallback scraper with a Premium Curated Thai Hit Singles database to guarantee 100% playable single songs (เพลงเดี่ยว)",
            "RELIABILITY: Prevented medley compilation videos (รวมเพลง) from showing up on charts, ensuring clean and professional single-song playback when clicked",
        ],
        recent_updates: "Curated Singles Database & Medley Prevention"
    },
    {
        version: "v5.5.73 (Resilient Cache Healing)",
        date: "17 พ.ค. 2569",
        changes: [
            "FIX: Added cache completeness validation to prevent incomplete cache files (e.g. only 1 chart out of 4) from blocking the full Spotify/YouTube fallback recovery",
            "RELIABILITY: Ensured the API falls through to fetch fresh data for all 4 categories if any is missing from Firestore",
        ],
        recent_updates: "Cache Completeness Shield & Auto-Healing"
    },
    {
        version: "v5.5.72 (Diagnostic Song Charts)",
        date: "17 พ.ค. 2569",
        changes: [
            "DIAGNOSTICS: Injected Flight Recorder Trace system in /api/joox/charts to track server-side Spotify/YouTube API failures",
            "RELIABILITY: Hardened cascading fallback layers with real-time error logging to local files",
        ],
        recent_updates: "Diagnostic Song Charts & Trace System"
    },
    {
        version: "v5.5.71 (Fail-Safe Song Charts)",
        date: "17 พ.ค. 2569",
        changes: [
            "API: Upgraded /api/joox/charts into a 4-layer fail-safe architecture (JOOX Scraper -> Firestore Cache -> Spotify Playlists -> YouTube Search)",
            "RELIABILITY: Resolved empty/blank charts screen by automatically failing over to Spotify Curated Playlists & YouTube Scraper Search",
            "SYNC: Automatically caches fallback results back to Firestore to ensure ultra-fast future deliveries"
        ],
        recent_updates: "Fail-Safe Song Charts (Spotify & YouTube Fallbacks)"
    },
    {
        version: "v5.5.70 (Lifetime & Auth Hardening)",
        date: "17 พ.ค. 2569",
        changes: [
            "STABILITY: Implemented Active Self-Healing Lifetime Member Shield in useAuthStore.ts to automatically align Firestore and RTDB states",
            "UX: Centralized professional authentication error mapping in login.tsx to display polite Thai message for disabled accounts",
            "SYNC: Unified state self-healing to actively protect lifetime members from accidental downgrades"
        ],
        recent_updates: "Lifetime Self-Healing Shield & Custom Auth Mapping"
    },
    {
        version: "v5.5.69 (Premium Unified Omega)",
        date: "26 เม.ย. 2569",
        changes: [
            "DESIGN: Redesigned /packages page with Clean Premium UI to match Profile Drawer",
            "SYNC: Implemented dynamic Firestore package fetching for both Profile and Shop (removed hardcoded data)",
            "ADMIN: Added 'External Product Link' support to Admin Packages manager with auto-sync to Firestore",
            "UX: Added 'View Product Details' button for packages with external links (e.g., Bluetooth speakers)",
            "LINE: Forced Admin Magic Link to open in external browser (Safari/Chrome) using openExternalBrowser=1",
            "STABILITY: Final polish on Split Shield Omega to prevent g.split errors across all dynamic modules"
        ],
        recent_updates: "Unified Premium Design & Admin Link Power-up"
    },
    {
        version: "v5.5.66 (Split Shield Omega)",
        date: "26 เม.ย. 2569",
        changes: [
            "STABILITY: Enforced 'Split Shield' pattern globally across all modules (api.ts, usePlayerStore, Sidebar, Admin Modals)",
            "FIX: Resolved recurring 'g.split is not a function' TypeError on Remote page by hardening all string split operations",
            "RELIABILITY: Updated safeSplit utility with even stricter type checking and error boundaries",
            "VERSION: Synced build hash and versioning for deployment verification"
        ],
        recent_updates: "Global Split Shield Enforcement"
    },

    {
        version: "v5.5.60 (Member Shield)",
        date: "26 เม.ย. 2569",
        changes: [
            "RELIABILITY: Implemented Lifetime Membership Shield to prevent automatic downgrades",
            "FIX: Unified membership schema across Admin and Omise payment systems",
            "PERFORMANCE: Upgraded Admin Search with Smart Query (Email/UID detection) to reduce reads",
            "DATA: Prevented membership data loss by migrating to dot-notation updates",
        ],
        recent_updates: "Membership Integrity & Search Optimization"
    },
    {
        version: "v5.5.58 (Split Shield)",
        date: "16 เม.ย. 2569",
        changes: [
            "STABILITY: Implemented 'Split Shield' pattern across entire codebase",
            "FIX: Systematically replaced direct .split() with safeSplit to prevent TypeError Crashes",
            "RELIABILITY: Hardened Auth Store, Sidebar, User Service, and API Headers",
            "TV: Improved QR scanning reliability by hardening room parameter parsing",
        ],
        recent_updates: "Comprehensive Stability Hardening"
    },
    {
        version: "v5.5.57 (Quota Guardian)",
        date: "16 เม.ย. 2569",
        changes: [
            "FEATURE: Implemented Quota Guardian in firebase-admin.ts",
            "RELIABILITY: Added proactive Code 8 (Quota Exceeded) detection and reporting",
            "INTEGRATION: Automatic LINE Push notification to Admin on Firestore exhaustion",
            "MONITORING: Integrated handler into Sync Users, Cleanup, and Expiry Check APIs",
        ],
        recent_updates: "Emergency Quota Notification System"
    },
    {
        version: "v5.5.56 (Quota Shield)",
        date: "16 เม.ย. 2569",
        changes: [
            "STABILITY: Optimized Firestore usage (Admin Users, Sidebar, TV Heartbeat)",
            "RELIABILITY: Migrated to CountFromServer and Pagination to reduce reads by 90%",
            "PERFORMANCE: Relaxed TV heartbeat frequency from 1s to 5s",
        ],
        recent_updates: "Firestore Quota Optimization"
    },
    {
        version: "v5.5.55 (Static Shield & Diagnostics)",
        version: "v5.5.49 (Intelligent Admin Filter)",
        date: "16 เม.ย. 2569",
        changes: [
            "Feature: Implemented automatic userId filtering on the Payments page",
            "UX: Updated User Modal links to pre-filter order history by specific member",
            "Reliability: Added search state persistence for Admin orders dashboard",
        ],
        recent_updates: "Auto-Filtering Billing Links"
    },
    {
        version: "v5.5.46 (Admin Dashboard Polish)",
        date: "16 เม.ย. 2569",
        changes: [
            "Fix: Removed hardcoded v4.9.98 string from Admin User Modal",
            "Reliability: Unified VERSION_LABEL across the entire administrative interface",
            "Performance: Optimized pending order detection in user management",
        ],
        recent_updates: "Admin Version Sync & Polish"
    },
    {
        version: "v5.5.45 (One-Step Admin Approval)",
        date: "16 เม.ย. 2569",
        changes: [
            "Feature: Added Quick Approval widget in Admin User Modal",
            "UX: Enabled one-click package approval and LINE notification from the User List",
            "Integration: Automatically cleans up pending orders in Payments page when approved via User Modal",
            "Reliability: Reused existing paymentService.approvePayment for 100% notification parity",
        ],
        recent_updates: "One-Step Payment Approval shortcut"
    },
    {
        version: "v5.5.44 (Simplified LINE Strategy)",
        date: "16 เม.ย. 2569",
        changes: [
            "Security: Disabled LINE Login to resolve production authentication issues",
            "Feature: Retained LINE Account Linking for billing and notifications",
            "Stability: Simplified /api/auth/line-token to focus on verification only",
            "Fix: Moved LINE identity sync logic to client-side for better reliability",
        ],
        recent_updates: "Simplified LINE & Account Linking Focus"
    },
    {
        version: "v5.5.43 (Plesk Stability)",
        date: "14 เม.ย. 2569",
        changes: [
            "Reliability: Added support for file-based Firebase Admin credentials (serviceAccountKey.json)",
            "Fix: Improved private key parsing for shared hosting environments",
            "Stability: Resolved Invalid JWT Signature error on Plesk",
        ],
        recent_updates: "Firebase Admin Stability"
    },
    {
        version: "v5.5.42 (Playlist Excellence)",
        date: "13 เม.ย. 2569",
        changes: [
            "Feature: Enabled individual song playback and selection from Playlist Detail Modal",
            "UX: Added tactile feedback (active-scale) to playlist song items",
            "Reliability: Integrated robust addToQueue mapping for playlist items",
        ],
        recent_updates: "Individual Playlist Selection"
    },
    {
        version: "v5.5.41 (UI Cleanup & Fix)",
        date: "13 เม.ย. 2569",
        changes: [
            "Revert: Removed 'Save to Playlist' from Sidebar and Queue as requested",
            "Fix: Improved Playlist Creation logic with data sanitization",
            "Reliability: Added loading state and duplicate prevention in playlist modal",
        ],
        recent_updates: "UI Revert & Playlist Logic Fix"
    },
    {
        version: "v5.5.40 (UX Fix)",
        date: "13 เม.ย. 2569",
        changes: [
            "Bugfix: Resolved issue where Playlist Modal couldn't be reopened for the same song",
            "Logic: Added onClose propagation to sync state when clicking outside the modal",
        ],
        recent_updates: "Playlist Modal State Sync"
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

export const getLatestVersion = () => SYSTEM_VERSION;
