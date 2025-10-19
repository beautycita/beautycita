# Booking System Implementation Guide

## Quick Reference for Developers

### File Locations

**Backend:**
- Main routes: `/backend/src/bookingRoutes.js` (1,252 lines)
- Alternative routes: `/backend/src/routes/booking-requests.js`
- Stylist routes: `/backend/src/stylistBookingRoutes.js`
- Availability: `/backend/src/availabilityRoutes.js`
- Payments: `/backend/src/paymentRoutes.js`
- Services: `/backend/src/bookingService.js`

**Frontend:**
- Pages: `/frontend/src/pages/BookingPage.tsx`, `BookingsPage.tsx`, `BookingsCalendarPage.tsx`
- Components: `/frontend/src/components/BookingFlow.tsx`, `BookingCalendar.tsx`, `PaymentCheckout.tsx`
- Services: `/frontend/src/services/bookingService.ts`
- Hooks: `/frontend/src/hooks/useLocationBooking.ts`

**Database:**
- Tables: `bookings`, `booking_requests`, `stylist_availability`, `payments`, `platform_transactions`
- Migrations: `/backend/migrations/` (many related files)

---

## Database Tables Reference

### bookings
```sql
-- Key columns for booking flow:
id              INT PRIMARY KEY
client_id       INT (references users)
stylist_id      INT (references stylists)
service_id      INT (references services)
booking_date    DATE
booking_time    TIME
duration_minutes INT
status          VARCHAR (PENDING|VERIFY_ACCEPTANCE|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED|NO_SHOW|EXPIRED)
total_price     NUMERIC(8,2)
notes           TEXT (client's special requests)

-- Expiration timers:
request_expires_at      TIMESTAMP (5 min from creation)
acceptance_expires_at   TIMESTAMP (10 min after stylist accepts)

-- Status tracking:
confirmed_at    TIMESTAMP (when payment confirmed)
completed_at    TIMESTAMP (when service finished)
cancelled_at    TIMESTAMP (if cancelled)
last_status_change TIMESTAMP

-- Cancellation info:
cancellation_reason VARCHAR
cancelled_by    INT (user ID who cancelled)

-- Audit:
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### booking_requests (Alternative workflow)
```sql
id                      INT PRIMARY KEY
client_id               INT (references users)
stylist_id              INT (references stylists)
service_id              INT (references services)
requested_date          DATE
requested_time          TIME
duration_minutes        INT
total_price             NUMERIC(8,2)
status                  VARCHAR (pending|auto_booked|awaiting_client_confirmation|confirmed|expired|declined|cancelled)

-- Expiration windows:
expires_at              TIMESTAMP (15 min from creation)
auto_book_window_ends_at TIMESTAMP (5 min for auto-booking)

-- Stylist response:
stylist_responded_at    TIMESTAMP
stylist_response        VARCHAR (accept|decline)
stylist_decline_reason  TEXT

-- Links to created booking:
booking_id              INT (references bookings, created on accept)

created_at              TIMESTAMP
updated_at              TIMESTAMP
```

### stylist_availability
```sql
id              INT PRIMARY KEY
stylist_id      INT (references stylists)
date            DATE
start_time      TIME
end_time        TIME
is_available    BOOLEAN (true = available, false = blocked)
reason          VARCHAR (e.g., "Lunch", "Vacation", "Closed")
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### payments
```sql
id                              INT PRIMARY KEY
booking_id                      INT (references bookings)
stripe_payment_intent_id        VARCHAR (pi_xxx)
amount                          NUMERIC (total charged)
platform_fee                    NUMERIC (3% of amount)
stylist_payout                  NUMERIC (97% of amount)
currency                        VARCHAR (USD)
status                          VARCHAR (PENDING|SUCCEEDED|FAILED|PENDING_REFUND|RETAINED|COMPLETED)
processed_at                    TIMESTAMP
refund_reason                   VARCHAR (why refunded)
created_at                      TIMESTAMP
updated_at                      TIMESTAMP
```

---

## API Endpoints Detailed

### Create Booking
```
POST /api/bookings/create
Authorization: Bearer {token}

Request Body:
{
  clientId: number,
  stylistId: number,
  serviceId: number,
  bookingDate: "YYYY-MM-DD",
  bookingTime: "HH:MM",
  notes?: string
}

Response:
{
  success: true,
  booking: {
    id: number,
    status: "PENDING",
    expiresAt: timestamp,
    service: { name, duration, price },
    stylist: { name, phone }
  },
  smsDelivered: boolean
}

Errors:
- 400: Missing required fields
- 404: Service/stylist/client not found
- 403: Client/stylist not active
```

### Stylist Accept
```
POST /api/bookings/:bookingId/accept
Authorization: Bearer {token}

Request Body:
{
  stylistId: number
}

Response:
{
  success: true,
  message: "Booking accepted! Client has 10 minutes to confirm payment.",
  booking: {
    id: number,
    status: "VERIFY_ACCEPTANCE",
    clientConfirmationExpiresAt: timestamp
  }
}

Errors:
- 404: Booking not found or unauthorized
- 400: Booking not in PENDING status
- 400: Request expired (5 min passed)
```

