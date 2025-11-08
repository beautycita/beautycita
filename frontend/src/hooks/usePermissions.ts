import { useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { Permission, ROLE_PERMISSIONS } from '../lib/permissions'

/**
 * Hook to check user permissions based on their role
 *
 * @example
 * const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
 *
 * if (hasPermission(Permission.VIEW_ISSUES)) {
 *   // Show issues page
 * }
 */
export function usePermissions() {
  const { user } = useAuthStore()

  const userPermissions = useMemo(() => {
    if (!user) return []
    return ROLE_PERMISSIONS[user.role] || []
  }, [user])

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    return userPermissions.includes(permission)
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user || permissions.length === 0) return false
    return permissions.some(p => userPermissions.includes(p))
  }

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user || permissions.length === 0) return false
    return permissions.every(p => userPermissions.includes(p))
  }

  /**
   * Get all permissions for current user
   */
  const getAllPermissions = (): Permission[] => {
    return userPermissions
  }

  /**
   * Check if user is SUPERADMIN (has all permissions)
   */
  const isSuperAdmin = (): boolean => {
    return user?.role === 'SUPERADMIN'
  }

  /**
   * Check if user is ADMIN or SUPERADMIN
   */
  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getAllPermissions,
    isSuperAdmin,
    isAdmin,
    userPermissions,
  }
}
