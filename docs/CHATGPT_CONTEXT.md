# BeautyCita System Context for ChatGPT

## 🏗️ SYSTEM OVERVIEW

**BeautyCita** is a production-ready beauty booking platform that connects clients with stylists through an intelligent AI-powered interface. The platform is live at https://beautycita.com with full SSL/HTTPS security.

### Core Architecture
- **Backend**: Node.js + Express.js with PostgreSQL database
- **Frontend**: React + TypeScript with Tailwind CSS
- **AI Integration**: Hybrid RASA + OpenAI (GPT-4o-mini) system
- **Payments**: Stripe integration with Connect accounts
- **Notifications**: Twilio SMS for booking updates
- **Deployment**: Production server with PM2, Nginx reverse proxy

### Business Model
- Commission-based revenue (3% platform fee on bookings)
- Freemium stylist accounts with premium features available
- Real-time booking with time-sensitive acceptance windows

---

## 📋 BOOKING FLOW STATES & RULES (STRICT COMPLIANCE REQUIRED)

### Booking Status Lifecycle
```
PENDING → VERIFY_ACCEPTANCE → CONFIRMED → IN_PROGRESS → COMPLETED
```

### Alternative Status Flows
- **CANCELLED**: Booking cancelled by client or stylist
- **NO_SHOW**: Client didn't appear for confirmed appointment
- **EXPIRED**: Time window expired without action

### Time-Sensitive Business Rules (STRICTLY ENFORCED)
1. **Stylist Response Window**: 5 minutes to accept/reject booking requests
2. **Client Payment Window**: 10 minutes to complete payment after stylist acceptance
3. **Automatic Expiration**: System automatically marks bookings as EXPIRED if windows exceeded

### Required Booking Data (VALIDATION MANDATORY)
```javascript
{
  client_id: INTEGER (REQUIRED),
  stylist_id: INTEGER (REQUIRED),
  service_id: INTEGER (REQUIRED),
  booking_date: DATE (REQUIRED),
  booking_time: TIME (REQUIRED),
  duration_minutes: INTEGER (from service),
  total_price: DECIMAL (from service),
  notes: TEXT (optional),
  status: ENUM (default: 'PENDING')
}
```

### Availability Checking Rules
- **No Double-Booking**: System prevents multiple bookings for same stylist/time slot
- **Date Validation**: Bookings only allowed for future dates
- **Service Duration**: Must respect service duration for time slot conflicts
- **Working Hours**: Validate against stylist's working_hours JSON field

---

## 💳 PAYMENT INTEGRATION (STRICT STRIPE COMPLIANCE)

### Payment Flow States
```
PENDING → PROCESSING → SUCCEEDED/FAILED
```

### Stripe Integration Rules
- **Payment Intents**: Created only for bookings in VERIFY_ACCEPTANCE status
- **Customer Management**: Automatic Stripe customer creation/retrieval by email
- **Webhook Validation**: All webhooks must verify signature with STRIPE_WEBHOOK_SECRET
- **Metadata Tracking**: All payments include booking_id, client_id, stylist_id

### Fee Structure (AUTOMATICALLY CALCULATED)
- **Platform Fee**: 3% of total booking amount
- **Stylist Payout**: 97% of total booking amount
- **Currency**: USD only
- **Minimum Amount**: $1.00 (enforced by Stripe)

### Payment Security Requirements
- **No Raw Card Data**: Never store card information directly
- **PCI Compliance**: Handled entirely by Stripe
- **Webhook Authentication**: Verify stripe-signature header
- **Idempotency**: Handle duplicate webhook events gracefully

### Refund Policy (STRICTLY ENFORCED)
- **Eligible Statuses**: CANCELLED, NO_SHOW bookings only
- **Not Refundable**: COMPLETED, IN_PROGRESS bookings
- **Automatic Processing**: Refunds processed via Stripe API
- **Notification**: Both parties notified via SMS

---

## 🗄️ DATABASE SCHEMA REFERENCE

### Core Tables Structure
```sql
-- Users (clients, stylists, admins)
users (id, email, password_hash, name, phone, role, profile_picture_url)

-- Stylist business profiles
stylists (id, user_id, business_name, bio, specialties[], location_*, pricing_tier)

-- Services offered by stylists
services (id, stylist_id, name, description, category, duration_minutes, price)

-- Client bookings
bookings (id, client_id, stylist_id, service_id, booking_date, booking_time,
         status, total_price, request_expires_at, acceptance_expires_at)

-- Payment transactions
payments (id, booking_id, stripe_payment_intent_id, amount, platform_fee,
         stylist_payout, status, processed_at)

-- Reviews and ratings
reviews (id, booking_id, client_id, stylist_id, rating, review_text,
        before_images[], after_images[])
```

