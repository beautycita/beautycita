import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  StarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  MapPinIcon,
  ClockIcon,
  SparklesIcon,
  LightBulbIcon,
  BanknotesIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  PresentationChartLineIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarIcon,
  UsersIcon,
  ShoppingBagIcon,
  DocumentChartBarIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  ArrowsUpDownIcon,
  ChartPieIcon,
  Squares2X2Icon,
  TableCellsIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface RevenueMetrics {
  // Core Revenue
  totalRevenue: number
  monthlyRevenue: number
  weeklyRevenue: number
  dailyRevenue: number

  // Growth Metrics
  monthOverMonth: number
  weekOverWeek: number
  yearOverYear: number

  // Revenue Breakdown
  revenueByService: Array<{
    serviceName: string
    revenue: number
    bookings: number
    averagePrice: number
    growth: number
  }>

  revenueByMonth: Array<{
    month: string
    revenue: number
    bookings: number
    expenses?: number
    profit?: number
  }>

  // Advanced Analytics
  averageTransactionValue: number
  revenuePerClient: number
  clientLifetimeValue: number
  churnRate: number
  retentionRate: number

  // Payment Analytics
  paymentMethods: Array<{
    method: string
    percentage: number
    revenue: number
    fees: number
  }>

  // Performance Indicators
  occupancyRate: number
  utilizationRate: number
  cancellationRate: number
  noShowRate: number
  conversionRate: number

  // Profitability
  totalExpenses: number
  netProfit: number
  profitMargin: number
  costPerAcquisition: number
  returnOnInvestment: number
}

interface ClientAnalytics {
  totalClients: number
  newClients: number
  returningClients: number
  vipClients: number

  clientDemographics: {
    ageGroups: Array<{ range: string; count: number; percentage: number }>
    locations: Array<{ city: string; count: number; revenue: number }>
    acquisitionSources: Array<{ source: string; count: number; conversion: number }>
  }

  clientBehavior: {
    averageBookingsPerClient: number
    mostPopularServices: Array<{ service: string; bookings: number }>
    peakHours: Array<{ hour: string; bookings: number }>
    seasonalTrends: Array<{ season: string; bookings: number; revenue: number }>
  }

  clientSatisfaction: {
    averageRating: number
    totalReviews: number
    ratingDistribution: Array<{ stars: number; count: number }>
    testimonials: Array<{ client: string; rating: number; comment: string; date: string }>
  }
}

interface MarketingAnalytics {
  socialMediaMetrics: {
    instagram: {
      followers: number
      engagement: number
      reach: number
      impressions: number
      bookingsFromInstagram: number
    }
    facebook: {
      followers: number
      engagement: number
      bookingsFromFacebook: number
    }
  }

  onlinePresence: {
    profileViews: number
    portfolioViews: number
    contactClicks: number
    websiteTraffic?: number
    searchRanking?: number
  }

  referralProgram: {
    totalReferrals: number
    referralRevenue: number
    topReferrers: Array<{ name: string; referrals: number; revenue: number }>
  }

  marketingCampaigns: Array<{
    name: string
    type: string
    cost: number
    bookingsGenerated: number
    revenue: number
    roi: number
  }>
}

interface CompetitorAnalysis {
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche'
  priceComparison: {
    yourAverage: number
    marketAverage: number
    competitors: Array<{ name: string; averagePrice: number; rating: number }>
  }
  serviceComparison: {
    uniqueServices: string[]
    missingServices: string[]
    popularityGaps: Array<{ service: string; gap: number }>
  }
  strengthsWeaknesses: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
}

interface ForecastData {
  revenueProjection: Array<{
    month: string
    projected: number
    confidence: number
    factors: string[]
  }>

  demandForecast: Array<{
    service: string
    expectedDemand: number
    seasonalFactor: number
    trendFactor: number
  }>

  businessGoals: Array<{
    metric: string
    current: number
    target: number
    timeline: string
    probability: number
    recommendations: string[]
  }>
}

