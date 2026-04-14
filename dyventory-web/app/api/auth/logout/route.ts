import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authFetch } from "@/lib/auth";

export async function POST() {
  // Notify backend
  try {
    await authFetch("/auth/logout", { method: "POST" });
  } catch {
    // ignore — we still clear the cookie
  }

  // Clear auth cookie
  const cookieStore = await cookies();
  cookieStore.delete("dyventory-auth-token-cookie");

  return NextResponse.json({ success: true });
}
