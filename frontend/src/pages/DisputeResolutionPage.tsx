import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { HandRaisedIcon, ChatBubbleLeftRightIcon, ScaleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function DisputeResolutionPage() {
  const [isDarkMode] = useState(false)

  const resolutionSteps = [
    { icon: ChatBubbleLeftRightIcon, title: 'Open a Dispute', description: 'Contact our support team within 48 hours of service' },
    { icon: ScaleIcon, title: 'Fair Review', description: 'Impartial mediators review evidence from both parties' },
    { icon: HandRaisedIcon, title: 'Resolution', description: 'Quick resolution within 3-5 business days' },
    { icon: ClockIcon, title: '24/7 Support', description: 'Our team is always available to help you' }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-purple-50 to-pink-50'} py-20`}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <HandRaisedIcon className="h-20 w-20 text-purple-500 mx-auto mb-6" />
          <h1 className={`text-5xl md:text-7xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Dispute Resolution
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Fair and fast resolution for any service issues
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {resolutionSteps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`p-6 rounded-3xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
            >
              <step.icon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{step.title}</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <Link to="/help" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-3xl font-semibold hover:shadow-xl transition-all transform hover:scale-105">
            Contact Support Team
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
