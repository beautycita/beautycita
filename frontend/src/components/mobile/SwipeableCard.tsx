import { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { HeartIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

interface SwipeableCardProps {
  item: {
    id: string
    name: string
    image?: string
    price?: string
    rating?: number
    description?: string
    tags?: string[]
  }
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onTap?: () => void
}

export default function SwipeableCard({
  item,
  onSwipeLeft,
  onSwipeRight,
  onTap
}: SwipeableCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0])
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const scale = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8])

  // Swipe indicators
  const likeOpacity = useTransform(x, [10, 100], [0, 1])
  const rejectOpacity = useTransform(x, [-100, -10], [1, 0])

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100

    if (info.offset.x > threshold) {
      // Swipe right (like)
      onSwipeRight?.()
      setIsLiked(true)
    } else if (info.offset.x < -threshold) {
      // Swipe left (pass)
      onSwipeLeft?.()
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    if (!isLiked) {
      onSwipeRight?.()
    }
  }

  const handlePass = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSwipeLeft?.()
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, opacity, rotate, scale }}
      onDragEnd={handleDragEnd}
      onClick={onTap}
      className="relative w-full max-w-sm mx-auto cursor-pointer"
      whileTap={{ scale: 0.95 }}
    >
      <div className="genz-card rounded-3xl overflow-hidden shadow-neon-pink">
        {/* Image Container */}
        <div className="relative h-64 bg-gradient-sunset">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-4xl font-bold opacity-50">
                {item.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Swipe Indicators */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
          >
            <div className="bg-green-500 text-white px-4 py-2 rounded-3xl font-bold text-lg transform rotate-12">
              ¡ME GUSTA! 💖
            </div>
          </motion.div>

          <motion.div
            style={{ opacity: rejectOpacity }}
            className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
          >
            <div className="bg-red-500 text-white px-4 py-2 rounded-3xl font-bold text-lg transform -rotate-12">
              PASAR 👋
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="absolute bottom-4 right-4 flex space-x-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlePass}
              className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-lg"
            >
              <XMarkIcon className="h-6 w-6 text-red-500" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-lg"
            >
              {isLiked ? (
                <HeartIconSolid className="h-6 w-6 text-neon-pink" />
              ) : (
                <HeartIcon className="h-6 w-6 text-gray-600" />
              )}
            </motion.button>
          </div>

          {/* Rating */}
          {item.rating && (
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-3xl px-3 py-1 flex items-center space-x-1">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-white font-semibold text-sm">
                {item.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white truncate">
              {item.name}
            </h3>
            {item.price && (
              <span className="text-beauty-peach font-bold text-lg">
                {item.price}
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-white/80 text-sm line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-beauty-cyber/20 text-beauty-cyber text-xs px-2 py-1 rounded-3xl border border-beauty-cyber/30"
                >
                  #{tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-white/60 text-xs px-2 py-1">
                  +{item.tags.length - 3} más
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Swipe Hint */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-white/60 text-xs">
          ← Pasar • Tocar para ver • Me gusta →
        </p>
      </div>
    </motion.div>
  )
}