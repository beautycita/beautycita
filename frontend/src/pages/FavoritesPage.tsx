import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { apiClient } from "../services/api"
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

interface FavoriteStylist {
  stylist_id: number
  stylist_name: string
  business_name: string
  location_city: string
  location_state: string
  rating_average: number
  rating_count: number
  profile_picture: string
  specialties: string[]
  added_at: string
}

export default function FavoritesPage() {
  const { user } = useAuthStore()
  const [favorites, setFavorites] = useState<FavoriteStylist[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setError(null)
      const response = await apiClient.get<FavoriteStylist[]>('/client/favorites')

      if (response.success && response.data) {
        setFavorites(response.data)
      } else {
        setFavorites([])
      }
    } catch (error: any) {
      console.error('Failed to fetch favorites:', error)
      setError(error.message || 'Failed to load favorites')
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (stylistId: number) => {
    try {
      await apiClient.delete(`/client/favorites/${stylistId}`)
      setFavorites(favorites.filter(f => f.stylist_id !== stylistId))
      toast.success('Removed from favorites')
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      toast.error('Failed to remove favorite')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <HeartIcon className="h-8 w-8 text-pink-500" />
            My Favorite Stylists
          </h1>
          <p className="mt-2 text-gray-600">
            {favorites.length === 0
              ? 'You haven\'t added any favorites yet'
              : `${favorites.length} favorite${favorites.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Favorites List */}
        {favorites.length === 0 ? (
          <div className="bg-white rounded-full shadow-sm p-12 text-center">
            <HeartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">
              Start adding stylists to your favorites to easily book them again
            </p>
            <Link
              to="/stylists"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Find Stylists
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <motion.div
                key={favorite.stylist_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-full shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link to={`/stylist/${favorite.stylist_id}`} className="block">
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-pink-100 to-purple-100">
                    {favorite.profile_picture ? (
                      <img
                        src={favorite.profile_picture}
                        alt={favorite.business_name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center">
                        <HeartIcon className="h-16 w-16 text-pink-300" />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <Link
                        to={`/stylist/${favorite.stylist_id}`}
                        className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                      >
                        {favorite.business_name || favorite.stylist_name}
                      </Link>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {favorite.location_city}, {favorite.location_state}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFavorite(favorite.stylist_id)}
                      className="p-2 text-pink-500 hover:bg-pink-50 rounded-full transition-colors"
                      title="Remove from favorites"
                    >
                      <HeartSolidIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {favorite.rating_average > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="ml-1 font-medium text-gray-900">
                          {favorite.rating_average.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({favorite.rating_count} reviews)
                      </span>
                    </div>
                  )}

                  {favorite.specialties && favorite.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {favorite.specialties.slice(0, 3).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800"
                        >
                          {specialty}
                        </span>
                      ))}
                      {favorite.specialties.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{favorite.specialties.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <Link
                    to={`/book/${favorite.stylist_id}`}
                    className="block w-full text-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 transition-all"
                  >
                    Book Now
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
