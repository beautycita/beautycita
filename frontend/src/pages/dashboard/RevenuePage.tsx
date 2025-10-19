import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { apiClient } from '../../services/api'
import toast from 'react-hot-toast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

interface RevenueData {
  period: string
  totalRevenue: string
  totalBookings: number
  pendingRevenue: string
  revenueByDay: Array<{
    date: string
    revenue: string
    bookingCount: number
  }>
  revenueByService: Array<{
    serviceName: string
    revenue: string
    bookingCount: number
  }>
}

export default function RevenuePage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [previousRevenue, setPreviousRevenue] = useState<string>('0')

  useEffect(() => {
    loadRevenueData()
  }, [period])

  const loadRevenueData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/dashboard/stylist/revenue?period=${period}`)

      if (response.data.success) {
        setRevenueData(response.data.data)

        // Load previous period for comparison
        const prevPeriod = period === 'week' ? 'week' : period === 'month' ? 'month' : 'year'
        // You could fetch previous period data here for comparison
      }
    } catch (error) {
      console.error('Error loading revenue data:', error)
      toast.error('Error al cargar datos de ingresos')
    } finally {
      setLoading(false)
    }
  }

  const calculateGrowth = () => {
    if (!revenueData || !previousRevenue) return 0
    const current = parseFloat(revenueData.totalRevenue)
    const previous = parseFloat(previousRevenue)
    if (previous === 0) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const growth = parseFloat(calculateGrowth())

  // Prepare chart data
  const lineChartData = {
    labels: revenueData?.revenueByDay.map(day => {
      const date = new Date(day.date)
      return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
    }) || [],
    datasets: [
      {
        label: 'Ingresos ($)',
        data: revenueData?.revenueByDay.map(day => parseFloat(day.revenue)) || [],
        borderColor: 'rgb(255, 0, 128)',
        backgroundColor: 'rgba(255, 0, 128, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(255, 0, 128)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  }

  const barChartData = {
    labels: revenueData?.revenueByService.map(s => s.serviceName) || [],
    datasets: [
      {
        label: 'Ingresos por Servicio ($)',
        data: revenueData?.revenueByService.map(s => parseFloat(s.revenue)) || [],
        backgroundColor: [
          'rgba(255, 0, 128, 0.8)',
          'rgba(128, 0, 255, 0.8)',
          'rgba(0, 245, 255, 0.8)',
          'rgba(6, 255, 165, 0.8)',
          'rgba(255, 190, 11, 0.8)',
          'rgba(131, 56, 236, 0.8)'
        ],
        borderRadius: 8,
        borderWidth: 0
      }
    ]
  }

  const doughnutChartData = {
    labels: revenueData?.revenueByService.map(s => s.serviceName) || [],
    datasets: [
      {
        data: revenueData?.revenueByService.map(s => parseFloat(s.revenue)) || [],
        backgroundColor: [
          '#ff0080',
          '#8000ff',
          '#00f5ff',
          '#06ffa5',
          '#ffbe0b',
          '#8338ec'
        ],
        borderWidth: 0,
        hoverOffset: 10
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 12
          },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 13,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString()
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 12
          },
          padding: 15,
          usePointStyle: true,
          generateLabels: (chart: any) => {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i]
                return {
                  text: `${label}: $${parseFloat(value).toLocaleString()}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                }
              })
            }
            return []
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: $${value.toLocaleString()} (${percentage}%)`
          }
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2 flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 mr-3 text-green-600" />
              Análisis de Ingresos
            </h1>
            <p className="text-gray-600">
              Visualiza y analiza tus ganancias
            </p>
          </motion.div>
        </div>

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center space-x-3 mb-8"
        >
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              period === 'week'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/50'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              period === 'month'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/50'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              period === 'year'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/50'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Año
          </button>
        </motion.div>

        {/* Revenue Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Total Revenue Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 p-6 text-white shadow-xl shadow-pink-500/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <CurrencyDollarIcon className="h-10 w-10 text-white/90" />
                {growth !== 0 && (
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                    growth > 0 ? 'bg-green-500/30' : 'bg-red-500/30'
                  }`}>
                    {growth > 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{Math.abs(growth)}%</span>
                  </div>
                )}
              </div>
              <h3 className="text-white/80 text-sm font-medium mb-1">Ingresos Totales</h3>
              <p className="text-4xl font-bold">${parseFloat(revenueData?.totalRevenue || '0').toLocaleString()}</p>
              <p className="text-white/70 text-sm mt-2">
                {revenueData?.totalBookings} citas completadas
              </p>
            </div>
          </div>

          {/* Pending Revenue Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white shadow-xl shadow-blue-500/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <ClockIcon className="h-10 w-10 text-white/90 mb-4" />
              <h3 className="text-white/80 text-sm font-medium mb-1">Ingresos Pendientes</h3>
              <p className="text-4xl font-bold">${parseFloat(revenueData?.pendingRevenue || '0').toLocaleString()}</p>
              <p className="text-white/70 text-sm mt-2">
                Citas confirmadas
              </p>
            </div>
          </div>

          {/* Average per Booking */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-xl shadow-green-500/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <ChartBarIcon className="h-10 w-10 text-white/90 mb-4" />
              <h3 className="text-white/80 text-sm font-medium mb-1">Promedio por Cita</h3>
              <p className="text-4xl font-bold">
                ${revenueData && revenueData.totalBookings > 0
                  ? (parseFloat(revenueData.totalRevenue) / revenueData.totalBookings).toFixed(0)
                  : '0'
                }
              </p>
              <p className="text-white/70 text-sm mt-2">
                Ingreso medio
              </p>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Line Chart - Revenue Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card"
          >
            <div className="card-header">
              <h3 className="text-lg font-bold text-gray-900">Ingresos por Día</h3>
              <p className="text-sm text-gray-600 mt-1">Tendencia de ingresos en el período</p>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <Line data={lineChartData} options={chartOptions} />
              </div>
            </div>
          </motion.div>

          {/* Doughnut Chart - Revenue by Service */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="card"
          >
            <div className="card-header">
              <h3 className="text-lg font-bold text-gray-900">Distribución por Servicio</h3>
              <p className="text-sm text-gray-600 mt-1">Porcentaje de ingresos por servicio</p>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <Doughnut data={doughnutChartData} options={doughnutOptions} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bar Chart - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-bold text-gray-900">Ingresos por Servicio</h3>
            <p className="text-sm text-gray-600 mt-1">Comparación de servicios más rentables</p>
          </div>
          <div className="card-body">
            <div style={{ height: '400px' }}>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>
        </motion.div>

        {/* Service Details Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="card mt-8"
        >
          <div className="card-header">
            <h3 className="text-lg font-bold text-gray-900">Detalles por Servicio</h3>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Citas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingresos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Promedio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueData?.revenueByService.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: doughnutChartData.datasets[0].backgroundColor[index] }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">{service.serviceName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {service.bookingCount} citas
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      ${parseFloat(service.revenue).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${(parseFloat(service.revenue) / service.bookingCount).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}