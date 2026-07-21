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
import type { components } from "./api-generated";

export type Schemas = components["schemas"];

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

// Dashboard & reports --------------------------------------------------------
export type DashboardOverview = Schemas["DashboardOverview"];
export type DashboardStats = Schemas["DashboardStats"];
export type SalesReport = Schemas["SalesReport"];
export type PurchaseReport = Schemas["PurchaseReport"];
export type InventoryReport = Schemas["InventoryReport"];
export type StockValuationReport = Schemas["StockValuationReport"];
export type TaxReport = Schemas["TaxReport"];
export type TaxLedger = Schemas["TaxLedger"];
export type CashReport = Schemas["CashReport"];
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
export type CourierWebhook = Schemas["CourierWebhook"];
export type FraudScore = Schemas["FraudScore"];
export type ApiStorefrontSettings = Schemas["StorefrontSettings"];
export type ApiCampaign = Schemas["Campaign"];
export type ApiCoupon = Schemas["Coupon"];
export type ApiContentPage = Schemas["ContentPage"];
export type ShopperListItem = Schemas["ShopperListItem"];
export type ShopperDetail = Schemas["ShopperDetail"];
export type ShopperOrder = Schemas["ShopperOrder"];

// Auth & users ---------------------------------------------------------------
export type Me = Schemas["Me"];
export type AuthUser = Schemas["AuthUser"];
export type AdminUser = Schemas["AdminUser"];
export type OrgRole = Schemas["OrgRole"];
export type Login = Schemas["Login"];
export type Signup = Schemas["Signup"];
export type ApiMessage = Schemas["Message"];
export type TwoFactorStatus = Schemas["TwoFactorStatus"];
export type TwoFactorSetup = Schemas["TwoFactorSetup"];
export type TwoFactorVerify = Schemas["TwoFactorVerify"];
export type ApiSubscription = Schemas["Subscription"];
