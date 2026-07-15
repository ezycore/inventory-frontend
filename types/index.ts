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
  /** Public ecommerce storefront (catalog, shopper accounts, online orders). Plan-gated. */
  storefront: boolean;
  /** Enable tax management (tax rates, and tax on purchases/sales). */
  tax: boolean;
  /** Enable combo / bundle products (sell several products as one priced unit). */
  combo: boolean;
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
  storefront: true,
  tax: true,
  combo: false,
};

/**
 * Storefront (ecommerce) settings — mirrors the backend StorefrontSettings.
 * Money values are decimal numbers in `currency` (no minor-units).
 */
export type StorefrontPaymentMethod = "cod" | "bank";
export type ShippingRuleMode = "flat" | "free_over_threshold" | "none";

export interface StorefrontShippingRule {
  mode: ShippingRuleMode;
  flatFee?: number;
  freeThreshold?: number;
}

export interface StorefrontTheme {
  preset?: string;
  brandColor?: string;
  accentColor?: string;
  footerText?: string;
  homepageSections?: string[];
}

export type NavLinkType = "category" | "page" | "url";

export interface StorefrontMenuItem {
  label: string;
  type: NavLinkType;
  value: string;
  children?: StorefrontMenuItem[];
}

export interface StorefrontFooterLink {
  label: string;
  url: string;
}

export interface StorefrontFooterGroup {
  title: string;
  links: StorefrontFooterLink[];
}

export interface StorefrontAnnouncement {
  enabled: boolean;
  text?: string;
  link?: string;
  bgColor?: string;
}

export interface StorefrontNav {
  header: StorefrontMenuItem[];
  footer: StorefrontFooterGroup[];
  announcement?: StorefrontAnnouncement;
}

export interface StorefrontCheckout {
  requiredFields?: string[];
  minOrderValue?: number;
  orderPrefix?: string;
  termsRequired?: boolean;
}

export interface StorefrontNotifEvent {
  enabled: boolean;
  template?: string;
}

export interface StorefrontNotifications {
  senderId?: string;
  merchantAlertNumber?: string;
  events?: {
    placed?: StorefrontNotifEvent;
    confirmed?: StorefrontNotifEvent;
    shipped?: StorefrontNotifEvent;
    delivered?: StorefrontNotifEvent;
  };
}

export interface StorefrontTemplates {
  home?: string;
  collection?: string;
  product?: string;
  cart?: string;
  checkout?: string;
  search?: string;
  footer?: string;
  header?: string;
  productCard?: string;
  /** Home hero source: "slides" (carousel when slides exist) | "banner" (static hero). */
  hero?: string;
  /**
   * Header menu source: "collections" (listed categories) | "custom" (nav.header).
   * Unset on stores predating the control — read it via `resolveHeaderMenu`,
   * which reproduces the old implicit behaviour rather than defaulting.
   */
  headerMenu?: string;
}

export interface StorefrontCustomersConfig {
  allowAccounts?: boolean;
}

export interface StorefrontSettings {
  _id?: string;
  organizationId?: string;
  published: boolean;
  displayName?: string;
  logo?: Image | null;
  banner?: Image | null;
  storefrontLocationId?: string;
  allowedPaymentMethods: StorefrontPaymentMethod[];
  contact?: { email?: string; phone?: string; address?: string };
  social?: { facebook?: string; instagram?: string; whatsapp?: string };
  seo?: { title?: string; description?: string };
  currency?: string;
  shippingRule: StorefrontShippingRule;
  /** Optional Dhaka inside/outside zone rates (override shippingRule when set). */
  shippingZones?: { inside?: number; outside?: number; freeThreshold?: number };
  defaultDeliveryCost: number;
  bankInstructions?: string;
  theme?: StorefrontTheme;
  nav?: StorefrontNav;
  checkout?: StorefrontCheckout;
  notifications?: StorefrontNotifications;
  templates?: StorefrontTemplates;
  customersConfig?: StorefrontCustomersConfig;
  trustBadges?: StorefrontTrustBadge[];
  /** Home hero carousel slides; unset/empty → the static built-in hero. */
  heroSlides?: StorefrontHeroSlide[];
}

/** One owner-editable footer "trust" badge (Rich footer strip). */
export interface StorefrontTrustBadge {
  text: string;
  icon?: string;
}

