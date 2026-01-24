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

// ========================================
// LOCATION MANAGEMENT HOOKS
// ========================================

/** Get user's accessible locations */
export function useUserLocations(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.users.detail(userId), 'locations'],
    queryFn: () => usersApi.getUserLocations(userId),
    enabled: options?.enabled ?? !!userId,
  })
}

/** Get current user's accessible locations (in use) */
export function useMyLocations() {
  return useQuery({
    queryKey: ['users', 'me', 'locations'],
    queryFn: () => usersApi.getMyLocations(),
  })
}

/** Assign locations to a user */
export function useAssignLocations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, locationIds }: { userId: string; locationIds: string[] }) =>
      usersApi.assignLocations(userId, locationIds),
    onSuccess: (response, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      queryClient.invalidateQueries({ queryKey: [...queryKeys.users.detail(userId), 'locations'] })
      handleMutationSuccess('Locations assigned successfully')
    },
    onError: handleMutationError,
  })
}

/** Add a location to a user */
export function useAddLocationToUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, locationId }: { userId: string; locationId: string }) =>
      usersApi.addLocation(userId, locationId),
    onSuccess: (response, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      queryClient.invalidateQueries({ queryKey: [...queryKeys.users.detail(userId), 'locations'] })
      handleMutationSuccess('Location added successfully')
    },
    onError: handleMutationError,
  })
}

/** Remove a location from a user */
export function useRemoveLocationFromUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, locationId }: { userId: string; locationId: string }) =>
      usersApi.removeLocation(userId, locationId),
    onSuccess: (response, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      queryClient.invalidateQueries({ queryKey: [...queryKeys.users.detail(userId), 'locations'] })
      handleMutationSuccess('Location removed successfully')
    },
    onError: handleMutationError,
  })
}

/** Update user's default location */
export function useUpdateDefaultLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, locationId }: { userId: string; locationId: string }) =>
      usersApi.updateDefaultLocation(userId, locationId),
    onSuccess: (response, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      handleMutationSuccess('Default location updated successfully')
    },
    onError: handleMutationError,
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

/** Get users assigned to a specific location */
export function useUsersByLocation(locationId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['users', 'by-location', locationId],
    queryFn: () => usersApi.getUsersByLocation(locationId),
    enabled: options?.enabled ?? !!locationId,
  })
}
