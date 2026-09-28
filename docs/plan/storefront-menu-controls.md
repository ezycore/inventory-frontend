# Storefront menu controls — review + improvement plan

Status: **Phases 0–4 BUILT 2026-09-24, uncommitted** — targeted tests, typecheck and lint green (one pre-existing
error elsewhere); full suites pending. Browser QA done the same day on the UriiBaba QA clone: phone accordion /
step-in / current-department, desktop list / columns / full-width / More / click mode / touch tap, row-less headers,
sidebar modes, Customize save round-trip. Fixed during QA: the sidebar flyout painted under the product grid
(sticky rail had no z-index). Not verifiable there: More re-fitting on window resize (the browser window reported
`hidden`, which pauses ResizeObserver). Phase 5 (optional) not started. Owner approved decisions A–D the same day — see §4.

Scope: the storefront's category/link navigation on **phone first, desktop second** — the header
menu, the dropdowns, the category sidebar ("rail"), the phone menu drawer/sheet and the phone
category chips — and the Customize controls that drive them.

---

## 1. Where the menu belongs: Customize, not the page editor

The owner's instinct is right. The menu is **site frame**: it is drawn by the shell on every page,
so it belongs in Customize → *Site frame*, beside Header / Phone bar / Page layout. Every row in that
rail is site-wide on purpose (`parts-rail.tsx`, 2026-09-20 split) and the page editor
(`/ecommerce/pages`) holds only one page's own sections.

One narrow per-page need does exist, and it is a *switch*, not a second menu: a landing page may want
the menu hidden (distraction-free campaign page). That is Phase 5, optional.

One correction to the premise: the menu **position is already controllable in Customize** without
changing theme — it is just spread over three rows the merchant may not connect:

| What the merchant wants | Where it is today |
|---|---|
| Menu across the top vs. departments down the left | Customize → Site frame → **Page layout** (`stacked` / `rail` "Category sidebar") |
| Desktop header shape (row under logo, centred, none…) | Customize → **Header → Layout** (6 anatomies) |
| Phone: hamburger drawer vs. bottom sheet vs. chips row | Customize → **Phone bar** (5 templates + slot editor, `menuStyle`, `row`) |
| Which links: categories vs. hand-built | Customize → **Header → Menu links come from** |

What is missing is control over how the menu **behaves** — expanded or collapsed, which department
opens first, how sub-categories are shown — and several places where the existing controls
silently do nothing.

---

## 2. Review of the current system

### 2.1 Data

- Category tree is **two levels** (parent → sub-category). `storefront-taxonomy.service.ts` returns
  listed parents with their listed `children`; an unlisted parent hides its children.
- Header menu: `nav.header: StoreMenuItem[]` — items of type `category | page | url | collections`,
  each with optional `children` (one level). `templates.headerMenu` = `collections | custom`.
- A hand-picked `category` item with **no authored children auto-inherits** its sub-categories
  (`expandHeaderMenu`, `header-nav.tsx`). A `collections` block expands to every listed parent.
- Hover look: `design.navHover`, `design.navChildHover` (backend schema fields).
- Phone chrome: `templates.mobile` + `theme.mobile` overrides (`lib/storefront-mobile.ts`).

### 2.2 Phone (primary)

`MobileMenuPanel` (`components/storefront/mobile/mobile-menu.tsx`) — one body in a `drawer` or `sheet`.

| # | Finding | Severity |
|---|---|---|
| M1 | **Ignores the menu source.** It always prints *every* listed category, *then* the custom menu flattened underneath. A merchant on `custom` sees their categories twice (once from the tree, once from their menu); a merchant who built a menu to *leave out* a category cannot, on the phone. The Header setting only governs desktop. | **High** — control that does nothing on the main device |
| M2 | **Everything fully expanded, no collapse.** 2 parents × 20 sub-categories = 42 rows before *My account*. This is exactly the owner's example; there is no accordion and no "open first category" choice. | **High** |
| M3 | Custom-menu **children are flattened to top level** (not indented) — a sub-item is indistinguishable from a department. | Medium |
| M4 | No "View all ‹Category›" row. Tapping the parent row navigates, so a shopper cannot both open the group and land on the parent listing without a separate row. Any accordion must solve this (tap label = go, tap chevron = expand, or a "See all" first child). | Medium (design constraint for M2) |
| M5 | **Chips row** (`row: "chips"`, `CategoryChips`) shows parents only; with 2 parents the row is two chips and useless — sub-categories never surface. No option to show sub-categories as chips. | Medium |
| M6 | No category thumbnails in the panel, although categories carry images (used by home category tiles). Big win for Bangla-reading shoppers scanning pictures. | Low / nice |
| M7 | Rail shell is `sf-desktop-only`, which is correct — but Customize doesn't say that the phone falls back to the menu panel. | Low (copy) |

