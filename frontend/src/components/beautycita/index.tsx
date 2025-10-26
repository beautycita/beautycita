/**
 * BeautyCita Reusable UI Components
 * Standardized design system components
 *
 * Import everything from one place:
 * import { BCButton, BCInput, BCModal, ServiceCard, BCLoading } from '@/components/beautycita'
 */

import { motion } from 'framer-motion'
import { ReactNode, InputHTMLAttributes, ButtonHTMLAttributes } from 'react'

// Re-export all components from other files
export * from './cards'
export * from './feedback'
export * from './states'
export * from './Image'

// ============================================================================
// BUTTONS
// ============================================================================

interface BCButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'outline'
  children: ReactNode
  loading?: boolean
}

export const BCButton = ({
  variant = 'primary',
  children,
  loading,
  disabled,
  className = '',
  ...props
}: BCButtonProps) => {
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 via-secondary-500 to-beauty-hot-pink hover:shadow-rose-gold-glow',
    secondary: 'bg-gradient-to-r from-secondary-500 to-beauty-hot-pink hover:shadow-hot-pink-glow',
    success: 'bg-gradient-to-r from-green-500 via-beauty-lime-green to-beauty-mint hover:shadow-mint-fresh',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      className={`px-6 py-4 ${variants[variant]} text-white font-bold rounded-2xl shadow-beauty-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin">✨</span>
          Loading...
        </span>
      ) : children}
    </motion.button>
  )
}

// ============================================================================
// INPUT FIELDS
// ============================================================================

interface BCInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export const BCInput = ({
  label,
  error,
  icon,
  className = '',
  ...props
}: BCInputProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500">
            {icon}
          </div>
        )}
        <input
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-all shadow-sm hover:shadow-beauty-soft font-medium ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

// ============================================================================
// CARDS
// ============================================================================

interface BCCardProps {
  children: ReactNode
  className?: string
  glassmorphism?: boolean
}

export const BCCard = ({
  children,
  className = '',
  glassmorphism = true
}: BCCardProps) => {
  const baseClasses = glassmorphism
    ? 'bg-white/90 backdrop-blur-md shadow-glass-beauty border border-beauty-lilac/20'
    : 'bg-white shadow-beauty-soft'

  return (
    <div className={`${baseClasses} rounded-3xl p-8 md:p-12 ${className}`}>
      {children}
    </div>
  )
}

// ============================================================================
// ICON CONTAINERS
// ============================================================================

interface BCIconContainerProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

export const BCIconContainer = ({
  children,
  variant = 'primary',
  size = 'md'
}: BCIconContainerProps) => {
  const variants = {
    primary: 'from-primary-100 to-secondary-100 shadow-beauty-soft',
    secondary: 'from-secondary-100 to-beauty-peach shadow-peach-glow',
    success: 'from-green-100 to-beauty-mint shadow-mint-fresh'
  }

  const sizes = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  }

  return (
    <div className={`inline-block ${sizes[size]} bg-gradient-to-br ${variants[variant]} rounded-3xl`}>
      {children}
    </div>
  )
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

interface BCProgressProps {
  value: number
  max?: number
  className?: string
}

export const BCProgress = ({
  value,
  max = 100,
  className = ''
}: BCProgressProps) => {
  const percentage = (value / max) * 100

  return (
    <div className={`h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-beauty-hot-pink shadow-rose-gold-glow"
      />
    </div>
  )
}

// ============================================================================
// GRADIENT TEXT
// ============================================================================

interface BCGradientTextProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'hot'
  className?: string
}

export const BCGradientText = ({
  children,
  variant = 'primary',
  className = ''
}: BCGradientTextProps) => {
  const variants = {
    primary: 'from-primary-600 to-secondary-600',
    secondary: 'from-secondary-600 to-beauty-hot-pink',
    success: 'from-green-600 to-beauty-lime-green',
    hot: 'from-beauty-hot-pink to-beauty-electric-purple'
  }

  return (
    <span className={`bg-gradient-to-r ${variants[variant]} bg-clip-text text-transparent font-bold ${className}`}>
      {children}
    </span>
  )
}

// ============================================================================
// PAGE CONTAINER
// ============================================================================

interface BCPageContainerProps {
  children: ReactNode
  header?: ReactNode
  className?: string
}

export const BCPageContainer = ({
  children,
  header,
  className = ''
}: BCPageContainerProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-beauty-cream via-beauty-lavender to-beauty-mint">
      {header && (
        <div className="bg-white/80 backdrop-blur-sm border-b border-beauty-lilac/30 sticky top-0 z-10 shadow-beauty-soft">
          {header}
        </div>
      )}
      <div className={`max-w-4xl mx-auto px-4 py-8 ${className}`}>
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// AVATAR GRID
// ============================================================================

interface BCAvatarGridProps {
  avatars: string[]
  selected: string | null
  onSelect: (avatar: string) => void
}

export const BCAvatarGrid = ({ avatars, selected, onSelect }: BCAvatarGridProps) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {avatars.map((avatar, idx) => (
        <motion.button
          key={idx}
          type="button"
          onClick={() => onSelect(avatar)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`aspect-square rounded-3xl overflow-hidden border-4 transition-all ${
            selected === avatar
              ? 'border-primary-500 scale-105 shadow-electric-purple-glow'
              : 'border-gray-200 hover:border-primary-300 shadow-sm'
          }`}
        >
          <img loading="lazy" src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
        </motion.button>
      ))}
    </div>
  )
}

// ============================================================================
// DIVIDER
// ============================================================================

export const BCDivider = ({ text }: { text?: string }) => {
  return (
    <div className="relative py-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t-2 border-gray-200"></div>
      </div>
      {text && (
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500 font-semibold">{text}</span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  Button: BCButton,
  Input: BCInput,
  Card: BCCard,
  IconContainer: BCIconContainer,
  Progress: BCProgress,
  GradientText: BCGradientText,
  PageContainer: BCPageContainer,
  AvatarGrid: BCAvatarGrid,
  Divider: BCDivider
}
