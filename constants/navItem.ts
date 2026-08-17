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
        title: "Sales",
        url: "/sales",
        permissions: [
          "sales.view",
          "storefront.orders.view",
          "sales.create",
          "returns.view",
        ],
        icon: "shopping-cart",
        isActive: false,
        anyFeatures: ["sales", "storefront"],
        items: [
          {
            title: "New Sale",
            url: "/sales",
            permissions: ["sales.create"],
            icon: "shopping-cart",
            features: ["sales"],
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
            title: "Sales History",
            url: "/sales/history",
            permissions: ["sales.view"],
            icon: "clock",
            anyFeatures: ["sales", "storefront"],
          },
          {
            // Needs returns AND (sales OR storefront): `features` is all-of,
            // `anyFeatures` is any-of, and filterNavItems applies both.
            title: "Sales Returns",
            url: "/sales/returns",
            permissions: ["returns.view"],
            icon: "corner-up-left",
            features: ["returns"],
            anyFeatures: ["sales", "storefront"],
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
            title: "Themes",
            url: "/ecommerce/themes",
            icon: "sparkles",
            features: ["storefront"],
            permissions: ["storefront.manage"],
          },
          {
            title: "Customize",
            url: "/ecommerce/customize",
            icon: "palette",
            features: ["storefront"],
            permissions: ["storefront.manage"],
          },
          {
            title: "Content",
            url: "/ecommerce/content",
            icon: "file-text",
            features: ["storefront"],
            permissions: ["storefront.manage"],
          },
          {
            title: "Abandoned Carts",
            url: "/ecommerce/carts",
            icon: "shopping-cart",
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
        isActive: false,
        items: [
          {
            title: "New Purchase",
            url: "/purchases",
            permissions: ["purchases.create"],
            icon: "packages",
          },
          {
            title: "Purchase Orders",
            url: "/purchases/orders",
            permissions: ["purchases.view"],
            icon: "file-plus",
          },
          {
            title: "Purchase History",
            url: "/purchases/history",
            permissions: ["purchases.view"],
            icon: "clock",
          },
          {
            title: "Purchase Returns",
            url: "/purchases/returns",
            permissions: ["returns.view"],
            icon: "package-minus",
            features: ["returns"],
          },
        ],
      },
      {
        title: "Suppliers",
        url: "/suppliers",
        permissions: ["suppliers.view"],
        icon: "truck",
        isActive: false,
        items: [],
      },
    ],
  },

  {
    label: "Stock",
    items: [
      {
        title: "Inventory",
        url: "/inventory",
        permissions: ["stock.view", "stock.manage"],
        icon: "database",
        isActive: false,
        items: [
          { title: "Current Stock", url: "/inventory", permissions: ["stock.view"], icon: "list" },
          {
            title: "Low Stock",
            url: "/inventory/lowstock",
            permissions: ["stock.view"],
            icon: "clipboard-list",
          },
          { title: "Adjust Stock", url: "/inventory/adjust", permissions: ["stock.manage"], icon: "edit" },
          {
            // Nothing to transfer between when there is one location.
            title: "Transfer Stock",
            url: "/inventory/transfers",
            permissions: ["stock.manage"],
            icon: "truck",
            features: ["multiLocation"],
          },
          {
            title: "Stock History",
            url: "/inventory/movements",
            permissions: ["stock.view"],
            icon: "arrow-right-left",
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
          { title: "Products", url: "/products", permissions: ["products.view"], icon: "list" },
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
          },
          {
            title: "Sales Report",
            url: "/reports/sales",
            permissions: ["reports.view"],
            icon: "bar-chart-2",
            features: ["sales"],
          },
          {
            title: "Purchase Report",
            url: "/reports/purchases",
            permissions: ["reports.view"],
            icon: "file-text",
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
            title: "Stock Value",
            url: "/reports/valuation",
            permissions: ["reports.view"],
            icon: "database",
          },
          {
            title: "Expiry Report",
            url: "/reports/expiry",
            permissions: ["stock.view"],
            icon: "calendar",
            features: ["expiryTracking"],
          },
          {
            title: "Staff Report",
            url: "/reports/employees",
            permissions: ["reports.view"],
            icon: "user-check",
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
          { title: "Discounts", url: "/discounts", permissions: ["discounts.view"], icon: "tag" },
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
            title: "Roles",
            url: "/settings/roles",
            icon: "shield",
            permissions: ["users.manage"],
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
            title: "Custom Domains",
            url: "/settings/domains",
            icon: "globe",
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
