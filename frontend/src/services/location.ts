// Location Service for BeautyCita - Puerto Vallarta Focus
export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: Date
  address?: string
}

export interface StylistLocation {
  id: number
  name: string
  business: string
  specialty: string[]
  latitude: number
  longitude: number
  rating: number
  reviews: number
  priceRange: '$' | '$$' | '$$$' | '$$$$'
  availability: boolean
  neighborhood: string
  services: string[]
  phone: string
  instagram?: string
  verified: boolean
}

export interface LocationPermissionResult {
  granted: boolean
  location?: LocationData
  error?: string
}

// Puerto Vallarta, Jalisco - Realistic stylist locations across the city
const PUERTO_VALLARTA_STYLISTS: StylistLocation[] = [
  // Centro/Zona Romántica (Downtown/Romantic Zone)
  {
    id: 1,
    name: 'Isabella Rodriguez',
    business: 'Bella Color Studio',
    specialty: ['Hair Coloring', 'Balayage', 'Highlights'],
    latitude: 20.6077,
    longitude: -105.2400,
    rating: 4.9,
    reviews: 847,
    priceRange: '$$',
    availability: true,
    neighborhood: 'Zona Romántica',
    services: ['Corte', 'Color', 'Peinado', 'Tratamientos'],
    phone: '+52 322 222 1234',
    instagram: '@bellacolorstudio',
    verified: true
  },
  {
    id: 2,
    name: 'Sofia Mendoza',
    business: 'Salón Elite Centro',
    specialty: ['Bridal Hair', 'Updos', 'Extensions'],
    latitude: 20.6134,
    longitude: -105.2298,
    rating: 4.8,
    reviews: 623,
    priceRange: '$$$',
    availability: true,
    neighborhood: 'Centro',
    services: ['Peinados de Novia', 'Extensiones', 'Maquillaje'],
    phone: '+52 322 223 5678',
    instagram: '@salonelitecentro',
    verified: true
  },
  {
    id: 3,
    name: 'Carmen Vásquez',
    business: 'Beauty Corner Romántica',
    specialty: ['Nails', 'Manicure', 'Pedicure'],
    latitude: 20.6089,
    longitude: -105.2389,
    rating: 4.7,
    reviews: 392,
    priceRange: '$',
    availability: false,
    neighborhood: 'Zona Romántica',
    services: ['Manicure', 'Pedicure', 'Uñas Acrílicas'],
    phone: '+52 322 224 9012',
    verified: true
  },

  // Marina Vallarta
  {
    id: 4,
    name: 'Alejandra Torres',
    business: 'Marina Beauty Lounge',
    specialty: ['Luxury Treatments', 'Facials', 'Anti-aging'],
    latitude: 20.6234,
    longitude: -105.2567,
    rating: 5.0,
    reviews: 234,
    priceRange: '$$$$',
    availability: true,
    neighborhood: 'Marina Vallarta',
    services: ['Faciales', 'Tratamientos Anti-edad', 'Spa'],
    phone: '+52 322 225 3456',
    instagram: '@marinabeautylounge',
    verified: true
  },
  {
    id: 5,
    name: 'Ricardo Silva',
    business: 'Men\'s Style Marina',
    specialty: ['Men\'s Cuts', 'Beard Styling', 'Hair Styling'],
    latitude: 20.6201,
    longitude: -105.2534,
    rating: 4.9,
    reviews: 456,
    priceRange: '$$',
    availability: true,
    neighborhood: 'Marina Vallarta',
    services: ['Cortes Masculinos', 'Arreglo de Barba', 'Styling'],
    phone: '+52 322 226 7890',
    instagram: '@mensstylemarina',
    verified: true
  },

  // Versalles/Fluvial
  {
    id: 6,
    name: 'Lupita Hernández',
    business: 'Estética Versalles',
    specialty: ['Family Salon', 'Kids Cuts', 'Women\'s Styling'],
    latitude: 20.6312,
    longitude: -105.2123,
    rating: 4.6,
    reviews: 578,
    priceRange: '$',
    availability: true,
    neighborhood: 'Versalles',
    services: ['Cortes Familiares', 'Niños', 'Styling Femenino'],
    phone: '+52 322 227 1234',
    verified: true
  },
  {
    id: 7,
    name: 'Mónica Ramirez',
    business: 'Glamour Fluvial',
    specialty: ['Wedding Makeup', 'Evening Looks', 'Photography Makeup'],
    latitude: 20.6289,
    longitude: -105.2089,
    rating: 4.8,
    reviews: 291,
    priceRange: '$$$',
    availability: false,
    neighborhood: 'Fluvial Vallarta',
    services: ['Maquillaje de Boda', 'Looks de Noche', 'Fotografía'],
    phone: '+52 322 228 5678',
    instagram: '@glamourfluvial',
    verified: true
  },

  // Las Glorias/Hotel Zone
  {
    id: 8,
    name: 'Fernanda López',
    business: 'Glorias Beauty Spa',
    specialty: ['Resort Services', 'Beach Hair', 'Vacation Looks'],
    latitude: 20.6445,
    longitude: -105.2267,
    rating: 4.7,
    reviews: 689,
    priceRange: '$$',
    availability: true,
    neighborhood: 'Las Glorias',
    services: ['Servicios de Resort', 'Peinados de Playa', 'Looks Vacacionales'],
    phone: '+52 322 229 9012',
    instagram: '@gloriasbeautyspa',
    verified: true
  },
  {
    id: 9,
    name: 'Daniela Martínez',
    business: 'Hotel Zone Hair Studio',
    specialty: ['Express Services', 'Blowouts', 'Quick Styling'],
    latitude: 20.6401,
    longitude: -105.2298,
    rating: 4.5,
    reviews: 445,
    priceRange: '$',
    availability: true,
    neighborhood: 'Zona Hotelera',
    services: ['Servicios Express', 'Brushing', 'Styling Rápido'],
    phone: '+52 322 230 3456',
    verified: true
  },

  // Conchas Chinas (Upscale Southern Area)
  {
    id: 10,
    name: 'Valentina Cruz',
    business: 'Conchas Chinas Luxury Salon',
    specialty: ['High-end Cuts', 'Color Correction', 'Luxury Treatments'],
    latitude: 20.5934,
    longitude: -105.2445,
    rating: 4.9,
    reviews: 156,
    priceRange: '$$$$',
    availability: true,
    neighborhood: 'Conchas Chinas',
    services: ['Cortes de Lujo', 'Corrección de Color', 'Tratamientos Premium'],
    phone: '+52 322 231 7890',
    instagram: '@conchaschinassalon',
    verified: true
  },

  // Additional stylists across other neighborhoods
  {
    id: 11,
    name: 'Paola Jiménez',
    business: 'Nails & More PV',
    specialty: ['Nail Art', 'Gel Manicures', 'Nail Extensions'],
    latitude: 20.6156,
    longitude: -105.2345,
    rating: 4.6,
    reviews: 334,
    priceRange: '$',
    availability: true,
    neighborhood: 'Centro',
    services: ['Arte en Uñas', 'Manicure Gel', 'Extensiones'],
    phone: '+52 322 232 1234',
    instagram: '@nailsandmorepv',
    verified: true
  },
  {
    id: 12,
    name: 'Gabriela Sánchez',
    business: 'Brow Bar Vallarta',
    specialty: ['Eyebrow Threading', 'Microblading', 'Lash Extensions'],
    latitude: 20.6198,
    longitude: -105.2234,
    rating: 4.8,
    reviews: 267,
    priceRange: '$$',
    availability: false,
    neighborhood: 'Centro',
    services: ['Depilación de Cejas', 'Microblading', 'Extensiones de Pestañas'],
    phone: '+52 322 233 5678',
    instagram: '@browbarvallarta',
    verified: true
  }
]

