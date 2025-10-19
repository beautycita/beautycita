import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  NewspaperIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  CameraIcon,
  TrophyIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { PageHero, GradientCard, PageSection, CTASection } from '../components/ui'

const PressPage: React.FC = () => {
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

  const newsItems = [
    {
      date: 'October 12, 2025',
      title: 'BeautyCita Nears 10,000 Bookings Processed',
      excerpt: 'Puerto Vallarta-based beauty booking platform celebrates organic growth milestone, processing nearly 10,000 successful bookings across Mexico and expanding to the US.',
      source: 'BeautyCita Press Release',
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      date: 'September 5, 2025',
      title: 'BeautyCita Launches Original Theme Song',
      excerpt: 'The grassroots platform unveils its brand anthem - an original composition created in-house that celebrates beauty professionals and client connections.',
      source: 'BeautyCita Press Release',
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      date: 'August 18, 2025',
      title: 'All Video & Artwork Created In-House',
      excerpt: 'BeautyCita announces that 100% of their platform videos, graphics, and creative assets are produced by their own team, showcasing authentic storytelling.',
      source: 'BeautyCita Press Release',
      gradient: 'from-blue-500 to-indigo-600'
    }
  ]

  const mediaAssets = [
    {
      name: 'Brand Logo Package',
      description: 'High-resolution BeautyCita logos in PNG, SVG, and vector formats',
      size: '2.3 MB',
      icon: CameraIcon,
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      name: 'Company Photos',
      description: 'Team photos, office images, and company culture shots',
      size: '15.7 MB',
      icon: CameraIcon,
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      name: 'Product Screenshots',
      description: 'High-quality app screenshots, interface demos, and feature highlights',
      size: '8.4 MB',
      icon: DocumentArrowDownIcon,
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      name: 'Founder & Team Photos',
      description: 'Professional headshots and team photos',
      size: '4.2 MB',
      icon: CameraIcon,
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  const milestones = [
    { year: '2023', event: 'BeautyCita founded in Puerto Vallarta, Mexico with grassroots, community-first approach', icon: <SparklesIcon className="h-6 w-6" /> },
    { year: '2024 Q1', event: 'Launched MVP and onboarded first 50 verified beauty professionals locally', icon: <TrophyIcon className="h-6 w-6" /> },
    { year: '2024 Q3', event: 'Expanded beyond Puerto Vallarta to serve clients across Mexico', icon: <TrophyIcon className="h-6 w-6" /> },
    { year: '2025 Q2', event: 'Created original BeautyCita theme song and produced all video/artwork in-house', icon: <SparklesIcon className="h-6 w-6" /> },
    { year: '2025 Q4', event: 'Approaching 10,000 bookings processed with ambitious goal of 50,000 clients', icon: <TrophyIcon className="h-6 w-6" /> }
  ]

  return (
    <div className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
      {/* Hero Section */}
      <PageHero
        title="Press & Media"
        subtitle="Latest news, media resources, and press releases from BeautyCita"
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-96"
      />

      {/* Latest News */}
      <PageSection background="white" isDarkMode={isDarkMode}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
        >
          Latest News & Coverage
        </motion.h2>

        <div className="space-y-6">
          {newsItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GradientCard
                gradient={item.gradient}
                isDarkMode={isDarkMode}
                hoverable={true}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r ${item.gradient} text-white`}>
                        {item.source}
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.date}
                      </span>
                    </div>
                    <h3 className={`text-2xl font-serif font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </h3>
                    <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {item.excerpt}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <button className={`px-6 py-3 rounded-full font-semibold bg-gradient-to-r ${item.gradient} text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300`}>
                      Read More
                    </button>
                  </div>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </PageSection>

      {/* Company Milestones */}
      <PageSection background="gradient" isDarkMode={isDarkMode}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
        >
          Company Milestones
        </motion.h2>

        <GradientCard gradient="from-pink-500 to-purple-600" isDarkMode={isDarkMode}>
          <div className="space-y-6">
            {milestones.map((milestone, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-6 group"
              >
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full font-bold min-w-max shadow-lg group-hover:shadow-xl transition-shadow flex items-center gap-2">
                  <div className="text-white">{milestone.icon}</div>
                  {milestone.year}
                </div>
                <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {milestone.event}
                </p>
              </motion.div>
            ))}
          </div>
        </GradientCard>
      </PageSection>

      {/* Media Kit */}
      <PageSection background="white" isDarkMode={isDarkMode}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <CameraIcon className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Media Kit & Resources
          </h2>
          <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Download high-quality assets, logos, and photos for your coverage of BeautyCita
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {mediaAssets.map((asset, index) => (
            <motion.div
              key={asset.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GradientCard
                gradient={asset.gradient}
                isDarkMode={isDarkMode}
                hoverable={true}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 rounded-full bg-gradient-to-r ${asset.gradient}`}>
                      <asset.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {asset.name}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {asset.description}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {asset.size}
                      </p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-full font-semibold bg-gradient-to-r ${asset.gradient} text-white hover:shadow-lg transition-all`}>
                    Download
                  </button>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </PageSection>

      {/* Press Contact CTA */}
      <PageSection background="gradient" isDarkMode={isDarkMode}>
        <CTASection
          title="Press Inquiries"
          description="For press inquiries, interviews, or additional information, please contact our communications team. We're happy to provide quotes, data, or arrange interviews with our founders."
          primaryAction={{
            label: 'Contact Press Team',
            to: 'mailto:press@beautycita.com'
          }}
          gradient="from-pink-600 via-purple-600 to-blue-600"
          icon={<EnvelopeIcon className="h-16 w-16" />}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <GradientCard
            gradient="from-purple-500/10 to-pink-500/10"
            isDarkMode={isDarkMode}
            hoverable={false}
          >
            <div className="text-center">
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Press Contact Information
              </h3>
              <div className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><strong>Email:</strong> press@beautycita.com</p>
                <p><strong>Phone:</strong> +52 322 688 5420</p>
                <p><strong>Location:</strong> Puerto Vallarta, Jalisco, Mexico</p>
                <p className="text-sm mt-4">
                  Response time: Within 24 hours for all media inquiries
                </p>
              </div>
            </div>
          </GradientCard>
        </motion.div>
      </PageSection>
    </div>
  )
}

export default PressPage
