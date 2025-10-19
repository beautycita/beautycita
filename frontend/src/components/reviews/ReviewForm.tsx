import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  StarIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { apiClient } from '../../services/api'

interface ReviewFormProps {
  bookingId: number
  stylistName: string
  serviceType: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ReviewForm({
  bookingId,
  stylistName,
  serviceType,
  onSuccess,
  onCancel
}: ReviewFormProps) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [qualityRating, setQualityRating] = useState(0)
  const [professionalismRating, setProfessionalismRating] = useState(0)
  const [cleanlinessRating, setCleanlinessRating] = useState(0)
  const [valueRating, setValueRating] = useState(0)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const totalPhotos = photos.length + newFiles.length

      if (totalPhotos > 5) {
        toast.error('Maximum 5 photos allowed')
        return
      }

      setPhotos([...photos, ...newFiles])

      // Create preview URLs
      newFiles.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotoPreviewUrls(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)

    try {
      // Create review
      const reviewResponse = await apiClient.post('/reviews', {
        booking_id: bookingId,
        rating,
        title,
        review_text: comment, // Fixed: backend expects review_text, not comment
        quality_rating: qualityRating || null,
        professionalism_rating: professionalismRating || null,
        cleanliness_rating: cleanlinessRating || null,
        value_rating: valueRating || null
      })

      const reviewId = reviewResponse.data.data.id

      // Upload photos if any
      if (photos.length > 0) {
        const formData = new FormData()
        photos.forEach(photo => {
          formData.append('photos', photo)
        })
        formData.append('photo_type', 'result')

        // Use apiClient for authenticated photo upload
        await apiClient.post(`/reviews/${reviewId}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      toast.success('Review submitted successfully!')
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast.error(error.message || 'Error submitting review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (
    currentRating: number,
    onRate: (rating: number) => void,
    label: string,
    hoverState?: number,
    onHover?: (rating: number) => void
  ) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRate(star)}
              onMouseEnter={() => onHover && onHover(star)}
              onMouseLeave={() => onHover && onHover(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              {star <= (hoverState || currentRating) ? (
                <StarSolidIcon className="h-8 w-8 text-yellow-400" />
              ) : (
                <StarIcon className="h-8 w-8 text-gray-300" />
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="card-body">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Write a Review
        </h2>

        <div className="mb-6 p-4 bg-gray-50 rounded-3xl">
          <p className="text-sm text-gray-600">Reviewing:</p>
          <p className="font-medium text-gray-900">{stylistName}</p>
          <p className="text-sm text-gray-600">{serviceType}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          {renderStars(rating, setRating, 'Overall Rating *', hoverRating, setHoverRating)}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your experience in a few words"
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500"
              maxLength={200}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Experience
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your experience..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderStars(qualityRating, setQualityRating, 'Quality')}
            {renderStars(professionalismRating, setProfessionalismRating, 'Professionalism')}
            {renderStars(cleanlinessRating, setCleanlinessRating, 'Cleanliness')}
            {renderStars(valueRating, setValueRating, 'Value')}
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Optional - Max 5)
            </label>
            <div className="flex items-start space-x-4">
              {photos.length < 5 && (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-primary-500 transition-colors">
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-2">Add Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}

              {photoPreviewUrls.map((url, index) => (
                <div key={index} className="relative w-32 h-32">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-full"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-3xl hover:bg-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG, or WebP. Max 5MB per photo.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-3xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Submitting...
                </span>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}