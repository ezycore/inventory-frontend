# Changelog

All notable changes to the EzyCore frontend (`inventory-frontend`). One entry per
production deploy. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions: [Semantic Versioning](https://semver.org/) — see "Releasing" in
[`CLAUDE.md`](CLAUDE.md) for how to cut one.

The running release is shown at the bottom of the user menu (`v1.0.0 · <commit>`).

## [Unreleased]

## [1.1.0] - 2026-10-04

### Added
- Purchases: Price (MRP) is editable when adding or editing a line. A changed price
  updates the product's MRP (and its own online price, if set) when the purchase is
  saved; a hint under the field says so, per piece for pack purchases.
- New Sale and POS: the line price is editable for that sale (the product's MRP is not
  changed). Combo lines stay fixed; a customer discount follows the new price.

### Changed
- Add Product: **Track stock** is now on by default, so a new product is stocked at the
  current location (opening quantity may be 0) instead of being missing from Current Stock.
- Add Product: Sell price (per unit) starts at 0 instead of empty.
- New Purchase: Invoice Date defaults to today on the organization's calendar
  (also after each save, and for a draft that has none).
- New Purchase and Edit Purchase Order now share one edit-item dialog (Price and
  Cost editable in both).
- Sidebar: the product list under Products is now labelled "All products" (bn "সব পণ্য")
  instead of repeating "Products". The page title and breadcrumb are unchanged.
- Add Product: Base unit starts on "Piece" when no unit is marked as default
  (a unit the merchant marked default still wins; editing a product is unaffected).

### Removed
- The "Remember Cost Price" checkbox (it was never sent to the server), and the
  disabled "Per-line cost will update product cost on save" checkbox on Edit
  Purchase Order.

### Fixed
- New Purchase and Edit Purchase Order: a product with no stock at this location yet
  could be picked but not added ("Invalid input: expected string, received object").
  It now adds, and the purchase creates its stock record.

### Deploy notes
- Needs inventory-backend ≥ 1.1.0 (`updateMrp` on purchase lines).
  Deploy the backend first: an older backend rejects nothing, but silently ignores the flag.

## [1.0.0] - 2026-10-03

First versioned release. Everything live before this date is the baseline; the
entries below are what this deploy adds on top of it.

### Added
- POS: full-screen counter at `/sales/pos`; every entry point opens it in its own tab.
- Receipt & print setup v2: page sections, item columns, totals, signature, payment
  details, QR, per-document overrides, copies.
- List pages keep page, filters and sort in the URL, so Back returns to the same view.
- Release version shown in the user menu.
- Production deploys tag the release (`vX.Y.Z`) automatically once the deploy
  succeeds; an un-bumped version is warned about, not re-tagged.

### Changed
- "New Sale" is out of the sidebar; every "new sale" button opens POS. POS's top bar
  no longer shows the shop name or the location switcher.
- Filters: menus open below their field, start with an "All …" item, keep the ✕
  visible, and a set chip shows its filter name; the Filters panel opens downward,
  lists only filters not on the bar, and applies each change at once.
- Wide screens get the 2560px variant of storefront builder images.
- Picking a hero shape or height in the page editor clears the other.
- Customize sidebar redesigned.

### Removed
- The classic storefront and its home; themes are look-only.
- Fixed-amount customer discounts from the UI (Discounts filter, stat card, product
  discount row).

### Fixed
- A discount typed on POS / New Sale for a customer without a default discount
  (Walk-in) was taken as ৳ instead of %.
- POS camera scans restarting and adding the same item twice.
- Printing from the sale drawer includes the payments already loaded.
- Receipts print "VAT Reg. No (BIN)" instead of the legacy "Tax Reg. No".

### Deploy notes
- **Deploy together with backend 1.0.0** — the classic storefront is gone from both.
