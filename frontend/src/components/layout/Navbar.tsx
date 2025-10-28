import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Bars3Icon,
  UserCircleIcon,
  HomeIcon,
  SparklesIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import NotificationBell from '../notifications/NotificationBell'
import { getMediaUrl } from '@/config/media'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Check dark mode
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    window.dispatchEvent(new Event('storage'))
  }

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.services'), href: '/services' },
    { name: t('nav.blog'), href: '/blog' },
  ]

  const getNavigationWithDashboard = () => {
    const baseNav = [...navigation]
    if (isAuthenticated && user) {
      const dashboardLink = {
        name: (user.role === 'ADMIN' || user.role === 'SUPERADMIN') ? t('nav.admin') : t('nav.panel'),
        href: '/panel'
      }
      baseNav.splice(2, 0, dashboardLink)
    }
    return baseNav
  }

  const userNavigation = [
    { name: t('nav.profile'), href: '/profile' },
    { name: t('nav.bookings'), href: '/bookings' },
    ...(user?.role === 'STYLIST' ? [
      { name: t('nav.business'), href: '/business' }
    ] : []),
  ]

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate('/', { replace: true })
  }

  const isActivePage = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Floating Pill Navbar - Aligned Right */}
      <motion.nav
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", damping: 20 }}
        className="fixed top-6 right-6 z-50"
      >
        {/* Desktop Floating Pill */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Logo Pill */}
          <Link to="/" className="group" aria-label={t('nav.logoAriaLabel')}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-xl border shadow-lg transition-all ${
                isDarkMode
                  ? 'bg-gray-900/80 border-gray-700/50 hover:bg-gray-800/90'
                  : 'bg-white/80 border-white/20 hover:bg-white/90'
              }`}
            >
              <img loading="lazy" src={getMediaUrl("brand/official-logo.svg")} alt={t('nav.logoAlt')} className="h-8 w-auto object-contain" />
              <span className="text-lg font-bold bg-gradient-to-r from-pink-500 via-purple-600 via-blue-500 via-pink-500 via-purple-600 via-blue-500 to-pink-500 bg-clip-text text-transparent animate-gradient-flow">
                BeautyCita
              </span>
            </motion.div>
          </Link>

          {/* Main Navigation Pill */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-1 px-3 py-2.5 rounded-full backdrop-blur-xl border shadow-lg ${
              isDarkMode
                ? 'bg-gray-900/80 border-gray-700/50'
                : 'bg-white/80 border-white/20'
            }`}
          >
            {getNavigationWithDashboard().slice(0, 4).map((item) => {
              const active = isActivePage(item.href)
              const Icon = item.href === '/' ? HomeIcon : item.href === '/services' ? SparklesIcon : null

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="relative group"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                        : isDarkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/50'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4 inline mr-1" />}
                    {item.name}
                  </motion.div>
                </Link>
              )
            })}
          </motion.div>

          {/* User Actions Pill */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-full backdrop-blur-xl border shadow-lg ${
              isDarkMode
                ? 'bg-gray-900/80 border-gray-700/50'
                : 'bg-white/80 border-white/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleDarkMode}
                className={`p-0.5 rounded-full transition-colors ${
                  isDarkMode
                    ? 'text-yellow-400 hover:bg-yellow-500/20'
                    : 'text-gray-700 hover:bg-gray-900/10'
                }`}
                aria-label={isDarkMode ? t('nav.lightModeAriaLabel') : t('nav.darkModeAriaLabel')}
              >
                {isDarkMode ? (
                  <SunIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <MoonIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </motion.button>

              <LanguageSwitcher />

              {isAuthenticated && user && <NotificationBell />}

            {isAuthenticated && user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2"
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 p-0.5">
                    {user.profilePictureUrl ? (
                      <img loading="lazy"
                        src={user.profilePictureUrl}
                        alt={t('nav.profilePictureAlt', { name: user.firstName })}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                        <UserCircleIcon className="h-4 w-4 text-purple-600" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.firstName}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute right-0 mt-2 w-48 rounded-3xl backdrop-blur-xl shadow-xl border z-50 ${
                          isDarkMode
                            ? 'bg-gray-900/95 border-gray-700/50'
                            : 'bg-white/95 border-gray-200/50'
                        }`}
                      >
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {user.email}
                          </div>
                        </div>

                        <div className="py-1.5">
                          {userNavigation.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setIsUserMenuOpen(false)}
                              className={`block px-3 py-2 text-xs transition-colors rounded-full mx-1.5 ${
                                isDarkMode
                                  ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 py-1.5">
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-3xl mx-1.5"
                          >
                            {t('nav.logout')}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                        : 'text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    {t('nav.login')}
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl shadow-lg hover:shadow-xl transition-all"
                  >
                    {t('nav.register')}
                  </motion.button>
                </Link>
              </div>
            )}
            </div>
          </motion.div>
        </div>

        {/* Mobile Floating Pill - Hide when menu is open */}
        <AnimatePresence>
          {!isMobileMenuOpen && (
            <motion.div
              className="lg:hidden"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(true)}
                className={`flex items-center gap-2 px-4 py-3 rounded-full backdrop-blur-xl border shadow-lg ${
                  isDarkMode
                    ? 'bg-gray-900/90 border-gray-700/50'
                    : 'bg-white/90 border-white/20'
                }`}
                aria-label={t('nav.openMenuAriaLabel')}
              >
                <Bars3Icon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} aria-hidden="true" />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('nav.menu')}
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              } shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 h-full overflow-y-auto">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <img loading="lazy" src={getMediaUrl("brand/official-logo.svg")} alt={t('nav.logoAlt')} className="h-8 w-auto object-contain" />
                    <span className="text-lg font-bold bg-gradient-to-r from-pink-500 via-purple-600 via-blue-500 via-pink-500 via-purple-600 via-blue-500 to-pink-500 bg-clip-text text-transparent animate-gradient-flow">
                      BeautyCita
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleDarkMode}
                      className={`p-2 rounded-full ${
                        isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-100 text-gray-700'
                      }`}
                      aria-label={isDarkMode ? t('nav.lightModeAriaLabel') : t('nav.darkModeAriaLabel')}
                    >
                      {isDarkMode ? <SunIcon className="h-4 w-4" aria-hidden="true" /> : <MoonIcon className="h-4 w-4" aria-hidden="true" />}
                    </button>
                    <LanguageSwitcher />
                  </div>
                </div>

                {/* User Info */}
                {isAuthenticated && user && (
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 p-0.5">
                        {user.profilePictureUrl ? (
                          <img loading="lazy"
                            src={user.profilePictureUrl}
                            alt={t('nav.profilePictureAlt', { name: user.firstName })}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                            <UserCircleIcon className="h-7 w-7 text-purple-600" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user.firstName} {user.lastName}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-2 mb-6">
                  {getNavigationWithDashboard().map((item) => {
                    const active = isActivePage(item.href)
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-3xl text-sm font-medium transition-all ${
                          active
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                            : isDarkMode
                              ? 'text-gray-300 hover:bg-gray-800'
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </div>

                {/* User Navigation */}
                {isAuthenticated && user && userNavigation.length > 0 && (
                  <div className="space-y-2 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    {userNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-3xl text-sm transition-colors ${
                          isDarkMode
                            ? 'text-gray-300 hover:bg-gray-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Auth Actions */}
                <div className="space-y-3">
                  {isAuthenticated && user ? (
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full px-4 py-3 rounded-3xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    >
                      {t('nav.logout')}
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-3xl text-sm font-medium text-center transition-colors ${
                          isDarkMode
                            ? 'text-gray-300 hover:bg-gray-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {t('nav.login')}
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-3xl text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 text-center shadow-lg"
                      >
                        {t('nav.register')}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
