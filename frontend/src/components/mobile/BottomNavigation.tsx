import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  SparklesIcon,
  UsersIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  SparklesIcon as SparklesIconSolid,
  UsersIcon as UsersIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'

export default function BottomNavigation() {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()

  const navigation = [
    {
      name: 'Inicio',
      href: '/',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      name: 'Servicios',
      href: '/services',
      icon: SparklesIcon,
      iconSolid: SparklesIconSolid,
    },
    {
      name: 'Estilistas',
      href: '/stylists',
      icon: UsersIcon,
      iconSolid: UsersIconSolid,
    },
    {
      name: 'Citas',
      href: isAuthenticated ? '/bookings' : '/login',
      icon: CalendarDaysIcon,
      iconSolid: CalendarDaysIconSolid,
    },
    {
      name: 'Perfil',
      href: isAuthenticated ? '/profile' : '/login',
      icon: UserCircleIcon,
      iconSolid: UserCircleIconSolid,
    },
  ]

  const isActivePage = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = isActivePage(item.href)
          const Icon = isActive ? item.iconSolid : item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              className="flex flex-col items-center justify-center space-y-1 relative group"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNav"
                  className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-tiktok rounded-3xl"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
              )}

              {/* Icon with animation */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`p-1.5 rounded-full transition-colors duration-200 ${
                  isActive
                    ? 'text-neon-pink'
                    : 'text-gray-500 group-hover:text-beauty-cyber'
                }`}
              >
                <Icon className="h-5 w-5" />
              </motion.div>

              {/* Label */}
              <span
                className={`text-xs font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-neon-pink'
                    : 'text-gray-500 group-hover:text-beauty-cyber'
                }`}
              >
                {item.name}
              </span>

              {/* Touch feedback */}
              <motion.div
                initial={{ scale: 0 }}
                whileTap={{ scale: 1 }}
                className="absolute inset-0 bg-beauty-cyber/10 rounded-3xl pointer-events-none"
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}