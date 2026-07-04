# Handoff: Account / My Account Page — Rashid's Mart

## Overview
This is the customer **account area** for the Rashid's Mart e-commerce storefront (a Bangladesh-focused general marketplace). It is a single page with a persistent left sidebar and five switchable sections: **Profile, Orders, Wishlist, Addresses, Notifications**, plus an **Order Tracking** view reached from an order. It supports light + dark themes and English + বাংলা (Bengali) localization.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype that demonstrates the intended look, layout, and behavior. They are **not production code to copy directly**. The prototype was authored in a small custom template runtime (`.dc.html` with `{{ }}` bindings and `<sc-if>` / `<sc-for>` control tags) — treat that as pseudo-markup, not a dependency.

Your task is to **recreate this account page in the target codebase's existing environment** (React, Vue, Svelte, SwiftUI, etc.), using its established component library, styling system, routing, and state patterns. If no front-end environment exists yet, choose the most appropriate framework for the project and implement there. Reuse the codebase's existing primitives (Button, Card, Toggle, Input, Avatar, etc.) wherever they exist rather than hand-rolling new ones — match the visual spec below, not the literal inline styles.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, radii, and interactions below are final and exact. Recreate the UI faithfully using the codebase's existing libraries and patterns. The one caveat: product/photo areas use striped placeholder boxes — swap those for real image components.

---

## Design Tokens

The page is themeable via CSS custom properties. Two themes ship (light default + dark). Recreate as theme tokens in the target system.

### Light theme
| Token | Value | Usage |
|---|---|---|
| `--page` | `#f8fafc` | Page background |
| `--card` | `#ffffff` | Card / panel background |
| `--surface` | `#f1f5f9` | Inset surfaces, disabled fields |
| `--surface-2` | `#e2e8f0` | Placeholder stripe (darker band) |
| `--text` | `#0f172a` | Primary text |
| `--muted` | `#64748b` | Secondary text |
| `--faint` | `#94a3b8` | Tertiary text, hints |
| `--border` | `#e5e7eb` | Hairline borders, dividers |
| `--border-strong` | `#cbd5e1` | Input borders, buttons outlines |
| `--primary` | `#2563eb` | Brand blue — actions, active states |
| `--primary-hover` | `#1d4ed8` | Hover for primary |
| `--primary-soft` | `#eff6ff` | Active nav row bg, soft badges |
| `--on-primary` | `#ffffff` | Text/icon on primary |
| `--discount` | `#b91c1c` | Destructive (logout, remove) |
| `--discount-soft` | `#fee2e2` | Destructive soft bg (cancelled notice) |

### Dark theme
| Token | Value |
|---|---|
| `--page` | `#09090b` |
| `--card` | `#18181b` |
| `--surface` | `#27272a` |
| `--surface-2` | `#3f3f46` |
| `--text` | `#fafafa` |
| `--muted` | `#a1a1aa` |
| `--faint` | `#71717a` |
| `--border` | `#27272a` |
| `--border-strong` | `#3f3f46` |
| `--primary` | `#3b82f6` |
| `--primary-hover` | `#60a5fa` |
| `--primary-soft` | `#172554` |
| `--discount` | `#f87171` |
| `--discount-soft` | `#3f1d1d` |

### Success / verified accent (theme-independent)
- Green `#16a34a` for "Verified" badges and delivered states; background is `color-mix(in srgb, #16a34a 12%, transparent)`.

### Typography
- **Primary font:** `Inter` (weights 400/500/600/700). Bengali fallback: `Noto Sans Bengali`. Stack: `'Inter', 'Noto Sans Bengali', system-ui, sans-serif`.
- **Monospace** (order IDs, phone, dates, prices, counts): `ui-monospace, 'SF Mono', Menlo, monospace`.
- Global letter-spacing: `-0.006em` on the root; headings tighten further (see below).

| Role | Size | Weight | Letter-spacing |
|---|---|---|---|
| Page title (`My account`) | 20px mobile → 23px ≥680px → 26px ≥1000px | 700 | -0.02em |
| Section heading (`Personal details`, `Notifications`) | 16px | 700 | -0.01em |
| Nav item label | 14px | 600 | — |
| Nav item description | 11.5px | 400/500 | — |
| Body / field value | 14–14.5px | 600 (values), 400 (help) | — |
| Field label | 12px | 400 (view) / 600 (edit) | — |
| Small meta / count | 11.5–12.5px | 400–500 | — |
| Uppercase section eyebrow | 11.5px | 700, `text-transform: uppercase`, `letter-spacing: 0.04em` | — |

