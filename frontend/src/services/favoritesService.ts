import { apiClient } from './api';

export interface FavoriteStylist {
  stylist_id: number;
  stylist_name: string;
  business_name: string;
  location_city: string;
  location_state: string;
  rating_average: number;
  rating_count: number;
  profile_picture: string;
  specialties: string[];
  added_at: string;
  favorite_id?: number;
  notes?: string;
}

export interface FavoritesResponse {
  success: boolean;
  data: {
    favorites: FavoriteStylist[];
  };
  message?: string;
}

class FavoritesService {
  /**
   * Get all favorites for the current user
   */
  async getFavorites(): Promise<FavoriteStylist[]> {
    try {
      const response = await apiClient.get<FavoritesResponse>('/favorites');

      if (response.success && response.data && response.data.favorites) {
        return response.data.favorites;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      throw error;
    }
  }

  /**
   * Add a stylist to favorites
   */
  async addFavorite(stylistId: number): Promise<void> {
    try {
      await apiClient.post(`/favorites/${stylistId}`);
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  }

  /**
   * Remove a stylist from favorites
   */
  async removeFavorite(stylistId: number): Promise<void> {
    try {
      await apiClient.delete(`/favorites/${stylistId}`);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status for a stylist
   */
  async toggleFavorite(stylistId: number, isFavorite: boolean): Promise<void> {
    if (isFavorite) {
      await this.removeFavorite(stylistId);
    } else {
      await this.addFavorite(stylistId);
    }
  }

  /**
   * Check if a stylist is in favorites
   */
  async isFavorite(stylistId: number): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(f => f.stylist_id === stylistId);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      return false;
    }
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;
