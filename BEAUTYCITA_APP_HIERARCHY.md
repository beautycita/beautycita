# BeautyCita Application Hierarchy Map
**Total Pages:** 82 pages
**Last Updated:** October 16, 2025

---

## 📊 Application Structure Overview

```
BeautyCita Platform
│
├── 🌐 PUBLIC PAGES (27 pages)
├── 🔐 AUTHENTICATION (6 pages)
├── 👤 USER PROFILE & SETTINGS (7 pages)
├── 💼 STYLIST FEATURES (14 pages)
├── 🛍️ CLIENT FEATURES (7 pages)
├── 👔 BUSINESS DASHBOARD (8 pages)
├── 🎛️ ADMIN PANEL (11 pages)
└── ⚠️ ERROR PAGES (2 pages)
```

---

## 🌐 PUBLIC PAGES (No Login Required)
**Total: 27 pages**

### Home & Discovery
```
/ ────────────────────────── HomePage
/services ─────────────────── ServicesPage
/stylists ─────────────────── StylistsPage
/stylist/:id ──────────────── StylistProfilePage
/p/:username ──────────────── StylistPortfolioSlideshow (Fullscreen)
```

### Information Pages
```
/about ────────────────────── AboutPage
/careers ──────────────────── CareersPage
/press ────────────────────── PressPage
/blog ─────────────────────── BlogPage
/blog/:slug ───────────────── BlogPostPage
/help ─────────────────────── HelpPage
/contact ──────────────────── ContactPage
/status ───────────────────── StatusPage (Platform status)
/report ───────────────────── ReportPage (Report abuse)
```

### Legal & Compliance
```
/privacy ──────────────────── PrivacyPage
/privacy/play-store ───────── PlayStorePrivacyPolicy
/terms ────────────────────── TermsPage
/cookies ──────────────────── CookiesPage
/licenses ─────────────────── LicensesPage
/resources ────────────────── ResourcesPage
/policies ─────────────────── PoliciesPage
```

### Trust & Safety
```
/verified-professionals ───── VerifiedProfessionalsPage
/secure-payments ──────────── SecurePaymentsPage
/dispute-resolution ───────── DisputeResolutionPage
/money-back-guarantee ─────── MoneyBackGuaranteePage
/client-protection ────────── ClientProtectionPage
/commissions ──────────────── CommissionsPage
```

### Tools
```
/qr-generator ─────────────── QrGeneratorPage (Public QR code generator)
```

---

## 🔐 AUTHENTICATION PAGES
**Total: 6 pages**

### Login & Registration
```
/login ────────────────────── UnifiedAuthPage (mode: login, role: CLIENT)
/register ─────────────────── SimpleRegisterPage
/auth ─────────────────────── UnifiedAuthPage (Generic auth)

/stylist/login ────────────── UnifiedAuthPage (mode: login, role: STYLIST)
/stylist/register ─────────── SimpleRegisterPage (Stylist variant)
/stylist/auth ─────────────── UnifiedAuthPage (Stylist auth)

/client/login ─────────────── UnifiedAuthPage (mode: login, role: CLIENT)
/client/register ──────────── SimpleRegisterPage (Client variant)
/client/auth ──────────────── UnifiedAuthPage (Client auth)

/admin/login ──────────────── UnifiedAuthPage (mode: login, role: ADMIN)
/login/admin ──────────────── UnifiedAuthPage (Admin variant)
```

### Password Recovery
```
/forgot-password ──────────── ForgotPasswordPage
/reset-password ───────────── ResetPasswordPage
```

### Verification
```
/verify-phone ─────────────── VerifyPhonePage
/verify-email/:token ──────── VerifyEmailPage
/auth/callback ────────────── AuthCallback (OAuth callback)
```

---

## 👤 USER PROFILE & SETTINGS (Protected)
**Total: 7 pages**
**Access:** All authenticated users

