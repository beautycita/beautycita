# BeautyCita Booking System Integration Guide

## Overview

This guide explains how to use the new React Big Calendar-based booking system that connects to the existing backend API.

## Components Created

### 1. BookingCalendar
**Location:** `/src/components/booking/BookingCalendar.tsx`

A full-featured calendar component that displays bookings and availability using React Big Calendar.

**Props:**
```typescript
interface BookingCalendarProps {
  stylistId: number              // Required: Stylist to show calendar for
  onSelectSlot?: (start: Date, end: Date) => void  // Optional: Handle slot selection
  onSelectEvent?: (event: BookingEvent) => void    // Optional: Handle event click
  showAvailability?: boolean      // Optional: Show available slots (default: true)
  editable?: boolean             // Optional: Allow selecting slots (default: false)
}
```

**Features:**
- Week, Month, Day views
- Real-time booking data from backend
- Color-coded status (PENDING=yellow, CONFIRMED=green, COMPLETED=blue, CANCELLED=red)
- Available slots shown in light green
- Pink-purple-blue gradient theme matching brand
- Click events to view booking details

**Usage Example:**
```tsx
import BookingCalendar from '@/components/booking/BookingCalendar'

function StylistDashboard() {
  const { user } = useAuthStore()

  return (
    <BookingCalendar
      stylistId={user.stylist_id}
      showAvailability={true}
      onSelectEvent={(event) => {
        console.log('Booking clicked:', event.resource.bookingId)
      }}
    />
  )
}
```

---

### 2. StylistAvailabilityEditor
**Location:** `/src/components/booking/StylistAvailabilityEditor.tsx`

Manage weekly working hours and time-off periods.

**Props:**
```typescript
interface StylistAvailabilityEditorProps {
  stylistId: number              // Required: Stylist ID
  onSave?: () => void           // Optional: Callback after successful save
}
```

**Features:**
- Set working hours for each day of the week
- Enable/disable specific days
- Add time-off periods (vacations, holidays)
- Delete time-off periods
- Copy hours to all days
- Connects to `/api/availability/stylist/:id/recurring` endpoint

**Usage Example:**
```tsx
import StylistAvailabilityEditor from '@/components/booking/StylistAvailabilityEditor'

function AvailabilityPage() {
  const { user } = useAuthStore()

  return (
    <StylistAvailabilityEditor
      stylistId={user.stylist_id}
      onSave={() => toast.success('Saved!')}
    />
  )
}
```

---

### 3. TimeSlotPicker
**Location:** `/src/components/booking/TimeSlotPicker.tsx`

Client-facing component to select a date and time for booking.

**Props:**
```typescript
interface TimeSlotPickerProps {
  stylistId: number              // Required: Stylist to book with
  serviceId: number             // Required: Service being booked
  serviceDuration: number       // Required: Duration in minutes
  onSelectSlot: (date: string, time: string) => void  // Required: Callback with selection
  selectedDate?: string         // Optional: Pre-selected date
  selectedTime?: string         // Optional: Pre-selected time
}
```

**Features:**
- Week-by-week navigation
- Day selection pills (past dates disabled)
- Time slot grid with availability
- Price display per slot
- Gradient theme matching brand
- Mobile responsive
- Fetches from `/api/bookings/stylists/:id/availability` endpoint

**Usage Example:**
```tsx
import TimeSlotPicker from '@/components/booking/TimeSlotPicker'

function BookingFlow() {
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')

  return (
    <TimeSlotPicker
      stylistId={selectedStylist.id}
      serviceId={selectedService.id}
      serviceDuration={selectedService.duration_minutes}
      onSelectSlot={(date, time) => {
        setBookingDate(date)
        setBookingTime(time)
        // Move to payment step
      }}
      selectedDate={bookingDate}
      selectedTime={bookingTime}
    />
  )
}
```

---

## API Endpoints Used

