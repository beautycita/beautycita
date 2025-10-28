import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Link } from 'react-router-dom'
import {
  SparklesIcon,
  HeartIcon,
  StarIcon,
  CalendarDaysIcon,
  CameraIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline'
import { getMediaUrl } from '@/config/media'

interface BentoGridProps {
  isDarkMode: boolean
}

const services = [
  {
    id: 1,
    title: 'Hair Styling',
    description: 'Premium cuts, colors, and treatments',
    icon: SparklesIcon,
    image: getMediaUrl('img/avatar/A3.png'),
    price: 'From $45',
    gradient: 'from-pink-500 to-purple-600',
    size: 'large',
    trending: true
  },
  {
    id: 2,
    title: 'Nail Art',
    description: 'Manicure & pedicure perfection',
    icon: HeartIcon,
    image: getMediaUrl('img/avatar/A5.png'),
    price: 'From $30',
    gradient: 'from-purple-500 to-pink-600',
    size: 'medium'
  },
  {
    id: 3,
    title: 'Makeup',
    description: 'Professional artistry',
    icon: PaintBrushIcon,
    image: getMediaUrl('img/avatar/A7.png'),
    price: 'From $60',
    gradient: 'from-rose-500 to-pink-600',
    size: 'medium'
  },
  {
    id: 4,
    title: 'Skincare',
    description: 'Facials & treatments',
    icon: StarIcon,
    image: getMediaUrl('img/avatar/A9.png'),
    price: 'From $75',
    gradient: 'from-teal-500 to-blue-600',
    size: 'small'
  },
  {
    id: 5,
    title: 'Lashes',
    description: 'Extensions & lifts',
    icon: CameraIcon,
    image: getMediaUrl('img/avatar/A11.png'),
    price: 'From $80',
    gradient: 'from-purple-500 to-indigo-600',
    size: 'medium'
  },
  {
    id: 6,
    title: 'Book Now',
    description: 'Find your perfect stylist',
    icon: CalendarDaysIcon,
    gradient: 'from-amber-500 to-orange-600',
    size: 'small',
    isAction: true
  }
]

export default function BentoGrid({ isDarkMode }: BentoGridProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <section className={`py-20 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Services That
            <span className="block bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Transform You
            </span>
          </h2>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Discover our curated selection of beauty services, each delivered by verified professionals
          </p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px]">
          {services.map((service, index) => {
            const Icon = service.icon
            const gridClass = service.size === 'large'
              ? 'md:col-span-2 md:row-span-2'
              : service.size === 'medium'
              ? 'md:col-span-1 md:row-span-2'
              : 'md:col-span-1 md:row-span-1'

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className={`${gridClass} relative group cursor-pointer`}
              >
                {service.isAction ? (
                  <Link
                    to="/services"
                    className={`block h-full rounded-3xl bg-gradient-to-br ${service.gradient} p-6 flex flex-col items-center justify-center text-white overflow-hidden`}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 opacity-10"
                    >
                      <div className="h-full w-full bg-white/20 backdrop-blur-sm rounded-3xl transform scale-150" />
                    </motion.div>
                    <Icon className="h-12 w-12 mb-4 relative z-10" />
                    <h3 className="text-2xl font-bold mb-2 relative z-10">{service.title}</h3>
                    <p className="text-white/90 relative z-10">{service.description}</p>
                  </Link>
                ) : (
                  <div className={`h-full rounded-3xl overflow-hidden ${
                    isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-750'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100'
                  } shadow-lg hover:shadow-2xl transition-all duration-300`}>
                    {/* 3D Card Effect */}
                    <div className="h-full relative transform-gpu transition-transform duration-300 hover:rotate-y-5">
                      {/* Image Background */}
                      {service.image && (
                        <div className="absolute inset-0">
                          <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-80`} />
                          <img loading="lazy"
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover opacity-30"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="relative h-full p-6 flex flex-col justify-between">
                        {service.trending && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-3xl"
                          >
                            TRENDING
                          </motion.div>
                        )}

                        <div>
                          <div className={`inline-flex p-3 rounded-3xl bg-gradient-to-br ${service.gradient} mb-4`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <h3 className={`text-xl font-bold mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {service.title}
                          </h3>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {service.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <span className={`text-lg font-bold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent`}>
                            {service.price}
                          </span>
                          <motion.div
                            whileHover={{ x: 5 }}
                            className={`p-2 rounded-full ${
                              isDarkMode ? 'bg-gray-700' : 'bg-white'
                            }`}
                          >
                            <CalendarDaysIcon className={`h-5 w-5 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`} />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}