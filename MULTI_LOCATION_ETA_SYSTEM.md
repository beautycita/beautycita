# Multi-Location & ETA Management System
**BeautyCita Platform Enhancement**

## Overview

Implemented a comprehensive multi-location management system for stylists and real-time ETA tracking for client appointments. This system supports stylists working at multiple locations and provides advanced late-client mitigation tools.

---

## 🎯 Key Features

### 1. Multiple Business Locations
- Stylists can manage multiple salon locations
- Support for different location types:
  - **Home salon**
  - **Storefront salon**
  - **Mall location**
  - **Downtown branch**
  - **Mobile services**
  - **Client location**
- One primary location per stylist
- Location-specific working hours
- Amenity flags (parking, wheelchair accessible, walk-ins)

### 2. Real-Time Client Tracking
- Client GPS location tracking when en route
- Live ETA calculations using Google Maps Distance Matrix API
- Traffic-aware arrival time estimates
- Automatic proximity alerts (10 min, 5 min, arrived)

### 3. Late Client Detection & Mitigation
- Automatic detection of late-risk scenarios
- Multiple mitigation action types:
  - **Bump appointment** - Reschedule to later time
  - **Partial refund** - Issue percentage-based refund
  - **Full refund/cancel** - Cancel and refund entirely
  - **Contact client** - Send message/SMS
  - **Wait for client** - Mark as willing to wait
  - **Shorten service** - Reduce service duration
  - **Auto-reschedule** - Suggest new times

### 4. Client Navigation
- Get directions to appointment location
- Turn-by-turn navigation support
- Real-time traffic updates
- Distance and duration display

---

## 📊 Database Schema

### New Tables Created

#### `stylist_locations`
Stores multiple business locations per stylist.

```sql
- id (PRIMARY KEY)
- stylist_id (FOREIGN KEY → stylists.id)
- location_name (e.g., "Downtown Salon")
- location_type ('salon', 'home', 'mobile', etc.)
- address, city, state, zip, country
- latitude, longitude
- is_primary (BOOLEAN)
- is_active (BOOLEAN)
- accepts_walkins, parking_available, wheelchair_accessible
- working_hours (JSONB)
- notes (special instructions)
- photos (JSONB array)
```

#### `booking_location_tracking`
Real-time client location and ETA tracking.

```sql
- id (PRIMARY KEY)
- booking_id (FOREIGN KEY → bookings.id)
- current_latitude, current_longitude
- estimated_arrival_time
- distance_meters
- duration_seconds
- traffic_condition ('light', 'moderate', 'heavy')
- is_en_route (BOOLEAN)
- client_started_journey (BOOLEAN)
- alerts_sent (JSONB array)
- journey_started_at
- last_location_update
```

#### `booking_mitigation_actions`
Track actions taken when client is late/at risk.

```sql
- id (PRIMARY KEY)
- booking_id (FOREIGN KEY → bookings.id)
- initiated_by (FOREIGN KEY → users.id)
- action_type (bump, refund, cancel, contact, wait, shorten, reschedule)
- original_time, new_time
- refund_amount, refund_percentage
- message_sent, client_response
- client_acknowledged (BOOLEAN)
- reason, eta_at_action, minutes_until_appointment
- status ('pending', 'accepted', 'declined', 'completed')
```

#### `stylist_eta_preferences`
Configurable alert preferences per stylist.

```sql
- id (PRIMARY KEY)
- stylist_id (FOREIGN KEY → stylists.id)
- enable_eta_alerts, alert_10_min_away, alert_5_min_away, alert_arrived
- alert_late_risk
- late_threshold_minutes, early_warning_minutes, auto_bump_threshold_minutes
- auto_bump_enabled, auto_contact_client
- notify_sms, notify_push, notify_email
```

#### `booking_directions`
Store direction requests for navigation.

```sql
- id (PRIMARY KEY)
- booking_id (FOREIGN KEY → bookings.id)
- client_id (FOREIGN KEY → users.id)
- origin_address, origin_latitude, origin_longitude
- destination_address, destination_latitude, destination_longitude
- route_polyline (encoded)
- distance_meters, duration_seconds, duration_in_traffic_seconds
- navigation_started (BOOLEAN)
- navigation_started_at
```

### Modified Tables

#### `bookings`
```sql
ALTER TABLE bookings
ADD COLUMN location_id INTEGER REFERENCES stylist_locations(id);
```

---

## 🚀 Backend API Endpoints

### Location Management (`/api/stylist/locations`)

