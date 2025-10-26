import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  HeartIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { apiClient } from '../../services/api'
import toast from 'react-hot-toast'

interface PortfolioItem {
  id: number
  before_photo_url: string
  after_photo_url: string
  title: string
  description: string
  service_category: string
  is_featured: boolean
  is_visible: boolean
  view_count: number
  like_count: number
  tags: string[]
  created_at: string
}

export default function PortfolioManager() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)

  useEffect(() => {
    loadPortfolio()
  }, [])

  const loadPortfolio = async () => {
    try {
      const response = await apiClient.get('/portfolio/my-portfolio')
      if (response.success) {
        setItems(response.data)
      }
    } catch (error) {
      console.error('Error loading portfolio:', error)
      toast.error('Error al cargar portafolio')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este elemento del portafolio?')) {
      return
    }

    try {
      await apiClient.delete(`/portfolio/${id}`)
      toast.success('Elemento eliminado')
      loadPortfolio()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const toggleVisibility = async (item: PortfolioItem) => {
    try {
      await apiClient.put(`/portfolio/${item.id}`, {
        is_visible: !item.is_visible
      })
      toast.success(item.is_visible ? 'Ocultado' : 'Visible ahora')
      loadPortfolio()
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  const toggleFeatured = async (item: PortfolioItem) => {
    try {
      await apiClient.put(`/portfolio/${item.id}`, {
        is_featured: !item.is_featured
      })
      toast.success(item.is_featured ? 'Ya no destacado' : 'Ahora destacado')
      loadPortfolio()
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Portafolio</h2>
          <p className="text-gray-600 mt-1">
            Muestra tu trabajo con fotos antes y después
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary flex items-center space-x-2 rounded-full"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Agregar Fotos</span>
        </button>
      </div>

      {/* Portfolio Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-full">
          <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay elementos en tu portafolio
          </h3>
          <p className="text-gray-600 mb-6">
            Comienza subiendo fotos antes y después de tu trabajo
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary rounded-full"
          >
            Subir Primeras Fotos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                {/* Featured Badge */}
                {item.is_featured && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <StarSolidIcon className="w-3 h-3 mr-1" />
                      Destacado
                    </span>
                  </div>
                )}

                {/* Visibility Badge */}
                {!item.is_visible && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Oculto
                    </span>
                  </div>
                )}

                {/* Before/After Images */}
                <div className="grid grid-cols-2 gap-1">
                  <div className="relative aspect-square">
                    <img loading="lazy"
                      src={item.before_photo_url}
                      alt="Antes"
                      className="w-full h-full object-cover rounded-tl-lg"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 text-center">
                      Antes
                    </div>
                  </div>
                  <div className="relative aspect-square">
                    <img loading="lazy"
                      src={item.after_photo_url}
                      alt="Después"
                      className="w-full h-full object-cover rounded-tr-lg"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 text-center">
                      Después
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {/* Title and Description */}
                  {item.title && (
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        {item.view_count}
                      </span>
                      <span className="flex items-center">
                        <HeartIcon className="w-4 h-4 mr-1" />
                        {item.like_count}
                      </span>
                    </div>
                    {item.service_category && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {item.service_category}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleFeatured(item)}
                      className={`flex-1 btn btn-sm ${
                        item.is_featured
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                      }`}
                      title="Destacar"
                    >
                      <StarSolidIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleVisibility(item)}
                      className="flex-1 btn btn-sm btn-outline-primary rounded-full"
                      title={item.is_visible ? 'Ocultar' : 'Mostrar'}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingItem(item)}
                      className="flex-1 btn btn-sm btn-outline-primary rounded-full"
                      title="Editar"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 btn btn-sm btn-outline-danger rounded-full"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false)
              loadPortfolio()
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <EditModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSuccess={() => {
              setEditingItem(null)
              loadPortfolio()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Upload Modal Component
function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null)
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null)
  const [beforePreview, setBeforePreview] = useState<string>('')
  const [afterPreview, setAfterPreview] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (file: File, type: 'before' | 'after') => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar 10MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'before') {
        setBeforePhoto(file)
        setBeforePreview(reader.result as string)
      } else {
        setAfterPhoto(file)
        setAfterPreview(reader.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!beforePhoto || !afterPhoto) {
      toast.error('Se requieren ambas fotos (antes y después)')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('before_photo', beforePhoto)
      formData.append('after_photo', afterPhoto)
      if (title) formData.append('title', title)
      if (description) formData.append('description', description)
      if (category) formData.append('service_category', category)
      if (tags) formData.append('tags', tags)

      await apiClient.uploadFile('/portfolio', formData)

      toast.success('Portafolio actualizado exitosamente')
      onSuccess()
    } catch (error: any) {
      console.error('Error uploading portfolio:', error)
      toast.error(error.message || 'Error al subir fotos')
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Subir Fotos Antes/Después
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="grid grid-cols-2 gap-4">
              {/* Before Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto Antes *
                </label>
                {beforePreview ? (
                  <div className="relative aspect-square">
                    <img loading="lazy"
                      src={beforePreview}
                      alt="Antes"
                      className="w-full h-full object-cover rounded-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBeforePhoto(null)
                        setBeforePreview('')
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-primary-500">
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                    <span className="text-sm text-gray-500 mt-2">
                      Subir Foto
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileSelect(e.target.files[0], 'before')
                      }
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* After Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto Después *
                </label>
                {afterPreview ? (
                  <div className="relative aspect-square">
                    <img loading="lazy"
                      src={afterPreview}
                      alt="Después"
                      className="w-full h-full object-cover rounded-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAfterPhoto(null)
                        setAfterPreview('')
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-primary-500">
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                    <span className="text-sm text-gray-500 mt-2">
                      Subir Foto
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileSelect(e.target.files[0], 'after')
                      }
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título (opcional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Transformación de color completa"
                className="input"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el trabajo realizado..."
                rows={3}
                className="input"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                <option value="">Seleccionar...</option>
                <option value="hair">Cabello</option>
                <option value="nails">Uñas</option>
                <option value="makeup">Maquillaje</option>
                <option value="skincare">Cuidado de la piel</option>
                <option value="other">Otro</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas (separadas por comas)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="color, highlights, balayage"
                className="input"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-outline-primary rounded-full"
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 btn btn-primary rounded-full"
                disabled={uploading || !beforePhoto || !afterPhoto}
              >
                {uploading ? 'Subiendo...' : 'Subir Fotos'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Edit Modal Component (simplified version)
function EditModal({
  item,
  onClose,
  onSuccess
}: {
  item: PortfolioItem
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState(item.title || '')
  const [description, setDescription] = useState(item.description || '')
  const [category, setCategory] = useState(item.service_category || '')
  const [tags, setTags] = useState(item.tags?.join(', ') || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await apiClient.put(`/portfolio/${item.id}`, {
        title,
        description,
        service_category: category,
        tags
      })

      toast.success('Actualizado exitosamente')
      onSuccess()
    } catch (error) {
      toast.error('Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Editar Elemento</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                <option value="">Seleccionar...</option>
                <option value="hair">Cabello</option>
                <option value="nails">Uñas</option>
                <option value="makeup">Maquillaje</option>
                <option value="skincare">Cuidado de la piel</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="input"
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-outline-primary rounded-full"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 btn btn-primary rounded-full"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}