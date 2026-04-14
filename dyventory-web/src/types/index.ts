// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

// ── Enums (mirrored from backend) ─────────────────────────────────────────────

export type UserRole =
  | "admin"
  | "manager"
  | "vendor"
  | "warehouse"
  | "accountant";

export type ProductStatus = "active" | "archived";

export type SaleStatus =
  | "draft"
  | "confirmed"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "refunded";

export type SupplierOrderStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "partially_received"
  | "received"
  | "cancelled";

export type MovementType =
  | "in_purchase"
  | "in_return"
  | "out_sale"
  | "out_loss"
  | "out_expiry"
  | "out_mortality"
  | "adjustment";

// ── Category ──────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  field_schema: import("./field-schema").FieldDefinition[];
  is_active: boolean;
  sort_order: number;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

// ── Product ───────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  category_id: number;
  vat_rate_id: number;
  name: string;
  sku: string;
  description: string | null;
  unit_of_measure: string;
  price_buy_ht: string; // Laravel decimal returns as string
  price_sell_ttc: string;
  barcode: string | null;
  stock_alert_threshold: string;
  has_variants: boolean;
  attributes: Record<string, unknown>;
  images: string[];
  status: ProductStatus;
  current_stock?: number; // Computed, optional
  category?: Category;
  vat_rate?: VatRate;
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku_variant: string;
  barcode_variant: string | null;
  attributes_variant: Record<string, unknown>;
  stock_alert_threshold: string;
  price_override_ttc: string | null;
  is_active: boolean;
}

// ── VatRate ───────────────────────────────────────────────────────────────────

export interface VatRate {
  id: number;
  name: string;
  rate: string;
  is_default: boolean;
  is_active: boolean;
}

// ── Batch / Stock ─────────────────────────────────────────────────────────────

export interface Batch {
  id: number;
  product_id: number;
  variant_id: number | null;
  supplier_id: number | null;
  batch_number: string | null;
  received_at: string;
  initial_quantity: string;
  current_quantity: string;
  attributes: Record<string, unknown>;
  status: "active" | "depleted" | "expired";
  // Computed by BatchResource
  expiry_date: string | null;
  days_until_expiry: number | null;
  is_expired: boolean;
  is_depleted: boolean;
  product?: Product;
  supplier?: Supplier;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  variant_id: number | null;
  batch_id: number | null;
  user_id: number;
  type: MovementType;
  quantity: string;
  notes: string | null;
  product?: Product;
  user?: User;
  batch?: Batch;
  created_at: string;
}

// ── Client ────────────────────────────────────────────────────────────────────

export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  type: "individual" | "reseller" | "wholesaler" | "retailer";
  credit_limit: string;
  outstanding_balance: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Supplier ──────────────────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
  lead_time_days: number;
  minimum_order_amount: string;
  is_active: boolean;
  created_at: string;
}

// ── Sale ──────────────────────────────────────────────────────────────────────

export interface Sale {
  id: number;
  client_id: number | null;
  user_id: number;
  sale_number: string;
  status: SaleStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  subtotal_ht: string;
  total_vat: string;
  total_ttc: string;
  discount_amount: string;
  amount_paid: string;
  amount_due: string;
  due_date: string | null;
  notes: string | null;
  invoice_path: string | null;
  client?: Client;
  user?: User;
  items?: SaleItem[];
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  variant_id: number | null;
  batch_id: number | null;
  quantity: string;
  unit_price_ht: string;
  unit_price_ttc: string;
  vat_rate: string;
  discount_percent: string;
  line_total_ttc: string;
  product?: Product;
}

// ── User ──────────────────────────────────────────────────────────────────────

/**
 * Full user object returned from the API.
 * Mirrors the Laravel UserResource shape.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Alias used in auth context — same shape, no `created_at` required.
 * Prefer importing AuthUser from @/types/auth for auth-specific code.
 */
export type { User as AuthUserBase };

// ── Alert / Notification ──────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// ── API generic response ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
