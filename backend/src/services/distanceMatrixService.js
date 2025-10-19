// DistanceMatrixService - Calculate ETA using Google Distance Matrix API
const axios = require('axios')

class DistanceMatrixService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY
    this.baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json'

    if (!this.apiKey) {
      console.warn('⚠️ Google Maps API key not found. Distance calculations will be unavailable.')
    }
  }

  // Calculate ETA between two points with live traffic
  async calculateETA(origin, destination, mode = 'driving') {
    if (!this.apiKey) {
      console.warn('⚠️ Cannot calculate ETA: Google Maps API key not configured')
      return null
    }

    try {
      const params = {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode: mode,
        departure_time: 'now', // Use current time for live traffic
        traffic_model: 'best_guess',
        key: this.apiKey
      }

      console.log('🗺️ Calculating ETA:', {
        origin: params.origins,
        destination: params.destinations,
        mode: params.mode
      })

      const response = await axios.get(this.baseUrl, { params })

      if (response.data.status !== 'OK') {
        console.error('❌ Distance Matrix API error:', response.data.status, response.data.error_message)
        return null
      }

      const element = response.data.rows[0]?.elements[0]

      if (!element || element.status !== 'OK') {
        console.error('❌ No route found between points:', element?.status)
        return null
      }

      const result = {
        distance_meters: element.distance.value,
        distance_text: element.distance.text,
        duration_seconds: element.duration.value,
        duration_text: element.duration.text,
        duration_minutes: Math.round(element.duration.value / 60),
        traffic_duration_seconds: element.duration_in_traffic?.value || element.duration.value,
        traffic_duration_text: element.duration_in_traffic?.text || element.duration.text,
        traffic_duration_minutes: Math.round((element.duration_in_traffic?.value || element.duration.value) / 60),
        has_traffic_data: !!element.duration_in_traffic,
        mode: mode,
        calculated_at: new Date().toISOString()
      }

      console.log('✅ ETA calculated:', {
        distance: result.distance_text,
        duration: result.traffic_duration_text,
        minutes: result.traffic_duration_minutes
      })

      return result

    } catch (error) {
      console.error('❌ Error calculating ETA:', error.message)
      return null
    }
  }

  // Calculate multiple ETAs (for finding nearest stylists)
  async calculateMultipleETAs(origin, destinations, mode = 'driving') {
    if (!this.apiKey) {
      console.warn('⚠️ Cannot calculate ETAs: Google Maps API key not configured')
      return []
    }

    if (destinations.length === 0) return []

    try {
      // Limit to 25 destinations per request (Google's limit)
      const batches = []
      for (let i = 0; i < destinations.length; i += 25) {
        batches.push(destinations.slice(i, i + 25))
      }

      const allResults = []

      for (const batch of batches) {
        const destinationString = batch
          .map(dest => `${dest.lat},${dest.lng}`)
          .join('|')

        const params = {
          origins: `${origin.lat},${origin.lng}`,
          destinations: destinationString,
          mode: mode,
          departure_time: 'now',
          traffic_model: 'best_guess',
          key: this.apiKey
        }

        const response = await axios.get(this.baseUrl, { params })

        if (response.data.status !== 'OK') {
          console.error('❌ Distance Matrix API error:', response.data.status)
          continue
        }

        const elements = response.data.rows[0]?.elements || []

        for (let i = 0; i < elements.length; i++) {
          const element = elements[i]
          const destination = batch[i]

          if (element.status === 'OK') {
            allResults.push({
              destination_id: destination.id,
              destination_lat: destination.lat,
              destination_lng: destination.lng,
              distance_meters: element.distance.value,
              distance_text: element.distance.text,
              duration_seconds: element.duration.value,
              duration_text: element.duration.text,
              duration_minutes: Math.round(element.duration.value / 60),
              traffic_duration_seconds: element.duration_in_traffic?.value || element.duration.value,
              traffic_duration_text: element.duration_in_traffic?.text || element.duration.text,
              traffic_duration_minutes: Math.round((element.duration_in_traffic?.value || element.duration.value) / 60),
              has_traffic_data: !!element.duration_in_traffic,
              mode: mode,
              calculated_at: new Date().toISOString()
            })
          } else {
            console.warn(`⚠️ No route to destination ${destination.id}:`, element.status)
          }
        }
      }

      console.log(`✅ Calculated ${allResults.length}/${destinations.length} ETAs`)
      return allResults

    } catch (error) {
      console.error('❌ Error calculating multiple ETAs:', error.message)
      return []
    }
  }

  // Get walking time between two points
  async getWalkingTime(origin, destination) {
    return this.calculateETA(origin, destination, 'walking')
  }

  // Get driving time without traffic (for baseline comparison)
  async getDrivingTimeNoTraffic(origin, destination) {
    if (!this.apiKey) return null

    try {
      const params = {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode: 'driving',
        key: this.apiKey
      }

      const response = await axios.get(this.baseUrl, { params })

      if (response.data.status !== 'OK') {
        return null
      }

      const element = response.data.rows[0]?.elements[0]

      if (!element || element.status !== 'OK') {
        return null
      }

      return {
        duration_seconds: element.duration.value,
        duration_minutes: Math.round(element.duration.value / 60),
        distance_text: element.distance.text,
        duration_text: element.duration.text
      }

    } catch (error) {
      console.error('❌ Error calculating driving time:', error.message)
      return null
    }
  }

  // Find nearest destinations by travel time
  async findNearestByTime(origin, destinations, limit = 5, mode = 'driving') {
    const etas = await this.calculateMultipleETAs(origin, destinations, mode)

    return etas
      .sort((a, b) => a.traffic_duration_minutes - b.traffic_duration_minutes)
      .slice(0, limit)
  }

  // Check if API key is configured
  isConfigured() {
    return !!this.apiKey
  }

  // Get usage statistics for monitoring
  async getUsageStats() {
    // This would typically track API usage in a production environment
    return {
      isConfigured: this.isConfigured(),
      apiKey: this.apiKey ? '***configured***' : 'not configured',
      baseUrl: this.baseUrl,
      lastUsed: new Date().toISOString()
    }
  }

  // Fallback distance calculation using Haversine formula (if Google API fails)
  calculateHaversineDistance(origin, destination) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(destination.lat - origin.lat)
    const dLng = this.toRadians(destination.lng - origin.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(origin.lat)) * Math.cos(this.toRadians(destination.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance_km = R * c

    // Rough estimate: 1 km = 1.5 minutes driving in city traffic
    const estimated_minutes = Math.round(distance_km * 1.5)

    return {
      distance_meters: distance_km * 1000,
      distance_text: `${distance_km.toFixed(1)} km`,
      duration_minutes: estimated_minutes,
      duration_text: `${estimated_minutes} min`,
      traffic_duration_minutes: estimated_minutes,
      traffic_duration_text: `${estimated_minutes} min`,
      has_traffic_data: false,
      is_estimate: true,
      calculated_at: new Date().toISOString()
    }
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }
}

module.exports = DistanceMatrixService