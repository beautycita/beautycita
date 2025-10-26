import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Map, List, X, Navigation, Star, MapPin, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Stylist {
  id: number;
  business_name: string;
  profile_picture_url?: string;
  average_rating?: number;
  total_reviews?: number;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  location_city?: string;
  min_price?: number;
  max_price?: number;
  phone?: string;
  distance?: number;
}

interface StylistMapViewProps {
  stylists: Stylist[];
  userLocation?: { latitude: number; longitude: number } | null;
  onStylistSelect?: (stylist: Stylist) => void;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const StylistMapView: React.FC<StylistMapViewProps> = ({
  stylists,
  userLocation,
  onStylistSelect,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerClustererRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isLoading, setIsLoading] = useState(true);

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        setIsLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=places,marker`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setMapLoaded(true);
        setIsLoading(false);
      };

      script.onerror = () => {
        console.error('Failed to load Google Maps');
        toast.error('Failed to load map. Please refresh the page.');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const defaultCenter = userLocation
      ? { lat: userLocation.latitude, lng: userLocation.longitude }
      : { lat: 40.7128, lng: -74.0060 }; // Default to NYC

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: userLocation ? 12 : 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Create info window
    infoWindowRef.current = new window.google.maps.InfoWindow();

    // Add user location marker if available
    if (userLocation) {
      new window.google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        title: 'Your Location'
      });
    }
  }, [mapLoaded, userLocation]);

  // Update markers when stylists change
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Clear existing clusterer
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
    }

    // Filter stylists with valid coordinates
    const validStylists = stylists.filter(
      s => s.location_lat && s.location_lng
    );

    if (validStylists.length === 0) return;

    // Create markers
    const newMarkers = validStylists.map((stylist) => {
      const marker = new window.google.maps.Marker({
        position: { lat: stylist.location_lat!, lng: stylist.location_lng! },
        map: googleMapRef.current,
        title: stylist.business_name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="#EC4899" stroke="#FFFFFF" stroke-width="3"/>
              <path d="M20 10 L20 30 M10 20 L30 20" stroke="#FFFFFF" stroke-width="2"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40)
        }
      });

      marker.addListener('click', () => {
        handleMarkerClick(stylist, marker);
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // Add marker clustering for better performance
    if (window.markerClusterer && newMarkers.length > 10) {
      markerClustererRef.current = new window.markerClusterer.MarkerClusterer({
        map: googleMapRef.current,
        markers: newMarkers,
        algorithm: new window.markerClusterer.GridAlgorithm({ gridSize: 50 })
      });
    }

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();

      if (userLocation) {
        bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude });
      }

      validStylists.forEach(stylist => {
        bounds.extend({ lat: stylist.location_lat!, lng: stylist.location_lng! });
      });

      googleMapRef.current.fitBounds(bounds);

      // Limit max zoom
      const listener = window.google.maps.event.addListener(googleMapRef.current, 'idle', () => {
        if (googleMapRef.current.getZoom() > 15) {
          googleMapRef.current.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [mapLoaded, stylists, userLocation]);

  const handleMarkerClick = useCallback((stylist: Stylist, marker: any) => {
    setSelectedStylist(stylist);

    const content = `
      <div style="max-width: 280px; font-family: system-ui;">
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <img loading="lazy"
            src="${stylist.profile_picture_url || '/default-avatar.png'}"
            alt="${stylist.business_name}"
            style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;"
          />
          <div style="flex: 1;">
            <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1F2937;">
              ${stylist.business_name}
            </h3>
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
              <span style="color: #F59E0B;">★</span>
              <span style="font-size: 14px; color: #6B7280;">
                ${stylist.average_rating?.toFixed(1) || 'New'}
                ${stylist.total_reviews ? `(${stylist.total_reviews})` : ''}
              </span>
            </div>
            ${stylist.distance ? `
              <div style="font-size: 13px; color: #9CA3AF;">
                📍 ${stylist.distance.toFixed(1)} mi away
              </div>
            ` : ''}
          </div>
        </div>

        ${stylist.location_address ? `
          <div style="font-size: 13px; color: #6B7280; margin-bottom: 8px;">
            ${stylist.location_address}, ${stylist.location_city || ''}
          </div>
        ` : ''}

        ${stylist.min_price || stylist.max_price ? `
          <div style="font-size: 14px; color: #059669; font-weight: 500; margin-bottom: 12px;">
            $${stylist.min_price || 0} - $${stylist.max_price || 200}
          </div>
        ` : ''}

        <button
          onclick="window.location.href='/stylist/${stylist.id}'"
          style="
            width: 100%;
            padding: 8px 16px;
            background: linear-gradient(to right, #EC4899, #8B5CF6);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
          "
        >
          View Profile
        </button>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(googleMapRef.current, marker);

    if (onStylistSelect) {
      onStylistSelect(stylist);
    }
  }, [onStylistSelect]);

  const centerOnUser = () => {
    if (userLocation && googleMapRef.current) {
      googleMapRef.current.setCenter({
        lat: userLocation.latitude,
        lng: userLocation.longitude
      });
      googleMapRef.current.setZoom(13);
      toast.success('Centered on your location');
    } else {
      toast.error('Location not available');
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-800 rounded-xl overflow-hidden ${className}`}>
      {/* View Toggle */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-white rounded-lg shadow-lg">
        <button
          onClick={() => setViewMode('map')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'map'
              ? 'bg-pink-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Map className="w-4 h-4 inline mr-2" />
          Map
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-pink-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <List className="w-4 h-4 inline mr-2" />
          List
        </button>
      </div>

      {/* Center on User Button */}
      {userLocation && viewMode === 'map' && (
        <button
          onClick={centerOnUser}
          className="absolute top-4 right-4 z-10 p-3 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
          title="Center on my location"
        >
          <Navigation className="w-5 h-5 text-pink-600" />
        </button>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <div
          ref={mapRef}
          className="w-full h-full min-h-[500px]"
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="w-full h-full min-h-[500px] overflow-y-auto p-4 space-y-3">
          {stylists.map((stylist) => (
            <motion.div
              key={stylist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-700 rounded-xl p-4 hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => window.location.href = `/stylist/${stylist.id}`}
            >
              <div className="flex items-start space-x-4">
                <img loading="lazy"
                  src={stylist.profile_picture_url || '/default-avatar.png'}
                  alt={stylist.business_name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {stylist.business_name}
                  </h3>

                  <div className="flex items-center space-x-4 text-sm text-gray-300 mb-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{stylist.average_rating?.toFixed(1) || 'New'}</span>
                      {stylist.total_reviews && (
                        <span className="text-gray-400">({stylist.total_reviews})</span>
                      )}
                    </div>

                    {stylist.distance && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span>{stylist.distance.toFixed(1)} mi</span>
                      </div>
                    )}
                  </div>

                  {stylist.location_address && (
                    <p className="text-sm text-gray-400 mb-2">
                      {stylist.location_address}, {stylist.location_city}
                    </p>
                  )}

                  {(stylist.min_price || stylist.max_price) && (
                    <div className="text-sm text-green-400 font-medium">
                      ${stylist.min_price || 0} - ${stylist.max_price || 200}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {stylists.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No stylists found in this area</p>
            </div>
          )}
        </div>
      )}

      {/* Stylist Count Badge */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-white rounded-full shadow-lg">
        <span className="text-sm font-medium text-gray-700">
          {stylists.length} stylist{stylists.length !== 1 ? 's' : ''} found
        </span>
      </div>
    </div>
  );
};

export default StylistMapView;
