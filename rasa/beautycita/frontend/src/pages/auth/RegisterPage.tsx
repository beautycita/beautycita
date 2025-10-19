import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/store/authStore'
import type { RegisterForm } from '@/types'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    const success = await registerUser(data)
    if (success) {
      navigate('/login', {
        state: { message: t('auth.messages.registerSuccess') }
      })
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
            {t('auth.registerTitle')}
          </h2>
          <p className="text-gray-600">
            {t('auth.registerSubtitle')}
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
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="firstName" className="label">
                    {t('auth.fields.firstName')} *
                  </label>
                  <input
                    {...register('firstName', {
                      required: t('auth.validation.firstNameRequired'),
                      minLength: {
                        value: 2,
                        message: t('auth.validation.firstNameMinLength')
                      }
                    })}
                    type="text"
                    id="firstName"
                    className={`input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder={t('auth.placeholders.firstName')}
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="label">
                    {t('auth.fields.lastName')} *
                  </label>
                  <input
                    {...register('lastName', {
                      required: t('auth.validation.lastNameRequired'),
                      minLength: {
                        value: 2,
                        message: t('auth.validation.lastNameMinLength')
                      }
                    })}
                    type="text"
                    id="lastName"
                    className={`input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder={t('auth.placeholders.lastName')}
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

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

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="phone" className="label">
                  {t('auth.fields.phone')} *
                </label>
                <input
                  {...register('phone', {
                    required: t('auth.validation.phoneRequired'),
                    pattern: {
                      value: /^[\+]?[0-9\s\-\(\)]{10,}$/,
                      message: t('auth.validation.phoneInvalid')
                    }
                  })}
                  type="tel"
                  id="phone"
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  placeholder={t('auth.placeholders.phone')}
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="form-error">{errors.phone.message}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label htmlFor="dateOfBirth" className="label">
                  {t('auth.fields.dateOfBirth')} *
                </label>
                <input
                  {...register('dateOfBirth', {
                    required: t('auth.validation.dateOfBirthRequired'),
                    validate: value => {
                      const date = new Date(value)
                      const now = new Date()
                      const age = now.getFullYear() - date.getFullYear()
                      if (isNaN(date.getTime())) {
                        return t('auth.validation.dateOfBirthInvalid')
                      }
                      if (age < 18) {
                        return t('auth.validation.mustBe18')
                      }
                      return true
                    }
                  })}
                  type="date"
                  id="dateOfBirth"
                  className={`input ${errors.dateOfBirth ? 'input-error' : ''}`}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && (
                  <p className="form-error">{errors.dateOfBirth.message}</p>
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
                        value: 8,
                        message: t('auth.validation.passwordMinLength')
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: t('auth.validation.passwordStrong')
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder={t('auth.placeholders.password')}
                    autoComplete="new-password"
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

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="label">
                  {t('auth.fields.confirmPassword')} *
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: t('auth.validation.confirmPassword'),
                      validate: value =>
                        value === password || t('auth.validation.passwordsNotMatch')
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder={t('auth.placeholders.password')}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms acceptance */}
              <div className="flex items-start space-x-3">
                <input
                  {...register('acceptTerms', {
                    required: t('auth.validation.termsRequired')
                  })}
                  id="acceptTerms"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                />
                <div className="text-sm">
                  <label htmlFor="acceptTerms" className="text-gray-700">
                    {t('auth.options.acceptTerms')}{' '}
                    <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                      {t('auth.links.termsOfService')}
                    </Link>{' '}
                    {t('auth.legal.and')}{' '}
                    <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                      {t('auth.links.privacyPolicy')}
                    </Link>
                  </label>
                  {errors.acceptTerms && (
                    <p className="form-error mt-1">{errors.acceptTerms.message}</p>
                  )}
                </div>
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
                    <span>{t('auth.actions.signUp')}</span>
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

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.links.hasAccount')}{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  {t('auth.links.signInHere')}
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

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-lg p-4 border border-gray-100"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {t('auth.benefits.title')}
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center space-x-2 text-xs text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{t('auth.benefits.easyBooking')}</span>
            </li>
            <li className="flex items-center space-x-2 text-xs text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{t('auth.benefits.serviceHistory')}</span>
            </li>
            <li className="flex items-center space-x-2 text-xs text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{t('auth.benefits.personalizedOffers')}</span>
            </li>
            <li className="flex items-center space-x-2 text-xs text-gray-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{t('auth.benefits.reviewServices')}</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}