```
/profile ──────────────────── ProfilePage
/profile/edit ─────────────── ProfileEditPage
/profile/onboarding ───────── FormikOnboardingPage
/profile/become-stylist ───── BecomeStylistPage
/settings ─────────────────── SettingsPage
/stylist-application ──────── StylistApplicationPage (6-step wizard)
```

### Unified Panel (Dashboard Hub)
```
/panel ────────────────────── UnifiedPanel
                              ↳ Adaptive dashboard for ALL roles
                              ↳ Shows different cards based on permissions
                              ↳ CLIENT: Bookings, favorites, messages
                              ↳ STYLIST: Revenue, schedule, services, portfolio
                              ↳ ADMIN/SUPERADMIN: Users, analytics, system
```

---

## 💼 STYLIST FEATURES (Protected)
**Total: 14 pages**
**Access:** STYLIST role + authenticated

### Dashboard Pages
```
/dashboard/portfolio ──────── PortfolioPage (Cloudflare R2 images)
/dashboard/revenue ────────── RevenuePage (Earnings, Stripe Connect)
/dashboard/reminders ──────── ReminderStatsPage (SMS notifications)
/dashboard/services ───────── ServicesPage (Manage services)
/dashboard/schedule ───────── SchedulePage (Availability)
/dashboard/bookings ───────── BookingsCalendarPage (Syncfusion calendar)
/dashboard/profile/edit ───── StylistProfileEditPage
/dashboard/stripe-onboarding ─ StripeOnboardingPage
/dashboard/unified ────────── UnifiedDashboard
```

### Business Dashboard (Advanced)
```
/business ─────────────────── BusinessDashboard (Main hub)
/business/analytics ───────── BusinessAnalytics
/business/availability ────── BusinessAvailability
/business/calendar ────────── BusinessCalendar
/business/clients ─────────── BusinessClients
/business/earnings ────────── BusinessEarnings
/business/services ────────── BusinessServices
/business/settings ────────── BusinessSettings
```

---

## 🛍️ CLIENT FEATURES (Protected)
**Total: 7 pages**
**Access:** CLIENT role + authenticated

### Booking & Favorites
```
/book/:stylistId/:serviceId ─ BookingPage
/bookings ─────────────────── BookingsPage (My bookings)
/favorites ────────────────── FavoritesPage (Saved stylists)
```

### Payments & Disputes
```
/payment-methods ──────────── PaymentMethodsPage (Stripe payment methods)
/disputes ─────────────────── DisputesPage (My disputes)
/disputes/:id ─────────────── DisputeDetailPage
```

### Communication
```
/messages ─────────────────── MessagesPage (Socket.io real-time chat)
```

### Alternative Payments
```
/client/bitcoin ───────────── BitcoinPage (BTCPay integration)
```

### Video Consultation
```
/video/:id ────────────────── VideoConsultationPage (Twilio Video)
```

---

## 🎛️ ADMIN PANEL (Protected - Admin Only)
**Total: 11 pages**
**Access:** ADMIN or SUPERADMIN roles

### Panel Sub-Pages (Management)
```
/panel/users ──────────────── PanelUsers (User management)
                              ↳ Access: SUPERADMIN, ADMIN

/panel/applications ───────── PanelApplications (Stylist applications)
                              ↳ Access: SUPERADMIN, ADMIN

/panel/bookings ───────────── PanelBookings (All platform bookings)
                              ↳ Access: SUPERADMIN, ADMIN

/panel/services ───────────── PanelServices (Service management)
                              ↳ Access: SUPERADMIN, ADMIN

/panel/disputes ───────────── PanelDisputes (Dispute management)
                              ↳ Access: SUPERADMIN, ADMIN

/panel/issues ─────────────── PanelIssues (Support tickets)
                              ↳ Access: SUPERADMIN, ADMIN

/panel/marketing ──────────── PanelMarketing (Campaigns, analytics)
                              ↳ Access: SUPERADMIN, ADMIN

/panel/finance ────────────── PanelFinance (Revenue, payouts)
                              ↳ Access: SUPERADMIN, ADMIN

/panel/analytics ──────────── PanelAnalytics (Platform metrics)
                              ↳ Access: SUPERADMIN, ADMIN

/panel/system ─────────────── PanelSystem (System settings)
                              ↳ Access: SUPERADMIN ONLY

/panel/native-apps ────────── PanelNativeApps (Mobile app management)
                              ↳ Access: SUPERADMIN, ADMIN
```