### Critical Relationships (FOREIGN KEY CONSTRAINTS)
- `bookings.client_id` → `users.id` (CASCADE DELETE)
- `bookings.stylist_id` → `stylists.id` (CASCADE DELETE)
- `bookings.service_id` → `services.id` (SET NULL)
- `payments.booking_id` → `bookings.id` (CASCADE DELETE)
- `reviews.booking_id` → `bookings.id` (CASCADE DELETE)

### Automatic Tracking
- **Status History**: `booking_status_history` table logs all status changes
- **Timestamps**: All tables have `created_at`, `updated_at` fields
- **Audit Trail**: Complete booking lifecycle tracking for analytics

---

## 🔌 API ENDPOINTS & AUTHENTICATION

### Booking Endpoints
```
POST   /api/bookings              - Create new booking (CLIENT role)
GET    /api/bookings              - Get user's bookings (filtered by role)
PUT    /api/bookings/:id/accept   - Stylist accepts booking
PUT    /api/bookings/:id/confirm  - Client confirms after payment
PUT    /api/bookings/:id/cancel   - Cancel booking (with reason)
```

### Payment Endpoints
```
POST   /api/payments/create-intent  - Create Stripe payment intent
POST   /api/payments/confirm        - Confirm payment completion
POST   /api/payments/refund         - Process refund for cancellation
POST   /api/payments/webhooks/stripe - Stripe webhook handler
```

### Chat Integration
```
POST   /api/chat/conversation  - Start new Aphrodite chat session
POST   /api/chat/message       - Send message (OpenAI + RASA routing)
GET    /api/chat/health        - Check chat service status
```

### Authentication Requirements
- **JWT Tokens**: Required for all booking/payment operations
- **Role Validation**: Endpoints check user role (CLIENT/STYLIST/ADMIN)
- **Ownership Checks**: Users can only access their own bookings
- **Session Management**: Redis-based session storage

---

## 🤖 AI INTEGRATION (RASA + OPENAI)

### Aphrodite Chat Assistant
- **Primary Engine**: OpenAI GPT-4o-mini for conversational beauty advice
- **Booking Engine**: RASA for structured appointment booking flows
- **Seamless Handoff**: Beauty advice transitions smoothly to booking form

### RASA Booking Form (booking_form)
**Required Slots:**
- `user_name`: Client's full name
- `user_phone`: Client's phone number for SMS notifications
- `service_type`: Requested service (corte, color, manicura, etc.)
- `preferred_date`: Desired appointment date
- `preferred_time`: Desired appointment time

### OpenAI Integration Rules
- **Model**: gpt-4o-mini (cost-optimized)
- **Max Tokens**: 500 (concise responses)
- **Temperature**: 0.7 (balanced creativity)
- **System Prompt**: Aphrodite beauty assistant persona
- **Fallback Strategy**: RASA → OpenAI → Static responses

---

## ⚠️ BUSINESS RULES & CONSTRAINTS (MANDATORY COMPLIANCE)

### User Role Separation (STRICTLY ENFORCED)
- **CLIENTS**: Can only book services, leave reviews, manage own bookings
- **STYLISTS**: Can only manage services, accept bookings, update availability
- **ADMIN**: Full system access for management and analytics

### Service Pricing Rules
- **Minimum Price**: $1.00 USD
- **Price Format**: DECIMAL(8,2) - max $999,999.99
- **Currency**: USD only (no multi-currency support)
- **Duration**: Must be positive integer (minutes)

### Booking Validation (CRITICAL)
- **Future Dates Only**: No past date bookings allowed
- **Service Availability**: Validate service belongs to selected stylist
- **Time Conflicts**: Prevent overlapping appointments
- **Capacity Limits**: One booking per stylist per time slot

### SMS Notification Requirements
- **Booking Confirmations**: Send to both client and stylist
- **Status Updates**: Notify on cancellations, completions
- **Payment Alerts**: Confirm successful payments
- **Reminder System**: Day-before appointment reminders

---

## 🛡️ SECURITY & ERROR HANDLING

