import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCardIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import axios from 'axios'
import toast from 'react-hot-toast'
import CreditCardForm from '../components/CreditCardForm'

interface PaymentMethod {
  id: string
  type: 'credit_card' | 'debit_card' | 'mercadopago' | 'oxxo' | 'bitcoin'
  isDefault: boolean
  lastFour?: string
  brand?: string
  expiryMonth?: string
  expiryYear?: string
  mercadopagoEmail?: string
  bitcoinAddress?: string
  createdAt: string
}

export default function PaymentMethodsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedType, setSelectedType] = useState<PaymentMethod['type'] | null>(null)
  const [showCardForm, setShowCardForm] = useState(false)

  const getPaymentTypeName = (type: PaymentMethod['type']) => {
    const names = {
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      mercadopago: 'MercadoPago',
      oxxo: 'OXXO',
      bitcoin: 'Bitcoin'
    }
    return names[type] || type
  }

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    fetchPaymentMethods()
  }, [])

  // Lock background scrolling when modals are open
  useEffect(() => {
    if (showAddModal || showCardForm) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showAddModal, showCardForm])

  const fetchPaymentMethods = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/payment-methods', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPaymentMethods(response.data)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      toast.error('Error loading payment methods')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/payment-methods/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // toast.success('Payment method deleted successfully') // Removed: obvious from UI
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error deleting payment method:', error)
      toast.error('Failed to delete payment method')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/api/payment-methods/${id}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // toast.success('Default payment method updated') // Removed: obvious from UI
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error setting default:', error)
      toast.error('Failed to set default payment method')
    }
  }

  const getPaymentIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCardIcon className="h-6 w-6" />
      case 'mercadopago':
        return <CurrencyDollarIcon className="h-6 w-6" />
      case 'oxxo':
        return <BuildingStorefrontIcon className="h-6 w-6" />
      case 'bitcoin':
        return <span className="text-2xl">₿</span>
      default:
        return <BanknotesIcon className="h-6 w-6" />
    }
  }

  const paymentTypes = [
    {
      type: 'credit_card' as const,
      name: 'Credit Card',
      icon: <CreditCardIcon className="h-8 w-8" />,
      gradient: 'from-blue-500 to-purple-600',
      description: 'Visa, Mastercard, Amex, etc.'
    },
    {
      type: 'debit_card' as const,
      name: 'Debit Card',
      icon: <CreditCardIcon className="h-8 w-8" />,
      gradient: 'from-green-500 to-teal-600',
      description: 'Direct bank payment'
    },
    {
      type: 'mercadopago' as const,
      name: 'MercadoPago',
      icon: <CurrencyDollarIcon className="h-8 w-8" />,
      gradient: 'from-sky-500 to-blue-600',
      description: 'Popular Latin American payment method'
    },
    {
      type: 'oxxo' as const,
      name: 'OXXO',
      icon: <BuildingStorefrontIcon className="h-8 w-8" />,
      gradient: 'from-red-500 to-orange-600',
      description: 'Pay in cash at OXXO stores'
    },
    {
      type: 'bitcoin' as const,
      name: 'Bitcoin',
      icon: <span className="text-4xl">₿</span>,
      gradient: 'from-orange-500 to-amber-600',
      description: 'Cryptocurrency payment'
    }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Payment Methods
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your payment methods
          </p>
        </motion.div>

        {/* Add Payment Method Button */}
        <motion.button
          onClick={() => setShowAddModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mb-8 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <PlusIcon className="h-5 w-5" />
          Add Payment Method
        </motion.button>

        {/* Payment Methods List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading...
            </p>
          </div>
        ) : paymentMethods.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-12 rounded-3xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}
          >
            <CreditCardIcon className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No payment methods
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Add your first payment method to get started
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-3xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group`}
              >
                {/* Default Badge */}
                {method.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-teal-600 text-white text-xs font-bold rounded-3xl flex items-center gap-1">
                      <CheckCircleSolid className="h-4 w-4" />
                      Default
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl text-white">
                    {getPaymentIcon(method.type)}
                  </div>

                  <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {getPaymentTypeName(method.type)}
                    </h3>

                    {/* Card Details */}
                    {(method.type === 'credit_card' || method.type === 'debit_card') && (
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p className="font-mono">•••• •••• •••• {method.lastFour}</p>
                        <p className="capitalize">{method.brand} • {method.expiryMonth}/{method.expiryYear}</p>
                      </div>
                    )}

                    {/* MercadoPago Details */}
                    {method.type === 'mercadopago' && (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {method.mercadopagoEmail}
                      </p>
                    )}

                    {/* Bitcoin Details */}
                    {method.type === 'bitcoin' && (
                      <p className={`text-sm font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {method.bitcoinAddress?.substring(0, 20)}...
                      </p>
                    )}

                    {/* OXXO */}
                    {method.type === 'oxxo' && (
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Cash payment at OXXO
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
                        isDarkMode
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <CheckCircleIcon className="h-4 w-4 inline mr-2" />
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-3xl hover:bg-red-600 transition-colors font-medium"
                  >
                    <TrashIcon className="h-4 w-4 inline mr-2" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Payment Method Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } p-8 shadow-2xl`}
              >
                <h2 className={`text-3xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Select Payment Method Type
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  {paymentTypes.map((type) => (
                    <motion.button
                      key={type.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedType(type.type)
                        if (type.type === 'credit_card' || type.type === 'debit_card') {
                          setShowCardForm(true)
                          setShowAddModal(false)
                        } else {
                          // toast.success(`Selected ${type.name}`) // Removed: unnecessary
                          setShowAddModal(false)
                        }
                      }}
                      className={`p-6 rounded-3xl border-2 ${
                        isDarkMode
                          ? 'border-gray-700 hover:border-pink-500 bg-gray-900'
                          : 'border-gray-200 hover:border-pink-500 bg-white'
                      } transition-all text-left group`}
                    >
                      <div className={`inline-flex p-3 rounded-3xl bg-gradient-to-br ${type.gradient} text-white mb-4`}>
                        {type.icon}
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {type.name}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {type.description}
                      </p>
                    </motion.button>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className={`mt-6 w-full px-6 py-3 rounded-3xl font-semibold ${
                    isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Form Modal */}
        <AnimatePresence>
          {showCardForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <CreditCardForm
                isDarkMode={isDarkMode}
                onSubmit={async (cardData) => {
                  try {
                    const token = localStorage.getItem('token')
                    await axios.post('/api/payment-methods', {
                      type: selectedType,
                      ...cardData
                    }, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                    // toast.success('Card added successfully!') // Removed: obvious from UI
                    setShowCardForm(false)
                    fetchPaymentMethods()
                  } catch (error: any) {
                    console.error('Error adding card:', error)
                    toast.error(error.response?.data?.message || 'Failed to add card')
                  }
                }}
                onCancel={() => setShowCardForm(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
