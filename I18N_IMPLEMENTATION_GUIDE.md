# BeautyCita i18n Implementation Guide

**Status:** Translation system is 99% set up. 128 files need component updates.

## Quick Summary

**What's Done:**
- ✅ i18next configured and working
- ✅ 2,016 translation keys in both English and Spanish
- ✅ Language detection, switcher, persistence
- ✅ date-fns locale support (en-US, es-MX)
- ✅ 46% of pages already use i18n
- ✅ Frontend built with new translations

**What's Left:**
- ⚠️ 128 files have hardcoded strings (see detailed list below)
- ⚠️ Booking system components need updates
- ⚠️ Business dashboard needs updates
- ⚠️ Admin panel needs updates

---

## Translation Files Updated

### English: `/frontend/public/locales/en-US/common.json`
- **Lines:** 2,016
- **New sections added:**
  - `bookingCalendar.*` (9 keys)
  - `bookingDetails.*` (14 keys)
  - `availabilityEditor.*` (23 keys)
  - `timeSlotPicker.*` (7 keys)

### Spanish: `/frontend/public/locales/es-MX/common.json`
- **Lines:** 2,012
- **Same sections added** with Spanish translations

---

## How to Add i18n to a Component

### Step 1: Import Hook
```typescript
import { useTranslation } from 'react-i18next'
```

### Step 2: Use in Component
```typescript
export default function MyComponent() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <h1>{t('mySection.title')}</h1>
      <p>{t('mySection.description')}</p>
    </div>
  )
}
```

### Step 3: Replace Hardcoded Strings
**Before:**
```typescript
<button>Save Changes</button>
```

**After:**
```typescript
<button>{t('common.save')}</button>
```

---

## Priority 1: Booking System Components (CRITICAL)

### 1. BookingCalendar.tsx
**Location:** `/frontend/src/components/booking/BookingCalendar.tsx`

**Changes needed:**
```typescript
// Add import
import { useTranslation } from 'react-i18next'
import { enUS, es } from 'date-fns/locale'

// In component
const { t, i18n } = useTranslation()

// Update localizer
const dateLocale = i18n.language?.startsWith('es') ? es : enUS
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay,
  locales: { 'en-US': enUS, 'es-MX': es, 'es': es }
})

// Replace strings
'Client' → t('bookingCalendar.client')
'Available' → t('bookingCalendar.available')
'Loading bookings...' → t('bookingCalendar.loading')
'Failed to load calendar' → t('bookingCalendar.failedToLoad')
```

### 2. BookingDetailsModal.tsx
**Location:** `/frontend/src/components/booking/BookingDetailsModal.tsx`

**Changes needed:**
```typescript
// Add import
import { useTranslation } from 'react-i18next'

// In component
const { t } = useTranslation()

// Replace strings
'Booking Details' → t('bookingDetails.title')
'Service' → t('bookingDetails.service')
'Accept Booking' → t('bookingDetails.accept')
'Mark as Complete' → t('bookingDetails.complete')
'Booking accepted!' → t('bookingDetails.bookingAccepted')
```

### 3. TimeSlotPicker.tsx
**Location:** `/frontend/src/components/booking/TimeSlotPicker.tsx`

**Changes needed:**
```typescript
// Replace strings
'Select Date' → t('timeSlotPicker.selectDate')
'Select Time' → t('timeSlotPicker.selectTime')
'No time slots available' → t('timeSlotPicker.noSlotsAvailable')
'Morning' → t('timeSlotPicker.morning')
'Afternoon' → t('timeSlotPicker.afternoon')
'Evening' → t('timeSlotPicker.evening')
```

### 4. StylistAvailabilityEditor.tsx
**Location:** `/frontend/src/components/booking/StylistAvailabilityEditor.tsx`

**Changes needed:**
```typescript
// Replace strings
'Manage Availability' → t('availabilityEditor.title')
'Monday' → t('availabilityEditor.monday')
'Tuesday' → t('availabilityEditor.tuesday')
// ... etc for all days
'Start Time' → t('availabilityEditor.startTime')
'Save Schedule' → t('availabilityEditor.saveSchedule')
```

