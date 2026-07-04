import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

// ── Report Period ──
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

// ── Inventory Report Types ──
export interface InventoryReportData {
  summary: {
    totalProducts: number;
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  categoryBreakdown: Array<{
    categoryId: string | null;
    categoryName: string;
    totalQuantity: number;
    totalValue: number;
    productCount: number;
  }>;
  stockStatusBreakdown: Array<{
    status: string;
    count: number;
    totalQuantity: number;
    totalValue: number;
  }>;
}

// ── Sales Report Types ──
export interface SalesReportData {
  period: {
    key: ReportPeriod;
    startDate: string;
    endDate: string;
    chartGrouping: "hourly" | "daily" | "weekly" | "monthly";
  };
  summary: {
    totalSales: number;
    totalPaid: number;
    totalDue: number;
    totalCost: number;
    grossProfit: number;
    count: number;
    totalItems: number;
    previousTotal: number;
    previousCount: number;
  };
  chartData: Array<{ label: string; total: number; count: number }>;
  topProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    totalCost: number;
    profit: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    total: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSpent: number;
    totalDue: number;
    orderCount: number;
  }>;
}

// ── Purchase Report Types ──
export interface PurchaseReportData {
  period: {
    key: ReportPeriod;
    startDate: string;
    endDate: string;
    chartGrouping: "hourly" | "daily" | "weekly" | "monthly";
  };
  summary: {
    totalPurchases: number;
    totalPaid: number;
    totalDue: number;
    count: number;
    totalItems: number;
    previousTotal: number;
    previousCount: number;
  };
  chartData: Array<{ label: string; total: number; count: number }>;
  topProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalCost: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    total: number;
  }>;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    totalAmount: number;
    totalDue: number;
    orderCount: number;
  }>;
}

// ── Tax Report Types ──
export interface TaxRateRow {
  taxRate: number;
  taxType: "inclusive" | "exclusive";
  taxableBase: number;
  taxAmount: number;
}

export interface TaxChartPoint {
  label: string;
  output: number;
  input: number;
}

export interface TaxReportData {
  period: { period: ReportPeriod; startDate: string; endDate: string };
  /** Tax collected on sales, less tax refunded on sales returns. */
  output: { collected: number; refunded: number; net: number };
  /** Tax paid on purchases, less tax reclaimed on purchase returns. */
  input: { paid: number; reclaimed: number; net: number };
  /** output.net − input.net (positive = payable, negative = reclaimable credit). */
  netPayable: number;
  /** Per-rate breakdown of posted sales (output) and purchases (input). Gross. */
  byRate: { output: TaxRateRow[]; input: TaxRateRow[] };
  /** Gross tax collected (output) vs paid (input) per time bucket. */
  chart: TaxChartPoint[];
}

export type TaxLedgerKind =
  | "sale"
  | "sales_return"
  | "purchase"
  | "purchase_return";

export interface TaxLedgerEntry {
  date: string;
  kind: TaxLedgerKind;
  reference: string;
  direction: "output" | "input";
  isReturn: boolean;
  taxAmount: number;
}

export interface TaxLedgerData {
  items: TaxLedgerEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── Cash Report Types ──
export interface CashReportData {
  period: {
    key: ReportPeriod;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalBalance: number;
    accountCount: number;
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
    incomeCount: number;
    expenseCount: number;
    previousIncome: number;
    previousExpense: number;
  };
  categoryBreakdown: Array<{
    type: string;
    category: string;
    total: number;
    count: number;
  }>;
  accountBreakdown: Array<{
    accountId: string;
    accountName: string;
    accountType: string;
    balance: number;
    income: number;
    expense: number;
    count: number;
  }>;
}

// ── Stock Valuation Types ──
export interface StockValuationData {
  summary: {
    totalQuantity: number;
    totalCostValue: number;
    totalProducts: number;
    averageCostPrice: number;
  };
  categoryValuation: Array<{
    categoryId: string | null;
    categoryName: string;
    totalQuantity: number;
    totalValue: number;
    productCount: number;
  }>;
  topValueProducts: Array<{
    productName: string;
    variantName: string | null;
    quantity: number;
    costPrice: number;
    stockValue: number;
  }>;
}

// ── Employee Report Types ──
export interface EmployeeReportData {
  period: {
    key: ReportPeriod;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    totalSales: number;
    totalPurchases: number;
  };
  employees: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    sales: {
      totalAmount: number;
      profit: number;
      count: number;
      itemsSold: number;
    };
    purchases: {
      totalAmount: number;
      count: number;
    };
  }>;
}

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

/** One combo product's sales rollup (combo-level; see backend getComboSalesReport). */
export interface ComboSalesRow {
  comboId: string;
  comboName?: string;
  unitsSold: number;
  revenue: number;
  orders: number;
}

export interface ComboSalesReportData {
  combos: ComboSalesRow[];
  dateRange: { startDate: string; endDate: string };
}

/** One recent sale transaction of a combo (combo detail page). */
export interface ComboRecentSale {
  saleId: string;
  invoiceNumber?: string;
  date: string;
  combos: number;
  amount: number;
}

/** Per-combo sales activity: recent transactions, daily trend, returns totals. */
export interface ComboSalesActivity {
  recentSales: ComboRecentSale[];
  trend: { date: string; combos: number; revenue: number }[];
  returns: { combosReturned: number; refundTotal: number };
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

  getComboSalesActivity: (
    comboProductId: string,
    params?: ReportParams,
  ): Promise<ApiResponse<ComboSalesActivity>> =>
    apiClient.get(
      `/reports/combos/${comboProductId}/activity${buildReportParams(params)}`,
    ),

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
  ): Promise<ApiResponse<any[]>> => {
    const qs = buildReportParams(params);
    const sep = qs ? "&" : "?";
    return apiClient.get(
      `/reports/export${qs}${qs ? "&" : "?"}dataType=${dataType}`,
    );
  },
};
