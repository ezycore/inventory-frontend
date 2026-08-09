import type {
  ApiPurchaseOrder,
  ApiTransaction,
  BrandListItem,
  CategoryListItem,
  ApiPurchaseReturn,
  PurchaseTransactions as ApiPurchaseTransactions,
  SaleListItem as ApiSaleListItem,
  SalePayment as ApiSalePayment,
  SaleTransactions as ApiSaleTransactions,
} from "./api";

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

export type NavLinkType = "category" | "page" | "url" | "collections";

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

/**
 * Owner controls for the auto content-pages footer column (published pages
 * flagged "Show in footer"). Absent ⇒ shown with the built-in "Information"
 * heading, so existing stores are unaffected.
 */
export interface StorefrontFooterContentPages {
  /** `false` hides the column entirely; absent/`true` ⇒ shown. */
  show?: boolean;
  /** Heading override; blank ⇒ the built-in localized "Information" label. */
  title?: string;
}

export interface StorefrontAnnouncement {
  enabled: boolean;
  text?: string;
  link?: string;
  bgColor?: string;
  /** Explicit text colour; blank ⇒ auto-derived from bgColor for readability. */
  textColor?: string;
  /** Leading emoji/glyph shown before the text. */
  icon?: string;
  /** When set (with a link), renders an explicit CTA button instead of a bare link. */
  ctaLabel?: string;
  /** Shopper can dismiss the bar (persisted per-device until the message changes). */
  dismissible?: boolean;
  size?: "sm" | "md" | "lg";
  /** Background image (uploadInfo from the storefront image endpoint). */
  bgImage?: Image | null;
  /** Overlay colour painted over the image for text readability. */
  overlay?: string;
  /** Overlay strength, 0–100. */
  overlayOpacity?: number;
  /** cover = photo backdrop; tile = repeating pattern. */
  bgFit?: "cover" | "tile";
}

export interface StorefrontNav {
  header: StorefrontMenuItem[];
  footer: StorefrontFooterGroup[];
  /** Owner controls for the auto content-pages footer column. */
  footerContentPages?: StorefrontFooterContentPages;
  announcement?: StorefrontAnnouncement;
}

export interface StorefrontCheckout {
  requiredFields?: string[];
  minOrderValue?: number;
  orderPrefix?: string;
  termsRequired?: boolean;
  /** Slug of the CMS content page the terms checkbox links to. */
  termsPageSlug?: string;
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
  checkout?: string;
  footer?: string;
  header?: string;
  productCard?: string;
  /**
   * Card CTA layout: "add" | "add-buy" | "icons" | "buy-first" | "reveal" |
   * "icon-only". Independent of `productCard`, which is density only. Unset on
   * stores predating the control — the storefront's `resolveTemplates` derives
   * the fallback from `productCard` so a compact store keeps its inline "+".
   */
  cardActions?: string;
  /** Home hero source: "slides" (carousel when slides exist) | "banner" (static hero). */
  hero?: string;
  /**
   * Header menu source: "collections" (listed categories) | "custom" (nav.header).
   * Unset on stores predating the control — read it via `resolveHeaderMenu`,
   * which reproduces the old implicit behaviour rather than defaulting.
   */
  headerMenu?: string;
  /**
   * Product-listing pagination style: "pages" (numbered) | "infinite" |
   * "load-more". Unset ⇒ "pages", which is what every store rendered before the
   * control shipped.
   */
  pagination?: string;
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
  /** Floating chat launcher (Ecommerce → Customize → WhatsApp button). */
  contactButton?: StorefrontContactButton;
  seo?: { title?: string; description?: string };
  currency?: string;
  shippingRule: StorefrontShippingRule;
  /** Optional Dhaka inside/outside zone rates (override shippingRule when set).
   *  `null` on an update clears them (disables the zone toggle). */
  shippingZones?: { inside?: number; outside?: number; freeThreshold?: number } | null;
  defaultDeliveryCost: number;
  /** In-store pickup option (collect from the fulfillment location). */
  pickup?: { enabled?: boolean; instructions?: string };
  /** Abandoned-cart recovery emails. Off unless the merchant opts in;
   *  `delaysMinutes` is sorted ascending and its length is the send cap. */
  cartRecovery?: { enabled?: boolean; delaysMinutes?: number[] };
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
  /** Static banner-hero copy overrides; unset fields → built-in copy. */
  heroBanner?: StorefrontHeroBanner;
}

