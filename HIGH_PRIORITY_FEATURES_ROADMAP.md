# High-Priority Features Implementation Roadmap

**Created:** November 6, 2025
**Total Estimated Time:** 6 weeks
**Target Completion:** December 18, 2025

---

## Feature Status Overview

| # | Feature | Backend | Frontend | Status | Priority | Est. Time |
|---|---------|---------|----------|--------|----------|-----------|
| 4 | Stylist Onboarding | ✅ 90% | ⚠️ 40% | In Progress | 🔴 Critical | 1 week |
| 5 | Client Registration | ✅ 80% | ❌ 20% | Not Started | 🔴 Critical | 5 days |
| 8 | Reviews System | ✅ 100% | ❌ 10% | Not Started | 🟡 High | 5 days |
| 6 | Booking Calendar | ✅ 70% | ⚠️ 50% | Partial | 🟡 High | 1 week |
| 9 | Revenue Dashboard | ✅ 80% | ⚠️ 60% | Partial | 🟡 High | 1 week |
| 10 | Email Notifications | ✅ 60% | N/A | Not Started | 🟡 High | 1 week |
| 7 | Location Tracking | ✅ 70% | ❌ 0% | Not Started | 🟢 Medium | 1 week |

**Legend:**
- ✅ Complete/Ready
- ⚠️ Partial/Needs Work
- ❌ Not Started/Missing
- 🔴 Critical - Blocks user registration
- 🟡 High - Major feature missing
- 🟢 Medium - Nice to have

---

## Sprint Plan (3 Sprints x 2 Weeks Each)

### Sprint 1: User Onboarding (Weeks 1-2)
**Goal:** Enable stylist and client registration

**Week 1: Stylist Onboarding**
- Days 1-2: Multi-step wizard UI
- Days 3-4: Phone verification + SMS consent
- Day 5: Stripe Connect integration

**Week 2: Client Registration**
- Days 1-2: WebAuthn biometric setup UI
- Days 3-4: Multi-step registration wizard
- Day 5: Testing + refinements

**Deliverables:**
- ✅ Stylists can complete onboarding
- ✅ Clients can register with biometrics
- ✅ Phone verification working

---

### Sprint 2: Core Booking Features (Weeks 3-4)

**Week 3: Reviews + Calendar**
- Days 1-2: Review submission UI
- Day 3: Review display on profiles
- Days 4-5: Syncfusion calendar integration

**Week 4: Email Notifications**
- Days 1-2: Email template system
- Day 3: Booking confirmation emails
- Day 4: Reminder emails (24h before)
- Day 5: Testing

**Deliverables:**
- ✅ Reviews work end-to-end
- ✅ Calendar shows bookings
- ✅ Email notifications sending

---

### Sprint 3: Advanced Features (Weeks 5-6)

**Week 5: Revenue Dashboard**
- Days 1-2: Earnings charts
- Day 3: Payout schedule
- Days 4-5: Analytics integration

**Week 6: Location Tracking**
- Days 1-3: Client en route system
- Days 4-5: Proximity alerts

**Deliverables:**
- ✅ Revenue tracking complete
- ✅ Location tracking functional

---

## Feature #4: Stylist Onboarding

### Current State
**Backend:** ✅ 90% Complete
- Routes: `/api/onboarding/*`
- Endpoints: status, start, update-step, complete
- Tables: `onboarding_progress`, `stylist_approval_checklist`

**Frontend:** ⚠️ 40% Complete
- Files exist but disconnected:
  - `FormikStylistOnboarding.tsx`
  - `StripeOnboardingPage.tsx`
  - `StylistApplicationPage.tsx`

### What's Missing

#### 1. Multi-Step Wizard UI
**Current:** Scattered components
**Needed:**
- Unified 6-step wizard with progress indicator
- Step 1: Business info
- Step 2: Location + service area
- Step 3: Phone verification (Twilio)
- Step 4: SMS notification preferences
- Step 5: Stripe Connect onboarding
- Step 6: Portfolio upload

