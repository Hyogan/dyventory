"use server";

import { revalidateTag } from "next/cache";
import { authFetch } from "@/lib/auth";
import type { Product, Category, VatRate, PaginatedResponse } from "@/types";

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getProducts(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<Product>> {
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

export async function getCategories(): Promise<Category[]> {
  const res = await authFetch<{ data: Category[] }>("/categories?tree=1", {
    next: { tags: ["categories"] },
  });
  return res.data;
}

export async function getCategoriesFlat(): Promise<Category[]> {
  const res = await authFetch<{ data: Category[] }>("/categories", {
    next: { tags: ["categories"] },
  });
  return res.data;
}

export async function getVatRates(): Promise<VatRate[]> {
  const res = await authFetch<{ data: VatRate[] }>("/vat-rates", {
    next: { tags: ["vat-rates"] },
  });
  return res.data;
}

// ── Mutations ────────────────────────────────────────────────────────────────

export type ProductFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  productId?: number;
};

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    const body = formDataToProductPayload(formData);

    const res = await authFetch<{ data: Product }>("/products", {
      method: "POST",
      body: JSON.stringify(body),
    });

    revalidateTag("products", "seconds");

    return { success: true, productId: res.data.id };
  } catch (error: unknown) {
    return handleMutationError(error);
  }
}

export async function updateProduct(
  productId: number,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    const body = formDataToProductPayload(formData);

    await authFetch(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    revalidateTag("products", "seconds");
    revalidateTag(`product-${productId}`, "seconds");

    return { success: true, productId };
  } catch (error: unknown) {
    return handleMutationError(error);
  }
}

export async function archiveProduct(productId: number): Promise<ProductFormState> {
  try {
    await authFetch(`/products/${productId}/archive`, { method: "POST" });
    revalidateTag("products", "seconds");
    revalidateTag(`product-${productId}`, "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleMutationError(error);
  }
}

export async function restoreProduct(productId: number): Promise<ProductFormState> {
  try {
    await authFetch(`/products/${productId}/restore`, { method: "POST" });
    revalidateTag("products", "seconds");
    revalidateTag(`product-${productId}`, "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleMutationError(error);
  }
}

export async function deleteProduct(productId: number): Promise<ProductFormState> {
  try {
    await authFetch(`/products/${productId}`, { method: "DELETE" });
    revalidateTag("products", "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleMutationError(error);
  }
}

export async function uploadProductImage(productId: number, formData: FormData): Promise<ProductFormState> {
  try {
    const token = (await import("@/lib/auth")).getAuthToken;
    const tokenValue = await token();

    const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

    const res = await fetch(`${API_BASE}/api/v1/products/${productId}/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenValue}`,
        Accept: "application/json",
      },
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        message: data.message ?? "Upload failed",
        errors: data.errors,
      };
    }

    revalidateTag("products", "seconds");
    revalidateTag(`product-${productId}`, "seconds");
    return { success: true };
  } catch (error: unknown) {
    return handleMutationError(error);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formDataToProductPayload(formData: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Universal fields
  const fields = [
    "name", "sku", "description", "unit_of_measure",
    "barcode", "status",
  ];
  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null && value !== "") {
      payload[field] = value;
    }
  }

  // Numeric fields
  const numericFields = [
    "category_id", "vat_rate_id", "price_buy_ht",
    "price_sell_ttc", "stock_alert_threshold",
  ];
  for (const field of numericFields) {
    const value = formData.get(field);
    if (value !== null && value !== "") {
      payload[field] = Number(value);
    }
  }

  // Boolean
  payload.has_variants = formData.get("has_variants") === "true";

  // Dynamic attributes (JSON string from hidden field)
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

function handleMutationError(error: unknown): ProductFormState {
  if (error && typeof error === "object" && "data" in error) {
    const apiError = error as { status: number; data?: { errors?: Record<string, string[]>; message?: string } };
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
