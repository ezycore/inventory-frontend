# Storefront filter controls — review + improvement plan

Status: **PLAN — not started** (drafted 2026-09-24). Owner decisions in §4 close before Phase 1.
Companion to [`storefront-menu-controls.md`](storefront-menu-controls.md); sequence after that
plan's Phase 0 (shared sub-category rule) — see §3.6.

Scope: the product filters and sort on the three catalogue pages that share them — **all products /
category pages** (`collection-grid` section), **campaign pages** (`campaign-main`) and **search**
(not a builder page) — phone first, desktop second, plus the merchant controls for them.

---

## 1. Where the controls belong

Correction to the note given before this review ("filter settings go on the collection section in
the page editor"): the filter is drawn by **three** pages, and search is not a builder page, so a
setting that lived only on `collection-grid` could never reach search results. The right shape is
the one **Product cards** already uses:

- **Site-wide default** — new Customize row **"Filters & sort"** under *Across the site*, next to
  Product cards. Applies to collection, campaign and search.
- **Per-section override (later, optional)** — `collection-grid` / `campaign-main` may override a
  few shape fields (e.g. a campaign page with filters off), the same way `CARD_LOOK` overrides the
  site card look.

---

## 2. Review of the current system

Files: `components/storefront/filter-panel.tsx` (panel), `filter-toolbar.tsx` (Filters button,
chips, sort), `use-catalog-facets.ts` (URL state + facet data), `collection/collection-page.tsx`,
`search/search-page.tsx`, `subcategory-strip.tsx`; backend `storefront-catalog.service.ts`
(`buildFilter`, `filteredRows`, `listBrands`, `listTags`), `storefront.validator.ts`.

What works well and must be kept: **the URL is the single source of truth** (shareable, reload-safe,
Back restores page); brand and tag lists are **scoped to the current result set** with counts
(`facetRows` omits its own facet); a category page hides the category facet; empty brand/tag groups
disappear; the drawer shows a live "Show N results" button.

### 2.1 Phone (primary)

| # | Finding | Severity |
|---|---|---|
| P1 | **Filters are only reachable through one button at the top of the page.** The Filters/Sort row is not sticky; after scrolling 40 products a shopper must scroll back up to refine. | **High** |
| P2 | **Everything is in the drawer, nothing is one tap.** No quick-filter row of chips (e.g. "In stock", "Under ৳500", top brands, sizes) above the grid — the pattern phone shoppers use most. | **High** |
| P3 | **Long, fully expanded category list** on `/products` and search: every parent + every sub-category, no collapse, no counts. Same problem the owner raised for the menu (2 parents × many subs). A code comment forbids hiding children behind a click (a real lesson), so the fix is an accordion with the active parent **open**, not hidden children. | Medium |
| P4 | **Drawer opens from the left**, the same side as the menu drawer. Two different panels from the same edge; the Filters button sits on the right of the toolbar. Bottom sheet is the phone norm for filters. | Medium |
| P5 | Sort is a small popover select beside the Filters button; on a phone it deserves its own sheet or a row in the filter sheet. | Low |
| P6 | Sub-category strip on a category page has **no "All ‹Parent›" chip** — on a child page the only way back to the whole department is the breadcrumb. | Medium |

### 2.2 Desktop

| # | Finding | Severity |
|---|---|---|
| D1 | **"Filters sidebar" layout draws no sidebar.** `templates.collection` / section `layout: "sidebar"` is offered as *"Filters pinned beside the grid"*, but the inline panel was removed in `dcb2efb3` (2026-08-20, "resolve storefront QA issues") with no recorded reason; today it only picks the 3-column grid and the filters stay in the drawer. A merchant control that does not do what it says. | **High** |
| D2 | No horizontal filter bar option (dropdown per facet above the grid) — the common desktop pattern for small catalogues. | Low |

### 2.3 Facets themselves (both devices)

| # | Finding | Severity |
|---|---|---|
| F1 | **No variant-option filters.** Products have variant attributes (`variant.model.ts`: e.g. Size, Colour), but a shopper cannot filter by them. For clothing, cushions, floor mats, shoes this is *the* filter. | **High** — biggest functional gap |
| F2 | **Brand is single-select, tags multi-select (OR).** Inconsistent; a shopper comparing two brands cannot. | Medium |
| F3 | **Price is typed only.** No presets ("Under ৳500", "৳500–1000"), no hint of the catalogue's real min/max. Typing numbers on a phone is the slowest control on the page. | Medium |
| F4 | Category facet has **no counts** and is **not scoped** (brand/tag are). A category can be offered that returns zero products under the current filters. | Medium |
| F5 | On `/products`, picking a category writes `?categoryId=` instead of going to the category's own URL (`/cushions`) — two URLs for one listing; the category page's sub-category strip, heading and SEO are skipped. | Medium |
| F6 | **"In stock" toggle shown to every shop.** For a stock-free organization (inventory tracking off) every product is purchasable, so the toggle is noise — verify in Phase 0 and hide it there. Also always shown when the catalogue has nothing out of stock. | Low |
| F7 | Sort options fixed at 4 (Featured, Newest, Price ↑, Price ↓); merchant cannot choose the **default** sort or hide options. No "Best selling" / "Discount". | Low–Medium |
| F8 | Facet order fixed (Category → Brand → Tags → Price → Availability); merchant cannot reorder, rename ("Tags" means nothing to a shopper — "Occasion", "Fabric" does) or hide a group. | Medium |

### 2.4 Merchant controls

| # | Finding |
|---|---|
| C1 | **No control at all.** The only filter-adjacent setting is the (broken) `sidebar` layout. |
| C2 | Tags are the merchant's free-form attributes, but they appear as one undifferentiated "Tags" group. Tags have `color` but no *group* — so "Cotton" and "Eid" sit together. |

### 2.5 Backend / performance note

`filteredRows` loads a skinny row for every product matching the filter and computes price/stock in
memory; each filter change costs **three** such passes (products, brands, tags). Fine at today's
catalogue sizes (hundreds). Adding variant-option and category counts must **not** add a fourth and
fifth pass — Phase 0 folds them into one facets endpoint (§3.5).

---

## 3. Target design

### 3.1 Customize → "Filters & sort" (site-wide, `design.filters` — stored sparse, like `theme.mobile`)

| Setting | Values | Default | Device |
|---|---|---|---|
| `enabled` | bool | `true` | both — off hides button, chips row and sidebar (sort stays) |
| `groups` | ordered list of `{ id, label?, hidden?, open? }` for `category · price · availability · brand · tags · option:<attributeId> · tagGroup:<id>` | today's order, all shown | both |
| `mobile.entry` | `sheet` · `drawer` | **`sheet`** (§4-A) | phone |
| `mobile.stickyBar` | bool | `true` | phone — Filters + Sort bar sticks under the header when scrolling |
| `mobile.quickChips` | ordered list of up to 6 group ids or presets (e.g. `availability`, `price:presets`, `brand`, `option:Size`) | `[]` (off) | phone — horizontal chip row above the grid; a chip for a group opens a mini-sheet for just that group |
| `desktop.placement` | `drawer` · `sidebar` · `bar` | `drawer` (matches today) | desktop — `sidebar` restores D1; `bar` = one dropdown per group above the grid |
| `priceMode` | `typed` · `presets` · `both` | `both` | both — presets auto-built from the catalogue's price spread (4 buckets, rounded to ৳50/৳100/৳500) unless the merchant types their own |
| `brandMulti` | bool | `true` | both (F2) |
| `showCounts` | bool | `true` | both |
| `sort.default` | `featured` · `newest` · `price_asc` · `price_desc` (+ new ones) | `featured` | both |
| `sort.hidden` | list | `[]` | both |

The existing `layout: "sidebar"` value keeps working: until the merchant sets `desktop.placement`,
`sidebar` layout ⇒ `placement: sidebar` (D1 fixed with no data change).

### 3.2 Phone rendering

- **Sticky toolbar**: `Filters (n)` · `Sort` · result count, sticks under the header (uses the
  existing `--sf-header-h`), hides on scroll-down / shows on scroll-up so it never eats the grid.
- **Quick chips** under it (when configured). Active chips fill; "Clear" at the end.
- **Filter sheet**: bottom sheet, 88vh, groups as an accordion — groups with an active value open,
  first group open otherwise, merchant `open` flags respected. Sticky footer: `Clear` · `Show N results`.
- **Category group** (P3): parents collapsed except the active one; "All ‹Parent›" row first.
  On `/products` a category row **navigates to its collection URL** carrying the other filters (F5).
- **Sort**: its own small sheet with radio rows (P5); on desktop the select stays.
- **Sub-category strip** gains an "All ‹Parent›" chip (P6) and follows the menu plan's shared
  sub-category rule so it never repeats the menu's chips row on the same screen (§3.6).

### 3.3 Desktop rendering

- `sidebar`: sticky left column (≥1024px; below that falls back to the drawer), same accordion
  groups, the sort select stays in the toolbar. Checks the page `shell`: under the **rail** shell a
  second left column is too much — filters sidebar moves to the right or falls back to `bar`
  (decision §4-C).
- `bar`: one button per visible group → popover with that group's rows; chips row below.
- `drawer`: today's behaviour, but from the **right** (P4) so it no longer shares an edge with the menu.

### 3.4 New facets

- **Variant options (F1)**: one group per active variant attribute present in the result set
  ("Size", "Colour"), values as chips (swatches when the value is a colour name — later).
  Multi-select within a group (OR), AND across groups. URL: `?opt.Size=M,L` (attribute name, readable).
  A product matches when **at least one purchasable variant** carries the value (with `inStock` on,
  the variant must be purchasable — not just the product).
- **Tag groups (C2)** — optional: `Tag.group` (string, e.g. "Fabric", "Occasion"); groups become
  their own facet with that heading. Ungrouped tags stay under the renamed "Tags" group.
- **Price presets (F3)**.
- **Sort additions (F7)** — "Best selling" (sale count, needs a denormalized counter or a cached
  aggregate — cost it in Phase 0 before promising it) and "Biggest discount" (from pricing already
  computed in `filteredRows`).

### 3.5 Backend

- One **`GET /storefront/:slug/catalog/facets`** returning `{ categories (counts), brands, tags,
  options, price: { min, max, presets } , anyOutOfStock }` from **one** `filteredRows` pass
  (per-facet "omit own facet" counts computed in memory from the same rows). Replaces the two
  brand/tag calls; the old routes stay until the frontend stops calling them.
- `buildFilter`: `brandId` accepts a comma list (F2); `opt.*` params → `variants` match; category
  counts.
- Settings: `design.filters` sub-schema in `storefront-settings.model.ts` + types + validator +
  public DTO + contract test; `Tag.group` (additive, optional). `pnpm docs:all`.
- Additive only — no migration. Absent settings = today's behaviour except where §4 changes a default.

### 3.6 Link with the menu plan

Sub-categories can appear in the menu, the phone chips row, the sub-category strip and the
filter's category group — up to four times on one phone screen. The menu plan's Phase 0 resolver
(`lib/storefront-menu.ts`) owns one rule, reused here:

- On a **category page**: sub-category strip shows (with "All ‹Parent›"); filter hides the category
  group (as today); menu chips row switches to parents when the strip is visible.
- On **/products and search**: no strip; filter shows the category group as an accordion.

---

## 4. Owner decisions (close before Phase 1)

- **A. Phone filter entry** — switch every shop from the left drawer to a bottom sheet? Recommended:
  yes; it is the phone convention and frees the left edge for the menu.
- **B. Sticky filter bar default on** for existing shops? Recommended: yes (hide-on-scroll-down keeps
  it out of the way).
- **C. Filters sidebar + category-sidebar shell** together — filters on the right, or disallow and
  use the bar? Recommended: right-hand column.
- **D. Variant-option filters: automatic** for every attribute in use, or merchant picks which
  attributes become filters? Recommended: automatic, merchant can hide one in `groups`.
- **E. "Best selling" sort** — worth a sales counter on products? Recommended: defer to Phase 5 and
  ship "Biggest discount" first.

---

## 5. Phases

Tests run once at the end; targeted test files only while building.

**Phase 0 — groundwork (no visible change).**
Facets endpoint (§3.5) + FE `useCatalogFacets` on it; verify F6 behaviour for stock-free orgs;
settings schema + resolver `resolveFilterSettings(store, section?)`; wire the shared sub-category
rule from the menu plan.

**Phase 1 — phone.**
Bottom sheet + accordion groups + sticky toolbar + sort sheet (P1, P3–P5); category rows navigate
to collection URLs (F5); "All ‹Parent›" chip (P6); counts on categories (F4). Customize "Filters &
sort" row with the phone block. Browser QA at 390px on collection, campaign and search.

**Phase 2 — facets.**
Variant options (F1), brand multi-select (F2), price presets (F3), hide "In stock" where it is
meaningless (F6), group order / rename / hide (F8).

**Phase 3 — desktop.**
`sidebar` placement restored (D1) incl. rail-shell rule; `bar` placement (D2); drawer from the right.

**Phase 4 — quick chips + merchandising.**
Phone quick-chip row; default sort + hidden sorts (F7); tag groups (C2) with an admin field on the
tag form.

**Phase 5 — optional.**
Per-section overrides on `collection-grid` / `campaign-main`; "Best selling" sort; colour swatches.

**End:** full FE + BE suites, `pnpm docs:all`, update `docs/features/ecommerce*.md` (all three) and
the storefront skill, master reference if an endpoint/setting count changes, browser QA phone →
desktop.

---

## 6. QA checklist (phone first)

- [ ] 390px `/products`: sticky bar appears on scroll-up, hides on scroll-down, never covers the first card row.
- [ ] Sheet: active groups open; "Show N results" count matches grid; Clear resets all but the route category.
- [ ] Category row on `/products` lands on `/cushions?brandId=…` with other filters kept.
- [ ] Category page: strip has "All ‹Parent›"; filter has no category group; menu chips row not duplicated.
- [ ] Size filter `M,L` + in-stock: only products with a purchasable M or L variant.
- [ ] Two brands selected → union; chips remove one at a time; URL shareable and reload-safe.
- [ ] Price preset chip + typed range don't fight (typed wins, preset clears).
- [ ] Stock-free shop: no "In stock" toggle.
- [ ] Search page and campaign page honour the same site-wide settings.
- [ ] Desktop `sidebar` placement: panel sticky, drawer button hidden ≥1024px; with rail shell per §4-C.
- [ ] Existing shop with no `design.filters`: only the §4 default changes are visible.
- [ ] Bangla UI: long group names and Bangla price labels fit in chips and sheet rows.
