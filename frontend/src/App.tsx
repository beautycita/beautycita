import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect, useState, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import AphroditeChat, { AphroditeFloatingButton } from './components/ai/AphroditeChat'
import { Permission } from './lib/permissions'
import { BCLoading } from './components/beautycita'
import migrateToSecureStorage from './utils/storageMigration'
import { Capacitor } from '@capacitor/core'

// Layout components (always loaded - needed everywhere)
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/layout/ScrollToTop'

import CookieConsentBanner from "./components/CookieConsentBanner"
// PWA components
import InstallPrompt from './components/pwa/InstallPrompt'

// ============================================================================
// ALWAYS LOADED: Critical pages for initial render (~100 KB)
// ============================================================================
import HomePage from './pages/HomePage'
import UnifiedAuthPage from './pages/auth/UnifiedAuthPage'
import SimpleRegisterPage from './pages/auth/SimpleRegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import UnauthorizedPage from './pages/UnauthorizedPage'

// ============================================================================
// LAZY LOADED: All other pages load on demand
// ============================================================================

// Auth & Recovery pages
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const VerifyPhonePage = lazy(() => import('./pages/auth/VerifyPhonePage'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'))
const AuthCallback = lazy(() => import('./components/AuthCallback'))

// Public pages
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const StylistsPage = lazy(() => import('./pages/StylistsPage'))
const StylistProfilePage = lazy(() => import('./pages/StylistProfilePage'))
const StylistPortfolioSlideshow = lazy(() => import('./pages/public/StylistPortfolioSlideshow'))
const BookingPage = lazy(() => import('./pages/BookingPage'))

// Profile & Settings
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ProfileEditPage = lazy(() => import('./pages/profile/ProfileEditPage'))
const ProfileOnboardingPage = lazy(() => import('./pages/profile/FormikOnboardingPage'))
const ClientOnboardingWizard = lazy(() => import("./pages/ClientOnboardingWizard"))
const BecomeStylistPage = lazy(() => import('./pages/profile/BecomeStylistPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))

// Dashboard pages (includes heavy charts/calendar dependencies)
const BookingsPage = lazy(() => import('./pages/BookingsPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const PortfolioPage = lazy(() => import('./pages/dashboard/PortfolioPage'))
const RevenuePage = lazy(() => import('./pages/dashboard/RevenuePage'))
const ReminderStatsPage = lazy(() => import('./pages/dashboard/ReminderStatsPage'))
const DashboardServicesPage = lazy(() => import('./pages/dashboard/ServicesPage'))
const SchedulePage = lazy(() => import('./pages/dashboard/SchedulePage'))
const BookingsCalendarPage = lazy(() => import('./pages/dashboard/BookingsCalendarPage'))
const StylistProfileEditPage = lazy(() => import('./pages/dashboard/StylistProfileEditPage'))

// Communication pages (includes Socket.io)
const MessagesPage = lazy(() => import('./pages/MessagesPage'))

// Disputes
const DisputesPage = lazy(() => import('./pages/DisputesPage'))
const DisputeDetailPage = lazy(() => import('./pages/DisputeDetailPage'))

// Heavy feature pages
const VideoConsultationPage = lazy(() => import('./pages/VideoConsultationPage')) // Twilio Video
const PaymentMethodsPage = lazy(() => import('./pages/PaymentMethodsPage'))

// Development showcases - REMOVED (AnimationShowcase, LogoShowcase)

// Unified Panel (single dashboard for all users)
const UnifiedPanel = lazy(() => import('./pages/UnifiedPanel'))

// Panel sub-pages (admin/superadmin management pages)
const PanelUsers = lazy(() => import('./pages/panel/PanelUsers'))
const PanelApplications = lazy(() => import('./pages/panel/PanelApplications'))
const PanelStylistApplications = lazy(() => import('./pages/panel/PanelStylistApplications'))
const PanelMarketing = lazy(() => import('./pages/panel/PanelMarketing'))
const PanelBookings = lazy(() => import('./pages/panel/PanelBookings'))
const PanelServices = lazy(() => import('./pages/panel/PanelServices'))
const PanelDisputes = lazy(() => import('./pages/panel/PanelDisputes'))
const PanelIssues = lazy(() => import('./pages/panel/PanelIssues'))
const PanelFinance = lazy(() => import('./pages/panel/PanelFinance'))
const PanelAnalytics = lazy(() => import('./pages/panel/PanelAnalytics'))
const PanelSystem = lazy(() => import('./pages/panel/PanelSystem'))
const PanelNativeApps = lazy(() => import('./pages/panel/PanelNativeApps'))

const AppDownloadPage = lazy(() => import('./pages/AppDownloadPage'))
const QrGeneratorPage = lazy(() => import('./pages/QrGeneratorPage'))

// Footer link pages
const AboutPage = lazy(() => import('./pages/AboutPage'))
const CareersPage = lazy(() => import('./pages/CareersPage'))
const PressPage = lazy(() => import('./pages/PressPage'))
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'))
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage'))
const PlatformPage = lazy(() => import('./pages/PlatformPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const StylistGuidePage = lazy(() => import('./pages/StylistGuidePage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const BtcPaymentSupportPage = lazy(() => import('./pages/BtcPaymentSupportPage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const PlayStorePrivacyPolicy = lazy(() => import('./pages/PlayStorePrivacyPolicy'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const CookiesPage = lazy(() => import('./pages/CookiesPage'))
const LicensesPage = lazy(() => import('./pages/LicensesPage'))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'))
const PoliciesPage = lazy(() => import('./pages/PoliciesPage'))
const CommissionsPage = lazy(() => import('./pages/CommissionsPage'))

// Client Protection & Trust pages - REMOVED (WorkShowcasePage, PortfolioShowcasePage, TeamCommentsPage)
const VerifiedProfessionalsPage = lazy(() => import('./pages/VerifiedProfessionalsPage'))
const SecurePaymentsPage = lazy(() => import('./pages/SecurePaymentsPage'))
const DisputeResolutionPage = lazy(() => import('./pages/DisputeResolutionPage'))
const MoneyBackGuaranteePage = lazy(() => import('./pages/MoneyBackGuaranteePage'))
const ClientProtectionPage = lazy(() => import('./pages/ClientProtectionPage'))

// Client pages
const BitcoinPage = lazy(() => import('./pages/client/BitcoinPage'))

// Business Dashboard
const BusinessDashboard = lazy(() => import('./pages/business/BusinessDashboard'))

// Stylist Application (includes Survey library)
const StylistApplicationPage = lazy(() => import('./pages/stylist/StylistApplicationPage'))

// Stylist Locations Manager
const StylistLocationsManager = lazy(() => import('./pages/stylist/StylistLocationsManager'))

// Protected Route component
import ProtectedRoute from './components/auth/ProtectedRoute'

// Panel Router Component - Routes to UnifiedPanel (single dashboard for all roles)
function PanelRouter() {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // All roles now use the unified panel which adapts based on permissions
  return <Navigate to="/panel" replace />
}

function AppLayout() {
  const location = useLocation()
  const [isAphroditeOpen, setIsAphroditeOpen] = useState(false)
  const { t } = useTranslation()

  // Hide navbar/footer in native mobile app (Capacitor)
  const hideLayout = Capacitor.isNativePlatform()

  // Hide Aphrodite on panel pages and auth pages (login/register)
  const hideAphrodite = location.pathname.startsWith('/panel') ||
                        location.pathname.startsWith('/login') ||
                        location.pathname.startsWith('/register') ||
                        location.pathname.startsWith('/auth') ||
                        location.pathname.includes('/stylist/login') ||
                        location.pathname.includes('/admin/login')

  return (
    <>
      {!hideLayout && <Navbar />}
      <main className="flex-grow">
        <Suspense fallback={<BCLoading size="xl" fullScreen text={t('common.loading')} />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
                  {/* Unified Auth Pages - All registration methods (Google, Biometric, Email/Password) */}
                  <Route path="/auth" element={<UnifiedAuthPage mode="login" role="CLIENT" />} />
                  <Route path="/login" element={<UnifiedAuthPage mode="login" role="CLIENT" />} />
                  <Route path="/register" element={<UnifiedAuthPage mode="register" role="CLIENT" />} />

                  {/* Stylist auth - LOGIN ONLY (registration via client onboarding + upgrade) */}
                  <Route path="/stylist/auth" element={<UnifiedAuthPage mode="login" role="STYLIST" />} />
                  <Route path="/stylist/login" element={<UnifiedAuthPage mode="login" role="STYLIST" />} />
                  <Route path="/stylist/register" element={<Navigate to="/register" replace />} />

                  {/* Client routes (matching stylist pattern) */}
                  <Route path="/client/auth" element={<UnifiedAuthPage mode="login" role="CLIENT" />} />
                  <Route path="/client/login" element={<UnifiedAuthPage mode="login" role="CLIENT" />} />
                  <Route path="/client/register" element={<UnifiedAuthPage mode="register" role="CLIENT" />} />

                  {/* Admin routes */}
                  <Route path="/admin/login" element={<UnifiedAuthPage mode="login" role="ADMIN" />} />
                  <Route path="/login/admin" element={<UnifiedAuthPage mode="login" role="ADMIN" />} />

                  {/* Legacy routes for backward compatibility */}
                  <Route path="/login/client" element={<UnifiedAuthPage mode="login" role="CLIENT" />} />
                  <Route path="/login/stylist" element={<UnifiedAuthPage mode="login" role="STYLIST" />} />
                  <Route path="/register/client" element={<UnifiedAuthPage mode="register" role="CLIENT" />} />
                  <Route path="/register/stylist" element={<Navigate to="/register" replace />} />

                  {/* Legacy phone-only registration (deprecated, use /register instead) */}
                  <Route path="/register/phone" element={<SimpleRegisterPage />} />

                  {/* Password recovery and verification */}
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-phone" element={<VerifyPhonePage />} />
                  <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/stylists" element={<StylistsPage />} />
                  <Route path="/stylist/:id" element={<StylistProfilePage />} />

                  {/* Footer link pages */}
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/careers" element={<CareersPage />} />
                  <Route path="/press" element={<PressPage />} />
                  <Route path="/downloads" element={<DownloadsPage />} />
                  <Route path="/testimonials" element={<TestimonialsPage />} />
                  <Route path="/platform" element={<PlatformPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/stylist-guide" element={<StylistGuidePage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/support/btc-payment" element={<BtcPaymentSupportPage />} />
                  <Route path="/status" element={<StatusPage />} />
                  <Route path="/report" element={<ReportPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/privacy/play-store" element={<PlayStorePrivacyPolicy />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/cookies" element={<CookiesPage />} />
                  <Route path="/licenses" element={<LicensesPage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/policies" element={<PoliciesPage />} />
                  <Route path="/commissions" element={<CommissionsPage />} />

                  {/* Client Protection & Trust pages */}
                  <Route path="/verified-professionals" element={<VerifiedProfessionalsPage />} />
                  <Route path="/secure-payments" element={<SecurePaymentsPage />} />
                  <Route path="/dispute-resolution" element={<DisputeResolutionPage />} />
                  <Route path="/money-back-guarantee" element={<MoneyBackGuaranteePage />} />
                  <Route path="/client-protection" element={<ClientProtectionPage />} />

                  {/* Protected routes */}
                  <Route
                    path="/book/:stylistId/:serviceId"
                    element={
                      <ProtectedRoute>
                        <BookingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/onboarding"
                    element={
                      <ProtectedRoute>
                        <ProfileOnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/client/onboarding"
                    element={
                      <ProtectedRoute>
                        <ClientOnboardingWizard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/become-stylist"
                    element={
                      <ProtectedRoute>
                        <BecomeStylistPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/business/*"
                    element={
                      <ProtectedRoute>
                        <BusinessDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stylist-application"
                    element={
                      <ProtectedRoute>
                        <StylistApplicationPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stylist/locations"
                    element={
                      <ProtectedRoute>
                        <StylistLocationsManager />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/client/bitcoin"
                    element={
                      <ProtectedRoute>
                        <BitcoinPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/bookings"
                    element={
                      <ProtectedRoute>
                        <BookingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/portfolio"
                    element={
                      <ProtectedRoute>
                        <PortfolioPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/revenue"
                    element={
                      <ProtectedRoute>
                        <RevenuePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/reminders"
                    element={
                      <ProtectedRoute>
                        <ReminderStatsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/services"
                    element={
                      <ProtectedRoute>
                        <DashboardServicesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/schedule"
                    element={
                      <ProtectedRoute>
                        <SchedulePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/bookings"
                    element={
                      <ProtectedRoute>
                        <BookingsCalendarPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/profile/edit"
                    element={
                      <ProtectedRoute>
                        <StylistProfileEditPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/favorites"
                    element={
                      <ProtectedRoute>
                        <FavoritesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment-methods"
                    element={
                      <ProtectedRoute>
                        <PaymentMethodsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* New features - Disputes, Messages, Video */}
                  <Route
                    path="/disputes"
                    element={
                      <ProtectedRoute>
                        <DisputesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/disputes/:id"
                    element={
                      <ProtectedRoute>
                        <DisputeDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute>
                        <MessagesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/video/:id"
                    element={
                      <ProtectedRoute>
                        <VideoConsultationPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Unified Control Panel - SINGLE DASHBOARD FOR ALL ROLES AT /panel */}
                  <Route
                    path="/panel"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN', 'STYLIST', 'CLIENT']}>
                        <UnifiedPanel />
                      </ProtectedRoute>
                    }
                  />

                  {/* Panel Sub-Routes - Admin/Superadmin Management Pages */}
                  <Route
                    path="/panel/users"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                        <PanelUsers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/applications"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                        <PanelApplications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/stylist-applications"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                        <PanelStylistApplications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/bookings"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                        <PanelBookings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/services"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN', 'STYLIST']}>
                        <PanelServices />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/disputes"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                        <PanelDisputes />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/issues"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                        <PanelIssues />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/marketing"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                        <PanelMarketing />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/finance"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                        <PanelFinance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/analytics"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                        <PanelAnalytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/system"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN']}>
                        <PanelSystem />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/native-apps"
                    element={
                      <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
                        <PanelNativeApps />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/panel/settings"
                    element={<Navigate to="/profile" replace />}
                  />

                  {/* QR Generator - Public access */}
                  <Route path="/qr-generator" element={<QrGeneratorPage />} />

                  {/* App Downloads - ONLY ADMIN/SUPERADMIN */}
                  <Route
                    path="/download-app"
                    element={
                      <ProtectedRoute requiredPermissions={[Permission.VIEW_ISSUES]}>
                        <AppDownloadPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Error pages */}
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {!hideLayout && <Footer />}

      {/* Aphrodite AI Chatbot - Hidden on panel pages */}
      {!hideAphrodite && (
        <>
          <AphroditeFloatingButton onClick={() => setIsAphroditeOpen(true)} />
          <AphroditeChat
            isOpen={isAphroditeOpen}
            onClose={() => setIsAphroditeOpen(false)}
          />
        </>
      )}
      {/* PWA Install Prompt and Cookie Consent - web only, not needed in native app */}
      {!hideLayout && (
        <>
          <InstallPrompt />
          <CookieConsentBanner />
        </>
      )}
    </>
  )
}

function App() {
  const { user, checkAuth } = useAuthStore()
  const { t } = useTranslation()

  // Run storage migration on first app launch (mobile only)
  useEffect(() => {
    migrateToSecureStorage().catch(error => {
      console.error('Storage migration failed:', error)
    })
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ScrollToTop />
      <Routes>
        {/* Portfolio route - NO layout (must come before other routes to avoid navbar/footer) */}
        <Route path="/p/:username" element={
          <Suspense fallback={<BCLoading size="xl" fullScreen text={t('portfolio.loading')} />}>
            <StylistPortfolioSlideshow />
          </Suspense>
        } />

        {/* All other routes with conditional layout */}
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </div>
  )
}

export default App
