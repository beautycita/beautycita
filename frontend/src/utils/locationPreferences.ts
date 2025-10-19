// Location permission preference management
// Handles localStorage for user location permission choices

export type LocationPreference = 'granted' | 'denied' | 'dismissed' | 'never-asked' | 'dont-ask-again';

export interface LocationPreferenceData {
  preference: LocationPreference;
  timestamp: number;
  expiresAt: number;
}

const STORAGE_KEY = 'beautycita-location-preference';

// Expiration times in milliseconds
const EXPIRATION_TIMES = {
  denied: 30 * 24 * 60 * 60 * 1000, // 30 days for denied
  dismissed: 7 * 24 * 60 * 60 * 1000, // 7 days for dismissed
  'dont-ask-again': Number.MAX_SAFE_INTEGER, // Never expire
  granted: Number.MAX_SAFE_INTEGER, // Never expire (browser handles this)
  'never-asked': 0 // No expiration needed
} as const;

/**
 * Get the current location preference from localStorage
 * Returns null if no preference is stored or if it has expired
 */
export function getLocationPreference(): LocationPreferenceData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const data: LocationPreferenceData = JSON.parse(stored);
    const now = Date.now();

    // Check if preference has expired
    if (now > data.expiresAt) {
      // Clean up expired preference
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to read location preference:', error);
    return null;
  }
}

/**
 * Store a location preference in localStorage with appropriate expiration
 */
export function setLocationPreference(preference: LocationPreference): void {
  try {
    const now = Date.now();
    const expirationTime = EXPIRATION_TIMES[preference] || 0;

    const data: LocationPreferenceData = {
      preference,
      timestamp: now,
      expiresAt: now + expirationTime
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to store location preference:', error);
  }
}

/**
 * Clear the stored location preference
 */
export function clearLocationPreference(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear location preference:', error);
  }
}

/**
 * Check if we should show the location permission modal
 * Considers stored preferences, browser permissions, and current location state
 */
export function shouldShowLocationModal(
  isSupported: boolean,
  userLocation: { latitude: number; longitude: number } | null,
  locationError: GeolocationPositionError | null,
  browserPermission: PermissionState | null
): boolean {
  // Don't show if geolocation is not supported
  if (!isSupported) {
    return false;
  }

  // Don't show if user already has location
  if (userLocation) {
    return false;
  }

  // Don't show if there's a location error (usually means denied)
  if (locationError) {
    return false;
  }

  // Check browser permission state
  if (browserPermission === 'denied') {
    return false;
  }

  // If browser permission is granted but we don't have location yet,
  // we should try to get location instead of showing modal
  if (browserPermission === 'granted') {
    return false;
  }

  // Check stored preference
  const storedPreference = getLocationPreference();

  if (storedPreference) {
    const { preference } = storedPreference;

    // Never show again for these preferences
    if (preference === 'denied' || preference === 'dismissed' || preference === 'dont-ask-again') {
      return false;
    }

    // If granted in storage but no location, something might be wrong
    // Let browser permission handling take over
    if (preference === 'granted') {
      return false;
    }
  }

  // Show modal for first-time users or when preference has expired
  return true;
}

/**
 * Get a human-readable description of the current preference
 */
export function getPreferenceDescription(preference: LocationPreference): string {
  switch (preference) {
    case 'granted':
      return 'Location access granted';
    case 'denied':
      return 'Location access denied';
    case 'dismissed':
      return 'Location modal dismissed';
    case 'dont-ask-again':
      return 'User chose not to be asked again';
    case 'never-asked':
      return 'User has not been asked yet';
    default:
      return 'Unknown preference';
  }
}