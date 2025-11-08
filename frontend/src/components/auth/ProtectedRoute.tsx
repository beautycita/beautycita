import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission } from '../../lib/permissions'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: string[]
  requiredPermissions?: Permission[]
  requireAll?: boolean // If true, user must have ALL permissions. If false, user needs ANY permission (default)
  requireVerification?: boolean
}

export default function ProtectedRoute({
  children,
  roles,
  requiredPermissions,
  requireAll = false,
  requireVerification = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { hasAnyPermission, hasAllPermissions } = usePermissions()
  const location = useLocation()

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user needs to complete profile onboarding
  // Support both camelCase and snake_case from API
  const profileComplete = user.profileComplete ?? user.profile_complete ?? false
  const isOnClientOnboardingPage = location.pathname === '/client/onboarding'
  const isOnStylistOnboardingPage = location.pathname === '/profile/onboarding'
  const isOnAnyOnboardingPage = isOnClientOnboardingPage || isOnStylistOnboardingPage

  // Redirect to role-specific onboarding if profile is incomplete
  if (!profileComplete && !isOnAnyOnboardingPage) {
    // Route based on user role
    const onboardingPath = user.role === 'STYLIST' ? '/profile/onboarding' : '/client/onboarding'
    return <Navigate to={onboardingPath} state={{ from: location }} replace />
  }

  // Check email verification if required
  if (requireVerification && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // Check permission-based access (preferred method)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions)

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Legacy role-based check (for backward compatibility)
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Check if account is active (default to true if not explicitly set)
  if (user.isActive === false) {
    return <Navigate to="/account-suspended" replace />
  }

  return <>{children}</>
}