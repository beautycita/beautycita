import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  StarIcon,
  ShieldCheckIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  ScaleIcon,
  BriefcaseIcon,
  SparklesIcon,
  BellIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import OnboardingProgressBanner from '../../components/dashboard/OnboardingProgressBanner'
import StylistOnboardingWizard from '../../components/dashboard/StylistOnboardingWizard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface DashboardStats {
  totalBookings?: number
  upcomingBookings?: number
  totalRevenue?: number
  averageRating?: number
  totalUsers?: number
  totalStylists?: number
  totalClients?: number
  pendingPayouts?: number
  favoriteStylists?: number
  totalSpent?: number
  completedBookings?: number
  openDisputes?: number
  totalReviews?: number
  todayAppointments?: number
  weekAppointments?: number
  totalClientsServed?: number
  pendingBookings?: number
}

interface SystemHealth {
  database: { status: string; message: string }
  redis: { status: string; message: string }
  nginx: { status: string; message: string }
  backend: { status: string; message: string }
  btcpay: { status: string; message: string }
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  icon: string
}

export default function UnifiedDashboard() {
  const { user, stylist, client, updateProfile } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [stats, setStats] = useState<DashboardStats>({})
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingProgress, setOnboardingProgress] = useState<any>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])

  const userRole = user?.role?.toUpperCase() || 'CLIENT'
  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(userRole)
  const isSuperAdmin = userRole === 'SUPERADMIN'
  const isStylist = userRole === 'STYLIST'
  const isClient = userRole === 'CLIENT'

  const userStatus = user?.user_status
  const needsOnboarding = isStylist && (userStatus === 'PENDING_ONBOARDING' || searchParams.get('onboarding') === 'start')
  const pendingApproval = isStylist && (userStatus === 'PENDING_VERIFICATION' || userStatus === 'PENDING_APPROVAL')

  // Dark mode
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
  }

  // Check if profile needs completion
  useEffect(() => {
    if (user && user.profileComplete === false) {
      setShowProfileModal(true)
    }
  }, [user])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Check onboarding status for stylists
        if (isStylist) {
          try {
            const onboardingResponse = await axios.get(`${API_URL}/api/onboarding/status`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            })

            if (onboardingResponse.data.success) {
              setOnboardingProgress(onboardingResponse.data.progress)

              if (needsOnboarding) {
                setShowOnboarding(true)
              }
            }
          } catch (error) {
            console.log('Onboarding status not available yet')
          }
        }

        // Fetch role-specific stats
        if (isAdmin) {
          try {
            const statsResponse = await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            })

            if (statsResponse.data.success) {
              const data = statsResponse.data.data
              setStats({
                totalUsers: data.users.total_users || 0,
                totalStylists: data.users.total_stylists || 0,
                totalClients: data.users.total_clients || 0,
                totalBookings: data.bookings.total_bookings || 0,
                upcomingBookings: data.bookings.upcoming_bookings || 0,
                completedBookings: data.bookings.completed_bookings || 0,
                totalRevenue: data.revenue.total_revenue || 0,
                pendingPayouts: data.payouts.pending_payouts || 0,
                openDisputes: data.disputes.open_disputes || 0,
                totalReviews: data.reviews.total_reviews || 0,
                averageRating: data.reviews.average_rating || 0
              })
            }

            // Mock activity feed for admins
            setActivities([
              { id: '1', type: 'user', title: 'New Professional Joined', description: 'Maria Garcia registered as a stylist', timestamp: '2 minutes ago', icon: 'user' },
              { id: '2', type: 'booking', title: 'Beauty Service Booked', description: 'Client booked a haircut appointment', timestamp: '15 minutes ago', icon: 'calendar' },
              { id: '3', type: 'review', title: '5-Star Review Received', description: 'Sofia Martinez received excellent feedback', timestamp: '1 hour ago', icon: 'star' }
            ])
          } catch (error) {
            console.error('Failed to fetch admin stats:', error)
          }
        } else {
          try {
            const statsResponse = await axios.get(`${API_URL}/api/analytics/dashboard/${userRole}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
            })

            if (statsResponse.data.success) {
              const data = statsResponse.data.data
              
              if (isStylist) {
                setStats({
                  todayAppointments: data.todayAppointments || 0,
                  weeklyRevenue: data.weeklyRevenue || 0,
                  totalRevenue: data.monthlyRevenue || 0,
                  totalClientsServed: data.clientsServed || 0,
                  averageRating: data.rating || 0
                })
              } else if (isClient) {
                setStats({
                  upcomingBookings: data.upcomingBookings || 0,
                  completedBookings: data.completedBookings || 0,
                  favoriteStylists: data.favoriteStylists || 0
                })
              }
            }
          } catch (error) {
            console.error("Failed to fetch stats:", error)
            setStats({
              totalBookings: 0,
              upcomingBookings: 0,
              completedBookings: 0,
              totalRevenue: 0,
              averageRating: 0,
              favoriteStylists: 0,
              totalSpent: 0,
              todayAppointments: 0,
              weekAppointments: 0,
              totalClientsServed: 0,
              pendingBookings: 0
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [userRole, isStylist, needsOnboarding])

  if (!user) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'} py-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading user information...</p>
        </div>
      </div>
    )
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    window.location.reload()
  }

  if (showOnboarding && needsOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
        <StylistOnboardingWizard
          onComplete={handleOnboardingComplete}
          onExit={() => setShowOnboarding(false)}
        />
      </div>
    )
  }

  const handleProfileCompletion = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profileForm.firstName.trim() || !profileForm.email.trim()) {
      toast.error('Please enter your name and email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(profileForm.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await axios.post(
        `${API_URL}/auth/complete-profile`,
        {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName || '',
          email: profileForm.email
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        }
      )

      if (response.data.success) {
        toast.success('Profile completed! Welcome to BeautyCita')

        if (updateProfile) {
          await updateProfile({
            firstName: profileForm.firstName,
            lastName: profileForm.lastName || '',
            email: profileForm.email,
            profileComplete: true
          })
        }

        setShowProfileModal(false)
      }
    } catch (error: any) {
      console.error('Profile completion error:', error)
      toast.error(error.response?.data?.message || 'Failed to complete profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'}`}>
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-500/10 to-purple-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-purple-600/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Dark Mode Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent`}>
                {isAdmin && 'Admin Dashboard'}
                {isStylist && 'Professional Dashboard'}
                {isClient && 'My Dashboard'}
              </h1>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Welcome back, {user.name || user.email}
              </p>
            </div>

            {/* Dark Mode Toggle */}
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className={`p-3 rounded-3xl backdrop-blur-xl ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/30 border-white/50'} border shadow-lg`}
              >
                {isDarkMode ? (
                  <SunIcon className="h-6 w-6 text-yellow-500" />
                ) : (
                  <MoonIcon className="h-6 w-6 text-purple-600" />
                )}
              </motion.button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg">
              {userRole}
            </span>
            {user.user_status && (
              <span className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-lg ${
                user.user_status === 'APPROVED' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                user.user_status === 'SUSPENDED' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                user.user_status === 'PENDING_ONBOARDING' ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white' :
                user.user_status === 'PENDING_VERIFICATION' ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' :
                user.user_status === 'PENDING_APPROVAL' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' :
                'bg-gradient-to-r from-red-400 to-pink-500 text-white'
              }`}>
                {user.user_status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Onboarding Progress Banner */}
        {isStylist && onboardingProgress && !onboardingProgress.all_steps_completed && (
          <AnimatePresence>
            <OnboardingProgressBanner
              currentStep={onboardingProgress.current_step || 0}
              totalSteps={5}
              progressPercent={onboardingProgress.total_progress_percent || 0}
              nextStepTitle={`Step ${(onboardingProgress.current_step || 0) + 1}`}
              onContinue={() => setShowOnboarding(true)}
              canDismiss={false}
            />
          </AnimatePresence>
        )}

        {/* Pending Approval Banner */}
        {pendingApproval && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 backdrop-blur-xl ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50/50'} border ${isDarkMode ? 'border-yellow-700/50' : 'border-yellow-200'} rounded-3xl p-6 shadow-xl`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-yellow-200' : 'text-yellow-900'} mb-2`}>
                  Profile Under Review
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'} mb-3`}>
                  Thank you for completing your profile! Our team is reviewing your information.
                </p>
                <ul className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'} space-y-1`}>
                  <li className="flex items-center"><CheckCircleIcon className="h-4 w-4 mr-2" /> Profile information submitted</li>
                  <li className="flex items-center"><CheckCircleIcon className="h-4 w-4 mr-2" /> Payment systems being verified</li>
                  <li className="flex items-center"><ClockIcon className="h-4 w-4 mr-2" /> Estimated approval: 24-48 hours</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Suspended Warning */}
        {user.user_status === 'SUSPENDED' && isStylist && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 backdrop-blur-xl ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50/50'} border ${isDarkMode ? 'border-yellow-700/50' : 'border-yellow-200'} rounded-3xl p-6 shadow-xl`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
                  Your account is suspended. You can only access payout requests and bank details.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Blocked Warning */}
        {user.user_status === 'BLOCKED' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 backdrop-blur-xl ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50/50'} border ${isDarkMode ? 'border-red-700/50' : 'border-red-200'} rounded-3xl p-6 shadow-xl`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>
                  Your account has been blocked. Please contact support for assistance.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ADMIN/SUPERADMIN Dashboard */}
        {isAdmin && <SuperAdminDashboard stats={stats} isSuperAdmin={isSuperAdmin} isDarkMode={isDarkMode} activities={activities} />}

        {/* STYLIST Dashboard */}
        {isStylist && user.user_status !== 'SUSPENDED' && (
          <StylistDashboard stats={stats} isDarkMode={isDarkMode} />
        )}

        {/* STYLIST - Suspended Access */}
        {isStylist && user.user_status === 'SUSPENDED' && (
          <div className={`backdrop-blur-xl ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/30 border-white/50'} border rounded-3xl shadow-2xl p-8`}>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Available Actions</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              While your account is suspended, you can only access payout-related features.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickActionCard
                icon={CurrencyDollarIcon}
                title="Payout Requests"
                description="Manage your payouts"
                href="/dashboard/payouts"
                gradient="from-green-400 to-emerald-500"
                isDarkMode={isDarkMode}
              />
              <QuickActionCard
                icon={CogIcon}
                title="Bank Details"
                description="Update payment info"
                href="/dashboard/bank-details"
                gradient="from-blue-400 to-cyan-500"
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {/* CLIENT Dashboard */}
        {isClient && <ClientDashboard stats={stats} isDarkMode={isDarkMode} />}
      </div>

      {/* Profile Completion Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`backdrop-blur-xl ${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} rounded-3xl shadow-2xl p-8 max-w-md w-full border ${isDarkMode ? 'border-gray-700' : 'border-white/50'}`}
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-12 h-12 text-white" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Complete Your Profile
                </h2>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Please provide your name and email to continue
                </p>
              </div>

              <form onSubmit={handleProfileCompletion} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    placeholder="Enter your first name"
                    required
                    className={`w-full px-4 py-3 rounded-2xl border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                    autoFocus
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    placeholder="Enter your last name"
                    className={`w-full px-4 py-3 rounded-2xl border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                    className={`w-full px-4 py-3 rounded-2xl border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                  />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    We'll send a verification email to this address
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Complete Profile</span>
                    </>
                  )}
                </button>
              </form>

              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center mt-4`}>
                Phone verified: {user?.phone}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// SuperAdmin Dashboard Component
interface SuperAdminDashboardProps {
  stats: DashboardStats
  isSuperAdmin: boolean
  isDarkMode: boolean
  activities: Activity[]
}

function SuperAdminDashboard({ stats, isSuperAdmin, isDarkMode, activities }: SuperAdminDashboardProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loadingHealth, setLoadingHealth] = useState(true)
  const [controllingService, setControllingService] = useState<string | null>(null)

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSystemHealth()
    }
  }, [isSuperAdmin])

  const fetchSystemHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/system/health`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      })
      if (response.data.success) {
        setSystemHealth(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    } finally {
      setLoadingHealth(false)
    }
  }

  const controlService = async (service: string, action: string) => {
    try {
      setControllingService(`${service}-${action}`)
      await axios.post(
        `${API_URL}/api/admin/system/service/${service}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      )
      setTimeout(() => fetchSystemHealth(), 2000)
    } catch (error) {
      console.error(`Failed to ${action} ${service}:`, error)
    } finally {
      setControllingService(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'from-green-400 to-emerald-500'
      case 'unhealthy':
        return 'from-red-400 to-pink-500'
      default:
        return 'from-gray-400 to-gray-500'
    }
  }

  return (
    <>
      {/* System Health Monitor - Superadmin Only */}
      {isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/30 border-white/50'} border rounded-3xl shadow-2xl p-6 mb-8`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Health Monitor</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchSystemHealth}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Refresh
            </motion.button>
          </div>

          {loadingHealth ? (
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Checking system health...</p>
          ) : systemHealth ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(systemHealth).map(([service, health]) => (
                <motion.div
                  key={service}
                  whileHover={{ scale: 1.02 }}
                  className={`backdrop-blur-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-white/50'} border ${isDarkMode ? 'border-gray-600' : 'border-white'} rounded-2xl p-4 shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} capitalize`}>{service}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getStatusColor(health.status)} text-white`}>
                      {health.status}
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>{health.message}</p>

                  {['btcpay', 'nginx', 'backend'].includes(service) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => controlService(service, 'restart')}
                        disabled={controllingService === `${service}-restart`}
                        className="flex-1 text-xs px-2 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {controllingService === `${service}-restart` ? '...' : 'Restart'}
                      </button>
                      <button
                        onClick={() => controlService(service, 'stop')}
                        disabled={controllingService === `${service}-stop`}
                        className="flex-1 text-xs px-2 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {controllingService === `${service}-stop` ? '...' : 'Stop'}
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Unable to fetch system health</p>
          )}
        </motion.div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <GlassStatsCard
          icon={UserGroupIcon}
          title="Total Users"
          value={stats.totalUsers || 0}
          gradient="from-purple-400 to-pink-500"
          link="/admin/users"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={CalendarDaysIcon}
          title="Total Bookings"
          value={stats.totalBookings || 0}
          gradient="from-blue-400 to-cyan-500"
          link="/admin/bookings"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={CurrencyDollarIcon}
          title="Total Revenue"
          value={`$${stats.totalRevenue || 0}`}
          gradient="from-green-400 to-emerald-500"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={ScaleIcon}
          title="Open Disputes"
          value={stats.openDisputes || 0}
          gradient="from-yellow-400 to-orange-500"
          link="/admin/disputes"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Activity Feed & BTCPay Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`backdrop-blur-xl ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/30 border-white/50'} border rounded-3xl shadow-2xl p-6`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>
            <BellIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-start gap-4 p-4 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-white/50'}`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${
                  activity.type === 'user' ? 'from-purple-400 to-pink-500' :
                  activity.type === 'booking' ? 'from-blue-400 to-cyan-500' :
                  'from-yellow-400 to-orange-500'
                } flex items-center justify-center`}>
                  {activity.type === 'user' && <UserGroupIcon className="h-5 w-5 text-white" />}
                  {activity.type === 'booking' && <CalendarDaysIcon className="h-5 w-5 text-white" />}
                  {activity.type === 'review' && <StarIcon className="h-5 w-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activity.title}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{activity.description}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>{activity.timestamp}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* BTCPay Statistics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`backdrop-blur-xl ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/30 border-white/50'} border rounded-3xl shadow-2xl p-6`}
        >
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>BTCPay Statistics</h2>
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-white/50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Total Bitcoin Payments</p>
              <p className={`text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent`}>
                0.00 BTC
              </p>
            </div>
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-white/50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Bitcoin Revenue (USD)</p>
              <p className={`text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent`}>
                $0.00
              </p>
            </div>
            <a
              href="/btcpay/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-orange-400 to-yellow-500 text-white rounded-2xl hover:shadow-lg transition-all font-medium"
            >
              <span>View BTCPay Dashboard</span>
              <ArrowRightIcon className="h-5 w-5" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Admin Actions - 6 Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActionCategory
          title="Users & Accounts"
          icon={UserGroupIcon}
          actions={[
            { icon: UserGroupIcon, label: 'All Users', href: '/admin/users' },
            { icon: UserGroupIcon, label: 'Professionals', href: '/admin/users' },
            { icon: ShieldCheckIcon, label: 'Applications', href: '/admin/stylist-applications' },
            { icon: CheckCircleIcon, label: 'Verification Queue', href: '/admin/users' }
          ]}
          gradient="from-purple-400 to-pink-500"
          isDarkMode={isDarkMode}
        />

        <ActionCategory
          title="Bookings & Services"
          icon={CalendarDaysIcon}
          actions={[
            { icon: CalendarDaysIcon, label: 'All Bookings', href: '/admin/bookings' },
            { icon: PlusIcon, label: 'Services Catalog', href: '/admin/services' },
            { icon: VideoCameraIcon, label: 'Video Consultations', href: '/admin/video' }
          ]}
          gradient="from-blue-400 to-cyan-500"
          isDarkMode={isDarkMode}
        />

        <ActionCategory
          title="Payments & Payouts"
          icon={CurrencyDollarIcon}
          actions={[
            { icon: CurrencyDollarIcon, label: 'Payout Requests', href: '/admin/bookings' },
            { icon: ChartBarIcon, label: 'Revenue Analytics', href: '/admin/dashboard' },
            { icon: CurrencyDollarIcon, label: 'Commissions', href: '/admin/bookings' }
          ]}
          gradient="from-green-400 to-emerald-500"
          isDarkMode={isDarkMode}
        />

        <ActionCategory
          title="Support & Disputes"
          icon={ScaleIcon}
          actions={[
            { icon: ScaleIcon, label: 'Disputes', href: '/admin/disputes' },
            { icon: ChatBubbleLeftRightIcon, label: 'Messages', href: '/admin/messages' },
            { icon: StarIcon, label: 'Reviews & Ratings', href: '/admin/disputes' }
          ]}
          gradient="from-yellow-400 to-orange-500"
          isDarkMode={isDarkMode}
        />

        <ActionCategory
          title="Marketing & Content"
          icon={SparklesIcon}
          actions={[
            { icon: SparklesIcon, label: 'Marketing', href: '/admin/marketing' },
            { icon: ChartBarIcon, label: 'Analytics', href: '/admin/dashboard' },
            { icon: BellIcon, label: 'Notifications', href: '/admin/messages' }
          ]}
          gradient="from-pink-400 to-rose-500"
          isDarkMode={isDarkMode}
        />

        {isSuperAdmin && (
          <ActionCategory
            title="System & Settings"
            icon={CogIcon}
            actions={[
              { icon: ChartBarIcon, label: 'System Dashboard', href: '/admin/system' },
              { icon: CogIcon, label: 'System Settings', href: '/settings' },
              { icon: ShieldCheckIcon, label: 'Security & Access', href: '/admin/users' },
              { icon: ChartBarIcon, label: 'Audit Log', href: '/admin/dashboard' },
              { icon: BriefcaseIcon, label: 'Issue Tracker', href: '/admin/issues' }
            ]}
            gradient="from-gray-400 to-slate-500"
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </>
  )
}

// Stylist Dashboard Component
interface StylistDashboardProps {
  stats: DashboardStats
  isDarkMode: boolean
}

function StylistDashboard({ stats, isDarkMode }: StylistDashboardProps) {
  return (
    <>
      {/* Business Dashboard CTA */}
      <Link to="/business">
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 border border-white/50 rounded-3xl shadow-2xl p-8 mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-600/10" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
                Business Dashboard
              </h3>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                Manage your calendar, services, clients, and earnings in one place
              </p>
            </div>
            <div className="flex-shrink-0 w-16 h-16 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-xl">
              <BriefcaseIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Business Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <GlassStatsCard
          icon={CalendarDaysIcon}
          title="Today"
          value={stats.todayAppointments || 0}
          gradient="from-blue-400 to-cyan-500"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={ClockIcon}
          title="This Week"
          value={stats.weekAppointments || 0}
          gradient="from-purple-400 to-pink-500"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={UserGroupIcon}
          title="Total Clients"
          value={stats.totalClientsServed || 0}
          gradient="from-green-400 to-emerald-500"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={StarIcon}
          title="Rating"
          value={stats.averageRating || 0}
          gradient="from-yellow-400 to-orange-500"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={CurrencyDollarIcon}
          title="Revenue"
          value={`$${stats.totalRevenue || 0}`}
          gradient="from-green-400 to-emerald-500"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={ClockIcon}
          title="Pending"
          value={stats.pendingBookings || 0}
          gradient="from-orange-400 to-red-500"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickActionCard
          icon={CalendarDaysIcon}
          title="Calendar"
          description="Manage your appointments"
          href="/business"
          gradient="from-blue-400 to-cyan-500"
          isDarkMode={isDarkMode}
        />
        <QuickActionCard
          icon={PlusIcon}
          title="Services"
          description="Manage your services"
          href="/business?tab=services"
          gradient="from-purple-400 to-pink-500"
          isDarkMode={isDarkMode}
        />
        <QuickActionCard
          icon={CurrencyDollarIcon}
          title="Earnings"
          description="View revenue & payouts"
          href="/business?tab=earnings"
          gradient="from-green-400 to-emerald-500"
          isDarkMode={isDarkMode}
        />
        <QuickActionCard
          icon={ChatBubbleLeftRightIcon}
          title="Messages"
          description="Chat with clients"
          href="/messages"
          gradient="from-pink-400 to-rose-500"
          isDarkMode={isDarkMode}
        />
        <QuickActionCard
          icon={ScaleIcon}
          title="Disputes"
          description="Manage disputes"
          href="/disputes"
          gradient="from-yellow-400 to-orange-500"
          isDarkMode={isDarkMode}
        />
        <QuickActionCard
          icon={ChartBarIcon}
          title="Analytics"
          description="Business insights"
          href="/business?tab=analytics"
          gradient="from-blue-400 to-indigo-500"
          isDarkMode={isDarkMode}
        />
      </div>
    </>
  )
}

// Client Dashboard Component
interface ClientDashboardProps {
  stats: DashboardStats
  isDarkMode: boolean
}

function ClientDashboard({ stats, isDarkMode }: ClientDashboardProps) {
  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <GlassStatsCard
          icon={CalendarDaysIcon}
          title="Total Bookings"
          value={stats.totalBookings || 0}
          gradient="from-blue-400 to-cyan-500"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={ClockIcon}
          title="Upcoming"
          value={stats.upcomingBookings || 0}
          gradient="from-purple-400 to-pink-500"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={CurrencyDollarIcon}
          title="Total Spent"
          value={`$${stats.totalSpent || 0}`}
          gradient="from-green-400 to-emerald-500"
          isDarkMode={isDarkMode}
        />
        <GlassStatsCard
          icon={HeartIcon}
          title="Favorites"
          value={stats.favoriteStylists || 0}
          gradient="from-pink-400 to-rose-500"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Stylist Application CTA */}
      <Link to="/stylist/apply">
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 border border-white/50 rounded-3xl shadow-2xl p-8 mb-8"
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  Become a Professional
                </h3>
              </div>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                Share your talent, build your clientele, and earn on your own schedule
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Apply Now
                </span>
                <ArrowRightIcon className="h-4 w-4 text-purple-500" />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickActionCard
          icon={MagnifyingGlassIcon}
          title="Find Professional"
          description="Search for beauty experts"
          href="/stylists"
          gradient="from-purple-400 to-pink-500"
          isDarkMode={isDarkMode}
        />
        <QuickActionCard
          icon={CalendarDaysIcon}
          title="My Bookings"
          description="View your appointments"
          href="/bookings"
          gradient="from-blue-400 to-cyan-500"
          isDarkMode={isDarkMode}
        />
        <QuickActionCard
          icon={HeartIcon}
          title="Favorites"
          description="Your saved professionals"
          href="/favorites"
          gradient="from-pink-400 to-rose-500"
          isDarkMode={isDarkMode}
        />
        <QuickActionCard
          icon={ChatBubbleLeftRightIcon}
          title="Messages"
          description="Chat with professionals"
          href="/messages"
          gradient="from-green-400 to-emerald-500"
          isDarkMode={isDarkMode}
        />
        <QuickActionCard
          icon={ScaleIcon}
          title="Disputes"
          description="Manage disputes"
          href="/disputes"
          gradient="from-yellow-400 to-orange-500"
          isDarkMode={isDarkMode}
        />
        <QuickActionCard
          icon={CogIcon}
          title="Settings"
          description="Account settings"
          href="/settings"
          gradient="from-gray-400 to-slate-500"
          isDarkMode={isDarkMode}
        />
      </div>
    </>
  )
}

// Glass Stats Card Component
interface GlassStatsCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  value: string | number
  gradient: string
  link?: string
  isDarkMode: boolean
}

function GlassStatsCard({ icon: Icon, title, value, gradient, link, isDarkMode }: GlassStatsCardProps) {
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`backdrop-blur-xl ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/30 border-white/50'} border rounded-3xl shadow-2xl p-6 ${link ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{title}</p>
      <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </motion.div>
  )

  return link ? <Link to={link}>{card}</Link> : card
}

// Quick Action Card Component
interface QuickActionCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  description: string
  href: string
  gradient: string
  isDarkMode: boolean
}

function QuickActionCard({ icon: Icon, title, description, href, gradient, isDarkMode }: QuickActionCardProps) {
  return (
    <Link to={href}>
      <motion.div
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={`backdrop-blur-xl ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/30 border-white/50'} border rounded-3xl shadow-2xl p-6 h-full`}
      >
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-4`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{title}</h3>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
      </motion.div>
    </Link>
  )
}

// Action Category Component
interface ActionCategoryProps {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  actions: Array<{
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    label: string
    href: string
  }>
  gradient: string
  isDarkMode: boolean
}

function ActionCategory({ title, icon: Icon, actions, gradient, isDarkMode }: ActionCategoryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-xl ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/30 border-white/50'} border rounded-3xl shadow-2xl p-6`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
      </div>
      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className={`flex items-center gap-3 p-3 rounded-2xl ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-white/50'} transition-all group`}
          >
            <action.icon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-900'}`} />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
