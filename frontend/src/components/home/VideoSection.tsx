import { motion, useScroll, useTransform } from 'framer-motion'
import { ReactNode, useRef, useEffect, useState } from 'react'
import { useVideoPreloader } from '../../hooks/useVideoPreloader'
import VideoSkeleton from '../ui/VideoSkeleton'

interface VideoSectionProps {
  videoSrc: string | string[]
  children: ReactNode
  height?: string
  parallaxIntensity?: number
  overlayGradient?: string
  isDarkMode?: boolean
}

export default function VideoSection({
  videoSrc,
  children,
  height = 'h-screen',
  parallaxIntensity = 0.5,
  overlayGradient,
  isDarkMode = false
}: VideoSectionProps) {
  const containerRef = useRef<HTMLElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

  // Support multiple videos
  const videoSources = Array.isArray(videoSrc) ? videoSrc : [videoSrc]

  // Get current video source
  const getCurrentVideoSrc = () => {
    const currentVideo = videoSources[currentVideoIndex]

    // If video already has -optimized or -mobile suffix, use as-is
    if (currentVideo.includes('-optimized') || currentVideo.includes('-mobile')) {
      return currentVideo
    }

    // Otherwise, try to use optimized/mobile versions with fallback
    const basePath = currentVideo.replace('.mp4', '')
    if (isMobile) {
      // Try mobile version, fallback to optimized, then original
      return `${basePath}-mobile.mp4`
    }
    return `${basePath}-optimized.mp4`
  }

  // Use video preloader hook
  const { videoRef, isLoading, isLoaded, isError, progress, retry } = useVideoPreloader({
    videoSrc: getCurrentVideoSrc(),
    enabled: true,
    preload: 'metadata',
    threshold: 0.25,
    rootMargin: '200px'
  })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  // Standard parallax effect - smooth depth separation
  const videoY = useTransform(scrollYProgress, [0, 1], [0, parallaxIntensity * 500])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, parallaxIntensity * 200])

  const defaultOverlay = isDarkMode
    ? 'bg-gradient-to-b from-purple-900/60 via-black/50 to-black/80'
    : 'bg-gradient-to-b from-pink-900/40 via-purple-900/40 to-black/60'

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle video end and rotation
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleVideoEnd = () => {
      // Move to next video in the array
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoSources.length)
    }

    video.addEventListener('ended', handleVideoEnd)
    return () => video.removeEventListener('ended', handleVideoEnd)
  }, [videoSources.length])

  // Handle video load errors with fallback
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleError = (e: Event) => {
      console.error('Video load error:', getCurrentVideoSrc())

      // If mobile version fails, try to fallback to optimized version
      if (isMobile && getCurrentVideoSrc().includes('-mobile')) {
        const fallbackSrc = getCurrentVideoSrc().replace('-mobile', '-optimized')
        console.log('Fallback to optimized version:', fallbackSrc)
        video.src = fallbackSrc
        video.load()
      }
    }

    video.addEventListener('error', handleError)
    return () => video.removeEventListener('error', handleError)
  }, [isMobile, currentVideoIndex])

  // Reload video when index changes
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isLoaded) return

    video.load()
    video.play().catch(() => {
      // Autoplay failed, user interaction required
    })
  }, [currentVideoIndex, isLoaded])

  const getPosterSource = () => {
    const currentVideo = videoSources[currentVideoIndex]
    return currentVideo.replace('.mp4', '-poster.jpg')
  }

  return (
    <section ref={containerRef} className={`relative ${height} overflow-hidden`}>
      {/* Video Background with Parallax */}
      <motion.div
        className="absolute inset-0 w-full h-[120%]"
        style={{ y: videoY }}
      >
        <video
          ref={videoRef}
          muted
          loop={videoSources.length === 1}
          playsInline
          preload="metadata"
          poster={getPosterSource()}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit: 'cover',
            objectPosition: 'center center'
          }}
          key={currentVideoIndex}
        >
          <source src={getCurrentVideoSrc()} type="video/mp4" />
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

        {/* Overlay */}
        <div className={`absolute inset-0 ${overlayGradient || defaultOverlay}`} />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 h-full flex items-center justify-center"
        style={{ y: contentY }}
      >
        {children}
      </motion.div>
    </section>
  )
}