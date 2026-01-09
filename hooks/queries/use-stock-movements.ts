import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockMovementsApi, stockApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { handleMutationError } from '@/lib/error-handling'
import type { StockAdjustmentDto } from '@/types/products'

/**
 * Stock Movements & Mutations
 * Combines audit trail queries with stock adjustment operations
 */

// ========== QUERIES (Audit Trail) ==========

export const useStockMovements = (filters: {
 product_id?: string;
 variant_id?: string;
 location_id?: string;
 reason?: string;
 movement_type?: string;
 start_date?: string;
 end_date?: string;
 page?: number;
 limit?: number;
} = {}) => {
 return useQuery({
  queryKey: queryKeys.stockMovements.list(filters),
  queryFn: () => stockMovementsApi.getAll(filters),
 });
};

export const useInventoryHistory = (
 productId: string,
 locationId: string,
 variantId?: string
) => {
 return useQuery({
  queryKey: queryKeys.stockMovements.inventoryHistory(productId, locationId, variantId),
  queryFn: () => stockMovementsApi.getInventoryHistory(productId, locationId, variantId),
  enabled: !!productId && !!locationId,
 });
};

export const useStockLevels = () => {
 return useQuery({
  queryKey: queryKeys.stock?.levels() || ['stock', 'levels'],
  queryFn: () => stockApi.getStockLevels(),
  staleTime: 1 * 60 * 1000, // 1 minute
 });
};

// ========== MUTATIONS (Stock Operations) ==========

/**
 * Mutation hook for adjusting stock (in/out/adjustment)
 */
export const useAdjustStock = () => {
 const queryClient = useQueryClient()

 return useMutation({
  mutationFn: (data: StockAdjustmentDto) => stockApi.adjustStock(data),
  onSuccess: (_, variables) => {
   // Invalidate stock-related queries
   queryClient.invalidateQueries({ queryKey: ['stock'] })
   queryClient.invalidateQueries({ queryKey: ['stockMovements'] })
   
   // Invalidate variant queries to update stock quantity
   queryClient.invalidateQueries({ queryKey: ['variants'] })
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
  onSuccess: () => {
   // Invalidate all stock-related queries
   queryClient.invalidateQueries({ queryKey: ['stock'] })
   queryClient.invalidateQueries({ queryKey: ['stockMovements'] })
   queryClient.invalidateQueries({ queryKey: ['variants'] })
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
   queryClient.invalidateQueries({ queryKey: ['stock'] })
   queryClient.invalidateQueries({ queryKey: ['stockMovements'] })
   queryClient.invalidateQueries({ queryKey: ['variants'] })
  },
  onError: handleMutationError,
 })
}
