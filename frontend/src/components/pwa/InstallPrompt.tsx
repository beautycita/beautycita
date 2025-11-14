import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptProps {
  show?: boolean; // Controlled by PopupManager
}

export default function InstallPrompt({ show = true }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://')

    setIsStandalone(standalone)

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    setIsIOS(isIOSDevice)

    if (isIOSDevice) {
      setPlatform('ios')
    } else if (isAndroid) {
      setPlatform('android')
    } else {
      setPlatform('desktop')
    }

    // Don't show if already installed
    if (standalone) {
      console.log('✅ PWA already installed')
      return
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

    // Show again after 7 days if dismissed
    if (dismissed && daysSinceDismissal < 7) {
      console.log(`⏰ Install prompt dismissed ${Math.floor(daysSinceDismissal)} days ago`)
      return
    }

    // Handle beforeinstallprompt (Chrome, Edge, Samsung Internet)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      console.log('📱 beforeinstallprompt event fired')
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Prompt is controlled by PopupManager - no timeout here
      // (PopupManager shows this after 5 minutes)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Visibility controlled by PopupManager (shows after 5 minutes)
    // Show the prompt when PopupManager allows it
    if (show) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [show])

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      toast.error('Install not available on this browser')
      return
    }

    // Chrome/Edge/Android
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      console.log(`User response to install prompt: ${outcome}`)

      if (outcome === 'accepted') {
        toast.success('Installing BeautyCita...')
        setDeferredPrompt(null)
        setShowPrompt(false)
      } else {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
        setShowPrompt(false)
      }
    }
    // iOS - show instructions
    else if (isIOS) {
      // Instructions will be shown in the modal
      console.log('Showing iOS install instructions')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setShowPrompt(false)
    toast('You can install anytime from the menu', {
      icon: 'ℹ️',
      duration: 3000
    })
  }

  // Don't show if already installed
  if (isStandalone) return null

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>

            {/* Icon */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💅</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Install BeautyCita
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get faster access and work offline
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Instant access from home screen</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Faster loading</span>
              </div>
            </div>

            {/* iOS Instructions */}
            {isIOS ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  To install on iOS:
                </p>
                <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Tap the <ShareIcon className="inline h-4 w-4" /> Share button</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                {/* PWA Install Button */}
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>Install PWA</span>
                </button>

                {/* Play Store Button (Android) */}
                {platform === 'android' && (
                  <a
                    href="https://beautycita.com/downloads/beautycita.apk"
                    download
                    className="w-full bg-gray-800 dark:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 border border-gray-700"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                    <span>Download from Play Store</span>
                  </a>
                )}
              </div>
            )}

            {/* Later button */}
            <button
              onClick={handleDismiss}
              className="w-full mt-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
