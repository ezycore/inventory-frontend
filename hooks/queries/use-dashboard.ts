import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys-products'
import { dashboardApi } from '@/lib/api'
import { useAuthStore } from '@/stores/use-auth-store'

/**
 * Hook for fetching dashboard statistics
 */
export const useDashboardStats = () => {
  const { accessToken, _hasHydrated } = useAuthStore();
  
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardApi.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Only run query when we have a token and store is hydrated
    enabled: !!accessToken && _hasHydrated,
    refetchInterval: (query) => {
      // Only refetch if query succeeded, stop refetching on error
      return query.state.status === 'success' ? 5 * 60 * 1000 : false
    },
  })
}