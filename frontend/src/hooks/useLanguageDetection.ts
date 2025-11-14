import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://beautycita.com';

interface LanguageDetectionResult {
  language: string;
  detectionMethod: 'user-preference' | 'browser' | 'ip-geolocation' | 'default';
  country?: string;
  isLoading: boolean;
}

/**
 * Custom hook for intelligent language detection
 * Priority: User Preference (localStorage) > Browser Language > IP Geolocation > Default
 */
export const useLanguageDetection = (): LanguageDetectionResult => {
  const { i18n } = useTranslation();
  const [detectionResult, setDetectionResult] = useState<LanguageDetectionResult>({
    language: 'es-MX',
    detectionMethod: 'default',
    isLoading: true
  });

  useEffect(() => {
    const detectLanguage = async () => {
      try {
        // Priority 1: User's explicit choice (localStorage)
        const savedLanguage = localStorage.getItem('beautyCitaLanguage');
        if (savedLanguage) {
          i18n.changeLanguage(savedLanguage);
          setDetectionResult({
            language: savedLanguage,
            detectionMethod: 'user-preference',
            isLoading: false
          });
          console.log('🌐 Language: User Preference ->', savedLanguage);
          return;
        }

        // Priority 2: Browser language preference
        const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'es-MX';

        // Map browser language to supported languages
        let browserLanguageCode = 'es-MX'; // Default
        if (browserLang.startsWith('en')) {
          browserLanguageCode = 'en-US';
        } else if (browserLang.startsWith('es')) {
          browserLanguageCode = 'es-MX';
        }

        // Priority 3: Try IP-based geolocation (async, fallback on error)
        try {
          const geoResponse = await axios.get(`${API_URL}/geolocation/detect-language`, {
            timeout: 3000, // 3 second timeout
            headers: {
              'Accept': 'application/json'
            }
          });

          if (geoResponse.data.success && geoResponse.data.language) {
            const geoLanguage = geoResponse.data.language;

            // If browser language and geo language match, use that
            // Otherwise, prefer browser language (user's explicit OS setting)
            const finalLanguage = browserLanguageCode;

            i18n.changeLanguage(finalLanguage);
            setDetectionResult({
              language: finalLanguage,
              detectionMethod: browserLanguageCode === geoLanguage ? 'browser' : 'browser',
              country: geoResponse.data.country,
              isLoading: false
            });

            console.log('🌐 Language Detection:', {
              browser: browserLanguageCode,
              geolocation: geoLanguage,
              country: geoResponse.data.country,
              final: finalLanguage,
              method: browserLanguageCode === geoLanguage ? 'browser-matches-geo' : 'browser-preference'
            });
            return;
          }
        } catch (geoError) {
          console.log('⚠️ Geolocation detection failed, using browser language:', geoError instanceof Error ? geoError.message : 'Unknown error');
        }

        // Fallback to browser language if geolocation fails
        i18n.changeLanguage(browserLanguageCode);
        setDetectionResult({
          language: browserLanguageCode,
          detectionMethod: 'browser',
          isLoading: false
        });
        console.log('🌐 Language: Browser Language ->', browserLanguageCode);

      } catch (error) {
        // Ultimate fallback to default
        const defaultLanguage = 'es-MX';
        i18n.changeLanguage(defaultLanguage);
        setDetectionResult({
          language: defaultLanguage,
          detectionMethod: 'default',
          isLoading: false
        });
        console.log('🌐 Language: Default (error fallback) ->', defaultLanguage);
      }
    };

    detectLanguage();
  }, []); // Run once on mount

  return detectionResult;
};

export default useLanguageDetection;
