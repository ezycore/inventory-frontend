# Changelog

All notable changes to the EzyCore frontend (`inventory-frontend`). One entry per
production deploy. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions: [Semantic Versioning](https://semver.org/) — see "Releasing" in
[`CLAUDE.md`](CLAUDE.md) for how to cut one.

The running release is shown at the bottom of the user menu (`v1.0.0 · <commit>`).

## [Unreleased]

### Changed
- Warranty help guide (en + bn) says warranty starts switched off and where to turn it on —
  it is opt-in from inventory-backend's warranty opt-in release.

## [1.3.0] - 2026-10-08

### Added
- Purchases: the Discount (per unit) field on the add-product row shows only when the order has a
  supplier discount. Without one the row is Sale Price + Cost Price, cost opens at what you last
  paid and a typed Sale Price no longer turns into a fake discount (the 1200 / 1200 / 0 row).
  Adding a line at cost 0 warns. The Edit Item dialog follows the same rule. Order details are
  unchanged.
- Purchases: a cart line's Total is quantity × cost price, the same basis as the subtotal. It
  used sale price − discount, which showed ৳15,000 on a line costing ৳0.
- The cart shows each product's warranty under its name ("12 months · Replacement", note on
  hover) on New Sale and the POS counter, while warranty is on.
- Warranty: a Warranty section on the product form, a warranty line under each item on printed
  invoices, and Sales → Warranty to check a sale by invoice or phone and log/track claims
  (repair, supplier, replacement from stock). Feature switch under Settings → Features.
- Sale Summary shows each item's warranty under its name ("12 months · Replacement · Covered
  until …"), in red as "Expired on …" once it has run out.
