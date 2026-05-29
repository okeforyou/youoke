# 🚀 AI Coding Protocol - Quick Start Guide

Welcome! Your project is now equipped with the **AI Coding Protocol**. This gives you "God Mode" control over your AI coding assistants (Cursor, Windsurf, Copilot, etc.).

## 1. Choose Your UI Design System

To ensure your AI generates beautiful, consistent UI code, you must set a design guideline.
Run ONE of the following commands in your terminal to lock in a design style:

**For a Minimalist & Clean look (Shadcn UI):**
```bash
cp .ai/templates/ui/shadcn.md .ai/docs/ui_guidelines.md
```

**For a Space-Dark Glassmorphism look (Aceternity UI):**
```bash
cp .ai/templates/ui/aceternity.md .ai/docs/ui_guidelines.md
```

**For a Vibrant, Soft, and Playful look (NextUI):**
```bash
cp .ai/templates/ui/nextui.md .ai/docs/ui_guidelines.md
```

**For a Dense Data Dashboard look (Ant Design / Tremor):**
```bash
cp .ai/templates/ui/antdesign.md .ai/docs/ui_guidelines.md
```

**For Premium SaaS Dashboards (Blocks.so + shadcn/ui):**
```bash
cp .ai/templates/ui/blocks.md .ai/docs/ui_guidelines.md
```

*(Once copied, the AI will strictly follow these rules and will NEVER hallucinate random colors or styles!)*

## 2. Start a New Task

Whenever you start a new major task with your AI, start the conversation by pasting the following prompt:

> "Please review `.ai/prompts/01-session-start.md` and follow the instructions to begin."

This forces the AI to read your design guidelines, check the current project state, and create a solid plan before it starts writing messy code.

## 3. Verify Your Code (Pre-commit)

Before you commit your code, run the protocol check to ensure you haven't leaked any `.env` secrets and that the AI's state is clean:

```bash
npx --yes github:boonyanone/ai-coding-protocol check
```

---
*For the full manual, visit: https://agent-workflow-hub.vercel.app/manual*
