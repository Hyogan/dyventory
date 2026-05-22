# Functional Specifications — Stock & Sales Management Application

**Project:** Web application for stock and sales management
**Provider:** Steve Tchingang
**Version:** 0.3 — Validated draft
**Date:** March 19, 2026
**Status:** ✅ Ready for development

---

## 1. Context & Objectives

### 1.1 Context

The client operates a business with a **highly diversified catalogue**, combining product families with radically different constraints:

- **Non-food physical products** (clothing, electronics, etc.): variant management (size, colour, model), manufacturer reference, no expiry
- **Perishable food products** (items with use-by dates): lot tracking, expiry alerts, storage conditions
- **Live/living products** (snails): mortality rate management, sale **by weight (kg)**, sanitary and conservation constraints

The **central architectural challenge** is handling this heterogeneity. The solution adopted is a **Dynamic Field Schema per category** — rather than hardcoding product types, each category carries a configurable list of custom fields that define what must be filled when creating a product in that category.

### 1.2 Objectives

| Objective                | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| **Centralisation**       | Single tool for stock, sales, clients, suppliers                  |
| **Real-time visibility** | Live stock levels, critical alerts, daily revenue                 |
| **Full traceability**    | Every stock movement, sale, and data change is permanently logged |
| **Decision support**     | Reports, trends, forecasts to anticipate stockouts                |
| **Ease of use**          | Intuitive interface suitable for non-technical users              |

---

## 2. Users, Roles & Permissions

The application is multi-user. Each employee has a personal account with a role defining their access rights.

### 2.1 Role Matrix

| Module / Action                   | Admin | Manager | Vendor | Warehouse | Accountant |
| --------------------------------- | :---: | :-----: | :----: | :-------: | :--------: |
| **Products**                      |       |         |        |           |            |
| View products                     |  ✅   |   ✅    |   ✅   |    ✅     |     —      |
| Create / Edit product             |  ✅   |   ✅    |   —    |     —     |     —      |
| Archive / Delete product          |  ✅   |   ✅    |   —    |     —     |     —      |
| Manage categories & field schemas |  ✅   |   ✅    |   —    |     —     |     —      |
| **Stock**                         |       |         |        |           |            |
| View stock levels                 |  ✅   |   ✅    |   ✅   |    ✅     |     —      |
| Record stock entry                |  ✅   |   ✅    |   —    |    ✅     |     —      |
| Record stock exit / loss          |  ✅   |   ✅    |   —    |    ✅     |     —      |
| Run inventory session             |  ✅   |   ✅    |   —    |    ✅     |     —      |
| View movement history             |  ✅   |   ✅    |   —    |    ✅     |     —      |
| **Sales**                         |       |         |        |           |            |
| View sales list                   |  ✅   |   ✅    |   ✅   |     —     |     ✅     |
| Create sale                       |  ✅   |   ✅    |   ✅   |     —     |     —      |
| Cancel sale                       |  ✅   |   ✅    |   —    |     —     |     —      |
| Process return / refund           |  ✅   |   ✅    |   —    |     —     |     —      |
| Record payment on credit sale     |  ✅   |   ✅    |   ✅   |     —     |     ✅     |
| Manage promotions                 |  ✅   |   ✅    |   —    |     —     |     —      |
| Generate invoice PDF              |  ✅   |   ✅    |   ✅   |     —     |     ✅     |
| **Clients & Suppliers**           |       |         |        |           |            |
| View clients                      |  ✅   |   ✅    |   ✅   |     —     |     ✅     |
| Create / Edit client              |  ✅   |   ✅    |   ✅   |     —     |     —      |
| View suppliers                    |  ✅   |   ✅    |   —    |    ✅     |     —      |
| Create / Edit supplier            |  ✅   |   ✅    |   —    |    ✅     |     —      |
| Manage supplier orders            |  ✅   |   ✅    |   —    |    ✅     |     —      |
| **Reports & Analytics**           |       |         |        |           |            |
| View dashboard                    |  ✅   |   ✅    |   ✅   |    ✅     |     ✅     |
| Sales reports                     |  ✅   |   ✅    |   —    |     —     |     ✅     |
| Stock reports                     |  ✅   |   ✅    |   —    |    ✅     |     —      |
| TVA / tax reports                 |  ✅   |   ✅    |   —    |     —     |     ✅     |
| Credit / debt reports             |  ✅   |   ✅    |   —    |     —     |     ✅     |
| Loss reports                      |  ✅   |   ✅    |   —    |    ✅     |     —      |
| Export to PDF / Excel             |  ✅   |   ✅    |   —    |     —     |     ✅     |
| **Administration**                |       |         |        |           |            |
| Manage users                      |  ✅   |    —    |   —    |     —     |     —      |
| Configure TVA rates               |  ✅   |    —    |   —    |     —     |     —      |
| Configure alert thresholds        |  ✅   |   ✅    |   —    |     —     |     —      |
| Configure company info / logo     |  ✅   |    —    |   —    |     —     |     —      |
| View audit trail                  |  ✅   |    —    |   —    |     —     |     —      |

