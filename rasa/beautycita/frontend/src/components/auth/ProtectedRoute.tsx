import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: string[]
  requireVerification?: boolean
}

export default function ProtectedRoute({
  children,
  roles,
  requireVerification = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
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

  // Check email verification if required
  if (requireVerification && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // Check user roles if specified
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Check if account is active
  if (!user.isActive) {
    return <Navigate to="/account-suspended" replace />
  }

  return <>{children}</>
}