import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  CameraIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  SparklesIcon,
  HeartIcon,
  ShareIcon,
  TagIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  StarIcon,
  TrendingUpIcon,
  LightBulbIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  FolderPlusIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  LinkIcon,
  HashtagIcon,
  ClockIcon,
  BeakerIcon,
  FireIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

// Extensive interfaces for all optional fields
interface PortfolioItem {
  id: string
  type: 'before-after' | 'single' | 'video' | 'transformation-series' | 'tutorial'

  // Basic Info
  title: string
  description: string
  category: string
  subcategory?: string

  // Media
  images: {
    before?: string
    after?: string
    process?: string[]
    main?: string
    thumbnails?: string[]
  }
  videoUrl?: string

  // Service Details
  serviceId?: string
  serviceName: string
  duration?: number
  price?: number
  products?: Product[]
  techniques?: string[]
  tools?: string[]

  // Client Info (with permission)
  clientName?: string
  clientTestimonial?: string
  clientAge?: string
  clientSkinType?: string
  clientHairType?: string
  clientConcerns?: string[]

  // Metadata
  tags: string[]
  season?: string
  occasion?: string
  style?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert'

  // Performance
  views: number
  likes: number
  shares: number
  bookingsGenerated: number
  conversionRate?: number

  // Timestamps
  serviceDate: string
  createdAt: string
  updatedAt: string
  featuredUntil?: string

  // Status
  isPublished: boolean
  isFeatured: boolean
  isPinned: boolean
  visibility: 'public' | 'private' | 'followers-only'

  // SEO & Marketing
  seoTitle?: string
  seoDescription?: string
  socialMediaCaptions?: {
    instagram?: string
    facebook?: string
    tiktok?: string
  }
  hashtags?: string[]

  // AI Insights
  aphroditeScore?: number
  aphroditeSuggestions?: string[]
  trendAlignment?: string[]
  marketDemand?: 'low' | 'medium' | 'high' | 'trending'
}

interface Product {
  name: string
  brand: string
  type: string
  shade?: string
  link?: string
  price?: number
  isAffiliate?: boolean
}

interface Collection {
  id: string
  name: string
  description: string
  coverImage?: string
  items: string[] // portfolio item ids
  isPublic: boolean
  order: number
  theme?: string
  targetAudience?: string
}

interface Certification {
  id: string
  name: string
  institution: string
  date: string
  image?: string
  verificationUrl?: string
  expiryDate?: string
  skills: string[]
}

interface Award {
  id: string
  title: string
  organization: string
  date: string
  category: string
  description?: string
  image?: string
  placement?: string
}

