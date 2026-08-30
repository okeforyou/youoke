# Master Agent Directives & Engineering Protocol (AGENTS.md)

This configuration file defines the persistent operating standards, cognitive workflows, architecture principles, and token-efficiency rules for this codebase.

---

## 1. Deep Analysis & "Grill Me" Protocol (ถามก่อนทำ ไม่เดาเอง)
- **Clarification First**: When given complex, ambiguous, or architecturally significant requirements, **do NOT write code immediately**.
- **Edge Case & Data Analysis**: Analyze data flow, edge cases, business constraints, and downstream impacts.
- **Grill Me Inquiry**: Present 2–4 concise, critical clarifying questions or design choices to the user first to confirm assumptions before implementing.

---

## 2. Token Conservation & High-Signal Communication (ประหยัด Token สูงสุด)
- **Action Over Chitchat**: Avoid long preambles, marketing hype, repetitive conversational filler, or self-praise.
- **Surgical Code Edits**: Edit only the necessary lines/functions. Avoid rewriting entire massive files when modifying single functions.
- **Compact Scannable Summaries**: End each turn with a high-density, bulleted summary focusing on functional outcomes and visual/architectural decisions without listing redundant file paths unless asked.
- **Model Tier & Level Selection (ต้องเสนอระดับโมเดลก่อนเริ่ม)**: Before proposing or executing any plan or code changes, **always explicitly state which Model Tier and Level (e.g. Gemini 3.5 Flash - Low/Medium/Pro)** you recommend to use for the task. This ensures the user is aware of and can manage token usage and reasoning depth before approving.


---

## 3. Architecture Simplicity & Continuous Refactorability (โครงสร้างเรียบง่าย พร้อม Refactor ตลอดเวลา)
- **Single Source of Truth**: Keep data models, types, and business constants in dedicated files (e.g. `types.ts`, `data/`, `services/`).
- **Small, Modular Components (< 150-200 lines)**: Break large monolithic views into focused sub-components. This prevents token context bloat and makes future refactoring instantaneous.
- **Separation of Concerns**:
  - `components/` -> Pure UI & Interaction
  - `views/` -> Feature Screens & Page Layouts
  - `services/` / `utils/` -> Business Logic, Calculations, Parsers & API Connectors
  - `data/` -> Master constants, presets, and seed definitions
- **KISS & Anti-Overengineering**: Build exactly what satisfies user intent. Do not create unnecessary abstraction layers, fake backend wrappers, or unrequested microservices.

---

## 4. Universal Tech Stack Adaptability (ปรับตาม Stack ของโปรเจกต์)
- Respect and align with the existing project dependencies and frameworks (`package.json`, TypeScript, React, Tailwind CSS, Vite, etc.).
- Enforce strict type-safety with TypeScript (`no implicit any`, explicit interfaces).
- No simulated/fake infrastructure: Always use robust, production-grade logic and real-world data pipelines.

---

## 5. UI/UX Craftsmanship (Anti-Slop Standard)
- Professional, enterprise-grade typography and spacing ratios.
- Strict color contrast (WCAG AA compliant).
- Responsive by default (Mobile touch targets >= 44px, Desktop fluidity with `max-w-*` constraints).
- Explicit HTML `id` attributes on key interactive elements.

---

## 6. AI-Native Advanced Engineering Patterns (3 เสริมแกร่งมาตรฐานสากล)
- **Deterministic Data Contracts First (Type ก่อน UI เสมอ)**:
  - นิยาม Data Schema, TypeScript Interfaces, และ Error States ใน `types.ts` หรือ Schema Layer ให้สมบูรณ์และชัดเจนก่อนเริ่มเขียน UI Component เพื่อป้องกันปัญหา Property Mismatch
- **Feature Flags & State Management Strategy**:
  - ออกแบบ State กลางและ Role-Based Access Control (RBAC) ให้มี Feature Flags ป้องกันการเข้าถึงข้อมูลลับ (เช่น การซ่อนต้นทุน/กำไรขั้นต้นจากพนักงานขาย) อย่างรัดกุมระดับ State Layer
- **Living Architecture & Changelog Alignment**:
  - ทุกครั้งที่มีการเพิ่มหรือปรับปรุงโมดูลสำคัญ ให้คงความสอดคล้องของ Data Flow และสรุปการเปลี่ยนแปลงในรูปแบบ Bullet Point ที่ตรวจสอบย้อนหลังได้ทันที

---

## 7. Self-Verification & Quality Loop
- Every code modification must automatically pass:
  1. TypeScript type checking (`lint_applet`)
  2. Production compilation build (`compile_applet`)
- In case of build or lint errors, diagnose the root cause and self-correct systematically.
