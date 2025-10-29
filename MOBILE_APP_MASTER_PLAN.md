# BeautyCita Mobile App - Complete Implementation Plan

**Created:** 2025-10-29
**Status:** ACTIVE DEVELOPMENT
**Goal:** Production-ready native Android/iOS app with full webapp feature parity

---

## ULTRATHINK ANALYSIS - BeautyCita Platform

### Core Business Model
- **Platform:** Beauty services marketplace (stylists ↔ clients)
- **Revenue:** Commission on bookings + stylist subscription tiers
- **Markets:** Mexico (primary), United States
- **Target Users:** 
  - Clients: Women 18-30, mobile-first, social media natives
  - Stylists: Beauty professionals seeking client growth

### Complete Feature Inventory (from webapp)

#### 1. AUTHENTICATION & ONBOARDING
**Webapp Features:**
- Email/password login (bcrypt)
- Google OAuth
- WebAuthn/Passkeys (Touch ID, Face ID, Windows Hello)
- Phone verification via Twilio SMS
- Password reset flow
- Role-based access (CLIENT, STYLIST, ADMIN, SUPERADMIN)

**Mobile Implementation:**
- ✅ Biometric auth (react-native-biometrics) - PRIORITY 1
- ✅ Google Sign-In (@react-native-google-signin/google-signin)
- ✅ SMS verification (Twilio backend already configured)
- Phone number input with Mexico/US auto-detection
- Session management with AsyncStorage
- JWT token refresh

**API Requirements:**
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/google
- POST /api/auth/refresh-token
- POST /api/sms/send-verification
- POST /api/sms/verify-code

#### 2. USER PROFILES

**Client Profile:**
- Name, email, phone
- Profile photo (upload to Cloudflare R2)
- Service preferences
- Favorite stylists
- Booking history
- Payment methods (Stripe)
- SMS notification preferences

**Stylist Profile:**
- Business name, bio
- Profile photo + portfolio (up to 6 images)
- Location (lat/long via Google Maps)
- Service area radius
- Services offered (name, price, duration, category)
- Availability schedule (recurring weekly + exceptions)
- Stripe Connect account
- Reviews/ratings
- Revenue dashboard

**Mobile Implementation:**
- ✅ Image picker (react-native-image-picker)
- ✅ Location picker (react-native-maps + @react-native-community/geolocation)
- Profile edit forms
- Portfolio gallery with swipe
- Camera integration for instant uploads

**API Requirements:**
- GET /api/users/me
- PUT /api/users/me
- POST /api/users/upload-photo
- GET /api/stylists/:id
- PUT /api/stylists/me
- POST /api/stylists/portfolio/upload
- DELETE /api/stylists/portfolio/:id
- PUT /api/stylists/portfolio/reorder

#### 3. SERVICE DISCOVERY & SEARCH

**Webapp Features:**
- Location-based search (map view + list view)
- Filter by:
  - Service type (haircut, color, nails, makeup, etc.)
  - Price range
  - Distance
  - Rating
  - Availability (date/time)
- Sort by: distance, rating, price, newest
- Stylist detail pages with portfolio

**Mobile Implementation:**
- Interactive map with stylist pins (react-native-maps)
- Swipeable stylist cards
- Filter bottom sheet
- Pull-to-refresh
- Infinite scroll
- "Near me" geolocation button

**API Requirements:**
- GET /api/stylists/search?lat=&lng=&radius=&category=&minPrice=&maxPrice=&sortBy=
- GET /api/services/categories
- GET /api/stylists/:id/availability?date=

#### 4. BOOKING SYSTEM

**Webapp Features:**
- Calendar view (Syncfusion Scheduler)
- Select service, date, time
- Real-time availability
- Booking confirmation
- Booking management (upcoming, past, cancelled)
- Status: pending, confirmed, in-progress, completed, cancelled
- Client can cancel (24hr notice)
- Stylist can accept/reject

**Mobile Implementation:**
- Native date/time pickers
- Calendar widget for availability
- Booking confirmation screen
- Push notifications for status changes (OneSignal)
- In-app booking list with status badges

**API Requirements:**
- POST /api/bookings/create
- GET /api/bookings/mine
- GET /api/bookings/:id
- PUT /api/bookings/:id/status
- DELETE /api/bookings/:id

#### 5. PAYMENTS

**Webapp Features:**
- Stripe Connect for stylists
- Client payment methods (card via Stripe)
- Booking payments (hold on booking, capture on completion)
- Automatic stylist payout (minus platform commission)
- Dispute management
- Payment history

