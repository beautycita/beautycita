import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { LockClosedIcon, CreditCardIcon, ShieldCheckIcon, BanknotesIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function SecurePaymentsPage() {
  const [isDarkMode] = useState(false)

  const securityFeatures = [
    {
      icon: LockClosedIcon,
      title: '256-Bit SSL Encryption',
      description: 'Bank-level encryption protects all your payment information'
    },
    {
      icon: ShieldCheckIcon,
      title: 'PCI DSS Compliant',
      description: 'Meets the highest payment security standards globally'
    },
    {
      icon: CreditCardIcon,
      title: 'Secure Card Processing',
      description: 'Partner with Stripe for trusted payment processing'
    },
    {
      icon: BanknotesIcon,
      title: 'Bitcoin Payments',
      description: 'Accept secure cryptocurrency payments via BTCPay Server'
    }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-blue-50 to-purple-50'} py-20`}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <LockClosedIcon className="h-20 w-20 text-blue-500 mx-auto mb-6" />
          <h1 className={`text-5xl md:text-7xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Secure Payments
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Your financial information is protected with military-grade encryption
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {securityFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`p-8 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-xl'}`}
            >
              <feature.icon className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <Link to="/services" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl font-semibold hover:shadow-xl transition-all transform hover:scale-105">
            <CurrencyDollarIcon className="mr-2 h-6 w-6" />
            Start Booking Securely
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
