import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  UserCircleIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BellIcon,
  LockClosedIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

type SettingsCategory =
  | 'notifications'
  | 'preferences'
  | 'help'

interface SettingsCategoryConfig {
  id: SettingsCategory
  icon: typeof UserCircleIcon
  title: string
  description: string
  gradient: string
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, updateProfile } = useAuthStore()
  const [searchParams] = useSearchParams()

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('preferences')
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') === 'true')

  // Handle URL parameter for direct category access
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      const validCategories: SettingsCategory[] = ['notifications', 'preferences', 'help']
      if (validCategories.includes(categoryParam as SettingsCategory)) {
        setActiveCategory(categoryParam as SettingsCategory)
      }
    }
  }, [searchParams])

  // Notification settings state
  const [notifications, setNotifications] = useState({
    bookingConfirmations: true,
    bookingReminders: true,
    paymentReceipts: true,
    promotionalEmails: false,
    smsNotifications: true,
    pushNotifications: true
  })

  // Preferences state
  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: isDarkMode ? 'dark' : 'light',
    currency: 'USD',
    timezone: 'America/Los_Angeles'
  })

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const categories: SettingsCategoryConfig[] = [
    {
      id: 'preferences',
      icon: PaintBrushIcon,
      title: 'App Preferences',
      description: 'Language, theme, and regional settings',
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'notifications',
      icon: BellIcon,
      title: 'Notifications',
      description: 'Email, SMS, and push preferences',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      id: 'help',
      icon: QuestionMarkCircleIcon,
      title: 'Help & Support',
      description: 'FAQs, contact, and documentation',
      gradient: 'from-gray-500 to-gray-700'
    }
  ]

  const handleSaveNotifications = () => {
    // TODO: Save to backend
    toast.success('Notification preferences saved!')
  }

  const handleSavePreferences = () => {
    // Save theme locally
    localStorage.setItem('darkMode', preferences.theme === 'dark' ? 'true' : 'false')
    setIsDarkMode(preferences.theme === 'dark')

    // TODO: Save other preferences to backend
    toast.success('Preferences saved!')
  }

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true)
      // TODO: Implement actual account deletion API call
      // await axios.delete(`${API_URL}/api/users/account`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      //   data: { password: deletePassword }
      // })

      toast.success('Account deletion request submitted')
      setShowDeleteDialog(false)
      // Logout and redirect
      // navigate('/login')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'preferences':
        return (
          <div className="space-y-6">
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              App Preferences
            </h3>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className={`w-full px-4 py-3 rounded-full border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Theme
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                className={`w-full px-4 py-3 rounded-full border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Currency
              </label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className={`w-full px-4 py-3 rounded-full border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
              >
                <option value="USD">USD ($)</option>
                <option value="MXN">MXN ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className={`w-full px-4 py-3 rounded-full border ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:outline-none`}
              >
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Mexico_City">Mexico City</option>
              </select>
            </div>

            <button
              onClick={handleSavePreferences}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Save Preferences
            </button>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Notification Settings
            </h3>

            <div className="space-y-4">
              {[
                { key: 'bookingConfirmations', label: 'Booking Confirmations', description: 'Get notified when bookings are confirmed' },
                { key: 'bookingReminders', label: 'Booking Reminders', description: 'Receive reminders before appointments' },
                { key: 'paymentReceipts', label: 'Payment Receipts', description: 'Email receipts for all payments' },
                { key: 'promotionalEmails', label: 'Promotional Emails', description: 'Receive special offers and updates' },
                { key: 'smsNotifications', label: 'SMS Notifications', description: 'Get text message notifications' },
                { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications on this device' }
              ].map(({ key, label, description }) => (
                <div key={key} className={`flex items-center justify-between p-4 rounded-full ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[key as keyof typeof notifications]}
                      onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveNotifications}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Save Notification Settings
            </button>
          </div>
        )

      case 'help':
        return (
          <div className="space-y-6">
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Help & Support
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/help')}
                className={`w-full flex items-center justify-between p-4 rounded-full ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <QuestionMarkCircleIcon className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    FAQs & Help Center
                  </span>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/contact')}
                className={`w-full flex items-center justify-between p-4 rounded-full ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Contact Support
                  </span>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/privacy')}
                className={`w-full flex items-center justify-between p-4 rounded-full ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <LockClosedIcon className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Privacy Policy
                  </span>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/terms')}
                className={`w-full flex items-center justify-between p-4 rounded-full ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Terms of Service
                  </span>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className={`mt-8 p-4 rounded-full border-2 border-dashed ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'
            }`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>App Version:</strong> 1.0.0<br />
                <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Last Updated:</strong> October 2025
              </p>
            </div>
          </div>
        )

      case 'danger':
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <TrashIcon className="w-8 h-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-900 mb-2">Delete Account</h3>
                  <p className="text-red-700 mb-4">
                    Permanently delete your BeautyCita account and all associated data. This action cannot be undone.
                  </p>

                  <div className="bg-white rounded-xl p-4 mb-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-2">What will be deleted:</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>Profile information and personal data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>Photos, portfolio, and uploaded content</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>Reviews, ratings, and AI chat history</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>Favorites and preferences</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <ShieldCheckIcon className="w-5 h-5" />
                      What will be retained:
                    </h4>
                    <p className="text-sm text-amber-800">
                      Financial records (transaction history, invoices) will be retained for 7 years as required by law.
                      These records will be anonymized within 30 days.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="w-5 h-5" />
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>

            {/* Alternative: Email deletion option */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-2xl p-6`}>
              <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Alternative: Request Deletion via Email
              </h4>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                You can also request account deletion by emailing us at:
              </p>
              <a
                href="mailto:privacy@beautycita.com?subject=Delete My Account"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                <EnvelopeIcon className="w-5 h-5" />
                privacy@beautycita.com
              </a>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="container mx-auto px-4 max-w-7xl py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className={`p-2 rounded-full ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } transition-colors`}
            >
              <ArrowLeftIcon className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Settings
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your account preferences and settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-4 space-y-2`}>
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all ${
                      activeCategory === category.id
                        ? `bg-gradient-to-r ${category.gradient} text-white shadow-md`
                        : isDarkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium truncate">{category.title}</p>
                      <p className={`text-xs truncate ${
                        activeCategory === category.id
                          ? 'text-white/80'
                          : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {category.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderCategoryContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Delete Account?
                </h3>
                <p className="text-gray-600">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeletePassword('')
                  setDeleteConfirmText('')
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeletePassword('')
                  setDeleteConfirmText('')
                }}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword || deleteConfirmText.toLowerCase() !== 'delete'}
                className="flex-1 px-6 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-5 h-5" />
                    Delete Forever
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
