import { inventoryApi } from '@/services/api'
import { createResourceHooks } from './helper'
import { queryKeys } from '@/lib/query-keys'
import { Inventory, CreateInventoryDto, ReceiveStockDto } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface BulkAdjustmentItem {
  productId: string
  variantId?: string | null
  locationId: string
  newQuantity: number
  notes?: string
}

const inventoryHooks = createResourceHooks<Inventory, CreateInventoryDto>(
  inventoryApi,
  queryKeys.inventory
)

export const useInventories = inventoryHooks.useList
export const useInventory = inventoryHooks.useDetail
export const useCreateInventory = inventoryHooks.useCreate
export const useUpdateInventory = inventoryHooks.useUpdate
export const useDeleteInventory = inventoryHooks.useDelete

// Shortlist query hook
export const useInventoryShortlist = (filters: {
  locationId: string;
  productId?: string;
  low_stock_only?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [...queryKeys.inventory.list(filters), 'shortlist'],
    queryFn: () => inventoryApi.getShortlist(filters),
    enabled: !!filters.locationId, // Only fetch if locationId is provided
  })
}

// Receive stock mutation hook
export const useReceiveStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReceiveStockDto) => inventoryApi.receiveStock(data),
    onSuccess: () => {
      // Invalidate inventory queries to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
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
    mutationFn: (adjustments: BulkAdjustmentItem[]) =>
      inventoryApi.bulkAdjustStock(adjustments),
    onSuccess: (data) => {
      const result = data?.data
      if (result?.success) {
        toast.success(`Successfully adjusted ${result.total} items`)
        // Transaction committed - safe to clear Zustand store
        // Invalidate inventory queries to refetch data
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to adjust stock'
      toast.error(message)
      // Transaction rolled back - Zustand store keeps data for retry
    },
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
        // Invalidate inventory queries to refetch data
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
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
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
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
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
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
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
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
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() })
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to transfer stock'
      toast.error(message)
    },
  })
}