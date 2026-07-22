import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/api/query-keys";
import {
  locationStockReportApi,
  type LocationStockFilters,
} from "./stock-report-api";

/** Hook for fetching stock summary across all locations */
export const useLocationStockSummary = () => {
  return useQuery({
    queryKey: queryKeys.locationStockReport.summary(),
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
    queryKey: queryKeys.locationStockReport.detail(locationId, filters),
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
    queryKey: queryKeys.locationStockReport.comparison(),
    queryFn: () => locationStockReportApi.getCrossLocationComparison(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
  });
};
