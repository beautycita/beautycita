import { Outlet, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  HomeIcon,
  CalendarIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  Squares2X2Icon,
  MoonIcon,
  SunIcon,
  LanguageIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  CalendarIcon as CalendarIconSolid,
  PhotoIcon as PhotoIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ChatBubbleLeftIcon as ChatIconSolid
} from '@heroicons/react/24/solid'
import { useTheme } from '../hooks/useTheme'
import { useAuthStore } from '../store/authStore'

export default function StylistLayout() {
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { mode, toggleTheme } = useTheme()
  const { user } = useAuthStore()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en'
    i18n.changeLanguage(newLang)
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navItems = [
    {
      path: '/studio',
      label: t('stylist.nav.home'),
      icon: HomeIcon,
      activeIcon: HomeIconSolid
    },
    {
      path: '/studio/calendar',
      label: t('stylist.nav.calendar'),
      icon: CalendarIcon,
      activeIcon: CalendarIconSolid
    },
    {
      path: '/studio/portfolio',
      label: t('stylist.nav.portfolio'),
      icon: PhotoIcon,
      activeIcon: PhotoIconSolid
    },
    {
      path: '/studio/services',
      label: t('stylist.nav.services'),
      icon: Squares2X2Icon,
      activeIcon: Squares2X2Icon
    },
    {
      path: '/studio/revenue',
      label: t('stylist.nav.revenue'),
      icon: ChartBarIcon,
      activeIcon: ChartBarIconSolid
    },
    {
      path: '/studio/messages',
      label: t('stylist.nav.messages'),
      icon: ChatBubbleLeftIcon,
      activeIcon: ChatIconSolid
    },
    {
      path: '/studio/profile',
      label: t('stylist.nav.profile'),
      icon: UserCircleIcon,
      activeIcon: UserCircleIcon
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:overflow-y-auto lg:bg-white lg:dark:bg-gray-800 lg:border-r lg:border-gray-200 lg:dark:border-gray-700">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-serif font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                BeautyCita
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                Studio
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-y-7 px-3 py-4">
            <ul role="list" className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path)
                const Icon = active ? item.activeIcon : item.icon

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`
                        group flex gap-x-3 rounded-full p-3 text-sm font-semibold leading-6 transition-all
                        ${active
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className="h-6 w-6 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* User Info */}
            <div className="mt-auto">
              <div className="flex items-center gap-x-3 px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  {user?.name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{user?.name || user?.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Stylist Account</p>
                </div>
              </div>

              {/* Theme & Language Toggle */}
              <div className="flex items-center justify-around px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Toggle theme"
                >
                  {mode === 'light' ? (
                    <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <SunIcon className="h-5 w-5 text-gray-300" />
                  )}
                </button>
                <button
                  onClick={toggleLanguage}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Toggle language"
                >
                  <LanguageIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <span className="ml-1 text-xs font-semibold">{i18n.language.toUpperCase()}</span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-serif font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Studio
              </span>
            </Link>
            <div className="flex items-center gap-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {mode === 'light' ? (
                  <MoonIcon className="h-5 w-5 text-gray-600" />
                ) : (
                  <SunIcon className="h-5 w-5 text-gray-300" />
                )}
              </button>
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-semibold"
                aria-label="Toggle language"
              >
                {i18n.language.toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="pb-20 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.path)
            const Icon = active ? item.activeIcon : item.icon

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center gap-1 transition-colors
                  ${active
                    ? 'text-pink-600 dark:text-pink-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