export default function AnalyticsRevenue() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'charts' | 'table'>('cards')

  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenue: 0,
    monthOverMonth: 0,
    weekOverWeek: 0,
    yearOverYear: 0,
    revenueByService: [],
    revenueByMonth: [],
    averageTransactionValue: 0,
    revenuePerClient: 0,
    clientLifetimeValue: 0,
    churnRate: 0,
    retentionRate: 0,
    paymentMethods: [],
    occupancyRate: 0,
    utilizationRate: 0,
    cancellationRate: 0,
    noShowRate: 0,
    conversionRate: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    costPerAcquisition: 0,
    returnOnInvestment: 0
  })

  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalytics>({
    totalClients: 0,
    newClients: 0,
    returningClients: 0,
    vipClients: 0,
    clientDemographics: {
      ageGroups: [],
      locations: [],
      acquisitionSources: []
    },
    clientBehavior: {
      averageBookingsPerClient: 0,
      mostPopularServices: [],
      peakHours: [],
      seasonalTrends: []
    },
    clientSatisfaction: {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: [],
      testimonials: []
    }
  })

  const [marketingAnalytics, setMarketingAnalytics] = useState<MarketingAnalytics>({
    socialMediaMetrics: {
      instagram: {
        followers: 0,
        engagement: 0,
        reach: 0,
        impressions: 0,
        bookingsFromInstagram: 0
      },
      facebook: {
        followers: 0,
        engagement: 0,
        bookingsFromFacebook: 0
      }
    },
    onlinePresence: {
      profileViews: 0,
      portfolioViews: 0,
      contactClicks: 0
    },
    referralProgram: {
      totalReferrals: 0,
      referralRevenue: 0,
      topReferrers: []
    },
    marketingCampaigns: []
  })

  const [forecastData, setForecastData] = useState<ForecastData>({
    revenueProjection: [],
    demandForecast: [],
    businessGoals: []
  })

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)

      // ✅ REAL DATA: Fetch revenue from backend API
      const apiClient = (await import('../../services/api')).apiClient
      let revenueData: any = null

      try {
        // Map time range to API period
        const periodMap: Record<string, string> = {
          'week': 'week',
          'month': 'month',
          '3months': 'month', // Use month data for now
          'year': 'year',
          'all': 'year' // Use year data for 'all'
        }
        const period = periodMap[timeRange] || 'month'

        const response = await apiClient.get(`/api/dashboard/stylist/revenue?period=${period}`)
        if (response.success && response.data) {
          revenueData = response.data
        }
      } catch (error) {
        console.error('Error fetching real revenue data:', error)
        // Will fall back to mock data below
      }

      // Build revenue metrics from real or mock data
      const mockRevenueMetrics: RevenueMetrics = {
        // ✅ Use real data if available
        totalRevenue: revenueData ? parseFloat(revenueData.totalRevenue) : 45250.75,
        monthlyRevenue: revenueData ? parseFloat(revenueData.totalRevenue) : 8920.50,
        weeklyRevenue: 2180.25, // ⚠️ Mock - needs backend
        dailyRevenue: 312.75, // ⚠️ Mock - needs backend
        monthOverMonth: 18.5, // ⚠️ Mock - needs backend
        weekOverWeek: 12.3, // ⚠️ Mock - needs backend
        yearOverYear: 24.8, // ⚠️ Mock - needs backend

        // ✅ Use real service revenue data if available
        revenueByService: revenueData?.revenueByService?.map((svc: any) => ({
          serviceName: svc.serviceName,
          revenue: parseFloat(svc.revenue),
          bookings: svc.bookingCount,
          averagePrice: parseFloat(svc.revenue) / svc.bookingCount,
          growth: 0 // ⚠️ Mock - needs historical data
        })) || [
          // Fallback mock data
          {
            serviceName: 'Coloración Completa',
            revenue: 15680.25,
            bookings: 89,
            averagePrice: 176.18,
            growth: 22.4
          },
          {
            serviceName: 'Corte y Peinado',
            revenue: 12450.50,
            bookings: 156,
            averagePrice: 79.81,
            growth: 15.7
          },
          {
            serviceName: 'Tratamientos Capilares',
            revenue: 8920.75,
            bookings: 67,
            averagePrice: 133.14,
            growth: 28.9
          }
        ],
        revenueByMonth: [
          { month: 'Jul', revenue: 6820, bookings: 89, expenses: 2100, profit: 4720 },
          { month: 'Ago', revenue: 7540, bookings: 98, expenses: 2280, profit: 5260 },
          { month: 'Sep', revenue: 8210, bookings: 112, expenses: 2450, profit: 5760 },
          { month: 'Oct', revenue: 7890, bookings: 105, expenses: 2380, profit: 5510 },
          { month: 'Nov', revenue: 9150, bookings: 125, expenses: 2650, profit: 6500 },
          { month: 'Dic', revenue: 8920, bookings: 118, expenses: 2580, profit: 6340 }
        ],
        averageTransactionValue: 156.75,
        revenuePerClient: 287.45,
        clientLifetimeValue: 850.25,
        churnRate: 12.5,
        retentionRate: 87.5,
        paymentMethods: [
          { method: 'Tarjeta', percentage: 65, revenue: 29413, fees: 882 },
          { method: 'Efectivo', percentage: 25, revenue: 11313, fees: 0 },
          { method: 'Transferencia', percentage: 10, revenue: 4525, fees: 45 }
        ],
        occupancyRate: 78.5,
        utilizationRate: 82.3,
        cancellationRate: 8.2,
        noShowRate: 3.1,
        conversionRate: 24.7,
        totalExpenses: 15420.50,
        netProfit: 29830.25,
        profitMargin: 65.9,
        costPerAcquisition: 45.80,
        returnOnInvestment: 193.4
      }

      const mockClientAnalytics: ClientAnalytics = {
        totalClients: 157,
        newClients: 23,
        returningClients: 134,
        vipClients: 18,
        clientDemographics: {
          ageGroups: [
            { range: '18-25', count: 35, percentage: 22.3 },
            { range: '26-35', count: 71, percentage: 45.2 },
            { range: '36-45', count: 38, percentage: 24.2 },
            { range: '46+', count: 13, percentage: 8.3 }
          ],
          locations: [
            { city: 'Roma Norte', count: 58, revenue: 18250 },
            { city: 'Condesa', count: 42, revenue: 13580 },
            { city: 'Polanco', count: 35, revenue: 15420 },
            { city: 'Coyoacán', count: 22, revenue: 7890 }
          ],
          acquisitionSources: [
            { source: 'Instagram', count: 67, conversion: 23.4 },
            { source: 'Referidos', count: 45, conversion: 45.2 },
            { source: 'Google', count: 28, conversion: 18.7 },
            { source: 'Facebook', count: 17, conversion: 15.3 }
          ]
        },
        clientBehavior: {
          averageBookingsPerClient: 2.8,
          mostPopularServices: [
            { service: 'Corte y Peinado', bookings: 156 },
            { service: 'Coloración', bookings: 89 },
            { service: 'Tratamientos', bookings: 67 }
          ],
          peakHours: [
            { hour: '10:00', bookings: 45 },
            { hour: '11:00', bookings: 52 },
            { hour: '14:00', bookings: 38 },
            { hour: '15:00', bookings: 41 }
          ],
          seasonalTrends: [
            { season: 'Primavera', bookings: 125, revenue: 19580 },
            { season: 'Verano', bookings: 142, revenue: 22340 },
            { season: 'Otoño', bookings: 118, revenue: 18920 },
            { season: 'Invierno', bookings: 98, revenue: 15680 }
          ]
        },
        clientSatisfaction: {
          averageRating: 4.8,
          totalReviews: 89,
          ratingDistribution: [
            { stars: 5, count: 67 },
            { stars: 4, count: 18 },
            { stars: 3, count: 3 },
            { stars: 2, count: 1 },
            { stars: 1, count: 0 }
          ],
          testimonials: [
            {
              client: 'María G.',
              rating: 5,
              comment: 'Increíble trabajo, exactamente lo que quería',
              date: '2024-12-20'
            }
          ]
        }
      }

      const mockMarketingAnalytics: MarketingAnalytics = {
        socialMediaMetrics: {
          instagram: {
            followers: 2340,
            engagement: 4.2,
            reach: 8940,
            impressions: 15280,
            bookingsFromInstagram: 67
          },
          facebook: {
            followers: 890,
            engagement: 2.8,
            bookingsFromFacebook: 17
          }
        },
        onlinePresence: {
          profileViews: 3420,
          portfolioViews: 2180,
          contactClicks: 456
        },
        referralProgram: {
          totalReferrals: 45,
          referralRevenue: 12580,
          topReferrers: [
            { name: 'Ana M.', referrals: 8, revenue: 2340 },
            { name: 'Carmen L.', referrals: 6, revenue: 1890 }
          ]
        },
        marketingCampaigns: [
          {
            name: 'Promo Navidad',
            type: 'Instagram Ads',
            cost: 1200,
            bookingsGenerated: 23,
            revenue: 4580,
            roi: 281.7
          }
        ]
      }

      const mockForecastData: ForecastData = {
        revenueProjection: [
          {
            month: 'Ene 2025',
            projected: 9500,
            confidence: 85,
            factors: ['Enero típicamente alto', 'Promociones año nuevo']
          },
          {
            month: 'Feb 2025',
            projected: 8200,
            confidence: 78,
            factors: ['Mes corto', 'Post-vacaciones']
          }
        ],
        demandForecast: [
          {
            service: 'Coloración',
            expectedDemand: 95,
            seasonalFactor: 1.2,
            trendFactor: 1.15
          }
        ],
        businessGoals: [
          {
            metric: 'Ingresos Mensuales',
            current: 8920,
            target: 12000,
            timeline: '6 meses',
            probability: 75,
            recommendations: ['Aumentar precios 15%', 'Agregar servicios premium']
          }
        ]
      }

      setRevenueMetrics(mockRevenueMetrics)
      setClientAnalytics(mockClientAnalytics)
      setMarketingAnalytics(mockMarketingAnalytics)
      setForecastData(mockForecastData)
    } catch (error) {
      toast.error(t('stylist.messages.analytics.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    { id: 'overview', name: 'Resumen', icon: ChartBarIcon },
    { id: 'revenue', name: 'Ingresos', icon: CurrencyDollarIcon },
    { id: 'clients', name: 'Clientes', icon: UserGroupIcon },
    { id: 'marketing', name: 'Marketing', icon: TrendingUpIcon },
    { id: 'forecast', name: 'Pronósticos', icon: SparklesIcon }
  ]

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
  }

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-5 w-5 text-primary-600 animate-pulse" />
            <p className="text-gray-600">Aphrodite está analizando tus datos...</p>
          </div>
        </div>
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
                Analíticas y Ingresos
              </h1>
              <p className="text-gray-600 mt-1">
                Insights profundos para hacer crecer tu negocio
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500"
              >
                <option value="week">Esta Semana</option>
                <option value="month">Este Mes</option>
                <option value="quarter">Este Trimestre</option>
                <option value="year">Este Año</option>
              </select>

              <div className="flex items-center bg-gray-100 rounded-3xl p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('charts')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'charts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <ChartBarIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <TableCellsIcon className="h-4 w-4" />
                </button>
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
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card"
                >
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ingresos del Mes</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${revenueMetrics.monthlyRevenue.toLocaleString()}
                        </p>
                        <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(revenueMetrics.monthOverMonth)}`}>
                          {React.createElement(getGrowthIcon(revenueMetrics.monthOverMonth), { className: 'h-4 w-4' })}
                          <span>{Math.abs(revenueMetrics.monthOverMonth)}% vs mes anterior</span>
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 rounded-3xl">
                        <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card"
                >
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nuevos Clientes</p>
                        <p className="text-2xl font-bold text-gray-900">{clientAnalytics.newClients}</p>
                        <p className="text-sm text-gray-600">
                          {((clientAnalytics.newClients / clientAnalytics.totalClients) * 100).toFixed(1)}% del total
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-3xl">
                        <UserGroupIcon className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="card"
                >
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ticket Promedio</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${revenueMetrics.averageTransactionValue.toFixed(0)}
                        </p>
                        <p className="text-sm text-green-600">+12% vs promedio</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-3xl">
                        <ReceiptPercentIcon className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="card"
                >
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Satisfacción</p>
                        <div className="flex items-center space-x-1">
                          <p className="text-2xl font-bold text-gray-900">
                            {clientAnalytics.clientSatisfaction.averageRating}
                          </p>
                          <StarSolidIcon className="h-6 w-6 text-yellow-400" />
                        </div>
                        <p className="text-sm text-gray-600">
                          {clientAnalytics.clientSatisfaction.totalReviews} reseñas
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-3xl">
                        <StarIcon className="h-8 w-8 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Revenue Chart and Top Services */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Tendencia de Ingresos</h3>
                    <p className="text-sm text-gray-600">Últimos 6 meses</p>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      {revenueMetrics.revenueByMonth.map((month, index) => (
                        <div key={month.month} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 text-sm font-medium text-gray-500">
                              {month.month}
                            </div>
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-3xl h-2">
                                <div
                                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-3xl"
                                  style={{
                                    width: `${(month.revenue / Math.max(...revenueMetrics.revenueByMonth.map(m => m.revenue))) * 100}%`
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ${month.revenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {month.bookings} citas
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Services */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Servicios Más Rentables</h3>
                    <p className="text-sm text-gray-600">Por ingresos generados</p>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      {revenueMetrics.revenueByService.slice(0, 5).map((service, index) => (
                        <div key={service.serviceName} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-600' :
                              index === 2 ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              #{index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{service.serviceName}</h4>
                              <p className="text-sm text-gray-500">
                                {service.bookings} reservas • ${service.averagePrice.toFixed(0)} promedio
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ${service.revenue.toLocaleString()}
                            </p>
                            <div className={`text-xs flex items-center ${getGrowthColor(service.growth)}`}>
                              {React.createElement(getGrowthIcon(service.growth), { className: 'h-3 w-3 mr-1' })}
                              {service.growth.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="card border-l-4 border-purple-400">
                <div className="card-body">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-100 rounded-3xl">
                      <SparklesIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Insights de Aphrodite IA
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-3xl">
                          <div className="flex items-start space-x-2">
                            <TrendingUpIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-900">Oportunidad de Crecimiento</p>
                              <p className="text-sm text-green-800">
                                Tus tratamientos capilares están creciendo 28.9%. Considera aumentar capacidad para este servicio.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-3xl">
                          <div className="flex items-start space-x-2">
                            <LightBulbIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900">Optimización de Precios</p>
                              <p className="text-sm text-blue-800">
                                Puedes aumentar el precio de extensiones un 15% basado en tu demanda y calificación.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-3xl">
                          <div className="flex items-start space-x-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-orange-900">Atención Requerida</p>
                              <p className="text-sm text-orange-800">
                                Tu tasa de cancelación del 8.2% está por encima del promedio. Implementa recordatorios automáticos.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Add other tab content */}
          {activeTab === 'revenue' && (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Desglose de Ingresos</h3>
                  </div>
                  <div className="card-body space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ingresos Brutos</span>
                      <span className="font-semibold">${revenueMetrics.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Gastos Totales</span>
                      <span className="text-red-600">-${revenueMetrics.totalExpenses.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Ganancia Neta</span>
                        <span className="font-bold text-green-600">${revenueMetrics.netProfit.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-3xl">
                      <p className="text-sm text-green-800">
                        Margen de ganancia: <strong>{revenueMetrics.profitMargin.toFixed(1)}%</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Métodos de Pago</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      {revenueMetrics.paymentMethods.map((method, index) => (
                        <div key={method.method} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{method.method}</span>
                            <span>{method.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-3xl h-2">
                            <div
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-blue-500' :
                                index === 1 ? 'bg-green-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${method.percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>${method.revenue.toLocaleString()}</span>
                            <span>Comisiones: ${method.fees}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">KPIs de Negocio</h3>
                  </div>
                  <div className="card-body space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Ocupación</span>
                        <span className="font-semibold">{revenueMetrics.occupancyRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-3xl h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-3xl"
                          style={{ width: `${revenueMetrics.occupancyRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Conversión</span>
                        <span className="font-semibold">{revenueMetrics.conversionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-3xl h-2">
                        <div
                          className="bg-green-500 h-2 rounded-3xl"
                          style={{ width: `${revenueMetrics.conversionRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Retención</span>
                        <span className="font-semibold">{revenueMetrics.retentionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-3xl h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-3xl"
                          style={{ width: `${revenueMetrics.retentionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Other tabs would be implemented similarly */}
          {(activeTab === 'clients' || activeTab === 'marketing' || activeTab === 'forecast') && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {activeTab === 'clients' ? 'Analíticas de Clientes' :
                 activeTab === 'marketing' ? 'Métricas de Marketing' : 'Pronósticos IA'}
              </h3>
              <p className="text-gray-600">Funcionalidad en desarrollo.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}