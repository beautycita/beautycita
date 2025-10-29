# BeautyCita Mobile App - API Services

Complete API service layer for the BeautyCita React Native mobile application.

## 📁 Structure

```
services/
├── apiClient.ts              # Core Axios instance with interceptors
├── authService.ts            # Authentication operations
├── userService.ts            # User profile management
├── bookingService.ts         # Booking operations
├── stylistService.ts         # Stylist operations
├── serviceService.ts         # Beauty service management
├── paymentService.ts         # Stripe payment operations
├── socketService.ts          # Socket.IO real-time communication
├── notificationService.ts    # OneSignal push notifications
├── reviewService.ts          # Review and rating operations
└── index.ts                  # Central exports
```

---

## 🔧 Core Services

### apiClient.ts

**Axios instance configured with:**
- Base URL: `https://beautycita.com/api`
- JWT token authentication (auto-attached from AsyncStorage)
- Request/response interceptors
- Automatic token refresh on 401
- Retry logic with exponential backoff (3 attempts)
- Network error handling
- Request/response logging (dev mode only)

**Exports:**
- `apiClient` - Configured axios instance
- `getAuthToken()` - Get JWT from AsyncStorage
- `setAuthToken(token, refreshToken?)` - Store JWT
- `clearAuthTokens()` - Remove all tokens
- `isAuthenticated()` - Check if user has token

**Usage:**
```typescript
import {apiClient, setAuthToken} from './services';

// All services use this client internally
const response = await apiClient.get('/bookings/my');
```

---

## 🔐 Authentication

### authService.ts

**Methods:**
- `login(credentials)` - Email/password login
- `register(data)` - User registration
- `googleSignIn()` - Google OAuth authentication
- `biometricLogin()` - WebAuthn/biometric login
- `registerBiometric()` - Register device for biometric auth
- `logout()` - Sign out and clear tokens
- `getCurrentUser()` - Get authenticated user data
- `refreshToken()` - Manually refresh JWT
- `isBiometricAvailable()` - Check device capabilities
- `hasBiometricCredentials()` - Check if biometric registered
- `deleteBiometricCredentials()` - Remove biometric auth
- `requestPasswordReset(email)` - Forgot password flow
- `resetPassword(token, newPassword)` - Complete password reset
- `changePassword(current, new)` - Change password
- `verifyEmail(token)` - Confirm email address
- `resendEmailVerification()` - Resend verification email

**Usage:**
```typescript
import {authService} from './services';

// Login
const user = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Biometric login
const user = await authService.biometricLogin();

// Google Sign-In
const user = await authService.googleSignIn();
```

---

## 👤 User Management

### userService.ts

**Methods:**
- `getProfile()` - Get current user profile
- `updateClientProfile(data)` - Update client info
- `updateStylistProfile(data)` - Update stylist info
- `uploadPhoto(uri)` - Upload profile photo
- `pickAndUploadPhoto()` - Pick from gallery and upload
- `getPaymentMethods()` - Get saved payment methods
- `addPaymentMethod(pmId)` - Add new payment method
- `setDefaultPaymentMethod(pmId)` - Set default card
- `deletePaymentMethod(pmId)` - Remove payment method
- `getSmsPreferences()` - Get SMS notification settings
- `updateSmsPreferences(prefs)` - Update SMS settings
- `deleteAccount()` - Delete user account
- `requestDataExport()` - GDPR data export
- `sendPhoneVerification(phone)` - Send SMS code
- `confirmPhoneVerification(phone, code)` - Verify phone
- `updatePhone(phone)` - Change phone number
- `updateEmail(email)` - Change email address

**Usage:**
```typescript
import {userService} from './services';

// Update profile
const user = await userService.updateClientProfile({
  name: 'Jane Doe',
  preferences: {theme: 'dark'}
});

// Upload photo
const photoUrl = await userService.pickAndUploadPhoto();

// SMS preferences
await userService.updateSmsPreferences({
  booking_confirmations: true,
  proximity_alerts: true,
  marketing: false
});
```

---

## 📅 Bookings

### bookingService.ts

**Methods:**
- `createBooking(data)` - Create new booking
- `getMyBookings(status?)` - Get user's bookings
- `getUpcomingBookings()` - Get future bookings
- `getPastBookings()` - Get completed bookings
- `getBookingDetail(id)` - Get booking details
- `updateBookingStatus(id, status)` - Change status
- `cancelBooking(id, reason?)` - Cancel booking
- `confirmBooking(id)` - Confirm (stylist)
- `startBooking(id)` - Mark in progress
- `completeBooking(id)` - Mark completed
- `markNoShow(id)` - Mark as no-show
- `updateLocation(id, coords)` - Update client location
- `startEnRoute(id, coords)` - Start en route tracking
- `stopEnRoute(id)` - Stop tracking
- `getDistanceToStylist(id)` - Get distance/ETA
- `addNotes(id, notes)` - Add booking notes
- `rescheduleBooking(id, date, time)` - Reschedule
- `getBookingStats(period)` - Statistics
- `checkConflicts(stylist, date, time, duration)` - Check availability

