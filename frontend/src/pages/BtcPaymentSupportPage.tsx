import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { PageHero, GradientCard } from '../components/ui'
import { apiClient } from '../services/api'
import toast from 'react-hot-toast'

const BtcPaymentSupportPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    orderId: '',
    invoiceId: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Extract OrderId and InvoiceId from URL parameters
  useEffect(() => {
    const orderId = searchParams.get('OrderId') || searchParams.get('orderId') || ''
    const invoiceId = searchParams.get('InvoiceId') || searchParams.get('invoiceId') || ''

    setFormData(prev => ({
      ...prev,
      orderId,
      invoiceId
    }))
  }, [searchParams])

  // Check dark mode
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)

    const handleStorageChange = () => {
      const newDarkMode = localStorage.getItem('darkMode') === 'true'
      setIsDarkMode(newDarkMode)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await apiClient.post('/contact', {
        ...formData,
        subject: `Bitcoin Payment Support - Invoice ${formData.invoiceId || 'Unknown'}`,
        inquiryType: 'btc-payment-support',
        userType: 'btc-payment-support'
      })

      if (response.success) {
        toast.success('Support request submitted successfully! We\'ll contact you within 24 hours.')
        setFormData({
          ...formData,
          name: '',
          email: '',
          phone: '',
          message: ''
        })
      } else {
        toast.error('Failed to submit support request. Please try again or contact us directly.')
      }
    } catch (error) {
      console.error('Error submitting BTC support form:', error)
      toast.error('Failed to submit support request. Please contact support@beautycita.com directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const commonIssues = [
    {
      icon: ClockIcon,
      title: 'Payment Expired',
      description: 'Your invoice expired before payment was completed',
      solution: 'Contact us to create a new invoice with extended time',
      gradient: 'from-orange-500 to-red-600'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Partial Payment',
      description: 'Payment was sent but amount was insufficient',
      solution: 'We can help you complete the payment or issue a refund',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      icon: XCircleIcon,
      title: 'Transaction Failed',
      description: 'Transaction was broadcast but not confirmed',
      solution: 'Our team can track your transaction and resolve the issue',
      gradient: 'from-red-500 to-pink-600'
    },
    {
      icon: ExclamationTriangleIcon,
      title: 'Wrong Amount Sent',
      description: 'Sent more or less than the invoice amount',
      solution: 'We\'ll reconcile the payment and process accordingly',
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  const supportChannels = [
    {
      icon: EnvelopeIcon,
      title: 'Email Support',
      contact: 'support@beautycita.com',
      description: 'Response within 24 hours',
      action: `mailto:support@beautycita.com?subject=Bitcoin%20Payment%20Issue%20-%20Invoice%20${formData.invoiceId || 'Unknown'}&body=Order%20ID:%20${formData.orderId || 'N/A'}%0AInvoice%20ID:%20${formData.invoiceId || 'N/A'}%0A%0APlease%20describe%20your%20issue:%0A`,
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Live Chat',
      contact: 'Available 9 AM - 6 PM PST',
      description: 'Instant support during business hours',
      action: '/contact',
      gradient: 'from-purple-500 to-blue-600'
    }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title="Bitcoin Payment Support"
        subtitle="We're here to help resolve any issues with your Bitcoin payment"
        gradient="from-orange-500 via-yellow-500 to-orange-600"
        isDarkMode={isDarkMode}
        height="h-96"
      />

      {/* Order/Invoice Info Banner */}
      {(formData.orderId || formData.invoiceId) && (
        <section className="container mx-auto px-4 max-w-7xl -mt-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GradientCard
              gradient="from-orange-500/20 to-yellow-500/20"
              isDarkMode={isDarkMode}
              hoverable={false}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-12 w-12 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Payment Details
                  </h3>
                  <div className={`grid md:grid-cols-2 gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {formData.orderId && (
                      <div>
                        <span className="font-semibold">Order ID:</span> {formData.orderId}
                      </div>
                    )}
                    {formData.invoiceId && (
                      <div>
                        <span className="font-semibold">Invoice ID:</span> {formData.invoiceId}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GradientCard>
          </motion.div>
        </section>
      )}

      {/* Common Issues */}
      <section className="container mx-auto px-4 max-w-7xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Common Payment Issues
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Select your issue or describe it in the form below
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {commonIssues.map((issue, index) => (
            <motion.div
              key={issue.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GradientCard
                gradient={issue.gradient}
                isDarkMode={isDarkMode}
                hoverable={true}
                delay={index * 0.05}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full bg-gradient-to-br ${issue.gradient}`}>
                      <issue.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {issue.title}
                  </h3>
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {issue.description}
                  </p>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} bg-white/10 rounded-full px-3 py-2`}>
                    ✓ {issue.solution}
                  </div>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>

        {/* Support Form and Channels */}
        <div className="grid md:grid-cols-2 gap-12">
          {/* Support Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <GradientCard
              gradient="from-orange-500/10 via-yellow-500/10 to-orange-600/10"
              isDarkMode={isDarkMode}
              hoverable={false}
            >
              <h2 className={`text-3xl md:text-4xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Submit Support Request
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 rounded-full border transition-all focus:ring-4 focus:ring-orange-500/50 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 rounded-full border transition-all focus:ring-4 focus:ring-orange-500/50 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-full border transition-all focus:ring-4 focus:ring-orange-500/50 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="orderId" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Order ID
                  </label>
                  <input
                    type="text"
                    id="orderId"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleInputChange}
                    disabled
                    className={`w-full px-4 py-3 rounded-full border transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-400'
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="invoiceId" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Invoice ID
                  </label>
                  <input
                    type="text"
                    id="invoiceId"
                    name="invoiceId"
                    value={formData.invoiceId}
                    onChange={handleInputChange}
                    disabled
                    className={`w-full px-4 py-3 rounded-full border transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-400'
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="message" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Describe the issue *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Please provide details about the payment issue, including transaction ID if available..."
                    className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-orange-500/50 resize-none ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-yellow-600 text-white font-medium rounded-full hover:from-orange-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Support Request'}</span>
                </button>
              </form>
            </GradientCard>
          </motion.div>

          {/* Support Channels */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <GradientCard
              gradient="from-blue-500/10 to-purple-500/10"
              isDarkMode={isDarkMode}
              hoverable={false}
            >
              <h2 className={`text-3xl md:text-4xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Other Ways to Contact Us
              </h2>
              <div className="space-y-6">
                {supportChannels.map((channel, index) => (
                  <div key={channel.title} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${channel.gradient} flex items-center justify-center`}>
                        <channel.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {channel.title}
                      </h3>
                      <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {channel.description}
                      </p>
                      <a
                        href={channel.action}
                        className="text-sm font-medium bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent hover:from-orange-700 hover:to-yellow-700 transition-all"
                      >
                        {channel.contact}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </GradientCard>

            <GradientCard
              gradient="from-green-500/10 to-emerald-500/10"
              isDarkMode={isDarkMode}
              hoverable={false}
            >
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                What to Include in Your Request
              </h3>
              <ul className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Order ID and Invoice ID (auto-filled from URL)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Bitcoin transaction ID/hash if available</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Amount sent and expected amount</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Screenshots of error messages</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Wallet used for payment</span>
                </li>
              </ul>
            </GradientCard>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default BtcPaymentSupportPage
