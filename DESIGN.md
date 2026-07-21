---
name: Dyventory
description: Inventory and sales management system for businesses with diverse product catalogues.
colors:
  command-blue: "oklch(0.55 0.2 250)"
  command-blue-deep: "oklch(0.48 0.2 250)"
  command-blue-mid: "oklch(0.4 0.19 250)"
  command-blue-light: "oklch(0.93 0.05 250)"
  command-blue-faint: "oklch(0.97 0.02 250)"
  teal-data: "oklch(0.6 0.16 180)"
  teal-data-deep: "oklch(0.48 0.16 180)"
  signal-red: "oklch(0.55 0.22 30)"
  signal-red-deep: "oklch(0.48 0.22 30)"
  signal-green: "oklch(0.55 0.18 145)"
  signal-green-deep: "oklch(0.48 0.18 145)"
  signal-amber: "oklch(0.75 0.18 80)"
  signal-amber-deep: "oklch(0.65 0.18 80)"
  canvas: "oklch(0.97 0.005 250)"
  surface: "oklch(1 0 0)"
  surface-muted: "oklch(0.94 0.005 250)"
  surface-hover: "oklch(0.95 0.01 250)"
  surface-selected: "oklch(0.92 0.03 250)"
  ink: "oklch(0.15 0.015 250)"
  ink-subtle: "oklch(0.42 0.01 250)"
  ink-muted: "oklch(0.6 0.01 250)"
  edge: "oklch(0.88 0.01 250)"
  edge-firm: "oklch(0.75 0.015 250)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.01em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  default: "8px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.command-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.command-blue-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.command-blue-faint}"
    textColor: "{colors.command-blue-mid}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-subtle}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-danger:
    backgroundColor: "{colors.signal-red}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.default}"
    height: "40px"
    padding: "0 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  badge:
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: Dyventory

## 1. Overview

**Creative North Star: "The Control Room"**

Dyventory is a command surface, not a consumer app. The people using it are operators — they need to understand the state of their entire business at a glance and act decisively. Every screen should feel like it was designed by someone who respects their time: information is dense where density is warranted, breathing where the task calls for focus, and never decorative for its own sake.

The palette is deliberately restrained. Command Blue anchors all actions and interactions; it earns its appearance by being rare. The majority of the screen surface is neutral — a cool blue-tinted canvas that reads as a professional workspace, not a marketing page. Status colors (red, green, amber) appear only when they carry a signal; they are never used for decoration.

This system explicitly rejects: generic admin panels that look like Bootstrap or Material UI out-of-the-box (low-contrast, indistinguishable gray-on-gray); SaaS showpiece dashboards that collapse under real data (empty-state-as-feature, four hero metrics with no supporting context); mobile-first designs that sacrifice data density on desktop. Dyventory lives on desktop and tablet, operated by people who know exactly what they came to do.

**Key Characteristics:**
- Command Blue as the single action color — decisive, rare, trusted
- Structural elevation: every surface level is distinct and readable
- Dual-density design: data-rich for owners scanning reports, action-first for staff executing tasks
- Status is never ambiguous — color + icon + label, always in concert
- Touch-tolerant without sacrificing desktop data density

## 2. Colors: The Command Palette

A restrained palette where Command Blue leads and every other color earns its place through function.

### Primary

- **Command Blue** (`oklch(0.55 0.2 250)`): The single action color. Used on primary buttons, links, focus rings, active nav items, and interactive controls. Its rarity is structural — every occurrence carries intent.
- **Command Blue Deep** (`oklch(0.48 0.2 250)`): Hover and pressed state for primary buttons and interactive elements. Slightly darker, same hue.
- **Command Blue Light** (`oklch(0.93 0.05 250)`): The secondary button fill and selected-state backgrounds. Low-saturation, high-lightness — present but not insistent.
- **Command Blue Faint** (`oklch(0.97 0.02 250)`): Hover surfaces within the sidebar, selected row highlights, and subtle container tints.

### Secondary

- **Teal Data** (`oklch(0.6 0.16 180)`): Supplemental data visualization accent. Used in charts, trend lines, and secondary metrics where Command Blue is already in use as an action color. Not for interactive elements.
- **Teal Data Deep** (`oklch(0.48 0.16 180)`): Dark variant for text on teal backgrounds and high-contrast data labels.

### Tertiary (Signal Colors)

Signal colors carry operational meaning. They are never decorative.

