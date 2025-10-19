export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the distance between two geographical points using the Haversine formula
 * @param point1 First coordinates {latitude, longitude}
 * @param point2 Second coordinates {latitude, longitude}
 * @returns Distance in kilometers
 */
export const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const R = 6371; // Earth's radius in kilometers

  const dLat = degreesToRadians(point2.latitude - point1.latitude);
  const dLon = degreesToRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(point1.latitude)) *
      Math.cos(degreesToRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Convert degrees to radians
 */
const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @param unit Preferred unit ('km' or 'mi')
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number, unit: 'km' | 'mi' = 'km'): string => {
  if (unit === 'mi') {
    const miles = distance * 0.621371;
    if (miles < 1) {
      const feet = Math.round(miles * 5280);
      return `${feet} ft`;
    }
    return `${miles.toFixed(1)} mi`;
  }

  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return `${meters} m`;
  }

  return `${distance.toFixed(1)} km`;
};

/**
 * Sort array of items by distance from a reference point
 * @param items Array of items with coordinates
 * @param userLocation User's current location
 * @param getCoordinates Function to extract coordinates from each item
 * @returns Sorted array with distance property added
 */
export const sortByDistance = <T>(
  items: T[],
  userLocation: Coordinates,
  getCoordinates: (item: T) => Coordinates
): (T & { distance: number; formattedDistance: string })[] => {
  return items
    .map(item => {
      const itemCoords = getCoordinates(item);
      const distance = calculateDistance(userLocation, itemCoords);
      return {
        ...item,
        distance,
        formattedDistance: formatDistance(distance),
      };
    })
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Filter items within a certain radius
 * @param items Array of items with coordinates
 * @param userLocation User's current location
 * @param radius Maximum distance in kilometers
 * @param getCoordinates Function to extract coordinates from each item
 * @returns Filtered array within radius
 */
export const filterByRadius = <T>(
  items: T[],
  userLocation: Coordinates,
  radius: number,
  getCoordinates: (item: T) => Coordinates
): T[] => {
  return items.filter(item => {
    const itemCoords = getCoordinates(item);
    const distance = calculateDistance(userLocation, itemCoords);
    return distance <= radius;
  });
};

/**
 * Get approximate location name from coordinates (requires external API)
 * This is a placeholder for reverse geocoding functionality
 */
export const getLocationName = async (coordinates: Coordinates): Promise<string> => {
  try {
    // This would typically call a geocoding service like Google Maps or OpenCage
    // For now, return a simple format
    return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Failed to get location name:', error);
    return 'Unknown location';
  }
};

/**
 * Common city coordinates for Mexico (for testing/fallback)
 */
export const MEXICO_CITIES: Record<string, Coordinates> = {
  'Ciudad de México': { latitude: 19.4326, longitude: -99.1332 },
  'Guadalajara': { latitude: 20.6597, longitude: -103.3496 },
  'Monterrey': { latitude: 25.6866, longitude: -100.3161 },
  'Puebla': { latitude: 19.0414, longitude: -98.2063 },
  'Tijuana': { latitude: 32.5027, longitude: -117.0082 },
  'León': { latitude: 21.1619, longitude: -101.6921 },
  'Juárez': { latitude: 31.6904, longitude: -106.4245 },
  'Torreón': { latitude: 25.5428, longitude: -103.4068 },
  'Querétaro': { latitude: 20.5888, longitude: -100.3899 },
  'San Luis Potosí': { latitude: 22.1565, longitude: -100.9855 },
};

/**
 * Get user-friendly error messages for geolocation errors
 */
export const getGeolocationErrorMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access denied. Please enable location services to see nearby stylists.';
    case error.POSITION_UNAVAILABLE:
      return 'Location information unavailable. Please check your connection and try again.';
    case error.TIMEOUT:
      return 'Location request timed out. Please try again.';
    default:
      return 'An error occurred while getting your location. Please try again.';
  }
};