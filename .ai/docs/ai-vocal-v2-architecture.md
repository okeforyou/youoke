# AI Vocal v2 Architecture Plan

> Status: Proposed
> Scope: AI Vocal local-first architecture for YouTube-based karaoke playback
> Last Updated: 2026-07-29

---

## 1. Product Goal

YouOke uses YouTube as the main playback source for karaoke and music listening. AI Vocal is a strategic feature that lets members separate vocals from the currently playing YouTube song with minimal friction.

The business goal is:

- Keep YouTube as the primary media source and core product experience.
- Perform separation locally to avoid server compute cost.
- Make AI Vocal reliable enough to be a flagship differentiator in Thailand.

## 2. Current Problem

The current AI Vocal pipeline depends too heavily on direct audio acquisition from YouTube. That creates two major risks:

1. Acquisition instability:
   - `yt-dlp`, `pytubefix`, and similar tools are affected by anti-bot changes, SABR blocks, expired signatures, and cookie issues.
2. Pipeline fragility:
   - Even when acquisition succeeds, post-processing and playback coordination can still fail.

This means AI Vocal reliability is currently limited by the weakest external dependency.

## 3. V2 Architecture Principle

AI Vocal v2 must be designed as a `local-first, multi-acquisition pipeline`.

Key principle:

- Users still experience "separate vocals from the YouTube song I am playing now".
- Internally, the system must support multiple ways to obtain audio for Demucs.
- Direct YouTube download becomes a fast path, not the only path.

## 4. Target Architecture

```text
YouTube Player in Web App
        |
        v
AI Vocal Orchestrator
        |
        +--> Layer A: Local Cache Lookup
        |
        +--> Layer B: Direct Audio Acquisition
        |     - yt-dlp
        |     - yt-dlp Python
        |     - pytubefix
        |     - innertube + ffmpeg
        |
        +--> Layer C: Browser/Tab Audio Capture
        |     - Chrome Extension / browser capture
        |     - record actual playback audio from user environment
        |
        +--> Layer D: Optional Cloud Rescue (future, premium-only)
              - only when all local methods fail
        |
        v
Local Bridge
        |
        +--> normalize audio
        +--> run Demucs
        +--> convert stems
        +--> save local cache
        |
        v
Frontend Player plays local stems
```

## 5. Acquisition Strategy

### Layer A: Cache First

If the song has already been separated on the user machine, return cached stems immediately.

Why:

- fastest response
- no YouTube dependency
- lowest CPU and network cost

### Layer B: Direct Download Fast Path

Keep the current direct acquisition chain:

- `yt-dlp binary`
- `yt-dlp Python module`
- `pytubefix`
- `innertube + ffmpeg`

Role in v2:

- optimize for speed when it works
- do not treat as the only reliable path

### Layer C: Browser/Tab Capture Reliable Path

Add a browser-assisted acquisition method that captures the actual playback audio from the user environment.

Recommended implementation:

- Chrome extension or browser companion
- capture tab audio from the active YouOke playback tab
- send recorded audio to the local bridge via upload endpoint

Why this is the long-term reliability pillar:

- avoids most anti-bot problems
- matches the real user playback context
- remains local-first
- preserves YouTube as the main product experience

### Layer D: Cloud Rescue (Optional)

Not part of the default product flow.

Use only if:

- all local methods fail
- user is on a premium plan that allows fallback processing
- the team decides the cost model is acceptable

## 6. API Direction

Current behavior is too centered on `/separate` with `video_id`.

V2 direction:

- `POST /separate-youtube`
  - request separation from a YouTube ID using direct acquisition strategies
- `POST /separate-upload`
  - request separation from an uploaded local audio file
- `GET /progress/:id`
  - unchanged high-level concept
- `GET /files/:id/...`
  - unchanged high-level concept

Frontend should call a single orchestration layer such as:

- `requestAIVocal(videoId, mode)`

The orchestrator decides:

1. cache available?
2. direct acquisition works?
3. fallback to capture?

## 7. Safety Boundaries

To avoid affecting the overall system:

- Do not change YouTube playback architecture first.
- Do not replace the current player flow in one step.
- Keep AI Vocal changes isolated to:
  - local bridge
  - AI vocal store
  - AI vocal playback adapter
  - optional extension/capture integration
- Ship in small compatibility-preserving steps.

## 8. Rollout Plan

### Phase 0: Stabilize Existing Pipeline

Goal:

- confirm where the current failures occur
- fix local bridge and playback mismatches

Tasks:

- verify download success vs post-processing failure
- fix stem generation pipeline
- fix active bridge port consistency in playback
- improve structured logging

### Phase 1: Formalize Audio Acquisition Layer

Goal:

- separate acquisition from separation

Tasks:

- introduce acquisition abstraction
- keep current download strategies as fast path
- add clearer internal status codes

### Phase 2: Add Upload-Based Separation

Goal:

- allow the bridge to separate audio independent of YouTube download logic

Tasks:

- add `/separate-upload`
- add file validation and normalization
- store stems under the same cache model

### Phase 3: Add Browser/Tab Capture

Goal:

- make AI Vocal resilient even when download tools fail

Tasks:

- implement browser extension capture flow
- define handoff from browser to local bridge
- handle UX states such as "capturing current song audio"

### Phase 4: Optional Cloud Rescue

Goal:

- support a premium or emergency fallback

Tasks:

- cost model
- auth design
- GPU worker prototype

## 9. Testing Strategy

Testing must be split into layers:

1. Acquisition tests
   - direct download success/failure by strategy
2. Local bridge tests
   - convert input audio -> Demucs -> output stems
3. Playback tests
   - frontend uses correct active bridge port
   - stems play and sync correctly
4. Cache tests
   - cache hit short-circuits processing

## 10. Versioning Rule

Any code change to:

- `scripts/local-bridge/`
- `youoke-plugin/`

requires a plugin version bump using:

```bash
node scripts/bump-version.js <NEW_VERSION>
```

This updates:

- `youoke-plugin/package.json`
- `scripts/local-bridge/server.py`
- `src/components/ListPlaylistsGrid.tsx`

## 11. Immediate Recommendation

The safest next move is:

1. document AI Vocal v2
2. diagnose the current local bridge without broad refactors
3. fix only compatibility-preserving bugs first
4. release a stability-focused plugin version
5. then build capture-based fallback as v2 expansion

## 12. Success Criteria

AI Vocal v2 is considered successful when:

- users can request vocal separation from a YouTube song with one action
- the system does not depend on a single YouTube download method
- most failures are recoverable via fallback
- local processing remains the default path
- plugin releases can be shipped safely with reproducible versioning