---

## 3. Functional Scope

### 3.1 Dynamic Category & Field Schema System

This is the core architectural decision that replaces all hardcoded product type logic.

#### 3.1.1 How It Works

Each category has an optional **field schema** — a JSON array of field definitions. When a user creates a product in a category, the form dynamically renders those fields. The user fills in values, which are stored in the product's `attributes` JSONB column.

This means the client can, at any time, go to a category and define: _"Products in this category must also have: expiry_date (date), storage_temperature (number), lot_number (text)"_ — without any code change.

#### 3.1.2 Field Types Supported

| Field Type | UI Input       | Example Use                                |
| ---------- | -------------- | ------------------------------------------ |
| `text`     | Text input     | Brand, country of origin                   |
| `number`   | Number input   | Mortality rate %, weight per unit          |
| `date`     | Date picker    | Expiry date (DLC/DLUO)                     |
| `select`   | Dropdown       | Storage condition (Frozen/Chilled/Ambient) |
| `checkbox` | Checkbox       | Is organic, has guarantee                  |
| `radio`    | Radio group    | Selling unit (kg / piece)                  |
| `textarea` | Multiline text | Storage instructions                       |

#### 3.1.3 Field Definition Schema (stored in `categories.field_schema` JSONB)

```json
[
  {
    "key": "expiry_date",
    "label": "Expiry date (DLC)",
    "label_fr": "Date limite de consommation",
    "type": "date",
    "required": true,
    "applies_to": "batch"
  },
  {
    "key": "storage_temp",
    "label": "Storage temperature",
    "label_fr": "Température de stockage",
    "type": "select",
    "options": ["Frozen (-18°C)", "Chilled (0–4°C)", "Ambient"],
    "required": true,
    "applies_to": "product"
  },
  {
    "key": "mortality_rate",
    "label": "Estimated mortality rate (%)",
    "label_fr": "Taux de mortalité estimé (%)",
    "type": "number",
    "min": 0,
    "max": 100,
    "required": false,
    "applies_to": "product"
  }
]
```

The `applies_to` property determines whether the field appears on the **product form** or the **batch (lot) creation form** — critical for fields like expiry date that belong to a specific lot, not the product itself.

#### 3.1.4 Category Field Schema Builder (Admin UI)

- Visual drag-and-drop field builder for admins/managers
- Add field → choose type → set label (EN + FR) → configure options/validation → save
- Changes apply immediately to all new products in that category
- Existing products are not affected (their attributes remain unchanged)
- Field keys are immutable once created (renaming the label is OK, not the key)

#### 3.1.5 Pre-configured Category Examples (seeded)

| Category              | Custom Fields                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Food — Perishable** | `expiry_date` (date, batch), `lot_number` (text, batch), `storage_condition` (select, product)                       |
| **Snails (Living)**   | `mortality_rate` (number, product), `selling_unit` (radio: kg/piece → **kg** default), `origin_farm` (text, product) |
| **Clothing**          | `available_sizes` (text, product), `colour` (text, product), `brand` (text, product)                                 |
| **Electronics**       | `brand` (text, product), `warranty_months` (number, product), `serial_number` (text, product)                        |

---

### 3.2 Product Catalogue Management

#### 3.2.1 Universal Product Fields (all products)

