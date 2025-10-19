import { motion } from 'framer-motion'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface VideoSkeletonProps {
  isLoading?: boolean
  isError?: boolean
  progress?: number
  onRetry?: () => void
  className?: string
}

/**
 * Loading skeleton for video backgrounds
 * Shows shimmer effect while loading, progress bar, and error state
 */
export default function VideoSkeleton({
  isLoading = true,
  isError = false,
  progress = 0,
  onRetry,
  className = ''
}: VideoSkeletonProps) {
  if (isError) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 ${className}`}>
        <div className="text-center p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-4"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
          </motion.div>
          <h3 className="text-white text-lg font-semibold mb-2">
            Video Failed to Load
          </h3>
          <p className="text-white/80 text-sm mb-4">
            Unable to load background video
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-white/20 backdrop-blur-md text-white rounded-3xl hover:bg-white/30 transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!isLoading) {
    return null
  }

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600"
        animate={{
          background: [
            'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
            'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #ec4899 100%)',
            'linear-gradient(135deg, #3b82f6 0%, #ec4899 50%, #8b5cf6 100%)',
            'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
        }}
        animate={{
          x: ['-100%', '200%']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {/* Spinner */}
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/20 border-t-white"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Loading text */}
          <p className="text-white text-sm font-medium mb-2">
            Loading Experience...
          </p>

          {/* Progress bar */}
          {progress > 0 && (
            <div className="w-48 h-1 bg-white/20 rounded-3xl overflow-hidden mx-auto">
              <motion.div
                className="h-full bg-white rounded-3xl"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Progress percentage */}
          {progress > 0 && (
            <p className="text-white/60 text-xs mt-2">
              {Math.round(progress)}%
            </p>
          )}
        </div>
      </div>

      {/* Pulsing dots pattern */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-3xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  )
}
