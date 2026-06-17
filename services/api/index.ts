/**
 * API Module Index
 * Central export point for all API modules
 */

// Export core client
export { apiClient, type ApiError } from "../../lib/api-client";

// Re-export utility functions
export { buildQueryParams, type BaseFilters } from "./utils";

// Re-export all API instances and types from modules
export * from './modules/accounts/api'
export * from './modules/auth/api'
export * from './modules/brands/api'
export * from './modules/categories/api'
export * from './modules/customers/api'
export * from './modules/dashboard/api'
export * from './modules/discounts/api'
export * from './modules/inventory/api'
export * from './modules/locations/api'
export * from './modules/locations/stock-report-api'
export * from './modules/organization/api'
export * from './modules/products/api'
export * from './modules/profile/api'
export * from './modules/purchase-orders/api'
export * from './modules/reports/api'
export * from './modules/roles/api'
export * from './modules/sales-orders/api'
export * from './modules/sales-returns/api'
export * from './modules/stock/api'
export * from './modules/suppliers/api'
export * from './modules/taxes/api'
export * from './modules/transactions/api'
export * from './modules/units/api'
export * from './modules/users/api'
export * from './modules/variants/api'
export * from './modules/use-select-options'

// Aliases for backward compatibility
export { variantsApi as variantApi, variantsApi as variantAttributesApi } from './modules/variants/api'

// Re-export all hooks from modules
export * from './modules/accounts/hooks'
export * from './modules/auth/hooks'
export * from './modules/brands/hooks'
export * from './modules/categories/hooks'
export * from './modules/customers/hooks'
export * from './modules/dashboard/hooks'
export * from './modules/discounts/hooks'
export * from './modules/inventory/hooks'
export * from './modules/locations/hooks'
export * from './modules/locations/stock-report-hooks'
export * from './modules/organization/hooks'
export * from './modules/storefront-orders/api'
export * from './modules/storefront-orders/hooks'
export * from './modules/coupons/api'
export * from './modules/coupons/hooks'
export * from './modules/campaigns/api'
export * from './modules/campaigns/hooks'
export * from './modules/content-pages/api'
export * from './modules/content-pages/hooks'
export * from './modules/products/hooks'
export * from './modules/profile/hooks'
export * from './modules/purchase-orders/hooks'
export * from './modules/reports/hooks'
export * from './modules/roles/hooks'
export * from './modules/sales-orders/hooks'
export * from './modules/sales-returns/hooks'
export * from './modules/stock/hooks'
export * from './modules/suppliers/hooks'
export * from './modules/taxes/hooks'
export * from './modules/transactions/hooks'
export * from './modules/units/hooks'
export * from './modules/users/hooks'
export * from './modules/variants/hooks'