- Name, unique SKU/reference, description
- Category (hierarchical: e.g. Food > Fresh > Snails)
- Unit of measure (piece, kg, g, litre, metre, box, etc.)
- Purchase price (excl. tax), selling price (incl. tax)
- Applicable VAT rate
- Barcode / QR code (auto-generated or manually entered)
- Product photo(s)
- Minimum stock alert threshold
- Status: active, archived

#### 3.2.2 Dynamic Category Fields

All additional fields beyond the universal set come from the category's field schema (section 3.1). No hardcoded product types.

#### 3.2.3 Product Variants

- For products with variants (e.g. clothing in different sizes/colours)
- Each variant combination = a distinct SKU with its own stock level
- Variants defined at product level (e.g. Size: S, M, L + Colour: Red, Blue)
- The system generates all SKU combinations automatically

#### 3.2.4 Barcodes & QR Codes

- Auto-generated barcode for each product and each variant SKU
- Label sheet PDF printable from the app
- Scan via barcode scanner (USB/Bluetooth) or device camera for fast product lookup

---

### 3.3 Stock Management

#### 3.3.1 Stock Movements

Every stock change is recorded as an **immutable event**. The current stock is always the sum of all movements — never a directly modified counter.

| Type                    | Trigger                                |
| ----------------------- | -------------------------------------- |
| Entry — Purchase        | Receiving a supplier order             |
| Entry — Customer return | Accepted product return                |
| Exit — Sale             | Sale confirmed                         |
| Exit — Loss / Damage    | Damaged or destroyed product           |
| Exit — Expiry           | Expired product removed                |
| Exit — Mortality        | Living product death (snails, in kg)   |
| Adjustment — Inventory  | Manual correction after physical count |

#### 3.3.2 Batch (Lot) Management

- Each stock reception creates a **batch** with receipt date, quantity, and any batch-level custom fields (e.g. expiry_date if defined in the category schema)
- Stock managed per batch using **FEFO** method (First Expired, First Out)
- System auto-suggests oldest/nearest-expiry batch when processing a sale

#### 3.3.3 Snail-Specific Stock Rules

- All snail quantities stored and displayed **in kg**
- Stock entry: enter weight in kg
- Sale: sell by kg (e.g. 2.5 kg)
- Mortality exit: enter kg lost
- Batch expiry = estimated lifespan days from reception date (from category field schema)

#### 3.3.4 Physical Inventory

- Start inventory session (freezes reference stock snapshot)
- Count products one by one (by scan or manual entry)
- Generate discrepancy report (theoretical vs counted)
- Validate → auto-creates adjustment movements

---

### 3.4 Sales Management

#### 3.4.1 Sale Creation

- Product search by name, SKU, or barcode scan
- Multi-product cart
- Client selection (existing or quick-create)
- Per-line or global discount
- Payment method: cash, mobile money, bank transfer, credit
- Auto-calculation: subtotal, discounts, VAT, total incl. tax
- Instant invoice or delivery note generation (PDF)

#### 3.4.2 Credit Sales

- Validate sale with partial or deferred payment
- Track amount due, agreed due date, partial payments
- Per-client outstanding balance
- Overdue alerts (past due date)

#### 3.4.3 Promotions & Discounts

- Date-bound promotions (start / end date)
- Types: percentage (e.g. -15%), fixed value (e.g. -500 XAF), bundle (e.g. buy 3 get 1)
- Auto-applied when conditions are met at sale time
- Full promo history per sale

#### 3.4.4 Returns & Refunds

- Return linked to original sale
- Mandatory reason (defect, wrong item, expiry, etc.)
- Resolution: cash refund, credit note, product exchange
- Auto-return to stock if resalable, otherwise logged as loss
- Full traceability back to original sale

---

### 3.5 Invoicing & Commercial Documents

- **Invoice**: auto-sequential numbering, legal mentions, itemised VAT breakdown
- **Delivery note**: quantities and descriptions only, no prices
- **Credit note**: auto-generated on refund
- **Payment receipt**: for partial cash payments
- All documents exportable as **PDF**, emailable to client
- Customisable: company logo, address, legal footer

---

### 3.6 Tax & VAT Management

