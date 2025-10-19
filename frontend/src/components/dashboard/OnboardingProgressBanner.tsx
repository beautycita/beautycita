import { motion } from 'framer-motion'
import {
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface OnboardingProgressBannerProps {
  currentStep: number
  totalSteps: number
  progressPercent: number
  nextStepTitle?: string
  onContinue: () => void
  onDismiss?: () => void
  canDismiss?: boolean
}

export default function OnboardingProgressBanner({
  currentStep,
  totalSteps,
  progressPercent,
  nextStepTitle,
  onContinue,
  onDismiss,
  canDismiss = false
}: OnboardingProgressBannerProps) {

  const isComplete = progressPercent >= 100
  const stepsRemaining = totalSteps - currentStep

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-1 shadow-lg mb-8"
    >
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Icon & Status */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                {isComplete ? (
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircleIcon className="h-7 w-7 text-green-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <SparklesIcon className="h-7 w-7 text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isComplete ? (
                    'Profile Complete! 🎉'
                  ) : (
                    `Complete Your Profile`
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {isComplete ? (
                    'Your profile is under review. We\'ll notify you within 24-48 hours.'
                  ) : (
                    `You're ${progressPercent}% complete! ${stepsRemaining} ${stepsRemaining === 1 ? 'step' : 'steps'} remaining.`
                  )}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Progress</span>
                <span className="font-semibold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full"
                />
              </div>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center space-x-2 mb-4">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    i < currentStep
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                      : i === currentStep
                      ? 'bg-purple-300 animate-pulse'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Action Button */}
            {!isComplete && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  <span>~{(totalSteps - currentStep) * 3} min remaining</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onContinue}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <span>
                    {nextStepTitle || `Continue to Step ${currentStep + 1}`}
                  </span>
                  <ArrowRightIcon className="h-4 w-4" />
                </motion.button>
              </div>
            )}

            {/* Complete State Action */}
            {isComplete && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">
                      What's Next?
                    </h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>✓ Our team is reviewing your profile</li>
                      <li>✓ Verifying your Stripe and Bitcoin payment setup</li>
                      <li>✓ You'll receive an email/SMS when approved</li>
                      <li>✓ Estimated approval time: 24-48 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dismiss Button (only if allowed) */}
          {canDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Motivation Messages */}
        {!isComplete && progressPercent > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100"
          >
            <p className="text-sm text-purple-900">
              {progressPercent >= 80 ? (
                <span>🎉 Almost there! You're doing great!</span>
              ) : progressPercent >= 60 ? (
                <span>💪 More than halfway! Keep going!</span>
              ) : progressPercent >= 40 ? (
                <span>⭐ Great progress! You're on your way!</span>
              ) : (
                <span>🚀 Nice start! Aphrodite AI is here to help!</span>
              )}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
