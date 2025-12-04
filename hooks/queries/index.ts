// Export all query hooks for the Product/Variant Management System
// Based on SRS requirements for product catalog with variants and stock management

// Product-related hooks
export {
  useProducts,
  useProduct,
  useProductBySlug,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from './use-products'

// Variant-related hooks
export {
  useVariants,
  useVariant,
  useVariantsByProduct,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  useVariantStats,
  useStockMovements,
  useCreateStockMovement,
  useBulkUpdateVariants,
  useBulkDeleteVariants,
} from './variant-queries'

// Category hooks
export {
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './use-categories'

// Brand hooks
export {
  useBrands,
  useBrand,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from './use-brands'

// Variant Attribute hooks
export {
  useVariantAttributes,
  useVariantAttribute,
  useCreateVariantAttribute,
  useUpdateVariantAttribute,
  useDeleteVariantAttribute,
} from './use-variant-attributes'

// Dashboard hooks
export {
  useDashboardStats,
} from './use-dashboard'


export { useSelectOptions} from './use-select-options'