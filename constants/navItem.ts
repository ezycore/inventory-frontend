// coding-standard: maintained
import { NavItem } from "@/types/layout";

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
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
      {
        title: "Taxes",
        url: "/taxes",
        icon: "percent",
        features: ["tax"],
        permissions: ["taxes.view"],
      },
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
  // {
  //   title: "Purchases",
  //   url: "/purchases",
  //   icon: "shopping-bag",
  //   isActive: false,
  //   items: [
  //     {
  //       title: "New Purchase",
  //       url: "/purchases",
  //       icon: "packages",
  //     },
  //     {
  //       title: "Purchase Orders",
  //       url: "/purchases/orders",
  //       icon: "file-plus",
  //     },
  //     { title: "Purchase List", url: "/purchases/history", icon: "clock" },
  //     {
  //       title: "Purchase Returns",
  //       url: "/purchases/returns",
  //       icon: "package-minus",
  //       features: ["returns"],
  //     },
  //     // Suppliers moved to top-level navigation
  //   ],
  // },

  // ECOMMERCE (requires storefront feature — plan-gated)
  {
    title: "Ecommerce",
    url: "/ecommerce",
    icon: "store",
    isActive: false,
    features: ["storefront"],
    items: [
      {
        title: "Dashboard",
        url: "/ecommerce/dashboard",
        icon: "layout-dashboard",
        features: ["storefront"],
        permissions: ["storefront.view"],
      },
      {
        title: "Orders",
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
        title: "Navigation",
        url: "/ecommerce/navigation",
        icon: "menu",
        features: ["storefront"],
        permissions: ["storefront.manage"],
      },
      {
        title: "Customers",
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
        title: "Tax Report",
        url: "/dashboard/reports/tax",
        icon: "percent",
        features: ["tax"],
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
        title: "Roles",
        url: "/settings/roles",
        icon: "shield",
        permissions: ["organization.view"],
      },
      {
        title: "Users",
        url: "/users",
        icon: "users",
        permissions: ["users.view"],
      },
    ],
  },
];
