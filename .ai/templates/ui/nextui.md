# 🎨 UI Design System Guidelines

This document defines the strict, high-fidelity design system for our applications. The AI MUST strictly adhere to these values to build premium, immersive, and visually stunning web interfaces.

---

## 🛑 STRICT DIRECTIVE: EXACT REPLICATION (GOD MODE)
**You are FORCED to act as an expert in NextUI.**
You must strictly clone NextUI's signature aesthetic: vibrant pastels, high contrast, soft deep drop shadows, and extreme border-radii (`rounded-full` for buttons). Do not invent your own generic Tailwind patterns.

---

## 🌌 Design Direction: Modern Vibrant & Glassmorphism
We utilize a highly engaging, colorful, and playful theme inspired by HeroUI (NextUI) and modern consumer apps. It relies on soft drop shadows, vibrant pastels, extreme border-radii, and glassmorphic surfaces.

---

## 🎨 Color Palette (Tailwind / CSS HSL Tokens)

Our palette uses highly saturated, vibrant colors to create a fun and energetic user experience.

| Role | Tailwind Token | HSL / HEX Value | Usage |
| :--- | :--- | :--- | :--- |
| **Main Background** | `bg-slate-50` / `bg-indigo-950` | `hsl(210 40% 98%)` / `hsl(226 58% 10%)` | Soft, off-white or deep colored background |
| **Surface/Card** | `bg-white/70` | `hsl(0 0% 100% / 0.7)` | Glassy translucent cards |
| **Primary (Brand)** | `bg-blue-500` / `text-blue-500` | `hsl(217 91% 60%)` | Main actions, vibrant emphasis |
| **Secondary (Fun)** | `bg-purple-500` | `hsl(270 95% 60%)` | Accents, badges, gradients |
| **Destructive / Error**| `bg-danger` (NextUI default) | `hsl(338 95% 60%)` | Errors, dangerous actions |
| **Muted Text** | `text-slate-500` | `hsl(215 16% 47%)` | Subtitles and helpers |

---

## 📐 Layout & Typography Standards

- **Typography First:** Use **Outfit**, **Poppins**, or **Quicksand**.
  - Headers: `font-bold tracking-tight text-slate-900 dark:text-white`
  - Body: `font-medium text-slate-600 dark:text-slate-300`
- **Layout Margins:**
  - Mobile padding: `px-6 py-8`
  - Desktop container: `max-w-6xl mx-auto px-8 py-16`
- **Glassmorphic Surface Template:**
  Use rounded, soft, glassy panels.
  `backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-lg shadow-blue-500/10 rounded-3xl`

---

## ⚡ Interactive & Micro-Animation Rules

Interactions should be bouncy, fluid, and delightful.
1.  **Bouncy Press Effect:**
    Buttons should visibly scale down on click.
    `active:scale-90 transition-transform duration-200 ease-spring`
2.  **Soft Glowing Hover:**
    Cards and buttons should gain a colored shadow on hover.
    `hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all`
3.  **Vibrant Gradients:**
    Use text gradients to highlight features.
    `bg-gradient-to-tr from-blue-500 to-purple-500 bg-clip-text text-transparent`

---

## 🧩 Component Standards

- **Buttons:** Use highly rounded buttons (`rounded-full`). Include subtle shadows.
- **Icons:** Use `lucide-react` or similar, styled with brand colors.
- **Modals/Dialogs:** Use heavily blurred backdrops (`backdrop-blur-md bg-black/30`).

---

## 🚫 Design Anti-Patterns (NEVER Do)
- **NO Sharp Corners:** Avoid `rounded-none` or `rounded-sm`. Everything should feel soft and pill-shaped.
- **NO Flat/Boring Colors:** Do NOT use raw `#000000` or `#ffffff` for primary branding. Use tinted grays (slates) or pastels.
- **NO Stiff Animations:** Avoid linear transitions. Use ease-out or spring animations.
