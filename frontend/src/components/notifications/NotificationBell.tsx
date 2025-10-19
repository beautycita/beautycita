import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid'
import { useAuth } from '../../hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  related_booking_id?: number
  is_read: boolean
  created_at: string
  booking_date?: string
  booking_time?: string
  booking_status?: string
  service_name?: string
}

export default function NotificationBell() {
  const { user, token } = useAuth()
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.id])

  const fetchNotifications = async () => {
    if (!user?.id || !token) return

    try {
      const response = await fetch(`https://beautycita.com/api/notifications?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationId: number) => {
    if (!token) return

    try {
      const response = await fetch(`https://beautycita.com/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      })

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch('https://beautycita.com/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      })

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteNotification = async (notificationId: number) => {
    if (!token) return

    try {
      const response = await fetch(`https://beautycita.com/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      })

      if (response.ok) {
        const wasUnread = notifications.find(n => n.id === notificationId)?.is_read === false
        setNotifications(notifications.filter(n => n.id !== notificationId))
        if (wasUnread) setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    const iconClass = 'h-5 w-5'
    switch (type) {
      case 'BOOKING_REQUEST':
        return <span className={`${iconClass} text-blue-500`}>📅</span>
      case 'BOOKING_CONFIRMED':
        return <span className={`${iconClass} text-green-500`}>✅</span>
      case 'BOOKING_CANCELLED':
        return <span className={`${iconClass} text-red-500`}>❌</span>
      case 'PAYMENT_RECEIVED':
        return <span className={`${iconClass} text-green-500`}>💰</span>
      case 'REMINDER':
        return <span className={`${iconClass} text-yellow-500`}>⏰</span>
      default:
        return <span className={`${iconClass} text-gray-500`}>📬</span>
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-0.5 rounded-full hover:bg-gray-100/50 transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-4 w-4 text-primary-600" />
        ) : (
          <BellIcon className="h-4 w-4 text-gray-600" />
        )}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-3xl h-5 w-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-screen max-w-md sm:w-96 bg-white rounded-3xl shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('notifications.title')}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>{t('notifications.noNotifications')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            {notification.service_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                {t('notifications.service')}: {notification.service_name}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: i18n.language === 'es' ? es : undefined
                              })}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex items-center space-x-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                title={t('notifications.markAsRead')}
                              >
                                <CheckIcon className="h-4 w-4 text-green-600" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                              title={t('notifications.delete')}
                            >
                              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-red-600" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
