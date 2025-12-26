import { inventoryApi } from '@/lib/api-client'
import { createResourceHooks } from './helper'
import { queryKeys } from '@/lib/query-keys'
import { Inventory, CreateInventoryDto } from '@/types'

const inventoryHooks = createResourceHooks<Inventory, CreateInventoryDto>(
 inventoryApi,
 queryKeys.inventory
)

export const useInventories = inventoryHooks.useList
export const useInventory = inventoryHooks.useDetail
export const useCreateInventory = inventoryHooks.useCreate
export const useUpdateInventory = inventoryHooks.useUpdate
export const useDeleteInventory = inventoryHooks.useDelete
