import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  EyeIcon,
  HeartIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

interface PortfolioItem {
  id: number
  before_photo_url: string
  after_photo_url: string
  title: string
  description: string
  service_category: string
  is_featured: boolean
  view_count: number
  like_count: number
  tags: string[]
  created_at: string
}

interface PortfolioGalleryProps {
  stylistId: number
}

export default function PortfolioGallery({ stylistId }: PortfolioGalleryProps) {
  const { isAuthenticated } = useAuthStore()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadPortfolio()
  }, [stylistId, filter])

  const loadPortfolio = async () => {
    try {
      const params: any = { page: 1, limit: 50 }
      if (filter !== 'all') {
        params.category = filter
      }

      const response = await axios.get(`/api/portfolio/stylist/${stylistId}`, { params })
      if (response.data.success) {
        setItems(response.data.data)
      }
    } catch (error) {
      console.error('Error loading portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (itemId: number) => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para dar me gusta')
      return
    }

    try {
      const response = await axios.post(`/api/portfolio/${itemId}/like`)
      if (response.data.success) {
        if (response.data.liked) {
          setLikedItems(new Set(likedItems).add(itemId))
        } else {
          const newLiked = new Set(likedItems)
          newLiked.delete(itemId)
          setLikedItems(newLiked)
        }
        loadPortfolio()
      }
    } catch (error) {
      toast.error('Error al dar me gusta')
    }
  }

  const handleView = async (item: PortfolioItem) => {
    setSelectedItem(item)
    try {
      await axios.post(`/api/portfolio/${item.id}/view`)
    } catch (error) {
      console.error('Error recording view:', error)
    }
  }

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'hair', label: 'Cabello' },
    { value: 'nails', label: 'Uñas' },
    { value: 'makeup', label: 'Maquillaje' },
    { value: 'skincare', label: 'Cuidado de la piel' },
    { value: 'other', label: 'Otro' }
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay elementos en el portafolio aún</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === cat.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className="cursor-pointer group"
            onClick={() => handleView(item)}
          >
            <div className="relative aspect-square rounded-full overflow-hidden">
              {/* Before/After Split */}
              <div className="grid grid-cols-2 h-full">
                <div className="relative">
                  <img
                    src={item.before_photo_url}
                    alt="Antes"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 text-center">
                    Antes
                  </div>
                </div>
                <div className="relative">
                  <img
                    src={item.after_photo_url}
                    alt="Después"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 text-center">
                    Después
                  </div>
                </div>
              </div>

              {/* Overlay with stats */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300">
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="flex items-center text-sm">
                    <EyeIcon className="w-4 h-4 mr-1" />
                    {item.view_count}
                  </span>
                  <span className="flex items-center text-sm">
                    <HeartIcon className="w-4 h-4 mr-1" />
                    {item.like_count}
                  </span>
                </div>
              </div>
            </div>

            {/* Title */}
            {item.title && (
              <p className="mt-2 text-sm font-medium text-gray-900 line-clamp-1">
                {item.title}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <LightboxModal
          item={selectedItem}
          items={items}
          onClose={() => setSelectedItem(null)}
          onNavigate={setSelectedItem}
          onLike={handleLike}
          isLiked={likedItems.has(selectedItem.id)}
        />
      )}
    </div>
  )
}

// Lightbox Modal Component
function LightboxModal({
  item,
  items,
  onClose,
  onNavigate,
  onLike,
  isLiked
}: {
  item: PortfolioItem
  items: PortfolioItem[]
  onClose: () => void
  onNavigate: (item: PortfolioItem) => void
  onLike: (itemId: number) => void
  isLiked: boolean
}) {
  const currentIndex = items.findIndex((i) => i.id === item.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < items.length - 1

  const handlePrev = () => {
    if (hasPrev) {
      onNavigate(items[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onNavigate(items[currentIndex + 1])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasPrev) handlePrev()
    if (e.key === 'ArrowRight' && hasNext) handleNext()
    if (e.key === 'Escape') onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-3xl z-10"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>

      {/* Navigation Buttons */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handlePrev()
          }}
          className="absolute left-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-3xl"
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          className="absolute right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-3xl"
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>
      )}

      {/* Content */}
      <div
        className="max-w-6xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-white text-sm mb-2 text-center">Antes</div>
            <img
              src={item.before_photo_url}
              alt="Antes"
              className="w-full rounded-full"
            />
          </div>
          <div>
            <div className="text-white text-sm mb-2 text-center">Después</div>
            <img
              src={item.after_photo_url}
              alt="Después"
              className="w-full rounded-full"
            />
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-3xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {item.title && (
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
              )}
              {item.description && (
                <p className="text-gray-700">{item.description}</p>
              )}
            </div>
            <button
              onClick={() => onLike(item.id)}
              className="p-2 hover:bg-gray-100 rounded-3xl ml-4"
            >
              {isLiked ? (
                <HeartSolidIcon className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-gray-400" />
              )}
            </button>
          </div>

          {/* Stats and Tags */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <EyeIcon className="w-4 h-4 mr-1" />
                {item.view_count} vistas
              </span>
              <span className="flex items-center">
                <HeartIcon className="w-4 h-4 mr-1" />
                {item.like_count} me gusta
              </span>
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}