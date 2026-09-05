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

---

## 8. Standard Release & Version Bump Protocol (มาตรฐานการปล่อย Release & Auto-Update)
เพื่อให้การทำงานระหว่าง Web App, Desktop Plugin (Electron), และ GitHub Actions เป็นไปอย่างราบรื่นและง่ายที่สุด ให้ปฏิบัติตามลำดับขั้นตอนนี้เสมอ:
1. **ตรวจสอบความเปลี่ยนแปลงใน Plugin/Local Bridge**:
   - หากมีการแก้ไขโค้ดใน `scripts/local-bridge/` หรือ `youoke-plugin/` จะต้อง **Bump เวอร์ชันใหม่ (Semantic Versioning)** เสมอ เพื่อให้ระบบ Auto-Update ของสมาชิกรู้ว่ามีเวอร์ชันใหม่
2. **ซิงค์เลขเวอร์ชันให้ตรงกันทั้ง 2 จุด**:
   - `youoke-plugin/package.json` -> `"version": "X.Y.Z"`
   - `scripts/local-bridge/server_state.py` -> `VERSION = "X.Y.Z"`
3. **Commit & Push ผ่าน Git Command**:
   - ใช้ Git Remote ที่ผูก Personal Access Token เข้าสู่ `okeforyou/youoke` (Branch `main`)
   - GitHub Actions (`Build and Publish YouOke Plugin`) จะ Build ตัวติดตั้ง Windows/Mac และ Publish Release อัตโนมัติ
4. **Vercel Deployment**:
   - Vercel จะตรวจจับ Commit ล่าสุดและ Build หน้าเว็บใหม่อัตโนมัติ ทำให้ทั้งหน้าเว็บและ Plugin สมาชิกทำงานสอดคล้องกันทันที


## 9. Persistent Git Multi-Account Push Protocol (การ Push ข้ามบัญชีและจัดการ Token)
เมื่อโปรเจกต์นี้ใช้บัญชีแยกกันระหว่าง **Google Account (ล็อกอินพัฒนา AI Studio)** และ **GitHub/Vercel Owner** ทำให้ไม่สามารถใช้ปุ่ม "Export to GitHub" หรือตัวเชื่อมต่อมาตรฐานของเบราว์เซอร์ได้ ดังนั้น เอเจนต์จะต้องทำหน้าที่ตั้งค่าข้อมูลผู้เขียน (Author) และรันคำสั่ง Push ตรงผ่าน Git Terminal เสมอ โดยปฏิบัติตามมาตรฐานสากลนี้:

1. **การกำหนดสิทธิ์ผู้เขียนให้สอดคล้อง (Author Config)**:
   - ก่อนการรันคำสั่งสร้าง Commit ใดๆ เอเจนต์ต้องค้นหาอีเมลและชื่อของผู้เขียน (Owner) ที่ถูกต้องของคลัง Repository นั้นๆ (ตรวจจับจากประวัติ Git Log ก่อนหน้า หรือการตรวจจับอีเมลเชื่อมโยงในคลังโค้ด)
   - จากนั้นให้รันคำสั่งตั้งค่าข้อมูล Author ในเครื่องทุกครั้งก่อน Commit เพื่อป้องกันไม่ให้ระบบคลาวด์ดีพลอย (เช่น Vercel, Netlify) บล็อกการ Deploy:
     `git config user.name "<OWNER_USERNAME>" && git config user.email "<OWNER_EMAIL>"`

2. **การรักษาความปลอดภัยและการอ่าน Token ท้องถิ่น (`.git_token`)**:
   - มองหาและเปิดอ่านรหัสผ่านหรือ GitHub Personal Access Token (PAT) จากไฟล์ `.git_token` ที่อยู่บริเวณ Root โฟลเดอร์ของโปรเจกต์เสมอ
   - หากยังไม่มีไฟล์ดังกล่าว ให้เอเจนต์ทำการแจ้งขอรหัส Token จากผู้ใช้งานทางแชท เมื่อได้รับแล้วให้บันทึกลงในไฟล์ `.git_token` ในระบบเครื่องแบบ Local-Only
   - **มาตรการป้องกันข้อมูลรั่วไหล**: ต้องตรวจสอบเสมอว่าไฟล์ `.git_token` ถูกลงทะเบียนไว้ในไฟล์ `.gitignore` ของโปรเจกต์แล้วเพื่อความปลอดภัย 100% ว่ารหัสลับจะไม่ถูก Push สู่ภายนอก