### Client Confirm + Pay
```
POST /api/bookings/:bookingId/confirm
Authorization: Bearer {token}

Request Body:
{
  clientId: number,
  paymentIntentId: string (from Stripe)
}

Response:
{
  success: true,
  booking: {
    id: number,
    status: "CONFIRMED",
    confirmedAt: timestamp
  }
}

Errors:
- 404: Booking not found or unauthorized
- 400: Booking not in VERIFY_ACCEPTANCE status
- 400: Acceptance window expired (10 min passed)
```

### Cancel Booking
```
POST /api/bookings/:bookingId/cancel
Authorization: Bearer {token}

Request Body:
{
  userId: number,
  reason?: string,
  forceCancel?: boolean (admin only)
}

Response:
{
  success: true,
  booking: {
    id: number,
    status: "CANCELLED",
    cancelledAt: timestamp,
    refundStatus: string
  },
  cancellationPolicy: {
    wasLateCancel: boolean,
    hoursBeforeBooking: number
  }
}

Errors:
- 403: Cancellation not allowed (less than 12h for client, 3h for stylist)
- 400: Booking already cancelled/completed/expired
```

### Get Available Slots
```
GET /api/bookings/stylists/:stylistId/availability?date=YYYY-MM-DD
Authorization: Bearer {token}

Response:
{
  success: true,
  data: ["09:00", "09:30", "10:00", ...],
  date: "YYYY-MM-DD",
  stylistId: number,
  totalSlots: number
}

Logic:
- Fetches all existing bookings for date
- Generates 30-min slots from 9 AM to 6 PM
- Removes slots occupied by PENDING/VERIFY_ACCEPTANCE/CONFIRMED bookings
- Blocks past slots if requesting today
- Returns only slots >1 hour in future for same-day bookings
```

### Get Stylist Availability
```
GET /api/availability/stylist/:stylistId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
Authorization: Bearer {token}

Response:
{
  success: true,
  availability: [
    {
      id: number,
      stylistId: number,
      date: "YYYY-MM-DD",
      startTime: "HH:MM",
      endTime: "HH:MM",
      isAvailable: boolean,
      reason: string
    }
  ],
  bookings: [
    {
      id: number,
      bookingDate: "YYYY-MM-DD",
      bookingTime: "HH:MM",
      status: "CONFIRMED",
      duration: number,
      serviceName: string
    }
  ]
}
```

### Update Availability
```
POST /api/availability/update
Authorization: Bearer {token}

Request Body:
{
  stylistId: number,
  date: "YYYY-MM-DD",
  startTime: "HH:MM",
  endTime: "HH:MM",
  isAvailable: boolean,
  reason?: string
}

Response:
{
  success: true,
  availability: { id, stylistId, date, startTime, endTime, isAvailable, reason }
}
```

---

## Frontend Integration Examples

### 1. Create a Booking
```typescript
import { bookingService } from '../services/bookingService'

async function createBooking() {
  const booking = await bookingService.createBooking({
    stylist_id: '123',
    service_id: '456',
    appointment_date: '2025-10-25',
    appointment_time: '14:00',
    notes: 'I prefer minimal volume'
  })
  
  if (booking.success) {
    console.log('Booking created:', booking.data.id)
    // Show 5-minute timer for stylist response
  }
}
```

### 2. Get Available Slots
```typescript
async function loadSlots(stylistId: string, date: string) {
  const response = await bookingService.getAvailableSlots(stylistId, date)
  
  if (response.success) {
    // response.data is array of time strings like ["09:00", "09:30", ...]
    setAvailableSlots(response.data)
  }
}
```

### 3. Stylist Accept Booking
```typescript
async function acceptBooking(bookingId: string) {
  const result = await bookingService.stylistAcceptBooking(bookingId, stylistId)
  
  if (result.success) {
    // Booking moved to VERIFY_ACCEPTANCE
    // Client has 10 minutes to pay
    toast.success('Request accepted! Awaiting client payment...')
  }
}
```

### 4. Client Confirm Payment
```typescript
// After Stripe payment succeeds
async function confirmBooking(bookingId: string, paymentIntentId: string) {
  const result = await bookingService.clientConfirmBooking(
    bookingId,
    clientId,
    paymentIntentId
  )
  
  if (result.success) {
    // Booking confirmed
    navigateTo('/bookings/' + bookingId)
  }
}
```

### 5. Cancel Booking
```typescript
async function cancelBooking(bookingId: string, reason: string) {
  try {
    const result = await bookingService.cancelBooking(bookingId, {
      userId,
      reason
    })
    
    // Check refund status
    console.log('Refund:', result.booking.refundStatus)
  } catch (error) {
    if (error.response?.status === 403) {
      // Not eligible to cancel (too close to appointment)
      toast.error(error.response.data.message)
    }
  }
}
```

---

## Common Issues & Solutions

