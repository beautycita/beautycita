import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  FlagIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

const ReportPage: React.FC = () => {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [formData, setFormData] = useState({
    reportType: '',
    reportedUser: '',
    incidentDate: '',
    description: '',
    contactEmail: '',
    urgent: false
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const reportTypes = [
    { value: 'harassment', label: t('report.types.harassment') },
    { value: 'fraud', label: t('report.types.fraud') },
    { value: 'inappropriate', label: t('report.types.inappropriate') },
    { value: 'fake-profile', label: t('report.types.fakeProfile') },
    { value: 'spam', label: t('report.types.spam') },
    { value: 'safety', label: t('report.types.safety') },
    { value: 'payment', label: t('report.types.payment') },
    { value: 'other', label: t('report.types.other') }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setSubmitted(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        reportType: '',
        reportedUser: '',
        incidentDate: '',
        description: '',
        contactEmail: '',
        urgent: false
      })
      setSubmitted(false)
    }, 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <FlagIcon className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {t('report.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {t('report.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Safety Promise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl p-8 mb-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className={`text-3xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('report.safetyMatters')}
              </h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('report.commitment')}
              </p>
            </div>
          </div>

          <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className="flex items-start gap-3">
              <span className="text-pink-500 mt-1">✓</span>
              <p>{t('report.reviewTime')}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-pink-500 mt-1">✓</span>
              <p>{t('report.confidential')}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-pink-500 mt-1">✓</span>
              <p>{t('report.urgentAction')}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-pink-500 mt-1">✓</span>
              <p>{t('report.followUp')}</p>
            </div>
          </div>
        </motion.div>

        {/* Report Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('report.submitted')}
              </h3>
              <p className={`text-lg mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('report.thankYou')}
              </p>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('report.reviewMessage')}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className={`text-2xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('report.reportDetails')}
              </h2>

              {/* Report Type */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('report.reportType')} *
                </label>
                <select
                  name="reportType"
                  value={formData.reportType}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                >
                  <option value="">{t('report.selectType')}</option>
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reported User */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('report.reportedUser')}
                </label>
                <div className="relative">
                  <UserIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    name="reportedUser"
                    value={formData.reportedUser}
                    onChange={handleChange}
                    placeholder={t('report.usernamePlaceholder')}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                  />
                </div>
              </div>

              {/* Incident Date */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('report.incidentDate')} *
                </label>
                <div className="relative">
                  <ClockIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="date"
                    name="incidentDate"
                    value={formData.incidentDate}
                    onChange={handleChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('report.description')} *
                </label>
                <div className="relative">
                  <ChatBubbleLeftRightIcon className={`absolute left-3 top-3 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder={t('report.descriptionPlaceholder')}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none`}
                  />
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('report.contactEmail')} *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                  placeholder={t('report.emailPlaceholder')}
                  className={`w-full px-4 py-3 rounded-xl ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                />
              </div>

              {/* Urgent Checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="urgent"
                  id="urgent"
                  checked={formData.urgent}
                  onChange={handleChange}
                  className="w-5 h-5 rounded text-pink-600 focus:ring-2 focus:ring-pink-500"
                />
                <label htmlFor="urgent" className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('report.urgent')}
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
                >
                  {t('report.submit')}
                </button>
              </div>

              <p className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {t('report.disclaimer')}
              </p>
            </form>
          )}
        </motion.div>

        {/* Emergency Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <div className={`rounded-2xl p-8 ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} border-2 ${isDarkMode ? 'border-red-500/30' : 'border-red-200'}`}>
            <div className="flex items-start gap-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-red-900'}`}>
                  {t('report.emergency')}
                </h3>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-red-800'}`}>
                  {t('report.emergencyMessage')}
                </p>
                <div className="flex gap-4">
                  <a
                    href="tel:911"
                    className="px-6 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-all"
                  >
                    {t('report.call911')}
                  </a>
                  <a
                    href="mailto:safety@beautycita.com"
                    className={`px-6 py-3 rounded-full font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white text-red-600 hover:bg-red-100'
                    }`}
                  >
                    safety@beautycita.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ReportPage
