// coding-standard: maintained
/**
 * Generated API response types — the single source of truth for what the backend
 * actually sends.
 *
 * `types/api-generated.ts` is produced by `pnpm gen:api-types` from the backend's
 * OpenAPI spec (`easystock-backend/docs/reference/openapi.json`), which is itself emitted
 * from the tested response DTOs (`easystock-backend/src/dtos`). So a field only exists here
 * if the backend really returns it — and if the backend drops or renames one, adopting these
 * types turns the mismatch into a compile error instead of a silent `undefined` in the browser.
 *
 * Do NOT hand-edit `api-generated.ts`. Re-run `pnpm gen:api-types` after the backend contract
 * changes. This barrel is the only place that maps a backend schema name to a friendly FE name;
 * import response types from here (`@/types/api`), never reach into `api-generated` directly.
 */
import type { components, operations } from "./api-generated";

export type Schemas = components["schemas"];
/** Per-endpoint shapes. Used where a **request** body needs the spec's exact enum, not a hand union. */
export type Operations = operations;

// Envelopes ------------------------------------------------------------------
export type SuccessResponse = Schemas["SuccessResponse"];
export type Deleted = Schemas["Deleted"];
export type DeletedId = Schemas["DeletedId"];
export type BulkOperationResult = Schemas["BulkOperationResult"];
export type ImportResult = Schemas["ImportResult"];

// Products & catalog ---------------------------------------------------------
export type ProductDetail = Schemas["ProductDetail"];
export type ProductListItem = Schemas["ProductListItem"];
export type ProductLookup = Schemas["ProductLookup"];
export type ProductStats = Schemas["ProductStats"];
export type ProductAnalytics = Schemas["ProductAnalytics"];
export type ApiVariant = Schemas["Variant"];
// `GET /variants` returns attribute *templates* (name + values[]), NOT variant instances — the
// instance shape (`ApiVariant`) comes from `/products/:id/variants`.
export type ApiVariantAttribute = Schemas["VariantAttribute"];
export type ApiBrand = Schemas["Brand"];
export type BrandListItem = Schemas["BrandListItem"];
export type ApiCategory = Schemas["Category"];
export type CategoryListItem = Schemas["CategoryListItem"];
/** One node of `GET /categories/tree` — a parent with its `children[]`. */
export type CategoryTreeNode = Schemas["CategoryTreeNode"];
export type ApiTag = Schemas["Tag"];
export type TagListItem = Schemas["TagListItem"];
/** Result of re-pointing a category's products at its default VAT rate. */
export type CategoryApplyTaxResult = Schemas["CategoryApplyTax"];
export type ApiUnit = Schemas["Unit"];
export type ApiTax = Schemas["Tax"];
export type ApiDiscount = Schemas["Discount"];

// Inventory & stock ----------------------------------------------------------
export type ApiInventory = Schemas["Inventory"];
export type InventoryAnalytics = Schemas["InventoryAnalytics"];
export type AdjustableProduct = Schemas["AdjustableProduct"];
export type SellableProduct = Schemas["SellableProduct"];
export type PurchasableProduct = Schemas["PurchasableProduct"];
export type ProductBatch = Schemas["ProductBatch"];
export type StockBatch = Schemas["StockBatch"];
export type ApiStockMovement = Schemas["StockMovement"];

// Sales ----------------------------------------------------------------------
export type SaleDetail = Schemas["SaleDetail"];
export type SaleListItem = Schemas["SaleListItem"];
export type SaleWrite = Schemas["SaleWrite"];
export type SaleDraft = Schemas["SaleDraft"];
export type SalePayment = Schemas["SalePayment"];
export type SaleTransactions = Schemas["SaleTransactions"];
export type SalesReturn = Schemas["SalesReturn"];
export type SalesReturnWrite = Schemas["SalesReturnWrite"];
export type SalesSummary = Schemas["SalesSummary"];

// Purchases ------------------------------------------------------------------
export type ApiPurchaseOrder = Schemas["PurchaseOrder"];
export type PurchaseOrderListItem = Schemas["PurchaseOrderListItem"];
export type PurchaseOrderWrite = Schemas["PurchaseOrderWrite"];
export type PurchasePayment = Schemas["PurchasePayment"];
export type ApiPurchaseReturn = Schemas["PurchaseReturn"];
export type PurchaseTransactions = Schemas["PurchaseTransactions"];

// Parties (customers / suppliers) --------------------------------------------
export type ApiCustomer = Schemas["Customer"];
export type CustomerListItem = Schemas["CustomerListItem"];
export type ApiSupplier = Schemas["Supplier"];
export type SupplierListItem = Schemas["SupplierListItem"];
export type CustomerLedger = Schemas["CustomerLedger"];
export type SupplierLedger = Schemas["SupplierLedger"];