---

## Priority 2: Business Dashboard (HIGH)

### BusinessDashboard.tsx, BusinessCalendar.tsx, BusinessServices.tsx, etc.
**Pattern:**
```typescript
// Navigation items
'Calendar' → t('nav.calendar')
'Services' → t('nav.services')
'Availability' → t('nav.availability')

// Stats/labels
'Total Revenue' → t('dashboard.stylist.stats.totalRevenue')
'Upcoming Bookings' → t('dashboard.stylist.stats.upcomingBookings')
```

All navigation and dashboard translations already exist in common.json under `dashboard.stylist.*`

---

## Priority 3: Admin Panel (HIGH)

### Panel Pages (11 files)
- PanelBookings.tsx
- PanelAnalytics.tsx
- PanelFinance.tsx
- PanelDisputes.tsx
- PanelUsers.tsx
- etc.

**Pattern:**
```typescript
// Most admin text can use existing translations
'Loading...' → t('common.loading')
'Save' → t('common.save')
'Cancel' → t('common.cancel')
'Search' → t('common.search')
```

Add new `admin.*` section to translations if needed for admin-specific terminology.

---

## Priority 4: Forms & Authentication (MEDIUM)

### PaymentForm.tsx (**CRITICAL - Mixed Language**)
**Issue:** Has hardcoded Spanish in English file
```typescript
// Current (BAD):
toast.success('¡Pago procesado exitosamente!')

// Fix:
toast.success(t('payment.processedSuccessfully'))
```

Add to translations:
```json
"payment": {
  "processedSuccessfully": "Payment processed successfully!",
  "cardNumber": "Card Number",
  "expiry": "Expiry",
  "cvc": "CVC"
}
```

---

## Complete File List (128 files need updates)

### CRITICAL (Week 1)
- [ ] components/booking/BookingCalendar.tsx
- [ ] components/booking/BookingDetailsModal.tsx
- [ ] components/booking/TimeSlotPicker.tsx
- [ ] components/booking/StylistAvailabilityEditor.tsx
- [ ] components/PaymentForm.tsx (mixed language issue)
- [ ] components/PhoneVerificationStep.tsx
- [ ] pages/BookingsPage.tsx
- [ ] pages/MessagesPage.tsx
- [ ] pages/dashboard/ServicesPage.tsx
- [ ] pages/dashboard/UnifiedDashboard.tsx

