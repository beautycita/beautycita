import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  CalendarDaysIcon,
  StarIcon,
  HeartIcon,
  SparklesIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface LiveActivityFeedProps {
  isDarkMode: boolean
}

const generateActivity = () => {
  const activities = [
    {
      type: 'booking',
      user: 'Sarah M.',
      action: 'booked a hair styling session',
      stylist: 'Luna Rodriguez',
      time: 'just now',
      location: 'Beverly Hills',
      icon: CalendarDaysIcon,
      color: 'from-pink-500 to-purple-600'
    },
    {
      type: 'review',
      user: 'Jessica L.',
      action: 'left a 5-star review',
      service: 'Nail Art',
      time: '2 min ago',
      rating: 5,
      icon: StarIcon,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      type: 'favorite',
      user: 'Maria G.',
      action: 'added to favorites',
      stylist: 'Emma Chen',
      time: '5 min ago',
      icon: HeartIcon,
      color: 'from-red-500 to-pink-600'
    },
    {
      type: 'booking',
      user: 'Ashley K.',
      action: 'booked makeup for wedding',
      stylist: 'Sofia Martinez',
      time: '8 min ago',
      location: 'Santa Monica',
      icon: CalendarDaysIcon,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      type: 'new_stylist',
      user: 'Isabella Kim',
      action: 'joined as a new stylist',
      specialty: 'Lash Technician',
      time: '12 min ago',
      icon: SparklesIcon,
      color: 'from-teal-500 to-blue-600'
    },
    {
      type: 'review',
      user: 'Olivia J.',
      action: 'left a review for skincare treatment',
      rating: 4,
      time: '15 min ago',
      icon: StarIcon,
      color: 'from-green-500 to-teal-600'
    },
    {
      type: 'booking',
      user: 'Emma W.',
      action: 'booked a brow lamination',
      stylist: 'Ava Williams',
      time: '18 min ago',
      location: 'Venice Beach',
      icon: CalendarDaysIcon,
      color: 'from-amber-500 to-orange-600'
    },
    {
      type: 'favorite',
      user: 'Sophie T.',
      action: 'saved 3 stylists',
      time: '22 min ago',
      icon: HeartIcon,
      color: 'from-pink-500 to-rose-600'
    }
  ]

  // Randomly select and modify an activity
  const randomIndex = Math.floor(Math.random() * activities.length)
  const activity = { ...activities[randomIndex] }
  activity.id = Date.now() + Math.random()

  // Randomize times
  const times = ['just now', '1 min ago', '2 min ago', '3 min ago', '5 min ago']
  activity.time = times[Math.floor(Math.random() * times.length)]

  return activity
}

export default function LiveActivityFeed({ isDarkMode }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<any[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  // Initialize with some activities
  useEffect(() => {
    const initial = []
    for (let i = 0; i < 5; i++) {
      initial.push(generateActivity())
    }
    setActivities(initial)
  }, [])

  // Add new activities periodically
  useEffect(() => {
    if (!inView || isPaused) return

    const interval = setInterval(() => {
      setActivities(prev => {
        const newActivity = generateActivity()
        const updated = [newActivity, ...prev].slice(0, 8)
        return updated
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [inView, isPaused])

  const renderActivityContent = (activity: any) => {
    const Icon = activity.icon

    switch (activity.type) {
      case 'booking':
        return (
          <>
            <div className={`p-2 rounded-3xl bg-gradient-to-r ${activity.color} flex-shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <span className="font-semibold">{activity.user}</span>
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}> {activity.action} with </span>
                <span className="font-semibold">{activity.stylist}</span>
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs flex items-center ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {activity.time}
                </span>
                {activity.location && (
                  <span className={`text-xs flex items-center ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    <MapPinIcon className="h-3 w-3 mr-1" />
                    {activity.location}
                  </span>
                )}
              </div>
            </div>
          </>
        )

      case 'review':
        return (
          <>
            <div className={`p-2 rounded-3xl bg-gradient-to-r ${activity.color} flex-shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <span className="font-semibold">{activity.user}</span>
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}> {activity.action}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarSolid
                      key={i}
                      className={`h-3 w-3 ${
                        i < activity.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {activity.time}
                </span>
              </div>
            </div>
          </>
        )

      case 'favorite':
        return (
          <>
            <div className={`p-2 rounded-3xl bg-gradient-to-r ${activity.color} flex-shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <span className="font-semibold">{activity.user}</span>
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}> {activity.action}</span>
                {activity.stylist && <span className="font-semibold"> {activity.stylist}</span>}
              </p>
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {activity.time}
              </span>
            </div>
          </>
        )

      case 'new_stylist':
        return (
          <>
            <div className={`p-2 rounded-3xl bg-gradient-to-r ${activity.color} flex-shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <span className="font-semibold">{activity.user}</span>
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}> {activity.action}</span>
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  {activity.specialty}
                </span>
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {activity.time}
                </span>
              </div>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <section className={`py-20 relative overflow-hidden ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, ${
            isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          } 35px, ${
            isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          } 70px)`
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative"
            >
              <div className="absolute inset-0 bg-red-500 rounded-3xl animate-ping" />
              <div className="relative w-3 h-3 bg-red-500 rounded-3xl" />
            </motion.div>
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold ml-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Live Activity
            </h2>
          </div>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Real-time bookings and reviews happening right now
          </p>
        </motion.div>

        {/* Activity Feed */}
        <div
          ref={ref}
          className="max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="popLayout">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, x: -50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
                className={`mb-4 p-4 rounded-3xl flex items-center gap-4 ${
                  isDarkMode
                    ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800'
                    : 'bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border border-gray-100'
                } transition-all duration-300 cursor-pointer`}
              >
                {renderActivityContent(activity)}

                {/* Live Badge */}
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex-shrink-0"
                >
                  <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-3xl">
                    LIVE
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex flex-wrap justify-center gap-8"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              className={`text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent`}
            >
              247
            </motion.div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Active Now
            </p>
          </div>
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
              className={`text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent`}
            >
              1,842
            </motion.div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Today's Bookings
            </p>
          </div>
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
              className={`text-3xl font-bold bg-gradient-to-r from-blue-500 to-teal-600 bg-clip-text text-transparent`}
            >
              4.9★
            </motion.div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Average Rating
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}