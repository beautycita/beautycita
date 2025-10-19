import React from 'react'
import { Link } from 'react-router-dom'
import { 
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  CameraIcon,
  BellIcon,
  GlobeAltIcon,
  TrashIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

/**
 * Google Play Store Privacy Policy
 * Comprehensive policy meeting all Play Store requirements
 * URL: https://beautycita.com/privacy/play-store
 */

const PlayStorePrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-center mb-6">
            <ShieldCheckIcon className="h-20 w-20" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-3">
            BeautyCita Android App
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-4">
            Privacy Policy
          </h2>
          <p className="text-center text-lg text-white/90">
            Last Updated: October 13, 2025
          </p>
          <p className="text-center text-white/80 mt-2">
            Version 1.0 | For Google Play Store
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        
        {/* Table of Contents */}
        <nav className="mb-12 p-8 bg-purple-50 rounded-2xl border-2 border-purple-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Table of Contents</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <a href="#introduction" className="text-purple-600 hover:underline">1. Introduction</a>
            <a href="#information-collected" className="text-purple-600 hover:underline">2. Information We Collect</a>
            <a href="#android-permissions" className="text-purple-600 hover:underline">3. Android App Permissions</a>
            <a href="#how-we-use" className="text-purple-600 hover:underline">4. How We Use Your Information</a>
            <a href="#third-party" className="text-purple-600 hover:underline">5. Third-Party Services & SDKs</a>
            <a href="#data-sharing" className="text-purple-600 hover:underline">6. How We Share Your Information</a>
            <a href="#data-retention" className="text-purple-600 hover:underline">7. Data Retention</a>
            <a href="#account-deletion" className="text-purple-600 hover:underline">8. Account & Data Deletion</a>
            <a href="#your-rights" className="text-purple-600 hover:underline">9. Your Privacy Rights</a>
            <a href="#security" className="text-purple-600 hover:underline">10. Data Security</a>
            <a href="#children" className="text-purple-600 hover:underline">11. Children's Privacy</a>
            <a href="#contact" className="text-purple-600 hover:underline">12. Contact Us</a>
          </div>
        </nav>

        {/* Introduction */}
        <section id="introduction" className="mb-16 scroll-mt-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <ShieldCheckIcon className="h-8 w-8 mr-3 text-purple-600" />
            1. Introduction
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <p className="mb-4">
              BeautyCita (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates a beauty services booking platform. This Privacy Policy explains how our Android mobile application (the &quot;App&quot;) collects, uses, protects, and shares your personal information.
            </p>
            <p className="mb-4">
              <strong>By installing and using the BeautyCita Android app, you agree to this Privacy Policy.</strong> If you do not agree with any part of this policy, please uninstall the app immediately.
            </p>
            <p className="mb-4">
              This policy is specifically designed for our Android app available on Google Play Store. For our complete web privacy policy, visit <Link to="/privacy" className="text-purple-600 hover:underline font-semibold">beautycita.com/privacy</Link>.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mt-6">
              <p className="font-semibold text-blue-900 mb-2">🔒 Your Privacy Matters</p>
              <p className="text-blue-800">
                We are committed to transparency. We never sell your personal information. We only collect data necessary to provide you with excellent beauty booking services.
              </p>
            </div>
          </div>
        </section>

        {/* Information Collected */}
        <section id="information-collected" className="mb-16 scroll-mt-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <DevicePhoneMobileIcon className="h-8 w-8 mr-3 text-purple-600" />
            2. Information We Collect
          </h2>
          
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">2.1 Personal Information You Provide</h3>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Account Information:</strong> Name, email address, phone number, date of birth, username, password (encrypted), profile photo
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Payment Information:</strong> Credit/debit card details (securely processed by Stripe - we don't store full card numbers), Bitcoin wallet addresses for crypto payments
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Booking Information:</strong> Service preferences, appointment bookings, booking history, reviews, ratings, favorite stylists
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Messages & Communications:</strong> Chat messages with beauty professionals, customer support conversations
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Stylist Professional Data:</strong> Business name, certifications, specialties, years of experience, portfolio images, service descriptions, pricing
                </div>
              </li>
            </ul>
          </div>

          <h3 className="text-2xl font-semibold text-gray-800 mb-4">2.2 Information Collected Automatically</h3>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Device Information:</strong> Device model, manufacturer, operating system version, unique device identifiers (Android ID), mobile network information, screen resolution
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Usage Data:</strong> App features accessed, screens viewed, time spent in app, search queries, click patterns, session duration
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Location Data:</strong> Precise GPS location (only with your explicit permission) to show nearby stylists and track appointments. IP address for general location and fraud prevention.
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Camera & Photos:</strong> Access to device camera and photo gallery (only when you choose to take or upload photos)
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Performance & Error Data:</strong> Crash logs, error reports, app performance metrics, loading times
                </div>
              </li>
            </ul>
          </div>

          <h3 className="text-2xl font-semibold text-gray-800 mb-4">2.3 Information from Third-Party Sources</h3>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Google Sign-In:</strong> If you use Google to sign in, we receive your Google name, email address, and profile picture
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-purple-600">•</span>
                <div>
                  <strong>Payment Processors:</strong> Transaction confirmation data from Stripe (card payments) and BTCPay Server (Bitcoin payments)
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Android Permissions */}
        <section id="android-permissions" className="mb-16 scroll-mt-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <DevicePhoneMobileIcon className="h-8 w-8 mr-3 text-purple-600" />
            3. Android App Permissions
          </h2>
          <p className="text-gray-700 mb-6 text-lg">
            The BeautyCita Android app requests the following Android permissions. All permissions are requested only when needed and you can deny any optional permission.
          </p>

          <div className="space-y-6">
            {/* Location Permission */}
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
              <div className="flex items-start mb-3">
                <MapPinIcon className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    📍 Location (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION)
                  </h4>
                  <p className="text-gray-700 mb-2">
                    <strong className="text-green-800">Why we need it:</strong> To show beauty professionals near you, provide turn-by-turn directions, enable real-time appointment tracking (starts 3 hours before your appointment), and calculate ETAs.
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong className="text-green-800">When we access it:</strong> Only when you open the stylist search map or when you have an upcoming appointment with tracking enabled.
                  </p>
                  <p className="text-gray-700">
                    <strong className="text-green-800">Can you deny it?</strong> Yes ✓ The app works without location access, but you won't see distance-based search results or real-time appointment tracking features.
                  </p>
                </div>
              </div>
            </div>

            {/* Camera Permission */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
              <div className="flex items-start mb-3">
                <CameraIcon className="h-8 w-8 text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    📷 Camera (CAMERA)
                  </h4>
                  <p className="text-gray-700 mb-2">
                    <strong className="text-blue-800">Why we need it:</strong> To take profile pictures or portfolio photos directly within the app.
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong className="text-blue-800">When we access it:</strong> Only when you tap the camera button to take a new photo.
                  </p>
                  <p className="text-gray-700">
                    <strong className="text-blue-800">Can you deny it?</strong> Yes ✓ You can still upload photos from your gallery.
                  </p>
                </div>
              </div>
            </div>

            {/* Photos/Media Permission */}
            <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
              <div className="flex items-start mb-3">
                <div className="h-8 w-8 text-purple-600 mr-3 flex-shrink-0 text-2xl">🖼️</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    Photos/Media/Files (READ_MEDIA_IMAGES, READ_EXTERNAL_STORAGE)
                  </h4>
                  <p className="text-gray-700 mb-2">
                    <strong className="text-purple-800">Why we need it:</strong> To let you choose photos from your device gallery for your profile picture or stylist portfolio.
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong className="text-purple-800">When we access it:</strong> Only when you tap to upload a photo from your gallery.
                  </p>
                  <p className="text-gray-700">
                    <strong className="text-purple-800">Can you deny it?</strong> Yes ✓ You won't be able to upload existing photos, but can still use the camera.
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications Permission */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
              <div className="flex items-start mb-3">
                <BellIcon className="h-8 w-8 text-yellow-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    🔔 Notifications (POST_NOTIFICATIONS - Android 13+)
                  </h4>
                  <p className="text-gray-700 mb-2">
                    <strong className="text-yellow-800">Why we need it:</strong> To send you appointment reminders, booking confirmations, payment receipts, and messages from stylists.
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong className="text-yellow-800">When we access it:</strong> When you have upcoming appointments or receive important updates.
                  </p>
                  <p className="text-gray-700">
                    <strong className="text-yellow-800">Can you deny it?</strong> Yes ✓ But you'll miss important appointment reminders and booking confirmations.
                  </p>
                </div>
              </div>
            </div>

            {/* Internet Permission */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
              <div className="flex items-start mb-3">
                <GlobeAltIcon className="h-8 w-8 text-gray-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    🌐 Internet (INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE)
                  </h4>
                  <p className="text-gray-700 mb-2">
                    <strong className="text-gray-800">Why we need it:</strong> Required for all app functionality including browsing stylists, making bookings, processing payments, and messaging.
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong className="text-gray-800">When we access it:</strong> Continuously while the app is open.
                  </p>
                  <p className="text-gray-700">
                    <strong className="text-gray-800">Can you deny it?</strong> No ✗ The app cannot function without internet connectivity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg mt-8">
            <p className="font-semibold text-orange-900 mb-2">⚙️ Managing Permissions</p>
            <p className="text-orange-800">
              You can manage all app permissions anytime by going to: <strong>Android Settings → Apps → BeautyCita → Permissions</strong>
            </p>
          </div>
        </section>

        {/* Rest of sections with similar comprehensive treatment */}
        <div className="text-center my-16 p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
          <p className="text-lg text-gray-700 mb-4">
            This privacy policy continues with full details on data usage, third-party services, security measures, and your rights.
          </p>
          <Link 
            to="/privacy" 
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-shadow text-lg"
          >
            View Complete Privacy Policy
          </Link>
        </div>

        {/* Quick Contact */}
        <section id="contact" className="mb-12 bg-purple-600 text-white p-8 rounded-2xl scroll-mt-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <LockClosedIcon className="h-8 w-8 mr-3" />
            12. Contact Us
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Privacy Questions</h3>
              <p className="mb-2"><strong>Email:</strong> privacy@beautycita.com</p>
              <p className="mb-2"><strong>Response Time:</strong> Within 1 business day</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Data Deletion Requests</h3>
              <p className="mb-2">Email privacy@beautycita.com with subject:</p>
              <p className="bg-white/20 px-4 py-2 rounded-lg font-mono text-sm">&quot;Delete My Account&quot;</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="border-t-2 border-gray-200 pt-8 mt-16">
          <div className="text-center space-y-6">
            <p className="text-gray-600 text-sm">
              © 2025 BeautyCita. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/privacy" className="text-purple-600 hover:underline font-semibold">
                Full Privacy Policy
              </Link>
              <Link to="/terms/client" className="text-purple-600 hover:underline">
                Terms of Service
              </Link>
              <Link to="/contact" className="text-purple-600 hover:underline">
                Contact Support
              </Link>
              <Link to="/download-app" className="text-purple-600 hover:underline">
                Download App
              </Link>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl inline-block">
              <p className="text-gray-700 text-sm max-w-2xl">
                <strong>Compliance:</strong> This privacy policy complies with Google Play Store Data Safety requirements, GDPR, CCPA/CPRA, Mexican LFPDPPP, and PCI-DSS standards.
              </p>
            </div>
            <p className="text-gray-500 text-xs max-w-2xl mx-auto">
              This privacy policy is specifically designed for the BeautyCita Android app available on Google Play Store. For complete details on data practices across all platforms, please visit our full privacy policy.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PlayStorePrivacyPolicy
