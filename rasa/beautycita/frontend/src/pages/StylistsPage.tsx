import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  CheckBadgeIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

import useGeolocation from '@/hooks/useGeolocation';
import { sortByDistance, formatDistance, getGeolocationErrorMessage, MEXICO_CITIES } from '@/utils/geolocation';
import LocationPermissionModal from '@/components/ui/LocationPermissionModal';
import SwipeableCard from '@/components/mobile/SwipeableCard';

// Mock stylist data with coordinates
const mockStylists = [
  {
    id: '1',
    name: 'Sofia Rodriguez',
    avatar: '/api/placeholder/150/150',
    specialties: ['Coloración', 'Cortes Trendy', 'Maquillaje'],
    rating: 4.9,
    reviewCount: 127,
    yearsExperience: 5,
    isVerified: true,
    isAvailable: true,
    location: { latitude: 19.4326, longitude: -99.1332 }, // CDMX
    bio: 'Especialista en colores vibrantes y looks únicos. ¡Dale vida a tu cabello! 💫',
    priceRange: '$300 - $800',
    nextAvailable: '2h',
    portfolio: ['/api/placeholder/200/200', '/api/placeholder/200/200'],
    instagramHandle: '@sofia_beauty_mx'
  },
  {
    id: '2',
    name: 'Valeria Chen',
    avatar: '/api/placeholder/150/150',
    specialties: ['Nail Art', 'Manicure', 'Diseños 3D'],
    rating: 4.8,
    reviewCount: 89,
    yearsExperience: 3,
    isVerified: true,
    isAvailable: true,
    location: { latitude: 19.4285, longitude: -99.1277 },
    bio: 'Convierte tus uñas en obras de arte. Diseños únicos y creativos ✨',
    priceRange: '$200 - $500',
    nextAvailable: '1h',
    portfolio: ['/api/placeholder/200/200', '/api/placeholder/200/200'],
    instagramHandle: '@valeria_nails'
  },
  {
    id: '3',
    name: 'Isabella Martinez',
    avatar: '/api/placeholder/150/150',
    specialties: ['Maquillaje Editorial', 'Eventos', 'Fotografía'],
    rating: 5.0,
    reviewCount: 203,
    yearsExperience: 8,
    isVerified: true,
    isAvailable: false,
    location: { latitude: 19.4355, longitude: -99.1398 },
    bio: 'Maquillaje que cuenta historias. Perfect para tus momentos especiales 💄',
    priceRange: '$400 - $1200',
    nextAvailable: '3 días',
    portfolio: ['/api/placeholder/200/200', '/api/placeholder/200/200'],
    instagramHandle: '@isa_makeup'
  },
  {
    id: '4',
    name: 'Camila Flores',
    avatar: '/api/placeholder/150/150',
    specialties: ['Extensiones', 'Tratamientos', 'Hidratación'],
    rating: 4.7,
    reviewCount: 156,
    yearsExperience: 6,
    isVerified: true,
    isAvailable: true,
    location: { latitude: 19.4412, longitude: -99.1267 },
    bio: 'Cabello saludable y hermoso. Especialista en cuidado capilar 🌿',
    priceRange: '$350 - $900',
    nextAvailable: '4h',
    portfolio: ['/api/placeholder/200/200', '/api/placeholder/200/200'],
    instagramHandle: '@camila_hair'
  },
  {
    id: '5',
    name: 'Daniela Kim',
    avatar: '/api/placeholder/150/150',
    specialties: ['K-Beauty', 'Skincare', 'Cejas'],
    rating: 4.9,
    reviewCount: 178,
    yearsExperience: 4,
    isVerified: true,
    isAvailable: true,
    location: { latitude: 19.4251, longitude: -99.1345 },
    bio: 'Tu experta en K-Beauty. Skincare y cejas perfectas al estilo coreano 🌸',
    priceRange: '$250 - $600',
    nextAvailable: '6h',
    portfolio: ['/api/placeholder/200/200', '/api/placeholder/200/200'],
    instagramHandle: '@dani_kbeauty'
  }
];

