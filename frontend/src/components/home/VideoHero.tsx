import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { SparklesIcon, ArrowRightIcon, ChevronDownIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline'
import { SparklesIcon as SparklesSolid } from '@heroicons/react/24/solid'
import { getMediaUrl } from '@/config/media'
import { useVideoPreloader } from '../../hooks/useVideoPreloader'
import VideoSkeleton from '../ui/VideoSkeleton'

interface VideoHeroProps {
  isDarkMode: boolean
}

export default function VideoHero({ isDarkMode }: VideoHeroProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile for video optimization
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Choose video source based on device
  const videoSrc = isMobile ? 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/hero0-optimized.mp4' : 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/hero0-optimized.mp4'

  // Use video preloader hook
  const { videoRef, isLoading, isLoaded, isError, progress, retry } = useVideoPreloader({
    videoSrc,
    enabled: true,
    preload: 'auto',
    threshold: 0,
    rootMargin: '0px'
  })

  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 500], [1, 0])
  const scale = useTransform(scrollY, [0, 500], [1, 1.1])

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Video Background with Parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y, scale }}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          poster={getMediaUrl("img/hero0-poster.jpg")}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Loading skeleton */}
        {(isLoading || isError) && (
          <VideoSkeleton
            isLoading={isLoading}
            isError={isError}
            progress={progress}
            onRetry={retry}
          />
        )}

        {/* Dark Overlay for text readability */}
        <div className={`absolute inset-0 ${
          isDarkMode
            ? 'bg-gradient-to-b from-black/60 via-black/40 to-black/60'
            : 'bg-gradient-to-b from-black/50 via-black/30 to-black/50'
        }`} />

        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'linear-gradient(45deg, rgba(219,39,119,0.3) 0%, rgba(147,51,234,0.3) 100%)',
              'linear-gradient(45deg, rgba(147,51,234,0.3) 0%, rgba(59,130,246,0.3) 100%)',
              'linear-gradient(45deg, rgba(59,130,246,0.3) 0%, rgba(219,39,119,0.3) 100%)',
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Floating Glass Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-40">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="container mx-auto px-4 py-6"
        >
          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl px-6 py-4 border border-white/20 dark:border-white/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2 group">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <SparklesSolid className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </motion.div>
                <span className="font-serif text-2xl md:text-3xl font-bold text-white">
                  BeautyCita
                </span>
              </Link>

              <div className="hidden md:flex items-center space-x-6">
                <Link to="/services" className="text-white/90 hover:text-white transition-colors">Services</Link>
                <Link to="/portfolio" className="text-white/90 hover:text-white transition-colors">Portfolio</Link>
                <Link to="/blog" className="text-white/90 hover:text-white transition-colors">Blog</Link>
                <Link to="/about" className="text-white/90 hover:text-white transition-colors">About</Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-3xl hover:shadow-lg hover:shadow-pink-500/30 transition-all transform hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* Hero Content */}
      <motion.div
        className="relative z-10 h-full flex items-center justify-center"
        style={{ opacity }}
      >
        <div className="container mx-auto px-4 text-center">
          {/* Animated Badge */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-3xl mb-6 border border-white/20"
          >
            <SparklesIcon className="h-4 w-4 text-yellow-300" />
            <span className="text-sm text-white font-medium">Powered by Aphrodite AI</span>
            <SparklesIcon className="h-4 w-4 text-yellow-300" />
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6"
          >
            <span className="block">Beauty That</span>
            <span className="block bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
              Moves You
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto"
          >
            Book with verified beauty professionals. Get AI-powered recommendations.
            Experience transformation.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/services"
              className="group relative px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold text-lg rounded-3xl overflow-hidden transition-all transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                Book Your Glow Up
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ opacity: 0.3 }}
              />
            </Link>

            <Link
              to="/stylist-application"
              className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-semibold text-lg rounded-3xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all transform hover:scale-105"
            >
              Become a Stylist
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-12 flex flex-wrap justify-center gap-8"
          >
            <div className="flex items-center text-white/80">
              <span className="text-3xl font-bold text-white">10K+</span>
              <span className="ml-2 text-sm">Verified Stylists</span>
            </div>
            <div className="flex items-center text-white/80">
              <span className="text-3xl font-bold text-white">50K+</span>
              <span className="ml-2 text-sm">Happy Clients</span>
            </div>
            <div className="flex items-center text-white/80">
              <span className="text-3xl font-bold text-white">4.9★</span>
              <span className="ml-2 text-sm">Average Rating</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Video Control Button */}
      {!isMobile && isLoaded && !isError && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={toggleVideo}
          className="absolute bottom-10 left-10 z-20 p-3 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 hover:bg-white/20 transition-colors"
          aria-label="Toggle video"
        >
          {isPlaying ? (
            <PauseIcon className="h-5 w-5 text-white" />
          ) : (
            <PlayIcon className="h-5 w-5 text-white" />
          )}
        </motion.button>
      )}

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center text-white/80"
        >
          <span className="text-sm mb-2">Scroll to explore</span>
          <ChevronDownIcon className="h-6 w-6" />
        </motion.div>
      </motion.div>
    </section>
  )
}