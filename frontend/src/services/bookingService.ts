import { apiClient } from './api'
import type { ApiResponse, BookingStatus, UserCredits, CreditTransaction } from '../types'

export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
}

export interface StylistService {
  id: string
  stylist_id: string
  service_id: string
  custom_name?: string
  custom_price?: number
  custom_description?: string
  service: Service
}

export interface Stylist {
  id: string
  user_id: string
  business_name: string
  specialties: string[]
  location_city: string
  location_state: string
  location_address?: string
  location_zip?: string
  location_coordinates?: {
    x: number
    y: number
  }
  rating_average: string | number
  rating_count: number
  total_bookings: number
  profile_picture_url?: string
  bio?: string
  social_media_links?: {
    instagram?: string
    facebook?: string
  }
  experience_years: number
  portfolio_images?: string[]
  pricing_tier: string
  base_price_range: string
  certifications?: string[]
  is_verified: boolean
  name: string
  email: string
  services?: StylistService[]
}

export interface BookingRequest {
  stylist_id: string
  service_id: string
  appointment_date: string
  appointment_time: string
  notes?: string
}

export interface Booking {
  id: string
  client_id: string
  stylist_id: string
  service_id: string
  appointment_date: string
  appointment_time: string
  status: BookingStatus
  total_price: number
  notes?: string
  created_at: string
  updated_at: string
  service_name: string
  stylist_name: string
  stylist_business_name: string
}

class BookingService {
  // Get all stylists
  async getStylists(): Promise<ApiResponse<Stylist[]>> {
    return apiClient.get<Stylist[]>('/stylists')
  }

  // Get stylist by ID
  async getStylist(id: string): Promise<ApiResponse<Stylist>> {
    return apiClient.get<Stylist>(`/stylists/${id}`)
  }

  // Get available services
  async getServices(): Promise<ApiResponse<Service[]>> {
    return apiClient.get<Service[]>('/services')
  }

  // Get services offered by a specific stylist
  async getStylistServices(stylistId: string): Promise<ApiResponse<StylistService[]>> {
    return apiClient.get<StylistService[]>(`/stylists/${stylistId}/services`)
  }

  // Create a new booking
  async createBooking(bookingData: BookingRequest): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>('/bookings', bookingData)
  }

  // Get user's bookings
  async getBookings(): Promise<ApiResponse<Booking[]>> {
    return apiClient.get<Booking[]>('/bookings')
  }

  // Get booking by ID
  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    return apiClient.get<Booking>(`/bookings/${id}`)
  }

  // Update booking
  async updateBooking(id: string, data: Partial<BookingRequest>): Promise<ApiResponse<Booking>> {
    return apiClient.patch<Booking>(`/bookings/${id}`, data)
  }

  // Cancel booking
  async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
    return apiClient.patch<Booking>(`/bookings/${id}`, { status: 'CANCELLED' })
  }

  // Get available time slots for a stylist on a specific date
  async getAvailableSlots(stylistId: string, date: string): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>(`/stylists/${stylistId}/availability?date=${date}`)
  }

  // Stylist Response Methods
  async stylistAcceptBooking(bookingId: string, stylistId: string): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(`/bookings/${bookingId}/accept`, { stylistId })
  }

  async stylistDeclineBooking(bookingId: string, reason?: string): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(`/bookings/${bookingId}/stylist-decline`, { reason })
  }

  async stylistRescheduleBooking(bookingId: string, newDate: string, newTime: string): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(`/bookings/${bookingId}/stylist-reschedule`, {
      appointment_date: newDate,
      appointment_time: newTime
    })
  }

  // Client Confirmation Methods
  async clientConfirmBooking(bookingId: string, clientId: string, paymentIntentId: string): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(`/bookings/${bookingId}/confirm`, { clientId, paymentIntentId })
  }

  // No-show and Completion Methods
  async reportNoShow(bookingId: string, noShowType: 'CLIENT_NO_SHOW' | 'STYLIST_NO_SHOW'): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(`/bookings/${bookingId}/report-no-show`, { no_show_type: noShowType })
  }

  async markBookingComplete(bookingId: string): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(`/bookings/${bookingId}/complete`)
  }

  // Credit System Methods
  async getCreditBalance(): Promise<ApiResponse<UserCredits>> {
    return apiClient.get<UserCredits>('/credits/balance')
  }

  async getCreditHistory(limit?: number, offset?: number): Promise<ApiResponse<CreditTransaction[]>> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())

    return apiClient.get<CreditTransaction[]>(`/credits/history${params.toString() ? `?${params.toString()}` : ''}`)
  }

  async requestWithdrawal(amount: number, bankAccount?: any): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/credits/request-withdrawal', { amount, bankAccount })
  }
}

export const bookingService = new BookingService()