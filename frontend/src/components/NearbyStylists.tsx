import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface Stylist {
  id: number
  name: string
  business_name?: string
  specialties: string[]
  rating: number
  total_reviews: number
  price_range: string
  distance: number
  distance_unit: string
  profile_picture?: string
  verified: boolean
  available_now: boolean
  instagram_handle?: string
  address?: string
  city?: string
}

interface NearbyStylistsProps {
  hasLocation: boolean
  userLocation?: { latitude: number; longitude: number }
  onBookStylist?: (stylistId: number) => void
  className?: string
}

const NearbyStylists: React.FC<NearbyStylistsProps> = ({
  hasLocation,
  userLocation,
  onBookStylist,
  className = ''
}) => {
  const { t } = useTranslation()
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch nearby stylists when location is available
  useEffect(() => {
    if (hasLocation && userLocation) {
      fetchNearbyStylists()
    } else if (!hasLocation) {
      // Show popular stylists as fallback
      fetchPopularStylists()
    }
  }, [hasLocation, userLocation])

  const fetchNearbyStylists = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/stylists/nearby?lat=${userLocation?.latitude}&lng=${userLocation?.longitude}&limit=5`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch nearby stylists')
      }

      const data = await response.json()
      if (data.success) {
        setStylists(data.data.stylists)
      } else {
        throw new Error(data.error || 'Failed to fetch nearby stylists')
      }
    } catch (err) {
      console.error('Error fetching nearby stylists:', err)
      setError('Unable to load stylists at this time. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPopularStylists = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stylists/popular?limit=5', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch popular stylists')
      }

      const data = await response.json()
      if (data.success) {
        setStylists(data.data.stylists)
      } else {
        throw new Error(data.error || 'Failed to fetch popular stylists')
      }
    } catch (err) {
      console.error('Error fetching popular stylists:', err)
      setError('Unable to load popular stylists at this time. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <span key={index} className={index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  const renderPriceRange = (range: string) => {
    const dollars = range.length
    return (
      <span className="text-gray-600">
        <span className="text-green-600">{range}</span>
        <span className="text-gray-400">{'$'.repeat(4 - dollars)}</span>
      </span>
    )
  }

  if (loading) {
    return (
      <div className={`py-16 px-4 ${className}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {hasLocation ? 'Finding Stylists Near You...' : 'Loading Popular Stylists...'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-3xl mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`py-16 px-4 ${className}`}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  if (stylists.length === 0) {
    return null
  }

  return (
    <motion.section
      className={`py-16 px-4 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {hasLocation ? '✨ Stylists Near You' : '🌟 Popular Stylists'}
          </h2>
          {hasLocation && (
            <p className="text-gray-600">
              Found the closest beauty professionals in your area
            </p>
          )}
        </motion.div>

        {/* Stylists Grid - Horizontal scroll on mobile, grid on desktop */}
        <div
          ref={scrollRef}
          className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 snap-x snap-mandatory lg:snap-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {stylists.map((stylist, index) => (
            <motion.div
              key={stylist.id}
              className="flex-shrink-0 w-72 lg:w-auto snap-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
            >
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 h-full flex flex-col relative overflow-hidden group">
                {/* Distance Badge */}
                {hasLocation && stylist.distance > 0 && (
                  <motion.div
                    className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-3xl text-xs font-bold flex items-center gap-1 z-10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + 0.1 * index, type: 'spring' }}
                  >
                    <span>📍</span>
                    {stylist.distance.toFixed(1)} km
                  </motion.div>
                )}

                {/* Verified Badge */}
                {stylist.verified && (
                  <div className="absolute top-3 left-3 bg-blue-500 text-white p-1.5 rounded-3xl z-10">
                    <span className="text-xs">✓</span>
                  </div>
                )}

                {/* Enhanced Profile Picture with Fun Animations */}
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  {stylist.profile_picture ? (
                    <motion.div
                      className="relative w-full h-full"
                      initial={{ scale: 0.8, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        duration: 0.6,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        delay: 0.1 * index
                      }}
                    >
                      {/* Animated rainbow border ring */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 rounded-3xl p-1"
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{
                          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                      >
                        <div className="w-full h-full bg-white rounded-3xl p-0.5">
                          <img loading="lazy"
                            src={stylist.profile_picture}
                            alt={stylist.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </motion.div>

                      {/* Floating specialty emoji badge */}
                      <motion.div
                        className="absolute -top-1 -right-1 bg-white rounded-3xl w-7 h-7 flex items-center justify-center text-sm shadow-lg"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.3 + 0.1 * index,
                          type: "spring",
                          stiffness: 300
                        }}
                      >
                        {stylist.specialties[0]?.toLowerCase().includes('hair') ? '✂️' :
                         stylist.specialties[0]?.toLowerCase().includes('makeup') ? '💄' :
                         stylist.specialties[0]?.toLowerCase().includes('nail') ? '💅' :
                         stylist.specialties[0]?.toLowerCase().includes('men') ? '🪒' : '✨'}
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="w-full h-full rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center text-white text-3xl font-bold"
                      initial={{ scale: 0.8, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        duration: 0.6,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        delay: 0.1 * index
                      }}
                    >
                      {stylist.name.charAt(0)}
                    </motion.div>
                  )}

                  {/* Available status with pulse animation */}
                  {stylist.available_now && (
                    <motion.div
                      className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-3xl border-2 border-white"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </div>

                {/* Stylist Info */}
                <h3 className="text-lg font-bold text-gray-800 text-center mb-1">
                  {stylist.name}
                </h3>
                {stylist.business_name && (
                  <p className="text-sm text-gray-600 text-center mb-2">
                    {stylist.business_name}
                  </p>
                )}

                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mb-3">
                  <div className="flex">{renderStars(stylist.rating)}</div>
                  <span className="text-sm text-gray-600">
                    {stylist.rating} ({stylist.total_reviews})
                  </span>
                </div>

                {/* Specialties */}
                <div className="flex-1 mb-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {stylist.specialties.slice(0, 3).map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-3xl"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & Location */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-3 text-sm">
                    {renderPriceRange(stylist.price_range)}
                    {stylist.address && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{stylist.address}</span>
                      </>
                    )}
                  </div>
                  {stylist.instagram_handle && (
                    <p className="text-xs text-purple-600 mt-1">
                      {stylist.instagram_handle}
                    </p>
                  )}
                </div>

                {/* Book Button */}
                <motion.button
                  onClick={() => onBookStylist?.(stylist.id)}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-3xl hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                  whileTap={{ scale: 0.95 }}
                >
                  {stylist.available_now ? 'Book Now' : 'View Profile'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll Indicators for Mobile */}
        <div className="flex justify-center gap-2 mt-6 lg:hidden">
          {stylists.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-gray-300"
            />
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button className="px-8 py-3 border-2 border-purple-500 text-purple-600 font-bold rounded-full hover:bg-purple-50 transition-colors">
            View All Stylists →
          </button>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default NearbyStylists