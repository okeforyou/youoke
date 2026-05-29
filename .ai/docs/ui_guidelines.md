# 🎨 UI Design System Guidelines

This document defines the strict, high-fidelity design system for our applications. The AI MUST strictly adhere to these values to build premium, immersive, and visually stunning web interfaces.

---

## 🌌 Design Direction: Space-Dark + Glassmorphism
We utilize a modern, premium **dark space theme** with glass-morphic surfaces, subtle gradients, and highly responsive micro-animations that feel premium and tactile.

---

## 🎨 Color Palette (Tailwind / CSS HSL Tokens)

Our palette uses highly calibrated HSL values to maintain visual depth, high contrast, and accessibility.

| Role | Tailwind Token | HSL / HEX Value | Usage |
| :--- | :--- | :--- | :--- |
| **Main Background** | `bg-[#030712]` | `hsl(224 71% 4%)` | Deep space black main background |
| **Card Background** | `bg-slate-900/60` | `hsl(222 47% 11% / 0.6)` | Semi-transparent dark cards |
| **Primary (Brand)** | `bg-emerald-500` / `text-emerald-400` | `hsl(142 70% 45%)` | Primary actions, success, focus borders |
| **Accent / Secondary** | `bg-indigo-600` / `text-indigo-400` | `hsl(250 84% 54%)` | Brand highlights, special tags, graphics |
| **Destructive / Error**| `bg-rose-500` / `text-rose-400` | `hsl(346 84% 61%)` | Errors, dangerous actions (delete, reset) |
| **Muted Text** | `text-slate-400` | `hsl(215 16% 57%)` | Descriptions, captions, helper texts |

---

## 📐 Layout & Typography Standards

- **Typography First:** Use Google Fonts (e.g., **Inter** or **Outfit**) instead of browser default sans-serif. Always use:
  - Headers: `font-bold tracking-tight text-white`
  - Sub-headers: `font-semibold text-slate-100`
- **Layout Margins:**
  - Mobile padding: `px-4 py-6`
  - Desktop container: `max-w-6xl mx-auto px-6 py-12`
- **Glassmorphic Surface Template:**
  To build premium glass panels, use this combined utility classes:
  `backdrop-blur-md bg-slate-900/40 border border-slate-800/80 shadow-2xl shadow-black/40`

---

## ⚡ Interactive & Micro-Animation Rules

An interface that responds beautifully to user inputs instantly feels premium. Always implement these micro-interactions:

1.  **Tactile Press Effect (Scale-Down):**
    For active buttons and clickable cards, add a slight compression effect:
    `active:scale-95 transition-transform duration-100`
2.  **Sleek Hover Lift:**
    Make cards hoverable with a light lift and subtle border illumination:
    `hover:-translate-y-1 hover:border-slate-700/80 transition-all duration-300 ease-out`
3.  **Linear Text Gradients:**
    For important headers or hero text, use brand gradients:
    `bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent`

---

## 🧩 Component Standards

- **Buttons:** Use pre-styled button variants from `@/components/ui/button` (shadcn/ui) only.
- **Icons:** Use `lucide-react` only. Apply a subtle scale-up or opacity change on hover.
- **Modals/Dialogs:** Use `Dialog` from shadcn/ui. Always ensure overlay is styled with `backdrop-blur-sm bg-black/60`.

---

## 🚫 Design Anti-Patterns (NEVER Do)
- **NO Generic Colors:** Do NOT write raw color classes like `bg-red-500` or `bg-blue-600` unless authorized by the palette.
- **NO Inline Buttons:** Do NOT write raw HTML `<button className="...">` from scratch. Use the centralized UI system.
- **NO Flat/Plasticky Cards:** Do NOT create solid, flat background cards (e.g., solid gray `bg-gray-800`). Card layouts must use gradients or transparency (`bg-slate-900/60` or `bg-slate-950/50`) with borders to retain elegance.

