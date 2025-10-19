import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  StarIcon,
  HandThumbUpIcon,
  FlagIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon, HandThumbUpIcon as HandThumbUpSolidIcon } from '@heroicons/react/24/solid'
import { apiClient } from '../../services/api'
import toast from 'react-hot-toast'

interface Review {
  id: number
  rating: number
  title: string
  review_text: string
  client_name: string
  client_photo: string
  service_type: string
  created_at: string
  helpful_count: number
  stylist_response: string
  stylist_response_date: string
  photos: Array<{
    id: number
    photo_url: string
    photo_type: string
  }>
}

interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_5_star: number
  rating_4_star: number
  rating_3_star: number
  rating_2_star: number
  rating_1_star: number
}

interface ReviewListProps {
  stylistId: number
}

export default function ReviewList({ stylistId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('recent')
  const [helpfulVotes, setHelpfulVotes] = useState<Record<number, boolean>>({})

  useEffect(() => {
    loadReviews()
    loadStats()
  }, [stylistId, page, sortBy])

  const loadReviews = async () => {
    try {
      const response = await apiClient.get(`/reviews-public/stylist/${stylistId}`, {
        params: { page, limit: 10, sort: sortBy }
      })

      setReviews(response.data)
      setTotalPages(response.pagination.pages)
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiClient.get(`/reviews-public/stylist/${stylistId}/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleHelpful = async (reviewId: number, isHelpful: boolean) => {
    try {
      await apiClient.post(`/reviews/${reviewId}/helpful`, { is_helpful: isHelpful })
      setHelpfulVotes({ ...helpfulVotes, [reviewId]: isHelpful })
      toast.success('Thank you for your feedback!')
      loadReviews() // Refresh to get updated counts
    } catch (error) {
      toast.error('Error recording vote')
    }
  }

  const handleFlag = async (reviewId: number) => {
    const reason = prompt('Why are you flagging this review?')
    if (!reason) return

    try {
      await apiClient.post(`/reviews/${reviewId}/flag`, { reason })
      toast.success('Review flagged for moderation')
    } catch (error) {
      toast.error('Error flagging review')
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <StarSolidIcon key={star} className="h-5 w-5 text-yellow-400" />
          ) : (
            <StarIcon key={star} className="h-5 w-5 text-gray-300" />
          )
        ))}
      </div>
    )
  }

  const renderRatingBar = (count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0
    return (
      <div className="flex items-center space-x-2">
        <div className="w-full bg-gray-200 rounded-3xl h-2">
          <div
            className="bg-yellow-400 h-2 rounded-3xl transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Rating Overview */}
      {stats && stats.total_reviews > 0 && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Overall Rating */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                  <span className="text-5xl font-bold text-gray-900">
                    {stats.average_rating.toFixed(1)}
                  </span>
                  <div>
                    {renderStars(Math.round(stats.average_rating))}
                    <p className="text-sm text-gray-600 mt-1">
                      {stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 w-12">5 star</span>
                  {renderRatingBar(stats.rating_5_star, stats.total_reviews)}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 w-12">4 star</span>
                  {renderRatingBar(stats.rating_4_star, stats.total_reviews)}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 w-12">3 star</span>
                  {renderRatingBar(stats.rating_3_star, stats.total_reviews)}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 w-12">2 star</span>
                  {renderRatingBar(stats.rating_2_star, stats.total_reviews)}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 w-12">1 star</span>
                  {renderRatingBar(stats.rating_1_star, stats.total_reviews)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating_high">Highest Rating</option>
          <option value="rating_low">Lowest Rating</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <StarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No reviews yet</p>
          </div>
        ) : (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card"
            >
              <div className="card-body">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={review.client_photo || '/default-avatar.png'}
                      alt={review.client_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{review.client_name}</p>
                      {renderStars(review.rating)}
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(review.created_at).toLocaleDateString()} • {review.service_type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFlag(review.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Flag review"
                  >
                    <FlagIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Review Content */}
                {review.title && (
                  <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                )}
                {review.review_text && (
                  <p className="text-gray-700 mb-4">{review.review_text}</p>
                )}

                {/* Review Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex space-x-2 mb-4 overflow-x-auto">
                    {review.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.photo_url}
                        alt="Review photo"
                        className="h-32 w-32 object-cover rounded-full"
                      />
                    ))}
                  </div>
                )}

                {/* Stylist Response */}
                {review.stylist_response && (
                  <div className="mt-4 pl-4 border-l-4 border-primary-200 bg-primary-50 p-4 rounded-r-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <ChatBubbleLeftIcon className="h-5 w-5 text-primary-600" />
                      <p className="font-medium text-primary-900">Response from stylist</p>
                    </div>
                    <p className="text-gray-700">{review.stylist_response}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(review.stylist_response_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Helpful Actions */}
                <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleHelpful(review.id, true)}
                    className={`flex items-center space-x-2 ${
                      helpfulVotes[review.id] === true
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-primary-600'
                    }`}
                  >
                    {helpfulVotes[review.id] === true ? (
                      <HandThumbUpSolidIcon className="h-5 w-5" />
                    ) : (
                      <HandThumbUpIcon className="h-5 w-5" />
                    )}
                    <span className="text-sm">Helpful ({review.helpful_count})</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-full disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-full disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}