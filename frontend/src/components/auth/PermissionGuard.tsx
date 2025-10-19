import { ReactNode } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Permission, userHasPermission, userHasAnyPermission } from '../../lib/permissions'
import { Navigate } from 'react-router-dom'

interface PermissionGuardProps {
  children: ReactNode
  /** User must have ANY of these permissions */
  requiredPermissions?: Permission[]
  /** User must have ALL of these permissions */
  requiredAllPermissions?: Permission[]
  /** User role must be in this list */
  allowedRoles?: string[]
  /** Fallback component to render if permission denied */
  fallback?: ReactNode
  /** Redirect path if permission denied (default: /unauthorized) */
  redirectTo?: string
}

/**
 * Permission Guard Component
 * Wraps content that requires specific permissions
 * Hides content or redirects if user lacks permission
 */
export default function PermissionGuard({
  children,
  requiredPermissions,
  requiredAllPermissions,
  allowedRoles,
  fallback,
  redirectTo = '/unauthorized'
}: PermissionGuardProps) {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  let hasPermission = false

  // Check allowed roles
  if (allowedRoles && allowedRoles.includes(user.role)) {
    hasPermission = true
  }

  // Check if user has ANY of the required permissions
  if (!hasPermission && requiredPermissions) {
    hasPermission = userHasAnyPermission(user.role, requiredPermissions)
  }

  // Check if user has ALL of the required permissions
  if (!hasPermission && requiredAllPermissions) {
    hasPermission = requiredAllPermissions.every(permission =>
      userHasPermission(user.role, permission)
    )
  }

  // If no permission check was specified, deny by default
  if (!allowedRoles && !requiredPermissions && !requiredAllPermissions) {
    hasPermission = false
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

/**
 * Permission Check Hook
 * Use this to conditionally render UI elements
 */
export function usePermissionCheck() {
  const { user } = useAuthStore()

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    return userHasPermission(user.role, permission)
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false
    return userHasAnyPermission(user.role, permissions)
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false
    return permissions.every(permission => userHasPermission(user.role, permission))
  }

  const hasRole = (role: string): boolean => {
    return user?.role === role
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isSuperAdmin: user?.role === 'SUPERADMIN',
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPERADMIN',
    isStylist: user?.role === 'STYLIST',
    isClient: user?.role === 'CLIENT'
  }
}
