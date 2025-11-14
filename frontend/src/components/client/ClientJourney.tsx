import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import {
  MapPinIcon,
  ClockIcon,
  ArrowPathIcon,
  MapIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || ''
const GOOGLE_MAPS_API_KEY = 'AIzaSyCsy8MrU8leZ1HonRBL40s804jW91Xb5Nc'

interface ClientJourneyProps {
  bookingId: number
  stylistName: string
  appointmentTime: string
  destinationAddress: string
  destinationLat: number
  destinationLng: number
}

export default function ClientJourney({
  bookingId,
  stylistName,
  appointmentTime,
  destinationAddress,
  destinationLat,
  destinationLng
}: ClientJourneyProps) {
  const { token } = useAuthStore()
  const [isJourneyStarted, setIsJourneyStarted] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [eta, setEta] = useState<string | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [])

  const startJourney = async () => {
    setLoading(true)
    setError(null)

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    try {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation({ lat: latitude, lng: longitude })

          // Start journey on backend
          try {
            const response = await axios.post(
              `${API_URL}/api/bookings/${bookingId}/start-journey`,
              { latitude, longitude },
              { headers: { Authorization: `Bearer ${token}` } }
            )

            setEta(response.data.data.eta)
            setDistance(response.data.data.distance_meters)
            setDurationMinutes(response.data.data.duration_minutes)
            setIsJourneyStarted(true)
            setLoading(false)

            // Start watching position
            startLocationTracking()
          } catch (error: any) {
            console.error('Error starting journey:', error)
            setError(error.response?.data?.message || 'Failed to start journey')
            setLoading(false)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
          setError('Unable to get your location. Please enable location services.')
          setLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to start journey')
      setLoading(false)
    }
  }

  const startLocationTracking = () => {
    // Watch position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lng: longitude })
      },
      (error) => {
        console.error('Location tracking error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    )

    // Update backend every 30 seconds
    updateIntervalRef.current = setInterval(async () => {
      if (currentLocation) {
        try {
          const response = await axios.post(
            `${API_URL}/api/bookings/${bookingId}/update-location`,
            { latitude: currentLocation.lat, longitude: currentLocation.lng },
            { headers: { Authorization: `Bearer ${token}` } }
          )

          setEta(response.data.data.eta)
          setDistance(response.data.data.distance_meters)
          setDurationMinutes(response.data.data.duration_minutes)
        } catch (error) {
          console.error('Error updating location:', error)
        }
      }
    }, 30000)
  }

  const openGoogleMaps = () => {
    if (currentLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destinationLat},${destinationLng}&travelmode=driving`
      window.open(url, '_blank')
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=driving`
      window.open(url, '_blank')
    }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDistance = (meters: number) => {
    const km = meters / 1000
    if (km < 1) return `${meters}m`
    return `${km.toFixed(1)}km`
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Journey</h2>
          <p className="text-sm text-gray-600">
            Appointment with {stylistName} at {formatTime(appointmentTime)}
          </p>
        </div>
        {isJourneyStarted && (
          <button
            onClick={() => {
              if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current)
              }
              if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current)
              }
              setIsJourneyStarted(false)
            }}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-medium hover:bg-red-200 transition-colors text-sm"
          >
            Stop Tracking
          </button>
        )}
      </div>

      {/* Destination */}
      <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl">
        <div className="flex items-start gap-3">
          <MapPinIcon className="w-6 h-6 text-pink-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">Destination</p>
            <p className="text-sm text-gray-700">{destinationAddress}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Journey Not Started */}
      {!isJourneyStarted && (
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <MapIcon className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Ready to head out?
            </h3>
            <p className="text-gray-600 mb-6">
              Tap below when you start your journey to let your stylist know you're on the way
            </p>
          </motion.div>

          <div className="space-y-3">
            <button
              onClick={startJourney}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full font-bold text-lg hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Starting...
                </span>
              ) : (
                "I'm on my way!"
              )}
            </button>

            <button
              onClick={openGoogleMaps}
              className="w-full py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition-colors"
            >
              Open in Google Maps
            </button>
          </div>
        </div>
      )}

      {/* Journey Started */}
      {isJourneyStarted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <ClockIcon className="w-6 h-6 mx-auto text-blue-600 mb-2" />
              <p className="text-xs text-gray-700 mb-1">ETA</p>
              <p className="text-lg font-bold text-gray-900">
                {durationMinutes ? `${durationMinutes} min` : '...'}
              </p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <MapPinIcon className="w-6 h-6 mx-auto text-purple-600 mb-2" />
              <p className="text-xs text-gray-700 mb-1">Distance</p>
              <p className="text-lg font-bold text-gray-900">
                {distance ? formatDistance(distance) : '...'}
              </p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <ArrowPathIcon className="w-6 h-6 mx-auto text-green-600 mb-2 animate-spin" />
              <p className="text-xs text-gray-700 mb-1">Status</p>
              <p className="text-lg font-bold text-gray-900">En Route</p>
            </div>
          </div>

          {/* Live Tracking Notice */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1 animate-pulse"></div>
              <div>
                <p className="font-semibold text-green-900 text-sm">
                  Live tracking active
                </p>
                <p className="text-xs text-green-700">
                  Your stylist can see your arrival time. We update your location every 30 seconds.
                </p>
              </div>
            </div>
          </div>

          {/* Map Embed */}
          {currentLocation && (
            <div className="mb-6 rounded-2xl overflow-hidden h-64 border-2 border-gray-200">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destinationLat},${destinationLng}&mode=driving`}
                allowFullScreen
              ></iframe>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={openGoogleMaps}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
            >
              Open Navigation
            </button>

            <a
              href={`tel:${stylistName}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-pink-600 text-pink-600 rounded-full font-semibold hover:bg-pink-50 transition-colors"
            >
              <PhoneIcon className="w-5 h-5" />
              Call Stylist
            </a>
          </div>

          {/* Helpful Tips */}
          <div className="mt-6 p-4 bg-purple-50 rounded-2xl">
            <p className="text-sm text-purple-900 font-semibold mb-2">
              💡 Helpful Tips
            </p>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>• Your stylist will be notified when you're 10 and 5 minutes away</li>
              <li>• Keep the app open for the most accurate tracking</li>
              <li>• If you're running late, your stylist may reach out to adjust</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  )
}
