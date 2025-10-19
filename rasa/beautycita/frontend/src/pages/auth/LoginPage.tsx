import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import type { LoginForm } from '@/types'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const from = location.state?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    const success = await login(data)
    if (success) {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <SparklesIcon className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-serif font-bold gradient-text">
              BeautyCita
            </span>
          </Link>

          {/* Title */}
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            {t('auth.loginTitle')}
          </h2>
          <p className="text-gray-600">
            {t('auth.loginSubtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card"
        >
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="label">
                  {t('auth.fields.email')} *
                </label>
                <input
                  {...register('email', {
                    required: t('auth.validation.emailRequired'),
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: t('auth.validation.emailInvalid')
                    }
                  })}
                  type="email"
                  id="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder={t('auth.placeholders.email')}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="label">
                  {t('auth.fields.password')} *
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: t('auth.validation.passwordRequired'),
                      minLength: {
                        value: 6,
                        message: t('auth.validation.passwordMinLength')
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder={t('auth.placeholders.password')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    {...register('rememberMe')}
                    id="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    {t('auth.options.rememberMe')}
                  </label>
                </div>

                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('auth.links.forgotPassword')}
                </Link>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg w-full flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <>
                    <span>{t('auth.actions.signIn')}</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t('common.or')}</span>
                </div>
              </div>
            </div>

            {/* Register link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.links.noAccount')}{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  {t('auth.links.signUpHere')}
                </Link>
              </p>
            </div>

            {/* Stylist register link */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                {t('auth.links.beautyProfessional')}{' '}
                <Link
                  to="/register/stylist"
                  className="font-medium text-secondary-600 hover:text-secondary-700"
                >
                  {t('auth.links.joinAsStylist')}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500">
            {t('auth.legal.termsAcceptance')}{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-700">
              {t('auth.legal.termsLink')}
            </Link>{' '}
            {t('auth.legal.and')}{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
              {t('auth.legal.privacyLink')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}