**Usage:**
```typescript
import {bookingService} from './services';

// Create booking
const booking = await bookingService.createBooking({
  stylist_id: 123,
  service_id: 456,
  booking_date: '2025-11-01',
  start_time: '14:00',
  notes: 'First time client'
});

// Update location (en route)
await bookingService.updateLocation(booking.id, {
  latitude: 40.7128,
  longitude: -74.0060
});

// Complete booking
await bookingService.completeBooking(booking.id);
```

---

## 💅 Stylists

### stylistService.ts

**Methods:**
- `searchStylists(filters)` - Search with filters
- `getNearbyStylists(lat, lng, radius)` - Find nearby
- `getStylistDetail(id)` - Get stylist profile
- `getStylistAvailability(id, date)` - Get time slots
- `getStylistReviews(id)` - Get reviews
- `getStylistPortfolio(id)` - Get portfolio images
- `uploadPortfolioImage(uri)` - Upload image
- `deletePortfolioImage(url)` - Delete image
- `reorderPortfolioImages(urls)` - Reorder images
- `getDashboard()` - Stylist dashboard data
- `getRevenue(period)` - Revenue analytics
- `setAvailability(schedule)` - Set weekly schedule
- `blockDateTime(date, start, end)` - Block time slot
- `unblockDateTime(blockId)` - Unblock slot
- `getStripeConnectStatus()` - Check Stripe onboarding
- `createStripeConnectAccount()` - Start onboarding
- `getStripeDashboardLink()` - Access Stripe dashboard
- `getFeaturedStylists()` - Get featured
- `getTopRatedStylists(limit)` - Get top-rated

**Usage:**
```typescript
import {stylistService} from './services';

// Search nearby
const stylists = await stylistService.searchStylists({
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 25,
  service_category: 'HAIR',
  min_rating: 4.0
});

// Get availability
const slots = await stylistService.getStylistAvailability(123, '2025-11-01');

// Dashboard (stylist)
const dashboardData = await stylistService.getDashboard();
```

---

## ✂️ Services (Beauty Services)

### serviceService.ts

**Methods:**
- `getMyServices()` - Get stylist's services
- `getStylistServices(stylistId)` - Get services for stylist
- `getServiceDetail(id)` - Get service details
- `createService(data)` - Create new service
- `updateService(id, data)` - Update service
- `deleteService(id)` - Delete service
- `toggleServiceStatus(id, active)` - Enable/disable
- `activateService(id)` - Enable service
- `deactivateService(id)` - Disable service
- `reorderServices(ids)` - Change display order
- `searchByCategory(category, lat?, lng?)` - Search by category
- `getPopularServices(lat, lng, radius)` - Get popular services
- `getCategories()` - Get service categories
- `duplicateService(id)` - Duplicate service
- `getServiceStats(id)` - Service statistics

**Usage:**
```typescript
import {serviceService} from './services';

// Create service (stylist)
const service = await serviceService.createService({
  name: 'Haircut & Style',
  description: 'Professional haircut with styling',
  category: 'HAIR',
  duration_minutes: 60,
  price: 75.00,
  price_type: 'FIXED'
});

// Update service
await serviceService.updateService(service.id, {
  price: 80.00,
  is_active: true
});
```

---

## 💳 Payments

### paymentService.ts

**Methods:**
- `createPaymentIntent(bookingId, amount)` - Create payment
- `confirmPayment(intentId)` - Confirm payment
- `getPaymentHistory()` - Payment history
- `getPaymentDetail(id)` - Payment details
- `requestRefund(id, reason?)` - Full refund
- `requestPartialRefund(id, amount, reason?)` - Partial refund
- `getPaymentStatus(intentId)` - Check status
- `getPaymentMethods()` - Get payment methods
- `addPaymentMethod(pmId)` - Add payment method
- `removePaymentMethod(pmId)` - Remove method
- `setDefaultPaymentMethod(pmId)` - Set default
- `processBookingPayment(bookingId, amount, pmId)` - Helper method
- `getEarningsSummary(period)` - Stylist earnings
- `getPayoutHistory()` - Stylist payouts
- `getPaymentReceipt(id)` - Get receipt URL
- `downloadPaymentReceipt(id)` - Download receipt

**Usage:**
```typescript
import {paymentService} from './services';
import {useStripe} from '@stripe/stripe-react-native';

// Create payment intent
const intent = await paymentService.createPaymentIntent(bookingId, 75.00);

// Use Stripe SDK to confirm (in component)
const {confirmPayment} = useStripe();
const {error} = await confirmPayment(intent.client_secret, {
  paymentMethodType: 'Card',
});

// Get earnings (stylist)
const earnings = await paymentService.getEarningsSummary('month');
```

