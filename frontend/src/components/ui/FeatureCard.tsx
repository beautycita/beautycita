import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  gradient?: string
  isDarkMode?: boolean
  index?: number
}

export default function FeatureCard({
  icon,
  title,
  description,
  gradient = 'from-pink-500 to-purple-600',
  isDarkMode = false,
  index = 0
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className={`p-6 rounded-3xl text-center ${
        isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white shadow-lg hover:shadow-xl'
      } transition-all`}
    >
      <motion.div
        className={`inline-flex p-4 rounded-3xl bg-gradient-to-br ${gradient} mb-4`}
        whileHover={{ rotate: 5 }}
      >
        <div className="h-8 w-8 text-white">{icon}</div>
      </motion.div>

      <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>

      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {description}
      </p>
    </motion.div>
  )
}
