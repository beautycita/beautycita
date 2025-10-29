/**
 * BeautyCita Mobile App - Service Management Service
 *
 * Handles beauty service management operations (for stylists):
 * - Get services
 * - Create service
 * - Update service
 * - Delete service
 * - Toggle service availability
 */

import apiClient from './apiClient';
import {Service, CreateServiceData, ServiceCategory} from '../types';

// ============================================================================
// Service Management Service
// ============================================================================

class ServiceService {
  /**
   * Get all services for current stylist
   */
  async getMyServices(): Promise<Service[]> {
    try {
      const response = await apiClient.get<{services: Service[]}>('/services/my');
      return response.data.services;
    } catch (error) {
      console.error('[Service Service] Get my services error:', error);
      throw error;
    }
  }

  /**
   * Get services for a specific stylist
   */
  async getStylistServices(stylistId: number): Promise<Service[]> {
    try {
      const response = await apiClient.get<{services: Service[]}>(`/services/stylist/${stylistId}`);
      return response.data.services;
    } catch (error) {
      console.error('[Service Service] Get stylist services error:', error);
      throw error;
    }
  }

  /**
   * Get service details
   */
  async getServiceDetail(serviceId: number): Promise<Service> {
    try {
      const response = await apiClient.get<{service: Service}>(`/services/${serviceId}`);
      return response.data.service;
    } catch (error) {
      console.error('[Service Service] Get service detail error:', error);
      throw error;
    }
  }

  /**
   * Create a new service
   */
  async createService(data: CreateServiceData): Promise<Service> {
    try {
      const response = await apiClient.post<{service: Service}>('/services', data);
      return response.data.service;
    } catch (error) {
      console.error('[Service Service] Create service error:', error);
      throw error;
    }
  }

  /**
   * Update existing service
   */
  async updateService(serviceId: number, data: Partial<CreateServiceData>): Promise<Service> {
    try {
      const response = await apiClient.put<{service: Service}>(`/services/${serviceId}`, data);
      return response.data.service;
    } catch (error) {
      console.error('[Service Service] Update service error:', error);
      throw error;
    }
  }

  /**
   * Delete service
   */
  async deleteService(serviceId: number): Promise<void> {
    try {
      await apiClient.delete(`/services/${serviceId}`);
    } catch (error) {
      console.error('[Service Service] Delete service error:', error);
      throw error;
    }
  }

  /**
   * Toggle service active status
   */
  async toggleServiceStatus(serviceId: number, isActive: boolean): Promise<Service> {
    try {
      const response = await apiClient.put<{service: Service}>(`/services/${serviceId}/status`, {
        is_active: isActive,
      });
      return response.data.service;
    } catch (error) {
      console.error('[Service Service] Toggle service status error:', error);
      throw error;
    }
  }

  /**
   * Activate service
   */
  async activateService(serviceId: number): Promise<Service> {
    try {
      return await this.toggleServiceStatus(serviceId, true);
    } catch (error) {
      console.error('[Service Service] Activate service error:', error);
      throw error;
    }
  }

  /**
   * Deactivate service
   */
  async deactivateService(serviceId: number): Promise<Service> {
    try {
      return await this.toggleServiceStatus(serviceId, false);
    } catch (error) {
      console.error('[Service Service] Deactivate service error:', error);
      throw error;
    }
  }

  /**
   * Reorder services (for display order)
   */
  async reorderServices(serviceIds: number[]): Promise<void> {
    try {
      await apiClient.put('/services/reorder', {
        service_ids: serviceIds,
      });
    } catch (error) {
      console.error('[Service Service] Reorder services error:', error);
      throw error;
    }
  }

  /**
   * Search services by category
   */
  async searchByCategory(category: ServiceCategory, latitude?: number, longitude?: number): Promise<Service[]> {
    try {
      const params: any = {category};
      if (latitude && longitude) {
        params.latitude = latitude;
        params.longitude = longitude;
      }

      const response = await apiClient.get<{services: Service[]}>('/services/search', {params});
      return response.data.services;
    } catch (error) {
      console.error('[Service Service] Search by category error:', error);
      throw error;
    }
  }

  /**
   * Get popular services in area
   */
  async getPopularServices(latitude: number, longitude: number, radius: number = 25): Promise<Service[]> {
    try {
      const response = await apiClient.get<{services: Service[]}>('/services/popular', {
        params: {latitude, longitude, radius},
      });
      return response.data.services;
    } catch (error) {
      console.error('[Service Service] Get popular services error:', error);
      throw error;
    }
  }

  /**
   * Get service categories
   */
  async getCategories(): Promise<ServiceCategory[]> {
    try {
      const response = await apiClient.get<{categories: ServiceCategory[]}>('/services/categories');
      return response.data.categories;
    } catch (error) {
      console.error('[Service Service] Get categories error:', error);
      throw error;
    }
  }

  /**
   * Duplicate service
   */
  async duplicateService(serviceId: number): Promise<Service> {
    try {
      const response = await apiClient.post<{service: Service}>(`/services/${serviceId}/duplicate`);
      return response.data.service;
    } catch (error) {
      console.error('[Service Service] Duplicate service error:', error);
      throw error;
    }
  }

  /**
   * Get service statistics
   */
  async getServiceStats(serviceId: number): Promise<{
    total_bookings: number;
    total_revenue: number;
    average_rating: number;
    review_count: number;
  }> {
    try {
      const response = await apiClient.get(`/services/${serviceId}/stats`);
      return response.data;
    } catch (error) {
      console.error('[Service Service] Get service stats error:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

const serviceService = new ServiceService();
export default serviceService;
