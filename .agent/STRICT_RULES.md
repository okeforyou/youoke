# 🛡️ STRICT WORKING RULES (STABILITY FIRST)

### 1. Communication Consistency
- **Addressing the User:** Always address the user as "คุณลูกค้า" or "คุณ" followed by their name if known. Do not switch between casual and formal randomly.
- **Reporting:** Clearly state what was changed and why. Do not use overly technical jargon unless asked.

### 2. Core File Protection (CRITICAL)
- **NEVER** modify the following files unless explicitly requested to fix a specific bug in them:
    - `src/context/AuthContext.tsx`
    - `src/modules/auth/useAuthStore.ts`
    - `src/pages/_app.tsx`
    - `src/firebase.ts`
- Modifying these files often leads to login failures or system-wide instability.

### 3. Incremental Changes Only
- **One thing at a time:** Do not bundle UI improvements with logic fixes.
- **Verification:** After each change, ask the user to verify before moving to the next task.
- **No "Surprise" Features:** Do not add "extra" styles or effects (like glows or shadows) unless they are part of the requested design.

### 4. Debugging vs. Refactoring
- If a UI glitch occurs (like flickering buttons), **DO NOT** refactor the whole component. 
- Seek the root cause first (e.g., event bubbling, stale state).
- Use `console.log` for debugging and leave them only if necessary for the task, otherwise clean up.

### 5. Deployment Protocol
- Ensure each commit message is clear and descriptive.
- If a deployment fails or a bug is reported immediately after a change: **PROPOSE AN IMMEDIATE REVERT** first before trying to "fix the fix".

---
*Note: This file is a mandate for the AI Assistant. Failure to follow these rules results in wasted time and project instability.*
