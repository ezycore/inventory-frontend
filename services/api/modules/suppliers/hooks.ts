import { suppliersApi } from '@/services/api'
import { createResourceHooks } from '../query-helpers'
import { queryKeys } from '@/services/api/query-keys'
import { Supplier, CreateSupplierDto } from '@/types'

const supplierHooks = createResourceHooks<Supplier, CreateSupplierDto>(
 suppliersApi,
 queryKeys.suppliers
)

export const useSuppliers = supplierHooks.useList
export const useSupplier = supplierHooks.useDetail
export const useCreateSupplier = supplierHooks.useCreate
export const useUpdateSupplier = supplierHooks.useUpdate
export const useDeleteSupplier = supplierHooks.useDelete
