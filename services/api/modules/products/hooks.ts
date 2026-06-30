// coding-standard: maintained
import { productsApi } from '@/services/api'
import { createResourceHooks } from '../query-helpers'
import { queryKeys } from '@/lib/query-keys'
import { Product, CreateProductDto } from '@/types'

const productHooks = createResourceHooks<Product, CreateProductDto>(
  productsApi,
  queryKeys.products,
  { relatedQueryKeys: [
    [ "select-options", "/products?all=true&inventory=false&fields=_id,name,unitId,productType,hasExpiry"],
  ] },
)

export const useProductStats = productHooks.useStats
export const useProducts = productHooks.useList
export const useProduct = productHooks.useDetail
export const useProductBySlug = productHooks.useBySlug!
export const useCreateProduct = productHooks.useCreate
export const useUpdateProduct = productHooks.useUpdate
export const useDeleteProduct = productHooks.useDelete