/** One home-page hero slide (owner-managed carousel, max 5). */
export interface StorefrontHeroSlide {
  image?: Image | null;
  badge?: string;
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  link?: string;
}

export type UpdateStorefrontSettingsDto = Partial<
  Omit<StorefrontSettings, "_id" | "organizationId">
>;

/**
 * Feature name type for type-safe feature checks
 */
export type FeatureName = keyof OrganizationFeatures;

/**
 * Financial-year boundary (1-based month/day) used by tax/FY reporting.
 * Defaults to Jul 1 – Jun 30 when unset.
 */
export interface FinancialYearConfig {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

/** Per-area tax sub-toggles, gated under the master `tax` feature flag. */
export interface TaxSettings {
  salesEnabled: boolean;
  purchaseEnabled: boolean;
}

/**
 * Mission Control entitlement snapshot (read-only mirror synced from MC).
 * Powers the billing display. MC is the source of truth.
 */
export interface Entitlement {
  _id: string;
  organizationId: string;
  planSlug?: string;
  planName?: string;
  interval?: "month" | "year" | "one_time";
  amount?: number;
  modules: string[];
  features: Partial<OrganizationFeatures>;
  limits: Record<string, number>;
  status: "active" | "inactive" | "read_only";
  subscriptionStatus?:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete";
  gateway?: "stripe" | "sslcommerz" | "manual";
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  pendingPlanChange?: ScheduledPlanChange | null;
  scheduledPlanChange?: ScheduledPlanChange | null;
  scheduledChange?: ScheduledPlanChange | null;
  pendingDowngrade?: ScheduledPlanChange | null;
  pendingPlanSlug?: string;
  pendingPlanName?: string;
  pendingPlanEffectiveAt?: string | null;
  nextPlanSlug?: string;
  nextPlanName?: string;
  nextPlanEffectiveAt?: string | null;
  downgradeEffectiveAt?: string | null;
  scheduledDowngradeAt?: string | null;
  syncedAt?: string;
}

/** Pending upgrade/downgrade that will apply at the next billing boundary. */
export interface ScheduledPlanChange {
  type?: "upgrade" | "downgrade";
  planSlug: string;
  planName?: string;
  effectiveAt: string;
}

/** Live usage counts returned alongside the entitlement. */
export interface SubscriptionUsage {
  locations: number;
  users: number;
  inventory: number;
}

/** Response of GET /api/organization/subscription. */
export interface SubscriptionInfo {
  entitlement: Entitlement | null;
  usage: SubscriptionUsage;
}

/** A publicly available plan (proxied from Mission Control). */
export interface AvailablePlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  interval: "month" | "year" | "one_time";
  amount: number;
  trialDays?: number;
  modules: string[];
  features: string[];
  limits: Record<string, number>;
}

/** Response of GET /api/organization/plans. */
export interface AvailablePlansInfo {
  plans: AvailablePlan[];
}

/**
 * Result of POST /api/organization/plan-change (proxied from Mission Control).
 * Discriminated by `mode`:
 *   - "checkout":  redirect the user to `url` (hosted Stripe/SSLCommerz page)
 *   - "scheduled": downgrade applied at `effectiveAt` (current period end)
 *   - "activated": free/manual plan applied immediately
 *   - "current":   already on this plan
 */
export type PlanChangeResult =
  | { mode: "checkout"; planSlug: string; planName: string; url: string }
  | {
      mode: "scheduled";
      planSlug: string;
      planName: string;
      effectiveAt: string;
    }
  | { mode: "activated"; planSlug: string; planName: string }
  | { mode: "current"; planSlug: string; planName: string };

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
  images: Image[];
  status: "active" | "inactive";
  isDefault: boolean; // Pre-selected on new product forms
  productCount: number; // For displaying number of products in category
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  images?: Image[];
  status?: "active" | "inactive";
  isDefault?: boolean;
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
  isDefault: boolean; // Pre-selected on new product forms
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
  users: { _id: string; name: string; email: string }[];
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
  isDefault?: boolean;
}

export interface UpdateBrandDto extends Partial<CreateBrandDto> { }

