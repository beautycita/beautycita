import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  SparklesIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'
import { GradientCard } from '../../components/ui'

interface ForgotPasswordForm {
  email: string
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { t } = useTranslation()

  // Check dark mode
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)

    const handleStorageChange = () => {
      const newDarkMode = localStorage.getItem('darkMode') === 'true'
      setIsDarkMode(newDarkMode)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>()

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)

    try {
      const response = await axios.post('/api/auth/forgot-password', data)

      if (response.data.success) {
        setIsSuccess(true)
        toast.success(t('auth.forgotPassword.resetEmailSent'))

        // In development, show the link
        if (response.data.resetLink) {
          console.log('Password reset link:', response.data.resetLink)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('auth.forgotPassword.resetEmailError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-md w-full p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
              <CheckCircleIcon className="h-12 w-12 text-white" />
            </div>

            <h2 className={`text-3xl font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('auth.forgotPassword.checkEmailTitle')}
            </h2>

            <p className={`mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('auth.forgotPassword.checkEmailMessage')}
            </p>

            <Link
              to="/login"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <span>{t('auth.resetPassword.goToLogin')}</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Left Side - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
        {/* Decorative blur elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/20 rounded-3xl blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-3xl blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-8"
            >
              <KeyIcon className="h-24 w-24" />
            </motion.div>

            <h1 className="text-5xl font-serif font-bold mb-6">BeautyCita</h1>
            <p className="text-xl text-white/90 mb-4">
              {t('auth.forgotPassword.title')}
            </p>
            <p className="text-white/80 max-w-md">
              {t('auth.forgotPassword.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <SparklesIcon className="h-10 w-10 text-pink-500" />
              <span className="text-2xl font-serif font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                BeautyCita
              </span>
            </Link>
          </div>

          <GradientCard
            isDarkMode={isDarkMode}
            gradient="from-pink-500 to-purple-600"
            hoverable={false}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('auth.forgotPassword.title')}
              </h2>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {t('auth.forgotPassword.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('auth.forgotPassword.emailLabel')}
                </label>
                <div className="relative">
                  <input
                    {...register('email', {
                      required: t('auth.forgotPassword.emailRequired'),
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: t('auth.forgotPassword.emailInvalid')
                      }
                    })}
                    type="email"
                    id="email"
                    className={`w-full pl-10 pr-4 py-3 rounded-3xl border ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : isDarkMode
                          ? 'border-gray-600 bg-gray-700/50 text-white focus:ring-pink-500 focus:border-pink-500'
                          : 'border-gray-300 bg-white text-gray-900 focus:ring-pink-500 focus:border-pink-500'
                    } focus:ring-2 focus:outline-none transition-colors`}
                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                    autoComplete="email"
                  />
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <EnvelopeIcon className="h-5 w-5" />
                  </div>
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t('auth.forgotPassword.sendResetLink')}</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className={`text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
              >
                {t('auth.links.backToLogin')}
              </Link>
            </div>
          </GradientCard>
        </div>
      </div>
    </div>
  )
}