### Special Admin Pages
```
/download-app ─────────────── AppDownloadPage (Admin only - APK downloads)
                              ↳ Requires: Permission.VIEW_ISSUES
```

---

## ⚠️ ERROR PAGES
**Total: 2 pages**

```
/unauthorized ─────────────── UnauthorizedPage (403)
/* ────────────────────────── NotFoundPage (404 catch-all)
```

---

## 📋 CATEGORIZED BY FUNCTION

### 🔒 Authentication & Security (6 pages)
- UnifiedAuthPage, SimpleRegisterPage
- ForgotPasswordPage, ResetPasswordPage
- VerifyPhonePage, VerifyEmailPage

### 🏠 Home & Marketing (10 pages)
- HomePage, ServicesPage, StylistsPage
- AboutPage, CareersPage, PressPage
- BlogPage, BlogPostPage
- StylistProfilePage, StylistPortfolioSlideshow

### 📚 Information & Support (9 pages)
- HelpPage, ContactPage, StatusPage, ReportPage
- PrivacyPage, TermsPage, CookiesPage
- LicensesPage, ResourcesPage, PoliciesPage
- PlayStorePrivacyPolicy

### 🛡️ Trust & Safety (6 pages)
- VerifiedProfessionalsPage
- SecurePaymentsPage
- DisputeResolutionPage
- MoneyBackGuaranteePage
- ClientProtectionPage
- CommissionsPage

### 👤 User Management (7 pages)
- ProfilePage, ProfileEditPage
- ProfileOnboardingPage, FormikOnboardingPage
- BecomeStylistPage, StylistApplicationPage
- SettingsPage

### 💼 Stylist Tools (9 pages)
- PortfolioPage, RevenuePage, ReminderStatsPage
- ServicesPage (dashboard), SchedulePage
- BookingsCalendarPage, StylistProfileEditPage
- StripeOnboardingPage, UnifiedDashboard

### 🏢 Business Dashboard (8 pages)
- BusinessDashboard
- BusinessAnalytics, BusinessAvailability
- BusinessCalendar, BusinessClients
- BusinessEarnings, BusinessServices, BusinessSettings

### 🛒 Client Features (9 pages)
- BookingPage, BookingsPage, FavoritesPage
- PaymentMethodsPage, DisputesPage, DisputeDetailPage
- MessagesPage, VideoConsultationPage
- BitcoinPage

### 🎛️ Admin Panel (11 pages)
- UnifiedPanel (hub)
- PanelUsers, PanelApplications, PanelBookings
- PanelServices, PanelDisputes, PanelIssues
- PanelMarketing, PanelFinance, PanelAnalytics
- PanelSystem, PanelNativeApps

### 🔧 Utilities (3 pages)
- QrGeneratorPage, AppDownloadPage
- AuthCallback

### ⚠️ Errors (2 pages)
- UnauthorizedPage, NotFoundPage

---

## 🔐 ACCESS CONTROL MATRIX

| Role           | Public | Auth Pages | Profile | Stylist | Business | Client | Admin Panel |
|----------------|--------|------------|---------|---------|----------|--------|-------------|
| **Guest**      | ✅     | ✅         | ❌      | ❌      | ❌       | ❌     | ❌          |
| **CLIENT**     | ✅     | ✅         | ✅      | ❌      | ❌       | ✅     | ❌          |
| **STYLIST**    | ✅     | ✅         | ✅      | ✅      | ✅       | ❌     | ❌          |
| **ADMIN**      | ✅     | ✅         | ✅      | ✅      | ✅       | ✅     | ✅ (10/11)  |
| **SUPERADMIN** | ✅     | ✅         | ✅      | ✅      | ✅       | ✅     | ✅ (11/11)  |

