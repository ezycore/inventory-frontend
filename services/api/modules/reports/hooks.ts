import { useQuery } from "@tanstack/react-query";
import {
  reportsApi,
  type ReportParams,
  type ExportDataType,
} from "./api";

const REPORT_KEYS = {
  all: () => ["reports"] as const,
  inventory: (params?: ReportParams) =>
    [...REPORT_KEYS.all(), "inventory", params || {}] as const,
  sales: (params?: ReportParams) =>
    [...REPORT_KEYS.all(), "sales", params || {}] as const,
  combos: (params?: ReportParams) =>
    [...REPORT_KEYS.all(), "combos", params || {}] as const,
  comboActivity: (comboProductId: string, params?: ReportParams) =>
    [...REPORT_KEYS.all(), "combo-activity", comboProductId, params || {}] as const,
  purchases: (params?: ReportParams) =>
    [...REPORT_KEYS.all(), "purchases", params || {}] as const,
  cash: (params?: ReportParams) =>
    [...REPORT_KEYS.all(), "cash", params || {}] as const,
  tax: (params?: ReportParams) =>
    [...REPORT_KEYS.all(), "tax", params || {}] as const,
  taxLedger: (params?: ReportParams, page = 1, limit = 20) =>
    [...REPORT_KEYS.all(), "tax-ledger", params || {}, page, limit] as const,
  valuation: () => [...REPORT_KEYS.all(), "valuation"] as const,
  employees: (params?: ReportParams) =>
    [...REPORT_KEYS.all(), "employees", params || {}] as const,
  export: (dataType: ExportDataType, params?: ReportParams) =>
    [...REPORT_KEYS.all(), "export", dataType, params || {}] as const,
};

export { REPORT_KEYS };

/** Hook for fetching inventory report */
export const useInventoryReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: REPORT_KEYS.inventory(params),
    queryFn: () => reportsApi.getInventoryReport(params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching sales report */
export const useSalesReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: REPORT_KEYS.sales(params),
    queryFn: () => reportsApi.getSalesReport(params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching the combo-level sales report (feature-gated on the server). */
export const useComboSalesReport = (params?: ReportParams, enabled = true) => {
  return useQuery({
    queryKey: REPORT_KEYS.combos(params),
    queryFn: () => reportsApi.getComboSalesReport(params),
    select: (data) => data.data,
    enabled: !!params && enabled,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for one combo's sales activity (recent sales + trend + returns). */
export const useComboSalesActivity = (
  comboProductId: string,
  params?: ReportParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: REPORT_KEYS.comboActivity(comboProductId, params),
    queryFn: () => reportsApi.getComboSalesActivity(comboProductId, params),
    select: (data) => data.data,
    enabled: enabled && !!comboProductId && !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching purchase report */
export const usePurchaseReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: REPORT_KEYS.purchases(params),
    queryFn: () => reportsApi.getPurchaseReport(params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching cash report */
export const useCashReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: REPORT_KEYS.cash(params),
    queryFn: () => reportsApi.getCashReport(params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching tax report (summary + net payable). Pass `enabled=false` when tax is off. */
export const useTaxReport = (params?: ReportParams, enabled = true) => {
  return useQuery({
    queryKey: REPORT_KEYS.tax(params),
    queryFn: () => reportsApi.getTaxReport(params),
    select: (data) => data.data,
    enabled: enabled && !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching the paginated tax ledger. Pass `enabled=false` when tax is off. */
export const useTaxLedger = (
  params?: ReportParams,
  page = 1,
  limit = 20,
  enabled = true,
) => {
  return useQuery({
    queryKey: REPORT_KEYS.taxLedger(params, page, limit),
    queryFn: () => reportsApi.getTaxLedger(params, page, limit),
    select: (data) => data.data,
    enabled: enabled && !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching stock valuation report */
export const useStockValuation = () => {
  return useQuery({
    queryKey: REPORT_KEYS.valuation(),
    queryFn: () => reportsApi.getStockValuation(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching employee report */
export const useEmployeeReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: REPORT_KEYS.employees(params),
    queryFn: () => reportsApi.getEmployeeReport(params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching export data */
export const useExportData = (
  dataType: ExportDataType,
  params?: ReportParams,
  enabled = false,
) => {
  return useQuery({
    queryKey: REPORT_KEYS.export(dataType, params),
    queryFn: () => reportsApi.getExportData(dataType, params),
    select: (data) => data.data,
    enabled: enabled && !!params,
    staleTime: 0, // Always fresh for exports
  });
};
