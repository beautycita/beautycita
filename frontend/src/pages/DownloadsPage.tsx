import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ArrowDownTrayIcon,
  DevicePhoneMobileIcon,
  PhotoIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const R2_PUBLIC_URL = 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev'

const DownloadsPage: React.FC = () => {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const downloadCategories = [
    {
      title: 'Mobile Apps',
      description: 'Download BeautyCita for your device',
      icon: DevicePhoneMobileIcon,
      gradient: 'from-pink-500 to-purple-600',
      items: [
        {
          name: 'Android Native App (v1.2.0) ⭐ NEW',
          description: 'React Native - Full native experience with offline support',
          size: '~45 MB',
          url: `${R2_PUBLIC_URL}/downloads/mobile-native/BeautyCita-v1.2.0.apk`,
          format: 'APK',
          contents: [
            'Built with React Native (TypeScript)',
            'Biometric authentication (Face ID, Touch ID, Fingerprint)',
            'Real-time chat with Socket.IO',
            'Google Maps integration for stylist discovery',
            'Camera & gallery access for portfolios',
            'Native Stripe payments (Apple Pay, Google Pay)',
            'Push notifications via OneSignal',
            'Full offline support',
            'Dark mode throughout'
          ],
          releaseNotes: '/downloads/mobile-native/RELEASE_NOTES_v1.2.0.md'
        },
        {
          name: 'iOS Native App (v1.2.0) ⭐ NEW',
          description: 'React Native - Optimized for iPhone & iPad',
          size: '~38 MB',
          url: `${R2_PUBLIC_URL}/downloads/mobile-native/BeautyCita-v1.2.0.ipa`,
          format: 'IPA',
          contents: [
            'iOS app package (unsigned for development)',
            'Built with React Native (TypeScript)',
            'Face ID & Touch ID authentication',
            'Apple Pay integration',
            'Real-time messaging',
            'Native maps & location services',
            'Camera integration for portfolios',
            'Push notifications',
            'Requires installation via Xcode/AltStore/TestFlight'
          ],
          releaseNotes: '/downloads/mobile-native/RELEASE_NOTES_v1.2.0.md'
        },
        {
          name: 'Android PWA (v1.0.4)',
          description: 'Progressive Web App - Lightweight version',
          size: '6.2 MB',
          url: `${R2_PUBLIC_URL}/downloads/android/beautycita-v1.0.4-build6.apk`,
          format: 'APK',
          contents: [
            'Progressive Web App (PWA)',
            'Favorite stylists & SMS preferences',
            'Biometric authentication',
            'Video consultations & en route tracking',
            'Media assets loaded from CDN (optimized size)'
          ],
          releaseNotes: '/downloads/RELEASE_NOTES_v1.0.4.md'
        },
        {
          name: 'iOS PWA (v1.0.4)',
          description: 'Progressive Web App - Optimized with CDN',
          size: '3.8 MB',
          url: `${R2_PUBLIC_URL}/downloads/ios/beautycita-v1.0.4-optimized-unsigned.ipa`,
          format: 'IPA',
          contents: [
            'Progressive Web App (PWA)',
            'iOS app package (unsigned)',
            'Media assets loaded from CDN',
            'For development and testing',
            'Requires device installation via Xcode/AltStore'
          ]
        }
      ]
    },
    {
      title: 'Brand Assets',
      description: 'Logos, colors, and typography guidelines',
      icon: PaintBrushIcon,
      gradient: 'from-purple-500 to-blue-600',
      items: [
        {
          name: 'Logo Pack',
          description: 'All logo variations in multiple formats',
          size: '8.5 MB',
          url: `${R2_PUBLIC_URL}/beautycita/branding/logos.zip`,
          format: 'ZIP',
          contents: [
            '9 logo variations (Smart Mirror + variants)',
            'SVG source files',
            'PNG exports (512px)',
            'Light & dark mode versions',
            'Transparent backgrounds'
          ]
        },
        {
          name: 'Brand Colors',
          description: 'Official color palette and gradients',
          size: '2.6 KB',
          url: `${R2_PUBLIC_URL}/beautycita/branding/colors.zip`,
          format: 'ZIP',
          contents: [
            'Pink (#ec4899), Purple (#9333ea), Blue (#3b82f6)',
            'CSS variables file',
            'Tailwind config',
            'Usage documentation'
          ]
        },
        {
          name: 'Typography',
          description: 'Font files and usage guidelines',
          size: '1.6 KB',
          url: `${R2_PUBLIC_URL}/beautycita/branding/typography.zip`,
          format: 'ZIP',
          contents: [
            'Playfair Display (headings)',
            'Inter (body text)',
            'Google Fonts download links',
            'CSS implementation guide',
            'Usage examples'
          ]
        }
      ]
    },
    {
      title: 'Documentation',
      description: 'Brand guidelines, press releases, and FAQs',
      icon: DocumentTextIcon,
      gradient: 'from-indigo-500 to-purple-600',
      items: [
        {
          name: 'Brand Guidelines',
          description: 'Complete brand identity manual',
          size: '385 KB',
          url: `${R2_PUBLIC_URL}/beautycita/docs/brand-guidelines.pdf`,
          format: 'PDF',
          contents: [
            'Logo usage rules',
            'Color palette specifications',
            'Typography guidelines',
            'Tone of voice',
            'Do\'s and Don\'ts'
          ]
        },
        {
          name: 'Press Kit',
          description: 'Company info and press releases',
          size: '495 KB',
          url: `${R2_PUBLIC_URL}/beautycita/docs/press-kit.pdf`,
          format: 'PDF',
          contents: [
            'Company overview',
            'Key statistics',
            'Executive bios',
            'Platform features',
            'Contact information'
          ]
        },
        {
          name: 'API Documentation',
          description: 'Developer integration guide',
          size: '670 KB',
          url: `${R2_PUBLIC_URL}/beautycita/docs/api-docs.pdf`,
          format: 'PDF',
          contents: [
            'REST API endpoints',
            'JWT authentication',
            'WebAuthn integration',
            'Stripe Connect setup',
            'Code examples (cURL, JavaScript)'
          ]
        }
      ]
    }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero */}
      <div className="relative text-white py-24 overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ArrowDownTrayIcon className="h-20 w-20 mx-auto mb-6 drop-shadow-lg" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 drop-shadow-lg">
              Downloads
            </h1>
            <p className="text-xl md:text-2xl text-white/90 drop-shadow-md max-w-3xl mx-auto">
              Access BeautyCita apps, branding materials, media kits, and documentation
            </p>
          </motion.div>
        </div>
      </div>

      {/* Download Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {downloadCategories.map((category, catIndex) => (
          <motion.section
            key={catIndex}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: catIndex * 0.1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            {/* Category Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${category.gradient}`}>
                <category.icon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className={`text-3xl md:text-4xl font-serif font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {category.title}
                </h2>
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {category.description}
                </p>
              </div>
            </div>

            {/* Download Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={itemIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: itemIndex * 0.1 }}
                  viewport={{ once: true }}
                  className={`rounded-3xl p-6 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'
                  } ${item.disabled ? 'opacity-60' : 'hover:shadow-xl hover:-translate-y-1'} transition-all`}
                >
                  {/* Item Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${category.gradient} text-white`}>
                        {item.format}
                      </span>
                    </div>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                    <p className={`text-xs font-mono ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {item.size}
                    </p>
                  </div>

                  {/* Contents List */}
                  <div className={`mb-4 p-4 rounded-2xl ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Contents:
                    </p>
                    <ul className="space-y-1">
                      {item.contents.map((content, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircleIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {content}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Download Button */}
                  {item.disabled ? (
                    <button
                      disabled
                      className={`w-full px-6 py-3 rounded-full font-semibold bg-gradient-to-r ${category.gradient} text-white opacity-50 cursor-not-allowed`}
                    >
                      Coming Soon
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <a
                        href={item.url}
                        download
                        className={`w-full px-6 py-3 rounded-full font-semibold bg-gradient-to-r ${category.gradient} text-white hover:shadow-lg transition-all block text-center`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <ArrowDownTrayIcon className="h-5 w-5" />
                          Download {item.format}
                        </div>
                      </a>
                      {(item as any).releaseNotes && (
                        <a
                          href={(item as any).releaseNotes}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full px-4 py-2 rounded-full text-sm font-medium border-2 transition-all block text-center ${
                            isDarkMode
                              ? 'border-purple-400 text-purple-400 hover:bg-purple-400/10'
                              : 'border-purple-600 text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          View Release Notes
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      {/* Footer Note */}
      <div className={`py-12 ${isDarkMode ? 'bg-gray-800/30' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-2xl p-8 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Need something else?
            </h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              For custom requests, partnership inquiries, or additional materials, contact our press team.
            </p>
            <a
              href="mailto:press@beautycita.com"
              className="inline-block px-8 py-4 rounded-full font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg transition-all"
            >
              Contact Press Team
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DownloadsPage
