"use server";

import { revalidateTag } from "next/cache";
import { authFetch } from "@/lib/auth";
import type { User, Setting, VatRate, AuditLog, PaginatedResponse, ApiResponse } from "@/types";

// ── Shared state ──────────────────────────────────────────────────────────────

export type AdminFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

// ── User queries / mutations ──────────────────────────────────────────────────

export async function getUsers(
  params?: Record<string, string | undefined>,
): Promise<PaginatedResponse<User>> {
  return authFetch<PaginatedResponse<User>>("/users", {
    params,
    next: { tags: ["users"] },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
  phone?: string | null;
  is_active?: boolean;
}): Promise<AdminFormState> {
  try {
    await authFetch<ApiResponse<User>>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidateTag("users", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function updateUser(
  id: number,
  data: Partial<{
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    phone: string | null;
    is_active: boolean;
  }>,
): Promise<AdminFormState> {
  try {
    await authFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidateTag("users", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function deleteUser(id: number): Promise<AdminFormState> {
  try {
    await authFetch(`/users/${id}`, { method: "DELETE" });
    revalidateTag("users", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function restoreUser(id: number): Promise<AdminFormState> {
  try {
    await authFetch(`/users/${id}/restore`, { method: "POST" });
    revalidateTag("users", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Record<string, Setting[]>> {
  const res = await authFetch<ApiResponse<Record<string, Setting[]>>>("/settings", {
    next: { tags: ["settings"] },
  });
  return res.data;
}

export async function updateSettings(
  settings: Record<string, string | number | boolean | null>,
): Promise<AdminFormState> {
  try {
    await authFetch("/settings", {
      method: "PUT",
      body: JSON.stringify({ settings }),
    });
    revalidateTag("settings", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── VAT Rates ─────────────────────────────────────────────────────────────────

export async function getVatRates(): Promise<VatRate[]> {
  const res = await authFetch<ApiResponse<VatRate[]>>("/vat-rates", {
    next: { tags: ["vat-rates"] },
  });
  return res.data;
}

export async function createVatRate(data: {
  name: string;
  rate: string | number;
  is_default?: boolean;
  is_active?: boolean;
}): Promise<AdminFormState> {
  try {
    await authFetch<ApiResponse<VatRate>>("/vat-rates", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidateTag("vat-rates", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function updateVatRate(
  id: number,
  data: Partial<{ name: string; rate: string | number; is_default: boolean; is_active: boolean }>,
): Promise<AdminFormState> {
  try {
    await authFetch(`/vat-rates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidateTag("vat-rates", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function deleteVatRate(id: number): Promise<AdminFormState> {
  try {
    await authFetch(`/vat-rates/${id}`, { method: "DELETE" });
    revalidateTag("vat-rates", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export async function getAuditLogs(
  params?: Record<string, string | undefined>,
): Promise<PaginatedResponse<AuditLog>> {
  return authFetch<PaginatedResponse<AuditLog>>("/audit-logs", {
    params,
    next: { revalidate: 0 },
  });
}

// ── Helper ────────────────────────────────────────────────────────────────────

function handleError(error: unknown): AdminFormState {
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
