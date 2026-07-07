# Handoff: Rashid's Mart — Full Storefront

## Overview
A complete customer-facing e-commerce storefront for **Rashid's Mart**, a Bangladesh general marketplace (groceries, tools, electronics, home, baby, stationery). Single-page app with in-app navigation across: **Home, Collection (shop), Product detail, Cart, Checkout, Search, Account (Profile / Orders / Wishlist / Addresses / Notifications / Order tracking), and Order Invoice**. Ships light + dark themes and English + বাংলা (Bengali).

## About the Design Files
The files here are **design references created in HTML** — a working prototype showing the intended look and behavior, **not production code to copy**. It was authored in a small custom template runtime (`.dc.html` with `{{ }}` bindings and `<sc-if>`/`<sc-for>` tags) — treat that as pseudo-markup.

Your task: **recreate this storefront in the target codebase's own environment** (React/Vue/Svelte/Next, etc.), using its component library, routing, styling system, and state patterns. If no framework exists yet, pick the best fit. Reuse existing primitives (Button, Card, Input, Toggle, Badge, Table, Avatar) — match the visual spec, not the literal inline styles. Product images are striped placeholders; wire real image components.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, and interactions are final. The `Rashid's Mart.html` file is runnable — open it and click through every page/state before building.

## Design Tokens (CSS custom properties)
Themeable via a `.rm-store` root with `data-theme`, `data-density`, `data-neutral` attributes.

### Light (default)
`--page:#f8fafc` · `--card:#ffffff` · `--surface:#f1f5f9` · `--surface-2:#e2e8f0` · `--text:#0f172a` · `--muted:#64748b` · `--faint:#94a3b8` · `--border:#e5e7eb` · `--border-strong:#cbd5e1` · `--primary:#2563eb` · `--primary-hover:#1d4ed8` · `--primary-soft:#eff6ff` · `--discount:#b91c1c` · `--discount-soft:#fee2e2`

### Dark
`--page:#09090b` · `--card:#18181b` · `--surface:#27272a` · `--surface-2:#3f3f46` · `--text:#fafafa` · `--muted:#a1a1aa` · `--faint:#71717a` · `--border:#27272a` · `--border-strong:#3f3f46` · `--primary:#3b82f6` · `--primary-soft:#172554` · `--discount:#f87171` · `--discount-soft:#3f1d1d`

Success/verified accent (theme-independent): green `#15803d`/`#16a34a`, soft bg via `color-mix(in srgb, #15803d 12%, transparent)`.

### Typography
- Body: **Inter** (400/500/600/700); Bengali fallback **Noto Sans Bengali**. Stack: `'Inter','Noto Sans Bengali',system-ui,sans-serif`. Root letter-spacing `-0.006em`; headings tighten to `-0.02em`/`-0.03em`.
- Mono (IDs, prices, dates, qty): `ui-monospace,'SF Mono',Menlo,monospace`.

### Responsive scale (tokens change by breakpoint)
`--pad` 16→28→40px, `--gap` 12→16→18px, `--cols` 2→3→4, heading `--h1` 30→38→46px, `--h2` 20→23→26px at `<680 / ≥680 / ≥1000px`. Grid column tokens: `--colcols`, `--searchcols`, `--relcols`, `--pdpgrid`, `--cartgrid`, `--acctgrid` (`260px 1fr` ≥680), `--profcols`, `--invcols`.

### Radii / misc
Card 14px · list cards & inputs 8–12px · pills/badges 999px · avatar 50%. Flat cards (border-defined, no shadow). Toggle knob shadow `0 1px 3px rgba(0,0,0,.25)`.

## Expressive tweaks (props)
Three root-level "feel" controls, applied via CSS-variable overrides (declared in `data-props` on the DC, read in the logic):
- **accent** (color; default `#2563eb`) — recolors `--primary`; hover/soft derived via `color-mix` so they adapt to light/dark.
- **density** (Cosy / Balanced / Airy) — rescales `--pad`/`--gap` across all breakpoints via `[data-density]` rules.
- **neutral / palette temperature** (Cool / Warm / Mono) — swaps the whole neutral ramp via `[data-neutral]` (+ dark variants).

In a real app, expose these as theme settings / a design-token layer.

