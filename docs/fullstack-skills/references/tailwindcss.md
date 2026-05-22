# Tailwind CSS v4 Reference

## Table of Contents

1. [v4 Fundamentals — What Changed](#fundamentals)
2. [CSS-First Configuration (@theme)](#theme)
3. [Design Tokens System](#tokens)
4. [Component Patterns](#components)
5. [Responsive & Container Queries](#responsive)
6. [Dark Mode](#darkmode)
7. [Common Utilities Cheatsheet](#cheatsheet)

---

## v4 Fundamentals — What Changed {#fundamentals}

### Installation (Next.js + Vite)

```bash
npm install tailwindcss @tailwindcss/vite
```

```typescript
// next.config.ts — use the Vite plugin for maximum performance
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind v4 integrates via @tailwindcss/vite automatically
  // No extra config needed for content detection
};

export default nextConfig;
```

### globals.css — the ONLY Tailwind entry point

```css
/* v4: one import replaces all @tailwind directives */
@import "tailwindcss";

/* Your theme goes here — see @theme section */
@theme {
  /* ... */
}
```

### Key Breaking Changes from v3

| v3                                        | v4                               |
| ----------------------------------------- | -------------------------------- |
| `tailwind.config.js`                      | `@theme { }` in CSS              |
| `@tailwind base/components/utilities`     | `@import "tailwindcss"`          |
| `bg-gradient-to-r`                        | `bg-linear-to-r`                 |
| `flex-shrink-0`                           | `shrink-0`                       |
| `overflow-ellipsis`                       | `text-ellipsis`                  |
| `decoration-slice`                        | `box-decoration-slice`           |
| `@tailwindcss/container-queries` (plugin) | Built-in                         |
| `content: [...]` in config                | Zero-config auto-detection       |
| `ring` default: 3px blue                  | `ring` default: 1px currentColor |
| `border` default: gray-200                | `border` default: currentColor   |

---

## CSS-First Configuration (@theme) {#theme}

```css
@import "tailwindcss";

@theme {
  /* ── Colors ─────────────────────────────────── */
  /* Use OKLCH for vibrant, perceptually uniform colors */
  --color-primary: oklch(0.55 0.2 250); /* blue */
  --color-primary-50: oklch(0.97 0.02 250);
  --color-primary-100: oklch(0.93 0.05 250);
  --color-primary-500: oklch(0.55 0.2 250);
  --color-primary-600: oklch(0.48 0.2 250);
  --color-primary-700: oklch(0.4 0.19 250);

  --color-secondary: oklch(0.6 0.16 180); /* teal */
  --color-danger: oklch(0.55 0.22 30); /* red */
  --color-success: oklch(0.55 0.18 145); /* green */
  --color-warning: oklch(0.75 0.18 80); /* amber */

  /* ── Typography ─────────────────────────────── */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-display: "Cal Sans", "Inter", sans-serif;

  /* ── Spacing overrides (optional) ───────────── */
  /* Default: dynamic 0.25rem multiplier — no need to override unless restricting */

  /* ── Border radius ───────────────────────────── */
  --radius-sm: 0.25rem;
  --radius: 0.5rem; /* --radius-DEFAULT */
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;

  /* ── Shadows ─────────────────────────────────── */
  --shadow-card: 0 1px 3px oklch(0 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.06);

  /* ── Breakpoints (override or extend) ────────── */
  --breakpoint-xs: 30rem; /* 480px — custom extra-small */
  /* sm/md/lg/xl/2xl remain unchanged */

  /* ── Transitions ─────────────────────────────── */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.1);
}
```

### Utility classes auto-generated from @theme

When you define `--color-primary` in `@theme`:

- `bg-primary`, `text-primary`, `border-primary`, `ring-primary` are all available
- `bg-primary-500`, `bg-primary-600`, etc. for scale tokens
- Opacity modifier: `bg-primary/80` (80% opacity via color-mix)

---

## Design Tokens System {#tokens}

### Semantic layers (CSS variables on top of Tailwind)

```css
/* globals.css — semantic tokens */
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.55 0.2 250);
  /* ... base tokens ... */
}

/* Semantic surface tokens — use these in components */
:root {
  --surface-bg: var(--color-white);
  --surface-card: var(--color-white);
  --surface-sidebar: oklch(0.15 0.02 250);
  --text-primary: oklch(0.15 0.01 250);
  --text-secondary: oklch(0.45 0.01 250);
  --text-muted: oklch(0.6 0.01 250);
  --border-default: oklch(0.9 0.01 250);
  --border-focus: var(--color-primary);
}

/* Dark mode — override semantic tokens */
.dark {
  --surface-bg: oklch(0.1 0.02 250);
  --surface-card: oklch(0.15 0.02 250);
  --surface-sidebar: oklch(0.08 0.02 250);
  --text-primary: oklch(0.95 0.01 250);
  --text-secondary: oklch(0.7 0.01 250);
  --text-muted: oklch(0.55 0.01 250);
  --border-default: oklch(0.25 0.02 250);
}
```

### Use CSS variables in components

```tsx
// Use CSS var syntax in Tailwind v4
<div className="bg-surface-card text-primary border border-default">
  {/* ... */}
</div>
```

---

## Component Patterns {#components}

### Custom utilities with @utility

```css
/* globals.css — define reusable component classes */
@layer utilities {
  .input {
    width: 100%;
    height: 2.5rem;
    padding-inline: 0.75rem;
    border-radius: var(--radius);
    border: 1px solid var(--border-default);
    background-color: var(--surface-card);
    color: var(--text-primary);
    font-size: 0.875rem;
    outline: none;
    transition:
      border-color 150ms,
      box-shadow 150ms;

    &:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px oklch(from var(--color-primary) l c h / 0.15);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.375rem;
  }

  .card {
    background-color: var(--surface-card);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 500;
  }
}
```

### cn utility (class merging)

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Variant pattern with cva

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'badge', // base class from @layer utilities
  {
    variants: {
      variant: {
        default:  'bg-gray-100 text-gray-700',
        success:  'bg-green-100 text-green-700',
        warning:  'bg-amber-100 text-amber-700',
        danger:   'bg-red-100 text-red-700',
        primary:  'bg-primary/10 text-primary-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span {...props} className={cn(badgeVariants({ variant }), className)} />;
}
```

---

## Responsive & Container Queries {#responsive}

### Standard responsive (breakpoints)

```tsx
// Mobile-first approach
<div className="
  grid grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
  gap-4
">
```

### Container Queries (built-in v4, no plugin needed)

```tsx
// Use @container on the parent, @sm/@lg etc. on children
<div className="@container">
  <div className="
    grid grid-cols-1
    @sm:grid-cols-2
    @lg:grid-cols-3
    @xl:grid-cols-4
  ">
    {products.map(p => <ProductCard key={p.id} product={p} />)}
  </div>
</div>

// Named containers
<aside className="@container/sidebar">
  <nav className="flex-col @sidebar/sidebar:flex-row">
    {/* ... */}
  </nav>
</aside>
```

### Max-width container queries

```tsx
<div className="@container">
  {/* Collapses at small container sizes */}
  <div className="grid grid-cols-3 @max-sm:grid-cols-1">
```

---

## Dark Mode {#darkmode}

```css
/* globals.css — class-based dark mode */
@import "tailwindcss";

@theme {
  /* Force class-based dark mode */
}
```

```typescript
// next.config.ts or tailwind setup — class strategy
// In v4, add to globals.css:
```

```css
/* Dark mode via .dark class on <html> */
.dark {
  color-scheme: dark;
  --surface-bg: oklch(0.1 0.02 250);
  /* ... other overrides */
}
```

```tsx
// components/ThemeToggle.tsx
"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
```

---

## Common Utilities Cheatsheet {#cheatsheet}

### Layout

```
flex items-center justify-between   — flex row, centered, space between
grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))]  — responsive auto grid
h-screen overflow-hidden            — full screen, no scroll
min-h-0 overflow-y-auto             — scrollable flex child
sticky top-0 z-40                   — sticky header
```

### Spacing

```
p-4 px-6 py-3       — padding (1rem, 1.5rem, 0.75rem)
gap-4 gap-x-6       — grid/flex gap
space-y-4           — vertical stack spacing
```

### Typography

```
text-sm font-medium text-(--text-secondary)   — label style
text-2xl font-semibold tracking-tight         — heading style
text-xs text-(--text-muted) uppercase         — overline
truncate                                      — single-line ellipsis
line-clamp-2                                  — 2-line clamp
```

### Interactions

```
hover:bg-primary/10 transition-colors duration-150   — hover
focus-visible:ring-2 focus-visible:ring-primary      — focus ring
active:scale-95 transition-transform                 — press effect
disabled:opacity-50 disabled:cursor-not-allowed      — disabled state
group hover:group-[.hovered]:opacity-100             — group hover
```

### v4 New Utilities

```
rotate-x-6 rotate-y-12 perspective-near    — 3D transforms
@sm:grid-cols-3                            — container query
bg-linear-to-r from-primary to-secondary  — gradient (replaces bg-gradient-to-r)
bg-radial-[circle_at_top]                 — radial gradient
inset-shadow-sm                            — inset shadow
not-sr-only                               — reverse of sr-only
starting:opacity-0 starting:translate-y-2 — @starting-style animations
```
