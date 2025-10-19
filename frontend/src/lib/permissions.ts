/**
 * RBAC Permission System for BeautyCita Frontend
 *
 * This file defines all available permissions in the system and maps them to user roles.
 * SUPERADMIN automatically inherits ALL permissions.
 */

export enum Permission {
  // ===== System Administration =====
  MANAGE_SYSTEM_SETTINGS = 'MANAGE_SYSTEM_SETTINGS',
  VIEW_SYSTEM_LOGS = 'VIEW_SYSTEM_LOGS',

  // ===== User Management =====
  MANAGE_ALL_USERS = 'MANAGE_ALL_USERS',
  VIEW_ALL_USERS = 'VIEW_ALL_USERS',
  APPROVE_STYLISTS = 'APPROVE_STYLISTS',
  SUSPEND_USERS = 'SUSPEND_USERS',

  // ===== Financial Management =====
  VIEW_ALL_REVENUE = 'VIEW_ALL_REVENUE',
  MANAGE_PAYOUTS = 'MANAGE_PAYOUTS',
  MANAGE_REFUNDS = 'MANAGE_REFUNDS',
  MANAGE_PAYMENT_DISPUTES = 'MANAGE_PAYMENT_DISPUTES',
  VIEW_OWN_REVENUE = 'VIEW_OWN_REVENUE',
  REQUEST_PAYOUT = 'REQUEST_PAYOUT',

  // ===== Content & Marketing =====
  MANAGE_MARKETING = 'MANAGE_MARKETING',
  MANAGE_REVIEWS = 'MANAGE_REVIEWS',
  MANAGE_NOTIFICATIONS = 'MANAGE_NOTIFICATIONS',
  MANAGE_SERVICES_CATALOG = 'MANAGE_SERVICES_CATALOG',

  // ===== Bookings =====
  VIEW_ALL_BOOKINGS = 'VIEW_ALL_BOOKINGS',
  VIEW_OWN_BOOKINGS = 'VIEW_OWN_BOOKINGS',
  MANAGE_OWN_BOOKINGS = 'MANAGE_OWN_BOOKINGS',
  CANCEL_ANY_BOOKING = 'CANCEL_ANY_BOOKING',

  // ===== Services =====
  MANAGE_ALL_SERVICES = 'MANAGE_ALL_SERVICES',
  MANAGE_OWN_SERVICES = 'MANAGE_OWN_SERVICES',

  // ===== Disputes =====
  MANAGE_ALL_DISPUTES = 'MANAGE_ALL_DISPUTES',
  VIEW_OWN_DISPUTES = 'VIEW_OWN_DISPUTES',

  // ===== Analytics =====
  VIEW_PLATFORM_ANALYTICS = 'VIEW_PLATFORM_ANALYTICS',
  VIEW_OWN_ANALYTICS = 'VIEW_OWN_ANALYTICS',

  // ===== Issues/Tickets (ADMIN/SUPERADMIN ONLY) =====
  VIEW_ISSUES = 'VIEW_ISSUES',
  MANAGE_ISSUES = 'MANAGE_ISSUES',

  // ===== Admin Dashboard =====
  VIEW_ADMIN_DASHBOARD = 'VIEW_ADMIN_DASHBOARD',
  VIEW_ADMIN_MESSAGES = 'VIEW_ADMIN_MESSAGES',
  VIEW_ADMIN_VIDEO = 'VIEW_ADMIN_VIDEO',

  // ===== Profile Management =====
  MANAGE_OWN_PROFILE = 'MANAGE_OWN_PROFILE',
  MANAGE_OWN_PORTFOLIO = 'MANAGE_OWN_PORTFOLIO',
  MANAGE_OWN_SCHEDULE = 'MANAGE_OWN_SCHEDULE',
  VIEW_OWN_FAVORITES = 'VIEW_OWN_FAVORITES',

  // ===== Calendar =====
  VIEW_CALENDAR = 'VIEW_CALENDAR',
  MANAGE_OWN_CALENDAR = 'MANAGE_OWN_CALENDAR',

  // ===== Wallet & Payments =====
  VIEW_OWN_WALLET = 'VIEW_OWN_WALLET',
  MANAGE_PAYMENT_METHODS = 'MANAGE_PAYMENT_METHODS',

  // ===== Messaging =====
  VIEW_OWN_MESSAGES = 'VIEW_OWN_MESSAGES',
  SEND_MESSAGES = 'SEND_MESSAGES',

  // ===== Video Consultations =====
  JOIN_VIDEO_CONSULTATION = 'JOIN_VIDEO_CONSULTATION',
  HOST_VIDEO_CONSULTATION = 'HOST_VIDEO_CONSULTATION',
}

