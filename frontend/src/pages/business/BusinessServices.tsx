import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface Service {
  id: number
  name: string
  description: string
  duration_minutes: number
  price: number
  category: string
  is_active: boolean
}

export default function BusinessServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    category: '',
    is_active: true
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')

      const response = await axios.get(`${API_URL}/api/services/my-services`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setServices(response.data.services || [])
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        price: service.price,
        category: service.category,
        is_active: service.is_active
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        duration_minutes: 60,
        price: 0,
        category: '',
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingService(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || formData.price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const token = localStorage.getItem('authToken')

      if (editingService) {
        // Update existing service
        const response = await axios.put(
          `${API_URL}/api/services/${editingService.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (response.data.success) {
          toast.success('Service updated successfully')
          fetchServices()
          handleCloseModal()
        }
      } else {
        // Create new service
        const response = await axios.post(
          `${API_URL}/api/services`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (response.data.success) {
          toast.success('Service created successfully')
          fetchServices()
          handleCloseModal()
        }
      }
    } catch (error: any) {
      console.error('Failed to save service:', error)
      toast.error(error.response?.data?.message || 'Failed to save service')
    }
  }

  const handleDelete = async (serviceId: number) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.delete(`${API_URL}/api/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        toast.success('Service deleted successfully')
        fetchServices()
      }
    } catch (error: any) {
      console.error('Failed to delete service:', error)
      toast.error(error.response?.data?.message || 'Failed to delete service')
    }
  }

  const toggleServiceStatus = async (serviceId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.put(
        `${API_URL}/api/services/${serviceId}/status`,
        { is_active: !isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        toast.success(`Service ${!isActive ? 'activated' : 'deactivated'}`)
        fetchServices()
      }
    } catch (error: any) {
      console.error('Failed to toggle service status:', error)
      toast.error(error.response?.data?.message || 'Failed to update service')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Services</h1>
          <p className="text-gray-600">Manage your service offerings</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all"
        >
          <PlusIcon className="h-5 w-5" />
          Add Service
        </button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
          <p className="text-gray-500 mb-4">No services yet</p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Add Your First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => handleOpenModal(service)}
              onDelete={() => handleDelete(service.id)}
              onToggleStatus={() => toggleServiceStatus(service.id, service.is_active)}
            />
          ))}
        </div>
      )}

      {/* Service Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    placeholder="e.g., Haircut & Style"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe your service..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Hair, Nails, Makeup"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-5 w-5 text-purple-600 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active (visible to clients)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CheckIcon className="h-5 w-5" />
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Service Card Component
interface ServiceCardProps {
  service: Service
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
}

function ServiceCard({ service, onEdit, onDelete, onToggleStatus }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-3xl shadow-lg p-6 ${!service.is_active ? 'opacity-60' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
          {service.category && (
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
              {service.category}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {service.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-gray-600">
            <ClockIcon className="h-4 w-4" />
            {service.duration_minutes} min
          </span>
          <span className="flex items-center gap-1 font-bold text-gray-900">
            <CurrencyDollarIcon className="h-5 w-5" />
            ${service.price.toFixed(2)}
          </span>
        </div>

        <button
          onClick={onToggleStatus}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            service.is_active
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {service.is_active ? 'Active' : 'Inactive'}
        </button>
      </div>
    </motion.div>
  )
}
