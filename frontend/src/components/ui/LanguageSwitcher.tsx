import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useLanguageDetection } from '../../hooks/useLanguageDetection';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentLang, setCurrentLang] = React.useState(i18n.language);
  const detectionResult = useLanguageDetection();

  const languages = [
    { code: 'en-US', shortCode: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es-MX', shortCode: 'es', name: 'Español', flag: '🇲🇽' }
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('beautyCitaLanguage', languageCode); // Match the key used in useLanguageDetection
    setCurrentLang(languageCode);
    setIsOpen(false);
  };

  React.useEffect(() => {
    setCurrentLang(i18n.language);
    console.log('[LanguageSwitcher] Language changed to:', i18n.language);
  }, [i18n.language]);

  const currentLanguage = languages.find(lang =>
    lang.code === currentLang ||
    lang.shortCode === currentLang ||
    currentLang.startsWith(lang.shortCode)
  ) || languages[0]; // Default to English instead of Spanish

  const getDetectionMethodLabel = () => {
    switch (detectionResult.detectionMethod) {
      case 'user-preference':
        return 'Your choice';
      case 'browser':
        return 'Browser detected';
      case 'ip-geolocation':
        return detectionResult.country ? `Detected from ${detectionResult.country}` : 'Location detected';
      default:
        return 'Default';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-0 rounded-full hover:bg-gray-100/50 transition-all duration-300"
      >
        <GlobeAltIcon className="h-4 w-4 text-gray-600" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm text-gray-700 font-medium hidden sm:inline">
          {currentLanguage.name}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-gray-200 z-50">
            {/* Detection Info Banner */}
            {!detectionResult.isLoading && detectionResult.detectionMethod !== 'user-preference' && (
              <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200 rounded-t-xl">
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <SparklesIcon className="h-3.5 w-3.5 text-purple-600" />
                  <span className="font-medium">{getDetectionMethodLabel()}</span>
                </div>
              </div>
            )}

            {/* Language Options */}
            <div className="p-2">
              {languages.map((language) => {
                const isActive = currentLang === language.code || currentLang === language.shortCode;
                return (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-full transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{language.flag}</span>
                    <span className="font-medium">{language.name}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-3xl"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Helper Text */}
            <div className="px-3 py-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Your selection will be saved
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;