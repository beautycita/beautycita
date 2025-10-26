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
          name: 'Android APK (Latest)',
          description: 'Version 1.0.4 - Optimized build with R2 media',
          size: '~10 MB',
          url: '/downloads/android/beautycita-v1.0.4.apk',
          format: 'APK',
          contents: ['Android app package', 'Direct installation file', 'No Google Play required']
        },
        {
          name: 'Android APK (v1.0.3)',
          description: 'Previous stable version',
          size: '23 MB',
          url: '/downloads/android/beautycita-v1.0.3.apk',
          format: 'APK',
          contents: ['Android app package', 'Stable release', 'All features included']
        },
        {
          name: 'iOS App (Coming Soon)',
          description: 'Apple App Store version in review',
          size: 'TBA',
          url: '#',
          format: 'IPA',
          disabled: true,
          contents: ['iOS app package', 'App Store submission pending', 'TestFlight beta available soon']
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
          size: '~2 MB',
          url: `${R2_PUBLIC_URL}/beautycita/branding/logos.zip`,
          format: 'ZIP',
          contents: [
            '5 logo variations (Smart Mirror, Geometric, Text, etc.)',
            'SVG, PNG (16px-512px), WebP formats',
            'Light & dark mode versions',
            'Transparent backgrounds',
            'Brand guidelines PDF'
          ]
        },
        {
          name: 'Brand Colors',
          description: 'Official color palette and gradients',
          size: '~500 KB',
          url: `${R2_PUBLIC_URL}/beautycita/branding/colors.zip`,
          format: 'ZIP',
          contents: [
            'Pink (#ec4899), Purple (#9333ea), Blue (#3b82f6)',
            'Gradient swatches',
            'CSS variables',
            'Tailwind config',
            'Adobe Swatch Exchange (.ase)'
          ]
        },
        {
          name: 'Typography',
          description: 'Font files and usage guidelines',
          size: '~1 MB',
          url: `${R2_PUBLIC_URL}/beautycita/branding/typography.zip`,
          format: 'ZIP',
          contents: [
            'Playfair Display (headings)',
            'Inter (body text)',
            'Web font files (WOFF2, TTF)',
            'License information',
            'Usage examples'
          ]
        }
      ]
    },
    {
      title: 'Media Kit',
      description: 'Photos, screenshots, and promotional materials',
      icon: PhotoIcon,
      gradient: 'from-blue-500 to-indigo-600',
      items: [
        {
          name: 'App Screenshots',
          description: 'High-resolution screenshots for press',
          size: '~5 MB',
          url: `${R2_PUBLIC_URL}/beautycita/media-kit/screenshots.zip`,
          format: 'ZIP',
          contents: [
            '20+ app screenshots',
            'iOS and Android versions',
            'Multiple screen sizes',
            'Dark & light mode',
            'PNG format (2x, 3x retina)'
          ]
        },
        {
          name: 'Product Photos',
          description: 'Promotional images and banners',
          size: '~8 MB',
          url: `${R2_PUBLIC_URL}/beautycita/media-kit/product-photos.zip`,
          format: 'ZIP',
          contents: [
            'Hero banners',
            'Feature highlights',
            'App in context photos',
            'Social media ready',
            'High-resolution (4K)'
          ]
        },
        {
          name: 'Team Photos',
          description: 'Leadership and team member headshots',
          size: '~3 MB',
          url: `${R2_PUBLIC_URL}/beautycita/media-kit/team.zip`,
          format: 'ZIP',
          contents: [
            'CEO, CTO, CFO, COO headshots',
            'Marketing, HR, Customer Service',
            'Professional photography',
            'Square and portrait formats',
            'JPEG optimized'
          ]
        }
      ]
    },
    {
      title: 'Audio Assets',
      description: 'Sound effects and theme music',
      icon: MusicalNoteIcon,
      gradient: 'from-purple-500 to-pink-600',
      items: [
        {
          name: 'Theme Song',
          description: '"Resplandece" by BeautyCita',
          size: '1 MB',
          url: `${R2_PUBLIC_URL}/audio/resplandece.mp3`,
          format: 'MP3',
          contents: [
            'Official BeautyCita theme song',
            '128 kbps MP3',
            'Duration: 1:30',
            'Spanish language',
            'Royalty-free for promotional use'
          ]
        },
        {
          name: 'Sound Effects Pack',
          description: 'UI sounds and notifications',
          size: '~300 KB',
          url: `${R2_PUBLIC_URL}/beautycita/audio/sound-effects.zip`,
          format: 'ZIP',
          contents: [
            'Appointment confirmation',
            'Booking sparkle',
            'Profile flourish',
            'Error tone',
            'New message alert',
            'WAV format (high quality)'
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
          size: '~2 MB',
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
          size: '~1 MB',
          url: `${R2_PUBLIC_URL}/beautycita/docs/press-kit.pdf`,
          format: 'PDF',
          contents: [
            'Company overview',
            'Latest press releases',
            'Key statistics',
            'Executive bios',
            'Contact information'
          ]
        },
        {
          name: 'API Documentation',
          description: 'Developer integration guide',
          size: '~500 KB',
          url: `${R2_PUBLIC_URL}/beautycita/docs/api-docs.pdf`,
          format: 'PDF',
          contents: [
            'REST API endpoints',
            'Authentication methods',
            'WebAuthn integration',
            'Stripe Connect setup',
            'Code examples'
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
