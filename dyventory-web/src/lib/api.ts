/**
 * src/lib/api.ts
 *
 * Central API client for Next.js 16.
 * - Fully compatible with Server Components & Server Actions
 * - Passes through Next.js fetch options (revalidate, tags, etc.)
 * - Works with authFetch wrapper
 */

// const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// Server-side uses the internal Docker URL, browser uses the public URL

const API_BASE =
  typeof window === "undefined"
    ? (process.env.API_INTERNAL_URL ?? "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: {
      errors?: Record<string, string[]>;
      message?: string;
    },
  ) {
    super(message);
    this.name = "ApiError";
  }

  get validationErrors(): Record<string, string[]> {
    return this.data?.errors ?? {};
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidation(): boolean {
    return this.status === 422;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

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

// export class ApiError extends Error {
//   constructor(
//     public status: number,
//     message: string,
//     public data?: unknown,
//   ) {
//     super(message);
//     this.name = "ApiError";
//   }
// }

// ── Helpers ─────────────────────────────────────────────────────

function buildUrl(path: string, params?: FetchOptions["params"]) {
  const base = API_BASE;
  //   console.log(base);
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
    const errorData = data as { message?: string; errors?: Record<string, string[]> } | null;
    throw new ApiError(
      res.status,
      errorData?.message ?? `Request failed with status ${res.status}`,
      errorData ?? undefined,
    );
  }
  return data as T;
}
