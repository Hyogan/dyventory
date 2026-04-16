"use server";

import { revalidateTag } from "next/cache";
import { authFetch } from "@/lib/auth";
import type {
  Supplier,
  SupplierSummary,
  SupplierOrder,
  SupplierOrderItem,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

// ── Shared state ──────────────────────────────────────────────────────────────

export type SupplierFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  supplierId?: number;
};

export type OrderFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  orderId?: number;
};

// ── Supplier queries ──────────────────────────────────────────────────────────

export async function getSuppliers(
  params?: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<Supplier>> {
  return authFetch<PaginatedResponse<Supplier>>("/suppliers", {
    params,
    next: { tags: ["suppliers"] },
  });
}

export async function getSupplier(id: number | string): Promise<Supplier> {
  const res = await authFetch<ApiResponse<Supplier>>(`/suppliers/${id}`, {
    next: { tags: ["suppliers", `supplier-${id}`] },
  });
  return res.data;
}

export async function getSupplierSummary(id: number | string): Promise<SupplierSummary> {
  const res = await authFetch<ApiResponse<SupplierSummary>>(`/suppliers/${id}/summary`, {
    next: { tags: [`supplier-${id}`] },
  });
  return res.data;
}

export async function getSupplierOrders(
  supplierId: number | string,
  params?: Record<string, string | undefined>,
): Promise<PaginatedResponse<SupplierOrder>> {
  return authFetch<PaginatedResponse<SupplierOrder>>(
    `/suppliers/${supplierId}/orders`,
    { params, next: { tags: [`supplier-${supplierId}`, "orders"] } },
  );
}

export async function getOrder(orderId: number | string): Promise<SupplierOrder> {
  const res = await authFetch<ApiResponse<SupplierOrder>>(
    `/supplier-orders/${orderId}`,
    { next: { tags: ["orders", `order-${orderId}`] } },
  );
  return res.data;
}

// ── Supplier mutations ────────────────────────────────────────────────────────

export async function createSupplier(data: Partial<Supplier>): Promise<SupplierFormState> {
  try {
    const res = await authFetch<ApiResponse<Supplier>>("/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidateTag("suppliers");
    return { success: true, supplierId: res.data.id };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function updateSupplier(
  id: number,
  data: Partial<Supplier>,
): Promise<SupplierFormState> {
  try {
    await authFetch(`/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidateTag("suppliers");
    revalidateTag(`supplier-${id}`);
    return { success: true, supplierId: id };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function deleteSupplier(id: number): Promise<SupplierFormState> {
  try {
    await authFetch(`/suppliers/${id}`, { method: "DELETE" });
    revalidateTag("suppliers");
    return { success: true };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Order mutations ───────────────────────────────────────────────────────────

export interface CreateOrderInput {
  expected_at?: string;
  notes?: string;
  items: Array<{
    product_id: number;
    variant_id?: number | null;
    quantity_ordered: number;
    unit_price_ht: number;
  }>;
}

export async function createOrder(
  supplierId: number,
  data: CreateOrderInput,
): Promise<OrderFormState> {
  try {
    const res = await authFetch<ApiResponse<SupplierOrder>>(
      `/suppliers/${supplierId}/orders`,
      { method: "POST", body: JSON.stringify(data) },
    );
    revalidateTag("orders");
    revalidateTag(`supplier-${supplierId}`);
    return { success: true, orderId: res.data.id };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function sendOrder(orderId: number): Promise<OrderFormState> {
  try {
    await authFetch(`/supplier-orders/${orderId}/send`, { method: "POST" });
    revalidateTag("orders");
    revalidateTag(`order-${orderId}`);
    return { success: true, orderId };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function confirmOrder(orderId: number): Promise<OrderFormState> {
  try {
    await authFetch(`/supplier-orders/${orderId}/confirm`, { method: "POST" });
    revalidateTag("orders");
    revalidateTag(`order-${orderId}`);
    return { success: true, orderId };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function cancelOrder(orderId: number): Promise<OrderFormState> {
  try {
    await authFetch(`/supplier-orders/${orderId}/cancel`, { method: "POST" });
    revalidateTag("orders");
    revalidateTag(`order-${orderId}`);
    return { success: true, orderId };
  } catch (error: unknown) {
    return handleError(error);
  }
}

export interface ReceiveOrderInput {
  items: Array<{
    order_item_id: number;
    quantity_received: number;
    batch_number?: string;
    expiry_date?: string;
  }>;
  notes?: string;
}

export async function receiveOrder(
  orderId: number,
  data: ReceiveOrderInput,
): Promise<OrderFormState> {
  try {
    await authFetch(`/supplier-orders/${orderId}/receive`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidateTag("orders");
    revalidateTag(`order-${orderId}`);
    revalidateTag("batches");
    revalidateTag("products");
    return { success: true, orderId };
  } catch (error: unknown) {
    return handleError(error);
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function handleError(error: unknown): SupplierFormState & OrderFormState {
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
