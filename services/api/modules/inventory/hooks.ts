// coding-standard: maintained
import { inventoryApi } from '@/services/api'
import { createResourceHooks } from '../query-helpers'
import { invalidate } from '@/services/api/invalidation'
import { queryKeys } from '@/services/api/query-keys'
import { CreateInventoryDto, ReceiveStockDto } from '@/types'
import type { ApiInventory } from '@/types/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/** One row of `POST /inventory/bulk-adjust` — mirrors `bulkAdjustStockSchema`. */
export interface BulkAdjustmentItem {
  productId: string
  variantId?: string | null
  // The location the row was counted at — rejected if it isn't the active one
  // (ADJUST_LOCATION_MISMATCH), so a list built elsewhere can't apply here
  locationId: string
  // What the row held when it was queued. `newQuantity` is absolute, so the backend
  // fails the batch (ADJUST_QUANTITY_STALE) if stock moved since
  expectedQuantity: number
  newQuantity: number
  notes?: string
  // Cost for the added units — used by the backend only when the row has no cost basis yet
  costPrice?: number
  // Expiry-batch capture on an increase of an expiry-tracked product: exactly one of
  // `expiryDate` (opens a new lot) or `batchId` (tops up an existing one)
  expiryDate?: string
  batchNumber?: string
  batchId?: string
  // Which lots a decrease comes out of — must sum to the removed quantity
  batchDraws?: Array<{ batchId: string; quantity: number }>
}

const inventoryHooks = createResourceHooks<ApiInventory, CreateInventoryDto>(
  inventoryApi,
  queryKeys.inventory,
  // Creating an inventory row is opening stock: real stock movement, and it
  // changes which products are "not yet in inventory" in the add-stock picker.
  { events: ["stock.moved"] },
)

export const useInventories = inventoryHooks.useList
export const useInventory = inventoryHooks.useDetail
export const useCreateInventory = inventoryHooks.useCreate
export const useUpdateInventory = inventoryHooks.useUpdate
export const useDeleteInventory = inventoryHooks.useDelete
export const useBulkDeleteInventory = inventoryHooks.useBulkDelete

// Shortlist query hook
export const useInventoryShortlist = (filters: {
  locationId: string;
  productId?: string;
  low_stock_only?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.inventory.shortlist(filters),
    queryFn: () => inventoryApi.getShortlist(filters),
    enabled: !!filters.locationId, // Only fetch if locationId is provided
  })
}

// Analytics queries (read-only) for the product- and inventory-detail pages.
export const useProductAnalytics = (productId: string, variantId?: string) =>
  useQuery({
    queryKey: queryKeys.inventory.productAnalytics(productId, variantId),
    queryFn: () => inventoryApi.getProductAnalytics(productId, variantId),
    enabled: !!productId,
    select: (res) => res.data,
  })

export const useInventoryAnalytics = (inventoryId: string) =>
  useQuery({
    queryKey: queryKeys.inventory.itemAnalytics(inventoryId),
    queryFn: () => inventoryApi.getInventoryAnalytics(inventoryId),
    enabled: !!inventoryId,
    select: (res) => res.data,
  })

// Receive stock mutation hook
export const useReceiveStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReceiveStockDto) => inventoryApi.receiveStock(data),
    onSuccess: () => {
      invalidate(queryClient, "stock.moved")
      toast.success('Stock received successfully')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to receive stock'
      toast.error(message)
    },
  })
}

// Bulk adjustment mutation hook with transaction support
// Only clears Zustand store on successful commit, keeps data on rollback
export const useBulkAdjustStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ adjustments, reason }: { adjustments: BulkAdjustmentItem[]; reason?: string }) =>
      inventoryApi.bulkAdjustStock(adjustments, reason),
    onSuccess: (data) => {
      const result = data?.data
      if (result?.success) {
        toast.success(`Successfully adjusted ${result.total} items`)
        // Transaction committed - safe to clear Zustand store
          invalidate(queryClient, "stock.moved")
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to adjust stock'
      toast.error(message)
      // Transaction rolled back - Zustand store keeps data for retry
    },
  })
}
/** One expired lot, as the expiry report knows it. */
export interface ExpiredBatchWriteOff {
  batchId: string
  productId: string
  variantId?: string | null
  locationId: string
  /** Units left in the lot — the whole of it goes. */
  remainingQuantity: number
  /** On-hand across all lots, from the report row. Guards against a stale view. */
  inventoryQuantity: number
}

/**
 * Write off one expired lot, straight from the expiry report (QA-070).
 *
 * A decrease of exactly that lot's remaining units, which lands in the stock
 * history as `MovementReason.EXPIRY` rather than an anonymous adjustment — the
 * merchant's stock-loss history should say what happened.
 *
 * That reason is **not** set by the `"expiry"` argument below, which the adjust
 * service ignores. It is derived per-draw from the lot itself: `buildDrawMovements`
 * books `EXPIRY` when `draw.isExpired`, `ADJUSTMENT` otherwise
 * (`inventory-adjust.service.ts`). Naming a lot that is genuinely past its date
 * in `batchDraws` is therefore what earns the reason; the string is passed for
 * the movement note only. Don't "fix" a future reason mismatch here.
 *
 * `expectedQuantity` is the on-hand figure the report rendered, so if stock moved
 * since the page loaded the backend refuses the write-off (`ADJUST_QUANTITY_STALE`)
 * instead of applying an absolute `newQuantity` computed from a stale number.
 */
