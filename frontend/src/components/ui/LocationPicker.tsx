import React, { useCallback, useRef, useState, useMemo } from 'react'
import { Wrapper, Status } from '@googlemaps/react-wrapper'
import { useTranslation } from 'react-i18next'
import { MapPinIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

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
  originalCenter: google.maps.LatLngLiteral
}

const Map: React.FC<MapProps> = ({ center, zoom, onLocationChange, userSelectedAddress, originalCenter }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map>()
  const [marker, setMarker] = useState<google.maps.Marker>()
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder>()

  // Calculate distance between two points in meters using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

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
        title: 'Drag me to your exact business entrance (max 30 meters)'
      })

      const newGeocoder = new window.google.maps.Geocoder()

      // Handle marker drag
      newMarker.addListener('dragend', () => {
        const position = newMarker.getPosition()
        if (position) {
          const lat = position.lat()
          const lng = position.lng()

          // Calculate distance from original position
          const distance = calculateDistance(originalCenter.lat, originalCenter.lng, lat, lng)
          console.log('📍 Marker dragged - distance from origin:', distance.toFixed(2), 'meters')

          // Check if within 30-meter limit
          if (distance > 30) {
            console.warn('⚠️ Marker dragged beyond 30-meter limit, snapping back')
            // Snap marker back to original position
            newMarker.setPosition(originalCenter)
            // Show visual feedback by briefly animating the marker
            newMarker.setAnimation(google.maps.Animation.BOUNCE)
            setTimeout(() => {
              newMarker.setAnimation(null)
            }, 700)
            return
          }

          console.log('✅ Marker position within 30-meter limit')

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
  }, [center, zoom, onLocationChange, map, originalCenter])

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

function LocationPickerInner({ value, onChange, error, apiKey }: LocationPickerProps) {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState(value?.address || '')
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [userSelectedAddress, setUserSelectedAddress] = useState<string | null>(null)
  const [isManualEdit, setIsManualEdit] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [addressSupplement, setAddressSupplement] = useState('')
  const [baseLocation, setBaseLocation] = useState<LocationData | null>(null)
  const [originalCenter, setOriginalCenter] = useState<google.maps.LatLngLiteral | null>(null)
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

  // Handle input focus - optional location permission (non-blocking)
  const handleInputFocus = async () => {
    // Don't request permission automatically - let user type first
    // Location permission is optional and only used for biasing search results
    updateDropdownPosition()
  }

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
    console.log('🔍 LocationPicker: handleSearch called:', {
      query,
      length: query.length,
      hasPlacesAPI: !!window.google?.maps?.places
    })

    setSearchValue(query)

    // Clear previous results immediately
    if (query.length <= 2) {
      console.log('⚠️ LocationPicker: Query too short, clearing results')
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    // Update dropdown position before showing results
    updateDropdownPosition()

    if (!window.google?.maps?.places?.AutocompleteSuggestion) {
      console.error('❌ LocationPicker: AutocompleteSuggestion API not available!', {
        hasGoogle: !!window.google,
        hasMaps: !!window.google?.maps,
        hasPlaces: !!window.google?.maps?.places
      })
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    try {
      const request = {
        input: query,
        includedRegionCodes: ['mx', 'us'],
        locationRestriction: null
      }

      console.log('📡 LocationPicker: Calling fetchAutocompleteSuggestions with:', request)

      const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)

      console.log('📥 LocationPicker: fetchAutocompleteSuggestions response:', {
        suggestionsCount: suggestions?.length || 0,
        firstSuggestion: suggestions?.[0],
        firstPlacePrediction: suggestions?.[0]?.placePrediction
      })

      if (suggestions && suggestions.length > 0) {
        console.log('✅ LocationPicker: Setting search results:', suggestions.length, 'results')

        // Convert new API format to old format for compatibility
        const predictions = suggestions.map(suggestion => {
          const placePrediction = suggestion.placePrediction

          // Extract text values from the new API format
          const mainText = placePrediction?.structuredFormat?.mainText?.text ||
                          placePrediction?.structuredFormat?.mainText?.toString() ||
                          placePrediction?.text?.text ||
                          ''
          const secondaryText = placePrediction?.structuredFormat?.secondaryText?.text ||
                               placePrediction?.structuredFormat?.secondaryText?.toString() ||
                               ''
          const fullText = placePrediction?.text?.text ||
                          placePrediction?.text?.toString() ||
                          ''

          console.log('🔍 LocationPicker: Converting suggestion:', {
            mainText,
            secondaryText,
            fullText,
            placeId: placePrediction?.placeId
          })

          return {
            description: fullText,
            place_id: placePrediction?.placeId || '',
            structured_formatting: {
              main_text: mainText,
              secondary_text: secondaryText
            },
            types: []
          }
        })

        setSearchResults(predictions)
        setShowSearchResults(true)
      } else {
        console.warn('⚠️ LocationPicker: No suggestions returned')
        setSearchResults([])
        setShowSearchResults(false)
      }
    } catch (error) {
      console.error('❌ LocationPicker: Exception in handleSearch:', error)
      setSearchResults([])
      setShowSearchResults(false)
    }
  }, [])

  const handlePlaceSelect = useCallback(async (placeId: string, description: string) => {
    console.log('🎯 LocationPicker: Place selected:', { placeId, description })
    setSearchValue(description)
    setShowSearchResults(false)
    setUserSelectedAddress(description) // Track that user manually selected this address

    // Get place details to extract coordinates using new Place API
    if (window.google?.maps?.places?.Place) {
      try {
        console.log('📍 LocationPicker: Requesting place details for:', placeId)

        // Create a new Place object with the placeId
        const place = new window.google.maps.places.Place({
          id: placeId
        })

        // Fetch place details with required fields
        await place.fetchFields({
          fields: ['location', 'formattedAddress', 'addressComponents']
        })

        console.log('📥 LocationPicker: Place details response:', {
          hasLocation: !!place.location,
          address: place.formattedAddress
        })

        if (place.location) {
          const lat = place.location.lat()
          const lng = place.location.lng()

          // Extract city and state from address components
          let city = ''
          let state = ''

          if (place.addressComponents) {
            for (const component of place.addressComponents) {
              const types = component.types
              if (types.includes('locality') || types.includes('sublocality')) {
                city = component.longText || ''
              } else if (types.includes('administrative_area_level_1')) {
                state = component.shortText || ''
              }
            }
          }

          const locationData = {
            address: place.formattedAddress || description,
            latitude: lat,
            longitude: lng,
            city,
            state
          }

          console.log('✅ LocationPicker: Location data extracted:', locationData)
          setUserSelectedAddress(locationData.address) // Update tracked address
          setBaseLocation(locationData) // Save base location for manual editing
          setManualAddress(locationData.address) // Initialize manual address
          setOriginalCenter({ lat, lng }) // Save original position for 30-meter limit
          onChange(locationData)
        } else {
          console.error('❌ LocationPicker: No location data in place response')
        }
      } catch (error) {
        console.error('❌ LocationPicker: Failed to get place details:', error)
      }
    } else {
      console.error('❌ LocationPicker: Place API not available')
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

        {/* Map Display - Show after address selection */}
        {userSelectedAddress && currentLocation.latitude !== 0 && currentLocation.longitude !== 0 && originalCenter && (
          <div className="mt-4">
            <label className="label mb-2">Fine-tune Your Location</label>
            <p className="text-xs text-gray-600 mb-3">
              Drag the pin to mark your exact business entrance. You can move it up to 30 meters from the selected address.
            </p>
            <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-lg h-96">
              <Map
                center={{
                  lat: currentLocation.latitude,
                  lng: currentLocation.longitude
                }}
                zoom={18}
                onLocationChange={onChange}
                userSelectedAddress={userSelectedAddress}
                originalCenter={originalCenter}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Zoom in for more precision. The marker will bounce back if moved beyond 30 meters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LocationPicker(props: LocationPickerProps) {
  return (
    <Wrapper apiKey={props.apiKey} render={render} libraries={['places']}>
      <LocationPickerInner {...props} />
    </Wrapper>
  )
}