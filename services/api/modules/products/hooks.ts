// coding-standard: maintained
import { productsApi } from '@/services/api'
import { createResourceHooks } from '../query-helpers'
import { queryKeys } from '@/services/api/query-keys'
import { CreateProductDto } from '@/types'
import type { ProductDetail, ProductListItem } from '@/types/api'

const productHooks = createResourceHooks<ProductDetail, CreateProductDto, Partial<CreateProductDto>, ProductListItem>(
  productsApi,
  queryKeys.products,
  // The sellable/purchasable pickers are `/inventory/*` endpoints, so they live
  // under the inventory root — `catalog.changed` carries it.
  { events: ["catalog.changed"] },
)

export const useProductStats = productHooks.useStats
export const useProducts = productHooks.useList
export const useProduct = productHooks.useDetail
export const useProductBySlug = productHooks.useBySlug!
export const useCreateProduct = productHooks.useCreate
export const useUpdateProduct = productHooks.useUpdate
export const useDeleteProduct = productHooks.useDelete