- Admin-configurable VAT rates (default: 19.25% — Cameroon standard)
- VAT rate assigned per product or per category
- Auto HT / VAT / TTC calculation on all transactions
- VAT collected report per period (for tax declaration)

---

### 3.7 Alerts & Notifications

| Alert              | Trigger                               | Recipients                 |
| ------------------ | ------------------------------------- | -------------------------- |
| Low stock          | Stock ≤ minimum threshold             | Manager, Warehouse         |
| Stockout           | Stock = 0                             | Manager, Warehouse, Vendor |
| Expiry imminent    | DLC < configured threshold (days)     | Manager, Warehouse         |
| Abnormal mortality | Mortality rate > configured threshold | Manager                    |
| Overdue credit     | Payment due date exceeded             | Manager, Accountant        |

In-app notification centre (bell icon). Email notifications: v2.

---

### 3.8 Supplier Management

- Supplier profile: name, contact, address, email, phone, products supplied
- Commercial terms per supplier (lead time, minimum order)
- **Purchase orders**: create, track status (sent → confirmed → partially received → received → cancelled)
- Receiving an order → auto-creates stock entries and batches
- Supplier KPIs: average lead time, reliability, total ordered

---

### 3.9 Client Management

- Client profile: name/company, phone, email, address, type (individual, reseller, wholesaler, retailer)
- Full purchase history
- Outstanding credit balance
- Cumulative revenue per client
- Client segmentation for targeted promotions
- Free-text notes

---

### 3.10 Loss & Waste Management

- Record a loss: product, quantity (kg for snails), batch, reason, date, responsible user
- Preset reasons: accidental damage, theft, expiry, mortality (snails), deterioration
- Immediate stock impact
- Loss report per period (quantity and value)
- All losses tracked in audit trail

---

### 3.11 Dashboard & Analytics

#### 3.11.1 Main Dashboard (real-time)

- Revenue today / week / month (vs prior period)
- Number of sales today
- Total stock value
- Products at stock alert (clickable)
- Batches nearing expiry (< 7 days default)
- Overdue credits
- Recent transactions

#### 3.11.2 Reports

| Report              | Content                                                   |
| ------------------- | --------------------------------------------------------- |
| **Sales report**    | Revenue by period, vendor, category, client; gross margin |
| **Stock report**    | Stock value by category, rotation rate, dormant products  |
| **Movement report** | All entries/exits over a period, filterable               |
| **Loss report**     | Losses by reason, period, quantity and value              |
| **VAT report**      | VAT collected by rate, per period                         |
| **Credit report**   | Outstanding, recovered, overdue amounts                   |
| **Supplier report** | Purchases by supplier, amounts, lead times                |

All reports exportable to **PDF and Excel (CSV)**.

#### 3.11.3 Trends & Charts

- Revenue trend over time (week / month / quarter / year)
- Top 10 best-selling products (quantity and value)
- Slowest-moving products
- Stock evolution over time

#### 3.11.4 Stock Forecasting

Based on 30-day sales history:

- Estimated days-to-stockout per product at current consumption rate
- Suggested reorder quantity to cover X days
- Colour-coded urgency (red < 7 days, orange 7–14, green > 14)

---

### 3.12 Audit Trail

Every sensitive action is permanently logged (immutable — no delete interface).

Logged per event: who, what action, on which entity, when, from which IP, old values, new values.

Accessible to Administrator only, with filters by user, entity type, and date range.

---

## 4. Technical Constraints

### 4.1 Technology Stack

| Component      | Technology                    | Version          |
| -------------- | ----------------------------- | ---------------- |
| Frontend       | Next.js + React               | 15.x + React 19  |
| Backend / API  | Laravel                       | ^12.0 (PHP 8.2+) |
| Database       | PostgreSQL                    | 16+              |
| Authentication | Laravel Sanctum               | ^4.0             |
| Styling        | Tailwind CSS                  | v4.x             |
| PDF Generation | DomPDF (Laravel)              | latest           |
| Barcode        | `milon/barcode` + `jsbarcode` | latest           |
| Queue / Cache  | Redis + Laravel Horizon       | latest           |
| Hosting        | Hostinger VPS                 | Existing server  |
| Versioning     | Git — GitHub                  | Feature branches |

### 4.2 Internationalisation (i18n)

