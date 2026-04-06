export const CHANGELOGS = [
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
