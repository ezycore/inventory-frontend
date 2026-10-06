// coding-standard: maintained
import { NavGroup, NavItem } from "@/types/layout";

/**
 * Sidebar navigation, organized into labeled groups. Items are filtered per
 * user (role / permissions / features) by `filterNavItems` at render time.
 *
 * Groups follow the money flow a shop owner works in — sell, buy, stock, money —
 * rather than object type, so the highest-frequency destinations sit near the top
 * and setup-only screens collect under Admin. Online Store breaks that pattern on
 * purpose: it is a sales *channel* the owner tends separately from the daily
 * money flow, so it gets its own group instead of nesting under Sell. A group
 * with an empty `label` renders without a heading (see `AppSidebar`); Dashboard
 * uses that so the rail doesn't spend a row labelling a single item.
 *
 * ## Every destination declares its `permissions`
 *
 * Until 2026-08-17 only the storefront and tax entries did — 19 of 66 — so a
 * `staff` user was offered Sell, Purchases, Reports, Cash & Bank and Pricing,
 * every one of which answered 403 or rendered empty. `filterNavItems` had
 * honoured the key all along; the data simply wasn't there. **A new entry
 * without `permissions` is a row somebody will be shown and cannot use.**
 *
 * List the permission that makes the screen *usable*, not merely reachable —
 * New Sale takes `sales.create`, not `sales.view`.
 *
 * ### A parent MUST list the union of its children
 *
 * Not "should" — `filterNavItems` tests the parent **before** it recurses, so a
 * parent that fails its own gate takes every child down with it, whatever the
 * children declare. A narrower parent than its children is therefore a hidden
 * screen, not a redundant line.
 *
 * That is not hypothetical: `Reports` listed `reports.view` alone while
 * `Expiry Report` beneath it is deliberately `stock.view`, so the pharmacy
 * counter person the exception was written for — `staff`, who holds `stock.view`
 * and no `reports.view` — lost the entire Reports section and never reached it.
 * `Locations` / `Stock by Location` had the same shape.
 *
 * A parent whose children are all denied is still dropped automatically, so a
 * pure container needs nothing of its own.
 *
 * Four entries are deliberately ungated:
 * - **Dashboard** — everyone must land somewhere, and it already tailors itself
 *   by role ("Sales figures aren't shown for your role").
 * - **Online Store**, **Pricing**, **Settings** — pure containers; their
 *   children carry the gates and the parent disappears with them.
 *
 * Note `Expiry Report` is gated on `stock.view`, not `reports.view`: it lives
 * under Reports but it is a shop-floor screen, and the pharmacy counter person
 * who needs it holds stock permissions and no reporting ones. `Reports` carries
 * `stock.view` in its union for exactly that reason.
 */
