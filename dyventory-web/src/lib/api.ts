/**
 * src/lib/api.ts
 *
 * Central API client for Next.js 16.
 * - Fully compatible with Server Components & Server Actions
 * - Passes through Next.js fetch options (revalidate, tags, etc.)
 * - Works with authFetch wrapper
 */

export type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;

  /**
   * Next.js 16 fetch extensions
   */
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };

  /**
   * Shortcut (legacy style still used in your code)
   */
  revalidate?: number | false;
  tags?: string[];
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function buildUrl(path: string, params?: FetchOptions["params"]) {
  const base = process.env.NEXT_PUBLIC_API_URL;

  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }

  const url = new URL(`/api/v1${path}`, base);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    }
  }

  return url.toString();
}

// ── Core fetch ──────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, headers, next, revalidate, tags, ...rest } = options;

  const url = buildUrl(path, params);

  const res = await fetch(url, {
    ...rest,

    /**
     * Next.js 16 options passthrough
     */
    next: next ?? {
      revalidate,
      tags,
    },
    // next: next ?? (revalidate !== undefined || tags ? { revalidate, tags } : undefined)

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
  });

  let data: unknown = null;

  try {
    data = await res.json();
  } catch {
    // API might return empty body
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as any)?.message ?? "Request failed",
      data,
    );
  }

  return data as T;
}
