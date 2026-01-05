import { productsApi } from '@/lib/api-client'
import { createResourceHooks } from './helper'
import { queryKeys } from '@/lib/query-keys-products'
import { Product, CreateProductDto } from '@/types'

const productHooks = createResourceHooks<Product, CreateProductDto>(
  productsApi,
  queryKeys.products
)

export const useProducts = productHooks.useList
export const useProduct = productHooks.useDetail
export const useProductBySlug = productHooks.useBySlug!
export const useCreateProduct = productHooks.useCreate
export const useUpdateProduct = productHooks.useUpdate
export const useDeleteProduct = productHooks.useDelete