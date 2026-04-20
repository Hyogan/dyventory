/**
 * Shared proxy helper for export route handlers.
 * Reads the Sanctum token from the httpOnly cookie and proxies the
 * request to the Laravel backend, streaming the file back to the browser.
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

const API_BASE =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function proxyExport(
  request: NextRequest,
  laravelPath: string,
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward all query parameters to the Laravel endpoint
  const qs      = request.nextUrl.searchParams.toString();
  const url     = `${API_BASE}/api/v1${laravelPath}${qs ? `?${qs}` : ""}`;

  const upstream = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
    },
    // Do not cache the export response
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Export failed" },
      { status: upstream.status },
    );
  }

  // Pass through content-type and content-disposition from Laravel
  const headers = new Headers();
  const contentType        = upstream.headers.get("Content-Type");
  const contentDisposition = upstream.headers.get("Content-Disposition");
  if (contentType)        headers.set("Content-Type", contentType);
  if (contentDisposition) headers.set("Content-Disposition", contentDisposition);

  return new NextResponse(upstream.body, { status: 200, headers });
}
