// coding-standard: maintained
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/api/query-keys";
import {
  reportsApi,
  type ReportParams,
  type ExportDataType,
  type SalesBreakdownDimension,
} from "./api";

/** Hook for fetching inventory report */
export const useInventoryReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.inventory(params),
    queryFn: () => reportsApi.getInventoryReport(params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching sales report */
export const useSalesReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.sales(params),
    queryFn: () => reportsApi.getSalesReport(params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching the combo-level sales report (feature-gated on the server). */
export const useComboSalesReport = (params?: ReportParams, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.reports.combos(params),
    queryFn: () => reportsApi.getComboSalesReport(params),
    select: (data) => data.data,
    enabled: !!params && enabled,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Sales per category / brand / tag. Its own query rather than a field on the sales report, so
 * switching the dimension refetches one small aggregate, not the whole page.
 */
export const useSalesBreakdown = (
  dimension: SalesBreakdownDimension,
  params?: ReportParams,
) => {
  return useQuery({
    queryKey: queryKeys.reports.salesBreakdown(dimension, params),
    queryFn: () => reportsApi.getSalesBreakdown(dimension, params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching purchase report */
export const usePurchaseReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.purchases(params),
    queryFn: () => reportsApi.getPurchaseReport(params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching cash report */
export const useCashReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.cash(params),
    queryFn: () => reportsApi.getCashReport(params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Owner capital in/out. Gated on the `accounts` feature at the route, so pass `enabled=false`
 * when the org does not have it.
 */
export const useCapitalReport = (params?: ReportParams, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.reports.capital(params),
    queryFn: () => reportsApi.getCapitalReport(params),
    select: (data) => data.data,
    enabled: enabled && !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Profit & loss. Not feature-gated: revenue and COGS come from sale documents, so an org without
 * the `accounts` module still gets a real gross profit — the response's `basis.expensesTracked`
 * flags that expenses are unavailable.
 */
export const useProfitLossReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.profitLoss(params),
    queryFn: () => reportsApi.getProfitLossReport(params),
    select: (data) => data.data,
    enabled: !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Business position — point-in-time, so it takes no period. Ungated: stock, receivables and
 * payables exist without the `accounts` module; `basis.cashTracked` flags the missing wallets.
 */
export const usePositionReport = () => {
  return useQuery({
    queryKey: queryKeys.reports.position(),
    queryFn: () => reportsApi.getPositionReport(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching tax report (summary + net payable). Pass `enabled=false` when tax is off. */
export const useTaxReport = (params?: ReportParams, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.reports.tax(params),
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
    queryKey: queryKeys.reports.taxLedger(params, page, limit),
    queryFn: () => reportsApi.getTaxLedger(params, page, limit),
    select: (data) => data.data,
    enabled: enabled && !!params,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching stock valuation report */
export const useStockValuation = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.reports.valuation(),
    queryFn: () => reportsApi.getStockValuation(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};

/** Hook for fetching employee report */
export const useEmployeeReport = (params?: ReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.employees(params),
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
    queryKey: queryKeys.reports.export(dataType, params),
    queryFn: () => reportsApi.getExportData(dataType, params),
    select: (data) => data.data,
    enabled: enabled && !!params,
    staleTime: 0, // Always fresh for exports
  });
};
