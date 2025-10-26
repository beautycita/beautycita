import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  BriefcaseIcon,
  RocketLaunchIcon,
  HeartIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  SparklesIcon,
  GlobeAltIcon,
  ChartBarIcon,
  MegaphoneIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

const CareersPage: React.FC = () => {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

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

  const values = [
    {
      icon: <RocketLaunchIcon className="h-8 w-8" />,
      title: t('pages.careers.values.value1.title'),
      description: t('pages.careers.values.value1.description'),
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: <HeartIcon className="h-8 w-8" />,
      title: t('pages.careers.values.value2.title'),
      description: t('pages.careers.values.value2.description'),
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: t('pages.careers.values.value3.title'),
      description: t('pages.careers.values.value3.description'),
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: t('pages.careers.values.value4.title'),
      description: t('pages.careers.values.value4.description'),
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  const positions = [
    {
      icon: MegaphoneIcon,
      title: t('pages.careers.positions.position1.title'),
      type: t('pages.careers.positions.position1.type'),
      compensation: t('pages.careers.positions.position1.compensation'),
      description: t('pages.careers.positions.position1.description'),
      requirements: [
        t('pages.careers.positions.position1.req1'),
        t('pages.careers.positions.position1.req2'),
        t('pages.careers.positions.position1.req3'),
        t('pages.careers.positions.position1.req4')
      ],
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: HeartIcon,
      title: t('pages.careers.positions.position2.title'),
      type: t('pages.careers.positions.position2.type'),
      compensation: t('pages.careers.positions.position2.compensation'),
      description: t('pages.careers.positions.position2.description'),
      requirements: [
        t('pages.careers.positions.position2.req1'),
        t('pages.careers.positions.position2.req2'),
        t('pages.careers.positions.position2.req3'),
        t('pages.careers.positions.position2.req4')
      ],
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: BuildingOfficeIcon,
      title: t('pages.careers.positions.position3.title'),
      type: t('pages.careers.positions.position3.type'),
      compensation: t('pages.careers.positions.position3.compensation'),
      description: t('pages.careers.positions.position3.description'),
      requirements: [
        t('pages.careers.positions.position3.req1'),
        t('pages.careers.positions.position3.req2'),
        t('pages.careers.positions.position3.req3'),
        t('pages.careers.positions.position3.req4')
      ],
      gradient: 'from-pink-500 to-red-500'
    },
    {
      icon: WrenchScrewdriverIcon,
      title: t('pages.careers.positions.position4.title'),
      type: t('pages.careers.positions.position4.type'),
      compensation: t('pages.careers.positions.position4.compensation'),
      description: t('pages.careers.positions.position4.description'),
      requirements: [
        t('pages.careers.positions.position4.req1'),
        t('pages.careers.positions.position4.req2'),
        t('pages.careers.positions.position4.req3'),
        t('pages.careers.positions.position4.req4')
      ],
      gradient: 'from-purple-600 to-pink-600'
    }
  ]

  const benefits = [
    {
      icon: <GlobeAltIcon className="h-8 w-8" />,
      title: t('pages.careers.benefits.benefit1.title'),
      description: t('pages.careers.benefits.benefit1.description'),
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: <CurrencyDollarIcon className="h-8 w-8" />,
      title: t('pages.careers.benefits.benefit2.title'),
      description: t('pages.careers.benefits.benefit2.description'),
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      icon: <SparklesIcon className="h-8 w-8" />,
      title: t('pages.careers.benefits.benefit3.title'),
      description: t('pages.careers.benefits.benefit3.description'),
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: t('pages.careers.benefits.benefit4.title'),
      description: t('pages.careers.benefits.benefit4.description'),
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section with Video Background */}
      <div className="relative text-white overflow-hidden py-24">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/banner3.mp4" type="video/mp4" />
        </video>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/80 via-purple-500/80 to-blue-500/80"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 drop-shadow-lg">
              {t('pages.careers.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto drop-shadow-md">
              {t('pages.careers.hero.subtitle')}
            </p>
            <div className="inline-block px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm">
              <p className="text-sm font-medium">{t('pages.careers.hero.stats')}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Our Story Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={`rounded-2xl p-8 md:p-12 ${
              isDarkMode
                ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50'
                : 'bg-white shadow-lg'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-8 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.careers.story.heading')}
            </h2>
            <div className="space-y-6">
              <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('pages.careers.story.paragraph1')}
              </p>
              <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('pages.careers.story.paragraph2')}
              </p>
              <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('pages.careers.story.paragraph3')}
              </p>
              <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('pages.careers.story.paragraph4')}
              </p>
              <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('pages.careers.story.paragraph5')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className={`py-16 md:py-20 ${isDarkMode ? 'bg-gray-800/30' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.careers.values.heading')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
                  isDarkMode
                    ? 'bg-gray-800 border border-gray-700'
                    : 'bg-white shadow-md border border-gray-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${value.gradient} flex items-center justify-center text-white mb-4`}>
                  {value.icon}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {value.title}
                </h3>
                <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
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
              {t('pages.careers.positions.heading')}
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('pages.careers.positions.subheading')}
            </p>
          </motion.div>

          <div className="space-y-6">
            {positions.map((position, index) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 md:p-8 transition-all duration-200 hover:shadow-xl ${
                  isDarkMode
                    ? 'bg-gray-800 border border-gray-700'
                    : 'bg-white shadow-md border border-gray-100'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`p-4 rounded-full bg-gradient-to-br ${position.gradient} flex-shrink-0`}>
                        <position.icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-2xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {position.title}
                        </h3>
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {position.type}
                        </span>
                      </div>
                    </div>

                    <div className={`mb-6 p-4 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('pages.careers.positions.compensation')}
                      </p>
                      <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {position.compensation}
                      </p>
                    </div>

                    <p className={`leading-relaxed mb-6 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {position.description}
                    </p>

                    <div className="space-y-3">
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('pages.careers.positions.whatWeLookFor')}
                      </p>
                      <ul className="space-y-2">
                        {position.requirements.map((req, i) => (
                          <li key={i} className="flex items-start space-x-3">
                            <div className={`w-6 h-6 rounded-full mt-0.5 flex-shrink-0 bg-gradient-to-br ${position.gradient} flex items-center justify-center`}>
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="lg:ml-6 flex-shrink-0">
                    <a
                      href="mailto:careers@beautycita.com"
                      className={`inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold bg-gradient-to-r ${position.gradient} text-white hover:shadow-lg transition-all duration-200 hover:-translate-y-1 min-w-[160px] text-center`}
                    >
                      {t('pages.careers.positions.applyNow')}
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={`py-16 md:py-20 ${isDarkMode ? 'bg-gray-800/30' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.careers.benefits.heading')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
                  isDarkMode
                    ? 'bg-gray-800 border border-gray-700'
                    : 'bg-white shadow-md border border-gray-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${benefit.gradient} flex items-center justify-center text-white mb-4`}>
                  {benefit.icon}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {benefit.title}
                </h3>
                <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default CareersPage