#### GET /api/stylist/locations
Get all locations for authenticated stylist.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "stylist_id": 23,
      "location_name": "Downtown Salon",
      "location_type": "salon",
      "address": "123 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "is_primary": true,
      "is_active": true,
      "accepts_walkins": true,
      "parking_available": true,
      "wheelchair_accessible": false,
      "working_hours": {},
      "notes": "Ring doorbell twice"
    }
  ]
}
```

#### POST /api/stylist/locations
Add a new business location.

**Request:**
```json
{
  "location_name": "Mall Branch",
  "location_type": "salon",
  "address": "456 Mall Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zip": "90001",
  "latitude": 34.0522,
  "longitude": -118.2437,
  "is_primary": false,
  "accepts_walkins": true,
  "parking_available": true,
  "wheelchair_accessible": true,
  "working_hours": {},
  "notes": "Located on 2nd floor"
}
```

#### PUT /api/stylist/locations/:id
Update a location.

#### DELETE /api/stylist/locations/:id
Delete a location (cannot delete primary if others exist).

#### POST /api/stylist/locations/:id/set-primary
Set a location as primary.

#### GET /api/stylist/:stylist_id/locations/public
Public endpoint for clients to view stylist locations.

---

### ETA Tracking (`/api/bookings`)

#### POST /api/bookings/:booking_id/start-journey
Client indicates they've started their journey.

**Request:**
```json
{
  "latitude": 34.0522,
  "longitude": -118.2437
}
```

**Response:**
```json
{
  "success": true,
  "message": "Journey started successfully",
  "data": {
    "eta": "2025-10-17T14:30:00Z",
    "distance_meters": 5000,
    "duration_minutes": 15
  }
}
```

#### POST /api/bookings/:booking_id/update-location
Update client's current location (real-time tracking).

**Request:**
```json
{
  "latitude": 34.0522,
  "longitude": -118.2437
}
```

Automatically sends proximity alerts at 10 min, 5 min, and arrival.

#### GET /api/bookings/:booking_id/tracking
Get current tracking status (for stylist).

**Response:**
```json
{
  "success": true,
  "data": {
    "current_latitude": 34.0522,
    "current_longitude": -118.2437,
    "estimated_arrival_time": "2025-10-17T14:30:00Z",
    "distance_meters": 2000,
    "duration_seconds": 420,
    "traffic_condition": "moderate",
    "is_en_route": true,
    "alerts_sent": ["10_min_away", "5_min_away"]
  }
}
```

#### GET /api/bookings/:booking_id/directions
Get directions to appointment location (for client).

**Query Params:** `?origin_lat=34.0522&origin_lng=-118.2437`

**Response:**
```json
{
  "success": true,
  "data": {
    "polyline": "encoded_polyline_string",
    "distance_meters": 5000,
    "duration_seconds": 900,
    "duration_in_traffic_seconds": 1200,
    "steps": [...],
    "start_address": "123 Start St",
    "end_address": "456 End Ave"
  }
}
```

---

### Mitigation Actions (`/api/bookings`)

#### POST /api/bookings/:booking_id/mitigation/bump
Bump appointment to a later time.

**Request:**
```json
{
  "new_time": "15:30:00",
  "reason": "Client 45 min away, appointment in 5 min",
  "message_to_client": "Hi! I'm moving your appointment to 3:30 PM. See you then!"
}
```

#### POST /api/bookings/:booking_id/mitigation/partial-refund
Issue partial refund for late client.

**Request:**
```json
{
  "refund_percentage": 25,
  "reason": "Client was 10 minutes late",
  "message_to_client": "Issuing 25% refund for the delay"
}
```

#### POST /api/bookings/:booking_id/mitigation/contact-client
Contact client about being late.

**Request:**
```json
{
  "message": "Hi! Just checking if you're on your way. Your appointment is in 10 minutes."
}
```

#### POST /api/bookings/:booking_id/mitigation/cancel
Cancel appointment and issue full refund.

**Request:**
```json
{
  "reason": "Client no-show",
  "message_to_client": "Appointment cancelled with full refund"
}
```

#### POST /api/bookings/:booking_id/mitigation/wait
Mark that stylist will wait for client.

**Request:**
```json
{
  "reason": "Client is close, I'll wait"
}
```

#### POST /api/bookings/:booking_id/mitigation/shorten-service
Shorten service duration to accommodate lateness.

**Request:**
```json
{
  "new_duration": 45,
  "reason": "Reducing service from 60 to 45 minutes",
  "message_to_client": "We'll do a quicker version due to time constraints"
}
```

#### GET /api/bookings/:booking_id/mitigation/history
Get all mitigation actions for a booking.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action_type": "contact_client",
      "reason": "Checking on client status",
      "eta_at_action": 45,
      "minutes_until_appointment": 5,
      "created_at": "2025-10-17T14:00:00Z",
      "first_name": "Sofia",
      "last_name": "Martinez"
    }
  ]
}
```

