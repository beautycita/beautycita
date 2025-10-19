import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  StarIcon,
  HeartIcon,
  ClockIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import PhoneVerificationModal from '@/components/auth/PhoneVerificationModal';
import { useAuthStore } from '@/store/authStore';

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    price: string;
    rating: number;
    description: string;
    tags: string[];
    category: string;
    duration?: string;
    isPopular?: boolean;
    isNew?: boolean;
  };
  onLike?: (serviceId: string) => void;
  onBook?: (serviceId: string) => void;
  isLiked?: boolean;
  className?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onLike,
  onBook,
  isLiked = false,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuthStore();
  const {
    showPhoneVerification,
    isCheckingAuth,
    checkAuthenticationForBooking,
    handlePhoneVerificationSuccess,
    closePhoneVerification
  } = useBookingFlow();

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'hair':
        return 'from-beauty-blush to-beauty-coral';
      case 'makeup':
        return 'from-beauty-lavender to-beauty-lilac';
      case 'nails':
        return 'from-beauty-mint to-beauty-lime-green';
      case 'skincare':
        return 'from-beauty-peach to-beauty-sunset-orange';
      default:
        return 'from-beauty-rose-gold to-beauty-champagne';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'hair':
        return '💇‍♀️';
      case 'makeup':
        return '💄';
      case 'nails':
        return '💅';
      case 'skincare':
        return '🌸';
      default:
        return '✨';
    }
  };

  const handleBookService = async () => {
    const canProceed = await checkAuthenticationForBooking(service.id);
    if (canProceed && onBook) {
      onBook(service.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-beauty-soft hover:shadow-peach-glow transition-all duration-300 cursor-pointer ${className}`}
      whileHover={{ scale: 1.03, y: -5 }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(service.category)} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>

      {/* Floating elements */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        {service.isPopular && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-r from-beauty-hot-pink to-beauty-electric-purple text-white text-xs px-2 py-1 rounded-full font-medium shadow-hot-pink-glow"
          >
            🔥 Popular
          </motion.div>
        )}
        {service.isNew && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-beauty-lime-green to-beauty-ocean-blue text-white text-xs px-2 py-1 rounded-full font-medium"
          >
            ✨ Nuevo
          </motion.div>
        )}
      </div>

      {/* Like button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onLike?.(service.id);
        }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-beauty-soft z-10"
      >
        {isLiked ? (
          <HeartIconSolid className="h-5 w-5 text-beauty-hot-pink animate-heart-beat" />
        ) : (
          <HeartIcon className="h-5 w-5 text-gray-600 group-hover:text-beauty-hot-pink transition-colors" />
        )}
      </motion.button>

      {/* Main content area */}
      <div className="relative p-6 h-full flex flex-col justify-between min-h-[280px]">
        {/* Service icon/image area */}
        <div className="text-center mb-4">
          <motion.div
            animate={isHovered ? { rotate: 360, scale: 1.1 } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-white/50 to-white/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-sm border border-white/30"
          >
            {getCategoryEmoji(service.category)}
          </motion.div>

          <div className="flex items-center justify-center space-x-1 mb-2">
            <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-gray-700">{service.rating}</span>
          </div>
        </div>

        {/* Service details */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-2 text-center group-hover:text-beauty-hot-pink transition-colors">
            {service.name}
          </h3>

          <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2 leading-relaxed">
            {service.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 justify-center mb-4">
            {service.tags.slice(0, 3).map((tag, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-2 py-1 bg-beauty-lavender/20 text-beauty-electric-purple text-xs rounded-full border border-beauty-lavender/30"
              >
                #{tag}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-beauty-hot-pink">
              {service.price}
            </span>
            {service.duration && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <ClockIcon className="h-3 w-3" />
                <span>{service.duration}</span>
              </div>
            )}
          </div>

          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleBookService();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isCheckingAuth}
            className={`w-full py-3 rounded-2xl font-medium transition-all duration-300 ${
              isHovered
                ? `bg-gradient-to-r ${getCategoryGradient(service.category)} text-white shadow-lg`
                : 'bg-white/50 text-gray-700 border border-gray-200 hover:border-beauty-hot-pink'
            } ${isCheckingAuth ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isCheckingAuth ? (
              <div className="loading-spinner mx-auto" />
            ) : isHovered ? (
              <span className="flex items-center justify-center space-x-2">
                <SparklesIcon className="h-4 w-4" />
                <span>Reservar Ahora</span>
              </span>
            ) : (
              'Ver Detalles'
            )}
          </motion.button>
        </div>
      </div>

      {/* Shimmer effect on hover */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '100%' } : { x: '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 pointer-events-none"
      />

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={closePhoneVerification}
        onSuccess={handlePhoneVerificationSuccess}
        phone={user?.phone}
      />
    </motion.div>
  );
};

export default ServiceCard;