### 2.3 Desktop (secondary)

`HeaderNav` (`header-nav.tsx`), `CategoryRow` / `headerLinks` (`header/header-shared.tsx`),
anatomies in `header/desktop-variants.tsx`, `CategoryRail` in `shells/rail-shell.tsx`.

| # | Finding | Severity |
|---|---|---|
| D1 | **Menu editor does nothing on 2 of 6 anatomies.** `search-first` and `clinical` render no link row at all; the Header panel still shows the full menu editor + hover settings. | **High** — dead control |
| D2 | **No dropdowns on `minimal` / `boutique`.** They use `headerLinks()`, a flat list — custom children and auto sub-categories are dropped. | High |
| D3 | Dropdown is one narrow column (`minWidth: 180`). 20+ sub-categories → a list taller than the screen. No columns, no mega panel, no images, no "View all". | Medium |
| D4 | **Hover-only open.** On a tablet (≥680px, touch) tapping the top link navigates; the dropdown is unreachable. Keyboard focus works, touch doesn't. | Medium |
| D5 | Top row `flexWrap: wrap` — many top items wrap to a second line instead of overflowing into "More". | Low |
| D6 | **Rail expands only the active department.** On the home page nothing is open; there is no "first open / all open / flyout on hover" choice — the owner's "side view" case. | **High** (requested) |
| D7 | Rail and header dropdown ignore the custom menu entirely (rail always = category tree). Acceptable if stated; otherwise surprising. | Low — decide (§4) |

### 2.4 Customize editor

`parts/header-part.tsx`, `menu-item-fields.tsx`

| # | Finding |
|---|---|
| E1 | Menu *content* and *behaviour* live under "Header", but they drive the phone too (after M1 is fixed) and the rail. Merchants look for "Menu". |
| E2 | Category picker lists every category flat by name — two sub-categories named "Accessories" under different parents are indistinguishable (the editor stores the bare leaf slug; `catMap` picks the first). |
| E3 | Sub-items cannot be reordered (only removed); top items only via up/down arrows. |
| E4 | Auto-inherit of sub-categories is invisible: an item with no children silently grows a dropdown. No "Show sub-categories automatically" toggle per item. |
| E5 | No per-device preview hint: settings that are desktop-only (hover) vs phone-only aren't labelled. |

---

## 3. Target design

### 3.1 One "Menu" part, per-device behaviour

Split Customize → Site frame → **Header** into:

- **Header** — layout (anatomy) + hover look. Unchanged otherwise.
- **Menu** *(new row, directly under Header)* — *what* is in the menu and *how it opens*, with a
  Phone / Desktop switch at the top that also flips the preview device (phone first, selected by
  default). Contains:
  1. **Menu links come from** — Collections / Custom (moved from Header). Now governs **both devices**.
  2. **Sub-categories** — `auto` (from the category tree) / `off` (top level only). Global.
  3. Phone behaviour block (below).
  4. Desktop behaviour block (below).
  5. Custom-menu editor (when source = custom), improved per §3.4.
  6. A pointer line: "Want departments down the left? → Page layout" (deep link to `shell`).

### 3.2 Phone settings (`menu.mobile.*`)

| Setting | Values | Default | Notes |
|---|---|---|---|
| `layout` | `accordion` · `drill` · `expanded` | **decision §4-A** | `accordion`: parents collapsed, chevron expands in place. `drill`: tap parent → slide to its sub-category screen with a Back row (best for many subs). `expanded`: today's behaviour. |
| `openFirst` | `none` · `first` · `active` · `all` | `active` (fallback `first`) | Which group is open when the panel opens. `active` = the department the shopper is browsing. Applies to `accordion`. This is the owner's "customer can choose first category open or not" — merchant picks the default, shopper still toggles. |
| `viewAll` | bool | `true` | Adds "All ‹Parent›" as first child row so the parent listing stays one tap away (solves M4). |
| `images` | bool | `false` | Small round category thumbnail on parent rows when the category has an image. |
| `chips` | `parents` · `parents+subs` · `active-subs` | `parents` | For the chips row. `active-subs`: on a collection page, chips show that department's sub-categories — solves the 2-parent case. |
| `drawerWidth` *(added 2026-09-27)* | `narrow` · `regular` · `wide` | `regular` | The slide-in (`menuStyle: drawer`) panel only; the sheet is full width. Owner report: the shared 94% drawer covered a phone. Every step leaves a strip of the shop to tap closed (`.sf-drawer-left[data-width]`). |

