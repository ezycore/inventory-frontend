# Changelog

All notable changes to the EzyCore frontend (`inventory-frontend`). One entry per
production deploy. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions: [Semantic Versioning](https://semver.org/) — see "Releasing" in
[`CLAUDE.md`](CLAUDE.md) for how to cut one.

The running release is shown at the bottom of the user menu (`v1.0.0 · <commit>`).

## [Unreleased]

### Added
- Warranty: a Warranty section on the product form, a warranty line under each item on printed
  invoices, and Sales → Warranty to check a sale by invoice or phone and log/track claims
  (repair, supplier, replacement from stock). Feature switch under Settings → Features.
- Sale Summary shows each item's warranty under its name ("12 months · Replacement · Covered
  until …"), in red as "Expired on …" once it has run out.
- POS and sale lines show "N held for online orders" under Available when confirmed
  storefront orders hold some of the stock (needs inventory-backend with `reservedQuantity`).

### Fixed
- Sale and POS batch pickers no longer offer expired batches — choosing one only failed at
  Confirm. Stock adjustment still lists them for write-off.
- Receipt & Print: "Organization profile" links now open `/settings/organization` instead of the personal `/profile` page.

### Deploy notes
- Warranty needs inventory-backend with `/api/warranty` (its next release) deployed first.

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
