import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  CpuChipIcon,
  ArrowLeftIcon,
  ServerIcon,
  CircleStackIcon,
  SignalIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || ''

interface SystemHealth {
  postgres: { status: string; responseTime?: number }
  redis: { status: string; responseTime?: number }
  nginx: { status: string }
  btcpay: { status: string }
}

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: { rx: number; tx: number }
}

interface MonitoringStack {
  prometheus: { status: string; message: string; url?: string }
  grafana: { status: string; message: string; url?: string }
  alertmanager: { status: string; message: string; url?: string }
  loki: { status: string; message: string }
  nodeExporter: { status: string; message: string }
}

interface ServiceCredits {
  twilio: { balance: string | number; status: string; currency?: string; error?: string; apiKeyValid?: boolean; usedBy?: string; info?: string; actualBalance?: number }
  anthropic: { balance: string; status: string; info?: string; apiKeyValid?: boolean; error?: string; usedBy?: string }
  openai: { balance: string; status: string; info?: string; apiKeyValid?: boolean; modelsAvailable?: number; error?: string; usedBy?: string }
}

export default function PanelSystem() {
  const { token } = useAuthStore()
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [monitoringStack, setMonitoringStack] = useState<MonitoringStack | null>(null)
  const [credits, setCredits] = useState<ServiceCredits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemData()
  }, [])

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      const [healthRes, metricsRes, monitoringRes, creditsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/system/health`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/system/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/system/monitoring-stack`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/system/credits`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      setHealth(healthRes.data)
      setMetrics(metricsRes.data)
      setMonitoringStack(monitoringRes.data)
      setCredits(creditsRes.data)
    } catch (error) {
      console.error('Failed to fetch system data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    return status === 'healthy' || status === 'online' || status === 'connected'
      ? 'bg-green-100 text-green-800'
      : status === 'degraded' || status === 'not_installed' || status === 'api_unavailable'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'not_configured'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-red-100 text-red-800'
  }

  const getMetricColor = (value: number) => {
    if (value < 60) return 'bg-green-500'
    if (value < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link to="/panel" className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                System Monitor
              </h1>
              <p className="mt-2 text-gray-600">Service health & system metrics (SUPERADMIN)</p>
            </div>
          </div>

          {loading && !metrics ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center text-gray-500">
              Loading system data...
            </div>
          ) : (
            <>
              {/* System Metrics */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                    <CpuChipIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">System Metrics</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* CPU */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                      <span className="text-sm font-semibold text-gray-900">{metrics?.cpu?.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getMetricColor(metrics?.cpu || 0)} transition-all duration-500`}
                        style={{ width: `${metrics?.cpu || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                      <span className="text-sm font-semibold text-gray-900">{metrics?.memory?.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getMetricColor(metrics?.memory || 0)} transition-all duration-500`}
                        style={{ width: `${metrics?.memory || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Disk */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Disk Usage</span>
                      <span className="text-sm font-semibold text-gray-900">{metrics?.disk?.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getMetricColor(metrics?.disk || 0)} transition-all duration-500`}
                        style={{ width: `${metrics?.disk || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Network */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <SignalIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Network RX</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {((metrics?.network?.rx || 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <SignalIcon className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Network TX</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {((metrics?.network?.tx || 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Health */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <ServerIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Service Health</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* PostgreSQL */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CircleStackIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">PostgreSQL</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(health?.postgres?.status || 'unknown')}`}>
                        {health?.postgres?.status || 'Unknown'}
                      </span>
                    </div>
                    {health?.postgres?.responseTime && (
                      <p className="text-xs text-gray-500">Response: {health.postgres.responseTime}ms</p>
                    )}
                  </motion.div>

                  {/* Redis */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ServerIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Redis</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(health?.redis?.status || 'unknown')}`}>
                        {health?.redis?.status || 'Unknown'}
                      </span>
                    </div>
                    {health?.redis?.responseTime && (
                      <p className="text-xs text-gray-500">Response: {health.redis.responseTime}ms</p>
                    )}
                  </motion.div>

                  {/* Nginx */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ServerIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Nginx</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(health?.nginx?.status || 'unknown')}`}>
                        {health?.nginx?.status || 'Unknown'}
                      </span>
                    </div>
                  </motion.div>

                  {/* BTCPay */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ServerIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">BTCPay</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(health?.btcpay?.status || 'unknown')}`}>
                        {health?.btcpay?.status || 'Unknown'}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Monitoring Stack */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <SignalIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Monitoring Stack</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Prometheus */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ServerIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Prometheus</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(monitoringStack?.prometheus?.status || 'unknown')}`}>
                        {monitoringStack?.prometheus?.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{monitoringStack?.prometheus?.message}</p>
                    {monitoringStack?.prometheus?.url && (
                      <a href={monitoringStack.prometheus.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                        Open Dashboard →
                      </a>
                    )}
                  </motion.div>

                  {/* Grafana */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ServerIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Grafana</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(monitoringStack?.grafana?.status || 'unknown')}`}>
                        {monitoringStack?.grafana?.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{monitoringStack?.grafana?.message}</p>
                    {monitoringStack?.grafana?.url && (
                      <a href={monitoringStack.grafana.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                        Open Dashboard →
                      </a>
                    )}
                  </motion.div>

                  {/* AlertManager */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ServerIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">AlertManager</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(monitoringStack?.alertmanager?.status || 'unknown')}`}>
                        {monitoringStack?.alertmanager?.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{monitoringStack?.alertmanager?.message}</p>
                    {monitoringStack?.alertmanager?.url && (
                      <a href={monitoringStack.alertmanager.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                        Open Dashboard →
                      </a>
                    )}
                  </motion.div>

                  {/* Loki */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CircleStackIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Loki</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(monitoringStack?.loki?.status || 'unknown')}`}>
                        {monitoringStack?.loki?.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{monitoringStack?.loki?.message}</p>
                  </motion.div>

                  {/* Node Exporter */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CpuChipIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Node Exporter</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(monitoringStack?.nodeExporter?.status || 'unknown')}`}>
                        {monitoringStack?.nodeExporter?.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{monitoringStack?.nodeExporter?.message}</p>
                  </motion.div>
                </div>
              </div>

              {/* Service Credits */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <ServerIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Service Credits</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Twilio */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">Twilio SMS</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(credits?.twilio?.status || 'unknown')}`}>
                        {credits?.twilio?.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-lg font-bold text-gray-900">{credits?.twilio?.balance || 'N/A'}</p>
                      {credits?.twilio?.apiKeyValid && (
                        <p className="text-xs text-green-600 font-medium mt-1">✓ API Key Valid</p>
                      )}
                      {credits?.twilio?.usedBy && (
                        <p className="text-xs text-gray-600 mt-1">{credits.twilio.usedBy}</p>
                      )}
                      {credits?.twilio?.actualBalance !== undefined && (
                        <p className="text-2xl font-bold text-blue-600 mt-2">
                          ${credits.twilio.actualBalance.toFixed(2)} {credits.twilio.currency}
                        </p>
                      )}
                      {credits?.twilio?.error && (
                        <p className="text-xs text-red-600 mt-2">{credits.twilio.error}</p>
                      )}
                      <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 block">
                        Check Console →
                      </a>
                    </div>
                  </motion.div>

                  {/* Anthropic */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">Anthropic</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(credits?.anthropic?.status || 'unknown')}`}>
                        {credits?.anthropic?.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-lg font-bold text-gray-900">{credits?.anthropic?.balance || 'N/A'}</p>
                      {credits?.anthropic?.apiKeyValid && (
                        <p className="text-xs text-green-600 font-medium mt-1">✓ API Key Valid</p>
                      )}
                      {credits?.anthropic?.error && (
                        <p className="text-xs text-red-600 mt-1">{credits.anthropic.error}</p>
                      )}
                      {credits?.anthropic?.info && (
                        <p className="text-xs text-gray-600 mt-2">{credits.anthropic.info}</p>
                      )}
                      <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 block">
                        Check Balance →
                      </a>
                    </div>
                  </motion.div>

                  {/* OpenAI */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">OpenAI</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(credits?.openai?.status || 'unknown')}`}>
                        {credits?.openai?.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-lg font-bold text-gray-900">{credits?.openai?.balance || 'N/A'}</p>
                      {credits?.openai?.apiKeyValid && (
                        <p className="text-xs text-green-600 font-medium mt-1">✓ API Key Valid ({credits.openai.modelsAvailable} models)</p>
                      )}
                      {credits?.openai?.error && (
                        <p className="text-xs text-red-600 mt-1">{credits.openai.error}</p>
                      )}
                      {credits?.openai?.info && (
                        <p className="text-xs text-gray-600 mt-2">{credits.openai.info}</p>
                      )}
                      <a href="https://platform.openai.com/settings/organization/billing/overview" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 block">
                        Check Balance →
                      </a>
                    </div>
                  </motion.div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
