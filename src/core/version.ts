export const CHANGELOGS = [
    {
        version: "4.10.125 (Extreme Mobile Fix)",
        date: "6 เม.ย. 2569",
        changes: [
            "Extreme Responsive Overhaul: Reduced font sizes and adjusted aspect ratios for small screens to prevent overlapping",
            "Text Scaling: Implemented text-[9px] and better line-height management for Card titles on mobile",
            "Density Adjustments: Refined gap and padding on narrow viewports to give maximum room per card"
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
