# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated:** November 12, 2025
**Project:** BeautyCita - Beauty Services Booking Platform
**Status:** Active Production

---

## Project Overview

BeautyCita is a beauty services booking platform connecting clients with professional stylists in Mexico and the US. It's a full-stack web application with React frontend, Node.js backend, PostgreSQL database, and mobile apps (Android/iOS via Capacitor).

**Target Users:**
- **Clients:** Book beauty services, manage appointments, real-time communication
- **Stylists:** Manage bookings, services, portfolios, revenue via Stripe Connect
- **Admins:** Platform management, analytics, dispute resolution

---

## 🚨 CRITICAL: Authentication & User Flow Rules

### Client-Only Signup (NO STYLIST SIGNUP)

**IMPORTANT:** Everyone signs up as a CLIENT. There is NO direct stylist registration.

**Reason:** Stylists are clients too. Users should not need two accounts to use the platform.

**Correct User Journey:**
1. **Sign up as CLIENT** (only option available)
   - Google One Tap (primary method)
   - Email/Password (fallback)
   - No "Join as Stylist" link anywhere in auth flow

2. **Complete Client Onboarding** (3 steps)
   - Location (city, state, ZIP)
   - Service preferences (12 services)
   - Profile picture (optional)

3. **OnboardingProgressBanner Appears** (after client onboarding complete)
   - Shows in UnifiedPanel at top
   - CTA: "Want to offer services? Become a Stylist"

4. **Stylist Application** (/stylist-application)
   - User fills out application form
   - Submits application
   - Banner changes to "Application Under Review"

5. **Admin Review & Approval**
   - Admin reviews application in /panel/applications
   - Can approve, deny, or message applicant
   - On approval: User role upgraded to STYLIST

6. **Full Stylist Access**
   - User gains access to stylist panel features
   - Can manage services, bookings, revenue, etc.

### Files That Enforce This Flow

**Frontend:**
- `frontend/src/components/auth/AuthModal.tsx` - No "Join as Stylist" link
- `frontend/src/components/onboarding/OnboardingProgressBanner.tsx` - Shows become stylist CTA
- `frontend/src/pages/UnifiedPanel.tsx` - Displays banner after client onboarding
- `frontend/src/pages/OptimizedClientOnboarding.tsx` - 3-step client onboarding

**Backend:**
- `backend/src/routes/user-profile.js` - GET /api/user/onboarding-status endpoint
- `backend/src/routes/onboarding.js` - POST /api/onboarding/complete-client endpoint
- `backend/src/routes/googleAuth.js` - POST /api/auth/google/one-tap (creates CLIENT users only)

### Never Do This:
- ❌ Add "Join as Stylist" or "Sign up as Stylist" links to auth pages
- ❌ Allow role selection during signup
- ❌ Create separate stylist registration flow
- ❌ Let users choose CLIENT or STYLIST role at signup
- ❌ Show stylist-specific options before application approval

### Always Do This:
- ✅ Default all new signups to CLIENT role
- ✅ Show OnboardingProgressBanner after client onboarding complete
- ✅ Direct users to /stylist-application for becoming a stylist
- ✅ Require admin approval before granting STYLIST role
- ✅ Keep authentication simple: everyone is a client first

---

## Commands

### Backend Development

```bash
# Start backend (production)
cd /var/www/beautycita.com
sudo -u www-data pm2 restart beautycita-api

# View logs
sudo -u www-data pm2 logs beautycita-api --lines 100

# Monitor processes
sudo -u www-data pm2 monit

# Run tests
cd /var/www/beautycita.com
npm test
npm run test:watch  # Watch mode
npm run test:ci     # CI mode with coverage
```

### Frontend Development

```bash
# Build production
cd /var/www/beautycita.com/frontend
sudo -u www-data npm run build

# Install dependencies
sudo -u www-data npm install

# Development server (local)
npm run dev
```

### Database Operations

```bash
# Connect to database
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' \
  psql -h localhost -U beautycita_app -d beautycita

# Run query
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' \
  psql -h localhost -U beautycita_app -d beautycita -c "SELECT COUNT(*) FROM users;"

# Backup database
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' \
  pg_dump -h localhost -U beautycita_app beautycita > backup_$(date +%Y%m%d).sql
```

