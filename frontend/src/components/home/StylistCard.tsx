import { motion } from 'framer-motion'
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/outline'

interface StylistCardProps {
  name: string
  avatar: string
  rating: number
  reviews: number
  specialty: string
  price: string
  verified: boolean
  index: number
  isDarkMode?: boolean
}

export default function StylistCard({
  name,
  avatar,
  rating,
  reviews,
  specialty,
  price,
  verified,
  index,
  isDarkMode = false
}: StylistCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className={`relative group cursor-pointer rounded-3xl overflow-hidden ${
        isDarkMode ? 'bg-gray-800/50 backdrop-blur-xl' : 'bg-white shadow-xl'
      } transition-shadow hover:shadow-2xl`}
    >
      <div className="relative">
        <img
          src={avatar}
          alt={name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {verified && (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Verified
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </h3>
        <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {specialty}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className={`ml-1 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {rating}
            </span>
            <span className={`ml-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              ({reviews})
            </span>
          </div>
          <div className={`font-bold ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>
            {price}
          </div>
        </div>

        <button className="btn btn-primary w-full rounded-full">
          Book Now
        </button>
      </div>
    </motion.div>
  )
}