- **Signal Red** (`oklch(0.55 0.22 30)`): Danger actions, error states, critical stock alerts, overdue credit badges. Always paired with an icon or label.
- **Signal Green** (`oklch(0.55 0.18 145)`): Confirmed sales, healthy stock levels, successful operations, payment received.
- **Signal Amber** (`oklch(0.75 0.18 80)`): Expiry warnings, low-stock alerts, overdue warnings, in-progress or pending states.

### Neutral

- **Canvas** (`oklch(0.97 0.005 250)`): The page background. Near-white with a 0.005 blue chroma tint — clearly a working surface, not a warm paper tone.
- **Surface** (`oklch(1 0 0)`): Cards, panels, modal backgrounds, the sidebar. Pure white; sits one level above the canvas.
- **Surface Muted** (`oklch(0.94 0.005 250)`): Table rows on hover, background of empty states, disabled surfaces. The canvas slightly deepened.
- **Ink** (`oklch(0.15 0.015 250)`): Primary text. Near-black with a faint blue-gray tint that ties it to the palette.
- **Ink Subtle** (`oklch(0.42 0.01 250)`): Secondary text — labels, metadata, ghost button text.
- **Ink Muted** (`oklch(0.6 0.01 250)`): Placeholder text, disabled text, caption-level copy. At this lightness contrast against white falls just above 4.5:1; verify before lowering further.
- **Edge** (`oklch(0.88 0.01 250)`): Default borders on cards, inputs, dividers. Quiet, blue-tinted.
- **Edge Firm** (`oklch(0.75 0.015 250)`): Borders on active/focused inputs, table headers, prominent dividers.

**Dark mode**: All surface tokens are inverted via `.dark`. The surface-bg drops to `oklch(0.1 0.02 250)`, cards to `oklch(0.15 0.025 250)`. Command Blue retains the same hue and chroma; its appearance on dark surfaces naturally increases perceived brightness — no hue shift needed.

**The One Channel Rule.** Command Blue never coexists with signal colors at the same visual weight on a single surface. If a page has a danger action (red button), any primary actions nearby use the outline or ghost variant. Color disambiguation is the user's safety net.

## 3. Typography

**Body Font:** Inter (with `ui-sans-serif, system-ui, sans-serif` fallback)  
**Mono Font:** JetBrains Mono (with `ui-monospace, monospace` fallback)

**Character:** A single humanist sans-serif at multiple weights. Inter at 14px (body) and 12px (label) reads cleanly at the data-dense scale this app requires. No display serif, no decorative pairing — this is operational typography, not editorial.

### Hierarchy

- **Display** (Bold 700, `clamp(1.5rem, 3vw, 2rem)`, line-height 1.2, letter-spacing −0.02em): Page-level titles. Used once per page — the `<h1>`. Appears in dashboard section headers and report page titles.
- **Headline** (Semibold 600, 1.25rem / 20px, line-height 1.3, letter-spacing −0.01em): Section headers within a page, modal titles, card group labels. `<h2>` level.
- **Title** (Semibold 600, 1rem / 16px, line-height 1.4): Sub-section labels, card headers, column headers in complex tables. `<h3>`–`<h4>` level.
- **Body** (Regular 400, 0.875rem / 14px, line-height 1.5): All data-level text — table cell content, form field values, paragraph copy. This is the dominant text size in the application. Limit line length to 65–75ch for prose contexts.
- **Label** (Medium 500, 0.75rem / 12px, line-height 1.25, letter-spacing 0.01em): Field labels, column headers, badge text, nav item labels, metadata chips. Not uppercase — tracking provides differentiation without shouting.
- **Mono** (Regular 400, 0.8125rem / 13px, line-height 1.5): Barcodes, SKUs, batch codes, any identifier that must be scanned rather than read.

**The Size Floor Rule.** No text in the application goes below 12px (0.75rem). Ink Muted on white at 12px already sits near the 4.5:1 floor; do not go smaller.

## 4. Elevation

Dyventory uses structural elevation: each surface level in the interface hierarchy carries a distinct visual step. This is not decorative — it makes the spatial model legible to operators who scan many screens per day.

The four canonical levels:

**Level 0 — Canvas** (`surface-bg: oklch(0.97 0.005 250)`): The base page background. No shadow.

**Level 1 — Card / Panel** (`surface-card: oklch(1 0 0)`): Data tables, form panels, content cards. Rests on the canvas. Shadow: ambient + diffuse (`0 1px 3px oklch(0 0 0 / 0.08), 0 4px 16px oklch(0 0 0 / 0.06)`).

**Level 2 — Header / Sidebar** (`surface-header / surface-sidebar: oklch(1 0 0)`): Fixed chrome. Same background as cards, distinguished by position and a subtle lateral shadow on the sidebar (`2px 0 16px oklch(0 0 0 / 0.06)`).

