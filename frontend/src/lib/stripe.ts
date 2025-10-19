import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe with your publishable key
// In production, this should come from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QVbEEGOz4OzxrU8CDKKjKppHAXZY5Zo6kBvIGZmVjAc6LYFc6f8zx6K7SyHDXJvMTHEHdHU4cDNOXUoCwdJk6RY00iY2X6GYj'

export const stripePromise = loadStripe(stripePublishableKey)

// Payment service for handling payment-related API calls
class PaymentService {
  private baseURL = '/api'

  async createPaymentIntent(amount: number, bookingData: any) {
    const response = await fetch(`${this.baseURL}/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('beautycita-auth-token')}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'mxn',
        booking: bookingData
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create payment intent')
    }

    return response.json()
  }

  async confirmPayment(paymentIntentId: string, bookingData: any) {
    const response = await fetch(`${this.baseURL}/payments/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('beautycita-auth-token')}`
      },
      body: JSON.stringify({
        paymentIntentId,
        bookingData
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to confirm payment')
    }

    return response.json()
  }

  async getPaymentStatus(paymentIntentId: string) {
    const response = await fetch(`${this.baseURL}/payments/status/${paymentIntentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('beautycita-auth-token')}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get payment status')
    }

    return response.json()
  }
}

export const paymentService = new PaymentService()

// Stripe configuration
export const STRIPE_CONFIG = {
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#3B82F6',
      colorBackground: '#ffffff',
      colorText: '#374151',
      colorDanger: '#DC2626',
      borderRadius: '8px',
      spacingUnit: '4px'
    }
  },
  // Payment method types that your business accepts
  paymentMethodTypes: ['card']
}