import { apiClient } from './api'

// Dashboard API service
export class DashboardService {
  // Get stylist dashboard statistics
  static async getStylistStats(): Promise<{
    upcomingBookings: number
    totalBookings: number
    totalRevenue: number
    averageRating: number
    totalReviews: number
    followersCount: number
    profileCompleteness: number
  }> {
    try {
      const response = await apiClient.get('/api/dashboard/stylist/stats')
      return response.data
    } catch (error) {
      console.error('Failed to fetch stylist stats:', error)
      throw new Error('Failed to load dashboard statistics')
    }
  }

  // Get client dashboard statistics
  static async getClientStats(): Promise<{
    upcomingBookings: number
    totalBookings: number
    totalSpent: number
    favoriteStylists: number
  }> {
    try {
      const response = await apiClient.get('/api/dashboard/client/stats')
      return response.data
    } catch (error) {
      console.error('Failed to fetch client stats:', error)
      throw new Error('Failed to load dashboard statistics')
    }
  }

  // Get stylist activity data
  static async getStylistActivity(): Promise<{
    recentBookings: Array<{
      id: string
      appointment_date: string
      appointment_time: string
      status: string
      total_amount: number
      first_name: string
      last_name: string
      email: string
      service_name: string
    }>
    recentReviews: Array<{
      id: string
      rating: number
      comment: string
      created_at: string
      first_name: string
      last_name: string
      service_name: string
    }>
  }> {
    try {
      const response = await apiClient.get('/api/dashboard/stylist/activity')
      return response.data
    } catch (error) {
      console.error('Failed to fetch stylist activity:', error)
      throw new Error('Failed to load activity data')
    }
  }

  // Get client activity data
  static async getClientActivity(): Promise<{
    upcomingBookings: Array<{
      id: string
      appointment_date: string
      appointment_time: string
      status: string
      total_amount: number
      stylist_name: string
      location_address: string
      service_name: string
    }>
    recentBookings: Array<{
      id: string
      appointment_date: string
      appointment_time: string
      status: string
      total_amount: number
      stylist_name: string
      service_name: string
      rating?: number
      review_id?: string
    }>
  }> {
    try {
      const response = await apiClient.get('/api/dashboard/client/activity')
      return response.data
    } catch (error) {
      console.error('Failed to fetch client activity:', error)
      throw new Error('Failed to load activity data')
    }
  }

  // Get enhanced profile data
  static async getProfileData(): Promise<{
    user: {
      id: number
      first_name: string
      last_name: string
      name: string
      email: string
      phone: string
      role: string
      profile_picture_url?: string
      created_at: string
    }
    stylist?: any
    client?: any
  }> {
    try {
      const response = await apiClient.get('/api/dashboard/profile')
      return response.data
    } catch (error) {
      console.error('Failed to fetch profile data:', error)
      throw new Error('Failed to load profile data')
    }
  }
}

export default DashboardService