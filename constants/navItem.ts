// coding-standard: maintained
import { NavGroup, NavItem } from "@/types/layout";

/**
 * Sidebar navigation, organized into labeled groups. Items are filtered per
 * user (role / permissions / features) by `filterNavItems` at render time.
 */
export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: "home",
        isActive: false,
        shortcut: ["d", "d"],
        items: [],
      },
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
            title: "Tax Report",
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
    label: "Operations",
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
    ],
  },

  {
    label: "Contacts",
    items: [
      {
        title: "Customers",
        url: "/customers",
        icon: "users",
        isActive: false,
        items: [],
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
    label: "Catalog",
    items: [
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
      {
        title: "Pricing",
        url: "#",
        icon: "tags",
        isActive: false,
        items: [
          { title: "Discounts", url: "/discounts", icon: "tag" },
          {
            title: "Tax Rates",
            url: "/taxes",
            icon: "percent",
            features: ["tax"],
            permissions: ["taxes.view"],
          },
        ],
      },
    ],
  },

  {
    label: "Admin",
    items: [
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
            title: "Tax Settings",
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
