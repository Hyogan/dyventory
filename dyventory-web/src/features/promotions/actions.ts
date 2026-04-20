"use server";

import { revalidateTag } from "next/cache";
import { authFetch } from "@/lib/auth";
import type { Promotion, PaginatedResponse, ApiResponse } from "@/types";

export type PromotionFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getPromotions(
  params?: Record<string, string | undefined>,
): Promise<PaginatedResponse<Promotion>> {
  return authFetch<PaginatedResponse<Promotion>>("/promotions", {
    params,
    next: { tags: ["promotions"] },
  });
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const res = await authFetch<{ data: Promotion[] }>("/promotions/active", {
    next: { tags: ["promotions"], revalidate: 60 },
  });
  return res.data;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createPromotion(data: unknown): Promise<PromotionFormState> {
  try {
    await authFetch<ApiResponse<Promotion>>("/promotions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidateTag("promotions", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function updatePromotion(
  id: number,
  data: unknown,
): Promise<PromotionFormState> {
  try {
    await authFetch(`/promotions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidateTag("promotions", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function deletePromotion(id: number): Promise<PromotionFormState> {
  try {
    await authFetch(`/promotions/${id}`, { method: "DELETE" });
    revalidateTag("promotions", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function handleError(error: unknown): PromotionFormState {
  if (error && typeof error === "object" && "data" in error) {
    const e = error as { data?: { errors?: Record<string, string[]>; message?: string } };
    return { success: false, message: e.data?.message, errors: e.data?.errors };
  }
  return {
    success: false,
    message: error instanceof Error ? error.message : "An unexpected error occurred.",
  };
}
