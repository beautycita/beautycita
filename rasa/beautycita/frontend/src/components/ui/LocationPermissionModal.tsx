import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinIcon,
  XMarkIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
  onDeny: () => void;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onAllow,
  onDeny,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md">
              {/* Beauty background with glassmorphism */}
              <div className="absolute inset-0 bg-gradient-cotton-candy rounded-3xl opacity-20 animate-beauty-pulse"></div>

              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-beauty-soft border border-white/30">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/70 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>

                {/* Header with floating elements */}
                <div className="text-center mb-6 relative">
                  {/* Floating sparkles */}
                  <div className="absolute -top-2 -left-2">
                    <SparklesIcon className="h-6 w-6 text-beauty-blush animate-glitter" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <HeartIcon className="h-5 w-5 text-beauty-hot-pink animate-heart-beat" />
                  </div>

                  {/* Main icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-rose-gold rounded-full flex items-center justify-center shadow-rose-gold-glow"
                  >
                    <MapPinIcon className="h-10 w-10 text-white" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-800 mb-2"
                  >
                    Find Stylists Near You! 💄
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 leading-relaxed"
                  >
                    Allow location access to discover amazing beauty professionals in your area and see exact distances.
                  </motion.p>
                </div>

                {/* Benefits list */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3 mb-6"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-beauty-blush to-beauty-coral rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✨</span>
                    </div>
                    <span className="text-sm text-gray-700">See distance to each stylist</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-beauty-lavender to-beauty-lilac rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">📍</span>
                    </div>
                    <span className="text-sm text-gray-700">Find the closest available appointments</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-beauty-mint to-beauty-lime-green rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">💖</span>
                    </div>
                    <span className="text-sm text-gray-700">Get personalized recommendations</span>
                  </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <button
                    onClick={onAllow}
                    className="w-full py-4 bg-gradient-rose-gold text-white font-semibold rounded-2xl hover:shadow-rose-gold-glow transition-all duration-300 transform hover:scale-105"
                  >
                    Allow Location Access ✨
                  </button>

                  <button
                    onClick={onDeny}
                    className="w-full py-3 text-gray-600 font-medium rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    Maybe Later
                  </button>
                </motion.div>

                {/* Privacy note */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-4 text-center"
                >
                  <p className="text-xs text-gray-500">
                    🔒 Your location is only used to show nearby stylists and is never shared
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LocationPermissionModal;