### Spacing / radii / misc
- Card radius: **14px**; inner list cards / inputs: **8–12px**; pills/badges: **999px**; avatar: **50%**.
- Card padding: **22px** (content panels), **16–18px** (sidebar, list rows).
- Grid gap token `--gap`: **12px** mobile → **16px** ≥680px → **18px** ≥1000px.
- Page horizontal padding `--pad`: **16px** → **28px** → **40px** at the same breakpoints.
- Content max-width: **1200px**, centered.
- No drop shadows on cards (flat, border-defined). Toggle knob has `0 1px 3px rgba(0,0,0,0.25)`.

### Breakpoints
- `< 680px`: single column (sidebar stacks above content).
- `≥ 680px`: account grid becomes `260px minmax(0,1fr)` (sidebar + content); profile detail grid becomes 2 columns (`--profcols: 1fr 1fr`).
- `≥ 1000px`: larger paddings/type only.

---

## Layout (page shell)

- Outer wrapper: `max-width: 1200px; margin: 0 auto; padding: 22px var(--pad) 40px;`
- Page title row: `My account` (H1), bottom margin 20px.
- Below it, a CSS grid:
  - `grid-template-columns: var(--acctgrid)` → `1fr` on mobile, `260px minmax(0,1fr)` at ≥680px.
  - `gap: var(--gap)`, `align-items: start`.
  - **Left:** sticky sidebar (`position: sticky; top: 88px`).
  - **Right:** content area for the active section.

---

## Screens / Views

### 1. Sidebar (always visible)
**Purpose:** persistent navigation across all account sections; identity header + logout.

**Layout:** `--card` panel, 1px `--border`, radius 14px, padding 16px, sticky at top:88px.

**Components:**
1. **Identity header** — row with 46×46 circular avatar (`--primary` bg, white uppercase initial, 19px/700), name (15px/700, truncates), and "`Member since 2024`" (12px `--muted`). Bottom border + 12px margin.
2. **Nav list** — vertical, 3px gap. Each item is a clickable row: `display:flex; gap:12px; padding:11px 12px; border-radius:10px`. Icon (18px stroke) + two lines (label 14px/600, description 11.5px `--muted`).
   - **Active state:** row background `--primary-soft`; icon + label colored `--primary`. Inactive: transparent bg, icon `--muted`, label `--text`.
   - Items (in order): **Profile** (user icon, "Personal details") · **Orders** (box icon, "History & tracking") · **Wishlist** (heart icon, "Saved items") · **Addresses** (map-pin icon, "Delivery locations") · **Notifications** (bell icon, "Emails & alerts").
   - When the **Tracking** sub-view is open, the **Orders** item stays highlighted as active.
3. **Logout** — separated by a top border (12px margin/padding). Row with logout icon + "Log out", colored `--discount`.

### 2. Profile
**Purpose:** view and edit personal details.

**View mode:**
- Card (padding 22px). Header row: "Personal details" (16px/700) + an **Edit** button on the right — soft style: `--primary-soft` bg, `--primary` text, radius 8px, padding 8px 14px, 13px/600, edit icon + "Edit".
- Detail grid: `--profcols` (1 col mobile, 2 cols ≥680px), gap `18px 40px`. Each field: label (12px `--muted`, 5px bottom margin) over value (14.5px/600 `--text`). All but the last row have a 1px bottom border, 14px bottom padding.
- Fields: **Full name** (`Ayesha Rahman`), **Gender** (`Female`), **Date of birth** (`1994-03-12`, mono), **Email address** (`ayesha@example.com`) and **Phone number** (`+880 1712-345678`, mono).
- Email & Phone labels include a small **lock icon** (`--faint`) and their value has a green **"Verified"** pill (10px/700, green text on green-12% bg, radius 999px).

**Edit mode** (toggled by Edit; Save/Cancel exit it):
- Editable: **Full name** (text input), **Gender** (segmented chips: Male / Female / Other — selected chip has `--primary` border, `--primary-soft` bg, `--primary` text; others `--border-strong` border, `--card` bg), **Date of birth** (native date input).
- Inputs: full width, 1px `--border-strong`, `--surface` bg, radius 8px, padding 11px 13px, 14px, no outline on focus (add a focus ring in your system).
- **Email & Phone are intentionally NOT editable** — shown as disabled fields: `1px dashed --border-strong`, `--surface` bg, `--muted` text, with helper text below: "Contact support to change". This is a hard product rule — email/phone must remain read-only.
- Actions row: **Save changes** (primary button) + **Cancel** (outline button). Save shows a toast "Profile updated" and returns to view mode.

### 3. Orders
**Purpose:** list past orders; enter tracking.