/**
 * A chat platform the storefront's contact launcher can open. One member wide
 * today — the launcher ships WhatsApp-only — but `StorefrontOrder.channel`
 * already enumerates messenger/instagram/phone, so adding a platform is a new
 * member here plus a row in `lib/storefront-contact-channels.ts`.
 */
export type ContactChannelKind = "whatsapp";

/** One row in the launcher's channel list. Array order is display order. */
export interface StorefrontContactChannel {
  kind: ContactChannelKind;
  /** Blank means "use the WhatsApp number from Settings → General". */
  value: string;
  label?: string;
  enabled?: boolean;
}

/** Storefront pages the launcher may appear on. */
export type ContactButtonPage =
  | "home"
  | "collection"
  | "product"
  | "cart"
  | "checkout"
  | "order"
  | "page"
  | "account";

/**
 * The floating chat launcher, as the ADMIN edits it. Everything except
 * `channels` is global on purpose — one launcher means one placement, one set of
 * page rules and one greeting.
 */
export interface StorefrontContactButton {
  enabled?: boolean;
  label?: string;
  /** Message template; `{store}` and `{context}` are resolved per page. */
  greeting?: string;
  position?: "right" | "left";
  /** Whitelist. Absent/empty ⇒ every page the launcher supports. */
  showOn?: ContactButtonPage[];
  channels?: StorefrontContactChannel[];
  hours?: {
    enabled?: boolean;
    /** Days the merchant answers, 0 = Sunday. */
    days?: number[];
    /** "HH:mm". */
    from?: string;
    to?: string;
    offlineNote?: string;
  };
  nudge?: { enabled?: boolean; delaySeconds?: number; text?: string };
}

/** One owner-editable footer "trust" badge (Rich footer strip). */
export interface StorefrontTrustBadge {
  text: string;
  icon?: string;
}

/**
 * Owner overrides for the static banner hero's copy (Classic / Hero Split when
 * the hero source is "banner" or no slides exist). Unset fields fall back to
 * the storefront's built-in localized copy; button links default to /products.
 */
