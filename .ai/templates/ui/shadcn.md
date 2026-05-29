# 🎨 UI Design System Guidelines

This document defines the strict, high-fidelity design system for our applications. The AI MUST strictly adhere to these values to build premium, immersive, and visually stunning web interfaces.

---

## 🛑 STRICT DIRECTIVE: EXACT REPLICATION (GOD MODE)
**You are FORCED to act as an expert in Shadcn UI.**
1. **Component Installation:** Do not reinvent the wheel. Whenever a user asks for a UI component (Button, Modal, Card), explicitly tell the user to run `npx shadcn-ui@latest add [component]` to fetch the official code.
2. **Tailwind Cloning:** If you must write raw Tailwind CSS, you MUST clone the exact Shadcn aesthetic (1px borders, subtle hover effects, monochrome colors).

---

## 🌌 Design Direction: Minimalist & Clean
We utilize a highly functional, accessible, and minimalist theme heavily inspired by shadcn/ui and Vercel. It relies on high contrast, stark black and white, subtle borders, and an absence of unnecessary shadows or gradients.

---

## 🎨 Color Palette (Tailwind / CSS HSL Tokens)

Our palette is strictly monochromatic with primary brand accents for functional clarity.

| Role | Tailwind Token | HSL / HEX Value | Usage |
| :--- | :--- | :--- | :--- |
| **Main Background** | `bg-white` (light) / `bg-zinc-950` (dark) | `hsl(0 0% 100%)` / `hsl(240 10% 3.9%)` | Clean standard background |
| **Surface/Card** | `bg-zinc-50` (light) / `bg-zinc-900` (dark) | `hsl(240 4.8% 95.9%)` | Modals, cards, distinct sections |
| **Primary (Brand)** | `bg-zinc-900` / `text-zinc-50` | `hsl(240 5.9% 10%)` | Main buttons, active states, focus |
| **Destructive / Error**| `bg-red-500` / `text-red-50` | `hsl(0 84.2% 60.2%)` | Errors, dangerous actions (delete, reset) |
| **Muted / Borders** | `border-zinc-200` / `text-zinc-500` | `hsl(240 5.9% 90%)` | 1px dividers, helper texts, disabled states |

---

## 📐 Layout & Typography Standards

- **Typography First:** Use **Geist**, **Inter**, or system fonts.
  - Headers: `font-semibold tracking-tight text-zinc-950 dark:text-zinc-50`
  - Body: `font-normal text-sm text-zinc-700 dark:text-zinc-300`
- **Layout Margins:**
  - Mobile padding: `px-4 py-6`
  - Desktop container: `max-w-5xl mx-auto px-8 py-12`
- **Component Styling (Flat Design):**
  Do NOT use drop shadows unless floating (like a popover). Rely on 1px borders.
  `border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 rounded-md`

---

## ⚡ Interactive & Micro-Animation Rules

Interactions should be swift, functional, and not distracting.
1.  **Swift Hover States:**
    Change background colors on hover instantly or with a very short duration.
    `hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200`
2.  **Focus Rings:**
    Strict accessibility is required. All inputs must have a clear focus state.
    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ring-offset-2`

---

## 🧩 Component Standards

- **Buttons:** Use pre-styled variants from `@/components/ui/button` (shadcn/ui). Sharp corners or `rounded-md`.
- **Icons:** Use `lucide-react`. Keep them small (e.g. `w-4 h-4`).
- **Modals/Dialogs:** Plain backdrop (`bg-black/80`). No blur necessary.

---

## 🚫 Design Anti-Patterns (NEVER Do)
- **NO Colorful Gradients:** Do NOT use `bg-gradient-to-r` with vibrant colors. Keep it monochrome.
- **NO Heavy Drop Shadows:** Do NOT use `shadow-xl` or `shadow-2xl` for layout elements. Flat design first.
- **NO Bubbly Rounded Corners:** Stick to `rounded-md` or `rounded-lg`. Avoid `rounded-3xl`.
