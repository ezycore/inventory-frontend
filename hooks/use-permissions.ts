import { useAuthStore } from '@/stores/use-auth-store'
import type { Permission } from '@/types/users'
import { MODULES, PermissionUtils } from '@/constants/permissions'

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user)
  const userPermissions = user?.permissions || []
  const isAdmin = user?.role === 'admin'

  return {
    /**
     * Check if user has a specific permission
     * Admins always have all permissions
     */
    can: (permission: Permission): boolean => {
      if (isAdmin) return true
      return PermissionUtils.hasPermission(userPermissions, permission)
    },

    /**
     * Check if user has any of the specified permissions
     */
    canAny: (permissions: Permission[]): boolean => {
      if (isAdmin) return true
      return PermissionUtils.hasAnyPermission(userPermissions, permissions)
    },

    /**
     * Check if user has all of the specified permissions
     */
    canAll: (permissions: Permission[]): boolean => {
      if (isAdmin) return true
      return PermissionUtils.hasAllPermissions(userPermissions, permissions)
    },

    /**
     * Get permissions for a specific module
     */
    getModulePermissions: (module: keyof typeof MODULES) => {
      if (isAdmin) {
        return {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canManage: true,
        }
      }
      return PermissionUtils.getModulePermissions(userPermissions, module)
    },

    /**
     * Check if user is admin
     */
    isAdmin,

    /**
     * Get all user permissions
     */
    permissions: userPermissions,
  }
}

/**
 * Hook to get permissions for a specific module
 */
export function useModulePermissions(module: keyof typeof MODULES) {
  const { getModulePermissions } = usePermissions()
  return getModulePermissions(module)
}
