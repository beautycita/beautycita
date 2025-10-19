/**
 * Navigation Permission Helper for Admin Layout
 * Defines which navigation items are visible to each role
 */

import { Permission, userHasPermission } from './permissions'

export interface NavigationRule {
  // If specified, user must have ANY of these permissions
  requiredPermissions?: Permission[]
  // If specified, user must have ALL of these permissions
  requiredAllPermissions?: Permission[]
  // If specified, user role must be in this list
  allowedRoles?: string[]
}

/**
 * Navigation item permission rules
 */
export const NAVIGATION_PERMISSIONS: Record<string, NavigationRule> = {
  // Dashboard - All admin roles can view
  '/admin/dashboard': {
    requiredPermissions: [Permission.VIEW_ADMIN_DASHBOARD]
  },

  // Analytics - ADMIN and SUPERADMIN
  '/admin/analytics': {
    requiredPermissions: [Permission.VIEW_PLATFORM_ANALYTICS]
  },

  // System Monitor - SUPERADMIN ONLY
  '/admin/system': {
    allowedRoles: ['SUPERADMIN']
  },

  // Users - View requires VIEW_ALL_USERS
  '/admin/users': {
    requiredPermissions: [Permission.VIEW_ALL_USERS]
  },

  // Stylist Applications - ADMIN and SUPERADMIN
  '/admin/stylist-applications': {
    requiredPermissions: [Permission.APPROVE_STYLISTS]
  },

  // Reviews - ADMIN and SUPERADMIN
  '/admin/reviews': {
    requiredPermissions: [Permission.MANAGE_REVIEWS]
  },

  // Bookings - All admin roles, or stylists viewing their own
  '/admin/bookings': {
    requiredPermissions: [Permission.VIEW_ALL_BOOKINGS, Permission.VIEW_OWN_BOOKINGS]
  },

  // Calendar - All roles with calendar access
  '/admin/calendar': {
    requiredPermissions: [Permission.VIEW_CALENDAR]
  },

  // Services - ADMIN/SUPERADMIN for all, STYLIST for own
  '/admin/services': {
    requiredPermissions: [Permission.MANAGE_ALL_SERVICES, Permission.MANAGE_OWN_SERVICES]
  },

  // Video Calls - ADMIN and SUPERADMIN
  '/admin/video': {
    requiredPermissions: [Permission.VIEW_ADMIN_VIDEO]
  },

  // Finance - ADMIN and SUPERADMIN for all, STYLIST for own
  '/admin/finance': {
    requiredPermissions: [Permission.VIEW_ALL_REVENUE, Permission.VIEW_OWN_REVENUE]
  },

  // Disputes - ADMIN and SUPERADMIN
  '/admin/disputes': {
    requiredPermissions: [Permission.MANAGE_ALL_DISPUTES]
  },

  // Messages - All roles with messaging
  '/admin/messages': {
    requiredPermissions: [Permission.VIEW_ADMIN_MESSAGES, Permission.VIEW_OWN_MESSAGES]
  },

  // Notifications - ADMIN and SUPERADMIN
  '/admin/notifications': {
    requiredPermissions: [Permission.MANAGE_NOTIFICATIONS]
  },

  // Activity Logs - ADMIN and SUPERADMIN
  '/admin/logs': {
    requiredPermissions: [Permission.VIEW_SYSTEM_LOGS]
  },

  // Settings - SUPERADMIN ONLY
  '/admin/settings': {
    allowedRoles: ['SUPERADMIN']
  },

  // Issue Tracker - ADMIN and SUPERADMIN ONLY
  '/admin/issues': {
    allowedRoles: ['SUPERADMIN', 'ADMIN'],
    requiredPermissions: [Permission.VIEW_ISSUES]
  },

  // App Downloads - ADMIN and SUPERADMIN
  '/download-app': {
    allowedRoles: ['SUPERADMIN', 'ADMIN'],
    requiredPermissions: [Permission.VIEW_ISSUES] // Reusing this as it's admin-only
  },

  // Marketing - ADMIN and SUPERADMIN
  '/admin/marketing': {
    allowedRoles: ['SUPERADMIN', 'ADMIN'],
    requiredPermissions: [Permission.MANAGE_MARKETING]
  }
}

/**
 * Check if user can access a navigation item
 */
export function canAccessNavigation(
  userRole: string,
  navigationPath: string
): boolean {
  const rule = NAVIGATION_PERMISSIONS[navigationPath]

  // If no rule defined, default to SUPERADMIN only
  if (!rule) {
    return userRole === 'SUPERADMIN'
  }

  // Check allowed roles
  if (rule.allowedRoles && rule.allowedRoles.includes(userRole)) {
    return true
  }

  // Check required permissions (user needs ANY of these)
  if (rule.requiredPermissions) {
    const hasPermission = rule.requiredPermissions.some(permission =>
      userHasPermission(userRole, permission)
    )
    if (hasPermission) return true
  }

  // Check required all permissions (user needs ALL of these)
  if (rule.requiredAllPermissions) {
    const hasAllPermissions = rule.requiredAllPermissions.every(permission =>
      userHasPermission(userRole, permission)
    )
    if (hasAllPermissions) return true
  }

  return false
}

/**
 * Filter navigation items based on user role
 */
export function filterNavigationByRole<T extends { href: string }>(
  items: T[],
  userRole: string
): T[] {
  return items.filter(item => canAccessNavigation(userRole, item.href))
}

/**
 * Get role-specific dashboard title
 */
export function getDashboardTitle(userRole: string): string {
  switch (userRole) {
    case 'SUPERADMIN':
      return 'Super Admin Dashboard'
    case 'ADMIN':
      return 'Admin Dashboard'
    case 'STYLIST':
      return 'Stylist Dashboard'
    case 'CLIENT':
      return 'My Dashboard'
    default:
      return 'Dashboard'
  }
}

/**
 * Get role-specific subtitle
 */
export function getDashboardSubtitle(userRole: string): string {
  switch (userRole) {
    case 'SUPERADMIN':
      return 'Complete system access and control'
    case 'ADMIN':
      return 'Platform management and operations'
    case 'STYLIST':
      return 'Manage your services and bookings'
    case 'CLIENT':
      return 'View your bookings and favorites'
    default:
      return ''
  }
}
