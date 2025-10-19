import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import useGeolocation from '../hooks/useGeolocation';
import { isValidCoordinates } from '../utils/distance';

interface LocationPermissionProps {
  onLocationGranted?: (location: { latitude: number; longitude: number }) => void;
  onLocationDenied?: () => void;
  showOnlyOnMobile?: boolean;
  className?: string;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  onLocationGranted,
  onLocationDenied,
  showOnlyOnMobile = true,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    latitude,
    longitude,
    error,
    loading,
    permission,
    requestPermission,
    isSupported
  } = useGeolocation();

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Determine if we should show the prompt
  useEffect(() => {
    const hasValidLocation = isValidCoordinates(latitude, longitude);
    const hasLocationAccess = permission === 'granted' && hasValidLocation;
    const shouldPrompt = !hasLocationAccess && permission !== 'denied' && !isDismissed;
    const showBasedOnDevice = showOnlyOnMobile ? isMobile : true;

    setShouldShow(showBasedOnDevice && shouldPrompt && isSupported);
  }, [latitude, longitude, permission, isDismissed, isMobile, showOnlyOnMobile, isSupported]);

  // Handle location updates
  useEffect(() => {
    if (isValidCoordinates(latitude, longitude) && permission === 'granted') {
      onLocationGranted?.({ latitude: latitude!, longitude: longitude! });
    }
  }, [latitude, longitude, permission, onLocationGranted]);

  // Handle permission denied
  useEffect(() => {
    if (permission === 'denied' || error?.code === 1) {
      onLocationDenied?.();
    }
  }, [permission, error, onLocationDenied]);

  const handleRequestLocation = async () => {
    const granted = await requestPermission();
    if (!granted) {
      onLocationDenied?.();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onLocationDenied?.();

    // Remember dismissal for this session
    sessionStorage.setItem('locationPermissionDismissed', 'true');
  };

  // Check if user previously dismissed in this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('locationPermissionDismissed');
    if (wasDismissed) {
      setIsDismissed(true);
    }
  }, []);

  if (!shouldShow) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md ${className}`}
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-3xl flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {t('location.permission.title', 'Encuentra estilistas cercanos')}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {t('location.permission.subtitle', 'Ver distancias y opciones cerca de ti')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded-3xl transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-3xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <InformationCircleIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  {t('location.permission.description', 'Permite que BeautyCita acceda a tu ubicación para mostrarte estilistas cercanos y sus distancias.')}
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-3xl"></span>
                    <span>{t('location.benefits.distance', 'Ver distancias exactas')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-3xl"></span>
                    <span>{t('location.benefits.nearby', 'Encontrar opciones cercanas')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-3xl"></span>
                    <span>{t('location.benefits.sort', 'Ordenar por proximidad')}</span>
                  </li>
                </ul>
                <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-yellow-800 text-xs">
                      {t('location.privacy.notice', 'Tu ubicación no se almacena y solo se usa para calcular distancias. Puedes revocar el permiso en cualquier momento desde la configuración de tu navegador.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && error.code !== 1 && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                  <p className="text-red-800 text-sm">
                    {error.code === 2
                      ? t('location.error.unavailable', 'Ubicación no disponible')
                      : error.code === 3
                      ? t('location.error.timeout', 'Tiempo de espera agotado')
                      : t('location.error.generic', 'Error al obtener ubicación')
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <motion.button
                onClick={handleRequestLocation}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-3xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('location.button.loading', 'Obteniendo ubicación...')}</span>
                  </>
                ) : (
                  <>
                    <MapPinIcon className="w-4 h-4" />
                    <span>{t('location.button.allow', 'Permitir ubicación')}</span>
                  </>
                )}
              </motion.button>
              <button
                onClick={handleDismiss}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-3xl hover:bg-gray-50 transition-colors font-medium"
              >
                {t('location.button.later', 'Más tarde')}
              </button>
            </div>

            {/* Already denied help */}
            {permission === 'denied' && (
              <div className="mt-4 p-3 bg-gray-50 rounded-3xl">
                <p className="text-xs text-gray-600 text-center">
                  {t('location.help.denied', 'Para habilitar la ubicación, haz clic en el ícono de ubicación en la barra de direcciones y selecciona "Permitir".')}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationPermission;