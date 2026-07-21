# Product

## Register

product

## Users

**Owner / manager** — has full access, uses the dashboard for business health (revenue, stock alerts, credit exposure), runs reports, configures settings. Context: at a desk or on a tablet, switching between high-level overview and drill-down.

**Staff (cashier, stock manager)** — scoped role, task-focused. Cashier lives in the sales POS; stock manager lives in entry / exit / inventory flows. Speed and clarity per-screen matter more than global navigation. Often on a tablet at the counter or in the warehouse.

The system must serve both: dense and information-rich for the owner, action-fast and low-friction for staff.

## Product Purpose

Dyventory is an inventory and sales management system for businesses with highly diverse product catalogues (perishable goods, living products like snails tracked by weight, non-food variants). It replaces spreadsheets and disconnected tools with a single unified system that handles stock movements, FEFO batch management, POS sales, supplier orders, client credit, and reporting.

Success: a user opens Dyventory, understands the state of their business in under 10 seconds, and completes their primary task in under 30 seconds.

## Brand Personality

Confident, modern, reliable. The product earns trust by being visually precise and functionally honest — every status is clear, every number is readable, every action is obvious. Polish is present but purposeful: it signals quality without distracting from the work.

## Anti-references

- Generic admin panels that look like Bootstrap or Material UI out-of-the-box — low-contrast, gray-on-gray, indistinguishable from any CRUD app.
- Showpiece SaaS dashboards that look good in demos but collapse under real data density (empty states that look like features, 4-metric hero grids with no supporting context).
- Mobile-first designs that sacrifice data density on desktop — this app lives on desktop and tablet, not phones.

## Design Principles

1. **Dual-persona density** — each surface must be calibrated to its primary user. Dashboard and reports are owner-facing: generous whitespace, quick-scan hierarchy. POS, stock entry, and detail pages are staff-facing: compact, tap-friendly, action-first.
2. **Status is never ambiguous** — stock levels, payment states, batch expiry, and alert severity must communicate their meaning through color, label, and iconography together — never rely on a single channel.
3. **Speed over decoration** — interactions that happen 50+ times per day (ringing a sale, entering stock) must be as few taps / keystrokes as possible. Animations support action confirmation, not aesthetics.
4. **Earned polish** — visual refinement improves comprehension. A well-chosen shadow, a precise color ramp, a legible type scale — these earn their place. Decorative elements that don't carry information don't belong.
5. **Touch-tolerant without compromise** — desktop-first layout, but all interactive targets must be comfortable on tablet. Minimum 44×44 px touch targets, generous tap zones around form controls.

## Accessibility & Inclusion

WCAG AA minimum. Both desktop and tablet/touch usage must be supported equally. Focus rings on keyboard navigation. Color is always reinforced with a secondary signal (icon or label) for colorblind users — critical for status badges (stock alerts, payment status, expiry warnings).
