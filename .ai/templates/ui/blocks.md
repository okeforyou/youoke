# 🎨 Project UI Guidelines: Blocks.so (SaaS Dashboards)

You MUST strictly follow these guidelines when writing ANY User Interface code.

## 1. Core Frameworks
- **Styling**: `Tailwind CSS` (utility-first).
- **Components**: `shadcn/ui` (accessible primitives).
- **Layouts & Structures**: Prioritize referencing and generating layouts based on the `blocks.so` open-source library.
- **Icons**: `lucide-react` (or `radix-ui/react-icons` if preferred).

## 2. The Blocks.so Protocol
When tasked to build complex sections like Dashboards, Authentication pages, Pricing Tables, or Settings Panels:
- Do NOT hallucinate raw HTML/CSS from scratch.
- Use standard layout structures (e.g., standard sidebar navigation, header with breadcrumbs, multi-column grid for metrics).
- Combine `shadcn/ui` Card, Table, Button, and Form components to achieve the layout.
- Adapt the blocks to use the existing `tailwind.config.ts` theme variables.

## 3. Theme Inheritance (CRITICAL)
- **Colors**: You MUST inherit the project's color tokens defined in `tailwind.config.ts` or `globals.css` (e.g., `bg-background`, `text-foreground`, `bg-primary`, `border-border`). Do NOT hardcode arbitrary colors like `bg-blue-600` unless it specifically calls for an accent.
- **Spacing/Radius**: Use the standardized radius tokens (e.g., `rounded-xl`, `rounded-2xl` depending on the global CSS variables).

## 4. Expected Aesthetic
- **SaaS & Enterprise Grade**: The UI should look highly professional and modern.
- **Micro-interactions**: Use subtle hover states (`hover:bg-accent`, `hover:text-accent-foreground`).
- **Clean Forms**: Inputs should be aligned, properly labeled, and clearly indicate focus states (`focus-visible:ring-2 focus-visible:ring-ring`).
