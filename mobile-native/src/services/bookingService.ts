/**
 * BeautyCita Mobile App - Booking Service
 *
 * Handles all booking-related operations:
 * - Create booking
 * - Get bookings
 * - Update booking status
 * - Cancel booking
 * - Location tracking
 */

import apiClient from './apiClient';
import {
  Booking,
  CreateBookingData,
  BookingStatus,
  LocationCoordinates,
} from '../types';

// ============================================================================
// Booking Service
// ============================================================================

class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingData): Promise<Booking> {
    try {
      const response = await apiClient.post<{booking: Booking}>('/bookings', data);
      return response.data.booking;
    } catch (error) {
      console.error('[Booking Service] Create booking error:', error);
      throw error;
    }
  }

  /**
   * Get user's bookings (client or stylist)
   */
  async getMyBookings(status?: BookingStatus): Promise<Booking[]> {
    try {
      const params = status ? {status} : {};
      const response = await apiClient.get<{bookings: Booking[]}>('/bookings/my', {params});
      return response.data.bookings;
    } catch (error) {
      console.error('[Booking Service] Get my bookings error:', error);
      throw error;
    }
  }

  /**
   * Get upcoming bookings
   */
  async getUpcomingBookings(): Promise<Booking[]> {
    try {
      const response = await apiClient.get<{bookings: Booking[]}>('/bookings/upcoming');
      return response.data.bookings;
    } catch (error) {
      console.error('[Booking Service] Get upcoming bookings error:', error);
      throw error;
    }
  }

  /**
   * Get past bookings
   */
  async getPastBookings(): Promise<Booking[]> {
    try {
      const response = await apiClient.get<{bookings: Booking[]}>('/bookings/past');
      return response.data.bookings;
    } catch (error) {
      console.error('[Booking Service] Get past bookings error:', error);
      throw error;
    }
  }

  /**
   * Get booking details
   */
  async getBookingDetail(bookingId: number): Promise<Booking> {
    try {
      const response = await apiClient.get<{booking: Booking}>(`/bookings/${bookingId}`);
      return response.data.booking;
    } catch (error) {
      console.error('[Booking Service] Get booking detail error:', error);
      throw error;
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: number, status: BookingStatus): Promise<Booking> {
    try {
      const response = await apiClient.put<{booking: Booking}>(`/bookings/${bookingId}/status`, {
        status,
      });
      return response.data.booking;
    } catch (error) {
      console.error('[Booking Service] Update booking status error:', error);
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: number, reason?: string): Promise<void> {
    try {
      await apiClient.post(`/bookings/${bookingId}/cancel`, {reason});
    } catch (error) {
      console.error('[Booking Service] Cancel booking error:', error);
      throw error;
    }
  }

  /**
   * Confirm booking (stylist)
   */
  async confirmBooking(bookingId: number): Promise<Booking> {
    try {
      return await this.updateBookingStatus(bookingId, 'CONFIRMED');
    } catch (error) {
      console.error('[Booking Service] Confirm booking error:', error);
      throw error;
    }
  }

  /**
   * Start booking (in progress)
   */
  async startBooking(bookingId: number): Promise<Booking> {
    try {
      return await this.updateBookingStatus(bookingId, 'IN_PROGRESS');
    } catch (error) {
      console.error('[Booking Service] Start booking error:', error);
      throw error;
    }
  }

  /**
   * Complete booking
   */
  async completeBooking(bookingId: number): Promise<Booking> {
    try {
      return await this.updateBookingStatus(bookingId, 'COMPLETED');
    } catch (error) {
      console.error('[Booking Service] Complete booking error:', error);
      throw error;
    }
  }

  /**
   * Mark booking as no-show
   */
  async markNoShow(bookingId: number): Promise<Booking> {
    try {
      return await this.updateBookingStatus(bookingId, 'NO_SHOW');
    } catch (error) {
      console.error('[Booking Service] Mark no-show error:', error);
      throw error;
    }
  }

  /**
   * Update client location (en route tracking)
   */
  async updateLocation(bookingId: number, location: LocationCoordinates): Promise<void> {
    try {
      await apiClient.post(`/bookings/${bookingId}/location`, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error('[Booking Service] Update location error:', error);
      throw error;
    }
  }

  /**
   * Start en route tracking
   */
  async startEnRoute(bookingId: number, location: LocationCoordinates): Promise<void> {
    try {
      await apiClient.post(`/bookings/${bookingId}/en-route`, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error('[Booking Service] Start en route error:', error);
      throw error;
    }
  }

  /**
   * Stop en route tracking
   */
  async stopEnRoute(bookingId: number): Promise<void> {
    try {
      await apiClient.post(`/bookings/${bookingId}/en-route/stop`);
    } catch (error) {
      console.error('[Booking Service] Stop en route error:', error);
      throw error;
    }
  }

  /**
   * Get distance to stylist location
   */
  async getDistanceToStylist(bookingId: number): Promise<{
    distance_miles: number;
    eta_minutes: number;
  }> {
    try {
      const response = await apiClient.get<{distance_miles: number; eta_minutes: number}>(
        `/bookings/${bookingId}/distance`,
      );
      return response.data;
    } catch (error) {
      console.error('[Booking Service] Get distance to stylist error:', error);
      throw error;
    }
  }

  /**
   * Add notes to booking
   */
  async addNotes(bookingId: number, notes: string): Promise<Booking> {
    try {
      const response = await apiClient.put<{booking: Booking}>(`/bookings/${bookingId}/notes`, {
        notes,
      });
      return response.data.booking;
    } catch (error) {
      console.error('[Booking Service] Add notes error:', error);
      throw error;
    }
  }

  /**
   * Reschedule booking
   */
  async rescheduleBooking(
    bookingId: number,
    newDate: string,
    newStartTime: string,
  ): Promise<Booking> {
    try {
      const response = await apiClient.put<{booking: Booking}>(`/bookings/${bookingId}/reschedule`, {
        booking_date: newDate,
        start_time: newStartTime,
      });
      return response.data.booking;
    } catch (error) {
      console.error('[Booking Service] Reschedule booking error:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics (for stylist dashboard)
   */
  async getBookingStats(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    total_bookings: number;
    confirmed_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    no_show_bookings: number;
    total_revenue: number;
    average_booking_value: number;
  }> {
    try {
      const response = await apiClient.get(`/bookings/stats`, {
        params: {period},
      });
      return response.data;
    } catch (error) {
      console.error('[Booking Service] Get booking stats error:', error);
      throw error;
    }
  }

  /**
   * Check for booking conflicts
   */
  async checkConflicts(stylistId: number, date: string, startTime: string, duration: number): Promise<{
    has_conflict: boolean;
    conflicting_bookings?: Booking[];
  }> {
    try {
      const response = await apiClient.post<{
        has_conflict: boolean;
        conflicting_bookings?: Booking[];
      }>('/bookings/check-conflicts', {
        stylist_id: stylistId,
        date,
        start_time: startTime,
        duration_minutes: duration,
      });
      return response.data;
    } catch (error) {
      console.error('[Booking Service] Check conflicts error:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

const bookingService = new BookingService();
export default bookingService;
