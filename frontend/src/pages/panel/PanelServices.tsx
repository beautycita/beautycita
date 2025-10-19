import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  PlusCircleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface Service {
  id: number
  name: string
  description: string
  category: string
  custom_category_name?: string
  custom_category_status?: 'pending' | 'approved' | 'rejected'
  duration_minutes: number
  price: number
  price_type: string
  is_active: boolean
  stylist_id: number
  stylist_name?: string
}

export default function PanelServices() {
  const { token } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: 'Hair',
    custom_category_name: '',
    duration_minutes: 60,
    price: 0,
    price_type: 'fixed'
  })

  useEffect(() => {
    fetchServices()
  }, [searchTerm, categoryFilter])

  const fetchServices = async () => {
    try {
      setLoading(true)

      const response = await axios.get(`${API_URL}/api/services/my-services`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      let servicesList = response.data.data || response.data.services || []

      // Apply client-side filtering
      if (searchTerm) {
        servicesList = servicesList.filter((s: Service) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (categoryFilter !== 'ALL') {
        servicesList = servicesList.filter((s: Service) => s.category === categoryFilter)
      }

      setServices(servicesList)
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Prepare service data
      const serviceData = {
        ...newService,
        // Only include custom_category_name if category is "Other"
        custom_category_name: newService.category === 'Other' ? newService.custom_category_name : null
      }

      await axios.post(
        `${API_URL}/api/services`,
        serviceData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setShowCreateModal(false)
      setNewService({ name: '', description: '', category: 'Hair', custom_category_name: '', duration_minutes: 60, price: 0, price_type: 'fixed' })
      fetchServices()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create service')
    }
  }

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm('Delete this service?')) return
    try {
      await axios.delete(`${API_URL}/api/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchServices()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete service')
    }
  }

  const handleEditClick = (service: Service) => {
    setEditingService(service)
    setShowEditModal(true)
  }

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService) return

    try {
      await axios.put(
        `${API_URL}/api/services/${editingService.id}`,
        {
          name: editingService.name,
          description: editingService.description,
          category: editingService.category,
          custom_category_name: editingService.category === 'Other' ? editingService.custom_category_name : null,
          duration_minutes: editingService.duration_minutes,
          price: editingService.price,
          price_type: editingService.price_type,
          is_active: editingService.is_active
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setShowEditModal(false)
      setEditingService(null)
      fetchServices()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update service')
    }
  }

  const categories = ['Hair', 'Nails', 'Makeup', 'Skincare', 'Massage', 'Waxing', 'Other']

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/panel" className="p-2 hover:bg-white/50 rounded-full transition-colors">
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  My Services
                </h1>
                <p className="mt-2 text-gray-600">Manage your services and pricing</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Create Service
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="flex items-center text-gray-600">
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                {services.length} services
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center text-gray-500">
              Loading services...
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center text-gray-500">
              No services found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{service.name}</h3>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {service.category === 'Other' && service.custom_category_name
                            ? service.custom_category_name
                            : service.category}
                        </span>
                        {service.category === 'Other' && service.custom_category_status === 'pending' && (
                          <span className="inline-flex px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            Pending Approval
                          </span>
                        )}
                        {service.category === 'Other' && service.custom_category_status === 'rejected' && (
                          <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(service)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {service.duration_minutes} min
                    </div>
                    <div className="flex items-center font-semibold text-gray-900">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                      {service.price_type === 'fixed' ? `$${service.price}` : `$${service.price}+`}
                    </div>
                  </div>

                  {service.stylist_name && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      By: {service.stylist_name}
                    </div>
                  )}

                  <div className="mt-3">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
              Create Service
            </h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newService.category}
                  onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {newService.category === 'Other' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newService.custom_category_name}
                    onChange={(e) => setNewService({ ...newService, custom_category_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Eyelash Extensions"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    ⚠️ Custom categories require admin approval before they appear publicly
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={newService.duration_minutes}
                  onChange={(e) => setNewService({ ...newService, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
                <select
                  value={newService.price_type}
                  onChange={(e) => setNewService({ ...newService, price_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="starting_at">Starting At (variable)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Create Service
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && editingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
              Edit Service
            </h2>
            <form onSubmit={handleUpdateService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={editingService.category}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {editingService.category === 'Other' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingService.custom_category_name || ''}
                    onChange={(e) => setEditingService({ ...editingService, custom_category_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Eyelash Extensions"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    ⚠️ Custom categories require admin approval before they appear publicly
                  </p>
                  {editingService.custom_category_status && (
                    <p className={`mt-2 text-xs font-semibold ${
                      editingService.custom_category_status === 'approved' ? 'text-green-600' :
                      editingService.custom_category_status === 'rejected' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      Status: {editingService.custom_category_status.toUpperCase()}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={editingService.duration_minutes}
                  onChange={(e) => setEditingService({ ...editingService, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingService.price}
                  onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
                <select
                  value={editingService.price_type}
                  onChange={(e) => setEditingService({ ...editingService, price_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="starting_at">Starting At (variable)</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingService.is_active}
                    onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Service is active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingService(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Update Service
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
