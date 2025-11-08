import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  SparklesIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { useState, useEffect } from 'react'

interface OnboardingReminderProps {
  isDarkMode?: boolean
}

export default function OnboardingReminder({ isDarkMode = false }: OnboardingReminderProps) {
  const { user } = useAuthStore()
  const [dismissed, setDismissed] = useState(false)

  // Check if user has dismissed the banner recently
  useEffect(() => {
    const dismissedUntil = localStorage.getItem('onboarding_dismissed_until')
    if (dismissedUntil) {
      const dismissTime = parseInt(dismissedUntil)
      if (Date.now() < dismissTime) {
        setDismissed(true)
      } else {
        localStorage.removeItem('onboarding_dismissed_until')
      }
    }
  }, [])

  const handleDismiss = () => {
    // Dismiss for 24 hours
    const dismissUntil = Date.now() + (24 * 60 * 60 * 1000)
    localStorage.setItem('onboarding_dismissed_until', dismissUntil.toString())
    setDismissed(true)
  }

  // Don't show if:
  // - No user
  // - Profile is complete
  // - User dismissed it
  if (!user || user.profile_complete || user.profileComplete || dismissed) {
    return null
  }

  // Calculate completion steps
  const steps = [
    { completed: !!user.username, label: 'Username' },
    { completed: !!(user.profilePictureUrl || user.profile_picture_url), label: 'Avatar' },
    { completed: !!user.email_verified, label: 'Email' },
    { completed: false, label: 'Payment' }, // We don't track this yet
    { completed: false, label: 'Finances' }  // We don't track this yet
  ]

  const completedCount = steps.filter(s => s.completed).length
  const progressPercent = Math.round((completedCount / steps.length) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <div className={`rounded-3xl border-2 p-6 relative ${
        isDarkMode
          ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-600'
          : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'
      }`}>
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${
            isDarkMode
              ? 'hover:bg-purple-800/50 text-purple-300'
              : 'hover:bg-purple-200 text-purple-600'
          }`}
          title="Dismiss for 24 hours"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pr-8">
          <div className="flex-shrink-0">
            <div className="relative">
              <SparklesIcon className={`h-12 w-12 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-purple-500/20 rounded-3xl blur-xl"
              />
            </div>
          </div>

          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ✨ Complete Your BeautyCita Profile
            </h3>
            <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {completedCount > 0 ? (
                <>You're {progressPercent}% complete! Finish setting up your profile to unlock all features.</>
              ) : (
                <>Set up your profile to start booking amazing beauty services and unlock personalized recommendations from Aphrodite AI!</>
              )}
            </p>

            {/* Progress indicator */}
            <div className="flex items-center gap-2 mt-3">
              <div className={`text-xs font-semibold ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                Profile Progress:
              </div>
              <div className="flex gap-1">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className={`w-8 h-2 rounded-full transition-all ${
                      step.completed
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    title={step.label}
                  />
                ))}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {completedCount}/{steps.length} steps
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 w-full md:w-auto flex gap-2">
            <Link
              to="/profile/onboarding"
              className={`flex-1 md:flex-none px-6 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <SparklesIcon className="h-5 w-5" />
              <span>{completedCount > 0 ? 'Continue Setup' : 'Start Setup'}</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
