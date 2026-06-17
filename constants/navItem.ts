import { NavItem } from "@/types/layout";

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: "home",
    isActive: false,
    shortcut: ["d", "d"],
    items: [],
  },

  // PRODUCTS
  {
    title: "Products",
    url: "/products",
    icon: "package",
    isActive: false,
    shortcut: ["p", "p"],
    items: [
      { title: "All Products", url: "/products", icon: "list" },
      { title: "Categories", url: "/categories", icon: "tag" },
      { title: "Brands", url: "/brands", icon: "star" },
      { title: "Variants", url: "/variants", icon: "layers" },
      { title: "Units", url: "/units", icon: "grid" },
      { title: "Taxes", url: "/taxes", icon: "percent" },
    ],
  },

  // INVENTORY
  {
    title: "Inventory",
    url: "/inventory",
    icon: "database",
    isActive: false,
    items: [
      { title: "Inventory List", url: "/inventory", icon: "list" },
      {
        title: "Low Stock",
        url: "/inventory/lowstock",
        icon: "clipboard-list",
      },
      { title: "Stock Adjustment", url: "/inventory/adjust", icon: "edit" },
      {
        title: "Stock Movements",
        url: "/stock/movements",
        icon: "arrow-right-left",
      },
      // { title: "Stock Transfer", url: "/stock/transfers", icon: "truck" },
    ],
  },

  // SALES (requires sales feature)
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
        title: "Sales List",
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
      // Customers moved to top-level navigation
    ],
  },

  // PURCHASES
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
      { title: "Purchase List", url: "/purchases/history", icon: "clock" },
      {
        title: "Purchase Returns",
        url: "/purchases/returns",
        icon: "package-minus",
        features: ["returns"],
      },
      // Suppliers moved to top-level navigation
    ],
  },

  // ECOMMERCE (requires storefront feature — plan-gated)
  {
    title: "Ecommerce",
    url: "/ecommerce",
    icon: "store",
    isActive: false,
    features: ["storefront"],
    items: [
      {
        title: "Orders",
        url: "/ecommerce/orders",
        icon: "receipt",
        features: ["storefront"],
        permissions: ["storefront.orders.view"],
      },
      {
        title: "Store Settings",
        url: "/ecommerce/settings",
        icon: "settings",
        features: ["storefront"],
        permissions: ["storefront.view"],
      },
      {
        title: "Coupons",
        url: "/ecommerce/coupons",
        icon: "ticket-percent",
        features: ["storefront"],
        permissions: ["storefront.manage"],
      },
      {
        title: "Campaigns",
        url: "/ecommerce/campaigns",
        icon: "megaphone",
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
        title: "Theme",
        url: "/ecommerce/theme",
        icon: "palette",
        features: ["storefront"],
        permissions: ["storefront.manage"],
      },
    ],
  },

  // CUSTOMERS (top-level)
  {
    title: "Customers",
    url: "/customers",
    icon: "users",
    isActive: false,
    items: [],
  },

  // SUPPLIERS (top-level)
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: "truck",
    isActive: false,
    items: [],
  },

  // LOCATIONS
  {
    title: "Locations",
    url: "/locations",
    icon: "box",
    isActive: false,
    items: [
      { title: "All Locations", url: "/locations", icon: "list" },
      {
        title: "Location Stock Report",
        url: "/locations/stock-report",
        icon: "bar-chart-2",
      },
      {
        title: "Transfer Requests",
        url: "/locations/transfer-requests",
        icon: "truck",
      },
    ],
  },

  // ACCOUNTS (requires accounts feature)
  {
    title: "Accounts",
    url: "/accounts",
    icon: "wallet",
    isActive: false,
    features: ["accounts"],
    items: [
      {
        title: "All Accounts",
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

  // REPORTS
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: "file-text",
    isActive: false,
    items: [
      {
        title: "Inventory Report",
        url: "/dashboard/reports/inventory",
        icon: "file-text",
      },
      {
        title: "Sales Report",
        url: "/dashboard/reports/sales",
        icon: "bar-chart-2",
        features: ["sales"],
      },
      {
        title: "Purchase Report",
        url: "/dashboard/reports/purchases",
        icon: "file-text",
      },
      {
        title: "Cash Report",
        url: "/dashboard/reports/cash",
        icon: "credit-card",
        features: ["accounts"],
      },
      {
        title: "Product Valuation",
        url: "/dashboard/reports/valuation",
        icon: "database",
      },
      {
        title: "Expiry Report",
        url: "/dashboard/reports/expiry",
        icon: "calendar",
        features: ["expiryTracking"],
      },
      {
        title: "Employee Report",
        url: "/dashboard/reports/employees",
        icon: "user-check",
      },
      {
        title: "Export Data",
        url: "/dashboard/reports/export",
        icon: "download-cloud",
      },
    ],
  },

  // SETTINGS
  {
    title: "Settings",
    url: "#",
    icon: "settings",
    isActive: false,
    items: [
      { title: "Discounts", url: "/discounts", icon: "tag" },
      {
        title: "Field Settings",
        url: "/settings/fields",
        icon: "sliders",
        permissions: ["organization.edit"],
      },
      {
        title: "Feature Settings",
        url: "/settings/features",
        icon: "toggle-left",
        permissions: ["organization.edit"],
      },
      {
        title: "Roles",
        url: "/settings/roles",
        icon: "shield",
        permissions: ["organization.view"],
      },
    ],
  },

  // ACCOUNT
  {
    title: "My Account",
    url: "#",
    icon: "user",
    isActive: false,
    items: [
      { title: "Profile", url: "/profile", icon: "user" },
      {
        title: "Users",
        url: "/users",
        icon: "users",
        permissions: ["users.view"],
      },
      {
        title: "Billing",
        url: "/dashboard/billing",
        icon: "credit-card",
      },
    ],
  },
];
