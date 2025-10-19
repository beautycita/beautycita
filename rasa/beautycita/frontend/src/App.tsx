import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

// Layout components
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import StylistRegisterPage from './pages/auth/StylistRegisterPage'
import ServicesPage from './pages/ServicesPage'
import StylistsPage from './pages/StylistsPage'
import StylistProfilePage from './pages/StylistProfilePage'
import BookingPage from './pages/BookingPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import BookingsPage from './pages/BookingsPage'
import NotFoundPage from './pages/NotFoundPage'

// Footer link pages
import AboutPage from './pages/AboutPage'
import CareersPage from './pages/CareersPage'
import PressPage from './pages/PressPage'
import BlogPage from './pages/BlogPage'
import HelpPage from './pages/HelpPage'
import ContactPage from './pages/ContactPage'
import StatusPage from './pages/StatusPage'
import ReportPage from './pages/ReportPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import CookiesPage from './pages/CookiesPage'
import LicensesPage from './pages/LicensesPage'
import ResourcesPage from './pages/ResourcesPage'
import PoliciesPage from './pages/PoliciesPage'
import CommissionsPage from './pages/CommissionsPage'

// Protected Route component
import ProtectedRoute from './components/auth/ProtectedRoute'

// Chat Widget
import ChatWidget from './components/chat/ChatWidget'

// Mobile components
import BottomNavigation from './components/mobile/BottomNavigation'

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex flex-col">
      <Navbar />

      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/stylist" element={<StylistRegisterPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/stylists" element={<StylistsPage />} />
          <Route path="/stylist/:id" element={<StylistProfilePage />} />

          {/* Footer link pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/press" element={<PressPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/licenses" element={<LicensesPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/commissions" element={<CommissionsPage />} />

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
            path="/dashboard"
            element={
              <ProtectedRoute roles={['STYLIST', 'ADMIN']}>
                <DashboardPage />
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

          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}

export default App