### Issue: Double Booking
**Problem:** Two clients book same time slot

**Root Cause:** Race condition - slots checked but not locked during booking creation

**Solution:** Use database transaction:
```javascript
BEGIN TRANSACTION
  - Check slot availability
  - Create booking
  - Lock slot
COMMIT
```

### Issue: Expired Bookings Not Cleaned Up
**Problem:** Bookings stuck in PENDING/VERIFY_ACCEPTANCE

**Root Cause:** Background job not running or crashed

**Solution:** Check `/backend/src/bookingExpiration.js` and verify:
1. Job is scheduled in server.js
2. Database connection is active
3. Status check constraint is valid

### Issue: Payment Processing Delayed
**Problem:** Stylist doesn't get payout until day after

**Root Cause:** Payout scheduled for midnight in platform_transactions

**Solution:** Check `processPendingPayouts()` in bookingService.js - adjust timing if needed

### Issue: SMS Not Sent to Stylist
**Problem:** Stylist doesn't receive booking request SMS

**Root Cause:** Phone not verified or Twilio quota exceeded

**Solution:**
1. Verify phone in users table
2. Check Twilio balance: $11.92 (from CLAUDE.md)
3. Check SMS logs in `/backend/logs/`

---

## Testing Checklist

### Manual Testing
- [ ] Create booking as client
- [ ] Receive SMS as stylist within 2 seconds
- [ ] Accept booking as stylist
- [ ] Receive SMS as client confirming acceptance
- [ ] Complete payment as client within 10 minutes
- [ ] See CONFIRMED status in dashboard
- [ ] Cancel booking and verify refund policy
- [ ] Report no-show and check credit/penalty
- [ ] Complete booking and verify stylist payout

### Edge Cases
- [ ] Request expires (create, wait 5+ min, check status)
- [ ] Acceptance expires (accept, wait 10+ min without payment)
- [ ] Same-day booking (ensure >1 hour buffer)
- [ ] Late cancellation (client cancels <12h before)
- [ ] Double-book prevention (attempt to book overlapping slot)
- [ ] Timezone handling (client in different timezone)
- [ ] Network failure during payment (retry logic)

---

## Booking Status Flow Diagram

```
                    CLIENT                              STYLIST
                    -----                               -------

[Client Selects Service]
        |
        v
[Client Chooses Date/Time]
        |
        v
[Client Adds Notes]
        |
        v
POST /bookings/create ────────────────────────> [PENDING Status]
        |                              SMS Notification
        |                            (5 min response time)
        |                                     ^
        |                                     |
        |                         [Stylist Accepts]
        |                                     |
        | <────────────────────── POST /accept
        | SMS: "Accepted!"         [VERIFY_ACCEPTANCE]
        |                         (10 min payment window)
        |
[Client Opens App]
[Sees Payment Needed]
        |
        v
[Stripe Checkout Form]
        |
        v
POST /confirm + Payment ────────> [CONFIRMED Status]
        |                    SMS: "Booked!"
        v
[See Confirmation]
        |
        [Days Pass...]
        |
        v
[Day of Appointment]
        |
        |---> POST /complete ──────> [COMPLETED]
        |                    SMS: "Service complete!"
        |                    Payout: 97% to stylist
        |
[Rate Stylist] ──────────> [REVIEW Created]


If something goes wrong:

PENDING ──(5 min)──> EXPIRED ──> SMS to client
                                  "Stylist didn't respond"

VERIFY_ACCEPTANCE ──(10 min)──> EXPIRED ──> SMS to stylist
                                            "Client didn't pay"

CONFIRMED ──(Cancel) ──> CANCELLED ──> Check refund policy
                         ├─ <12h: SMS "Refund processing"
                         └─ >12h: SMS "Late cancel - no refund"

CONFIRMED ──(No-Show) ──> NO_SHOW_STYLIST ──> Refund to client
           ──(No-Show) ──> NO_SHOW_CLIENT ──> 60/40 split
```

---

## Performance Considerations

### Indexes (Already Optimized)
```sql
idx_bookings_client (client_id)
idx_bookings_stylist (stylist_id)
idx_bookings_date (booking_date)
idx_bookings_status (status)
idx_bookings_expires_at (request_expires_at)
idx_bookings_acceptance_expires (acceptance_expires_at)
idx_bookings_expiration_check (status, request_expires_at, acceptance_expires_at)
idx_bookings_client_date (client_id, booking_date DESC)
idx_bookings_stylist_date_status (stylist_id, booking_date, status)
idx_bookings_status_created (status, created_at)
idx_bookings_revenue_query (stylist_id, status, booking_date)
```

### Query Optimization Tips
1. **Always use date range** when querying bookings
2. **Filter by status** before processing (don't process all)
3. **Batch operations** for availability (use bulk-update endpoint)
4. **Cache availability** on frontend (expires every 30 sec)

---

## Related Documentation
- CLAUDE.md - Overall project context
- SECURITY_AUDIT_REPORT.md - Security considerations for payments
- MIGRATION_CHECKLIST.md - Deployment steps

