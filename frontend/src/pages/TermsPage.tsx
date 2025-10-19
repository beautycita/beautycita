import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  DocumentTextIcon,
  ScaleIcon,
  UserIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'
import { PageHero, GradientCard } from '../components/ui'

const TermsPage: React.FC = () => {
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
      id: 'acceptance',
      title: t('pages.terms.acceptance'),
      icon: ScaleIcon,
      content: t('pages.terms.acceptanceItems', { returnObjects: true }) as string[],
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      id: 'services',
      title: t('pages.terms.services'),
      icon: UserIcon,
      content: t('pages.terms.servicesItems', { returnObjects: true }) as string[],
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      id: 'accounts',
      title: t('pages.terms.accounts'),
      icon: UserIcon,
      content: t('pages.terms.accountsItems', { returnObjects: true }) as string[],
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'conduct',
      title: t('pages.terms.conduct'),
      icon: ExclamationTriangleIcon,
      content: t('pages.terms.conductItems', { returnObjects: true }) as string[],
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      id: 'payment',
      title: t('pages.terms.payment'),
      icon: CreditCardIcon,
      content: t('pages.terms.paymentItems', { returnObjects: true }) as string[],
      gradient: 'from-pink-500 to-red-500'
    },
    {
      id: 'cancellation',
      title: t('pages.terms.cancellation'),
      icon: PencilSquareIcon,
      content: t('pages.terms.cancellationItems', { returnObjects: true }) as string[],
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      id: 'liability',
      title: t('pages.terms.liability'),
      icon: ExclamationTriangleIcon,
      content: t('pages.terms.liabilityItems', { returnObjects: true }) as string[],
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      id: 'modifications',
      title: t('pages.terms.modifications'),
      icon: PencilSquareIcon,
      content: t('pages.terms.modificationsItems', { returnObjects: true }) as string[],
      gradient: 'from-blue-500 to-indigo-600'
    }
  ]

  const lastUpdated = t('pages.terms.lastUpdated')

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title={t('pages.terms.title')}
        subtitle={t('pages.terms.subtitle')}
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
              Welcome to BeautyCita
            </h2>
            <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('pages.terms.introText')}
            </p>
          </GradientCard>
        </motion.div>
      </section>

      {/* Terms Sections */}
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
            <ScaleIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Questions About These Terms?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            {t('pages.terms.contactText')}
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto border border-white/20">
            <h3 className="text-lg font-semibold mb-4">Legal Department</h3>
            <div className="space-y-2 text-white/90">
              <p>Email: legal@beautycita.com</p>
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
              These Terms of Service are governed by the laws of Mexico.
              Any disputes arising from these terms will be resolved in the courts of Mexico City.
              If any provision of these terms is found to be unenforceable,
              the remaining provisions will continue in full force and effect.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default TermsPage