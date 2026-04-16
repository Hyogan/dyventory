# Dyventory — Project Guidance (Auto-generated)

**Last updated:** 2026-04-16
**Project:** Stock & Sales Management App for a business with diversified catalogue (clothing, electronics, perishable food, live snails)
**Core architecture:** Dynamic Field Schema per category (no hardcoded product types)

---

## Tech Stack

| Layer       | Tech                                     | Version                              |
| ----------- | ---------------------------------------- | ------------------------------------ |
| Backend     | Laravel + Sanctum                        | ^13 (PHP 8.3+)                       |
| Frontend    | Next.js + React                          | 16.x + React 19                      |
| Styling     | Tailwind CSS                             | v4.x (CSS-first, `@theme {}`, OKLCH) |
| i18n        | next-intl (FE) + Laravel lang (BE)       | EN primary, FR secondary             |
| Database    | PostgreSQL                               | 16+                                  |
| State       | Zustand (client), React cache() (server) |                                      |
| Validation  | Zod (FE) + Laravel Form Requests (BE)    |                                      |
| PDF         | DomPDF (queued)                          |                                      |
| Queue/Cache | Redis + Laravel Horizon                  |                                      |

---

## Repository Structure

```
stocky/
├── dyventory-api/          # Laravel backend
│   ├── app/
│   │   ├── DTOs/            # FieldDefinition.php
│   │   ├── Enums/           # UserRole, FieldType, MovementType, SaleStatus, PaymentStatus, SupplierOrderStatus
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # AuthController, CategoryController, ProductController, ProductVariantController, BarcodeController
│   │   │   ├── Middleware/        # AuditLog
│   │   │   ├── Requests/         # LoginRequest, StoreCategoryRequest, UpdateCategoryRequest, UpdateCategoryFieldSchemaRequest, StoreProductRequest, UpdateProductRequest, UploadProductImageRequest
│   │   │   └── Resources/        # UserResource, CategoryResource, ProductResource, ProductVariantResource
│   │   ├── Models/           # User, Category, Product, ProductVariant, VatRate, Batch, StockMovement, Sale, SaleItem, SaleReturn, SalePayment, Client, Supplier, SupplierOrder, SupplierOrderItem, InventorySession, AuditLog
│   │   ├── Policies/         # ProductPolicy, SalePolicy, ClientPolicy, SupplierPolicy, UserPolicy, ReportPolicy, CategoryPolicy
│   │   ├── Providers/        # AppServiceProvider (only CategoryPolicy registered via Gate)
│   │   └── services/         # CategoryService, FieldSchemaService, ProductService, BarcodeService (NOTE: lowercase 'services' dir!)
│   ├── bootstrap/app.php     # Route loading, exception handlers, middleware config
│   ├── database/
│   │   ├── migrations/       # users, categories, vat_rates, products, product_variants, clients, suppliers, batches, stock_movements, supplier_orders, sales, supportings
│   │   └── seeders/          # DatabaseSeeder, UserSeeder, CategorySeeder, VatRateSeeder, ProductSeeder
│   └── routes/
│       └── api/v1/           # auth.php, categories.php (products.php etc commented out in bootstrap/app.php)
│
├── dyventory-web/           # Next.js frontend
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/login/page.tsx
│   │   │   └── (space)/              # Dashboard layout group
│   │   │       ├── layout.tsx        # SessionProvider + SidebarProvider + Sidebar + Header
│   │   │       ├── dashboard/page.tsx
│   │   │       └── categories/
│   │   │           ├── page.tsx      # Category list
│   │   │           └── [id]/page.tsx # Category detail + field schema builder
│   │   └── layout.tsx                # Root layout
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Button, Input, Badge, Card, Modal, Skeleton, Spinner
│   │   │   ├── shared/       # DataTable, Pagination, PageHeader, SearchInput, ConfirmDialog, EmptyState, StatusBadge, LanguageSwitcher, DynamicFieldRenderer
│   │   │   └── nav/          # Sidebar, Header
│   │   ├── features/
│   │   │   ├── auth/pages/   # LoginForm.tsx
│   │   │   └── categories/components/  # CategoryTree, CategoryModal, FieldSchemaBuilder, FieldConfigPanel, FieldTypeIcon
│   │   ├── hooks/            # useSession (exists via providers)
│   │   ├── i18n/
│   │   │   ├── routing.ts    # locales: ['en', 'fr'], defaultLocale: 'en', localePrefix: 'always'
│   │   │   ├── request.ts
│   │   │   └── messages/     # en.json, fr.json (+ en1.json, fr1.json backup)
│   │   ├── lib/
│   │   │   ├── api.ts        # apiFetch<T>(), ApiError class, dual URL (server internal / browser public)
│   │   │   ├── auth.ts       # getAuthToken(), getCurrentUser(), authFetch<T>(), setAuthCookie(), clearAuthCookie()
│   │   │   ├── schema-to-zod.ts  # schemaToZod(fields, appliesTo?) → z.ZodObject
│   │   │   └── utils.ts      # cn() helper
│   │   ├── providers/        # SessionProvider, SidebarProvider
│   │   └── types/
│   │       ├── index.ts      # All entity interfaces: Category, Product, ProductVariant, VatRate, Batch, StockMovement, Client, Supplier, Sale, SaleItem, User, enums
│   │       ├── auth.ts       # AuthUser type
│   │       └── field-schema.ts  # FieldDefinition, FieldType, FIELD_TYPE_LABELS, ALL_FIELD_TYPES, helpers
│   └── CLAUDE.md → AGENTS.md # Warning: Next.js may differ from training data, check docs
│
├── fullstack-skills/
│   ├── planning.md           # Full phased development plan (Phases 0–9)
│   └── specifications.md     # Functional specs v0.3
│
├── docker-compose.yml
└── Dockerfile.dev
```