3. **กระบวนการ Push อย่างปลอดภัย (Secure Push Flow)**:
   - เมื่อถึงเวลาพุชโค้ด ให้เอเจนต์นำรหัส Token ที่อ่านได้จากไฟล์ `.git_token` มารันกระบวนการพุชแบบปลอดภัยไร้ร่องรอยดังนี้:
     1. ตั้งค่า Remote URL ชั่วคราวโดยการฝัง Token ลับ:
        `git remote set-url origin https://<TOKEN_FROM_FILE>@github.com/<OWNER_USERNAME>/<REPO_NAME>.git`
     2. รันคำสั่งส่งข้อมูลขึ้นคลังหลัก:
        `git push origin main` (หรือสาขาหลักที่ใช้งานอยู่)
     3. **ข้อห้ามสำคัญเพื่อความปลอดภัยสูงสุด**: ทันทีที่การ Push เสร็จสิ้น (ไม่ว่าจะสำเร็จหรือล้มเหลว) เอเจนต์จะต้องรันคำสั่งเคลียร์และคืนค่า Remote URL กลับเป็นปกติทันทีเพื่อป้องกันไม่ให้ค้างประวัติ Token ไว้ในระบบ Git Config:
        `git remote set-url origin https://@github.com/<OWNER_USERNAME>/<REPO_NAME>.git`

---

## 10. Multi-Track AI Stem Synchronization & Audio Timing Standards (มาตรฐานการซิงค์เสียงหลายแทร็กและแกะเนื้อเพลง)
เพื่อให้การเล่นเสียงแยกแทร็ก (Vocals, Instrumental, Drums, Bass, Other) และการเทียบจังหวะเนื้อเพลง (AI Lyrics Alignment) มีความแม่นยำสูงสุดระดับมืออาชีพ ไร้เสียงเหลื่อม/เสียงก้องสะท้อน (Phasing/Comb-Filtering) ให้ปฏิบัติตามมาตรฐานนี้เสมอ:

1. **Master-Slave Audio Clock Synchronization**:
   - กำหนดให้แทร็กเสียงหลัก (Primary Vocal Stem หรือ Instrumental Stem) ทำหน้าที่เป็น **Master Audio Clock**
   - ในลูป `requestAnimationFrame` ทุกแทร็กย่อย (Slave Stems: drums, bass, instrumental, other) จะต้องถูกล็อกเวลาเข้ากับ Master Clock โดยตรงด้วยค่าความคลาดเคลื่อนสูงสุดไม่เกิน **25ms (`0.025s`)** หากหลุดจากนี้ให้ Snap เวลาทันที
   - การซิงค์ภาพวิดีโอกับเสียง (YouTube Clock vs Master Audio): ใช้เกณฑ์ตรวจจับที่ **100ms (`0.10s`)** เพื่อให้การ Seek หรือกระตุกของเครือข่ายปรับคืนจังหวะได้อย่างรวดเร็ว

2. **Resilient AI Vocal & Transcription Pipeline (ระบบแกะเนื้อเพลงอัตโนมัติแบบ Multi-tiered Fallback)**:
   - สำหรับคำขอ AI Transcription (`/transcribe`):
     1. **Priority 1**: ตรวจหาไฟล์เสียงร้องที่แยกแล้ว (`vocals.m4a`, `vocals.wav`, `vocals.mp3`) เพื่อความแม่นยำสูงสุด
     2. **Priority 2**: หากยังไม่ได้แยกเสียงร้อง ให้ค้นหาไฟล์เสียงต้นฉบับ (`original.m4a`, `original.audio`, `${video_id}.m4a`, `no_vocals.m4a`)
     3. **Priority 3**: หากไม่มีไฟล์เสียงในเครื่องเลย ให้ระบบ Local Bridge ดึงสตรีมเสียงผ่าน `yt-dlp` อัตโนมัติในพื้นหลัง เพื่อให้ผู้ใช้สามารถกด AI Sync ได้ทันทีโดยไม่เกิด Error 404 "ไม่พบไฟล์เสียงร้อง"



