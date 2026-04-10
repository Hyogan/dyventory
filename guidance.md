# Dyventory — Project Guidance (Auto-generated)

**Last updated:** 2026-04-10
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

### Phase 3 — Product Catalogue 🔶 IN PROGRESS

**3.1 Backend — Products: ✅ COMPLETE**

- 3.1.1 ProductService (CRUD, filters, validates attributes via FieldSchemaService) ✅
- 3.1.2 ProductController + ProductResource (conditional financials by role) ✅
- 3.1.3 Variants, Barcodes & Images ✅

**3.2 Frontend — Products: ❌ NOT STARTED ← NEXT**

- 3.2.1 Product list page (DataTable, filters, search)
- 3.2.2 Product create/edit form (DynamicFieldRenderer for category fields)
- 3.2.3 Variants, detail page, barcodes

### Phase 4–9: Stock, Sales, Clients/Suppliers, Reports, Dashboard, Deployment — NOT STARTED

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
