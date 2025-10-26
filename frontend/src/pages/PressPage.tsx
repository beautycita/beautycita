import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NewspaperIcon, DocumentArrowDownIcon, EnvelopeIcon, CameraIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline'

const R2_PUBLIC_URL = 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev'

const PressPage: React.FC = () => {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const newsItems = [
    { gradient: 'from-pink-500 to-purple-600', key: 'news1', slug: '10000-bookings-milestone' },
    { gradient: 'from-purple-500 to-blue-600', key: 'news2', slug: 'theme-song-launch' },
    { gradient: 'from-blue-500 to-indigo-600', key: 'news3', slug: 'in-house-creative' }
  ]

  const milestones = ['m1', 'm2', 'm3', 'm4', 'm5'].map(key => ({
    key,
    icon: key.includes('2') || key.includes('3') ? <TrophyIcon className="h-6 w-6" /> : <SparklesIcon className="h-6 w-6" />
  }))

  const mediaAssets = [
    { key: 'asset1', icon: DocumentArrowDownIcon, gradient: 'from-pink-500 to-purple-600', downloadUrl: '/downloads' },
    { key: 'asset2', icon: CameraIcon, gradient: 'from-purple-500 to-blue-600', downloadUrl: '/downloads' },
    { key: 'asset3', icon: CameraIcon, gradient: 'from-blue-500 to-indigo-600', downloadUrl: '/downloads' },
    { key: 'asset4', icon: CameraIcon, gradient: 'from-purple-500 to-pink-600', downloadUrl: '/downloads' }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero with Video Background */}
      <div className="relative text-white py-24 overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={`${R2_PUBLIC_URL}/beautycita/videos/banner0.mp4`} type="video/mp4" />
        </video>

        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/80 via-purple-500/80 to-blue-500/80" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 drop-shadow-lg">
              {t('pages.press.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 drop-shadow-md">{t('pages.press.hero.subtitle')}</p>
          </motion.div>
        </div>
      </div>

      {/* News */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {t('pages.press.news.heading')}
          </h2>
          <div className="space-y-6">
            {newsItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 md:p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${item.gradient} text-white`}>
                        {t(`pages.press.news.${item.key}.source`)}
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t(`pages.press.news.${item.key}.date`)}
                      </span>
                    </div>
                    <h3 className={`text-2xl font-serif font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t(`pages.press.news.${item.key}.title`)}
                    </h3>
                    <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t(`pages.press.news.${item.key}.excerpt`)}
                    </p>
                  </div>
                  <Link
                    to={`/blog/${item.slug}`}
                    className={`px-8 py-4 rounded-full font-semibold bg-gradient-to-r ${item.gradient} text-white hover:shadow-lg transition-all hover:-translate-y-1 inline-block text-center`}
                  >
                    {t('pages.press.news.readMore')}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className={`py-16 md:py-20 ${isDarkMode ? 'bg-gray-800/30' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {t('pages.press.milestones.heading')}
          </h2>
          <div className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gradient-to-br from-pink-500/20 to-purple-600/20' : 'bg-gradient-to-br from-pink-50 to-purple-50'}`}>
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-6"
                >
                  <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                    <div className="text-white">{m.icon}</div>
                    {t(`pages.press.milestones.${m.key}.year`)}
                  </div>
                  <p className={`text-lg flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t(`pages.press.milestones.${m.key}.event`)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.press.mediaKit.heading')}
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('pages.press.mediaKit.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mediaAssets.map((asset, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'} transition-all hover:shadow-xl hover:-translate-y-1`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-full bg-gradient-to-br ${asset.gradient}`}>
                    <asset.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t(`pages.press.mediaKit.${asset.key}.name`)}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t(`pages.press.mediaKit.${asset.key}.description`)}
                    </p>
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {t(`pages.press.mediaKit.${asset.key}.size`)}
                    </p>
                  </div>
                </div>
                <Link
                  to={asset.downloadUrl}
                  className={`w-full px-6 py-3 rounded-full font-semibold bg-gradient-to-r ${asset.gradient} text-white hover:shadow-lg transition-all block text-center`}
                >
                  View Downloads
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className={`py-16 ${isDarkMode ? 'bg-gray-800/30' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <EnvelopeIcon className="h-16 w-16 mx-auto mb-4 text-pink-600" />
            <h2 className="text-3xl font-serif font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.press.contact.heading')}
            </h2>
            <a href="mailto:press@beautycita.com" className="text-2xl font-semibold text-pink-600 hover:text-purple-600 transition-colors">
              {t('pages.press.contact.email')}
            </a>
            <p className={`text-sm mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('pages.press.contact.response')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PressPage
