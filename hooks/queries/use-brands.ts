import { brandsApi } from '@/lib/api-client'
import { createResourceHooks } from './helper'
import { queryKeys } from '@/lib/query-keys-products'
import { Brand, CreateBrandDto } from '@/types'

const brandHooks = createResourceHooks<Brand, CreateBrandDto>(
  brandsApi,
  queryKeys.brands
)

export const useBrands = brandHooks.useList
export const useBrand = brandHooks.useDetail
export const useBrandBySlug = brandHooks.useBySlug!
export const useCreateBrand = brandHooks.useCreate
export const useUpdateBrand = brandHooks.useUpdate
export const useDeleteBrand = brandHooks.useDelete
