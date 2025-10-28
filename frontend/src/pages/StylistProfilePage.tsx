import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  HeartIcon,
  UserCircleIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  ShareIcon,
  PhotoIcon,
  AcademicCapIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { bookingService, type Stylist, type StylistService } from '../services/bookingService'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import ReviewList from '../components/reviews/ReviewList'
import PortfolioGallery from '../components/portfolio/PortfolioGallery'

export default function StylistProfilePage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [stylist, setStylist] = useState<Stylist | null>(null)
  const [services, setServices] = useState<StylistService[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'portfolio' | 'reviews'>('about')

  useEffect(() => {
    if (id) {
      loadStylistProfile(id)
      loadStylistServices(id)
    }
  }, [id])

  const loadStylistProfile = async (stylistId: string) => {
    try {
      const response = await bookingService.getStylist(stylistId)
      if (response.success && response.data) {
        setStylist(response.data)
      } else {
        toast.error(t('panel.stylistProfile.errors.loadFailed'))
      }
    } catch (error) {
      console.error('Error loading stylist profile:', error)
      toast.error(t('panel.stylistProfile.errors.loadError'))
    }
  }

  const loadStylistServices = async (stylistId: string) => {
    try {
      const response = await bookingService.getStylistServices(stylistId)
      if (response.success && response.data) {
        setServices(response.data)
      }
    } catch (error) {
      console.error('Error loading stylist services:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  const handleBookService = (serviceId: string) => {
    if (!isAuthenticated) {
      toast.error(t('panel.stylistProfile.errors.signInRequired'))
      navigate('/login')
      return
    }
    navigate(`/book/${id}/${serviceId}`)
  }

  const handleBookStylist = () => {
    if (!isAuthenticated) {
      toast.error(t('panel.stylistProfile.errors.signInRequired'))
      navigate('/login')
      return
    }
    if (stylist?.services && stylist.services.length > 0) {
      navigate(`/book/${id}/${stylist.services[0].id}`)
    } else {
      toast.error(t('panel.stylistProfile.errors.noServices'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!stylist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl max-w-md mx-4"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('panel.stylistProfile.notFound.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('panel.stylistProfile.notFound.description')}
          </p>
          <Link
            to="/stylists"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-full font-semibold hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
          >
            {t('panel.stylistProfile.notFound.backButton')}
          </Link>
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { key: 'about', label: t('panel.stylistProfile.tabs.about') },
    { key: 'services', label: t('panel.stylistProfile.tabs.services') },
    { key: 'portfolio', label: t('panel.stylistProfile.tabs.portfolio') },
    { key: 'reviews', label: t('panel.stylistProfile.tabs.reviews') }
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          {t('panel.stylistProfile.back')}
        </motion.button>

        {/* Profile Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden mb-8"
        >
          {/* Gradient Header */}
          <div className="h-32 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>

          <div className="px-6 pb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6 -mt-16 relative z-10">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                {stylist.profile_picture_url ? (
                  <img loading="lazy"
                    src={stylist.profile_picture_url}
                    alt={stylist.business_name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                    <UserCircleIcon className="w-20 h-20 text-purple-600" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 mt-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {stylist.business_name}
                      </h1>
                      {stylist.is_verified && (
                        <CheckBadgeIcon className="w-8 h-8 text-blue-500" title={t('panel.stylistProfile.verified')} />
                      )}
                    </div>
                    <p className="text-xl text-gray-700 dark:text-gray-300 font-medium mb-3">{stylist.name}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        <span>{stylist.location_city}, {stylist.location_state}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        <span>{stylist.experience_years} {t('panel.stylistProfile.yearsExperience')}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                        <StarIcon className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {parseFloat(stylist.rating_average.toString()).toFixed(1)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          ({stylist.rating_count} {t('panel.stylistProfile.reviews')})
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <span>{stylist.total_bookings} {t('panel.stylistProfile.completedAppointments')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFavorite}
                      className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {isFavorite ? (
                        <HeartSolidIcon className="w-6 h-6 text-red-500" />
                      ) : (
                        <HeartIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                    <button className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <ShareIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Specialties */}
                {stylist.specialties && stylist.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {stylist.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price Range & CTA */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center text-gray-700 dark:text-gray-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-2 rounded-full">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    <span className="font-semibold">{stylist.base_price_range}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">• {stylist.pricing_tier}</span>
                  </div>
                  <button
                    onClick={handleBookStylist}
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-full font-semibold hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    <CalendarDaysIcon className="w-5 h-5 mr-2" />
                    {t('panel.stylistProfile.bookAppointment')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-2">
            <nav className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 min-w-[100px] py-3 px-6 rounded-2xl font-semibold text-sm transition-all ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Bio */}
              {stylist.bio && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('panel.stylistProfile.aboutMe')}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{stylist.bio}</p>
                </div>
              )}

              {/* Certifications */}
              {stylist.certifications && stylist.certifications.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <AcademicCapIcon className="w-6 h-6 mr-2 text-purple-600" />
                    {t('panel.stylistProfile.certifications')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stylist.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl">
                        <TrophyIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-white font-medium">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media */}
              {stylist.social_media_links && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {t('panel.stylistProfile.socialMedia')}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {stylist.social_media_links.instagram && (
                      <a
                        href={`https://instagram.com/${stylist.social_media_links.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
                      >
                        <PhotoIcon className="w-5 h-5 mr-2" />
                        Instagram
                      </a>
                    )}
                    {stylist.social_media_links.facebook && (
                      <a
                        href={stylist.social_media_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        Facebook
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t('panel.stylistProfile.availableServices')}
              </h3>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service: any) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 hover:shadow-xl transition-all border border-purple-100 dark:border-gray-600"
                    >
                      <h4 className="font-bold text-gray-900 dark:text-white text-xl mb-2">
                        {service.name}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          <span>{service.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            ${service.price}
                          </span>
                          <button
                            onClick={() => handleBookService(service.id)}
                            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:from-pink-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
                          >
                            {t('panel.stylistProfile.book')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {t('panel.stylistProfile.noServicesYet')}
                  </p>
                  <button
                    onClick={handleBookStylist}
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-full font-semibold hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    {t('panel.stylistProfile.contactForInfo')}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <PortfolioGallery stylistId={parseInt(id!)} />
          )}

          {activeTab === 'reviews' && (
            <ReviewList stylistId={parseInt(id!)} />
          )}
        </motion.div>
      </div>
    </div>
  )
}