// Customer interfaces
export interface Customer extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
  /** Either a raw id or a populated discount when the response nest-populates it. */
  defaultDiscountId?: string | Discount | null;
  defaultDiscount?: Discount;
  /** Store credit currently available to apply against this customer's dues. */
  creditBalance?: number;
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
  /** REAL CASH RECEIVED — backend computes as Σ(paidAmount − refundedAmount). */
  totalPaid: number;
  /** Σ Sale.refundCreditApplied (due cleared via return credit, no cash). */
  totalRefundCredit?: number;
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
    /** REAL CASH RECEIVED — Σ(paidAmount − refundedAmount). */
    totalPaid: number;
    /** Σ Sale.refundedAmount (cash sent back to customer). */
    totalCashRefunded?: number;
    /** Σ Sale.refundCreditApplied. */
    totalRefundCredit?: number;
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
  pending: {
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
  refundAllocation?: {
    adjustSaleDue?: number;
    adjustOtherDues?: Array<{
      dueId: string;
      saleId: string;
      invoiceNumber: string;
      amount: number;
    }>;
    accountRefund?: {
      accountId: string;
      amount: number;
      paymentMethod: string;
    };
    customerCredit?: {
      amount: number;
    };
  };
}

export interface CustomerLedgerInboundCredit {
  returnId: string;
  returnNumber: string;
  /** The sale the return originated from. */
  sourceSaleId: string;
  sourceInvoiceNumber: string;
  /** Sale in the current page whose due was reduced by this credit. */
  targetSaleId: string;
  targetInvoiceNumber?: string;
  amount: number;
  date: string;
}

export interface CustomerLedger {
  sales: CustomerLedgerSale[];
  payments: CustomerLedgerPayment[];
  returns: CustomerLedgerReturn[];
  /** Cross-invoice rows: other-sale returns that paid down sales in this page via adjustOtherDues. */
  inboundCredits?: CustomerLedgerInboundCredit[];
  /** Customer store-credit balance available to apply. */
  creditBalance?: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** One row in an account statement (customer/supplier). Amount is a magnitude. */
export interface StatementTransaction {
  date: string;
  type: "invoice" | "payment" | "refund" | "return" | "credit";
  reference: string;
  amount: number;
}

/** Account-wide statement summary (shared by customer + supplier). */
export interface StatementSummary {
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
  totalReturned: number;
  creditBalance: number;
}

/** Account-wide customer statement (non-paginated) for printing. */
export interface CustomerStatement {
  customer: { name: string; phone?: string };
  summary: StatementSummary;
  transactions: StatementTransaction[];
  range: { startDate: string | null; endDate: string | null };
}

/** Account-wide supplier statement (non-paginated) for printing. */
export interface SupplierStatement {
  supplier: { name: string; phone?: string };
  summary: StatementSummary;
  transactions: StatementTransaction[];
  range: { startDate: string | null; endDate: string | null };
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

export interface SupplierLedgerInboundCredit {
  returnId: string;
  returnNumber: string;
  /** The purchase order the return originated from. */
  sourcePurchaseOrderId: string;
  sourceOrderNumber: string;
  /** PO in the current page whose due was reduced by this credit. */
  targetPurchaseOrderId: string;
  targetOrderNumber?: string;
  amount: number;
  date: string;
}

export interface SupplierLedger {
  purchaseOrders: SupplierLedgerPurchaseOrder[];
  payments: SupplierLedgerPayment[];
  returns: SupplierLedgerReturn[];
  /** Cross-PO rows: other-PO returns that paid down POs in this page via adjustOtherDues. */
  inboundCredits?: SupplierLedgerInboundCredit[];
  /** Supplier refund-credit balance available to apply. */
  creditBalance?: number;
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
  /** Either a raw id or a populated discount when the response nest-populates it. */
  defaultDiscountId?: string | Discount | null;
  defaultDiscount?: Discount;
  /** Credit accumulated from purchase-return overpayments. Spendable on future POs. */
  creditBalance?: number;
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
  isDefault: boolean; // Pre-selected on new product forms
}

export interface CreateUnitDto {
  name: string;
  shortName?: string;
  category?: UnitCategory;
  status?: "active" | "inactive";
  isDefault?: boolean;
}

export interface UpdateUnitDto extends Partial<CreateUnitDto> { }

// Tax interfaces
export interface Tax extends BaseEntity {
  name: string;
  rate: number;
  type: "percentage" | "fixed";
  status: "active" | "inactive";
  isDefault: boolean; // Pre-selected on new product forms
}

export interface CreateTaxDto {
  name: string;
  rate: number;
  type: "percentage" | "fixed";
  status?: "active" | "inactive";
  isDefault?: boolean;
}

export interface UpdateTaxDto extends Partial<CreateTaxDto> { }

/**
 * Price semantics for a product's tax:
 * - "inclusive": the selling price already contains the tax (tax is backed out for reporting).
 * - "exclusive": tax is added on top of the selling price.
 * Note: distinct from `Tax.type` ("percentage" | "fixed"), which is how the rate is calculated.
 */
export type TaxType = "inclusive" | "exclusive";

/** Product-level tax treatment for one side (purchase or sales). */
export type ProductTaxType = "inclusive" | "exclusive" | "exempt";

export interface ProductTaxConfig {
  /** Reference to the Tax entity that supplies the rate. */
  taxId?: string;
  taxType: ProductTaxType;
  /** Resolved rate (percent) echoed by the backend; 0 when exempt. */
  rate?: number;
  /** Display name of the linked Tax entity, when resolved. */
  taxName?: string;
}

// Discount interfaces
export type DiscountType = "percentage" | "fixed";
export type DiscountApplicableTo = "sales" | "purchase" | "both";

export interface Discount extends BaseEntity {
  name: string;
  value: number;
  type: DiscountType;
  applicableTo: DiscountApplicableTo;
  isDefaultSales: boolean; // Pre-selected on new customer forms
  isDefaultPurchase: boolean; // Pre-selected on new supplier forms
  description?: string;
  status: "active" | "inactive";
}

export interface CreateDiscountDto {
  name: string;
  value: number;
  type: DiscountType;
  applicableTo?: DiscountApplicableTo;
  isDefaultSales?: boolean;
  isDefaultPurchase?: boolean;
  description?: string;
  status?: "active" | "inactive";
}

export interface UpdateDiscountDto extends Partial<CreateDiscountDto> { }

// Inventory interfaces
export interface Inventory extends Product {
  productId: string;
  variantId?: string | null;
  quantity: number;
  quantityAlert: number;
  isLowStock: boolean;
  quantityBreakdown?: {
    enabled?: boolean;
    purchaseUnitQuantity?: number;
    purchaseUnitName?: string;
    remainderQuantity?: number;
    baseUnitName?: string;
    conversionFactor?: number;
    displayText: string;
  }
  // Variable products only: variant attributes promoted to root
  attributes?: Record<string, any> | null;
  costPrice: number;
  price?: number;
  restockStatus?: "normal" | "ordered" | "hidden";
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
  slug: string;
  description?: string;
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