export const useWriteOffExpiredBatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (lot: ExpiredBatchWriteOff) =>
      inventoryApi.bulkAdjustStock(
        [
          {
            productId: lot.productId,
            variantId: lot.variantId ?? null,
            locationId: lot.locationId,
            expectedQuantity: lot.inventoryQuantity,
            newQuantity: Math.max(0, lot.inventoryQuantity - lot.remainingQuantity),
            batchDraws: [{ batchId: lot.batchId, quantity: lot.remainingQuantity }],
          } satisfies BulkAdjustmentItem,
        ],
        "expiry",
      ),
    onSuccess: () => invalidate(queryClient, "stock.moved"),
  })
}

export const useBulkReceiveStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (receipts: any[]) =>
      inventoryApi.bulkReceiveStock(receipts),
    onSuccess: (data) => {
      const result = data?.data
      if (result?.success) {
        toast.success(`Successfully received ${result.total} items`)
        // Transaction committed - safe to clear Zustand store
          invalidate(queryClient, "stock.moved")
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to receive stock'
      toast.error(message)
      // Transaction rolled back - Zustand store keeps data for retry
    },
  })
}

// Sell stock mutation hook
export const useSellStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => inventoryApi.sellStock(data),
    onSuccess: () => {
      invalidate(queryClient, "stock.moved")
      toast.success('Stock sold successfully')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to sell stock'
      toast.error(message)
    },
  })
}

// Bulk sell stock mutation hook with transaction support
export const useBulkSellStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sales: any[]) => inventoryApi.bulkSellStock(sales),
    onSuccess: (data) => {
      const result = data?.data
      if (result?.success) {
        toast.success(`Successfully sold ${result.total} items`)
        invalidate(queryClient, "stock.moved")
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to sell stock'
      toast.error(message)
    },
  })
}

// 🔁 RETURNS & ADJUSTMENTS

// Sales Return (Stock IN) - Customer returns item
export const useReturnSale = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => inventoryApi.returnSale(data),
    onSuccess: () => {
      invalidate(queryClient, "stock.moved")
      toast.success('Sales return processed successfully')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to process sales return'
      toast.error(message)
    },
  })
}

export const useBulkReturnSale = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (returns: any[]) => inventoryApi.bulkReturnSale(returns),
    onSuccess: (data) => {
      const result = data?.data
      if (result?.success) {
        toast.success(`Successfully processed ${result.total} sales returns`)
        invalidate(queryClient, "stock.moved")
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to process sales returns'
      toast.error(message)
    },
  })
}

// Purchase Return (Stock OUT) - Return damaged items to supplier
export const useReturnPurchase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => inventoryApi.returnPurchase(data),
    onSuccess: () => {
      invalidate(queryClient, "stock.moved")
      toast.success('Purchase return processed successfully')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to process purchase return'
      toast.error(message)
    },
  })
}

export const useBulkReturnPurchase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (returns: any[]) => inventoryApi.bulkReturnPurchase(returns),
    onSuccess: (data) => {
      const result = data?.data
      if (result?.success) {
        toast.success(`Successfully processed ${result.total} purchase returns`)
        invalidate(queryClient, "stock.moved")
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to process purchase returns'
      toast.error(message)
    },
  })
}

// 🔄 STOCK TRANSFER (Location → Location)
// Note: Individual useTransferStock is in use-stock-movements.ts
// This file only exports bulk transfer for consistency

export const useBulkTransferStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transfers: any[]) => inventoryApi.bulkTransferStock(transfers),
    onSuccess: (data) => {
      const result = data?.data
      if (result?.success) {
        toast.success(`Successfully transferred ${result.total} items`)
        invalidate(queryClient, "stock.moved")
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to transfer stock'
      toast.error(message)
    },
  })
}

// 📅 EXPIRY TRACKING (FEFO) — requires the expiryTracking feature

// Batches expiring within `days` (default handled server-side)
export const useExpiringBatches = (
  filters: { days?: number; page?: number; limit?: number } = {}
) => {
  return useQuery({
    queryKey: queryKeys.inventory.expiring(filters),
    queryFn: () => inventoryApi.getExpiringBatches(filters),
  })
}

// Batches already past expiry that still hold stock
export const useExpiredBatches = (
  filters: { page?: number; limit?: number } = {}
) => {
  return useQuery({
    queryKey: queryKeys.inventory.expired(filters),
    queryFn: () => inventoryApi.getExpiredBatches(filters),
  })
}

/**
 * Assign an expiry date to part or all of an unknown-expiry lot.
 *
 * Invalidates on `stock.moved` even though no stock moved: the lot list, the
 * expiry reports and the batch pickers all change shape, and they are exactly
 * what that key already covers.
 */
export const useAssignBatchExpiry = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      batchId,
      ...data
    }: {
      batchId: string
      quantity: number
      expiryDate: string
      batchNumber?: string
    }) => inventoryApi.assignBatchExpiry(batchId, data),
    onSuccess: () => invalidate(queryClient, 'stock.moved'),
  })
}

// Per-batch breakdown for a single product
export const useProductBatches = (
  productId: string,
  filters: { variantId?: string } = {},
  options: { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: queryKeys.inventory.productBatches(productId, filters),
    queryFn: () => inventoryApi.getProductBatches(productId, filters),
    enabled: !!productId && (options.enabled ?? true),
  })
}
