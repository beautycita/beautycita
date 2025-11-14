import { useState, useEffect, useRef, RefObject } from 'react'

interface UseVideoPreloaderOptions {
  videoSrc: string
  enabled?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  threshold?: number // Intersection Observer threshold
  rootMargin?: string // Intersection Observer rootMargin
}

interface UseVideoPreloaderReturn {
  videoRef: RefObject<HTMLVideoElement>
  isLoading: boolean
  isLoaded: boolean
  isError: boolean
  progress: number
  retry: () => void
}

/**
 * Custom hook for preloading and managing video background states
 * - Preloads video data
 * - Tracks loading progress
 * - Uses Intersection Observer for lazy loading
 * - Handles errors gracefully
 */
export function useVideoPreloader({
  videoSrc,
  enabled = true,
  preload = 'metadata',
  threshold = 0.1,
  rootMargin = '200px'
}: UseVideoPreloaderOptions): UseVideoPreloaderReturn {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [progress, setProgress] = useState(0)
  const [shouldLoad, setShouldLoad] = useState(false)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enabled || !videoRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(videoRef.current)

    return () => observer.disconnect()
  }, [enabled, threshold, rootMargin])

  // Preload video when shouldLoad is true
  useEffect(() => {
    if (!shouldLoad || !enabled || !videoRef.current) return

    const video = videoRef.current
    setIsLoading(true)
    setIsError(false)

    // Track loading progress
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const duration = video.duration
        if (duration > 0) {
          setProgress((bufferedEnd / duration) * 100)
        }
      }
    }

    // Video is ready to play
    const handleCanPlay = () => {
      setIsLoading(false)
      setIsLoaded(true)
      setProgress(100)
    }

    // Video loaded enough data
    const handleLoadedData = () => {
      setIsLoaded(true)
      setIsLoading(false)
    }

    // Video encountered an error
    const handleError = () => {
      setIsError(true)
      setIsLoading(false)
      setIsLoaded(false)
    }

    // Attach event listeners
    video.addEventListener('progress', handleProgress)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)

    // Start loading
    if (preload !== 'none') {
      video.load()
    }

    return () => {
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
    }
  }, [shouldLoad, enabled, preload, videoSrc])

  // Retry function
  const retry = () => {
    if (videoRef.current) {
      setIsError(false)
      setIsLoading(true)
      setProgress(0)
      videoRef.current.load()
    }
  }

  return {
    videoRef,
    isLoading,
    isLoaded,
    isError,
    progress,
    retry
  }
}
