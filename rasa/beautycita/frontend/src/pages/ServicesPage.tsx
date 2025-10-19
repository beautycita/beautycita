import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  Squares2X2Icon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'
import SwipeableCard from '@/components/mobile/SwipeableCard'
import ServiceCard from '@/components/ui/ServiceCard'
import PhoneVerificationModal from '@/components/auth/PhoneVerificationModal'
import { useBookingFlow } from '@/hooks/useBookingFlow'
import { useAuthStore } from '@/store/authStore'

export default function ServicesPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const {
    showPhoneVerification,
    checkAuthenticationForBooking,
    handlePhoneVerificationSuccess,
    closePhoneVerification
  } = useBookingFlow()

  // Mock services data with enhanced beauty focus
  const mockServices = [
    {
      id: '1',
      nameKey: 'trendyHaircut',
      price: 'Desde $350',
      rating: 4.8,
      tags: ['corte', 'peinado', 'moderno', 'urbano'],
      category: 'hair',
      duration: '90 min',
      isPopular: true,
      isNew: false
    },
    {
      id: '2',
      nameKey: 'rainbowColoring',
      price: 'Desde $800',
      rating: 4.9,
      tags: ['color', 'arcoiris', 'vibrante', 'degradado'],
      category: 'hair',
      duration: '3 horas',
      isPopular: true,
      isNew: false
    },
    {
      id: '3',
      nameKey: 'holographicManicure',
      price: 'Desde $250',
      rating: 4.7,
      tags: ['manicure', 'holográfico', 'brillante', 'único'],
      category: 'nails',
      duration: '60 min',
      isPopular: false,
      isNew: true
    },
    {
      id: '4',
      nameKey: 'editorialMakeup',
      price: 'Desde $500',
      rating: 4.9,
      tags: ['maquillaje', 'editorial', 'artístico', 'eventos'],
      category: 'makeup',
      duration: '2 horas',
      isPopular: true,
      isNew: false
    },
    {
      id: '5',
      nameKey: 'colorfulExtensions',
      price: 'Desde $600',
      rating: 4.6,
      tags: ['extensiones', 'color', 'longitud', 'calidad'],
      category: 'hair',
      duration: '2.5 horas',
      isPopular: false,
      isNew: false
    },
    {
      id: '6',
      nameKey: 'nailArt3D',
      price: 'Desde $400',
      rating: 4.8,
      tags: ['nail-art', '3d', 'diseños', 'arte'],
      category: 'nails',
      duration: '90 min',
      isPopular: false,
      isNew: true
    },
    {
      id: '7',
      nameKey: 'kBeautyFacial',
      price: 'Desde $450',
      rating: 4.9,
      tags: ['kbeauty', 'facial', 'skincare', 'coreano'],
      category: 'skincare',
      duration: '75 min',
      isPopular: true,
      isNew: true
    },
    {
      id: '8',
      nameKey: 'hdBrows',
      price: 'Desde $180',
      rating: 4.7,
      tags: ['cejas', 'definición', 'diseño', 'hd'],
      category: 'makeup',
      duration: '45 min',
      isPopular: true,
      isNew: false
    },
    {
      id: '9',
      nameKey: 'chromeMirror',
      price: 'Desde $320',
      rating: 4.8,
      tags: ['chrome', 'espejo', 'brillante', 'viral'],
      category: 'nails',
      duration: '75 min',
      isPopular: true,
      isNew: true
    }
  ]

  // Transform services to include localized data
  const services = mockServices.map(service => ({
    ...service,
    name: t(`services.serviceData.${service.nameKey}.name`),
    description: t(`services.serviceData.${service.nameKey}.description`)
  }))

  const categories = [
    { id: 'all', name: t('services.categories.all'), icon: SparklesIcon, color: 'neon-pink', emoji: '✨' },
    { id: 'hair', name: t('services.categories.hair'), icon: SparklesIcon, color: 'beauty-coral', emoji: '💇‍♀️' },
    { id: 'nails', name: t('services.categories.nails'), icon: SparklesIcon, color: 'beauty-mint', emoji: '💅' },
    { id: 'makeup', name: t('services.categories.makeup'), icon: SparklesIcon, color: 'beauty-lavender', emoji: '💄' },
    { id: 'skincare', name: t('services.categories.skincare'), icon: SparklesIcon, color: 'beauty-peach', emoji: '🌸' },
  ]
  const [servicesData, setServicesData] = useState(services)
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [likedServices, setLikedServices] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('swipe')
  const [isMobile, setIsMobile] = useState(true)

  const filteredServices = servicesData.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const currentService = filteredServices[currentServiceIndex]

  const handleSwipeLeft = () => {
    if (currentServiceIndex < filteredServices.length - 1) {
      setCurrentServiceIndex(prev => prev + 1)
    }
  }

  const handleSwipeRight = () => {
    if (currentService) {
      setLikedServices(prev => [...prev, currentService.id])
      if (currentServiceIndex < filteredServices.length - 1) {
        setCurrentServiceIndex(prev => prev + 1)
      }
    }
  }

  const handleServiceTap = () => {
    // Navigate to service detail page
    console.log('Navigate to service:', currentService?.id)
  }

  const handleLikeService = (serviceId: string) => {
    setLikedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleBookService = async (serviceId: string) => {
    const canProceed = await checkAuthenticationForBooking(serviceId)
    if (canProceed) {
      console.log('Proceeding to book service:', serviceId)
      // Navigate to actual booking page
      // navigate(`/booking/${serviceId}`)
    }
  }

  // Update services when language changes
  useEffect(() => {
    const localizedServices = mockServices.map(service => ({
      ...service,
      name: t(`services.serviceData.${service.nameKey}.name`),
      description: t(`services.serviceData.${service.nameKey}.description`)
    }))
    setServicesData(localizedServices)
  }, [t])

  // Responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setViewMode(mobile ? 'swipe' : 'grid')
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    setCurrentServiceIndex(0)
  }, [selectedCategory, searchQuery])

  return (
    <div className="min-h-screen bg-gradient-to-br from-beauty-blush/20 via-white to-beauty-lavender/20">
      {/* Header - Sticky for desktop */}
      <div className={`${!isMobile ? 'sticky top-0 z-40' : ''} bg-white/90 backdrop-blur-xl border-b border-beauty-blush/20`}>
        <div className="container-responsive py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-cotton-candy bg-clip-text text-transparent mb-2">
              {t('services.title')} ✨
            </h1>
            <p className="text-gray-600">
              {isMobile ? t('services.subtitle.mobile') : t('services.subtitle.desktop')}
            </p>
          </motion.div>

        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder={t('services.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-md text-gray-900 placeholder-gray-500 border border-beauty-blush/30 rounded-xl focus:ring-2 focus:ring-beauty-hot-pink focus:border-beauty-hot-pink shadow-beauty-soft"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="p-3 bg-white/90 backdrop-blur-md border border-beauty-blush/30 rounded-xl text-beauty-hot-pink hover:bg-beauty-blush/20 hover:shadow-beauty-soft transition-all duration-300"
          >
            <AdjustmentsHorizontalIcon className="h-6 w-6" />
          </motion.button>
        </div>

        {/* Category Filter */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-xl border transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-tiktok border-beauty-hot-pink text-white shadow-neon-pink'
                        : 'bg-white/90 backdrop-blur-md border-beauty-blush/30 text-gray-700 hover:bg-beauty-blush/20 hover:border-beauty-hot-pink/50'
                    }`}
                  >
                    <category.icon className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        </div>
      </div>

      {/* Main Content */}
      <div className="container-responsive py-8">
        {/* Mobile Swipe Interface */}
        {isMobile && (
          <div className="space-y-6">
            {/* Service Card */}
            <div className="flex justify-center items-center min-h-[400px]">
              {currentService ? (
                <SwipeableCard
                  item={currentService}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onTap={handleServiceTap}
                />
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-6xl">🎉</div>
                  <h3 className="text-xl font-bold bg-gradient-cotton-candy bg-clip-text text-transparent">
                    {t('services.completed.title')}
                  </h3>
                  <p className="text-gray-600">
                    {likedServices.length > 0
                      ? t('services.completed.withLikes', { count: likedServices.length })
                      : t('services.completed.tryFilters')
                    }
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCurrentServiceIndex(0)
                      setSelectedCategory('all')
                      setSearchQuery('')
                    }}
                    className="px-6 py-3 bg-gradient-tiktok text-white rounded-2xl font-medium hover:scale-105 transition-transform duration-300 shadow-neon-pink"
                  >
                    {t('services.completed.startOver')}
                  </motion.button>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            {filteredServices.length > 0 && (
              <div className="flex justify-center space-x-2">
                {filteredServices.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentServiceIndex
                        ? 'w-8 bg-neon-pink'
                        : index < currentServiceIndex
                        ? 'w-2 bg-beauty-cyber'
                        : 'w-2 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop Grid Interface */}
        {!isMobile && (
          <div className="space-y-8">
            {/* Services Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory + searchQuery}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredServices.length > 0 ? (
                  filteredServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    >
                      <ServiceCard
                        service={service}
                        onLike={handleLikeService}
                        onBook={handleBookService}
                        isLiked={likedServices.includes(service.id)}
                        className="h-full"
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="text-8xl"
                    >
                      🔍
                    </motion.div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold bg-gradient-cotton-candy bg-clip-text text-transparent">
                        {t('services.noResults.title')}
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {t('services.noResults.subtitle')}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedCategory('all')
                          setSearchQuery('')
                        }}
                        className="px-6 py-3 bg-gradient-tiktok text-white rounded-2xl font-medium hover:scale-105 transition-transform duration-300 shadow-neon-pink"
                      >
                        {t('services.noResults.viewAll')}
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Services Summary */}
            {filteredServices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-gray-600">
                  {t('services.summary', {
                    count: filteredServices.length,
                    plural: filteredServices.length !== 1 ? 's' : '',
                    category: selectedCategory !== 'all' ? ` en ${categories.find(c => c.id === selectedCategory)?.name}` : ''
                  })}
                </p>
              </motion.div>
            )}
          </div>
        )}

      </div>

      {/* Liked Services Count */}
      {likedServices.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed top-20 right-4 bg-gradient-tiktok text-white px-4 py-2 rounded-full shadow-neon-pink z-20"
        >
          ❤️ {likedServices.length}
        </motion.div>
      )}

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={closePhoneVerification}
        onSuccess={handlePhoneVerificationSuccess}
        phone={user?.phone}
      />
    </div>
  )
}