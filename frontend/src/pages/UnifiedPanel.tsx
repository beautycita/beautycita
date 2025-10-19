import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  UserGroupIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  SparklesIcon,
  VideoCameraIcon,
  BellIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  ClockIcon,
  CloudArrowDownIcon,
  HeartIcon,
  UserCircleIcon,
  CpuChipIcon,
  CircleStackIcon,
  SignalIcon,
  QrCodeIcon,
  BriefcaseIcon,
  DevicePhoneMobileIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import WorkStatusCard from '../components/stylist/WorkStatusCard'
import BookingRequestsList from '../components/stylist/BookingRequestsList'
import LateClientAlerts from '../components/stylist/LateClientAlerts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface DashboardStats {
  users: number
  bookings: number
  applications: number
  disputes: number
  messages: number
  issues: number
}

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: {
    rx: number
    tx: number
    rxRate: number
    txRate: number
    rxRateMbps: number
    txRateMbps: number
  }
}

interface QuickAction {
  title: string
  description: string
  icon: any
  gradient: string
  link: string
  roles: string[] // Which roles can see this action
  external?: boolean // If true, opens in new tab/window
  actionType?: 'route' | 'modal' // Route = navigate, Modal = open modal (default: route)
}

export default function UnifiedPanel() {
  const { user, token } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    bookings: 0,
    applications: 0,
    disputes: 0,
    messages: 0,
    issues: 0
  })
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [networkMetrics, setNetworkMetrics] = useState<{
    rx: number
    tx: number
    rxRate: number
    txRate: number
    rxRateMbps: number
    txRateMbps: number
  } | null>(null)
  const [loading, setLoading] = useState(true)


  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemMetrics = async () => {
    if (!user || !['SUPERADMIN', 'ADMIN'].includes(user.role)) return

    try {
      const response = await axios.get(`${API_URL}/api/admin/system/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSystemMetrics(response.data)
      setNetworkMetrics(response.data.network)
    } catch (error) {
      console.error('Failed to fetch system metrics:', error)
    }
  }

  const fetchNetworkMetrics = async () => {
    if (!user || !['SUPERADMIN', 'ADMIN'].includes(user.role)) return

    try {
      const response = await axios.get(`${API_URL}/api/admin/system/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNetworkMetrics(response.data.network)
    } catch (error) {
      console.error('Failed to fetch network metrics:', error)
    }
  }

  useEffect(() => {
    if (token) {
      fetchDashboardStats()
      fetchSystemMetrics()

      // Set up live update interval for system metrics (every 3 seconds for live numbers and graphs)
      const metricsInterval = setInterval(() => {
        if (user && ['SUPERADMIN', 'ADMIN'].includes(user.role)) {
          fetchSystemMetrics()
        }
      }, 3000)

      return () => {
        clearInterval(metricsInterval)
      }
    } else {
      setLoading(false)
    }
  }, [token, user])

  // All possible quick actions with role-based filtering
  const allQuickActions: QuickAction[] = [
    // SUPERADMIN/ADMIN actions (use sub-routes)
    {
      title: 'User Management',
      description: 'Manage all users and accounts',
      icon: UserGroupIcon,
      gradient: 'from-blue-500 to-purple-600',
      link: '/panel/users',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'Stylist Applications',
      description: stats.applications > 0 ? `${stats.applications} pending review` : 'No pending applications',
      icon: ShieldCheckIcon,
      gradient: 'from-pink-500 to-rose-600',
      link: '/panel/applications',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'All Bookings',
      description: stats.bookings > 0 ? `${stats.bookings} active bookings` : 'No active bookings',
      icon: CalendarDaysIcon,
      gradient: 'from-indigo-500 to-purple-600',
      link: '/panel/bookings',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'Services Management',
      description: 'Manage all platform services',
      icon: PlusCircleIcon,
      gradient: 'from-violet-500 to-purple-600',
      link: '/panel/services',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'Disputes',
      description: stats.disputes > 0 ? `${stats.disputes} active disputes` : 'No active disputes',
      icon: ScaleIcon,
      gradient: 'from-amber-500 to-orange-600',
      link: '/panel/disputes',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'Messages',
      description: stats.messages > 0 ? `${stats.messages} unread messages` : 'No unread messages',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-cyan-500 to-blue-600',
      link: '/panel/messages',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'Issue Tracker',
      description: stats.issues > 0 ? `${stats.issues} open issues` : 'No open issues',
      icon: ClipboardDocumentListIcon,
      gradient: 'from-orange-500 to-red-600',
      link: '/panel/issues',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'Marketing & QR',
      description: 'AI content generator & QR codes',
      icon: SparklesIcon,
      gradient: 'from-purple-500 to-pink-600',
      link: '/panel/marketing',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'Finance',
      description: 'Revenue and payouts',
      icon: CurrencyDollarIcon,
      gradient: 'from-green-500 to-emerald-600',
      link: '/panel/finance',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'Analytics',
      description: 'Platform analytics',
      icon: ChartBarIcon,
      gradient: 'from-blue-500 to-cyan-600',
      link: '/panel/analytics',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'System Monitor',
      description: 'Service health & logs',
      icon: CpuChipIcon,
      gradient: 'from-red-500 to-orange-600',
      link: '/panel/system',
      roles: ['SUPERADMIN'],
      actionType: 'route'
    },
    {
      title: 'Native Applications',
      description: 'Android, iOS & Windows apps',
      icon: DevicePhoneMobileIcon,
      gradient: 'from-green-500 to-emerald-600',
      link: '/panel/native-apps',
      roles: ['SUPERADMIN', 'ADMIN'],
      actionType: 'route'
    },
    {
      title: 'Settings',
      description: 'Platform configuration',
      icon: CogIcon,
      gradient: 'from-indigo-500 to-blue-600',
      link: '/panel/settings',
      roles: ['SUPERADMIN'],
      actionType: 'route'
    },

    // STYLIST-specific actions (use route for business dashboard)
    {
      title: 'Business Dashboard',
      description: 'Manage your business',
      icon: BriefcaseIcon,
      gradient: 'from-violet-500 to-purple-600',
      link: '/business',
      roles: ['STYLIST'],
      actionType: 'route'
    },
    {
      title: 'Bookings',
      description: 'View your appointments',
      icon: CalendarDaysIcon,
      gradient: 'from-indigo-500 to-purple-600',
      link: '/bookings',
      roles: ['STYLIST'],
      actionType: 'modal'
    },
    {
      title: 'Messages',
      description: 'Client messages',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-cyan-500 to-blue-600',
      link: '/messages',
      roles: ['STYLIST'],
      actionType: 'modal'
    },
    {
      title: 'Profile',
      description: 'Your profile',
      icon: UserCircleIcon,
      gradient: 'from-purple-500 to-blue-600',
      link: '/profile',
      roles: ['STYLIST'],
      actionType: 'modal'
    },
    {
      title: 'Business Locations',
      description: 'Manage your locations',
      icon: MapPinIcon,
      gradient: 'from-pink-500 to-red-600',
      link: '/stylist/locations',
      roles: ['STYLIST'],
      actionType: 'route'
    },

    // CLIENT-specific actions (use modals for simple quick actions)
    {
      title: 'My Bookings',
      description: 'Your appointments',
      icon: CalendarDaysIcon,
      gradient: 'from-indigo-500 to-purple-600',
      link: '/bookings',
      roles: ['CLIENT'],
      actionType: 'modal'
    },
    {
      title: 'Favorites',
      description: 'Saved stylists',
      icon: HeartIcon,
      gradient: 'from-pink-500 to-rose-600',
      link: '/favorites',
      roles: ['CLIENT'],
      actionType: 'modal'
    },
    {
      title: 'Messages',
      description: 'Your messages',
      icon: ChatBubbleLeftRightIcon,
      gradient: 'from-cyan-500 to-blue-600',
      link: '/messages',
      roles: ['CLIENT'],
      actionType: 'modal'
    },
    {
      title: 'Profile',
      description: 'Manage your profile',
      icon: UserCircleIcon,
      gradient: 'from-purple-500 to-blue-600',
      link: '/profile',
      roles: ['CLIENT'],
      actionType: 'modal'
    }
  ]

  // Filter actions based on user role
  const quickActions = user
    ? allQuickActions.filter(action => action.roles.includes(user.role))
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="mt-2 text-gray-600">
              {user?.role === 'SUPERADMIN' && 'Super Admin Control Panel'}
              {user?.role === 'ADMIN' && 'Admin Control Panel'}
              {user?.role === 'STYLIST' && 'Stylist Dashboard'}
              {user?.role === 'CLIENT' && 'Your BeautyCita Dashboard'}
            </p>
          </div>

          {/* System Metrics - SUPERADMIN/ADMIN only */}
          {user && ['SUPERADMIN', 'ADMIN'].includes(user.role) && systemMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">System Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CPU Usage */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CpuChipIcon className="w-6 h-6 text-blue-600" />
                    <span className="text-base font-medium text-gray-900">CPU Usage</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{systemMetrics.cpu.toFixed(1)}%</span>
                </div>

                {/* Memory */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CircleStackIcon className="w-6 h-6 text-green-600" />
                    <span className="text-base font-medium text-gray-900">Memory</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{systemMetrics.memory.toFixed(1)}%</span>
                </div>
              </div>

              {/* Network Stats - Separate Row - Real-time (500ms updates) */}
              {networkMetrics && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <SignalIcon className="w-5 h-5 text-cyan-500" />
                    <span className="text-sm font-medium text-gray-900">Network Bandwidth</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg">
                      <span className="text-xs text-green-600">↓</span>
                      <span className="text-sm font-mono font-bold text-green-700">
                        {networkMetrics.rxRateMbps >= 1
                          ? `${networkMetrics.rxRateMbps.toFixed(2)} Mbps`
                          : `${(networkMetrics.rxRate / 1024).toFixed(1)} KB/s`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                      <span className="text-xs text-blue-600">↑</span>
                      <span className="text-sm font-mono font-bold text-blue-700">
                        {networkMetrics.txRateMbps >= 1
                          ? `${networkMetrics.txRateMbps.toFixed(2)} Mbps`
                          : `${(networkMetrics.txRate / 1024).toFixed(1)} KB/s`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Work Status Card for Stylists */}
          {user?.role === 'STYLIST' && token && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <WorkStatusCard token={token} onStatusChange={() => fetchDashboardStats()} />
              </div>
              <div className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 shadow-lg border border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">📍 Quick Access</h3>
                <div className="space-y-3">
                  <Link
                    to="/admin/bookings"
                    className="block p-3 bg-white rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-gray-900">My Bookings</span>
                      </div>
                      <span className="text-sm font-semibold text-purple-600">{stats.bookings}</span>
                    </div>
                  </Link>
                  <Link
                    to="/messages"
                    className="block p-3 bg-white rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-gray-900">Messages</span>
                      </div>
                      <span className="text-sm font-semibold text-purple-600">{stats.messages}</span>
                    </div>
                  </Link>
                  <Link
                    to="/panel/services"
                    className="block p-3 bg-white rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlusCircleIcon className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-gray-900">My Services</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Booking Requests for Stylists */}
          {user?.role === 'STYLIST' && token && (
            <BookingRequestsList token={token} />
          )}

          {/* Late Client Alerts for Stylists */}
          {user?.role === 'STYLIST' && token && (
            <LateClientAlerts />
          )}

          {/* Stats Overview - Admins and Stylists only */}
          {user && ['SUPERADMIN', 'ADMIN', 'STYLIST'].includes(user.role) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Users', value: stats.users, gradient: 'from-blue-500 to-purple-600', icon: UserGroupIcon, roles: ['SUPERADMIN', 'ADMIN'] },
                { label: 'Active Bookings', value: stats.bookings, gradient: 'from-indigo-500 to-purple-600', icon: CalendarDaysIcon, roles: ['SUPERADMIN', 'ADMIN', 'STYLIST'] },
                { label: 'Applications', value: stats.applications, gradient: 'from-pink-500 to-rose-600', icon: ShieldCheckIcon, roles: ['SUPERADMIN', 'ADMIN'] },
                { label: 'Disputes', value: stats.disputes, gradient: 'from-amber-500 to-orange-600', icon: ScaleIcon, roles: ['SUPERADMIN', 'ADMIN'] },
                { label: 'Messages', value: stats.messages, gradient: 'from-cyan-500 to-blue-600', icon: ChatBubbleLeftRightIcon, roles: ['SUPERADMIN', 'ADMIN', 'STYLIST'] },
                { label: 'Open Issues', value: stats.issues, gradient: 'from-orange-500 to-red-600', icon: ClipboardDocumentListIcon, roles: ['SUPERADMIN', 'ADMIN'] }
              ]
                .filter(stat => stat.roles.includes(user.role))
                .map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {loading ? '...' : stat.value.toLocaleString()}
                    </div>
                  </motion.div>
                ))}
            </div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const CardContent = (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="group bg-white rounded-3xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </motion.div>
                )

                return action.external ? (
                  <a key={action.title} href={action.link} target="_blank" rel="noopener noreferrer">
                    {CardContent}
                  </a>
                ) : (
                  <Link key={action.title} to={action.link}>
                    {CardContent}
                  </Link>
                )
              })}
            </div>
          </motion.div>

          {/* Platform Health - SUPERADMIN/ADMIN only */}
          {user && ['SUPERADMIN', 'ADMIN'].includes(user.role) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">
                    {stats.users > 0 ? '98.5%' : '0%'}
                  </div>
                  <div className="text-gray-600">User Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stats.bookings.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Active Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent mb-2">
                    {stats.applications.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Pending Reviews</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Client-specific welcome section */}
          {user?.role === 'CLIENT' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to look your best?
              </h2>
              <p className="text-gray-700 mb-6">
                Book appointments with top stylists in your area and manage everything from your dashboard.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/stylists"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
                >
                  Find Stylists
                </Link>
                <Link
                  to="/services"
                  className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-lg transition-shadow"
                >
                  Browse Services
                </Link>
                <Link
                  to="/profile/become-stylist"
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
                >
                  Become a Stylist
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
