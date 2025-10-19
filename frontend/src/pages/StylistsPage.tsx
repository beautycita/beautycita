import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
  HeartIcon,
  UserCircleIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { bookingService, type Stylist } from '../services/bookingService'
import toast from 'react-hot-toast'
import LocationPermission from '../components/LocationPermission'
import useGeolocation from '../hooks/useGeolocation'
import { sortByDistance, formatDistance, getDistanceStyle, isValidCoordinates } from '../utils/distance'
import { PageHero, GradientCard } from '../components/ui'
import { useTranslation } from 'react-i18next'

export default function StylistsPage() {
  const { t } = useTranslation()

  const specialtyOptions = [
    t('stylists.page.specialties.haircut'),
    t('stylists.page.specialties.coloring'),
    t('stylists.page.specialties.hairstyling'),
    t('stylists.page.specialties.manicure'),
    t('stylists.page.specialties.pedicure'),
    t('stylists.page.specialties.makeup'),
    t('stylists.page.specialties.brows'),
    t('stylists.page.specialties.extensions'),
    t('stylists.page.specialties.treatments')
  ]

  const sortOptions = [
    { value: 'distance', label: t('stylists.page.sort.nearest') },
    { value: 'rating', label: t('stylists.page.sort.topRated') },
    { value: 'reviews', label: t('stylists.page.sort.mostReviews') },
    { value: 'experience', label: t('stylists.page.sort.mostExperience') },
    { value: 'name', label: t('stylists.page.sort.nameAZ') }
  ]

  const [stylists, setStylists] = useState<Stylist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [showLocationPrompt, setShowLocationPrompt] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const { latitude, longitude, permission } = useGeolocation()

  // Check dark mode
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)

    const handleStorageChange = () => {
      const newDarkMode = localStorage.getItem('darkMode') === 'true'
      setIsDarkMode(newDarkMode)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Handle location updates
  useEffect(() => {
    if (isValidCoordinates(latitude, longitude)) {
      setUserLocation({ latitude: latitude!, longitude: longitude! })
      setShowLocationPrompt(false)

      // Auto-sort by distance when location is available on mobile
      if (isMobile && sortBy === 'rating') {
        setSortBy('distance')
      }
    }
  }, [latitude, longitude, isMobile, sortBy])

  useEffect(() => {
    loadStylists()
  }, [])

  const loadStylists = async () => {
    try {
      setLoading(true)
      const response = await bookingService.getStylists()

      if (response.success && response.data) {
        setStylists(response.data)
      } else {
        toast.error(t('stylists.page.loadError'))
      }
    } catch (error) {
      console.error('Error loading stylists:', error)
      toast.error(t('stylists.page.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedStylists = (() => {
    let filtered = stylists.filter(stylist => {
      const searchTerm = searchQuery.toLowerCase()
      const matchesSearch =
        stylist.business_name.toLowerCase().includes(searchTerm) ||
        stylist.location_city.toLowerCase().includes(searchTerm) ||
        stylist.specialties.some(specialty => specialty.toLowerCase().includes(searchTerm))

      const matchesSpecialties =
        selectedSpecialties.length === 0 ||
        selectedSpecialties.some(specialty => stylist.specialties.includes(specialty))

      return matchesSearch && matchesSpecialties
    })

    // Apply distance sorting if location is available and distance sort is selected
    if (sortBy === 'distance' && userLocation) {
      // Enhance stylists with distance data and sort
      return sortByDistance(filtered, userLocation)
    }

    // Apply regular sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return parseFloat(b.rating_average.toString()) - parseFloat(a.rating_average.toString())
        case 'reviews':
          return b.rating_count - a.rating_count
        case 'experience':
          return b.experience_years - a.experience_years
        case 'name':
          return a.business_name.localeCompare(b.business_name)
        default:
          return 0
      }
    })
  })()

  const toggleFavorite = (stylistId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(stylistId)) {
        newFavorites.delete(stylistId)
        // toast.success('Eliminado de favoritos') // Removed: icon change is enough
      } else {
        newFavorites.add(stylistId)
        // toast.success('Agregado a favoritos') // Removed: icon change is enough
      }
      return newFavorites
    })
  }

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    )
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="rounded-full h-12 w-12 border-4 border-t-pink-500 border-r-purple-500 border-b-blue-500 border-l-transparent"
        />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section with Search */}
      <PageHero
        title={t('stylists.page.hero.title')}
        subtitle={t('stylists.page.hero.subtitle')}
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-96"
      >
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder={t('stylists.page.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-14 pr-6 py-4 rounded-full focus:outline-none focus:ring-4 shadow-xl text-lg ${
                isDarkMode
                  ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-purple-500/50'
                  : 'bg-white text-gray-900 placeholder-gray-400 focus:ring-white/30'
              }`}
            />
          </div>
        </div>
      </PageHero>

      <div className="container mx-auto px-4 max-w-7xl py-12">
        {/* Filter Bar */}
        <div className="mb-8 space-y-4">

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all ${
                showFilters
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              <span>{t('stylists.page.filters')}</span>
              {selectedSpecialties.length > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  showFilters ? 'bg-white/20' : 'bg-pink-100 text-pink-800'
                }`}>
                  {selectedSpecialties.length}
                </span>
              )}
            </button>

            <div className="flex items-center space-x-4">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredAndSortedStylists.length} {t('stylists.page.stylistsFound')}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`border rounded-3xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {sortOptions.map((option) => {
                  if (option.value === 'distance' && !userLocation) {
                    return null
                  }
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-full p-6 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
            >
              <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('stylists.page.specialtiesLabel')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map((specialty) => (
                  <motion.button
                    key={specialty}
                    onClick={() => toggleSpecialty(specialty)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 text-sm rounded-full border transition-all ${
                      selectedSpecialties.includes(specialty)
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-lg'
                        : isDarkMode
                          ? 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-700'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {specialty}
                  </motion.button>
                ))}
              </div>
              {selectedSpecialties.length > 0 && (
                <button
                  onClick={() => setSelectedSpecialties([])}
                  className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  {t('stylists.page.clearFilters')}
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Stylists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedStylists.map((stylist, index) => (
            <motion.div
              key={stylist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GradientCard
                gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10"
                isDarkMode={isDarkMode}
                hoverable={true}
                className="h-full"
              >
                {/* Profile Image */}
                <div className="relative mb-4">
                  {stylist.profile_picture_url ? (
                    <div className="aspect-square rounded-full overflow-hidden">
                      <img
                        src={stylist.profile_picture_url}
                        alt={t('stylists.page.profileImageAlt', { name: stylist.business_name })}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 flex items-center justify-center">
                      <UserCircleIcon className="w-24 h-24 text-white" />
                    </div>
                  )}
                  <button
                    onClick={() => toggleFavorite(stylist.id)}
                    className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/40 transition-colors"
                  >
                    {favorites.has(stylist.id) ? (
                      <HeartSolidIcon className="w-6 h-6 text-red-500" />
                    ) : (
                      <HeartIcon className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>

                {/* Name & Rating */}
                <h3 className={`text-xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stylist.business_name}
                </h3>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className={`ml-1 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {parseFloat(stylist.rating_average.toString()).toFixed(1)}
                    </span>
                  </div>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>•</span>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stylist.rating_count} {t('stylists.page.reviews')}
                  </span>
                </div>

                {/* Location with Distance */}
                <div className="flex items-center space-x-2 mb-3">
                  <MapPinIcon className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stylist.location_city}, {stylist.location_state}
                  </span>
                  {isMobile && userLocation && (stylist as any).distance !== undefined && (stylist as any).distance !== Infinity && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDistanceStyle((stylist as any).distance).bgColor} ${getDistanceStyle((stylist as any).distance).textColor}`}>
                      {(stylist as any).formattedDistance || formatDistance((stylist as any).distance)}
                    </div>
                  )}
                </div>

                {/* Bio */}
                {stylist.bio && (
                  <p className={`text-sm mb-4 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {stylist.bio}
                  </p>
                )}

                {/* Specialties */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {stylist.specialties.slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex px-3 py-1 text-xs font-medium bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                  {stylist.specialties.length > 3 && (
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                      isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      +{stylist.specialties.length - 3} {t('stylists.page.more')}
                    </span>
                  )}
                </div>

                {/* Experience */}
                <div className="flex items-center space-x-2 mb-4">
                  <ClockIcon className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stylist.experience_years} {t('stylists.page.yearsExperience')}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link
                    to={`/stylist/${stylist.id}`}
                    className={`flex-1 px-4 py-2 rounded-full font-medium text-center transition-all border ${
                      isDarkMode
                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t('stylists.page.viewProfile')}
                  </Link>
                  <Link
                    to={`/stylist/${stylist.id}#services`}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium text-center hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    {t('stylists.page.bookAction')}
                  </Link>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedStylists.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">💇</div>
            <h3 className={`text-2xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('stylists.page.noResults')}
            </h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('stylists.page.noResultsDesc')}
            </p>
            <motion.button
              onClick={() => {
                setSearchQuery('')
                setSelectedSpecialties([])
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {t('stylists.page.clearFilters')}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Location Permission Component */}
      {isMobile && showLocationPrompt && permission !== 'granted' && (
        <LocationPermission
          onLocationGranted={(location) => {
            setUserLocation(location)
            setShowLocationPrompt(false)

            // Auto-switch to distance sorting when location is granted
            if (sortBy === 'rating') {
              setSortBy('distance')
              toast.success(t('stylists.page.locationEnabled'))
            }
          }}
          onLocationDenied={() => {
            setShowLocationPrompt(false)
            setUserLocation(null)
          }}
          showOnlyOnMobile={true}
        />
      )}
    </div>
  )
}