---

## API Patterns

- **Base URL:** `/api/v1/`
- **Auth:** Sanctum token-based, `Authorization: Bearer <token>`
- **Route loading:** `bootstrap/app.php` → `routes/api/v1/*.php` (only auth.php + categories.php active)
- **Response format:** `{ data: {...} }` or `{ data: [...], meta: {...} }` for paginated
- **Error format:** `{ message: "...", errors: {...} }` (422), `{ message: "..." }` (401/403/404)
- **Auth endpoints:**
  - `POST /api/v1/auth/login` → `{ data: { token, user } }`
  - `POST /api/v1/auth/logout` → 204
  - `GET /api/v1/auth/me` → `{ data: { user: {...} } }`
- **Category endpoints:**
  - `GET /api/v1/categories` (?tree=1 for nested)
  - `POST /api/v1/categories`
  - `GET/PUT/DELETE /api/v1/categories/{id}`
  - `PUT /api/v1/categories/{id}/schema`

---

## Key Architecture Decisions

1. **Dynamic Field Schema:** Each category has `field_schema` JSONB — array of FieldDefinition objects with `applies_to: 'product' | 'batch'`. No hardcoded product types.
2. **FieldDefinition DTO:** `key` (immutable), `label`, `label_fr`, `type`, `required`, `applies_to`, `options?`, `min?`, `max?`
3. **FieldType enum:** text, number, date, select, checkbox, radio, textarea
4. **Snails = kg:** All snail quantities use `decimal(10,3)` — never integer
5. **FEFO:** First Expired First Out for batch management
6. **i18n from Day 1:** All UI strings via translation keys, zero hardcoded strings
7. **Services directory:** Located at `app/services/` (lowercase!) not `app/Services/`
8. **Policies:** Only CategoryPolicy is registered in AppServiceProvider. Other policies exist but are commented out in the old boot code.
9. **Frontend auth:** httpOnly cookie `dyventory-auth-token-cookie`, server-side `getCurrentUser()` via React cache()
10. **Frontend routing:** `app/[locale]/(space)/` for dashboard pages, `app/[locale]/(auth)/` for login

---

## Phase Completion Status

### Phase 0 — Foundation ✅ COMPLETE

- Docker, repos, i18n, design system, DB schema, all migrations, seeders, UI components

### Phase 1 — Authentication & Authorization ✅ COMPLETE

- AuthController (login/logout/me), RBAC policies (7 policies), AuditLog middleware
- Frontend: login page, middleware auth, SessionProvider, useSession

### Phase 2 — Dynamic Category Field Schema ✅ COMPLETE

