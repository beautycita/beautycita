import { useState, ReactNode, Fragment } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Transition } from '@headlessui/react'
import {
  HomeIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ScaleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  PlusCircleIcon,
  VideoCameraIcon,
  ClipboardDocumentListIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  StarIcon,
  BellIcon,
  CogIcon,
  DocumentTextIcon,
  ServerIcon,
  Squares2X2Icon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'
import { filterNavigationByRole, getDashboardTitle } from '../../lib/navigationPermissions'
import { useMemo } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  badge?: number
  gradient?: string
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  // Define all possible navigation items
  const allNavigationItems: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon, gradient: 'from-purple-500 to-pink-600' },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, gradient: 'from-blue-500 to-indigo-600' },
    { name: 'System Monitor', href: '/admin/system', icon: ServerIcon, gradient: 'from-green-500 to-emerald-600' },
    { name: 'Users', href: '/admin/users', icon: UserGroupIcon, gradient: 'from-blue-500 to-purple-600' },
    { name: 'Stylist Applications', href: '/admin/stylist-applications', icon: ShieldCheckIcon, gradient: 'from-pink-500 to-rose-600' },
    { name: 'Reviews', href: '/admin/reviews', icon: StarIcon, gradient: 'from-yellow-500 to-orange-600' },
    { name: 'Bookings', href: '/admin/bookings', icon: CalendarDaysIcon, gradient: 'from-indigo-500 to-purple-600' },
    { name: 'Calendar', href: '/admin/calendar', icon: CalendarDaysIcon, gradient: 'from-violet-500 to-indigo-600' },
    { name: 'Services', href: '/admin/services', icon: PlusCircleIcon, gradient: 'from-violet-500 to-purple-600' },
    { name: 'Video Calls', href: '/admin/video', icon: VideoCameraIcon, gradient: 'from-fuchsia-500 to-pink-600' },
    { name: 'Finance', href: '/admin/finance', icon: CurrencyDollarIcon, gradient: 'from-green-500 to-teal-600' },
    { name: 'Disputes', href: '/admin/disputes', icon: ScaleIcon, gradient: 'from-amber-500 to-orange-600' },
    { name: 'Messages', href: '/admin/messages', icon: ChatBubbleLeftRightIcon, gradient: 'from-cyan-500 to-blue-600' },
    { name: 'Notifications', href: '/admin/notifications', icon: BellIcon, gradient: 'from-purple-500 to-violet-600' },
    { name: 'Activity Logs', href: '/admin/logs', icon: DocumentTextIcon, gradient: 'from-gray-500 to-slate-600' },
    { name: 'Settings', href: '/admin/settings', icon: CogIcon, gradient: 'from-gray-600 to-gray-800' },
    { name: 'Issue Tracker', href: '/admin/issues', icon: ClipboardDocumentListIcon, gradient: 'from-orange-500 to-red-600' },
    { name: 'App Downloads', href: '/download-app', icon: DevicePhoneMobileIcon, gradient: 'from-indigo-500 to-blue-600' },
    { name: 'Marketing', href: '/admin/marketing', icon: SparklesIcon, gradient: 'from-purple-500 to-pink-600' }
  ]

  // Filter navigation based on user role permissions
  const navigation = useMemo(() => {
    if (!user?.role) return []
    return filterNavigationByRole(allNavigationItems, user.role)
  }, [user?.role])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%'
        }}
        className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl lg:translate-x-0 lg:static lg:z-0"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200">
            <Link to="/admin" className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-lg opacity-50"></div>
                <SparklesIcon className="relative h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  BeautyCita
                </h1>
                <p className="text-xs text-gray-500">{user?.role === 'SUPERADMIN' ? 'Super Admin' : user?.role === 'ADMIN' ? 'Admin Panel' : user?.role === 'STYLIST' ? 'Stylist Panel' : 'Dashboard'}</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <span className="text-white font-semibold">{user?.name?.[0] || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-3xl transition-all duration-200
                      ${active
                        ? 'bg-gradient-to-r ' + (item.gradient || 'from-purple-500 to-pink-600') + ' text-white shadow-lg scale-105'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        active ? 'bg-white/20' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-3xl transition-colors"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-full hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:ml-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => isActive(item.href))?.name || getDashboardTitle(user?.role || 'CLIENT')}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl">
                <SparklesIcon className="h-4 w-4 text-white" />
                <span className="text-xs font-medium text-white">{user?.role}</span>
              </div>

              {/* Right Navigation Menu */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 px-4 py-2 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg">
                  <Squares2X2Icon className="h-5 w-5" />
                  <span className="hidden md:inline text-sm font-medium">Menu</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right bg-white rounded-3xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden z-50">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{user?.name?.[0] || 'A'}</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{user?.name}</p>
                          <p className="text-white/80 text-xs">{user?.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto py-2">
                      {navigation.map((item, index) => {
                        const active = isActive(item.href)
                        const Icon = item.icon
                        return (
                          <Menu.Item key={item.name}>
                            {({ active: menuActive }) => (
                              <Link
                                to={item.href}
                                className={`
                                  group flex items-center px-4 py-3 text-sm transition-all
                                  ${active
                                    ? 'bg-gradient-to-r ' + item.gradient + ' text-white'
                                    : menuActive
                                      ? 'bg-purple-50 text-gray-900'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }
                                `}
                              >
                                <Icon className={`mr-3 h-5 w-5 ${active ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'}`} />
                                <span className="font-medium">{item.name}</span>
                                {active && (
                                  <span className="ml-auto">
                                    <SparklesIcon className="h-4 w-4 text-white" />
                                  </span>
                                )}
                              </Link>
                            )}
                          </Menu.Item>
                        )
                      })}
                    </div>

                    <div className="border-t border-gray-200 p-2">
                      <Menu.Item>
                        {({ active: menuActive }) => (
                          <button
                            onClick={handleLogout}
                            className={`
                              w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-colors
                              ${menuActive
                                ? 'bg-red-50 text-red-700'
                                : 'text-red-600 hover:bg-red-50'
                              }
                            `}
                          >
                            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