- Vertical list, 11px gap. Each order is a `--card` row (padding 16px 18px, radius 12px), `display:flex; align-items:center; gap:16px; flex-wrap:wrap`:
  - Left (flex:1, min-width 150px): order id (14px/700, mono, e.g. `RM-4821`) + **status pill** (see Status pills), then a meta line (12.5px `--muted`): `date · N items · payment method`.
  - Right: order total (15px/700).
  - **View details** button (primary, small: padding 9px 16px, radius 8px, 12.5px/600) → opens Tracking for that order.

### 4. Wishlist
**Purpose:** saved products; move to cart or remove.

- Count line: "`N saved`" (12.5px `--muted`).
- Responsive product grid: `grid-template-columns: repeat(var(--cols), minmax(0,1fr))` where `--cols` = 2 (mobile) / 3 (≥680) / 4 (≥1000); gap `--gap`.
- **Card:** `--card`, 1px `--border`, radius 12px, column flex.
  - Image area: 1:1, diagonal striped placeholder, clickable (→ product page). A **filled-heart remove button** floats top-right: 30×30 circle, `--card` bg, 1px border, `--discount` heart, subtle shadow — click removes from wishlist.
  - Body (padding 12px 13px 14px): brand (10.5px uppercase `--faint`), name (13.5px/500, min-height 35px, clickable), price row (14.5px/700 + optional struck-through original in `--faint`), then a full-width **Move to cart** primary button (padding 9px, radius 7px, 13px/600) — adds to cart AND removes from wishlist.
- **Empty state:** card, centered, 44px heart icon (`--faint`), title "Your wishlist is empty" (17px/700), message "Tap the heart on any product to save it here for later." (14px `--muted`, max-width 340px), and a **Browse all products** primary button.

### 5. Addresses
**Purpose:** saved delivery addresses (address book).

- Vertical list, 11px gap. Each address card (`--card`, radius 12px, padding 18px):
  - Row: map-pin icon (`--primary`) + block with label (14.5px/700, e.g. "Home", "Office"), optional **Default** pill (10px/700, `--primary` on `--primary-soft`, radius 999px), address line (13px `--muted`, line-height 1.5), phone (12.5px mono `--faint`).
  - Right: a 34×34 square edit button (outline, `--muted` icon).
- **Add address** button: full-width, dashed `--border-strong` border, `--primary` text, plus icon + "Add address", padding 15px, radius 12px.

### 6. Notifications (preferences)
**Purpose:** toggle communication preferences.

- Card (padding 22px). Heading "Notifications" (16px/700) + subtitle "Choose what you want to hear about." (13px `--muted`).
- Vertical list of preference rows, each separated by 1px bottom border, padding 15px 0:
  - Left: title (14px/600) + sub (12.5px `--muted`).
  - Right: **toggle switch** — 42×24 track, radius 999px; ON = `--primary` bg with knob at right; OFF = `--border-strong` bg with knob at left. Knob: 18×18 white circle, 3px inset, shadow `0 1px 3px rgba(0,0,0,0.25)`, animates `left` over 0.18s.
  - Rows: **Promotional emails** ("Deals, offers and seasonal sales") · **Order updates by SMS** ("Delivery and status notifications") · **Price-drop alerts** ("When wishlist items get cheaper") · **Weekly newsletter** ("New arrivals and curated picks").
  - Default ON: promo email, order SMS, newsletter. Default OFF: price-drop.

### 7. Order Tracking (sub-view of Orders)
**Purpose:** show fulfillment progress + order contents for one order.

- Top: a **"← Back to orders"** link (13px/600 `--muted`).
- Grid `--cartgrid` (1 col mobile, `minmax(0,1.6fr) minmax(0,1fr)` ≥680px), gap `--gap`.
- **Left card** (padding 22px): header row = order id (17px/700 mono) + status pill, date below; order total on the right.
  - **Vertical timeline** of 5 steps: **Order placed → Confirmed → Processing → Shipped → Delivered**.
    - Completed step: 24×24 `--primary` circle with white check icon. Pending: 24×24 `--surface` circle, 2px `--border-strong` border.
    - Connector line between steps: 2px wide, `--border-strong`, min-height 30px.
    - Step label 14px/600; the **active** (current) step shows a 12px/600 `--primary` status caption under it.
  - **Cancelled orders** replace the timeline with a notice: `--discount-soft` bg, `--discount` text, radius 10px, padding 16px, centered — "Order cancelled".
- **Right column** (stacked cards):
  - **Order items**: eyebrow label; each item row = 42×42 placeholder + name (12.5px/500) & `×qty` (mono `--faint`) + line total (mono 12.5px/600).
  - **Delivery address**: eyebrow label + map-pin icon + address (13px `--muted`).

---

## Status pills (order states)
Small pill: `font-size: 11–12px; font-weight: 600; padding: 4px 10px; border-radius: 999px`. Each status has a text color + a soft background:

