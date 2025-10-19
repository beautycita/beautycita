import { motion } from 'framer-motion'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

interface ServiceCardProps {
  name: string
  icon: string
  price: string
  gradient: string
  size: 'small' | 'medium' | 'large'
  index: number
  isDarkMode?: boolean
}

export default function ServiceCard({
  name,
  icon,
  price,
  gradient,
  size,
  index,
  isDarkMode = false
}: ServiceCardProps) {
  const sizeClasses = {
    large: 'col-span-6 md:col-span-3 min-h-[250px]',
    medium: 'col-span-3 md:col-span-2 min-h-[200px]',
    small: 'col-span-3 md:col-span-2 min-h-[180px]'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.03, y: -5 }}
      className={`
        ${sizeClasses[size]}
        relative group cursor-pointer rounded-3xl overflow-hidden
        transition-all duration-300
      `}
      style={{
        background: isDarkMode
          ? `linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(31,41,55,0.8) 100%)`
          : `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.9) 100%)`
      }}
    >
      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
      />

      {/* Content */}
      <div className="relative p-6 h-full flex flex-col justify-between">
        <div>
          <motion.div
            className="text-5xl mb-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {icon}
          </motion.div>
          <h3 className={`text-xl md:text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {name}
          </h3>
        </div>

        <div>
          <div className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>
            {price}
          </div>
          <div className={`inline-flex items-center text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          } group-hover:text-pink-500 transition-colors`}>
            Book Now
            <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}