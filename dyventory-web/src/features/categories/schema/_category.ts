"use server";

import { authFetch } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { revalidateTag } from "next/cache";
import type { Category } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CategoryPayload {
  name: string;
  parent_id?: number | null;
  description?: string | null;
  is_active?: boolean;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createCategory(
  payload: CategoryPayload,
): Promise<ActionResult> {
  try {
    await authFetch<{ data: Category }>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    revalidateTag("categories", "seconds");
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.isValidation) {
        return { ok: false, fieldErrors: err.validationErrors };
      }
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "An unexpected error occurred." };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateCategory(
  id: number,
  payload: CategoryPayload,
): Promise<ActionResult> {
  try {
    await authFetch<{ data: Category }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    revalidateTag("categories", "seconds");
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.isValidation) {
        return { ok: false, fieldErrors: err.validationErrors };
      }
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "An unexpected error occurred." };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteCategory(id: number): Promise<ActionResult> {
  try {
    await authFetch(`/categories/${id}`, { method: "DELETE" });

    revalidateTag("categories", "seconds");
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "An unexpected error occurred." };
  }
}
