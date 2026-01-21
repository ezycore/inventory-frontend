// Common enums
export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
}

export enum StockMovementType {
  IN = "in",
  OUT = "out",
  ADJUSTMENT = "adjustment",
  TRANSFER = "transfer",
}

export enum StockMovementReason {
  PURCHASE = "purchase",
  SALE = "sale",
  RETURN = "return",
  DAMAGE = "damage",
  LOST = "lost",
  ADJUSTMENT = "adjustment",
  TRANSFER_IN = "transfer_in",
  TRANSFER_OUT = "transfer_out",
}

/**
 * Organization feature toggles
 * Controls which modules are enabled for the organization
 */
export interface OrganizationFeatures {
  sales: boolean;
  accounts: boolean;
  expiryTracking: boolean;
  barcodeSystem: boolean;
  invoicePrinting: boolean;
  returns: boolean;
}

/**
 * Default feature settings for new organizations
 */
export const DEFAULT_ORGANIZATION_FEATURES: OrganizationFeatures = {
  sales: true,
  accounts: false,
  expiryTracking: false,
  barcodeSystem: false,
  invoicePrinting: false,
  returns: true,
};

/**
 * Feature name type for type-safe feature checks
 */
export type FeatureName = keyof OrganizationFeatures;

// Base interfaces
export interface BaseEntity {
  _id: string;
  // API returns snake_case timestamp fields. Keep union with Date for flexibility.
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Category interfaces
export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  status: "active" | "inactive";
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string;
  status?: "active" | "inactive";
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> { }

// Brand image metadata
export interface Image {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  publicId: string;
}

// Brand interfaces
export interface Brand extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  images: Image[];
  status: "active" | "inactive";
}

// Location interfaces (unified for stores and warehouses)
export interface Location extends BaseEntity {
  name: string;
  locationType: "store" | "warehouse";
  address: string;
  manager: string;
  contactNumber?: string;
  email?: string;
  status: "active" | "inactive";
}

export interface CreateLocationDto {
  name: string;
  locationType: "store" | "warehouse";
  address: string;
  manager: string;
  contactNumber?: string;
  email?: string;
  status?: "active" | "inactive";
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> { }

export interface CreateBrandDto {
  name: string;
  slug?: string;
  description?: string;
  images?: Image[];
  status?: "active" | "inactive";
}

export interface UpdateBrandDto extends Partial<CreateBrandDto> { }

// Customer interfaces
export interface Customer extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
  defaultDiscountId?: string;
  defaultDiscount?: Discount;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: "active" | "inactive";
  defaultDiscountId?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> { }

// Supplier interfaces
export interface Supplier extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
  defaultDiscountId?: string;
  defaultDiscount?: Discount;
}

export interface CreateSupplierDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: "active" | "inactive";
  defaultDiscountId?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> { }

// Unit interfaces
export interface Unit extends BaseEntity {
  name: string;
  shortName?: string;
  status: "active" | "inactive";
}

export interface CreateUnitDto {
  name: string;
  shortName?: string;
  status?: "active" | "inactive";
}

export interface UpdateUnitDto extends Partial<CreateUnitDto> { }

// Tax interfaces
export interface Tax extends BaseEntity {
  name: string;
  rate: number;
  type: "percentage" | "fixed";
  status: "active" | "inactive";
}

export interface CreateTaxDto {
  name: string;
  rate: number;
  type: "percentage" | "fixed";
  status?: "active" | "inactive";
}

export interface UpdateTaxDto extends Partial<CreateTaxDto> { }

// Discount interfaces
export type DiscountType = "percentage" | "fixed";
export type DiscountApplicableTo = "sales" | "purchase" | "both";

export interface Discount extends BaseEntity {
  name: string;
  value: number;
  type: DiscountType;
  applicableTo: DiscountApplicableTo;
  description?: string;
  status: "active" | "inactive";
}

export interface CreateDiscountDto {
  name: string;
  value: number;
  type: DiscountType;
  applicableTo?: DiscountApplicableTo;
  description?: string;
  status?: "active" | "inactive";
}

export interface UpdateDiscountDto extends Partial<CreateDiscountDto> { }

// Inventory interfaces
export interface Inventory extends BaseEntity {
  productId: string;
  variantId?: string | null;
  locationId: string;
  quantity: number;
  quantityAlert: number;
  idealQuantity: number;
  isLowStock: boolean;
  status: "active" | "inactive";
  product?: Product;
  variant?: Variant;
  location?: Location;
}