**Mobile Implementation:**
- ✅ Stripe SDK (@stripe/stripe-react-native)
- Card input with native UI
- Apple Pay / Google Pay integration
- Payment method management
- Receipt viewing

**API Requirements:**
- POST /api/stripe-connect/create-account
- GET /api/stripe-connect/status
- POST /api/payments/create-intent
- POST /api/payments/confirm
- GET /api/payments/history

#### 6. REAL-TIME FEATURES

**Webapp Features:**
- In-app chat (Socket.io)
- Proximity alerts (client en route)
- Booking status updates
- New booking notifications

**Mobile Implementation:**
- ✅ Socket.io client (socket.io-client)
- ✅ Push notifications (react-native-onesignal)
- Real-time chat UI
- Background location updates for proximity
- Notification badges

**API Requirements:**
- WebSocket: wss://beautycita.com/socket.io
- POST /api/notifications/register-device
- GET /api/messages/:bookingId
- POST /api/messages/send

#### 7. REVIEWS & RATINGS

**Webapp Features:**
- 5-star rating system
- Written reviews
- Review photos
- Stylist response to reviews
- Verified bookings only

**Mobile Implementation:**
- Star rating input
- Review submission form
- Photo attachment from gallery
- Review list with infinite scroll

**API Requirements:**
- POST /api/reviews/create
- GET /api/reviews/stylist/:id
- PUT /api/reviews/:id/respond

#### 8. STYLIST DASHBOARD

**Webapp Features:**
- Today's bookings
- Upcoming schedule (calendar view)
- Revenue stats (day/week/month/year)
- Client management
- Service management (add/edit/delete)
- Availability management
- Payout history

**Mobile Implementation:**
- Dashboard home with cards
- Calendar view for schedule
- Revenue charts (simple bar/line charts)
- Quick actions (accept booking, message client)
- Service CRUD
- Availability toggle switches

**API Requirements:**
- GET /api/stylists/dashboard
- GET /api/stylists/revenue?period=
- GET /api/stylists/bookings/upcoming
- POST /api/services/create
- PUT /api/services/:id
- DELETE /api/services/:id

---

## DESIGN SYSTEM (BeautyCita Style)

### Brand Colors
```javascript
// From frontend/src/theme/colors.ts
primary: {
  pink: '#ec4899',      // pink-500
  purple: '#9333ea',    // purple-600
  blue: '#3b82f6',      // blue-500
}

gradient: 'linear-gradient(to right, #ec4899, #9333ea, #3b82f6)'

dark: {
  background: '#111827',  // gray-900
  card: '#1f2937',        // gray-800
  text: '#f3f4f6',        // gray-100
  textSecondary: '#d1d5db', // gray-300
}
```

### Typography
- **Headings:** Playfair Display (serif)
- **Body:** Inter (sans-serif)
- **Sizes:** 
  - H1: 32-40px
  - H2: 24-32px
  - H3: 20-24px
  - Body: 16px
  - Small: 14px

### Components
- **Buttons:** Pill-shaped (rounded-full), gradient backgrounds
- **Cards:** Rounded corners (24px), glass-morphism effects
- **Inputs:** Rounded (16px), focus ring pink-500
- **Touch Targets:** Minimum 48x48px (WCAG AA)

### Mobile-Specific UX
- Bottom tab navigation (Home, Search, Bookings, Profile)
- Swipe gestures (dismiss modals, navigate cards)
- Pull-to-refresh
- Haptic feedback on actions
- Native pickers for date/time
- Bottom sheets for filters/options
- FAB for quick actions

---

## MOBILE APP ARCHITECTURE

### Tech Stack
```json
{
  "framework": "React Native 0.82.1",
  "language": "TypeScript",
  "navigation": "@react-navigation/native",
  "state": "React Context + AsyncStorage",
  "networking": "axios",
  "realtime": "socket.io-client",
  "payments": "@stripe/stripe-react-native",
  "maps": "react-native-maps",
  "auth": "react-native-biometrics + @react-native-google-signin/google-signin",
  "notifications": "react-native-onesignal",
  "images": "react-native-image-picker",
  "location": "@react-native-community/geolocation",
  "storage": "@react-native-async-storage/async-storage"
}
```

### Screen Structure (82 screens)

#### Authentication Flow (8 screens)
1. Splash Screen
2. Welcome/Onboarding (3 slides)
3. Login
4. Register (role selection)
5. Phone Verification
6. Biometric Setup
7. Google Sign-In
8. Password Reset

