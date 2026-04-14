import { NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";

export async function POST() {
  try {
    await authFetch("/notifications/read-all", { method: "POST" });
  } catch {
    // ignore
  }
  return NextResponse.json({ success: true });
}
