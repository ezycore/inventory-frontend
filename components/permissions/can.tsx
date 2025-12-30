'use client'

import { usePermissions } from '@/hooks/use-permissions'
import type { Permission } from '@/types/users'
import type { ReactNode } from 'react'

interface CanProps {
  /**
   * Single permission or array of permissions to check
   */
  permission?: Permission | Permission[]
  
  /**
   * If true, user needs ALL permissions. If false, user needs ANY permission
   */
  requireAll?: boolean
  
  /**
   * Content to render if user has permission
   */
  children: ReactNode
  
  /**
   * Optional fallback content if user doesn't have permission
   */
  fallback?: ReactNode
}

/**
 * Component to conditionally render content based on user permissions
 * 
 * @example
 * // Single permission
 * <Can permission="products.create">
 *   <CreateButton />
 * </Can>
 * 
 * @example
 * // Multiple permissions (any)
 * <Can permission={['products.create', 'products.edit']}>
 *   <EditButton />
 * </Can>
 * 
 * @example
 * // Multiple permissions (all required)
 * <Can permission={['products.create', 'products.edit']} requireAll>
 *   <AdvancedButton />
 * </Can>
 * 
 * @example
 * // With fallback
 * <Can permission="products.delete" fallback={<p>No access</p>}>
 *   <DeleteButton />
 * </Can>
 */
export function Can({ permission, requireAll = false, children, fallback = null }: CanProps) {
  const { can, canAny, canAll, isAdmin } = usePermissions()

  // If no permission specified, show content
  if (!permission) {
    return <>{children}</>
  }

  // Admins always have access
  if (isAdmin) {
    return <>{children}</>
  }

  // Check permissions
  let hasPermission = false
  
  if (Array.isArray(permission)) {
    hasPermission = requireAll ? canAll(permission) : canAny(permission)
  } else {
    hasPermission = can(permission)
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}