#### GET /api/bookings/late-risk-bookings
Get bookings at risk of client being late (for stylist dashboard).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "booking_date": "2025-10-17",
      "start_time": "14:30:00",
      "duration_seconds": 2700,
      "distance_meters": 10000,
      "is_en_route": true,
      "first_name": "Maria",
      "last_name": "Garcia",
      "phone": "+1234567890",
      "minutes_until_appointment": 5
    }
  ]
}
```

---

## 🔧 Google Maps API Integration

### APIs Used

1. **Distance Matrix API** - Calculate ETA and distance
   - Endpoint: `https://maps.googleapis.com/maps/api/distancematrix/json`
   - Parameters: `origins`, `destinations`, `departure_time=now`, `traffic_model=best_guess`
   - Returns: Distance, duration, duration_in_traffic

2. **Directions API** - Get turn-by-turn directions
   - Endpoint: `https://maps.googleapis.com/maps/api/directions/json`
   - Parameters: `origin`, `destination`, `departure_time=now`, `traffic_model=best_guess`
   - Returns: Polyline, steps, distance, duration

### Environment Variable

```bash
GOOGLE_MAPS_API_KEY=AIzaSyCsy8MrU8leZ1HonRBL40s804jW91Xb5Nc
```

**Note:** API key is already restricted to `beautycita.com` domain.

---

## 📱 Frontend Implementation (TODO)

### Stylist Location Management UI

**Component:** `StylistLocationsManager.tsx`

Features needed:
- List all locations with edit/delete buttons
- Add new location form with Google Maps location picker
- Set primary location
- Toggle active/inactive status
- Amenities checkboxes (parking, wheelchair, walk-ins)
- Working hours editor (per location)
- Location-specific notes

### Late Client Alert Dashboard

**Component:** `LateClientAlerts.tsx`

Features needed:
- Real-time list of at-risk bookings
- For each booking show:
  - Client name and photo
  - Current ETA
  - Minutes until appointment
  - Distance away
  - Traffic condition indicator
- Quick action buttons for each booking:
  - Bump appointment (with time picker)
  - Partial refund (with percentage slider)
  - Contact client (with message input)
  - Cancel booking
  - Wait for client
  - Shorten service

### Client Journey Tracking

**Component:** `ClientJourney.tsx`

Features needed:
- "Start Journey" button on booking details
- Real-time location updates (every 30 seconds)
- Google Maps embed showing route
- ETA countdown
- Distance remaining
- Traffic conditions
- Turn-by-turn directions

---

## 🤖 Background Job (TODO)

### ETA Monitoring Job

**File:** `backend/src/jobs/eta-monitor.js`

**Schedule:** Every 60 seconds

**Logic:**
1. Query all confirmed bookings for today with future start times
2. Check if client has started journey
3. If not en route AND appointment is within 15 minutes:
   - Send "early warning" alert to stylist
4. If en route:
   - Calculate current ETA
   - If ETA > appointment time:
     - Send "late risk" alert to stylist
     - Suggest mitigation actions based on severity
5. Check stylist ETA preferences before sending alerts

**Implementation:**
```javascript
const cron = require('node-cron');

// Run every 60 seconds
cron.schedule('*/60 * * * * *', async () => {
  // Get all active bookings
  const bookings = await query(`
    SELECT b.*, bt.*, sep.*
    FROM bookings b
    LEFT JOIN booking_location_tracking bt ON b.id = bt.booking_id
    LEFT JOIN stylist_eta_preferences sep ON b.stylist_id = sep.stylist_id
    WHERE b.status = 'confirmed'
      AND b.booking_date = CURRENT_DATE
      AND b.start_time > NOW()::time
  `);

  for (const booking of bookings.rows) {
    await checkAndAlertLateRisk(booking);
  }
});
```

---

## 🔔 Notification System

### Proximity Alerts

When client location is updated, automatic alerts are sent at:
- **10 minutes away** - "Client is 10 minutes from your salon"
- **5 minutes away** - "Client is 5 minutes away - final prep time!"
- **Arrived** - "Client has arrived"

### Late Risk Alerts

When client is detected to be running late:
- **Early Warning (15 min before)** - "Client hasn't started journey, appointment in 15 min"
- **Late Risk** - "Client ETA is 45 min but appointment in 5 min"
- **Suggested Actions** - Include quick action buttons in notification

### Notification Channels

Per stylist preferences:
- **SMS** (Twilio) - Immediate alerts
- **Push Notifications** - In-app alerts
- **Email** - Summary notifications

---

## 🎨 UI/UX Flow Examples

### Scenario 1: Client En Route (Normal)

1. Client taps "Start Journey" on booking details
2. App requests location permission
3. Location updates sent every 30 seconds
4. Stylist sees live ETA on their dashboard
5. Stylist receives 10 min alert → 5 min alert → Arrived alert
6. Appointment proceeds normally

### Scenario 2: Client Running Late