**Level 3 — Floating** (dropdowns, autocomplete panels, popovers): Lifts above the page with a mid-weight shadow (`0 4px 8px oklch(0 0 0 / 0.08), 0 12px 40px oklch(0 0 0 / 0.12)`).

**Level 4 — Modal**: The highest level. Heavy shadow that signals a blocking layer (`0 32px 80px oklch(0 0 0 / 0.22), 0 8px 24px oklch(0 0 0 / 0.14)`). A translucent backdrop (`oklch(0 0 0 / 0.5)`) anchors it.

### Shadow Vocabulary

- **Ambient** (`0 1px 3px oklch(0 0 0 / 0.08), 0 4px 16px oklch(0 0 0 / 0.06)`): Cards at rest.
- **Lifted** (`0 4px 8px oklch(0 0 0 / 0.1), 0 16px 40px oklch(0 0 0 / 0.1)`): Cards on hover, interactive tiles.
- **Floating** (`0 4px 8px oklch(0 0 0 / 0.08), 0 12px 40px oklch(0 0 0 / 0.12)`): Dropdowns, autocomplete, popovers.
- **Modal** (`0 32px 80px oklch(0 0 0 / 0.22), 0 8px 24px oklch(0 0 0 / 0.14)`): Dialog overlays only.
- **Minimal** (`0 1px 2px oklch(0 0 0 / 0.08), 0 2px 8px oklch(0 0 0 / 0.05)`): Small interactive chips, inline elements.

**The Flat-at-Rest Rule.** All interactive elements start flat (or at ambient shadow). Elevation increases as a response to state — hover lifts, focus rings appear, active presses return to flat. Shadows are never applied as permanent decoration on static content.

## 5. Components

### Buttons

Tactile and honest — every variant communicates its intent through color alone, no icons required to decode the hierarchy.

- **Shape:** Gently rounded (10px radius, `--radius-md`)
- **Sizes:** Small (32px height, 12px text), Default (36px height, 14px text), Large (40px height, 14px text)
- **Primary** (`background: command-blue`, `color: white`, `padding: 0 16px`): The single call-to-action per screen region. Hover shifts to Command Blue Deep; active scales to 97%.
- **Secondary** (`background: command-blue-faint`, `color: command-blue-mid`, `border: edge`): Supplemental actions adjacent to a primary. Uses the blue tint system to stay related without competing.
- **Ghost** (`background: transparent`, `color: ink-subtle`): Low-priority actions, row-level controls, icon-only triggers. Hover brings in `surface-muted`.
- **Danger** (`background: signal-red`, `color: white`): Destructive actions only. Never used for emphasis.
- **Outline** (`background: surface-card`, `border: edge-firm`, `color: ink`): Neutral actions in contexts without a clear primary (filter bars, export options).
- **Disabled state:** 50% opacity, cursor not-allowed, no hover response.
- **Focus:** 2px outline in Command Blue, 2px offset, keyboard-only (`:focus-visible`).
- **Transition:** 150ms ease on background, transform.

### Inputs / Fields

Clean stroke inputs — a single visible border that clarifies the field boundary without architectural weight.

- **Style:** 40px height, 8px radius (`--radius`), 1px solid Edge border, white background
- **Placeholder text:** Ink Muted — verify 4.5:1 contrast on white before using
- **Focus:** Border shifts to Command Blue; soft glow ring `oklch(from var(--color-primary) l c h / 0.15)` at 3px spread
- **Disabled:** 50% opacity, cursor not-allowed, Surface Hover background
- **Textarea:** Same stroke, auto-height, min 6rem, resizable vertically
- **Select:** Caret injected via SVG background-image at right 12px; 40px height

### Cards / Containers

The primary content container. White on a blue-tinted canvas — the contrast makes the content structure immediately scannable.

- **Corner Style:** Gently rounded (14px, `--radius-lg`)
- **Background:** Surface (white)
- **Shadow:** Ambient at rest; Lifted on hover for interactive cards
- **Border:** 1px solid Edge — present but quiet
- **Internal Padding:** 24px default; 16px for compact dashboard widgets
- **Interactive card** (`card-interactive`): Adds `translateY(-2px)` on hover, returns on active. Signals clickability without gimmicks.

### Badges / Status Chips

The primary carrier of operational status across the app. Every color must have a text label — color alone is never the sole signal.

