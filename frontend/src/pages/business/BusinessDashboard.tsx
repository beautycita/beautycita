import { useState } from 'react'
import { Link, Route, Routes, useLocation, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDaysIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  PhotoIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

// Business sub-pages
import BusinessCalendar from './BusinessCalendar'
import BusinessServices from './BusinessServices'
import BusinessAvailability from './BusinessAvailability'
import BusinessClients from './BusinessClients'
import BusinessEarnings from './BusinessEarnings'
import BusinessAnalytics from './BusinessAnalytics'
import BusinessSettings from './BusinessSettings'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
}

const navigation: NavItem[] = [
  { name: 'Calendar', href: '/business/calendar', icon: CalendarDaysIcon, color: 'from-blue-500 to-cyan-500' },
  { name: 'Services', href: '/business/services', icon: Cog6ToothIcon, color: 'from-purple-500 to-pink-500' },
  { name: 'Availability', href: '/business/availability', icon: ClockIcon, color: 'from-green-500 to-emerald-500' },
  { name: 'Clients', href: '/business/clients', icon: UserGroupIcon, color: 'from-orange-500 to-red-500' },
  { name: 'Earnings', href: '/business/earnings', icon: CurrencyDollarIcon, color: 'from-emerald-500 to-teal-500' },
  { name: 'Analytics', href: '/business/analytics', icon: ChartBarIcon, color: 'from-indigo-500 to-purple-500' },
  { name: 'Settings', href: '/business/settings', icon: Cog6ToothIcon, color: 'from-gray-500 to-slate-500' },
]

export default function BusinessDashboard() {
  const location = useLocation()
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Only stylists can access business dashboard
  if (user?.role !== 'STYLIST') {
    return <Navigate to="/panel" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%',
        }}
        className="fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl lg:translate-x-0 lg:static lg:z-0 transition-transform duration-300"
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Business</h2>
                <p className="text-purple-100 text-sm">Dashboard</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-white hover:bg-white/20 rounded-xl"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* Back to Panel */}
            <Link
              to="/panel"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors group"
            >
              <HomeIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Back to Panel</span>
            </Link>

            <div className="pt-4 border-t border-gray-200"></div>

            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`h-6 w-6 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0] || user?.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName || user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white shadow-md p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Business Dashboard
            </h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route index element={<Navigate to="/business/calendar" replace />} />
            <Route path="calendar" element={<BusinessCalendar />} />
            <Route path="services" element={<BusinessServices />} />
            <Route path="availability" element={<BusinessAvailability />} />
            <Route path="clients" element={<BusinessClients />} />
            <Route path="earnings" element={<BusinessEarnings />} />
            <Route path="analytics" element={<BusinessAnalytics />} />
            <Route path="settings" element={<BusinessSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
