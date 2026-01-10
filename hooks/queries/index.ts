// Export all query hooks for the Product/Variant Management System
// Based on SRS requirements for product catalog with variants and stock management

// Auth hooks
export { useLogin, useLogout } from "./use-auth";

// Setup hooks
export { useCreateOwner } from "./use-setup";

// Profile hooks
export {
  useProfilePermissions,
  useUpdateAvatar,
  useUpdatePassword,
  useUpdatePreferences,
  useUpdateProfile,
} from "./use-profile";

// Product-related hooks
export {
  useCreateProduct,
  useDeleteProduct,
  useProduct,
  useProductBySlug,
  useProducts,
  useUpdateProduct,
} from "./use-products";

// Product Variant hooks (actual product variations with SKU, price, stock)
// Note: Stock movement hooks are in use-stock.ts
export {
  useCreateVariant,
  useDeleteVariant,
  useProductVariants,
  useVariantsByProduct,
} from "./use-product-variants";

// Category hooks
export {
  useCategories,
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "./use-categories";

// Brand hooks
export {
  useBrand,
  useBrands,
  useCreateBrand,
  useDeleteBrand,
  useBulkDeleteBrand,
  useUpdateBrand,
} from "./use-brands";

// Customers (Sales)
export {
  useCreateCustomer,
  useCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "./use-customers";

// Suppliers (Purchases)
export {
  useCreateSupplier,
  useDeleteSupplier,
  useSupplier,
  useSuppliers,
  useUpdateSupplier,
} from "./use-suppliers";

// Locations hooks
export {
  useCreateLocation,
  useDeleteLocation,
  useLocation,
  useLocations,
  useUpdateLocation,
} from "./use-locations";

// Units hooks
export {
  useCreateUnit,
  useDeleteUnit,
  useUnit,
  useUnits,
  useUpdateUnit,
} from "./use-units";

// Taxes hooks
export {
  useCreateTax,
  useDeleteTax,
  useTax,
  useTaxes,
  useUpdateTax,
} from "./use-taxes";

// Inventory hooks
export {
  useCreateInventory,
  useDeleteInventory,
  useInventory,
  useInventories,
  useInventoryShortlist,
  useReceiveStock,
  useBulkAdjustStock,
  useBulkReceiveStock,
  useSellStock,
  useBulkSellStock,
  useReturnSale,
  useBulkReturnSale,
  useReturnPurchase,
  useBulkReturnPurchase,
  useBulkTransferStock,
  useUpdateInventory,
} from "./use-inventory";
export type { BulkAdjustmentItem } from "./use-inventory";
// Note: Individual useTransferStock is exported from use-stock-movements

// Stock Movements & Operations (Audit Trail + Mutations)
export {
  useStockMovements,
  useInventoryHistory,
  useStockLevels,
  useAdjustStock,
  useTransferStock,
  useBulkStockAdjustment,
} from "./use-stock-movements";

// Variant hooks (variant attribute templates like Color, Size - used for creating variants)
export {
  useCreateVariantAttribute,
  useDeleteVariantAttribute,
  useUpdateVariantAttribute,
  useVariantAttribute,
  useVariantAttributes,
} from "./use-variants";

// Dashboard hooks
export { useDashboardStats } from "./use-dashboard";

export { useSelectOptions } from "./use-select-options";
