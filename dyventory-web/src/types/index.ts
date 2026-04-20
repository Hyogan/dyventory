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

export type ClientType = "individual" | "company" | "reseller" | "wholesaler" | "retailer";

export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  type: ClientType;
  credit_limit: number;
  outstanding_balance: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientSummary {
  sale_count: number;
  total_revenue: number;
  total_paid: number;
  outstanding_balance: number;
  credit_limit: number;
  available_credit: number;
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
  minimum_order_amount: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierSummary {
  order_count: number;
  received_count: number;
  pending_count: number;
  total_spend: number;
  lead_time_days: number;
  minimum_order_amount: number;
}

export interface SupplierOrder {
  id: number;
  supplier_id: number;
  user_id: number;
  order_number: string;
  status: SupplierOrderStatus;
  status_label?: string;
  total_amount: number;
  expected_at: string | null;
  received_at: string | null;
  notes: string | null;
  supplier?: Supplier;
  user?: { id: number; name: string };
  items?: SupplierOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface SupplierOrderItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  quantity_ordered: number;
  quantity_received: number;
  quantity_remaining: number;
  unit_price_ht: number;
  line_total_ht: number;
  product?: { id: number; name: string; sku: string | null };
  variant?: { id: number; name: string } | null;
}

// ── Setting ───────────────────────────────────────────────────────────────────

export interface Setting {
  key: string;
  value: string | number | boolean | null;
  group: string;
  type: "string" | "integer" | "float" | "boolean" | "json";
  label: string | null;
  updated_at: string;
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: number;
  user_id: number;
  user?: { id: number; name: string };
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  route: string | null;
  http_method: string;
  status_code: number;
  created_at: string;
}

// ── Sale ──────────────────────────────────────────────────────────────────────

export interface Sale {
  id: number;
  client_id: number | null;
  user_id: number;
  sale_number: string;
  status: SaleStatus;
  status_label?: string;
  payment_status: PaymentStatus;
  payment_status_label?: string;
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
  payments?: SalePayment[];
  returns?: SaleReturn[];
  created_at: string;
  updated_at?: string;
}

export interface SalePayment {
  id: number;
  sale_id: number;
  user_id: number;
  amount: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
}

export interface SaleReturn {
  id: number;
  sale_id: number;
  user_id: number;
  reason: string;
  resolution: "refund" | "credit_note" | "exchange";
  refund_amount: string;
  restock: boolean;
  items: Array<{ product_id: number; quantity: number; batch_id: number | null }>;
  notes: string | null;
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

// ── Promotion ─────────────────────────────────────────────────────────────────

export type PromotionType = "percentage" | "fixed_value" | "bundle";

export interface PromotionConditions {
  min_quantity?: number;
  category_ids?: number[];
  product_ids?: number[];
}

export interface Promotion {
  id: number;
  name: string;
  type: PromotionType;
  value: string;
  discount_label: string;
  conditions: PromotionConditions;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  is_running: boolean;
  created_at: string;
  updated_at: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardRevenue {
  today: number;
  today_change: number | null;
  week: number;
  week_change: number | null;
  month: number;
  month_change: number | null;
}

export interface DashboardAlerts {
  low_stock: number;
  expiry_soon: number;
  overdue_credits: number;
}

export interface DashboardTopProduct {
  id: number;
  name: string;
  sku: string;
  unit: string;
  revenue: number;
  quantity_sold: number;
}

export interface DashboardRecentSale {
  id: number;
  sale_number: string;
  status: SaleStatus;
  payment_status: PaymentStatus;
  total_ttc: number;
  amount_due: number;
  client_name: string | null;
  created_at: string;
}

export interface DashboardStats {
  revenue: DashboardRevenue;
  sales_today: number;
  stock_value: { value_ht: number; value_ttc: number };
  alerts: DashboardAlerts;
  top_products: DashboardTopProduct[];
  recent_sales: DashboardRecentSale[];
}

// ── Sales Report ──────────────────────────────────────────────────────────────

export interface SalesReportSummary {
  sale_count: number;
  revenue_ttc: number;
  revenue_ht: number;
  total_tva: number;
  total_discount: number;
  total_outstanding: number;
  avg_ticket: number;
}

export interface SalesReportPeriodRow {
  period: string;
  sale_count: number;
  revenue_ttc: number;
  revenue_ht: number;
  total_tva: number;
  total_discount: number;
}

export interface SalesReportVendorRow {
  user_id: number;
  user_name: string;
  sale_count: number;
  revenue_ttc: number;
  avg_ticket: number;
}

export interface SalesReportCategoryRow {
  category_id: number;
  category_name: string;
  sale_count: number;
  revenue_ttc: number;
  quantity_sold: number;
}

export interface SalesReportClientRow {
  client_id: number | null;
  client_name: string;
  sale_count: number;
  revenue_ttc: number;
  outstanding: number;
}

// ── TVA Report ────────────────────────────────────────────────────────────────

export interface TvaReportSummary {
  sale_count: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

export interface TvaReportPeriodRow {
  period: string;
  sale_count: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

export interface TvaReportRateRow {
  vat_rate_id: number | null;
  vat_rate_name: string;
  rate: number;
  sale_count: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

// ── Credit Report ─────────────────────────────────────────────────────────────

export interface CreditReportSummary {
  sale_count: number;
  total_invoiced: number;
  total_collected: number;
  total_outstanding: number;
  total_overdue: number;
}

export interface CreditReportClientRow {
  client_id: number | null;
  client_name: string;
  sale_count: number;
  total_invoiced: number;
  outstanding: number;
  overdue: number;
}

export interface OverdueInvoice {
  id: number;
  sale_number: string;
  created_at: string;
  due_date: string;
  total_ttc: number;
  amount_due: number;
  client_id: number | null;
  client_name: string;
  days_overdue: number;
}

// ── Stock Report ──────────────────────────────────────────────────────────────

export interface StockValueCategoryRow {
  category_id: number;
  category_name: string;
  product_count: number;
  total_quantity: number;
  value_ht: number;
  value_ttc: number;
}

export interface StockForecastRow {
  id: number;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
  avg_daily_consumption: number;
  days_to_stockout: number | null;
  urgency: "critical" | "warning" | "ok";
}
