# BeautyCita - Complete Project Documentation

**Last Updated:** October 15, 2025
**Status:** Active Development / Production
**Version:** 1.0
**Sudo Password:** JUs3f2m3Fa

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Access & Credentials](#system-access--credentials)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [Working With This Project](#working-with-this-project)
5. [Common Commands](#common-commands)
6. [Authentication & Security](#authentication--security)
7. [Design System](#design-system)
8. [Features & Integrations](#features--integrations)
9. [Deployment & Operations](#deployment--operations)
10. [Database Schema](#database-schema)
11. [AI & Automation](#ai--automation)
12. [Known Issues & Solutions](#known-issues--solutions)
13. [Active Development Tasks](#active-development-tasks)

---

## Project Overview

### What is BeautyCita?

BeautyCita is a modern beauty services booking platform connecting clients with professional stylists. Think of it as "The Instagram of beauty bookings" - a polished, mobile-first platform with AI-powered features.

### Target Audience
- **Clients:** Women aged 18-30 who live on social media and expect intuitive, beautiful interfaces
- **Stylists:** Beauty professionals seeking to expand their client base and manage bookings
- **Geographic Focus:** Mexico (primary) and United States

### Core Value Proposition
- **For Clients:** Discover and book beauty services with location-based search, real-time availability, and verified reviews
- **For Stylists:** Manage bookings, portfolios, availability, and revenue through a comprehensive dashboard
- **For Platform:** Commission-based revenue model with subscription tiers for stylists

---

## System Access & Credentials

### Server Access
```bash
# SSH Access
ssh www-data@beautycita.com

# Sudo Password
JUs3f2m3Fa
```

### File Ownership
**CRITICAL:** All files MUST be owned by `www-data:www-data`
- Backend files: `www-data:www-data`
- Frontend files: `www-data:www-data`
- Never run commands as root unless specifically required
- Always use `sudo -u www-data` for operations

### Database
```bash
# PostgreSQL
Host: localhost
Database: beautycita
User: beautycita_app (app operations)
User: postgres (admin operations)
Password: qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=

# Quick connect
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' psql -h localhost -U beautycita_app -d beautycita
```

### Service Monitoring
- **Prometheus:** https://beautycita.com/prometheus/ (admin/monitoring123)
- **Grafana:** https://beautycita.com/grafana/ (admin/monitoring123 → admin/admin123)
- **AlertManager:** https://beautycita.com/alerts/

---

## Architecture & Tech Stack

### Frontend
```
Framework: React 18 + TypeScript + Vite 5.4.20
Location: /var/www/beautycita.com/frontend/
Build Output: /var/www/beautycita.com/frontend/dist/
Styling: Tailwind CSS
Animations: Framer Motion
UI Components: Headless UI, Heroicons
Scheduler: Syncfusion (v31.1.15)
```

**Key Features:**
- Dark mode support throughout
- Mobile-first responsive design
- Pink-to-purple gradient brand theme
- PWA ready with service worker
- i18n support (English/Spanish)

### Backend
```
Framework: Node.js + Express.js
Location: /var/www/beautycita.com/backend/
Process Manager: PM2 (4 cluster instances)
Runtime: Node.js 20+
Port: 4000 (proxied via Nginx)
```

**Key Features:**
- JWT authentication
- WebAuthn/passkeys support
- Stripe Connect integration
- Twilio SMS verification
- Google OAuth
- Role-based access control (SUPERADMIN, ADMIN, STYLIST, CLIENT)

### Database
```
RDBMS: PostgreSQL 14+
Tables: 81 tables
Key Tables:
  - users (authentication)
  - stylists (stylist profiles)
  - clients (client profiles)
  - bookings (appointments)
  - services (beauty services)
  - payments (Stripe transactions)
  - webauthn_credentials (biometric auth)
```

### Infrastructure
```
Web Server: Nginx
SSL: Let's Encrypt (TLS 1.3)
DNS: beautycita.com
Process Manager: PM2
Cache: Redis
Monitoring: Prometheus + Grafana + AlertManager
```

---

## Working With This Project

### Partnership Mindset

**You are a partner, not just a tool.** When working with the user:

- **Be proactive:** Suggest improvements and optimizations
- **Communicate clearly:** Explain what you're doing and why
- **Think ahead:** Anticipate needs and potential issues
- **Own the outcome:** If something breaks, help fix it immediately
- **Ask questions:** If unclear, ask before making assumptions

### Communication Style

**User Prefers:**
- Direct, concise communication
- Technical depth when explaining
- Solutions, not just problems
- Action over discussion
- "Did X because Y" explanations

**Avoid:**
- Verbose explanations of obvious things
- Asking for permission for routine tasks
- Hedging or uncertainty when you're confident
- Repetitive confirmations

### File Operations

**Before making changes:**
1. Read the file first
2. Understand context and dependencies
3. Make surgical edits (don't rewrite unnecessarily)
4. Preserve existing code style
5. Test changes

**Ownership Rules:**
- Frontend files → www-data:www-data
- Backend files → www-data:www-data
- Nginx configs → root:root (use sudo)
- After creating/editing: `sudo chown www-data:www-data <file>`

### Build & Deploy Workflow

```bash
# Frontend build
cd /var/www/beautycita.com/frontend
sudo -u www-data npm run build

# Backend restart
cd /var/www/beautycita.com
sudo -u www-data pm2 restart beautycita-api

# Nginx reload
sudo systemctl reload nginx

# Check everything
sudo -u www-data pm2 status
curl https://beautycita.com/api/health
```

---

## Common Commands

### Frontend

```bash
# Build production
cd /var/www/beautycita.com/frontend
sudo -u www-data npm run build

# Install dependencies
sudo -u www-data npm install

# Development (not typically used on server)
sudo -u www-data npm run dev
```

### Backend

```bash
# Restart API
cd /var/www/beautycita.com
sudo -u www-data pm2 restart beautycita-api

# View logs
sudo -u www-data pm2 logs beautycita-api --lines 100

# Monitor processes
sudo -u www-data pm2 monit

# Check status
sudo -u www-data pm2 status
```

### Database

```bash
# Quick query
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' \
  psql -h localhost -U beautycita_app -d beautycita -c "SELECT COUNT(*) FROM users;"

# Backup
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' \
  pg_dump -h localhost -U beautycita_app beautycita > backup_$(date +%Y%m%d).sql

# Restore
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' \
  psql -h localhost -U beautycita_app -d beautycita < backup.sql
```

### Nginx

```bash
# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/beautycita.com.error.log
sudo tail -f /var/log/nginx/beautycita.com.access.log
```

---

## Authentication & Security

### Authentication Methods

1. **Email/Password** (bcrypt hashed)
2. **Google OAuth** (via Passport.js)
3. **WebAuthn/Passkeys** (biometric: Touch ID, Face ID, Windows Hello)
4. **SMS Verification** (Twilio, for phone verification)

### WebAuthn Implementation

**Backend:**
- Library: `@simplewebauthn/server` v13.2.1
- Tables: `webauthn_credentials`, `webauthn_challenges`
- Endpoints:
  - `POST /api/webauthn/register/options` - Get registration challenge
  - `POST /api/webauthn/register/verify` - Verify credential
  - `POST /api/webauthn/login/options` - Get login challenge
  - `POST /api/webauthn/login/verify` - Verify assertion

**Frontend:**
- Uses browser `navigator.credentials` API
- Platform authenticators only (no cross-device)
- Discoverable credentials for passwordless flow

**Registration Flow:**
1. User enters phone number
2. SMS verification code sent via Twilio
3. User verifies phone
4. WebAuthn registration initiated
5. Browser prompts for biometric
6. Credential saved to database
7. Auto-login with JWT

**Login Flow:**
1. User clicks "Login with Biometric"
2. Browser shows credential selector
3. User authenticates with biometric
4. Backend verifies and issues JWT
5. User logged in (no password needed)

### Security Features

- **JWT Tokens:** 7-day expiration
- **Password Requirements:** 8+ chars, uppercase, lowercase, numbers
- **Rate Limiting:** 10 attempts/15min for auth endpoints
- **CSRF Protection:** SameSite cookies
- **XSS Protection:** React escaping, Content Security Policy
- **SQL Injection:** Parameterized queries only
- **File Permissions:** Environment files are 600 (owner read/write only)
- **HTTPS Only:** TLS 1.3 with modern ciphers
- **API Key Restrictions:** Google Maps API restricted to beautycita.com domain

### Security Audit Results

**Overall Rating:** B+ (Good)

**Strengths:**
- Zero SQL injection vulnerabilities
- Robust rate limiting
- Proper JWT implementation
- bcrypt password hashing
- WebAuthn for phishing-resistant auth

**Issues Fixed:**
- Environment file permissions (640 → 600)
- Debug console logs removed from production
- Request size limits added
- Google Maps API key restricted to domain

**Remaining Actions:**
- Add privacy policy page
- Implement GDPR data export/deletion
- Add Content Security Policy headers
- Quarterly security audits

---

## Design System

### Brand Colors

```css
Primary Gradient: linear-gradient(to right, #ec4899, #9333ea, #3b82f6)
Pink: #ec4899 (pink-500)
Purple: #9333ea (purple-600)
Blue: #3b82f6 (blue-500)
```

### Dark Mode

```css
Background: #111827 (gray-900)
Cards: #1f2937 (gray-800)
Text Primary: #f3f4f6 (gray-100)
Text Secondary: #d1d5db (gray-300)
```

### Typography

- **Headings:** Playfair Display (serif)
- **Body:** Inter (sans-serif)
- **Scale:**
  - H1: text-4xl md:text-6xl lg:text-7xl
  - H2: text-3xl md:text-4xl lg:text-5xl
  - H3: text-2xl md:text-3xl
  - H4: text-xl md:text-2xl

### UI Components

**Buttons:**
- Primary: Rounded-full with gradient background
- Sizes: `px-6 py-3` (default), `px-4 py-2` (small), `px-8 py-4` (large)
- All buttons use rounded-full (pills), never rounded-lg/xl

**Cards:**
- Border radius: rounded-3xl (48px)
- Gradient overlays for visual depth
- Dark mode support
- Hover effects: scale(1.05) + shadow

**Inputs:**
- Border radius: rounded-2xl (16px)
- Focus ring: ring-4 ring-pink-500/50
- Dark mode: bg-gray-700 with white text

**Touch Targets:**
- Minimum: 48px × 48px for mobile
- All interactive elements meet WCAG AA standards

### Logo Design

**Primary Logo:** "Smart Mirror" (geometric mirror design)
- 5 variations available
- SVG scalable 16px - 512px
- Works with gradients and solid colors
- Component: `<BeautyCitaLogo variant="mirror" />`

**Navbar Branding:**
- Animated gradient text "BeautyCita" next to logo
- Gradient: pink-500 → purple-600 → blue-500 → pink-500 (repeating pattern)
- Animation: Right-to-left seamless loop (8s duration)
- Implementation: `animate-gradient-flow` class

---

## Features & Integrations

### Stripe Connect

**Purpose:** Payment processing and stylist payouts

**Setup:**
- Stylists complete Stripe Connect onboarding
- Express accounts for simplest flow
- Webhook endpoints configured
- Test mode active (pk_test_*, sk_test_*)

**Endpoints:**
- `POST /api/stripe-connect/create-account`
- `POST /api/stripe-connect/onboarding-link`
- `GET /api/stripe-connect/return`
- `GET /api/stripe-connect/status`

**Webhook Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`
- `charge.dispute.closed`

**Dispute Management:**
- Automatic dispute detection
- Evidence submission API
- Stylist payout protection
- Proximity alert system

### Twilio SMS

**Purpose:** Phone verification and notifications

**Configuration:**
```bash
TWILIO_ACCOUNT_SID=ACfe65a7cd9e2f4f468544c56824e9cdd6
TWILIO_AUTH_TOKEN=e3d1649e3db535ad1d0347af1c25c231
TWILIO_VERIFY_SERVICE_SID=VA63c4df7faf87e1e38b7b772a28c74e20
TWILIO_MESSAGING_SERVICE_SID=MGb5415e1c731d553000bfbd4d0a8ca1b7
```

**Current Balance:** $11.92 (as of last check)
**Cost:** $0.05 per SMS verification

**Use Cases:**
- Phone number verification during registration
- Booking confirmations
- Proximity alerts (client en route)
- Appointment reminders

### Google Maps API

**Purpose:** Location autocomplete and geocoding

**API Key:** AIzaSyCsy8MrU8leZ1HonRBL40s804jW91Xb5Nc
**Restrictions:** HTTP referrers (beautycita.com, www.beautycita.com)
**APIs Enabled:** Maps JavaScript API, Places API

**Implementation:**
- Location picker in stylist registration
- Service area filtering
- Distance calculations
- En route tracking

### Syncfusion Scheduler

**Version:** 31.1.15
**License:** Registered (no trial watermarks)

**Features:**
- Multiple views (Day, Week, Month, Agenda)
- Drag & drop appointments
- Resize appointments
- Recurring events
- Mobile responsive
- Status-based color coding

**Component:** `<SyncfusionScheduler />`

### Cloudflare R2

**Purpose:** Image storage for stylist portfolios

**Integration:**
- Portfolio upload system
- Image optimization
- CDN delivery
- 6 API endpoints (upload, list, update, delete, reorder)

### BTCPay Server

**Status:** Configured but not primary payment method
**Purpose:** Bitcoin payment option (future)
**Current State:** Webhook-ready, manual invoice creation via UI

---

## Deployment & Operations

### PM2 Configuration

**Process Name:** beautycita-api
**Instances:** 4 (cluster mode)
**User:** www-data
**Port:** 4000

**Commands:**
```bash
cd /var/www/beautycita.com
sudo -u www-data pm2 restart beautycita-api
sudo -u www-data pm2 logs beautycita-api
sudo -u www-data pm2 monit
```

**Auto-Restart:** Enabled
**Log Rotation:** Configured

### Nginx Configuration

**Config File:** `/etc/nginx/sites-enabled/beautycita.com.conf`

**Key Features:**
- TLS 1.3 with modern ciphers
- HSTS enabled
- Rate limiting (30 req/s API, 10 req/s AI)
- Attack pattern blocking (WordPress, boaform, directory traversal)
- Static asset caching (1 year for immutable assets)
- Gzip compression
- Monitoring endpoints with HTTP Basic Auth

**Reload:**
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Monitoring Stack

**Prometheus (Port 9090):**
- Metrics collection
- 15-day retention
- Scrapes backend metrics every 15s

**Grafana (Port 3000):**
- Visualization dashboards
- Alerting rules
- Role-based access

**AlertManager (Port 9093):**
- Alert routing
- Notification channels (ready for Slack/email)

**Node Exporter (Port 9100):**
- System metrics (CPU, memory, disk)

**Access:**
- All accessible via beautycita.com subdirectories
- HTTP Basic Auth: admin/monitoring123
- HTTPS encrypted

### Backup Strategy

**Database Backups:**
```bash
# Manual backup
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' \
  pg_dump -h localhost -U beautycita_app beautycita > backup_$(date +%Y%m%d).sql
```

**Code Backups:**
- Git repository (not initialized yet)
- Manual: `/var/www/backups/` directory

**Recommended:**
- Daily automated database backups
- Weekly full system backups
- Off-site backup storage

### Migration Checklist

**See:** `MIGRATION_CHECKLIST.md` for complete Spain → US datacenter migration guide

**Key Steps:**
1. Pre-migration backups
2. New server setup
3. Database migration
4. Code deployment
5. DNS update
6. SSL certificate setup
7. Verification testing

---

## Database Schema

### Core Tables

**users (Authentication)**
```sql
id, email, password_hash, phone, phone_verified, role (CLIENT/STYLIST/ADMIN/SUPERADMIN),
email_verified, is_active, created_at, updated_at
```

**stylists (Stylist Profiles)**
```sql
id, user_id, business_name, bio, location, city, state, zip, latitude, longitude,
stripe_account_id, stripe_onboarding_complete, has_active_dispute, created_at
```

**clients (Client Profiles)**
```sql
id, user_id, name, preferences, created_at, updated_at
```

**bookings (Appointments)**
```sql
id, client_id, stylist_id, service_id, booking_date, start_time, end_time,
total_price, status, payment_status, created_at, updated_at
```

**services (Beauty Services)**
```sql
id, stylist_id, name, description, category, duration_minutes, price, price_type,
is_active, created_at, updated_at
```

**payments (Transactions)**
```sql
id, booking_id, amount, stripe_payment_intent_id, status, payment_method,
created_at, updated_at
```

**webauthn_credentials (Biometric Auth)**
```sql
id, user_id, credential_id, public_key, counter, device_name, transports,
last_used_at, created_at
```

**sms_preferences (Notification Settings)**
```sql
id, user_id, booking_requests, booking_confirmations, proximity_alerts,
payment_notifications, reminders, cancellations, marketing
```

### Key Relationships

- users → stylists (one-to-one)
- users → clients (one-to-one)
- stylists → services (one-to-many)
- bookings → clients (many-to-one)
- bookings → stylists (many-to-one)
- bookings → services (many-to-one)
- bookings → payments (one-to-many)
- users → webauthn_credentials (one-to-many)

### Database Best Practices

- Always use parameterized queries ($1, $2, etc.)
- Never concatenate SQL strings
- Use transactions for multi-step operations
- Index foreign keys
- Use ON DELETE CASCADE where appropriate
- Implement soft deletes for audit trail

---

## AI & Automation

### Aphrodite AI

**Concept:** AI-powered beauty assistant integrated throughout the platform

**Planned Features:**
- Beauty trend analysis
- Personalized stylist matching
- Style consultation chatbot
- Market insights for stylists
- Price optimization

**Status:** Framework in place, integration pending

### Automation Systems

**SMS Automation:**
- Automatic booking confirmations
- Reminder notifications (24 hours before)
- En route proximity alerts
- Payment receipts

**Email Automation:**
- Email verification on registration
- Password reset flows
- Weekly stylist revenue reports
- Client booking summaries

**Proximity Alert System:**
- Background job checks en-route bookings every 60 seconds
- Calculates distance from client to stylist
- Sends alerts at: journey start, 10 min away, 5 min away, arrived
- Updates `booking_location_tracking` table

---

## Known Issues & Solutions

### Issue: Frontend Build Not Reflecting Changes

**Symptoms:** Code changes in source don't appear in build output

**Solutions:**
1. Clear Vite cache: `rm -rf node_modules/.vite`
2. Clear dist: `rm -rf dist/`
3. Rebuild: `sudo -u www-data npm run build`
4. If persists: `rm -rf node_modules && sudo -u www-data npm install`

### Issue: PM2 Process as Root

**Symptoms:** beautycita-api running as root instead of www-data

**Solution:**
```bash
pm2 delete beautycita-api
sudo -u www-data pm2 start /var/www/beautycita.com/ecosystem.config.js
sudo -u www-data pm2 save
```

### Issue: Nginx 502 Bad Gateway

**Symptoms:** Site shows 502 error

**Debugging:**
```bash
# Check if backend is running
sudo -u www-data pm2 status

# Check logs
sudo -u www-data pm2 logs --err

# Verify port 4000 is listening
netstat -tlnp | grep 4000

# Restart if needed
sudo -u www-data pm2 restart beautycita-api
```

### Issue: Database Connection Errors

**Symptoms:** App can't connect to PostgreSQL

**Solutions:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
sudo -u postgres psql -l | grep beautycita

# Check credentials in .env
cat /var/www/beautycita.com/.env | grep DB_

# Test connection
PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' \
  psql -h localhost -U beautycita_app -d beautycita -c "SELECT version();"
```

### Issue: WebAuthn Prompt Not Appearing

**Symptoms:** Biometric registration doesn't show device prompt

**Solutions:**
1. Verify HTTPS is enabled (WebAuthn requires secure context)
2. Check browser support (Chrome, Safari, Edge - not old Firefox)
3. Ensure device has biometric capability
4. Check origin matches exactly: https://beautycita.com
5. Verify challenge hasn't expired (5-minute limit)

### Issue: Phone Number Format Errors

**Symptoms:** Phone verification fails with format errors

**Solution:**
- Input must be 10 digits only (no country code)
- System auto-detects Mexico vs US by area code
- Mexico codes: 55, 81, 33, 222, 442, 656, 664, 998, 984, 477, 312
- All others → +1 (US/Canada)

---

## Active Development Tasks

### Recently Completed

**✅ Navbar Animated Gradient Text (October 2025):**
- Added "BeautyCita" text with animated gradient next to logo
- Gradient pattern: pink-500 → purple-600 → blue-500 (repeating seamlessly)
- Animation: Right-to-left flow, 8-second duration
- Fixed: animations.css import in main.tsx
- Applied to both desktop and mobile navbar sections

**✅ Visual Design Audit & Fixes (October 2025):**
- Fixed 53 design inconsistencies across 18 pages
- Critical fixes: Mobile grid layouts, typography hierarchy, button padding, hero heights
- Major fixes: Dark mode text colors, input focus rings, container widths
- Minor fixes: Touch targets, icon sizes, spacing consistency
- Result: WCAG AA compliant, fully responsive, professional polish

**✅ Complete Redesign (October 2025):**
- 7 new UI components (GradientCard, PageHero, CTASection, etc.)
- 5 logo variations (Smart Mirror chosen as primary)
- 18 pages redesigned with pink-purple-blue gradient theme
- Dark mode support across all pages
- Mobile-first responsive implementation

### In Progress

**🚧 Stylist Onboarding Wizard:**
- Multi-step registration flow (6 steps)
- Phone verification with Twilio SMS
- SMS notification consent system
- Stripe Connect integration
- Location picker fixes
- Portfolio and services setup

**🚧 Client Location Tracking:**
- En route notification system
- Live location updates every 30 seconds
- Proximity alerts (10 min, 5 min, arrived)
- Background job for distance calculations
- Stylist dashboard integration

### Priority Backlog

**High Priority:**
1. Privacy Policy & Terms of Service pages
2. GDPR compliance (data export/deletion endpoints)
3. Client registration flow completion
4. Stylist dashboard service management
5. Booking calendar with Syncfusion integration

**Medium Priority:**
1. Review and rating system
2. Video consultation capabilities
3. Advanced search filters
4. Favorite stylists functionality
5. Email notification system

**Low Priority:**
1. Blog functionality
2. Gift card system
3. Loyalty points program
4. Referral system
5. Multi-language support beyond EN/ES

### Tech Debt

- CSS minification warnings (non-breaking)
- Bundle size optimization (code splitting recommended)
- Frontend dependency updates (`npm audit fix`)
- Database ON DELETE CASCADE policies review
- JWT secret rotation procedure
- Session fixation protection enhancement

---

## Notes for AI Assistants

### Session Learnings

**User Preferences:**
- Values simple, direct implementations over complex solutions
- Prefers actual brand colors (pink/purple/blue) over many-color gradients
- Expects you to complete tasks fully before marking them done
- Will directly state frustration if you overcomplicate things ("you suck")
- Wants seamless loops for animations (no visible jumps)
- Prefers action over lengthy discussion

**Technical Patterns:**
- Use brand colors: pink-500, purple-600, blue-500
- All buttons should be rounded-full (pills)
- Cards use rounded-3xl
- Inputs use rounded-2xl
- Dark mode is a first-class citizen, not an afterthought
- Mobile-first approach always

**Common Mistakes to Avoid:**
- Using too many color stops in gradients (keep it simple: 3-4 colors max)
- Making buttons rectangular instead of pill-shaped
- Forgetting to update both desktop and mobile navbar sections
- Not importing animations.css in main.tsx
- Using positive background-position for right-to-left animations (use negative)
- Overcomplicating solutions when simple ones work

**Animation Guidelines:**
- Seamless loops must start and end with same color
- Right-to-left motion: use negative background-position values (0% to -200%)
- Gradient patterns should repeat twice for smooth cycling
- Animation duration: 8-10 seconds for subtle movement
- Linear timing for constant speed flow

### Working Effectively

**Before starting work:**
1. Read relevant sections of this document
2. Check if similar work exists in codebase
3. Understand file ownership requirements
4. Plan the full implementation

**During work:**
1. Use TodoWrite to track progress
2. Mark tasks complete as you finish them (not batched)
3. Test changes before considering complete
4. Document any issues encountered

**After work:**
1. Verify all functionality works
2. Check build succeeds with no errors
3. Update documentation if needed
4. Mark all related todos as complete

---

## Comprehensive Todo List

### Completed Items ✅

**Authentication & Security:**
- [x] WebAuthn biometric authentication implementation
- [x] Twilio SMS verification backend
- [x] Phone number auto-detection (Mexico/US)
- [x] Security audit and fixes (B+ rating achieved)
- [x] Environment file permissions hardened
- [x] Google Maps API key restricted to domain
- [x] Rate limiting on auth endpoints

**Design & Frontend:**
- [x] Complete redesign with gradient theme (170 files, 25k+ lines)
- [x] Dark mode implementation across all pages
- [x] 7 reusable UI components (GradientCard, PageHero, etc.)
- [x] 5 logo variations designed
- [x] Navbar animated gradient text (right-to-left loop)
- [x] 53 visual design fixes (typography, spacing, accessibility)
- [x] Mobile responsiveness audit and fixes
- [x] Touch target compliance (48px minimum)
- [x] WCAG AA accessibility compliance

**Features & Integrations:**
- [x] Stripe Connect webhook configuration
- [x] Syncfusion Scheduler installation (v31.1.15)
- [x] Video preloading system with loading states
- [x] BTCPay webhook integration
- [x] Google OAuth integration

**Operations & Monitoring:**
- [x] Prometheus monitoring setup
- [x] Grafana dashboards configuration
- [x] AlertManager integration
- [x] PM2 cluster mode (4 instances)
- [x] Nginx security hardening
- [x] SSL/TLS 1.3 configuration

### Pending Items 🚧

**High Priority:**
- [ ] Privacy Policy page implementation
- [ ] Terms of Service page implementation
- [ ] Cookie Policy page implementation
- [ ] Stylist multi-step onboarding wizard
- [ ] Phone verification UI integration (frontend)
- [ ] SMS notification consent UI
- [ ] Stripe Connect complete onboarding flow
- [ ] Location picker mobile fixes
- [ ] Client registration flow (WebAuthn frontend)
- [ ] Client en route tracking system
- [ ] Proximity alert background job
- [ ] GDPR data export API endpoint
- [ ] GDPR data deletion API endpoint

**Medium Priority:**
- [ ] Admin dashboard for platform management
- [ ] Stylist service management UI
- [ ] Booking calendar Syncfusion integration
- [ ] Review and rating system
- [ ] Email notification system (booking confirmations, reminders)
- [ ] Favorite stylists functionality
- [ ] Advanced search filters (price range, distance, rating)
- [ ] Stylist portfolio management (Cloudflare R2 integration)
- [ ] Revenue dashboard for stylists
- [ ] Client booking history detailed view

**Low Priority:**
- [ ] Blog post creation and management
- [ ] Video consultation feature
- [ ] Gift card system
- [ ] Loyalty points program
- [ ] Referral system with rewards
- [ ] Mobile app (React Native)
- [ ] Offline mode with service worker
- [ ] Push notifications
- [ ] In-app messaging between client and stylist
- [ ] Advanced analytics dashboard

**Technical Debt:**
- [ ] Bundle size optimization (code splitting)
- [ ] Frontend dependency security updates
- [ ] Database migration system setup
- [ ] Automated database backups (daily cron)
- [ ] Git repository initialization
- [ ] CI/CD pipeline setup
- [ ] Automated testing suite
- [ ] Load testing and performance optimization
- [ ] CDN setup for static assets
- [ ] Database query optimization
- [ ] JWT secret rotation mechanism
- [ ] Session management improvements
- [ ] Error tracking system (Sentry integration)

**Documentation:**
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Frontend component library (Storybook)
- [ ] Database schema documentation
- [ ] Deployment runbook
- [ ] Incident response playbook
- [ ] Developer onboarding guide

---

## Emergency Contacts & Resources

### Documentation
- This file: `/var/www/beautycita.com/CLAUDE.md`
- Style guide: `/var/www/beautycita.com/frontend/BEAUTYCITA_STYLE_GUIDE.md`
- Migration guide: `/var/www/beautycita.com/MIGRATION_CHECKLIST.md`
- Security audit: `/var/www/beautycita.com/SECURITY_AUDIT_REPORT.md`
- Logo design: `/var/www/beautycita.com/frontend/LOGO_DESIGN.md`
- Video preloading: `/var/www/beautycita.com/frontend/VIDEO_PRELOADING_SYSTEM.md`

### Key URLs
- Production site: https://beautycita.com
- API health: https://beautycita.com/api/health
- Grafana: https://beautycita.com/grafana/
- Prometheus: https://beautycita.com/prometheus/
- Logo showcase: https://beautycita.com/logo-showcase

### Service Providers
- Stripe Dashboard: https://dashboard.stripe.com
- Twilio Console: https://console.twilio.com
- Google Cloud Console: https://console.cloud.google.com
- Cloudflare: https://dash.cloudflare.com

---

**Document Maintained By:** AI Assistants & Development Team
**Review Frequency:** After major changes or monthly
**Last Major Update:** October 15, 2025
**Total Pages Covered:** 18 frontend pages, complete backend API, full infrastructure
- +523221429800 +527206777800 +527206777070 +523221215551 +523222780020 <- my phone numbers
- su with pw LCub69Ls
- sudo with pw Dv4801431a.