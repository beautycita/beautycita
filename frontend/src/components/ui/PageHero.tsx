import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PageHeroProps {
  title: string
  subtitle?: string
  children?: ReactNode
  gradient?: string
  isDarkMode?: boolean
  backgroundImage?: string
  videoSrc?: string
  height?: string
}

export default function PageHero({
  title,
  subtitle,
  children,
  gradient = 'from-pink-500 via-purple-500 to-blue-500',
  isDarkMode = false,
  backgroundImage,
  videoSrc,
  height = 'h-96'
}: PageHeroProps) {
  return (
    <section className={`relative ${height} overflow-hidden`}>
      {/* Background */}
      <div className="absolute inset-0">
        {videoSrc ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : backgroundImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        )}

        {/* Overlay */}
        <div className={`absolute inset-0 ${
          isDarkMode
            ? 'bg-gradient-to-b from-purple-900/60 via-black/50 to-black/80'
            : 'bg-gradient-to-b from-pink-900/40 via-purple-900/40 to-black/60'
        }`} />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <motion.div
          className="text-center max-w-4xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}

          {children}
        </motion.div>
      </div>
    </section>
  )
}
