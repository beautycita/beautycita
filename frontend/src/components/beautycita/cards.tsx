/**
import { getMediaUrl } from '@/config/media'
 * BeautyCita Card Components
 * Specialized cards for services, stylists, bookings, etc.
 */

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import {
  HeartIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

// ============================================================================
// SERVICE CARD
// ============================================================================

interface ServiceCardProps {
  title: string
  description?: string
  price: number | string
  duration?: number
  image?: string
  category?: string
  popular?: boolean
  onBook?: () => void
  onFavorite?: () => void
  isFavorite?: boolean
}

export const ServiceCard = ({
  title,
  description,
  price,
  duration,
  image,
  category,
  popular,
  onBook,
  onFavorite,
  isFavorite
}: ServiceCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl overflow-hidden shadow-beauty-soft hover:shadow-peach-glow transition-all border border-beauty-lilac/10"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-beauty-lavender to-beauty-mint">
        {image ? (
          <img loading="lazy" src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <SparklesIcon className="w-16 h-16 text-white/50" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {popular && (
            <span className="px-3 py-1 bg-gradient-to-r from-beauty-hot-pink to-beauty-electric-purple text-white text-xs font-bold rounded-full shadow-hot-pink-glow">
              Popular ✨
            </span>
          )}
          {category && (
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold rounded-full">
              {category}
            </span>
          )}
        </div>

        {/* Favorite */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFavorite()
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
          >
            {isFavorite ? (
              <HeartSolidIcon className="w-5 h-5 text-beauty-hot-pink" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600">
              <CurrencyDollarIcon className="w-5 h-5" />
              <span className="text-xl font-bold">${price}</span>
            </div>
            {duration && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <ClockIcon className="w-4 h-4" />
                <span>{duration} min</span>
              </div>
            )}
          </div>

          {onBook && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBook}
              className="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-full shadow-beauty-soft hover:shadow-rose-gold-glow transition-all"
            >
              Book
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// STYLIST CARD
// ============================================================================

interface StylistCardProps {
  name: string
  title?: string
  bio?: string
  rating?: number
  reviewCount?: number
  image?: string
  location?: string
  specialties?: string[]
  verified?: boolean
  onView?: () => void
  onMessage?: () => void
}

export const StylistCard = ({
  name,
  title,
  bio,
  rating,
  reviewCount,
  image,
  location,
  specialties,
  verified,
  onView,
  onMessage
}: StylistCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-glass-beauty hover:shadow-lavender-mist transition-all border border-beauty-lilac/20"
    >
      {/* Header with image */}
      <div className="relative h-32 bg-gradient-to-br from-primary-100 to-secondary-100">
        <div className="absolute -bottom-12 left-6">
          <div className="relative">
            <img loading="lazy"
              src={image || getMediaUrl('img/avatar/A0.png')}
              alt={name}
              className="w-24 h-24 rounded-3xl border-4 border-white shadow-beauty-soft object-cover"
            />
            {verified && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-beauty-lime-green p-1 rounded-full">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 px-6 pb-6">
        <div className="mb-3">
          <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            {name}
          </h3>
          {title && <p className="text-sm text-gray-600">{title}</p>}
        </div>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <StarSolidIcon
                  key={i}
                  className={`w-4 h-4 ${i < rating ? 'text-beauty-sunset-orange' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
            {reviewCount && (
              <span className="text-sm text-gray-500">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPinIcon className="w-4 h-4" />
            <span>{location}</span>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{bio}</p>
        )}

        {/* Specialties */}
        {specialties && specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {specialties.slice(0, 3).map((specialty, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 text-xs font-semibold rounded-full border border-primary-200"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onView && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onView}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-2xl shadow-beauty-soft hover:shadow-rose-gold-glow transition-all"
            >
              View Profile
            </motion.button>
          )}
          {onMessage && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMessage}
              className="px-4 py-3 border-2 border-primary-300 text-primary-600 font-bold rounded-2xl hover:bg-primary-50 transition-all"
            >
              💬
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// BOOKING CARD
// ============================================================================

interface BookingCardProps {
  serviceName: string
  stylistName: string
  date: Date | string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  price?: number
  image?: string
  location?: string
  onView?: () => void
  onCancel?: () => void
  onReschedule?: () => void
}

export const BookingCard = ({
  serviceName,
  stylistName,
  date,
  time,
  status,
  price,
  image,
  location,
  onView,
  onCancel,
  onReschedule
}: BookingCardProps) => {
  const statusConfig = {
    pending: {
      color: 'from-beauty-peach to-beauty-sunset-orange',
      icon: <ClockIcon className="w-5 h-5" />,
      text: 'Pending',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    confirmed: {
      color: 'from-green-500 to-beauty-lime-green',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      text: 'Confirmed',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    completed: {
      color: 'from-primary-500 to-secondary-500',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      text: 'Completed',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    cancelled: {
      color: 'from-gray-400 to-gray-500',
      icon: <XCircleIcon className="w-5 h-5" />,
      text: 'Cancelled',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700'
    }
  }

  const config = statusConfig[status]
  const formattedDate = typeof date === 'string' ? date : date.toLocaleDateString()

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-3xl overflow-hidden shadow-beauty-soft hover:shadow-peach-glow transition-all border border-beauty-lilac/10"
    >
      <div className="flex">
        {/* Image */}
        <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-beauty-lavender to-beauty-mint">
          {image ? (
            <img loading="lazy" src={image} alt={serviceName} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <CalendarIcon className="w-8 h-8 text-white/50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-bold text-gray-900">{serviceName}</h4>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <UserIcon className="w-4 h-4" />
                <span>{stylistName}</span>
              </div>
            </div>
            <span className={`px-3 py-1 ${config.bgColor} ${config.textColor} text-xs font-bold rounded-full flex items-center gap-1`}>
              {config.icon}
              {config.text}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              <span>{time}</span>
            </div>
            {location && (
              <div className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {onView && (
              <button
                onClick={onView}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-bold rounded-full hover:shadow-rose-gold-glow transition-all"
              >
                View Details
              </button>
            )}
            {onReschedule && status !== 'cancelled' && status !== 'completed' && (
              <button
                onClick={onReschedule}
                className="px-4 py-2 border border-primary-300 text-primary-600 text-sm font-bold rounded-full hover:bg-primary-50 transition-all"
              >
                Reschedule
              </button>
            )}
            {onCancel && status !== 'cancelled' && status !== 'completed' && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-red-600 text-sm font-semibold hover:bg-red-50 rounded-full transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {price && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-bold text-primary-600">${price}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Export all
export default {
  ServiceCard,
  StylistCard,
  BookingCard
}