- Backend: CategoryService, FieldSchemaService (validate schema/attributes/build rules), CategoryController, CategoryResource
- Frontend: CategoryTree, CategoryModal, FieldSchemaBuilder, FieldConfigPanel, FieldTypeIcon, DynamicFieldRenderer, schema-to-zod.ts

### Phase 3 — Product Catalogue ✅ COMPLETE

**3.1 Backend — Products: ✅ COMPLETE**

- 3.1.1 ProductService (CRUD, filters, validates attributes via FieldSchemaService) ✅
- 3.1.2 ProductController + ProductResource (conditional financials by role) ✅
- 3.1.3 Variants, Barcodes & Images ✅

**3.2 Frontend — Products: ✅ COMPLETE**

- 3.2.1 Product list page (DataTable, filters, search) ✅
- 3.2.2 Product create/edit form (DynamicFieldRenderer for category fields) ✅
- 3.2.3 Variants, detail page, barcodes, image gallery ✅

### Phase 4 — Stock Management

**4.1 Backend — Stock: ✅ COMPLETE**

- 4.1.1 StockMovementService (FEFO exits, entries, adjustments) + StockMovementRecorded event ✅
- 4.1.2 BatchService + BatchController + BatchResource (dynamic batch-field validation via FieldSchemaService) ✅
- 4.1.2 StockMovementController (entry / exit / adjustment endpoints) + StockMovementResource ✅
- 4.1.2 InventoryService (start → counts → discrepancies → validate) + InventoryController ✅
- 4.1.2 Policies: BatchPolicy, StockMovementPolicy, InventorySessionPolicy (registered in AppServiceProvider) ✅
- 4.1.2 routes/api/v1/stock.php (batches, stock movements, inventory) — wired in bootstrap/app.php ✅
- 4.1.3 AlertService (low stock, zero stock, batch expiry, mortality) + CheckStockAlerts job ✅
- 4.1.3 CheckStockAlerts scheduled daily at 06:00 in routes/console.php ✅

**4.2 Frontend — Stock: ✅ COMPLETE**

