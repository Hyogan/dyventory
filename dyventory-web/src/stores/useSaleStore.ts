import { create } from "zustand";
import type { Product } from "@/types";

// ── Cart item ─────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  variant_id: number | null;
  quantity: number; // decimal for kg products
  discount_percent: number;
}

// Derived — computed from CartItem fields
export function computeLineTotal(item: CartItem): {
  unit_price_ttc: number;
  line_total_ttc: number;
} {
  const unitPriceTtc = parseFloat(item.product.price_sell_ttc);
  const lineTtcBeforeDiscount = unitPriceTtc * item.quantity;
  const lineTotalTtc =
    lineTtcBeforeDiscount * (1 - item.discount_percent / 100);
  return {
    unit_price_ttc: unitPriceTtc,
    line_total_ttc: Math.round(lineTotalTtc * 100) / 100,
  };
}

// ── Store types ───────────────────────────────────────────────────────────────

export type PaymentMethod =
  | "cash"
  | "mobile_money"
  | "bank_transfer"
  | "credit";
export type SaleDraftStatus = "draft" | "confirmed";

interface SaleStore {
  // Cart
  items: CartItem[];

  // Sale metadata
  clientId: number | null;
  paymentMethod: PaymentMethod;
  dueDate: string;
  globalDiscount: number;
  notes: string;

  // Actions
  addItem: (product: Product, variantId?: number | null) => void;
  updateQuantity: (
    productId: number,
    variantId: number | null,
    qty: number,
  ) => void;
  updateDiscount: (
    productId: number,
    variantId: number | null,
    discountPct: number,
  ) => void;
  removeItem: (productId: number, variantId: number | null) => void;
  clearCart: () => void;
  setClientId: (id: number | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setDueDate: (date: string) => void;
  setGlobalDiscount: (amount: number) => void;
  setNotes: (notes: string) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSaleStore = create<SaleStore>((set, get) => ({
  items: [],
  clientId: null,
  paymentMethod: "cash",
  dueDate: "",
  globalDiscount: 0,
  notes: "",

  addItem(product, variantId = null) {
    set((state) => {
      const existing = state.items.find(
        (i) => i.product.id === product.id && i.variant_id === variantId,
      );
      if (existing) {
        // Increment quantity
        return {
          items: state.items.map((i) =>
            i.product.id === product.id && i.variant_id === variantId
              ? { ...i, quantity: Math.round((i.quantity + 1) * 1000) / 1000 }
              : i,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          { product, variant_id: variantId, quantity: 1, discount_percent: 0 },
        ],
      };
    });
  },

  updateQuantity(productId, variantId, qty) {
    if (qty <= 0) {
      get().removeItem(productId, variantId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId && i.variant_id === variantId
          ? { ...i, quantity: qty }
          : i,
      ),
    }));
  },

  updateDiscount(productId, variantId, discountPct) {
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId && i.variant_id === variantId
          ? { ...i, discount_percent: Math.max(0, Math.min(100, discountPct)) }
          : i,
      ),
    }));
  },

  removeItem(productId, variantId) {
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.product.id === productId && i.variant_id === variantId),
      ),
    }));
  },

  clearCart() {
    set({
      items: [],
      clientId: null,
      paymentMethod: "cash",
      dueDate: "",
      globalDiscount: 0,
      notes: "",
    });
  },

  setClientId: (id) => set({ clientId: id }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setDueDate: (date) => set({ dueDate: date }),
  setGlobalDiscount: (amount) => set({ globalDiscount: Math.max(0, amount) }),
  setNotes: (notes) => set({ notes }),
}));

// ── Selectors (use outside the store) ────────────────────────────────────────

export function selectCartTotals(items: CartItem[], globalDiscount: number) {
  const rawSubtotalTtc = items.reduce((sum, item) => {
    return sum + computeLineTotal(item).line_total_ttc;
  }, 0);

  const finalTtc = Math.max(0, rawSubtotalTtc - globalDiscount);
  // Rough VAT back-calculation (assumes single rate — display only)
  return {
    rawTtc: Math.round(rawSubtotalTtc * 100) / 100,
    discount: Math.round(globalDiscount * 100) / 100,
    totalTtc: Math.round(finalTtc * 100) / 100,
  };
}
