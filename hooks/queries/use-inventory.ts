import { inventoryApi } from '@/lib/api-client'
import { createResourceHooks } from './helper'
import { queryKeys } from '@/lib/query-keys'
import { Inventory, CreateInventoryDto } from '@/types'
import { useQuery } from '@tanstack/react-query'

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
  location_id: string;
  product_id?: string;
  low_stock_only?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [...queryKeys.inventory.list(filters), 'shortlist'],
    queryFn: () => inventoryApi.getShortlist(filters),
    enabled: !!filters.location_id, // Only fetch if location_id is provided
  })
}
