/**
 * src/types/auth.ts
 *
 * Authentication and session types.
 * AuthUser is the canonical shape returned by GET /auth/me
 * and stored in the session context throughout the app.
 *
 * Import from here for anything auth-related.
 * Import from @/types for domain entities (Product, Sale, etc.)
 */

import type { UserRole } from "@/types";

// ── Authenticated user ────────────────────────────────────────────────────────

/**
 * The authenticated user object — mirrors Laravel's UserResource.
 * Returned by POST /auth/login (inside LoginResponse) and GET /auth/me.
 */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
}

// ── API response shapes ───────────────────────────────────────────────────────

/** Shape of the POST /auth/login response body. */
export interface LoginResponse {
  token: string;
  user: AuthUser;
}

/** Shape of the POST /auth/logout response body (204 = no body). */
export type LogoutResponse = void;

// ── Session context ───────────────────────────────────────────────────────────

/**
 * Value provided by SessionProvider and consumed by useSession().
 * `user` is null only before the provider mounts (never happens in practice
 * because the dashboard layout fetches the user server-side before rendering).
 */
export interface SessionContextValue {
  user: AuthUser | null;
}

// ── Permission helpers ────────────────────────────────────────────────────────

/** Roles that can create and edit products. */
export const PRODUCT_WRITE_ROLES: UserRole[] = ["admin", "manager"];

/** Roles that can record stock movements. */
export const STOCK_WRITE_ROLES: UserRole[] = ["admin", "manager", "warehouse"];

/** Roles that can create sales. */
export const SALES_WRITE_ROLES: UserRole[] = ["admin", "manager", "vendor"];

/** Roles that can access financial reports. */
export const REPORT_ROLES: UserRole[] = ["admin", "manager", "accountant"];

/** Roles that can access the admin panel. */
export const ADMIN_ROLES: UserRole[] = ["admin"];

/**
 * Check if a user has one of the specified roles.
 * Safe to call with a null user — returns false.
 */
export function hasAnyRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if a user has exactly the specified role.
 * Safe to call with a null user — returns false.
 */
export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}
