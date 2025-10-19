// LocationSessionManager - Manages persistent location permissions and tracking
import { locationService } from './location'

export interface LocationSession {
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'checking'
  lastLocation: {
    latitude: number
    longitude: number
    timestamp: string
  } | null
  trackingEnabled: boolean
  bookingTrackingId: string | null
  lastUpdateTime: string | null
}

class LocationSessionManager {
  private static instance: LocationSessionManager
  private watchId: number | null = null
  private updateInterval: NodeJS.Timeout | null = null
  private readonly STORAGE_KEY = 'beautycita_location_session'
  private readonly UPDATE_INTERVAL_NORMAL = 60000 // 1 minute normally
  private readonly UPDATE_INTERVAL_BOOKING = 30000 // 30 seconds during booking

  static getInstance(): LocationSessionManager {
    if (!LocationSessionManager.instance) {
      LocationSessionManager.instance = new LocationSessionManager()
    }
    return LocationSessionManager.instance
  }

  constructor() {
    // Check permission status on initialization
    this.checkPermissionStatus()

    // Listen for visibility changes to pause/resume tracking
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  // Get current session from localStorage
  getSession(): LocationSession {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse location session:', e)
      }
    }

    return {
      permissionStatus: 'prompt',
      lastLocation: null,
      trackingEnabled: false,
      bookingTrackingId: null,
      lastUpdateTime: null
    }
  }

  // Save session to localStorage
  private saveSession(session: LocationSession): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session))
  }

  // Check browser permission status
  async checkPermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
    const session = this.getSession()

    // Update status to checking
    this.saveSession({ ...session, permissionStatus: 'checking' })

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        this.saveSession({ ...session, permissionStatus: 'denied' })
        return 'denied'
      }

      // Check permission API if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' })
          const status = result.state as 'granted' | 'denied' | 'prompt'

          // Listen for permission changes
          result.addEventListener('change', () => {
            const newStatus = result.state as 'granted' | 'denied' | 'prompt'
            const currentSession = this.getSession()
            this.saveSession({ ...currentSession, permissionStatus: newStatus })

            if (newStatus === 'granted') {
              this.startTracking()
            } else {
              this.stopTracking()
            }
          })

          this.saveSession({ ...session, permissionStatus: status })
          return status
        } catch (permError) {
          console.warn('Permissions API not fully supported:', permError)
        }
      }

      // Fallback: Check stored session
      if (session.lastLocation && session.permissionStatus === 'granted') {
        return 'granted'
      }

      return 'prompt'
    } catch (error) {
      console.error('Error checking permission status:', error)
      return 'prompt'
    }
  }

  // Request location permission (called when user clicks address field)
  async requestLocationPermission(): Promise<boolean> {
    const session = this.getSession()

    // If already granted, just return true
    if (session.permissionStatus === 'granted' && session.lastLocation) {
      return true
    }

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        this.saveSession({ ...session, permissionStatus: 'denied' })
        resolve(false)
        return
      }

      // Request current position - this will trigger permission prompt
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Permission granted
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          }

          this.saveSession({
            ...session,
            permissionStatus: 'granted',
            lastLocation: location,
            lastUpdateTime: new Date().toISOString()
          })

          // Update location service
          locationService.setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })

          // Start continuous tracking
          this.startTracking()

          resolve(true)
        },
        (error) => {
          // Permission denied or error
          let status: 'denied' | 'prompt' = 'denied'

          if (error.code === error.PERMISSION_DENIED) {
            status = 'denied'
          } else if (error.code === error.TIMEOUT) {
            status = 'prompt' // Keep as prompt so user can retry
          }

          this.saveSession({
            ...session,
            permissionStatus: status
          })

          resolve(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  // Start continuous location tracking
  startTracking(bookingId?: string): void {
    const session = this.getSession()

    // Don't start if permission not granted
    if (session.permissionStatus !== 'granted') {
      console.warn('Cannot start tracking without location permission')
      return
    }

    // Update session with tracking info
    this.saveSession({
      ...session,
      trackingEnabled: true,
      bookingTrackingId: bookingId || session.bookingTrackingId
    })

    // Clear any existing tracking
    this.stopTracking(false)

    // Use watchPosition for continuous updates
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handleLocationUpdate(position)
        },
        (error) => {
          console.error('Location tracking error:', error)
          if (error.code === error.PERMISSION_DENIED) {
            this.handlePermissionRevoked()
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )

      // Also set up interval for backend updates
      const interval = bookingId ? this.UPDATE_INTERVAL_BOOKING : this.UPDATE_INTERVAL_NORMAL
      this.updateInterval = setInterval(() => {
        this.sendLocationToBackend()
      }, interval)
    }
  }

  // Stop tracking
  stopTracking(updateSession = true): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    if (updateSession) {
      const session = this.getSession()
      this.saveSession({
        ...session,
        trackingEnabled: false,
        bookingTrackingId: null
      })
    }
  }

  // Handle location update
  private handleLocationUpdate(position: GeolocationPosition): void {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date().toISOString()
    }

    const session = this.getSession()
    this.saveSession({
      ...session,
      lastLocation: location,
      lastUpdateTime: new Date().toISOString()
    })

    // Update location service
    locationService.setCurrentLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    })

    // Send to backend if tracking for booking
    if (session.bookingTrackingId) {
      this.sendLocationToBackend()
    }
  }

  // Send location update to backend
  private async sendLocationToBackend(): Promise<void> {
    const session = this.getSession()

    if (!session.lastLocation || !session.trackingEnabled) {
      return
    }

    try {
      const endpoint = session.bookingTrackingId
        ? '/api/location/booking-track'
        : '/api/location/update'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('beautycita-auth-token')}`
        },
        body: JSON.stringify({
          latitude: session.lastLocation.latitude,
          longitude: session.lastLocation.longitude,
          timestamp: session.lastLocation.timestamp,
          bookingId: session.bookingTrackingId
        })
      })

      if (!response.ok) {
        console.error('Failed to send location update:', response.status)
      }
    } catch (error) {
      console.error('Error sending location to backend:', error)
    }
  }

  // Handle permission revoked
  private handlePermissionRevoked(): void {
    const session = this.getSession()
    this.saveSession({
      ...session,
      permissionStatus: 'denied',
      trackingEnabled: false
    })

    this.stopTracking(false)

    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('locationPermissionRevoked'))
  }

  // Handle visibility change
  private handleVisibilityChange(): void {
    const session = this.getSession()

    if (!session.trackingEnabled) return

    if (document.hidden) {
      // Page is hidden, reduce update frequency or pause
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
        this.updateInterval = null
      }
    } else {
      // Page is visible again, resume tracking
      if (session.bookingTrackingId) {
        // Resume with booking frequency
        this.updateInterval = setInterval(() => {
          this.sendLocationToBackend()
        }, this.UPDATE_INTERVAL_BOOKING)
      }
    }
  }

  // Handle online event
  private handleOnline(): void {
    const session = this.getSession()
    if (session.trackingEnabled && session.lastLocation) {
      // Send any pending location updates
      this.sendLocationToBackend()
    }
  }

  // Handle offline event
  private handleOffline(): void {
    console.log('Device went offline, location updates will resume when online')
  }

  // Start booking-specific tracking
  startBookingTracking(bookingId: string): void {
    console.log(`Starting high-frequency tracking for booking: ${bookingId}`)
    this.startTracking(bookingId)
  }

  // Stop booking tracking
  stopBookingTracking(): void {
    const session = this.getSession()
    this.saveSession({
      ...session,
      bookingTrackingId: null
    })

    // Continue normal tracking if permission still granted
    if (session.permissionStatus === 'granted') {
      this.startTracking()
    } else {
      this.stopTracking()
    }
  }

  // Get last known location
  getLastLocation(): { latitude: number; longitude: number } | null {
    const session = this.getSession()
    if (session.lastLocation) {
      return {
        latitude: session.lastLocation.latitude,
        longitude: session.lastLocation.longitude
      }
    }
    return null
  }

  // Check if location is being tracked
  isTracking(): boolean {
    const session = this.getSession()
    return session.trackingEnabled
  }

  // Check if permission is granted
  isPermissionGranted(): boolean {
    const session = this.getSession()
    return session.permissionStatus === 'granted'
  }

  // Clear all session data
  clearSession(): void {
    this.stopTracking()
    localStorage.removeItem(this.STORAGE_KEY)
  }
}

export const locationSessionManager = LocationSessionManager.getInstance()
export default locationSessionManager