---

## 🔌 Real-Time Communication

### socketService.ts

**Socket.IO service for real-time events:**

**Methods:**
- `connect(token)` - Connect to server
- `disconnect()` - Disconnect
- `isConnected()` - Check connection status
- `sendMessage(bookingId, message)` - Send chat message
- `joinBookingRoom(bookingId)` - Join booking room
- `leaveBookingRoom(bookingId)` - Leave room
- `updateLocation(bookingId, lat, lng)` - Send location
- `sendTypingIndicator(bookingId, isTyping)` - Typing status
- `on(event, callback)` - Register listener
- `off(event, callback)` - Remove listener
- `removeAllListeners(event?)` - Clear listeners
- `clearCallbacks()` - Clear all callbacks

**Event Listeners:**
- `onMessage(callback)` - New message
- `onBookingUpdate(callback)` - Booking status changed
- `onBookingNew(callback)` - New booking request
- `onBookingConfirmed(callback)` - Booking confirmed
- `onBookingCancelled(callback)` - Booking cancelled
- `onProximityAlert(callback)` - Client en route alert
- `onNotification(callback)` - General notification
- `onConnected(callback)` - Socket connected
- `onDisconnected(callback)` - Socket disconnected
- `onConnectionFailed(callback)` - Connection failed

**Usage:**
```typescript
import {socketService, authService} from './services';

// Connect (after login)
const token = await authService.getAuthToken();
socketService.connect(token);

// Listen for booking updates
socketService.onBookingUpdate((data) => {
  console.log('Booking updated:', data);
});

// Listen for proximity alerts (stylist)
socketService.onProximityAlert((data) => {
  Alert.alert('Client En Route', `${data.eta_minutes} minutes away`);
});

// Send message
socketService.sendMessage(bookingId, 'On my way!');

// Disconnect (on logout)
socketService.disconnect();
```

---

## 🔔 Push Notifications

### notificationService.ts

**OneSignal push notification service:**

**Methods:**
- `initialize(userId?)` - Initialize OneSignal
- `registerDevice(userId)` - Register device
- `unregisterDevice()` - Unregister (logout)
- `getPlayerId()` - Get OneSignal device ID
- `hasPermission()` - Check notification permission
- `requestPermission()` - Request permission
- `sendTag(key, value)` - Set user tag
- `sendTags(tags)` - Set multiple tags
- `deleteTag(key)` - Delete tag
- `getTags()` - Get all tags
- `setLanguage(code)` - Set language
- `setInFocusDisplaying(option)` - In-app alert behavior
- `onNotificationReceived(callback)` - Notification received
- `onNotificationOpened(callback)` - Notification tapped
- `clearCallbacks()` - Clear all callbacks
- `clearNotifications()` - Clear all (iOS)
- `disablePush(disable)` - Enable/disable push
- `postNotification(message, data?, buttons?)` - Send notification
- `setLogLevel(level, visualLevel)` - Debug logging

**Usage:**
```typescript
import {notificationService} from './services';

// Initialize (on app start)
await notificationService.initialize();

// Register device (after login)
await notificationService.registerDevice(user.id.toString());

// Set user tags (for targeting)
await notificationService.sendTags({
  role: 'CLIENT',
  city: 'New York',
  language: 'en'
});

// Listen for notifications
notificationService.onNotificationReceived((notification) => {
  console.log('Notification:', notification);
  // Show in-app alert
});

notificationService.onNotificationOpened((notification) => {
  // Navigate to relevant screen
  if (notification.type === 'BOOKING_REQUEST') {
    navigation.navigate('BookingDetail', {id: notification.data.booking_id});
  }
});

// Unregister (on logout)
await notificationService.unregisterDevice();
```

---

## ⭐ Reviews

### reviewService.ts

**Methods:**
- `createReview(data)` - Create review
- `getStylistReviews(stylistId, page, limit)` - Get reviews
- `getReviewDetail(id)` - Get review
- `getMyReviews()` - Get user's reviews
- `updateReview(id, data)` - Update review
- `deleteReview(id)` - Delete review
- `reportReview(id, reason)` - Report inappropriate
- `canReviewBooking(bookingId)` - Check eligibility
- `getStylistReviewStats(stylistId)` - Get statistics
- `markReviewHelpful(id)` - Mark as helpful
- `unmarkReviewHelpful(id)` - Unmark helpful
- `getFeaturedReviews(limit)` - Get featured reviews

