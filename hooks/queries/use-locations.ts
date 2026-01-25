import { locationsApi } from '@/lib/api'
import { createResourceHooks } from './helper'
import { queryKeys } from '@/lib/query-keys'
import { Location, CreateLocationDto } from '@/types'

const locationHooks = createResourceHooks<Location, CreateLocationDto>(
 locationsApi,
 queryKeys.locations
)

export const useLocations = locationHooks.useList
export const useCreateLocation = locationHooks.useCreate
export const useUpdateLocation = locationHooks.useUpdate
export const useDeleteLocation = locationHooks.useDelete
