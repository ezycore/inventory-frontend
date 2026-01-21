// Export all query hooks for the Product/Variant Management System
// Based on SRS requirements for product catalog with variants and stock management

// Auth hooks
export { useLogin, useLogout } from "./use-auth";

// Profile hooks
export {
  useProfile,
  useProfilePermissions,
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
  useBulkDeleteBrand,
  useCreateBrand,
  useDeleteBrand,
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

// Discounts hooks
export {
  useCreateDiscount,
  useDeleteDiscount,
  useDiscount,
  useDiscounts,
  useUpdateDiscount,
} from "./use-discounts";

// Inventory hooks
export {
  useBulkAdjustStock,
  useBulkReceiveStock,
  useBulkReturnPurchase,
  useBulkReturnSale,
  useBulkSellStock,
  useBulkTransferStock,
  useCreateInventory,
  useDeleteInventory,
  useInventories,
  useInventory,
  useInventoryShortlist,
  useReceiveStock,
  useReturnPurchase,
  useReturnSale,
  useSellStock,
  useUpdateInventory,
} from "./use-inventory";
export type { BulkAdjustmentItem } from "./use-inventory";
// Note: Individual useTransferStock is exported from use-stock-movements

// Stock Movements & Operations (Audit Trail + Mutations)
export {
  useAdjustStock,
  useBulkStockAdjustment,
  useInventoryHistory,
  useStockLevels,
  useStockMovements,
  useTransferStock,
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

// Organization hooks
export {
  useCreateOrganizationApi,
  useDeleteOrganizationApi,
  useFormSettingsOrganizationApi,
  useGetOrganizationApi,
  useUpdateOrganizationApi,
} from "./use-organization";

// Accounts hooks
export {
  useAccount,
  useAccounts,
  useAccountSummary,
  useAddAccount,
  useBulkDeleteAccounts,
  useCreateAccount,
  useDefaultAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "./use-accounts";

// Transactions hooks
export {
  useAccountTransactions,
  useAddExpense,
  useAddIncome,
  useAddTransfer,
  useCreateExpense,
  useCreateIncome,
  useCreateTransfer,
  useTransaction,
  useTransactions,
  useTransactionSummary,
} from "./use-transactions";