class LocationService {
  private static instance: LocationService
  private currentLocation: LocationData | null = null
  private stylists: StylistLocation[] = PUERTO_VALLARTA_STYLISTS

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
  }

  async requestLocationPermission(): Promise<LocationPermissionResult> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          granted: false,
          error: 'Geolocation is not supported by this browser'
        })
        return
      }

      // Check if permission is already granted
      if (this.currentLocation) {
        resolve({
          granted: true,
          location: this.currentLocation
        })
        return
      }

      console.log('🌍 Requesting location permission for BeautyCita...')

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          }

          // Try to get address from coordinates
          try {
            const address = await this.getAddressFromCoordinates(location.latitude, location.longitude)
            location.address = address
          } catch (error) {
            console.log('Could not get address from coordinates')
          }

          this.currentLocation = location
          console.log('✅ Location permission granted for BeautyCita:', location)

          resolve({
            granted: true,
            location
          })
        },
        (error) => {
          let errorMessage = 'Location access denied'

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
          }

          console.log('❌ Location permission denied for BeautyCita:', errorMessage)

          resolve({
            granted: false,
            error: errorMessage
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  private async getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
      )

      if (!response.ok) throw new Error('Geocoding failed')

      const data = await response.json()
      const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`

      return address
    } catch (error) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  getCurrentLocation(): LocationData | null {
    return this.currentLocation
  }

  setCurrentLocation(location: { latitude: number; longitude: number }): void {
    this.currentLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: 0,
      timestamp: new Date()
    }
  }

  async getNearbyStylists(radius: number = 25, limit: number = 20): Promise<(StylistLocation & { distance: number })[]> {
    if (!this.currentLocation) {
      throw new Error('Location not available - please enable location access')
    }

    const stylistsWithDistance = this.stylists.map(stylist => ({
      ...stylist,
      distance: this.calculateDistance(
        this.currentLocation!.latitude,
        this.currentLocation!.longitude,
        stylist.latitude,
        stylist.longitude
      )
    }))

    // Filter by radius and sort by distance
    return stylistsWithDistance
      .filter(stylist => stylist.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
  }

  async searchStylists(query: {
    specialty?: string
    priceRange?: string[]
    rating?: number
    availability?: boolean
    neighborhood?: string
    radius?: number
  }): Promise<(StylistLocation & { distance: number })[]> {
    const nearbyStylists = await this.getNearbyStylists(query.radius || 25)

    return nearbyStylists.filter(stylist => {
      if (query.specialty && !stylist.specialty.some(s =>
        s.toLowerCase().includes(query.specialty!.toLowerCase())
      )) {
        return false
      }

      if (query.priceRange && !query.priceRange.includes(stylist.priceRange)) {
        return false
      }

      if (query.rating && stylist.rating < query.rating) {
        return false
      }

      if (query.availability !== undefined && stylist.availability !== query.availability) {
        return false
      }

      if (query.neighborhood && stylist.neighborhood !== query.neighborhood) {
        return false
      }

      return true
    })
  }

  getLocationString(): string {
    if (!this.currentLocation) return 'Location not available'

    if (this.currentLocation.address) {
      return this.currentLocation.address
    }

    return `${this.currentLocation.latitude.toFixed(4)}, ${this.currentLocation.longitude.toFixed(4)}`
  }

  getNeighborhoods(): string[] {
    return [...new Set(this.stylists.map(s => s.neighborhood))]
  }

  getAllStylists(): StylistLocation[] {
    return this.stylists
  }

  // Check if user is in Puerto Vallarta area
  isInPuertoVallarta(): boolean {
    if (!this.currentLocation) return false

    const PV_CENTER_LAT = 20.6134
    const PV_CENTER_LNG = -105.2298
    const PV_RADIUS = 30 // 30km radius covers Puerto Vallarta metro area

    const distance = this.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      PV_CENTER_LAT,
      PV_CENTER_LNG
    )

    return distance <= PV_RADIUS
  }
}

export const locationService = LocationService.getInstance()
export default locationService