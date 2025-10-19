import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDaysIcon,
  ClockIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  UserCircleIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { bookingService, type Stylist, type StylistService } from '../services/bookingService'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

interface BookingFormValues {
  stylistId: string
  serviceId: string
  date: string
  time: string
  notes: string
  paymentMethodId: string
}

export default function BookingPage() {
  const { stylistId, serviceId } = useParams<{ stylistId: string; serviceId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { t } = useTranslation()

  const validationSchemas = [
    // Step 1: Date & Time
    Yup.object({
      date: Yup.string().required(t('booking.validation.dateRequired')),
      time: Yup.string().required(t('booking.validation.timeRequired'))
    }),
    // Step 2: Additional Details
    Yup.object({
      notes: Yup.string().max(500, t('booking.validation.notesMax'))
    }),
    // Step 3: Payment
    Yup.object({
      paymentMethodId: Yup.string().required(t('booking.validation.paymentRequired'))
    })
  ]
  const [currentStep, setCurrentStep] = useState(0)
  const [stylist, setStylist] = useState<Stylist | null>(null)
  const [service, setService] = useState<StylistService | null>(null)
  const [loading, setLoading] = useState(true)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!stylistId || !serviceId) {
      toast.error(t('booking.messages.invalidLink'))
      navigate('/stylists')
      return
    }

    loadBookingData()
  }, [isAuthenticated, stylistId, serviceId, navigate, t])

  const loadBookingData = async () => {
    try {
      setLoading(true)
      const [stylistResponse, servicesResponse, paymentMethodsResponse] = await Promise.all([
        bookingService.getStylist(stylistId!),
        bookingService.getStylistServices(stylistId!),
        axios.get('/api/payment-methods', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      if (stylistResponse.success && stylistResponse.data) {
        setStylist(stylistResponse.data)
      }

      if (servicesResponse.success && servicesResponse.data) {
        const selectedService = servicesResponse.data.find((s: StylistService) => s.id === parseInt(serviceId!))
        if (selectedService) {
          setService(selectedService)
        } else {
          toast.error(t('booking.messages.serviceNotFound'))
          navigate('/stylists')
        }
      }

      setPaymentMethods(paymentMethodsResponse.data || [])
    } catch (error) {
      console.error('Error loading booking data:', error)
      toast.error(t('booking.messages.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async (date: string) => {
    try {
      const response = await axios.get(`/api/availability/${stylistId}`, {
        params: { date },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      if (response.data && response.data.slots) {
        setAvailableSlots(response.data.slots)
      } else {
        // Generate sample time slots if API doesn't return any
        const slots = []
        for (let hour = 9; hour <= 17; hour++) {
          slots.push(`${hour.toString().padStart(2, '0')}:00`)
          slots.push(`${hour.toString().padStart(2, '0')}:30`)
        }
        setAvailableSlots(slots)
      }
    } catch (error) {
      console.error('Error loading available slots:', error)
      // Fallback time slots
      const slots = []
      for (let hour = 9; hour <= 17; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`)
        slots.push(`${hour.toString().padStart(2, '0')}:30`)
      }
      setAvailableSlots(slots)
    }
  }

  const handleSubmit = async (values: BookingFormValues) => {
    try {
      const token = localStorage.getItem('token')

      // Create booking
      const response = await axios.post('/api/bookings', {
        stylist_id: parseInt(stylistId!),
        service_id: parseInt(serviceId!),
        appointment_date: values.date,
        appointment_time: values.time,
        notes: values.notes,
        payment_method_id: values.paymentMethodId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        toast.success(t('booking.messages.bookingSuccess'))
        navigate('/bookings')
      } else {
        toast.error(response.data.message || t('booking.messages.bookingError'))
      }
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast.error(error.response?.data?.message || t('booking.messages.bookingError'))
    }
  }

  const initialValues: BookingFormValues = {
    stylistId: stylistId || '',
    serviceId: serviceId || '',
    date: '',
    time: '',
    notes: '',
    paymentMethodId: ''
  }

  const steps = [t('booking.steps.dateTime'), t('booking.steps.details'), t('booking.steps.payment')]

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    )
  }

  if (!stylist || !service) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('booking.serviceNotFound')}
          </h1>
          <button
            onClick={() => navigate('/stylists')}
            className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600"
          >
            {t('booking.browseStylistsBtn')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center mb-4 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            {t('common.back')}
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <div className="flex items-start gap-4">
              {stylist.profile_picture_url ? (
                <img
                  src={stylist.profile_picture_url}
                  alt={stylist.business_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stylist.business_name}
                </h1>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                  {stylist.name}
                </p>
                <div className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {stylist.location_city}
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-4 p-4 rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {service.name}
              </h3>
              <div className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {service.duration_minutes} min
                </div>
                <div className="flex items-center font-bold text-lg text-pink-500">
                  <CurrencyDollarIcon className="w-5 h-5 mr-1" />
                  ${service.price}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index <= currentStep
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : isDarkMode
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStep ? <CheckCircleIcon className="w-6 h-6" /> : index + 1}
                  </div>
                  <span
                    className={`mt-2 text-sm ${
                      index <= currentStep
                        ? isDarkMode
                          ? 'text-white'
                          : 'text-gray-900'
                        : isDarkMode
                        ? 'text-gray-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      index < currentStep
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                        : isDarkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchemas[currentStep]}
          onSubmit={(values) => {
            if (currentStep < steps.length - 1) {
              setCurrentStep(currentStep + 1)
            } else {
              handleSubmit(values)
            }
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`rounded-3xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
                >
                  {/* Step 1: Date & Time */}
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('booking.labels.selectDateTime')}
                      </h2>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('booking.labels.date')}
                        </label>
                        <Field
                          type="date"
                          name="date"
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue('date', e.target.value)
                            setFieldValue('time', '') // Reset time when date changes
                            if (e.target.value) {
                              loadAvailableSlots(e.target.value)
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-xl border ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                        />
                        <ErrorMessage name="date" component="div" className="text-red-500 text-sm mt-1" />
                      </div>

                      {values.date && (
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t('booking.labels.availableSlots')}
                          </label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableSlots.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setFieldValue('time', slot)}
                                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                                  values.time === slot
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                                    : isDarkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          <ErrorMessage name="time" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Additional Details */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('booking.labels.additionalDetails')}
                      </h2>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('booking.labels.notes')}
                        </label>
                        <Field
                          as="textarea"
                          name="notes"
                          rows={4}
                          placeholder={t('booking.labels.notesPlaceholder')}
                          className={`w-full px-4 py-3 rounded-xl border ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                        />
                        <ErrorMessage name="notes" component="div" className="text-red-500 text-sm mt-1" />
                      </div>

                      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {t('booking.labels.bookingSummary')}
                        </h3>
                        <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div className="flex justify-between">
                            <span>{t('booking.summary.date')}</span>
                            <span className="font-medium">{values.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('booking.summary.time')}</span>
                            <span className="font-medium">{values.time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('booking.summary.duration')}</span>
                            <span className="font-medium">{service.duration_minutes} {t('services.fields.min')}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-300">
                            <span className="font-semibold">{t('booking.summary.total')}</span>
                            <span className="font-bold text-pink-500">
                              ${service.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('booking.labels.selectPayment')}
                      </h2>

                      {paymentMethods.length === 0 ? (
                        <div className="text-center py-8">
                          <CreditCardIcon className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('booking.labels.noPaymentMethods')}
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate('/payment-methods')}
                            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg"
                          >
                            {t('booking.labels.addPaymentMethod')}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {paymentMethods.map((method) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setFieldValue('paymentMethodId', method.id)}
                              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                values.paymentMethodId === method.id
                                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                                  : isDarkMode
                                  ? 'border-gray-700 bg-gray-700 hover:border-gray-600'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <CreditCardIcon className="w-6 h-6 mr-3 text-pink-500" />
                                  <div>
                                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {method.brand} •••• {method.lastFour}
                                    </p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {t('booking.expiresDate', { month: method.expiryMonth, year: method.expiryYear })}
                                    </p>
                                  </div>
                                </div>
                                {values.paymentMethodId === method.id && (
                                  <CheckCircleIcon className="w-6 h-6 text-pink-500" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <ErrorMessage name="paymentMethodId" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-4 mt-8">
                    {currentStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className={`flex-1 px-6 py-3 rounded-full font-semibold transition-colors ${
                          isDarkMode
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                      >
                        <ArrowLeftIcon className="w-5 h-5 inline mr-2" />
                        {t('booking.buttons.back')}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          {t('booking.buttons.processing')}
                        </span>
                      ) : currentStep === steps.length - 1 ? (
                        t('booking.buttons.confirmBooking')
                      ) : (
                        <>
                          {t('booking.buttons.continue')}
                          <ArrowRightIcon className="w-5 h-5 inline ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}