export default function PortfolioManagement() {
  const { t } = useTranslation()
  const { user, stylist } = useAuthStore()
  const [activeTab, setActiveTab] = useState('gallery')
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [showAphroditeHelper, setShowAphroditeHelper] = useState(false)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  // Extensive optional fields for stylist profile
  const [profileData, setProfileData] = useState({
    // Professional Info
    businessName: '',
    tagline: '',
    biography: '',
    experience: 0,
    specialties: [] as string[],
    signatureStyles: [] as string[],

    // Location & Availability
    workLocation: {
      salon: '',
      address: '',
      city: '',
      coordinates: { lat: 0, lng: 0 },
      workFromHome: false,
      mobileService: false,
      serviceRadius: 0
    },

    // Business Hours (extensive)
    businessHours: {
      monday: { open: '', close: '', breaks: [] },
      tuesday: { open: '', close: '', breaks: [] },
      wednesday: { open: '', close: '', breaks: [] },
      thursday: { open: '', close: '', breaks: [] },
      friday: { open: '', close: '', breaks: [] },
      saturday: { open: '', close: '', breaks: [] },
      sunday: { open: '', close: '', breaks: [] },
      holidays: [] as string[],
      vacationDates: [] as { start: string, end: string }[]
    },

    // Social Media & Links
    socialMedia: {
      instagram: '',
      facebook: '',
      tiktok: '',
      youtube: '',
      pinterest: '',
      website: '',
      linktree: ''
    },

    // Languages & Communication
    languages: [] as string[],
    communicationPreferences: {
      whatsapp: false,
      telegram: false,
      instagram: false,
      sms: false,
      email: false
    },
    responseTime: '',

    // Pricing & Payment
    pricingTier: 'medium',
    acceptedPayments: [] as string[],
    depositRequired: false,
    depositPercentage: 0,
    cancellationPolicy: '',

    // Team & Collaborations
    teamMembers: [] as { name: string, role: string, photo?: string }[],
    collaborations: [] as string[],
    mentorships: [] as string[],

    // Sustainability & Values
    sustainablePractices: [] as string[],
    veganFriendly: false,
    crueltyFree: false,
    organicProducts: false,

    // Accessibility
    wheelchairAccessible: false,
    parkingAvailable: false,
    publicTransportNearby: false,
    childFriendly: false,
    petFriendly: false,

    // Additional Services
    complementaryServices: [] as string[],
    amenities: [] as string[],

    // Professional Development
    ongoingEducation: [] as string[],
    workshopsOffered: [] as string[],
    mentoringAvailable: false,

    // Client Preferences
    targetDemographic: [] as string[],
    preferredClientTypes: [] as string[],
    notAccepting: [] as string[]
  })

  useEffect(() => {
    loadPortfolioData()
  }, [])

  const loadPortfolioData = async () => {
    try {
      setLoading(true)

      // ✅ REAL API: Fetch portfolio images from backend
      const apiClient = (await import('../../services/api')).apiClient
      const response = await apiClient.get('/api/portfolio/my-images')

      if (response.success && response.data) {
        // Transform backend data to frontend format
        const transformedPortfolio: PortfolioItem[] = response.data.map((item: any) => ({
          id: item.id.toString(),
          type: 'single' as const,
          title: item.title || 'Untitled',
          description: item.description || '',
          category: item.service_category || 'General',
          subcategory: '',
          images: {
            before: '',
            after: item.image_url,
            process: []
          },
          serviceName: item.service_category || '',
          duration: 0,
          price: 0,
          products: [],
          techniques: [],
          tools: [],
          tags: [],
          difficulty: 'medium' as const,
          views: 0,
          likes: 0,
          shares: 0,
          bookingsGenerated: 0,
          conversionRate: 0,
          createdAt: item.created_at,
          updatedAt: item.created_at,
          isPublished: true,
          isFeatured: item.is_featured || false,
          isPinned: false,
          visibility: 'public' as const
        }))

        setPortfolioItems(transformedPortfolio)
        return
      }

      // Fallback to mock data if API fails
      const mockPortfolio: PortfolioItem[] = [
        {
          id: '1',
          type: 'before-after',
          title: 'Transformación Balayage Natural',
          description: 'De castaño oscuro a rubio miel con técnica balayage',
          category: 'Coloración',
          subcategory: 'Balayage',
          images: {
            before: '/images/before1.jpg',
            after: '/images/after1.jpg',
            process: ['/images/process1.jpg', '/images/process2.jpg']
          },
          serviceName: 'Balayage Completo',
          duration: 240,
          price: 2500,
          products: [
            {
              name: 'Olaplex No.3',
              brand: 'Olaplex',
              type: 'Tratamiento',
              price: 30,
              isAffiliate: true
            }
          ],
          techniques: ['Balayage', 'Babylights', 'Toning'],
          tools: ['Pincel profesional', 'Papel aluminio', 'Secador Dyson'],
          clientTestimonial: '¡Me encantó el resultado! Exactamente lo que quería.',
          clientHairType: 'Ondulado, medio',
          tags: ['balayage', 'rubio', 'transformación', 'tendencia'],
          season: 'Verano',
          style: 'Natural',
          difficulty: 'hard',
          views: 1234,
          likes: 89,
          shares: 12,
          bookingsGenerated: 8,
          conversionRate: 6.5,
          serviceDate: '2024-12-15',
          createdAt: '2024-12-16',
          updatedAt: '2024-12-16',
          isPublished: true,
          isFeatured: true,
          isPinned: false,
          visibility: 'public',
          hashtags: ['#balayage', '#blondehair', '#hairtransformation'],
          aphroditeScore: 92,
          aphroditeSuggestions: ['Añadir más fotos del proceso', 'Incluir video corto'],
          trendAlignment: ['Balayage natural', 'Rubios cálidos'],
          marketDemand: 'trending'
        }
      ]

      setPortfolioItems(mockPortfolio)
    } catch (error) {
      toast.error(t('stylist.messages.portfolio.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (files: FileList) => {
    try {
      // ✅ REAL API: Upload images to backend/Cloudinary
      const apiClient = (await import('../../services/api')).apiClient

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Create FormData for multipart upload
        const formData = new FormData()
        formData.append('image', file)
        formData.append('title', file.name.split('.')[0]) // Use filename as title
        formData.append('description', '')
        formData.append('service_category', 'General')
        formData.append('is_featured', 'false')

        const response = await fetch('/api/portfolio/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })

        const result = await response.json()

        if (!result.success) {
          toast.error(`Error al subir ${file.name}: ${result.message}`)
          continue
        }

        toast.success(t('stylist.messages.portfolio.uploadSuccess', { filename: file.name }))
      }

      // Reload portfolio after uploads
      await loadPortfolioData()
    } catch (error: any) {
      toast.error(t('stylist.messages.portfolio.uploadError'))
      console.error('Upload error:', error)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta imagen del portfolio?')) {
      return
    }

    try {
      const apiClient = (await import('../../services/api')).apiClient
      const response = await apiClient.delete(`/api/portfolio/${imageId}`)

      if (response.success) {
        toast.success(t('stylist.messages.portfolio.deleteSuccess'))
        await loadPortfolioData() // Refresh the list
      } else {
        toast.error(response.message || t('stylist.messages.portfolio.deleteError'))
      }
    } catch (error: any) {
      toast.error(t('stylist.messages.portfolio.deleteError'))
      console.error('Delete error:', error)
    }
  }

  const getAphroditeInsight = (item: PortfolioItem) => {
    const insights = {
      high: '🔥 Alto potencial de conversión',
      medium: '⭐ Buen engagement esperado',
      low: '💡 Considera mejorar la presentación'
    }
    return item.marketDemand ? insights[item.marketDemand] || insights.medium : insights.medium
  }

  const tabItems = [
    { id: 'gallery', name: 'Galería', icon: PhotoIcon },
    { id: 'collections', name: 'Colecciones', icon: FolderPlusIcon },
    { id: 'profile', name: 'Perfil Completo', icon: UserIcon },
    { id: 'certifications', name: 'Certificaciones', icon: AcademicCapIcon },
    { id: 'insights', name: 'Insights IA', icon: SparklesIcon }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-responsive py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-900">
                Portfolio Profesional
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona tu vitrina digital y atrae más clientes
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAphroditeHelper(true)}
                className="btn btn-secondary flex items-center space-x-2 rounded-full"
              >
                <SparklesIcon className="h-5 w-5" />
                <span>Optimizar con IA</span>
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary flex items-center space-x-2 rounded-full"
              >
                <ArrowUpTrayIcon className="h-5 w-5" />
                <span>Subir Contenido</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-full p-3">
              <div className="flex items-center space-x-2">
                <EyeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Vistas Totales</p>
                  <p className="text-lg font-semibold text-gray-900">12.4K</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-full p-3">
              <div className="flex items-center space-x-2">
                <HeartIcon className="h-5 w-5 text-pink-400" />
                <div>
                  <p className="text-xs text-gray-500">Me Gusta</p>
                  <p className="text-lg font-semibold text-gray-900">1.8K</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-full p-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-500">Reservas Generadas</p>
                  <p className="text-lg font-semibold text-gray-900">47</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-full p-3">
              <div className="flex items-center space-x-2">
                <TrendingUpIcon className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-xs text-gray-500">Conversión</p>
                  <p className="text-lg font-semibold text-gray-900">8.2%</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-full p-3">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-500">Score IA</p>
                  <p className="text-lg font-semibold text-gray-900">88/100</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container-responsive">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 inline-flex items-center space-x-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="container-responsive py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Filters and Sort */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">Todos</option>
                    <option value="before-after">Antes/Después</option>
                    <option value="video">Videos</option>
                    <option value="featured">Destacados</option>
                    <option value="trending">Tendencia</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="recent">Más Recientes</option>
                    <option value="popular">Más Populares</option>
                    <option value="conversion">Mayor Conversión</option>
                    <option value="ai-score">Score IA</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {portfolioItems.length} trabajos
                  </span>
                </div>
              </div>

              {/* Portfolio Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="card overflow-hidden cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-gray-100">
                      {item.type === 'before-after' && item.images.before && item.images.after ? (
                        <div className="grid grid-cols-2 h-full">
                          <div className="relative">
                            <img
                              src={item.images.before}
                              alt="Antes"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                              Antes
                            </span>
                          </div>
                          <div className="relative">
                            <img
                              src={item.images.after}
                              alt="Después"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                              Después
                            </span>
                          </div>
                        </div>
                      ) : item.images.main ? (
                        <img
                          src={item.images.main}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <PhotoIcon className="h-20 w-20 text-gray-300" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2 right-2 flex flex-col space-y-1">
                        {item.isFeatured && (
                          <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded flex items-center">
                            <StarIcon className="h-3 w-3 mr-1" />
                            Destacado
                          </span>
                        )}
                        {item.marketDemand === 'trending' && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded flex items-center">
                            <FireIcon className="h-3 w-3 mr-1" />
                            Trending
                          </span>
                        )}
                      </div>

                      {/* AI Score */}
                      {item.aphroditeScore && (
                        <div className="absolute bottom-2 left-2">
                          <div className="px-2 py-1 bg-white/90 rounded-full flex items-center space-x-1">
                            <SparklesIcon className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-medium text-gray-900">
                              {item.aphroditeScore}/100
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="card-body">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <EyeIcon className="h-3 w-3" />
                            <span>{item.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <HeartIcon className="h-3 w-3" />
                            <span>{item.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{item.bookingsGenerated}</span>
                          </div>
                        </div>

                        {item.conversionRate && (
                          <span className="text-green-600 font-medium">
                            {item.conversionRate}% conv
                          </span>
                        )}
                      </div>

                      {/* AI Insight */}
                      {item.marketDemand && (
                        <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-full">
                          <p className="text-xs text-purple-700 flex items-center">
                            <LightBulbIcon className="h-3 w-3 mr-1" />
                            {getAphroditeInsight(item)}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Add New Item */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUploadModal(true)}
                  className="card border-2 border-dashed border-gray-300 hover:border-primary-400 cursor-pointer"
                >
                  <div className="card-body flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      <PlusIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">Agregar Trabajo</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Sube fotos o videos de tus mejores trabajos
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Perfil Profesional Completo</h2>
                  <p className="text-sm text-gray-600">
                    Completa todos los campos opcionales para maximizar tu visibilidad
                  </p>
                </div>
                <div className="card-body space-y-8">
                  {/* Professional Info Section */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Información Profesional
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre del Negocio
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500"
                          placeholder="Beauty Studio by Maria"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tagline/Slogan
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500"
                          placeholder="Tu belleza, mi pasión"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Biografía Profesional
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500"
                          placeholder="Cuéntale a tus clientes sobre tu experiencia, pasión y estilo..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specialties & Skills */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <StarIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Especialidades y Habilidades
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Especialidades Principales
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['Coloración', 'Corte', 'Peinados', 'Tratamientos', 'Extensiones', 'Maquillaje'].map((specialty) => (
                            <label key={specialty} className="flex items-center">
                              <input type="checkbox" className="mr-2" />
                              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm cursor-pointer hover:bg-gray-200">
                                {specialty}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estilos Signature
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Balayage natural, Cortes bob modernos, Ondas hollywood..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Languages & Communication */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Idiomas y Comunicación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Idiomas que Hablas
                        </label>
                        <div className="space-y-2">
                          {['Español', 'Inglés', 'Francés', 'Portugués', 'Italiano'].map((lang) => (
                            <label key={lang} className="flex items-center">
                              <input type="checkbox" className="mr-2" />
                              <span className="text-sm">{lang}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Canales de Comunicación
                        </label>
                        <div className="space-y-2">
                          {['WhatsApp', 'Instagram DM', 'SMS', 'Email', 'Telegram'].map((channel) => (
                            <label key={channel} className="flex items-center">
                              <input type="checkbox" className="mr-2" />
                              <span className="text-sm">{channel}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sustainability & Values */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <HeartIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Valores y Sostenibilidad
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Productos Veganos</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Cruelty Free</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Orgánico</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Eco-friendly</span>
                      </label>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button className="btn btn-secondary rounded-full">
                      Guardar como Borrador
                    </button>
                    <button className="btn btn-primary rounded-full">
                      Guardar y Publicar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}