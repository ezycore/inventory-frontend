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
  /** Enable UOM conversion (purchase in boxes, sell in pieces, etc.) */
  uomConversion: boolean;
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
  uomConversion: false,
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
  status: "active" | "inactive";
  productCount: number; // For displaying number of products in category
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
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
  productCount: number; // For displaying number of products in brand
}

// Location interfaces (unified for stores and warehouses)
export interface Location extends BaseEntity {
  name: string;
  locationType: "store" | "warehouse";
  address: string;
  contactNumber?: string;
  email?: string;
  status: "active" | "inactive";
  default: boolean;
  users: { _id: string; firstName: string; lastName: string; email: string }[];
  usersId: string[];
}

export interface CreateLocationDto {
  name: string;
  locationType: "store" | "warehouse";
  address: string;
  status?: "active" | "inactive";
  default?: boolean;
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

// Customer Summary (aggregated stats - includes returns data)
export interface CustomersSummary {
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  salesCount: number;
  // Returns data
  totalRefunds: number;
  totalCashRefunded: number;
  totalDueAdjusted: number;
  returnsCount: number;
}

// Sales Summary (for sales history page)
export interface SalesSummary {
  allTime: {
    totalSales: number;
    totalPaid: number;
    totalDue: number;
    salesCount: number;
  };
  today: {
    totalSales: number;
    salesCount: number;
  };
  thisWeek: {
    totalSales: number;
    salesCount: number;
  };
  thisMonth: {
    totalSales: number;
    salesCount: number;
  };
}

// Sales Returns Summary (for returns page)
export interface SalesReturnsSummary {
  allTime: {
    totalRefunds: number;
    totalCashRefunded: number;
    totalDueAdjusted: number;
    returnsCount: number;
    totalItems: number;
  };
  today: {
    totalRefunds: number;
    returnsCount: number;
  };
  thisWeek: {
    totalRefunds: number;
    returnsCount: number;
  };
  thisMonth: {
    totalRefunds: number;
    returnsCount: number;
  };
}

// Customer Ledger Types
export interface CustomerLedgerSale {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
  status: "draft" | "partial" | "paid" | "cancelled";
}

export interface CustomerLedgerPayment {
  _id: string;
  type: "sale" | "salesRefund";
  amount: number;
  createdAt: string;
  accountId?: {
    _id: string;
    name: string;
  };
  referenceId?: {
    _id: string;
    invoiceNumber: string;
  };
}

export interface CustomerLedgerReturn {
  _id: string;
  returnNumber: string;
  invoiceNumber: string;
  totalRefundAmount: number;
  refundedAmount: number;
  createdAt: string;
  saleId?: {
    _id: string;
    invoiceNumber: string;
  };
}

export interface CustomerLedger {
  sales: CustomerLedgerSale[];
  payments: CustomerLedgerPayment[];
  returns: CustomerLedgerReturn[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Supplier Ledger Types
export interface SupplierLedgerPurchaseOrder {
  _id: string;
  orderNumber: string;
  invoiceNumber?: string;
  invoiceAmount: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
  status: "draft" | "ordered" | "partial" | "received" | "cancelled";
}

export interface SupplierLedgerPayment {
  _id: string;
  type: "purchase" | "purchase_return" | "purchase_cancelled";
  amount: number;
  createdAt: string;
  accountId?: {
    _id: string;
    name: string;
  };
  referenceId?: {
    _id: string;
    orderNumber: string;
    invoiceNumber?: string;
  };
}

export interface SupplierLedgerReturn {
  _id: string;
  returnNumber: string;
  orderNumber: string;
  totalRefundAmount: number;
  refundedAmount: number;
  createdAt: string;
  purchaseOrderId?: {
    _id: string;
    orderNumber: string;
    invoiceNumber?: string;
  };
}

export interface SupplierLedger {
  purchaseOrders: SupplierLedgerPurchaseOrder[];
  payments: SupplierLedgerPayment[];
  returns: SupplierLedgerReturn[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

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

// Unit Category for grouping units
export enum UnitCategory {
  COUNT = "count", // pieces, boxes, packs
  WEIGHT = "weight", // kg, g, lb
  VOLUME = "volume", // l, ml, gal
  LENGTH = "length", // m, cm, ft
  AREA = "area", // sqm, sqft
  TIME = "time", // hr, day, mo
  CUSTOM = "custom", // user-defined
}

// Unit interfaces
export interface Unit extends BaseEntity {
  name: string;
  shortName?: string;
  category: UnitCategory;
  isSystemUnit: boolean;
  status: "active" | "inactive";
}

export interface CreateUnitDto {
  name: string;
  shortName?: string;
  category?: UnitCategory;
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
  isLowStock: boolean;
  quantityBreakdown?: {
    displayText: string; // e.g., "2 boxes + 5 pieces"
  }
  status: "active" | "inactive";
  product?: Product;
  variant?: Variant;
  location?: Location;
  costPrice: number;
  restockStatus?: "normal" | "ordered" | "hidden";
  neededQuantity?: number;
}

export interface CreateInventoryDto {
  productId: string;
  variantId?: string | null;
  locationId: string;
  quantity: number;
  quantityAlert: number;
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

export interface UpdateVariantAttributeDto extends Partial<CreateVariantAttributeDto> { }

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
  unitId?: string;
  status: ProductStatus;
  images?: string[];
  tags?: string[];
  custom_fields?: CustomField[];
  category?: Category;
  brand?: Brand;
  unit?: Unit;

  // UOM Conversion fields
  enableUOMConversion?: boolean;
  purchaseUnit?: {
    unitId: string;
    conversionFactor: number;
  };
  saleUnit?: {
    unitId: string;
    conversionFactor: number;
  };
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

export interface UpdateVariantDto extends Partial<
  Omit<CreateVariantDto, "productId">
> { }

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

export interface UpdateStockMovementDto extends Partial<
  Omit<CreateStockMovementDto, "variantId">
> { }

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
  TVariables = unknown,
> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
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

export interface UpdateOrganizationDto extends Partial<OrganizationData> { }

// Account interfaces
export type AccountType = "cash" | "bank" | "mfs" | "custom";

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

export interface UpdateAccountDto extends Partial<
  Omit<CreateAccountDto, "initialBalance">
> { }

export interface AccountSummary {
  totalBalance: number;
  accountCount: number;
  byType: {
    cash: number;
    bank: number;
    mfs: number;
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

export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  totalTransfers: number;
  netChange: number;
  transactionCount: number;
  incomeTrend: number;
  expenseTrend: number;
  netTrend: number;
  chartData: Array<{ label: string; income: number; expense: number }>;
  period: {
    key: string;
    startDate: string;
    endDate: string;
    chartGrouping: "hourly" | "daily" | "weekly" | "monthly";
  };
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
  inventoryId?: string;
  quantity: number;
  receivedQuantity: number;
  price: number;
  costPrice?: number;
  subtotal: number;
  productName?: string;
  conversionFactor?: number;
  discount?: number;
  variantName?: string;
  product?: { name: string };
}

export interface PurchaseOrder extends BaseEntity {
  organizationId: string;
  orderNumber: string;
  supplierId: Supplier;
  locationId: string;
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  invoiceDate?: string;
  subtotal: number;
  taxTotal: number;
  notes?: string;
  createdBy?: string;
  paymentStatus?: "unpaid" | "partial" | "paid";
  paidAmount?: number;
  dueAmount?: number;
  invoiceNumber?: string;
  // Additional fields from API
  supplier?: Supplier;
  grandTotal?: number;
  totalAmount?: number;
  additionalDiscount?: number;
  invoiceAmount?: number;
}

export interface CreatePurchaseOrderItemDto {
  productId: string;
  variantId?: string | null;
  inventoryId?: string;
  productName?: string;
  quantity: number;
  price: number;
  costPrice?: number;
  discount?: number;
  conversionFactor?: number;
}

// Single Purchase Order DTO
export interface CreatePurchaseOrderDto {
  supplierId: string;
  items: CreatePurchaseOrderItemDto[];
  additionalDiscount?: number; // Changed from discountType/discountValue
  status?: PurchaseOrderStatus;
  invoiceNumber?: string;
  invoiceDate?: string;
  taxTotal?: number;
  payment?: PurchasePaymentInfo;
  notes?: string;
}

// Array of Purchase Orders (for batch creation)
export type CreatePurchaseOrdersDto = CreatePurchaseOrderDto[];

export interface UpdatePurchaseOrderDto extends Partial<CreatePurchaseOrderDto> { }

export interface ReceivePurchaseOrderItemDto {
  productId: string;
  variantId?: string | null;
  inventoryId?: string;
  receivedQuantity: number;
}

export interface ReceivePurchaseOrderDto {
  items: ReceivePurchaseOrderItemDto[];
  paymentInfo?: PurchasePaymentInfo;
}

// Purchase Payment Types
export interface PurchasePaymentInfo {
  paymentMethod: string;
  accountId: string;
  paidAmount?: number;
}

export interface AddPurchasePaymentDto {
  paymentMethod: string;
  accountId: string;
  amount: number;
  notes?: string;
}

export interface PurchaseOrdersSummary {
  totalOrders: number;
  orderedOrders: number;
  receivedOrders: number;
  partialOrders: number;
  cancelledOrders: number;
  draftOrders: number;
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
}

export interface PurchaseOrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
}

// ============================
// Purchase Return Types
// ============================

/**
 * Purchase return status enum
 */
export type PurchaseReturnStatus = "pending" | "completed" | "cancelled";

/**
 * Purchase return reason enum
 */
export type PurchaseReturnReason =
  | "damaged"
  | "defective"
  | "wrong_item"
  | "excess_quantity"
  | "expired"
  | "other";

/**
 * Purchase return item interface
 */
export interface PurchaseReturnItem {
  productId: string;
  variantId?: string | null;
  inventoryId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  discount?: number;
  refundAmount: number;
  lineTotal: number;
  conversionFactor?: number; // For UoM conversion (e.g., 1 box = 100 pieces)
}

/**
 * Purchase return interface
 */
export interface PurchaseReturn extends BaseEntity {
  returnNumber: string;
  organizationId: string;
  locationId: string;
  purchaseOrderId: string | { _id: string; orderNumber: string };
  orderNumber: string;
  supplierId?: string;
  items: PurchaseReturnItem[];
  totalRefundAmount: number;
  refundedAmount: number;
  totalCostAmount?: number;
  reason: PurchaseReturnReason;
  notes?: string;
  status: PurchaseReturnStatus;
  returnDate: string;
  processedBy?: string;
  refundAllocation?: {
    adjustPurchaseDue?: number;
    adjustOtherDues?: Array<{
      dueId: string;
      purchaseOrderId: string;
      amount: number;
    }>;
    accountRefund?: {
      accountId: string;
      amount: number;
      paymentMethod: string;
    };
  };
  supplier?: Supplier;
}

/**
 * Create purchase return item DTO
 */
export interface CreatePurchaseReturnItemDto {
  productId: string;
  variantId?: string | null;
  inventoryId: string;
  productName?: string;
  quantity: number;
  price: number;
  costPrice: number;
  discount?: number;
  conversionFactor?: number; // For UoM conversion (e.g., 1 box = 100 pieces)
}

/**
 * Create purchase return DTO
 */
export interface CreatePurchaseReturnDto {
  purchaseOrderId: string;
  items: CreatePurchaseReturnItemDto[];
  reason: PurchaseReturnReason;
  notes?: string;
  refundAllocation?: {
    // Backend expects 'adjustSupplierDue' not 'adjustPurchaseDue'
    adjustSupplierDue?: number;
    accountRefund?: {
      accountId: string;
      amount: number;
      paymentMethod: string;
    };
  };
}

/**
 * Purchase return filters for queries
 */
export interface PurchaseReturnFilters {
  page?: number;
  limit?: number;
  purchaseOrderId?: string;
  supplierId?: string;
  status?: PurchaseReturnStatus;
  reason?: PurchaseReturnReason;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Supplier pending due from a purchase order
 */
export interface SupplierPendingDue {
  id: string;
  purchaseOrderId: string;
  orderNumber: string;
  dueAmount: number;
  totalAmount: number;
  purchaseDate: string;
}

/**
 * Purchase returns summary
 */
export interface PurchaseReturnsSummary {
  totalReturns: number;
  totalRefundAmount: number;
  totalRefundedAmount: number;
  pendingRefunds: number;
  completedReturns: number;
  pendingReturns: number;
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
  price: number;
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
  price: number;
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

// ============================================
// Sale Types (Backend Sale Model)
// ============================================

/**
 * Sale status definitions:
 * - draft: Sale saved but not finalized
 * - partial: Sale has partial payment (due amount > 0)
 * - paid: Sale fully paid (due amount = 0)
 * - cancelled: Sale cancelled
 * - due: Sale has an outstanding due amount
 */
export type SaleStatus = "draft" | "partial" | "paid" | "cancelled" | "due";

export type PaymentMethod = "cash" | "card" | "bank" | "mfs" | "other";

/**
 * Sale item interface - represents an item in a sale
 */
export interface SaleItem {
  productId: string;
  variantId?: string | null;
  inventoryId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  discount: number;
  subtotal: number;
}

/**
 * Customer reference in sale
 */
export interface SaleCustomer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

/**
 * Created by user reference
 */
export interface SaleCreatedBy {
  _id: string;
  firstName: string;
  lastName: string;
}

/**
 * Sale interface - represents a completed sale
 */
export interface Sale extends BaseEntity {
  invoiceNumber: string;
  organizationId: string;
  locationId: string;
  customerId: SaleCustomer;
  items: SaleItem[];
  subtotal: number;
  additionalDiscount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  costPrice: number;
  status: SaleStatus;
  notes?: string;
  createdBy?: SaleCreatedBy;
}

/**
 * Payment account reference
 */
export interface PaymentAccount {
  _id: string;
  name: string;
  type?: string;
}

/**
 * Payment interface - represents a payment for a sale
 */
export interface Payment extends BaseEntity {
  organizationId: string;
  locationId: string;
  type: "sale" | "purchase";
  referenceId: string;
  customerId?: string;
  supplierId?: string;
  accountId: PaymentAccount;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: "completed" | "cancelled";
  createdBy?: SaleCreatedBy;
}

/**
 * DTO for creating/adding a payment
 */
export interface AddPaymentDto {
  amount: number;
  accountId: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

/**
 * Sale query filters
 */
export interface SaleFilters {
  page?: number;
  limit?: number;
  status?: SaleStatus | string;
  customerId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ============================
// Sales Return Types
// ============================

/**
 * Sales return status enum
 */
export type SalesReturnStatus = "pending" | "completed" | "cancelled";

/**
 * Sales return reason enum
 */
export type SalesReturnReason =
  | "damaged"
  | "defective"
  | "wrong_item"
  | "customer_changed_mind"
  | "expired"
  | "other";

/**
 * Sales return item interface
 */
export interface SalesReturnItem {
  productId: string;
  variantId?: string | null;
  inventoryId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  discount?: number;
  refundAmount: number;
  lineTotal: number;
}

/**
 * Sales return interface
 */
export interface SalesReturn extends BaseEntity {
  returnNumber: string;
  organizationId: string;
  locationId: string;
  saleId: string | { _id: string; invoiceNumber: string };
  invoiceNumber: string;
  customerId?: string;
  items: SalesReturnItem[];
  totalRefundAmount: number;
  refundedAmount: number; // Actual cash refunded
  totalCostAmount?: number;
  reason: SalesReturnReason;
  notes?: string;
  status: SalesReturnStatus;
  returnDate: string;
  processedBy?: string;
  refundAllocation?: {
    adjustSaleDue?: number;
    adjustOtherDues?: Array<{
      dueId: string;
      saleId: string;
      amount: number;
    }>;
    accountRefund?: {
      accountId: string;
      amount: number;
      paymentMethod: string;
    };
  };
}

/**
 * Sales return filters for queries
 */
export interface SalesReturnFilters {
  page?: number;
  limit?: number;
  saleId?: string;
  customerId?: string;
  status?: SalesReturnStatus;
  reason?: SalesReturnReason;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Customer pending due from a sale
 */
export interface CustomerPendingDue {
  id: string;
  saleId: string;
  invoiceNumber: string;
  dueAmount: number;
  totalAmount: number;
  saleDate: string;
}
