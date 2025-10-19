import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface LanguageSwitcherProps {
  variant?: 'default' | 'medical' | 'luxury' | 'social'
  className?: string
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'default',
  className = ''
}) => {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'es', name: 'Español', flag: '🇲🇽' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = async (langCode: string) => {
    try {
      await i18n.changeLanguage(langCode)
      localStorage.setItem('language', langCode)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  // Style variants for different landing pages
  const getVariantStyles = () => {
    switch (variant) {
      case 'medical':
        return {
          button: 'bg-white/10 backdrop-blur-md border border-gray-200 text-gray-700 hover:bg-gray-50',
          dropdown: 'bg-white border border-gray-200 shadow-lg',
          text: 'text-gray-700',
          hoverBg: 'hover:bg-gray-50'
        }
      case 'luxury':
        return {
          button: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
          dropdown: 'bg-gradient-to-br from-gray-900 to-purple-900 border border-white/20 shadow-2xl',
          text: 'text-white',
          hoverBg: 'hover:bg-white/10'
        }
      case 'social':
        return {
          button: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
          dropdown: 'bg-gradient-to-br from-blue-900 to-purple-900 border border-white/20 shadow-2xl',
          text: 'text-white',
          hoverBg: 'hover:bg-white/10'
        }
      default:
        return {
          button: 'bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 hover:bg-white',
          dropdown: 'bg-white border border-gray-200 shadow-lg',
          text: 'text-gray-700',
          hoverBg: 'hover:bg-gray-50'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors text-sm ${styles.button}`}
        aria-label={t('languageSwitcher.selectLanguage')}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.code.split('-')[0].toUpperCase()}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs"
        >
          ▼
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`absolute top-full right-0 mt-2 min-w-48 rounded-full z-50 overflow-hidden ${styles.dropdown}`}
            >
              <div className="py-2">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => changeLanguage(language.code)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${styles.text} ${styles.hoverBg} ${
                      language.code === i18n.language ? 'opacity-50' : ''
                    }`}
                    disabled={language.code === i18n.language}
                  >
                    <span className="text-lg">{language.flag}</span>
                    <div>
                      <div className="font-medium">{language.name}</div>
                      <div className={`text-xs opacity-70 ${styles.text}`}>
                        {language.code}
                      </div>
                    </div>
                    {language.code === i18n.language && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-3xl"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LanguageSwitcher