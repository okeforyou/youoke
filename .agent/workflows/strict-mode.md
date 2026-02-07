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