const specialtyFilters = [
  { id: 'all', name: 'Todos', emoji: '✨' },
  { id: 'hair', name: 'Cabello', emoji: '💇‍♀️' },
  { id: 'makeup', name: 'Maquillaje', emoji: '💄' },
  { id: 'nails', name: 'Uñas', emoji: '💅' },
  { id: 'skincare', name: 'Skincare', emoji: '🌸' }
];

export default function StylistsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('grid');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [likedStylists, setLikedStylists] = useState<string[]>([]);
  const [currentStylistIndex, setCurrentStylistIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
    permission,
    requestPermission,
    isSupported
  } = useGeolocation();

  const userLocation = latitude && longitude ? { latitude, longitude } : null;

  // Process stylists with distance calculations
  const processedStylists = useMemo(() => {
    let filtered = mockStylists;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(stylist =>
        stylist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stylist.specialties.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
        stylist.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by specialty
    if (selectedSpecialty !== 'all') {
      const specialtyMap: Record<string, string[]> = {
        hair: ['Coloración', 'Cortes', 'Extensiones', 'Tratamientos'],
        makeup: ['Maquillaje', 'Editorial', 'Eventos'],
        nails: ['Nail Art', 'Manicure', 'Diseños'],
        skincare: ['Skincare', 'Cejas', 'K-Beauty']
      };

      const relevantKeywords = specialtyMap[selectedSpecialty] || [];
      filtered = filtered.filter(stylist =>
        stylist.specialties.some(spec =>
          relevantKeywords.some(keyword => spec.includes(keyword))
        )
      );
    }

    // Filter by availability
    if (showAvailableOnly) {
      filtered = filtered.filter(stylist => stylist.isAvailable);
    }

    // Add distance calculations and sort by distance if location available
    if (userLocation) {
      return sortByDistance(filtered, userLocation, (stylist) => stylist.location);
    }

    return filtered.map(stylist => ({
      ...stylist,
      distance: 0,
      formattedDistance: 'Location needed'
    }));
  }, [searchQuery, selectedSpecialty, showAvailableOnly, userLocation]);

  const handleLocationRequest = async () => {
    setShowLocationModal(false);
    await requestPermission();
  };

  const handleLikeStylist = (stylistId: string) => {
    setLikedStylists(prev =>
      prev.includes(stylistId)
        ? prev.filter(id => id !== stylistId)
        : [...prev, stylistId]
    );
  };

  const handleSwipeRight = () => {
    if (processedStylists[currentStylistIndex]) {
      handleLikeStylist(processedStylists[currentStylistIndex].id);
    }
    if (currentStylistIndex < processedStylists.length - 1) {
      setCurrentStylistIndex(prev => prev + 1);
    }
  };

  const handleSwipeLeft = () => {
    if (currentStylistIndex < processedStylists.length - 1) {
      setCurrentStylistIndex(prev => prev + 1);
    }
  };

  useEffect(() => {
    // Check if we should show location modal
    if (isSupported && !userLocation && !locationError && permission !== 'denied') {
      const timer = setTimeout(() => {
        setShowLocationModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, userLocation, locationError, permission]);

  useEffect(() => {
    // Detect mobile/desktop for view mode
    const isMobile = window.innerWidth < 768;
    setViewMode(isMobile ? 'swipe' : 'grid');
  }, []);

  const currentStylist = processedStylists[currentStylistIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-beauty-blush/20 via-white to-beauty-lavender/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-beauty-blush/20">
        <div className="container-responsive py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-rose-gold bg-clip-text text-transparent mb-2">
              {t('stylists.title')} ✨
            </h1>
            <p className="text-gray-600">
              Encuentra a tu beauty expert perfecta
            </p>
            {userLocation && (
              <p className="text-sm text-beauty-hot-pink mt-1">
                📍 Mostrando estilistas cercanas a ti
              </p>
            )}
          </motion.div>

          {/* Search and filters */}
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('stylists.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-beauty-blush/30 rounded-2xl focus:ring-2 focus:ring-beauty-hot-pink focus:border-transparent placeholder-gray-400 shadow-beauty-soft"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-gradient-rose-gold text-white rounded-2xl shadow-rose-gold-glow hover:shadow-rose-gold-glow transition-all hover:scale-105"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>

              {!userLocation && (
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="px-4 py-3 bg-gradient-mint-fresh text-white rounded-2xl shadow-mint-fresh hover:scale-105 transition-transform"
                >
                  <MapPinIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 py-4">
                    {/* Specialty filters */}
                    <div className="flex flex-wrap gap-2">
                      {specialtyFilters.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setSelectedSpecialty(filter.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedSpecialty === filter.id
                              ? 'bg-gradient-cotton-candy text-white shadow-beauty-soft'
                              : 'bg-white/80 text-gray-600 hover:bg-beauty-blush/20'
                          }`}
                        >
                          {filter.emoji} {filter.name}
                        </button>
                      ))}
                    </div>

                    {/* Availability toggle */}
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAvailableOnly}
                        onChange={(e) => setShowAvailableOnly(e.target.checked)}
                        className="w-5 h-5 text-beauty-hot-pink bg-white border-beauty-blush/30 rounded focus:ring-beauty-hot-pink"
                      />
                      <span className="text-sm text-gray-700">Solo disponibles ahora 🕐</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-responsive py-6">
        {viewMode === 'grid' ? (
          /* Desktop Grid View */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedStylists.map((stylist, index) => (
              <motion.div
                key={stylist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-beauty-soft hover:shadow-peach-glow transition-all duration-300 hover:scale-105 group"
              >
                {/* Stylist image */}
                <div className="relative aspect-square bg-gradient-peachy-keen">
                  <div className="absolute inset-0 bg-gradient-to-br from-beauty-blush/20 to-beauty-coral/20"></div>

                  {/* Distance badge */}
                  {userLocation && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-beauty-hot-pink">
                      📍 {stylist.formattedDistance}
                    </div>
                  )}

                  {/* Like button */}
                  <button
                    onClick={() => handleLikeStylist(stylist.id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    {likedStylists.includes(stylist.id) ? (
                      <HeartIconSolid className="h-5 w-5 text-beauty-hot-pink animate-heart-beat" />
                    ) : (
                      <HeartIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </button>

                  {/* Availability indicator */}
                  <div className="absolute bottom-3 left-3">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      stylist.isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        stylist.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <span>{stylist.isAvailable ? 'Disponible' : 'Ocupada'}</span>
                    </div>
                  </div>
                </div>

                {/* Stylist info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-bold text-gray-800">{stylist.name}</h3>
                        {stylist.isVerified && (
                          <CheckBadgeIcon className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span>{stylist.rating}</span>
                        <span>({stylist.reviewCount})</span>
                        <span>•</span>
                        <span>{stylist.yearsExperience} años</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {stylist.bio}
                  </p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {stylist.specialties.slice(0, 3).map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-beauty-lavender/20 text-beauty-electric-purple text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  {/* Price and next available */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-beauty-hot-pink">
                      {stylist.priceRange}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3" />
                      <span>{stylist.nextAvailable}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Mobile Swipe View */
          <div className="flex justify-center items-center min-h-[500px]">
            {currentStylist ? (
              <SwipeableCard
                item={{
                  ...currentStylist,
                  image: currentStylist.avatar,
                  price: currentStylist.priceRange,
                  description: currentStylist.bio
                }}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onTap={() => console.log('View stylist:', currentStylist.id)}
              />
            ) : (
              <div className="text-center space-y-4">
                <div className="text-6xl">💕</div>
                <h3 className="text-xl font-bold text-gray-800">
                  ¡Has visto todas las estilistas!
                </h3>
                <p className="text-gray-600">
                  {likedStylists.length > 0
                    ? `Te gustaron ${likedStylists.length} estilistas`
                    : 'Prueba con diferentes filtros'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {processedStylists.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No encontramos estilistas
            </h3>
            <p className="text-gray-600">
              Prueba ajustando tus filtros de búsqueda
            </p>
          </motion.div>
        )}
      </div>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onAllow={handleLocationRequest}
        onDeny={() => setShowLocationModal(false)}
      />

      {/* Floating liked count */}
      {likedStylists.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-20 right-4 bg-gradient-rose-gold text-white px-4 py-2 rounded-full shadow-rose-gold-glow z-30"
        >
          💖 {likedStylists.length}
        </motion.div>
      )}
    </div>
  );
}