"use server";

import { revalidateTag } from "next/cache";
import { authFetch } from "@/lib/auth";
import type { Sale, SalePayment, PaginatedResponse, Client, Product, ApiResponse } from "@/types";

// ── Shared state type ─────────────────────────────────────────────────────────

export type SaleFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  saleId?: number;
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getSales(
  params?: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<Sale>> {
  return authFetch<PaginatedResponse<Sale>>("/sales", {
    params,
    next: { tags: ["sales"] },
  });
}

export async function getSale(id: number | string): Promise<Sale> {
  const res = await authFetch<ApiResponse<Sale>>(`/sales/${id}`, {
    next: { tags: ["sales", `sale-${id}`] },
  });
  return res.data;
}

export async function getClients(
  params?: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<Client>> {
  return authFetch<PaginatedResponse<Client>>("/clients", {
    params,
    next: { tags: ["clients"] },
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

// ── Sale mutations ────────────────────────────────────────────────────────────

export interface StoreSaleInput {
  client_id?: number | null;
  payment_method?: string;
  due_date?: string;
  discount_amount?: number;
  notes?: string;
  status: "draft" | "confirmed";
  items: Array<{
    product_id: number;
    variant_id?: number | null;
    quantity: number;
    discount_percent?: number;
  }>;
}

export async function createSale(data: StoreSaleInput): Promise<SaleFormState> {
  try {
    const res = await authFetch<ApiResponse<Sale>>("/sales", {
      method: "POST",
      body: JSON.stringify(data),
    });

    revalidateTag("sales");
    revalidateTag("batches");
    revalidateTag("products");

    return { success: true, saleId: res.data.id };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function confirmSale(saleId: number): Promise<SaleFormState> {
  try {
    await authFetch(`/sales/${saleId}/confirm`, { method: "POST" });

    revalidateTag("sales");
    revalidateTag(`sale-${saleId}`);
    revalidateTag("batches");
    revalidateTag("products");

    return { success: true, saleId };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function cancelSale(saleId: number): Promise<SaleFormState> {
  try {
    await authFetch(`/sales/${saleId}/cancel`, { method: "POST" });

    revalidateTag("sales");
    revalidateTag(`sale-${saleId}`);

    return { success: true, saleId };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function deliverSale(saleId: number): Promise<SaleFormState> {
  try {
    await authFetch(`/sales/${saleId}/deliver`, { method: "POST" });

    revalidateTag("sales");
    revalidateTag(`sale-${saleId}`);

    return { success: true, saleId };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Payment mutations ─────────────────────────────────────────────────────────

export interface RecordPaymentInput {
  amount: number;
  payment_method: string;
  reference?: string;
  notes?: string;
  paid_at?: string;
}

export async function recordPayment(
  saleId: number,
  data: RecordPaymentInput,
): Promise<{ success: boolean; payment?: SalePayment; message?: string; errors?: Record<string, string[]> }> {
  try {
    const res = await authFetch<ApiResponse<SalePayment>>(
      `/sales/${saleId}/payments`,
      { method: "POST", body: JSON.stringify(data) },
    );

    revalidateTag("sales");
    revalidateTag(`sale-${saleId}`);

    return { success: true, payment: res.data };
  } catch (error: unknown) {
    const s = handleError(error);
    return { success: false, message: s.message, errors: s.errors };
  }
}

// ── Return mutations ──────────────────────────────────────────────────────────

export interface ProcessReturnInput {
  reason: string;
  resolution: "refund" | "credit_note" | "exchange";
  refund_amount?: number;
  restock?: boolean;
  notes?: string;
  items: Array<{
    product_id: number;
    quantity: number;
    batch_id?: number | null;
  }>;
}

export async function processReturn(
  saleId: number,
  data: ProcessReturnInput,
): Promise<SaleFormState> {
  try {
    await authFetch(`/sales/${saleId}/returns`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    revalidateTag("sales");
    revalidateTag(`sale-${saleId}`);
    revalidateTag("batches");

    return { success: true, saleId };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function handleError(error: unknown): SaleFormState {
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
