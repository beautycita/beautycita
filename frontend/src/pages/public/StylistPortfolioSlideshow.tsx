import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckBadgeIcon,
  MapPinIcon,
  StarIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

interface StylistPortfolio {
  username: string
  firstName: string
  lastName: string
  profilePicture?: string
  businessName?: string
  bio?: string
  specialties: string[]
  experienceYears: number
  locationCity: string
  locationState?: string
  portfolioImages: string[]
  portfolioTheme: 'minimal' | 'modern' | 'artistic'
  portfolioPublished: boolean
  socialMediaLinks?: {
    instagram?: string
    facebook?: string
    tiktok?: string
    website?: string
  }
  ratingAverage: number
  ratingCount: number
  isVerified: boolean
  salonPhone?: string
}

interface Slide {
  category: string
  description: string
  image: string
}

export default function StylistPortfolioSlideshow() {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const [stylist, setStylist] = useState<StylistPortfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showFloatingName, setShowFloatingName] = useState(true)
  const [butterflies, setButterflies] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    fetchPortfolio()
  }, [username])

  // Lock viewport on mobile - prevent zooming and scrolling
  useEffect(() => {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if (isMobile) {
      // Set viewport meta tag to lock zoom and orientation
      const viewport = document.querySelector('meta[name="viewport"]')
      const originalContent = viewport?.getAttribute('content')

      if (viewport) {
        viewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, viewport-fit=cover'
        )
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.height = '100%'

      // Prevent pull-to-refresh on mobile
      document.body.style.overscrollBehavior = 'none'

      // Cleanup
      return () => {
        if (viewport && originalContent) {
          viewport.setAttribute('content', originalContent)
        }
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
        document.body.style.height = ''
        document.body.style.overscrollBehavior = ''
      }
    }
  }, [])

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`/api/portfolio/public/${username}`)
      if (!response.ok) {
        setNotFound(true)
        return
      }
      const data = await response.json()
      setStylist(data.data)
    } catch (error) {
      setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${stylist?.firstName} ${stylist?.lastName} - BeautyCita`,
        text: stylist?.bio || '',
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success(t('portfolio.linkCopied'))
    }
  }

  const handleFavorite = () => {
    setIsFavorited(!isFavorited)
    toast.success(isFavorited ? t('portfolio.removedFavorite') : t('portfolio.addedFavorite'))
  }

  const handleBookNow = () => {
    window.location.href = `/book/${username}`
  }

  // Create slides from specialties and images
  const slides: Slide[] = stylist
    ? stylist.specialties.map((specialty, index) => ({
        category: specialty,
        description: getDescriptionForCategory(specialty),
        image: stylist.portfolioImages[index % stylist.portfolioImages.length]
      }))
    : []

  function getDescriptionForCategory(category: string): string {
    const descriptions: { [key: string]: string } = {
      'Balayage': 'Hand-painted highlights for a natural, sun-kissed glow',
      'Color Correction': 'Expert color restoration and transformation',
      'Hair Cutting': 'Precision cuts tailored to your unique style',
      'Highlights': 'Dimensional color that adds depth and brightness',
      'Keratin Treatment': 'Smooth, frizz-free hair that lasts for months',
      'Bridal Hair': 'Picture-perfect styling for your special day'
    }
    return descriptions[category] || 'Professional beauty services'
  }

  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide()
      if (e.key === 'ArrowLeft') prevSlide()
      if (e.key === 'Escape') setShowInfo(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide])

  // Touch swipe support
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      nextSlide()
    }
    if (touchStart - touchEnd < -75) {
      prevSlide()
    }
  }

  // Butterfly explosion effect - butterflies originate from text center
  const explodeIntoButterflies = () => {
    if (hasInteracted) return

    setHasInteracted(true)
    setShowFloatingName(false)

    // Calculate center of screen where text is positioned
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // Create 10 butterflies starting from text center with slight random offset
    const newButterflies = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: centerX + (Math.random() - 0.5) * 100, // Small random offset from center
      y: centerY + (Math.random() - 0.5) * 100
    }))

    setButterflies(newButterflies)

    // Clear butterflies after animation
    setTimeout(() => {
      setButterflies([])
    }, 2000)
  }

  // Trigger explosion on first touch/click only - prevent navigation
  const handlePageInteraction = (e: React.TouchEvent | React.MouseEvent) => {
    if (showFloatingName && !hasInteracted) {
      e.stopPropagation()
      e.preventDefault()
      explodeIntoButterflies()
      return true // Indicate interaction was handled
    }
    return false // Allow normal navigation
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0
    })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (notFound || !stylist || !stylist.portfolioPublished || slides.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">{t('portfolio.notFound')}</h1>
          <Link to="/" className="text-pink-400 hover:text-pink-300 underline">
            {t('common.backHome')}
          </Link>
        </div>
      </div>
    )
  }

  const currentSlideData = slides[currentSlide]
  const themeColors = {
    minimal: {
      primary: 'from-gray-900/85 to-gray-700/85',
      accent: 'pink-500'
    },
    modern: {
      primary: 'from-pink-600/85 to-purple-600/85',
      accent: 'pink-400'
    },
    artistic: {
      primary: 'from-purple-600/85 to-indigo-600/85',
      accent: 'purple-400'
    }
  }
  const theme = themeColors[stylist.portfolioTheme || 'modern']

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black touch-none"
      style={{
        touchAction: 'pan-x', // Only allow horizontal swipe
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      onTouchStart={(e) => {
        const handled = handlePageInteraction(e)
        if (!handled) {
          handleTouchStart(e)
        }
      }}
      onTouchMove={(e) => {
        if (hasInteracted) {
          handleTouchMove(e)
        }
      }}
      onTouchEnd={(e) => {
        if (hasInteracted) {
          handleTouchEnd()
        }
      }}
      onClick={handlePageInteraction}
    >
      {/* Main Slideshow */}
      <div className="h-full w-full relative">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Top Section - Text (35% of screen) */}
            <div className={`h-[35vh] bg-gradient-to-br ${theme.primary} text-white flex flex-col justify-center px-6 sm:px-8 md:px-12 relative`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-[2.5rem]"
              >
                {/* Category heading with outer glow */}
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 sm:mb-4"
                  style={{
                    textShadow: '0 0 5px rgba(255, 255, 255, 0.65)'
                  }}
                >
                  {currentSlideData.category}
                </h1>

                {/* Description - reduced by one size (text-xl/2xl instead of text-2xl/3xl) */}
                <p className="text-xl sm:text-2xl text-white/90 mb-3 font-bold">
                  {currentSlideData.description}
                </p>

                {/* Business name with experience subscript - reduced by one size (text-lg/xl instead of text-xl/2xl) */}
                {stylist.businessName && (
                  <div className="mb-3">
                    <p className="text-lg sm:text-xl text-white/90 font-black leading-tight">
                      {stylist.businessName}
                    </p>
                    <p className="text-xs text-white/70 font-medium -mt-1">
                      {stylist.experienceYears}+ yrs exp
                    </p>
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-semibold">{stylist.locationCity}{stylist.locationState && `, ${stylist.locationState}`}</span>
                </div>
              </motion.div>

              {/* Rating - Bottom right corner */}
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
                <div className="flex items-center gap-2">
                  <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-300 text-yellow-300" />
                  <span className="text-xl sm:text-2xl font-black">{stylist.ratingAverage} <span className="text-base sm:text-lg">({stylist.ratingCount})</span></span>
                </div>
              </div>
            </div>

            {/* Bottom Section - Image (65% of screen) */}
            <div className="h-[65vh] relative overflow-hidden">
              <img loading="lazy"
                src={currentSlideData.image}
                alt={currentSlideData.category}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - Bottom placement, close together */}
        <div className="absolute bottom-20 sm:bottom-24 left-4 sm:left-6 flex gap-3 z-10">
          <button
            onClick={prevSlide}
            className="bg-white/10 backdrop-blur-sm text-white p-3 sm:p-4 rounded-full hover:bg-white/20 transition"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon
              className="w-6 h-6 sm:w-7 sm:h-7"
              style={{
                filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.65))'
              }}
            />
          </button>
          <button
            onClick={nextSlide}
            className="bg-white/10 backdrop-blur-sm text-white p-3 sm:p-4 rounded-full hover:bg-white/20 transition"
            aria-label="Next slide"
          >
            <ChevronRightIcon
              className="w-6 h-6 sm:w-7 sm:h-7"
              style={{
                filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.65))'
              }}
            />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1)
                setCurrentSlide(index)
              }}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition ${
                index === currentSlide ? 'bg-white w-6 sm:w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Top Action Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-10">
          <Link
            to="/"
            className="bg-white/10 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-white/20 transition"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleFavorite}
              className="bg-white/10 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-white/20 transition"
            >
              {isFavorited ? (
                <HeartSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              ) : (
                <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
            <button
              onClick={handleShare}
              className="bg-white/10 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-white/20 transition"
            >
              <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="bg-white/10 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-white/20 transition font-semibold text-sm sm:text-base"
            >
              Info
            </button>
          </div>
        </div>

        {/* Book Now Button */}
        <button
          onClick={handleBookNow}
          className={`absolute bottom-20 sm:bottom-24 right-4 sm:right-6 bg-gradient-to-r ${theme.primary} text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:shadow-2xl transition transform hover:scale-105 z-10`}
        >
          {t('portfolio.bookNow')}
        </button>

        {/* Powered by BeautyCita */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
          <a
            href="https://beautycita.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/60 text-xs transition"
          >
            Powered by BeautyCita
          </a>
        </div>

        {/* Large Stationary Stylist Name - BeautyCita gradient */}
        <AnimatePresence>
          {showFloatingName && stylist && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-20 flex items-center justify-center"
            >
              <h2
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-center leading-tight"
                style={{
                  fontWeight: 700,
                  color: '#ff0080',
                  textShadow: `
                    0 0 40px rgba(255, 0, 128, 1),
                    0 0 80px rgba(128, 0, 255, 0.8),
                    0 0 120px rgba(0, 245, 255, 0.6),
                    2px 2px 0px #8000ff,
                    4px 4px 0px #00f5ff,
                    0 6px 30px rgba(0, 0, 0, 0.8)
                  `,
                  padding: '0 20px',
                  margin: '0 auto',
                  maxWidth: '90vw'
                }}
              >
                {stylist.firstName.split('').map((letter, i) => {
                  const shouldFlutter = Math.random() > 0.6
                  return (
                    <motion.span
                      key={i}
                      className="inline-block"
                      animate={shouldFlutter ? {
                        y: [0, -4, 0, -2, 0],
                        rotate: [0, -1, 1, -0.5, 0]
                      } : {}}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        repeatDelay: Math.random() * 2,
                        ease: 'easeInOut'
                      }}
                    >
                      {letter}
                    </motion.span>
                  )
                })}
                {' '}
                {stylist.lastName.split('').map((letter, i) => {
                  const shouldFlutter = Math.random() > 0.6
                  return (
                    <motion.span
                      key={`last-${i}`}
                      className="inline-block"
                      animate={shouldFlutter ? {
                        y: [0, -3, 0, -2, 0],
                        rotate: [0, 1, -1, 0.5, 0]
                      } : {}}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        repeatDelay: Math.random() * 2,
                        ease: 'easeInOut'
                      }}
                    >
                      {letter}
                    </motion.span>
                  )
                })}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Butterflies */}
        <AnimatePresence>
          {butterflies.map((butterfly) => {
            // Random exit positions (off screen edges)
            const exitX = Math.random() > 0.5
              ? window.innerWidth + 200
              : -200
            const exitY = Math.random() * window.innerHeight

            // Random evasive maneuver pattern
            const maneuverType = Math.floor(Math.random() * 3)
            let pathX, pathY

            if (maneuverType === 0) {
              // Spiral out
              pathX = [butterfly.x, butterfly.x + 100, butterfly.x + 200, exitX]
              pathY = [butterfly.y, butterfly.y - 100, butterfly.y + 50, exitY]
            } else if (maneuverType === 1) {
              // Zigzag
              pathX = [butterfly.x, butterfly.x - 80, butterfly.x + 120, exitX]
              pathY = [butterfly.y, butterfly.y + 80, butterfly.y - 60, exitY]
            } else {
              // Loop
              pathX = [butterfly.x, butterfly.x + 60, butterfly.x - 40, exitX]
              pathY = [butterfly.y, butterfly.y - 120, butterfly.y - 80, exitY]
            }

            return (
              <motion.div
                key={butterfly.id}
                initial={{
                  x: butterfly.x,
                  y: butterfly.y,
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  x: pathX,
                  y: pathY,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.5],
                  rotate: [0, 360, 720, 1080]
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5 + Math.random() * 0.5,
                  ease: 'easeOut',
                  times: [0, 0.1, 0.8, 1]
                }}
                className="absolute pointer-events-none z-30"
                style={{
                  fontSize: '24px'
                }}
              >
                🦋
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Info Panel Overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <img loading="lazy"
                    src={stylist.profilePicture || '/default-avatar.jpg'}
                    alt={stylist.firstName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {stylist.firstName} {stylist.lastName}
                    </h2>
                    <p className="text-gray-600">{stylist.businessName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-700">{stylist.bio}</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Experience</h3>
                  <p className="text-gray-700">{stylist.experienceYears}+ years in beauty</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Location</h3>
                  <p className="text-gray-700">
                    {stylist.locationCity}
                    {stylist.locationState && `, ${stylist.locationState}`}
                  </p>
                </div>

                {stylist.salonPhone && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Contact</h3>
                    <a
                      href={`tel:${stylist.salonPhone}`}
                      className="text-pink-600 hover:text-pink-700"
                    >
                      {stylist.salonPhone}
                    </a>
                  </div>
                )}

                {stylist.socialMediaLinks && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Social Media</h3>
                    <div className="flex gap-4">
                      {stylist.socialMediaLinks.instagram && (
                        <a
                          href={stylist.socialMediaLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-700"
                        >
                          Instagram
                        </a>
                      )}
                      {stylist.socialMediaLinks.facebook && (
                        <a
                          href={stylist.socialMediaLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-700"
                        >
                          Facebook
                        </a>
                      )}
                      {stylist.socialMediaLinks.tiktok && (
                        <a
                          href={stylist.socialMediaLinks.tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-700"
                        >
                          TikTok
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBookNow}
                  className={`w-full bg-gradient-to-r ${theme.primary} text-white py-4 rounded-full font-bold text-lg hover:shadow-lg transition mt-6`}
                >
                  {t('portfolio.bookNow')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
