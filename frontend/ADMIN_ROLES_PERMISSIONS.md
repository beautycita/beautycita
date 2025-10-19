# BeautyCita Admin Panel - Role-Based Permissions

## Overview
The BeautyCita admin panel is a **UNIFIED INTERFACE** for all user roles (SUPERADMIN, ADMIN, STYLIST, CLIENT). Navigation items and features are dynamically filtered based on the user's role and permissions.

## Architecture

### Single Unified Admin Layout
- **Location**: `/var/www/beautycita.com/frontend/src/components/layout/AdminLayout.tsx`
- **Purpose**: Provides a consistent navigation and layout for all admin users
- **Key Feature**: Dynamically filters navigation items based on user role using `filterNavigationByRole()`

### Permission System
- **Core File**: `/var/www/beautycita.com/frontend/src/lib/permissions.ts`
- **Navigation Rules**: `/var/www/beautycita.com/frontend/src/lib/navigationPermissions.ts`
- **Permission Guard**: `/var/www/beautycita.com/frontend/src/components/auth/PermissionGuard.tsx`

## Role Permission Matrix

### SUPERADMIN (System Owner)
**Access Level**: Complete system access and control

**Accessible Navigation Items**:
- ✅ Dashboard (`/admin/dashboard`)
- ✅ Analytics (`/admin/analytics`)
- ✅ System Monitor (`/admin/system`) - **SUPERADMIN ONLY**
- ✅ Users (`/admin/users`)
- ✅ Stylist Applications (`/admin/stylist-applications`)
- ✅ Reviews (`/admin/reviews`)
- ✅ Bookings (`/admin/bookings`)
- ✅ Calendar (`/admin/calendar`)
- ✅ Services (`/admin/services`)
- ✅ Video Calls (`/admin/video`)
- ✅ Finance (`/admin/finance`)
- ✅ Disputes (`/admin/disputes`)
- ✅ Messages (`/admin/messages`)
- ✅ Notifications (`/admin/notifications`)
- ✅ Activity Logs (`/admin/logs`)
- ✅ Settings (`/admin/settings`) - **SUPERADMIN ONLY**
- ✅ Issue Tracker (`/admin/issues`)
- ✅ App Downloads (`/download-app`)
- ✅ Marketing (`/admin/marketing`)

**Special Permissions**:
- Can modify system settings
- Can change user roles
- Can access all system logs
- Has ALL permissions automatically

---

### ADMIN (Platform Administrator)
**Access Level**: Platform management and operations (cannot modify system settings or change roles)

**Accessible Navigation Items**:
- ✅ Dashboard (`/admin/dashboard`)
- ✅ Analytics (`/admin/analytics`)
- ❌ System Monitor - **SUPERADMIN ONLY**
- ✅ Users (`/admin/users`) - **View only, cannot change roles**
- ✅ Stylist Applications (`/admin/stylist-applications`)
- ✅ Reviews (`/admin/reviews`)
- ✅ Bookings (`/admin/bookings`)
- ✅ Calendar (`/admin/calendar`)
- ✅ Services (`/admin/services`)
- ✅ Video Calls (`/admin/video`)
- ✅ Finance (`/admin/finance`)
- ✅ Disputes (`/admin/disputes`)
- ✅ Messages (`/admin/messages`)
- ✅ Notifications (`/admin/notifications`)
- ✅ Activity Logs (`/admin/logs`)
- ❌ Settings - **SUPERADMIN ONLY**
- ✅ Issue Tracker (`/admin/issues`)
- ✅ App Downloads (`/download-app`)
- ✅ Marketing (`/admin/marketing`)

**Permissions**:
- ✅ View system logs (limited)
- ✅ Manage all users (view/suspend, but not change roles)
- ✅ Approve stylists
- ✅ View all revenue
- ✅ Manage payouts and refunds
- ✅ Manage marketing campaigns
- ✅ Manage reviews and notifications
- ✅ View all bookings
- ✅ Cancel any booking
- ✅ Manage all services
- ✅ Manage all disputes
- ✅ View platform analytics
- ✅ View and manage issues
- ❌ Cannot modify system settings
- ❌ Cannot change user roles

---

### STYLIST (Beauty Professional)
**Access Level**: Manage own services, bookings, and business operations

**Accessible Navigation Items**:
- ✅ Dashboard (`/admin/dashboard`) - Shows stylist-specific dashboard
- ❌ Analytics - **ADMIN/SUPERADMIN ONLY**
- ❌ System Monitor - **SUPERADMIN ONLY**
- ❌ Users - **ADMIN/SUPERADMIN ONLY**
- ❌ Stylist Applications - **ADMIN/SUPERADMIN ONLY**
- ❌ Reviews - **ADMIN/SUPERADMIN ONLY**
- ✅ Bookings (`/admin/bookings`) - **Own bookings only**
- ✅ Calendar (`/admin/calendar`)
- ✅ Services (`/admin/services`) - **Own services only**
- ❌ Video Calls - **ADMIN/SUPERADMIN ONLY**
- ✅ Finance (`/admin/finance`) - **Own revenue only**
- ❌ Disputes - **ADMIN/SUPERADMIN ONLY** (can view own disputes elsewhere)
- ✅ Messages (`/admin/messages`) - **Own messages only**
- ❌ Notifications - **ADMIN/SUPERADMIN ONLY**
- ❌ Activity Logs - **ADMIN/SUPERADMIN ONLY**
- ❌ Settings - **SUPERADMIN ONLY**
- ❌ Issue Tracker - **ADMIN/SUPERADMIN ONLY**
- ❌ App Downloads - **ADMIN/SUPERADMIN ONLY**
- ❌ Marketing - **ADMIN/SUPERADMIN ONLY**

