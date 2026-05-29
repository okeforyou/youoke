# 🎨 UI Design System Guidelines

This document defines the strict, high-fidelity design system for our applications. The AI MUST strictly adhere to these values to build premium, immersive, and visually stunning web interfaces.

---

## 🛑 STRICT DIRECTIVE: EXACT REPLICATION (GOD MODE)
**You are FORCED to act as an expert in Ant Design / Tremor.**
You must strictly replicate an enterprise, data-heavy dashboard aesthetic. Focus intensely on grid systems, table borders, dense typography, and muted colors. Do not attempt to make the UI "playful" or "glassy".

---

## 🌌 Design Direction: Data-Heavy & Dashboards
We utilize a structured, information-dense theme heavily inspired by Tremor. It prioritizes readability, data visualization, and grid-based layouts over decorative styling.

---

## 🎨 Color Palette (Tailwind / CSS HSL Tokens)

Our palette uses muted backgrounds with highly distinct semantic colors for charts and statuses.

| Role | Tailwind Token | HSL / HEX Value | Usage |
| :--- | :--- | :--- | :--- |
| **Main Background** | `bg-slate-50` (light) | `hsl(210 40% 98%)` | Very subtle off-white background |
| **Surface/Card** | `bg-white` | `hsl(0 0% 100%)` | Dashboard widgets, charts, tables |
| **Primary (Brand)** | `bg-blue-600` | `hsl(221 83% 53%)` | Main actions, primary chart bars |
| **Success/Trend Up**| `text-emerald-600` | `hsl(160 84% 39%)` | Positive KPIs, upward trends |
| **Warning/Error** | `text-amber-500` / `text-red-500`| `hsl(38 92% 50%)` | Alerts, downward trends |
| **Muted Text** | `text-slate-500` | `hsl(215 16% 47%)` | Axis labels, legends, subtitles |

---

## 📐 Layout & Typography Standards

- **Typography First:** Use highly legible system fonts (e.g., **Inter**).
  - Metric Values (KPIs): `font-semibold text-3xl text-slate-900`
  - Metric Labels: `font-medium text-sm text-slate-500 uppercase tracking-wider`
- **Layout Margins:**
  - Dashboard Grid: Use CSS Grid heavily (`grid-cols-1 md:grid-cols-3 gap-6`)
  - Padding: `px-4 py-8 sm:px-6 lg:px-8`
- **Card Styling:**
  Clean cards with slight shadow for separation.
  `bg-white ring-1 ring-slate-200 shadow-sm rounded-xl p-6`

---

## ⚡ Interactive & Micro-Animation Rules

Interactions must be subtle and not distract from the data.
1.  **Chart Tooltips:**
    Focus on functional interactions. Hovering over data points should instantly show tooltips.
2.  **Row Highlighting:**
    In data tables, hovering a row should provide a very slight visual cue.
    `hover:bg-slate-50 transition-colors`

---

## 🧩 Component Standards

- **Charts:** Use `recharts` or Tremor components. Ensure distinct colors for multi-line/bar charts.
- **Tables:** Use sticky headers, clear 1px borders (`divide-y divide-slate-200`), and ample padding.
- **Badges:** Use soft colored backgrounds for statuses (`bg-emerald-100 text-emerald-800`).

---

## 🚫 Design Anti-Patterns (NEVER Do)
- **NO Glassmorphism:** Dashboards require high readability. Do NOT use translucent or blurry backgrounds for data cards.
- **NO Distracting Animations:** Avoid bouncing elements or scale effects on cards. The data is the hero.
- **NO Cluttered Layouts:** Do NOT cram widgets without proper gap spacing. Always use uniform grid gaps (`gap-6` or `gap-8`).
