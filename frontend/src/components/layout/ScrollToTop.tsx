import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()
  const isFirstRender = useRef(true)
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (isFirstRender.current) {
      // First render - check if this is a page refresh or new visit
      try {
        const savedScrollPosition = sessionStorage.getItem('beautycita-scroll-position')
        const savedPathname = sessionStorage.getItem('beautycita-pathname')

        if (savedScrollPosition && savedPathname === pathname) {
          // This is a page refresh - restore scroll position
          const scrollY = parseInt(savedScrollPosition, 10)
          if (!isNaN(scrollY)) {
            window.scrollTo(0, scrollY)
          }
        } else {
          // New visit or different page - scroll to top (no animation on first load)
          window.scrollTo(0, 0)
          sessionStorage.setItem('beautycita-pathname', pathname)
        }
      } catch (e) {
        // SessionStorage might be unavailable - just scroll to top
        window.scrollTo(0, 0)
      }

      isFirstRender.current = false
    } else if (pathname !== previousPathname.current) {
      // Route changed - animate scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      try {
        sessionStorage.setItem('beautycita-pathname', pathname)
      } catch (e) {
        // Ignore sessionStorage errors
      }
      previousPathname.current = pathname
    }

    // Save scroll position periodically for refresh restoration
    let scrollTimeout: number

    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = window.setTimeout(() => {
        try {
          sessionStorage.setItem('beautycita-scroll-position', window.scrollY.toString())
        } catch (e) {
          // Ignore sessionStorage errors
        }
      }, 100)
    }

    const handleBeforeUnload = () => {
      try {
        sessionStorage.setItem('beautycita-scroll-position', window.scrollY.toString())
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearTimeout(scrollTimeout)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname])

  return null
}
