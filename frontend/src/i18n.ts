import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

// Simple, synchronous language detector
const getInitialLanguage = (): string => {
  try {
    // Check localStorage first
    const stored = localStorage.getItem('language')
    if (stored) return stored

    // Check browser language (simple, no API calls)
    const browserLang = navigator.language || navigator.languages?.[0] || 'es-MX'

    if (browserLang.startsWith('en')) return 'en-US'
    if (browserLang.startsWith('es')) return 'es-MX'

    // Default to Spanish-MX as requested
    return 'es-MX'
  } catch (error) {
    console.log('Language detection failed, using Spanish default')
    return 'es-MX'
  }
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es-MX', // Spanish-MX as default fallback
    lng: getInitialLanguage(), // Set initial language synchronously
    debug: false,

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    defaultNS: 'common',
    ns: ['common'],

    react: {
      useSuspense: false // Prevent suspense issues during SSR
    }
  })

export default i18n