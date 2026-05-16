import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { dashboardApi, type DashboardOverviewParams } from '@/services/api'

/**
 * Hook for fetching dashboard statistics (basic entity counts)
 * Used by Products and Inventory pages for stock counts
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardApi.getStats(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * Hook for fetching dashboard overview data — period-based
 * Automatically refetches when params change
 */
export const useDashboardOverview = (params?: DashboardOverviewParams) => {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(params),
    queryFn: () => dashboardApi.getOverview(params),
    enabled: !!params, // Don't fetch when params are undefined (e.g. custom without dates)
    staleTime: 2 * 60 * 1000,
    placeholderData: data => data,
    refetchInterval: 5 * 60 * 1000,
  })
}
