import { suppliersApi } from '@/services/api'
import { createResourceHooks } from './helper'
import { queryKeys } from '@/lib/query-keys'
import { Supplier, CreateSupplierDto } from '@/types'

const supplierHooks = createResourceHooks<Supplier, CreateSupplierDto>(
 suppliersApi,
 queryKeys.supplier
)

export const useSuppliers = supplierHooks.useList
export const useSupplier = supplierHooks.useDetail
export const useCreateSupplier = supplierHooks.useCreate
export const useUpdateSupplier = supplierHooks.useUpdate
export const useDeleteSupplier = supplierHooks.useDelete
