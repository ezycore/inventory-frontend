import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys-products'
import { handleMutationError } from '@/lib/error-handling'
import { stockApi } from '@/lib/api-client'
import type { StockMovement, StockAdjustmentDto } from '@/types/products'

/**
 * Hook for fetching stock movements with optional filters
 */
export const useStockMovements = (filters: Record<string, any> = {}) => {
  return useQuery({
    queryKey: queryKeys.stock.movements(filters),
    queryFn: () => stockApi.getMovements(filters),
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook for fetching stock movements for a specific variant
 */
export const useStockMovementsByVariant = (variantId: string) => {
  return useQuery({
    queryKey: queryKeys.stock.movementsByVariant(variantId),
    queryFn: () => stockApi.getMovementsByVariant(variantId),
    enabled: !!variantId,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook for fetching current stock levels
 */
export const useStockLevels = () => {
  return useQuery({
    queryKey: queryKeys.stock.levels(),
    queryFn: () => stockApi.getStockLevels(),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Mutation hook for adjusting stock (in/out/adjustment)
 */
export const useAdjustStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StockAdjustmentDto) => stockApi.adjustStock(data),
    onSuccess: (_, variables) => {
      // Invalidate stock-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.stock.movementsByVariant(variables.variant_id) 
      })
      
      // Invalidate variant queries to update stock quantity
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.variants.detail(variables.variant_id) 
      })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for transferring stock between locations
 */
export const useTransferStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StockAdjustmentDto & { from_location: string; to_location: string }) => 
      stockApi.transferStock(data),
    onSuccess: (_, variables) => {
      // Invalidate stock-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.stock.movementsByVariant(variables.variant_id) 
      })
      
      // Invalidate variant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.variants.detail(variables.variant_id) 
      })
    },
    onError: handleMutationError,
  })
}

/**
 * Hook for bulk stock adjustments
 */
export const useBulkStockAdjustment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (adjustments: StockAdjustmentDto[]) =>
      Promise.all(adjustments.map(adjustment => stockApi.adjustStock(adjustment))),
    onSuccess: () => {
      // Invalidate all stock and variant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
    },
    onError: handleMutationError,
  })
}