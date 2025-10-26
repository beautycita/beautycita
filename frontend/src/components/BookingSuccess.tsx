import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Star,
  User,
  Phone,
  Mail,
  Download,
  Share2,
  ArrowRight,
  MessageSquare
} from 'lucide-react'

interface BookingDetails {
  service: {
    id: string
    name: string
    name_es: string
    description: string
    description_es: string
    duration_minutes: number
    price: number
    stylist: {
      id: string
      business_name: string
      rating: number
      total_reviews: number
      location_city: string
      location_state: string
      user: {
        first_name: string
        last_name: string
        profile_picture_url?: string
      }
    }
  }
  date: string
  time: string
  notes: string
}

interface PaymentResult {
  paymentIntent: any
  booking: BookingDetails
  billingDetails: {
    name: string
    email: string
    phone: string
  }
}

interface BookingSuccessProps {
  paymentResult: PaymentResult
  onNewBooking: () => void
}

const BookingSuccess: React.FC<BookingSuccessProps> = ({ paymentResult, onNewBooking }) => {
  const { t, i18n } = useTranslation()
  const [calendarAdded, setCalendarAdded] = useState(false)

  const isSpanish = i18n.language === 'es'
  const { booking, billingDetails, paymentIntent } = paymentResult

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const generateCalendarEvent = () => {
    const startDate = new Date(`${booking.date}T${booking.time}`)
    const endDate = new Date(startDate.getTime() + booking.service.duration_minutes * 60000)

    const formatCalendarDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const title = encodeURIComponent(`${isSpanish ? booking.service.name_es : booking.service.name} - BeautyCita`)
    const description = encodeURIComponent(`Beauty service with ${booking.service.stylist.business_name || `${booking.service.stylist.user.first_name} ${booking.service.stylist.user.last_name}`}`)
    const location = encodeURIComponent(`${booking.service.stylist.location_city}, ${booking.service.stylist.location_state}`)

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}&details=${description}&location=${location}`

    window.open(googleCalendarUrl, '_blank')
    setCalendarAdded(true)
  }

  const shareBooking = async () => {
    const shareData = {
      title: 'BeautyCita Booking Confirmed',
      text: `I just booked ${isSpanish ? booking.service.name_es : booking.service.name} on BeautyCita! 💄✨`,
      url: window.location.origin
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {t('success.title', 'Booking Confirmed!')}
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            {t('success.subtitle', 'Your beauty appointment has been successfully booked. Get ready to look amazing!')}
          </p>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {t('success.bookingDetails', 'Booking Details')}
          </h2>

          {/* Service Info */}
          <div className="border rounded-3xl p-4 mb-6 bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-3xl flex items-center justify-center text-white text-xl">
                💄
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {isSpanish ? booking.service.name_es : booking.service.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {isSpanish ? booking.service.description_es : booking.service.description}
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {booking.service.duration_minutes} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    {booking.service.stylist.rating.toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold text-green-600">
                ✓ Paid
              </div>
            </div>
          </div>

          {/* Appointment Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-pink-500" />
                <div>
                  <div className="font-medium text-gray-900">
                    {formatDate(booking.date)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booking.time}
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-pink-500" />
                <div>
                  <div className="font-medium text-gray-900">
                    {booking.service.stylist.location_city}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booking.service.stylist.location_state}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stylist Info */}
          <div className="border rounded-3xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-3xl flex items-center justify-center">
                {booking.service.stylist.user.profile_picture_url ? (
                  <img loading="lazy"
                    src={booking.service.stylist.user.profile_picture_url}
                    alt="Stylist"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {booking.service.stylist.business_name ||
                   `${booking.service.stylist.user.first_name} ${booking.service.stylist.user.last_name}`}
                </div>
                <div className="text-sm text-gray-500">
                  {t('success.yourStylist', 'Your Beauty Professional')}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">
                  {booking.service.stylist.rating.toFixed(1)} ({booking.service.stylist.total_reviews})
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border rounded-3xl p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {t('success.contactInfo', 'Your Contact Information')}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span>{billingDetails.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{billingDetails.email}</span>
              </div>
              {billingDetails.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{billingDetails.phone}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <button
            onClick={generateCalendarEvent}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-full font-medium transition-all ${
              calendarAdded
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-5 w-5" />
            {calendarAdded
              ? t('success.calendarAdded', 'Added to Calendar')
              : t('success.addToCalendar', 'Add to Calendar')
            }
          </button>

          <button
            onClick={shareBooking}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-300 text-gray-700 rounded-3xl hover:bg-gray-50 transition-all font-medium"
          >
            <Share2 className="h-5 w-5" />
            {t('success.share', 'Share Booking')}
          </button>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl p-6 text-white mb-8"
        >
          <h3 className="text-lg font-bold mb-4">
            {t('success.nextSteps', 'What\'s Next?')}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-4 w-4 mt-0.5" />
              <span>
                {t('success.step1', 'You\'ll receive a confirmation SMS shortly with your stylist\'s contact details')}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-0.5" />
              <span>
                {t('success.step2', 'Add this appointment to your calendar so you don\'t forget')}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Star className="h-4 w-4 mt-0.5" />
              <span>
                {t('success.step3', 'After your service, don\'t forget to leave a review to help other clients')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={onNewBooking}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-3xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <ArrowRight className="h-5 w-5" />
            {t('success.bookAnother', 'Book Another Service')}
          </button>

          <a
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-300 text-gray-700 rounded-3xl hover:bg-gray-50 transition-all font-medium"
          >
            {t('success.backHome', 'Back to Home')}
          </a>
        </motion.div>
      </div>
    </div>
  )
}

export default BookingSuccess