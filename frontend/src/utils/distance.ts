export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param coord1 First coordinate point
 * @param coord2 Second coordinate point
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers

  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLngRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @param locale Locale for number formatting (default: 'es-MX')
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number, locale: string = 'es-MX'): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters.toLocaleString(locale)} m`;
  }

  if (distanceKm < 10) {
    // Show 1 decimal place for distances under 10km
    return `${distanceKm.toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} km`;
  }

  // Show whole numbers for longer distances
  return `${Math.round(distanceKm).toLocaleString(locale)} km`;
}

/**
 * Get distance category for styling/sorting purposes
 * @param distanceKm Distance in kilometers
 * @returns Distance category
 */
export function getDistanceCategory(distanceKm: number): 'very-close' | 'close' | 'moderate' | 'far' {
  if (distanceKm <= 2) return 'very-close';
  if (distanceKm <= 5) return 'close';
  if (distanceKm <= 15) return 'moderate';
  return 'far';
}

/**
 * Get appropriate icon/color for distance
 * @param distanceKm Distance in kilometers
 * @returns Style configuration object
 */
export function getDistanceStyle(distanceKm: number) {
  const category = getDistanceCategory(distanceKm);

  switch (category) {
    case 'very-close':
      return {
        textColor: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '📍'
      };
    case 'close':
      return {
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: '🚶‍♀️'
      };
    case 'moderate':
      return {
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '🚗'
      };
    case 'far':
      return {
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: '🗺️'
      };
    default:
      return {
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: '📍'
      };
  }
}

/**
 * Sort stylists by distance from user location
 * @param stylists Array of stylists with location data
 * @param userLocation User's current location
 * @returns Sorted array with distance data
 */
export function sortByDistance<T extends {
  latitude?: number;
  longitude?: number;
  location_coordinates?: { x: number; y: number };
}>(
  stylists: T[],
  userLocation: Coordinates
): (T & { distance?: number; formattedDistance?: string })[] {
  return stylists
    .map(stylist => {
      // Support both direct lat/lng and location_coordinates format
      let stylistLat: number | undefined;
      let stylistLng: number | undefined;

      if (stylist.latitude !== undefined && stylist.longitude !== undefined) {
        stylistLat = stylist.latitude;
        stylistLng = stylist.longitude;
      } else if (stylist.location_coordinates) {
        stylistLat = stylist.location_coordinates.y; // y is latitude
        stylistLng = stylist.location_coordinates.x; // x is longitude
      }

      if (!isValidCoordinates(stylistLat, stylistLng)) {
        return { ...stylist, distance: Infinity, formattedDistance: 'Ubicación no disponible' };
      }

      const distance = calculateDistance(
        userLocation,
        { latitude: stylistLat!, longitude: stylistLng! }
      );

      return {
        ...stylist,
        distance,
        formattedDistance: formatDistance(distance)
      };
    })
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
}

/**
 * Check if location data is valid
 * @param latitude Latitude value
 * @param longitude Longitude value
 * @returns Boolean indicating if coordinates are valid
 */
export function isValidCoordinates(latitude?: number, longitude?: number): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}