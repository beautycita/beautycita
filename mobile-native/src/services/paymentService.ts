/**
 * BeautyCita Mobile App - Payment Service
 *
 * Handles Stripe payment operations:
 * - Create payment intent
 * - Confirm payment
 * - Payment history
 * - Refunds
 */

import apiClient from './apiClient';
import {Payment, PaymentIntent, PaymentStatus} from '../types';
import {useStripe} from '@stripe/stripe-react-native';

// ============================================================================
// Payment Service
// ============================================================================

class PaymentService {
  /**
   * Create a payment intent for booking
   */
  async createPaymentIntent(bookingId: number, amount: number): Promise<PaymentIntent> {
    try {
      const response = await apiClient.post<PaymentIntent>('/payments/create-intent', {
        booking_id: bookingId,
        amount,
      });
      return response.data;
    } catch (error) {
      console.error('[Payment Service] Create payment intent error:', error);
      throw error;
    }
  }

  /**
   * Confirm payment after client secret is obtained
   */
  async confirmPayment(paymentIntentId: string): Promise<Payment> {
    try {
      const response = await apiClient.post<{payment: Payment}>('/payments/confirm', {
        payment_intent_id: paymentIntentId,
      });
      return response.data.payment;
    } catch (error) {
      console.error('[Payment Service] Confirm payment error:', error);
      throw error;
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(): Promise<Payment[]> {
    try {
      const response = await apiClient.get<{payments: Payment[]}>('/payments/history');
      return response.data.payments;
    } catch (error) {
      console.error('[Payment Service] Get payment history error:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetail(paymentId: number): Promise<Payment> {
    try {
      const response = await apiClient.get<{payment: Payment}>(`/payments/${paymentId}`);
      return response.data.payment;
    } catch (error) {
      console.error('[Payment Service] Get payment detail error:', error);
      throw error;
    }
  }

  /**
   * Request refund
   */
  async requestRefund(paymentId: number, reason?: string): Promise<Payment> {
    try {
      const response = await apiClient.post<{payment: Payment}>(`/payments/${paymentId}/refund`, {
        reason,
      });
      return response.data.payment;
    } catch (error) {
      console.error('[Payment Service] Request refund error:', error);
      throw error;
    }
  }

  /**
   * Request partial refund
   */
  async requestPartialRefund(paymentId: number, amount: number, reason?: string): Promise<Payment> {
    try {
      const response = await apiClient.post<{payment: Payment}>(`/payments/${paymentId}/refund`, {
        amount,
        reason,
      });
      return response.data.payment;
    } catch (error) {
      console.error('[Payment Service] Request partial refund error:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentIntentId: string): Promise<{
    status: PaymentStatus;
    amount: number;
    currency: string;
  }> {
    try {
      const response = await apiClient.get(`/payments/status/${paymentIntentId}`);
      return response.data;
    } catch (error) {
      console.error('[Payment Service] Get payment status error:', error);
      throw error;
    }
  }

  /**
   * Get payment methods for current user
   */
  async getPaymentMethods(): Promise<any[]> {
    try {
      const response = await apiClient.get<{payment_methods: any[]}>('/payments/methods');
      return response.data.payment_methods;
    } catch (error) {
      console.error('[Payment Service] Get payment methods error:', error);
      throw error;
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(paymentMethodId: string): Promise<any> {
    try {
      const response = await apiClient.post('/payments/methods', {
        payment_method_id: paymentMethodId,
      });
      return response.data.payment_method;
    } catch (error) {
      console.error('[Payment Service] Add payment method error:', error);
      throw error;
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await apiClient.delete(`/payments/methods/${paymentMethodId}`);
    } catch (error) {
      console.error('[Payment Service] Remove payment method error:', error);
      throw error;
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await apiClient.put(`/payments/methods/${paymentMethodId}/default`);
    } catch (error) {
      console.error('[Payment Service] Set default payment method error:', error);
      throw error;
    }
  }

  /**
   * Process payment for booking using Stripe
   * This is a helper method that combines creating and confirming payment
   */
  async processBookingPayment(
    bookingId: number,
    amount: number,
    paymentMethodId: string,
  ): Promise<Payment> {
    try {
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(bookingId, amount);

      // The confirmation should be handled by Stripe SDK in the component
      // This method just creates the intent and returns it
      // The actual confirmation happens in the UI with useStripe hook

      return {
        id: 0,
        booking_id: bookingId,
        amount,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'PENDING',
        payment_method: 'CARD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Payment Service] Process booking payment error:', error);
      throw error;
    }
  }

  /**
   * Get earnings summary (for stylists)
   */
  async getEarningsSummary(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    total_earnings: number;
    pending_payouts: number;
    paid_out: number;
    platform_fees: number;
    net_earnings: number;
    payment_count: number;
  }> {
    try {
      const response = await apiClient.get('/payments/earnings', {
        params: {period},
      });
      return response.data;
    } catch (error) {
      console.error('[Payment Service] Get earnings summary error:', error);
      throw error;
    }
  }

  /**
   * Get payout history (for stylists)
   */
  async getPayoutHistory(): Promise<any[]> {
    try {
      const response = await apiClient.get<{payouts: any[]}>('/payments/payouts');
      return response.data.payouts;
    } catch (error) {
      console.error('[Payment Service] Get payout history error:', error);
      throw error;
    }
  }

  /**
   * Get payment receipt
   */
  async getPaymentReceipt(paymentId: number): Promise<{
    receipt_url: string;
    receipt_number: string;
  }> {
    try {
      const response = await apiClient.get(`/payments/${paymentId}/receipt`);
      return response.data;
    } catch (error) {
      console.error('[Payment Service] Get payment receipt error:', error);
      throw error;
    }
  }

  /**
   * Download payment receipt
   */
  async downloadPaymentReceipt(paymentId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(`/payments/${paymentId}/receipt/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('[Payment Service] Download payment receipt error:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

const paymentService = new PaymentService();
export default paymentService;
