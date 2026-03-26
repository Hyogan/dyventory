/**
 * proxy.ts  (Next.js 16)
 *
 * Renamed from middleware.ts — Next.js 16 convention.
 * See: https://nextjs.org/docs/errors/rename-middleware-to-proxy
 *
 * Combines next-intl locale routing + Sanctum cookie auth guard.
 */
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./src/i18n/routing";
import { AUTH_COOKIE } from "./src/lib/auth";

const intlProxy = createIntlMiddleware(routing);

// Protected path prefixes (without locale segment)
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/products",
  "/stock",
  "/sales",
  "/clients",
  "/suppliers",
  "/reports",
  "/promotions",
  "/admin",
  "/categories",
] as const;

// Public auth pages — redirect away if already logged in
const PUBLIC_AUTH_PATHS = ["/login", "/register"] as const;

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Strip /en or /fr prefix to inspect intent
  const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "") || "/";

  const hasToken = request.cookies.has(AUTH_COOKIE);
  const isRootPath = pathWithoutLocale === "/";
  const isPublic = PUBLIC_AUTH_PATHS.some((p) =>
    pathWithoutLocale.startsWith(p),
  );
  const isProtected = PROTECTED_PREFIXES.some((p) =>
    pathWithoutLocale.startsWith(p),
  );
  const locale =
    request.cookies.get("NEXT_LOCALE")?.value ?? routing.defaultLocale;

  // Root → dashboard or login
  if (isRootPath) {
    const dest = hasToken ? `/${locale}/dashboard` : `/${locale}/login`;
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Already logged-in → away from auth pages
  if (isPublic && hasToken) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Not logged-in → away from protected routes, preserve redirect target
  if (isProtected && !hasToken) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Delegate locale detection + locale-prefixed redirects to next-intl
  return intlProxy(request) as NextResponse;
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static assets
    "/((?!_next/static|_next/image|_next/data|favicon\\.ico|icons|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)).*)",
  ],
};