### HIGH (Week 2)
- [ ] All pages/business/* (8 files)
- [ ] pages/FavoritesPage.tsx
- [ ] pages/DisputesPage.tsx
- [ ] pages/dashboard/* (remaining 5)
- [ ] components/stylist/BookingRequestsList.tsx
- [ ] components/stylist/UpgradeToStylistFlow.tsx
- [ ] components/profile/PaymentMethodsManager.tsx

### MEDIUM (Week 3)
- [ ] All pages/panel/* (11 files)
- [ ] All pages/profile/* (4 files)
- [ ] All components/stylist/* (9 remaining)
- [ ] components/client/BookingManagement.tsx
- [ ] components/EnhancedSignupModal.tsx

### LOWER (Week 4+)
- [ ] Home/landing components (20 files)
- [ ] Informational pages (8 files)
- [ ] UI utility components (15 files)

---

## Testing i18n Implementation

### 1. Language Switching
```typescript
// In browser console or component:
import { useTranslation } from 'react-i18next'

// Change language
i18n.changeLanguage('es-MX')  // Spanish
i18n.changeLanguage('en-US')  // English

// Check current language
console.log(i18n.language)
```

### 2. Missing Translation Keys
If you see the translation key instead of text (e.g., "bookingCalendar.loading"), check:
1. Key exists in `/frontend/public/locales/en-US/common.json`
2. Key exists in `/frontend/public/locales/es-MX/common.json`
3. Component is using correct key path
4. Frontend was rebuilt after adding keys

### 3. Date Localization
```typescript
// date-fns uses the locale based on i18n.language
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

const locale = i18n.language.startsWith('es') ? es : enUS
format(new Date(), 'PPPP', { locale })
// English: "Friday, October 17th, 2025"
// Spanish: "viernes, 17 de octubre de 2025"
```

---

## Automated Implementation Script

Run this to update all booking components at once:

```bash
cd /var/www/beautycita.com/frontend/src/components/booking

# Update BookingCalendar.tsx
sed -i "1s/^/import { useTranslation } from 'react-i18next'\n/" BookingCalendar.tsx
sed -i "4s/enUS/enUS, es/" BookingCalendar.tsx
sed -i "s/'Client'/t('bookingCalendar.client')/g" BookingCalendar.tsx
sed -i "s/'Available'/t('bookingCalendar.available')/g" BookingCalendar.tsx
sed -i "s/'Loading bookings...'/t('bookingCalendar.loading')/g" BookingCalendar.tsx

# (Similar for other files...)

# Rebuild
cd /var/www/beautycita.com/frontend
npm run build
```

---

## Adding New Translation Keys

### 1. Add to English file
```json
// /frontend/public/locales/en-US/common.json
{
  "myNewSection": {
    "title": "My Title",
    "subtitle": "My Subtitle"
  }
}
```

### 2. Add to Spanish file
```json
// /frontend/public/locales/es-MX/common.json
{
  "myNewSection": {
    "title": "Mi Título",
    "subtitle": "Mi Subtítulo"
  }
}
```

### 3. Use in component
```typescript
const { t } = useTranslation()
return <h1>{t('myNewSection.title')}</h1>
```

### 4. Rebuild
```bash
cd /var/www/beautycita.com/frontend
npm run build
```

---

## Translation Key Naming Convention

Follow this pattern for consistency:

```
[section].[component].[element]
```

**Examples:**
- `auth.loginTitle` - Auth section, login page, title element
- `bookingCalendar.loading` - Booking calendar component, loading text
- `dashboard.stylist.stats.totalRevenue` - Dashboard, stylist view, stats section, total revenue label

**Common sections:**
- `common.*` - Buttons, labels, generic UI
- `auth.*` - Authentication/registration
- `nav.*` - Navigation menu items
- `dashboard.*` - Dashboard pages
- `booking.*` - Booking system
- `profile.*` - User profile
- `messages.*` - Success/error messages

---

## Status Dashboard

Run this to check i18n coverage:

```bash
cd /var/www/beautycita.com/frontend/src

# Count files with useTranslation
WITH_I18N=$(grep -rl "useTranslation" . | wc -l)

# Count all component files
TOTAL=$(find . -name "*.tsx" -o -name "*.ts" | wc -l)

# Calculate percentage
echo "i18n Coverage: $WITH_I18N / $TOTAL files"
echo "Percentage: $((WITH_I18N * 100 / TOTAL))%"
```

**Current Status:**
- **With i18n:** 87 files (46%)
- **Without i18n:** 128 files (54%)
- **Target:** 100% (215 files)

---

## Useful Commands

```bash
# Build frontend
cd /var/www/beautycita.com/frontend && npm run build

# Search for hardcoded strings
grep -rn "'[A-Z]" src/components/booking/

# Find files without i18n
grep -rL "useTranslation" src/pages/*.tsx

# Count translation keys
cat public/locales/en-US/common.json | grep -o '".*":' | wc -l
```

---

## Resources

- **i18next Docs:** https://react.i18next.com/
- **date-fns Locales:** https://date-fns.org/docs/I18n
- **Translation Files:**
  - English: `/frontend/public/locales/en-US/common.json`
  - Spanish: `/frontend/public/locales/es-MX/common.json`
- **i18n Config:** `/frontend/src/i18n.ts`

---

**Last Updated:** October 17, 2025
**Build Status:** ✅ Frontend built successfully with 2,016 translation keys