**Files to Create/Modify:**
- `frontend/src/pages/stylist/StylistOnboardingWizard.tsx` (new)
- `frontend/src/components/onboarding/StepProgress.tsx` (new)
- `frontend/src/components/onboarding/PhoneVerification.tsx` (new)
- `frontend/src/components/onboarding/SMSConsent.tsx` (new)

#### 2. Phone Verification Integration
**Backend:** ✅ Ready (`/api/twilio-verify/*`)
**Frontend:** ❌ Not connected

**Implementation:**
```typescript
// Use existing backend endpoints
POST /api/twilio-verify/send-code
POST /api/twilio-verify/verify-code
```

#### 3. SMS Consent UI
**Backend:** ✅ Ready (`/api/sms-preferences/*`)
**Frontend:** ❌ Missing checkboxes

**Implementation:**
- Checkbox for each notification type
- Explanations for each
- Save preferences before completing onboarding

#### 4. Stripe Connect Flow
**Backend:** ✅ Ready (`/api/stripe-connect/*`)
**Frontend:** ⚠️ Partial (StripeOnboardingPage exists)

**Implementation:**
- Redirect to Stripe Connect
- Handle return URL
- Check onboarding completion
- Show status badge

---

## Feature #5: Client Registration

### Current State
**Backend:** ✅ 80% Complete
- WebAuthn routes: `/api/webauthn/*`
- Registration routes: `/api/client-onboarding/*`
- Tables: `users`, `clients`, `webauthn_credentials`

**Frontend:** ❌ 20% Complete
- Simple registration form exists
- No WebAuthn UI
- No wizard flow

### What's Missing

#### 1. Multi-Step Registration Wizard
**Steps:**
1. Email + password (or Google OAuth)
2. Phone verification
3. WebAuthn biometric setup
4. Profile info (name, photo)
5. Service preferences
6. Location/area

**Files to Create:**
- `frontend/src/pages/auth/ClientRegistrationWizard.tsx` (new)
- `frontend/src/components/auth/WebAuthnSetup.tsx` (new)
- `frontend/src/components/auth/BiometricPrompt.tsx` (new)

#### 2. WebAuthn Setup UI
**Backend:** ✅ Ready
- `POST /api/webauthn/register/options`
- `POST /api/webauthn/register/verify`

**Frontend Implementation:**
```typescript
// 1. Get registration options
const options = await apiClient.post('/webauthn/register/options', {
  userId, username
});

// 2. Browser prompts for biometric
const credential = await navigator.credentials.create({
  publicKey: options.data.publicKey
});

// 3. Verify with backend
await apiClient.post('/webauthn/register/verify', {
  credential: credential.response
});
```

#### 3. Service Preferences
**UI Needed:**
- Checkboxes for service types (hair, nails, makeup, skincare)
- Budget range slider
- Preferred stylist gender
- Location radius

---

## Feature #6: Booking Calendar

### Current State
**Backend:** ✅ 70% Complete
- Routes: `/api/calendar/*`, `/api/schedule/*`
- Bookings API working

**Frontend:** ⚠️ 50% Complete
- Component exists: `SyncfusionBookingCalendar.tsx`
- **Issue:** Commented out in main.tsx ("saved 6.6 MB")
- Not integrated into booking flow

### What's Missing

#### 1. Re-enable Syncfusion
**Current:**
```typescript
// main.tsx
// Syncfusion removed - saved 6.6 MB!
```

**Fix:**
```typescript
// Re-import Syncfusion CSS
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-schedule/styles/material.css';
```

#### 2. Integrate into Booking Flow
**Pages to Update:**
- `BookingPage.tsx` - Show calendar for selecting time
- `BookingsCalendarPage.tsx` - Stylist dashboard calendar

#### 3. Add Features
- Drag & drop bookings
- Color-coded status
- Recurring appointments
- Availability blocking

---

## Feature #7: Location Tracking

### Current State
**Backend:** ✅ 70% Complete
- Routes: `/api/booking-eta/*`, `/api/geolocation/*`
- Table: `booking_location_tracking`

