/**
 * BeautyCita Mobile App - User Service
 *
 * Handles user profile management operations:
 * - Get profile
 * - Update profile
 * - Upload photo
 * - Payment methods
 * - SMS preferences
 */

import apiClient from './apiClient';
import {
  User,
  UpdateClientProfileData,
  UpdateStylistProfileData,
  PaymentMethodData,
  SmsPreferences,
} from '../types';
import {launchImageLibrary, ImagePickerResponse} from 'react-native-image-picker';

// ============================================================================
// User Service
// ============================================================================

class UserService {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<{user: User}>('/users/me');
      return response.data.user;
    } catch (error) {
      console.error('[User Service] Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update client profile
   */
  async updateClientProfile(data: UpdateClientProfileData): Promise<User> {
    try {
      const response = await apiClient.put<{user: User}>('/users/client/profile', data);
      return response.data.user;
    } catch (error) {
      console.error('[User Service] Update client profile error:', error);
      throw error;
    }
  }

  /**
   * Update stylist profile
   */
  async updateStylistProfile(data: UpdateStylistProfileData): Promise<User> {
    try {
      const response = await apiClient.put<{user: User}>('/users/stylist/profile', data);
      return response.data.user;
    } catch (error) {
      console.error('[User Service] Update stylist profile error:', error);
      throw error;
    }
  }

  /**
   * Upload profile photo
   */
  async uploadPhoto(uri: string): Promise<string> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await apiClient.post<{url: string}>('/users/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('[User Service] Upload photo error:', error);
      throw error;
    }
  }

  /**
   * Pick and upload profile photo
   */
  async pickAndUploadPhoto(): Promise<string> {
    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (result.didCancel) {
        throw new Error('Image selection cancelled');
      }

      if (result.errorCode) {
        throw new Error(`Image picker error: ${result.errorMessage}`);
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error('No image selected');
      }

      return await this.uploadPhoto(asset.uri);
    } catch (error) {
      console.error('[User Service] Pick and upload photo error:', error);
      throw error;
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethodData[]> {
    try {
      const response = await apiClient.get<{payment_methods: PaymentMethodData[]}>(
        '/users/payment-methods',
      );
      return response.data.payment_methods;
    } catch (error) {
      console.error('[User Service] Get payment methods error:', error);
      throw error;
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(paymentMethodId: string): Promise<PaymentMethodData> {
    try {
      const response = await apiClient.post<{payment_method: PaymentMethodData}>(
        '/users/payment-methods',
        {
          payment_method_id: paymentMethodId,
        },
      );
      return response.data.payment_method;
    } catch (error) {
      console.error('[User Service] Add payment method error:', error);
      throw error;
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await apiClient.put(`/users/payment-methods/${paymentMethodId}/default`);
    } catch (error) {
      console.error('[User Service] Set default payment method error:', error);
      throw error;
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await apiClient.delete(`/users/payment-methods/${paymentMethodId}`);
    } catch (error) {
      console.error('[User Service] Delete payment method error:', error);
      throw error;
    }
  }

  /**
   * Get SMS notification preferences
   */
  async getSmsPreferences(): Promise<SmsPreferences> {
    try {
      const response = await apiClient.get<{preferences: SmsPreferences}>('/users/sms-preferences');
      return response.data.preferences;
    } catch (error) {
      console.error('[User Service] Get SMS preferences error:', error);
      throw error;
    }
  }

  /**
   * Update SMS notification preferences
   */
  async updateSmsPreferences(preferences: Partial<SmsPreferences>): Promise<SmsPreferences> {
    try {
      const response = await apiClient.put<{preferences: SmsPreferences}>(
        '/users/sms-preferences',
        preferences,
      );
      return response.data.preferences;
    } catch (error) {
      console.error('[User Service] Update SMS preferences error:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    try {
      await apiClient.delete('/users/account');
    } catch (error) {
      console.error('[User Service] Delete account error:', error);
      throw error;
    }
  }

  /**
   * Request data export (GDPR)
   */
  async requestDataExport(): Promise<void> {
    try {
      await apiClient.post('/users/data-export');
    } catch (error) {
      console.error('[User Service] Request data export error:', error);
      throw error;
    }
  }

  /**
   * Verify phone number - Send SMS code
   */
  async sendPhoneVerification(phoneNumber: string): Promise<void> {
    try {
      await apiClient.post('/users/phone/verify/send', {
        phone: phoneNumber,
      });
    } catch (error) {
      console.error('[User Service] Send phone verification error:', error);
      throw error;
    }
  }

  /**
   * Verify phone number - Confirm code
   */
  async confirmPhoneVerification(phoneNumber: string, code: string): Promise<void> {
    try {
      await apiClient.post('/users/phone/verify/confirm', {
        phone: phoneNumber,
        code,
      });
    } catch (error) {
      console.error('[User Service] Confirm phone verification error:', error);
      throw error;
    }
  }

  /**
   * Update phone number
   */
  async updatePhone(phoneNumber: string): Promise<void> {
    try {
      await apiClient.put('/users/phone', {
        phone: phoneNumber,
      });
    } catch (error) {
      console.error('[User Service] Update phone error:', error);
      throw error;
    }
  }

  /**
   * Update email
   */
  async updateEmail(email: string): Promise<void> {
    try {
      await apiClient.put('/users/email', {
        email,
      });
    } catch (error) {
      console.error('[User Service] Update email error:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

const userService = new UserService();
export default userService;
