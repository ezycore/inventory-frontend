import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys-products'
import { createResourceHooks, handleMutationSuccess } from './helper'
import type { 
  User,
  CreateUserDto,
  UpdateUserDto,
} from '@/types/users'
import { handleMutationError } from '@/lib/error-handling'

// Create standard CRUD hooks using the factory
const userHooks = createResourceHooks<User, CreateUserDto, UpdateUserDto>(
  usersApi,
  queryKeys.users
)

// Export standard hooks
export const useUsers = userHooks.useList
export const useUser = userHooks.useDetail
export const useCreateUser = userHooks.useCreate //in use
export const useUpdateUser = userHooks.useUpdate //in use
export const useDeleteUser = userHooks.useDelete  //in use

// Custom hook for toggling user status (deactivate/activate) //in use
export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
      handleMutationSuccess(response.message || 'User status updated successfully')
    },
    onError: handleMutationError,
  })
}

/** Get current user's accessible locations (in use) */
export function useMyLocations() {
  return useQuery({
    queryKey: ['users', 'me', 'locations'],
    queryFn: () => usersApi.getMyLocations(),
  })
}

/** Update current user's default location */
export function useUpdateMyDefaultLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (locationId: string) =>
      usersApi.updateMyDefaultLocation(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      handleMutationSuccess('Default location updated successfully')
    },
    onError: handleMutationError,
  })
}