**Frontend:** ❌ 0% Complete
- No UI for tracking
- No map component

### What's Missing

#### 1. Client Tracking UI
**Components Needed:**
- Map view showing route
- "I'm on my way" button
- Live location updates
- ETA display

**Implementation:**
```typescript
// Use Google Maps API (already configured)
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';

// Update location every 30 seconds
setInterval(() => {
  navigator.geolocation.getCurrentPosition((position) => {
    apiClient.post(`/booking-eta/${bookingId}/update`, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  });
}, 30000);
```

#### 2. Stylist Notification Panel
**Shows:**
- Client current location
- Estimated time of arrival
- Distance remaining
- Alerts at milestones (10 min, 5 min, arrived)

#### 3. Background Job
**File:** `backend/src/jobs/proximityAlerts.js` (new)
```javascript
const cron = require('node-cron');

// Run every 60 seconds
cron.schedule('*/1 * * * *', async () => {
  // Check all en-route bookings
  // Calculate distances
  // Send SMS alerts at milestones
});
```

---

## Feature #8: Reviews System

### Current State
**Backend:** ✅ 100% Complete
- Routes: `/api/reviews/*`, `/api/reviews-public/*`
- Table: `reviews`

**Frontend:** ❌ 10% Complete
- No submission form
- No display on profiles

### What's Missing

#### 1. Review Submission Form
**Trigger:** After booking completion

**Components:**
- Star rating (1-5)
- Text review (500 chars)
- Photo upload (optional)
- Service quality checkboxes
- Submit button

**File:** `frontend/src/components/reviews/ReviewForm.tsx` (new)

#### 2. Display on Stylist Profile
**Shows:**
- Average rating + star display
- Total review count
- Recent reviews (paginated)
- Filter by rating
- Sort by date/rating

**File:** `frontend/src/components/reviews/ReviewsList.tsx` (new)

#### 3. Review Moderation (Admin)
**Panel page for:**
- Flagged reviews
- Approve/reject
- Delete spam
- Respond to reports

---

## Feature #9: Revenue Dashboard

### Current State
**Backend:** ✅ 80% Complete
- Routes: `/api/finance/*`
- Stripe Connect integrated
- Payments table populated

**Frontend:** ⚠️ 60% Complete
- Basic revenue page exists
- Missing: charts, analytics, detailed breakdown

### What's Missing

#### 1. Earnings Charts
**Components:**
- Line chart: Daily/weekly/monthly earnings
- Bar chart: Earnings by service type
- Pie chart: Revenue breakdown

**Library:** Chart.js or Recharts

#### 2. Payout Schedule
**Shows:**
- Next payout date
- Payout amount
- Transfer history
- Bank account status

#### 3. Detailed Breakdown
**Tables:**
- Completed bookings
- Service fees
- Commission (platform %)
- Net earnings

**Filters:**
- Date range picker
- Service type filter
- Client filter

#### 4. Export Functionality
**Formats:**
- CSV download
- PDF report
- Tax documents (1099)

---

## Feature #10: Email Notifications

### Current State
**Backend:** ✅ 60% Complete
- Nodemailer configured
- Email verification works
- Password reset works

**Missing:**
- Booking-related emails
- Reminder system
- Template engine

### What's Missing

#### 1. Email Template System
**Tools:** Handlebars or MJML

**Templates Needed:**
- booking-confirmation.html
- booking-reminder.html
- booking-cancelled.html
- payment-receipt.html
- review-request.html
- weekly-summary.html

#### 2. Booking Confirmation Email
**Triggered:** When booking confirmed
**Contains:**
- Booking details (date, time, service)
- Stylist info
- Location
- Price
- Cancellation policy
- Calendar invite (.ics file)

#### 3. Reminder Emails
**System:** Cron job checks bookings 24h ahead

**File:** `backend/src/jobs/bookingReminders.js` (new)
```javascript
cron.schedule('0 9 * * *', async () => {
  // Get bookings for tomorrow
  // Send reminder emails to clients
  // Send reminder emails to stylists
});
```