1. Appointment at 2:00 PM, current time 1:55 PM
2. Client hasn't started journey yet
3. System sends "early warning" to stylist
4. Stylist sees alert: "Client not en route, appointment in 5 min"
5. Stylist chooses action:
   - **Option A:** Bump to 2:30 PM
   - **Option B:** Contact client
   - **Option C:** Wait for client
6. Action executed automatically
7. Client notified of changes

### Scenario 3: Client Way Late

1. Appointment at 2:00 PM, current time 1:55 PM
2. Client starts journey
3. Google Maps says ETA: 45 minutes (due to traffic)
4. System detects: ETA (2:45 PM) >> Appointment time (2:00 PM)
5. Stylist gets urgent alert: "Client 45 min away, appointment in 5 min"
6. Suggested actions presented:
   - **Bump to 3:00 PM** (safe time)
   - **Partial refund + proceed when arrives**
   - **Cancel + full refund**
7. Stylist chooses and confirms
8. Client receives update

---

## 📊 Dashboard Widgets

### For Stylists

**Widget: "Incoming Clients"**
- List of clients en route
- Real-time ETA for each
- Distance away
- Traffic indicator

**Widget: "At-Risk Appointments"**
- Clients not yet en route (appointment soon)
- Clients running late
- Quick action buttons

**Widget: "Today's Locations"**
- If stylist works at multiple locations today
- Show which appointments are at which location
- Map view option

### For Clients

**Widget: "Your Appointment"**
- Directions button
- "I'm on my way" button
- ETA display
- Stylist contact button

---

## 🧪 Testing Checklist

- [ ] Create multiple locations for a stylist
- [ ] Set different locations as primary
- [ ] Create booking linked to specific location
- [ ] Client starts journey (location tracking begins)
- [ ] Update client location multiple times
- [ ] Verify proximity alerts sent at 10 min, 5 min, arrival
- [ ] Test late scenario (client far away, appointment soon)
- [ ] Bump appointment to later time
- [ ] Issue partial refund
- [ ] Contact client via mitigation action
- [ ] Cancel appointment with full refund
- [ ] Mark "wait for client"
- [ ] Shorten service duration
- [ ] Get directions to salon location
- [ ] View mitigation action history
- [ ] Check stylist ETA preferences
- [ ] Verify late-risk bookings endpoint

---

## 🔐 Security Considerations

1. **Location Privacy**
   - Only track location when client explicitly starts journey
   - Stop tracking after appointment completes
   - Don't expose exact client location to public APIs

2. **Authorization**
   - Stylists can only manage their own locations
   - Stylists can only view tracking for their bookings
   - Clients can only update location for their own bookings

3. **Rate Limiting**
   - Limit location updates to once per 30 seconds
   - Prevent spam on mitigation actions

4. **API Key Security**
   - Google Maps API key restricted to beautycita.com
   - Store API key in environment variable

---

## 📈 Future Enhancements

1. **Auto-Reschedule Intelligence**
   - ML model learns stylist's rescheduling patterns
   - Suggests optimal bump times based on calendar

2. **Client Communication Templates**
   - Pre-written messages for common scenarios
   - Multilingual support (EN/ES)

3. **Historical Analytics**
   - Track late client patterns
   - Identify problem times/locations
   - Suggest buffer times

4. **Geofencing**
   - Automatic check-in when client enters salon radius
   - No manual "I've arrived" needed

5. **Multiple Appointment Types**
   - In-person (requires location tracking)
   - Video consultation (no location tracking)
   - Mobile service (stylist goes to client)

6. **Traffic Prediction**
   - Warn clients to leave early based on typical traffic
   - "You should leave by 1:30 PM to arrive by 2:00 PM"

---

## 📝 Migration Notes

- Existing stylist locations automatically migrated to `stylist_locations` table
- Primary location set based on existing `location_address` in `stylists` table
- Existing bookings NOT automatically linked to locations (location_id will be NULL)
- Frontend needs to handle NULL location_id gracefully

---

## 🚀 Deployment Status

✅ **Completed:**
- Database schema design and migration
- Backend API routes (locations, ETA, mitigation)
- Google Maps API integration
- Server route registration
- Backend restarted successfully

⏳ **In Progress:**
- Frontend UI components
- Background ETA monitoring job
- Notification system integration

❌ **Not Started:**
- E2E testing
- Production deployment
- User documentation

---

## 📞 Support

For questions or issues with this system, refer to:
- Database schema: `/tmp/multi_location_schema.sql`
- Backend routes: `/var/www/beautycita.com/backend/src/routes/`
  - `stylist-locations.js`
  - `booking-eta.js`
  - `booking-mitigation.js`

---

**Implementation Date:** October 17, 2025
**Version:** 1.0.0
**Status:** Backend Complete, Frontend Pending
