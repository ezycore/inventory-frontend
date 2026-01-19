import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys-products'
import { createResourceHooks, handleMutationSuccess } from './helper'
import type { 
  User,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPermissionsDto, 
  UpdateUserRoleDto,
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
export const useCreateUser = userHooks.useCreate
export const useUpdateUser = userHooks.useUpdate
export const useDeleteUser = userHooks.useDelete

// Custom hook for toggling user status (deactivate/activate)
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
