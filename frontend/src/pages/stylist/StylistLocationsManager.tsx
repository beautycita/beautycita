import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import {
  PlusCircleIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import LocationPicker from '../../components/ui/LocationPicker'
import { useTranslation } from 'react-i18next'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Location {
  id: number
  stylist_id: number
  location_name: string
  location_type: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  latitude: number
  longitude: number
  is_primary: boolean
  is_active: boolean
  accepts_walkins: boolean
  parking_available: boolean
  wheelchair_accessible: boolean
  working_hours: any
  notes: string
  photos: string[]
}

export default function StylistLocationsManager() {
  const { t } = useTranslation()
  const { token } = useAuthStore()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    location_name: '',
    location_type: 'salon',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'Mexico',
    latitude: 0,
    longitude: 0,
    is_primary: false,
    accepts_walkins: false,
    parking_available: false,
    wheelchair_accessible: false,
    notes: ''
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stylist/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLocations(response.data.data)
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (location: any) => {
    setFormData({
      ...formData,
      address: location.address,
      city: location.city || '',
      state: location.state || '',
      latitude: location.lat,
      longitude: location.lng
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingLocation) {
        // Update existing location
        await axios.put(
          `${API_URL}/api/stylist/locations/${editingLocation.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        // Add new location
        await axios.post(`${API_URL}/api/stylist/locations`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }

      // Reset form and refresh
      setFormData({
        location_name: '',
        location_type: 'salon',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'Mexico',
        latitude: 0,
        longitude: 0,
        is_primary: false,
        accepts_walkins: false,
        parking_available: false,
        wheelchair_accessible: false,
        notes: ''
      })
      setShowAddForm(false)
      setEditingLocation(null)
      fetchLocations()
    } catch (error) {
      console.error('Error saving location:', error)
      alert('Failed to save location')
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      location_name: location.location_name,
      location_type: location.location_type,
      address: location.address,
      city: location.city,
      state: location.state,
      zip: location.zip,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      is_primary: location.is_primary,
      accepts_walkins: location.accepts_walkins,
      parking_available: location.parking_available,
      wheelchair_accessible: location.wheelchair_accessible,
      notes: location.notes || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (locationId: number) => {
    if (!confirm('Are you sure you want to delete this location?')) return

    try {
      await axios.delete(`${API_URL}/api/stylist/locations/${locationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchLocations()
    } catch (error: any) {
      console.error('Error deleting location:', error)
      alert(error.response?.data?.message || 'Failed to delete location')
    }
  }

  const handleSetPrimary = async (locationId: number) => {
    try {
      await axios.post(
        `${API_URL}/api/stylist/locations/${locationId}/set-primary`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchLocations()
    } catch (error) {
      console.error('Error setting primary location:', error)
      alert('Failed to set primary location')
    }
  }

  const handleToggleActive = async (location: Location) => {
    try {
      await axios.put(
        `${API_URL}/api/stylist/locations/${location.id}`,
        { is_active: !location.is_active },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchLocations()
    } catch (error) {
      console.error('Error toggling location:', error)
    }
  }

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'home':
        return HomeIcon
      case 'salon':
        return BuildingStorefrontIcon
      case 'mobile':
        return TruckIcon
      default:
        return MapPinIcon
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Business Locations
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your salon locations and work sites
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setEditingLocation(null)
              setFormData({
                location_name: '',
                location_type: 'salon',
                address: '',
                city: '',
                state: '',
                zip: '',
                country: 'Mexico',
                latitude: 0,
                longitude: 0,
                is_primary: false,
                accepts_walkins: false,
                parking_available: false,
                wheelchair_accessible: false,
                notes: ''
              })
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Add Location
          </button>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-xl p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Location Name & Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      value={formData.location_name}
                      onChange={(e) =>
                        setFormData({ ...formData, location_name: e.target.value })
                      }
                      placeholder="Downtown Salon, Mall Branch, Home Studio..."
                      required
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Type *
                    </label>
                    <select
                      value={formData.location_type}
                      onChange={(e) =>
                        setFormData({ ...formData, location_type: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500"
                    >
                      <option value="salon">Salon/Storefront</option>
                      <option value="home">Home Studio</option>
                      <option value="mobile">Mobile Services</option>
                      <option value="client_location">Client Location</option>
                    </select>
                  </div>
                </div>

                {/* Location Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialAddress={formData.address}
                  />
                </div>

                {/* City, State, Zip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) =>
                        setFormData({ ...formData, zip: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Amenities
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.accepts_walkins}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accepts_walkins: e.target.checked
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-gray-700">Accepts Walk-ins</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.parking_available}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parking_available: e.target.checked
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-gray-700">Parking Available</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.wheelchair_accessible}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            wheelchair_accessible: e.target.checked
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-gray-700">Wheelchair Accessible</span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="e.g., Ring doorbell twice, Park in back, 2nd floor..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500"
                  />
                </div>

                {/* Set as Primary */}
                {!editingLocation && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_primary}
                      onChange={(e) =>
                        setFormData({ ...formData, is_primary: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-gray-700 font-medium">
                      Set as Primary Location
                    </span>
                  </label>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
                  >
                    {editingLocation ? 'Update Location' : 'Add Location'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingLocation(null)
                    }}
                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Locations List */}
        {locations.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <MapPinIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No locations yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first business location to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => {
              const Icon = getLocationIcon(location.location_type)
              return (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white rounded-3xl shadow-lg p-6 ${
                    !location.is_active ? 'opacity-60' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {location.location_name}
                        </h3>
                        <span className="text-xs text-gray-500 capitalize">
                          {location.location_type}
                        </span>
                      </div>
                    </div>
                    {location.is_primary && (
                      <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                        Primary
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  <div className="mb-4">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{location.address}</p>
                        {location.city && (
                          <p>
                            {location.city}
                            {location.state && `, ${location.state}`}
                            {location.zip && ` ${location.zip}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  {(location.accepts_walkins ||
                    location.parking_available ||
                    location.wheelchair_accessible) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {location.accepts_walkins && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Walk-ins
                        </span>
                      )}
                      {location.parking_available && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Parking
                        </span>
                      )}
                      {location.wheelchair_accessible && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Accessible
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {location.notes && (
                    <p className="text-sm text-gray-600 mb-4 italic">
                      "{location.notes}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!location.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(location.id)}
                        className="flex-1 py-2 text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium hover:shadow-md transition-shadow"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(location)}
                      className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {location.is_active ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
