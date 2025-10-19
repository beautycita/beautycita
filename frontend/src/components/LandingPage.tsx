import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthModal from './AuthModal'
import LanguageSwitcher from './LanguageSwitcher'
import NearbyStylists from './NearbyStylists'

// Animated Title Component
const AnimatedTitle: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const [flippingIndices, setFlippingIndices] = useState<Set<number>>(new Set())
  const threadRefs = useRef<NodeJS.Timeout[]>([])
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false

    const startThread = (threadId: number) => {
      const animate = () => {
        if (isUnmountedRef.current) return

        const delay = Math.random() * 1700 + 300

        const timer = setTimeout(() => {
          if (isUnmountedRef.current) return

          setFlippingIndices(prev => {
            const letterIndices: number[] = []
            for (let i = 0; i < text.length; i++) {
              if (text[i] !== ' ') {
                letterIndices.push(i)
              }
            }

            const availableIndices = letterIndices.filter(idx => !prev.has(idx))
            if (availableIndices.length === 0) return prev

            const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
            const newSet = new Set(prev)
            newSet.add(randomIndex)

            setTimeout(() => {
              if (isUnmountedRef.current) return
              setFlippingIndices(current => {
                const updated = new Set(current)
                updated.delete(randomIndex)
                return updated
              })
            }, 600)

            return newSet
          })

          animate()
        }, delay)

        threadRefs.current[threadId] = timer
      }

      animate()
    }

    for (let i = 0; i < 3; i++) {
      startThread(i)
    }

    return () => {
      isUnmountedRef.current = true
      threadRefs.current.forEach(timer => clearTimeout(timer))
      threadRefs.current = []
    }
  }, [text])

  return (
    <span className={className} style={{ display: 'inline-block' }}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className={`inline-block ${char === ' ' ? 'w-[0.3em]' : ''} ${
            flippingIndices.has(index) ? 'animate-flip' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            display: 'inline-block'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  )
}

const LandingPage: React.FC = () => {
  const { t } = useTranslation()
  const [showAuth, setShowAuth] = useState<'client' | 'stylist' | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  const handleBookServices = () => {
    // Request location permission
    setLocationStatus('requesting')

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          setLocationStatus('granted')
          setShowAuth('client')
        },
        (error) => {
          console.error('Location error:', error)
          setLocationStatus('denied')
          setShowAuth('client')
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    } else {
      setLocationStatus('denied')
      setShowAuth('client')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Mobile-First Header */}
      <header className="relative z-40 p-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          BeautyCita
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-3 items-center">
          <LanguageSwitcher variant="default" />
          <button
            onClick={() => setShowAuth('client')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm"
          >
            {t('header.signIn')}
          </button>
          <button
            onClick={handleBookServices}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl hover:shadow-lg transition-shadow text-sm"
          >
            {t('header.bookNow')}
          </button>
        </div>
      </header>

      {/* Sticky Mobile Menu Button - Half-Visible Pill */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden fixed top-20 -right-5 z-50 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl p-4 shadow-lg hover:shadow-xl transition-all"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          {showMobileMenu ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="absolute top-0 right-0 bg-white w-72 h-full shadow-xl"
            onClick={e => e.stopPropagation()}
          >
              <div className="p-6 pt-20">
                <div className="space-y-6">
                  <div className="mb-6">
                    <LanguageSwitcher variant="default" className="w-full" />
                  </div>
                  <button
                    onClick={async () => {
                      setShowMobileMenu(false)
                      await handleBookServices()
                    }}
                    disabled={locationStatus === 'requesting'}
                    className={`w-full py-4 text-left text-gray-700 font-medium border-b border-gray-200 ${
                      locationStatus === 'requesting' ? 'opacity-70' : ''
                    }`}
                  >
                    {locationStatus === 'requesting' ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin">🌍</div>
                        <span>Getting Location...</span>
                      </div>
                    ) : (
                      t('header.bookNow')
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAuth('stylist')
                      setShowMobileMenu(false)
                    }}
                    className="w-full py-4 text-left text-gray-700 font-medium border-b border-gray-200"
                  >
                    {t('header.joinOurTeam')}
                  </button>
                  <Link
                    to="/about"
                    className="w-full py-4 text-left text-gray-700 font-medium border-b border-gray-200 block"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/contact"
                    className="w-full py-4 text-left text-gray-700 font-medium border-b border-gray-200 block"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {t('header.contact')}
                  </Link>
                  <Link
                    to="/privacy"
                    className="w-full py-4 text-left text-gray-500 text-sm block"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {t('header.privacyPolicy')}
                  </Link>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="px-4 py-12 md:py-20 text-center max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <AnimatedTitle
            text={t('hero.title')}
            className="bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 bg-clip-text text-transparent"
          />
        </h1>

        <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed px-4">
          {t('hero.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 px-4">
          <button
            onClick={handleBookServices}
            disabled={locationStatus === 'requesting'}
            className={`w-full sm:w-auto min-w-48 py-4 px-8 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all text-lg ${
              locationStatus === 'requesting' ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {locationStatus === 'requesting' ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin">🌍</div>
                <span>Getting Location...</span>
              </div>
            ) : (
              t('hero.cta')
            )}
          </button>

          <button
            onClick={() => setShowAuth('stylist')}
            className="w-full sm:w-auto min-w-48 py-4 px-8 bg-white border-2 border-pink-500 text-gray-700 font-bold rounded-3xl shadow-lg hover:shadow-xl transition-all text-lg"
          >
            {t('header.joinOurTeam')}
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-16">
          {[
            { number: '50K+', label: t('stats.happyClients'), icon: '😊' },
            { number: '2.8K+', label: t('landing.verifiedProfessionals'), icon: '✨' },
            { number: '100+', label: t('landing.citiesServed'), icon: '🏙️' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 text-center border border-gray-200">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{stat.number}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Nearby Stylists Section */}
      {(locationStatus === 'granted' || locationStatus === 'denied') && (
        <NearbyStylists
          hasLocation={locationStatus === 'granted'}
          userLocation={userLocation || undefined}
          onBookStylist={(stylistId) => {
            console.log('Booking stylist:', stylistId)
            setShowAuth('client')
          }}
        />
      )}

      {/* Features Section */}
      <section className="px-4 py-16 bg-white/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
            <AnimatedTitle
              text="Why Choose BeautyCita?"
              className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"
            />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: '💄',
                title: t('landing.expertProfessionals'),
                description: t('landing.expertProfessionalsDesc')
              },
              {
                icon: '🤖',
                title: 'AI-Powered Matching',
                description: 'Aphrodite AI analyzes your preferences to match you with the perfect stylist.'
              },
              {
                icon: '📱',
                title: t('landing.easyBooking'),
                description: t('landing.easyBookingDesc')
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white rounded-3xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow"
              >
                <div className="text-5xl mb-6">{feature.icon}</div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Stylists Section */}
      <section className="px-4 py-16 bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            <AnimatedTitle
              text="For Beauty Professionals"
              className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"
            />
          </h2>

          <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join our platform and grow your business with powerful tools,
            AI-driven client matching, and transparent commission structure.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { icon: '💰', title: t('landing.commissionRate'), subtitle: t('landing.commissionDesc') },
              { icon: '📊', title: t('landing.businessTools'), subtitle: t('landing.businessToolsDesc') },
              { icon: '⚡', title: t('landing.fastPayouts'), subtitle: t('landing.fastPayoutsDesc') },
              { icon: '🎯', title: t('landing.aiMatching'), subtitle: t('landing.aiMatchingDesc') }
            ].map((benefit, index) => (
              <div
                key={benefit.title}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 text-center"
              >
                <div className="text-3xl mb-3">{benefit.icon}</div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">{benefit.title}</h4>
                <p className="text-gray-600 text-sm">{benefit.subtitle}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAuth('stylist')}
            className="py-4 px-8 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-3xl shadow-lg hover:shadow-xl transition-all text-lg"
          >
            Join as Stylist
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-4">
            © 2025 BeautyCita. Powered by Aphrodite AI.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/terms/client" className="text-gray-600 hover:text-gray-800 transition-colors">
              Client Terms
            </Link>
            <Link to="/terms/stylist" className="text-gray-600 hover:text-gray-800 transition-colors">
              Stylist Terms
            </Link>
            <Link to="/privacy" className="text-gray-600 hover:text-gray-800 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-800 transition-colors">
              Contact Us
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-800 transition-colors">
              About Us
            </Link>
          </div>
        </div>
      </footer>

      {/* AI Recommendations Section */}
      <section className="px-4 py-16">
      </section>


      {/* AuthModal Integration */}
      {showAuth && (
        <AuthModal
          mode={showAuth}
          onClose={() => setShowAuth(null)}
        />
      )}
    </div>
  )
}

export default LandingPage