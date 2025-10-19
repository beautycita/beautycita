import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthCallback: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const auth = searchParams.get('auth')
      const error = searchParams.get('error')
      const role = searchParams.get('role')
      const token = searchParams.get('token')
      const details = searchParams.get('details')

      // Handle successful authentication
      if (auth === 'success' && token) {
        try {
          // Set the token in authService
          authService.setAuthToken(token)

          // Fetch user profile with the token
          const response = await authService.getProfile()

          if (response.success && response.data) {
            const { user, client, stylist } = response.data

            // Update auth store using Zustand's getState/setState
            useAuthStore.setState({
              user: {
                ...user,
                isActive: user.isActive ?? true,
                emailVerified: user.emailVerified ?? false,
                role: user.role || 'CLIENT'
              },
              client,
              stylist,
              token,
              isAuthenticated: true,
              isLoading: false
            })

            toast.success(t('messages.welcomeBack'))

            // Redirect based on role and profile completion
            setTimeout(() => {
              if (role === 'ADMIN' || role === 'admin' || role === 'SUPERADMIN') {
                navigate('/admin/dashboard')
              } else if (!user.profile_complete) {
                // Redirect to onboarding if profile is incomplete
                navigate('/profile/onboarding')
              } else {
                // Both CLIENT and STYLIST go to /dashboard
                // DashboardPage will render the correct component based on role
                navigate('/dashboard')
              }
            }, 1500)
          } else {
            throw new Error('Failed to fetch user profile')
          }
        } catch (err) {
          console.error('Error handling OAuth callback:', err)
          toast.error(t('auth.messages.loginError'))
          navigate('/login')
        }
        return
      }

      // Handle authentication errors
      if (error === 'auth_failed') {
        let errorMessage = t('auth.authCallback.authFailedGeneral')

        switch (details) {
          case 'callback_error':
            errorMessage = t('auth.authCallback.callbackError')
            break
          case 'no_user':
            errorMessage = t('auth.authCallback.noUser')
            break
          case 'session_failed':
            errorMessage = t('auth.authCallback.sessionFailed')
            break
          case 'login_error':
            errorMessage = t('auth.authCallback.loginError')
            break
        }

        // Show error message and redirect
        setTimeout(() => {
          navigate('/', {
            state: {
              authError: errorMessage,
              showAuth: true
            }
          })
        }, 3000)
        return
      }

      // Handle session errors
      if (error === 'session_failed') {
        setTimeout(() => {
          navigate('/', {
            state: {
              authError: t('auth.authCallback.sessionFailed'),
              showAuth: true
            }
          })
        }, 3000)
        return
      }

      // Default redirect if no params
      navigate('/')
    }

    handleCallback()
  }, [searchParams, navigate])

  // Determine what to display based on URL params
  const auth = searchParams.get('auth')
  const error = searchParams.get('error')
  const role = searchParams.get('role')

  if (auth === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.authCallback.welcomeBack')}
          </h2>

          <p className="text-gray-600 mb-4">
            {t('auth.authCallback.loginSuccessful', { role: role || 'client' })}
          </p>

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (error) {
    const details = searchParams.get('details')
    let errorMessage = t('auth.authCallback.authFailedGeneral')

    switch (details) {
      case 'callback_error':
        errorMessage = t('auth.authCallback.callbackError')
        break
      case 'no_user':
        errorMessage = t('auth.authCallback.noUser')
        break
      case 'session_failed':
        errorMessage = t('auth.authCallback.sessionFailed')
        break
      case 'login_error':
        errorMessage = t('auth.authCallback.loginError')
        break
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.authCallback.authFailed')}
          </h2>

          <p className="text-gray-600 mb-4">
            {errorMessage}. {t('auth.authCallback.redirecting')}
          </p>

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Default loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <AlertCircle className="w-20 h-20 text-yellow-500 mx-auto mb-4" />

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('auth.authCallback.processing')}
        </h2>

        <p className="text-gray-600 mb-4">
          {t('auth.authCallback.pleaseWait')}
        </p>

        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthCallback