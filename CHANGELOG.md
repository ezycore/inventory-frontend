# Changelog

All notable changes to the EzyCore frontend (`inventory-frontend`). One entry per
production deploy. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions: [Semantic Versioning](https://semver.org/) — see "Releasing" in
[`CLAUDE.md`](CLAUDE.md) for how to cut one.

The running release is shown at the bottom of the user menu (`v1.0.0 · <commit>`).

## [Unreleased]

### Deploy notes
- Needs **inventory-backend** with `GET /api/public/signup-options` (the `SIGNUP_ACCESS_KEY`
  change) deployed first. Against an older backend the signup page shows the old open form.

### Added
- **Collect dues from the dashboard in three clicks**: the Receivable card and the Customers page's
  receivable and debtor totals open the customer list filtered to who owes money, biggest first, and
  each of those rows has a **Receive** button beside the amount owed that opens the payment form
  directly. Before, the figures linked nowhere and paying meant finding the filter and a small
  ledger icon.
- **Choose the plan on the signup form**: one card per package with price and limits and the same
  monthly/yearly switch as Billing. A `?plan=` link preselects its plan; with none the entry plan
  is selected. It used to come only from the URL, so opening `/signup` directly could not pick one.
- **While self-signup is closed** (backend `SIGNUP_ACCESS_KEY`), `/signup` shows "We set up your
  store with you" with a link to the contact page, and the login screens say "New to EzyCore? Talk
  to us". The team opens `/signup?key=<key>` to create a merchant's workspace.

### Removed
- The **Updated Date** column on Customers — the last-edit time of the record told a merchant nothing.

### Fixed
- **Receive Payment opened with an empty amount** the first time it was opened for a customer (the
  form read the dues before they had loaded); it now starts at the full amount owed.
- Notification settings: the new template variables (Total paid, Stock status, Online orders)
  have labels in English and Bangla instead of showing their raw names.
- Online order page, returned order: the banner no longer says "the refund was processed" when
  nothing was refunded (a COD parcel refused at the door). It names a refund only when the order
  was paid; otherwise it reads "the sale reversed. Nothing was refunded."
- Online order page, custom (manual) courier: the "sale is still recorded — use Return whole order"
  warning no longer shows once the order has been returned.
- Dashboard Low Stock Alerts lists sold-out products with a "Sold out" badge instead of "All stock
  healthy" beside a "Low Stock · 4" button (S23).
- Dashboard Fulfillment shows **Rejected** apart from **Cancelled** (S31).
- Bangla: Orders Report, Tags, Notifications, Support Access and Meta Ad Reporting have menu labels,
  and the header search reads "খুঁজুন...". A test now fails on any menu item without a label in
  either language (S28).
- Record Expense / Record Income no longer offer a courier's COD account to pay from (S26).

### Added
- Record Expense / Record Income: a **Date** field, today on the shop's calendar by default, no
  future dates; and the categories **Ads & marketing** and **Packaging** (S26).
- Business Position: **Courier charges to come off the payout** under liabilities, so the courier
  money nets to what Courier Payouts says is owed; the asset reads **With courier (COD collected)**
  (S25).
- Dashboard and Orders Report gross profit show **Goods ৳X · delivery ৳Y** under the figure; the
  P&L's gross profit says it is goods only (S24).
- Online Orders, **Closed** tab: chips **All · Cancelled · Rejected · Returned** with their counts
  filter the tab to one status (11 closed = 3 cancelled + 7 rejected + 1 returned). Shown on the
  Closed tab only; the other tabs are unchanged.

### Deploy notes
- Needs **inventory-backend** with the S23–S31 fixes (the release after 1.10.1) for the new fields;
  against 1.10.1 the split, the charges line and Rejected simply do not show.

## [1.9.3] - 2026-10-14

### Deploy notes
- Help text only. Describes behaviour that ships in **inventory-backend 1.10.0**; either can deploy
  first.

### Changed
- Help, "Choose what to sell online" (en + bn): a tag's arranged order now also applies when a
  shopper picks that tag inside a collection, falling back to the collection's own order. The
  behaviour ships in **inventory-backend 1.10.0**.

## [1.9.2] - 2026-10-14

### Fixed
- Online order page, **Activity log**: a step's note is shown under it — the reason given for
  **Handed over in person** and for moving an order back. Notes were saved but never displayed,
  so "saved to the order history" in the hand-over dialog was not true on screen. Live orders
  already carry such notes (the five repaired on 2026-10-13) and show them once deployed.
- A handed-over order no longer talks about a courier: **Fulfillment** reads "Handed over in
  person" with the note (a courier booking that was cancelled stays listed, without re-dispatch),
  and the line under the total says there is no courier charge instead of "Estimated courier
  cost ৳0 — the courier's real charge replaces it after dispatch". Help: "Online orders" (en + bn).
- Printed order invoice and receipt (A4, A5, 80/58 mm, and the shopper's own invoice): the address
  now ends with the **district** the customer picked — it printed "House 31, Road 46" with no town.
  A part already written in the address line is not repeated.
- Dashboard **Gross Profit** in a shop with no cost prices says "Set cost prices to see profit" in
  every period. On a day with nothing dispatched yet it said "Shows once orders are dispatched",
  which stays true only for a shop that has costs. Reads the new `costCoverage.costsSet`.

### Deploy notes
- The Gross Profit wording needs **inventory-backend ≥ 1.9.0** (`costCoverage.costsSet`).
  Against an older backend the tile behaves as before — nothing breaks.

## [1.9.1] - 2026-10-13

### Fixed
- New Purchase / Edit Purchase: the column between Sale Price and Cost Price reads **Margin (per
  unit)** (bn মার্জিন (প্রতি একক)) when the supplier gives no discount — it is `sale price − cost`,
  the shop's margin on each piece, and "Discount" read as money off the purchase. It stays
  **Discount** when the supplier has discount terms. Help: "Receive stock" (en + bn).
- Purchase screens: stock with a missing unit name prints just the number, never "1 null". One
  shared formatter (`formatStockWithUnits`) now serves the add-product row, the order edit row and
  the low-stock import.

## [1.9.0] - 2026-10-13

### Deploy notes
- Needs inventory-backend **≥ 1.8.0** (`POST /ecommerce/orders/:id/hand-over`, `courierName` on the
  courier charges rows). Against an older backend the hand-over dialog fails with 404 and custom
  couriers still read "Courier"; nothing else changes.

### Added
- Order page: **Handed over in person** — for a delivery order the customer collected from you
  (no courier booked, or the courier cancelled the pickup). A note is required; optionally removes
  the delivery charge; marks it Delivered and Paid in one step, the money counted as yours, never as
  held by a courier. **Mark as Delivered** is no longer offered over a courier-cancelled booking.
  Help: "Handle online orders" (en + bn). Needs inventory-backend with `POST
  /ecommerce/orders/:id/hand-over`. "Remove the delivery charge" starts unticked.
- Online Orders: courier filter **Handed over in person**. Orders Report → couriers: a **Handed over
  in person** row (bn সরাসরি হাতে দেওয়া হয়েছে) — such an order is never counted under a courier,
  even one whose cancelled booking it carries.

### Changed
- Sidebar: **Courier Payouts reads "Courier Charges"** (bn: কুরিয়ার চার্জ) while courier payouts are
  off — the page then shows only what couriers billed. It switches back the moment the feature is
  turned on. Same in ⌘K, the breadcrumb and the browser tab.

### Fixed
- Courier charges, "Biggest losses on delivery": the Courier column shows a custom courier's own
  name instead of "Courier" (needs inventory-backend with `courierName` on the rows).
- Breadcrumb: no more duplicate-key warning on Online Orders, where "Online Store" and "Online
  Orders" both link to `/ecommerce/orders`.

## [1.8.0] - 2026-10-12

### Added
- **Courier payouts is its own switch** in Customize workspace (opt-in, like Warranty), no longer
  tied to Cash & Bank. On: the Courier payouts screen (balances, Record payment, payment history),
  the dashboard "coming from couriers" tile and the order's "they owe it to you" line. It counts
  parcels from the day it is switched on, so a shop that never recorded payments does not open
  with months of "owed". Help: "Record courier payments" (en + bn).

### Changed
- **Online Orders:** the buyer chip reads `4 orders · 2 returned` (plus `· N rejected` when any) and
  warns from two returns or rejections. It counted only rejections, so a buyer with parcels back
  read "0 rejected" beside Customers' "2 returned".
- **Online Orders:** the buyer chip is a button — one click lists every order from that customer
  (their phone in the search, every tab and date). A typed phone finds orders saved in any format.
- **Online Orders:** **Returns** and **Courier says returned** are one-at-a-time: pressing one clears
  the other (together they met on almost nothing and read as an empty list).
- **Customize workspace:** turning **Courier payouts** off asks first, and says that turning it back
  on restarts every balance from ৳0 (parcels delivered while off and parcels still open are not
  counted; an earlier shortfall stays; recorded payments are kept).
- **Mark as Delivered** on an order the courier says was returned asks first ("Pathao says this
  parcel came back") and offers "Mark delivered anyway". Help: "Online orders" (en + bn).

### Deploy notes
- Needs **inventory-backend ≥ 1.7.0** (the switch, the chip's `returned` count, and
  `confirmCourierReturned`). Deploy the backend first: its migration keeps payouts on for every shop
  that has Cash & Bank on or has recorded a courier payment.

## [1.7.1] - 2026-10-11

### Changed
- **Customers:** "Came back" is now **Returned** (bn ফেরত). Orders, Bought, Returned and Last order
  sort from their column header, not only the sort menu.
- **Customers:** a customer's phone opens Online Orders searched by that number (storefront on and
  allowed to see orders). An online-only shop (no counter, no Cash & Bank) no longer gets the ledger
  button, which showed only invoice numbers there. Help: "Add customers and suppliers" (en + bn).

### Fixed
- **Dashboard:** "Set cost prices to see profit" opened a missing page (`/products/costs`); it now
  opens Products → Cost prices.

### Deploy notes
- Frontend only; works with backend ≥ 1.6.0 (same as 1.7.0).

## [1.7.0] - 2026-10-11

### Added
- **Products → Cost prices:** every product's buying price on one page. Filter by category or
  "only products without a cost", set all shown at once, fix the odd ones, save together. The
  dashboard's "Set cost prices to see profit" opens it. Help: "Set your cost prices" (en + bn).
- **Customers:** sort by Came back, Orders, Bought or Last order — across every customer, not just
  the page on screen.
- **One home per number:** dashboard tiles link to where the number lives in full — Orders placed
  and Gross profit → Orders Report, Awaiting confirmation → Online Orders (pending), With couriers
  → Online Orders (shipped), Delivery margin → Courier charges. The Orders Report courier card
  links to each parcel's charge.

### Fixed
- Orders Report courier rows read "Pathao" / "Steadfast" — a connected courier stores its id as
  its name, so 1.6.0 still printed "pathao" (seen live after deploy). One helper,
  `courierDisplayName`, now names couriers on the order page and the report.
- Order page: a returned parcel's "delivery margin" is what the customer paid less the courier's
  bill (usually minus the whole bill), with "customer paid ৳X for delivery" when it differs from
  the fee — the same rule as the dashboard and reports.

### Deploy notes
- **Needs inventory-backend ≥ 1.6.0** — Cost prices, the customer sorts and the order page's
  margin line read what that release adds.

## [1.6.0] - 2026-10-11

### Fixed
- Payment card on a parcel the courier reported returned (e.g. a Pathao Paid Return still reading
  Shipped) no longer says "Recorded automatically when the courier reports the delivery" — no
  delivery report is coming. It says there is nothing to collect and to use **Return whole order**.
- A connected courier is named properly in the order's courier notes ("Pathao holds it", not
  "pathao").
- **Courier charges:** the delivery margin now counts what customers actually paid for delivery. A
  parcel that came back counts ৳0 (or what was taken at the door / kept as an advance) and is marked
  "(came back)" — before, it was credited with the delivery fee printed on the order. The column is
  now **Customer paid**. Expect the margin to drop for stores with many returns.
- **Courier charges:** the note on parcels without a real charge no longer says Steadfast publishes
  none — Steadfast does; those parcels are simply still waiting.

- **Courier charges / payouts:** the delivery card now has a period filter, opening on **this
  month** (All time is still one click away) — the totals no longer only ever grow. Its list is
  now **Biggest losses on delivery**: the parcels that cost the most, not the biggest quote misses.

- **Order page, courier card:** a paid return no longer shows a green **Delivered** badge (Steadfast
  reports one as `partial_delivered`). It reads **Paid return · coming back**, then **Paid return ·
  back with you** once the order is returned; a real part-delivery reads **Part delivered**. The
  heading no longer says "consignment created" for the parcel's whole life.
- **Order page, parcel progress:** when you return the whole order or some items, that is now the
  latest row ("Parcel received back — returned by you", "Items received back — part of the order
  returned by you"), and a returned order's badge reads **Back with you**. Steadfast never reports
  the hand-back — its last message is always "Return status … Processing" — so the feed used to
  look stuck. Works on past orders too; nothing is written to the courier's record.

- **Gross profit** reads "—, set cost prices to see profit" for a shop with no cost prices, on the
  dashboard and the Orders Report (it showed a number made of delivery fees). A negative profit is
  red, not green.
- **Delivery margin** is the same everywhere: dashboard ("৳X paid by customers · ৳Y to couriers ·
  N of M parcels came back"), Orders Report total and per courier, Courier charges. Orders not sent
  say **No parcels sent** instead of a margin. Courier names read "Pathao", not "pathao".
- **Orders Report:** "Still owed" is now **Not collected yet** (cash on delivery still to come in),
  and top customers show "৳X to collect" instead of "Due".
- **Customers:** with Cash & Bank off, no Due / Credit Balance columns; with the counter off, no
  Discount column. Online shops get **Phone, Orders, Bought, Came back, Last order**.
- **Order page:** the courier cost before dispatch says **Estimated courier cost**; once the
  courier bills, "Courier charged ৳X · delivery margin ৳Y".

### Deploy notes
- **Needs inventory-backend ≥ 1.5.0 deployed first** — Courier charges, the dashboard and Orders
  Report delivery margin, the gross-profit "—" and the Customers order columns all read fields that
  release adds.

## [1.5.0] - 2026-10-10

### Changed
- A **paid return** (refused, delivery charge paid at the door — Pathao "Paid Return" or the
  Steadfast equivalent) is stated on the order: "The customer refused the parcel but paid ৳120 at
  the door. Pathao holds it until they pay you." **Return whole order** fills **Collected at door**
  with that amount (accounts on), or states it (accounts off). Such a parcel is not shown as a
  partial delivery any more.
- Order page: **Return items** now shows on every shipped, delivered or partly returned order. On an
  unpaid order it records the collection in the same step — what was collected fills in as the
  order total less the returned items, or starts from the amount the courier reported collecting —
  so a part-refused parcel no longer needs **Mark as Delivered** first. The item picker now shows
  on a shop that does not track stock too; it was hidden there, so refused items could not be
  recorded at all.
- Payment card: **Mark COD collected** / **Collected a different amount…** are now **Courier
  collected ৳X** / **Courier collected less…** (**Customer paid ৳X** at a pickup counter) — the
  money is with the courier, not the merchant. On a shipped parcel with a connected courier they
  wait for the courier's delivery report instead of booking money early.
- **Confirm order** confirms in one click on a shop that does not track stock — nothing is held,
  and the order can be cancelled until it ships. With stock tracked the prompt now says what it
  holds ("This holds 2 items in stock for this order"), with **Not yet** instead of "Keep". Order
  screens no longer talk about a "sale" being booked, which a storefront-only merchant never sees
  (confirm, reject, cancel, dispatch and pickup texts).
- A courier-reported **partial delivery** is shown on the order with what the courier collected,
  and **Return whole order** warns to use **Return items** — it would also reverse the items the
  customer kept. Help: "Handle online orders" and "Courier payouts" (en + bn).
### Fixed
- An online return's detail and printout showed **Delivery kept ৳120** for every refused parcel —
  the delivery fee asked, not money received; a customer who refused and paid nothing left the
  merchant ৳0 (33 UriiBaba orders). It now shows **Paid at the door** with what the courier
  reported, and nothing when the courier reported nothing.
- The printed return of an online order no longer says **Total Refund** for a parcel nobody paid
  for. It prints the same figures as the screen: **Sale reversed**, **Refunded**, **Delivery kept**
  and, when recorded, **Courier return charge**, plus the order number. The item column on the
  return screen reads **Sale reversed** instead of a red "Refund −৳450". Counter returns are
  unchanged.

### Deploy notes
- Needs inventory-backend ≥ 1.4.0 (`courier.partialDelivery`, `courier.collectedAmount`). Deploy
  the backend first.

## [1.4.1] - 2026-10-10

### Fixed
- Online Orders: the **Courier says returned** and **Returns** buttons now filter the list. Both
  lit up and changed the address but still listed every order — the two filters never reached the
  server.

## [1.4.0] - 2026-10-10

### Added
- Online Orders: a **Returns** filter (every order something came back from), and a **Returns**
  card on each order that opens its return documents. Sales → Returns (the counter's
  find-by-invoice page) now needs counter sales; a shop that sells only online takes returns from
  the order. Help guide "Handle online orders" (en + bn) updated.
- Online order: **Return items** takes back some items of a delivered, paid order (or more of a
  partly returned one) — quantity per line, refund to an account or store credit. Help guide
  "Handle online orders" (en + bn) has a new section.
- Product page → Pricing: **Add cost** / **Edit** sets a cost price at any time (per variant tab),
  for sales from now on. Hidden where purchases maintain the cost ("Updated automatically each time
  you receive a purchase.") and without `products.edit` + `costs.view`. Help guide "Add your
  products" (en + bn) has a new section.

### Changed
- Abandoned Carts: the purchase funnel is Built a cart → Reached checkout → Ordered. "Signed in"
  and "Email verified" were bars as if an account were required; shoppers order as guests, so
  sign-ins are now a note under the funnel.
- New online orders offer **Cancel order** beside Reject — a customer who cancels is not a
  rejection, and with only Reject on offer those were filed as "Other". Rejecting as "Other" asks
  what it was.
- **Return items** asks why the items came back; Sales → Returns lists and filters
  **Refused at delivery**.
- Shops that don't count stock: the product page no longer draws the three stock charts (they
  only ever read "No data yet"), and the sidebar's "Stock" group is headed **Products**.
- Product page sales figures (units sold, revenue, gross profit, orders) also show for a
  storefront-only shop — online orders are sales too. Gross profit reads "—" when no sale had a cost.
- Product page with no cost price: cost reads "No cost yet", Profit/Unit and margin read "—" with
  "Add a cost price to see profit" — the selling price was shown as profit.
- Warranty help guide (en + bn) says warranty starts switched off and where to turn it on —
  it is opt-in from inventory-backend's warranty opt-in release.
- Profit & Loss and Business Position need the Accounts feature: hidden from the menu (and the
  URL shows the locked screen) when it is off — profit for those shops is on the Orders Report.
- Profit & Loss shows a "Sales with no cost price (not counted in profit)" line and notice, matching
  the dashboard and Orders Report. Help guide "Read your reports" (en + bn) updated.
- With Accounts off, Courier Payouts becomes **Courier charges** (only what each courier billed vs
  what you charged), and the order's courier panel no longer says the courier owes the money — a
  merchant who records no courier payments was told couriers owed them forever. Help guide
  "Record courier payments" (en + bn) updated.
- Online Orders: a **Courier says returned** card and filter button list orders the courier reported
  returned that still need **Return whole order**; Pathao parcels that come back unpaid are returned
  automatically. Activity log shows **Courier** (not Staff) for courier updates. Help guide "Handle
  online orders" (en + bn) updated.
- A refused parcel on its way back reads **Returning to you** (shopper: "Returning to sender"), and
  **Back with you** once Pathao hands it over — it used to read "In transit" / "On the way".

### Fixed
- Sales → Returns: the value card showed this month's total under an all-time count and called it
  "total refunded". It now reads **Value of goods returned**, all time, with this month in the
  caption.
- Return detail of an online order: **Sale reversed**, **Refunded**, **Delivery kept** and
  **Courier return charge** (when recorded) instead of "Total refund" — which read as money paid
  back on a parcel nobody paid for — plus the order number. A line with no cost no longer shows
  "Cost ৳0.00".
- **Collected a different amount…**: a refused item from a product with options (size, colour) is
  returned as that variant — every line was sent with no variant, so the server refused it, and two
  sizes of one product shared one input.

### Removed
- **Store Overview** (Online Store → Store Overview). Its store status and counts were the
  dashboard's **Your store** card; the "give your store a look" card now sits under that card.
  Old links (`/ecommerce`, `/ecommerce/dashboard`, the storefront's "Back to admin") go to the
  dashboard.

### Deploy notes
- **Needs inventory-backend ≥ 1.3.0** — deploy the backend first.
- Needs inventory-backend with `summary.costCoverage` on `GET /api/reports/profit-loss` (same
  release as the one-profit-formula fix) `PUT /api/products/:id/cost`, and `lines` on `GET /api/ecommerce/orders/:id/return-preview`, `onlineOrder` on
  `GET /api/sales/returns/:id`, `hasReturns` on `GET /api/ecommerce/orders`;
  deploy the backend first.

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
