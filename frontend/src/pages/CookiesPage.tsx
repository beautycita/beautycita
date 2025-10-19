import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  CogIcon,
  CheckCircleIcon,
  ChartBarIcon,
  MegaphoneIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import { PageHero, GradientCard } from '../components/ui'

const CookiesPage: React.FC = () => {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

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

  const sections = [
    {
      id: 'what-are-cookies',
      title: t('pages.cookies.whatAreCookies'),
      icon: CogIcon,
      content: [
        'Cookies are small text files stored on your device when you visit our website.',
        'They help us provide you with a better experience by remembering your preferences and improving our services.',
        'Cookies can be session-based (temporary) or persistent (stored for longer periods).',
        'We use cookies in compliance with applicable privacy laws and regulations.'
      ],
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      id: 'how-we-use',
      title: t('pages.cookies.howWeUse'),
      icon: CheckCircleIcon,
      content: [
        'Enhance your browsing experience with personalized features',
        'Analyze website traffic and user behavior patterns',
        'Personalize content based on your preferences',
        'Remember your login status and preferences',
        'Improve our services and platform performance',
        'Provide secure authentication and prevent fraud'
      ],
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      id: 'types-of-cookies',
      title: t('pages.cookies.typesOfCookies'),
      icon: WrenchScrewdriverIcon,
      content: [],
      gradient: 'from-blue-500 to-indigo-600',
      customContent: true
    },
    {
      id: 'managing',
      title: t('pages.cookies.managing'),
      icon: CogIcon,
      content: [
        'You can manage cookies through your browser settings at any time.',
        'Most browsers allow you to view, delete, and block cookies.',
        'Note that disabling certain cookies may affect website functionality.',
        'Essential cookies cannot be disabled as they are required for basic site operations.',
        'You can opt-out of analytics and marketing cookies while maintaining full access to our services.',
        'Changing your cookie preferences will not affect previously collected data.'
      ],
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  const cookieTypes = [
    {
      title: t('pages.cookies.essential'),
      description: 'Required for the website to function properly',
      examples: 'Authentication, security, session management',
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      title: t('pages.cookies.analytics'),
      description: 'Help us understand how visitors use our website',
      examples: 'Page views, user interactions, performance metrics',
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      title: t('pages.cookies.marketing'),
      description: 'Used to personalize ads and marketing content',
      examples: 'Targeted advertising, campaign tracking, user preferences',
      gradient: 'from-blue-500 to-indigo-600'
    }
  ]

  const lastUpdated = t('pages.cookies.lastUpdated')

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title={t('pages.cookies.title')}
        subtitle={t('pages.cookies.subtitle')}
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-96"
      >
        <p className={`text-sm inline-block px-4 py-2 rounded-full mt-4 ${
          isDarkMode
            ? 'bg-gray-800 text-gray-300'
            : 'bg-white/20 text-white backdrop-blur-sm'
        }`}>
          {lastUpdated}
        </p>
      </PageHero>

      {/* Introduction */}
      <section className="container mx-auto px-4 max-w-4xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <GradientCard
            gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10"
            isDarkMode={isDarkMode}
            hoverable={false}
          >
            <h2 className={`text-2xl font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Understanding Our Cookie Policy
            </h2>
            <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              BeautyCita uses cookies to enhance your experience on our platform. This policy explains
              what cookies are, how we use them, and how you can manage your cookie preferences.
              We are committed to transparency and giving you control over your data.
            </p>
          </GradientCard>
        </motion.div>
      </section>

      {/* Cookie Sections */}
      <section className={`py-16 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GradientCard
                  gradient={section.gradient}
                  isDarkMode={isDarkMode}
                  hoverable={false}
                >
                  <div className="flex items-center mb-6">
                    <div className={`p-4 rounded-full bg-gradient-to-br ${section.gradient} mr-4`}>
                      <section.icon className="h-8 w-8 text-white" />
                    </div>
                    <h2 className={`text-2xl md:text-3xl font-serif font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {section.title}
                    </h2>
                  </div>

                  {section.customContent ? (
                    <div className="space-y-6">
                      {cookieTypes.map((type, typeIndex) => (
                        <div key={typeIndex} className="space-y-2">
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gradient-to-br ${type.gradient}`}></div>
                            <div>
                              <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {type.title}
                              </h3>
                              <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {type.description}
                              </p>
                              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Examples: {type.examples}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {section.content.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-start space-x-3"
                        >
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gradient-to-br ${section.gradient}`}></div>
                          <span className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </GradientCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-3xl blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-3xl blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 max-w-4xl text-center text-white relative z-10"
        >
          <div className="flex justify-center mb-6">
            <CogIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Questions About Cookies?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            If you have any questions about our cookie policy or how we use cookies,
            please don't hesitate to contact us.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto border border-white/20">
            <h3 className="text-lg font-semibold mb-4">Privacy Team</h3>
            <div className="space-y-2 text-white/90">
              <p>Email: privacy@beautycita.com</p>
              <p>Address: Av. Insurgentes Sur 1234</p>
              <p>Ciudad de México, México</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Legal Notice */}
      <section className={`py-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <p>
              This Cookie Policy is effective as of the date listed above and may be updated from time to time.
              We will notify you of any material changes by posting the new Cookie Policy on our website
              and updating the "Last Updated" date. Your continued use of our services after such changes
              constitutes acceptance of the updated policy.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default CookiesPage