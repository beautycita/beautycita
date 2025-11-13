import { useState, useEffect } from 'react';
import CookieConsentBanner from './CookieConsentBanner';
import InstallPrompt from './pwa/InstallPrompt';

/**
 * PopupManager
 *
 * Controls the sequence and timing of all popups/modals:
 * 1. GDPR/Cookie Consent - Shows first, blocks all others
 * 2. Google One Tap - Shows only after GDPR accepted (handled in AuthModal)
 * 3. PWA Install + Play Store - Shows after 5 minutes on site
 *
 * This ensures users aren't bombarded with multiple popups at once
 */
export default function PopupManager() {
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [timeOnSite, setTimeOnSite] = useState(0);

  useEffect(() => {
    // Check if GDPR/cookies already accepted
    const consentStored = localStorage.getItem('cookie-consent');
    setGdprAccepted(!!consentStored);

    // Listen for GDPR acceptance
    const handleConsentAccepted = () => {
      setGdprAccepted(true);
    };

    window.addEventListener('cookie-consent-accepted', handleConsentAccepted);

    return () => {
      window.removeEventListener('cookie-consent-accepted', handleConsentAccepted);
    };
  }, []);

  useEffect(() => {
    // Only start timer after GDPR accepted
    if (!gdprAccepted) return;

    // Track time on site
    const interval = setInterval(() => {
      setTimeOnSite(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gdprAccepted]);

  useEffect(() => {
    // Show PWA prompt after 5 minutes (300 seconds) AND after GDPR accepted
    if (gdprAccepted && timeOnSite >= 300 && !showPWAPrompt) {
      setShowPWAPrompt(true);
    }
  }, [gdprAccepted, timeOnSite, showPWAPrompt]);

  return (
    <>
      {/* Step 1: GDPR/Cookie Consent - Always shows first if not accepted */}
      <CookieConsentBanner />

      {/* Step 2: Google One Tap - Handled in AuthModal, only shows after GDPR */}
      {/* (No component here - GoogleOneTap is integrated into auth modal) */}

      {/* Step 3: PWA Install Prompt - Shows after 5 minutes AND after GDPR accepted */}
      {gdprAccepted && <InstallPrompt show={showPWAPrompt} />}
    </>
  );
}
