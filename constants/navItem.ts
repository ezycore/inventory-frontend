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
      { title: "Stock Transfer", url: "/stock/transfers", icon: "truck" },
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
        title: "Sell Stock",
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
      {
        title: "Customers",
        url: "/sales/customers",
        icon: "users",
        features: ["sales"],
      },
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
        title: "Receive Stock",
        url: "/purchases",
        icon: "packages",
      },
      {
        title: "Created Orders",
        url: "/purchases/created-orders",
        icon: "file-plus",
      },
      { title: "Purchase History", url: "/purchases/history", icon: "clock" },
      {
        title: "Purchase Returns",
        url: "/purchases/returns",
        icon: "package-minus",
        features: ["returns"],
      },
      { title: "Suppliers", url: "/purchases/suppliers", icon: "truck" },
    ],
  },

  // LOCATIONS
  {
    title: "Locations",
    url: "/locations",
    icon: "box",
    isActive: false,
    items: [
      { title: "View All Locations", url: "/locations", icon: "list" },
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
        title: "Stock Product Value",
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
      { title: "Units", url: "/units", icon: "grid" },
      { title: "Taxes", url: "/taxes", icon: "percent" },
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
    ],
  },

  // ACCOUNT
  {
    title: "Account",
    url: "#",
    icon: "user",
    isActive: false,
    items: [
      { title: "Profile", url: "/profile", icon: "user" },
      {
        title: "Employees / Users",
        url: "/users",
        icon: "users",
        roles: ["admin", "manager"],
      },
      {
        title: "Subscription / Billing",
        url: "/dashboard/billing",
        icon: "credit-card",
      },
    ],
  },
];
