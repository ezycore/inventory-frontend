import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockMovementsApi, stockApi } from "@/services/api";
import type { StockMovementPeriod } from "@/services/api/modules/stock/api";
import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import { handleMutationError } from '@/lib/error-handling'
import type { StockAdjustmentDto } from '@/types/products'

/**
 * Stock Movements & Mutations
 * Combines audit trail queries with stock adjustment operations
 */

// ========== QUERIES (Audit Trail) ==========

export const useStockMovements = (filters: {
 productId?: string;
 variantId?: string;
 locationId?: string;
 reason?: string;
 movementType?: string;
 period?: StockMovementPeriod;
 startDate?: string;
 endDate?: string;
 page?: number;
 limit?: number;
} = {}) => {
 return useQuery({
  queryKey: queryKeys.stockMovements.list(filters),
  queryFn: () => stockMovementsApi.getAll(filters),
 });
};

export const useStockMovementStats = (filters: {
  productId?: string;
  variantId?: string;
  locationId?: string;
  reason?: string;
  movementType?: string;
  period?: StockMovementPeriod;
  startDate?: string;
  endDate?: string;
} = {}) => {
  return useQuery({
    queryKey: queryKeys.stockMovements.stats(filters),
    queryFn: () => stockMovementsApi.getStats(filters),
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
  queryKey: queryKeys.stock.levels(),
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
   invalidate(queryClient, "stock.moved")
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
   invalidate(queryClient, "stock.moved")
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
   invalidate(queryClient, "stock.moved")
  },
  onError: handleMutationError,
 })
}