#### 4. Payment Receipt
**Triggered:** After successful payment
**Contains:**
- Invoice number
- Itemized charges
- Payment method
- Receipt PDF attachment

---

## Implementation Priority

### Week 1: Critical Path
1. **Stylist Onboarding Wizard** (Days 1-3)
2. **Phone Verification UI** (Day 4)
3. **SMS Consent UI** (Day 5)

### Week 2: Enable Registrations
4. **Client Registration Wizard** (Days 1-2)
5. **WebAuthn Biometric Setup** (Days 3-4)
6. **Testing** (Day 5)

### Week 3: Essential Features
7. **Review Submission Form** (Days 1-2)
8. **Review Display** (Day 3)
9. **Booking Calendar Integration** (Days 4-5)

### Week 4: Communication
10. **Email Templates** (Days 1-2)
11. **Booking Emails** (Day 3)
12. **Reminder System** (Days 4-5)

### Week 5: Dashboard
13. **Revenue Charts** (Days 1-3)
14. **Payout Info** (Days 4-5)

### Week 6: Advanced
15. **Location Tracking UI** (Days 1-3)
16. **Proximity Alerts** (Days 4-5)

---

## Dependencies & Blockers

### External Services
- ✅ Twilio SMS (configured, funded)
- ✅ Stripe Connect (test mode)
- ✅ Google Maps API (configured)
- ✅ Syncfusion license (registered)

### Technical Blockers
- None identified (all infrastructure ready)

### Required Libraries
```json
{
  "recharts": "^2.10.0",        // Charts
  "react-google-maps/api": "^2.19.0", // Maps
  "handlebars": "^4.7.8",       // Email templates
  "node-cron": "^3.0.3"         // Scheduled jobs
}
```

---

## Testing Strategy

### Unit Tests
- Each component isolated
- Mock API responses
- Test all user flows

### Integration Tests
- Full onboarding flows
- Payment processing
- Email sending

### E2E Tests (Playwright)
- Complete stylist onboarding
- Complete client registration
- Book appointment
- Submit review
- Check revenue

---

## Success Metrics

### Stylist Onboarding
- ✅ 100% completion rate
- ⏱️ <10 minutes to complete
- ❌ <5% drop-off rate

### Client Registration
- ✅ WebAuthn setup success >80%
- ⏱️ <3 minutes to register
- ❌ <10% drop-off

### Reviews
- ✅ >50% review rate (after booking)
- ⭐ >4.0 average rating
- 📊 >100 reviews in first month

### Revenue Dashboard
- 👁️ Daily active usage >80% of stylists
- 📈 Clear revenue visibility
- 💰 <1% payout disputes

### Email Notifications
- ✉️ >95% delivery rate
- 📖 >40% open rate
- 🔗 >10% click-through rate

---

## Risk Mitigation

### Risk: Syncfusion Bundle Size
**Impact:** Frontend bundle too large
**Mitigation:**
- Code splitting
- Lazy load calendar
- Consider lightweight alternative if >3MB

### Risk: WebAuthn Browser Support
**Impact:** Some users can't register with biometrics
**Mitigation:**
- Fallback to password-only
- Clear browser requirements
- Graceful degradation

### Risk: Email Deliverability
**Impact:** Emails go to spam
**Mitigation:**
- SPF/DKIM/DMARC records
- Warm up sender reputation
- Use professional email service (SendGrid)

### Risk: Location Tracking Battery
**Impact:** Drains client phone battery
**Mitigation:**
- 30-second update interval (not 5 seconds)
- Stop tracking after arrival
- Allow user to disable

---

## Next Steps

1. **Start with Stylist Onboarding** (highest blocker)
2. **Create reusable wizard component** (DRY for client registration)
3. **Build incrementally** (test each step)
4. **Deploy frequently** (small, safe changes)

---

**Roadmap Owner:** Development Team
**Last Updated:** November 6, 2025
**Next Review:** Weekly sprint planning
**Estimated Completion:** December 18, 2025 (6 weeks)
