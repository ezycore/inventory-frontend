import { warehousesApi } from '@/lib/api-client'
import { createResourceHooks } from './helper'
import { queryKeys } from '@/lib/query-keys'
import { Warehouse, CreateWarehouseDto } from '@/types'

const warehouseHooks = createResourceHooks<Warehouse, CreateWarehouseDto>(
 warehousesApi,
 queryKeys.warehouses
)

export const useWarehouses = warehouseHooks.useList
export const useWarehouse = warehouseHooks.useDetail
export const useCreateWarehouse = warehouseHooks.useCreate
export const useUpdateWarehouse = warehouseHooks.useUpdate
export const useDeleteWarehouse = warehouseHooks.useDelete
