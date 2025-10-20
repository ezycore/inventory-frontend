import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

/**
 * Custom hook for common cache invalidation patterns
 * Provides convenient methods for invalidating related queries
 */
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient()

  return {
    // Invalidate all inventory-related queries
    invalidateInventory: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
    },

    // Invalidate specific inventory item
    invalidateInventoryItem: (id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(id) })
    },

    // Invalidate all supplier-related queries
    invalidateSuppliers: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supplier.all() })
    },

    // Invalidate specific supplier
    invalidateSupplier: (id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.supplier.detail(id) })
    },

    // Invalidate all category-related queries
    invalidateCategories: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.category.all() })
    },

    // Invalidate everything (nuclear option)
    invalidateAll: () => {
      queryClient.invalidateQueries()
    },

    // Remove specific queries from cache
    removeQueries: (keys: any[]) => {
      queryClient.removeQueries({ queryKey: keys })
    },

    // Refetch specific queries
    refetchQueries: (keys: any[]) => {
      queryClient.refetchQueries({ queryKey: keys })
    },

    // Update cache data directly
    setQueryData: (keys: any[], data: any) => {
      queryClient.setQueryData(keys, data)
    },

    // Get cached data
    getQueryData: (keys: any[]) => {
      return queryClient.getQueryData(keys)
    },
  }
}

/**
 * Hook for prefetching data
 * Useful for improving perceived performance
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient()

  return {
    // Prefetch inventory item data
    prefetchInventoryItem: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.inventory.detail(id),
        queryFn: () => fetch(`/api/inventory/${id}`).then(res => res.json()),
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    },

    // Prefetch supplier data
    prefetchSupplier: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.supplier.detail(id),
        queryFn: () => fetch(`/api/suppliers/${id}`).then(res => res.json()),
        staleTime: 10 * 60 * 1000, // 10 minutes
      })
    },

    // Prefetch search results
    prefetchInventorySearch: (query: string) => {
      if (query.length > 2) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.inventory.search(query),
          queryFn: () => fetch(`/api/inventory/search?q=${encodeURIComponent(query)}`).then(res => res.json()),
          staleTime: 2 * 60 * 1000, // 2 minutes
        })
      }
    },

    // Prefetch low stock items
    prefetchLowStock: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.inventory.lowStock(),
        queryFn: () => fetch('/api/inventory/low-stock').then(res => res.json()),
        staleTime: 1 * 60 * 1000, // 1 minute
      })
    },
  }
}