- 4.2.1 Stock overview page (RSC, batch table, expiry badges, stock level bars, alert summary bar) ✅
- 4.2.1 StockFilters (category, status, expiry_warning toggle) ✅
- 4.2.2 Stock entry page + StockEntryForm (product select, decimal qty, batch creation, DynamicFieldRenderer for batch fields) ✅
- 4.2.2 BatchFieldsSection component ✅
- 4.2.3 Stock exit page + StockExitForm (FEFO hint, loss reason select, confirm dialog) ✅
- 4.2.3 Stock history page + MovementHistoryTable (type/date filters, signed quantities) ✅
- 4.2.3 Inventory flow page: start session → InventoryCountForm (scanner-friendly) → DiscrepancyReport → validate ✅
- 4.2.4 useAlerts hook (polling 60s, mark read) ✅
- 4.2.4 AlertDropdown component (unread badge, categorised alerts) ✅
- 4.2.4 Header.tsx updated with live notification bell ✅
- API route handlers: /api/auth/logout, /api/notifications/* ✅
- Backend: notifications.php routes (list, read, read-all) ✅
- types/index.ts: Batch extended with expiry computed fields ✅

### Phase 5 — Sales Engine

**5.1 Backend — Sales: ✅ COMPLETE**

- 5.1.1 SaleService (create/confirm/cancel/deliver, HT/TVA/TTC calc, FEFO stock decrement, sale number generation) ✅
- 5.1.1 SaleConfirmed event + DecrementStockOnSale queued listener (registered in AppServiceProvider) ✅
- 5.1.2 SaleController (index, store, show, confirm, deliver, cancel) + SaleResource + SaleItemResource + SalePaymentResource ✅
- 5.1.2 StoreSaleRequest (items, discount_percent, payment_method, due_date, credit validation) ✅
- 5.1.2 PaymentController (GET/POST /sales/{sale}/payments) — record partial payments, recompute payment_status ✅
- 5.1.2 ReturnService (validate items vs original sale, restock via in_return movement) + ReturnController ✅
- 5.1.2 CheckOverdueCredits job — scheduled daily at 07:00 (marks due_date-exceeded credit sales as overdue) ✅
- 5.1.2 routes/api/v1/sales.php — wired in bootstrap/app.php, SalePolicy registered ✅

**5.2 Frontend — Sales: ✅ COMPLETE**

- 5.2.1 Sales list page (RSC): SaleSummaryCards (4 stat cards), SaleFilters (status/payment/date range), SalesTable (DataTable with confirm/cancel quick actions) ✅
- 5.2.2 New sale page: split-panel POS layout — ProductSearch (debounced autocomplete dropdown, stock display), SaleCart, SaleCartItem (qty stepper with kg support, per-item discount, line total) ✅
- 5.2.3 ClientSelector (debounced search, dropdown, anonymous option), PaymentSection (4-icon method picker, credit due date), OrderSummary (global discount input, live totals, notes), NewSaleForm (orchestrator + submit with draft/confirm) ✅
- 5.2.4 SaleDetail (status bar, items table, financials breakdown, client card, payment timeline, returns list, action buttons), AddPaymentModal, ReturnForm (item selection, restock toggle, resolution radio) ✅
- useSaleStore (Zustand) — cart state, quantities, discounts, computeLineTotal, selectCartTotals ✅
- src/features/sales/actions.ts — getSales, getSale, createSale, confirmSale, cancelSale, deliverSale, recordPayment, processReturn ✅
- src/stores/useSaleStore.ts — full cart state management ✅
- i18n: sales.new, sales.detail, sales.return, sales.filters, sales.stats namespaces added to en.json + fr.json ✅
- Types: SalePayment, SaleReturn interfaces added; Sale extended with payments? returns? ✅

### Phase 6 — Clients, Suppliers & Settings

**6.1 Backend — ✅ COMPLETE**

- 6.1.1 ClientService (CRUD, autocomplete search, financial summary: CA + credit + sale count) ✅
- 6.1.1 ClientController + ClientResource + StoreClientRequest + UpdateClientRequest ✅
- 6.1.1 SupplierService (CRUD, autocomplete search, procurement summary) ✅
- 6.1.1 SupplierController + SupplierResource + StoreSupplierRequest + UpdateSupplierRequest ✅
- 6.1.1 SupplierOrderService (order lifecycle: draft→sent→confirmed→partially_received|received + cancel; receive creates Batch + in_purchase StockMovement for full audit trail) ✅
- 6.1.1 SupplierOrderController (index, store, show, update, send, confirm, cancel, receive) + SupplierOrderResource + SupplierOrderItemResource ✅
- 6.1.1 StoreSupplierOrderRequest + UpdateSupplierOrderRequest + ReceiveSupplierOrderRequest ✅
- 6.1.1 routes/api/v1/clients.php + routes/api/v1/suppliers.php ✅
- 6.1.2 UserController (admin-only: index, store, show, update, destroy, restore) ✅
- 6.1.2 StoreUserRequest + UpdateUserRequest (Password::min(8)->letters()->numbers()) ✅
- 6.1.2 Setting model (typed key/value, typedValue() accessor) + 2026_04_15_000001_create_settings_table.php migration (seeded with 13 defaults) ✅
- 6.1.2 SettingService (Redis-cached reads, bulk update, logo upload with old-file cleanup) ✅
- 6.1.2 SettingController + SettingResource + UpdateSettingRequest ✅
- 6.1.2 VatRateController (admin write, read-all for any auth) + VatRateResource + StoreVatRateRequest + UpdateVatRateRequest ✅
- 6.1.2 routes/api/v1/users.php + routes/api/v1/settings.php ✅
- 6.1.2 VatRatePolicy + SettingPolicy — registered in AppServiceProvider ✅
- 6.1.2 AppServiceProvider: Client, Supplier, User, VatRate, Setting policies registered ✅
- 6.1.2 bootstrap/app.php: clients, suppliers, users, settings routes activated ✅

**6.2 Frontend — ✅ COMPLETE**

- 6.2.1 Clients list page (RSC + ClientsPageClient + ClientsTable + ClientFilters + ClientModal) ✅
- 6.2.1 Client detail page (contact info, credit info, purchase history, ClientSummaryCards) ✅
- 6.2.1 src/features/clients/actions.ts (getClients, getClient, getClientSummary, searchClients, createClient, updateClient, deleteClient) ✅
- 6.2.2 Suppliers list page (RSC + SuppliersPageClient + SuppliersTable + SupplierFilters + SupplierModal) ✅
- 6.2.2 Supplier detail page (summary cards, contact info, OrderTimeline, ReceiveOrderForm, NewOrderModal) ✅
- 6.2.2 src/features/suppliers/actions.ts (full CRUD + order lifecycle: create, send, confirm, cancel, receive) ✅
- 6.2.3 Admin users page (UsersTable + UserModal + role filter) ✅
- 6.2.3 Admin settings page (SettingsForm with grouped settings, VatRatesTable + VatRateModal) ✅
- 6.2.3 Admin audit page (AuditTable with expandable rows showing before/after diff, AuditFilters) ✅
- 6.2.3 src/features/admin/actions.ts (user CRUD + restore, settings update, VAT rates CRUD, audit log query) ✅
- 6.2.4 i18n completion pass: all missing keys added to en.json + fr.json ✅
  - clients: description, actions.new, fields.credit_limit/is_active, types.company, filters, summary keys, contact_info, credit_info, purchase_history
  - suppliers: description, actions (new/new_order/send_order/confirm_order/receive/cancel_order), summary, orders namespace, details namespace, partially_received status
  - admin: users.description/all_roles/edit_title/fields.phone/actions.restore, settings.description/groups/new_rate, vat_rates namespace, audit.description/before/after/fields.method/status_code
  - sales: fr.json missing draft status added
- 6.2.4 Hardcoded strings fixed: ClientSummaryCards, SupplierDetail, OrderTimeline, SettingsForm, AuditTable, UsersPageClient, UsersTable, UserModal, VatRateModal ✅

---

---

## What Already Exists But Needs Wiring for Phase 3

1. **Product model** (`app/Models/Product.php`): Complete with relations (category, vatRate, variants, batches, movements), scopes (active, inCategory, lowStock, search), computed `current_stock`
2. **ProductVariant model**: Exists with fillable, casts
3. **VatRate model**: Exists with `getDefault()` helper
4. **ProductPolicy**: Exists with all methods (viewAny, view, create, update, delete, manageSchema, viewFinancials)
5. **Products migration**: Complete (products + product_variants tables)
6. **Frontend types**: Product, ProductVariant, VatRate interfaces defined in `types/index.ts`
7. **DynamicFieldRenderer**: Ready to use for product-level category fields
8. **schema-to-zod.ts**: Ready for form validation
9. **authFetch**: Ready for authenticated API calls from server components/actions

## What Phase 3 Must Create

### Backend (dyventory-api):

- `app/Services/ProductService.php` — CRUD with FieldSchemaService integration
- `app/Http/Controllers/Api/ProductController.php`
- `app/Http/Resources/ProductResource.php` (conditional financial fields)
- `app/Http/Requests/StoreProductRequest.php`
- `app/Http/Requests/UpdateProductRequest.php`
- `app/Http/Controllers/Api/ProductVariantController.php` + resource
- `app/Services/BarcodeService.php` + controller
- Image upload endpoint
- `routes/api/v1/products.php`
- Register ProductPolicy in AppServiceProvider
- Uncomment products route in `bootstrap/app.php`

### Frontend (dyventory-web):

- `app/[locale]/(space)/products/page.tsx` — product list (RSC)
- `app/[locale]/(space)/products/new/page.tsx` — create form
- `app/[locale]/(space)/products/[id]/page.tsx` — detail view
- `app/[locale]/(space)/products/[id]/edit/page.tsx` — edit form
- `src/features/products/components/` — ProductTable, ProductFilters, ProductForm, VariantManager, BarcodeDisplay
- Server actions for create/update/delete
- i18n keys in messages files for products namespace

---

## Conventions & Patterns to Follow

- **Backend controllers are thin** — business logic in Services
- **strict_types** on all PHP files
- **#[Fillable([...])]** attribute on models (not $fillable property)
- **Resources** wrap all API responses
- **Form Requests** for validation
- **HasMiddleware interface** on controllers for auth
- **Frontend pages** in `app/[locale]/(space)/` route group
- **Feature components** in `src/features/<module>/components/`
- **'use client'** only on interactive components
- **Server actions** for mutations
- **authFetch()** for all authenticated server-side API calls
- **useTranslations()** for all UI text
- **cn()** utility for conditional class names
