import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  StarIcon,
  HeartIcon,
  CalendarDaysIcon,
  CheckIcon,
  UserGroupIcon,
  ScissorsIcon,
  BeakerIcon,
  PaintBrushIcon,
  EyeIcon,
  HandRaisedIcon,
  CakeIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import axios from 'axios'
import toast from 'react-hot-toast'
import { GradientCard, PageHero } from '../components/ui'

interface Service {
  id: string
  name: string
  description: string
  category: string
  price: string
  duration_minutes: number | string
  stylist_count: number
  location_city: string
  location_state: string
  distance?: string
  rating?: number
  tags?: string[]
  isPopular?: boolean
  isNew?: boolean
}

export default function ServicesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(false)

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

  const categories = [
    { id: 'hair', name: t('services.categories.hair'), icon: ScissorsIcon, gradient: 'from-pink-400/20 to-purple-500/20' },
    { id: 'nails', name: t('services.categories.nails'), icon: HandRaisedIcon, gradient: 'from-pink-500/20 to-purple-400/20' },
    { id: 'skincare', name: t('services.categories.skincare'), icon: BeakerIcon, gradient: 'from-pink-600/20 to-purple-600/20' },
    { id: 'makeup', name: t('services.categories.makeup'), icon: PaintBrushIcon, gradient: 'from-pink-400/20 to-purple-400/20' },
    { id: 'lashes-brows', name: t('services.categories.lashesBrows'), icon: EyeIcon, gradient: 'from-pink-500/20 to-purple-500/20' },
    { id: 'massages', name: t('services.categories.massages'), icon: HandRaisedIcon, gradient: 'from-pink-600/20 to-purple-500/20' },
    { id: 'waxing', name: t('services.categories.waxing'), icon: SparklesIcon, gradient: 'from-pink-400/20 to-purple-600/20' },
    { id: 'special-occasions', name: t('services.categories.specialOccasions'), icon: CakeIcon, gradient: 'from-pink-600/20 to-purple-700/20' },
  ]

  const [services, setServices] = useState<Service[]>([])
  const [allServices, setAllServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [likedServices, setLikedServices] = useState<string[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [showingLocalOnly, setShowingLocalOnly] = useState(false)
  const [locationChecked, setLocationChecked] = useState(false)

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setLocationChecked(true)
        },
        (error) => {
          console.error('Error getting location:', error)
          setUserLocation(null)
          setLocationChecked(true)
        }
      )
    } else {
      setLocationChecked(true)
    }
  }, [])

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true)
      try {
        // First, try to fetch with location if available
        if (userLocation && !showingLocalOnly) {
          const params = new URLSearchParams()
          params.append('lat', userLocation.lat.toString())
          params.append('lng', userLocation.lng.toString())
          params.append('radius', '20')

          const response = await axios.get(`/api/services?${params.toString()}`)
          setServices(response.data.data || [])
          setShowingLocalOnly(true)
        } else {
          // Fetch all services without location filter
          const response = await axios.get('/api/services')
          setServices(response.data.data || [])
          setShowingLocalOnly(false)
        }

        // Always fetch total count for the button
        const allResponse = await axios.get('/api/services')
        setAllServices(allResponse.data.data || [])
      } catch (error) {
        console.error('Error fetching services:', error)
        toast.error('Failed to load services')
      } finally {
        setLoading(false)
      }
    }

    // Wait for location check to complete or timeout after 3 seconds
    if (!locationChecked) {
      const timer = setTimeout(() => {
        setLocationChecked(true)
      }, 3000)
      return () => clearTimeout(timer)
    }

    fetchServices()
  }, [userLocation, locationChecked])

  const handleShowAllServices = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/services')
      setServices(response.data.data || [])
      setShowingLocalOnly(false)
    } catch (error) {
      console.error('Error fetching all services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(service => {
    const serviceCategory = service.category.toLowerCase()
    let matchesCategory = selectedCategory === 'all' || !selectedCategory

    if (!matchesCategory) {
      // Map Spanish DB categories to English UI categories
      const categoryMap: Record<string, string[]> = {
        'hair': ['corte', 'coloración', 'peinados', 'hair', 'haircut', 'coloring', 'hairstyle', 'tratamientos'],
        'nails': ['uñas', 'nails', 'manicure', 'pedicure'],
        'skincare': ['facial', 'skincare', 'facials'],
        'makeup': ['maquillaje', 'makeup'],
        'lashes-brows': ['pestañas', 'cejas', 'lashes', 'brows', 'eyebrows'],
        'massages': ['masaje', 'massage', 'massages'],
        'special-occasions': ['bridal', 'eventos', 'events', 'special-occasions', 'wedding'],
        'waxing': ['waxing', 'depilación', 'hair-removal'],
      }

      const allowedCategories = categoryMap[selectedCategory] || [selectedCategory]
      matchesCategory = allowedCategories.some(cat => serviceCategory.includes(cat))
    }

    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         service.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const handleLikeService = (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLikedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleBookService = (serviceId: string) => {
    navigate('/stylists', { state: { selectedService: serviceId } })
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title={t('services.catalogTitle')}
        subtitle={t('services.catalogSubtitle')}
        gradient="from-pink-500 via-purple-500 to-blue-500"
        videoSrc="https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/banner2.mp4"
        isDarkMode={isDarkMode}
        height="h-96"
      >
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder={t('services.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-14 pr-6 py-4 rounded-3xl focus:outline-none focus:ring-4 shadow-xl text-lg ${
                isDarkMode
                  ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-purple-500/50'
                  : 'bg-white text-gray-900 placeholder-gray-400 focus:ring-purple-500/30'
              }`}
            />
          </div>
        </div>
      </PageHero>

      {/* Categories */}
      <section className={`border-b py-8 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className={`text-3xl md:text-4xl font-serif font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('services.browseByCategory')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {categories.map((category, index) => {
              const IconComponent = category.icon
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? 'all' : category.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-300 ${
                    selectedCategory === category.id
                      ? isDarkMode
                        ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-2 border-pink-400 shadow-lg shadow-pink-500/50'
                        : 'bg-gradient-to-br from-pink-500 to-purple-600 border-2 border-pink-400 shadow-lg shadow-purple-500/30'
                      : isDarkMode
                        ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                        : 'bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  {/* Content */}
                  <div className="flex flex-col items-center justify-center space-y-3">
                    {/* Icon */}
                    <div className={`p-3 rounded-2xl ${
                      selectedCategory === category.id
                        ? 'bg-white/20'
                        : isDarkMode
                          ? 'bg-gray-700/50'
                          : 'bg-gradient-to-br from-pink-50 to-purple-50'
                    } transition-colors duration-300`}>
                      <IconComponent className={`h-6 w-6 ${
                        selectedCategory === category.id
                          ? 'text-white'
                          : isDarkMode
                            ? 'text-gray-300'
                            : 'text-purple-600'
                      }`} />
                    </div>

                    {/* Category Name */}
                    <div className={`text-sm md:text-base font-semibold text-center leading-tight ${
                      selectedCategory === category.id
                        ? 'text-white'
                        : isDarkMode
                          ? 'text-white'
                          : 'text-gray-900'
                    }`}>
                      {category.name}
                    </div>

                    {/* Selected Indicator */}
                    {selectedCategory === category.id && (
                      <motion.div
                        layoutId="selected-category"
                        className="absolute top-3 right-3 bg-white/90 rounded-full p-1 shadow-sm"
                      >
                        <CheckIcon className="h-4 w-4 text-purple-600" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 max-w-7xl py-12">
        {loading ? (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="rounded-full h-16 w-16 border-4 border-t-pink-500 border-r-purple-500 border-b-blue-500 border-l-transparent mx-auto mb-4"
            />
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('services.loading')}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredServices.length > 0 ? (
              <motion.div
                key={selectedCategory + searchQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Results count */}
                <div className="mb-8 text-center">
                  <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('services.showingResults', {
                      count: filteredServices.length,
                      category: selectedCategory !== 'all' ? ` in ${categories.find(c => c.id === selectedCategory)?.name}` : ''
                    })}
                  </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <GradientCard
                        gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10"
                        isDarkMode={isDarkMode}
                        hoverable={true}
                        className="cursor-pointer h-full"
                      >
                        <div onClick={() => handleBookService(service.id)}>
                          {/* Service Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className={`text-2xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {service.name}
                              </h3>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                isDarkMode
                                  ? 'bg-gray-800 text-gray-300'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {service.category}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleLikeService(service.id, e)}
                              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              {likedServices.includes(service.id) ? (
                                <HeartIconSolid className="h-5 w-5 text-pink-500" />
                              ) : (
                                <HeartIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              )}
                            </button>
                          </div>

                          {/* Service Description */}
                          <p className={`mb-3 text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {service.description || t('services.fields.professionalService')}
                          </p>

                          {/* Service Details */}
                          <div className="space-y-2.5">
                            <div className="flex items-center space-x-3">
                              <CurrencyDollarIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <div className="flex-1">
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {t('services.fields.price')}
                                </p>
                                <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  ${service.price}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <ClockIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <div className="flex-1">
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {t('services.fields.duration')}
                                </p>
                                <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {service.duration_minutes} {t('services.fields.min')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <MapPinIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <div className="flex-1">
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {t('services.fields.location')}
                                </p>
                                <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {service.location_city}, {service.location_state}
                                </p>
                              </div>
                            </div>

                            {service.stylist_count > 0 && (
                              <div className="flex items-center space-x-3">
                                <UserGroupIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                <div className="flex-1">
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('services.fields.available')}
                                  </p>
                                  <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {service.stylist_count} {service.stylist_count === 1 ? t('services.fields.stylist') : t('services.fields.stylists')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Book Button */}
                          <button className="mt-5 w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-3xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2">
                            <CalendarDaysIcon className="h-5 w-5" />
                            <span>{t('services.book')}</span>
                          </button>
                        </div>
                      </GradientCard>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-20"
              >
                {showingLocalOnly && userLocation ? (
                  <>
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <MapPinIcon className={`h-10 w-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <h3 className={`text-2xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t('services.emptyStates.noStylistsNearby')}
                    </h3>
                    <p className={`mb-6 max-w-md mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('services.emptyStates.noStylistsDesc')}
                    </p>
                    <button
                      onClick={handleShowAllServices}
                      className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:from-pink-600 hover:to-purple-700 hover:scale-105"
                    >
                      {t('services.emptyStates.showAllServices', { count: allServices.length })}
                    </button>
                  </>
                ) : (
                  <>
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <MagnifyingGlassIcon className={`h-10 w-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    <h3 className={`text-2xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t('services.emptyStates.noServicesFound')}
                    </h3>
                    <p className={`mb-6 max-w-md mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('services.emptyStates.adjustFilters')}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory('all')
                        setSearchQuery('')
                      }}
                      className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:from-pink-600 hover:to-purple-700 hover:scale-105"
                    >
                      {t('services.emptyStates.clearFiltersBtn')}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </section>

    </div>
  )
}