### Bookings
```
GET  /api/bookings/stylist/:id/bookings
     → Fetch stylist's bookings (used by BookingCalendar)

GET  /api/bookings/stylists/:id/availability
     → Fetch available time slots (used by TimeSlotPicker & BookingCalendar)

POST /api/bookings/create
     → Create new booking

PUT  /api/bookings/:id/status
     → Update booking status
```

### Availability
```
GET  /api/availability/stylist/:id/recurring
     → Get weekly working hours

POST /api/availability/stylist/:id/recurring
     → Set weekly working hours

GET  /api/availability/stylist/:id/time-off
     → Get time-off periods

POST /api/availability/stylist/:id/time-off
     → Add time-off period

DELETE /api/availability/stylist/:id/time-off/:timeOffId
       → Remove time-off period
```

---

## Pages Updated

### BusinessCalendar.tsx
**Location:** `/src/pages/business/BusinessCalendar.tsx`

Now uses `BookingCalendar` component to display visual calendar instead of just list view.

**Changes:**
- Imports `BookingCalendar`
- Removed manual calendar controls (BookingCalendar has built-in controls)
- Kept appointment list below calendar for quick upcoming view
- Clicking calendar events opens appointment detail modal

### BusinessAvailability.tsx
**Location:** `/src/pages/business/BusinessAvailability.tsx`

Replaced entire component with `StylistAvailabilityEditor`.

**Changes:**
- Removed local state management
- Now connects to real backend API
- Added time-off management

---

## Styling

### Calendar Theme
**Location:** `/src/components/booking/calendar-theme.css`

Custom CSS overrides for React Big Calendar:
- Pink-purple-blue gradient toolbar
- Rounded corners (border-radius: 16px-24px)
- Brand color event backgrounds
- Dark mode support
- Mobile responsive breakpoints
- Hover effects and transitions

**Import in component:**
```tsx
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar-theme.css'
```

---

## Complete Booking Flow Example

Here's how a complete client booking flow would work:

```tsx
// 1. Client selects service
<ServiceBrowser onServiceSelect={setSelectedService} />

// 2. Client picks date/time
<TimeSlotPicker
  stylistId={selectedService.stylist_id}
  serviceId={selectedService.id}
  serviceDuration={selectedService.duration_minutes}
  onSelectSlot={(date, time) => {
    setBookingDetails({ service: selectedService, date, time })
    goToPayment()
  }}
/>

// 3. Client pays
<PaymentCheckout
  booking={bookingDetails}
  onSuccess={(paymentIntent) => {
    // Backend creates booking via POST /api/bookings/create
    goToConfirmation()
  }}
/>

// 4. Stylist sees booking in calendar
<BookingCalendar
  stylistId={stylist.id}
  showAvailability={true}
  onSelectEvent={(event) => {
    // Open booking details modal
    // Options to Accept/Decline/Complete
  }}
/>
```

---

## Backend Requirements

These endpoints **must exist** for components to work:

### Required Endpoints
- ✅ `GET /api/bookings/stylist/:id/bookings` (already exists)
- ✅ `POST /api/bookings/create` (already exists)
- ⚠️ `GET /api/bookings/stylists/:id/availability` (verify format)
- ⚠️ `GET /api/availability/stylist/:id/recurring` (verify exists)
- ⚠️ `POST /api/availability/stylist/:id/recurring` (verify exists)
- ⚠️ `GET /api/availability/stylist/:id/time-off` (verify exists)
- ⚠️ `POST /api/availability/stylist/:id/time-off` (verify exists)
- ⚠️ `DELETE /api/availability/stylist/:id/time-off/:id` (verify exists)

### Expected Response Format

**GET /api/bookings/stylist/:id/bookings:**
```json
{
  "success": true,
  "bookings": [
    {
      "id": 123,
      "client_name": "María García",
      "service_name": "Haircut & Style",
      "booking_date": "2025-10-20",
      "start_time": "14:00",
      "end_time": "15:00",
      "status": "CONFIRMED",
      "total_price": 50.00
    }
  ]
}
```

