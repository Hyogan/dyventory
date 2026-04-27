# Dyventory — Manual Testing Guide

## Table of Contents

1. [Introduction](#1-introduction)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Core User Flows](#3-core-user-flows)
4. [Feature Testing](#4-feature-testing)
5. [Edge Cases & Negative Testing](#5-edge-cases--negative-testing)
6. [UI/UX Validation](#6-uiux-validation)
7. [Bug Reporting Guidelines](#7-bug-reporting-guidelines)
8. [Testing Checklist](#8-testing-checklist)

---

## 1. Introduction

### What is Dyventory?

Dyventory is a full-stack **Inventory and Sales Management System** built for businesses with diverse product catalogs. It handles:

- **Perishable goods** — expiry dates, batch tracking (FEFO: First Expired First Out)
- **Non-food products** — variants, SKUs, barcodes
- **Living products** — weight-based stock, mortality tracking

Key capabilities include product management with dynamic category attributes, stock movements, a complete sales lifecycle (draft → confirmed → delivered), credit tracking, VAT/TVA reporting, promotions, and a full admin panel with audit logging.

### Objective of Testing

The goal of this guide is to verify that:

- All user-facing features work correctly across the 5 user roles
- Data flows correctly between forms, lists, and detail views
- Error states are handled gracefully
- The UI is consistent, accessible, and responsive

---

## 2. Test Environment Setup

### Accessing the Application

| Item | Details |
|------|---------|
| **URL** | `http://localhost:3000` (local dev) or the deployed URL provided by the team |
| **API** | `http://localhost:8000` (backend, not accessed directly) |
| **Language** | Available in English (`/en/`) and French (`/fr/`) |

### Starting the Application Locally

If the app is not already running, the team should start it using:

```
docker compose up
```

Wait until both the `dyventory-web` and `dyventory-api` containers are healthy.

### Test Accounts

Request the following accounts from the administrator before testing. Each role has a different permission set.

| Role | Typical Email | Access Level |
|------|--------------|-------------|
| **Admin** | admin@test.com | Full access to everything |
| **Manager** | manager@test.com | Products, stock, sales, clients, reports, settings |
| **Vendor** | vendor@test.com | Products, stock, sales, clients, dashboard |
| **Warehouse** | warehouse@test.com | Products, stock, suppliers, reports, dashboard |
| **Accountant** | accountant@test.com | Sales, payments, clients, reports |

### Supported Browsers

| Browser | Minimum Version |
|---------|----------------|
| Google Chrome | 120+ |
| Mozilla Firefox | 120+ |
| Microsoft Edge | 120+ |
| Safari | 17+ |

### Supported Devices

- Desktop (1280px and above)
- Tablet (768px — 1279px)
- Mobile (375px — 767px)

---

## 3. Core User Flows

### Flow 1 — Login

**Steps:**

1. Open the application URL in a browser.
2. Verify you are redirected to `/en/login` (or `/fr/login`).
3. Enter a valid email address in the **Email** field.
4. Enter the correct password in the **Password** field.
5. Click the **Login** button.

**Expected result:** You are redirected to the **Dashboard** (`/en/dashboard`). The sidebar shows navigation items appropriate for your role.

---

### Flow 2 — Logout

**Steps:**

1. Click your user avatar or name in the top-right corner of the header.
2. A dropdown menu appears with your name, role, and a **Logout** option.
3. Click **Logout**.

**Expected result:** You are immediately redirected to the login page. Returning to any protected URL (e.g., `/en/dashboard`) redirects you back to login.

---

### Flow 3 — Create a Product

**Pre-condition:** Logged in as Admin or Manager. At least one category and one VAT rate must exist.

**Steps:**

1. Click **Products** in the left sidebar.
2. Click the **New Product** (or **+ Add**) button.
3. Fill in the **Name** field (required).
4. Select a **Category** from the dropdown.
5. Select a **VAT Rate** from the dropdown.
6. Fill in optional fields: SKU, Description, Barcode, Alert Threshold.
7. Enter **Buy Price (HT)** and **Sell Price (TTC)**.
8. If the category has custom fields, fill them in (these appear dynamically below the standard fields).
9. Click **Save** (or **Create**).

**Expected result:** You are redirected to the product detail page. The new product appears in the products list. All entered values are correctly displayed.

---

### Flow 4 — Create a Sale (Full Lifecycle)

**Pre-condition:** Logged in as Admin, Manager, or Vendor. At least one product with available stock must exist.

#### Step A — Create a Draft Sale

1. Click **Sales** in the sidebar.
2. Click **New Sale**.
3. Optionally, search and select a **Client**.
4. Click **Add Item**.
5. Search for a product, select it.
6. Enter the quantity and verify the unit price.
7. Optionally add a discount percentage.
8. Repeat for additional items.
9. Select a **Payment Method**.
10. Click **Save as Draft**.

**Expected result:** Sale is created with status **Draft**. Stock is NOT decremented yet.

#### Step B — Confirm the Sale

1. Open the draft sale from the sales list.
2. Click **Confirm**.

**Expected result:** Sale status changes to **Confirmed**. Stock is decremented for each item. A confirmation toast/notification appears.

#### Step C — Mark as Delivered

1. From the confirmed sale detail page, click **Mark as Delivered**.

**Expected result:** Sale status changes to **Delivered**.

---

### Flow 5 — Process a Stock Entry

**Pre-condition:** Logged in as Admin, Manager, Vendor, or Warehouse.

**Steps:**

1. Click **Stock** in the sidebar.
2. Click **Stock Entry** (or navigate to `/stock/entry`).
3. Select the product from the dropdown.
4. Select the movement type: **Purchase** or **Return**.
5. Enter the quantity received.
6. Optionally assign a **Batch/Lot** number and expiry date.
7. Add notes if needed.
8. Click **Submit**.

**Expected result:** A stock movement record is created. The product's available stock increases by the entered quantity. The movement appears in Stock History.

---

### Flow 6 — Run a Report

**Pre-condition:** Logged in as any role that has report access.

**Steps:**

1. Click **Reports** in the sidebar.
2. Click on **Sales** (or Stock, TVA, Credits).
3. Select a **period** using the date range filter.
4. The report loads automatically.
5. Click **Export** (if available) to download an Excel/CSV file.

**Expected result:** The report displays data matching the selected period. The exported file opens correctly in a spreadsheet application.

---

## 4. Feature Testing

### 4.1 Authentication

#### 4.1.1 Login

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Visit `/en/login` without being logged in | Login form is displayed |
| 2 | Log in with valid credentials | Redirected to Dashboard |
| 3 | Log in with invalid password | Error message displayed: "Invalid credentials" (or similar) |
| 4 | Log in with an email that does not exist | Error message displayed |
| 5 | Submit the form with empty fields | Validation errors shown on both fields |
| 6 | Log out and click browser Back button | Redirected to login, not to the previous page |

#### 4.1.2 Role-Based Access

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Log in as Vendor, navigate to `/en/admin` | Access denied or redirect to Dashboard |
| 2 | Log in as Accountant, check sidebar | Admin, Stock (entry/exit), Suppliers should not be visible |
| 3 | Log in as Admin | All sidebar items are visible |
| 4 | Log in as Warehouse, try to access `/en/sales/new` | Access denied or redirect |

---

### 4.2 Dashboard

**Steps:**

1. Log in as any role.
2. Navigate to the Dashboard.

| # | Element | Expected Result |
|---|---------|----------------|
| 1 | KPI cards | Revenue (today, this week, this month), alert count, stock value — all display numeric values |
| 2 | Top Products widget | Shows a list of top 5 selling products with revenue |
| 3 | Recent Sales widget | Shows last 10 sales with status badges, amounts, and client names |
| 4 | Notification bell | Shows unread count badge if there are unread notifications |
| 5 | Click a product in Top Products | Navigates to the product detail page |
| 6 | Click a sale in Recent Sales | Navigates to the sale detail page |

---

### 4.3 Products

#### 4.3.1 Product List

1. Navigate to **Products**.

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | View the list | Products displayed in a paginated table with Name, SKU, Category, Price, Stock, Status columns |
| 2 | Search by name | List filters in real-time or on submit |
| 3 | Filter by Category | Only products in that category are shown |
| 4 | Filter by Status (active/archived) | List updates accordingly |
| 5 | Filter by Low Stock | Only products at or below alert threshold are shown |
| 6 | Click a product row | Navigates to the product detail page |
| 7 | Paginate | Next/previous page loads correctly |

#### 4.3.2 Create Product

1. Click **New Product**.
2. Fill in the form with valid data.
3. Select a category that has custom fields.

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | Category with custom fields selected | Dynamic fields appear below standard fields |
| 2 | Toggle "Has Variants" to ON | Variant manager section appears |
| 3 | Submit with all required fields | Product created, redirected to detail page |
| 4 | Submit with missing Name | Validation error on Name field |
| 5 | Submit with missing Category | Validation error on Category field |

#### 4.3.3 Edit Product

1. From the product detail page, click **Edit**.
2. Change the product name.
3. Click **Save**.

**Expected result:** Changes are saved. Product detail page shows the updated name.

#### 4.3.4 Archive & Restore Product

1. From the product list, click the action menu on a product.
2. Click **Archive**.
3. Confirm the dialog.

**Expected result:** Product status changes to Archived. It disappears from the default active list.

4. Switch filter to **Archived**.
5. Find the product and click **Restore**.

**Expected result:** Product status returns to Active.

#### 4.3.5 Barcode & Label

1. Open a product detail page.
2. Click **Barcode** or **Generate Barcode**.
3. Click **Label Sheet** (PDF download).

**Expected result:** Barcode SVG is displayed. PDF label sheet downloads successfully.

#### 4.3.6 Product Images

1. Open a product detail page.
2. Click **Upload Image** or the image gallery area.
3. Select an image file (JPG or PNG).

**Expected result:** Image is uploaded and appears in the product gallery.

---

### 4.4 Categories

#### 4.4.1 Category List

1. Navigate to **Categories**.

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | View list | Categories displayed in a tree/hierarchical view |
| 2 | Expand a parent category | Child categories are shown |

#### 4.4.2 Create Category

1. Click **New Category**.
2. Enter a name.
3. Optionally select a parent category.
4. Click **Save**.

**Expected result:** Category appears in the list. It is available in the Product form's category dropdown.

#### 4.4.3 Custom Field Schema Builder

1. Click **Edit** on a category.
2. In the **Custom Fields** (Field Schema) section, click **Add Field**.
3. Configure:
   - Field name (e.g., "Color")
   - Field type (e.g., "select")
   - Options (if applicable)
4. Save the category.
5. Create or edit a product in this category.

**Expected result:** The custom field "Color" appears in the product form with the correct input type.

---

### 4.5 Stock

#### 4.5.1 Stock Entry

1. Navigate to **Stock > Stock Entry**.
2. Select a product.
3. Choose type: **Purchase**.
4. Enter quantity: `50`.
5. Set a batch number and expiry date (for perishable products).
6. Submit.

**Expected result:** Stock movement created with type `in_purchase`. Product stock increases by 50. Movement visible in Stock History.

#### 4.5.2 Stock Exit

1. Navigate to **Stock > Stock Exit**.
2. Select a product.
3. Choose type: **Loss**.
4. Enter quantity: `5`.
5. Submit.

**Expected result:** Stock movement created with type `out_loss`. Product stock decreases by 5. Movement visible in Stock History.

#### 4.5.3 Stock History

1. Navigate to **Stock > History**.
2. Filter by a specific product.
3. Filter by date range.
4. Filter by movement type.

**Expected result:** Only movements matching all selected filters are displayed.

#### 4.5.4 Physical Inventory Session

1. Navigate to **Stock > Inventory**.
2. Click **Start Inventory**.
3. An inventory session is created.
4. For each product in the session, enter the physically counted quantity.
5. Click **View Discrepancies** to compare counted vs system stock.
6. Click **Validate** to apply the adjustments.

**Expected result:** After validation, stock quantities are adjusted to match physical counts. The session status changes to Validated.

**Alternative:** Click **Cancel** instead of Validate.

**Expected result:** Session is cancelled. No stock adjustments are made.

---

### 4.6 Sales

#### 4.6.1 Sales List

1. Navigate to **Sales**.

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | View list | Sales displayed with ID, Client, Date, Status, Total, Payment Status |
| 2 | Filter by Status | Only sales with that status appear |
| 3 | Filter by Payment Status | Only sales with that payment status appear |
| 4 | Filter by Date Range | Sales outside the range are excluded |
| 5 | Search | List filters by sale ID or client name |

#### 4.6.2 Create and Confirm Sale

Covered in Flow 4. Additional checks:

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | Add item with quantity exceeding stock | Warning shown or submission blocked |
| 2 | Apply discount > 100% | Validation error |
| 3 | Set credit payment with no client selected | Validation error requiring a client |
| 4 | Partial payment on credit sale | Sale payment status shows "Partial" |

#### 4.6.3 Add Payment to Credit Sale

1. Open a confirmed or delivered sale with payment status Partial or Pending.
2. Click **Add Payment**.
3. Enter the payment amount and method.
4. Submit.

**Expected result:** Payment recorded. If total payments now equal the total amount, payment status changes to **Paid**.

#### 4.6.4 Process a Return

1. Open a delivered sale.
2. Click **Return**.
3. Select items to return and quantities.
4. Submit.

**Expected result:** A return record is created. Stock is restored for returned quantities.

---

### 4.7 Clients

#### 4.7.1 Client List

1. Navigate to **Clients**.

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | View list | Clients shown with name, type, total sales, revenue, balance |
| 2 | Search by name | List filters correctly |
| 3 | Filter by type | Only clients of that type appear |

#### 4.7.2 Create Client

1. Click **New Client** (or the + button).
2. Fill in:
   - Name (required)
   - Email (optional)
   - Phone (optional)
   - Type (individual, company, reseller, wholesaler, retailer)
   - Credit Limit
3. Click **Save**.

**Expected result:** Client appears in the list. Client is available for selection in the Sale form.

#### 4.7.3 View Client Detail

1. Click on a client name in the list.

**Expected result:** Client detail page shows:
- Profile information
- Summary (total sales count, total revenue, outstanding balance)
- Sales history

#### 4.7.4 Edit and Delete Client

1. Click **Edit** on a client.
2. Update the phone number.
3. Click **Save**.

**Expected result:** Phone number updated on the detail page.

---

### 4.8 Suppliers

#### 4.8.1 Supplier List

1. Navigate to **Suppliers**.

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | View list | Suppliers shown in a table |
| 2 | Click a supplier | Navigates to supplier detail |

#### 4.8.2 Create and Edit Supplier

1. Click **New Supplier**.
2. Fill in name and contact details.
3. Click **Save**.

**Expected result:** Supplier created and visible in the list.

#### 4.8.3 Supplier Orders Lifecycle

1. Open a supplier's detail page.
2. Click **New Order**.
3. Add products and quantities.
4. Click **Save** (order is created in draft).
5. Click **Send** to mark the order as sent.
6. Click **Confirm** to confirm receipt acknowledgment.
7. Click **Receive** to mark goods as received.

**Expected result:** Order status progresses: Draft → Sent → Confirmed → Received.

---

### 4.9 Promotions

**Pre-condition:** Logged in as Admin or Manager.

1. Navigate to **Promotions**.
2. Click **New Promotion**.
3. Fill in:
   - Name
   - Type (percentage, fixed, bundle)
   - Value/discount
   - Conditions (applicable categories or products, minimum quantity)
   - Start and end dates
4. Click **Save**.

**Expected result:** Promotion appears in the list with status Active or Scheduled.

5. Edit a promotion.
6. Delete a promotion (confirm the dialog).

**Expected result:** After deletion, promotion no longer appears in the list.

---

### 4.10 Reports

#### 4.10.1 Sales Reports

1. Navigate to **Reports > Sales**.
2. For each sub-report (Summary, By Period, By Vendor, By Category, By Client, By Payment Method):
   - Select a date range.
   - Verify the report loads without errors.
   - Verify the data looks plausible (non-zero if sales exist in the period).

#### 4.10.2 Stock Reports

1. Navigate to **Reports > Stock**.
2. Check each sub-report:
   - **Value by Category** — shows stock value grouped by category
   - **Losses** — shows products written off
   - **Dormant** — shows products with no movement
   - **Rotation** — shows turnover rate
   - **Forecast** — shows estimated days until stockout

#### 4.10.3 TVA Reports

1. Navigate to **Reports > TVA**.
2. Select a date range.
3. Verify summary, by-period, and by-rate views load correctly.

#### 4.10.4 Credit Reports

1. Navigate to **Reports > Credits**.
2. Check: Summary, By Client, Overdue, Collected.

#### 4.10.5 Export

1. From any report view that shows an **Export** button, click it.
2. Choose Excel or CSV if prompted.

**Expected result:** File downloads automatically. File opens in a spreadsheet app with correct column headers and data rows.

---

### 4.11 Admin — User Management

**Pre-condition:** Logged in as Admin.

1. Navigate to **Admin > Users**.

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | View list | All users shown with name, email, role, status |
| 2 | Create new user | Fill name, email, password, role → Save → User appears in list |
| 3 | Edit user | Change role → Save → Role updated in list |
| 4 | Soft-delete user | User is deactivated but still visible (greyed out or in an "Inactive" filter) |
| 5 | Restore deleted user | User becomes active again |

---

### 4.12 Admin — Audit Log

1. Navigate to **Admin > Audit Log**.

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | View logs | Entries shown with date, user, action, entity type, entity ID |
| 2 | Filter by date range | Only logs in range shown |
| 3 | Filter by user | Only that user's actions shown |
| 4 | Filter by action type | Only that action type shown |
| 5 | Click a log entry | Shows old values and new values (what changed) |

---

### 4.13 Admin — Settings

1. Navigate to **Admin > Settings**.
2. Update the company name.
3. Upload a company logo image.
4. Click **Save**.

**Expected result:** Settings saved. The new logo appears in the header or footer (if applicable).

---

### 4.14 Notifications

1. Generate an event that triggers a notification (e.g., a product going below alert threshold).
2. Click the **bell icon** in the header.

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | Bell shows unread count | Badge number matches unread notifications |
| 2 | Click a notification | Navigates to the relevant page |
| 3 | Click "Mark all as read" | Badge disappears or shows 0 |

---

### 4.15 Language Switcher

1. Click the language selector in the header (EN / FR).
2. Switch from English to French.

**Expected result:** All UI text, labels, and navigation items change to French. The URL prefix changes from `/en/` to `/fr/`. Switch back to English — everything returns to English.

---

## 5. Edge Cases & Negative Testing

### 5.1 Invalid Inputs

| # | Scenario | Steps | Expected Result |
|---|----------|-------|----------------|
| 1 | Login with empty email | Submit login form with email blank | "Email is required" error shown |
| 2 | Login with invalid email format | Enter "notanemail" | "Invalid email" error shown |
| 3 | Product price negative | Enter `-10` in sell price | Validation error shown |
| 4 | Stock quantity zero | Enter `0` in stock entry quantity | Validation error: quantity must be positive |
| 5 | Stock quantity non-numeric | Enter `abc` in quantity field | Input rejected or validation error shown |
| 6 | Sale discount > 100% | Enter `150` in discount field | Validation error |
| 7 | Client email invalid format | Enter "bademail" in client form | Validation error on email field |
| 8 | Credit limit negative | Enter `-500` in credit limit | Validation error |
| 9 | Promotion end date before start date | Set end date earlier than start date | Validation error |
| 10 | Category custom field name empty | Add a custom field, leave name blank | Validation error on field name |

### 5.2 Empty States

| # | Scenario | Expected Result |
|---|----------|----------------|
| 1 | Products list with no products | Friendly empty state message: "No products found" |
| 2 | Sales list with no sales | Empty state message shown |
| 3 | Client with no sales history | Detail page shows "No sales" in the history section |
| 4 | Reports with no data in period | Chart or table shows empty state, not a crash |
| 5 | Stock history with no movements | Empty state message shown |
| 6 | Notifications with none unread | Bell has no badge; dropdown shows "No notifications" |

### 5.3 Boundary & Overflow

| # | Scenario | Expected Result |
|---|----------|----------------|
| 1 | Product name at maximum length (255 chars) | Accepted and saved |
| 2 | Product name exceeding 255 chars | Validation error or input truncated |
| 3 | Description with 5000 characters | Accepted and saved |
| 4 | Large quantity in stock entry (e.g., 999999) | Accepted if valid, or boundary error shown |
| 5 | Sale with 50 line items | All items saved and displayed |

### 5.4 Destructive Actions

| # | Scenario | Expected Result |
|---|----------|----------------|
| 1 | Archive a product | Confirmation dialog appears before archiving |
| 2 | Cancel a confirmed sale | Confirmation dialog appears; after cancel, sale status = Cancelled |
| 3 | Delete a user | Confirmation dialog appears |
| 4 | Cancel an inventory session | Confirmation dialog appears; no stock adjustments made |
| 5 | Delete a promotion | Confirmation dialog appears; promotion removed from list |

### 5.5 Concurrent / Navigation Edge Cases

| # | Scenario | Expected Result |
|---|----------|----------------|
| 1 | Open a product form, navigate away without saving | If form is dirty, warn user about unsaved changes (if implemented) |
| 2 | Submit a form twice quickly (double-click Save) | Only one record is created; button is disabled after first click |
| 3 | Open an edit form, another user deletes the record, then save | Graceful error shown (e.g., "Record not found"), not a crash |
| 4 | Session expires while filling a form | Redirected to login; form data is not silently lost |

### 5.6 Unauthorized Access

| # | Scenario | Expected Result |
|---|----------|----------------|
| 1 | Vendor navigates to `/en/admin/users` directly | Redirected to dashboard or "Access Denied" page |
| 2 | Accountant navigates to `/en/stock/entry` | Redirected or access denied |
| 3 | Non-admin accesses `/en/admin/audit` | Access denied |

---

## 6. UI/UX Validation

### 6.1 Layout Consistency

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | Sidebar visible on all protected pages | Sidebar always present on desktop views |
| 2 | Active sidebar item highlighted | Current page's sidebar item has a distinct active style |
| 3 | Header present on all pages | Logo, notification bell, and user avatar always visible |
| 4 | Page titles match content | Each page has a clear heading matching the navigation |
| 5 | Breadcrumbs (if present) accurate | Breadcrumb path reflects actual navigation depth |
| 6 | Status badges | Consistent color coding: green = active/delivered, yellow = draft/pending, red = cancelled/overdue |

### 6.2 Responsiveness

For each view (Products, Sales, Clients, Stock History):

**Desktop (1280px+):**
- Full table visible with all columns
- Sidebar fully expanded
- Forms displayed in a wide layout

**Tablet (768px — 1279px):**
- Sidebar may collapse to icons or hamburger
- Tables may hide non-essential columns
- Forms adapt to narrower width

**Mobile (375px — 767px):**
- Sidebar accessible via hamburger menu
- Tables become scrollable horizontally or collapse to card view
- Buttons and inputs large enough to tap comfortably
- No text overflows its container

### 6.3 Forms & Input States

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | Required fields | Marked with an asterisk (*) or label "Required" |
| 2 | Focused input | Visible focus ring or highlight around the input |
| 3 | Validation error | Error message appears below the field, field border turns red |
| 4 | Successful submission | Form closes or redirects; a success toast/notification appears |
| 5 | Dropdown search | Typing in a select/combobox filters the options list |
| 6 | Date pickers | Calendar opens on click; selected date displayed clearly |

### 6.4 Loading States

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Navigate to any list page | Loading spinner or skeleton shown while data loads |
| 2 | Submit a form | Button shows loading state (spinner or disabled) during request |
| 3 | Load a report | Loading indicator shown until data is ready |
| 4 | Upload an image | Upload progress or spinner shown |

### 6.5 Toast & Feedback Messages

| # | Trigger | Expected Result |
|---|---------|----------------|
| 1 | Successful creation | Green success toast: "Product created successfully" (or similar) |
| 2 | Successful update | Green success toast |
| 3 | Successful deletion | Green success toast |
| 4 | Server error | Red error toast with a meaningful message |
| 5 | Network error | Error message prompting retry or informing the user |

### 6.6 Accessibility

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | Tab navigation | All interactive elements reachable via Tab key in logical order |
| 2 | Form submit on Enter | Pressing Enter in a form field submits the form (where expected) |
| 3 | Modal focus trap | While a modal is open, Tab key stays within the modal |
| 4 | Close modal on Escape | Pressing Escape closes any open modal or dialog |
| 5 | Image alt text | Product images have descriptive alt text |

---

## 7. Bug Reporting Guidelines

When you find an issue during testing, report it with the following structure. Each bug report should be self-contained and reproducible.

### Where to Report

Submit bugs in the project's issue tracker (GitHub Issues, Linear, Jira, or as specified by the team).

### Required Fields

**1. Title**
A short, specific summary.
> Example: "Product form does not validate empty Name on submit"

**2. Environment**
- Browser and version (e.g., Chrome 125)
- Operating system (e.g., Windows 11, macOS 14)
- Device type (Desktop / Tablet / Mobile)
- URL of the affected page
- Logged-in role (e.g., Admin, Vendor)
- Language setting (EN / FR)

**3. Steps to Reproduce**
Numbered steps that reliably reproduce the bug.

> Example:
> 1. Log in as Admin.
> 2. Navigate to Products > New Product.
> 3. Leave the Name field empty.
> 4. Fill in all other required fields.
> 5. Click Save.

**4. Expected Result**
What should happen.
> "A validation error should appear on the Name field."

**5. Actual Result**
What actually happened.
> "The form submits without error and a product with an empty name is created."

**6. Severity**

| Level | Description |
|-------|-------------|
| Critical | App crash, data loss, security issue, login failure |
| High | Core feature broken, blocking workflow |
| Medium | Feature partially broken, workaround exists |
| Low | Visual glitch, typo, minor UX issue |

**7. Attachments**
- Screenshot of the issue
- Screen recording (if the issue is timing-dependent)
- Browser console errors (open DevTools → Console tab, copy errors)
- Network errors (open DevTools → Network tab, note failed requests)

### Bug Report Template

```
**Title:** [Short description]

**Severity:** Critical / High / Medium / Low

**Environment:**
- Browser: 
- OS: 
- Device: 
- URL: 
- Role: 
- Language: 

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Attachments:**
[Screenshots / recording / console errors]
```

---

## 8. Testing Checklist

Use this checklist to confirm complete coverage before sign-off.

### Authentication
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] Login form validates empty fields
- [ ] Logout redirects to login page
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based sidebar items are correctly hidden/shown
- [ ] Unauthorized direct URL access is blocked

### Dashboard
- [ ] KPI cards display correct values
- [ ] Top Products widget loads
- [ ] Recent Sales widget loads
- [ ] Notification bell shows unread count
- [ ] Clicking notification navigates correctly

### Products
- [ ] Product list loads and paginates
- [ ] Search and filters work
- [ ] Create product with required fields
- [ ] Dynamic category fields render and save
- [ ] Edit product saves changes
- [ ] Archive and restore product
- [ ] Image upload works
- [ ] Barcode and label PDF generate

### Categories
- [ ] Category list shows hierarchy
- [ ] Create category
- [ ] Edit category with custom field schema builder
- [ ] Custom fields appear in product form

### Stock
- [ ] Stock entry (purchase) increases stock
- [ ] Stock exit (loss) decreases stock
- [ ] Stock history filters work
- [ ] Physical inventory session: start, count, discrepancies, validate
- [ ] Inventory session cancel produces no adjustments

### Sales
- [ ] Sales list loads with filters
- [ ] Create draft sale
- [ ] Confirm sale (stock decremented)
- [ ] Mark sale as delivered
- [ ] Cancel sale
- [ ] Add payment to credit sale
- [ ] Payment status updates to Paid when fully paid
- [ ] Process return — stock restored

### Clients
- [ ] Client list loads
- [ ] Create client
- [ ] Edit client
- [ ] Client detail shows history and balance
- [ ] Client searchable in sale form

### Suppliers
- [ ] Supplier list loads
- [ ] Create supplier
- [ ] Supplier order lifecycle (draft → sent → confirmed → received)

### Promotions
- [ ] Promotion list loads
- [ ] Create promotion with conditions
- [ ] Edit promotion
- [ ] Delete promotion

### Reports
- [ ] Sales summary loads for selected period
- [ ] Sales by period, vendor, category, client, payment method all load
- [ ] Stock value, losses, dormant, rotation, forecast all load
- [ ] TVA summary, by period, by rate all load
- [ ] Credit summary, by client, overdue, collected all load
- [ ] Export downloads valid file

### Admin
- [ ] User list loads
- [ ] Create user with role
- [ ] Edit user role
- [ ] Soft-delete and restore user
- [ ] Audit log loads and filters work
- [ ] Audit log shows old/new values on click
- [ ] Settings save company name and logo

### Notifications
- [ ] Bell shows unread count
- [ ] Clicking notification navigates to relevant page
- [ ] Mark all as read clears badge

### Language
- [ ] Switch to French — all UI text changes
- [ ] Switch back to English — UI returns to English

### Edge Cases
- [ ] Empty states shown when lists have no data
- [ ] Validation errors shown on required fields
- [ ] Invalid inputs rejected (negative prices, zero quantities, bad email format)
- [ ] Destructive actions require confirmation dialogs
- [ ] Double-submit prevented (button disabled during request)

### UI/UX
- [ ] App is usable on desktop (1280px+)
- [ ] App is usable on tablet (768px)
- [ ] App is usable on mobile (375px)
- [ ] Loading spinners shown during data fetch
- [ ] Success toasts shown on create/update/delete
- [ ] Error toasts shown on API failures
- [ ] Tab navigation works logically
- [ ] Modals close on Escape key

---

*Document version: 1.0 — Last updated: April 2026*
*For questions about this guide, contact the QA lead or project maintainer.*