- Serial / IMEI numbers (shown while warranty is on): a "Record serial / IMEI number of each unit
  sold" switch on the product form; the cart asks for one code per unit (scan or type, camera too)
  and warns on a bad IMEI or a code already sold; missing codes ask once and never block. Codes
  print on the invoice, show on the sale, and managers can add/correct them afterwards ("Add / edit
  serials", also on an online order). Warranty lookup finds a sale by serial at any branch; claims
  pick the unit by its code and a replacement records the new unit's code; returns can name the
  units coming back.
- POS and sale lines show "N held for online orders" under Available when confirmed
  storefront orders hold some of the stock (needs inventory-backend with `reservedQuantity`).

### Changed
- Storefront product page: a product with only one photo no longer shows a one-thumbnail rail
  beside it; the main photo takes that space instead.

### Fixed
- Online orders: the printed invoice (admin order page, single or bulk) now shows each item's
  warranty and serial / IMEI numbers from the order's sale, like a counter invoice.
- Serials: a sold-out product's sale line can still get its missing codes added; the editor now
  asks the server which lines track codes instead of the in-stock list.
- Serials: the change history names who made each change; the sale line says "N missing"; the
  warranty lookup strikes through returned codes; the replacement dialog says IMEI for an IMEI
  product and "This is the faulty unit's number" instead of "Entered twice on this sale".
- Sales History: the Sale Summary drawer shows serials saved from inside it straight away, instead of
  only after closing and reopening it.
- Sale and POS batch pickers no longer offer expired batches — choosing one only failed at
  Confirm. Stock adjustment still lists them for write-off.
- Receipt & Print: "Organization profile" links now open `/settings/organization` instead of the personal `/profile` page.
- Storefront product cards: a tag badge on the photo ("New Arrival | 12″ × 20″ Cushions") no longer
  cuts off at a fixed ~104px. It now uses the whole row and only shortens with "…" when it would
  actually run off the card.
  
### Deploy notes
- **Deploy inventory-backend first.** Its warranty / serial / `reservedQuantity` release (still
  under its Unreleased when this was cut) must be live before this one, or Sales → Warranty,
  the serial editor and "held for online orders" call routes that don't exist yet.
- Warranty needs inventory-backend with `/api/warranty` (its next release) deployed first.
- Serial / IMEI needs the same inventory-backend release (`/api/warranty/serials/check`,
  `/api/warranty/sales/:id/serials`, `serialKind` on sellable products and barcode lookup).

## [1.2.0] - 2026-10-05

### Added
- Printing: A5 (portrait, half an A4 sheet) for every printed document — invoices, receipts,
  purchase orders, returns, statements and online-order invoices. It's in the print menu, the
  default-paper setting and the live preview, and has its own logo size. A5 keeps everything A4
  prints (signature, watermark, bank details, terms, VAT amount column) in a tighter layout.
- Online Store → Campaigns: **Exclude some products** lets a campaign leave out categories,
  sub-categories, tags or single products, e.g. a storewide sale except Clearance. It is offered on
  every scope except hand-picked products. Turning it off clears the exclusions on save. Needs
  inventory-backend with campaign `exclude` (same release).
- Pages → Product: a **Text** or **Collapsible text** part beside the photos can be limited to products
  in chosen categories or with chosen tags (**Products**, in the part's settings) — e.g. a size chart on
  clothing only. The part list marks it **On some products**; other parts always show.
- Pages → a **Product grid**, **Selected products** or **Product carousel** section set to pick
  products by hand: the chosen products are now a list you can **drag into order** (or move with the
  arrow keys), in the order the shop shows them. Products are added with **Add a product…** and
  removed with ✕. A product that has since been deleted reads **Product no longer available**.
  Before, the only way to change the order was to remove products and add them back.
- Online Store → Collections: **Arrange All products** and, on each collection, **Arrange products**
  let you drag your store's products into your own order. Products → Tags has the same for a tag
  (**Arrange in online store**). Products you haven't placed show under **Not placed yet**, and
  you can save, discard or reset to the store's default. A **Custom order** label marks an
  arranged list. The screen warns when the store opens on a sort other than Featured, since that
  hides the order. Help: "Choose what to sell online" → Put your products in order.


### Changed
- Storefront, on phones: the breadcrumb on product and category pages is now a single
  **‹ Parent category** link instead of the full trail, with less space above and below it, so the
  photo, title and price start higher on the screen. Desktop still shows the full trail; search
  results are unaffected (the structured breadcrumb is unchanged).
- New Purchase / Edit Purchase: "Stock" is now **Current Stock**, "Price (MRP)" is now **Sale Price**, "Discount" is now
  **Discount (per unit)**, and the add-product row reads Sale Price → Discount → Cost Price
  so it follows Sale Price − Discount = Cost Price. Labels only; nothing about the math changed.
- Dashboard: Quick Actions moved from the bottom of the page to right under the greeting, above
  the period filter. New Sale and Online Orders are now large tiles, Online Orders and Low Stock
  show a live count, and Customers and Customize Store are new shortcuts. Transfer Stock and
  Adjust Stock were removed from the dashboard (they're still in the sidebar). Phones get a
  full-width New Sale button over an app-style icon grid. Every shortcut is now a real link, so
  it opens in a new tab and keyboard focus shows a ring. Same feature/permission gating as before.

### Fixed
- Breadcrumbs: "Online Store" on every Online Store page now opens Store Overview directly
  instead of an address that only redirected there.
- Dashboard chart: the title now names the lines actually drawn. A shop with POS and the online
  store off but purchasing on saw its purchases line titled "Orders"; it now reads "Purchases"
  (and "Orders vs Purchases" for an online shop that also buys). A chart with no line the user
  may see is no longer drawn at all.

### Deploy notes
- A5 printing needs the inventory-backend release that accepts `a5` as a paper size, deployed
  **first**. Against an older backend, saving A5 as the default paper or setting an A5 logo size is
  refused (printing on A5 from the menu still works).
- Needs the inventory-backend release that accepts `categoryIds` / `tagIds` on product parts, deployed
  **first** — an older backend refuses those saves.
- **Deploy order: inventory-backend 1.2.0 first, then this release right after** (every note above
  needs it). Backend 1.2.0 drops the `actions.quick` dashboard block, so frontend 1.1.0 shows no
  quick menu until this one is live; this frontend never reads that block.
- Ship **after** inventory-backend with `/api/ecommerce/product-orders`: the Arrange screen and the
  Collections and Tags badges call it, and an older backend answers 404. `types/api-generated.ts`
  was regenerated against it.

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
