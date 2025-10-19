import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CreditCardIcon, CheckCircleIcon, ShieldCheckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function MoneyBackGuaranteePage() {
  const [isDarkMode] = useState(false)

  const guaranteeTerms = [
    { icon: CheckCircleIcon, title: '100% Satisfaction', description: 'Not happy? Get a full refund within 48 hours' },
    { icon: ShieldCheckIcon, title: 'Zero Risk Booking', description: 'Book with confidence knowing you are protected' },
    { icon: CurrencyDollarIcon, title: 'Fast Refunds', description: 'Refunds processed within 3-5 business days' },
    { icon: CreditCardIcon, title: 'No Questions Asked', description: 'Simple refund process, no complicated forms' }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-pink-50 to-red-50'} py-20`}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <CreditCardIcon className="h-20 w-20 text-pink-500 mx-auto mb-6" />
          <h1 className={`text-5xl md:text-7xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Money-Back Guarantee
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Your satisfaction is guaranteed or your money back
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {guaranteeTerms.map((term, i) => (
            <motion.div
              key={term.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`p-8 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-xl'}`}
            >
              <term.icon className="h-12 w-12 text-pink-500 mb-4" />
              <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{term.title}</h3>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{term.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`p-12 rounded-3xl text-center max-w-4xl mx-auto mb-16 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-pink-100 to-red-100'}`}
        >
          <h3 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>How It Works</h3>
          <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            If you're not completely satisfied with your service, contact us within 48 hours. Our team will review your case and process a full refund if the service didn't meet your expectations.
          </p>
          <div className="text-6xl font-bold text-pink-500 mb-2">100%</div>
          <div className={`text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Money-Back Guarantee</div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <Link to="/services" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-3xl font-semibold hover:shadow-xl transition-all transform hover:scale-105">
            Book Risk-Free Today
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