export interface CreateInventoryDto {
  productId: string;
  variantId?: string | null;
  locationId: string;
  quantity: number;
  quantityAlert: number;
  idealQuantity: number;
  status?: "active" | "inactive";
}

export interface UpdateInventoryDto extends Partial<CreateInventoryDto> { }

// Receive Stock / Purchase DTO
export interface ReceiveStockDto {
  productId: string;
  variantId?: string | null;
  locationId: string;
  receivedQuantity: number;
}

// Variant Attribute interfaces
export interface VariantAttribute extends BaseEntity {
  name: string;
  values: string[];
  status: "active" | "inactive";
}

export interface CreateVariantAttributeDto {
  name: string;
  values: string[];
  status?: "active" | "inactive";
}

export interface UpdateVariantAttributeDto
  extends Partial<CreateVariantAttributeDto> { }

// Custom field types
export enum CustomFieldType {
  TEXT = "text",
  NUMBER = "number",
  EMAIL = "email",
  URL = "url",
  DATE = "date",
  TEXTAREA = "textarea",
  SELECT = "select",
  CHECKBOX = "checkbox",
  RADIO = "radio",
}

export interface CustomFieldOption {
  label: string;
  value: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  value: string | number | boolean | string[];
  required: boolean;
  placeholder?: string;
  options?: CustomFieldOption[];
  columnSpan?: 6 | 12;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Product interfaces
export interface Product extends BaseEntity {
  name: string;
  description?: string;
  base_sku?: string;
  categoryId?: string;
  brandId?: string;
  status: ProductStatus;
  images?: string[];
  tags?: string[];
  custom_fields?: CustomField[];
  category?: Category;
  brand?: Brand;
}

export interface ProductWithVariants extends Product {
  variants?: Variant[];
}

export interface CreateProductDto {
  name: string;
  slug?: string;
  description?: string;
  base_sku?: string;
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  images?: string[];
  tags?: string[];
  custom_fields?: CustomField[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> { }

export interface ProductFilters {
  search?: string;
  categoryId?: string | undefined;
  brandId?: string | undefined;
  status?: ProductStatus;
  tags?: string[];
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Variant interfaces
export interface Variant extends BaseEntity {
  productId: string;
  sku: string;
  name?: string;
  attributes: Record<string, any>;
  price: number;
  costPrice?: number;
  stock_quantity: number;
  low_stock_threshold: number;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
  status: "active" | "inactive" | "archived";
  product?: Product;
}

export interface CreateVariantDto {
  productId: string;
  sku: string;
  name?: string;
  attributes: Record<string, any>;
  price: number;
  costPrice?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  images?: string[];
  status?: "active" | "inactive" | "archived";
}

export interface UpdateVariantDto
  extends Partial<Omit<CreateVariantDto, "productId">> { }

export interface VariantFilters {
  productId?: string | undefined;
  search?: string;
  sku?: string;
  low_stock?: boolean;
  status?: ProductStatus;
  stock_status?: "in_stock" | "low_stock" | "out_of_stock";
  page?: number;
  limit?: number;
  sort?: string;
}

export interface VariantStats {
  total_variants: number;
  active_variants: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_stock_value: number;
  average_price: number;
}

// Stock Movement interfaces
export interface StockMovement extends BaseEntity {
  variantId: string;
  type: StockMovementType;
  quantity: number;
  reason: StockMovementReason;
  reference_id?: string;
  notes?: string;
  createdBy?: string;
  variant?: Variant;
}

export interface CreateStockMovementDto {
  variantId: string;
  type: StockMovementType;
  quantity: number;
  reason: StockMovementReason;
  reference_id?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateStockMovementDto
  extends Partial<Omit<CreateStockMovementDto, "variantId">> { }

export interface StockMovementFilters {
  variantId?: string;
  productId?: string;
  type?: StockMovementType;
  reason?: StockMovementReason;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

// Query interfaces for TanStack Query
export interface UseQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  retry?: number | boolean;
  staleTime?: number;
  cacheTime?: number;
}

export interface UseMutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = unknown
> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables
  ) => void;
}

export interface createOrganizationDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  organizationName: string;
  organizationSlug?: string;
  industry: string;
  country: string;
  timezone: string;
  currency: string;
  address?: string;
}

export interface OrganizationData {
  name: string;
  industry: string;
  country: string;
  timezone: string;
  currency: string;
  address: string;
}

export interface UpdateOrganizationDto
  extends Partial<OrganizationData> {}

// Account interfaces
export type AccountType = "cash" | "bank" | "bkash" | "nagad" | "custom";

export interface Account extends BaseEntity {
  name: string;
  type: AccountType;
  balance: number;
  accountNumber?: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  initialBalance?: number;
  accountNumber?: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateAccountDto extends Partial<Omit<CreateAccountDto, "initialBalance">> {}

export interface AccountSummary {
  totalBalance: number;
  accountCount: number;
  byType: {
    cash: number;
    bank: number;
    bkash: number;
    nagad: number;
    custom: number;
  };
}

// Transaction interfaces
export type TransactionType = "income" | "expense" | "transfer";
export type TransactionCategory =
  | "sale"
  | "purchase"
  | "salary"
  | "rent"
  | "utilities"
  | "refund"
  | "adjustment"
  | "transfer"
  | "other";

export interface Transaction extends BaseEntity {
  accountId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  balanceAfter: number;
  description?: string;
  reference?: string;
  toAccountId?: string;
  customerId?: string;
  supplierId?: string;
  createdBy: string;
  date: string;
  account?: Account;
  toAccount?: Account;
  customer?: Customer;
  supplier?: Supplier;
}

export interface CreateIncomeDto {
  accountId: string;
  amount: number;
  category: TransactionCategory;
  description?: string;
  reference?: string;
  customerId?: string;
  date?: string;
}

export interface CreateExpenseDto {
  accountId: string;
  amount: number;
  category: TransactionCategory;
  description?: string;
  reference?: string;
  supplierId?: string;
  date?: string;
}

export interface CreateTransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  reference?: string;
  date?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  totalTransferOut: number;
  totalTransferIn: number;
  netChange: number;
}

// Purchase Order Types
export type PurchaseOrderStatus =
  | "draft"
  | "ordered"
  | "partial"
  | "received"
  | "cancelled";

export type PurchaseOrderDiscountType = "percentage" | "fixed";

export interface PurchaseOrderItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  receivedQuantity: number;
  productName?: string;
  variantName?: string;
  product?: Product;
  variant?: Variant;
}

export interface PurchaseOrder extends BaseEntity {
  organizationId: string;
  orderNumber: string;
  supplierId: string;
  locationId: string;
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  invoiceNumber?: string;
  invoiceDate?: string;
  discountType: PurchaseOrderDiscountType;
  discountValue: number;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  notes?: string;
  receivedAt?: string;
  createdBy?: string;
  supplier?: Supplier;
  location?: Location;
}

export interface CreatePurchaseOrderItemDto {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number;
  productName?: string;
  variantName?: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  locationId: string;
  items: CreatePurchaseOrderItemDto[];
  status?: PurchaseOrderStatus;
  invoiceNumber?: string;
  invoiceDate?: string;
  discountType?: PurchaseOrderDiscountType;
  discountValue?: number;
  taxTotal?: number;
  notes?: string;
}

export interface UpdatePurchaseOrderDto extends Partial<CreatePurchaseOrderDto> { }

export interface ReceivePurchaseOrderItemDto {
  productId: string;
  variantId?: string | null;
  receivedQuantity: number;
}

export interface ReceivePurchaseOrderDto {
  items: ReceivePurchaseOrderItemDto[];
}

// Sales Order Types
export type SalesOrderStatus =
  | "draft"
  | "confirmed"
  | "fulfilled"
  | "cancelled";

export type SalesOrderDiscountType = "percentage" | "fixed";

export interface SalesOrderItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  productName?: string;
  variantName?: string;
  product?: Product;
  variant?: Variant;
}

export interface SalesOrder extends BaseEntity {
  organizationId: string;
  orderNumber: string;
  customerId?: string;
  locationId: string;
  items: SalesOrderItem[];
  status: SalesOrderStatus;
  invoiceNumber?: string;
  discountType: SalesOrderDiscountType;
  discountValue: number;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  notes?: string;
  fulfilledAt?: string;
  createdBy?: string;
  customer?: Customer;
  location?: Location;
}

export interface CreateSalesOrderItemDto {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number;
  productName?: string;
  variantName?: string;
}

export interface CreateSalesOrderDto {
  customerId?: string | null;
  locationId: string;
  items: CreateSalesOrderItemDto[];
  status?: SalesOrderStatus;
  invoiceNumber?: string;
  discountType?: SalesOrderDiscountType;
  discountValue?: number;
  taxTotal?: number;
  notes?: string;
}

export interface UpdateSalesOrderDto extends Partial<CreateSalesOrderDto> { }

export interface FulfillSalesOrderDto {
  notes?: string;
}
