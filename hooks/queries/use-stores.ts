import { storesApi } from '@/lib/api-client'
import { createResourceHooks } from './helper'
import { queryKeys } from '@/lib/query-keys'
import { Store, CreateStoreDto } from '@/types'

const storeHooks = createResourceHooks<Store, CreateStoreDto>(
 storesApi,
 queryKeys.stores
)

export const useStores = storeHooks.useList
export const useStore = storeHooks.useDetail
export const useCreateStore = storeHooks.useCreate
export const useUpdateStore = storeHooks.useUpdate
export const useDeleteStore = storeHooks.useDelete
