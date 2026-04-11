---
description: Workflow for safe, verified code modification. Adheres to strict constraints to prevent regression.
---

# Strict Mode Editing Workflow

This workflow ensures all code modifications are safe, targeted, and verified. Use this when you need to be extra careful not to break existing functionality.

1.  **Analyze Context**:
    -   Read the file to be modified thoroughly using `view_file` or `view_file_outline`.
    -   Identify dependencies and potential side effects.
    -   **Constraint**: Do not modify more than one user-facing feature at a time.

2.  **Verify Current State**:
    -   Check if the application is currently running without errors (e.g., check terminal output or browser).
    -   **Constraint**: If the current state is broken, identify if the new change fixes it. If not, acknowledge the existing breakage before proceeding.

3.  **Plan Modification**:
    -   Draft the exact changes mentally or in a scratchpad.
    -   **Constraint**: Only change lines relevant to the user request. **DO NOT** "drive-by refactor", reformat unrelated code, or "optimize" anything unless explicitly asked. This is the most common cause of regression.

4.  **Execute Change**:
    -   Apply changes using surgical tools (`replace_file_content` or `multi_replace_file_content`).
    -   **Constraint**: Verify syntax immediately after editing.

5.  **Verify Change**:
    -   Run tests or check the browser to confirm the fix works.
    -   **Constraint**: If the change causes a new error, **STOP**. Analyze the error. Do not blindly attempt to fix it by changing more code. Revert if necessary.

6.  **Final Check**:
    -   Ensure no other parts of the file were accidentally modified (e.g., deleted imports).

## 🛡️ YouOKE Core Safety Rules (Fragile Zones)

**CRITICAL: Do not modify synchronization logic unless you have a 100% verified baseline.**

1.  **Logic Freeze (Sync Core)**:
    -   Avoid touching `src/hooks/useCommandExecutor.ts`, `src/plugins/cast/services/CastService.ts`, and core state logic in `src/modules/player/stores/usePlayerStore.ts`.
    -   Small changes here can cause race conditions, double-adding of songs, or infinite loops.

2.  **Command Executor Integrity**:
    -   **Rule**: Always ensure `snapshot.key` is extracted and used as `id` in `executeCommand`. This is required to mark commands as `completed` and prevent them from re-running on every refresh/reconnect.
    -   **Rule**: Never blindly append to the queue in `ADD_TO_QUEUE` without checking for existing `uuid` or `videoId` if stability is in question.

3.  **Synchronization Locks**:
    -   The `isProcessingSync` flag in `CastService.ts` is a lifecycle lock. If you remove or ignore it, the system will enter an "echo loop" where Dashboard and TV fight over the state.
    -   **Rule**: Always check for this flag before writing to the Firebase `state/` path.

4.  **UI Isolation**:
    -   Keep CSS and component layout code strictly separated from functional hooks.
    -   **Rule**: When adding UI elements (like indicators or buttons), do not modify the props or dependency arrays of hooks like `useCmdExec` or `onValue` listeners.

5.  **Reversion Protocol**:
    -   If a "Polishing" change results in a report of "ระบบรวน" (Glitchy system), immediate **Hard Reset** to the last known stable commit (e.g., v5.3.98 - `9568f005`) is preferred over manual patching.
