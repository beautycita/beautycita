import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GradientCardProps {
  children: ReactNode
  gradient?: string
  className?: string
  isDarkMode?: boolean
  hoverable?: boolean
  delay?: number
}

export default function GradientCard({
  children,
  gradient,
  className = '',
  isDarkMode = false,
  hoverable = true,
  delay = 0
}: GradientCardProps) {
  const baseClasses = isDarkMode
    ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
    : 'bg-white shadow-lg border border-gray-100'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={hoverable ? { y: -5, scale: 1.02 } : {}}
      className={`relative rounded-2xl overflow-hidden ${baseClasses} ${className}`}
    >
      {gradient && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      )}

      <div className="relative z-10 p-6 md:p-8">
        {children}
      </div>
    </motion.div>
  )
}
