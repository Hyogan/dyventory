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
import { apiFetch, ApiError, type FetchOptions } from "./api";
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

// ── Authenticated fetch ───────────────────────────────────────────────────────

/**
 * Drop-in replacement for `apiFetch` that automatically attaches
 * the `Authorization: Bearer <token>` header.
 *
 * Handles both "cookie missing" (via getAuthToken redirect) and
 * "token expired/revoked" (catches 401, clears cookie, redirects to login).
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

  try {
    return await apiFetch<T>(path, {
      ...options,
      headers: {
        // Allow callers to add extra headers without clobbering Authorization
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    // If the token is expired or revoked server-side, the API returns 401.
    // getAuthToken() only catches the "cookie missing" case — handle the
    // "token invalid" case here by clearing the stale cookie and redirecting.
    if (err instanceof ApiError && err.isUnauthorized) {
      await clearAuthCookie();
      const cookieStore = await cookies();
      const locale = cookieStore.get("NEXT_LOCALE")?.value ?? DEFAULT_LOCALE;
      redirect(`/${locale}/login`);
    }
    throw err;
  }
}

// ── Current user ──────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated user from GET /auth/me.
 *
 * - React `cache()` ensures this runs at most once per request, even if
 *   called from multiple Server Components on the same page.
 * - Throws (and redirects to login) if the token is missing or invalid.
 *
 * Usage in Server Components:
 *   const user = await getCurrentUser();
 *
 * Usage in Dashboard layout (passed down as a prop to SessionProvider):
 *   <SessionProvider user={user}>...</SessionProvider>
 */
export const getCurrentUser = cache(async (): Promise<AuthUser> => {
  const res = await authFetch<{ data: { user: AuthUser } }>("/auth/me", {
    method: "GET",
  });

  return res.data.user;
});

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