- **Primary language: English** (code, UI, all default labels)
- **Second language: French** (full translation included from Day 1)
- Frontend: `next-intl` library, locale files in `messages/en.json` + `messages/fr.json`
- Backend: Laravel `lang/en/` + `lang/fr/` translation files for all user-facing strings
- Category field schemas carry both `label` (EN) and `label_fr` (FR) on each field
- Language toggle available in the user interface
- **Architecture rule:** No hardcoded French strings anywhere in the codebase — all text via translation keys

### 4.3 Data Model — Key Points

```
categories
  id, name, slug, parent_id (self-reference, nullable)
  field_schema (JSONB) ← array of field definitions
  created_at, updated_at

products
  id, sku (unique), name, description
  category_id → categories
  unit_of_measure
  price_buy_ht, price_sell_ttc, vat_rate_id → vat_rates
  stock_alert_threshold, barcode
  attributes (JSONB) ← values for product-level category fields
  has_variants (boolean)
  status (active | archived)
  timestamps

product_variants
  id, product_id → products
  sku_variant (unique)
  attributes_variant (JSONB) ← e.g. {"size": "M", "colour": "Red"}
  stock_alert_threshold

batches (lots)
  id, product_id, variant_id (nullable)
  batch_number, received_at
  attributes (JSONB) ← values for batch-level category fields (e.g. expiry_date)
  initial_quantity, current_quantity (in kg for living products)
  supplier_id → suppliers

stock_movements
  id, product_id, variant_id (nullable), batch_id (nullable)
  type (in_purchase | in_return | out_sale | out_loss | out_expiry | out_mortality | adjustment)
  quantity (positive = entry, negative = exit)
  reference_id, reference_type (polymorphic)
  user_id → users, created_at, notes

sales / sale_items / clients / suppliers / audit_logs
  → see previous versions, unchanged
```

### 4.4 Security

- Authentication required on all routes (no public access)
- JWT tokens with configurable expiry + refresh, stored in httpOnly cookies
- RBAC enforced on every API endpoint via Laravel Policies
- Strict server-side validation (Laravel Form Requests)
- CSRF protection, rate limiting on sensitive endpoints
- bcrypt password hashing
- HTTPS mandatory in production (Hostinger VPS with Let's Encrypt)
- Audit logs are write-only — no deletion interface

### 4.5 Performance

- Systematic pagination (max 50 items/page)
- Index all frequently filtered columns
- Current stock computed via cached aggregation (invalidated on each movement)
- Redis cache for expensive reports (5-minute TTL)
- All PDF generation queued (never inline)

### 4.6 User Interface

- Web application, **desktop-first**, readable on mobile
- Primary language: **English**, with full French translation switchable
- Professional and functional design
- Immediate feedback on every action (toasts, loading states)
- Clear error messages (human-readable, never raw technical errors)
- All lists are filterable, sortable, and searchable

---

## 5. Deliverables

| Deliverable              | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| **Source code**          | Separate Git repos (frontend / backend), clean history       |
| **Deployed application** | Functional URL on Hostinger VPS with demo data               |
| **Database schema**      | ERD diagram + Laravel migration files                        |
| **API documentation**    | Postman collection or Swagger/OpenAPI                        |
| **User documentation**   | Guide per role (Vendor, Warehouse, Manager, Admin) — EN + FR |
| **Deployment guide**     | Step-by-step for the Hostinger VPS environment               |

---

## 6. Open Questions (to resolve before Week 2)

- [ ] Does the client have a company **logo** for invoices?
- [ ] Does she have a professional **email address** for alert notifications?
- [ ] Is there **existing stock data** to import at launch?
- [ ] **POS module**: does she need a checkout-style interface or back-office only?
- [ ] Is a **barcode scanner** (USB/Bluetooth douchette) available or using phone camera?

---

## 7. Out of Scope — v1

- Native mobile application (iOS / Android)
- Advanced accounting / financial statements
- Third-party integrations (e-commerce, ERP, banking APIs)
- SMS notifications
- Offline mode / PWA
- Multi-currency support
- HR / payroll module
- Multi-warehouse management

---

_Document version 0.3 — Validated. Development may start._
_Next step: Phase 0 setup → Phase 1 authentication._
