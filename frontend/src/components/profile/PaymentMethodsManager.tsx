import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCardIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface PaymentMethod {
  id: string
  type: 'card' | 'bank'
  last4: string
  brand?: string
  exp_month?: number
  exp_year?: number
  is_default: boolean
}

interface PaymentMethodsManagerProps {
  onComplete: () => void
}

export default function PaymentMethodsManager({ onComplete }: PaymentMethodsManagerProps) {
  const { user } = useAuthStore()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/payment-methods`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
      })
      setPaymentMethods(response.data.paymentMethods || [])
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCard = async () => {
    // Validate card details
    if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length < 13) {
      toast.error('Please enter a valid card number')
      return
    }

    if (!cardDetails.expMonth || !cardDetails.expYear) {
      toast.error('Please enter expiration date')
      return
    }

    if (!cardDetails.cvc || cardDetails.cvc.length < 3) {
      toast.error('Please enter CVC')
      return
    }

    try {
      setAdding(true)

      const response = await axios.post(
        `${API_URL}/api/payment-methods`,
        {
          card_number: cardDetails.number.replace(/\s/g, ''),
          exp_month: parseInt(cardDetails.expMonth),
          exp_year: parseInt(cardDetails.expYear),
          cvc: cardDetails.cvc
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
        }
      )

      if (response.data.success) {
        toast.success('Card added successfully!')
        setShowAddCard(false)
        setCardDetails({ number: '', expMonth: '', expYear: '', cvc: '' })
        fetchPaymentMethods()
      }
    } catch (error: any) {
      console.error('Failed to add card:', error)
      toast.error(error.response?.data?.message || 'Failed to add card')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteCard = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return
    }

    try {
      await axios.delete(`${API_URL}/api/payment-methods/${paymentMethodId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
      })
      toast.success('Payment method removed')
      fetchPaymentMethods()
    } catch (error: any) {
      console.error('Failed to delete payment method:', error)
      toast.error(error.response?.data?.message || 'Failed to remove payment method')
    }
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await axios.patch(
        `${API_URL}/api/payment-methods/${paymentMethodId}/set-default`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
        }
      )
      toast.success('Default payment method updated')
      fetchPaymentMethods()
    } catch (error: any) {
      console.error('Failed to set default:', error)
      toast.error(error.response?.data?.message || 'Failed to update default')
    }
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Existing Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Your Payment Methods</h3>
              {paymentMethods.map((method) => (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-3xl border-2 transition-all ${
                    method.is_default
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center">
                        <CreditCardIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {method.brand} •••• {method.last4}
                          </p>
                          {method.is_default && (
                            <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-3xl flex items-center gap-1">
                              <StarIcon className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>
                        {method.exp_month && method.exp_year && (
                          <p className="text-sm text-gray-600">
                            Expires {method.exp_month}/{method.exp_year}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!method.is_default && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCard(method.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-3xl transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add Card Button */}
          {!showAddCard && (
            <button
              onClick={() => setShowAddCard(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-3xl text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="font-medium">Add Payment Method</span>
            </button>
          )}

          {/* Add Card Form */}
          <AnimatePresence>
            {showAddCard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-2 border-purple-200 rounded-3xl p-6 bg-purple-50 space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Card</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <input
                      type="text"
                      value={cardDetails.expMonth}
                      onChange={(e) => setCardDetails({ ...cardDetails, expMonth: e.target.value })}
                      placeholder="MM"
                      maxLength={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="text"
                      value={cardDetails.expYear}
                      onChange={(e) => setCardDetails({ ...cardDetails, expYear: e.target.value })}
                      placeholder="YY"
                      maxLength={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddCard(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCard}
                    disabled={adding}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {adding ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-5 h-5" />
                        <span>Add Card</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue Button */}
          <button
            onClick={onComplete}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>Continue</span>
          </button>

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-4">
            <h4 className="font-medium text-gray-900 mb-2">Your payment information is secure</h4>
            <p className="text-sm text-gray-600">
              We use industry-standard encryption to protect your payment details. You can add or remove payment methods at any time from your profile settings.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
