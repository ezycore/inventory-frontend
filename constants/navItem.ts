// coding-standard: maintained
import { NavGroup, NavItem } from "@/types/layout";

/**
 * Sidebar navigation, organized into labeled groups. Items are filtered per
 * user (role / permissions / features) by `filterNavItems` at render time.
 *
 * Groups follow the money flow a shop owner works in — sell, buy, stock, money —
 * rather than object type, so the highest-frequency destinations sit near the top
 * and setup-only screens collect under Admin. A group with an empty `label`
 * renders without a heading (see `AppSidebar`); Dashboard uses that so the rail
 * doesn't spend a row labelling a single item.
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
        title: "Sales",
        url: "/sales",
        icon: "shopping-cart",
        isActive: false,
        features: ["sales"],
        items: [
          {
            title: "New Sale",
            url: "/sales",
            icon: "shopping-cart",
            features: ["sales"],
          },
          {
            title: "Sales History",
            url: "/sales/history",
            icon: "clock",
            features: ["sales"],
          },
          {
            title: "Sales Returns",
            url: "/sales/returns",
            icon: "corner-up-left",
            features: ["sales", "returns"],
          },
        ],
      },
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
            title: "Online Orders",
            url: "/ecommerce/orders",
            icon: "receipt",
            features: ["storefront"],
            permissions: ["storefront.orders.view"],
          },
          {
            title: "Catalog",
            url: "/ecommerce/catalog",
            icon: "package",
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
            title: "Store Customers",
            url: "/ecommerce/customers",
            icon: "users",
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
      {
        title: "Customers",
        url: "/customers",
        icon: "users",
        isActive: false,
        items: [],
      },
    ],
  },

  {
    label: "Buy",
    items: [
      {
        title: "Purchases",
        url: "/purchases",
        icon: "shopping-bag",
        isActive: false,
        items: [
          {
            title: "New Purchase",
            url: "/purchases",
            icon: "packages",
          },
          {
            title: "Purchase Orders",
            url: "/purchases/orders",
            icon: "file-plus",
          },
          {
            title: "Purchase History",
            url: "/purchases/history",
            icon: "clock",
          },
          {
            title: "Purchase Returns",
            url: "/purchases/returns",
            icon: "package-minus",
            features: ["returns"],
          },
        ],
      },
      {
        title: "Suppliers",
        url: "/suppliers",
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
        icon: "database",
        isActive: false,
        items: [
          { title: "Current Stock", url: "/inventory", icon: "list" },
          {
            title: "Low Stock",
            url: "/inventory/lowstock",
            icon: "clipboard-list",
          },
          { title: "Adjust Stock", url: "/inventory/adjust", icon: "edit" },
          {
            title: "Transfer Stock",
            url: "/inventory/transfers",
            icon: "truck",
          },
          {
            title: "Stock History",
            url: "/inventory/movements",
            icon: "arrow-right-left",
          },
        ],
      },
      {
        title: "Products",
        url: "/products",
        icon: "package",
        isActive: false,
        shortcut: ["p", "p"],
        items: [
          { title: "Products", url: "/products", icon: "list" },
          { title: "Categories", url: "/categories", icon: "tag" },
          { title: "Brands", url: "/brands", icon: "star" },
          { title: "Variants", url: "/variants", icon: "layers" },
          { title: "Units", url: "/units", icon: "grid" },
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
        icon: "wallet",
        isActive: false,
        features: ["accounts"],
        items: [
          {
            title: "Accounts",
            url: "/accounts",
            icon: "list",
            features: ["accounts"],
          },
          {
            title: "Transactions",
            url: "/accounts/transactions",
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
        icon: "file-text",
        isActive: false,
        items: [
          {
            title: "Inventory Report",
            url: "/reports/inventory",
            icon: "file-text",
          },
          {
            title: "Sales Report",
            url: "/reports/sales",
            icon: "bar-chart-2",
            features: ["sales"],
          },
          {
            title: "Purchase Report",
            url: "/reports/purchases",
            icon: "file-text",
          },
          {
            title: "Cash Report",
            url: "/reports/cash",
            icon: "credit-card",
            features: ["accounts"],
          },
          {
            title: "VAT Report",
            url: "/reports/tax",
            icon: "percent",
            features: ["tax"],
          },
          {
            title: "Stock Value",
            url: "/reports/valuation",
            icon: "database",
          },
          {
            title: "Expiry Report",
            url: "/reports/expiry",
            icon: "calendar",
            features: ["expiryTracking"],
          },
          {
            title: "Staff Report",
            url: "/reports/employees",
            icon: "user-check",
          },
          {
            title: "Export Data",
            url: "/reports/export",
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
        icon: "map-pin",
        isActive: false,
        items: [
          { title: "Locations", url: "/locations", icon: "list" },
          {
            title: "Stock by Location",
            url: "/locations/stock-report",
            icon: "bar-chart-2",
          },
        ],
      },
      {
        title: "Pricing",
        url: "#",
        icon: "tags",
        isActive: false,
        items: [
          { title: "Discounts", url: "/discounts", icon: "tag" },
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
          {
            title: "Feature Settings",
            url: "/settings/features",
            icon: "toggle-left",
            permissions: ["organization.edit"],
          },
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
            title: "Custom Domains",
            url: "/settings/domains",
            icon: "globe",
            permissions: ["organization.view"],
          },
          {
            title: "Billing",
            url: "/dashboard/billing",
            icon: "credit-card",
          },
        ],
      },
    ],
  },
];

// Flat list for consumers that don't care about grouping
// (⌘K search, breadcrumbs, the Reports hub page).
export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);
