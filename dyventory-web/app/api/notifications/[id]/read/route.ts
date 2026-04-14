import { NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await authFetch(`/notifications/${id}/read`, { method: "POST" });
  } catch {
    // ignore
  }
  return NextResponse.json({ success: true });
}
