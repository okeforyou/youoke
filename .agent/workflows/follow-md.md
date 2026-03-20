---
description: Workflow for safe, verified code modification. Adheres to strict constraints to prevent regression.
---

# Follow Rules Workflow

This workflow ensures the Agent strictly follows the project's 'AGENTS.md' guidelines and 'strict-mode.md' logic.

1.  **Read AGENTS.md**:
    -   Must read `AGENTS.md` at the root of the project to understand the current rules of engagement.
    -   Must read `strict-mode.md` in `.agent/workflows/` to refresh on the surgical edit process.

2.  **Report in Thai (5 Headers)**:
    -   Before any code change, provide a report with:
        1.  **เป้าหมาย (Goal)**
        2.  **สิ่งที่ต้องแก้ (To-be-Changed)**
        3.  **ผลกระทบ (Impact)**
        4.  **แนวทางแก้ไข (Resolution)**
        5.  **ความเข้ากันได้ของดีไซน์ (Design Harmony)**

3.  **Wait for GO**:
    -   Do not use editing tools (`replace_file_content`) or push tools (`git push`) in the same turn as the report.
    -   Explicitly ask for "ลุย" or "ไป" from the user.

4.  **Surgical Execution Only**:
    -   Follow Step 3 and 4 of `strict-mode.md`.
    -   No "Nuclear Reverts" or global file checkouts.

5.  **Final Verification**:
    -   Ensure the change works and didn't break other features (e.g., Chromecast).
