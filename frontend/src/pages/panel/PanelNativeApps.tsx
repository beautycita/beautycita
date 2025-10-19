import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CloudArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

interface AppVersion {
  version: string
  buildNumber: number
  releaseDate: string
  fileSize: string
  md5Hash: string
  downloadUrl: string
  changelog: string[]
  isLatest?: boolean
}

interface Platform {
  name: string
  icon: any
  gradient: string
  status: 'available' | 'coming-soon' | 'in-development'
  versions: AppVersion[]
  requirements?: string
  installInstructions?: string[]
}

export default function PanelNativeApps() {
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios' | 'windows'>('android')

  const platforms: Record<'android' | 'ios' | 'windows', Platform> = {
    android: {
      name: 'Android',
      icon: DevicePhoneMobileIcon,
      gradient: 'from-green-500 to-emerald-600',
      status: 'available',
      requirements: 'Android 7.0 (API 24) or higher',
      installInstructions: [
        'Download the APK file to your Android device',
        'Open Settings > Security > Enable "Install from Unknown Sources"',
        'Open the downloaded APK file',
        'Tap "Install" and wait for installation to complete',
        'Open BeautyCita from your app drawer'
      ],
      versions: [
        {
          version: '1.0.3',
          buildNumber: 5,
          releaseDate: '2025-10-16',
          fileSize: '99.0 MB',
          md5Hash: 'c40a96356fbad41298c946c61e7301d9',
          downloadUrl: '/downloads/android/beautycita-v1.0.3.apk',
          changelog: [
            'Fixed QR code generator - QR codes now scan properly (reduced gradient opacity from 85% to 25%, removed edge fading)',
            'Updated Press page with real BeautyCita data (Puerto Vallarta origins, 10K bookings milestone, theme song, in-house artwork)',
            'Updated Careers page - removed unfilled positions (Full Stack Engineer, Product Designer), improved authentic grassroots story',
            'All frontend pages now reflect authentic company data and growth trajectory',
            'Maintained BeautyCita brand identity with pink-purple gradient theme'
          ],
          isLatest: true
        },
        {
          version: '1.0.2',
          buildNumber: 3,
          releaseDate: '2025-10-15',
          fileSize: '94.0 MB',
          md5Hash: 'b79a54c18bcbfb7b795f2c0a027ff45c',
          downloadUrl: '/downloads/android/beautycita-v1.0.2.apk',
          changelog: [
            'Fixed app icon - now displays official BeautyCita gradient logo',
            'Removed adaptive icon XML that was causing incorrect icon display',
            'Icon now shows pink-to-purple-to-blue gradient with white BC text',
            'Resolved issue where black icon with white B was appearing'
          ],
          isLatest: false
        },
        {
          version: '1.0.1',
          buildNumber: 2,
          releaseDate: '2025-10-15',
          fileSize: '93.0 MB',
          md5Hash: 'cffd807e2029a613beba16d2ee7d1a65',
          downloadUrl: '/downloads/android/beautycita-v1.0.1.apk',
          changelog: [
            'Attempted app icon update (icon did not display correctly)',
            'Fixed Enter key submission on login forms',
            'Added Staff Login link for admin access',
            'Improved mobile keyboard handling'
          ],
          isLatest: false
        },
        {
          version: '1.0.0',
          buildNumber: 1,
          releaseDate: '2025-10-15',
          fileSize: '93.7 MB',
          md5Hash: 'cffd807e2029a613beba16d2ee7d1a65',
          downloadUrl: '/downloads/android/beautycita-v1.0.0.apk',
          changelog: [
            'Initial release',
            'Native biometric authentication (fingerprint/face unlock)',
            'Full Spanish/English translation support',
            'Phone verification with SMS',
            'Admin panel access',
            'Marketing Studio with 12 AI-powered tools',
            'Real-time messaging',
            'Booking management',
            'Service browsing',
            'Profile management'
          ],
          isLatest: false
        }
      ]
    },
    ios: {
      name: 'iOS',
      icon: DevicePhoneMobileIcon,
      gradient: 'from-blue-500 to-cyan-600',
      status: 'coming-soon',
      requirements: 'iOS 13.0 or higher',
      installInstructions: [
        'Download from the App Store (coming soon)',
        'Open the BeautyCita app',
        'Grant necessary permissions (camera, notifications)',
        'Sign in with your account'
      ],
      versions: []
    },
    windows: {
      name: 'Windows',
      icon: ComputerDesktopIcon,
      gradient: 'from-blue-600 to-purple-600',
      status: 'in-development',
      requirements: 'Windows 10 or higher',
      installInstructions: [
        'Download from Microsoft Store (in development)',
        'Run the installer',
        'Follow on-screen instructions',
        'Launch BeautyCita from Start Menu'
      ],
      versions: []
    }
  }

  const currentPlatform = platforms[selectedPlatform]
  const latestVersion = currentPlatform.versions.find(v => v.isLatest)

  const getStatusBadge = (status: Platform['status']) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircleIcon className="w-4 h-4" />
            Available
          </span>
        )
      case 'coming-soon':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <ClockIcon className="w-4 h-4" />
            Coming Soon
          </span>
        )
      case 'in-development':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            <CpuChipIcon className="w-4 h-4" />
            In Development
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/panel" className="text-sm text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Back to Panel
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Native Applications
          </h1>
          <p className="mt-2 text-gray-600">
            Download and manage BeautyCita native apps for all platforms
          </p>
        </div>

        {/* Platform Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(Object.keys(platforms) as Array<keyof typeof platforms>).map((platform) => {
            const platformData = platforms[platform]
            const Icon = platformData.icon
            const isSelected = selectedPlatform === platform

            return (
              <motion.button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden rounded-3xl p-6 text-left transition-all ${
                  isSelected
                    ? 'bg-white shadow-2xl ring-2 ring-purple-500'
                    : 'bg-white/80 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r ${platformData.gradient} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{platformData.name}</h3>
                {getStatusBadge(platformData.status)}
              </motion.button>
            )
          })}
        </div>

        {/* Platform Details */}
        <motion.div
          key={selectedPlatform}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          {/* Current Version & Download */}
          {latestVersion ? (
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Latest Version: {latestVersion.version}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <span>Build {latestVersion.buildNumber}</span>
                    <span>•</span>
                    <span>{latestVersion.releaseDate}</span>
                    <span>•</span>
                    <span>{latestVersion.fileSize}</span>
                  </div>
                  <a
                    href={latestVersion.downloadUrl}
                    download
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Download {currentPlatform.name} App
                  </a>
                </div>
                <div className="ml-4">
                  <ShieldCheckIcon className="w-16 h-16 text-purple-600 opacity-20" />
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-gray-50 rounded-2xl text-center">
              <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {currentPlatform.status === 'coming-soon' ? 'Coming Soon' : 'In Development'}
              </h2>
              <p className="text-gray-600">
                The {currentPlatform.name} app is currently {currentPlatform.status === 'coming-soon' ? 'being prepared for release' : 'under active development'}
              </p>
            </div>
          )}

          {/* System Requirements */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CpuChipIcon className="w-5 h-5 text-purple-600" />
              System Requirements
            </h3>
            <p className="text-gray-700">{currentPlatform.requirements}</p>
          </div>

          {/* Installation Instructions */}
          {currentPlatform.installInstructions && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                Installation Instructions
              </h3>
              <ol className="space-y-2">
                {currentPlatform.installInstructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Version History */}
          {currentPlatform.versions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-purple-600" />
                Version History
              </h3>
              <div className="space-y-4">
                {currentPlatform.versions.map((version, index) => (
                  <motion.div
                    key={version.version}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-2xl p-6 ${
                      version.isLatest ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-bold text-gray-900">
                            Version {version.version}
                          </h4>
                          {version.isLatest && (
                            <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                              LATEST
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span>Build {version.buildNumber}</span>
                          <span>•</span>
                          <span>{version.releaseDate}</span>
                          <span>•</span>
                          <span>{version.fileSize}</span>
                        </div>
                      </div>
                      <a
                        href={version.downloadUrl}
                        download
                        className="flex-shrink-0 p-2 text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
                        title="Download this version"
                      >
                        <CloudArrowDownIcon className="w-6 h-6" />
                      </a>
                    </div>

                    {/* Changelog */}
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">What's New:</h5>
                      <ul className="space-y-1">
                        {version.changelog.map((change, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-purple-600 mt-1">•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* MD5 Hash */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">MD5:</span>{' '}
                        <code className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {version.md5Hash}
                        </code>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
