# 📐 Architecture Decision Records (ADR)
*Log of all significant architectural decisions, library choices, and structural changes.*

---

## 2026-07-29 - AI Vocal v2 adopts local-first multi-acquisition architecture

**Context**
- YouOke uses YouTube as the main playback source and AI Vocal is a core product differentiator.
- The existing AI Vocal flow depends too heavily on direct audio download from YouTube.
- YouTube anti-bot changes can break download methods without warning.

**Decision**
- Keep YouTube as the primary playback experience.
- Redesign AI Vocal as a local-first multi-acquisition system.
- Treat direct download as a fast path, not the only path.
- Introduce upload/capture-based separation as the long-term reliable fallback.

**Implications**
- Existing download strategies remain valuable, but no longer define overall reliability.
- The local bridge must support separation from both YouTube IDs and uploaded/captured audio.
- AI Vocal changes should stay isolated from the main playback architecture.

**Reference**
- See `.ai/docs/ai-vocal-v2-architecture.md`

## 2026-07-29 - Safe rollout rule for AI Vocal changes

**Context**
- The repository currently has local changes in the runtime bridge area.
- Broad refactors in AI Vocal could affect playback or plugin stability.

**Decision**
- Roll out AI Vocal changes in compatibility-preserving phases.
- Diagnose current failures before broad refactoring.
- Prefer minimal bug fixes first, then expand to V2 capabilities.

**Implications**
- Immediate work should focus on pipeline validation, structured logging, and playback compatibility.
- Version bump and release should happen only after local validation succeeds.
