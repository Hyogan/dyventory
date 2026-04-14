/**
 * src/lib/client-auth.ts
 *
 * Client-side authenticated fetch — safe to use in "use client" components.
 *
 * Proxies requests through /api/proxy/... (a Next.js Route Handler) so the
 * auth token is read server-side from the httpOnly cookie and never exposed
 * to the browser.
 */

export class ClientApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

export async function clientAuthFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // empty body (e.g. 204 No Content)
  }

  if (!res.ok) {
    const body = data as { message?: string; errors?: Record<string, string[]> } | null;
    throw new ClientApiError(
      res.status,
      body?.message ?? `Request failed with status ${res.status}`,
      body?.errors,
    );
  }

  return data as T;
}
