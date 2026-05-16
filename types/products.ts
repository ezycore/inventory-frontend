// Re-export shared types for use in frontend
export type {
  Product,
  ProductWithVariants,
  Category,
  Brand,
  Variant,
  ProductFilters,
  VariantFilters,
  ProductStatus,
  CreateProductDto,
  UpdateProductDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateBrandDto,
  UpdateBrandDto,
  CreateVariantDto,
  UpdateVariantDto,
  StockMovement,
  CreateStockMovementDto
} from '@/types'

// Frontend-specific types that are not in shared-types
export interface StockAdjustmentDto {
  variantId: string
  type: 'adjustment' | 'purchase' | 'sale' | 'transfer' | 'damage' | 'return'
  quantity: number
  reason?: string
  from_location?: string
  to_location?: string
}

// API Response types using shared types
export interface ProductListResponse {
  products: import('@/types').ProductWithVariants[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface VariantListResponse {
  variants: import('@/types').Variant[]
  total: number
  page: number
  limit: number
  totalPages: number
}