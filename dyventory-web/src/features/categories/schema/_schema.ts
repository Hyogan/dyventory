"use server";

import { authFetch } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { revalidateTag } from "next/cache";
import type { FieldDefinition } from "@/types/field-schema";
import type { Category } from "@/types";

export interface SchemaActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Replace the field schema for a category.
 * Field keys that already exist on the server are immutable — the API
 * enforces this and returns a 422 if any are removed.
 */
export async function updateCategorySchema(
  categoryId: number,
  schema: FieldDefinition[],
): Promise<SchemaActionResult> {
  try {
    await authFetch<{ data: Category }>(`/categories/${categoryId}/schema`, {
      method: "PUT",
      body: JSON.stringify({ schema }),
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
