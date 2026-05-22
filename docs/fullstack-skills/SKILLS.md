---
name: fullstack-laravel-nextjs
description: >
  Expert fullstack skill for building production-grade applications with Laravel 12 (API backend),
  Next.js 15 (App Router frontend), and Tailwind CSS v4. Use this skill whenever the user wants
  to scaffold, build, optimize, debug, or architect any part of a fullstack project using this
  stack — including REST API design, database modeling, React Server Components, UI component
  systems, performance tuning, authentication, and deployment. Trigger this skill for any task
  involving Laravel routes/controllers/models/jobs, Next.js pages/layouts/server actions,
  or Tailwind CSS theming and responsive UI, even if the user only mentions one layer of the stack.
---

# Fullstack Skill — Laravel 12 + Next.js 15 + Tailwind CSS v4

## Quick Reference

| Layer       | Technology             | Version           |
| ----------- | ---------------------- | ----------------- |
| Backend API | Laravel                | ^12.0 (PHP 8.2+)  |
| Frontend    | Next.js + React        | 15.x + React 19   |
| Styling     | Tailwind CSS           | v4.x              |
| DB          | PostgreSQL             | 16+ recommended   |
| Auth        | Laravel Sanctum        | JWT / SPA cookies |
| State       | Zustand or React Query | Latest            |
| Language    | TypeScript             | Strict mode       |

---

## How to Use This Skill

This skill uses **progressive disclosure**. Read this file first, then load only the reference file you need:

- `references/laravel.md` — Routes, controllers, models, Eloquent, jobs, queues, API resources
- `references/nextjs.md` — App Router, RSC, Server Actions, data fetching, routing, caching
- `references/tailwind.md` — v4 config, theming, design tokens, component patterns, responsive
- `references/architecture.md` — Project structure, scalability patterns, API design, auth flow
- `references/ui.md` — Reusable UI component system, design patterns, accessibility

---

## Core Principles (Always Apply)

### 1. Type Everything

- TypeScript strict mode on the frontend — no `any`, no implicit types
- PHP 8.2+ native types and return type declarations on the backend
- Shared types via OpenAPI spec or manually mirrored interfaces

### 2. Server-First

- Default to **React Server Components** in Next.js — only use `'use client'` when interactivity is required
- Default to **server-side data fetching** — no useEffect for initial data loads
- Keep client JavaScript bundles as small as possible

### 3. One Source of Truth

- All business logic lives in the **Laravel backend**
- Frontend is purely for display and user interaction
- Never duplicate validation logic — validate on the server, surface errors to the UI

### 4. Explicit Over Magic

- Prefer explicit Eloquent `with()` for relations (or rely on Laravel 12.8+ auto eager loading)
- Prefer named exports over default exports in Next.js components
- Prefer CSS custom properties over arbitrary Tailwind values

---

## Stack Setup Checklist

### Backend (Laravel 12)

```bash
composer create-project laravel/laravel:^12.0 my-app
cd my-app
composer require laravel/sanctum
php artisan install:api
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

Key `composer.json` constraints:

```json
"php": "^8.2",
"laravel/framework": "^12.0",
"laravel/sanctum": "^4.0"
```

### Frontend (Next.js 15 + Tailwind v4)

```bash
npx create-next-app@latest frontend \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
cd frontend
npm install @tailwindcss/vite
```

`globals.css` — v4 replaces all `@tailwind` directives:

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.55 0.2 250);
  --color-secondary: oklch(0.65 0.15 180);
  --font-sans: "Inter", sans-serif;
  --radius-DEFAULT: 0.5rem;
}
```

---

## Decision Rules

### When to use RSC vs Client Component

```
Needs onClick / onChange / useState / useEffect?  → 'use client'
Fetches data from backend?                        → Server Component
Static/display only?                              → Server Component (default)
Uses browser APIs (localStorage, window)?         → 'use client'
Heavy third-party lib (charts, editors)?          → dynamic() with ssr:false
```

### When to use Server Actions vs API Routes

