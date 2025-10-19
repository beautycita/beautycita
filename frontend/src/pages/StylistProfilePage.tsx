import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  HeartIcon,
  UserCircleIcon,
  CheckBadgeIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  ShareIcon,
  PhotoIcon,
  AcademicCapIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { bookingService, type Stylist, type StylistService } from '../services/bookingService'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import ReviewList from '../components/reviews/ReviewList'
import PortfolioGallery from '../components/portfolio/PortfolioGallery'

export default function StylistProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [stylist, setStylist] = useState<Stylist | null>(null)
  const [services, setServices] = useState<StylistService[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'portfolio' | 'reviews'>('about')

  useEffect(() => {
    if (id) {
      loadStylistProfile(id)
      loadStylistServices(id)
    }
  }, [id])

  const loadStylistProfile = async (stylistId: string) => {
    try {
      const response = await bookingService.getStylist(stylistId)
      if (response.success && response.data) {
        setStylist(response.data)
      } else {
        toast.error('No se pudo cargar el perfil del estilista')
      }
    } catch (error) {
      console.error('Error loading stylist profile:', error)
      toast.error('Error al cargar el perfil')
    }
  }

  const loadStylistServices = async (stylistId: string) => {
    try {
      const response = await bookingService.getStylistServices(stylistId)
      if (response.success && response.data) {
        setServices(response.data)
      }
    } catch (error) {
      console.error('Error loading stylist services:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    // toast.success(isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos') // Removed: icon change is enough
  }

  const handleBookService = (serviceId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book an appointment')
      navigate('/login')
      return
    }
    navigate(`/book/${id}/${serviceId}`)
  }

  const handleBookStylist = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book an appointment')
      navigate('/login')
      return
    }
    // Navigate to first available service or show service selection
    if (stylist?.services && stylist.services.length > 0) {
      navigate(`/book/${id}/${stylist.services[0].id}`)
    } else {
      toast.error('This stylist has no available services')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!stylist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Estilista no encontrado</h1>
          <p className="text-gray-600 mb-4">El perfil que buscas no existe o ha sido eliminado.</p>
          <Link to="/stylists" className="btn btn-primary rounded-full">
            Ver todos los estilistas
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'about', label: 'Acerca de' },
    { key: 'services', label: 'Servicios' },
    { key: 'portfolio', label: 'Portafolio' },
    { key: 'reviews', label: 'Reseñas' }
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver
          </button>
        </div>

        {/* Profile Header */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                {stylist.profile_picture_url ? (
                  <img
                    src={stylist.profile_picture_url}
                    alt={stylist.business_name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-20 h-20 text-primary-600" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-serif font-bold text-gray-900">
                        {stylist.business_name}
                      </h1>
                      {stylist.is_verified && (
                        <CheckBadgeIcon className="w-8 h-8 text-blue-500" title="Verificado" />
                      )}
                    </div>
                    <p className="text-xl text-gray-700 font-medium mb-2">{stylist.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        <span>{stylist.location_city}, {stylist.location_state}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        <span>{stylist.experience_years} años de experiencia</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center">
                        <StarIcon className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold">
                          {parseFloat(stylist.rating_average.toString()).toFixed(1)}
                        </span>
                        <span className="text-gray-600 ml-1">({stylist.rating_count} reseñas)</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center text-gray-600">
                        <span>{stylist.total_bookings} citas completadas</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={toggleFavorite}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      {isFavorite ? (
                        <HeartSolidIcon className="w-6 h-6 text-red-500" />
                      ) : (
                        <HeartIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <ShareIcon className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {stylist.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex px-3 py-1 text-sm font-medium bg-primary-100 text-primary-800 rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                {/* Price Range */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-700">
                    <CurrencyDollarIcon className="w-5 h-5 mr-1" />
                    <span className="font-semibold">{stylist.base_price_range}</span>
                    <span className="text-gray-500 ml-1">• {stylist.pricing_tier}</span>
                  </div>
                  <button
                    onClick={handleBookStylist}
                    className="btn btn-primary rounded-full"
                  >
                    <CalendarDaysIcon className="w-4 h-4 mr-2" />
                    Reservar Cita
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Bio */}
              {stylist.bio && (
                <div className="card">
                  <div className="card-body">
                    <h3 className="card-title mb-4">Sobre mí</h3>
                    <p className="text-gray-700 leading-relaxed">{stylist.bio}</p>
                  </div>
                </div>
              )}

              {/* Certifications */}
              {stylist.certifications && stylist.certifications.length > 0 && (
                <div className="card">
                  <div className="card-body">
                    <h3 className="card-title mb-4">
                      <AcademicCapIcon className="w-5 h-5 mr-2" />
                      Certificaciones
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stylist.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-full">
                          <TrophyIcon className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Social Media */}
              {stylist.social_media_links && (
                <div className="card">
                  <div className="card-body">
                    <h3 className="card-title mb-4">Sígueme en redes sociales</h3>
                    <div className="flex space-x-4">
                      {stylist.social_media_links.instagram && (
                        <a
                          href={`https://instagram.com/${stylist.social_media_links.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors"
                        >
                          <PhotoIcon className="w-4 h-4 mr-2" />
                          Instagram
                        </a>
                      )}
                      {stylist.social_media_links.facebook && (
                        <a
                          href={stylist.social_media_links.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        >
                          Facebook
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="card">
              <div className="card-body">
                <h3 className="card-title mb-6">Servicios Disponibles</h3>
                {services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services.map((service: any) => (
                      <div key={service.id} className="border border-gray-200 rounded-full p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg mb-2">
                              {service.name}
                            </h4>
                            <p className="text-gray-600 text-sm mb-3">
                              {service.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            <div className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              <span>{service.duration_minutes} min</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold text-primary-600">
                              ${service.price}
                            </span>
                            <button
                              onClick={() => handleBookService(service.id)}
                              className="btn btn-primary btn-sm rounded-full"
                            >
                              Book
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Este estilista aún no ha publicado sus servicios</p>
                    <button
                      onClick={handleBookStylist}
                      className="btn btn-primary rounded-full"
                    >
                      Contactar para más información
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <PortfolioGallery stylistId={parseInt(id!)} />
          )}

          {activeTab === 'reviews' && (
            <ReviewList stylistId={parseInt(id!)} />
          )}
        </motion.div>
      </div>
    </div>
  )
}