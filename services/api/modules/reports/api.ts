import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type {
  CashReport,
  ComboSalesReport,
  EmployeeReport,
  InventoryReport,
  PurchaseReport,
  SalesReport,
  StockValuationReport,
  TaxLedger,
  TaxReport,
} from "@/types/api";

// ── Report Period ──
// FE-side vocabulary the period filter/query is built from. The wire `period.key` is a plain
// `string`; this narrows it for the filter UI and query params.
export type ReportPeriod =
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "last6Months"
  | "lastYear"
  | "custom";

// ── Common params ──
export interface ReportParams {
  period: ReportPeriod;
  weekStartDay?: number;
  startDate?: string;
  endDate?: string;
}

// ── Response shapes — generated from the backend report DTOs (`report.dto.ts` → OpenAPI). ──
// Re-exported under the names the report components already import, so a backend contract change
// becomes a compile error here instead of a silent `undefined`.
export type InventoryReportData = InventoryReport;
export type SalesReportData = SalesReport;
export type PurchaseReportData = PurchaseReport;
export type CashReportData = CashReport;
export type StockValuationData = StockValuationReport;
export type EmployeeReportData = EmployeeReport;
export type TaxReportData = TaxReport;
export type TaxLedgerData = TaxLedger;
export type ComboSalesReportData = ComboSalesReport;

// Sub-rows, derived from the generated parents so they cannot drift from them.
export type TaxRateRow = TaxReport["byRate"]["output"][number];
export type TaxChartPoint = TaxReport["chart"][number];
export type TaxLedgerEntry = TaxLedger["items"][number];
export type TaxLedgerKind = TaxLedgerEntry["kind"];
export type ComboSalesRow = ComboSalesReport["combos"][number];

// ── Export Types ──
export type ExportDataType =
  | "sales"
  | "purchases"
  | "inventory"
  | "products"
  | "customers"
  | "suppliers";

// ── Helper ──
function buildReportParams(params?: ReportParams): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  if (params.period) searchParams.set("period", params.period);
  if (params.weekStartDay !== undefined)
    searchParams.set("weekStartDay", String(params.weekStartDay));
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

// ── API Methods ──
export const reportsApi = {
  getInventoryReport: (
    params?: ReportParams,
  ): Promise<ApiResponse<InventoryReportData>> =>
    apiClient.get(`/reports/inventory${buildReportParams(params)}`),

  getSalesReport: (
    params?: ReportParams,
  ): Promise<ApiResponse<SalesReportData>> =>
    apiClient.get(`/reports/sales${buildReportParams(params)}`),

  getComboSalesReport: (
    params?: ReportParams,
  ): Promise<ApiResponse<ComboSalesReportData>> =>
    apiClient.get(`/reports/combos${buildReportParams(params)}`),

  getPurchaseReport: (
    params?: ReportParams,
  ): Promise<ApiResponse<PurchaseReportData>> =>
    apiClient.get(`/reports/purchases${buildReportParams(params)}`),

  getCashReport: (
    params?: ReportParams,
  ): Promise<ApiResponse<CashReportData>> =>
    apiClient.get(`/reports/cash${buildReportParams(params)}`),

  getTaxReport: (
    params?: ReportParams,
  ): Promise<ApiResponse<TaxReportData>> =>
    apiClient.get(`/reports/tax${buildReportParams(params)}`),

  getTaxLedger: (
    params?: ReportParams,
    page = 1,
    limit = 20,
  ): Promise<ApiResponse<TaxLedgerData>> => {
    const qs = buildReportParams(params);
    const sep = qs ? "&" : "?";
    return apiClient.get(
      `/reports/tax/ledger${qs}${sep}page=${page}&limit=${limit}`,
    );
  },

  getStockValuation: (): Promise<ApiResponse<StockValuationData>> =>
    apiClient.get("/reports/valuation"),

  getEmployeeReport: (
    params?: ReportParams,
  ): Promise<ApiResponse<EmployeeReportData>> =>
    apiClient.get(`/reports/employees${buildReportParams(params)}`),

  getExportData: (
    dataType: ExportDataType,
    params?: ReportParams,
  ): Promise<ApiResponse<unknown[]>> => {
    const qs = buildReportParams(params);
    return apiClient.get(
      `/reports/export${qs}${qs ? "&" : "?"}dataType=${dataType}`,
    );
  },
};
