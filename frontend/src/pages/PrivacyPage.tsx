import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  UserIcon,
  ShareIcon,
  EnvelopeIcon,
  ClockIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  GlobeAltIcon,
  ScaleIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { PageHero, GradientCard } from '../components/ui'

const PrivacyPage: React.FC = () => {
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
      id: 'data-collection',
      title: t('pages.privacy.dataCollection', { defaultValue: 'Information We Collect' }),
      icon: EyeIcon,
      content: (t('pages.privacy.dataCollectionItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      id: 'data-use',
      title: t('pages.privacy.dataUse', { defaultValue: 'How We Use Your Information' }),
      icon: UserIcon,
      content: (t('pages.privacy.dataUseItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      id: 'data-sharing',
      title: t('pages.privacy.dataSharing', { defaultValue: 'Data Sharing' }),
      icon: ShareIcon,
      content: (t('pages.privacy.dataSharingItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-blue-500 to-indigo-600',
      note: t('pages.privacy.dataSharingNote', { defaultValue: '' })
    },
    {
      id: 'retention',
      title: t('pages.privacy.retention', { defaultValue: 'Data Retention' }),
      icon: ClockIcon,
      content: (t('pages.privacy.retentionItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'security',
      title: t('pages.privacy.security', { defaultValue: 'Security' }),
      icon: LockClosedIcon,
      content: (t('pages.privacy.securityItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-purple-500 to-pink-600',
      note: t('pages.privacy.securityNote', { defaultValue: '' })
    },
    {
      id: 'your-rights',
      title: t('pages.privacy.rights', { defaultValue: 'Your Rights' }),
      icon: ShieldCheckIcon,
      content: (t('pages.privacy.rightsItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-pink-500 to-red-500',
      note: t('pages.privacy.exerciseRights', { defaultValue: '' })
    },
    {
      id: 'children',
      title: t('pages.privacy.children', { defaultValue: 'Children\'s Privacy' }),
      icon: UserGroupIcon,
      content: [t('pages.privacy.childrenText', { defaultValue: '' })].filter(Boolean),
      gradient: 'from-red-500 to-orange-500'
    },
    {
      id: 'ai',
      title: t('pages.privacy.ai', { defaultValue: 'AI & Automated Decisions' }),
      icon: CpuChipIcon,
      content: (t('pages.privacy.aiItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-orange-500 to-yellow-500'
    },
    {
      id: 'crypto',
      title: t('pages.privacy.crypto', { defaultValue: 'Cryptocurrency Privacy' }),
      icon: CurrencyDollarIcon,
      content: (t('pages.privacy.cryptoItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-yellow-500 to-green-500'
    },
    {
      id: 'location',
      title: t('pages.privacy.location', { defaultValue: 'Location Tracking' }),
      icon: MapPinIcon,
      content: (t('pages.privacy.locationItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-green-500 to-teal-500'
    },
    {
      id: 'cookies',
      title: t('pages.privacy.cookies', { defaultValue: 'Cookies & Tracking' }),
      icon: DocumentTextIcon,
      content: (t('pages.privacy.cookiesItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-teal-500 to-cyan-500'
    },
    {
      id: 'international',
      title: t('pages.privacy.international', { defaultValue: 'International Data Transfers' }),
      icon: GlobeAltIcon,
      content: [t('pages.privacy.internationalText', { defaultValue: '' })].filter(Boolean),
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'compliance',
      title: t('pages.privacy.compliance', { defaultValue: 'Legal Compliance' }),
      icon: ScaleIcon,
      content: (t('pages.privacy.complianceItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'third-party',
      title: t('pages.privacy.thirdParty', { defaultValue: 'Third-Party Services' }),
      icon: ShareIcon,
      content: (t('pages.privacy.thirdPartyItems', { returnObjects: true, defaultValue: [] }) as string[]) || [],
      gradient: 'from-indigo-600 to-purple-600',
      note: t('pages.privacy.thirdPartyNote', { defaultValue: '' })
    }
  ]

  const lastUpdated = t('pages.privacy.lastUpdated')

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title={t('pages.privacy.title')}
        subtitle={t('pages.privacy.subtitle')}
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
              {t('pages.privacy.intro')}
            </h2>
            <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('pages.privacy.introText')}
            </p>
          </GradientCard>
        </motion.div>
      </section>

      {/* Privacy Sections */}
      <section className={`py-16 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-8">
            {sections.filter(section => section.content && section.content.length > 0).map((section, index) => (
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
                  {section.note && (
                    <div className={`mt-6 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-white/50'} border-l-4 border-gradient-to-b ${section.gradient}`}>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} italic`}>
                        {section.note}
                      </p>
                    </div>
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
            <EnvelopeIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            {t('pages.privacy.contact')}
          </h2>
          <p className="text-xl mb-8 text-white/90">
            {t('pages.privacy.contactText')}
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto border border-white/20">
            <h3 className="text-lg font-semibold mb-4">{t('pages.privacy.dpo')}</h3>
            <div className="space-y-3 text-white/90">
              <p className="font-medium">{t('pages.privacy.contactEmail')}</p>
              <p className="text-sm">{t('pages.privacy.contactResponse')}</p>
            </div>
          </div>
          <div className="mt-8 space-y-2 text-sm text-white/80">
            <p className="font-semibold">{t('pages.privacy.california')}</p>
            <p className="max-w-2xl mx-auto">{t('pages.privacy.californiaText')}</p>
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
            <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('pages.privacy.changes')}
            </h3>
            <p className="max-w-3xl mx-auto">
              {t('pages.privacy.changesText')}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default PrivacyPage
