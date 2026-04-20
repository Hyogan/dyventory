"use server";

import { revalidateTag } from "next/cache";
import { authFetch } from "@/lib/auth";
import type { Batch, StockMovement, Product, PaginatedResponse } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type StockFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export type InventorySession = {
  id: number;
  user_id: number;
  status: "in_progress" | "completed" | "cancelled";
  snapshot: Record<string, { batch_id: number; product_id: number; product_name: string; batch_number: string; quantity: number }>;
  counts: Record<string, { batch_id: number; counted_quantity: number }>;
  discrepancies: DiscrepancyItem[] | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DiscrepancyItem = {
  batch_id: number;
  product_id: number;
  product_name: string;
  batch_number: string;
  snapshot_quantity: number;
  counted_quantity: number;
  delta: number;
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getBatches(
  params?: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<Batch>> {
  return authFetch<PaginatedResponse<Batch>>("/batches", {
    params,
    next: { tags: ["batches"] },
  });
}

export async function getBatch(id: number | string): Promise<Batch> {
  const res = await authFetch<{ data: Batch }>(`/batches/${id}`, {
    next: { tags: ["batches", `batch-${id}`] },
  });
  return res.data;
}

export async function getStockMovements(
  params?: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<StockMovement>> {
  return authFetch<PaginatedResponse<StockMovement>>("/stock/movements", {
    params,
    next: { tags: ["movements"] },
  });
}

export async function getProducts(
  params?: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<Product>> {
  return authFetch<PaginatedResponse<Product>>("/products", {
    params,
    next: { tags: ["products"] },
  });
}

export async function getProduct(id: number | string): Promise<Product> {
  const res = await authFetch<{ data: Product }>(`/products/${id}`, {
    next: { tags: ["products", `product-${id}`] },
  });
  return res.data;
}

// ── Batch mutations ───────────────────────────────────────────────────────────

export async function createBatch(
  _prev: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  try {
    const body = formDataToBatchPayload(formData);

    await authFetch("/batches", {
      method: "POST",
      body: JSON.stringify(body),
    });

    revalidateTag("batches", "seconds");
    revalidateTag("products", "seconds");

    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function expireBatch(batchId: number): Promise<StockFormState> {
  try {
    await authFetch(`/batches/${batchId}/expire`, { method: "POST" });
    revalidateTag("batches", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Stock movement mutations ──────────────────────────────────────────────────

export async function recordStockEntry(
  _prev: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  try {
    const body = formDataToMovementPayload(formData);

    await authFetch("/stock/entry", {
      method: "POST",
      body: JSON.stringify(body),
    });

    revalidateTag("batches", "seconds");
    revalidateTag("products", "seconds");
    revalidateTag("movements", "seconds");

    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function recordStockExit(
  _prev: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  try {
    const body = formDataToMovementPayload(formData);

    await authFetch("/stock/exit", {
      method: "POST",
      body: JSON.stringify(body),
    });

    revalidateTag("batches", "seconds");
    revalidateTag("products", "seconds");
    revalidateTag("movements", "seconds");

    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function recordAdjustment(
  _prev: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  try {
    const body = formDataToMovementPayload(formData);

    await authFetch("/stock/adjustment", {
      method: "POST",
      body: JSON.stringify(body),
    });

    revalidateTag("batches", "seconds");
    revalidateTag("products", "seconds");
    revalidateTag("movements", "seconds");

    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Inventory mutations ───────────────────────────────────────────────────────

export async function startInventorySession(): Promise<{ success: boolean; session?: InventorySession; message?: string }> {
  try {
    const res = await authFetch<{ data: InventorySession }>("/stock/inventory/start", {
      method: "POST",
    });
    return { success: true, session: res.data };
  } catch (error: unknown) {
    const err = handleError(error);
    return { success: false, message: err.message };
  }
}

export async function getInventorySession(id: number | string): Promise<InventorySession> {
  const res = await authFetch<{ data: InventorySession }>(`/stock/inventory/${id}`, {
    next: { tags: [`inventory-${id}`] },
  });
  return res.data;
}

export async function submitInventoryCounts(
  sessionId: number,
  counts: { batch_id: number; counted_quantity: number }[],
): Promise<StockFormState> {
  try {
    await authFetch(`/stock/inventory/${sessionId}/counts`, {
      method: "POST",
      body: JSON.stringify({ counts }),
    });
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function getInventoryDiscrepancies(sessionId: number): Promise<DiscrepancyItem[]> {
  const res = await authFetch<{ data: DiscrepancyItem[] }>(
    `/stock/inventory/${sessionId}/discrepancies`,
  );
  return res.data;
}

export async function validateInventorySession(sessionId: number): Promise<StockFormState> {
  try {
    await authFetch(`/stock/inventory/${sessionId}/validate`, { method: "POST" });
    revalidateTag("batches", "seconds");
    revalidateTag("products", "seconds");
    revalidateTag("movements", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function cancelInventorySession(sessionId: number): Promise<StockFormState> {
  try {
    await authFetch(`/stock/inventory/${sessionId}/cancel`, { method: "POST" });
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formDataToBatchPayload(formData: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of ["batch_number", "received_at"]) {
    const v = formData.get(field);
    if (v) payload[field] = v;
  }

  for (const field of ["product_id", "variant_id", "supplier_id"]) {
    const v = formData.get(field);
    if (v) payload[field] = Number(v);
  }

  const qty = formData.get("initial_quantity");
  if (qty) payload["initial_quantity"] = Number(qty);

  const attributesJson = formData.get("attributes");
  if (attributesJson && typeof attributesJson === "string") {
    try {
      payload.attributes = JSON.parse(attributesJson);
    } catch {
      payload.attributes = {};
    }
  }

  return payload;
}

function formDataToMovementPayload(formData: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of ["type", "notes"]) {
    const v = formData.get(field);
    if (v) payload[field] = v;
  }

  for (const field of ["product_id", "variant_id", "batch_id"]) {
    const v = formData.get(field);
    if (v) payload[field] = Number(v);
  }

  const qty = formData.get("quantity");
  if (qty) payload["quantity"] = Number(qty);

  return payload;
}

function handleError(error: unknown): StockFormState {
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
