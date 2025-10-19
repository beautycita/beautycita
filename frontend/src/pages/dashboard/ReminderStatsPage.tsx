import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ReminderStat {
  date: string
  total_scheduled: number
  sent: number
  pending: number
  failed: number
  cancelled: number
}

interface ReminderStatsData {
  period: {
    start: string
    end: string
  }
  stats: ReminderStat[]
}

const ReminderStatsPage: React.FC = () => {
  const [statsData, setStatsData] = useState<ReminderStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchReminderStats()
  }, [dateRange])

  const fetchReminderStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('beautycita-auth-token')

      const response = await fetch('/api/dashboard/reminder-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatsData(data.data)
      }
    } catch (error) {
      console.error('Error fetching reminder stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    if (!statsData?.stats) return { total: 0, sent: 0, pending: 0, failed: 0, cancelled: 0 }

    return statsData.stats.reduce((acc, stat) => ({
      total: acc.total + Number(stat.total_scheduled),
      sent: acc.sent + Number(stat.sent),
      pending: acc.pending + Number(stat.pending),
      failed: acc.failed + Number(stat.failed),
      cancelled: acc.cancelled + Number(stat.cancelled)
    }), { total: 0, sent: 0, pending: 0, failed: 0, cancelled: 0 })
  }

  const totals = calculateTotals()
  const successRate = totals.total > 0 ? ((totals.sent / totals.total) * 100).toFixed(1) : '0'

  const chartData = {
    labels: statsData?.stats.map(stat => {
      const date = new Date(stat.date)
      return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
    }).reverse() || [],
    datasets: [
      {
        label: 'Enviados',
        data: statsData?.stats.map(s => s.sent).reverse() || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Pendientes',
        data: statsData?.stats.map(s => s.pending).reverse() || [],
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Fallidos',
        data: statsData?.stats.map(s => s.failed).reverse() || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📱 Estadísticas de Recordatorios SMS
          </h1>
          <p className="text-gray-600">
            Monitorea el rendimiento de tus notificaciones automáticas
          </p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <BellAlertIcon className="h-8 w-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold mb-1">{totals.total}</div>
            <div className="text-sm opacity-90">Total Programados</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <CheckCircleIcon className="h-8 w-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold mb-1">{totals.sent}</div>
            <div className="text-sm opacity-90">Enviados</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <ClockIcon className="h-8 w-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold mb-1">{totals.pending}</div>
            <div className="text-sm opacity-90">Pendientes</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <XCircleIcon className="h-8 w-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold mb-1">{totals.failed}</div>
            <div className="text-sm opacity-90">Fallidos</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <ChartBarIcon className="h-8 w-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold mb-1">{successRate}%</div>
            <div className="text-sm opacity-90">Tasa de Éxito</div>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Tendencia de Recordatorios
          </h2>
          <Line data={chartData} options={chartOptions} />
        </motion.div>

        {/* Detailed Stats Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Desglose por Fecha
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Programados</th>
                  <th className="text-center py-3 px-4 font-semibold text-green-600">Enviados</th>
                  <th className="text-center py-3 px-4 font-semibold text-yellow-600">Pendientes</th>
                  <th className="text-center py-3 px-4 font-semibold text-red-600">Fallidos</th>
                  <th className="text-center py-3 px-4 font-semibold text-purple-600">Cancelados</th>
                </tr>
              </thead>
              <tbody>
                {statsData?.stats.slice().reverse().map((stat, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(stat.date).toLocaleDateString('es-MX', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="text-center py-3 px-4 font-semibold">{stat.total_scheduled}</td>
                    <td className="text-center py-3 px-4 text-green-600 font-semibold">{stat.sent}</td>
                    <td className="text-center py-3 px-4 text-yellow-600 font-semibold">{stat.pending}</td>
                    <td className="text-center py-3 px-4 text-red-600 font-semibold">{stat.failed}</td>
                    <td className="text-center py-3 px-4 text-purple-600 font-semibold">{stat.cancelled}</td>
                  </tr>
                ))}
                {(!statsData?.stats || statsData.stats.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No hay datos de recordatorios para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ReminderStatsPage