// Accounts & transactions ----------------------------------------------------
export type ApiAccount = Schemas["Account"];
export type ApiTransaction = Schemas["Transaction"];
export type TransactionSummary = Schemas["TransactionSummary"];
export type TransactionStats = Schemas["TransactionStats"];
/** `POST /transactions/transfer` → the paired `{ outTransaction, inTransaction }` documents. */
export type TransactionTransfer = Schemas["TransactionTransfer"];
/**
 * What a ledger line **is** (`classifyTxn` on the backend), as opposed to `type`, which is only the
 * direction cash moved. Derived server-side and sent on every transaction — never re-derive it here.
 */
export type TransactionKind = ApiTransaction["kind"];

/**
 * Manual-post request bodies, taken from the generated **request** schemas rather than hand-written.
 *
 * The category enums here are the narrow manual sets (`capital_in | shipping | adjustment | other`,
 * etc.), not the full stored vocabulary — which is the point: a settlement category like `"sale"`
 * is rejected by the API, and typing these off the spec turns that into a compile error instead of
 * a 400 the user meets after filling in the form.
 */
export type CreateIncomeBody =
  Operations["post_api_transactions_income"]["requestBody"]["content"]["application/json"];
export type CreateExpenseBody =
  Operations["post_api_transactions_expense"]["requestBody"]["content"]["application/json"];
export type CreateTransferBody =
  Operations["post_api_transactions_transfer"]["requestBody"]["content"]["application/json"];

// Dashboard & reports --------------------------------------------------------
export type DashboardOverview = Schemas["DashboardOverview"];
/** Which panels the caller's dashboard is composed of — `GET /dashboard/blocks`. */
export type DashboardBlocks = Schemas["DashboardBlocks"];
export type DashboardStats = Schemas["DashboardStats"];
export type SalesReport = Schemas["SalesReport"];
export type PurchaseReport = Schemas["PurchaseReport"];
export type InventoryReport = Schemas["InventoryReport"];
export type StockValuationReport = Schemas["StockValuationReport"];
export type TaxReport = Schemas["TaxReport"];
export type TaxLedger = Schemas["TaxLedger"];
export type CashReport = Schemas["CashReport"];
export type CapitalReport = Schemas["CapitalReport"];
export type ProfitLossReport = Schemas["ProfitLossReport"];
export type PositionReport = Schemas["PositionReport"];
export type EmployeeReport = Schemas["EmployeeReport"];
export type ComboSalesReport = Schemas["ComboSalesReport"];

// Organization & locations ---------------------------------------------------
export type ApiOrganization = Schemas["Organization"];
export type ApiLocation = Schemas["Location"];
export type ApiOrganizationFeatures = Schemas["OrganizationFeatures"];

// Storefront (admin side) ----------------------------------------------------
export type AdminStorefrontOrder = Schemas["StorefrontOrder"];
export type StorefrontOrderList = Schemas["StorefrontOrderList"];
export type OrderStats = Schemas["OrderStats"];
/**
 * The date presets the order list may ask for, taken from the generated spec
 * rather than retyped.
 *
 * Retyping it as `string` is the failure this prevents: the server 400s an
 * unknown `period` (`INVALID_QUERY_PARAM`), so a preset renamed on the backend
 * would reach a merchant as an empty list with no error on screen. Off the
 * generated enum it is a compile error at `pnpm verify:api-types` instead.
 */
export type OrderListPeriod = NonNullable<
  NonNullable<Operations["get_api_ecommerce_orders"]["parameters"]["query"]>["period"]
>;
export type OrderQuote = Schemas["OrderQuote"];
export type OrderableProduct = Schemas["OrderableProduct"];
export type StorefrontDashboard = Schemas["StorefrontDashboard"];
export type CatalogList = Schemas["CatalogList"];
export type CatalogVariant = Schemas["CatalogVariant"];
export type StorefrontCollection = Schemas["Collection"];
export type CourierList = Schemas["CourierList"];
export type CourierUpsert = Schemas["CourierUpsert"];
export type CourierRemoved = Schemas["CourierRemoved"];
export type CourierTest = Schemas["CourierTest"];
export type CourierStore = Schemas["CourierStore"];
export type CourierPackage = Schemas["CourierPackage"];
export type CourierLocation = Schemas["CourierLocation"];
export type CourierPrice = Schemas["CourierPrice"];
/** What returning an order would move — read, never re-derived, by the return dialog. */
export type OrderReturnPreview = Schemas["OrderReturnPreview"];
export type CourierWebhook = Schemas["CourierWebhook"];
export type CustomCourier = Schemas["CustomCourier"];
export type CustomCourierRemoved = Schemas["CustomCourierRemoved"];

