/**
 * BeautyCita Mobile App - Stylist Service
 *
 * Handles stylist-related operations:
 * - Search stylists
 * - Get stylist details
 * - Get availability
 * - Dashboard data
 * - Revenue analytics
 */

import apiClient from './apiClient';
import {
  Stylist,
  StylistSearchFilters,
  TimeSlot,
  DashboardData,
  RevenueData,
  Review,
} from '../types';

// ============================================================================
// Stylist Service
// ============================================================================

class StylistService {
  /**
   * Search for stylists with filters
   */
  async searchStylists(filters: StylistSearchFilters): Promise<Stylist[]> {
    try {
      const response = await apiClient.get<{stylists: Stylist[]}>('/stylists/search', {
        params: filters,
      });
      return response.data.stylists;
    } catch (error) {
      console.error('[Stylist Service] Search stylists error:', error);
      throw error;
    }
  }

  /**
   * Get nearby stylists based on current location
   */
  async getNearbyStylists(
    latitude: number,
    longitude: number,
    radius: number = 25,
  ): Promise<Stylist[]> {
    try {
      return await this.searchStylists({
        latitude,
        longitude,
        radius,
      });
    } catch (error) {
      console.error('[Stylist Service] Get nearby stylists error:', error);
      throw error;
    }
  }

  /**
   * Get stylist details by ID
   */
  async getStylistDetail(stylistId: number): Promise<Stylist> {
    try {
      const response = await apiClient.get<{stylist: Stylist}>(`/stylists/${stylistId}`);
      return response.data.stylist;
    } catch (error) {
      console.error('[Stylist Service] Get stylist detail error:', error);
      throw error;
    }
  }

  /**
   * Get stylist availability for a specific date
   */
  async getStylistAvailability(stylistId: number, date: string): Promise<TimeSlot[]> {
    try {
      const response = await apiClient.get<{availability: TimeSlot[]}>(
        `/stylists/${stylistId}/availability`,
        {
          params: {date},
        },
      );
      return response.data.availability;
    } catch (error) {
      console.error('[Stylist Service] Get stylist availability error:', error);
      throw error;
    }
  }

  /**
   * Get stylist reviews
   */
  async getStylistReviews(stylistId: number): Promise<Review[]> {
    try {
      const response = await apiClient.get<{reviews: Review[]}>(`/stylists/${stylistId}/reviews`);
      return response.data.reviews;
    } catch (error) {
      console.error('[Stylist Service] Get stylist reviews error:', error);
      throw error;
    }
  }

  /**
   * Get stylist portfolio images
   */
  async getStylistPortfolio(stylistId: number): Promise<string[]> {
    try {
      const response = await apiClient.get<{images: string[]}>(`/stylists/${stylistId}/portfolio`);
      return response.data.images;
    } catch (error) {
      console.error('[Stylist Service] Get stylist portfolio error:', error);
      throw error;
    }
  }

