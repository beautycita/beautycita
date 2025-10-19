import type { User } from '../types'

export interface RedirectOptions {
  user?: User | null
  from?: string
  fallback?: string
}

/**
 * Determines the appropriate redirect destination after login based on user role and context
 */
export function getPostLoginRedirect({ user, from, fallback = '/' }: RedirectOptions): string {
  // If no user, redirect to home
  if (!user) {
    return fallback
  }

  // Check if user needs to complete onboarding
  // Support both camelCase and snake_case from API
  const profileComplete = user.profileComplete ?? user.profile_complete ?? false

  // If profile is not complete and not already heading to onboarding, redirect to onboarding
  if (!profileComplete && from !== '/profile/onboarding') {
    return '/profile/onboarding'
  }

  // If there's an intended destination from protected route, honor it
  if (from && from !== '/' && from !== '/login' && from !== '/register') {
    // Ensure the user has access to the intended destination
    if (hasRouteAccess(from, user.role)) {
      return from
    }
  }

  // Role-based default destinations
  switch (user.role?.toUpperCase()) {
    case 'STYLIST':
    case 'CLIENT':
      return '/panel'
    case 'ADMIN':
    case 'SUPERADMIN':
      return '/panel'
    default:
      return fallback
  }
}

/**
 * Checks if a user role has access to a specific route
 */
function hasRouteAccess(path: string, userRole?: string): boolean {
  const role = userRole?.toUpperCase()

  // Admin routes - only for admins and superadmins
  if (path.startsWith('/admin')) {
    return role === 'ADMIN' || role === 'SUPERADMIN'
  }

  // Dashboard routes - for all authenticated users
  if (path.startsWith('/dashboard')) {
    return role === 'STYLIST' || role === 'CLIENT' || role === 'ADMIN' || role === 'SUPERADMIN'
  }

  // Stylist-specific routes
  if (path.includes('/stylist/') && path.includes('/manage')) {
    return role === 'STYLIST' || role === 'ADMIN' || role === 'SUPERADMIN'
  }

  // Most other protected routes are accessible to all authenticated users
  const protectedRoutes = ['/profile', '/bookings', '/book/']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  if (isProtectedRoute) {
    return true // All authenticated users can access these
  }

  // Default: allow access to unknown routes (they'll be handled by ProtectedRoute component)
  return true
}

/**
 * Gets the appropriate dashboard URL based on user role
 */
export function getDashboardUrl(userRole?: string): string {
  const role = userRole?.toUpperCase()

  switch (role) {
    case 'STYLIST':
    case 'CLIENT':
      return '/dashboard'
    case 'ADMIN':
    case 'SUPERADMIN':
      return '/panel'
    default:
      return '/dashboard'
  }
}

/**
 * Gets the appropriate profile URL based on user role
 */
export function getProfileUrl(userRole?: string): string {
  const role = userRole?.toUpperCase()

  switch (role) {
    case 'STYLIST':
      return '/dashboard/profile'
    case 'CLIENT':
    case 'ADMIN':
    case 'SUPERADMIN':
      return '/profile'
    default:
      return '/profile'
  }
}