  // Tax — separate purchase vs sales treatment. Rate is normalized on the Tax entity.
  /** Tax applied when the product is sold (backend echoes resolved `rate`). */
  salesTax?: ProductTaxConfig;
  /** Tax applied when the product is purchased. */
  purchaseTax?: ProductTaxConfig;

  // Ecommerce storefront listing (only meaningful when the org `storefront` feature is on)
  storefront?: {
    isListed: boolean;
    onlinePrice?: number;
    featured?: boolean;
    onlineDescription?: string;
  };

  // Combo composition — present only on combo products (productType === "combo").
  comboComponents?: ComboComponent[];
}

/** One component of a combo product (references an existing non-combo product/variant). */
export interface ComboComponent {
  componentProductId: string;
  componentVariantId?: string | null;
  quantity: number;
}

export interface ProductWithVariants extends Product {
  variants?: Variant[];
}

export interface CreateProductDto {
  name: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  images?: string[];
  tags?: string[];
  custom_fields?: CustomField[];
  salesTax?: ProductTaxConfig;
  purchaseTax?: ProductTaxConfig;
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

/**
 * A hostname bound to an organization. Mirrors the backend `OrganizationDomain`
 * (easystock-backend `types/organization.types.ts`); the API serializes dates as
 * ISO strings. Consumed by the domains settings page. See CUSTOM-DOMAINS-P1.md.
 */
export type OrganizationDomainType = "subdomain" | "custom";

export type OrganizationDomainStatus =
  | "pending"
  | "verifying"
  | "verified"
  | "active"
  | "failed";

export type OrganizationDomainSslStatus = "pending" | "issued" | "failed";

export interface OrganizationDomain {
  domain: string;
  type: OrganizationDomainType;
  status: OrganizationDomainStatus;
  isPrimary: boolean;
  verificationToken: string;
  verifiedAt: string | null;
  sslStatus: OrganizationDomainSslStatus;
  createdAt: string;
  updatedAt: string;
}

// Account interfaces
export type AccountType = "cash" | "bank" | "mfs" | "custom";

export interface Account extends BaseEntity {
  name: string;
  type: AccountType;
  balance: number;
  accountNumber?: string;
  description?: string;
  isDefault: boolean;
  isActive?: boolean;
  status?: "active" | "inactive";
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
  | "investment"
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
  // Sum of this line returned across COMPLETED returns (derived by the API on
  // the order-detail read). Used to cap net-returnable in the return UI.
  returnedQuantity?: number;
  price: number;
  costPrice?: number;
  subtotal: number;
  productName?: string;
  conversionFactor?: number;
  purchaseUnitName?: string;
  discount?: number;
  variantName?: string;
  product?: { name: string };
  // Per-line purchase tax snapshot (from the product's purchaseTax at posting time).
  taxRate?: number;
  taxType?: "inclusive" | "exclusive";
  taxAmount?: number;
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
  createdBy?: string | { _id?: string; email?: string; firstName?: string; lastName?: string };
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
  refundCreditApplied?: number;
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
  // Per-line purchase tax (from the product's purchaseTax). Server recomputes.
  taxRate?: number;
  taxType?: "inclusive" | "exclusive";
  conversionFactor?: number;
  purchaseUnitName?: string;
  // Per-line expiry-batch capture for instant purchases (status "received").
  // Only honoured by the backend for expiry-tracked products.
  expiryDate?: string;
  batchNumber?: string;
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
  /** Supplier credit balance to apply at PO creation (mirrors sale.creditBalanceAmount) */
  creditBalanceAmount?: number;
}

// Array of Purchase Orders (for batch creation)
export type CreatePurchaseOrdersDto = CreatePurchaseOrderDto[];

export interface UpdatePurchaseOrderDto extends Partial<CreatePurchaseOrderDto> { }

/** PATCH /purchases/orders/:id body — only allowed when the order is still a draft. */
export interface UpdatePurchaseOrderDraftDto {
  supplierId?: string;
  items?: CreatePurchaseOrderItemDto[];
  additionalDiscount?: number;
  taxTotal?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  notes?: string;
}

/** POST /purchases/orders/:id/finalize body — promotes a draft to a real PO. */
export interface FinalizePurchaseOrderDto {
  supplierId?: string;
  items?: CreatePurchaseOrderItemDto[];
  additionalDiscount?: number;
  taxTotal?: number;
  status?: "received" | "ordered";
  invoiceNumber?: string;
  invoiceDate?: string;
  payment?: PurchasePaymentInfo;
  creditBalanceAmount?: number;
  notes?: string;
}

export interface ReceivePurchaseOrderItemDto {
  productId: string;
  variantId?: string | null;
  inventoryId?: string;
  receivedQuantity: number;
  // Expiry-batch capture (only honoured for expiry-tracked products)
  expiryDate?: string;
  batchNumber?: string;
}

export interface ReceivePurchaseOrderDto {
  items: ReceivePurchaseOrderItemDto[];
  payment?: PurchasePaymentInfo;
}

// Purchase Payment Types
export interface PurchasePaymentInfo {
  accountId: string;
  paidAmount?: number;
}

export interface AddPurchasePaymentDto {
  paymentMethod?: string;
  /** Required unless `useSupplierCredit` is true. */
  accountId?: string;
  amount: number;
  notes?: string;
  /** When true, deduct from supplier.creditBalance instead of charging an account. */
  useSupplierCredit?: boolean;
}

/**
 * Per-purchase-order transaction timeline entry returned by GET /purchases/orders/:id/transactions.
 * Backend merges payments + cash refunds + return credits + cross-PO inbound credits.
 */
export type PurchaseTransactionKind =
  | "payment"
  | "credit_balance_payment"
  | "cash_refund"
  | "credit_applied_self"
  | "credit_applied_from_other";

export interface PurchaseTransactionEntry {
  id: string;
  kind: PurchaseTransactionKind;
  direction: "in" | "out" | "neutral";
  amount: number;
  date: string;
  paymentMethod?: string;
  accountName?: string;
  reference?: {
    kind: "payment" | "purchaseReturn";
    id: string;
    label: string;
  };
  /** Present for `credit_applied_from_other` — the PO whose return generated the credit. */
  sourcePurchase?: { id: string; orderNumber: string };
  notes?: string;
}

export interface PurchaseTransactionsSummary {
  purchaseTotal: number;
  cashPaid: number;
  supplierCreditPaid: number;
  cashRefunded: number;
  refundCreditApplied: number;
  netPaid: number;
  paidAmount: number;
  refundedAmount: number;
  refundCreditAppliedOnOrder: number;
  dueAmount: number;
  status: string;
}

export interface PurchaseTransactionsResponse {
  transactions: PurchaseTransactionEntry[];
  summary: PurchaseTransactionsSummary;
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
  // Tax snapshot (proportional reversal of the original order line; set by the backend).
  taxRate?: number;
  taxType?: TaxType;
  taxAmount?: number;
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
  supplierId?: string | { _id: string; name: string; email?: string; phone?: string };
  items: PurchaseReturnItem[];
  totalRefundAmount: number;
  deductionAmount?: number; // Optional fee withheld from gross refund
  refundedAmount: number;
  taxTotal?: number; // Σ line taxAmount refunded (mirrors PurchaseOrder.taxTotal)
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
    supplierCredit?: {
      amount: number;
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
  refundAmount: number; // Tax-inclusive refund; required by backend (no net fallback)
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
  deductionAmount?: number;
  refundAllocation?: {
    // Adjust the due amount on THIS purchase order
    adjustPurchaseDue?: number;
    // Apply credit to other unpaid purchase orders from the same supplier
    adjustOtherDues?: {
      dueId: string;
      purchaseOrderId: string;
      amount: number;
    }[];
    accountRefund?: {
      accountId: string;
      amount: number;
      paymentMethod: string;
    };
    // Park the remainder as supplier credit balance
    supplierCredit?: {
      amount: number;
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
 * Supplier pending dues + credit balance response
 */
export interface SupplierPendingDuesResponse {
  dues: SupplierPendingDue[];
  totalDue: number;
  count: number;
  creditBalance: number;
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

/** Combo reference line — the server resolves + explodes it (no productId/price). */
export interface ComboOrderItemDto {
  comboProductId: string;
  quantity: number;
  discount?: number;
}

export interface CreateSalesOrderDto {
  customerId?: string | null;
  items: (CreateSalesOrderItemDto | ComboOrderItemDto)[];
  status?: SalesOrderStatus;
  invoiceNumber?: string;
  discountType?: SalesOrderDiscountType;
  discountValue?: number;
  taxTotal?: number;
  notes?: string;
}

export interface UpdateSalesOrderDto extends Partial<CreateSalesOrderDto> { }

// ============================================
// Draft Sale (backend Sale model) DTOs
// ============================================

/** Normal stock line accepted by POST /sales (matches backend CreateSaleDto.items[]). */
export interface SaleItemNormalPayload {
  productId: string;
  variantId?: string | null;
  inventoryId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  discount: number;
  /** Tax rate (percent) for the line; the backend uses it to compute line tax. */
  taxRate?: number;
  /** "inclusive" = price already contains tax; "exclusive" = tax added on top. */
  taxType?: TaxType;
  /** Manual batch override for the line; omit/null = auto FEFO. */
  batchId?: string | null;
}

/** A sale line: either a normal stock line or a combo reference (server explodes it). */
export type SaleItemPayload = SaleItemNormalPayload | ComboOrderItemDto;

/** PATCH /sales/:id body — only allowed when the sale is still a draft. */
export interface UpdateSaleDraftDto {
  customerId?: string;
  items?: SaleItemPayload[];
  additionalDiscount?: number;
  notes?: string;
}

/** POST /sales/:id/finalize body — promotes a draft to a real sale. */
export interface FinalizeSaleDto {
  customerId?: string;
  items?: SaleItemPayload[];
  additionalDiscount?: number;
  payment?: {
    paidAmount: number;
    accountId: string;
    paymentMethod?: "cash" | "card" | "bank" | "mfs" | "other";
  };
  creditBalanceAmount?: number;
  notes?: string;
}

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

export type PaymentMethod = "cash" | "card" | "bank" | "mfs" | "other" | "credit";

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
  /** Tax rate (percent) applied to the line. */
  taxRate?: number;
  taxType?: TaxType;
  /** Computed tax amount for the line (backend). */
  taxAmount?: number;
  /** Combo provenance — set only on lines exploded from a combo. Group by
   *  comboLineId to render them under one combo header. */
  comboId?: string | null;
  comboName?: string;
  comboLineId?: string;
  /** Base units of this component per 1 combo (qtyPer); returns UI converts
   *  combo units ↔ component units with it. Set only on combo lines. */
  comboUnitQuantity?: number;
}

/**
 * Customer reference in sale
 */
export interface SaleCustomer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  /** Populated on the sale-detail endpoint; printed on the invoice when present. */
  address?: string;
  /** Customer store-credit balance (echoed by backend on populate). */
  creditBalance?: number;
  /** Populated default discount (when backend nest-populates defaultDiscountId). */
  defaultDiscountId?: { _id: string; value: number; type: "percentage" | "fixed" } | null;
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
  /** Sum of line tax across the sale (backend-computed). */
  taxTotal?: number;
  /** Grand total payable = subtotal - additionalDiscount + taxTotal (tax-inclusive). */
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  /** Total cash actually refunded to the customer across all returns. */
  refundedAmount?: number;
  /** Total amount of return credit applied to THIS sale's due (self + cross-invoice). */
  refundCreditApplied?: number;
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
  /** Optional — absent for credit-balance payments (paymentMethod === "credit"). */
  accountId?: PaymentAccount;
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
  /** Required unless `useCreditBalance` is true. */
  accountId?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  /** When true, deduct from customer.creditBalance instead of charging an account. */
  useCreditBalance?: boolean;
}

/**
 * Per-sale transaction timeline entry returned by GET /sales/:id/transactions.
 * Backend merges payments + cash refunds + return credits + cross-invoice inbound credits.
 */
export type SaleTransactionKind =
  | "payment"
  | "credit_balance_payment"
  | "cash_refund"
  | "credit_applied_self"
  | "credit_applied_from_other";

export interface SaleTransactionEntry {
  id: string;
  kind: SaleTransactionKind;
  direction: "in" | "out" | "neutral";
  amount: number;
  date: string;
  paymentMethod?: string;
  accountName?: string;
  reference?: {
    kind: "payment" | "salesReturn";
    id: string;
    label: string;
  };
  /** Present for `credit_applied_from_other` — the sale whose return generated the credit. */
  sourceSale?: { id: string; invoiceNumber: string };
  notes?: string;
}

export interface SaleTransactionsSummary {
  saleTotal: number;
  cashPaid: number;
  creditBalancePaid: number;
  cashRefunded: number;
  /** Self + from-other credit applied. */
  refundCreditApplied: number;
  /** cashPaid − cashRefunded — the real money kept. */
  netReceived: number;
  paidAmount: number;
  refundedAmount: number;
  refundCreditAppliedOnSale: number;
  dueAmount: number;
  status: SaleStatus;
}

export interface SaleTransactionsResponse {
  transactions: SaleTransactionEntry[];
  summary: SaleTransactionsSummary;
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
  // Tax snapshot (proportional reversal of the original sale line; set by the backend).
  taxRate?: number;
  taxType?: TaxType;
  taxAmount?: number;
  /** Combo provenance copied from the source sale line (combo lines only). */
  comboId?: string | null;
  comboName?: string;
  comboLineId?: string;
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
  customerId?: string | { _id: string; name: string; phone?: string; email?: string };
  items: SalesReturnItem[];
  totalRefundAmount: number;
  deductionAmount?: number; // Optional fee withheld from gross refund
  refundedAmount: number; // Actual cash refunded
  taxTotal?: number; // Σ line taxAmount refunded (mirrors Sale.taxTotal)
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
      invoiceNumber: string;
      amount: number;
    }>;
    accountRefund?: {
      accountId: string;
      amount: number;
      paymentMethod: string;
    };
    /** Refund amount converted to customer store credit. */
    customerCredit?: {
      amount: number;
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