/**
 * Role-based permission mapping
 * SUPERADMIN has ALL permissions automatically
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  /**
   * SUPERADMIN - System Owner
   * Has complete access to everything in the system
   */
  SUPERADMIN: Object.values(Permission), // Automatically gets ALL permissions

  /**
   * ADMIN - Platform Administrator
   * Can manage users, content, and platform operations
   * Cannot modify system settings
   */
  ADMIN: [
    // System (Limited)
    Permission.VIEW_SYSTEM_LOGS,

    // User Management
    Permission.MANAGE_ALL_USERS,
    Permission.VIEW_ALL_USERS,
    Permission.APPROVE_STYLISTS,
    Permission.SUSPEND_USERS,

    // Financial
    Permission.VIEW_ALL_REVENUE,
    Permission.MANAGE_PAYOUTS,
    Permission.MANAGE_REFUNDS,
    Permission.MANAGE_PAYMENT_DISPUTES,

    // Content & Marketing
    Permission.MANAGE_MARKETING,
    Permission.MANAGE_REVIEWS,
    Permission.MANAGE_NOTIFICATIONS,
    Permission.MANAGE_SERVICES_CATALOG,

    // Bookings
    Permission.VIEW_ALL_BOOKINGS,
    Permission.CANCEL_ANY_BOOKING,

    // Services
    Permission.MANAGE_ALL_SERVICES,

    // Disputes
    Permission.MANAGE_ALL_DISPUTES,

    // Analytics
    Permission.VIEW_PLATFORM_ANALYTICS,

    // Issues - CRITICAL: Only ADMIN and SUPERADMIN
    Permission.VIEW_ISSUES,
    Permission.MANAGE_ISSUES,

    // Admin Dashboard
    Permission.VIEW_ADMIN_DASHBOARD,
    Permission.VIEW_ADMIN_MESSAGES,
    Permission.VIEW_ADMIN_VIDEO,

    // Calendar
    Permission.VIEW_CALENDAR,

    // Messages
    Permission.VIEW_OWN_MESSAGES,
    Permission.SEND_MESSAGES,
  ],

  /**
   * STYLIST - Beauty Professional
   * Can manage their own services, bookings, and portfolio
   */
  STYLIST: [
    // Financial
    Permission.VIEW_OWN_REVENUE,
    Permission.REQUEST_PAYOUT,

    // Bookings
    Permission.VIEW_OWN_BOOKINGS,
    Permission.MANAGE_OWN_BOOKINGS,

    // Services
    Permission.MANAGE_OWN_SERVICES,

    // Disputes
    Permission.VIEW_OWN_DISPUTES,

    // Analytics
    Permission.VIEW_OWN_ANALYTICS,

    // Profile
    Permission.MANAGE_OWN_PROFILE,
    Permission.MANAGE_OWN_PORTFOLIO,
    Permission.MANAGE_OWN_SCHEDULE,

    // Calendar
    Permission.VIEW_CALENDAR,
    Permission.MANAGE_OWN_CALENDAR,

    // Wallet
    Permission.VIEW_OWN_WALLET,
    Permission.MANAGE_PAYMENT_METHODS,

    // Messages
    Permission.VIEW_OWN_MESSAGES,
    Permission.SEND_MESSAGES,

    // Video
    Permission.JOIN_VIDEO_CONSULTATION,
    Permission.HOST_VIDEO_CONSULTATION,
  ],

  /**
   * CLIENT - Customer
   * Can book services and manage their own profile
   */
  CLIENT: [
    // Bookings
    Permission.VIEW_OWN_BOOKINGS,

    // Disputes
    Permission.VIEW_OWN_DISPUTES,

    // Profile
    Permission.MANAGE_OWN_PROFILE,
    Permission.VIEW_OWN_FAVORITES,

    // Calendar
    Permission.VIEW_CALENDAR,

    // Wallet
    Permission.VIEW_OWN_WALLET,
    Permission.MANAGE_PAYMENT_METHODS,

    // Messages
    Permission.VIEW_OWN_MESSAGES,
    Permission.SEND_MESSAGES,

    // Video
    Permission.JOIN_VIDEO_CONSULTATION,
  ],
}

/**
 * Helper function to check if a user has a specific permission
 */
export function userHasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.includes(permission)
}

/**
 * Helper function to get all permissions for a role
 */
export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Helper function to check if user has any of the specified permissions
 */
export function userHasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => userHasPermission(userRole, permission))
}

/**
 * Helper function to check if user has all of the specified permissions
 */
export function userHasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => userHasPermission(userRole, permission))
}
