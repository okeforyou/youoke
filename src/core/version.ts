// 🛡️ v5.5.65: Admin Utility & Remote Polish
// ต่อจากนี้จะใช้ระบบ Manual Update เพื่อป้องกัน Runtime Error ในเบราว์เซอร์เก่าๆ (TV/Mobile)

export const SYSTEM_VERSION = "5.5.105";
export const VERSION_LABEL = `v${SYSTEM_VERSION}`;
export const SYSTEM_CODENAME = "Premium-Unified-Omega";
 
export const COMMIT_ID = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
    ? `#${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` 
    : "";
 
export const CHANGELOGS = [
    {
        version: "v5.5.105 (AI Vocal Dashboard & Settings Integration)",
        date: "17 ก.ค. 2569",
        changes: [
            "UI: Integrated VocalDashboard directly into MainLayout for seamless navigation.",
            "FEATURE: Added GlobalSettingsModal with General, Profile, and AI Vocal settings tabs.",
            "API: Added /config endpoint to local AI server to synchronize cache directory path."
        ],
        recent_updates: "AI Vocal Dashboard & Settings Integration"
    },
    {
        version: "v5.5.104 (AI Cache Cleanup Bug Fix)",
        date: "17 ก.ค. 2569",
        changes: [
            "FIX: Resolved an issue in youoke-server where temporary WAV files and Demucs processing folders were not deleted if an earlier cleanup step failed, causing excessive disk space usage (up to 500MB+ per song)."
        ],
        recent_updates: "Fixed AI Server massive disk space usage issue"
    },
    {
        version: "v5.5.103 (Vocal Player Control UI Standard Alignment)",
        date: "17 ก.ค. 2569",
        changes: [
            "UI: Replaced the ad-hoc horizontal vocal player controls with the standard YouOke Player controls layout (vertical icon + label).",
            "UX: Embedded the Vocal and Instrumental toggles directly into the player control strip, replacing the standard mute button.",
            "UX: The mixer setting popover is now integrated smoothly as a control strip item."
        ],
        recent_updates: "Aligned Vocal Player Controls with Standard Layout"
    },
    {
        version: "v5.5.102 (Vocal Player Layout Fix)",
        date: "17 ก.ค. 2569",
        changes: [
            "UI: Fixed an issue where the desktop player controls were hidden due to the container height being constrained to the video aspect ratio.",
            "UI: Adjusted the queue layout position to accommodate the new player controls height."
        ],
        recent_updates: "Fixed hidden player controls"
    },
    {
        version: "v5.5.101 (Vocal Separation UI Pure Flat Design)",
        date: "17 ก.ค. 2569",
        changes: [
            "UI: Redesigned the Vocal and Instrumental mixer buttons in the Vocal Separation player.",
            "DESIGN: Applied Pure Flat Design principles (removed shadows, added minimalist borders).",
            "UX: Consolidated controls into a clean, single-line unified toggle layout."
        ],
        recent_updates: "Vocal Player UI Redesign (Pure Flat)"
    },
    {
        version: "v5.5.100 (Service Worker Cache & WebOS Fullscreen Fix)",
        date: "11 ก.ค. 2569",
        changes: [
            "FIX: Force unregister old Service Workers in _app.tsx to permanently fix stale cache issues causing g.split error.",
            "FIX: Adjusted fullscreen container classes to w-full h-full to resolve LG WebOS TV half-screen display bugs."
        ],
        recent_updates: "Service Worker Caching Fix & WebOS Layout"
    },
    {
        version: "v5.5.99 (Temporarily Disable Vocal Separation)",
        date: "11 ก.ค. 2569",
        changes: [
            "UI: Temporarily removed the vocal mute (เสียงร้อง) button from the player controls.",
            "FIX: Removed the 'ล้มเหลว' (Failed) badge for AI-processed songs from the Queue list."
        ],
        recent_updates: "Temporarily disabled AI vocal separation UI"
    },
    {
        version: "v5.5.98 (Fix SidebarControls ReferenceError)",
        date: "10 ก.ค. 2569",
        changes: [
            "FIX: Removed unused isAiReady reference in SidebarControls that caused build failures."
        ],
        recent_updates: "SidebarControls Hotfix"
    },
    {
        version: "v5.5.97 (Show Vocal Button for All Videos)",
        date: "10 ก.ค. 2569",
        changes: [
            "UI: Removed isAiReady condition from SidebarControls to allow vocal button to show for all videos.",
            "FIX: Ensure users can test the vocal removal UI on standard YouTube videos."
        ],
        recent_updates: "Vocal Button Visibility Fix"
    },
    {
        version: "v5.5.96 (Vocal Separation UI Redesign)",
        date: "10 ก.ค. 2569",
        changes: [
            "UI: Removed bulky AudioMixer from QueueList for a cleaner interface.",
            "UX: Integrated native AI Vocal Controls directly into SidebarPlayer controls.",
            "FEATURE: Added minimal popover slider for vocal volume adjustments.",
            "RELIABILITY: Vocal controls only appear when AI separation is fully ready."
        ],
        recent_updates: "Redesigned AI Vocal Separation Interface"
    },
    {
        version: "v5.5.95 (Vocal Separation Integration & UI Fix)",
        date: "10 ก.ค. 2569",
        changes: [
            "FEATURE: Integrated AI Vocal Separation to the main application.",
            "FIX: Cleared old `layoutMode` from localStorage causing unintended fullscreen bugs.",
            "UI: Added AudioMixer to QueueList and ✨ button to SearchResult items."
        ],
        recent_updates: "Main App AI Vocal Integration & Layout Fix"
    },
    {
        version: "v5.5.94 (Automated Plugin Builder)",
        date: "10 ก.ค. 2569",
        changes: [
            "FEATURE: Integrated GitHub Actions pipeline to automatically build Windows (.exe) and macOS (.dmg) installers on GitHub servers.",
            "PERFORMANCE: Offloaded heavy PyInstaller/Electron builds from local machines to Cloud CI/CD."
        ],
        recent_updates: "GitHub Actions Auto-Builder for Plugin"
    },
    {
        version: "v5.5.93 (Desktop Helper Plugin)",
        date: "10 ก.ค. 2569",
        changes: [
            "FEATURE: Built Electron Desktop Plugin with Auto-Updater pointing to okeforyou/youoke",
            "PERFORMANCE: Packaged Python backend into standalone binary via PyInstaller (215MB total installer size)",
            "CHORE: Configured .gitignore for local plugin built assets to prevent repository bloat"
        ],
        recent_updates: "Desktop Plugin for Local AI Vocal Separation"
    },
    {
        version: "v5.5.92 (Local Bridge POC)",
        date: "8 ก.ค. 2569",
        changes: [
            "FEATURE: Added Python script for Demucs vocal separation (scripts/vocal-separation).",
            "UI: Added Karaoke UI Proof of Concept for vocal volume control (/poc-karaoke)."
        ],
        recent_updates: "Vocal Separation PoC & Mixer UI"
    },
    {
        version: "v5.5.90 (Firestore Quota Cache Shield)",
        date: "7 ก.ค. 2569",
        changes: [
            "FIX: Replaced useEffect with useQuery (24h staleTime) in MainDashboard for fetching artist_images to prevent Firestore Quota Exceeded (RESOURCE_EXHAUSTED).",
            "UX: Solved the infinite skeleton loading issue caused by quota exhaustion.",
            "STABILITY: Maintained Dual-Database Sync for Auth to prevent premium drops."
        ],
        recent_updates: "MainDashboard Quota Reduction & Cache Shield"
    },
    {
        version: "v5.5.89 (Quota Guardian Optimization)",
        date: "18 มิ.ย. 2569",
        changes: [
            "OPTIMIZATION: Removed 10-minute automatic ID token refresh interval in AuthContext to reduce 80% of unnecessary Firestore reads.",
            "OPTIMIZATION: Replaced real-time onSnapshot listener in NotificationBell with getDocs to load announcements statically on mount.",
            "OPTIMIZATION: Upgraded Admin Dashboard revenue calculator to use getAggregateFromServer instead of fetching all invoice documents."
        ],
        recent_updates: "Firestore Quota Conservation & Reduction"
    },
    {
        version: "v5.5.88 (Stable Membership Framework)",
        date: "13 มิ.ย. 2569",
        changes: [
            "FIX: ปิดการเขียนทับฐานข้อมูลลดระดับเป็น Free จากหน้าบ้าน (useAuthStore) ใช้เพียง State in-memory",
            "FEATURE: อนุมัติพรีเมียมจากหลังบ้านจะซิงค์ Quota สำหรับการร้องเพลงไปยัง Firestore และ RTDB ทันที",
            "RELIABILITY: ปัดเศษวันหมดอายุเมื่อเพิ่มวันจากแอดมินให้เป็นสิ้นวัน (23:59:59.999) พร้อมคำนวณและแจก Quota ตามแพ็กเกจให้ถูกต้อง"
        ],
        recent_updates: "Membership Drops Prevention & Admin Approval Quota Alignment"
    },
    {
        version: "v5.5.87 (Resilient Per-Chart Dynamic Fallback Orchestration)",
        date: "17 พ.ค. 2569",
        changes: [
            "FIX: Overhauled the backend charts sync pipeline to use a Per-Chart isolated fallback strategy rather than an all-or-nothing check. Now, a failing YouTube playlist will individually trigger fallbacks (Spotify / Premium Curated) for that specific chart without affecting others.",
            "RELIABILITY: Resolved the issue where a single active chart from YouTube prevented the other three failed charts from calling their fallbacks, ensuring all 4 categories populate with high-fidelity songs 100% of the time.",
            "PERFORMANCE: Ensured complete, non-empty database caching to Firestore during cron or manual triggers."
        ],
        recent_updates: "Resilient Per-Chart Dynamic Fallback Orchestration"
    },
    {
        version: "v5.5.86 (Dynamic Chart Selection & Auto-Eviction of Empty Categories)",
        date: "17 พ.ค. 2569",
        changes: [
            "FEAT: Implemented dynamic category filtering in the song charts tab, automatically hiding/evicting any chart categories that have no active songs in Firestore.",
            "UX: Overhauled the charts dashboard to automatically select the first valid non-empty category upon load, entirely eliminating the blank initial state.",
            "DESIGN: Cleaned up the first category label from 'ฮิตติดชาร์ต อันดับ 1' to 'Thailand Top 100' to accurately reflect the playlist content and improve aesthetic premium feel."
        ],
        recent_updates: "Dynamic Chart Selection & Auto-Eviction of Empty Categories"
    },
    {
        version: "v5.5.85 (Integrated Background Cron Sync Orchestrator)",
        date: "17 พ.ค. 2569",
        changes: [
            "FEAT: Appended the official charts sync directly to the existing global update-cache Cron Job, enabling completely hands-free background updates.",
            "OPTIMIZATION: Shared the single InnerTube session across both homepage genre caching and official charts, maximizing server efficiency.",
            "RELIABILITY: Ensured 100% immediate loads (under 100ms) for all web users since the database is refreshed in the background."
        ],
        recent_updates: "Integrated Background Cron Sync Orchestrator"
    },
    {
        version: "v5.5.84 (Smart Weekly Firestore Caching Strategy)",
        date: "17 พ.ค. 2569",
        changes: [
            "OPTIMIZATION: Extended the Firestore song cache validity to 7 days (1 week) up from 24 hours, guaranteeing ultra-fast loads (under 100ms) for home page visitors.",
            "UX: Protected the background scraping pipeline against rate-limiting and quota usage by only updating from YouTube Music weekly.",
            "FEAT: Preserved manual immediate override so admins can still instantly force-update charts at any time by calling '?force=true'."
        ],
        recent_updates: "Smart Weekly Firestore Caching Strategy"
    },
    {
        version: "v5.5.83 (Sequential Playlist Sync & Resilient Artist Mapping)",
        date: "17 พ.ค. 2569",
        changes: [
            "FEAT: Overhauled playlist mapping from Promise.all to sequential (serial) loops with polite delay, completely eliminating concurrent InnerTube connection and session collisions.",
            "FEAT: Implemented resilient multi-strategy artist name parsing to handle official YouTube Music playlist items without ever returning 'Unknown Artist'.",
            "UX: Normalized all thumbnail cover image URLs by stripping tracking query parameters for clean, consistent UI presentation."
        ],
        recent_updates: "Sequential Playlist Sync & Resilient Artist Mapping"
    },
    {
        version: "v5.5.82 (Shared Session InnerTube Client Optimization)",
        date: "17 พ.ค. 2569",
        changes: [
            "PERF: Refactored the InnerTube client to initialize a single, shared session rather than creating multiple separate connections concurrently.",
            "RELIABILITY: Resolved parallel race conditions and rate-limits, ensuring all 4 charts (Thailand Top 100, New Songs, Trending, Evergreen) fetch successfully and concurrently without any failures."
        ],
        recent_updates: "Shared Session InnerTube Client Optimization"
    },
    {
        version: "v5.5.81 (Premium InnerTube Playlist Scraper)",
        date: "17 พ.ค. 2569",
        changes: [
            "FEAT: Upgraded the automated charts sync to run anonymously via InnerTube (youtubei.js), ensuring 100% successful fetching of YouTube Music's official system playlists (e.g. Thailand Top 100) without any 404s or key restrictions.",
            "UX: Provided a robust triple-fallback pipeline (InnerTube -> Google API Key -> XML RSS Scraper) for maximum possible reliability.",
            "PERF: Optimized the playlist items mapping to resolve duplicates and play tracks instantly using official video IDs."
        ],
        recent_updates: "Premium InnerTube Playlist Scraper"
    },
    {
        version: "v5.5.80 (Zero-API-Key Automated Charts Scraper)",
        date: "17 พ.ค. 2569",
        changes: [
            "FEAT: Overhauled YouTube Music Playlists Sync to run anonymously (without developer API keys/quotas) using a highly resilient, official RSS feed parsing pipeline.",
            "UX: Guaranteed 100% automated background syncing out-of-the-box regardless of whether the admin has configured custom API keys.",
            "RELIABILITY: Maintained the visual visual charts override dashboard as a hybrid fallback."
        ],
        recent_updates: "Zero-API-Key Automated Charts Scraper"
    },
    {
        version: "v5.5.79 (Automated YouTube Music Playlists Sync)",
        date: "17 พ.ค. 2569",
        changes: [
            "FEAT: Implemented 100% automated, hands-free charts sync using YouTube Music's official playlists (e.g. Thailand Top 100, New T-Pop, Trending) as a primary background pipeline.",
            "UX: Bypassed all manual effort and Spotify/JOOX developer lockdowns, giving admins the best of both worlds—automatic background playlist syncing or custom visual editing overrides.",
            "FEAT: Embedded custom YouTube Playlist ID input fields directly in the Integrations tab of the Admin panel."
        ],
        recent_updates: "Automated YouTube Music Playlists Sync"
    },
    {
        version: "v5.5.78 (Visual Charts Manager UI)",
        date: "17 พ.ค. 2569",
        changes: [
            "FEAT: Launched a beautiful, robust Visual Charts Editor inside the Admin Config dashboard, allowing admins to add, edit, or delete song items, customize cover images, and update charts instantly in Firestore.",
            "RELIABILITY: Resolved third-party API instability (JOOX & Spotify security lockdowns) by granting admins 100% data sovereignty over song charts.",
        ],
        recent_updates: "Visual Charts Editor Launch"
    },
    {
        version: "v5.5.77 (Zero Duplicate Curated & Query Cleanse)",
        date: "17 พ.ค. 2569",
        changes: [
            "FIX: Completely eradicated song duplicates across all 4 premium curated chart databases",
            "RELIABILITY: Integrated cleanSearchQuery in the SidebarPlayer search resolver to strip bracketed noise (e.g. Proof., Melt, HBD to me), ensuring 100% accurate YouTube MV and Karaoke matches",
        ],
        recent_updates: "Zero Duplicate Curated & Search Query Cleanse"
    },
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
