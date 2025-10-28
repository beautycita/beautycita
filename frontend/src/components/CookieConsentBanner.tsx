import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, Settings as SettingsIcon, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Don't show banner in native mobile apps (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      return;
    }

    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after 1 second delay
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = async (acceptAll: boolean = false) => {
    const finalPreferences = acceptAll
      ? { necessary: true, functional: true, analytics: true, marketing: true }
      : preferences;

    try {
      // Save to backend
      const response = await fetch('/api/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          necessary_cookies: finalPreferences.necessary,
          functional_cookies: finalPreferences.functional,
          analytics_cookies: finalPreferences.analytics,
          marketing_cookies: finalPreferences.marketing,
          session_id: getSessionId()
        })
      });

      if (response.ok) {
        // Save to localStorage
        localStorage.setItem('cookie-consent', JSON.stringify(finalPreferences));
        localStorage.setItem('cookie-consent-date', new Date().toISOString());
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
      // Save locally even if API fails
      localStorage.setItem('cookie-consent', JSON.stringify(finalPreferences));
      setShowBanner(false);
    }
  };

  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('session-id');
    if (!sessionId) {
      sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session-id', sessionId);
    }
    return sessionId;
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
      >
        <div className="max-w-6xl mx-auto bg-gray-900 border border-pink-500/30 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Cookie className="w-6 h-6 text-white" />
                <h3 className="text-lg font-bold text-white">Cookie Settings</h3>
              </div>
              <button
                onClick={() => saveConsent(false)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close and save necessary cookies only"
                title="Close and save necessary cookies only"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-300 mb-4 leading-relaxed">
              We use cookies to enhance your experience, analyze site traffic, and personalize content.
              By clicking "Accept All", you consent to our use of cookies.{' '}
              <a
                href="/privacy-policy"
                className="text-pink-400 hover:text-pink-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
            </p>

            {/* Quick Actions */}
            {!showDetails && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => saveConsent(true)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Accept All Cookies
                </button>
                <button
                  onClick={() => saveConsent(false)}
                  className="flex-1 px-6 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  Necessary Only
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors border border-gray-700 flex items-center justify-center space-x-2"
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Customize</span>
                </button>
              </div>
            )}

            {/* Detailed Settings */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 space-y-4"
                >
                  {/* Necessary Cookies */}
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-green-400" />
                        <h4 className="font-semibold text-white">Necessary Cookies</h4>
                      </div>
                      <div className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                        Always Active
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      Essential for the website to function properly. These cookies enable basic functions like page navigation and access to secure areas.
                    </p>
                  </div>

                  {/* Functional Cookies */}
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <SettingsIcon className="w-5 h-5 text-blue-400" />
                        <h4 className="font-semibold text-white">Functional Cookies</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.functional}
                          onChange={() => togglePreference('functional')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-gray-400">
                      Enable personalized features such as remembering your preferences, language selection, and region settings.
                    </p>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <SettingsIcon className="w-5 h-5 text-purple-400" />
                        <h4 className="font-semibold text-white">Analytics Cookies</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={() => togglePreference('analytics')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-gray-400">
                      Help us understand how visitors interact with our website to improve performance and user experience.
                    </p>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <SettingsIcon className="w-5 h-5 text-pink-400" />
                        <h4 className="font-semibold text-white">Marketing Cookies</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={() => togglePreference('marketing')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-gray-400">
                      Used to deliver personalized advertisements relevant to you and your interests.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={() => saveConsent(false)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Save Preferences
                    </button>
                    <button
                      onClick={() => saveConsent(true)}
                      className="flex-1 px-6 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors border border-gray-700"
                    >
                      Accept All
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
