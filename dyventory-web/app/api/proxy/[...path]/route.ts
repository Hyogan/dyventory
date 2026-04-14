import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/auth";
import { ApiError } from "@/lib/api";

type Params = { params: Promise<{ path: string[] }> };

async function handler(req: NextRequest, { params }: Params) {
  const { path } = await params;
  const apiPath = "/" + path.join("/");

  const search = req.nextUrl.searchParams.toString();
  const fullPath = search ? `${apiPath}?${search}` : apiPath;

  const options: RequestInit & { cache?: RequestCache } = {
    method: req.method,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) {
      options.body = body;
      options.headers = { "Content-Type": "application/json" };
    }
  }

  try {
    const data = await authFetch<unknown>(fullPath, options);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { message: err.message, errors: err.data?.errors },
        { status: err.status },
      );
    }
    return NextResponse.json({ message: "Internal proxy error" }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
