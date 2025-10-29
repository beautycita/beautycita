/**
 * Location Service
 * Handles geolocation, distance calculations, and location permissions
 */

import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface LocationWithAccuracy extends Location {
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

/**
 * Request location permissions
 * Returns true if permission granted, false otherwise
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // iOS permissions are handled via Info.plist
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'BeautyCita Location Permission',
        message:
          'BeautyCita needs access to your location to find nearby stylists and provide accurate service.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('Error requesting location permission:', err);
    return false;
  }
};

/**
 * Get current user location
 * Returns promise with location or throws error
 */
export const getCurrentLocation = (): Promise<LocationWithAccuracy> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error('Error getting current location:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
};

/**
 * Watch user location continuously
 * Returns watchId that can be used to clear the watch
 */
export const watchLocation = (
  onSuccess: (location: LocationWithAccuracy) => void,
  onError: (error: any) => void
): number => {
  return Geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error('Error watching location:', error);
      onError(error);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10, // Update every 10 meters
      interval: 5000, // Update every 5 seconds
      fastestInterval: 2000, // Fastest update: 2 seconds
    }
  );
};

/**
 * Stop watching location
 */
export const clearLocationWatch = (watchId: number): void => {
  Geolocation.clearWatch(watchId);
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export const calculateDistance = (
  from: Location,
  to: Location
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * Returns string like "2.5 km" or "850 m"
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Get estimated travel time based on distance
 * Assumes average driving speed of 40 km/h in city
 * Returns time in minutes
 */
export const estimateTravelTime = (distanceKm: number): number => {
  const avgSpeedKmh = 40; // City driving average
  const timeHours = distanceKm / avgSpeedKmh;
  const timeMinutes = Math.ceil(timeHours * 60);
  return timeMinutes;
};

/**
 * Format travel time for display
 * Returns string like "15 min" or "1 hr 30 min"
 */
export const formatTravelTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
};

/**
 * Check if location services are enabled
 * Shows alert if disabled on Android
 */
export const checkLocationEnabled = async (): Promise<boolean> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access in settings to find nearby stylists.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking location enabled:', error);
    return false;
  }
};

/**
 * Reverse geocode coordinates to address
 * Note: Requires Google Maps Geocoding API integration
 */
export const reverseGeocode = async (
  location: Location
): Promise<string | null> => {
  try {
    // TODO: Implement Google Maps Geocoding API call
    // For now, return formatted coordinates
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

/**
 * Check if user is within service area
 * Service area defined by bounding box
 */
export const isInServiceArea = (
  location: Location,
  serviceArea: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }
): boolean => {
  return (
    location.latitude >= serviceArea.minLat &&
    location.latitude <= serviceArea.maxLat &&
    location.longitude >= serviceArea.minLng &&
    location.longitude <= serviceArea.maxLng
  );
};

export default {
  requestLocationPermission,
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
  calculateDistance,
  formatDistance,
  estimateTravelTime,
  formatTravelTime,
  checkLocationEnabled,
  reverseGeocode,
  isInServiceArea,
};
