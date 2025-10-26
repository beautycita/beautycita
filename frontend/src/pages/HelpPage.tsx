import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

const HelpPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => {
      setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const helpCategories = [
    {
      icon: RocketLaunchIcon,
      title: t('pages.help.categories.gettingStarted.title'),
      description: t('pages.help.categories.gettingStarted.description'),
      articles: 8,
      gradient: 'from-pink-500 to-purple-600',
      link: '/about'
    },
    {
      icon: CalendarIcon,
      title: t('pages.help.categories.booking.title'),
      description: t('pages.help.categories.booking.description'),
      articles: 8,
      gradient: 'from-purple-500 to-blue-600',
      link: '/booking'
    },
    {
      icon: CreditCardIcon,
      title: t('pages.help.categories.payments.title'),
      description: t('pages.help.categories.payments.description'),
      articles: 6,
      gradient: 'from-blue-500 to-indigo-600',
      link: '/payment-methods'
    },
    {
      icon: UserIcon,
      title: t('pages.help.categories.account.title'),
      description: t('pages.help.categories.account.description'),
      articles: 5,
      gradient: 'from-indigo-500 to-purple-600',
      link: '/settings'
    },
    {
      icon: ShieldCheckIcon,
      title: t('pages.help.categories.safety.title'),
      description: t('pages.help.categories.safety.description'),
      articles: 7,
      gradient: 'from-purple-500 to-pink-600',
      link: '/privacy'
    }
  ]

  const faqs = Array.from({ length: 6 }, (_, i) => ({
    question: t(`pages.help.faqs.${i}.question`),
    answer: t(`pages.help.faqs.${i}.answer`)
  }))

  const popularArticles = Array.from({ length: 4 }, (_, i) => {
    const links = ['/about', '/profile', '/booking', '/stylists']
    const views = [1234, 987, 856, 743]
    return {
      title: t(`pages.help.popularArticles.${i}.title`),
      description: t(`pages.help.popularArticles.${i}.description`),
      views: views[i],
      link: links[i]
    }
  })

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {t('pages.help.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              {t('pages.help.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder={t('pages.help.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-full border-none focus:ring-2 focus:ring-white/50 transition-all text-lg shadow-lg bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Help Categories */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.help.popularTopics')}
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('pages.help.helpText.browseByTopic')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => navigate(category.link)}
                className={`rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDarkMode
                    ? 'bg-gray-800 border border-gray-700'
                    : 'bg-white shadow-md border border-gray-100'
                }`}
              >
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-full bg-gradient-to-r ${category.gradient} shadow-lg`}>
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className={`text-xl font-bold mb-3 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {category.title}
                </h3>
                <p className={`text-sm text-center mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {category.description}
                </p>
                <div className="text-center">
                  <span className={`text-xs px-3 py-1.5 rounded-full ${
                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700'
                  }`}>
                    {category.articles} {t('pages.help.categories.articlesCount')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`py-16 md:py-20 ${isDarkMode ? 'bg-gray-800/30' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.help.faq')}
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('pages.help.helpText.quickAnswers')}
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                className={`rounded-2xl overflow-hidden ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'
                }`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className={`w-full p-6 text-left flex justify-between items-center transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <h3 className={`text-lg font-semibold pr-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {faq.question}
                  </h3>
                  <ChevronDownIcon
                    className={`h-5 w-5 flex-shrink-0 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  />
                </button>
                {expandedFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.help.helpText.popularArticlesHeading')}
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('pages.help.helpText.popularArticlesSubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {popularArticles.map((article, index) => (
              <motion.div
                key={article.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => navigate(article.link)}
                className={`rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDarkMode
                    ? 'bg-gray-800 border border-gray-700'
                    : 'bg-white shadow-md border border-gray-100'
                }`}
              >
                <h3 className={`text-lg font-bold mb-3 ${
                  isDarkMode ? 'text-white hover:text-purple-400' : 'text-gray-900 hover:text-purple-600'
                } transition-colors`}>
                  {article.title}
                </h3>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {article.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                    {article.views} {t('pages.help.helpText.views')}
                  </span>
                  <span className="font-medium bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {t('pages.help.helpText.readMore')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support CTA */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center text-white relative z-10 px-4"
        >
          <div className="flex justify-center mb-6">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-white/90" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            {t('pages.help.stillNeedHelp')}
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            {t('pages.help.helpText.supportAvailable')}
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            {t('pages.help.contactSupport')}
          </button>
        </motion.div>
      </section>
    </div>
  )
}

export default HelpPage
