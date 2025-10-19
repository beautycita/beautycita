import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface CTASectionProps {
  title: string
  description: string
  primaryAction?: {
    label: string
    to: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    to: string
    onClick?: () => void
  }
  gradient?: string
  icon?: ReactNode
  children?: ReactNode
}

export default function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
  gradient = 'from-pink-600 via-purple-600 to-blue-600',
  icon,
  children
}: CTASectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className={`bg-gradient-to-r ${gradient} rounded-3xl p-8 md:p-12 text-white text-center`}
    >
      {icon && (
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-block mb-6"
        >
          {icon}
        </motion.div>
      )}

      <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
        {title}
      </h2>

      <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
        {description}
      </p>

      {(primaryAction || secondaryAction || children) && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {primaryAction && (
            <Link
              to={primaryAction.to}
              onClick={primaryAction.onClick}
              className="btn btn-primary btn-lg rounded-full"
            >
              {primaryAction.label}
            </Link>
          )}

          {secondaryAction && (
            <Link
              to={secondaryAction.to}
              onClick={secondaryAction.onClick}
              className="btn btn-outline btn-lg rounded-full"
            >
              {secondaryAction.label}
            </Link>
          )}

          {children}
        </div>
      )}
    </motion.div>
  )
}
