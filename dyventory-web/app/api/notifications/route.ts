import { NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";

/**
 * GET /api/notifications
 *
 * Proxies to the backend notifications table.
 * Returns the 20 most recent unread alerts for the current user.
 */
export async function GET() {
  try {
    const data = await authFetch<{ data: unknown[] }>("/notifications?per_page=20", {
      cache: "no-store",
    });
    return NextResponse.json(data);
  } catch {
    // Return empty list on auth error — bell should not break the UI
    return NextResponse.json({ data: [] });
  }
}
