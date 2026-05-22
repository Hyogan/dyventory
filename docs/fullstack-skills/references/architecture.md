# Architecture & Auth Reference

## Table of Contents

1. [Auth Flow (Sanctum + Next.js)](#auth)
2. [API Versioning & Design](#api)
3. [Error Handling](#errors)
4. [Scalability Patterns](#scalability)
5. [Environment Configuration](#env)

---

## Auth Flow (Sanctum + Next.js) {#auth}

### Flow Overview

```
1. User submits login form (Next.js Client Component)
2. Server Action calls Laravel POST /api/v1/auth/login
3. Laravel validates, returns { token, user }
4. Server Action stores token in httpOnly cookie (secure)
5. Middleware reads cookie to protect routes
6. API calls include token from cookie (server-side) or header (client-side)
```

### Server Action — Login

```typescript
// app/(auth)/login/_actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { token, user } = await apiFetch<{ token: string; user: User }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );

    // Store in httpOnly cookie — never exposed to JS
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  } catch (e) {
    return { error: "Email ou mot de passe invalide." };
  }

  redirect("/dashboard");
}
```

### Auth helpers

```typescript
// lib/auth.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

// React cache() deduplicates across the same request
export const getAuthToken = cache(async (): Promise<string> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) redirect("/login");
  return token;
});

export const getCurrentUser = cache(async (): Promise<User> => {
  const token = await getAuthToken();
  return apiFetch<User>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
});
```

### Authenticated fetch wrapper

```typescript
// lib/api-auth.ts
import { getAuthToken } from "./auth";
import { apiFetch } from "./api";

export async function authFetch<T>(
  path: string,
  options: RequestInit & {
    tags?: string[];
  } = {},
): Promise<T> {
  const token = await getAuthToken();
  return apiFetch<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}
```

---

## API Versioning & Design {#api}

### Versioning Strategy

```php
// routes/api.php
Route::prefix('v1')->name('api.v1.')->group(function () {
    require __DIR__ . '/api/v1/auth.php';
    require __DIR__ . '/api/v1/products.php';
    require __DIR__ . '/api/v1/sales.php';
});

// Future version
Route::prefix('v2')->name('api.v2.')->group(function () {
    require __DIR__ . '/api/v2/products.php'; // Extended version
});
```

### Consistent JSON Response Structure

```php
// Always return consistent envelope
{
  "data": { ... } | [ ... ],   // Main payload
  "meta": { ... },              // Pagination, filters
  "message": "...",             // Human-readable (optional)
}

// Errors
{
  "message": "Validation failed.",
  "errors": {
    "email": ["L'email est requis."],
    "sku": ["Ce SKU existe déjà."]
  }
}
```

### Global Exception Handler

```php
// app/Exceptions/Handler.php (Laravel 12 — bootstrap/app.php)
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (ValidationException $e, Request $request) {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        }
    });

    $exceptions->render(function (ModelNotFoundException $e, Request $request) {
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Ressource introuvable.'], 404);
        }
    });

    $exceptions->render(function (AuthorizationException $e, Request $request) {
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }
    });
})
```

---

## Error Handling {#errors}

### Frontend — Error Boundary

```tsx
// app/(dashboard)/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-96 gap-4">
      <h2 className="text-xl font-semibold">Une erreur est survenue</h2>
      <p className="text-(--text-muted) text-sm">{error.message}</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
```

### Frontend — API Error class

```typescript
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: { errors?: Record<string, string[]> },
  ) {
    super(message);
    this.name = "ApiError";
  }

  get validationErrors() {
    return this.data?.errors ?? {};
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isValidation() {
    return this.status === 422;
  }
}
```

---

## Scalability Patterns {#scalability}

### Repository Pattern (Optional, for complex queries)

```php
// app/Repositories/ProductRepository.php
class ProductRepository
{
    public function findWithFilters(array $filters, int $perPage): LengthAwarePaginator
    {
        return Product::query()
            ->with(['category', 'variants'])
            ->when($filters['status'] ?? null, fn($q, $s) => $q->where('status', $s))
            ->when($filters['category_id'] ?? null, fn($q, $id) => $q->inCategory($id))
            ->when($filters['search'] ?? null, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('name', 'ilike', "%{$s}%")
                      ->orWhere('sku', 'ilike', "%{$s}%")
                )
            )
            ->when($filters['low_stock'] ?? false, fn($q) => $q->lowStock())
            ->orderBy($filters['sort_by'] ?? 'created_at', $filters['sort_dir'] ?? 'desc')
            ->paginate($perPage);
    }
}
```

### Action Classes (single-responsibility)

```php
// app/Actions/Sale/ConfirmSale.php
class ConfirmSale
{
    public function execute(Sale $sale): Sale
    {
        return DB::transaction(function () use ($sale) {
            $sale->update(['status' => SaleStatus::Confirmed]);
            event(new SaleConfirmed($sale));
            return $sale->fresh();
        });
    }
}

// Usage in controller
class SaleController extends Controller
{
    public function confirm(Sale $sale, ConfirmSale $action): SaleResource
    {
        $this->authorize('confirm', $sale);
        return new SaleResource($action->execute($sale));
    }
}
```

### Zustand Store (frontend state)

```typescript
// stores/useProductStore.ts
import { create } from "zustand";

interface ProductFilters {
  search: string;
  category_id: number | null;
  status: string;
  page: number;
}

interface ProductStore {
  filters: ProductFilters;
  setFilter: <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) => void;
  resetFilters: () => void;
}

const defaults: ProductFilters = {
  search: "",
  category_id: null,
  status: "active",
  page: 1,
};

export const useProductStore = create<ProductStore>((set) => ({
  filters: defaults,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value, page: 1 } })),
  resetFilters: () => set({ filters: defaults }),
}));
```

---

## Environment Configuration {#env}

### Laravel (.env)

```env
APP_NAME="Stock Manager"
APP_ENV=production
APP_URL=https://api.yourdomain.com

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=stock_manager
DB_USERNAME=postgres
DB_PASSWORD=secret

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

SANCTUM_STATEFUL_DOMAINS=yourdomain.com,localhost:3000

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Next.js (.env.local)

```env
# Server-side only (no NEXT_PUBLIC_ prefix)
API_INTERNAL_URL=http://localhost:8000   # Internal Docker network URL

# Client-side accessible
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME="Stock Manager"
```

### Config validation (Next.js)

```typescript
// lib/config.ts — fail fast on missing env vars
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  apiUrl: requireEnv("NEXT_PUBLIC_API_URL"),
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "App",
} as const;
```
