/**
 * BeautyCita Optimized Image Component
 * Features: WebP support with PNG fallback, lazy loading, loading states
 */

import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

interface BCImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
  alt: string
  lazy?: boolean
  showSkeleton?: boolean
  fallback?: string
}

/**
 * Optimized image component with WebP support and lazy loading
 *
 * Features:
 * - Automatic WebP format with PNG fallback
 * - Lazy loading with Intersection Observer
 * - Loading skeleton animation
 * - Error handling with fallback
 *
 * @example
 * <BCImage
 *   src="/media/img/avatar/A0.png"
 *   alt="Avatar"
 *   lazy={true}
 *   className="w-24 h-24 rounded-full"
 * />
 */
export function BCImage({
  src,
  alt,
  lazy = true,
  showSkeleton = true,
  fallback,
  className = '',
  ...props
}: BCImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(!lazy)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!lazy || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, isInView])

  // Convert PNG to WebP path
  const getWebPSrc = (originalSrc: string): string => {
    if (originalSrc.endsWith('.png')) {
      return originalSrc.replace(/\.png$/, '.webp')
    }
    return originalSrc
  }

  // Get fallback or original source
  const getFallbackSrc = (): string => {
    if (fallback) return fallback
    if (src.endsWith('.webp')) return src.replace(/\.webp$/, '.png')
    return src
  }

  const webpSrc = getWebPSrc(src)
  const fallbackSrc = getFallbackSrc()

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {showSkeleton && !isLoaded && isInView && (
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
        />
      )}

      {/* Actual image with WebP support */}
      {isInView && (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <source srcSet={src} type="image/png" />
          <img
            src={hasError ? fallbackSrc : src}
            alt={alt}
            loading={lazy ? 'lazy' : 'eager'}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true)
              setIsLoaded(true)
            }}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            {...props}
          />
        </picture>
      )}
    </div>
  )
}

/**
 * Avatar-specific optimized image
 * Pre-configured for avatar use cases with circular shape
 */
export function BCAvatarImage({
  src,
  alt,
  size = 'md',
  className = '',
  ...props
}: BCImageProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  return (
    <BCImage
      src={src}
      alt={alt}
      className={`${sizes[size]} rounded-full object-cover ${className}`}
      {...props}
    />
  )
}

export default BCImage
