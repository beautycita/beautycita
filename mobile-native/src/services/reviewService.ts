/**
 * BeautyCita Mobile App - Review Service
 *
 * Handles review and rating operations:
 * - Create review
 * - Get reviews
 * - Update review
 * - Delete review
 * - Report review
 */

import apiClient from './apiClient';
import {Review, CreateReviewData} from '../types';

// ============================================================================
// Review Service
// ============================================================================

class ReviewService {
  /**
   * Create a review for a completed booking
   */
  async createReview(data: CreateReviewData): Promise<Review> {
    try {
      const response = await apiClient.post<{review: Review}>('/reviews', data);
      return response.data.review;
    } catch (error) {
      console.error('[Review Service] Create review error:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a stylist
   */
  async getStylistReviews(stylistId: number, page: number = 1, limit: number = 20): Promise<{
    reviews: Review[];
    total: number;
    average_rating: number;
  }> {
    try {
      const response = await apiClient.get(`/reviews/stylist/${stylistId}`, {
        params: {page, limit},
      });
      return response.data;
    } catch (error) {
      console.error('[Review Service] Get stylist reviews error:', error);
      throw error;
    }
  }

  /**
   * Get review by ID
   */
  async getReviewDetail(reviewId: number): Promise<Review> {
    try {
      const response = await apiClient.get<{review: Review}>(`/reviews/${reviewId}`);
      return response.data.review;
    } catch (error) {
      console.error('[Review Service] Get review detail error:', error);
      throw error;
    }
  }

  /**
   * Get reviews written by current user
   */
  async getMyReviews(): Promise<Review[]> {
    try {
      const response = await apiClient.get<{reviews: Review[]}>('/reviews/my');
      return response.data.reviews;
    } catch (error) {
      console.error('[Review Service] Get my reviews error:', error);
      throw error;
    }
  }

  /**
   * Update a review
   */
  async updateReview(reviewId: number, data: Partial<CreateReviewData>): Promise<Review> {
    try {
      const response = await apiClient.put<{review: Review}>(`/reviews/${reviewId}`, data);
      return response.data.review;
    } catch (error) {
      console.error('[Review Service] Update review error:', error);
      throw error;
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: number): Promise<void> {
    try {
      await apiClient.delete(`/reviews/${reviewId}`);
    } catch (error) {
      console.error('[Review Service] Delete review error:', error);
      throw error;
    }
  }

  /**
   * Report a review as inappropriate
   */
  async reportReview(reviewId: number, reason: string): Promise<void> {
    try {
      await apiClient.post(`/reviews/${reviewId}/report`, {reason});
    } catch (error) {
      console.error('[Review Service] Report review error:', error);
      throw error;
    }
  }

  /**
   * Check if user can review a booking
   */
  async canReviewBooking(bookingId: number): Promise<{
    can_review: boolean;
    reason?: string;
  }> {
    try {
      const response = await apiClient.get(`/reviews/can-review/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('[Review Service] Check can review error:', error);
      throw error;
    }
  }

  /**
   * Get review statistics for a stylist
   */
  async getStylistReviewStats(stylistId: number): Promise<{
    average_rating: number;
    total_reviews: number;
    rating_distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  }> {
    try {
      const response = await apiClient.get(`/reviews/stylist/${stylistId}/stats`);
      return response.data;
    } catch (error) {
      console.error('[Review Service] Get stylist review stats error:', error);
      throw error;
    }
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId: number): Promise<void> {
    try {
      await apiClient.post(`/reviews/${reviewId}/helpful`);
    } catch (error) {
      console.error('[Review Service] Mark review helpful error:', error);
      throw error;
    }
  }

  /**
   * Unmark review as helpful
   */
  async unmarkReviewHelpful(reviewId: number): Promise<void> {
    try {
      await apiClient.delete(`/reviews/${reviewId}/helpful`);
    } catch (error) {
      console.error('[Review Service] Unmark review helpful error:', error);
      throw error;
    }
  }

  /**
   * Get featured reviews (highest rated, most helpful)
   */
  async getFeaturedReviews(limit: number = 10): Promise<Review[]> {
    try {
      const response = await apiClient.get<{reviews: Review[]}>('/reviews/featured', {
        params: {limit},
      });
      return response.data.reviews;
    } catch (error) {
      console.error('[Review Service] Get featured reviews error:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

const reviewService = new ReviewService();
export default reviewService;
