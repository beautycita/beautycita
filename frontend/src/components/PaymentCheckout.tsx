import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import {
  CreditCard,
  Lock,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Star,
  User,
  Receipt
} from 'lucide-react'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

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

interface PaymentCheckoutProps {
  booking: BookingDetails
  onPaymentSuccess: (paymentResult: any) => void
  onBack: () => void
}

// Custom card element styling to match our design
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
      },
    },
    invalid: {
      color: '#EF4444',
    },
  },
}

const PaymentForm: React.FC<PaymentCheckoutProps> = ({ booking, onPaymentSuccess, onBack }) => {
  const { t, i18n } = useTranslation()
  const { user, isAuthenticated, token } = useAuth()
  const stripe = useStripe()
  const elements = useElements()

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [billingDetails, setBillingDetails] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  })

  const isSpanish = i18n.language === 'es'
  const platformFee = booking.service.price * 0.03
  const totalAmount = booking.service.price + platformFee

  useEffect(() => {
    createBookingAndPaymentIntent()
  }, [])

  // Update billing details when user info becomes available
  useEffect(() => {
    if (user) {
      setBillingDetails(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email
      }))
    }
  }, [user])

  const createBookingAndPaymentIntent = async () => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user?.id || !token) {
        setError('Please log in to complete your booking')
        return
      }

      // First, create the booking
      const bookingResponse = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: user.id,
          stylistId: booking.service.stylist.id,
          serviceId: booking.service.id,
          bookingDate: booking.date,
          bookingTime: booking.time,
          notes: booking.notes
        }),
      })

      const bookingData = await bookingResponse.json()

      if (!bookingData.success) {
        setError(bookingData.error || 'Failed to create booking')
        return
      }

      // Store the booking ID for later use
      setBookingId(bookingData.booking.id)

      // Then create the payment intent for the booking
      const paymentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: bookingData.booking.id,
          clientId: user.id
        }),
      })

      const paymentData = await paymentResponse.json()

      if (paymentData.success && paymentData.clientSecret) {
        setClientSecret(paymentData.clientSecret)
      } else {
        setError(paymentData.error || 'Failed to initialize payment')
      }
    } catch (err) {
      setError('Failed to connect to payment service')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setProcessing(true)
    setError(null)

    const card = elements.getElement(CardElement)
    if (!card) {
      setError('Card element not found')
      setProcessing(false)
      return
    }

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone,
          },
        }
      })

      if (paymentError) {
        setError(paymentError.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        // Payment successful, now confirm the booking
        if (bookingId) {
          try {
            const confirmResponse = await fetch(`/api/bookings/${bookingId}/confirm`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clientId: user.id,
                paymentIntentId: paymentIntent.id
              }),
            })

            const confirmData = await confirmResponse.json()

            if (confirmData.success) {
              onPaymentSuccess({
                paymentIntent,
                booking,
                billingDetails
              })
            } else {
              setError(confirmData.error || 'Failed to confirm booking')
            }
          } catch (confirmError) {
            setError('Payment succeeded but booking confirmation failed')
          }
        } else {
          setError('Missing booking information')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            {t('payment.back', 'Back to booking')}
          </button>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {t('payment.title', 'Complete Your Booking')}
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">
              {t('payment.subtitle', 'Secure payment powered by Stripe')}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Receipt className="h-5 w-5 text-pink-500" />
              {t('payment.bookingSummary', 'Booking Summary')}
            </h2>

            {/* Service Details */}
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
                <div className="text-xl font-bold text-pink-600">
                  ${booking.service.price}
                </div>
              </div>
            </div>

            {/* Stylist Details */}
            <div className="border rounded-3xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-3xl flex items-center justify-center">
                  {booking.service.stylist.user.profile_picture_url ? (
                    <img loading="lazy"
                      src={booking.service.stylist.user.profile_picture_url}
                      alt="Stylist"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {booking.service.stylist.business_name ||
                     `${booking.service.stylist.user.first_name} ${booking.service.stylist.user.last_name}`}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {booking.service.stylist.location_city}, {booking.service.stylist.location_state}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="border rounded-3xl p-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-pink-500" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatDate(booking.date)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.time}
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600">
                      <strong>{t('payment.notes', 'Notes')}:</strong> {booking.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border rounded-3xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>{t('payment.servicePrice', 'Service')}</span>
                  <span>${booking.service.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>{t('payment.platformFee', 'Platform Fee')}</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg text-gray-900">
                  <span>{t('payment.total', 'Total')}</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <CreditCard className="h-5 w-5 text-pink-500" />
              {t('payment.paymentMethod', 'Payment Method')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Billing Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('payment.fullName', 'Full Name')}
                  </label>
                  <input
                    type="text"
                    value={billingDetails.name}
                    onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={t('payment.namePlaceholder', 'Enter your full name')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('payment.email', 'Email')}
                  </label>
                  <input
                    type="email"
                    value={billingDetails.email}
                    onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={t('payment.emailPlaceholder', 'Enter your email')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('payment.phone', 'Phone Number')}
                  </label>
                  <input
                    type="tel"
                    value={billingDetails.phone}
                    onChange={(e) => setBillingDetails(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={t('payment.phonePlaceholder', 'Enter your phone number')}
                  />
                </div>
              </div>

              {/* Card Element */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('payment.cardDetails', 'Card Details')}
                </label>
                <div className="p-4 border border-gray-300 rounded-3xl focus-within:ring-2 focus-within:ring-pink-500 focus-within:border-transparent">
                  <CardElement
                    options={cardElementOptions}
                    onChange={(event) => {
                      setCardComplete(event.complete)
                      setError(event.error?.message || null)
                    }}
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-3xl border border-green-200">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  {t('payment.securePayment', 'Your payment is secured by 256-bit SSL encryption')}
                </span>
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-50 rounded-3xl border border-red-200"
                  >
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={!stripe || !clientSecret || !cardComplete || processing}
                whileHover={!processing ? { scale: 1.02 } : {}}
                whileTap={!processing ? { scale: 0.98 } : {}}
                className={`
                  w-full py-4 rounded-3xl font-medium text-white shadow-lg transition-all
                  ${!stripe || !clientSecret || !cardComplete || processing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 hover:shadow-xl'
                  }
                `}
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('payment.processing', 'Processing...')}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Check className="h-5 w-5" />
                    {t('payment.payNow', 'Pay Now')} • ${totalAmount.toFixed(2)}
                  </div>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Main component wrapper with Stripe Elements provider
const PaymentCheckout: React.FC<PaymentCheckoutProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}

export default PaymentCheckout