import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import type { 
  RegisterUserDto, 
  UpdateUserPermissionsDto, 
  UpdateUserRoleDto,
  RegisterUserResponse 
} from '@/types/users'
import { toast } from 'sonner'

// Query Keys
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: () => [...usersKeys.lists()] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  permissions: () => [...usersKeys.all, 'permissions'] as const,
}

// Queries
export function useUsers() {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: async () => {
      const response = await usersApi.getAll()
      return response.data
    },
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: async () => {
      const response = await usersApi.getById(id)
      return response.data
    },
    enabled: !!id,
  })
}

// Mutations
export function useRegisterUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterUserDto) => usersApi.register(data),
    onSuccess: (response: RegisterUserResponse) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
      toast.success(response.message || 'User registered successfully')
      
      // Show temporary password in development
      if (response.data.temporaryPassword) {
        toast.info(`Temporary Password: ${response.data.temporaryPassword}`, {
          duration: 10000,
        })
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to register user')
    },
  })
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: UpdateUserPermissionsDto }) => 
      usersApi.updatePermissions(id, permissions),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(variables.id) })
      toast.success('User permissions updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update permissions')
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UpdateUserRoleDto }) => 
      usersApi.updateRole(id, role),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(variables.id) })
      toast.success('User role updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update role')
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) })
      toast.success('User status updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user status')
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user')
    },
  })
}
