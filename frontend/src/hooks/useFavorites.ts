import { useState, useEffect, useCallback } from 'react';
import { favoritesService, FavoriteStylist } from '../services/favoritesService';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

/**
 * Custom hook for managing favorite stylists
 *
 * @example
 * const { favorites, isFavorite, toggleFavorite, loading } = useFavorites();
 *
 * // Check if a stylist is favorited
 * const isFav = isFavorite(stylistId);
 *
 * // Toggle favorite status
 * await toggleFavorite(stylistId);
 */
export const useFavorites = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [favorites, setFavorites] = useState<FavoriteStylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load favorites on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    } else {
      setLoading(false);
      setFavorites([]);
    }
  }, [isAuthenticated]);

  /**
   * Load all favorites from the API
   */
  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await favoritesService.getFavorites();
      setFavorites(data);
    } catch (err: any) {
      console.error('Failed to load favorites:', err);
      setError(err.message || 'Failed to load favorites');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if a stylist is in favorites
   */
  const isFavorite = useCallback(
    (stylistId: number): boolean => {
      return favorites.some(f => f.stylist_id === stylistId);
    },
    [favorites]
  );

  /**
   * Add a stylist to favorites
   */
  const addFavorite = async (stylistId: number): Promise<void> => {
    if (!isAuthenticated) {
      toast.error('Please login to add favorites');
      return;
    }

    try {
      await favoritesService.addFavorite(stylistId);
      // Optimistically update UI
      await loadFavorites(); // Reload to get full stylist data
      toast.success('Added to favorites');
    } catch (err: any) {
      console.error('Failed to add favorite:', err);
      toast.error(err.message || 'Failed to add favorite');
      throw err;
    }
  };

  /**
   * Remove a stylist from favorites
   */
  const removeFavorite = async (stylistId: number): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await favoritesService.removeFavorite(stylistId);
      // Optimistically update UI
      setFavorites(prev => prev.filter(f => f.stylist_id !== stylistId));
      toast.success('Removed from favorites');
    } catch (err: any) {
      console.error('Failed to remove favorite:', err);
      toast.error(err.message || 'Failed to remove favorite');
      throw err;
    }
  };

  /**
   * Toggle favorite status for a stylist
   */
  const toggleFavorite = async (stylistId: number): Promise<void> => {
    const currentlyFavorited = isFavorite(stylistId);

    if (currentlyFavorited) {
      await removeFavorite(stylistId);
    } else {
      await addFavorite(stylistId);
    }
  };

  /**
   * Clear all favorites (local state only, doesn't call API)
   */
  const clearFavorites = () => {
    setFavorites([]);
  };

  return {
    favorites,
    loading,
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    loadFavorites,
    clearFavorites,
    count: favorites.length,
  };
};

export default useFavorites;
