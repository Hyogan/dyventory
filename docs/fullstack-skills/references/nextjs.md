# Next.js 16 Reference

**Current latest:** 16.2.1 (March 18, 2026)

## Table of Contents

1. [What Changed from 15 → 16](#changes)
2. [App Router & File Conventions](#router)
3. [Server Components & Data Fetching](#rsc)
4. [Cache Components — New Caching Model](#cache)
5. [Client Components](#client)
6. [Server Actions](#actions)
7. [proxy.ts — Replaces middleware.ts](#proxy)
8. [Routing & Navigation](#routing)
9. [React 19.2 Features](#react192)
10. [Performance Patterns](#perf)
11. [TypeScript Patterns](#typescript)
12. [Upgrade Checklist](#upgrade)

---

## What Changed from 15 → 16 {#changes}

| Area                      | Change                                                            | Action Required                                               |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| **Bundler**               | Turbopack is now the **default** — no config needed               | None for new projects; `--webpack` flag to opt out            |
| **Caching model**         | `"use cache"` directive replaces implicit fetch caching           | Opt-in; old model still works via `cacheComponents: false`    |
| **Middleware**            | `middleware.ts` → **`proxy.ts`** (deprecated, not removed)        | Rename file + function; edge runtime stays on `middleware.ts` |
| **Cache APIs**            | `revalidateTag()` updated; `updateTag()` + `refresh()` added      | Add second arg to `revalidateTag()`                           |
| **React**                 | React **19.2** (View Transitions, `useEffectEvent`, `<Activity>`) | Update `react` + `react-dom` packages                         |
| **React Compiler**        | Stable (opt-in, not default)                                      | Add `reactCompiler: true` to `next.config.ts`                 |
| **Node.js**               | Minimum **20.9.0** (Node 18 dropped)                              | Update runtime                                                |
| **TypeScript**            | Minimum **5.1**                                                   | Update `typescript` dep                                       |
| **AMP**                   | Removed entirely                                                  | No replacement — AMP is obsolete                              |
| **`unstable_rootParams`** | Removed                                                           | Wait for replacement API in minor release                     |
| **`experimental.ppr`**    | Removed — replaced by `cacheComponents`                           | Migrate to `"use cache"` directive                            |
| **16.2**                  | ~400% faster `next dev` startup, 50% faster rendering             | None — automatic                                              |

---

## App Router & File Conventions {#router}

```
app/
├── layout.tsx            ← Root layout (html, body)
├── page.tsx              ← Home page (Server Component)
├── loading.tsx           ← Automatic Suspense skeleton
├── error.tsx             ← Error boundary ('use client' required)
├── not-found.tsx         ← 404 handler
├── proxy.ts              ← Network boundary (replaces middleware.ts) ⚠️ NEW
├── (auth)/               ← Route group — no URL segment
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/          ← Route group with shared layout
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   └── products/
│       ├── page.tsx          ← List (Server Component)
│       ├── [id]/page.tsx     ← Detail (Server Component)
│       └── [id]/edit/page.tsx
└── api/
    └── health/route.ts   ← Minimal API routes only
```

---

## Server Components & Data Fetching {#rsc}

### Basic Server Component

```tsx
// app/(dashboard)/products/page.tsx
// No 'use client' — Server Component by default

import { apiFetch } from "@/lib/api";
import { ProductList } from "./_components/ProductList";
import type { PaginatedResponse, Product } from "@/types";

interface PageProps {
  // In Next.js 16, searchParams is still async (same as 15)
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const data = await apiFetch<PaginatedResponse<Product>>(
    `/products?${new URLSearchParams(params as Record<string, string>)}`,
  );
  // Note: No fetch caching options needed here — Next.js 16 is dynamic by default
  // Use "use cache" directive explicitly if you want caching (see Cache section)

  return (
    <div>
      <h1 className="text-2xl font-semibold">Products</h1>
      <ProductList products={data.data} meta={data.meta} />
    </div>
  );
}

export const metadata = {
  title: "Products — Dynventory",
};
```

### Parallel Data Fetching (unchanged — always use)

```tsx
export default async function DashboardPage() {
  const [stats, alerts, recentSales] = await Promise.all([
    apiFetch<DashboardStats>("/dashboard/stats"),
    apiFetch<Alert[]>("/alerts"),
    apiFetch<Sale[]>("/sales?limit=10"),
  ]);

  return (
    <>
      <StatsCards stats={stats} />
      <AlertBanner alerts={alerts} />
      <RecentSalesTable sales={recentSales} />
    </>
  );
}
```

### Streaming with Suspense (unchanged)

```tsx
import { Suspense } from "react";
import { StatsCardsSkeleton } from "@/components/skeletons";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <RecentSalesTable />
      </Suspense>
    </div>
  );
}

async function StatsCards() {
  const stats = await apiFetch<DashboardStats>("/dashboard/stats");
  return <StatsCardsUI stats={stats} />;
}
```

---

## Cache Components — New Caching Model {#cache}

### Overview — The Shift from Next.js 15

In Next.js 15, fetch() was cached by default (you opted out with `cache: 'no-store'`). In Next.js 16, **everything is dynamic by default** — you opt IN to caching with the `"use cache"` directive. This aligns with how developers expect full-stack frameworks to behave.

Enable the new model in `next.config.ts`:

```typescript
const nextConfig = {
  cacheComponents: true, // opt-in to the new caching model
};

export default nextConfig;
```

### `"use cache"` Directive

```tsx
// Cache an entire page
"use cache";

export default async function ProductsPage() {
  const products = await apiFetch("/products");
  return <ProductList products={products} />;
}

// Cache a specific Server Component
async function ExpensiveChart() {
  "use cache";
  const data = await apiFetch("/reports/sales?period=year");
  return <SalesChart data={data} />;
}

// Cache a data-fetching function
async function getDashboardStats() {
  "use cache";
  return apiFetch<DashboardStats>("/dashboard/stats");
}
```

### `cacheLife` — Control Cache Duration

```tsx
import { cacheLife } from "next/cache";

async function StockAlerts() {
  "use cache";
  cacheLife("seconds"); // revalidate very frequently
  return fetchAlerts();
}

async function SalesReport() {
  "use cache";
  cacheLife("hours"); // built-in profile: revalidate hourly
  return fetchReport();
}

async function CategoryList() {
  "use cache";
  cacheLife("days"); // built-in profile: revalidate daily
  return fetchCategories();
}

async function StaticContent() {
  "use cache";
  cacheLife("max"); // built-in profile: cache as long as possible (recommended for most)
  return fetchStaticData();
}

// Custom duration (seconds)
async function ProductDetail({ id }: { id: string }) {
  "use cache";
  cacheLife({ expire: 3600 }); // expire after 1 hour
  return fetchProduct(id);
}
```

### `cacheTag` — Tag Cached Data for Invalidation

```tsx
import { cacheTag } from "next/cache";

async function ProductsSection() {
  "use cache";
  cacheTag("products");
  cacheTag(`products:category:${categoryId}`); // multiple tags allowed
  return apiFetch("/products");
}
```

### Updated Cache Invalidation APIs ⚠️ BREAKING CHANGE

#### `revalidateTag()` — now requires second argument

```tsx
import { revalidateTag } from "next/cache";

// ✅ Next.js 16 — second argument required for SWR behavior
revalidateTag("products", "max"); // use built-in cacheLife profile
revalidateTag("stock-alerts", "hours"); // revalidate with hourly profile
revalidateTag("sales", { expire: 300 }); // inline custom expiry

// ⚠️ Deprecated (still works but shows warning)
revalidateTag("products");
```

#### `updateTag()` — NEW, Server Actions only

```tsx
// Provides read-your-writes semantics — user sees their changes immediately
"use server";
import { updateTag } from "next/cache";

export async function createProduct(data: ProductData) {
  await apiFetch("/products", { method: "POST", body: JSON.stringify(data) });

  // Expire cache AND read fresh data immediately within the same request
  updateTag("products");
  // Unlike revalidateTag(), user sees fresh data right away — no stale period
}
```

#### `refresh()` — NEW, Server Actions only

```tsx
// Refreshes uncached dynamic data WITHOUT touching the cache
"use server";
import { refresh } from "next/cache";

export async function markAlertAsRead(alertId: string) {
  await apiFetch(`/alerts/${alertId}/read`, { method: "PATCH" });

  // Refresh uncached data (like notification count in header)
  // Cached page shells and static content remain fast
  refresh();
}
```

### Decision: Which cache API to use?

```
Static/reference data (categories, VAT rates)?      → 'use cache' + cacheLife('max')
Dashboard stats (5-min freshness ok)?               → 'use cache' + cacheLife({ expire: 300 })
After a mutation, user must see change immediately? → updateTag() in Server Action
After a mutation, eventual consistency is fine?     → revalidateTag('tag', 'max')
Refresh live counters (notifications, alerts)?      → refresh() in Server Action
Always fresh (user-specific, never cache)?          → No 'use cache' directive (default)
```

---

## Client Components {#client}

### When and How (unchanged)

```tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { updateProductStatus } from "./_actions";

export function StatusToggle({ productId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = status === "active" ? "archived" : "active";
    startTransition(async () => {
      await updateProductStatus(productId, next);
      setStatus(next);
    });
  };

  return (
    <Button
      variant={status === "active" ? "primary" : "ghost"}
      loading={isPending}
      onClick={toggle}
    >
      {status === "active" ? "Active" : "Archived"}
    </Button>
  );
}
```

### Dynamic Import (unchanged)

```tsx
import dynamic from "next/dynamic";

const SalesChart = dynamic(() => import("@/components/charts/SalesChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

### View Transitions — React 19.2 ⚠️ NEW

```tsx
"use client";
import { startTransition } from "react";
import { useRouter } from "next/navigation";

// Wrap navigation in startTransition to trigger View Transitions API
export function AnimatedLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        startTransition(() => {
          router.push(href);
        });
      }}
    >
      {children}
    </button>
  );
}
```

### `<Activity>` — React 19.2 ⚠️ NEW

```tsx
// Render "background" UI hidden with display:none — preserves state, cleans up Effects
// Useful for keeping modal state alive while hidden
import { Activity } from "react";

export function ConditionalPanel({ show, children }: Props) {
  return <Activity mode={show ? "visible" : "hidden"}>{children}</Activity>;
}
```

---

## Server Actions {#actions}

### Core Pattern (unchanged from 15)

```tsx
// app/(dashboard)/products/_actions.ts
"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { updateTag } from "next/cache"; // ← use updateTag in 16
import { z } from "zod";

const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1),
  category_id: z.coerce.number().int().positive(),
  price_sell_ttc: z.coerce.number().positive(),
});

export async function createProduct(formData: FormData) {
  const parsed = CreateProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const token = await getAuthToken();

  try {
    await apiFetch("/products", {
      method: "POST",
      body: JSON.stringify(parsed.data),
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return { error: { _form: ["Failed to create product."] } };
  }

  // Next.js 16: use updateTag() for read-your-writes after mutations
  updateTag("products");
  redirect("/products");
}
```

### Server Function Logging (16.2) ⚠️ NEW

```
// Next.js 16.2 automatically logs Server Action executions in dev terminal:
// [Server Action] createProduct
//   Arguments: { name: "T-Shirt", sku: "TS-001", ... }
//   Duration: 142ms
//   Source: app/(dashboard)/products/_actions.ts:12

// No code change needed — this is automatic in development
```

### Form with Server Action (unchanged)

```tsx
"use client";
import { useActionState } from "react";
import { createProduct } from "./_actions";

export function CreateProductForm() {
  const [state, action, isPending] = useActionState(createProduct, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">Product name</label>
        <input name="name" className="input" required />
        {state?.error?.name && (
          <p className="text-red-500 text-sm">{state.error.name[0]}</p>
        )}
      </div>
      <Button type="submit" loading={isPending}>
        Create
      </Button>
    </form>
  );
}
```

---

## proxy.ts — Replaces middleware.ts {#proxy}

### The Change

```
middleware.ts  →  proxy.ts
↓
- Runs on Node.js runtime (NOT edge)
- Clearer naming — it is a network proxy
- middleware.ts still works for edge runtime, but is deprecated
```

### Migration

```typescript
// BEFORE (middleware.ts) — still works but deprecated
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
```

```typescript
// AFTER (proxy.ts) — Next.js 16 preferred
import { NextRequest, NextResponse } from "next/server";

// Only change: rename the function to 'proxy'
export default function proxy(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

// Config option also renamed
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
  // skipProxyUrlNormalize: true  (was: skipMiddlewareUrlNormalize)
};
```

### With next-intl (locale routing + auth combined)

```typescript
// proxy.ts — handles locale routing AND auth protection
import { NextRequest, NextResponse } from "next/server";
import createIntlProxy from "next-intl/proxy"; // next-intl v4+ supports proxy.ts

const intlProxy = createIntlProxy({
  locales: ["en", "fr"],
  defaultLocale: "en",
});

export default function proxy(request: NextRequest) {
  // 1. Let next-intl handle locale routing
  const intlResponse = intlProxy(request);
  if (intlResponse) return intlResponse;

  // 2. Auth protection
  const token = request.cookies.get("auth-token")?.value;
  const pathname = request.nextUrl.pathname;

  // Strip locale prefix for auth check (/en/dashboard → /dashboard)
  const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "") || "/";
  const isDashboard = pathWithoutLocale.startsWith("/dashboard");

  if (isDashboard && !token) {
    const locale = pathname.split("/")[1] || "en";
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## Routing & Navigation {#routing}

### Layout Deduplication (automatic — no code change)

```tsx
// Next.js 16 automatically deduplicates shared layouts when prefetching
// A page with 50 product links now downloads the shared layout ONCE
// not 50 times. Zero code change required.
```

### Incremental Prefetching (automatic)

```tsx
// Next.js 16 only prefetches parts not already in cache
// <Link> now also cancels prefetch requests when link leaves viewport
// and prioritizes on hover — automatic, no code changes
import Link from "next/link";

<Link href="/products/123">Product Name</Link>;
// ↑ Automatically benefits from incremental prefetching
```

### Parallel Routes (unchanged)

```
app/(dashboard)/
├── @stats/
│   └── page.tsx
├── @alerts/
│   └── page.tsx
└── layout.tsx
```

### Intercepting Routes (unchanged)

```
app/(dashboard)/products/
├── page.tsx
├── [id]/page.tsx
└── @modal/
    └── (.)products/[id]/page.tsx
```

---

## React 19.2 Features {#react192}

### View Transitions API

```tsx
// Animate navigation between pages using CSS View Transitions
// Works with startTransition wrapping router calls

// globals.css — define transition animations
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

::view-transition-new(root) {
  animation: slide-in 200ms ease-out;
}
```

### `useEffectEvent` — Extract Non-Reactive Logic

```tsx
"use client";
import { useEffect, useEffectEvent } from "react";

// Logic that should NOT re-trigger the effect when props change
export function AlertPoller({ onAlert, pollingInterval }: Props) {
  // onAlert won't cause the effect to re-run when it changes
  const handleAlert = useEffectEvent(onAlert);

  useEffect(() => {
    const id = setInterval(async () => {
      const alerts = await fetchAlerts();
      if (alerts.length) handleAlert(alerts);
    }, pollingInterval);

    return () => clearInterval(id);
  }, [pollingInterval]); // onAlert intentionally NOT in deps
}
```

### `<Activity>` — Background Rendering

```tsx
import { Activity } from "react";

// Keeps component state alive when hidden — useful for drawer/modal persistence
export function SlidingPanel({ open, children }: Props) {
  return (
    <Activity mode={open ? "visible" : "hidden"}>
      {/* Component stays mounted, state preserved, Effects cleaned up */}
      {children}
    </Activity>
  );
}
```

---

## Performance Patterns {#perf}

### Turbopack — Now Default

```bash
# New projects use Turbopack automatically
npx create-next-app@latest

# Existing project: just upgrade — Turbopack is the default
npm install next@latest

# To opt out and keep Webpack
next dev --webpack
next build --webpack
```

### Turbopack File System Caching (16.1+)

```typescript
// next.config.ts — significantly faster dev restarts on large projects
const nextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
```

### React Compiler (stable, opt-in)

```typescript
// next.config.ts — automatic memoization, zero useMemo/useCallback needed
const nextConfig = {
  reactCompiler: true,
  // Note: increases compile time — evaluate on your project size
};

export default nextConfig;
```

```bash
npm install babel-plugin-react-compiler@latest
```

### Image Optimization (unchanged)

```tsx
import Image from "next/image";

<Image
  src={product.image_url}
  alt={product.name}
  width={400}
  height={300}
  className="rounded object-cover"
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={product.blur_placeholder}
/>;
```

### Bundle Analyzer (16.1+)

```bash
# New built-in analyzer works with Turbopack
ANALYZE=true next build
# Opens interactive UI showing bundle treemap, import chains, large modules
```

---

## TypeScript Patterns {#typescript}

### Shared Types (unchanged)

```typescript
// types/index.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price_sell_ttc: string;
  stock_quantity: number;
  status: "active" | "archived";
  category?: Category;
  attributes?: Record<string, unknown>;
  created_at: string;
}
```

### Typed API Fetch (updated — no caching options by default)

```typescript
// lib/api.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // In Next.js 16, no implicit caching — all requests are dynamic by default
  // Use 'use cache' directive on the calling component/function if caching needed
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(res.status, error.message ?? "Request failed", error);
  }

  return res.json() as Promise<T>;
}
```

### next.config.ts — Full Reference

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Next.js 16 caching model ────────────────────────────────────
  cacheComponents: true, // opt-in to "use cache" directive model

  // ── React Compiler (stable, opt-in) ────────────────────────────
  reactCompiler: true, // automatic memoization

  // ── Turbopack (default in 16 — these are opt-in extras) ────────
  experimental: {
    turbopackFileSystemCacheForDev: true, // faster restarts (16.1+)
  },

  // ── Security headers ────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },

  // ── Image domains (for product photos from API) ─────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.yourdomain.com",
        pathname: "/storage/**",
      },
    ],
  },

  // ── Skip proxy URL normalization if needed ──────────────────────
  // skipProxyUrlNormalize: true,  (renamed from skipMiddlewareUrlNormalize)
};

export default nextConfig;
```

---

## Upgrade Checklist (15 → 16) {#upgrade}

```bash
# 1. Run the automated codemod (handles most breaking changes)
npx @next/codemod@canary upgrade latest

# 2. Manual install if preferred
npm install next@latest react@latest react-dom@latest

# 3. Verify Node.js 20.9+ is installed
node -v

# 4. Check TypeScript is 5.1+
npx tsc --version
```

**Manual review required after codemod:**

```
□ Rename middleware.ts → proxy.ts, rename export to 'proxy'
  (codemod handles this but verify — edge runtime stays on middleware.ts)

□ Update revalidateTag() calls — add second cacheLife argument
  revalidateTag('products')  →  revalidateTag('products', 'max')
  (codemod adds 'max' profile automatically)

□ Decide on cacheComponents: true in next.config.ts
  If yes: add 'use cache' + cacheLife() to components that need caching
  If no:  keep old next: { tags, revalidate } fetch options — still supported

□ Remove experimental.ppr — replaced by cacheComponents
  (codemod removes this automatically)

□ Replace unstable_rootParams usage — no drop-in replacement yet
  (wait for upcoming minor release)

□ Audit AMP usage — removed entirely (unlikely to affect most apps)

□ Update image.localPatterns.search if using local images with query strings
```

**Performance quick wins after upgrading:**

```typescript
// 1. Enable filesystem caching for faster dev restarts
experimental: {
  turbopackFileSystemCacheForDev: true;
}

// 2. Cache expensive RSC data fetches with 'use cache' + cacheLife
// 3. Use updateTag() in Server Actions instead of revalidateTag()
// 4. Use refresh() for non-cached live data (notification counts, etc.)
```