**Permissions**:
- ✅ View own revenue
- ✅ Request payout
- ✅ View own bookings
- ✅ Manage own bookings (accept/decline/complete)
- ✅ Manage own services (create/edit/delete)
- ✅ View own disputes
- ✅ View own analytics
- ✅ Manage own profile
- ✅ Manage own portfolio
- ✅ Manage own schedule
- ✅ View calendar
- ✅ Manage own calendar
- ✅ View own wallet
- ✅ Manage payment methods
- ✅ View own messages
- ✅ Send messages
- ✅ Join video consultations
- ✅ Host video consultations

---

### CLIENT (Customer)
**Access Level**: View bookings, manage profile, and communicate

**Accessible Navigation Items**:
- ✅ Dashboard (`/dashboard`) - Client dashboard, not admin panel
- ❌ All admin navigation items are hidden for clients

**Note**: Clients typically don't access the admin panel. They use the main dashboard at `/dashboard` instead.

**Permissions**:
- ✅ View own bookings
- ✅ View own disputes
- ✅ Manage own profile
- ✅ View own favorites
- ✅ View calendar
- ✅ View own wallet
- ✅ Manage payment methods
- ✅ View own messages
- ✅ Send messages
- ✅ Join video consultations

---

## Implementation Details

### Navigation Filtering
The `AdminLayout` component uses `filterNavigationByRole()` to dynamically show only the navigation items a user can access:

```typescript
const navigation = useMemo(() => {
  if (!user?.role) return []
  return filterNavigationByRole(allNavigationItems, user.role)
}, [user?.role])
```

### Permission Checks
Each navigation item has a corresponding rule in `NAVIGATION_PERMISSIONS`:

```typescript
'/admin/users': {
  requiredPermissions: [Permission.VIEW_ALL_USERS]
}
```

### Route Protection
Routes in `App.tsx` are protected using `ProtectedRoute` with role or permission requirements:

```typescript
<Route
  path="/admin/users"
  element={
    <ProtectedRoute requiredPermissions={[Permission.VIEW_ALL_USERS]}>
      <AdminUsersPage />
    </ProtectedRoute>
  }
/>
```

### UI Permission Guards
Within pages, use `usePermissionCheck()` hook to conditionally render UI elements:

```typescript
const { isSuperAdmin, hasPermission } = usePermissionCheck()

{isSuperAdmin && (
  <button>Change User Role</button>
)}

{hasPermission(Permission.MANAGE_ALL_USERS) && (
  <button>Suspend User</button>
)}
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/permissions.ts` | Core permission definitions and role mappings |
| `src/lib/navigationPermissions.ts` | Navigation-specific permission rules |
| `src/components/layout/AdminLayout.tsx` | Unified admin layout with role-based navigation |
| `src/components/auth/PermissionGuard.tsx` | Permission checking component and hooks |
| `src/components/auth/ProtectedRoute.tsx` | Route-level permission enforcement |
| `src/App.tsx` | Route definitions with permission requirements |

## Usage Examples

### Check if User Can Access a Feature
```typescript
import { usePermissionCheck } from '@/components/auth/PermissionGuard'

function MyComponent() {
  const { hasPermission, isSuperAdmin } = usePermissionCheck()

  return (
    <div>
      {hasPermission(Permission.VIEW_ALL_USERS) && (
        <UsersList />
      )}

      {isSuperAdmin && (
        <SystemSettings />
      )}
    </div>
  )
}
```

### Protect a Page Component
```typescript
import PermissionGuard from '@/components/auth/PermissionGuard'
import { Permission } from '@/lib/permissions'

function SensitivePage() {
  return (
    <PermissionGuard
      requiredPermissions={[Permission.VIEW_ALL_USERS]}
      fallback={<div>Access Denied</div>}
    >
      <div>Sensitive content here</div>
    </PermissionGuard>
  )
}
```

## Summary

✅ **Single Unified Interface**: One admin panel for all roles
✅ **Role-Based Filtering**: Navigation dynamically adapts to user role
✅ **Permission System**: Fine-grained control over features
✅ **Consistent Styling**: BeautyCita purple-pink gradients throughout
✅ **Security**: Route-level and component-level permission checks
✅ **Maintainable**: Centralized permission definitions

---

**Last Updated**: 2025-10-13
**Maintained By**: BeautyCita Development Team
