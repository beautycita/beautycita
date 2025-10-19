/**
 * BeautyCita Feedback Components
 * Modals, alerts, badges, notifications
 */

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode, Fragment } from 'react'
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  SparklesIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'

// ============================================================================
// MODAL
// ============================================================================

interface BCModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export const BCModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}: BCModalProps) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }

  return (
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className={`${sizes[size]} w-full transform overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md p-8 shadow-glass-beauty border border-beauty-lilac/20 transition-all`}>
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between mb-6">
                    {title && (
                      <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        {title}
                      </Dialog.Title>
                    )}
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// ============================================================================
// ALERT
// ============================================================================

interface BCAlertProps {
  variant: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export const BCAlert = ({
  variant,
  title,
  message,
  onClose,
  action
}: BCAlertProps) => {
  const config = {
    success: {
      icon: <CheckCircleIcon className="w-6 h-6" />,
      gradient: 'from-green-500 to-beauty-lime-green',
      bg: 'from-green-50 to-beauty-mint/30',
      iconColor: 'text-green-600',
      textColor: 'text-green-900'
    },
    error: {
      icon: <XCircleIcon className="w-6 h-6" />,
      gradient: 'from-red-500 to-beauty-hot-pink',
      bg: 'from-red-50 to-beauty-coral/30',
      iconColor: 'text-red-600',
      textColor: 'text-red-900'
    },
    warning: {
      icon: <ExclamationTriangleIcon className="w-6 h-6" />,
      gradient: 'from-beauty-sunset-orange to-beauty-peach',
      bg: 'from-orange-50 to-beauty-peach/30',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-900'
    },
    info: {
      icon: <InformationCircleIcon className="w-6 h-6" />,
      gradient: 'from-primary-500 to-secondary-500',
      bg: 'from-primary-50 to-secondary-50',
      iconColor: 'text-primary-600',
      textColor: 'text-primary-900'
    }
  }

  const { icon, gradient, bg, iconColor, textColor } = config[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gradient-to-r ${bg} border-2 border-${variant === 'success' ? 'green' : variant === 'error' ? 'red' : variant === 'warning' ? 'orange' : 'primary'}-200 rounded-2xl p-4 shadow-beauty-soft`}
    >
      <div className="flex items-start gap-3">
        <div className={`${iconColor} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className={`font-bold ${textColor} mb-1`}>{title}</h4>
          )}
          <p className="text-sm text-gray-700">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 px-4 py-2 bg-gradient-to-r ${gradient} text-white text-sm font-bold rounded-full hover:shadow-rose-gold-glow transition-all`}
            >
              {action.label}
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/50 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// BADGE
// ============================================================================

interface BCBadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  dot?: boolean
  pulse?: boolean
}

export const BCBadge = ({
  variant = 'primary',
  size = 'md',
  children,
  dot,
  pulse
}: BCBadgeProps) => {
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white',
    secondary: 'bg-gradient-to-r from-secondary-500 to-beauty-hot-pink text-white',
    success: 'bg-gradient-to-r from-green-500 to-beauty-lime-green text-white',
    warning: 'bg-gradient-to-r from-beauty-sunset-orange to-beauty-peach text-white',
    error: 'bg-gradient-to-r from-red-500 to-beauty-hot-pink text-white',
    info: 'bg-primary-50 text-primary-700 border border-primary-200'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${variants[variant]} ${sizes[size]} font-bold rounded-full shadow-sm`}>
      {dot && (
        <span className={`w-2 h-2 rounded-full bg-white ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  )
}

// ============================================================================
// NOTIFICATION BADGE (number)
// ============================================================================

interface BCNotificationBadgeProps {
  count: number
  max?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  children: ReactNode
}

export const BCNotificationBadge = ({
  count,
  max = 99,
  position = 'top-right',
  children
}: BCNotificationBadgeProps) => {
  const positions = {
    'top-right': '-top-2 -right-2',
    'top-left': '-top-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
    'bottom-left': '-bottom-2 -left-2'
  }

  const displayCount = count > max ? `${max}+` : count

  if (count === 0) return <>{children}</>

  return (
    <div className="relative inline-block">
      {children}
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`absolute ${positions[position]} flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-beauty-hot-pink to-beauty-electric-purple text-white text-xs font-bold rounded-full shadow-hot-pink-glow`}
      >
        {displayCount}
      </motion.span>
    </div>
  )
}

// ============================================================================
// STATUS DOT
// ============================================================================

interface BCStatusDotProps {
  status: 'online' | 'offline' | 'busy' | 'away'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

export const BCStatusDot = ({
  status,
  size = 'md',
  pulse = true
}: BCStatusDotProps) => {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-beauty-sunset-orange'
  }

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <span className="relative inline-flex">
      <span className={`${sizes[size]} ${statusColors[status]} rounded-full ${pulse ? 'animate-ping absolute opacity-75' : ''}`} />
      <span className={`${sizes[size]} ${statusColors[status]} rounded-full relative`} />
    </span>
  )
}

// ============================================================================
// TOAST NOTIFICATION (custom, use with react-hot-toast)
// ============================================================================

interface BCToastProps {
  variant: 'success' | 'error' | 'info'
  message: string
  description?: string
}

export const BCToast = ({
  variant,
  message,
  description
}: BCToastProps) => {
  const config = {
    success: {
      icon: <CheckCircleIcon className="w-6 h-6 text-green-600" />,
      bg: 'from-green-50 to-beauty-mint/50',
      border: 'border-green-200'
    },
    error: {
      icon: <XCircleIcon className="w-6 h-6 text-red-600" />,
      bg: 'from-red-50 to-beauty-coral/50',
      border: 'border-red-200'
    },
    info: {
      icon: <SparklesIcon className="w-6 h-6 text-primary-600 animate-sparkle" />,
      bg: 'from-primary-50 to-secondary-50',
      border: 'border-primary-200'
    }
  }

  const { icon, bg, border } = config[variant]

  return (
    <div className={`bg-gradient-to-r ${bg} border-2 ${border} rounded-2xl p-4 shadow-beauty-soft backdrop-blur-md max-w-md`}>
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1">
          <p className="font-bold text-gray-900">{message}</p>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Export all
export default {
  Modal: BCModal,
  Alert: BCAlert,
  Badge: BCBadge,
  NotificationBadge: BCNotificationBadge,
  StatusDot: BCStatusDot,
  Toast: BCToast
}
