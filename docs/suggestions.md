# Dyventory — Improvement Suggestions

## High impact

### 1. Barcode scanner in ProductSearch
ProductSearch already accepts barcode as text input. Add a camera-scan button next to the input — one click opens the device camera, scan fires the barcode as a search query, product gets added to cart instantly. Libraries like `@zxing/browser` handle this well. Huge UX win for cashiers.

### 2. Real-time low-stock push (SSE)
Alerts are currently REST-only. A Server-Sent Events endpoint on the backend (`/api/v1/events`) could push low-stock and expiry notifications the moment they cross the threshold. The notification infrastructure already exists — it just needs a push layer instead of polling.

### 3. Credit limit warning on new sales
When selecting a client for a credit sale, check their outstanding balance against a configurable limit and show a warning inline (e.g. "Client already owes 45,000 F"). Prevents bad debt accumulation passively.

---

## Medium impact

### 4. Stock movement timeline per product
On the product detail page, a chronological list of all stock movements (sales, adjustments, supplier deliveries) with before/after quantities. Currently you'd have to dig through reports to reconstruct this.

### 5. Bulk operations on products
A checkbox selection mode on the products list to bulk-archive, bulk-update price, or bulk-assign category. Common need when onboarding or doing seasonal price changes.

### 6. Promotions wired into the sale
The `promotions` feature exists but appears disconnected from `NewSaleForm`. If promotions aren't auto-applied at checkout when a product/client matches, that's a gap worth closing.

---

## Quick wins

### 7. "Last used" category memory in ProductSearch
Remember the last selected category filter in `localStorage` across page loads. Simple, zero backend work.

### 8. Keyboard shortcut `N` → new sale
A global shortcut to jump to `/sales/new` from anywhere. One line with a `useEffect` on `keydown`.

### 9. Confirm-sale sound feedback
A subtle `AudioContext` beep on successful sale confirmation. Useful in noisy shop environments where the screen isn't always watched.
