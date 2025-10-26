import { motion } from 'framer-motion'
import { StarIcon } from '@heroicons/react/24/outline'

interface TestimonialCardProps {
  name: string
  avatar: string
  rating: number
  text: string
  role: string
  index: number
  isDarkMode?: boolean
}

export default function TestimonialCard({
  name,
  avatar,
  rating,
  text,
  role,
  index,
  isDarkMode = false
}: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className={`p-8 rounded-3xl transition-all ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700'
          : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-pink-100'
      }`}
    >
      <div className="flex items-center mb-4">
        <img loading="lazy"
          src={avatar}
          alt={name}
          className="w-16 h-16 rounded-full border-4 border-pink-500 mr-4"
        />
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {name}
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {role}
          </p>
        </div>
      </div>

      <div className="flex mb-3">
        {[...Array(rating)].map((_, i) => (
          <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
        ))}
      </div>

      <p className={`italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        "{text}"
      </p>
    </motion.div>
  )
}