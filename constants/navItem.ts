import { NavItem } from "@/types/layout";

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: 'home',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },

  // PRODUCTS
  {
    title: 'Products',
    url: '/products',
    icon: 'package',
    isActive: false,
    shortcut: ['p', 'p'],
    items: [
      { title: 'All Products', url: '/products', icon: 'list' },
      { title: 'Categories', url: '/categories', icon: 'tag' },
      { title: 'Brands', url: '/brands', icon: 'star' },
      { title: 'Variants', url: '/variants', icon: 'layers' }
    ]
  },

  // INVENTORY
  {
    title: 'Inventory',
    url: '/inventory',
    icon: 'database',
    isActive: false,
    items: [
      { title: 'Inventory List', url: '/inventory', icon: 'list' },
      { title: 'Shortlist', url: '/inventory/shortlist', icon: 'clipboard-list' },
      { title: 'Stock Adjustment', url: '/inventory/adjust', icon: 'edit' }
    ]
  },

  // STOCK MANAGEMENT
  {
    title: 'Stock Management',
    url: '/stock',
    icon: 'layers',
    isActive: false,
    items: [
      { title: 'Stock Overview', url: '/stock', icon: 'eye' },
      { title: 'Stock Movements', url: '/stock/movements', icon: 'arrow-right-left' },
      { title: 'Stock Adjustments', url: '/stock/adjustments', icon: 'edit' },
      { title: 'Low Stock Alert', url: '/stock/alerts', icon: 'alert-triangle' },
      { title: 'Stock Transfer', url: '/stock/transfers', icon: 'truck' }
    ]
  },

  // SALES
  {
    title: 'Sales',
    url: '/sales',
    icon: 'shopping-cart',
    isActive: false,
    items: [
      { title: 'New Sale / POS', url: '/sales', icon: 'credit-card' },
      { title: 'Sales History', url: '/sales/history', icon: 'clock' },
      { title: 'Sales Return', url: '/sales/returns', icon: 'corner-up-left' },
      { title: 'Customers', url: '/sales/customers', icon: 'users' }
    ]
  },

  // PURCHASES
  {
    title: 'Purchases',
    url: '/purchases',
    icon: 'shopping-bag',
    isActive: false,
    items: [
      { title: 'Receive Stock', url: '/purchases/receive', icon: 'package-plus' },
      { title: 'Receive Stock (Bulk)', url: '/purchases/receive-bulk', icon: 'packages' },
      { title: 'Purchase History', url: '/purchases/history', icon: 'clock' },
      { title: 'Suppliers', url: '/purchases/suppliers', icon: 'truck' }
    ]
  },

  // WAREHOUSES
  {
    title: 'Locations',
    url: '/locations',
    icon: 'box',
    isActive: false,
    items: [
      { title: 'View All Locations', url: '/locations', icon: 'list' },
      { title: 'Location Stock Report', url: '/locations/stock-report', icon: 'bar-chart-2' },
      { title: 'Transfer Requests', url: '/locations/transfer-requests', icon: 'truck' }
    ]
  },
  // REPORTS
  {
    title: 'Reports',
    url: '/dashboard/reports',
    icon: 'file-text',
    isActive: false,
    items: [
      { title: 'Inventory Report', url: '/dashboard/reports/inventory', icon: 'file-text' },
      { title: 'Sales Report', url: '/dashboard/reports/sales', icon: 'bar-chart-2' },
      { title: 'Purchase Report', url: '/dashboard/reports/purchases', icon: 'file-text' },
      { title: 'Cash Report', url: '/dashboard/reports/cash', icon: 'credit-card' },
      { title: 'Stock Product Value', url: '/dashboard/reports/valuation', icon: 'database' },
      { title: 'Expiry Report', url: '/dashboard/reports/expiry', icon: 'calendar' },
      { title: 'Employee Report', url: '/dashboard/reports/employees', icon: 'user-check' },
      { title: 'Export Data', url: '/dashboard/reports/export', icon: 'download-cloud' }
    ]
  },

  // ADMIN / ACCOUNT
  {
    title: "Settings",
    url: "#",
    icon: "settings",
    isActive: false,
    items: [
      { title: "Units", url: "/units", icon: "grid" },
      { title: "Taxes", url: "/taxes", icon: "percent" },
    ],
  },
  {
    title: "Account",
    url: "#",
    icon: "user",
    isActive: false,
    items: [
      { title: "Profile", url: "/profile", icon: "user" },
      { title: "Employees / Users", url: "/dashboard/users", icon: "users" },
      {
        title: "Subscription / Billing",
        url: "/dashboard/billing",
        icon: "credit-card",
      },
    ],
  },
];
