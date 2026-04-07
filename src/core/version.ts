export const CHANGELOGS = [
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

// v4.10.116: Reordered to ensure CHANGELOGS is available before export
const getLatestVersion = () => {
    if (!CHANGELOGS || CHANGELOGS.length === 0) return "4.10.116";
    const latest = CHANGELOGS[0].version;
    return latest.split(" ")[0];
};

export const SYSTEM_VERSION = getLatestVersion();
export const SYSTEM_CODENAME = "Midnight Dashboard";
export const SYSTEM_STATUS = "Stable";
export const VERSION_LABEL = `Version v${SYSTEM_VERSION} (${SYSTEM_CODENAME})`;
export const BUILD_DATE = "6 เม.ย. 2569";

// สำหรับการดึง Commit Hash จาก Vercel (ถ้ามี)
export const COMMIT_ID = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
    ? `#${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` 
    : "";
