import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  StarIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  HeartIcon,
  FlagIcon,
  ThumbsUpIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'
import { apiClient } from '../../services/api'
import toast from 'react-hot-toast'

export interface Review {
  id: string
  bookingId: string
  serviceId: string
  serviceName: string
  stylistId: string
  stylistName: string
  stylistAvatar?: string
  rating: number
  title: string
  comment: string
  photos: string[]
  isAnonymous: boolean
  isRecommended: boolean
  helpfulVotes: number
  totalVotes: number
  response?: {
    content: string
    timestamp: string
    stylistName: string
  }
  createdAt: string
  updatedAt: string
  isEditable: boolean
  serviceDate: string
  serviceLocation: string
  tags: string[]
}

interface WriteReviewProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  bookingId?: string
  serviceName?: string
  stylistName?: string
}

const WriteReview: React.FC<WriteReviewProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bookingId,
  serviceName,
  stylistName
}) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [reviewData, setReviewData] = useState({
    rating: 0,
    title: '',
    comment: '',
    isAnonymous: false,
    isRecommended: true,
    tags: [] as string[]
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [hoveredRating, setHoveredRating] = useState(0)

  const availableTags = [
    'Puntual', 'Profesional', 'Amable', 'Talentoso', 'Limpio',
    'Experiencia Relajante', 'Buena Comunicación', 'Creativo',
    'Atención al Detalle', 'Recomendable', 'Ambiente Agradable',
    'Precio Justo', 'Técnica Excelente', 'Higiénico'
  ]

  const handleRatingClick = (rating: number) => {
    setReviewData({ ...reviewData, rating })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = reviewData.tags.includes(tag)
      ? reviewData.tags.filter(t => t !== tag)
      : [...reviewData.tags, tag]
    setReviewData({ ...reviewData, tags: newTags })
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (photos.length + files.length > 5) {
      toast.error('Máximo 5 fotos permitidas')
      return
    }
    setPhotos([...photos, ...files])
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (reviewData.rating === 0) {
      toast.error('Por favor selecciona una calificación')
      return
    }

    if (!reviewData.title.trim() || !reviewData.comment.trim()) {
      toast.error('Título y comentario son requeridos')
      return
    }

    setIsLoading(true)
    try {
      // Submit review to API
      const reviewResponse = await apiClient.post('/reviews', {
        booking_id: bookingId,
        rating: reviewData.rating,
        title: reviewData.title,
        review_text: reviewData.comment,
        tags: reviewData.tags,
        is_anonymous: reviewData.isAnonymous,
        is_recommended: reviewData.isRecommended
      })

      // Upload photos if any
      if (photos.length > 0 && reviewResponse.success && reviewResponse.data) {
        const formData = new FormData()
        photos.forEach(photo => {
          formData.append('photos', photo)
        })
        formData.append('photo_type', 'result')

        await apiClient.post(`/reviews/${reviewResponse.data.id}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      toast.success('Reseña publicada exitosamente')
      onSuccess()
      onClose()
      setReviewData({
        rating: 0,
        title: '',
        comment: '',
        isAnonymous: false,
        isRecommended: true,
        tags: []
      })
      setPhotos([])
    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast.error(error.message || 'Error al publicar la reseña')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-full max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Escribir Reseña
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {serviceName && stylistName && (
            <div className="mb-6 p-4 bg-gray-50 rounded-full">
              <h4 className="font-medium text-gray-900">{serviceName}</h4>
              <p className="text-sm text-gray-600">con {stylistName}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calificación General *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    {star <= (hoveredRating || reviewData.rating) ? (
                      <StarSolidIcon className="h-8 w-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {reviewData.rating > 0 && (
                    reviewData.rating === 1 ? 'Muy Malo' :
                    reviewData.rating === 2 ? 'Malo' :
                    reviewData.rating === 3 ? 'Regular' :
                    reviewData.rating === 4 ? 'Bueno' : 'Excelente'
                  )}
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de tu reseña *
              </label>
              <input
                type="text"
                value={reviewData.title}
                onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                placeholder="Resume tu experiencia en pocas palabras"
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu reseña *
              </label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="Cuéntanos sobre tu experiencia... ¿Qué te gustó? ¿Qué mejorarías?"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 50 caracteres ({reviewData.comment.length}/50)
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas (Opcional)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      reviewData.tags.includes(tag)
                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos (Opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-full p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="text-center">
                    <UserIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Agrega fotos del resultado
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG (máximo 5 fotos)
                    </p>
                  </div>
                </label>
              </div>

              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-full"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reviewData.isRecommended}
                  onChange={(e) => setReviewData({ ...reviewData, isRecommended: e.target.checked })}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  ¿Recomendarías este estilista?
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reviewData.isAnonymous}
                  onChange={(e) => setReviewData({ ...reviewData, isAnonymous: e.target.checked })}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Publicar de forma anónima
                </span>
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || reviewData.rating === 0 || reviewData.comment.length < 50}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  'Publicar Reseña'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

interface ReviewCardProps {
  review: Review
  onEdit?: (review: Review) => void
  onDelete?: (reviewId: string) => void
  onHelpful?: (reviewId: string) => void
  onReport?: (reviewId: string) => void
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onEdit,
  onDelete,
  onHelpful,
  onReport
}) => {
  const { t } = useTranslation()
  const [showFullComment, setShowFullComment] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString))
  }

  const truncatedComment = review.comment.length > 200
    ? review.comment.substring(0, 200) + '...'
    : review.comment

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {review.stylistAvatar ? (
              <img
                src={review.stylistAvatar}
                alt={review.stylistName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">{review.serviceName}</h3>
              <p className="text-sm text-gray-600">con {review.stylistName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onEdit && review.isEditable && (
              <button
                onClick={() => onEdit(review)}
                className="text-gray-400 hover:text-primary-600"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {onDelete && review.isEditable && (
              <button
                onClick={() => onDelete(review.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Rating and Date */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarSolidIcon
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {formatDate(review.serviceDate)}
            </span>
          </div>

          {review.isRecommended && (
            <div className="flex items-center space-x-1 text-green-600">
              <ThumbsUpIcon className="h-4 w-4" />
              <span className="text-xs">Recomendado</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>

        {/* Comment */}
        <p className="text-gray-700 mb-3">
          {showFullComment ? review.comment : truncatedComment}
          {review.comment.length > 200 && (
            <button
              onClick={() => setShowFullComment(!showFullComment)}
              className="ml-2 text-primary-600 hover:text-primary-700 text-sm"
            >
              {showFullComment ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </p>

        {/* Tags */}
        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {review.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Photos */}
        {review.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {review.photos.slice(0, 3).map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Review photo ${index + 1}`}
                className="w-full h-20 object-cover rounded-full"
              />
            ))}
            {review.photos.length > 3 && (
              <div className="relative">
                <img
                  src={review.photos[3]}
                  alt="More photos"
                  className="w-full h-20 object-cover rounded-full"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                  <span className="text-white text-sm font-medium">
                    +{review.photos.length - 3} más
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stylist Response */}
        {review.response && (
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
            <div className="flex items-center space-x-2 mb-1">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Respuesta de {review.response.stylistName}
              </span>
              <span className="text-xs text-blue-600">
                {formatDate(review.response.timestamp)}
              </span>
            </div>
            <p className="text-sm text-blue-800">{review.response.content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setIsLiked(!isLiked)
                onHelpful?.(review.id)
              }}
              className="flex items-center space-x-1 text-gray-600 hover:text-primary-600"
            >
              {isLiked ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
              <span className="text-sm">
                Útil ({review.helpfulVotes})
              </span>
            </button>

            <button
              onClick={() => onReport?.(review.id)}
              className="flex items-center space-x-1 text-gray-600 hover:text-red-600"
            >
              <FlagIcon className="h-4 w-4" />
              <span className="text-sm">Reportar</span>
            </button>
          </div>

          <div className="text-xs text-gray-500">
            {review.isAnonymous ? 'Anónimo' : 'Cliente verificado'}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function ReviewSystem() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'written'>('all')
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)

  // Mock data for pending reviews (bookings that can be reviewed)
  const [pendingReviews, setPendingReviews] = useState([
    {
      id: 'booking-1',
      serviceName: 'Corte y Peinado',
      stylistName: 'María González',
      serviceDate: '2024-12-20',
      canReview: true
    },
    {
      id: 'booking-2',
      serviceName: 'Manicure Francesa',
      stylistName: 'Ana Rodríguez',
      serviceDate: '2024-12-18',
      canReview: true
    }
  ])

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      // Load real reviews from API
      const response = await apiClient.get('/reviews/my-reviews')

      if (response.success && response.data) {
        setReviews(response.data)
      } else {
        setReviews([])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('Error al cargar las reseñas')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  // Backup loadReviews_OLD with mock data (commented out)
  const loadReviews_OLD = async () => {
    try {
      setLoading(true)
      // Mock data for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockReviews: Review[] = [
        {
          id: 'review-1',
          bookingId: 'booking-3',
          serviceId: 'service-1',
          serviceName: 'Limpieza Facial',
          stylistId: 'stylist-1',
          stylistName: 'Carmen López',
          rating: 5,
          title: 'Experiencia increíble, súper recomendada',
          comment: 'Carmen es una profesional excepcional. La limpieza facial fue perfecta, mi piel se ve radiante. El ambiente del salón es muy relajante y Carmen fue muy atenta en todo momento. Definitivamente regresaré y la recomiendo al 100%.',
          photos: [],
          isAnonymous: false,
          isRecommended: true,
          helpfulVotes: 12,
          totalVotes: 15,
          createdAt: '2024-12-15T10:30:00Z',
          updatedAt: '2024-12-15T10:30:00Z',
          isEditable: true,
          serviceDate: '2024-12-15',
          serviceLocation: 'Salón Belleza Total',
          tags: ['Profesional', 'Amable', 'Recomendable', 'Ambiente Agradable'],
          response: {
            content: '¡Muchas gracias por tu reseña! Me da mucha alegría saber que te gustó el tratamiento. Te espero pronto para tu siguiente cita 😊',
            timestamp: '2024-12-15T14:20:00Z',
            stylistName: 'Carmen López'
          }
        },
        {
          id: 'review-2',
          bookingId: 'booking-4',
          serviceId: 'service-2',
          serviceName: 'Masaje Relajante',
          stylistId: 'stylist-2',
          stylistName: 'Isabella Martínez',
          rating: 4,
          title: 'Muy buena experiencia, regresaré',
          comment: 'El masaje estuvo muy bien, Isabella tiene muy buena técnica. El único punto a mejorar sería la temperatura del cuarto que estaba un poco fría.',
          photos: [],
          isAnonymous: false,
          isRecommended: true,
          helpfulVotes: 8,
          totalVotes: 10,
          createdAt: '2024-12-10T16:45:00Z',
          updatedAt: '2024-12-10T16:45:00Z',
          isEditable: false,
          serviceDate: '2024-12-10',
          serviceLocation: 'Spa Serenity',
          tags: ['Profesional', 'Técnica Excelente', 'Recomendable']
        }
      ]

      setReviews(mockReviews)
    } catch (error) {
      toast.error('Error al cargar las reseñas')
    } finally {
      setLoading(false)
    }
  }

  const handleWriteReview = (booking?: any) => {
    setSelectedBooking(booking)
    setShowWriteModal(true)
  }

  const handleEditReview = (review: Review) => {
    // In a real app, this would open the edit modal with pre-filled data
    toast(t('features.editInDevelopment'))
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(t('features.confirmDeleteReview'))) {
      return
    }

    try {
      // API call to delete review
      setReviews(reviews => reviews.filter(review => review.id !== reviewId))
      toast.success(t('features.reviewDeleted'))
    } catch (error) {
      toast.error(t('features.errorDeletingReview'))
    }
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      // API call to mark as helpful
      setReviews(reviews =>
        reviews.map(review =>
          review.id === reviewId
            ? { ...review, helpfulVotes: review.helpfulVotes + 1 }
            : review
        )
      )
    } catch (error) {
      toast.error(t('features.errorProcessingAction'))
    }
  }

  const handleReport = async (reviewId: string) => {
    toast(t('features.reportInDevelopment'))
  }

  const getFilteredContent = () => {
    switch (filter) {
      case 'pending':
        return pendingReviews
      case 'written':
        return reviews
      default:
        return [...pendingReviews, ...reviews]
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-responsive py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Mis Reseñas
          </h1>
          <p className="text-gray-600">
            Comparte tu experiencia y ayuda a otros clientes
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'pending', label: 'Pendientes' },
              { key: 'written', label: 'Escritas' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {filter === 'all' || filter === 'pending' ? (
            <>
              {/* Pending Reviews */}
              {pendingReviews.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Servicios Pendientes de Reseña
                  </h2>
                  <div className="space-y-4">
                    {pendingReviews.map((booking) => (
                      <div key={booking.id} className="card">
                        <div className="card-body">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{booking.serviceName}</h3>
                              <p className="text-sm text-gray-600">
                                con {booking.stylistName} • {new Intl.DateTimeFormat('es-MX').format(new Date(booking.serviceDate))}
                              </p>
                            </div>
                            <button
                              onClick={() => handleWriteReview(booking)}
                              className="btn btn-primary btn-sm flex items-center space-x-1 rounded-full"
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span>Escribir Reseña</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {filter === 'all' || filter === 'written' ? (
            <>
              {/* Written Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Mis Reseñas Publicadas
                  </h2>
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        onEdit={handleEditReview}
                        onDelete={handleDeleteReview}
                        onHelpful={handleHelpful}
                        onReport={handleReport}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Empty State */}
          {getFilteredContent().length === 0 && (
            <div className="card">
              <div className="card-body text-center py-12">
                <StarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'pending' ? 'No hay servicios pendientes de reseña' :
                   filter === 'written' ? 'No has escrito reseñas todavía' :
                   'No tienes reseñas'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'pending' ? 'Completa algunos servicios para poder escribir reseñas' :
                   'Comparte tu experiencia con otros clientes escribiendo reseñas'}
                </p>
                {filter !== 'pending' && pendingReviews.length > 0 && (
                  <button
                    onClick={() => handleWriteReview(pendingReviews[0])}
                    className="btn btn-primary rounded-full"
                  >
                    Escribir Primera Reseña
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {reviews.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="text-2xl font-bold text-primary-600">
                  {reviews.length}
                </h3>
                <p className="text-sm text-gray-600">Reseñas Escritas</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <h3 className="text-2xl font-bold text-primary-600">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </h3>
                <p className="text-sm text-gray-600">Calificación Promedio</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <h3 className="text-2xl font-bold text-primary-600">
                  {reviews.reduce((sum, r) => sum + r.helpfulVotes, 0)}
                </h3>
                <p className="text-sm text-gray-600">Votos Útiles</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      <AnimatePresence>
        {showWriteModal && (
          <WriteReview
            isOpen={showWriteModal}
            onClose={() => setShowWriteModal(false)}
            onSuccess={loadReviews}
            bookingId={selectedBooking?.id}
            serviceName={selectedBooking?.serviceName}
            stylistName={selectedBooking?.stylistName}
          />
        )}
      </AnimatePresence>
    </div>
  )
}