export const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: "home",
        isActive: false,
        shortcut: ["d", "d"],
        items: [],
      },
    ],
  },

  {
    label: "Sell",
    items: [
      {
        // `sales` is the POS capability — the counter, not the ledger. An
        // online-only shop runs with `sales: false` and still records sales:
        // committing a storefront order writes a Sale with channel "online"
        // (storefront-order-lifecycle.service.ts). So everything that reads the
        // ledger is gated on `anyFeatures`, and only New Sale — the POS screen
        // itself — requires `sales`. Gating this parent on `sales` alone would
        // hide an online seller's entire sales history.
        //
        // "Sale" is POS vocabulary (docs/plan/orders-first-storefront.md): with
        // the POS module off this group is the seller's orders, and says so.
        title: "Sales",
        titleWithoutPos: "Orders",
        url: "/sales",
        permissions: [
          "sales.view",
          "storefront.orders.view",
          "sales.create",
          "returns.view",
          "warranty.view",
        ],
        icon: "shopping-cart",
        isActive: false,
        anyFeatures: ["sales", "storefront"],
        items: [
          {
            // Out of the menu since POS shipped — every "new sale" entry point
            // opens POS now. Kept in the table so `/sales` stays gated on its
            // own `sales.create` + `sales` rather than the group's union.
            title: "New Sale",
            url: "/sales",
            permissions: ["sales.create"],
            icon: "shopping-cart",
            features: ["sales"],
            hideInMenu: true,
          },
          {
            // The full-screen counter (constants/pos.ts). Same gates as New
            // Sale — it is the same sale, drawn for a till.
            title: "POS",
            url: "/sales/pos",
            permissions: ["sales.create"],
            icon: "scan-barcode",
            features: ["sales"],
            openInNewTab: true,
          },
          {
            // Online orders are sales, so they live with the ledger rather than
            // with the storefront's setup screens. Still storefront-gated: a
            // shop-only merchant has no online channel to take orders through.
            title: "Online Orders",
            url: "/ecommerce/orders",
            icon: "receipt",
            features: ["storefront"],
            permissions: ["storefront.orders.view"],
          },
          {
            // Courier remittance sits with the orders it settles, not with Cash & Bank:
            // `featuresForPath` resolves a route's gate by URL prefix, so anything under
            // `/accounts` would demand the `accounts` feature — and these endpoints are gated
            // on `storefront` precisely so a merchant with the ledger off can still see what
            // a courier is holding. The row also carries the permission the endpoints want
            // (`storefront.orders.view`), which `/ecommerce` alone would not.
            title: "Courier Payouts",
            url: "/ecommerce/payouts",
            icon: "truck",
            features: ["storefront"],
            permissions: ["storefront.orders.view"],
          },
          {
            // POS only since 2026-09-28 (orders-first-storefront D4): a
            // storefront seller's history is the order list, and the dispatch
            // records listed here as "sales" confused them. A shop that used POS
            // keeps it (`keepWithPosHistory`) after switching POS off.
            title: "Sales History",
            url: "/sales/history",
            // Read-only: `sales.routes.ts` gates writes alone, so this data stays
            // reachable after the capability is switched off.
            readOnly: true,
            keepWithPosHistory: true,
            permissions: ["sales.view"],
            icon: "clock",
            features: ["sales"],
          },
          {
            // Needs returns AND (sales OR storefront): `features` is all-of,
            // `anyFeatures` is any-of, and filterNavItems applies both.
            title: "Sales Returns",
            titleWithoutPos: "Returns",
            url: "/sales/returns",
            permissions: ["returns.view"],
            icon: "corner-up-left",
            features: ["returns"],
            anyFeatures: ["sales", "storefront"],
          },
          {
            // Lookup ("is this still covered?") and claims. Sits with the sales
            // it is claimed against; its own row so the route carries
            // `warranty.view` rather than the group's union.
            title: "Warranty",
            url: "/sales/warranty",
            permissions: ["warranty.view"],
            icon: "shield",
            features: ["warranty"],
          },
        ],
      },
      {
        title: "Customers",
        url: "/customers",
        permissions: ["customers.view"],
        icon: "users",
        isActive: false,
        items: [],
      },
    ],
  },

  {
    // The storefront is a channel, not a sub-section of Sell: its orders are
    // sales (they live under Sales above) and what is left here is the channel
    // itself — the shop window, its taxonomy, its promotions, its settings.
    //
    // Its own group, but collapsed behind one parent row: listing all eight
    // storefront screens flat cost the rail eight permanent rows and pushed Buy
    // and Stock below the fold, so Products needed a scroll.
    //
    // Headed "Store" rather than "Online Store" so the heading and the row it
    // contains don't repeat the same words — the group names the channel, the
    // row names the destination, the same way "Sell" heads "Sales".
    label: "Store",
    items: [
      {
        title: "Online Store",
        url: "/ecommerce",
        icon: "store",
        isActive: false,
        features: ["storefront"],
        items: [
          {
            title: "Store Overview",
            url: "/ecommerce/dashboard",
            icon: "layout-dashboard",
            features: ["storefront"],
            permissions: ["storefront.view"],
          },
          {
            // The catalog's product listing moved to Products → Online: it
            // edits the same product records, so two sidebar entries for one
            // set of records was pure overhead. Collections stayed behind —
            // storefront-only taxonomy with no Products equivalent.
            title: "Collections",
            url: "/ecommerce/collections",
            icon: "layers",
            features: ["storefront"],
            permissions: ["storefront.view"],
          },
          {
            title: "Campaigns",
            url: "/ecommerce/campaigns",
            icon: "megaphone",
            features: ["storefront"],
            permissions: ["storefront.manage"],
          },
          {
            title: "Coupons",
            url: "/ecommerce/coupons",
            icon: "ticket-percent",
            features: ["storefront"],
            permissions: ["storefront.manage"],
          },
          {
            // Writes nothing: it reads the live look off the Site (`design`) and
            // Apply opens Customize — so it follows Customize's gate.
            title: "Themes",
            url: "/ecommerce/themes",
            icon: "sparkles",
            features: ["storefront"],
            permissions: ["storefront.design"],
          },
          {
            // `storefront.design`, not `.manage`: Customize loads and saves the
            // store's look through the Site (`/organization/storefront/site`),
            // which the design split put under `design` — a `manage`-only role
            // opened a page whose load 403'd. Its look-image uploads take either
            // permission; only its collection edits need `manage`, and the page
            // hides those without it.
            title: "Customize",
            url: "/ecommerce/customize",
            icon: "palette",
            features: ["storefront"],
            permissions: ["storefront.design"],
          },
          {
            // Storefront Builder pages. `storefront.design`, not `storefront.manage`
            // like its neighbours: it is what the page routes check, so a role
            // holding only `manage` would open a screen whose every request 403s.
            title: "Pages",
            url: "/ecommerce/pages",
            icon: "file-plus",
            features: ["storefront"],
            permissions: ["storefront.design"],
          },
          {
            title: "Abandoned Carts",
            url: "/ecommerce/carts",
            icon: "shopping-cart",
            features: ["storefront"],
            permissions: ["storefront.view"],
          },
          {
            title: "Meta Ad Reporting",
            url: "/ecommerce/meta",
            icon: "megaphone",
            features: ["storefront"],
            permissions: ["storefront.view"],
          },
          {
            title: "Store Settings",
            url: "/ecommerce/settings",
            icon: "settings",
            features: ["storefront"],
            permissions: ["storefront.view"],
          },
        ],
      },
    ],
  },

  {
    label: "Buy",
    items: [
      {
        title: "Purchases",
        url: "/purchases",
        permissions: ["purchases.view", "returns.view", "purchases.create"],
        icon: "shopping-bag",
        // Declared on the parent AND repeated on each child below. The
        // repetition is the house convention here (every `/ecommerce` child
        // restates `storefront`), and `featuresForPath` accumulates down the
        // chain either way — but a child that ever moves out from under this
        // parent must not quietly lose its gate.
        features: ["purchases"],
        isActive: false,
        items: [
          {
            title: "New Purchase",
            url: "/purchases",
            permissions: ["purchases.create"],
            icon: "packages",
            features: ["purchases"],
          },
          {
            title: "Purchase Orders",
            url: "/purchases/orders",
            permissions: ["purchases.view"],
            icon: "file-plus",
            features: ["purchases"],
          },
          {
            title: "Purchase History",
            url: "/purchases/history",
            // Read-only: `purchase-orders.routes.ts` gates writes alone, so this data stays
            // reachable after the capability is switched off.
            readOnly: true,
            permissions: ["purchases.view"],
            icon: "clock",
            features: ["purchases"],
          },
          {
            title: "Purchase Returns",
            url: "/purchases/returns",
            permissions: ["returns.view"],
            icon: "package-minus",
            features: ["returns", "purchases"],
          },
        ],
      },
      {
        title: "Suppliers",
        url: "/suppliers",
        permissions: ["suppliers.view"],
        icon: "truck",
        // Folded into `purchases` rather than gated on its own: a supplier with
        // no purchase to raise against them is an address book.
        features: ["purchases"],
        isActive: false,
        items: [],
      },
    ],
  },

  {
    label: "Stock",
    items: [
      {
        // The whole group goes when the business does not count stock. Every
        // screen under here — current stock, low stock, adjustments, transfers,
        // the movement ledger — describes quantities that a stock-free
        // workspace has none of, and its inventory rows exist only so the
        // required `SaleItem.inventoryId` resolves.
        //
        // Declared on the parent AND repeated on each child, per the convention
        // this table already follows for `storefront`.
        title: "Inventory",
        url: "/inventory",
        permissions: ["stock.view", "stock.manage"],
        icon: "database",
        isActive: false,
        features: ["inventoryTracking"],
        items: [
          {
            title: "Current Stock",
            url: "/inventory",
            permissions: ["stock.view"],
            icon: "list",
            features: ["inventoryTracking"],
          },
          {
            title: "Low Stock",
            url: "/inventory/lowstock",
            permissions: ["stock.view"],
            icon: "clipboard-list",
            features: ["inventoryTracking"],
          },
          {
            title: "Adjust Stock",
            url: "/inventory/adjust",
            permissions: ["stock.manage"],
            icon: "edit",
            features: ["inventoryTracking"],
          },
          {
            // Nothing to transfer between when there is one location — and
            // `multiLocation` now requires `inventoryTracking`, so the cascade
            // takes this one either way.
            title: "Transfer Stock",
            url: "/inventory/transfers",
            permissions: ["stock.manage"],
            icon: "truck",
            features: ["multiLocation"],
          },
          {
            title: "Stock History",
            url: "/inventory/movements",
            // Read-only: `inventory.routes.ts` gates writes alone, so this data stays
            // reachable after the capability is switched off.
            readOnly: true,
            permissions: ["stock.view"],
            icon: "arrow-right-left",
            features: ["inventoryTracking"],
          },
        ],
      },
      {
        title: "Products",
        url: "/products",
        // The catalog parent: one entry per child screen, because a merchant
        // custom role may grant `categories.view` without `products.view`.
        permissions: [
          "products.view",
          "categories.view",
          "brands.view",
          "tags.view",
          "variants.view",
          "units.view",
        ],
        icon: "package",
        isActive: false,
        shortcut: ["p", "p"],
        items: [
          // "All products", not a second "Products" under the "Products" parent.
          // The /products crumb and tab title still read "Products": breadcrumbs
          // register the parent's title first for a shared URL.
          { title: "All products", url: "/products", permissions: ["products.view"], icon: "list" },
          { title: "Categories", url: "/categories", permissions: ["categories.view"], icon: "tag" },
          { title: "Brands", url: "/brands", permissions: ["brands.view"], icon: "star" },
          { title: "Tags", url: "/tags", permissions: ["tags.view"], icon: "tag" },
          { title: "Variants", url: "/variants", permissions: ["variants.view"], icon: "layers" },
          { title: "Units", url: "/units", permissions: ["units.view"], icon: "grid" },
        ],
      },
    ],
  },

  {
    label: "Money",
    items: [
      {
        title: "Cash & Bank",
        url: "/accounts",
        permissions: ["accounts.view", "transactions.view"],
        icon: "wallet",
        isActive: false,
        features: ["accounts"],
        items: [
          {
            title: "Accounts",
            url: "/accounts",
            permissions: ["accounts.view"],
            icon: "list",
            features: ["accounts"],
          },
          {
            title: "Transactions",
            url: "/accounts/transactions",
            // Read-only: `transactions.routes.ts` gates writes alone, so this data stays
            // reachable after the capability is switched off.
            readOnly: true,
            permissions: ["transactions.view"],
            icon: "arrow-right-left",
            features: ["accounts"],
          },
        ],
      },
    ],
  },

  {
    label: "Insights",
    items: [
      {
        title: "Reports",
        url: "/reports",
        // Union of the children: every report is `reports.view` EXCEPT Expiry,
        // which is `stock.view`. Narrowing this to `reports.view` hides Expiry
        // from `staff` — see the union rule at the top of this file.
        permissions: ["reports.view", "stock.view"],
        icon: "file-text",
        isActive: false,
        items: [
          {
            title: "Inventory Report",
            url: "/reports/inventory",
            permissions: ["reports.view"],
            icon: "file-text",
            features: ["inventoryTracking"],
          },
          {
            // POS only since 2026-09-28 (orders-first-storefront D1/D2). It was
            // opened to storefront sellers in QA-L1 because it was then the only
            // place online sales were reported; the Orders Report now covers
            // them on the order clock, with the same category/brand/tag
            // breakdown, and with the storefront on this report is the
            // counter's alone. A shop that used POS keeps it read-only.
            title: "Sales Report",
            url: "/reports/sales",
            permissions: ["reports.view"],
            icon: "bar-chart-2",
            features: ["sales"],
            readOnly: true,
            keepWithPosHistory: true,
          },
          {
            // The ORDER clock. Feature-gated on the storefront because without
            // that module there are no orders at all — the one case where a
            // report should vanish rather than degrade. `reports.view` like the
            // rest; its cost figures are withheld server-side by `costs.view`.
            title: "Orders Report",
            url: "/reports/orders",
            permissions: ["reports.view"],
            icon: "clipboard-list",
            features: ["storefront"],
          },
          {
            // The one report that reads purchase documents exclusively, so it
            // has nothing to show without the capability. P&L and Business
            // Position also touch purchase data but stay ungated on purpose —
            // they DEGRADE (see `expensesTracked`), reporting the sections they
            // can compute rather than vanishing.
            title: "Purchase Report",
            url: "/reports/purchases",
            permissions: ["reports.view"],
            icon: "file-text",
            features: ["purchases"],
          },
          {
            title: "Profit & Loss",
            url: "/reports/profit-loss",
            permissions: ["reports.view"],
            icon: "trending-up",
          },
          {
            title: "Business Position",
            url: "/reports/position",
            permissions: ["reports.view"],
            icon: "scale",
          },
          {
            title: "Cash Report",
            url: "/reports/cash",
            permissions: ["reports.view"],
            icon: "credit-card",
            features: ["accounts"],
          },
          {
            title: "VAT Report",
            url: "/reports/tax",
            permissions: ["reports.view"],
            icon: "percent",
            features: ["tax"],
          },
          {
            // A valuation needs a quantity to multiply the cost by. A stock-free
            // merchant has a cost price on every product and nothing to value.
            title: "Stock Value",
            url: "/reports/valuation",
            permissions: ["reports.view"],
            icon: "database",
            features: ["inventoryTracking"],
          },
          {
            title: "Expiry Report",
            url: "/reports/expiry",
            permissions: ["stock.view"],
            icon: "calendar",
            features: ["expiryTracking"],
          },
          {
            // Attributes sales to the employee who rang them up, which is a
            // counter fact. An online order originates with the shopper — staff
            // only confirm, ship and collect — so on a storefront-only workspace
            // every row credits the admin who pressed Confirm, beside a purchase
            // column that can never fill (QA-C4/N11).
            //
            // Any-of rather than `sales`, matching Sales Report above: a POS-less
            // wholesaler still has staff raising purchase orders.
            title: "Staff Report",
            url: "/reports/employees",
            permissions: ["reports.view"],
            icon: "user-check",
            anyFeatures: ["sales", "purchases"],
          },
          {
            title: "Export Data",
            url: "/reports/export",
            permissions: ["reports.view"],
            icon: "download-cloud",
          },
        ],
      },
    ],
  },

  {
    label: "Admin",
    items: [
      {
        title: "Locations",
        url: "/locations",
        // Union of the children — `Stock by Location` is a stock screen, so
        // `stock.view` belongs here too or it is unreachable for anyone without
        // `locations.view`. See the union rule at the top of this file.
        permissions: ["locations.view", "stock.view"],
        icon: "map-pin",
        isActive: false,
        // Hidden entirely for a stock-free workspace, which reverses the
        // reasoning in the child comment below — and the reversal is only safe
        // because of two facts. The printed address is `Organization.address`,
        // written at signup and edited under Settings → Organization, NOT this
        // location record; and the one shopper-facing use of the location's own
        // address is store pickup, which `storefront.service` reads only when
        // `pickup.enabled`. So the address a stock-free merchant might still
        // need to edit belongs beside the pickup toggle on Store Settings, not
        // on a Locations screen they have no other reason to visit.
        //
        // A stock-free org always has exactly one location, because
        // `multiLocation` requires `inventoryTracking`.
        features: ["inventoryTracking"],
        items: [
          // Deliberately ungated. With `multiLocation` off this list holds the
          // org's single signup-created location, which carries the shop's own
          // address — hiding it would strand that address with no edit path.
          // The page hides its "Add location" button instead, and the backend
          // refuses a second location (docs/plan/onboarding-workspace.md §3.1).
          { title: "Locations", url: "/locations", permissions: ["locations.view"], icon: "list" },
          {
            // A per-location breakdown of one location is just Current Stock.
            title: "Stock by Location",
            url: "/locations/stock-report",
            permissions: ["stock.view"],
            icon: "bar-chart-2",
            features: ["multiLocation"],
          },
        ],
      },
      {
        title: "Pricing",
        url: "#",
        icon: "tags",
        isActive: false,
        items: [
          {
            title: "Discounts",
            url: "/discounts",
            // The `Discount` model is a SALES/PURCHASE tool, not a storefront
            // one — it carries `applicableTo: "sales" | "purchase"` and
            // surfaces as the default-discount field on customer and supplier
            // forms. Storefront promotions are `Coupon` and `Campaign` and
            // never touch it, so a storefront-only merchant keeps discounting
            // through those and loses nothing here.
            //
            // Any-of, not all-of: either side alone makes the screen useful,
            // and requiring both would take it from a POS-less wholesaler.
            anyFeatures: ["sales", "purchases"],
            permissions: ["discounts.view"],
            icon: "tag",
          },
          {
            title: "VAT Rates",
            url: "/taxes",
            icon: "percent",
            features: ["tax"],
            permissions: ["taxes.view"],
          },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: "settings",
        isActive: false,
        items: [
          {
            title: "Organization",
            url: "/settings/organization",
            icon: "building-2",
            permissions: ["organization.view"],
          },
          {
            title: "Users",
            url: "/users",
            icon: "users",
            permissions: ["users.view"],
          },
          {
            // Any of the two the page and `GET /api/roles` accept: `roles.view`
            // is the permission for reading roles (`manager` holds it and not
            // `users.manage`, so was denied the page), and `users.manage` needs
            // the list to place people in roles. The owner bypass lives on the
            // page and the API only.
            title: "Roles",
            url: "/settings/roles",
            icon: "shield",
            permissions: ["roles.view", "users.manage"],
          },
          // "Customize workspace" deliberately does NOT live here any more. It
          // is the way back from every hidden feature, so burying it under
          // Settings — where you have to already know it exists to find it —
          // made the hiding unsafe. It renders in the sidebar footer instead
          // (see AppSidebar), permanently visible
          // (docs/plan/onboarding-workspace.md §7).
          {
            title: "Field Settings",
            url: "/settings/fields",
            icon: "sliders",
            permissions: ["organization.edit"],
          },
          {
            title: "VAT",
            url: "/settings/tax",
            icon: "percent",
            features: ["tax"],
            permissions: ["organization.edit"],
          },
          {
            title: "Receipt & Print",
            url: "/settings/receipt",
            icon: "printer",
            features: ["invoicePrinting"],
            permissions: ["organization.edit"],
          },
          {
            title: "Notifications",
            url: "/settings/notifications",
            icon: "bell",
            permissions: ["organization.manage"],
          },
          {
            title: "Support Access",
            url: "/settings/support-access",
            icon: "shield",
            // `organization.view`, matching the API: this is a disclosure, and
            // hiding it from the staff who work in the workspace would defeat
            // the point of keeping one. Ending a session needs more, and the
            // button on the page is what checks that.
            permissions: ["organization.view"],
          },
          {
            title: "Custom Domains",
            url: "/settings/domains",
            icon: "globe",
            permissions: ["organization.view"],
          },
          {
            title: "Referrals",
            url: "/settings/referrals",
            icon: "ticket-percent",
            permissions: ["organization.view"],
          },
          // Billing is deliberately absent: it lives in the sidebar's user menu
          // (`AppSidebar` footer), not under Settings — one entry, one place.
          // Its breadcrumb/tab title still resolves via `layout.nav.items.billing`.
        ],
      },
    ],
  },
];

// Flat list for consumers that don't care about grouping
// (⌘K search, breadcrumbs, the Reports hub page).
export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);
