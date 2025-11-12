import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SparklesIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Google One Tap types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (momentListener?: (notification: any) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

export default function CleanAuthPage({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()

  // Google One Tap handler
  const handleGoogleOneTap = useCallback(async (response: any) => {
    try {
      console.log('Google One Tap credential received')

      const res = await axios.post(`${API_URL}/api/auth/google/one-tap`, {
        credential: response.credential,
        role: 'CLIENT'
      })

      if (res.data.success) {
        console.log('Google One Tap authentication successful')

        // Store in localStorage
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))

        // Update auth store
        setToken(res.data.token)
        setUser(res.data.user)

        toast.success('Welcome to BeautyCita!')

        // Redirect based on onboarding status
        if (res.data.requiresOnboarding) {
          navigate('/onboarding/client')
        } else {
          navigate('/panel')
        }
      }
    } catch (error: any) {
      console.error('Google One Tap error:', error)
      toast.error(error.response?.data?.error || 'Authentication failed')
    }
  }, [navigate, setToken, setUser])

  // Initialize Google One Tap
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.onload = () => {
      if (window.google) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

        if (!clientId) {
          console.error('Google Client ID not configured')
          return
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleOneTap,
          auto_select: false,
          cancel_on_tap_outside: false,
          context: mode === 'register' ? 'signup' : 'signin'
        })

        // Display the One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('Google One Tap not displayed:', notification.getNotDisplayedReason())
          } else if (notification.isSkippedMoment()) {
            console.log('Google One Tap skipped:', notification.getSkippedReason())
          } else if (notification.isDismissedMoment()) {
            console.log('Google One Tap dismissed:', notification.getDismissedReason())
          }
        })
      }
    }

    document.head.appendChild(script)

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [handleGoogleOneTap, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    if (mode === 'register' && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (mode === 'register' && password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setIsLoading(true)

      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = mode === 'login'
        ? { email, password }
        : {
            email,
            password,
            role: 'CLIENT',
            firstName: email.split('@')[0], // Use email prefix as default first name
            lastName: '',
            acceptTerms: true
          }

      console.log(`Calling ${endpoint}...`)
      const response = await axios.post(`${API_URL}${endpoint}`, payload)

      if (response.data.token) {
        console.log('Auth successful, token received')

        // Store token
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        // Update auth store
        setToken(response.data.token)
        setUser(response.data.user)

        toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')

        // Check if onboarding is complete
        if (response.data.user.onboardingCompleted) {
          navigate('/panel')
        } else {
          navigate('/onboarding/client')
        }
      } else {
        toast.error(response.data.message || 'Authentication failed')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(error.response?.data?.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-serif font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              BeautyCita
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-600">
            {mode === 'login' ? 'Sign in to your account' : 'Join BeautyCita today'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Google One Tap appears automatically as popup */}

          {/* Divider */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>

            {/* Forgot Password (Login only) */}
            {mode === 'login' && (
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </Link>
              </div>
            )}
          </form>

          {/* Toggle Mode */}
          <div className="text-center pt-6 border-t border-gray-200 mt-6">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <Link
                to={mode === 'login' ? '/register' : '/login'}
                className="font-medium text-purple-600 hover:text-purple-700"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