- **Shape:** Pill (9999px radius)
- **Size:** 12px label text, 2px vertical / 8px horizontal padding
- **Assignment:** Command Blue family → neutral/info states; Signal Green → confirmed/healthy; Signal Amber → warning/pending; Signal Red → danger/critical
- **Rule:** Icon + color + label, always. Never color alone.

### Navigation (Sidebar)

The sidebar is the spatial anchor of the app. Items are compact but comfortable for both mouse and touch.

- **Item shape:** 8px radius, full-width within sidebar container
- **Default:** Ink Subtle text on transparent background
- **Hover:** Surface Hover background (`oklch(0.96 0.006 250)`), Sidebar Active text
- **Active / current:** `surface-selected` fill (`oklch(0.92 0.03 250)`), Command Blue Deep text weight
- **Typography:** 14px medium — matches body but heavier to hold navigation weight
- **Touch target:** Full-height nav items (minimum 40px) ensure tablet usability
- **Sidebar shadow:** Subtle rightward cast (`2px 0 16px oklch(0 0 0 / 0.06)`) distinguishes it from the page canvas

### Data Tables

The dominant surface in this application. Owner-facing screens and staff-facing screens share the same table infrastructure with different column configurations.

- **Header row:** Surface Muted background, Label typography (12px/500), Edge bottom border
- **Data rows:** White background, Body typography (14px/400), Edge bottom dividers
- **Hover row:** Surface Hover background tint (`oklch(0.95 0.01 250)`)
- **Selected row:** Surface Selected tint (`oklch(0.92 0.03 250)`)
- **Vertical padding per row:** 12px — generous enough for touch, tight enough for density
- **Status columns:** Always badge-rendered (color + label + icon) — never plain text for status fields

## 6. Do's and Don'ts

### Do:

- **Do** use Command Blue only for interactive elements and active states. Its scarcity is its authority.
- **Do** pair every signal color with an icon and a text label. Color-only status is inaccessible and ambiguous.
- **Do** use structural elevation: keep canvas, card, floating, and modal levels distinct at all times.
- **Do** use 14px body text for all data-level content. This is an information-dense tool; go up for headers, never down for copy.
- **Do** size all interactive touch targets to minimum 40×40px (buttons, nav items, form controls) — the app is used on tablets.
- **Do** use `text-wrap: balance` on page-level headings (`<h1>`, `<h2>`) and `text-wrap: pretty` on longer prose.
- **Do** include `:focus-visible` rings on every interactive element — 2px solid Command Blue, 2px offset.
- **Do** add `@media (prefers-reduced-motion: reduce)` alternatives to every animation: crossfade or instant state change.
- **Do** keep the sidebar active state visually tied to Command Blue (the blue tint on `surface-selected` + the deeper blue text weight signals location without requiring a side stripe).

### Don't:

- **Don't** use `border-left` wider than 1px as a colored accent stripe on cards, list items, or callouts. This is prohibited regardless of how common it looks in admin panels. Use full borders, background tints, or icon leading.
- **Don't** use gradient text (`background-clip: text`). Single solid color. Emphasis via weight or size.
- **Don't** use glassmorphism decoratively — blurred glass cards are banned as a default aesthetic. If a blur is used (e.g. a sticky header), it must serve a specific spatial function.
- **Don't** build a hero-metric template (big number, small label, gradient accent). The dashboard KPI pattern must carry supporting context: trend direction, comparison period, alert state.
- **Don't** build identical card grids — same-sized cards with icon + heading + text, repeated. If a grid has more than 4 items with the same visual weight, the architecture needs rethinking.
- **Don't** put an uppercase tracked eyebrow above every section (`OVERVIEW`, `REPORTS`, `ACTIVITY`). One deliberate named section system is voice; eyebrows on every section is AI grammar.
- **Don't** build generic admin UI that looks like Bootstrap or Material UI out-of-the-box. Low-contrast, gray-on-gray, indistinguishable from any CRUD app. This is the first anti-reference from PRODUCT.md.
- **Don't** build showpiece dashboards that look good in demos but collapse under real data. Empty-state-as-feature, four hero metrics with no supporting context — this is the second anti-reference.
- **Don't** sacrifice desktop data density for mobile aesthetics. Dyventory is not a phone app. Tables must show enough columns to be actionable; compress for tablet, never for phone-first breakpoints.
- **Don't** go below 12px text size. Ink Muted at 12px is already near the contrast floor on white.
- **Don't** use the warm-neutral background band (`oklch(L 0.84-0.97, C < 0.06, hue 40-100)` — cream, sand, parchment, paper). The canvas is blue-tinted neutral, not warm-tinted neutral. The warmth of this brand comes from the domain and the data, not from a background tint.