## Pages / Views
1. **Home** — three interchangeable layouts (**Classic** hero+grid, **Hero Split** 50/50, **Minimal** airy). Sticky header (utility bar with Track order / Help / lang + dark toggles; logo; search; category nav; cart), hero, category rail, product grids, promos, footer.
2. **Collection** — Grid-3 / Grid-4 / Sidebar-filters variants; sort control, filter rail (category/price/brand), pagination. Product cards → product page; add-to-cart with `stopPropagation`.
3. **Product detail** — Gallery-left / Gallery-top / Sticky-buy-bar variants; thumbnails, rating/reviews, price (+struck original), qty stepper, add-to-cart, wishlist heart, "available in-store only" notice for variable products, related grid.
4. **Cart** — slide-over drawer (fixed, right) AND a two-column cart page; qty steppers, coupons (WELCOME10 / FLAT100 / FREESHIP, exclusive), delivery-zone shipping, order summary.
5. **Checkout** — Single-page and Multi-step (4 steps: Address → Delivery → Payment → Review) variants; zones Inside/Outside Dhaka (৳60/৳120, free over ৳2,000); COD + Bank transfer; order confirmation.
6. **Search** — Grid / List variants, query bar, empty state (toggle).
7. **Account** — persistent left sidebar (avatar + nav: Profile / Orders / Wishlist / Addresses / Notifications, + Log out). Profile view/edit (email & phone locked — "Contact support to change"); Orders list with status pills + **Invoice** & View-details buttons; Wishlist grid (move-to-cart, remove); Address book; Notification toggles; Order-tracking timeline (Placed→Confirmed→Processing→Shipped→Delivered; cancelled notice).
8. **Order Invoice** — printable document page. Brand header + company address/BIN, INVOICE title, PAID stamp / Payment-due pill; Billed-to + meta (invoice no `INV-RM-####`, order ref, date, payment method); **itemized line table** with struck list price + per-line savings pill (`18% off · −BDT 700`); totals cascade (Items before discount → Item discounts → Subtotal → Shipping → **Total due**) + "You saved". **Print / Save PDF** button (`window.print()`) with a `@media print` rule (`.rm-noprint`) that hides header/footer/toolbar so only the sheet prints.

## Status pills (order states)
`padding:4px 10px; border-radius:999px; font-weight:600`. Placed→amber, Confirmed→blue, Processing→purple, Shipped→blue, Delivered→green, Cancelled→red (each text color on a soft tint bg). Confirm exact hex against the `STATUS` map in source.

## State model
`page` (route), `template`/`colVariant`/`pdpVariant`/`coVariant`/`searchVariant` (per-page layout), `accountTab`, `selectedProduct`, `selectedOrder`, `cart{id:qty}`, `wishlist[ids]`, `coupon`, `zone`, `payment`, `coStep`, `pdpQty`, `editingProfile` + profile draft (name/gender/dob; email+phone read-only), `prefs{promoEmail,orderSms,priceDrop,newsletter}`, `theme`, `lang`, `searchEmpty`, `orderPlaced`. Money helpers format `BDT 0,000.00`. Real app: fetch products, orders (+items/status), addresses, wishlist, user profile.

## Localization
Every string keyed for EN + বাংলা (two dictionaries). Bengali renders in Noto Sans Bengali. Header lang toggle swaps live.

## Assets / Icons
Inline stroke SVGs (24×24, `stroke:currentColor`, width 1.7, round joins): cart, search, phone, user, box, heart(+fill), map-pin, bell, lock, log-out, edit, plus, back, check, receipt, printer, truck, shield, tag, sun/moon, etc. Swap for the codebase's icon set (Lucide matches closely). No external image files.

## Files
- `Rashid's Mart.dc.html` — full storefront prototype (source of truth). Search page section comments: `<!-- ============ ACCOUNT ============ -->`, `<!-- ============ INVOICE ============ -->`, etc. Tokens live in the `<style>` in `<helmet>` (`.rm-store` + `[data-theme]`/`[data-density]`/`[data-neutral]`). All logic (state, handlers, i18n `en`/`bn`, `ORDERS`, `STATUS`, `PIPELINE`, `RAW_PRODUCTS`, `accountNav`, invoice math) is in the `<script data-dc-script>` block.
- `Rashid's Mart.html` — self-contained bundled build; open directly in a browser to explore every page and state.

> Build order suggestion: tokens/theme layer → shared shell (header/footer/nav) → product data + cart state → Home → Collection → Product → Cart/Checkout → Account → Invoice. Verify against the running `Rashid's Mart.html` at each step.
