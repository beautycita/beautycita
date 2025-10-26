import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Link } from 'react-router-dom'
import {
  StarIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface FeaturedStylistsProps {
  isDarkMode: boolean
}

const stylists = [
  {
    id: 1,
    name: 'Luna Rodriguez',
    specialty: 'Hair Color Specialist',
    image: '/media/img/avatar/A0.png',
    rating: 4.9,
    reviews: 234,
    location: 'Downtown LA',
    verified: true,
    topRated: true,
    bio: 'Award-winning colorist specializing in balayage and creative color',
    price: '$120/hr'
  },
  {
    id: 2,
    name: 'Emma Chen',
    specialty: 'Nail Artist',
    image: '/media/img/avatar/A1.png',
    rating: 5.0,
    reviews: 189,
    location: 'Beverly Hills',
    verified: true,
    bio: 'Celebrity nail artist known for intricate designs',
    price: '$85/hr'
  },
  {
    id: 3,
    name: 'Sofia Martinez',
    specialty: 'Makeup Artist',
    image: '/media/img/avatar/A2.png',
    rating: 4.8,
    reviews: 312,
    location: 'Santa Monica',
    verified: true,
    bio: 'Bridal and special event makeup specialist',
    price: '$150/hr'
  },
  {
    id: 4,
    name: 'Isabella Kim',
    specialty: 'Lash Technician',
    image: '/media/img/avatar/A3.png',
    rating: 4.9,
    reviews: 156,
    location: 'Westwood',
    verified: true,
    topRated: true,
    bio: 'Master lash technician with 8+ years experience',
    price: '$95/hr'
  },
  {
    id: 5,
    name: 'Olivia Johnson',
    specialty: 'Skincare Expert',
    image: '/media/img/avatar/A4.png',
    rating: 4.9,
    reviews: 278,
    location: 'Pasadena',
    verified: true,
    bio: 'Licensed esthetician specializing in anti-aging treatments',
    price: '$110/hr'
  },
  {
    id: 6,
    name: 'Ava Williams',
    specialty: 'Brow Specialist',
    image: '/media/img/avatar/A5.png',
    rating: 4.8,
    reviews: 198,
    location: 'Venice Beach',
    verified: true,
    bio: 'Microblading and brow lamination expert',
    price: '$80/hr'
  }
]

export default function FeaturedStylists({ isDarkMode }: FeaturedStylistsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || !inView) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stylists.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, inView])

  const nextSlide = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % stylists.length)
  }

  const prevSlide = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + stylists.length) % stylists.length)
  }

  const getVisibleStylists = () => {
    const visible = []
    for (let i = 0; i < 3; i++) {
      visible.push(stylists[(currentIndex + i) % stylists.length])
    }
    return visible
  }

  return (
    <section className={`py-20 overflow-hidden ${
      isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-purple-50 to-pink-50'
    }`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <SparklesIcon className={`h-8 w-8 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'} mr-2`} />
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Featured Stylists
            </h2>
            <SparklesIcon className={`h-8 w-8 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'} ml-2`} />
          </div>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Meet our top-rated beauty professionals with stellar reviews
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div ref={ref} className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
              isDarkMode
                ? 'bg-gray-900/80 hover:bg-gray-900 text-white'
                : 'bg-white/80 hover:bg-white text-gray-900 shadow-lg'
            } backdrop-blur-sm`}
            aria-label="Previous stylist"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
              isDarkMode
                ? 'bg-gray-900/80 hover:bg-gray-900 text-white'
                : 'bg-white/80 hover:bg-white text-gray-900 shadow-lg'
            } backdrop-blur-sm`}
            aria-label="Next stylist"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>

          {/* Carousel Cards */}
          <div ref={carouselRef} className="flex gap-6 justify-center px-16">
            <AnimatePresence mode="popLayout">
              {getVisibleStylists().map((stylist, index) => (
                <motion.div
                  key={`${stylist.id}-${currentIndex}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8, x: 100 }}
                  animate={{
                    opacity: index === 1 ? 1 : 0.7,
                    scale: index === 1 ? 1 : 0.9,
                    x: 0,
                    zIndex: index === 1 ? 10 : 1
                  }}
                  exit={{ opacity: 0, scale: 0.8, x: -100 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
                  whileHover={{ scale: index === 1 ? 1.05 : 0.95 }}
                  className={`relative w-80 ${index === 1 ? 'z-10' : 'z-0'}`}
                >
                  <div className={`rounded-3xl overflow-hidden ${
                    isDarkMode
                      ? 'bg-gray-900 border border-gray-700'
                      : 'bg-white shadow-2xl'
                  } transform transition-all duration-300`}>
                    {/* 3D Card Tilt Effect */}
                    <div className="relative h-96 group">
                      {/* Image Container */}
                      <div className="relative h-64 overflow-hidden">
                        <img loading="lazy"
                          src={stylist.image}
                          alt={stylist.name}
                          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {stylist.topRated && (
                            <motion.div
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-3xl flex items-center"
                            >
                              <StarSolid className="h-3 w-3 mr-1" />
                              TOP RATED
                            </motion.div>
                          )}
                          {stylist.verified && (
                            <motion.div
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-3xl flex items-center"
                            >
                              <CheckBadgeIcon className="h-3 w-3 mr-1" />
                              VERIFIED
                            </motion.div>
                          )}
                        </div>

                        {/* Price Badge */}
                        <div className="absolute top-4 right-4">
                          <div className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 font-bold rounded-3xl">
                            {stylist.price}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 -mt-8 relative z-10">
                        {/* Profile Circle */}
                        <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden mb-4 mx-auto">
                          <img loading="lazy"
                            src={stylist.image}
                            alt={stylist.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <h3 className={`text-xl font-bold text-center mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {stylist.name}
                        </h3>
                        <p className={`text-sm text-center mb-3 ${
                          isDarkMode ? 'text-pink-400' : 'text-pink-600'
                        } font-medium`}>
                          {stylist.specialty}
                        </p>

                        <p className={`text-sm text-center mb-4 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {stylist.bio}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <StarSolid className="h-5 w-5 text-yellow-400 mr-1" />
                            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {stylist.rating}
                            </span>
                            <span className={`text-sm ml-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              ({stylist.reviews})
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPinIcon className={`h-4 w-4 mr-1 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`} />
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {stylist.location}
                            </span>
                          </div>
                        </div>

                        {/* Book Button */}
                        <Link
                          to={`/stylist/${stylist.id}`}
                          className={`block w-full py-3 text-center rounded-3xl font-medium transition-all transform hover:scale-105 ${
                            index === 1
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-pink-500/50'
                              : isDarkMode
                              ? 'bg-gray-800 text-white hover:bg-gray-700'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center mt-8 gap-2">
            {stylists.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false)
                  setCurrentIndex(index)
                }}
                className={`h-2 transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 bg-gradient-to-r from-pink-500 to-purple-600'
                    : `w-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`
                }`}
                aria-label={`Go to stylist ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}