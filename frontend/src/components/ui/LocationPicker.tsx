import React, { useCallback, useRef, useState, useMemo } from 'react'
import { Wrapper, Status } from '@googlemaps/react-wrapper'
import { useTranslation } from 'react-i18next'
import { MapPinIcon, PencilIcon, CheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { locationSessionManager } from '../../services/LocationSessionManager'

interface LocationData {
  address: string
  latitude: number
  longitude: number
  city?: string
  state?: string
}

interface LocationPickerProps {
  value?: LocationData
  onChange: (location: LocationData) => void
  error?: string
  apiKey: string
}

interface MapProps {
  center: google.maps.LatLngLiteral
  zoom: number
  onLocationChange: (location: LocationData) => void
  userSelectedAddress: string | null
}

const Map: React.FC<MapProps> = ({ center, zoom, onLocationChange, userSelectedAddress }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map>()
  const [marker, setMarker] = useState<google.maps.Marker>()
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder>()

  const initializeMap = useCallback(() => {
    if (ref.current && !map) {
      console.log('🗺️ Initializing Google Map with center:', center)
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      })

      const newMarker = new window.google.maps.Marker({
        position: center,
        map: newMap,
        draggable: true,
        title: 'Drag me to your exact business entrance'
      })

      const newGeocoder = new window.google.maps.Geocoder()

      // Handle marker drag
      newMarker.addListener('dragend', () => {
        const position = newMarker.getPosition()
        if (position) {
          const lat = position.lat()
          const lng = position.lng()

          console.log('📍 Marker dragged to:', { lat, lng })

          // If user manually selected an address, preserve it and only update coordinates
          if (userSelectedAddress) {
            console.log('🔒 Preserving user-selected address:', userSelectedAddress)
            onLocationChange({
              address: userSelectedAddress,
              latitude: lat,
              longitude: lng
            })
          } else {
            // No user-selected address, use reverse geocoding
            console.log('🔄 No user address - using reverse geocoding')
            newGeocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results?.[0]) {
                console.log('🔄 Reverse geocoding successful:', results[0].formatted_address)
                onLocationChange({
                  address: results[0].formatted_address,
                  latitude: lat,
                  longitude: lng
                })
              } else {
                console.warn('⚠️ Reverse geocoding failed:', status)
                // Even if reverse geocoding fails, update coordinates
                onLocationChange({
                  address: userSelectedAddress || '',
                  latitude: lat,
                  longitude: lng
                })
              }
            })
          }
        }
      })

      setMap(newMap)
      setMarker(newMarker)
      setGeocoder(newGeocoder)
      console.log('✅ Google Map initialized successfully')
    }
  }, [center, zoom, onLocationChange, map])

  React.useEffect(() => {
    initializeMap()
  }, [initializeMap])

  // Update marker position when center changes
  React.useEffect(() => {
    if (marker) {
      marker.setPosition(center)
      console.log('📌 Marker position updated to:', center)
    }
    if (map) {
      map.setCenter(center)
      console.log('🎯 Map center updated to:', center)
    }
  }, [center, marker, map])

  return <div ref={ref} className="w-full h-full" />
}

const render = (status: Status) => {
  console.log('🗺️ Google Maps render status:', {
    status,
    statusText: Status[status],
    timestamp: new Date().toISOString()
  })

  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-3xl">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Google Maps...</p>
            <p className="text-xs text-gray-500 mt-2">Initializing Places API</p>
          </div>
        </div>
      )
    case Status.FAILURE:
      console.error('❌ Google Maps failed to load:', {
        status,
        possibleCauses: [
          'Invalid API key',
          'API key restrictions',
          'Network connectivity',
          'Places API not enabled'
        ]
      })
      return (
        <div className="flex items-center justify-center h-96 bg-red-50 rounded-3xl border border-red-200">
          <div className="text-center text-red-600">
            <MapPinIcon className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">Failed to load Google Maps</p>
            <p className="text-sm mt-1">Check API key and Places API access</p>
            <div className="mt-3 text-xs">
              <p>Troubleshooting:</p>
              <ul className="mt-1 text-left inline-block">
                <li>• Verify API key in console</li>
                <li>• Check Places API enabled</li>
                <li>• Review browser console</li>
              </ul>
            </div>
          </div>
        </div>
      )
    case Status.SUCCESS:
      console.log('✅ Google Maps loaded successfully')
      return null
    default:
      console.warn('⚠️ Unknown Google Maps status:', status)
      return null
  }
}

