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

// Product Variant hooks (actual product variations with SKU, price, stock)
// Note: Stock movement hooks are in use-stock.ts
export {
  useProductVariants,
  useVariantsByProduct,
  useCreateVariant,
  useDeleteVariant,
} from './use-product-variants'

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

// Variant hooks (variant attribute templates like Color, Size - used for creating variants)
export {
  useVariantAttributes,
  useVariantAttribute,
  useCreateVariantAttribute,
  useUpdateVariantAttribute,
  useDeleteVariantAttribute,
} from './use-variants'

// Dashboard hooks
export {
  useDashboardStats,
} from './use-dashboard'


export { useSelectOptions} from './use-select-options'