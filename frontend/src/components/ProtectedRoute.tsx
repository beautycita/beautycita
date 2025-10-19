import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'CLIENT' | 'STYLIST' | 'ADMIN' | 'SUPERADMIN'
  requireAuth?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireAuth = true
}) => {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // Check auth on mount if not already authenticated
    if (!isAuthenticated && !isLoading) {
      checkAuth()
    }
  }, [isAuthenticated, isLoading, checkAuth])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-white/90">Checking authentication...</div>
        </motion.div>
      </div>
    )
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect if specific role is required but user doesn't have it
  if (requiredRole && user?.role?.toUpperCase() !== requiredRole) {
    // If user is authenticated but wrong role, redirect to their appropriate dashboard
    if (isAuthenticated && user) {
      const userRole = user.role?.toUpperCase()
      if (userRole === 'STYLIST') {
        return <Navigate to="/dashboard" replace />
      } else if (userRole === 'CLIENT') {
        return <Navigate to="/dashboard" replace />
      } else if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
        return <Navigate to="/admin" replace />
      }
    }
    // If not authenticated, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // User meets all requirements, render the protected content
  return <>{children}</>
}

// Convenience components for common use cases
export const ClientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="CLIENT">{children}</ProtectedRoute>
)

export const StylistRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="STYLIST">{children}</ProtectedRoute>
)

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>
)

export default ProtectedRoute