Rendering rules (fixes M1/M3): the panel prints **the resolved menu** — the same list the desktop
uses (collections → tree, custom → merchant's items with their children/auto children), indented
correctly. Account / language / theme rows stay as today.

### 3.3 Desktop settings (`menu.desktop.*`)

| Setting | Values | Default | Notes |
|---|---|---|---|
| `dropdown` | `list` · `columns` · `mega` | `list` | `columns`: auto 2–4 columns when > 8 children. `mega`: full-width panel, one column per sub-category group, optional images and "View all". |
| `openOn` | `hover` · `click` | `hover` | `click` fixes touch tablets (D4). Even on `hover`, a touch pointer gets tap-to-open (`pointerType === "touch"`), so this is a preference, not a bug fix. |
| `railOpen` | `active` · `first` · `all` · `flyout` | `active` | Rail only (D6). `flyout` = sub-categories pop out to the right on hover, rail stays one line per department. |
| `overflow` | `wrap` · `more` | `wrap` | `more` collapses overflowing top items into a "More ▾" dropdown (D5). |

Anatomy fixes (D1/D2): `minimal` and `boutique` render through `HeaderNav` (keeping their own
typography via class/props) so dropdowns work. For `search-first` / `clinical`, add a
**"Show menu row"** toggle (`menu.desktop.row`, default **off** so no live shop changes); when off,
the Menu part says plainly "This header layout has no menu row on desktop — your menu still shows on
phones", instead of presenting a dead editor.

### 3.4 Editor improvements

- Category picker shows **"Parent › Child"** labels and stores the **slugPath** for new items
  (`category` value by path; resolver accepts both leaf slug (legacy) and path). Fixes E2 without a
  migration — old leaf-slug items keep resolving.
- Drag-to-reorder for items and sub-items (reuse the builder's sortable list if one exists; else
  up/down on children too).
- Per category item: **"Sub-categories: automatic / pick my own / none"** — makes E4 explicit.
  Stored as `childrenMode?: "auto" | "custom" | "none"`, absent = today's rule (auto when no children).

### 3.5 Storage

**`nav.menu`** — a sibling of `nav.header`, **not** `theme.design`. Decision §4-D says menu behaviour
survives a theme switch, and a ready-made theme stamps `theme`/`templates` wholesale; `nav` is the
merchant-owned block no theme writes, so living there makes "survives a theme" structural rather
than a skip-list. (This section originally proposed `design.menu`; D moved it.)

Only fields that differ from the defaults are stored, same discipline as `theme.mobile`:

```ts
nav.menu?: {
  subcategories?: "auto" | "off";
  mobile?: { layout?; open?; viewAll?: boolean; images?: boolean; chips? };
  desktop?: { dropdown?; openOn?; railOpen?; overflow?; row?: boolean };
}
nav.header[i].childrenMode?: "auto" | "custom" | "none";   // §3.4, E4
```

The menu SOURCE stays in `templates.headerMenu` — a theme may still stamp it, as today.

Loose capped strings (`maxLength: 24`) for the option ids, matching `design.*` / `theme.mobile`: the
option catalogue is the frontend registry (`lib/storefront-menu.ts`), whose resolver narrows every
value and falls back to the default for an unknown id. `childrenMode` is an enum because
`nav.header[].type` beside it already is.

Not a `responsive: true` `{base, mobile?}` field: phone and desktop menus are different *controls*
(accordion vs dropdown), not one value with a phone override, so two named blocks read better.

Backend: `storefront-settings.model.ts`, `storefront-settings.types.ts`, validator,
`organization.dto.ts` (admin read-back) + contract test, `pnpm docs:all`. The public store DTO types
`nav` as `z.unknown()`, so the storefront needs no DTO change. Additive only — no migration.

---

## 4. Owner decisions — CLOSED 2026-09-24 (owner agreed with all four recommendations)

- **A. Phone default layout → `accordion` for every shop**, existing ones included, with the
  shopper's current department open (`open: "active"`, falling back to the first). The fully
  expanded list is the defect being fixed; `expanded` stays available as a merchant choice.
- **B. Phone follows the menu source.** `custom` → the phone shows the merchant's menu, not the
  category tree beside it. Safety net: when a custom menu names no category and no collections block,
  the category tree is prepended so a phone shopper is never left with no departments, and Customize
  says so.
- **C. The category sidebar (rail) is always the category tree**, whatever the menu source. It is
  literally *Category* sidebar.
- **D. Menu behaviour survives a theme switch** → stored in `nav.menu` (§3.5), not `theme.design`.

---

## 5. Phases

Tests run once at the end (owner rule); targeted test files only during phases.

**Status (2026-09-24): Phases 0–4 built in one pass.** What shipped differs from the text below in
these places — the text is kept as the plan that was agreed:

- The resolver is `buildMenuTree` / `phoneMenuTree` / `categoryNodes` (not one `resolveMenu`), read
  through `useStoreMenu`. `headerLinks`, `expandHeaderMenu`, `menuHref` and `catMap` are deleted.
- `openFirst` is stored as `mobile.open`; phone "Current" = the browsed department else the first,
  while the sidebar's "Current" keeps its original rule (browsed only) — the two read the same word
  differently, so the resolver takes a rule (`PHONE_OPEN_RULE` / `RAIL_OPEN_RULE`), not the id.
- Chips: `parents` | `all`. The proposed `active-subs` was dropped — on a collection page it would
  duplicate the sub-category strip the page already draws (the shared rule the filter plan needs).
- `?part=header` needed no redirect: the Header row still exists (layout + hover); Menu is a new row.
- E5 (device labels): the Menu part splits its behaviour under a Phone / Computer switch instead of
  labelling each control.
- Found on the way, fixed: the admin settings DTO's `navLinkType` lacked `collections`.

**Phase 0 — shared resolver (no visible change).**
One `resolveMenu(store, categories, settings)` in `lib/storefront-menu.ts` returning a
`MenuNode[]` tree (label, href, children, image, isActive) — consumed by `HeaderNav`, the anatomies'
`headerLinks`, `MobileMenuPanel`, chips and rail. Moves `catMap`/`expandHeaderMenu`/`resolveHref`
out of `header-nav.tsx`. Accept `category` values as leaf slug **or** path. Unit tests.

**Phase 1 — phone (primary).**
Panel renders the resolved tree (M1, M3); accordion + drill + expanded; `openFirst`; `viewAll`;
`images`; chips modes (M5). Backend fields for `menu.mobile` + `menu.subcategories`. Customize
**Menu** part with the Phone block and preview flipping to phone. Browser-QA at 390px on both
`drawer` and `sheet` templates.

**Phase 2 — desktop fixes.**
`minimal`/`boutique` through `HeaderNav` (D2); touch tap-to-open (D4); `search-first`/`clinical`
"Show menu row" toggle + honest copy (D1); `railOpen` (D6).

**Phase 3 — desktop richness.**
`dropdown: columns | mega` (D3), `openOn: click`, `overflow: more` (D5).

**Phase 4 — editor.**
"Parent › Child" picker storing paths (E2), reorder children / drag (E3), `childrenMode` (E4),
device labels on every setting (E5). Move source + editor from Header into Menu; `?part=header`
deep links for the menu keep working via `RETIRED_PART_IDS`-style redirect.

**Phase 5 — optional, per page.**
Landing/builder page setting "Hide menu on this page" (header stays, menu row / phone menu button
hidden). Only if the owner wants campaign pages distraction-free.

**End:** full FE + BE suites, `pnpm docs:all` (BE), update `docs/features/ecommerce*.md` (all three),
master reference if a settings count changes, browser QA phone → desktop.

---

## 6. QA checklist (phone first)

- [ ] 390px, `drawer` template, collections source, 2 parents × 20 subs: accordion, active group
      open on a collection page, first group open on home when `openFirst: first`.
- [ ] Same on `sheet` (tab-bar) template; sheet scroll at 72vh with a long open group.
- [ ] `drill`: Back row returns; Esc/scrim closes; focus lands on first row.
- [ ] Custom source: phone shows only the custom menu (+ tree fallback per §4-B); no duplicates.
- [ ] "All ‹Parent›" row goes to the parent listing.
- [ ] Chips `active-subs` on a collection page shows that parent's subs; home shows parents.
- [ ] Desktop: each of 6 anatomies — dropdown present or honest "no menu row" copy.
- [ ] Tablet (touch, 800px): tap opens dropdown, second tap / "View all" navigates.
- [ ] Rail: `first`, `all`, `flyout`, `active` on home and on a collection page.
- [ ] Existing shop with no `menu` stored renders per §4-A decision, nothing else moves.
- [ ] Bangla UI: long Bangla labels in accordion rows and mega columns don't clip.
