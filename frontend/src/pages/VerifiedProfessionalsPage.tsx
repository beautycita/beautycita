import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ShieldCheckIcon,
  AcademicCapIcon,
  IdentificationIcon,
  DocumentCheckIcon,
  UserGroupIcon,
  StarIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

export default function VerifiedProfessionalsPage() {
  const [isDarkMode] = useState(false)

  const verificationSteps = [
    {
      icon: IdentificationIcon,
      title: 'Identity Verification',
      description: 'Government-issued ID verification and background checks to ensure safety',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: AcademicCapIcon,
      title: 'Professional Credentials',
      description: 'Verified beauty licenses, certifications, and educational qualifications',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: DocumentCheckIcon,
      title: 'Portfolio Review',
      description: 'Expert review of work samples and before/after transformations',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: UserGroupIcon,
      title: 'Reference Checks',
      description: 'Professional references and client testimonials verified',
      color: 'from-green-500 to-green-600'
    }
  ]

  const stats = [
    { number: '15,000+', label: 'Verified Professionals' },
    { number: '98%', label: 'Approval Rate' },
    { number: '24-48h', label: 'Verification Time' },
    { number: '5-Star', label: 'Average Rating' }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} py-20`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <ShieldCheckIcon className="h-20 w-20 text-green-500" />
          </motion.div>

          <h1 className={`text-5xl md:text-7xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Verified Beauty Professionals
          </h1>
          <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Every professional on BeautyCita undergoes rigorous verification to ensure your safety and satisfaction
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Verification Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className={`text-3xl md:text-4xl font-serif font-bold text-center mb-12 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Our Verification Process
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {verificationSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className={`inline-flex p-4 rounded-3xl bg-gradient-to-br ${step.color} mb-4`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {step.title}
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`p-12 rounded-3xl mb-20 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-green-50 to-blue-50'}`}
        >
          <div className="max-w-4xl mx-auto text-center">
            <CheckBadgeIcon className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h3 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Look for the Verified Badge
            </h3>
            <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              All verified professionals display a green checkmark badge on their profile. This means they've passed our comprehensive verification process and are approved to provide services.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-3xl shadow-md">
                <CheckBadgeIcon className="h-6 w-6 text-green-500" />
                <span className="font-semibold text-gray-900">Background Checked</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-3xl shadow-md">
                <StarIcon className="h-6 w-6 text-yellow-500 fill-current" />
                <span className="font-semibold text-gray-900">5-Star Rated</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-3xl shadow-md">
                <AcademicCapIcon className="h-6 w-6 text-blue-500" />
                <span className="font-semibold text-gray-900">Licensed Pro</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className={`text-3xl md:text-4xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Book with Confidence
          </h2>
          <p className={`text-lg mb-8 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Browse our verified professionals and find your perfect beauty match today
          </p>
          <Link
            to="/stylists"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-3xl font-semibold hover:shadow-xl transition-all transform hover:scale-105"
          >
            <ShieldCheckIcon className="mr-2 h-6 w-6" />
            Browse Verified Professionals
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