**GET /api/bookings/stylists/:id/availability:**
```json
{
  "success": true,
  "slots": [
    { "time": "09:00", "available": true, "price": 50.00 },
    { "time": "09:30", "available": false },
    { "time": "10:00", "available": true, "price": 50.00 }
  ]
}
```

**GET /api/availability/stylist/:id/recurring:**
```json
{
  "success": true,
  "availability": [
    {
      "day_of_week": 1,
      "start_time": "09:00",
      "end_time": "17:00"
    }
  ]
}
```

---

## Testing Checklist

### Stylist Flow
- [ ] Open Business Calendar page
- [ ] Verify calendar shows bookings with correct colors
- [ ] Click on a booking to see details modal
- [ ] Navigate between week/month/day views
- [ ] Open Availability page
- [ ] Set working hours for multiple days
- [ ] Use "Copy to all days" feature
- [ ] Save working hours
- [ ] Add a time-off period
- [ ] Delete a time-off period

### Client Flow
- [ ] Browse services
- [ ] Select a service
- [ ] See TimeSlotPicker with current week
- [ ] Navigate to next week
- [ ] Select a day
- [ ] See available time slots load
- [ ] Select a time slot
- [ ] Verify date/time passed to next step
- [ ] Complete payment (if integrated)
- [ ] Verify booking appears in stylist calendar

### Edge Cases
- [ ] Past dates are disabled in TimeSlotPicker
- [ ] No available slots shows empty state
- [ ] Loading states appear during API calls
- [ ] Error messages show for API failures
- [ ] Stylist without profile shows error message
- [ ] Mobile responsive on all screen sizes

---

## Troubleshooting

### Calendar not showing events
- Verify API response format matches expected structure
- Check browser console for API errors
- Ensure `stylist_id` is correctly passed
- Verify JWT token is included in headers

### Time slots not appearing
- Check `/api/bookings/stylists/:id/availability` endpoint exists
- Verify stylist has set recurring availability
- Check date format is 'yyyy-MM-dd'
- Verify service duration is a number

### Styles not applying
- Ensure `calendar-theme.css` is imported after React Big Calendar CSS
- Check for CSS conflicts with global styles
- Verify Tailwind is configured correctly

### API 401 Errors
- Check JWT token is valid
- Verify `localStorage.getItem('authToken')` returns token
- Ensure Authorization header format: `Bearer <token>`

---

## Future Enhancements

### Potential Improvements
1. **Real-time updates:** WebSocket integration for live booking updates
2. **Drag & drop:** Allow stylists to reschedule bookings by dragging
3. **Recurring bookings:** Support for weekly/monthly recurring appointments
4. **Waitlist:** Allow clients to join waitlist for fully booked slots
5. **Booking notes:** Add/view special instructions on calendar events
6. **Calendar sync:** Export to Google Calendar, Apple Calendar
7. **Push notifications:** Real-time booking alerts
8. **Appointment reminders:** Automated SMS/email reminders
9. **Multi-stylist view:** Calendar showing multiple stylists side-by-side
10. **Analytics:** Booking trends, peak hours, revenue forecasting

---

## Dependencies

```json
{
  "react-big-calendar": "^1.19.4",
  "date-fns": "^3.2.0",
  "framer-motion": "^10.18.0",
  "axios": "^1.6.5",
  "react-hot-toast": "^2.4.1"
}
```

All dependencies are already installed in package.json.

---

## Support

For issues or questions:
1. Check this guide first
2. Review backend API documentation
3. Check browser console for errors
4. Verify all API endpoints are working
5. Test with Postman/curl to isolate frontend vs backend issues

---

**Last Updated:** October 17, 2025
**Version:** 1.0
**Author:** BeautyCita Development Team
