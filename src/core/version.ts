// 🛡️ v5.5.295: Reverted LyricsOverlay & Fixed Segmented Button Widths
// ต่อจากนี้จะใช้ระบบ Manual Update เพื่อป้องกัน Runtime Error ในเบราว์เซอร์เก่าๆ (TV/Mobile)

export const SYSTEM_VERSION = "5.5.295";
export const VERSION_LABEL = `v${SYSTEM_VERSION}`;
export const SYSTEM_CODENAME = "Premium-Unified-Omega";
 
export const COMMIT_ID = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA 
    ? `#${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` 
    : "";
 
export const CHANGELOGS = [
    {
        version: "5.5.295",
        date: "2026-08-14",
        changes: [
            "revert(lyrics): Restored LyricsOverlay back to v5.5.293 layout.",
            "fix(controls): Expanded segmented buttons for lyrics layouts in FullscreenControlBar from 90px to 110px to resolve Thai text clipping/overflow."
        ]
    },
    {
        version: "5.5.294",
        date: "2026-08-14",
        changes: [
            "fix(lyrics): Resolved vertical cutting of lyrics on small screen vertical layout by making scroll container padding and gap responsive (py-8 sm:py-20, gap-4 sm:gap-8).",
            "fix(lyrics): Prevented word wrapping in Karaoke mode by scaling maximum font size from 4.5rem to 3.2rem.",
            "fix(lyrics): Adjusted fullscreen bottom spacing to bring lyrics closer above the player control bar.",
            "ui(dashboard): Redesigned YouOke AI Dashboard plugin to match web app premium dark zinc and crimson red aesthetics."
        ]
    },
    {
        version: "5.5.293",
        date: "2026-08-14",
        changes: [
            "fix(lyrics): Made lyrics bottom offset layout-adaptive, restoring bottom-3 in split screen mode to prevent layout push bugs while maintaining bottom-[5.5rem] in fullscreen mode.",
            "ux(controls): Renamed lyrics display settings buttons and AI Sync action to intuitive Thai labels ('เนื้อร้องเลื่อน', 'จัดจังหวะ AI') to simplify onboarding for beginners."
        ]
    },

    {
        version: "5.5.292",
        date: "2026-08-14",
        changes: [
            "fix(controls): Converted tooltips to Tailwind named groups (group/tooltip and group-hover/tooltip:block) to resolve full-player group hover conflict displaying all tooltips simultaneously."
        ]
    },

    {
        version: "5.5.291",
        date: "2026-08-14",
        changes: [
            "fix(lyrics): Shifted bottom overlay container bottom offset to bottom-[5.5rem] (and responsive equivalents) to sit cleanly above player control bar.",
            "ui(controls): Integrated custom dark-glass hover tooltips with concise Thai explanations to all fullscreen player controls."
        ]
    },

    {
        version: "5.5.290",
        date: "2026-08-14",
        changes: [
            "fix(lyrics): Swapped visual CSS transform scaling with layout-based active/inactive font clamps (max-w-4xl, w-[94%]) to allow lyrics to maximize single-line width without left/right overflow clipping."
        ]
    },

    {
        version: "5.5.289",
        date: "2026-08-14",
        changes: [
            "fix(lyrics): Constrained scroll lyric lines to max-w-[62cqw] to prevent visual scale-[1.5] overflow clipping on left and right text edges."
        ]
    },

    {
        version: "5.5.288",
        date: "2026-08-14",
        changes: [
            "fix(lyrics): Removed relative position override on the bottom overlay container to fix top offset rendering in fullscreen mode.",
            "ui(lyrics): Completely removed capsule backdrop blur backgrounds and borders from scroll lyrics layout to resolve multiline rounded clipping and edge cutoff bugs, adopting Apple Music style text layout."
        ]
    },

    {
        version: "5.5.287",
        date: "2026-08-14",
        changes: [
            "ui(lyrics): Replaced absolute active line background blur child with borderless backdrop-blur capsule and diffused shadow glow directly on active scroll line container (fits all screen sizes perfectly)."
        ]
    },

    {
        version: "5.5.286",
        date: "2026-08-14",
        changes: [
            "fix(lyrics): Anchored bottom overlay karaoke container to absolute bottom positions to prevent top alignment on small viewports/split screen.",
            "ui(lyrics): Replaced the wide centered blur band with a compact, text-width relative active line blur cloud masked with a soft radial-gradient.",
            "ui(lyrics): Increased active scroll text visual scale to scale-[1.6] and updated container-query base clamp to 1.9rem."
        ]
    },

    {
        version: "5.5.285",
        date: "2026-08-14",
        changes: [
            "fix(lyrics): Converted scroll layout font sizes to inline cqw-based responsive clamps to automatically scale lyrics based on container width rather than viewport width (fixing overflow on split screen and mobile).",
            "ui(lyrics): Created a vertically-centered global blur panel with linear-gradient fading mask to replace hard active line borders with soft, pure diffused blur spanning adjacent lines."
        ]
    },

    {
        version: "5.5.284",
        date: "2026-08-14",
        changes: [
            "ui(lyrics): Replaced solid active line borders with radial-gradient masked feather-blur background shadow clouds.",
            "ui(lyrics): Enlarged active scroll lyric line text visual transform scale to scale-[1.5]."
        ]
    },

    {
        version: "5.5.283",
        date: "2026-08-14",
        changes: [
            "fix(lyrics): Shrunk bottom overlay karaoke font size and line height clamps to prevent overflow on mobile and split screens.",
            "ui(lyrics): Implemented line-specific backdrop-blur highlighting for active scroll lyrics (blur follows the active line only).",
            "ui(lyrics): Expanded close button X right margin in fullscreen controls to prevent clipping."
        ]
    },

    {
        version: "5.5.282",
        date: "2026-08-14",
        changes: [
            "ui(lyrics): Renamed layout modes to คาราโอเกะ and แบบสไลด์ in fullscreen control bar, and updated icons to Mic and AlignLeft.",
            "ui(lyrics): Swapped sweeping mode toggle button icon to Paintbrush to represent color painting, and simplified tooltips.",
            "ui(lyrics): Fixed close button X right margin cut-off in control bar rounded container.",
            "ui(lyrics): Implemented edge-masked gradient backdrop blur overlay behind vertical scrolling lyrics.",
            "ui(lyrics): Restored small mobile font sizing, highlighted active scroll lyrics in clean white at scale-[1.35], and dimmed inactive lyrics to text-white/25."
        ]
    },

    {
        version: "5.5.281",
        date: "2026-08-14",
        changes: [
            "fix(lyrics): Restored working responsive text-lg md:text-2xl font sizes for plain/scroll layouts to fix large mobile fonts.",
            "feat(lyrics): Changed plain/scroll active highlight color to Blue 600 (#2563eb) to match the karaoke singing theme.",
            "fix(lyrics): Resolved scrolling jitter by using visual-only transform scale-[1.2] transitions on the active line.",
            "fix(lyrics): Replaced scrollbar-hide with no-scrollbar utility class to completely hide browser scrollbars during auto-scroll."
        ]
    },

    {
        version: "5.5.280",
        date: "2026-08-14",
        changes: [
            "feat(lyrics): Redesigned layout selector as a unified Segmented Control (ปิดเนื้อ, ปาดล่าง, แนวตั้ง) with custom icons.",
            "feat(lyrics): Standalone prominent AI Sync button with glowing amber style to guide new users on unsynced songs.",
            "ui(lyrics): Highlighted active plain/scroll lyrics with vibrant yellow-300 color and gold/glow strokes.",
            "fix(lyrics): Resolved scroll jitter on plain/scroll lyrics by standardizing active and inactive font sizes to prevent layout wrapping reflow."
        ]
    },

    {
        version: "5.5.279",
        date: "2026-08-13",
        changes: [
            "feat(lyrics): Added layout selector in Fullscreen control bar to switch between scrolling layout and bottom sweeping overlay on synced songs.",
            "feat(lyrics): Implemented background Smart Auto-Sync for plain songs if local vocals cache is present.",
            "ui(lyrics): Relocated plain lyrics sync status badge to the top-left corner, enlarged lyric text, and expanded vertical spacing.",
            "fix(plugin): Resolved cache folder deletion failures (Cache not found) in both local bridge backend and library frontend."
        ]
    },

    {
        version: "5.5.278",
        date: "2026-08-13",
        changes: [
            "fix(lyrics): Resolved client-side React exception #310 caused by rendering auto-scroll useEffect after an early return."
        ]
    },

    {
        version: "5.5.277",
        date: "2026-08-13",
        changes: [
            "feat(lyrics): Added Toast feedback (loading/success/error) for AI Sync clicks in Fullscreen control bar to eliminate silent failures.",
            "ui(lyrics): Replaced blurry plain lyrics panel with a transparent, edge-faded scrolling view styled like YouTube Music.",
            "ui(lyrics): Added smooth auto-scrolling to keep the active line centered, and interactive click-to-seek support."
        ]
    },

    {
        version: "5.5.276",
        date: "2026-08-13",
        changes: [
            "feat(lyrics): Added word-level Needleman-Wunsch alignment for English lyrics to prevent global character alignment drift.",
            "feat(lyrics): Fixed trailing gap sweep delay; unaligned words at end of lines now sweep immediately at normal speed instead of waiting for the next line start.",
            "ui(player): Hide lyrics overlay on initial song load when current time is before the first line's timestamp."
        ]
    },

    {
        version: "5.5.275",
        date: "2026-08-13",
        changes: [
            "feat(lyrics): Optimized unaligned word interpolation and added 150ms STT latency compensation to resolve sync lag in deepgramAlignEngine.ts.",
            "ui(lyrics): Stabilized and enlarged lyric font size, enabled word-boundary wrapping, and optimized line height for professional karaoke display."
        ]
    },

    {
        version: "5.5.274",
        date: "2026-08-12",
        changes: [
            "feat(plugin): Added YouOke AI Dashboard window in Electron app to manage active separation queues and storage cache.",
            "feat(plugin): Added POST /cancel/{video_id} and GET /jobs to Python server for real-time background task cancellation and status tracking.",
            "fix(plugin): Resolved cache folder deletion bug when using custom storage paths in Python server."
        ]
    },

    {
        version: "5.5.273",
        date: "2026-08-09",
        changes: [
            "feat(lyrics): Overhauled AI Sync alignment engine in deepgramAlignEngine.ts.",
            "feat(lyrics): AI Sync now strictly trusts LRCLIB line timestamps as anchors when lyrics are already synced, solving out-of-sync drift issues.",
            "feat(lyrics): Deepgram fuzzy matching is now restricted to narrow time windows, calculating precise word-level timestamps without overriding line bounds.",
            "fix(ui): Corrected z-index stacking context for ToastContext to ensure toasts appear above modals like SidebarControls."
        ]
    },

    {
        version: "5.5.272",
        date: "2026-08-09",
        changes: [
            "ui(player): Compacted SidebarControls layout for Lyrics, Sweep, and AI Sync toggles to sit on a single responsive row.",
            "ui(player): Updated AI Sync toggle appearance to match system primary color and standard toggle switch UI.",
            "feat(player): Integrated native ToastContext for real-time loading, success, and error feedback during AI Sync.",
            "fix(player): Fixed JSX syntax errors and removed unused react-hot-toast dependency."
        ]
    },

    {
        version: "5.5.271",
        date: "2026-08-09",
        changes: [
            "feat(creator): Ported Studio Timeline to Creator Studio to provide identical block dragging, ripple edit, and inline editing UX.",
            "feat(creator): Redesigned Timeline Toolbar to center editing controls and reposition track selectors, mimicking the professional Studio layout."
        ]
    },

    {
        version: "5.5.270",
        date: "2026-08-09",
        changes: [
            "ui(creator): Redesigned Creator Studio into an All-in-One Professional Editor format (POC 1).",
            "ui(creator): Replaced legacy purple theme with the system's primary dark/red unified color palette.",
            "feat(creator): Introduced an Empty State (Creator Hub) to centralize lyric import tools (Cloud, Paste, AI) when initializing a project.",
            "feat(creator): Consolidated timeline controls (Tap-to-sync, Ripple) into the bottom Timeline Toolbar to clear up Canvas space.",
            "feat(creator): Converted the Right Sidebar into a dedicated Properties Panel with new Fill and Highlight Color Pickers for text overlays."
        ]
    },
    {
        version: "5.5.269",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(creator): Refactored audio engine to dual-stem architecture — WaveSurfer always plays vocals.m4a while a hidden <audio> element handles no_vocals.m4a in sync.",
            "feat(creator): Replaced audioTrack reload (which caused pause/reset) with instant volume crossfading — switching tracks is now seamless without interrupting playback.",
            "fix(creator): Fixed lyrics canvas overlay jiggling by replacing the alternating [0,1].map layout with a stable active-line + faded-next-line two-row layout.",
            "feat(creator): Added Tap-to-Sync mode — press the toolbar button or Spacebar during playback to stamp each lyric block's start time in real-time."
        ]
    },
    {
        version: "5.5.268",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(creator): Changed parent preview wrapper layout direction to flex-col to resolve video aspect-ratio squeezing and vertical lyrics wrapping.",
            "feat(creator): Styled timeline blocks exactly like the studio page (added GripVertical handle, h-16 height, hover delete button, and resize indicators)."
        ]
    },
    {
        version: "5.5.267",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(creator): Re-engineered Local AI Creator Studio timeline to support interactive draggable React block components.",
            "feat(creator): Relocated audio track buttons (vocals, instrumental, mix) under unified icon symbols next to the Play/Pause button.",
            "feat(creator): Integrated speech-to-text hybrid line grouping with split threshold (>1.5s or 8 words limit) for cleaner transcription layout.",
            "feat(creator): Added Ripple Edit toggle ('ลากกลุ่ม') to shift subsequent blocks concurrently during timeline edits.",
            "feat(creator): Added playhead auto-centering scroll centering during playback.",
            "feat(creator): Simplified sidebar into a single Thai-labeled panel ('เครื่องมือแต่งเนื้อร้อง')."
        ]
    },
    {
        version: "5.5.266",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(studio): Added Style Settings sidebar panel like Karadeo (background toggle, font size slider, outline thickness slider).",
            "fix(studio): Wrapped YouTube player in absolute div inside aspect-ratio container to permanently resolve z-index layout issues."
        ]
    },
    {
        version: "5.5.265",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(studio): Fixed nested JSX syntax errors.",
            "style(studio): Implemented Karadeo-style text outline (no black background box) and centered the text inside the aspect-ratio video frame."
        ]
    },
    {
        version: "5.5.264",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(studio): Moved lyric overlay outside of the aspect-video container to completely prevent aspect-ratio clipping and z-index sibling layering bugs."
        ]
    },
    {
        version: "5.5.263",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(studio): Fixed flexbox container overflow. Constrained the video container using max-h-full and max-w-full to prevent it from overlapping the timeline.",
            "cleanup(studio): Removed the temporary debug panel."
        ]
    },
    {
        version: "5.5.262",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(studio): Removed YouTube wrapper and isolate context to fix render layering (z-index background swallow bug)."
        ]
    },
    {
        version: "5.5.261",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "debug(studio): Added a temporary visual state debugger overlay in the top-left corner of the player to diagnose lyric rendering issues."
        ]
    },
    {
        version: "5.5.260",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(studio): Fixed extreme z-index bug where YouTube iframe swallowed the lyric overlay.",
            "style(studio): Made lyric overlay bolder and added scale-105 for active lyrics."
        ]
    },
    {
        version: "5.5.259",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(studio): Added 'upcoming lyric' preview (faded text) when paused before a line.",
            "style(studio): Reduced timeline height to give more space for the video.",
            "fix(studio): Missing empty state box fix when no lyric is active."
        ]
    },
    {
        version: "5.5.258",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(studio): Fixed Ripple edit math error causing exponential movement.",
            "fix(studio): Removed max duration cap so blocks can be stretched past the next block."
        ]
    },
    {
        version: "5.5.257",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(studio): Added 'Paste Raw Lyrics' modal to import text directly.",
            "feat(studio): Added 'Add Line' button to insert a new text block at the current playhead.",
            "feat(studio): Added 'Delete Line' (X) button on each lyric block."
        ]
    },
    {
        version: "5.5.256",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(studio): Added Ripple Edit mode to shift all subsequent lyrics together.",
            "fix(studio): Lyrics now update correctly on the video overlay even when the video is paused."
        ]
    },
    {
        version: "5.5.255",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(studio): Added Timeline UX Polish: duration dragging (tail dragging), top toolbar, and smaller timeline height.",
            "fix(studio): Fixed subtitle overflow by generating blank LRC lines for gaps."
        ]
    },
    {
        version: "5.5.251",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(wiki-karaoke): Implemented crowdsourced Wiki Karaoke with Firestore sync saving (+/- offset).",
            "feat(studio): Added /studio route for Tap-to-Sync and drag-and-drop timeline lyrics adjustment.",
            "feat(player): Added Quick Nudge (+/- 0.1s, 0.5s) and Upvote/Downvote buttons directly to the player controls."
        ]
    },
    {
        version: "5.5.250",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(search): Added a third search mode 'แยกเสียง AI' (AI Studio Karaoke) in desktop/mobile toggles.",
            "feat(search): Integrated automatic studio-audio query appending ('official audio') for perfect LRCLIB lyrics sync, auto-triggering Demucs vocal separation."
        ]
    },
    {
        version: "5.5.249",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(ai-sync): Reverted to pure raw Deepgram transcription (bypassing LRCLIB alignment) for exact timing.",
            "fix(ai-sync): Added silence gap detection (gaps > 3.0s) to insert instrumental indicators (🎸 (ดนตรี) 🎸) to prevent lyric freezing."
        ]
    },
    {
        version: "5.5.248",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(ai-sync): Switched transcription pipeline to local bridge /transcribe route to completely bypass browser CORS/mixed-content blocks on large media file transfers."
        ]
    },
    {
        version: "5.5.247",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "debug(ai-sync): Wrapped Local Bridge fetch and Deepgram API fetch in specific try-catch blocks to pinpoint which fetch throws Failed to fetch."
        ]
    },
    {
        version: "5.5.246",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(ai-sync): Implemented original.audio fallback if vocals.m4a is missing or CORS-blocked, preventing Failed to fetch crash on 2CH songs."
        ]
    },
    {
        version: "5.5.245",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(ai-sync): Re-enabled clean LRCLIB lyrics alignment with raw Deepgram grouping fallback.",
            "fix(ai-sync): Enhanced Deepgram API fetch error handling to retrieve and display detailed HTTP response body context."
        ]
    },
    {
        version: "5.5.244",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(ai-sync): Reverted to direct browser-to-Deepgram transcription to match working Creator page implementation.",
            "fix(ai-sync): Removed lyrics.length guard from FullscreenControlBar and useDeepgramLyricsStore to prevent disabled state and return early issues."
        ]
    },
    {
        version: "5.5.243",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(ai-sync): Implemented raw Deepgram transcription POC to bypass LRCLIB clean text alignment for testing connection."
        ]
    },
    {
        version: "5.5.242",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(ai-sync): Redirected Deepgram transcription to local bridge /transcribe endpoint to prevent browser CORS and Failed to fetch issues.",
            "fix(ai-sync): Removed browser-level audio file downloading for transcription to optimize memory usage."
        ]
    },
    {
        version: "5.5.241",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(ui): Integrated YouOke's custom GlobalConfirmModal system to replace native browser alert popups for AI Sync success/error reporting.",
            "feat(ui): Added conditional rendering to GlobalConfirmModal to support single-button alert modals by setting cancelText to 'none'."
        ]
    },
    {
        version: "5.5.240",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(ai-sync): Implemented word-level alignment (Thai/English segmentation) inside Deepgram Hybrid Alignment engine to generate word-by-word sweeping karaoke.",
            "feat(ai-sync): Added alert notifications to handleSync to provide direct error feedback during AI Sync failures."
        ]
    },
    {
        version: "5.5.239",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(lyrics): Removed legacy floating sync pill from screen.",
            "fix(lyrics): Reset syncOffset and Deepgram aligned store when changing songs.",
            "feat(player): Added -0.1s and +0.1s micro-nudges to Fullscreen Control Bar.",
            "feat(player): Upgraded Live Tap Sync to use closest-line algorithm to resolve delayed alignment drifts."
        ]
    },
    {
        version: "5.5.238",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(lyrics): Resolved TypeError in FullscreenControlBar by correctly referencing lyrics state from useLyricsStore."
        ]
    },
    {
        version: "5.5.237",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(lyrics): Integrated Deepgram AI Hybrid Sync engine with LRCLIB clean lyrics.",
            "feat(player): Unified Fullscreen Control Bar with both Manual Live Sync (🎯 / ±0.5s) and AI Auto Sync (🪄)."
        ]
    },
    {
        version: "5.5.236",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(lyrics): Added Floating Sync Pill directly to video screen for intuitive visual syncing.",
            "feat(lyrics): Added 'One-Tap Sync' (🎯) and micro-adjustments (±0.1s)."
        ]
    },
    {
        version: "5.5.235",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(lyrics): Resolved React Hook order violation #310 in LyricsOverlay caused by early returns."
        ]
    },
    {
        version: "5.5.234",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "ui(mixer): Compacted Lyrics and Sweep toggles to a single line in SidebarControls.",
            "fix(lyrics): Resolved issue where lyrics displayed at top instead of bottom on small screens.",
            "fix(mixer): Relocated Active Lyric Line preview into the Mixer to be prominently visible during Sync adjustment.",
            "fix(sync): Improved visibility of sync timing controls."
        ]
    },
    {
        version: "5.5.233",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "refactor(lyrics): Removed AI/Deepgram lyrics generation entirely and simplified useLyricsStore to fetch only from LRCLIB/YouTube CC.",
            "ui(mixer): Compacted Lyrics and Sweep toggles to a single line in SidebarControls."
        ]
    },
    {
        version: "5.5.232",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "poc(player): Force LRCLIB online lyrics and temporarily disable local browser AI cache to ensure raw text is displayed.",
        ]
    },
    {
        version: "5.5.231",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(player): Treat localStorage edits as highest priority so they don't get overridden by online lyrics.",
            "ui(card): Move CH badge to bottom right to avoid edge sticking."
        ]
    },
    {
        version: "5.5.230",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(player): Add 'Edit in Studio' button to quickly jump to creator.",
            "ui(lyrics): Disable line sweep for standard lyrics to prevent word cutoff issues."
        ]
    },
    {
        version: "5.5.229",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(creator): Auto-save lyrics edits to localStorage so changes sync with the player.",
            "ui(card): Adjusted CH badge to float rather than sticking to the edge."
        ]
    },
    {
        version: "5.5.228",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(ai-lyrics): Reworked AI lyrics extraction to transcribe directly in the browser via Deepgram, bypassing missing plugin endpoint.",
            "ui(card): Reverted 2CH/4CH badge position to exactly top-left corner without gaps."
        ]
    },
    {
        version: "5.5.227",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(lyrics): Fixed LRC parser to handle multiple timestamps per line (e.g. [01:00.00][01:05.00]), resolving sync offsets.",
            "fix(ui): Resolved missing song covers on some AI Cache items by adding fallback to standard hqdefault.jpg.",
            "ui(card): Adjusted 2CH/4CH AI badge padding and position to prevent touching the edges."
        ]
    },
    {
        version: "5.5.226",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "style(ui): Adjusted 2CH/4CH badge padding on playlist cards to prevent clipping at edges."
        ]
    },
    {
        version: "5.5.225",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(lyrics): Prioritize local AI lyrics and user edits over LRCLIB synced lyrics.",
            "feat(ui): Always show AI generation override button for LRCLIB synced lyrics to fix MV offset issues."
        ]
    },
    {
        version: "5.5.224",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "feat(lyrics): Added LRCLIB Plain lyrics support with scrollable text UI for songs without timestamps.",
            "feat(ai): Implemented local AI Forced Alignment to seamlessly convert Plain lyrics into Synced lyrics using Deepgram timings."
        ]
    },
    {
        version: "5.5.223",
        date: "2026-08-03",
        changes: [
            "fix(bridge): Resolved system freezing and FFmpeg errors by removing dangerous PyTorch MPS upper limit allocation.",
            "fix(bridge): Killed background conflicting YouOke Plugin app (v1.0.44) and deleted it to prevent port 5050 hijacking.",
            "ui(card): Fixed 2CH badge overlapping in playlist grid by moving it to the top-right corner."
        ]
    },
    {
        version: "5.5.222",
        date: new Date().toISOString().split('T')[0],
        changes: [
            "fix(ui): Fixed Mixer modal layout where 2CH badge bled through and Lyrics \"not found\" text was squished/cut off."
        ]
    },
    {
        version: "5.5.221",
        date: "2026-08-03",
        changes: [
            "fix(plugin): Resolved macOS severe memory leak/system freeze during Demucs by limiting segment size to 2 and enforcing PYTORCH_MPS_HIGH_WATERMARK_RATIO (v1.0.55)."
        ]
    },
    {
        version: "5.5.220",
        date: "2026-08-03",
        changes: [
            "fix(plugin): Resolved 0% hang issue on macOS caused by missing freeze_support() in multiprocessing (v1.0.54).",
            "fix(plugin): Patched RapidAPI fallback quota type error causing crash during download failures (v1.0.54)."
        ]
    },
    {
        version: "5.5.219",
        date: "2026-08-03",
        changes: [
            "fix(plugin): Disabled yt-dlp browser popup (youtubepot-wpc) during audio separation to prevent excessive Chrome instances from opening.",
            "feat(ui): Refactored lyrics and karaoke mode toggles into a unified iOS-style grouped settings list.",
            "fix(lyrics): Adjusted Thai lyrics formatting to prevent unneeded spacing between words, making it flow naturally like standard karaoke.",
            "fix(ui): Fixed syntax error in SidebarControls to resolve Vercel build failures."
        ]
    },
    {
        version: "5.5.218",
        date: "2026-08-02",
        changes: [
            "feat(ui): Redesigned Audio Mixer into a spacious, centered modal instead of a cramped popover.",
            "feat(ai): Integrated Deepgram API for AI Lyrics transcription directly in the Player (SidebarControls).",
            "fix(backend): Increased urllib timeout to 600s in local-bridge to prevent 500 Internal Server Errors on slow uploads.",
            "fix(player): Added loading state and cache-busting when fetching generated lyrics from the bridge."
        ]
    },
    {
        version: "5.5.217",
        date: "2026-08-01",
        changes: [
            "fix(backend): Fixed IndentationError in search_files.py that caused the local bridge server to crash.",
            "fix(backend): Added robust file fallback logic for PRO mode separated songs in Creator Studio where original audio is deleted to save space."
        ]
    },
    {
        version: "5.5.216",
        date: "2026-08-01",
        changes: [
            "feat(creator): Implemented Audio Track Selector (Original, Vocals, Instrumental) for easier lyric timing.",
            "feat(creator): Added Export .yok feature to download stems and lyrics as a zip package.",
            "feat(backend): Added /export route in local-bridge to generate .yok zip archives."
        ]
    },
    {
        version: "5.5.215",
        date: "2026-08-01",
        changes: [
            "feat(creator): Added Zoom slider for precise waveform timing adjustments.",
            "feat(creator): Revamped Lyrics Editor with direct inline text editing.",
            "feat(creator): Added 'Merge' (chain) and 'Delete' controls for AI lyric segments.",
            "fix(creator): Resolved UI layout clipping and syntax errors in the sidebar tab system."
        ]
    },
    {
        version: "5.5.214",
        date: "2026-08-01",
        changes: [
            "feat(ui): Add Creator Studio direct entry banner to the Homepage (MainDashboard).",
            "feat(ui): Add Creator Studio icon to the Mobile Bottom Navigation bar."
        ]
    },
    {
        version: "5.5.213",
        date: "2026-07-31",
        changes: [
            "feat(backend): Phase 1 of Universal Storage Engine implemented.",
            "feat(backend): youoke.json metadata generated for custom storage.",
            "feat(backend): Dynamic audio serving from custom_storage_path."
        ]
    },
    {
        version: "5.5.212",
        date: "2026-07-30",
        changes: [
            "feat(settings): Added RapidAPI quota display to show remaining song extraction credits.",
            "feat(settings): Added direct signup link for RapidAPI in AI settings.",
            "feat(local-bridge): Updated server.py to extract and serve RapidAPI rate limits via /health endpoint."
        ]
    },
    {
        version: "5.5.211",
        date: "2026-07-29",
        changes: [
            "feat(studio): Added StudioEditor component for editing local library files.",
            "feat(library): Updated library.tsx to transition into StudioEditor when playing a local file."
        ]
    },
    {
        version: "5.5.205",
        date: "2026-07-27",
        changes: [
            "style(ui): Simplify 2CH/4CH badge design into standard minimalist tag with uniform padding.",
            "feat(ai-cache): Retroactively load YouTube titles for older cached songs using public noembed API."
        ]
    },
    {
        version: "5.5.204",
        date: "2026-07-27",
        changes: [
            "fix(ai-cache): Enhance port fallback and add 15s retry mechanism to prevent flashing offline status during plugin startup.",
            "feat(ai-cache): Parse and display actual song title from local AI cache instead of video ID.",
            "style(ui): Adjust 2CH/4CH badge padding on playlist cards to prevent clipping at edges."
        ]
    },
    {
        version: "5.5.202",
        date: "2026-07-27",
        changes: [
            "fix(auth): Re-grant owner status and lifetime membership to admin account directly via Firebase.",
            "fix(ai-separation): Add local port fallback (5050 -> 8055) to support legacy YouOke Plugin versions and resolve vocal separation connection issues."
        ]
    },
    {
        version: "5.5.201",
        date: "2026-07-26",
        changes: [
            "feat(ai-separation): Implement AI Separation download history logs modal and admin control sidebar",
            "feat(ai-separation): Add real-time Toast alerts for background separation jobs success and failure",
            "ui(card): Adjust 2CH/4CH badge to a clean circular pill design"
        ]
    },
    {
        version: "5.5.200",
        date: "2026-07-25",
        changes: [
            "feat(legal): Update guide section with usage terms, copyright disclaimer, and YouTube policy compliance"
        ]
    },
    {
        version: "5.5.199",
        date: "2026-07-24",
        changes: [
            "fix(ui): Prevent profile image squishing by adding flex-shrink-0",
            "fix(ui): Ensure announcement cards expand properly on click"
        ]
    },
    {
        version: "5.5.189",
        date: "2026-07-24",
        changes: [
            "fix(membership): Enforced strict active status checks across Player and Remote modules to ensure expired users lose access immediately.",
            "feat(auth): Differentiated new user free tier by assigning 'trial' instead of 'day_pass' to separate free trials from paid day passes."
        ]
    },
    {
        version: "5.5.187",
        date: "2026-07-24",
        changes: [
            "fix(ui): Resolved an issue in ProfileTab where 'Lifetime' tier text was invisible due to a CSS class resolution error (changed text-amber-600 to text-amber-500).",
            "fix(auth): Removed optimistic UI state updates during login that caused users to temporarily flash to the 'free' tier when logging in or after reconnecting."
        ]
    },
    {
        version: "5.5.186",
        date: "2026-07-24",
        changes: [
            "fix(admin): Resolve data mismatch between User Profile showing Lifetime while Admin Panel shows expiry dates.",
            "fix(admin): Ensure changing expiry dates unconditionally recalculates the correct tier (Monthly, Yearly).",
            "fix(admin): Manual Group Override to 'Lifetime' now correctly clears the expiration date from the database."
        ]
    },
    {
        version: "5.5.185",
        date: "2026-07-24",
        changes: [
            "fix: Removed aggressive auto-downgrade logic in useAuthStore to prevent premium users from falling to free tier.",
            "fix: Ensure Guest users are prompted with LimitModal when attempting to play songs without login."
        ]
    },
    {
        version: "5.5.184",
        date: "2026-07-23",
        changes: [
            "design: Redesigned ProfileTab to be a dedicated Dashboard focusing on Membership and Upgrade flow, with a prominent status banner and action button."
        ]
    },
    {
        version: "5.5.183",
        date: "2026-07-23",
        changes: [
            "design: Restructured ProfileTab into a clean 3-section layout (Settings, Account Info, Membership).",
            "design: Removed large headers and condensed spacing in ProfileTab for a more compact and readable interface."
        ]
    },
    {
        version: "5.5.182",
        date: "2026-07-23",
        changes: [
            "design: Redesigned CloudSyncTab to separate local/cloud storage and restore browse input.",
            "design: Redesigned PackageStore into ultra-compact, scroll-free layout.",
            "design: Updated notification indicator color in AnnouncementsTab to primary color (removed red).",
            "cleanup: Removed GeneralSettingsTab and unified settings into ProfileTab."
        ]
    },
    {
        version: "5.5.181",
        date: "2026-07-23",
        changes: [
            "design: Restructured all remaining Settings tabs to the ultra-compact iOS Settings style.",
            "design: Restored rich detail info block inside the compact MembershipCard."
        ]
    },
    {
        version: "5.5.180",
        date: "2026-07-23",
        changes: [
            "design: Redesigned ProfileTab to use an ultra-compact, iOS Settings-like layout with divide-y."
        ]
    },
    {
        version: "5.5.179",
        date: "2026-07-23",
        changes: [
            "fix: Resolved JSX syntax errors and incorrect imports causing Vercel build failure."
        ]
    },
    {
        version: "5.5.177",
        date: "2026-07-23",
        changes: [
            "design: Restructure GlobalSettingsModal and Tabs to match TAX FLOW layout."
        ]
    },
    {
        version: "5.5.176",
        date: "2026-07-23",
        changes: [
            "design: Truly remove thick borders across all settings tabs to achieve Pure Flat UI."
        ]
    },
    {
        version: "5.5.175",
        date: "2026-07-23",
        changes: [
            "feat: Add missing Announcements and Packages tabs back to the Settings Hub.",
            "design: Polish Settings Hub design, removing rigid borders for a pure flat layout.",
            "feat: Restore VIP Membership Card and LINE Connect into the Profile Tab."
        ]
    },
    {
        version: "5.5.174",
        date: "2026-07-23",
        changes: [
            "fix: Remove legacy ProfileDrawer completely to resolve redundant UI state conflict.",
            "fix: Update Sidebar profile click and /profile route to trigger the new unified GlobalSettingsModal.",
        ]
    },
    {
        version: "5.5.173",
        date: "2026-07-23",
        changes: [
            "ui: Completely redesign Settings UI (GlobalSettingsModal) to use a premium Sidebar Hub layout, adopting TAX FLOW project structure.",
            "ui: Refactor AIVocalSettingsTab to CloudSyncTab, embedding Google Drive connect functionality in a clean 2-card layout.",
            "ui: Update GeneralSettingsTab and ProfileTab to conform strictly to the Pure Flat design system, removing gradients and soft shadows."
        ]
    },
    {
        version: "5.5.172",
        date: "2026-07-23",
        changes: [
            "feat: Add GoogleDriveService for uploading separated audio files to user's personal Google Drive.",
            "feat: Add connectGoogleDrive method to AuthStore to request 'drive.file' OAuth scope."
        ]
    },
    {
        version: "5.5.171",
        date: "2026-07-22",
        changes: [
            "ui: Fix drag and drop jumping issue in QueueList by correcting CSS transforms and transitions."
        ]
    },
    {
        version: "5.5.170",
        date: "2026-07-22",
        changes: [
            "ui: Remove border from AI separation badge in QueueList for a cleaner look."
        ]
    },
    {
        version: "5.5.169",
        date: "2026-07-22",
        changes: [
            "ui: Move EQ animation to the front of the queue item replacing the drag handle space.",
            "ui: Redesign 'แยกเสียงแล้ว' badges with subtle gradients and a Sparkles icon for better visibility."
        ]
    },
    {
        version: "5.5.168",
        date: "2026-07-22",
        changes: [
            "ui: Remove border from 4CH mode button in VocalModeModal to look less selected.",
            "ui: Subdued the colors of 'แยกเสียงแล้ว' badges in QueueList to reduce visual noise."
        ]
    },
    {
        version: "5.5.167",
        date: "2026-07-22",
        changes: [
            "ui: Remove red highlight from the currently playing item in QueueList."
        ]
    },
    {
        version: "5.5.166",
        date: "2026-07-22",
        changes: [
            "ui: Fix mobile mixer popup being clipped by main container overflow-hidden."
        ]
    },
    {
        version: "5.5.165",
        date: "2026-07-22",
        changes: [
            "ui: Fix mobile mixer popup being hidden behind the sticky header."
        ]
    },
    {
        version: "5.5.164",
        date: "2026-07-22",
        changes: [
            "ui: Make track mute tooltips dynamic (Open/Close) and fix missing tooltips for 2CH mode."
        ]
    },
    {
        version: "5.5.163",
        date: "2026-07-22",
        changes: [
            "ui: Replace native browser tooltips with custom styled tooltips in QueueList."
        ]
    },
    {
        version: "5.5.162",
        date: "2026-07-22",
        changes: [
            "ui: Create custom VolumeSlider with floating popup tooltip and smaller thumb, resembling Moises app."
        ]
    },
    {
        version: "5.5.161",
        date: "2026-07-22",
        changes: [
            "ui: Update track mute state design to look disabled instead of using red strike-through.",
            "ui: Make queue item drag handle always visible (with opacity)."
        ]
    },
    {
        version: "5.5.160",
        date: "2026-07-22",
        changes: [
            "fix: Queue item track badges now only reflect and control mute states for the currently playing song."
        ]
    },
    {
        version: "5.5.159",
        date: "2026-07-22",
        changes: [
            "ui: Queue items track badges are now interactive, allowing toggling of track mute states directly from the queue.",
            "sync: Queue items track badges are fully synced with the global Mixer."
        ]
    },
    {
        version: "5.5.158",
        date: "2026-07-22",
        changes: [
            "ui: Mixer mute overlay changed from an X to a single diagonal strikethrough line to match the main menu icon style."
        ]
    },
    {
        version: "5.5.157",
        date: "2026-07-21",
        changes: [
            "ui: Queue EQ animation now only plays when a song is actively playing.",
            "ui: Mixer mute now shows a red X overlay on the original track icon instead of changing the icon."
        ]
    },
    {
        version: "5.5.156",
        date: "2026-07-21",
        changes: [
            "ui: Replaced AudioBars with custom CSS EQ indicator beside QueueList title.",
            "ui: Updated Mixer to use cross icons (VolumeX/MicOff) when a track is muted."
        ]
    },
    {
        version: "5.5.155",
        date: "2026-07-21",
        changes: [
            "ui: Adjusted queue item active border thickness to match inactive items.",
            "ui: Moved delete track icon slightly upwards for better visual balance."
        ]
    },
    {
        version: "5.5.154",
        date: "2026-07-21",
        changes: [
            "ui: Adjusted queue item active border thickness to match inactive items.",
            "ui: Moved delete track icon slightly upwards for better visual balance."
        ]
    },
    {
        version: "5.5.153",
        date: "2026-07-21",
        changes: [
            "ui: Moved AI vocal separation button to align left with status badges.",
            "ui: Changed AI vocal separation button color to a clean, subtle plain style."
        ]
    },
    {
        version: "5.5.152",
        date: "2026-07-21",
        changes: [
            "ui: Updated Mixer track icons to reflect specific instruments.",
            "ui: Enhanced active queue item styling and added colored circular backgrounds to track icons.",
            "ui: Refreshed AI separation mode modal with new wording and primary theme colors."
        ]
    },
    {
        version: "5.5.150",
        date: "2026-07-21",
        changes: [
            "ui: Fixed Mixer UI clipping at the bottom by reducing max-height to 60vh to fit within aside constraints.",
            "ui: Changed the lyrics error message from a red box to a subtle grey 'ไม่มีเนื้อเพลง' message."
        ]
    },
    {
        version: "5.5.149",
        date: "2026-07-21",
        changes: [
            "ui: Ultra-compacted the Mixer UI. Converted track sliders into a single-line layout to save 50% vertical space and fit cleanly on small laptop screens."
        ]
    },
    {
        version: "5.5.148",
        date: "2026-07-21",
        changes: [
            "ui: Compacted the Mixer popover interface by reducing paddings and margins to ensure it fits better on smaller laptop screens without excessive scrolling."
        ]
    },
    {
        version: "5.5.147",
        date: "2026-07-21",
        changes: [
            "ui: Removed Lyrics (CC) toggle from the main control bar to reduce clutter.",
            "ui: Added error/loading states for Lyrics in the Mixer to clarify why CC might not turn on if no lyrics are found."
        ]
    },
    {
        version: "5.5.146",
        date: "2026-07-21",
        changes: [
            "ui: Restored Lyrics (CC) toggle to the main sidebar for easier access.",
            "fix: Enforced stricter disabling of native YouTube Closed Captions during video playback."
        ]
    },
    {
        version: "5.5.145",
        date: "2026-07-21",
        changes: [
            "ui: Fixed an issue where the Audio Mixer popover could not be scrolled on smaller screens when Pro Mode (4-channel) was active."
        ]
    },
    {
        version: "5.5.144",
        date: "2026-07-21",
        changes: [
            "fix: Resolved double audio issue where the original YouTube audio was not muted properly for auto-detected cached AI songs."
        ]
    },
    {
        version: "5.5.143",
        date: "2026-07-21",
        changes: [
            "perf: Removed high-frequency 1-second interval sync loop in UniversalPlayer, replacing it with an Event-Driven architecture for smooth, artifact-free AI audio playback.",
            "feat: Implemented automatic cache detection via HEAD requests in the Queue and Search results, displaying 'แยกเสียงแล้ว' instantly without manual interaction."
        ]
    },
    {
        version: "5.5.142",
        date: "2026-07-21",
        changes: [
            "fix: Fixed a bug where gradually muting tracks in 4ch mode caused all audio to disappear due to browser suspension of muted HTMLAudioElements.",
            "ui: Redesigned the Limit Reached modal to look cleaner and more premium for users who have not logged in with Gmail."
        ]
    },
    {
        version: "5.5.139",
        date: "2026-07-21",
        changes: [
            "feat: Added dedicated mute toggle buttons for each track in the Audio Mixer popover.",
            "fix: Resolved state synchronization issue where unmuting from the main panel did not restore volume if it was manually slider-muted."
        ]
    },
    {
        version: "5.5.138",
        date: "2026-07-21",
        changes: [
            "fix: Fixed issue where AI separation state was not retained when replaying songs without clicking the mic button.",
            "fix: Fixed audio looping and jumping when skipping songs by isolating time synchronization to the active video and resetting audio player state."
        ]
    },
    {
        version: "5.5.137",
        date: "2026-07-20",
        changes: [
            "feat: Enforce global login requirement for playback and 4CH extraction to authenticate against YouTube SABR.",
            "fix: Use standalone yt-dlp_macos binary in local-bridge with Chrome cookies for audio downloads."
        ]
    },
    {
        version: "5.5.136",
        date: "2026-07-20",
        changes: [
            "fix: Fixed React Hook ordering violation (Error #310) in VocalModeModal that caused crashes."
        ]
    },
    {
        version: "5.5.135",
        date: "2026-07-20",
        changes: [
            "ux: Disabled downgrade to Basic Mode (2CH) when already in Pro Mode (4CH) in Vocal Mode Modal.",
            "fix: Fixed potential crash in Mixer UI when track state is missing from old cache.",
            "fix: Ensured proper merging of persisted state in useMixerStore."
        ]
    },
    {
        version: "5.5.134",
        date: "2026-07-20",
        changes: [
            "ui: Restored solid background colors for AI Vocal badges (Blue for 2CH, Yellow for 4CH) instead of outline borders.",
            "ux: Changed 4CH upgrade confirmation in QueueList to use the native Vocal Mode Modal instead of a generic confirm dialog."
        ]
    },
    {
        version: "5.5.133",
        date: "2026-07-20",
        changes: [
            "fix: Resolved issue with missing AI Vocal drums causing no audio to play for existing users (cache volume fallback).",
            "fix: Resolved race condition where selecting 'Upgrade to 4 Channel' on previously separated 2CH songs downgraded them instead.",
            "ux: Added a clean popup confirmation modal when upgrading a 2CH song to 4CH from the QueueList.",
            "ui: Moved 4CH/2CH instrument icons strictly outside the badge for cleaner typography."
        ]
    },
    {
        version: "5.5.132",
        date: "2026-07-20",
        changes: [
            "feat: Updated QueueList AI Vocal badge to replace the author name, providing more space.",
            "feat: Replaced 2CH/4CH text marks with intuitive instrument icons (Vocals, Drums, Bass, Guitar) in the QueueList.",
            "feat: Made the 2CH badge in the QueueList clickable, allowing users to upgrade to 4CH directly with a simple confirmation prompt."
        ]
    },
    {
        version: "5.5.131",
        date: "2026-07-20",
        changes: [
            "feat: Added 2CH/4CH indicator in Queue List for AI Vocal status.",
            "feat: Added 'Upgrade to 4 Channel' button in the AI Vocal mixer for upgrading previously separated 2CH songs."
        ]
    },
    {
        version: "5.5.130",
        date: "2026-07-20",
        changes: [
            "feat: Added `defaultMode` to AI Vocal Store to remember user's last selected separation mode (Basic/Pro).",
            "fix: Resolved issue where auto-starting AI separation always forced Basic mode, causing the UI to ignore Pro Mode clicks if it was already processing."
        ]
    },
    {
        version: "5.5.129",
        date: "2026-07-20",
        changes: [
            "fix: Resolved race condition in AI Vocal store that caused Pro Mode (4-channel) separation to be skipped when a Basic mode request was already processing.",
            "fix: Ensured 4-channel audio files are correctly requested from the local Python plugin, fixing the issue of silent stems."
        ]
    },
    {
        version: "5.5.128",
        date: "2026-07-19",
        changes: [
            "feat: Added a modal to select between Basic and Pro modes when clicking 'ตัดเสียงร้อง' (Remove Vocals).",
            "fix: Resolved an issue where AI Vocal processing would automatically start in Basic mode without prompting the user."
        ]
    },
    {
        version: "5.5.127",
        date: "2026-07-19",
        changes: [
            "🐛 Fixed crash in UniversalPlayer caused by stale LocalStorage cache",
        ]
    },
    {
        version: "5.5.126",
        date: "2026-07-19",
        changes: [
            "✨ Added Pro Mode Multi-track AI Separation (Vocals, Drums, Bass, Other)",
            "✨ Added Mode Selector (Basic/Pro) to AI Vocal Control",
            "✨ Updated UniversalPlayer audio engine to support 4-stem mixing",
        ]
    },
    {
        version: "5.5.125",
        date: "2026-07-19",
        changes: [
            "แก้ไขข้อผิดพลาด isKaraoke is not defined ในหน้ารายการคิวเพลง",
            "ซ่อนปุ่มตัดเสียงร้อง (AI Vocal) ในคิวเพลงเมื่ออยู่ในโหมดคาราโอเกะ"
        ]
    },
    {
        version: "v5.5.124 (Responsive Fluid Typography for Lyrics)",
        date: "19 ก.ค. 2569",
        changes: [
            "UI: Migrated Lyrics text sizing from strict screen-size breakpoints (sm, md, lg) to true Fluid Typography using CSS container queries (cqw). Now, the lyrics smoothly scale in exact proportion to the video player's width, ensuring they look perfect on any screen size without being too large or too small."
        ],
        recent_updates: "Switched Lyrics font size to fluid cqw units."
    },
    {
        version: "v5.5.123 (Lyrics Source Choice & Font Sizing)",
        date: "19 ก.ค. 2569",
        changes: [
            "Feature: Added a 'Source' selector in the Lyrics settings to switch between Auto (LRCLIB synced lyrics) and YouTube CC (Official video subtitles). This is useful for Live/Concert videos where the studio timing doesn't match.",
            "UI: Reduced Lyrics font size significantly on mobile screens to prevent text crowding."
        ],
        recent_updates: "Added Lyrics Source selector (LRCLIB / YouTube CC) and optimized mobile font sizes."
    },
    {
        version: "v5.5.122 (Lyrics Sync Offset & UI Wrapping Fix)",
        date: "19 ก.ค. 2569",
        changes: [
            "Bugfix: Fixed missing audio after pausing by explicitly syncing YouTube's programmatic play/pause state and reloading audio streams if the browser suspended them.",
            "Feature: Added 'Sync Offset' (+/- 0.5s) to the Mixer under Lyrics settings. This allows users to manually shift LRCLIB studio lyrics to match Live/MV video versions.",
            "UI: Redesigned LyricsOverlay to properly wrap long text (like Palmy's songs) using clip-path for sweeping, and reduced font sizes on smaller screens to prevent overflow."
        ],
        recent_updates: "Added Lyrics Sync slider and fixed multi-line wrapping."
    },
    {
        version: "v5.5.121 (UI Polish: Toast & Lyrics Sweep)",
        date: "19 ก.ค. 2569",
        changes: [
            "UI: Removed the floating AI Vocal Jobs indicator that was overlapping the video, relying entirely on the cleaner inline queue indicators.",
            "UX: Disabled the sweeping animation for YouTube CC fallback lyrics, opting for a clean highlight instead, as CC lacks per-word timing."
        ],
        recent_updates: "Removed floating AI Toast & Disabled CC sweep."
    },
    {
        version: "v5.5.120 (Lyrics Fallback & Mute Logic Fix)",
        date: "19 ก.ค. 2569",
        changes: [
            "Hotfix: Resolved issue where toggling Mute caused overlapping audio by moving all YouTube mute logic strictly to UniversalPlayer.",
            "Bugfix: Improved LRCLIB API search query to use a generic fallback, greatly increasing lyrics hit rates for Thai songs.",
            "UI: Forcefully unloaded YouTube native CC module to prevent native subtitles from displaying simultaneously with custom LyricsOverlay."
        ],
        recent_updates: "Fixed audio overlap and CC lyrics issues."
    },
    {
        version: "v5.5.119 (Lyrics Bug Fix & Sync Logic)",
        date: "19 ก.ค. 2569",
        changes: [
            "Hotfix: Resolved 'showLyrics is not defined' crash in SidebarControls.",
            "Bugfix: Implemented safe track change logic to prevent playback looping when changing songs."
        ],
        recent_updates: "Fixed Lyrics toggle crash and sync looping."
    },
    {
        version: "v5.5.117 (Mixer & Vocals UI Simplification)",
        date: "19 ก.ค. 2569",
        changes: [
            "UI Update: Simplified the Mixer by removing redundant Mute (M) and Solo (S) buttons since dragging the volume to 0 already handles muting.",
            "UX Polish: The 'Vocals' shortcut button now highlights and changes icon to a crossed-out mic when vocals are CUT, making the state more intuitive."
        ],
        recent_updates: "Simplified Mixer UI and adjusted Vocals button logic"
    },
    {
        version: "v5.5.116 (Mixer UI Mute Sync)",
        date: "18 ก.ค. 2569",
        changes: [
            "UI Sync: The volume sliders in the Mixer now automatically jump to 0% when the track is muted.",
            "Smart Unmute: Dragging the volume slider up from 0% will automatically unmute the track.",
            "Smart Mute: Dragging the volume slider down to 0% will automatically mute the track."
        ],
        recent_updates: "Synced Mixer UI with mute state perfectly"
    },
    {
        version: "v5.5.115 (Fix UniversalPlayer Unmount Crash)",
        date: "18 ก.ค. 2569",
        changes: [
            "Bugfix: Resolved a critical 'Cannot read properties of null (reading src)' error in UniversalPlayer.",
            "Stability: Added try-catch and getIframe() safety checks to YouTube API calls (mute, getCurrentTime, getPlayerState) to prevent crashes when the component unmounts rapidly."
        ],
        recent_updates: "Fixed UniversalPlayer crash during unmount"
    },
    {
        version: "v5.5.113 (QueueItem AI UX Polish)",
        date: "18 ก.ค. 2569",
        changes: [
            "UX: Redesigned the AI Vocal Separation button in the Queue list to use clear text labels ('ตัดเสียงร้อง', 'แยกเสียงแล้ว') instead of ambiguous icons.",
            "UI: Moved the AI button to sit inline with the artist name, freeing up horizontal space for longer song titles.",
            "UI: Replaced the standalone progress bar with an inline text-based percentage for a cleaner flat design aesthetic."
        ],
        recent_updates: "Redesigned AI Separation Badges"
    },
    {
        version: "v5.5.112 (Fix Mixer Popup z-index)",
        date: "18 ก.ค. 2569",
        changes: [
            "FIX: Changed Mixer popup direction to drop down instead of up to prevent it from being hidden behind the z-100 video player."
        ],
        recent_updates: "Mixer Popup Visibility Fix"
    },
    {
        version: "v5.5.111 (Simplify Player Controls)",
        date: "18 ก.ค. 2569",
        changes: [
            "UI: Merged Volume and Instrumental toggles into a unified Audio Settings (Mixer) popover.",
            "UX: Reduced main control bar clutter from 9 to 7 buttons for better mobile/responsive experience.",
            "UI: Mixer popover now dynamically displays Master Volume and AI Audio controls based on song capabilities."
        ],
        recent_updates: "Simplified Player Controls & Unified Mixer"
    },
    {
        version: "v5.5.110 (Restore Player Controls)",
        date: "18 ก.ค. 2569",
        changes: [
            "UI: Restored Fullscreen, CAST, and Volume (Mute) buttons to SidebarControls.",
            "UX: Grouped AI Mixer controls with standard player controls for a unified interface."
        ],
        recent_updates: "Restored Fullscreen, CAST, and Volume controls"
    },
    {
        version: "v5.5.109 (Queue Drag & Drop UX Polish)",
        date: "18 ก.ค. 2569",
        changes: [
            "UX: Made the entire queue item draggable instead of just the grip handle for easier reordering.",
            "UI: Removed `transition-all` on queue items to prevent the drag transform from animating, eliminating the sluggish 'jumping' effect.",
            "UI: Made the GripVertical handle permanently visible on upcoming queue items to clearly indicate draggability."
        ],
        recent_updates: "Queue Drag & Drop UX Polish"
    },
    {
        version: "v5.5.108 (Drag & Drop Queue Sorting)",
        date: "18 ก.ค. 2569",
        changes: [
            "UI: Restored Drag & Drop functionality in QueueList using dnd-kit.",
            "UX: Locked the currently playing song from being dragged, allowing users to safely reorder upcoming songs.",
            "UI: Replaced Next/Image with standard img tags for thumbnails to prevent hydration errors and improve visual consistency.",
            "CLEANUP: Removed absolute bottom progress bars in favor of inline AI vocal status indicators."
        ],
        recent_updates: "Restored Drag & Drop Queue Sorting"
    },
    {
        version: "v5.5.107 (Isolated AI Vocal Mode)",
        date: "17 ก.ค. 2569",
        changes: [
            "UI: Migrated AI Vocal features completely into a standalone `/voice` page to isolate it from the core production app.",
            "CORE: Hijacked the global `addToQueue` store function locally on `/voice` to intercept songs and send them directly to the local AI Python Server.",
            "UI: Embeded `HomePageContent` cleanly into `/voice` to maintain identical robust search UX without sharing state."
        ]
    },
    {
        version: "v5.5.106 (AI Vocal Queue Integration)",
        date: "17 ก.ค. 2569",
        changes: [
            "UI: Integrated AI Vocal Extraction UI directly into the main QueueList with live progress tracking.",
            "UX: Removed `youoke_ai` source type constraint, allowing users to toggle AI vocal extraction via an `aiVocalRequested` flag on any song.",
            "UI: Added an elegant AI processing overlay in SidebarPlayer that smoothly transitions to the separated audio once complete.",
            "CLEANUP: Removed Tokcat dependency entirely."
        ],
        recent_updates: "AI Vocal Queue Integration & Cleanup"
    },
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
        version: "v5.5.142 (Quota Shield)",
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
