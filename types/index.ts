// Common enums
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export enum StockMovementType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer'
}

export enum StockMovementReason {
  PURCHASE = 'purchase',
  SALE = 'sale',
  RETURN = 'return',
  DAMAGE = 'damage',
  LOST = 'lost',
  ADJUSTMENT = 'adjustment',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out'
}

// Base interfaces
export interface BaseEntity {
  _id: string
  // API returns snake_case timestamp fields. Keep union with Date for flexibility.
  created_at: string | Date
  updated_at: string | Date
}

// Category interfaces
export interface Category extends BaseEntity {
  name: string
  slug: string
  description?: string
  parent_id?: string
  status: 'active' | 'inactive'
}

export interface CreateCategoryDto {
  name: string
  slug?: string
  description?: string
  parent_id?: string
  status?: 'active' | 'inactive'
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> { }

// Brand interfaces
export interface Brand extends BaseEntity {
  name: string
  slug: string
  description?: string
  logo_url?: string
  logo_public_id?: string
  website?: string
  status: 'active' | 'inactive'
}

export interface CreateBrandDto {
  name: string
  slug?: string
  description?: string
  logo_url?: string
  logo_public_id?: string
  website?: string
  status?: 'active' | 'inactive'
}

export interface UpdateBrandDto extends Partial<CreateBrandDto> { }


// Customer interfaces
export interface Customer extends BaseEntity {
  name: string
  email?: string
  phone?: string
  address?: string
  status: 'active' | 'inactive'
}

export interface CreateCustomerDto {
  name: string
  email?: string
  phone?: string
  address?: string
  status?: 'active' | 'inactive'
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> { }

// Supplier interfaces
export interface Supplier extends BaseEntity {
  name: string
  email?: string
  phone?: string
  address?: string
  status: 'active' | 'inactive'
}

export interface CreateSupplierDto {
  name: string
  email?: string
  phone?: string
  address?: string
  status?: 'active' | 'inactive'
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> { }

// Variant Attribute interfaces
export interface VariantAttribute extends BaseEntity {
  name: string
  values: string[]
  status: 'active' | 'inactive'
}

export interface CreateVariantAttributeDto {
  name: string
  values: string[]
  status?: 'active' | 'inactive'
}

export interface UpdateVariantAttributeDto extends Partial<CreateVariantAttributeDto> { }

// Custom field types
export enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  URL = 'url',
  DATE = 'date',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio'
}

export interface CustomFieldOption {
  label: string
  value: string
}

export interface CustomField {
  id: string
  label: string
  type: CustomFieldType
  value: string | number | boolean | string[]
  required: boolean
  placeholder?: string
  options?: CustomFieldOption[]
  columnSpan?: 6 | 12
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

// Product interfaces
export interface Product extends BaseEntity {
  name: string
  description?: string
  base_sku?: string
  category_id?: string
  brand_id?: string
  status: ProductStatus
  images?: string[]
  tags?: string[]
  custom_fields?: CustomField[]
  category?: Category
  brand?: Brand
}

export interface ProductWithVariants extends Product {
  variants?: Variant[]
}

export interface CreateProductDto {
  name: string
  slug?: string
  description?: string
  base_sku?: string
  category_id?: string
  brand_id?: string
  status?: ProductStatus
  images?: string[]
  tags?: string[]
  custom_fields?: CustomField[]
}

export interface UpdateProductDto extends Partial<CreateProductDto> { }

export interface ProductFilters {
  search?: string
  category_id?: string | undefined
  brand_id?: string | undefined
  status?: ProductStatus
  tags?: string[]
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// Variant interfaces
export interface Variant extends BaseEntity {
  product_id: string
  sku: string
  name?: string
  attributes: Record<string, any>
  price: number
  cost_price?: number
  stock_quantity: number
  low_stock_threshold: number
  barcode?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  images?: string[]
  status: 'active' | 'inactive' | 'archived'
  product?: Product
}

export interface CreateVariantDto {
  product_id: string
  sku: string
  name?: string
  attributes: Record<string, any>
  price: number
  cost_price?: number
  stock_quantity?: number
  low_stock_threshold?: number
  barcode?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  images?: string[]
  status?: 'active' | 'inactive' | 'archived'
}

export interface UpdateVariantDto extends Partial<Omit<CreateVariantDto, 'product_id'>> { }

export interface VariantFilters {
  product_id?: string | undefined
  search?: string
  sku?: string
  low_stock?: boolean
  status?: ProductStatus
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
  page?: number
  limit?: number
  sort?: string
}

export interface VariantStats {
  total_variants: number
  active_variants: number
  low_stock_count: number
  out_of_stock_count: number
  total_stock_value: number
  average_price: number
}

// Stock Movement interfaces
export interface StockMovement extends BaseEntity {
  variant_id: string
  type: StockMovementType
  quantity: number
  reason: StockMovementReason
  reference_id?: string
  notes?: string
  created_by?: string
  variant?: Variant
}

export interface CreateStockMovementDto {
  variant_id: string
  type: StockMovementType
  quantity: number
  reason: StockMovementReason
  reference_id?: string
  notes?: string
  created_by?: string
}

export interface UpdateStockMovementDto extends Partial<Omit<CreateStockMovementDto, 'variant_id'>> { }

export interface StockMovementFilters {
  variant_id?: string
  product_id?: string
  type?: StockMovementType
  reason?: StockMovementReason
  start_date?: Date
  end_date?: Date
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiError {
  success: false
  error: string
  message?: string
  statusCode?: number
}

// Query interfaces for TanStack Query
export interface UseQueryOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  retry?: number | boolean
  staleTime?: number
  cacheTime?: number
}

export interface UseMutationOptions<TData = unknown, TError = unknown, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: TError, variables: TVariables) => void
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void
}