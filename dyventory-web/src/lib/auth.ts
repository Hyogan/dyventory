/**
 * src/lib/auth.ts
 *
 * Server-side auth helpers — ONLY usable in Server Components,
 * Server Actions, and Route Handlers (they call next/headers).
 *
 * For client-side auth state use: hooks/useSession.ts
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiFetch, type FetchOptions } from "./api";
import type { AuthUser } from "@/types/auth";
import { routing } from "@/i18n/routing";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Name of the httpOnly cookie that stores the Sanctum token. */
export const AUTH_COOKIE = "dyventory-auth-token-cookie" as const;
// export const AUTH_COOKIE = "auth-token" as const;
export const COOKIE_NAME = "dyventory-auth-token";
/** Default locale used in redirect paths when no locale is resolved. */
export const DEFAULT_LOCALE = routing.defaultLocale;

// ── Token ─────────────────────────────────────────────────────────────────────

/**
 * Read the raw auth token from the httpOnly cookie.
 *
 * - React `cache()` deduplicates repeated calls within a single request.
 * - Redirects to /[locale]/login automatically if the cookie is missing.
 * - Never exposes the token to client-side JS (cookie is httpOnly).
 */
export const getAuthToken = cache(async (): Promise<string> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    // Determine locale from cookie (set by next-intl proxy) or fall back to default
    const localeCookie =
      cookieStore.get("NEXT_LOCALE")?.value ?? DEFAULT_LOCALE;
    redirect(`/${localeCookie}/login`);
  }

  return token;
});

// ── Current user ──────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated user from GET /auth/me.
 *
 * - React `cache()` ensures this runs at most once per request, even if
 *   called from multiple Server Components on the same page.
 * - Uses `cache: 'no-store'` so the user profile is always fresh.
 * - Throws (and redirects to login) if the token is missing or invalid.
 *
 * Usage in Server Components:
 *   const user = await getCurrentUser();
 *
 * Usage in Dashboard layout (passed down as a prop to SessionProvider):
 *   <SessionProvider user={user}>...</SessionProvider>
 */
// export const getCurrentUser = cache(async (): Promise<AuthUser> => {
//   const token = await getAuthToken();

//   return apiFetch<AuthUser>("/auth/me", {
//     method: "GET",
//     headers: { Authorization: `Bearer ${token}` },
//     // Always fetch fresh — never cache the user object at CDN/ISR level
//     // revalidate: false,
//   });
// });
export const getCurrentUser = cache(async (): Promise<AuthUser> => {
  const token = await getAuthToken();

  const res = await apiFetch<{ data: { user: AuthUser } }>("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data.user; // ✅ THIS is the fix
});

// ── Authenticated fetch ───────────────────────────────────────────────────────

/**
 * Drop-in replacement for `apiFetch` that automatically attaches
 * the `Authorization: Bearer <token>` header.
 *
 * Use this in Server Components and Server Actions for any authenticated
 * API call, instead of manually reading the token each time.
 *
 * @example
 *   const products = await authFetch<PaginatedResponse<Product>>(
 *     '/products?status=active',
 *     { tags: ['products'] }
 *   );
 */
export async function authFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const token = await getAuthToken();

  return apiFetch<T>(path, {
    ...options,
    headers: {
      // Allow callers to add extra headers without clobbering Authorization
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

// ── Cookie helpers (for use in Server Actions) ────────────────────────────────

/**
 * Store the auth token in an httpOnly cookie after login.
 * Call this from your login Server Action after a successful API response.
 *
 * @example
 *   const { token } = await apiFetch<LoginResponse>('/auth/login', {...});
 *   await setAuthCookie(token);
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Delete the auth cookie on logout.
 * Call this from your logout Server Action.
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}
/**
 * AuthUser represents the currently logged-in user.
 * Used in the SessionProvider and auth hooks.
 */
// export interface AuthUser {
//   id: number;
//   name: string;
//   email: string;
//   role: UserRole;
//   phone?: string | null;
//   is_active: boolean;
// }
// // const AUTH_COOKIE = '';
// export const AUTH_COOKIE = "";