export default function LocationPicker({ value, onChange, error, apiKey }: LocationPickerProps) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState(value?.address || '')
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [userSelectedAddress, setUserSelectedAddress] = useState<string | null>(null)
  const [isManualEdit, setIsManualEdit] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [addressSupplement, setAddressSupplement] = useState('')
  const [baseLocation, setBaseLocation] = useState<LocationData | null>(null)
  const autocompleteService = useRef<google.maps.places.AutocompleteService>()
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  // Default to Mexico City if no value provided
  const defaultLocation = {
    address: '',
    latitude: 19.4326,
    longitude: -99.1332
  }

  const currentLocation = value || defaultLocation
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false)
  const [requestingPermission, setRequestingPermission] = useState(false)

  // Check location permission status on mount
  React.useEffect(() => {
    const checkPermission = async () => {
      const status = await locationSessionManager.checkPermissionStatus()
      setLocationPermissionDenied(status === 'denied')
    }
    checkPermission()
  }, [])

  // Update dropdown position for mobile (fixed positioning)
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768

      if (isMobileDevice) {
        // On mobile, use fixed positioning
        setDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + 2}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          zIndex: 99999,
          maxHeight: '240px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxSizing: 'border-box'
        })
      } else {
        // On desktop, use absolute positioning
        setDropdownStyle({
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          maxHeight: '240px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxSizing: 'border-box'
        })
      }
    }
  }, [])

  // Handle input focus - request location permission
  const handleInputFocus = async () => {
    const session = locationSessionManager.getSession()

    // If permission not yet granted and not denied, request it
    if (session.permissionStatus === 'prompt' || session.permissionStatus === 'checking') {
      setRequestingPermission(true)
      const granted = await locationSessionManager.requestLocationPermission()
      setRequestingPermission(false)

      if (granted) {
        // Location permission granted, get current location
        const lastLocation = locationSessionManager.getLastLocation()
        if (lastLocation) {
          // Use the user's current location to search nearby
          console.log('📍 Using user location for search:', lastLocation)
        }
      } else {
        setLocationPermissionDenied(true)
      }
    }
  }

  // Initialize Places API services with better timing and window load detection
  React.useEffect(() => {
    let initializationTimeout: NodeJS.Timeout
    let retryInterval: NodeJS.Timeout
    let isInitializing = false

    const initializePlacesService = () => {
      if (isInitializing) return false

      console.log('🔧 LocationPicker: Checking Places API availability...', {
        hasGoogleMaps: !!window.google,
        hasPlacesAPI: !!(window.google && window.google.maps && window.google.maps.places),
        hasAutocompleteService: !!autocompleteService.current,
        documentReady: document.readyState
      })

      if (window.google && window.google.maps && window.google.maps.places && !autocompleteService.current) {
        isInitializing = true
        try {
          autocompleteService.current = new window.google.maps.places.AutocompleteService()
          console.log('✅ LocationPicker: AutocompleteService initialized successfully')
          isInitializing = false
          return true
        } catch (error) {
          console.error('❌ LocationPicker: Failed to initialize AutocompleteService:', error)
          isInitializing = false
          return false
        }
      } else if (!window.google) {
        console.warn('⚠️ LocationPicker: Google Maps API not loaded')
        return false
      } else if (!window.google.maps) {
        console.warn('⚠️ LocationPicker: Google Maps core API not loaded')
        return false
      } else if (!window.google.maps.places) {
        console.warn('⚠️ LocationPicker: Google Places API not loaded - retrying...')
        return false
      } else if (autocompleteService.current) {
        console.log('✅ LocationPicker: AutocompleteService already initialized')
        return true
      }
      return false
    }

    const attemptInitialization = () => {
      // Try to initialize immediately
      if (initializePlacesService()) {
        return
      }

      // If not ready, retry with intervals
      let retryCount = 0
      const maxRetries = 20 // Increased retries
      const retryIntervalMs = 300 // Shorter interval

      retryInterval = setInterval(() => {
        retryCount++
        console.log(`🔄 LocationPicker: Retry ${retryCount}/${maxRetries} - Attempting to initialize Places API...`)

        if (initializePlacesService() || retryCount >= maxRetries) {
          clearInterval(retryInterval)
          if (retryCount >= maxRetries) {
            console.error('❌ LocationPicker: Failed to initialize Places API after maximum retries')
          }
        }
      }, retryIntervalMs)
    }

    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      attemptInitialization()
    } else {
      // Wait for window load if not already loaded
      if (document.readyState === 'complete') {
        attemptInitialization()
      } else {
        const handleWindowLoad = () => {
          initializationTimeout = setTimeout(attemptInitialization, 100)
          window.removeEventListener('load', handleWindowLoad)
        }
        window.addEventListener('load', handleWindowLoad)
      }
    }

    return () => {
      if (initializationTimeout) clearTimeout(initializationTimeout)
      if (retryInterval) clearInterval(retryInterval)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [])

  // Improved mobile detection - prioritize user agent over viewport width
  const isMobile = () => {
    // First check user agent for actual mobile devices
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    // Check for touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Check viewport size as secondary indicator
    const isSmallViewport = window.innerWidth < 768

    // Mobile if it's a mobile device OR has touch AND small viewport
    const result = isMobileDevice || (isTouchDevice && isSmallViewport)

    console.log('🔍 Mobile Detection:', {
      isMobileDevice,
      isTouchDevice,
      isSmallViewport,
      viewportWidth: window.innerWidth,
      userAgent: navigator.userAgent.substring(0, 50),
      finalResult: result
    })

    return result
  }

  const handleSearch = useCallback(async (query: string) => {
    setSearchValue(query)
    console.log('🔍 LocationPicker: Places API search:', {
      query,
      length: query.length,
      isMobile: isMobile(),
      userAgent: navigator.userAgent.substring(0, 50)
    })

    // Clear previous results immediately
    if (query.length <= 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    // Update dropdown position before showing results
    updateDropdownPosition()

    if (autocompleteService.current) {
      try {
        const request = {
          input: query,
          componentRestrictions: { country: ['mx', 'us'] }, // Mexico and US
          types: ['establishment', 'geocode'],
          // Add mobile-specific options
          ...(isMobile() && {
            radius: 50000, // 50km radius for mobile to get more relevant results
            strictBounds: false
          })
        }

        console.log('📡 LocationPicker: Places API request:', request)

        autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
          console.log('📥 LocationPicker: Places API response:', {
            status,
            predictionsCount: predictions?.length || 0,
            statusCode: google.maps.places.PlacesServiceStatus[status],
            isMobile: isMobile()
          })

          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            console.log('✅ LocationPicker: Places API success:', predictions.map(p => ({
              description: p.description,
              place_id: p.place_id,
              types: p.types
            })))
            setSearchResults(predictions)
            setShowSearchResults(true)
          } else {
            console.warn('⚠️ LocationPicker: Places API non-OK status:', {
              status,
              statusText: google.maps.places.PlacesServiceStatus[status],
              predictions: predictions?.length || 'none',
              isMobile: isMobile()
            })
            setSearchResults([])
            setShowSearchResults(false)
          }
        })
      } catch (error) {
        console.error('❌ LocationPicker: Places API error:', error)
        setSearchResults([])
        setShowSearchResults(false)
      }
    } else {
      console.warn('⚠️ LocationPicker: AutocompleteService not available', {
        isMobile: isMobile(),
        hasGoogle: !!window.google,
        hasPlaces: !!(window.google && window.google.maps && window.google.maps.places)
      })
      setSearchResults([])
      setShowSearchResults(false)
    }
  }, [])

  const handlePlaceSelect = useCallback((placeId: string, description: string) => {
    console.log('🎯 LocationPicker: Place selected:', { placeId, description })
    setSearchValue(description)
    setShowSearchResults(false)
    setUserSelectedAddress(description) // Track that user manually selected this address

    // Get place details to extract coordinates
    if (window.google) {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'))
      console.log('📍 LocationPicker: Requesting place details for:', placeId)

      service.getDetails({
        placeId: placeId,
        fields: ['geometry', 'formatted_address', 'address_components']
      }, (place, status) => {
        console.log('📥 LocationPicker: Place details response:', {
          status,
          statusText: google.maps.places.PlacesServiceStatus[status],
          hasGeometry: !!place?.geometry,
          hasLocation: !!place?.geometry?.location,
          address: place?.formatted_address
        })

        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          // Extract city and state from address components
          let city = ''
          let state = ''

          if (place.address_components) {
            for (const component of place.address_components) {
              const types = component.types
              if (types.includes('locality') || types.includes('sublocality')) {
                city = component.long_name
              } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name
              }
            }
          }

          const locationData = {
            address: place.formatted_address || description,
            latitude: lat,
            longitude: lng,
            city,
            state
          }

          console.log('✅ LocationPicker: Location data extracted:', locationData)
          setUserSelectedAddress(locationData.address) // Update tracked address
          setBaseLocation(locationData) // Save base location for manual editing
          setManualAddress(locationData.address) // Initialize manual address
          onChange(locationData)
        } else {
          console.error('❌ LocationPicker: Failed to get place details:', {
            status,
            statusText: google.maps.places.PlacesServiceStatus[status],
            place
          })
        }
      })
    }
  }, [onChange])

  const handleEnableManualEdit = useCallback(() => {
    setIsManualEdit(true)
    setManualAddress(userSelectedAddress || searchValue || '')
  }, [userSelectedAddress, searchValue])

  const handleSaveManualEdit = useCallback(() => {
    if (!baseLocation) return

    // Combine manual address with supplement if provided
    const finalAddress = addressSupplement
      ? `${manualAddress}, ${addressSupplement}`
      : manualAddress

    const updatedLocation = {
      ...baseLocation,
      address: finalAddress
    }

    setSearchValue(finalAddress)
    setUserSelectedAddress(finalAddress)
    setIsManualEdit(false)
    onChange(updatedLocation)
    console.log('✅ LocationPicker: Manual address saved:', updatedLocation)
  }, [baseLocation, manualAddress, addressSupplement, onChange])

  const handleCancelManualEdit = useCallback(() => {
    setIsManualEdit(false)
    setManualAddress(userSelectedAddress || searchValue || '')
    setAddressSupplement('')
  }, [userSelectedAddress, searchValue])

  return (
    <div className="space-y-4">
      {/* Address Search with Places Autocomplete - Simplified without map */}
      <div className="space-y-4">
        <div className="relative">
          <label className="label">{t('location.picker.businessAddress')} *</label>
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => {
                const value = e.target.value
                setSearchValue(value)

                // Clear user selection when user types (they must select from dropdown)
                if (userSelectedAddress && value !== userSelectedAddress) {
                  setUserSelectedAddress(null)
                  onChange({
                    address: '',
                    latitude: 0,
                    longitude: 0
                  })
                }

                // Clear existing timeout
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current)
                }

                // Set loading state for mobile feedback
                if (value.length > 2) {
                  setIsSearching(true)
                }

                // Debounce search - use user agent for mobile detection
                const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                const delay = isMobileDevice ? 500 : 300
                searchTimeoutRef.current = setTimeout(() => {
                  handleSearch(value)
                  setIsSearching(false)
                }, delay)
              }}
              className={`input flex-1 ${error ? 'input-error' : ''} ${isSearching ? 'opacity-75' : ''}`}
              placeholder={t('location.picker.searchPlaceholder')}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              inputMode="text"
              onFocus={async () => {
                // Request location permission for stylists when they click the address field
                await handleInputFocus()

                // Update dropdown position on focus
                updateDropdownPosition()

                // Prevent mobile browser zoom on input focus - use user agent check
                // Zoom is now always enabled for accessibility
              }}
              onBlur={() => {
                // Extended delay on mobile to ensure touch selection works
                const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                const delay = isMobileDevice ? 300 : 150
                setTimeout(() => {
                  if (!document.activeElement?.closest('[data-autocomplete-dropdown]')) {
                    setShowSearchResults(false)
                  }
                }, delay)
              }}
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div
              data-autocomplete-dropdown
              className="bg-white border border-gray-200 rounded-3xl shadow-xl"
              style={dropdownStyle}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePlaceSelect(result.place_id, result.description);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePlaceSelect(result.place_id, result.description);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors touch-manipulation cursor-pointer"
                  style={{
                    minHeight: '48px', // Always ensure adequate touch target size
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'rgba(0,0,0,0.1)', // Better touch feedback
                    userSelect: 'none' // Prevent text selection on touch
                  }}
                >
                  <div className="flex items-start space-x-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-medium leading-5">
                        {result.structured_formatting?.main_text}
                      </div>
                      <div className="text-xs text-gray-600 leading-4">
                        {result.structured_formatting?.secondary_text}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Address source indicator */}
          {userSelectedAddress && (
            <div className="flex items-center space-x-1 mt-2">
              <div className="flex items-center text-xs text-green-600">
                <MapPinIcon className="h-3 w-3 mr-1" />
{t('location.picker.selectedFromGoogle')}
              </div>
            </div>
          )}

          {/* Location permission status indicator */}
          <div className="mt-2">
            {requestingPermission && (
              <div className="flex items-center text-xs text-blue-600">
                <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full mr-1"></div>
                {t('location.requestingPermission', 'Requesting location access...')}
              </div>
            )}
            {!requestingPermission && locationPermissionDenied && (
              <div className="flex items-center text-xs text-amber-600">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                {t('location.permissionDenied', 'Location access denied. Enable in browser settings for better address suggestions.')}
              </div>
            )}
            {!requestingPermission && !locationPermissionDenied && locationSessionManager.isPermissionGranted() && (
              <div className="flex items-center text-xs text-green-600">
                <MapPinIcon className="h-3 w-3 mr-1" />
                {t('location.permissionGranted', 'Location access enabled - better address suggestions available')}
              </div>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}

          {/* Selected Address Display */}
          {userSelectedAddress && (
            <div className="bg-green-50 border border-green-200 rounded-3xl p-4 mt-3">
              <div className="flex items-center space-x-2 mb-2">
                <CheckIcon className="h-5 w-5 text-green-600" />
                <div className="text-sm font-medium text-green-900">Address Selected</div>
              </div>
              <div className="text-sm text-green-700">{userSelectedAddress}</div>
              {currentLocation.latitude !== 0 && currentLocation.longitude !== 0 && (
                <div className="text-xs text-green-600 mt-2">
                  📍 Coordinates: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </div>
              )}
            </div>
          )}

          {/* Helper Text */}
          <div className="text-xs text-gray-500 mt-2">
            <p>⚠️ Please select your address from the dropdown suggestions provided by Google. This ensures accurate location data.</p>
          </div>
        </div>
      </div>
    </div>
  )
}