### Web Server

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx (without downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/beautycita.com.error.log
```

### Mobile App Development

```bash
# Android build
cd /var/www/beautycita.com/BeautyCita
npx cap sync android
cd android
./gradlew assembleRelease

# iOS build (requires macOS)
cd /var/www/beautycita.com/BeautyCita
npx cap sync ios
# Open in Xcode and build
```

---

## Architecture

### Technology Stack

**Frontend:**
- React 18 + TypeScript + Vite 5
- Tailwind CSS + Framer Motion
- Syncfusion Scheduler (v31.1.15) for calendar
- Location: `/var/www/beautycita.com/frontend/`

**Backend:**
- Node.js 20+ + Express.js
- PM2 cluster mode (4 instances on port 4000)
- Location: `/var/www/beautycita.com/backend/src/`

**Database:**
- PostgreSQL 14+ with 81 tables
- Key tables: users, stylists, clients, bookings, services, payments, webauthn_credentials

**Infrastructure:**
- Nginx (reverse proxy, TLS 1.3)
- Redis (sessions, caching)
- Prometheus + Grafana + AlertManager (monitoring)

### Directory Structure

```
/var/www/beautycita.com/
├── backend/
│   ├── src/
│   │   ├── server.js              # Main entry point
│   │   ├── db.js                  # PostgreSQL connection pool
│   │   ├── *Routes.js             # 15+ route files
│   │   ├── services/              # Business logic
│   │   ├── middleware/            # Auth, validation, etc.
│   │   └── config/                # Configuration
│   └── logs/                      # Winston logs
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main app component
│   │   ├── main.tsx               # Entry point
│   │   ├── pages/                 # 82+ page components
│   │   ├── components/            # Reusable UI components
│   │   ├── services/              # API client
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── types/                 # TypeScript types
│   │   └── i18n/                  # Internationalization (EN/ES)
│   └── dist/                      # Build output (served by Nginx)
├── BeautyCita/                    # Capacitor mobile app
│   ├── android/                   # Android project
│   ├── ios/                       # iOS project
│   └── capacitor.config.ts        # Mobile config
└── .env                          # Environment variables (600 perms)
```

### Backend Architecture

**Route Organization:**
- `authRoutes.js` - Authentication (email/password, Google OAuth, WebAuthn)
- `bookingRoutes.js` - Booking management, calendar integration
- `paymentRoutes.js` - Stripe Connect, payment processing
- `stylistRoutes.js` - Stylist profiles, services, portfolio
- `clientRoutes.js` - Client profiles, favorites
- `adminRoutes.js` - Admin panel functionality
- `chatRoutes.js` - Real-time messaging (Socket.io)
- `analyticsRoutes.js` - Platform analytics
- Plus 7 more specialized route files

**Key Services:**
- `emailService.js` - Nodemailer email notifications
- `cacheService.js` - Redis caching layer
- `appointmentReminderService.js` - Background job for SMS reminders
- `proximityAlertService.js` - En route tracking
- `bookingService.js` - Booking business logic

**Middleware:**
- `auth.js` - JWT validation, role-based access control
- `security-middleware.js` - Rate limiting, CSP, security headers
- `validation.js` - express-validator schemas

**Background Jobs:**
- Appointment reminders (24h before)
- Proximity alerts (10min, 5min, arrived)
- Booking expiration checks
- Revenue report generation

### Frontend Architecture

**Pages (82 total):**
- Public pages (27): Home, services, stylist discovery, legal pages
- Auth pages (6): Login, register, phone/email verification
- Profile & settings (7): Profile editor, onboarding wizard
- Stylist dashboard (9): Portfolio, revenue, schedule, services
- Business dashboard (8): Advanced analytics for stylists
- Client features (9): Bookings, favorites, messages, disputes
- Admin panel (11): User management, applications, platform analytics

**Components:**
- `GradientCard` - Brand gradient styled cards
- `PageHero` - Consistent page headers
- `CTASection` - Call-to-action sections
- `BeautyCitaLogo` - SVG logo with 5 variants
- `SyncfusionScheduler` - Calendar integration
- `AphroditeAI` - AI chatbot assistant
- Plus 50+ specialized components

**State Management:**
- React Context for auth state
- Local state with hooks
- API calls via services/api.ts

### Authentication System

Four authentication methods:
1. **Google One Tap** - PRIMARY METHOD (automatic account detection, like Figma)
2. **Email/Password** - bcrypt hashed, JWT tokens (7-day expiration)
3. **Google OAuth** - Passport.js integration (fallback for One Tap)
4. **WebAuthn/Passkeys** - Biometric (Touch ID, Face ID, Windows Hello)
5. **SMS Verification** - Twilio Verify for phone verification

**Google One Tap Implementation:**
- **Frontend Component:** `frontend/src/components/auth/GoogleOneTap.tsx`
- **Backend Endpoint:** `POST /api/auth/google/one-tap`
- **JWT Verification:** Uses `google-auth-library` to verify Google's JWT token
- **Auto-Popup:** Appears 3 seconds after homepage load for new visitors
- **Session Storage:** Tracks if user has seen popup (doesn't spam)
- **Integration:** Added to HomePage, AuthModal, UnifiedAuthPage

**One Tap Flow:**
1. User visits beautycita.com
2. Google One Tap popup appears (if signed into Google)
3. User clicks account → 1-click signup
4. Backend verifies JWT, creates CLIENT user
5. Redirects to /onboarding/client
6. Tracks login with method: `GOOGLE_ONE_TAP` in login_history table

**WebAuthn Flow:**
- Backend: `@simplewebauthn/server` v13.2.1
- Tables: `webauthn_credentials`, `webauthn_challenges`
- Endpoints: `/api/webauthn/register/*`, `/api/webauthn/login/*`
- Supports platform authenticators (no cross-device)
- Discoverable credentials for passwordless login

**Roles & Permissions:**
- CLIENT: Book services, manage bookings
- STYLIST: Manage services, schedule, revenue
- ADMIN: Platform management, limited system access
- SUPERADMIN: Full system access including `/panel/system`

---

## Key Integrations

### Stripe Connect
- Express accounts for stylist payouts
- Webhook handling for payment events
- Dispute management system
- Test mode active (pk_test_*, sk_test_*)

### Twilio
- SMS verification: Verify Service SID `VA63c4df7faf87e1e38b7b772a28c74e20`
- Messaging: Service SID `MGb5415e1c731d553000bfbd4d0a8ca1b7`
- Cost: $0.05 per verification
- Auto-detects Mexico (55, 81, 33, etc.) vs US area codes

### Google Maps API
- API Key: `AIzaSyCsy8MrU8leZ1HonRBL40s804jW91Xb5Nc`
- Restricted to beautycita.com domain
- Location autocomplete, geocoding, distance calculations

### Cloudflare R2
- Portfolio image storage
- CDN delivery
- 6 API endpoints (upload, list, update, delete, reorder)

### Syncfusion Scheduler
- Version 31.1.15 (licensed)
- Calendar views: Day, Week, Month, Agenda
- Drag & drop, resize appointments
- Status-based color coding

---

## Development Guidelines

### File Ownership & Permissions
**CRITICAL:** All files must be owned by `www-data:www-data`
```bash
# After creating/editing files
sudo chown www-data:www-data <file>
sudo chmod 644 <file>  # Regular files
sudo chmod 600 .env    # Environment files
```

### Build & Deploy Workflow
1. Make code changes
2. Test locally if possible
3. Build frontend: `cd frontend && sudo -u www-data npm run build`
4. Restart backend: `sudo -u www-data pm2 restart beautycita-api`
5. Reload Nginx if config changed: `sudo systemctl reload nginx`
6. Verify: `curl https://beautycita.com/api/health`

### Design System
**Brand Colors:**
- Primary gradient: `linear-gradient(to right, #ec4899, #9333ea, #3b82f6)`
- Pink: #ec4899 (pink-500)
- Purple: #9333ea (purple-600)
- Blue: #3b82f6 (blue-500)

**UI Guidelines:**
- All buttons: `rounded-full` (pill shape)
- Cards: `rounded-3xl`
- Inputs: `rounded-2xl`
- Dark mode is first-class citizen
- Mobile-first responsive design
- Touch targets minimum 48px × 48px (WCAG AA)

**Typography:**
- Headings: Playfair Display (serif)
- Body: Inter (sans-serif)

### Code Style
**Backend (Node.js):**
- Use async/await, not callbacks
- Parameterized queries only ($1, $2, etc.) - NEVER concatenate SQL
- Error handling with try-catch
- Winston logger for logging
- Rate limiting on all sensitive endpoints

**Frontend (React/TypeScript):**
- Functional components with hooks
- TypeScript strict mode
- Lazy loading for pages (except critical routes)
- i18n keys for all user-facing text
- Dark mode support via Tailwind classes

### Database Best Practices
- Always use parameterized queries
- Use transactions for multi-step operations
- Index foreign keys
- Soft deletes for audit trail
- ON DELETE CASCADE only when appropriate

### Security Requirements
- JWT tokens validated on all protected endpoints
- Rate limiting: 10 req/15min for auth, 30 req/s for API
- HTTPS only (TLS 1.3)
- Environment files with 600 permissions
- No secrets in code or logs
- Validate all user input with express-validator

---

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# CI mode with coverage
npm run test:ci

# Single test file
npm test -- path/to/test.js
```

### Test Structure
- Tests located in `/var/www/beautycita.com/backend/src/test/`
- Using Jest with supertest for API testing
- Coverage reports in `/coverage/`

---

## Monitoring & Operations

### Monitoring Access
- **Prometheus:** https://beautycita.com/prometheus/ (admin/monitoring123)
- **Grafana:** https://beautycita.com/grafana/ (admin/admin123)
- **AlertManager:** https://beautycita.com/alerts/

### Health Checks
```bash
# API health check
curl https://beautycita.com/api/health

# Check PM2 status
sudo -u www-data pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql

# Check Redis status
redis-cli ping
```

### Log Locations
- Backend logs: `/var/www/beautycita.com/backend/logs/`
- PM2 logs: `~/.pm2/logs/`
- Nginx access: `/var/log/nginx/beautycita.com.access.log`
- Nginx error: `/var/log/nginx/beautycita.com.error.log`

---

## Common Issues & Solutions

### Frontend Build Not Reflecting Changes
```bash
cd /var/www/beautycita.com/frontend
rm -rf node_modules/.vite dist/
sudo -u www-data npm run build
```

### PM2 Process as Root Instead of www-data
```bash
pm2 delete beautycita-api
sudo -u www-data pm2 start /var/www/beautycita.com/ecosystem.config.js
sudo -u www-data pm2 save
```

### Nginx 502 Bad Gateway
```bash
# Check backend is running
sudo -u www-data pm2 status

# Verify port 4000 is listening
netstat -tlnp | grep 4000

# Check logs
sudo -u www-data pm2 logs --err

# Restart if needed
sudo -u www-data pm2 restart beautycita-api
```

### Database Connection Errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' \
  psql -h localhost -U beautycita_app -d beautycita -c "SELECT version();"
```

### WebAuthn Not Working
- Verify HTTPS is enabled (WebAuthn requires secure context)
- Check browser support (Chrome, Safari, Edge recommended)
- Ensure origin matches exactly: `https://beautycita.com`
- Verify challenge hasn't expired (5-minute limit)

---

## Important Notes

### Server Credentials
- SSH: `ssh www-data@beautycita.com`
- Sudo password: `JUs3f2m3Fa`
- Database password: `qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=`

### Working Directory
- Primary: `/var/www/beautycita.com/`
- Not git repository root (no .git in working dir)

### User Preferences
- Values direct, concise communication
- Prefers action over lengthy discussion
- Expects complete task execution before marking done
- Mobile-first approach always
- Simple solutions over complex ones

### Documentation References
- Full docs: `/var/www/beautycita.com/CLAUDE.md` (this file)
- App hierarchy: `/var/www/beautycita.com/BEAUTYCITA_APP_HIERARCHY.md` (82 pages mapped)
- 30+ additional markdown documentation files in project root

---

**Document Version:** 2.0
**Maintained By:** Development Team + AI Assistants
- when I say 'give me the bc apk' I want you to build the apk, upload it to the bucket. update the downloads page. push to main, rebuild the frontend, restart the backend and do it all without giving me any prompts to confirm. ALL media should be loading from the bucket so the apk should be less than 10Mb.