import { useState } from 'react'
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement
} from '@stripe/react-stripe-js'
import {
  CreditCardIcon,
  ExclamationTriangleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface PaymentFormProps {
  totalAmount: number
  onPaymentSuccess: (paymentIntent: any) => void
  onPaymentError: (error: string) => void
  isProcessing?: boolean
  disabled?: boolean
}

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
      color: '#DC2626',
    },
  },
}

export default function PaymentForm({
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
  isProcessing = false,
  disabled = false
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardErrors, setCardErrors] = useState<{
    cardNumber?: string
    cardExpiry?: string
    cardCvc?: string
  }>({})

  const handleCardChange = (element: string) => (event: any) => {
    setCardErrors(prev => ({
      ...prev,
      [element]: event.error ? event.error.message : ''
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || isProcessing || disabled) {
      return
    }

    const cardNumberElement = elements.getElement(CardNumberElement)
    if (!cardNumberElement) {
      onPaymentError('Card element not found')
      return
    }

    try {
      // Confirm the payment using the client secret from the Elements provider
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment({
        payment_method: {
          card: cardNumberElement,
        }
      })

      if (confirmError) {
        onPaymentError(confirmError.message || 'Payment confirmation failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent)
        toast.success('¡Pago procesado exitosamente!')
      }
    } catch (error) {
      console.error('Payment error:', error)
      onPaymentError(error instanceof Error ? error.message : 'Payment processing failed')
    }
  }

  const hasErrors = Object.values(cardErrors).some(error => error)

  return (
    <div className="bg-white rounded-full border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <CreditCardIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Información de Pago</h3>
          <LockClosedIcon className="w-4 h-4 text-green-600" />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Todos los pagos son procesados de forma segura por Stripe
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de tarjeta
            </label>
            <div className="relative">
              <div className="w-full px-3 py-2 border border-gray-300 rounded-full focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                <CardNumberElement
                  options={cardElementOptions}
                  onChange={handleCardChange('cardNumber')}
                />
              </div>
              {cardErrors.cardNumber && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {cardErrors.cardNumber}
                </div>
              )}
            </div>
          </div>

          {/* Card Expiry & CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MM/YY
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-full focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                <CardExpiryElement
                  options={cardElementOptions}
                  onChange={handleCardChange('cardExpiry')}
                />
              </div>
              {cardErrors.cardExpiry && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {cardErrors.cardExpiry}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVC
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-full focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                <CardCvcElement
                  options={cardElementOptions}
                  onChange={handleCardChange('cardCvc')}
                />
              </div>
              {cardErrors.cardCvc && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {cardErrors.cardCvc}
                </div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-full p-4">
            <div className="flex items-start">
              <LockClosedIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Pago 100% Seguro</p>
                <p className="text-blue-700 mt-1">
                  Tu información de pago está protegida con encriptación SSL de nivel bancario.
                  No almacenamos tu información de tarjeta.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || isProcessing || disabled || hasErrors}
            className="w-full btn btn-primary btn-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Procesando pago...
              </>
            ) : (
              <>
                <CreditCardIcon className="w-5 h-5 mr-2" />
                Pagar ${totalAmount.toFixed(2)}
              </>
            )}
          </button>

          {/* Test Card Info (for sandbox) */}
          <div className="bg-gray-50 border border-gray-200 rounded-full p-4 mt-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Para pruebas, usa:</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Visa:</strong> 4242 4242 4242 4242</p>
              <p><strong>Visa (debit):</strong> 4000 0566 5566 5556</p>
              <p><strong>Mastercard:</strong> 5555 5555 5555 4444</p>
              <p><strong>MM/YY:</strong> Cualquier fecha futura</p>
              <p><strong>CVC:</strong> Cualquier 3 dígitos</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}