**Note:** `/panel/system` is SUPERADMIN only. All other panel pages require ADMIN or SUPERADMIN.

---

## 🎨 SPECIAL LAYOUT PAGES

### Pages WITHOUT Navbar/Footer
```
/p/:username ──────────────── StylistPortfolioSlideshow
                              ↳ Fullscreen immersive portfolio
                              ↳ No layout components
```

### Pages WITHOUT Aphrodite AI Chatbot
```
/panel/* ──────────────────── All panel pages
                              ↳ Admin interface - no AI chat
```

---

## 📱 MOBILE APP SPECIFIC

### Progressive Web App (PWA)
- All pages support PWA installation
- Service Worker caching (197 entries)
- Offline fallback pages
- Install prompt component

### Native Apps (Android/iOS via Capacitor)
```
/download-app ─────────────── Admin download page for APKs
/qr-generator ─────────────── Generate QR codes for app downloads
```

---

## 🔄 ROUTE REDIRECTS

```
/panel/settings → /profile
/business → /business (Main dashboard)
/dashboard → /panel (Unified dashboard)
```

---

## 📊 PAGE COUNT SUMMARY

| Category                  | Count |
|---------------------------|-------|
| **Public Pages**          | 27    |
| **Auth Pages**            | 6     |
| **Profile & Settings**    | 7     |
| **Stylist Dashboard**     | 9     |
| **Business Dashboard**    | 8     |
| **Client Features**       | 9     |
| **Admin Panel**           | 11    |
| **Utilities**             | 3     |
| **Error Pages**           | 2     |
| **TOTAL**                 | **82** |

---

## 🔗 EXTERNAL INTEGRATIONS

### Payment Systems
- `/payment-methods` → Stripe Payment Methods API
- `/dashboard/revenue` → Stripe Connect
- `/client/bitcoin` → BTCPay Server

### Communication
- `/messages` → Socket.io Real-time
- `/video/:id` → Twilio Video API
- `/dashboard/reminders` → Twilio SMS

### Storage
- `/dashboard/portfolio` → Cloudflare R2

### OAuth
- `/auth/callback` → Google OAuth 2.0

### Scheduling
- `/dashboard/bookings` → Syncfusion Scheduler

---

## 🧭 NAVIGATION PATHS

### Primary User Journeys

**Guest → Client:**
```
/ → /register → /verify-phone → /profile/onboarding → /stylists → /stylist/:id → /book/:stylistId/:serviceId → /bookings
```

**Guest → Stylist:**
```
/ → /stylist/register → /verify-phone → /stylist-application → /dashboard/profile/edit → /dashboard/services → /business
```

**Client → Booking:**
```
/stylists → /stylist/:id → /book/:stylistId/:serviceId → /payment-methods → /bookings → /messages
```

**Stylist → Revenue:**
```
/panel → /dashboard/services → /dashboard/schedule → /bookings → /dashboard/revenue → /business/earnings
```

**Admin → Management:**
```
/admin/login → /panel → /panel/users → /panel/applications → /panel/bookings → /panel/analytics
```

---

## 📝 NOTES

1. **Lazy Loading:** All pages except HomePage, UnifiedAuthPage, SimpleRegisterPage, NotFoundPage, and UnauthorizedPage are lazy-loaded for performance.

2. **Protected Routes:** Use `<ProtectedRoute>` component with optional `roles` or `requiredPermissions` props.

3. **Unified Panel:** Single dashboard at `/panel` that adapts to show role-appropriate cards and links.

4. **Business Dashboard:** Advanced analytics and management for stylists with multiple features enabled.

5. **Auth System:** WebAuthn (biometric), Google OAuth, SMS verification, and traditional email/password.

6. **i18n Support:** All pages support English (en-US) and Spanish (es-MX) translations.

---

**Document Created:** October 16, 2025
**App Version:** 1.0
**React Router Version:** 6.x
**Total Routes Defined:** 82 pages + multiple auth variants = ~90 unique routes
