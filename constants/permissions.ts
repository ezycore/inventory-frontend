import type { Permission } from '@/types/users'

/**
 * Module configuration for permissions
 * Add new modules here to automatically generate permissions
 */
export const MODULES = {
  products: {
    name: 'Products',
    permissions: ['view', 'create', 'edit', 'delete'] as const,
  },
  categories: {
    name: 'Categories',
    permissions: ['view', 'create', 'edit', 'delete'] as const,
  },
  brands: {
    name: 'Brands',
    permissions: ['view', 'create', 'edit', 'delete'] as const,
  },
  stock: {
    name: 'Stock',
    permissions: ['view', 'manage'] as const,
  },
  reports: {
    name: 'Reports',
    permissions: ['view'] as const,
  },
  settings: {
    name: 'Settings',
    permissions: ['manage'] as const,
  },
  users: {
    name: 'Users',
    permissions: ['view', 'manage'] as const,
  },
  customers: {
    name: 'Customers',
    permissions: ['view', 'create', 'edit', 'delete'] as const,
  },
  suppliers: {
    name: 'Suppliers',
    permissions: ['view', 'create', 'edit', 'delete'] as const,
  },
  locations: {
    name: 'Locations',
    permissions: ['view', 'create', 'edit', 'delete'] as const,
  },
} as const

/**
 * Generate permission groups dynamically from MODULES
 */
export const PERMISSION_GROUPS = Object.entries(MODULES).reduce(
  (acc, [key, config]) => {
    acc[config.name] = config.permissions.map(
      (perm) => `${key}.${perm}` as Permission
    )
    return acc
  },
  {} as Record<string, Permission[]>
)

/**
 * Generate permission labels dynamically
 */
export const PERMISSION_LABELS = Object.entries(MODULES).reduce(
  (acc, [key, config]) => {
    config.permissions.forEach((perm) => {
      const label = perm.charAt(0).toUpperCase() + perm.slice(1)
      acc[`${key}.${perm}` as Permission] = `${label} ${config.name}`
    })
    return acc
  },
  {} as Record<Permission, string>
)

/**
 * Default permissions by role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.keys(PERMISSION_GROUPS).flatMap(
    (group) => PERMISSION_GROUPS[group]
  ),
  manager: [
    // Products
    'products.view',
    'products.create',
    'products.edit',
    // Categories
    'categories.view',
    'categories.create',
    'categories.edit',
    // Brands
    'brands.view',
    'brands.create',
    'brands.edit',
    // Stock
    'stock.view',
    'stock.manage',
    // Reports
    'reports.view',
    // Customers
    'customers.view',
    'customers.create',
    'customers.edit',
    // Suppliers
    'suppliers.view',
    'suppliers.create',
    'suppliers.edit',
    // Locations
    'locations.view',
    'locations.create',
    'locations.edit',
  ] as Permission[],
  staff: [
    'products.view',
    'categories.view',
    'brands.view',
    'stock.view',
    'customers.view',
    'suppliers.view',
    'locations.view',
  ] as Permission[],
}

/**
 * Permission utilities
 */
export const PermissionUtils = {
  /**
   * Check if user has a specific permission
   */
  hasPermission: (userPermissions: Permission[], permission: Permission): boolean => {
    return userPermissions.includes(permission)
  },

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission: (userPermissions: Permission[], permissions: Permission[]): boolean => {
    return permissions.some((perm) => userPermissions.includes(perm))
  },

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions: (userPermissions: Permission[], permissions: Permission[]): boolean => {
    return permissions.every((perm) => userPermissions.includes(perm))
  },

  /**
   * Get module permissions for a user
   */
  getModulePermissions: (userPermissions: Permission[], module: keyof typeof MODULES) => {
    const modulePerms = MODULES[module].permissions.map(
      (perm) => `${module}.${perm}` as Permission
    )
    return {
      canView: userPermissions.includes(`${module}.view` as Permission),
      canCreate: userPermissions.includes(`${module}.create` as Permission),
      canEdit: userPermissions.includes(`${module}.edit` as Permission),
      canDelete: userPermissions.includes(`${module}.delete` as Permission),
      canManage: userPermissions.includes(`${module}.manage` as Permission),
    }
  },
}
