import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  HeartIcon,
  BoltIcon,
  GiftIcon,
  LifebuoyIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../../store/authStore'
import { cardAppear, staggerChildren } from '../../../design/animations'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface UpcomingBooking {
  id: number
  stylist_name?: string
  business_name?: string
  service_name: string
  booking_date: string
  booking_time: string
  status: string
  stylist_avatar?: string
}

export default function ClientHomePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingBookings()
  }, [user])

  const fetchUpcomingBookings = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get('/api/client/bookings', {
        params: {
          userId: user.id,
          role: 'CLIENT'
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (response.data.success && response.data.bookings) {
        // Filter for upcoming bookings only (future dates, not cancelled/expired)
        const now = new Date()
        const upcoming = response.data.bookings.filter((booking: UpcomingBooking) => {
          const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`)
          return (
            bookingDateTime > now &&
            ['PENDING', 'VERIFY_ACCEPTANCE', 'CONFIRMED'].includes(booking.status)
          )
        }).slice(0, 3) // Show only next 3 upcoming bookings

        setUpcomingBookings(upcoming)
      }
    } catch (error) {
      console.error('Failed to fetch upcoming bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const quickActions = [
    {
      icon: BoltIcon,
      label: t('client.home.quickActions.bookNow'),
      to: '/explore',
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: SparklesIcon,
      label: t('client.home.quickActions.scanLook'),
      to: '/scan',
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      icon: GiftIcon,
      label: t('client.home.quickActions.giftCard'),
      to: '/gift',
      gradient: 'from-orange-500 to-pink-600'
    },
    {
      icon: LifebuoyIcon,
      label: t('client.home.quickActions.sosHelp'),
      to: '/help',
      gradient: 'from-red-500 to-orange-600'
    }
  ]

  const vibeOptions = [
    { label: 'Energetic', emoji: '⚡' },
    { label: 'Chill', emoji: '🌊' },
    { label: 'Glam', emoji: '✨' },
    { label: 'Natural', emoji: '🌿' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            👋 {t('client.home.greeting', { name: user?.name || 'there' })}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('client.home.subtitle')}
          </p>
        </motion.div>

        {/* Quick Search */}
        <motion.div
          variants={cardAppear}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <Link
            to="/explore"
            className="block w-full p-4 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 /">
              <span className="text-gray-500 dark:text-gray-400">
                {t('client.home.searchPlaceholder')}
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Upcoming Bookings */}
        {!loading && upcomingBookings.length > 0 && (
          <motion.div
            variants={cardAppear}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('client.home.upcoming')}
              </h2>
              <Link
                to="/my/bookings"
                className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
              >
                {t('common.viewAll')}
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {(booking.business_name || booking.stylist_name || 'S')[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {booking.service_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('client.home.with')} {booking.business_name || booking.stylist_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          <ClockIcon className="inline h-4 w-4 mr-1 /">
                          {formatDate(booking.booking_date)} at {booking.booking_time}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="btn btn-sm btn-primary rounded-full"
                    >
                      {t('common.view')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions Grid */}
        <motion.div
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('client.home.quickActions.title')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.label}
                variants={cardAppear}
                custom={index}
              >
                <Link
                  to={action.to}
                  className="block p-6 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 group"
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white /">
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {action.label}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Your Vibe Today */}
        <motion.div
          variants={cardAppear}
          initial="hidden"
          animate="visible"
          className="mb-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-full border border-pink-200 dark:border-gray-600"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-pink-600 /">
            {t('client.home.vibeToday.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('client.home.vibeToday.subtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            {vibeOptions.map((vibe) => (
              <button
                key={vibe.label}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full border-2 border-pink-200 dark:border-gray-600 hover:border-pink-500 dark:hover:border-pink-500 hover:shadow-md transition-all font-medium text-gray-900 dark:text-white"
              >
                <span className="mr-2">{vibe.emoji}</span>
                {vibe.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Trending Near You */}
        <motion.div
          variants={cardAppear}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPinIcon className="h-6 w-6 text-pink-600 /">
              {t('client.home.trendingNearYou')}
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {['Braids', 'Lashes', 'Nails', 'Balayage', 'Facial'].map((service) => (
              <Link
                key={service}
                to={`/explore?service=${service}`}
                className="flex-shrink-0 w-32 h-32 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 flex items-center justify-center font-semibold text-gray-900 dark:text-white"
              >
                {service}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Favorites Section */}
        <motion.div
          variants={cardAppear}
          initial="hidden"
          animate="visible"
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HeartIcon className="h-6 w-6 text-pink-600 /">
              {t('client.home.favorites')}
            </h2>
            <Link
              to="/my/favorites"
              className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
            >
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="p-8 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-3 /">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('client.home.noFavorites')}
            </p>
            <Link to="/explore" className="btn btn-primary rounded-full">
              {t('client.home.exploreStylists')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
