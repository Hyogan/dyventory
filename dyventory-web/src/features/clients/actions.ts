"use server";

import { revalidateTag } from "next/cache";
import { authFetch } from "@/lib/auth";
import type { Client, ClientSummary, PaginatedResponse, ApiResponse } from "@/types";

// ── Shared state type ─────────────────────────────────────────────────────────

export type ClientFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  clientId?: number;
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getClients(
  params?: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<Client>> {
  return authFetch<PaginatedResponse<Client>>("/clients", {
    params,
    next: { tags: ["clients"] },
  });
}

export async function getClient(id: number | string): Promise<Client> {
  const res = await authFetch<ApiResponse<Client>>(`/clients/${id}`, {
    next: { tags: ["clients", `client-${id}`] },
  });
  return res.data;
}

export async function getClientSummary(id: number | string): Promise<ClientSummary> {
  const res = await authFetch<ApiResponse<ClientSummary>>(`/clients/${id}/summary`, {
    next: { tags: [`client-${id}`] },
  });
  return res.data;
}

export async function searchClients(query: string): Promise<Client[]> {
  const res = await authFetch<ApiResponse<Client[]>>("/clients/search", {
    params: { q: query },
    next: { revalidate: 0 },
  });
  return res.data;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createClient(data: Partial<Client>): Promise<ClientFormState> {
  try {
    const res = await authFetch<ApiResponse<Client>>("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidateTag("clients");
    return { success: true, clientId: res.data.id };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function updateClient(
  id: number,
  data: Partial<Client>,
): Promise<ClientFormState> {
  try {
    await authFetch(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidateTag("clients");
    revalidateTag(`client-${id}`);
    return { success: true, clientId: id };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function deleteClient(id: number): Promise<ClientFormState> {
  try {
    await authFetch(`/clients/${id}`, { method: "DELETE" });
    revalidateTag("clients");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function handleError(error: unknown): ClientFormState {
  if (error && typeof error === "object" && "data" in error) {
    const apiError = error as {
      status: number;
      data?: { errors?: Record<string, string[]>; message?: string };
    };
    return {
      success: false,
      message: apiError.data?.message ?? "An error occurred.",
      errors: apiError.data?.errors,
    };
  }
  return {
    success: false,
    message: error instanceof Error ? error.message : "An unexpected error occurred.",
  };
}
