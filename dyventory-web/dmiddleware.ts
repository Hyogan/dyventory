import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./src/i18n/routing";
// import { AUTH_COOKIE } from "./src/lib/auth";
const AUTH_COOKIE = "";

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication
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
];

// Routes accessible without auth
const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Strip locale prefix to check path intent
  const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "") || "/";

  const isPublicPath = PUBLIC_PATHS.some((p) =>
    pathWithoutLocale.startsWith(p),
  );
  const isProtected = PROTECTED_PREFIXES.some((p) =>
    pathWithoutLocale.startsWith(p),
  );
  const hasAuthToken = request.cookies.has(AUTH_COOKIE);
  const isRootPath = pathWithoutLocale === "/";

  // Redirect root → dashboard or login
  if (isRootPath) {
    const locale =
      request.cookies.get("NEXT_LOCALE")?.value ?? routing.defaultLocale;
    const target = hasAuthToken ? `/${locale}/dashboard` : `/${locale}/login`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Redirect authenticated users away from login/register
  if (isPublicPath && hasAuthToken) {
    const locale =
      request.cookies.get("NEXT_LOCALE")?.value ?? routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !hasAuthToken) {
    const locale =
      request.cookies.get("NEXT_LOCALE")?.value ?? routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Apply next-intl locale middleware for all remaining routes
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|icons|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};

// export const
