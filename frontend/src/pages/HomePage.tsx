import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import AuthModal from '../components/auth/AuthModal'
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  HandRaisedIcon,
  LockClosedIcon,
  StarIcon,
  CheckCircleIcon,
  UserGroupIcon,
  TrophyIcon,
  CalendarDaysIcon,
  PlayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { SparklesIcon as SparklesSolid } from '@heroicons/react/24/solid'

import { getMediaUrl } from '@/config/media'
// Import our new modular components
import VideoSection from '../components/home/VideoSection'
import SectionTransition from '../components/home/SectionTransition'
import ScrollIndicator from '../components/home/ScrollIndicator'
import ServiceCard from '../components/home/ServiceCard'
import StylistCard from '../components/home/StylistCard'
import TestimonialCard from '../components/home/TestimonialCard'

// Animated Title Component - 3 random threads flipping letters continuously
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

export default function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Load dark mode preference and listen for changes
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode === 'true') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    }

    // Listen for dark mode changes from Navbar
    const handleStorageChange = () => {
      const newMode = localStorage.getItem('darkMode') === 'true'
      setIsDarkMode(newMode)
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Show auth modal for new visitors after 3 seconds
  useEffect(() => {
    if (!user) {
      const hasSeenAuthModal = sessionStorage.getItem('hasSeenAuthModal')
      if (!hasSeenAuthModal) {
        const timer = setTimeout(() => {
          setShowAuthModal(true)
          sessionStorage.setItem('hasSeenAuthModal', 'true')
        }, 3000) // 3 seconds delay

        return () => clearTimeout(timer)
      }
    }
  }, [user])

  // Data
  const avatars = Array.from({ length: 13 }, (_, i) => `/media/img/avatar/A${i}.png`)

  const services = [
    { name: t('pages.home.services.hairStyling'), icon: '💇', price: `${t('pages.home.services.fromPrice')} $80`, gradient: 'from-pink-500 to-rose-600', size: 'large' as const },
    { name: t('pages.home.services.nailArt'), icon: '💅', price: `${t('pages.home.services.fromPrice')} $45`, gradient: 'from-purple-500 to-pink-600', size: 'medium' as const },
    { name: t('pages.home.services.makeup'), icon: '💄', price: `${t('pages.home.services.fromPrice')} $65`, gradient: 'from-blue-500 to-purple-600', size: 'medium' as const },
    { name: t('pages.home.services.skincare'), icon: '✨', price: `${t('pages.home.services.fromPrice')} $90`, gradient: 'from-teal-500 to-blue-600', size: 'large' as const },
    { name: t('pages.home.services.lashes'), icon: '👁️', price: `${t('pages.home.services.fromPrice')} $55`, gradient: 'from-orange-500 to-pink-600', size: 'small' as const },
    { name: t('pages.home.services.brows'), icon: '🎀', price: `${t('pages.home.services.fromPrice')} $35`, gradient: 'from-rose-500 to-purple-600', size: 'small' as const }
  ]

  const topStylists = [
    { name: t('pages.home.topStylists.stylist1.name'), avatar: avatars[0], rating: 4.9, reviews: 234, specialty: t('pages.home.topStylists.stylist1.specialty'), price: t('pages.home.topStylists.stylist1.price'), verified: true },
    { name: t('pages.home.topStylists.stylist2.name'), avatar: avatars[1], rating: 5.0, reviews: 189, specialty: t('pages.home.topStylists.stylist2.specialty'), price: t('pages.home.topStylists.stylist2.price'), verified: true },
    { name: t('pages.home.topStylists.stylist3.name'), avatar: avatars[2], rating: 4.8, reviews: 312, specialty: t('pages.home.topStylists.stylist3.specialty'), price: t('pages.home.topStylists.stylist3.price'), verified: true },
    { name: t('pages.home.topStylists.stylist4.name'), avatar: avatars[4], rating: 4.9, reviews: 267, specialty: t('pages.home.topStylists.stylist4.specialty'), price: t('pages.home.topStylists.stylist4.price'), verified: true }
  ]

  const testimonials = [
    { name: t('pages.home.testimonials.testimonial1.name'), avatar: avatars[6], rating: 5, text: t('pages.home.testimonials.testimonial1.text'), role: t('pages.home.testimonials.testimonial1.role') },
    { name: t('pages.home.testimonials.testimonial2.name'), avatar: avatars[7], rating: 5, text: t('pages.home.testimonials.testimonial2.text'), role: t('pages.home.testimonials.testimonial2.role') },
    { name: t('pages.home.testimonials.testimonial3.name'), avatar: avatars[8], rating: 5, text: t('pages.home.testimonials.testimonial3.text'), role: t('pages.home.testimonials.testimonial3.role') }
  ]

  // Helper function to render animated text
  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-black' : 'bg-white'}`}>

      {/* HERO - Video Section with Parallax */}
      <VideoSection
        videoSrc="https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/hero0-optimized.mp4"
        height="h-screen"
        parallaxIntensity={0.3}
        isDarkMode={isDarkMode}
      >
        <div className="text-center px-4">
          <div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 leading-tight">
              {t('pages.home.hero.title1')}
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                {t('pages.home.hero.title2')}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto">
              {t('pages.home.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/services" className="btn btn-primary btn-lg rounded-full group">
                {t('pages.home.hero.cta1')}
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link to="/blog" className="btn btn-secondary btn-lg rounded-full">
                {t('pages.home.hero.cta2')}
              </Link>
            </div>

            <div className="mt-16 flex flex-wrap justify-center items-center gap-6 text-white/80 mx-auto">
              <div className="flex items-center justify-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <span className="text-sm">{t('pages.home.trustBadges.verifiedPros')}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
                <span className="text-sm">{t('pages.home.trustBadges.securePayments')}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <StarIcon className="h-5 w-5 text-yellow-400" />
                <span className="text-sm">{t('pages.home.trustBadges.fiveStarRated')}</span>
              </div>
            </div>
          </div>
        </div>
      </VideoSection>

      {/* Smooth transition */}
      <SectionTransition
        from={isDarkMode ? "from-black" : "from-black/60"}
        to={isDarkMode ? "to-gray-900" : "to-white"}
        height="h-24"
        isDarkMode={isDarkMode}
      />

      {/* Trust Stats Bar */}
      <section className={`py-16 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: UserGroupIcon, number: '15K+', label: t('pages.home.stats.verifiedStylists') },
              { icon: CalendarDaysIcon, number: '250K+', label: t('pages.home.stats.bookingsMade') },
              { icon: SparklesSolid, number: '4.9★', label: t('pages.home.stats.averageRating') },
              { icon: TrophyIcon, number: '98%', label: t('pages.home.stats.satisfaction') }
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="text-center group cursor-pointer"
              >
                <div className="transition-transform hover:scale-110 hover:rotate-3">
                  <stat.icon className={`h-10 w-10 mx-auto mb-3 ${
                    isDarkMode ? 'text-pink-400' : 'text-pink-600'
                  }`} />
                </div>
                <div className={`text-4xl font-bold mb-1 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent`}>
                  {stat.number}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transition */}
      <SectionTransition
        from={isDarkMode ? "from-gray-900" : "from-white"}
        to={isDarkMode ? "to-black" : "to-gray-50"}
        height="h-16"
        isDarkMode={isDarkMode}
      />

      {/* Services Grid */}
      <section className={`py-24 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="animated-title-container">
              <h2 className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <AnimatedTitle text={t('pages.home.services.title')} />
              </h2>
            </div>
            <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('pages.home.services.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {services.map((service, i) => (
              <ServiceCard
                key={service.name}
                {...service}
                index={i}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Transition */}
      <SectionTransition
        from={isDarkMode ? "from-black" : "from-gray-50"}
        to={isDarkMode ? "to-gray-900" : "to-purple-50"}
        height="h-20"
        isDarkMode={isDarkMode}
      />

      {/* Featured Stylists */}
      <section className={`py-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-purple-50 to-pink-50'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="animated-title-container">
              <h2 className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <AnimatedTitle text={t('pages.home.topStylists.title')} />
              </h2>
            </div>
            <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('pages.home.topStylists.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {topStylists.map((stylist, i) => (
              <StylistCard
                key={stylist.name}
                {...stylist}
                index={i}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Happy Client Results Video */}
      <VideoSection
        videoSrc="https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/salon-optimized.mp4"
        height="h-[60vh]"
        parallaxIntensity={0.3}
        overlayGradient="bg-gradient-to-b from-pink-900/70 via-purple-900/70 to-black/80"
        isDarkMode={isDarkMode}
      >
        <div className="text-center px-4 text-white">
          <div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              {t('pages.home.happyClientsVideo.title')}
            </h2>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8">
              {t('pages.home.happyClientsVideo.subtitle')}
            </p>
            <Link
              to="/services"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <SparklesIcon className="mr-2 h-6 w-6" />
              {t('pages.home.happyClientsVideo.cta')}
            </Link>
          </div>
        </div>
      </VideoSection>

      {/* Transition */}
      <SectionTransition
        from="from-black/80"
        to={isDarkMode ? "to-black" : "to-white"}
        height="h-20"
        isDarkMode={isDarkMode}
      />

      {/* Testimonials */}
      <section className={`py-24 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="animated-title-container">
              <h2 className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <AnimatedTitle text={t('pages.home.testimonials.title')} />
              </h2>
            </div>
            <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('pages.home.testimonials.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <TestimonialCard
                key={testimonial.name}
                {...testimonial}
                index={i}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Second Video Section with Parallax */}
      <VideoSection
        videoSrc="https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/makeup-optimized.mp4"
        height="h-[70vh]"
        parallaxIntensity={0.4}
        overlayGradient="bg-gradient-to-b from-purple-900/60 via-pink-900/60 to-black/80"
        isDarkMode={isDarkMode}
      >
        <div className="text-center px-4 text-white">
          <div>
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              {t('pages.home.videoSection.title')}
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
              {t('pages.home.videoSection.subtitle')}
            </p>
            <Link to="/portfolio" className="btn btn-outline btn-lg rounded-full">
              <PlayIcon className="h-6 w-6" />
              {t('pages.home.videoSection.cta')}
            </Link>
          </div>
        </div>
      </VideoSection>

      {/* Transition */}
      <SectionTransition
        from="from-black/80"
        to={isDarkMode ? "to-gray-900" : "to-blue-50"}
        height="h-20"
        isDarkMode={isDarkMode}
      />

      {/* Client Protection */}
      <section className={`py-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-blue-50 to-purple-50'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="animated-title-container">
              <h2 className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <AnimatedTitle text={t('pages.home.safety.title')} />
              </h2>
            </div>
            <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('pages.home.safety.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: ShieldCheckIcon, title: t('pages.home.safety.verifiedPros'), desc: t('pages.home.safety.verifiedProsDesc'), color: 'from-green-500 to-teal-600', link: '/verified-professionals' },
              { icon: LockClosedIcon, title: t('pages.home.safety.securePayments'), desc: t('pages.home.safety.securePaymentsDesc'), color: 'from-blue-500 to-purple-600', link: '/secure-payments' },
              { icon: HandRaisedIcon, title: t('pages.home.safety.disputeResolution'), desc: t('pages.home.safety.disputeResolutionDesc'), color: 'from-purple-500 to-pink-600', link: '/dispute-resolution' },
              { icon: CreditCardIcon, title: t('pages.home.safety.moneyBack'), desc: t('pages.home.safety.moneyBackDesc'), color: 'from-pink-500 to-red-600', link: '/money-back-guarantee' }
            ].map((feature, i) => (
              <Link key={feature.title} to={feature.link}>
                <div
                  className={`p-6 rounded-3xl text-center transition-all cursor-pointer select-none hover:-translate-y-1 hover:scale-105 ${
                    isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className={`inline-flex p-4 rounded-3xl bg-gradient-to-br ${feature.color} mb-4 transition-transform hover:rotate-6`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/client-protection"
              className={`inline-flex items-center font-semibold ${
                isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-700'
              } transition-colors group`}
            >
              {t('pages.home.safety.learnMore')}
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA with Video */}
      <VideoSection
        videoSrc="https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/dancing-optimized.mp4"
        height="h-[60vh] md:h-[50vh]"
        parallaxIntensity={0.2}
        overlayGradient="bg-gradient-to-r from-pink-900/90 via-purple-900/90 to-blue-900/90"
        isDarkMode={isDarkMode}
      >
        <div className="text-center px-4 text-white pb-16">
          <div>
            <div className="inline-block mb-6 animate-pulse">
              <SparklesSolid className="h-16 md:h-20 w-16 md:w-20 text-yellow-300" />
            </div>

            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6">
              {t('pages.home.finalCta.title')}
            </h2>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto">
              {t('pages.home.finalCta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/register" className="btn btn-primary btn-lg rounded-full">
                {t('pages.home.finalCta.cta1')}
              </Link>
              <Link to="/services" className="btn btn-outline btn-lg rounded-full">
                {t('pages.home.finalCta.cta2')}
              </Link>
            </div>
          </div>
        </div>
      </VideoSection>

      {/* Auth Modal for New Visitors - ALWAYS CLIENT ONLY */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="register"
        role="client"
      />
    </div>
  )
}