  /**
   * Upload portfolio image
   */
  async uploadPortfolioImage(imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'portfolio.jpg',
      } as any);

      const response = await apiClient.post<{url: string}>('/stylists/portfolio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('[Stylist Service] Upload portfolio image error:', error);
      throw error;
    }
  }

  /**
   * Delete portfolio image
   */
  async deletePortfolioImage(imageUrl: string): Promise<void> {
    try {
      await apiClient.delete('/stylists/portfolio', {
        data: {image_url: imageUrl},
      });
    } catch (error) {
      console.error('[Stylist Service] Delete portfolio image error:', error);
      throw error;
    }
  }

  /**
   * Reorder portfolio images
   */
  async reorderPortfolioImages(imageUrls: string[]): Promise<void> {
    try {
      await apiClient.put('/stylists/portfolio/reorder', {
        image_urls: imageUrls,
      });
    } catch (error) {
      console.error('[Stylist Service] Reorder portfolio images error:', error);
      throw error;
    }
  }

  /**
   * Get stylist dashboard data
   */
  async getDashboard(): Promise<DashboardData> {
    try {
      const response = await apiClient.get<DashboardData>('/stylists/dashboard');
      return response.data;
    } catch (error) {
      console.error('[Stylist Service] Get dashboard error:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenue(period: 'week' | 'month' | 'year' = 'month'): Promise<RevenueData> {
    try {
      const response = await apiClient.get<RevenueData>('/stylists/revenue', {
        params: {period},
      });
      return response.data;
    } catch (error) {
      console.error('[Stylist Service] Get revenue error:', error);
      throw error;
    }
  }

  /**
   * Set stylist availability schedule
   */
  async setAvailability(schedule: {
    day_of_week: number; // 0-6 (Sunday-Saturday)
    start_time: string; // HH:MM
    end_time: string; // HH:MM
    is_available: boolean;
  }[]): Promise<void> {
    try {
      await apiClient.post('/stylists/availability', {schedule});
    } catch (error) {
      console.error('[Stylist Service] Set availability error:', error);
      throw error;
    }
  }

  /**
   * Block specific date/time
   */
  async blockDateTime(date: string, startTime: string, endTime: string, reason?: string): Promise<void> {
    try {
      await apiClient.post('/stylists/availability/block', {
        date,
        start_time: startTime,
        end_time: endTime,
        reason,
      });
    } catch (error) {
      console.error('[Stylist Service] Block date/time error:', error);
      throw error;
    }
  }

  /**
   * Unblock specific date/time
   */
  async unblockDateTime(blockId: number): Promise<void> {
    try {
      await apiClient.delete(`/stylists/availability/block/${blockId}`);
    } catch (error) {
      console.error('[Stylist Service] Unblock date/time error:', error);
      throw error;
    }
  }

  /**
   * Get Stripe Connect onboarding status
   */
  async getStripeConnectStatus(): Promise<{
    onboarding_complete: boolean;
    account_id: string | null;
    charges_enabled: boolean;
    payouts_enabled: boolean;
  }> {
    try {
      const response = await apiClient.get('/stylists/stripe/status');
      return response.data;
    } catch (error) {
      console.error('[Stylist Service] Get Stripe Connect status error:', error);
      throw error;
    }
  }

  /**
   * Create Stripe Connect account and get onboarding link
   */
  async createStripeConnectAccount(): Promise<{
    account_id: string;
    onboarding_url: string;
  }> {
    try {
      const response = await apiClient.post<{account_id: string; onboarding_url: string}>(
        '/stylists/stripe/create-account',
      );
      return response.data;
    } catch (error) {
      console.error('[Stylist Service] Create Stripe Connect account error:', error);
      throw error;
    }
  }

  /**
   * Get Stripe dashboard link
   */
  async getStripeDashboardLink(): Promise<string> {
    try {
      const response = await apiClient.get<{url: string}>('/stylists/stripe/dashboard');
      return response.data.url;
    } catch (error) {
      console.error('[Stylist Service] Get Stripe dashboard link error:', error);
      throw error;
    }
  }

  /**
   * Get featured stylists (for home page)
   */
  async getFeaturedStylists(): Promise<Stylist[]> {
    try {
      const response = await apiClient.get<{stylists: Stylist[]}>('/stylists/featured');
      return response.data.stylists;
    } catch (error) {
      console.error('[Stylist Service] Get featured stylists error:', error);
      throw error;
    }
  }

  /**
   * Get top-rated stylists
   */
  async getTopRatedStylists(limit: number = 10): Promise<Stylist[]> {
    try {
      const response = await apiClient.get<{stylists: Stylist[]}>('/stylists/top-rated', {
        params: {limit},
      });
      return response.data.stylists;
    } catch (error) {
      console.error('[Stylist Service] Get top-rated stylists error:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

const stylistService = new StylistService();
export default stylistService;
