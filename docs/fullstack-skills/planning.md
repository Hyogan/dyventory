# Project Plan — Stock & Sales Management App

**Stack:** Laravel 12 · Next.js 15 · Tailwind CSS v4 · PostgreSQL 16
**Timeline:** 6 weeks hard limit — **target done by end of Week 5**
**Mode:** AI-assisted development — every task fits in a single Claude chat
**Version:** 1.1 — Updated with all decisions

---

## Decision Log (Changes from v1.0)

| #   | Decision                                               | Impact on Plan                                                      |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | Permissions matrix finalised (no client review needed) | Removed open question, RBAC is now fully defined                    |
| 2   | Hosting: Hostinger VPS (existing server)               | Phase 9 now Hostinger-specific (Nginx, Let's Encrypt, PM2)          |
| 3   | Snails sold by kg only                                 | Stock movements, sale form, batch quantities all in `decimal(10,3)` |
| 4   | Dynamic Field Schema per category                      | Replaces all hardcoded product types — new Phase 2 added            |
| 5   | English primary, French second (i18n from Day 1)       | Adds task 0.1.5 (i18n setup), all components use translation keys   |

---

## How to Use This Plan

Each task is a **self-contained Claude prompt unit**:

- Produces 2–6 specific, named files
- Lists what to **paste into the chat** (never the whole codebase)
- Lists the exact **output files** expected
- `[PARALLEL]` = can be done simultaneously with sibling tasks
- `[DEPENDS ON X.X.X]` = hard dependency

**Starting each Claude task — always use this template:**

```
Task: [X.X.X — Task Name]

Paste these files:
- [exact file names to paste]

Task:
[copy the task description from this plan]

Stack: Laravel 12 / PHP 8.2+ / PostgreSQL 16 / Next.js 15 / Tailwind v4
Constraint: [copy constraints from task]
Output: [copy output list from task]
Do NOT include: [anything explicitly out of scope]
```

---

## Technology Stack

| Layer         | Technology                               | Version         | Notes                                |
| ------------- | ---------------------------------------- | --------------- | ------------------------------------ |
| Backend       | Laravel                                  | ^13.0           | PHP 8.2+, strict types               |
| Frontend      | Next.js + React                          | 16.x + React 19 | App Router, RSC-first                |
| Styling       | Tailwind CSS                             | v4.x            | CSS-first config, OKLCH colors       |
| i18n          | next-intl (FE) + Laravel lang files (BE) | latest          | EN primary, FR secondary             |
| Database      | PostgreSQL                               | 16+             | JSONB for field schemas + attributes |
| Auth          | Laravel Sanctum                          | ^4.0            | httpOnly cookie strategy             |
| State         | Zustand                                  | latest          | Client-side UI state only            |
| Validation    | Zod                                      | latest          | Frontend schema validation           |
| PDF           | DomPDF (Laravel)                         | latest          | Always queued, never inline          |
| Barcodes      | `milon/barcode` + `jsbarcode`            | latest          | Generation + display                 |
| Queue / Cache | Redis + Laravel Horizon                  | latest          | Jobs, notifications, report cache    |
| Hosting       | Hostinger VPS                            | existing        | Nginx, PM2, Let's Encrypt SSL        |
| Versioning    | Git + GitHub                             | —               | Feature branch per task, PR per task |

---

## Global Constraints

| Type               | Constraint                                                      |
| ------------------ | --------------------------------------------------------------- |
| **Time**           | 6 weeks hard, target Week 5 completion                          |
| **Team**           | 2 developers + Claude AI                                        |
| **Token limit**    | One task per Claude session — never paste the whole app         |
| **Scope lock**     | No features outside this plan without explicit decision         |
| **No multi-depot** | Single location in v1                                           |
| **No mobile app**  | Web responsive only                                             |
| **No SMS**         | In-app + email v2                                               |
| **Snails = kg**    | All snail quantities use `decimal(10,3)` — never integer        |
| **i18n keys**      | Zero hardcoded UI strings — always use translation keys         |
| **Dynamic fields** | No new hardcoded product type logic — use category field schema |

---

## Global Risks & Mitigations

| Risk                                         | Probability | Impact | Mitigation                                                                     |
| -------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------ |
| Dynamic Zod schema from JSON is complex      | High        | High   | Build `schema-to-zod.ts` as a standalone utility in task 2.2.3 — test it early |
| i18n added late becomes a painful refactor   | High        | High   | next-intl configured on Day 1 — no exceptions                                  |
| N+1 queries on stock movements               | High        | High   | `with()` always, `automaticallyEagerLoadRelationships()` in AppServiceProvider |
| JSONB field key renamed after products exist | Medium      | High   | Keys are immutable once created — enforce in backend validation                |
| Sanctum cookie CORS issues on Hostinger      | Medium      | High   | Configure `SANCTUM_STATEFUL_DOMAINS` and Nginx CORS in Phase 9 task            |
| PDF memory spikes                            | Low         | Medium | Always queue PDF jobs — never generate inline                                  |
| Snail kg decimal rounding                    | Low         | Medium | `decimal(10,3)` throughout, display with 3 decimal places                      |
| Scope creep                                  | Medium      | High   | Spec v0.3 is frozen — all new requests go to v2 backlog                        |

---

## Development Philosophy

- **Backend first** within every feature — test the API in Postman before building any UI
- **One migration per model** — never edit a migration after running it
- **One PR per task** — small, reviewable, mergeable in one sitting
- **Translation keys from Day 1** — `t('products.create.title')` not `"Create Product"`
- **Schema-driven forms** — category field schema drives form rendering, not hardcoded JSX
- **kg everywhere for living products** — never assume integer quantities for snails

---

---

# PHASE 0 — Foundation

**Duration:** Days 1–3 (Week 1)
**Goal:** Both repos running, DB scaffolded, i18n ready, design system set
**Risk:** If setup runs > 3 days, cut Docker and use local dev temporarily

---

## 0.1 Repositories & Environment

### 0.1.1 Backend Repository Init

- **Paste:** Nothing — greenfield
- **Task:** Laravel 12 + Sanctum + PostgreSQL + Redis. Configure `bootstrap/app.php` exception handlers (ValidationException → 422, ModelNotFoundException → 404, AuthorizationException → 403). `phpunit.xml` for PostgreSQL test DB.
- **Output:**
  - `/backend` repo, correct `composer.json`
  - `.env.example` (DB, Redis, Sanctum, Queue vars)
  - `bootstrap/app.php` with global exception → JSON handler
  - `config/sanctum.php` SPA cookie config
  - `phpunit.xml` pgsql test connection
- **Constraint:** `SANCTUM_STATEFUL_DOMAINS=localhost:3000` in `.env.example`

### 0.1.2 Frontend Repository Init

- **Paste:** Nothing — greenfield
- **Task:** Next.js 15, TypeScript strict, Tailwind v4, `@/*` path aliases, `src/` dir. Install: `next-intl`, `zustand`, `zod`, `clsx`, `tailwind-merge`, `class-variance-authority`, `react-hook-form`, `@hookform/resolvers`.
- **Output:**
  - `/frontend` repo, `tsconfig.json` (strict: true, paths `@/*`)
  - `src/` structure: `app/`, `components/ui/`, `components/shared/`, `lib/`, `hooks/`, `stores/`, `types/`, `messages/`
  - `globals.css` with `@import "tailwindcss"` and placeholder `@theme {}`
  - `lib/utils.ts` (`cn()` helper)
  - `lib/api.ts` (typed `apiFetch<T>()` + `ApiError` class)
  - `types/index.ts` skeleton
- **Constraint:** Node 20+

### 0.1.3 Docker Compose Setup [PARALLEL with 0.1.1]

- **Task:** docker-compose.yml: `api` (PHP-FPM), `frontend` (Node), `db` (PostgreSQL 16), `redis`, `horizon`.
- **Output:**
  - `docker-compose.yml`
  - `docker/api/Dockerfile` (PHP 8.2-FPM + extensions)
  - `docker/nginx/default.conf`
  - `.env.docker.example`

### 0.1.4 GitHub Actions CI [PARALLEL with 0.1.1]

- **Task:** Two workflows: backend (PHPUnit + Pint) and frontend (tsc + ESLint + next build check).
- **Output:**
  - `.github/workflows/backend.yml`
  - `.github/workflows/frontend.yml`

### 0.1.5 i18n Setup — next-intl + Laravel lang ⚠️ NEW

- **Paste:** `src/` folder structure from 0.1.2
- **Task:** Configure next-intl (EN default, FR second). Locale routing via middleware. Translation file structure with all module namespaces. Laravel `lang/en/` + `lang/fr/` scaffolded.
- **Output (Frontend):**
  - `src/i18n/routing.ts` (locales: ['en', 'fr'])
  - `src/i18n/request.ts` (server config)
  - `messages/en.json` (namespaces: auth, products, stock, sales, clients, suppliers, reports, common, errors)
  - `messages/fr.json` (full French translations)
  - Updated `middleware.ts` (locale + auth routing combined)
  - `app/[locale]/layout.tsx` (root layout with `NextIntlClientProvider`)
- **Output (Backend):**
  - `lang/en/auth.php`, `lang/en/validation.php`, `lang/en/messages.php`
  - `lang/fr/auth.php`, `lang/fr/validation.php`, `lang/fr/messages.php`
- **Rule:** From this point forward — zero hardcoded strings anywhere in the UI

---

## 0.2 Design System

### 0.2.1 Tailwind v4 Theme & Global CSS

- **Task:** Complete `@theme {}` block: OKLCH primary (blue), semantic surface/text/border tokens, Inter typography, border-radius scale, shadows, dark mode overrides. `@layer utilities` for `.input`, `.label`, `.card`, `.badge`.
- **Output:** Complete `globals.css`

### 0.2.2 Core UI Component Library [PARALLEL with 0.2.1]

- **Paste:** `globals.css` from 0.2.1
- **Task:** Button (4 variants, 3 sizes, loading state), Input (label, error, hint, aria-describedby), Badge (5 variants, cva), Spinner, Skeleton, Card + CardHeader + CardTitle, Modal (portal, focus trap, Escape key).
- **Output:**
  - `components/ui/Button.tsx`, `Input.tsx`, `Badge.tsx`, `Spinner.tsx`, `Skeleton.tsx`, `Card.tsx`, `Modal.tsx`
  - `components/ui/index.ts`

### 0.2.3 Layout Shell Components [DEPENDS ON 0.2.2]

- **Paste:** `globals.css`, `Button.tsx`, i18n routing config
- **Task:** Dashboard shell: Sidebar (role-aware nav items), Header (user menu, notification bell, language switcher), PageHeader component.
- **Output:**
  - `app/[locale]/(dashboard)/layout.tsx`
  - `components/shared/Sidebar.tsx`
  - `components/shared/Header.tsx`
  - `components/shared/PageHeader.tsx`
  - `components/shared/LanguageSwitcher.tsx`

### 0.2.4 Shared Data Components [DEPENDS ON 0.2.2]

- **Task:** `DataTable<T>` (typed, sortable, paginated), `Pagination`, `EmptyState`, `ConfirmDialog`, `StatusBadge`, `SearchInput` (debounced 300ms).
- **Output:**
  - `components/shared/DataTable.tsx`, `Pagination.tsx`, `EmptyState.tsx`, `ConfirmDialog.tsx`, `StatusBadge.tsx`, `SearchInput.tsx`

---

## 0.3 Database Schema

### 0.3.1 Users & Auth Migrations

- **Task:** `users` table with `role` enum column. PHP 8.2 `UserRole` enum (admin, manager, vendor, warehouse, accountant). `User` model with role cast + `hasRole()` / `hasAnyRole()` helpers.
- **Output:**
  - `create_users_table.php`
  - `app/Enums/UserRole.php`
  - `User` model

### 0.3.2 Categories with Dynamic Field Schema ⚠️ NEW

- **Task:** `categories` table with `field_schema` JSONB column (self-referencing `parent_id`). Category model with `getProductFields()` and `getBatchFields()` helpers (filter by `applies_to`). `FieldType` enum. `FieldDefinition` DTO.
- **Output:**
  - `create_categories_table.php`
  - `app/Models/Category.php`
  - `app/Enums/FieldType.php` (text, number, date, select, checkbox, radio, textarea)
  - `app/DTOs/FieldDefinition.php`

### 0.3.3 Products & Variants [DEPENDS ON 0.3.2]

- **Task:** `products` table (no `type` enum — replaced by category field schema), `product_variants`, `vat_rates`. Models with JSONB casts.
- **Output:**
  - `create_products_table.php`, `create_product_variants_table.php`, `create_vat_rates_table.php`
  - `Product`, `ProductVariant`, `VatRate` models

### 0.3.4 Stock, Batches & Movements [DEPENDS ON 0.3.3]

- **Task:** `batches` table (`current_quantity` as `decimal(10,3)` for kg precision, `attributes` JSONB for batch-level category fields). `stock_movements` table (polymorphic reference). `MovementType` enum.
- **Output:**
  - `create_batches_table.php`, `create_stock_movements_table.php`
  - `app/Enums/MovementType.php`
  - `Batch`, `StockMovement` models

### 0.3.5 Sales, Clients & Suppliers [PARALLEL with 0.3.4]

- **Task:** `clients`, `suppliers`, `sales`, `sale_items`, `supplier_orders`, `sale_returns` tables. Status enums for each.
- **Output:**
  - 6 migration files + `SaleStatus`, `PaymentStatus`, `SupplierOrderStatus` enums
  - All Eloquent models

### 0.3.6 Supporting Tables [PARALLEL with 0.3.4]

- **Task:** `promotions`, `losses`, `audit_logs` (write-only, JSONB old/new values), `notifications`, `inventory_sessions`.
- **Output:** 5 migration files + models

### 0.3.7 Seeders [DEPENDS ON 0.3.1–0.3.6]

- **Task:** One user per role, VAT rates (19.25% default), 4 sample categories **with full field_schema JSON** (Food-Perishable, Snails, Clothing, Electronics), 3 products per category with attributes.
- **Output:**
  - `DatabaseSeeder.php`
  - `UserSeeder.php`, `CategorySeeder.php`, `VatRateSeeder.php`, `ProductSeeder.php`

---

---

# PHASE 1 — Authentication & Authorization

**Duration:** Days 4–5 (Week 1)
**Depends on:** Phase 0

---

## 1.1 Backend Auth

### 1.1.1 Auth Controller & Endpoints

- **Paste:** `User` model, `UserRole` enum, Sanctum config
- **Task:** `AuthController`: `login`, `logout`, `me`. `LoginRequest`. `UserResource`. Return structured JSON.
- **Output:**
  - `app/Http/Controllers/Api/AuthController.php`
  - `app/Http/Requests/LoginRequest.php`
  - `app/Http/Resources/UserResource.php`
  - `routes/api/v1/auth.php`

### 1.1.2 RBAC — Policies for All Entities

- **Paste:** `UserRole` enum, permissions matrix from spec section 2.1
- **Task:** Policies for Product, Sale, Client, Supplier, User, Report. Each policy method maps exactly to the permissions matrix table.
- **Output:**
  - 6 Policy files + registration in `AppServiceProvider`

### 1.1.3 Audit Trail Middleware

- **Paste:** `audit_logs` migration, `User` model
- **Task:** Middleware logs every POST/PUT/PATCH/DELETE: user_id, action, entity type/id, old + new Eloquent values as JSONB, IP address.
- **Output:** `app/Http/Middleware/AuditLog.php` registered on `auth:sanctum` group

---

## 1.2 Frontend Auth

### 1.2.1 Login Page & Server Action

- **Paste:** `apiFetch`, i18n setup, `Input` + `Button` components
- **Task:** Login page with Server Action: Zod validation, call `/auth/login`, store token in httpOnly cookie, redirect to `/{locale}/dashboard`.
- **Output:**
  - `app/[locale]/(auth)/login/page.tsx`
  - `app/[locale]/(auth)/login/_components/LoginForm.tsx` ('use client', `useActionState`)
  - `app/[locale]/(auth)/login/_actions.ts`
  - `app/[locale]/(auth)/layout.tsx`

### 1.2.2 Middleware & Route Protection [DEPENDS ON 1.2.1]

- **Paste:** i18n routing config, cookie name
- **Task:** Update `middleware.ts` to combine next-intl locale routing AND auth protection.
- **Output:** Updated `middleware.ts`

### 1.2.3 Session Context & User Hook [DEPENDS ON 1.2.1]

- **Paste:** `UserResource` structure, `UserRole` enum
- **Task:** `lib/auth.ts` with `getAuthToken()` + `getCurrentUser()` (React `cache()`). `SessionProvider`. `useSession()` hook.
- **Output:**
  - `lib/auth.ts`, `providers/SessionProvider.tsx`, `hooks/useSession.ts`, `types/auth.ts`

---

---

# PHASE 2 — Dynamic Category Field Schema System ⚠️ NEW PHASE

**Duration:** Days 6–8 (Week 1–2)
**Goal:** The field schema builder, form renderer, and validation infrastructure
**Depends on:** Phase 1
**This phase unlocks all product, batch, and stock entry forms**

---

## 2.1 Backend — Field Schema Infrastructure

### 2.1.1 Category Service & Controller

- **Paste:** `Category` model, `FieldDefinition` DTO, `FieldType` enum
- **Task:** `CategoryService` (CRUD, hierarchical tree). `CategoryController`. `CategoryResource` including full `field_schema` array.
- **Output:**
  - `app/Services/CategoryService.php`
  - `app/Http/Controllers/Api/CategoryController.php`
  - `app/Http/Resources/CategoryResource.php`
  - `routes/api/v1/categories.php`

### 2.1.2 Field Schema Validation Service ⚠️ CRITICAL

- **Paste:** `FieldType` enum, `FieldDefinition` DTO, sample field schema JSON from spec 3.1.3
- **Task:** `FieldSchemaService` with 3 methods:
  1. `validateSchema(array $schema)` — validates the schema definition itself (correct types, required key/label/label_fr, no duplicate keys)
  2. `validateAttributes(array $attributes, array $schema)` — validates a product's attribute values against a schema (type checking, required fields)
  3. `buildValidationRules(array $schema)` — returns a Laravel validation rules array for use in Form Requests
- **Output:**
  - `app/Services/FieldSchemaService.php`
  - `app/Http/Requests/UpdateCategoryFieldSchemaRequest.php`

### 2.1.3 Field Schema Unit Tests [DEPENDS ON 2.1.2]

- **Paste:** `FieldSchemaService`
- **Task:** PHPUnit tests: valid schema passes, missing `key` fails, duplicate keys fail, wrong field type fails, required attribute missing fails, optional attribute missing passes, `select` field with valid option passes.
- **Output:** `tests/Unit/Services/FieldSchemaServiceTest.php`

---

## 2.2 Frontend — Schema Builder & Dynamic Forms

### 2.2.1 Category List & Tree UI

- **Paste:** Category API response structure, `DataTable`, `PageHeader`, `ConfirmDialog`
- **Task:** Category management: indented tree, add/edit modal, delete with confirm.
- **Output:**
  - `app/[locale]/(dashboard)/categories/page.tsx`
  - `app/[locale]/(dashboard)/categories/_components/CategoryTree.tsx`
  - `app/[locale]/(dashboard)/categories/_components/CategoryModal.tsx` ('use client')
  - `app/[locale]/(dashboard)/categories/_actions.ts`

### 2.2.2 Field Schema Builder UI [DEPENDS ON 2.2.1]

- **Paste:** Field schema JSON structure from spec 3.1.3, `FieldType` enum values, `Modal` + `Input` + `Button` components
- **Task:** Visual schema builder: list current fields, "Add field" panel (type dropdown, label EN, label FR, required toggle, options for select/radio, `applies_to` toggle product/batch). Save triggers API update. Field keys immutable once saved.
- **Output:**
  - `app/[locale]/(dashboard)/categories/[id]/schema/page.tsx`
  - `app/[locale]/(dashboard)/categories/_components/FieldSchemaBuilder.tsx` ('use client')
  - `app/[locale]/(dashboard)/categories/_components/FieldConfigPanel.tsx`
  - `app/[locale]/(dashboard)/categories/_components/FieldTypeIcon.tsx`

### 2.2.3 Dynamic Form Renderer ⚠️ CRITICAL REUSABLE COMPONENT [DEPENDS ON 2.2.2]

- **Paste:** Field schema JSON structure, `Input` + `Badge` + `Card` components, sample schema with all 7 field types
- **Task:** `DynamicFieldRenderer` — takes `fields: FieldDefinition[]`, renders correct input per type, integrates with react-hook-form's `register`/`control`/`errors`. `schema-to-zod.ts` utility converts a field schema array → Zod object schema dynamically.
- **Output:**
  - `components/shared/DynamicFieldRenderer.tsx` ('use client')
  - `lib/schema-to-zod.ts` (converts FieldDefinition[] → z.object({...}))
  - `types/field-schema.ts` (TypeScript types: FieldDefinition, FieldType)
- **Used in:** Product form (Phase 3), Batch form (Phase 4)

---

---

# PHASE 3 — Product Catalogue

**Duration:** Days 9–12 (Week 2)
**Depends on:** Phase 2

---

## 3.1 Backend — Products

### 3.1.1 Product Service — Core CRUD

- **Paste:** `Product` model, `Category` model, `FieldSchemaService`
- **Task:** `ProductService`: paginated listing (filters: category, status, search, low_stock), create (validates attributes via `FieldSchemaService.validateAttributes()`), update, archive.
- **Output:**
  - `app/Services/ProductService.php`
  - `app/Http/Requests/StoreProductRequest.php` (delegates to `FieldSchemaService`)
  - `app/Http/Requests/UpdateProductRequest.php`

### 3.1.2 Product Controller & Resources

- **Paste:** `ProductService`, `ProductPolicy`
- **Task:** Thin `ProductController`. `ProductResource` with conditional financial fields by role. Embeds `CategoryResource` with field_schema.
- **Output:**
  - `app/Http/Controllers/Api/ProductController.php`
  - `app/Http/Resources/ProductResource.php`
  - `routes/api/v1/products.php`

### 3.1.3 Variants, Barcodes & Images [PARALLEL with 3.1.2]

- **Task A — Variants:** Nested `ProductVariantController` (CRUD under product). Free-form JSONB attributes.
- **Task B — Barcodes:** `BarcodeService` (Code128 + QR as SVG). Label sheet PDF (4×2 per A4). `BarcodeController`.
- **Task C — Images:** Image upload endpoint (validate MIME/size, store, return URL). Up to 5 images per product.
- **Output:**
  - `app/Http/Controllers/Api/ProductVariantController.php` + Resource
  - `app/Services/BarcodeService.php` + `BarcodeController.php` + `label_sheet.blade.php`
  - Image upload route + `UploadProductImageRequest.php`

---

## 3.2 Frontend — Products

### 3.2.1 Product List Page

- **Paste:** `ProductResource` structure, `DataTable`, `SearchInput`, `StatusBadge`, `PageHeader`
- **Task:** List with DataTable: name, SKU, category, stock, price, status. Filters: category, status, low_stock toggle. Search. Pagination.
- **Output:**
  - `app/[locale]/(dashboard)/products/page.tsx` (RSC)
  - `app/[locale]/(dashboard)/products/_components/ProductTable.tsx`
  - `app/[locale]/(dashboard)/products/_components/ProductFilters.tsx` ('use client')

### 3.2.2 Product Create / Edit Form [DEPENDS ON 2.2.3]

- **Paste:** `DynamicFieldRenderer`, `CategoryResource` with field_schema, `Input` + `Button` + `Card`
- **Task:** Product form: universal fields + dynamic section from `DynamicFieldRenderer` (product-level fields only from category schema). Category change resets dynamic fields. Server Action with Zod.
- **Output:**
  - `app/[locale]/(dashboard)/products/new/page.tsx`
  - `app/[locale]/(dashboard)/products/[id]/edit/page.tsx`
  - `app/[locale]/(dashboard)/products/_components/ProductForm.tsx` ('use client')
  - `app/[locale]/(dashboard)/products/_actions.ts`

### 3.2.3 Variants, Detail & Barcodes [DEPENDS ON 3.2.2]

- **Task A — Variants:** Variant dimension builder, auto-SKU generation, inline stock threshold per variant.
- **Task B — Detail & Barcodes:** Product detail page, barcode SVG display, print label button, image gallery.
- **Output:**
  - `app/[locale]/(dashboard)/products/_components/VariantManager.tsx`
  - `app/[locale]/(dashboard)/products/[id]/page.tsx`
  - `app/[locale]/(dashboard)/products/_components/BarcodeDisplay.tsx`

---

---

# PHASE 4 — Stock Management

**Duration:** Days 13–16 (Week 2–3)
**Depends on:** Phase 3

---

## 4.1 Backend — Stock

### 4.1.1 Stock Movement Service

- **Paste:** `StockMovement`, `Batch` models, `MovementType` enum, `FieldSchemaService`
- **Task:** `StockMovementService`: record any movement, enforce FEFO, update `batch.current_quantity` (decimal for kg), fire `StockMovementRecorded` event.
- **Output:**
  - `app/Services/StockMovementService.php`
  - `app/Events/StockMovementRecorded.php`

### 4.1.2 Batch & Stock Controllers [DEPENDS ON 4.1.1]

- **Task A — Batches:** `BatchController` (create with batch-level field validation via `FieldSchemaService`, list with expiry warnings, mark expired). `BatchService`.
- **Task B — Movements:** `StockMovementController` (entry, exit, loss, adjustment — each calls `StockMovementService`).
- **Task C — Inventory:** `InventoryController` (start session, submit counts, discrepancy report, validate → auto-adjustments). `InventoryService`.
- **Output:**
  - `app/Services/BatchService.php` + `BatchController.php` + `BatchResource.php` + `StoreBatchRequest.php`
  - `app/Http/Controllers/Api/StockMovementController.php` + form requests
  - `app/Models/InventorySession.php` + migration + `InventoryService.php` + `InventoryController.php`
  - `routes/api/v1/stock.php`

### 4.1.3 Alert Service & Jobs [PARALLEL with 4.1.2]

- **Task:** `AlertService`: low stock, zero stock, batch expiry (reads `expiry_date` from batch JSONB attributes), living product mortality alerts. Saves to `notifications`. Scheduled daily + triggered on movement.
- **Output:**
  - `app/Services/AlertService.php`
  - `app/Jobs/CheckStockAlerts.php`
  - Scheduled in `routes/console.php`

---

## 4.2 Frontend — Stock

### 4.2.1 Stock Overview Page

- **Paste:** Stock + batch API response structures, `DataTable`, `Badge`, `PageHeader`
- **Task:** Stock list: product + decimal stock level, expiry countdown badges, low-stock indicators. Filter by category / alert type.
- **Output:**
  - `app/[locale]/(dashboard)/stock/page.tsx` (RSC)
  - `app/[locale]/(dashboard)/stock/_components/StockTable.tsx`
  - `app/[locale]/(dashboard)/stock/_components/ExpiryBadge.tsx`
  - `app/[locale]/(dashboard)/stock/_components/StockLevelBar.tsx`

### 4.2.2 Stock Entry Form [DEPENDS ON 4.2.1 + 2.2.3]

- **Paste:** `BatchController` endpoints, `DynamicFieldRenderer`, product API
- **Task:** Stock entry: select product/variant, decimal quantity input (label shows "kg" for living products), create/select batch, batch-level dynamic fields via `DynamicFieldRenderer` (e.g. expiry_date for perishables).
- **Output:**
  - `app/[locale]/(dashboard)/stock/entry/page.tsx`
  - `app/[locale]/(dashboard)/stock/_components/StockEntryForm.tsx` ('use client')
  - `app/[locale]/(dashboard)/stock/_components/BatchFieldsSection.tsx`
  - `app/[locale]/(dashboard)/stock/_actions.ts`

### 4.2.3 Stock Exit, History & Inventory [DEPENDS ON 4.2.1]

- **Task A — Exit/Loss:** Exit form: decimal quantity, FEFO batch auto-selector, loss reason, confirm dialog.
- **Task B — History:** Movement history: paginated, filter by product/type/date/user.
- **Task C — Inventory:** Inventory flow: start session → count form (autofocus for scanner) → discrepancy report → confirm.
- **Output:**
  - `app/[locale]/(dashboard)/stock/exit/page.tsx` + `StockExitForm.tsx` + `LossReasonSelect.tsx`
  - `app/[locale]/(dashboard)/stock/history/page.tsx`
  - `app/[locale]/(dashboard)/stock/inventory/page.tsx` + `InventoryCountForm.tsx` + `DiscrepancyReport.tsx`

### 4.2.4 Alert Centre UI [PARALLEL with 4.2.1]

- **Task:** Notification bell in Header (polling 60s, unread count badge), dropdown with categorised alerts, mark-as-read, links to entity.
- **Output:**
  - Updated `Header.tsx`
  - `components/shared/AlertDropdown.tsx` ('use client')
  - `hooks/useAlerts.ts`

---

---

# PHASE 5 — Sales Management

**Duration:** Days 17–21 (Week 3)
**Depends on:** Phase 4

---

## 5.1 Backend — Sales Engine

### 5.1.1 Sale Service — Core Transaction

- **Paste:** `Sale`, `SaleItem` models, `StockMovementService`
- **Task:** `SaleService`: create sale, apply promotions, calculate HT/TVA/TTC, decrement stock via `StockMovementService` (FEFO, decimal kg). Fire `SaleConfirmed` event.
- **Output:**
  - `app/Services/SaleService.php`
  - `app/Events/SaleConfirmed.php`
  - `app/Listeners/DecrementStockOnSale.php` (queued)

### 5.1.2 Sale, Promotion, Credit & Return Controllers [DEPENDS ON 5.1.1]

- **Task A — Sale:** `SaleController` (create, list, show, update status, cancel). `SaleResource` + `SaleItemResource`. `StoreSaleRequest`.
- **Task B — Promotions:** `PromotionService` + `PromotionController` (CRUD, eligibility check).
- **Task C — Credits:** `CreditService` + `PaymentController` (record partial payment, list overdue). `CheckOverdueCredits` job.
- **Task D — Returns:** `ReturnService` + `ReturnController` + `SaleReturn` model (validate, choose resolution, conditional stock restore).
- **Output:** All controllers, services, resources, models, and routes for A–D

### 5.1.3 PDF Documents — All Types [DEPENDS ON 5.1.2]

- **Task:** Queued PDF generators (Invoice, Delivery Note, Credit Note). Blade templates with logo, legal mentions, TVA breakdown. Stored in `storage/documents/`.
- **Output:**
  - `app/Jobs/GenerateInvoicePdf.php` + `GenerateDeliveryNotePdf.php` + `GenerateCreditNotePdf.php`
  - `app/Services/PdfService.php`
  - 3 Blade templates
  - Routes: `GET /sales/{sale}/invoice`, `/delivery-note`, `/credit-note`

---

## 5.2 Frontend — Sales

### 5.2.1 Sales List Page

- **Paste:** `SaleResource` structure, `DataTable`, `StatusBadge`
- **Task:** Sales list: sale number, client, date, total, payment status. Filters: status, date range. Quick actions.
- **Output:**
  - `app/[locale]/(dashboard)/sales/page.tsx` (RSC)
  - `app/[locale]/(dashboard)/sales/_components/SalesTable.tsx`
  - `app/[locale]/(dashboard)/sales/_components/SaleFilters.tsx`

### 5.2.2 New Sale — Cart [DEPENDS ON 5.2.1]

- **Paste:** `stores/useSaleStore.ts` structure, Product API, `SearchInput`
- **Task:** Cart UI: debounced product search, decimal quantity input (labelled "kg" for living products), FEFO batch auto-selection, unit price display.
- **Output:**
  - `app/[locale]/(dashboard)/sales/new/page.tsx`
  - `app/[locale]/(dashboard)/sales/_components/ProductSearch.tsx` ('use client')
  - `app/[locale]/(dashboard)/sales/_components/SaleCart.tsx` + `SaleCartItem.tsx`
  - `stores/useSaleStore.ts` (Zustand)

### 5.2.3 New Sale — Client, Payment & Submit [DEPENDS ON 5.2.2]

- **Paste:** Cart store, client API, sale API
- **Task:** Client selector (search/create), payment method, discount, TVA summary, submit Server Action.
- **Output:**
  - `app/[locale]/(dashboard)/sales/_components/ClientSelector.tsx`
  - `app/[locale]/(dashboard)/sales/_components/PaymentSection.tsx`
  - `app/[locale]/(dashboard)/sales/_components/SaleSummary.tsx`
  - `app/[locale]/(dashboard)/sales/_actions.ts`

### 5.2.4 Sale Detail, Returns & Promotions [DEPENDS ON 5.2.1]

- **Task A — Detail:** Sale detail page: items, payment history, action buttons (print invoice, add payment, return).
- **Task B — Returns:** Return form: select items, reasons, resolution choice.
- **Task C — Promotions:** Promotions CRUD page.
- **Output:**
  - `app/[locale]/(dashboard)/sales/[id]/page.tsx`
  - `app/[locale]/(dashboard)/sales/_components/SaleDetail.tsx` + `AddPaymentModal.tsx`
  - `app/[locale]/(dashboard)/sales/[id]/return/page.tsx` + `ReturnForm.tsx`
  - `app/[locale]/(dashboard)/promotions/page.tsx` + `PromotionForm.tsx`

---

---

# PHASE 6 — Clients, Suppliers & Settings

**Duration:** Days 22–25 (Week 4)
**Depends on:** Phase 5

---

## 6.1 Backend [All PARALLEL]

### 6.1.1 Client & Supplier Services

- **Task A — Clients:** `ClientService` + `ClientController` (CRUD, search, summary endpoint: CA + credit + purchase count).
- **Task B — Suppliers:** `SupplierService` + `SupplierController` + `SupplierOrderController` (order lifecycle).
- **Output:** Controllers, services, resources for both

### 6.1.2 Users, Settings & VAT Controllers

- **Task A — Users:** Admin-only `UserController` (list, create, update role, soft-delete).
- **Task B — Settings:** `SettingsController` (company info, logo upload, alert thresholds). `VatRateController` (CRUD, admin only). `create_settings_table.php` migration.
- **Output:** Controllers + migration

---

## 6.2 Frontend [All PARALLEL]

### 6.2.1 Client Pages

- **Output:**
  - `app/[locale]/(dashboard)/clients/page.tsx`
  - `app/[locale]/(dashboard)/clients/[id]/page.tsx` (contact info, purchase history, credit balance)

### 6.2.2 Supplier Pages

- **Output:**
  - `app/[locale]/(dashboard)/suppliers/page.tsx`
  - `app/[locale]/(dashboard)/suppliers/[id]/page.tsx`
  - `OrderTimeline.tsx`, `ReceiveOrderForm.tsx` (triggers stock entry)

### 6.2.3 Admin Pages

- **Output:**
  - `app/[locale]/(dashboard)/admin/users/page.tsx` (user table, create modal, role dropdown)
  - `app/[locale]/(dashboard)/admin/settings/page.tsx` (company form, logo upload, VAT table, alert thresholds)
  - `app/[locale]/(dashboard)/admin/audit/page.tsx` (audit log table with old/new value diff)

### 6.2.4 i18n Completion Pass [DEPENDS ON all previous FE tasks]

- **Paste:** All frontend files collected, current `messages/en.json`
- **Task:** Audit every component for hardcoded strings. Replace with `t()` calls. Complete `messages/fr.json`. Test language switcher end-to-end.
- **Output:** Completed `messages/en.json` + `messages/fr.json`. Zero hardcoded strings.

---

---

# PHASE 7 — Dashboard & Reports

**Duration:** Days 26–29 (Week 4–5)
**Depends on:** Phases 4–6

---

## 7.1 Backend — Analytics [All PARALLEL where possible]

### 7.1.1 Dashboard Stats Service

- **Task:** `DashboardService`: CA today/week/month vs prior period, sales count, total stock value, top 5 products, alerts count, overdue credits. Redis cache 5 min, invalidated by `SaleConfirmed` + `StockMovementRecorded` listeners.
- **Output:** `app/Services/DashboardService.php` + `DashboardController.php` + invalidation listeners

### 7.1.2 Report Services [PARALLEL]

- **Task A:** `SalesReportService` (CA by period/vendor/category/client, PostgreSQL `date_trunc`)
- **Task B:** `StockReportService` (stock value by category, rotation rate, dormant products, loss report)
- **Task C:** `TvaReportService` + `CreditReportService`
- **Task D:** `StockForecastService` (avg daily consumption 30-day, days-to-stockout, reorder qty, urgency colour)
- **Output:** 5 service files + 1 combined `ReportController`

### 7.1.3 Export Service [DEPENDS ON 7.1.2]

- **Task:** `ExportService`: PDF (DomPDF) or Excel (Maatwebsite/Laravel Excel). Queued. Blade templates per report. Returns download URL.
- **Output:** `ExportService.php` + `ExportReport.php` job + Blade templates + export route

---

## 7.2 Frontend — Dashboard & Reports

### 7.2.1 Main Dashboard [DEPENDS ON 7.1.1]

- **Task:** Dashboard with streaming: KPI cards (each async RSC in `<Suspense>`), alert summary, recent sales. Skeleton fallbacks.
- **Output:**
  - `app/[locale]/(dashboard)/dashboard/page.tsx`
  - `KpiCards.tsx`, `AlertSummary.tsx`, `RecentSales.tsx` (all async RSC)
  - `components/ui/KpiCard.tsx`

### 7.2.2 Charts [DEPENDS ON 7.1.2]

- **Task:** Sales trend line chart (Recharts, dynamic, period selector via URL params). Stock value bar chart. Forecast table (urgency colour coding).
- **Output:**
  - `components/charts/SalesChart.tsx` (dynamic, 'use client')
  - `components/charts/StockValueChart.tsx` (dynamic)
  - `app/[locale]/(dashboard)/stock/forecast/page.tsx` + `ForecastTable.tsx`

### 7.2.3 Report Pages [DEPENDS ON 7.1.2 + 7.1.3]

- **Task:** 4 report pages (Sales, Stock/Loss, TVA, Credits) sharing a layout with report nav. Each: date range picker, grouping selector, summary cards, data table, export button.
- **Output:**
  - `app/[locale]/(dashboard)/reports/layout.tsx`
  - 4 report page files
  - `components/shared/ReportFilters.tsx`, `ExportButton.tsx`

---

---

# PHASE 8 — Testing

**Duration:** Days 30–33 (Week 5)

---

## 8.1 Backend Tests

### 8.1.1 Field Schema Service Tests [verify 2.1.3 is complete]

- Confirm `FieldSchemaServiceTest.php` covers all edge cases

### 8.1.2 Auth & RBAC Tests

- **Output:** `tests/Feature/Auth/AuthTest.php` (login/logout/me) + `RbacTest.php` (each role, permitted + forbidden actions)

### 8.1.3 Product, Stock & Batch Tests

- **Task A:** `ProductServiceTest` — create with dynamic attributes, invalid attribute fails validation.
- **Task B:** `StockMovementServiceTest` — FEFO selection, decimal kg quantities, event dispatch.
- **Task C:** `BatchServiceTest` — batch-level field validation, expiry date handling.

### 8.1.4 Sale, Promotion, Credit & Return Tests

- **Task:** Feature tests: sale creation (stock decremented, FEFO correct, kg decimal), promotion applied, partial payment, full return flow.
- **Output:** `CreateSaleTest.php`, `ReturnSaleTest.php`, `PromotionServiceTest.php`

### 8.1.5 Forecast & Report Tests

- **Task:** Unit tests with known fixture data: correct daily avg, correct days-to-stockout, correct TVA aggregation.

---

## 8.2 Frontend Tests

### 8.2.1 TypeScript & Lint Pass

- **Task:** `tsc --noEmit` → fix all errors. `eslint --ext .ts,.tsx` → fix all warnings. Zero tolerance.

### 8.2.2 E2E — Playwright Critical Paths

- **Task:** Tests for: login in EN + FR, create product with dynamic fields, stock entry with batch fields, create sale with kg product, print invoice, logout.
- **Output:**
  - `e2e/auth.spec.ts`, `e2e/i18n.spec.ts`
  - `e2e/product-dynamic-fields.spec.ts`
  - `e2e/stock-entry-kg.spec.ts`
  - `e2e/sale-flow.spec.ts`

---

---

# PHASE 9 — Deployment (Hostinger VPS)

**Duration:** Days 34–35 (Week 5)

---

## 9.1 Backend Deployment

### 9.1.1 Laravel Production Config for Hostinger

- **Task:** Deploy script for Hostinger VPS (Ubuntu): pull, `composer install --no-dev`, `php artisan optimize`, Supervisor for Horizon + scheduler, Nginx PHP-FPM config, Let's Encrypt SSL via Certbot.
- **Output:**
  - `deploy/backend.sh`
  - `deploy/supervisor/horizon.conf` + `scheduler.conf`
  - `deploy/nginx/api.conf` (security headers, CORS for production domain)
  - `.env.production.example`

### 9.1.2 Safe Production Migration

- **Task:** Backup DB → `migrate --force` → `ProductionSeeder` (admin user, VAT rates, default categories with field schemas).
- **Output:** `deploy/migrate-prod.sh` + `ProductionSeeder.php`

---

## 9.2 Frontend Deployment

### 9.2.1 Next.js Build & PM2 on Hostinger

- **Task:** PM2 ecosystem file, Nginx reverse proxy to Node.js (port 3000), static asset caching, CSP + HSTS security headers, image domain whitelist.
- **Output:**
  - `deploy/ecosystem.config.js` (PM2)
  - `deploy/nginx/frontend.conf`
  - `deploy/frontend.sh`
  - Updated `next.config.ts`

---

## 9.3 Health Checks

### 9.3.1 Monitoring Setup

- **Task:** `GET /api/health` endpoint (DB + Redis connectivity check). Monitor queue backlog + failed jobs. Disk space alert cron.
- **Output:** `HealthController.php` + `MonitorHealth.php` command

---

---

# Week 6 — Buffer & Polish (Days 36–42)

| Day   | Activity                                                           |
| ----- | ------------------------------------------------------------------ |
| 36–37 | Bug fixes from internal + client testing                           |
| 38    | Mobile / responsive audit pass                                     |
| 39    | Performance pass: N+1 audit, Lighthouse, query profiler            |
| 40    | i18n final review — all EN + FR strings verified                   |
| 41    | Client walkthrough + training session                              |
| 42    | Final handover: docs, credentials, GitHub access, deployment guide |

---

# Timeline Summary

| Week | Days  | Phase   | Key Deliverables                                             |
| ---- | ----- | ------- | ------------------------------------------------------------ |
| 1    | 1–3   | Phase 0 | Repos, Docker, DB schema, design system, **i18n from Day 1** |
| 1    | 4–5   | Phase 1 | Auth + full RBAC (permissions matrix implemented)            |
| 1–2  | 6–8   | Phase 2 | **Dynamic field schema system** (builder + form renderer)    |
| 2    | 9–12  | Phase 3 | Products + variants + barcodes (schema-driven forms)         |
| 2–3  | 13–16 | Phase 4 | Stock movements, kg precision, batch dynamic fields, alerts  |
| 3    | 17–21 | Phase 5 | Sales, PDF invoices, returns, credit, promotions             |
| 4    | 22–25 | Phase 6 | Clients, suppliers, admin, settings, **i18n completion**     |
| 4–5  | 26–29 | Phase 7 | Dashboard, charts, reports, forecasts, exports               |
| 5    | 30–33 | Phase 8 | Tests — field schema, RBAC, kg precision, E2E with i18n      |
| 5    | 34–35 | Phase 9 | Deploy on Hostinger VPS, Nginx, PM2, Let's Encrypt           |
| 6    | 36–42 | Buffer  | Bugs, polish, i18n review, client training, handover         |

**Target: Done by end of Day 35 ✅**

---

_Plan v1.1 — All decisions integrated. Ready to start Phase 0, Day 1._