export interface StorefrontHeroBanner {
  badge?: string;
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryLink?: string;
  secondaryLabel?: string;
  secondaryLink?: string;
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
 * How the organization is registered for VAT (Bangladesh). Mirrors the backend
 * `VatRegistrationType` — keep the two in step.
 *
 * The distinction the UI must respect is **whether invoices carry per-line VAT
 * at all**: a `turnover_4` taxpayer pays 4% of gross turnover and issues
 * invoices with no VAT line, so it is not "VAT at 4%".
 */
export type VatRegistrationType =
  | "standard_15"
  | "reduced"
  | "turnover_4"
  | "exempt"
  | "unregistered";

/**
 * One dated entry of the registration history. A document's VAT treatment comes
 * from the entry in force on that document's date — never "the current status".
 */
export interface VatRegistrationEntry {
  type: VatRegistrationType;
  effectiveFrom: string;
  changedBy?: string;
  changedAt: string;
}

/** A filed (closed) VAT period — its 9.1 is with the NBR and cannot be re-stated. */
export interface VatPeriod {
  year: number;
  month: number;
  filedAt: string;
  filedBy?: string;
}

/** Admin-configurable VAT settings (distinct from the dated registration status). */
export interface VatSettings {
  bin?: string;
  pricesIncludeVat: boolean;
  filingDayOfMonth: number;
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
  /** Billing period = `intervalCount × interval` (e.g. month × 6). Missing = 1. */
  intervalCount?: number;
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
  gateway?: "stripe" | "sslcommerz" | "paystation" | "manual";
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  pendingPlanChange?: ScheduledPlanChange | null;
  scheduledPlanChange?: ScheduledPlanChange | null;
  scheduledChange?: ScheduledPlanChange | null;
  pendingDowngrade?: ScheduledPlanChange | null;
  pendingPlanSlug?: string;
  pendingPlanName?: string;
  pendingPlanEffectiveAt?: string | null;
  /** Set when an at-period-end cancel is scheduled: access holds until `cancelAt`
   * (= `currentPeriodEnd`), then the workspace is blocked. Cleared on resume. */
  cancelAtPeriodEnd?: boolean;
  cancelAt?: string | null;
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
  /** Today's non-draft sale count — powers the `salesPerDay` meter. */
  salesToday: number;
  /** Today's non-draft purchase count — powers the `purchasePerDay` meter. */
  purchasesToday: number;
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
  /** Billing period = `intervalCount × interval` (e.g. month × 6). Missing = 1. */
  intervalCount?: number;
  amount: number;
  /** Struck-through anchor price — MC only sends it when > `amount`. */
  compareAtAmount?: number;
  /** Limited-time-offer end date (ISO). Display-only. */
  offerEndsAt?: string;
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
 *   - "checkout":  redirect the user to `url` (hosted Stripe / Bangladesh
 *                 collector page)
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

/**
 * Result of POST /api/organization/subscription/cancel (proxied from Mission
 * Control). Discriminated by `mode`:
 *   - "scheduled": at-period-end cancel now standing; access holds until `cancelAt`
 *   - "resumed":   a pending cancel was undone; the plan renews as normal
 *   - "noop":      nothing to change
 */
export type SubscriptionCancelResult =
  | {
      mode: "scheduled";
      planSlug?: string;
      planName?: string;
      cancelAt?: string | null;
    }
  | { mode: "resumed"; planSlug?: string; planName?: string }
  | { mode: "noop" };

// Base interfaces
export interface BaseEntity {
  _id: string;
  // API returns snake_case timestamp fields. Keep union with Date for flexibility.
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * A category list row — the generated backend contract, not a hand-written copy.
 * See the note on `Brand`; the same drift applied here, and it hid a real bug.
 *
 * `CategoryListItem` also carries the `storefront` collection overlay, which the
 * hand-written version omitted entirely.
 */
export type Category = CategoryListItem;

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  images?: Image[];
  status?: "active" | "inactive";
  isDefault?: boolean;
  /** VAT rate prefilled on new products in this category; `null`/"" clears it. */
  defaultTaxId?: string | null;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> { }

// Brand image metadata
export interface Image {
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  publicId: string;
}

/**
 * A brand list row — the generated backend contract, not a hand-written copy.
 *
 * This used to be declared by hand here and drifted from the API: it asserted
 * `isDefault` and `slug` as required when the backend sends them optionally, so
 * a component could read a field the server never sent and still compile. That
 * is exactly how `Category.isDefault` stayed broken (the model declared it
 * inside `storefront`, so it never persisted, yet the local type insisted it was
 * always there).
 *
 * `BrandListItem` carries `productCount`, which the detail shape does not — the
 * brand screens are list screens.
 */
export type Brand = BrandListItem;

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
  /** Outstanding balance (unpaid + partial dues) at the active location. List rows only. */
  totalDue?: number;
  /** How the customer record was created: staff-entered vs self-registered on the storefront. */
  source?: "manual" | "storefront";
  /** Backref to the public Shopper account when source === "storefront". */
  shopperId?: string;
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
  /**
   * Shared by every row of one multi-invoice receipt. Absent on single-invoice
   * payments; the ledger collapses rows that share it into one entry.
   */
  receiptNumber?: string;
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

/** One open invoice a customer-level receipt can settle. */
export interface CustomerOutstandingSale {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  refundCreditApplied?: number;
  dueAmount: number;
  createdAt: string;
  status: "due" | "partial";
}

/** `GET /sales/customers/:id/outstanding` — oldest invoice first. */
export interface CustomerOutstanding {
  sales: CustomerOutstandingSale[];
  totalDue: number;
  creditBalance: number;
}

/** One invoice targeted by a manual (non-FIFO) split. */
export interface CustomerPaymentAllocationInput {
  saleId: string;
  amount: number;
}

/** `POST /sales/customers/:id/payments` — one receipt across many invoices. */
export interface ReceiveCustomerPaymentDto {
  amount: number;
  /** Required unless useCreditBalance is true. */
  accountId?: string;
  paymentMethod?: "cash" | "card" | "bank" | "mfs" | "other";
  useCreditBalance?: boolean;
  /** Default true: the server fills invoices oldest-first. */
  autoAllocate?: boolean;
  /** Required when autoAllocate is false; must add up to `amount`. */
  allocations?: CustomerPaymentAllocationInput[];
  notes?: string;
}

/** What one invoice looked like after the receipt was applied. */
export interface CustomerReceiptAllocation {
  saleId: string;
  invoiceNumber: string;
  amount: number;
  newDueAmount: number;
  newStatus: string;
}

export interface CustomerReceipt {
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  allocations: CustomerReceiptAllocation[];
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
  /** Physical on-hand, holds included — what a stock count would find. */
  quantity: number;
  /** Of that on-hand, the part soft-held for confirmed storefront orders. */
  reservedQuantity?: number;
  /** `quantity − reservedQuantity`: what POS and the storefront will let anyone buy. */
  availableQuantity?: number;
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
  // `balance` and `isDefault` are optional on the wire (the backend `Account` DTO sends them
  // optional) — see the generated `ApiAccount`. Marked optional here so hand-type consumers
  // stay assignable from the real API shape.
  balance?: number;
  accountNumber?: string;
  description?: string;
  isDefault?: boolean;
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

// Transaction interfaces.
//
// Both unions are DERIVED from the generated API types, which come from the backend's
// `src/constants/transaction.ts`. They used to be retyped here and had drifted: this copy
// offered `refund` (which the API rejects) and `investment` (renamed to `capital_in`), and was
// missing `saleRefund` / `purchaseRefund` / `shipping` / `delivery`. Never retype the literals.
export type TransactionType = ApiTransaction["type"];
export type TransactionCategory = ApiTransaction["category"];

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

/**
 * Manual-post bodies. Hand-written versions used to live here typed `category: TransactionCategory`
 * — the **stored** vocabulary, which is wider than what the write endpoints accept — so a
 * settlement default like `"sale"` type-checked and 400'd at runtime. They now come from the
 * generated request schemas; see `CreateIncomeBody` in `types/api.ts`.
 */
export type {
  CreateIncomeBody as CreateIncomeDto,
  CreateExpenseBody as CreateExpenseDto,
  CreateTransferBody as CreateTransferDto,
} from "./api";

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

/** A purchase-order line — generated from the backend purchase DTO. */
export type PurchaseOrderItem = ApiPurchaseOrder["items"][number];

/**
 * A purchase order — generated from the backend purchase DTOs (`ApiPurchaseOrder` is the detail
 * shape; a list row is assignable to it). `supplierId` and `createdBy` are `string | populated |
 * null` on the wire (the `maybeRef` DTO helper) — narrow with `populatedRef` before reading a
 * sub-field. The old ad-hoc `supplier` / `grandTotal` / `paymentStatus` were never sent by the
 * backend; use `supplierId` (populated) and `invoiceAmount` / `totalAmount`.
 */
export type PurchaseOrder = ApiPurchaseOrder;

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

/** One timeline entry — generated from the backend `purchaseTransactionsDto`. */
export type PurchaseTransactionEntry = ApiPurchaseTransactions["transactions"][number];

export type PurchaseTransactionsSummary = ApiPurchaseTransactions["summary"];

export type PurchaseTransactionsResponse = ApiPurchaseTransactions;

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
/** A purchase-return line — generated from the backend `purchaseReturnDto`. */
export type PurchaseReturnItem = ApiPurchaseReturn["items"][number];

/**
 * Purchase return interface
 */
/**
 * A purchase return — generated from the backend `purchaseReturnDto`. `purchaseOrderId`,
 * `supplierId` and `createdBy` are `string | populated | null` on the wire (the `maybeRef` DTO
 * helper) — narrow with `populatedRef` before reading a sub-field. The old ad-hoc `supplier`
 * field was never sent by the backend; use `supplierId` (populated).
 */
export type PurchaseReturn = ApiPurchaseReturn;

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
/** A sale line — generated from the backend `saleItem` DTO (one shape for list + detail). */
export type SaleItem = ApiSaleListItem["items"][number];

/**
 * The populated customer a sale carries — the *object* arm of the wire union
 * (`customerId` is `string | populated | null`; see the backend `maybeRef`).
 */
export type SaleCustomer = Extract<
  NonNullable<ApiSaleListItem["customerId"]>,
  { _id: string }
>;

/** The populated creator a sale carries — the object arm of the wire union. */
export type SaleCreatedBy = Extract<
  NonNullable<ApiSaleListItem["createdBy"]>,
  { _id: string }
>;

/**
 * A sale — generated from the backend sale DTOs. `SaleListItem` (the list row) plus an
 * optional `payments` (present only on the detail read), so one type serves both.
 *
 * NOTE: `customerId` and `createdBy` are `string | populated | null` on the wire — the backend
 * populates them on some reads and returns a bare id on others (`maybeRef`). Narrow with
 * `typeof x === "object"` before reading a sub-field.
 */
export type Sale = ApiSaleListItem & { payments?: ApiSalePayment[] };

/** Payment account ref (populated `name type`) — the object arm of `accountId`. */
export type PaymentAccount = Extract<
  NonNullable<ApiSalePayment["accountId"]>,
  { _id: string }
>;

/** A payment for a sale/purchase — generated from the backend `salePaymentDto`. */
export type Payment = ApiSalePayment;

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

/** One timeline entry — generated from the backend `saleTransactionsDto`. */
export type SaleTransactionEntry = ApiSaleTransactions["transactions"][number];

export type SaleTransactionsSummary = ApiSaleTransactions["summary"];

export type SaleTransactionsResponse = ApiSaleTransactions;

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
