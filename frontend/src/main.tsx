import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import './styles/animations.css'
import './i18n/config.ts'
import { registerSW } from 'virtual:pwa-register'
import './utils/errorTracking' // Initialize frontend error tracking
import { initSentry } from './utils/sentry'

initSentry()

// Syncfusion removed - saved 6.6 MB!
// Bootstrap removed - saved 300KB+ and eliminated style conflicts!
// Mazer UI removed - using pure Tailwind for consistency

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
// Register service worker with auto-update
const updateSW = registerSW({
  immediate: true, // Check for updates immediately
  onNeedRefresh() {
    // Auto-reload on mobile devices without prompting
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile) {
      console.log('🔄 Auto-updating app on mobile...')
      updateSW(true) // Force reload for mobile
    } else {
      // Desktop: ask for confirmation
      if (confirm('New content available. Reload?')) {
        updateSW(true)
      }
    }
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline')
  },
  onRegistered(registration) {
    // Check for updates every 30 seconds
    if (registration) {
      setInterval(() => {
        registration.update()
      }, 30000)
    }
  }
})

const rootElement = document.getElementById('root')
const root = ReactDOM.createRoot(rootElement!)

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        {/* Toaster disabled for mobile APK */}
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
