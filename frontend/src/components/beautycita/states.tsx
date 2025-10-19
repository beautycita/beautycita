/**
 * BeautyCita State Components
 * Loading, empty, error states
 */

import { motion } from 'framer-motion'
import {
  SparklesIcon,
  FaceFrownIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

// ============================================================================
// LOADING SPINNER
// ============================================================================

interface BCLoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
}

export const BCLoading = ({
  size = 'md',
  text = 'Loading...',
  fullScreen
}: BCLoadingProps) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1]
        }}
        transition={{
          rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
          scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
        }}
        className={`${sizes[size]} bg-gradient-to-r from-primary-500 via-secondary-500 to-beauty-hot-pink rounded-full flex items-center justify-center shadow-rose-gold-glow`}
      >
        <SparklesIcon className="w-1/2 h-1/2 text-white" />
      </motion.div>
      {text && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-beauty-cream via-beauty-lavender to-beauty-mint flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

interface BCSkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card'
  width?: string
  height?: string
  count?: number
}

export const BCSkeleton = ({
  variant = 'text',
  width,
  height,
  count = 1
}: BCSkeletonProps) => {
  const variants = {
    text: 'h-4 rounded-lg',
    circle: 'rounded-full aspect-square',
    rect: 'rounded-2xl',
    card: 'h-64 rounded-3xl'
  }

  const skeletons = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      animate={{
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 ${variants[variant]}`}
      style={{ width, height }}
    />
  ))

  return count > 1 ? (
    <div className="space-y-3">{skeletons}</div>
  ) : (
    skeletons[0]
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface BCEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'search' | 'calendar' | 'favorites'
}

export const BCEmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default'
}: BCEmptyStateProps) => {
  const defaultIcons = {
    default: <SparklesIcon className="w-20 h-20 text-gray-300" />,
    search: <MagnifyingGlassIcon className="w-20 h-20 text-gray-300" />,
    calendar: <CalendarIcon className="w-20 h-20 text-gray-300" />,
    favorites: <HeartIcon className="w-20 h-20 text-gray-300" />
  }

  const displayIcon = icon || defaultIcons[variant]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl"
      >
        {displayIcon}
      </motion.div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

      {description && (
        <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      )}

      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 via-secondary-500 to-beauty-hot-pink text-white font-bold rounded-2xl shadow-beauty-soft hover:shadow-rose-gold-glow transition-all"
        >
          {action.label}
        </motion.button>
      )}
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

interface BCErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  onGoBack?: () => void
}

export const BCErrorState = ({
  title = 'Oops! Something went wrong',
  message,
  onRetry,
  onGoBack
}: BCErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, -10, 10, -10, 0] }}
        transition={{
          scale: { type: 'spring', duration: 0.5 },
          rotate: { duration: 0.5, delay: 0.3 }
        }}
        className="mb-6 p-6 bg-gradient-to-br from-red-50 to-beauty-coral/30 rounded-3xl"
      >
        <FaceFrownIcon className="w-20 h-20 text-red-500" />
      </motion.div>

      <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-beauty-hot-pink bg-clip-text text-transparent mb-2">
        {title}
      </h3>

      <p className="text-gray-600 mb-6 max-w-md">{message}</p>

      <div className="flex gap-3">
        {onGoBack && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGoBack}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all"
          >
            Go Back
          </motion.button>
        )}
        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-2xl shadow-beauty-soft hover:shadow-rose-gold-glow transition-all"
          >
            Try Again
          </motion.button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// SUCCESS STATE
// ============================================================================

interface BCSuccessStateProps {
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const BCSuccessState = ({
  title,
  message,
  action
}: BCSuccessStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.6, times: [0, 0.6, 1] }}
        className="mb-6 p-6 bg-gradient-to-br from-green-50 to-beauty-mint/50 rounded-3xl shadow-mint-fresh"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <SparklesIcon className="w-20 h-20 text-green-600" />
        </motion.div>
      </motion.div>

      <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-beauty-lime-green bg-clip-text text-transparent mb-2">
        {title}
      </h3>

      {message && (
        <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      )}

      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-green-500 via-beauty-lime-green to-beauty-mint text-white font-bold rounded-2xl shadow-mint-fresh transition-all"
        >
          {action.label}
        </motion.button>
      )}
    </div>
  )
}

// Export all
export default {
  Loading: BCLoading,
  Skeleton: BCSkeleton,
  EmptyState: BCEmptyState,
  ErrorState: BCErrorState,
  SuccessState: BCSuccessState
}