/**
 * Courier remittance — the money a courier collected at the door and pays over days later, net
 * of their charges (backend `docs/plan/cod-remittance.md`).
 *
 * `reconciled`, `residual` and `unrecordedGross` are the server's own reconciliation against the
 * clearing accounts. The client does not have that basis and must never re-derive them.
 */
export type CourierPayout = Schemas["CourierPayout"];
export type CourierPayoutSync = Schemas["CourierPayoutSync"];
export type CourierMoneySummary = Schemas["CourierMoneySummary"];
/** `supported: false` is Steadfast's honest answer — it publishes no charge anywhere. */
export type CourierChargeRefresh = Schemas["CourierChargeRefresh"];
export type FraudScore = Schemas["FraudScore"];
export type ApiStorefrontSettings = Schemas["StorefrontSettings"];
/** Owner-preview credential for an unpublished shop — see `lib/storefront-preview.ts`. */
export type StorefrontPreviewToken = Schemas["StorefrontPreviewToken"];
// Storefront Builder public reads — `GET /storefront/:slug/page` and `/section-data`.
export type StorefrontPublicPage = Schemas["StorefrontPublicPage"];
export type StorefrontSectionData = Schemas["StorefrontSectionData"];

/**
 * Meta Pixel & Conversions API (backend `docs/plan/meta-pixel-capi.md`).
 *
 * `MetaSettings` carries `tokenConfigured`, never the access token — the backend has no schema
 * for it, so there is nothing here to accidentally render into a form value.
 */
export type MetaSettings = Schemas["MetaSettings"];
export type MetaTestResult = Schemas["MetaTest"];
/** The pixel block on the PUBLIC store payload. Absent ⇒ this store has no pixel. */
export type StoreMetaPixel = Schemas["StoreMetaPixel"];
/** `"pending" | "confirmed" | "delivered"` — taken from the spec, never hand-written. */
export type MetaPurchaseTrigger = MetaSettings["purchaseTrigger"];
/** One row of the events log. Carries no `payload` — see the backend DTO. */
export type MetaEventRow = Schemas["MetaEvent"];
export type MetaEventList = Schemas["MetaEventList"];

/** Notification engine (backend docs/plan/notifications.md). */
export type NotificationSettings = Schemas["NotificationSettings"];
export type NotificationEventRow = NotificationSettings["events"][number];
export type NotificationLogItem = Schemas["NotificationLogItem"];
export type SmsTestResult = Schemas["SmsTestResult"];
export type SmsUsageReport = Schemas["SmsUsageReport"];
export type SmsUsageMonth = SmsUsageReport["months"][number];
export type ApiCampaign = Schemas["Campaign"];
export type ApiCoupon = Schemas["Coupon"];
export type ApiContentPage = Schemas["ContentPage"];
/**
 * One uploaded image: `{ url, mediumUrl, thumbnailUrl, publicId, bytes? }`.
 *
 * The generator dedupes identical DTOs and names the result after the first
 * endpoint that used it — hence `HeroSlideImage` for what is really the shared
 * `image` DTO in `src/dtos/common.dto.ts`. The content-image upload returns the
 * same schema. Alias it here so callers are not misled by the generated name.
 */
export type ApiImage = Schemas["HeroSlideImage"];
export type ShopperListItem = Schemas["ShopperListItem"];
export type ShopperDetail = Schemas["ShopperDetail"];
export type ShopperOrder = Schemas["ShopperOrder"];
export type AbandonedCartListItem = Schemas["AbandonedCartListItem"];
export type AbandonedCartStats = Schemas["AbandonedCartStats"];
export type StorefrontSubscriberListItem =
  Schemas["StorefrontSubscriberListItem"];

// Auth & users ---------------------------------------------------------------
export type Me = Schemas["Me"];
export type AuthUser = Schemas["AuthUser"];
export type AdminUser = Schemas["AdminUser"];
export type OrgRole = Schemas["OrgRole"];
export type PermissionCatalog = Schemas["PermissionCatalog"];
export type PermissionCatalogModule = PermissionCatalog["modules"][number];
export type RoleUsage = Schemas["RoleUsage"];
export type RoleDelete = Schemas["RoleDelete"];
export type Login = Schemas["Login"];
export type Signup = Schemas["Signup"];
export type ApiMessage = Schemas["Message"];
export type TwoFactorStatus = Schemas["TwoFactorStatus"];
export type TwoFactorSetup = Schemas["TwoFactorSetup"];
export type TwoFactorVerify = Schemas["TwoFactorVerify"];
export type ApiSubscription = Schemas["Subscription"];