### Input Validation (MANDATORY)
- **SQL Injection Prevention**: Always use parameterized queries
- **XSS Protection**: Sanitize all user inputs
- **Phone Number Format**: Validate E.164 format for SMS
- **Email Validation**: RFC 5322 compliance
- **Date/Time Validation**: ISO format enforcement

### Authentication Security
- **Password Hashing**: bcrypt with minimum 12 rounds
- **JWT Tokens**: 24-hour expiration, secure signing
- **Rate Limiting**: 100 requests/hour per IP for booking endpoints
- **CORS Policy**: Restricted to beautycita.com domain

### Error Handling Standards
```javascript
// Standard error response format
{
  success: false,
  error: "Human-readable error message",
  code: "ERROR_CODE", // For programmatic handling
  details: {} // Additional context when needed
}
```

### Edge Case Handling
- **Concurrent Bookings**: Database constraints prevent race conditions
- **Payment Failures**: Automatic booking cancellation after 3 failed attempts
- **Service Deletion**: Existing bookings preserved with SET NULL
- **User Deactivation**: Bookings completed but no new bookings allowed

---

## 🔄 INTEGRATION POINTS & WEBHOOKS

### Stripe Webhook Events (HANDLE THESE)
- `payment_intent.succeeded` → Update payment status, confirm booking
- `payment_intent.payment_failed` → Cancel booking, notify client
- `charge.dispute.created` → Log dispute, freeze stylist payouts

### SMS Integration (Twilio)
- **Booking Confirmations**: Immediate SMS to both parties
- **Payment Confirmations**: Receipt-style SMS with booking details
- **Cancellation Notices**: Reason and refund information
- **Appointment Reminders**: 24-hour advance notifications

### Chat Integration Flow
1. **User starts chat** → Create conversation session
2. **Beauty advice request** → Route to OpenAI with Aphrodite persona
3. **Booking intent detected** → Trigger RASA booking_form
4. **Form completion** → Create database booking, send confirmations

---

## 📊 MONITORING & ANALYTICS

### Key Metrics to Track
- **Booking Conversion Rate**: Chat → Actual bookings
- **Payment Success Rate**: Intent creation → Successful charge
- **Stylist Response Time**: Average acceptance/rejection time
- **Customer Satisfaction**: Review ratings and feedback

### Performance Requirements
- **API Response Time**: < 200ms for booking operations
- **Payment Processing**: < 3 seconds for Stripe integration
- **Chat Response Time**: < 2 seconds for OpenAI responses
- **Database Queries**: Indexed for date/status lookups

---

## 🚨 CRITICAL DEVELOPMENT GUIDELINES

### Code Standards (NON-NEGOTIABLE)
1. **Always use try-catch blocks** for async operations
2. **Validate all inputs** before database operations
3. **Check user authorization** on every protected endpoint
4. **Log all booking/payment state changes** for audit trail
5. **Test both success and failure scenarios** thoroughly

### Database Best Practices
1. **Use transactions** for multi-table operations
2. **Respect foreign key constraints** - never orphan records
3. **Index performance-critical queries** (date, status, user_id)
4. **Backup before schema changes** in production

### Payment Integration Rules
1. **Never store card data** - use Stripe tokens only
2. **Verify webhook signatures** to prevent fraud
3. **Handle idempotency** for duplicate events
4. **Test with Stripe test mode** before production deployment

### Error Recovery Procedures
1. **Failed payments** → Automatic booking cancellation + SMS notification
2. **Expired bookings** → Cleanup via BookingService cron job
3. **Database conflicts** → Graceful error messages, no system crashes
4. **API timeouts** → Retry logic with exponential backoff

---

## 📝 DEVELOPMENT CHECKLIST

Before implementing any booking/payment features:

- [ ] Verify user authentication and role authorization
- [ ] Validate all required input parameters
- [ ] Check business rule compliance (time windows, pricing, etc.)
- [ ] Implement proper error handling with meaningful messages
- [ ] Add transaction logging for audit trail
- [ ] Test edge cases (expired bookings, payment failures, etc.)
- [ ] Verify SMS notifications are sent to correct recipients
- [ ] Ensure database constraints prevent data corruption
- [ ] Test webhook signature verification for security
- [ ] Validate booking state transitions follow the defined flow

---

**Remember**: BeautyCita is a production system handling real money transactions. Every booking and payment operation must be thoroughly tested and comply with all business rules. When in doubt, favor security and data integrity over convenience features.

**Emergency Contact**: System logs located in `/var/www/beautycita.com/backend/logs/` for debugging production issues.