#### Client Flow (35 screens)
1. Home Dashboard
2. Search Map
3. Search List
4. Stylist Detail
5. Stylist Portfolio
6. Service Selection
7. Date/Time Picker
8. Booking Confirmation
9. Payment Method
10. Payment Processing
11. Booking Success
12. My Bookings (tabs: upcoming, past)
13. Booking Detail
14. Cancel Booking
15. Chat with Stylist
16. Write Review
17. My Reviews
18. Favorite Stylists
19. Notifications
20. Profile
21. Edit Profile
22. Payment Methods
23. Add Payment Method
24. Payment History
25. Settings
26. Help/Support
27. Terms of Service
28. Privacy Policy
29. About
30. Location Picker
31. Filter Services
32. Sort Options
33. Stylist Reviews
34. Booking Receipt
35. Contact Support

#### Stylist Flow (35 screens)
1. Dashboard Home
2. Today's Schedule
3. Calendar View
4. Booking Requests
5. Accept/Reject Booking
6. Booking Detail (stylist view)
7. Mark Booking Complete
8. Chat with Client
9. My Services
10. Add Service
11. Edit Service
12. Service Categories
13. Pricing Calculator
14. Availability Settings
15. Set Weekly Hours
16. Block Dates
17. My Reviews
18. Respond to Review
19. Revenue Dashboard
20. Revenue Chart (day/week/month)
21. Payout History
22. Stripe Connect Setup
23. Stripe Dashboard
24. My Portfolio
25. Add Portfolio Photo
26. Edit Portfolio
27. Profile
28. Edit Profile
29. Business Settings
30. Service Area Map
31. Client Management
32. Client Detail
33. Client History
34. Notifications
35. Settings

#### Admin Flow (4 screens)
1. Admin Dashboard
2. User Management
3. Dispute Resolution
4. Platform Analytics

---

## API INTEGRATION REQUIREMENTS

### Base Configuration
```typescript
// API Base URL
const API_URL = 'https://beautycita.com/api';

// Headers
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  'X-Device-Type': 'mobile',
  'X-App-Version': '1.2.0',
  'X-Platform': Platform.OS // 'ios' or 'android'
}
```

### Authentication Tokens
- JWT stored in AsyncStorage
- Auto-refresh on 401 responses
- Secure storage for sensitive data

### Error Handling
- Network errors → offline mode
- 401 → refresh token → logout
- 500 → retry with exponential backoff
- User-friendly error messages

---

## THIRD-PARTY SERVICE KEYS

### Required API Keys

#### 1. Google Services
**Maps API:**
- Current Key: `AIzaSyCsy8MrU8leZ1HonRBL40s804jW91Xb5Nc`
- Restrictions: HTTP referrers (beautycita.com)
- **Mobile Requirement:** NEW Android/iOS API keys with app signature restrictions
- Cost: $200/month free tier, then $7/1000 requests

**Sign-In OAuth:**
- Current: Web OAuth client
- **Mobile Requirement:** NEW OAuth client IDs for Android + iOS
- Steps:
  1. Google Cloud Console → APIs & Services → Credentials
  2. Create Android OAuth client (SHA-1 fingerprint)
  3. Create iOS OAuth client (Bundle ID)
  4. Add to google-services.json (Android) and GoogleService-Info.plist (iOS)

#### 2. Stripe
**Current Keys (Test Mode):**
- Publishable: `pk_test_*`
- Secret: `sk_test_*`

**Mobile Implementation:**
- Same keys work for mobile SDK
- Stripe Connect already configured
- No new keys needed

#### 3. Twilio SMS
**Current:**
- Account SID: `ACfe65a7cd9e2f4f468544c56824e9cdd6`
- Auth Token: `e3d1649e3db535ad1d0347af1c25c231`
- Verify Service SID: `VA63c4df7faf87e1e38b7b772a28c74e20`

**Mobile:**
- Backend integration only (no client-side keys)
- No changes needed

#### 4. OneSignal Push Notifications
**Current:** Not configured
**Mobile Requirement:**
- Create OneSignal app (free tier: 10k notifications/month)
- Get App ID
- Configure Firebase Cloud Messaging (Android)
- Configure Apple Push Notification Service (iOS)
- Add google-services.json (Android)
- Add GoogleService-Info.plist (iOS)

#### 5. Cloudflare R2 (Image Storage)
**Current:**
- Account ID: `e61486f47c2fe5a12fdce43b7a318343`
- Access Key: `ca3c10c25e5a6389797d8b47368626d4`
- Bucket: `beautycita-medias`

