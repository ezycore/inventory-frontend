import { useQuery } from "@tanstack/react-query";
import {
  locationStockReportApi,
  type LocationStockFilters,
} from "./stock-report-api";

const STOCK_REPORT_KEYS = {
  all: () => ["location-stock-report"] as const,
  summary: () => [...STOCK_REPORT_KEYS.all(), "summary"] as const,
  detail: (locationId: string, filters?: LocationStockFilters) =>
    [...STOCK_REPORT_KEYS.all(), "detail", locationId, filters || {}] as const,
  comparison: () => [...STOCK_REPORT_KEYS.all(), "comparison"] as const,
};

/** Hook for fetching stock summary across all locations */
export const useLocationStockSummary = () => {
  return useQuery({
    queryKey: STOCK_REPORT_KEYS.summary(),
    queryFn: () => locationStockReportApi.getSummary(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};

/** Hook for fetching detailed stock for a specific location */
export const useLocationStockDetail = (
  locationId: string,
  filters?: LocationStockFilters,
) => {
  return useQuery({
    queryKey: STOCK_REPORT_KEYS.detail(locationId, filters),
    queryFn: () =>
      locationStockReportApi.getLocationDetail(locationId, filters),
    select: (data) => data.data,
    enabled: !!locationId,
    staleTime: 2 * 60 * 1000,
  });
};

/** Hook for fetching cross-location comparison */
export const useCrossLocationComparison = () => {
  return useQuery({
    queryKey: STOCK_REPORT_KEYS.comparison(),
    queryFn: () => locationStockReportApi.getCrossLocationComparison(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });
};