```
Form submission, mutations from a page?           → Server Actions
Called from a Client Component?                  → Server Actions (with useTransition)
External consumption (mobile app, 3rd party)?    → API Route (Laravel)
File uploads?                                    → Server Action or dedicated endpoint
```

### Laravel: Service vs Controller

```
Simple CRUD, 1 model?                            → Controller method directly
Complex business logic, multi-step?              → Service class + Controller thin
Reused across multiple controllers?              → Service class
Background task?                                 → Job class dispatched from Service
```

---

## Project Structure

### Laravel (Backend)

```
app/
├── Http/
│   ├── Controllers/Api/   ← thin, delegate to Services
│   ├── Requests/          ← Form Requests for validation
│   └── Resources/         ← API Resources for serialization
├── Models/                ← Eloquent models, scopes, casts
├── Services/              ← Business logic
├── Jobs/                  ← Background processing
├── Events/ + Listeners/   ← Decoupled side effects
└── Policies/              ← Authorization per model
routes/
└── api.php                ← versioned: /api/v1/...
```

### Next.js (Frontend)

```
src/
├── app/
│   ├── (auth)/            ← route group, no layout
│   ├── (dashboard)/       ← route group, shared layout
│   │   ├── layout.tsx
│   │   └── [module]/
│   │       ├── page.tsx   ← Server Component
│   │       └── _components/  ← co-located components
│   ├── api/               ← Next.js API routes (minimal)
│   └── layout.tsx
├── components/
│   ├── ui/                ← base components (Button, Input, etc.)
│   └── shared/            ← cross-feature components
├── lib/
│   ├── api.ts             ← fetch wrapper + error handling
│   ├── auth.ts            ← auth helpers
│   └── utils.ts
├── hooks/                 ← custom React hooks (client only)
├── stores/                ← Zustand stores (client only)
└── types/                 ← shared TypeScript interfaces
```

---

## Critical Patterns

### Fetch Wrapper (Next.js → Laravel)

```typescript
// lib/api.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { tags?: string[] } = {},
): Promise<T> {
  const { tags, ...fetchOptions } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...fetchOptions.headers,
    },
    next: tags ? { tags } : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(res.status, error.message ?? "Request failed", error);
  }
  return res.json();
}
```

### Laravel API Resource (Consistent Serialization)

```php
// app/Http/Resources/ProductResource.php
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'category'   => new CategoryResource($this->whenLoaded('category')),
            'attributes' => $this->attributes, // JSONB auto-cast
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
```

### Reusable UI Component Pattern (Tailwind v4)

```tsx
// components/ui/Button.tsx
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-(--color-primary) text-white hover:opacity-90",
  secondary: "bg-secondary/10 text-secondary hover:bg-secondary/20",
  ghost: "bg-transparent hover:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-medium",
        "transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
```

---

## Performance Non-Negotiables

### Next.js

- Always use `<Image>` from `next/image` — never raw `<img>`
- Dynamic import heavy components: `const Chart = dynamic(() => import('./Chart'), { ssr: false })`
- Use `revalidateTag()` to invalidate caches surgically, not broad revalidation
- Wrap slow sections in `<Suspense>` with skeleton fallbacks
- Use `loading.tsx` for route-level skeletons

### Laravel

- Never fetch inside a loop — always `with()` or `withCount()`
- Cache expensive queries: `Cache::remember('key', 3600, fn() => ...)`
- Use jobs for anything that takes > 200ms (PDF generation, emails, etc.)
- Use `cursor()` instead of `get()` for large dataset iteration
- Index foreign keys and frequently filtered columns

---

## Reference Files

Load the appropriate reference file based on the current task:

| Task                                         | File to read                 |
| -------------------------------------------- | ---------------------------- |
| API endpoints, controllers, models, jobs     | `references/laravel.md`      |
| Pages, layouts, data fetching, RSC, routing  | `references/nextjs.md`       |
| Tailwind config, theming, component styles   | `references/tailwind.md`     |
| Auth flow, project architecture, scalability | `references/architecture.md` |
| UI system, design patterns, accessibility    | `references/ui.md`           |