**Usage:**
```typescript
import {reviewService} from './services';

// Create review
const review = await reviewService.createReview({
  booking_id: 123,
  rating: 5,
  comment: 'Amazing service! Highly recommend.'
});

// Get stylist reviews
const {reviews, total, average_rating} =
  await reviewService.getStylistReviews(stylistId, 1, 20);

// Get review stats
const stats = await reviewService.getStylistReviewStats(stylistId);
// Returns: {average_rating, total_reviews, rating_distribution}
```

---

## 📦 Installation & Setup

### 1. Dependencies (already installed)

```json
{
  "axios": "^1.13.1",
  "socket.io-client": "^4.8.1",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-native-google-signin/google-signin": "^16.0.0",
  "@stripe/stripe-react-native": "^0.55.1",
  "react-native-biometrics": "^3.0.1",
  "react-native-image-picker": "^8.2.1",
  "react-native-onesignal": "^5.2.13"
}
```

### 2. Configuration

Update service configuration constants:

**authService.ts:**
```typescript
GoogleSignin.configure({
  webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
  offlineAccess: true,
});
```

**notificationService.ts:**
```typescript
const ONESIGNAL_APP_ID = 'YOUR_ONESIGNAL_APP_ID';
```

### 3. Usage in Components

```typescript
import React, {useEffect} from 'react';
import {
  authService,
  socketService,
  notificationService,
  bookingService
} from './services';

export default function App() {
  useEffect(() => {
    // Initialize services
    initializeServices();

    return () => {
      // Cleanup
      socketService.disconnect();
      notificationService.clearCallbacks();
    };
  }, []);

  const initializeServices = async () => {
    // Check if authenticated
    const user = await authService.getCurrentUser();

    if (user) {
      // Connect socket
      socketService.connect(await authService.getAuthToken());

      // Initialize notifications
      await notificationService.initialize(user.id.toString());
      await notificationService.registerDevice(user.id.toString());

      // Setup listeners
      socketService.onBookingUpdate((data) => {
        console.log('Booking updated:', data);
      });

      notificationService.onNotificationReceived((notification) => {
        console.log('Notification:', notification);
      });
    }
  };

  return (
    // Your app UI
  );
}
```

---

## 🔒 Security Features

- **JWT Authentication**: Auto-attached to all requests
- **Token Refresh**: Automatic refresh on 401 errors
- **Secure Storage**: Tokens stored in AsyncStorage
- **Request Retry**: Exponential backoff for network errors
- **Error Handling**: Standardized error objects
- **HTTPS Only**: All requests to https://beautycita.com/api

---

## 🐛 Error Handling

All services use consistent error handling:

```typescript
try {
  const user = await authService.login(credentials);
} catch (error: any) {
  if (error.status === 401) {
    console.error('Invalid credentials');
  } else if (error.code === 'NETWORK_ERROR') {
    console.error('No internet connection');
  } else {
    console.error('Error:', error.message);
  }
}
```

**Error Object Structure:**
```typescript
{
  message: string;      // Human-readable error message
  status?: number;      // HTTP status code (if applicable)
  code?: string;        // Error code (e.g., 'NETWORK_ERROR')
  errors?: Record<string, string[]>; // Validation errors
}
```

---

## 📝 TypeScript Types

All types are defined in `../types/index.ts` and exported from services:

```typescript
import {
  User,
  Booking,
  Stylist,
  Service,
  Payment,
  Review,
  // ... etc
} from './services';
```

---

## 🧪 Testing

Example test setup:

```typescript
import {authService} from './services';
import MockAdapter from 'axios-mock-adapter';
import {apiClient} from './services';

describe('authService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should login successfully', async () => {
    mock.onPost('/auth/login').reply(200, {
      user: {id: 1, email: 'test@example.com'},
      token: 'jwt-token'
    });

    const user = await authService.login({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(user.email).toBe('test@example.com');
  });
});
```

---

## 📚 Additional Resources

- **Backend API Docs**: https://beautycita.com/api/docs (if available)
- **Stripe Documentation**: https://stripe.com/docs/mobile
- **OneSignal Documentation**: https://documentation.onesignal.com/docs/react-native-sdk-setup
- **Socket.IO Client**: https://socket.io/docs/v4/client-api/

---

## 🆘 Troubleshooting

### Issue: "Network Error" or timeout

**Solution:**
- Check internet connection
- Verify API_BASE_URL is correct: `https://beautycita.com/api`
- Check if backend is running

### Issue: Token refresh loop

**Solution:**
- Clear AsyncStorage tokens
- Logout and login again
- Check backend `/auth/refresh` endpoint

### Issue: Socket not connecting

**Solution:**
- Verify JWT token is valid
- Check backend WebSocket support
- Ensure Socket.IO versions match (client/server)

### Issue: Push notifications not working

**Solution:**
- Check OneSignal App ID is correct
- Verify device has notification permission
- Test with OneSignal dashboard
- Check device registration status

---

**Created:** October 29, 2025
**Last Updated:** October 29, 2025
**Version:** 1.0.0
