// Hook for handling location-enabled booking for clients
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { locationSessionManager } from '../services/LocationSessionManager'
import toast from 'react-hot-toast'

interface UseLocationBookingOptions {
  onLocationGranted?: (location: { latitude: number; longitude: number }) => void
  onLocationDenied?: () => void
  requireLocation?: boolean
}

export const useLocationBooking = (options: UseLocationBookingOptions = {}) => {
  const { t } = useTranslation()
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false)

  const handleBookingWithLocation = useCallback(async (bookingAction: () => void | Promise<void>) => {
    setIsRequestingLocation(true)

    try {
      // Check current permission status
      const currentStatus = await locationSessionManager.checkPermissionStatus()

      if (currentStatus === 'granted') {
        // Permission already granted, proceed with booking
        setIsRequestingLocation(false)
        const lastLocation = locationSessionManager.getLastLocation()
        if (lastLocation) {
          options.onLocationGranted?.(lastLocation)
        }
        await bookingAction()
        return
      }

      if (currentStatus === 'denied') {
        // Permission denied, show instructions or allow booking without location
        setLocationPermissionDenied(true)
        setIsRequestingLocation(false)

        if (options.requireLocation) {
          toast.error(t('location.booking.required', 'Location access is required to book services. Please enable location access in your browser settings.'), {
            duration: 6000,
            position: 'bottom-center'
          })
          options.onLocationDenied?.()
          return
        } else {
          // Allow booking without location but show warning
          toast(t('location.booking.optional', 'Booking without location - some features may be limited'), {
            icon: '⚠️',
            duration: 4000
          })
          await bookingAction()
          return
        }
      }

      // Permission is 'prompt' - request permission
      const granted = await locationSessionManager.requestLocationPermission()
      setIsRequestingLocation(false)

      if (granted) {
        // Permission granted, get location and proceed
        const location = locationSessionManager.getLastLocation()
        if (location) {
          options.onLocationGranted?.(location)
          toast.success(t('location.booking.success', 'Location enabled! You\'ll receive real-time updates about your appointment.'), {
            duration: 4000,
            position: 'bottom-center'
          })
        }

        // Start location tracking for this booking session
        locationSessionManager.startTracking()

        await bookingAction()
      } else {
        // Permission denied
        setLocationPermissionDenied(true)

        if (options.requireLocation) {
          toast.error(t('location.booking.deniedRequired', 'Location access is required to book services. Please enable location access and try again.'), {
            duration: 6000,
            position: 'bottom-center'
          })
          options.onLocationDenied?.()
        } else {
          // Proceed without location
          toast(t('location.booking.deniedOptional', 'Booking without location - you won\'t receive proximity notifications'), {
            icon: '⚠️',
            duration: 4000
          })
          await bookingAction()
        }
      }
    } catch (error) {
      console.error('Error in location booking flow:', error)
      setIsRequestingLocation(false)

      // On error, proceed with booking if not required
      if (!options.requireLocation) {
        toast.error(t('location.booking.error', 'Could not access location. Proceeding with booking...'), {
          duration: 3000
        })
        await bookingAction()
      } else {
        toast.error(t('location.booking.errorRequired', 'Location access failed. Please try again.'), {
          duration: 4000
        })
        options.onLocationDenied?.()
      }
    }
  }, [options, t])

  const isLocationGranted = useCallback(() => {
    return locationSessionManager.isPermissionGranted()
  }, [])

  const getCurrentLocation = useCallback(() => {
    return locationSessionManager.getLastLocation()
  }, [])

  const showLocationPermissionHelp = useCallback(() => {
    // Show instructions for enabling location permission
    const userAgent = navigator.userAgent.toLowerCase()
    let instructions = ''

    if (userAgent.includes('chrome')) {
      instructions = t('location.help.chrome', 'Click the location icon in the address bar and select "Allow"')
    } else if (userAgent.includes('firefox')) {
      instructions = t('location.help.firefox', 'Click the shield icon and select "Allow" for location')
    } else if (userAgent.includes('safari')) {
      instructions = t('location.help.safari', 'Go to Safari > Settings > Websites > Location and allow access')
    } else {
      instructions = t('location.help.generic', 'Enable location access in your browser settings and refresh the page')
    }

    toast(instructions, {
      icon: 'ℹ️',
      duration: 8000,
      position: 'bottom-center',
      style: {
        maxWidth: '400px'
      }
    })
  }, [t])

  return {
    handleBookingWithLocation,
    isRequestingLocation,
    locationPermissionDenied,
    isLocationGranted,
    getCurrentLocation,
    showLocationPermissionHelp,
    resetLocationState: () => {
      setLocationPermissionDenied(false)
      setIsRequestingLocation(false)
    }
  }
}

export default useLocationBooking