**Mobile:**
- Backend upload (no client keys needed)
- No changes required

---

## MOBILE-SPECIFIC CONSIDERATIONS

### 1. Performance
- Image optimization (compress before upload)
- Lazy loading for lists
- Pagination (20 items per page)
- Cache API responses (AsyncStorage)
- Debounce search inputs

### 2. Offline Support
- Cache user profile
- Cache favorite stylists
- Queue failed API requests
- Show offline indicator
- Sync when online

### 3. Push Notifications
- Booking status changes
- New messages
- Proximity alerts
- Payment confirmations
- Review requests

### 4. Deep Linking
- Share stylist profiles: `beautycita://stylist/:id`
- Share bookings: `beautycita://booking/:id`
- Handle SMS verification links

### 5. Security
- Certificate pinning
- Biometric authentication timeout (5 min)
- Secure token storage
- No sensitive data in logs

### 6. Analytics
- Track screen views
- Track user actions (search, book, pay)
- Crash reporting
- Performance monitoring

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- [x] Project setup with React Native 0.82.1
- [x] Design system components (Button, Card, Input, etc.)
- [x] Theme configuration (colors, typography)
- [x] Navigation structure (tab + stack navigators)
- [ ] API service layer with axios
- [ ] Authentication context
- [ ] AsyncStorage persistence

### Phase 2: Authentication (Week 1-2)
- [ ] Login/Register screens
- [ ] Phone verification flow
- [ ] Biometric authentication
- [ ] Google Sign-In integration
- [ ] Token management
- [ ] Role-based routing

### Phase 3: Client Features (Week 2-3)
- [ ] Home dashboard
- [ ] Search with map
- [ ] Stylist detail + portfolio
- [ ] Service selection
- [ ] Booking flow
- [ ] Payment integration
- [ ] My Bookings

### Phase 4: Stylist Features (Week 3-4)
- [ ] Stylist dashboard
- [ ] Service management
- [ ] Availability settings
- [ ] Booking management
- [ ] Revenue dashboard
- [ ] Stripe Connect setup

### Phase 5: Real-Time (Week 4)
- [ ] Socket.io integration
- [ ] Chat implementation
- [ ] Push notifications (OneSignal)
- [ ] Proximity tracking

### Phase 6: Polish (Week 5)
- [ ] Reviews & ratings
- [ ] Profile management
- [ ] Settings & preferences
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states

### Phase 7: Testing & Deployment (Week 6)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests with Detox
- [ ] Android APK build
- [ ] iOS IPA build
- [ ] Beta testing (TestFlight/Firebase App Distribution)

---

## BUILD CONFIGURATION

### Android
```gradle
// android/app/build.gradle
android {
  compileSdkVersion 34
  buildToolsVersion "34.0.0"
  
  defaultConfig {
    applicationId "com.beautycita.mobile"
    minSdkVersion 24
    targetSdkVersion 34
    versionCode 2
    versionName "1.2.0"
  }
  
  signingConfigs {
    release {
      // Keystore configuration
    }
  }
}
```

### iOS
```ruby
# ios/Podfile
platform :ios, '13.0'
use_frameworks!

target 'BeautyCita' do
  # React Native pods
  # Third-party pods
end
```

### Required Android Permissions
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

---

## SUCCESS METRICS

### Technical
- App size: < 50MB
- Startup time: < 2 seconds
- API response time: < 500ms (p95)
- Crash-free rate: > 99.5%
- Frame rate: 60 FPS

### Business
- Downloads: 10k in first month
- DAU/MAU ratio: > 30%
- Booking completion rate: > 80%
- User retention (7-day): > 40%
- Average session duration: > 5 minutes

---

## NEXT STEPS (IMMEDIATE)

1. **Save this plan** ✅
2. **Launch specialized agents:**
   - Agent 1: Implement authentication + onboarding (8 screens)
   - Agent 2: Build client booking flow (20 screens)
   - Agent 3: Build stylist dashboard (20 screens)
   - Agent 4: Implement real-time features (chat, notifications)
3. **Configure Google Services:**
   - Create Android OAuth client
   - Create iOS OAuth client
   - Generate SHA-1 fingerprints
4. **Configure OneSignal:**
   - Create app
   - Set up Firebase (Android)
   - Set up APNS (iOS)
5. **Build & test:**
   - Complete APK with all features
   - Test on real devices
   - Deploy to R2 bucket

---

**End of Master Plan**
**Status:** Ready for agent-based parallel implementation
**ETA:** 6 weeks to production-ready app
