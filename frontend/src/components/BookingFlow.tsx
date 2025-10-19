import React, { useState } from 'react'
import ServiceBrowser from './ServiceBrowser'
import BookingCalendar from './BookingCalendar'
import PaymentCheckout from './PaymentCheckout'
import BookingSuccess from './BookingSuccess'

interface Service {
  id: string
  stylist_id: string
  category_id: string
  name: string
  name_es: string
  description: string
  description_es: string
  duration_minutes: number
  price: number
  is_active: boolean
  category: {
    name: string
    name_es: string
    icon: string
  }
  stylist: {
    id: string
    business_name: string
    rating: number
    total_reviews: number
    location_city: string
    location_state: string
    pricing_tier: string
    user: {
      id: string
      first_name: string
      last_name: string
      profile_picture_url?: string
    }
  }
}

interface BookingDetails {
  service: Service
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

const BookingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'services' | 'calendar' | 'payment' | 'success'>('services')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setCurrentStep('calendar')
  }

  const handleBookingSelect = (booking: BookingDetails) => {
    setBookingDetails(booking)
    setCurrentStep('payment')
  }

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentResult(result)
    setCurrentStep('success')
  }

  const handleBackToServices = () => {
    setSelectedService(null)
    setCurrentStep('services')
  }

  const handleBackToCalendar = () => {
    setCurrentStep('calendar')
  }

  const handleNewBooking = () => {
    setSelectedService(null)
    setBookingDetails(null)
    setPaymentResult(null)
    setCurrentStep('services')
  }

  switch (currentStep) {
    case 'services':
      return <ServiceBrowser onServiceSelect={handleServiceSelect} />

    case 'calendar':
      return selectedService ? (
        <BookingCalendar
          service={selectedService}
          onBookingSelect={handleBookingSelect}
          onBack={handleBackToServices}
        />
      ) : null

    case 'payment':
      return bookingDetails ? (
        <PaymentCheckout
          booking={bookingDetails}
          onPaymentSuccess={handlePaymentSuccess}
          onBack={handleBackToCalendar}
        />
      ) : null

    case 'success':
      return paymentResult ? (
        <BookingSuccess
          paymentResult={paymentResult}
          onNewBooking={handleNewBooking}
        />
      ) : null

    default:
      return null
  }
}

export default BookingFlow