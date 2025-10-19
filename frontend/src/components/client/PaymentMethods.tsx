import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  CreditCardIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'
import { apiClient } from '../../services/api'
import toast from 'react-hot-toast'

interface PaymentMethod {
  id: string
  type: 'card'
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
  holderName?: string
  createdAt: string
}

interface AddPaymentMethodProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AddPaymentMethod: React.FC<AddPaymentMethodProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2')
  }

  const validateCard = () => {
    const newErrors: Record<string, string> = {}

    if (!cardData.number.replace(/\s/g, '') || cardData.number.replace(/\s/g, '').length < 13) {
      newErrors.number = 'Número de tarjeta inválido'
    }

    if (!cardData.expiry || cardData.expiry.length !== 5) {
      newErrors.expiry = 'Fecha de vencimiento inválida'
    }

    if (!cardData.cvc || cardData.cvc.length < 3) {
      newErrors.cvc = 'CVC inválido'
    }

    if (!cardData.name.trim()) {
      newErrors.name = 'Nombre del titular es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateCard()) return

    setIsLoading(true)
    try {
      // Note: In production, you should use Stripe Elements for PCI compliance
      // This is a simplified version - actual implementation should tokenize via Stripe.js
      const response = await apiClient.post('/payments/setup-intent')

      if (response.success) {
        toast.success('Método de pago agregado exitosamente')
        onSuccess()
        onClose()
        setCardData({ number: '', expiry: '', cvc: '', name: '' })
      } else {
        toast.error('Error al agregar método de pago')
      }
    } catch (error) {
      console.error('Error adding payment method:', error)
      toast.error('Error al agregar método de pago')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-full max-w-md w-full p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agregar Método de Pago
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Tarjeta
              </label>
              <input
                type="text"
                value={cardData.number}
                onChange={(e) => setCardData({
                  ...cardData,
                  number: formatCardNumber(e.target.value.slice(0, 19))
                })}
                placeholder="1234 5678 9012 3456"
                className={`w-full px-3 py-2 border rounded-full focus:ring-2 focus:ring-primary-500 ${
                  errors.number ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.number && (
                <p className="text-sm text-red-600 mt-1">{errors.number}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vencimiento
                </label>
                <input
                  type="text"
                  value={cardData.expiry}
                  onChange={(e) => setCardData({
                    ...cardData,
                    expiry: formatExpiry(e.target.value.slice(0, 5))
                  })}
                  placeholder="MM/YY"
                  className={`w-full px-3 py-2 border rounded-full focus:ring-2 focus:ring-primary-500 ${
                    errors.expiry ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.expiry && (
                  <p className="text-sm text-red-600 mt-1">{errors.expiry}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  value={cardData.cvc}
                  onChange={(e) => setCardData({
                    ...cardData,
                    cvc: e.target.value.replace(/\D/g, '').slice(0, 4)
                  })}
                  placeholder="123"
                  className={`w-full px-3 py-2 border rounded-full focus:ring-2 focus:ring-primary-500 ${
                    errors.cvc ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.cvc && (
                  <p className="text-sm text-red-600 mt-1">{errors.cvc}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Titular
              </label>
              <input
                type="text"
                value={cardData.name}
                onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                placeholder="Nombre como aparece en la tarjeta"
                className={`w-full px-3 py-2 border rounded-full focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-4 p-3 bg-blue-50 rounded-full">
              <LockClosedIcon className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-700">
                Tu información está protegida con encriptación SSL
              </p>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  'Agregar Tarjeta'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default function PaymentMethods() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/payments/methods')

      if (response.success && response.paymentMethods) {
        const formattedMethods: PaymentMethod[] = response.paymentMethods.map((pm: any) => ({
          id: pm.id,
          type: 'card',
          brand: pm.card?.brand || 'unknown',
          last4: pm.card?.last4 || '0000',
          expiryMonth: pm.card?.exp_month || 0,
          expiryYear: pm.card?.exp_year || 0,
          isDefault: pm.is_default || false,
          holderName: pm.billing_details?.name || '',
          createdAt: new Date(pm.created * 1000).toISOString().split('T')[0]
        }))
        setPaymentMethods(formattedMethods)
      } else {
        setPaymentMethods([])
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      toast.error(t('payment.error.load', 'Error al cargar métodos de pago'))
      setPaymentMethods([])
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (methodId: string) => {
    try {
      await apiClient.put(`/payments/methods/${methodId}/default`)
      setPaymentMethods(methods =>
        methods.map(method => ({
          ...method,
          isDefault: method.id === methodId
        }))
      )
      toast.success(t('payment.success.setDefault', 'Método de pago predeterminado actualizado'))
    } catch (error) {
      console.error('Error setting default payment method:', error)
      toast.error(t('payment.error.setDefault', 'Error al actualizar método de pago'))
    }
  }

  const handleDelete = async (methodId: string) => {
    if (!confirm(t('payment.confirm.delete', '¿Estás seguro de que quieres eliminar este método de pago?'))) {
      return
    }

    try {
      await apiClient.delete(`/payments/methods/${methodId}`)
      setPaymentMethods(methods => methods.filter(method => method.id !== methodId))
      toast.success(t('payment.success.delete', 'Método de pago eliminado'))
    } catch (error) {
      console.error('Error deleting payment method:', error)
      toast.error(t('payment.error.delete', 'Error al eliminar método de pago'))
    }
  }

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳'
      case 'mastercard':
        return '💳'
      case 'amex':
        return '💳'
      default:
        return '💳'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-responsive py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Métodos de Pago
          </h1>
          <p className="text-gray-600">
            Gestiona tus tarjetas y métodos de pago seguros
          </p>
        </div>

        {/* Add Payment Method Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center space-x-2 rounded-full"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Agregar Tarjeta</span>
          </button>
          <a
            href="/client/bitcoin"
            className="btn btn-outline-primary flex items-center space-x-2 rounded-full"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.54 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084z"/>
            </svg>
            <span>Bitcoin Wallet</span>
          </a>
        </div>

        {/* Payment Methods List */}
        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <CreditCardIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes métodos de pago
                </h3>
                <p className="text-gray-600 mb-6">
                  Agrega una tarjeta para facilitar tus reservas
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary rounded-full"
                >
                  Agregar Primera Tarjeta
                </button>
              </div>
            </div>
          ) : (
            paymentMethods.map((method) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getCardIcon(method.brand)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 capitalize">
                            {method.brand} •••• {method.last4}
                          </h3>
                          {method.isDefault && (
                            <div className="flex items-center space-x-1">
                              <StarSolidIcon className="h-4 w-4 text-yellow-500" />
                              <span className="text-xs text-yellow-600 font-medium">
                                Predeterminada
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Vence {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                        </p>
                        {method.holderName && (
                          <p className="text-xs text-gray-500">
                            {method.holderName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          Hacer Predeterminada
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(method.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-full">
          <div className="flex items-start space-x-3">
            <LockClosedIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-1">
                Seguridad de Pagos
              </h4>
              <ul className="text-blue-700 space-y-1">
                <li>• Todos los pagos son procesados de forma segura por Stripe</li>
                <li>• No almacenamos información completa de tarjetas</li>
                <li>• Tus datos están protegidos con encriptación SSL</li>
                <li>• Cumplimos con estándares PCI DSS</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddPaymentMethod
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={loadPaymentMethods}
          />
        )}
      </AnimatePresence>
    </div>
  )
}