import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ShieldCheckIcon,
  LockClosedIcon,
  HandRaisedIcon,
  CreditCardIcon,
  CheckBadgeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import VideoSection from '../components/home/VideoSection'

export default function ClientProtectionPage() {
  const [isDarkMode] = useState(false)

  const protectionFeatures = [
    {
      icon: ShieldCheckIcon,
      title: 'Verified Professionals Only',
      description: 'All stylists undergo rigorous background checks and credential verification',
      link: '/verified-professionals',
      color: 'from-green-500 to-teal-600'
    },
    {
      icon: LockClosedIcon,
      title: 'Secure Encrypted Payments',
      description: 'Military-grade encryption protects all your financial information',
      link: '/secure-payments',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: HandRaisedIcon,
      title: 'Fair Dispute Resolution',
      description: '24/7 support team to help resolve any service issues quickly',
      link: '/dispute-resolution',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: CreditCardIcon,
      title: '100% Money-Back Guarantee',
      description: 'Not satisfied? Get a full refund within 48 hours of service',
      link: '/money-back-guarantee',
      color: 'from-pink-500 to-red-600'
    }
  ]

  const safetyStats = [
    { number: '15K+', label: 'Verified Pros' },
    { number: '98%', label: 'Satisfaction Rate' },
    { number: '24/7', label: 'Support Available' },
    { number: '$5M+', label: 'Protected Transactions' }
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
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-block mb-6"
          >
            <ShieldCheckIcon className="h-24 w-24 text-blue-500" />
          </motion.div>

          <h1 className={`text-5xl md:text-7xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Client Protection Program
          </h1>
          <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Your safety and satisfaction are our top priorities. We've built comprehensive protections into every booking.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {safetyStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Protection Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
          {protectionFeatures.map((feature, index) => (
            <Link key={feature.title} to={feature.link}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`p-8 rounded-3xl cursor-pointer transition-all ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gradient-to-br from-gray-50 to-white shadow-lg hover:shadow-2xl'
                }`}
              >
                <div className={`inline-flex p-4 rounded-3xl bg-gradient-to-br ${feature.color} mb-6`}>
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
                <div className="mt-4 text-blue-500 font-semibold flex items-center group">
                  Learn More
                  <svg className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Trust Seal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`p-12 rounded-3xl text-center max-w-4xl mx-auto mb-16 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}
        >
          <div className="flex justify-center gap-4 mb-6">
            <CheckBadgeIcon className="h-16 w-16 text-green-500" />
            <UserGroupIcon className="h-16 w-16 text-blue-500" />
          </div>
          <h3 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Join 250,000+ Protected Clients
          </h3>
          <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Every booking on BeautyCita comes with our comprehensive client protection program. From verified professionals to secure payments and dispute resolution, we've got you covered at every step.
          </p>
        </motion.div>
      </div>

      {/* Wellness & Relaxation Video Section */}
      <VideoSection
        videoSrc="https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/massage.mp4"
        height="h-[60vh]"
        parallaxIntensity={0.3}
        overlayGradient="bg-gradient-to-b from-blue-900/60 via-purple-900/60 to-black/80"
        isDarkMode={isDarkMode}
      >
        <div className="text-center px-4 text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Quality Service, Peace of Mind
            </h2>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto">
              Experience premium wellness services from verified professionals you can trust
            </p>
          </motion.div>
        </div>
      </VideoSection>

      <div className="container mx-auto px-4">
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className={`text-3xl md:text-4xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Ready to Book with Confidence?
          </h2>
          <p className={`text-lg mb-8 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Browse verified professionals and experience worry-free beauty services
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/services"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl font-semibold hover:shadow-xl transition-all transform hover:scale-105"
            >
              <ShieldCheckIcon className="mr-2 h-6 w-6" />
              Browse Services
            </Link>
            <Link
              to="/help"
              className={`inline-flex items-center px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 ${
                isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:shadow-lg'
              }`}
            >
              Contact Support
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