| Status | Text | Background | Label (EN) |
|---|---|---|---|
| Placed / pending | amber `#b45309` | `#fef3c7` | Placed / Pending |
| Confirmed | blue `#1d4ed8` | `#dbeafe` | Confirmed |
| Processing | purple `#7c3aed` | `#ede9fe` | Processing |
| Shipped | blue `#2563eb` | `#dbeafe` | Shipped |
| Delivered | green `#15803d` | `#dcfce7` | Delivered |
| Cancelled | red `#b91c1c` | `#fee2e2` | Cancelled |

(These are the intended semantic mapping — confirm against the actual `STATUS` object in the source file and use those exact values. Provide dark-theme equivalents by lifting lightness of the text color and using a dark, low-alpha background.)

---

## Interactions & Behavior
- **Section switching:** clicking a sidebar item swaps the content region; the active row restyles instantly (`--primary-soft` bg + `--primary` text). Switching sections also exits profile edit mode. No layout shift/flicker — the sidebar is persistent and only the content column changes.
- **Profile edit:** Edit → edit mode; Cancel → discard & return to view; Save → toast "Profile updated" (auto-dismiss ~1.6s) & return to view. Email/phone never editable.
- **Gender chips:** single-select segmented control.
- **Toggles:** immediate optimistic flip; knob slides 0.18s.
- **Wishlist:** remove heart deletes the item; "Move to cart" adds to cart and removes from wishlist (count decrements); empty state appears at 0 items. Product image / name click → product detail page.
- **Orders → tracking:** "View details" opens the tracking sub-view for that order id; "Back to orders" returns. Orders item remains highlighted in the sidebar while tracking.
- **Scroll reset:** navigating to a new top-level page resets scroll to top.
- **Toast:** bottom-center, `#0f172a` bg, white text, radius 9px, slide-up entrance, ~1.6s.

## State Management
- `activeSection`: `'profile' | 'orders' | 'wishlist' | 'addresses' | 'prefs' | 'tracking'` (tracking is a sub-state of orders).
- `editingProfile: boolean`; profile draft fields: `name`, `gender ('male'|'female'|'other')`, `dob`. (email/phone are read-only, not in the editable draft.)
- `prefs: { promoEmail, orderSms, priceDrop, newsletter }` booleans.
- `wishlist: number[]` of product ids; `cart` map of id→qty (shared with the rest of the store).
- `selectedOrderId` for the tracking view.
- `theme: 'light'|'dark'`, `lang: 'en'|'bn'` (both global; all copy is keyed for i18n — see below).
- Data fetching (real app): current user profile, saved addresses, order list + per-order status/items, wishlist product ids resolved against the catalog.

## Localization
Every string is localized (English + Bengali). Key examples: `myAccount`, `tabProfile/Orders/Wishlist/Addresses/Notifications`, `personalDetails`, `fullNameLabel/genderLabel/dobLabel/emailLabel/phoneLabel`, `lockedNote` ("Contact support to change"), `verified`, `editProfile/saveChanges/cancelEdit`, `prefsTitle/prefsSub` + the four pref title/sub pairs, `addNewAddress/defaultLabel`, `wishEmpty/wishEmptyMsg/moveToCart/savedItems`, `backToOrders`, `logout`, timeline labels `timelinePlaced/Confirmed/Processing/Shipped/Delivered`, `orderCancelled/orderItems/deliveryAddress`. Implement with your i18n framework; Bengali renders in `Noto Sans Bengali`.

## Assets / Icons
- **Icons** are inline stroke SVGs (24×24 viewBox, `stroke: currentColor`, `stroke-width: 1.7`, round caps/joins). Used: user, box, heart (+ filled variant for saved), map-pin, bell, lock, log-out, edit, plus, back-arrow, check. Replace with the codebase's existing icon set (Lucide/Heroicons match this style closely — Lucide especially).
- **Product images** are diagonal-striped placeholder boxes with a mono filename label. Replace with real `<img>`/image components.
- No external image files — nothing to migrate.

## Files
- `Rashid's Mart.dc.html` — the full storefront prototype. The account page is the block under `<!-- ============ ACCOUNT ============ -->` (search that comment). Design tokens live in the `<style>` in `<helmet>` (`.rm-store` and `.rm-store[data-theme="dark"]`). Section markup + all logic (state, handlers, i18n `en`/`bn` objects, `STATUS` pill map, `accountNav`, `prefItems`, `wishlistItems`) are in the same file.
- `Rashid's Mart.html` — self-contained bundled build (open directly in a browser to click through the live account page).

> Tip for implementers: open `Rashid's Mart.html`, go to Account (top-right), and click through Profile → edit, Orders → a "View details" → tracking, Wishlist → Move to cart, and Notifications toggles to see every state before building.
