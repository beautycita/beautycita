import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { XMarkIcon, EyeIcon, EyeSlashIcon, SparklesIcon, FingerPrintIcon } from '@heroicons/react/24/outline'
import GoogleOneTap from './GoogleOneTap'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  role?: 'client' | 'stylist'
}

// Validation schemas
const loginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
})

const registerSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  acceptTerms: Yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
})

export default function AuthModal({ isOpen, onClose, initialMode = 'register', role = 'client' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const navigate = useNavigate()

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setShowEmailForm(false)
      setShowPassword(false)
    }
  }, [isOpen, initialMode])

  const handleGoogleOneTapSuccess = (userData: any) => {
    toast.success(`Welcome ${userData.name}!`)
    onClose()

    // Check if needs onboarding
    if (!userData.phoneVerified || userData.role === 'CLIENT') {
      navigate('/onboarding/client')
    } else if (userData.role === 'STYLIST') {
      navigate('/dashboard/stylist')
    } else {
      navigate('/dashboard')
    }
  }

  const handleGoogleOneTapError = (error: string) => {
    console.error('Google One Tap error:', error)
    // Silently fail - user can still use email/password
  }

  const handleLogin = async (values: any, { setSubmitting, setFieldError }: any) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: values.email,
        password: values.password,
        role: role.toUpperCase(),
      })

      if (response.data.success) {
        const { accessToken, user, requiresOnboarding } = response.data

        // Store auth data
        localStorage.setItem('token', accessToken)
        localStorage.setItem('user', JSON.stringify(user))

        toast.success(`Welcome back, ${user.name || user.email}!`)
        onClose()

        // Redirect based on onboarding status
        if (requiresOnboarding) {
          navigate('/onboarding/client')
        } else {
          navigate('/panel')
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed'
      setFieldError('email', message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (values: any, { setSubmitting, setFieldError }: any) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        fullName: `${values.firstName} ${values.lastName}`,
        email: values.email,
        password: values.password,
        // Always register as CLIENT - no role selection
      })

      if (response.data.success) {
        const { accessToken, user } = response.data

        // Store auth data
        localStorage.setItem('token', accessToken)
        localStorage.setItem('user', JSON.stringify(user))

        toast.success(`Welcome to BeautyCita, ${values.firstName}!`)
        onClose()

        // Always redirect new users to client onboarding
        navigate('/onboarding/client')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Registration failed'
      setFieldError('email', message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Google One Tap Component (invisible, shows automatic popup) */}
      {isOpen && !showEmailForm && (
        <GoogleOneTap
          role={role}
          onSuccess={handleGoogleOneTapSuccess}
          onError={handleGoogleOneTapError}
          autoSelect={true}
        />
      )}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-gray-900 border border-gray-800 p-8 shadow-2xl transition-all">
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>

                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
                      <SparklesIcon className="h-8 w-8 text-white" />
                    </div>
                    <Dialog.Title className="text-3xl font-bold text-white mb-2">
                      {mode === 'login' ? 'Welcome Back' : 'Join BeautyCita'}
                    </Dialog.Title>
                    <p className="text-gray-400">
                      {mode === 'login'
                        ? 'Sign in to continue your beauty journey'
                        : 'Create your account in seconds'}
                    </p>
                  </div>

                  {!showEmailForm ? (
                    /* Primary Auth Methods */
                    <div className="space-y-4">
                      {/* Google Sign-In Button (visual fallback if One Tap doesn't appear) */}
                      <button
                        onClick={() => window.location.href = `/api/auth/google?role=${role}`}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg"
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Continue with Google</span>
                      </button>

                      {/* Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-gray-900 text-gray-400">or</span>
                        </div>
                      </div>

                      {/* Email/Password Button */}
                      <button
                        onClick={() => setShowEmailForm(true)}
                        className="w-full px-6 py-4 bg-gray-800 text-white font-semibold rounded-full hover:bg-gray-700 transition-all duration-200 border border-gray-700"
                      >
                        Continue with Email
                      </button>

                      {/* Switch Mode Link */}
                      <p className="text-center text-sm text-gray-400 mt-6">
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button
                          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                          className="text-pink-500 hover:text-pink-400 font-semibold"
                        >
                          {mode === 'login' ? 'Sign up' : 'Log in'}
                        </button>
                      </p>
                    </div>
                  ) : (
                    /* Email/Password Form */
                    <Formik
                      initialValues={{
                        firstName: '',
                        lastName: '',
                        email: '',
                        password: '',
                        acceptTerms: false,
                      }}
                      validationSchema={mode === 'login' ? loginSchema : registerSchema}
                      onSubmit={mode === 'login' ? handleLogin : handleRegister}
                    >
                      {({ isSubmitting }) => (
                        <Form className="space-y-4">
                          {mode === 'register' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                                  First Name
                                </label>
                                <Field
                                  name="firstName"
                                  type="text"
                                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-pink-500"
                                  placeholder="Sofia"
                                />
                                <ErrorMessage name="firstName" component="p" className="mt-1 text-sm text-red-400" />
                              </div>

                              <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                                  Last Name
                                </label>
                                <Field
                                  name="lastName"
                                  type="text"
                                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-pink-500"
                                  placeholder="Garcia"
                                />
                                <ErrorMessage name="lastName" component="p" className="mt-1 text-sm text-red-400" />
                              </div>
                            </div>
                          )}

                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                              Email
                            </label>
                            <Field
                              name="email"
                              type="email"
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-pink-500"
                              placeholder="you@example.com"
                            />
                            <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-400" />
                          </div>

                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                              Password
                            </label>
                            <div className="relative">
                              <Field
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-pink-500 pr-12"
                                placeholder="••••••••"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                              >
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                              </button>
                            </div>
                            <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-400" />
                          </div>

                          {mode === 'register' && (
                            <>
                              <div className="flex items-start gap-3">
                                <Field
                                  name="acceptTerms"
                                  type="checkbox"
                                  className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-800 text-pink-600 focus:ring-pink-500 focus:ring-offset-gray-900"
                                />
                                <label htmlFor="acceptTerms" className="text-sm text-gray-300">
                                  I agree to the{' '}
                                  <a href="/terms" target="_blank" className="text-pink-500 hover:text-pink-400 underline">
                                    Terms of Service
                                  </a>{' '}
                                  and{' '}
                                  <a href="/privacy" target="_blank" className="text-pink-500 hover:text-pink-400 underline">
                                    Privacy Policy
                                  </a>
                                </label>
                              </div>
                              <ErrorMessage name="acceptTerms" component="p" className="text-sm text-red-400" />
                            </>
                          )}

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          >
                            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowEmailForm(false)}
                            className="w-full text-sm text-gray-400 hover:text-white"
                          >
                            ← Back to options
                          </button>
                        </Form>
                      )}
                    </Formik>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
