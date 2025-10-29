# BeautyCita Mobile App - Client Screens

All 35 client-facing screens for the BeautyCita React Native mobile application.

## 📁 Directory Structure

```
src/screens/client/
├── HomeScreen.tsx                    # Dashboard with search, categories, featured stylists
├── SearchMapScreen.tsx               # Map view with stylist pins
├── SearchListScreen.tsx              # List view of stylists with filters
├── FilterSheet.tsx                   # Bottom sheet for filtering stylists
├── SortOptionsSheet.tsx              # Bottom sheet for sort options
├── StylistDetailScreen.tsx           # Stylist profile with tabs
├── StylistPortfolioScreen.tsx        # Gallery of stylist portfolio images
├── StylistReviewsScreen.tsx          # All reviews for a stylist
├── ServiceSelectionScreen.tsx        # Choose service from stylist
├── DateTimePickerScreen.tsx          # Calendar and time slot picker
├── BookingConfirmationScreen.tsx     # Review booking before payment
├── BookingSuccessScreen.tsx          # Confirmation after successful booking
├── PaymentMethodScreen.tsx           # Select payment method
├── AddPaymentMethodScreen.tsx        # Add new card (Stripe CardField)
├── PaymentProcessingScreen.tsx       # Processing payment loader
├── PaymentMethodsScreen.tsx          # Manage saved cards
├── PaymentHistoryScreen.tsx          # Past payments list
├── ReceiptScreen.tsx                 # Payment receipt details
├── MyBookingsScreen.tsx              # Upcoming/past bookings tabs
├── BookingDetailScreen.tsx           # Booking details with actions
├── CancelBookingScreen.tsx           # Cancel booking with reason
├── ChatScreen.tsx                    # Real-time messaging with stylist
├── WriteReviewScreen.tsx             # Star rating and review form
├── MyReviewsScreen.tsx               # Reviews written by user
├── ProfileScreen.tsx                 # User profile menu
├── EditProfileScreen.tsx             # Edit name, photo
├── SettingsScreen.tsx                # App settings, notifications
├── NotificationsScreen.tsx           # Notification center
├── FavoritesStylistsScreen.tsx       # Saved favorite stylists
├── HelpSupportScreen.tsx             # FAQ and contact options
├── ContactSupportScreen.tsx          # Support message form
├── TermsScreen.tsx                   # Terms of Service
├── PrivacyScreen.tsx                 # Privacy Policy
├── AboutScreen.tsx                   # App info, version, credits
├── LocationPickerScreen.tsx          # Map with draggable pin
├── index.ts                          # Export all screens
└── README.md                         # This file
```

---

## 🗺️ Navigation Structure

### React Navigation Stack

```typescript
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import * as ClientScreens from './screens/client';

const Stack = createNativeStackNavigator<ClientStackParamList>();

<Stack.Navigator>
  {/* Dashboard & Search */}
  <Stack.Screen name="Home" component={ClientScreens.HomeScreen} />
  <Stack.Screen name="SearchMap" component={ClientScreens.SearchMapScreen} />
  <Stack.Screen name="SearchList" component={ClientScreens.SearchListScreen} />
  <Stack.Screen name="FilterSheet" component={ClientScreens.FilterSheet} options={{presentation: 'modal'}} />
  <Stack.Screen name="SortOptionsSheet" component={ClientScreens.SortOptionsSheet} options={{presentation: 'modal'}} />

  {/* Stylist Detail */}
  <Stack.Screen name="StylistDetail" component={ClientScreens.StylistDetailScreen} />
  <Stack.Screen name="StylistPortfolio" component={ClientScreens.StylistPortfolioScreen} />
  <Stack.Screen name="StylistReviews" component={ClientScreens.StylistReviewsScreen} />

  {/* Booking Flow */}
  <Stack.Screen name="ServiceSelection" component={ClientScreens.ServiceSelectionScreen} />
  <Stack.Screen name="DateTimePicker" component={ClientScreens.DateTimePickerScreen} />
  <Stack.Screen name="BookingConfirmation" component={ClientScreens.BookingConfirmationScreen} />
  <Stack.Screen name="BookingSuccess" component={ClientScreens.BookingSuccessScreen} />

  {/* Payment */}
  <Stack.Screen name="PaymentMethod" component={ClientScreens.PaymentMethodScreen} />
  <Stack.Screen name="AddPaymentMethod" component={ClientScreens.AddPaymentMethodScreen} />
  <Stack.Screen name="PaymentProcessing" component={ClientScreens.PaymentProcessingScreen} />
  <Stack.Screen name="PaymentMethods" component={ClientScreens.PaymentMethodsScreen} />
  <Stack.Screen name="PaymentHistory" component={ClientScreens.PaymentHistoryScreen} />
  <Stack.Screen name="Receipt" component={ClientScreens.ReceiptScreen} />

  {/* Booking Management */}
  <Stack.Screen name="MyBookings" component={ClientScreens.MyBookingsScreen} />
  <Stack.Screen name="BookingDetail" component={ClientScreens.BookingDetailScreen} />
  <Stack.Screen name="CancelBooking" component={ClientScreens.CancelBookingScreen} />
  <Stack.Screen name="Chat" component={ClientScreens.ChatScreen} />

  {/* Reviews */}
  <Stack.Screen name="WriteReview" component={ClientScreens.WriteReviewScreen} />
  <Stack.Screen name="MyReviews" component={ClientScreens.MyReviewsScreen} />

  {/* Profile & Settings */}
  <Stack.Screen name="Profile" component={ClientScreens.ProfileScreen} />
  <Stack.Screen name="EditProfile" component={ClientScreens.EditProfileScreen} />
  <Stack.Screen name="Settings" component={ClientScreens.SettingsScreen} />
  <Stack.Screen name="Notifications" component={ClientScreens.NotificationsScreen} />
  <Stack.Screen name="FavoritesStylists" component={ClientScreens.FavoritesStylistsScreen} />

  {/* Support & Legal */}
  <Stack.Screen name="HelpSupport" component={ClientScreens.HelpSupportScreen} />
  <Stack.Screen name="ContactSupport" component={ClientScreens.ContactSupportScreen} />
  <Stack.Screen name="Terms" component={ClientScreens.TermsScreen} />
  <Stack.Screen name="Privacy" component={ClientScreens.PrivacyScreen} />
  <Stack.Screen name="About" component={ClientScreens.AboutScreen} />

  {/* Utility */}
  <Stack.Screen name="LocationPicker" component={ClientScreens.LocationPickerScreen} />
</Stack.Navigator>
```

---

## 📋 Screen Navigation Params

```typescript
export type ClientStackParamList = {
  // Dashboard & Search
  Home: undefined;
  SearchMap: {latitude?: number; longitude?: number; radius?: number};
  SearchList: {query?: string; category?: string; latitude?: number; longitude?: number};
  FilterSheet: {onApply?: (filters: any) => void};
  SortOptionsSheet: {currentSort: string; onSelect: (sort: string) => void};

  // Stylist Detail
  StylistDetail: {stylistId: number};
  StylistPortfolio: {stylistId: number};
  StylistReviews: {stylistId: number};

  // Booking Flow
  ServiceSelection: {stylistId: number};
  DateTimePicker: {stylistId: number; serviceId: number; service: Service};
  BookingConfirmation: {
    stylistId: number;
    serviceId: number;
    service: Service;
    date: string;
    time: string;
  };
  BookingSuccess: {bookingId: number};

  // Payment
  PaymentMethod: {onSelect?: (paymentMethodId: string) => void};
  AddPaymentMethod: undefined;
  PaymentProcessing: {
    stylistId: number;
    serviceId: number;
    date: string;
    time: string;
    amount: number;
    paymentMethodId: string;
  };
  PaymentMethods: undefined;
  PaymentHistory: undefined;
  Receipt: {paymentId: number};

  // Booking Management
  MyBookings: undefined;
  BookingDetail: {bookingId: number};
  CancelBooking: {bookingId: number};
  Chat: {bookingId: number};

  // Reviews
  WriteReview: {bookingId: number};
  MyReviews: undefined;

  // Profile & Settings
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
  FavoritesStylists: undefined;

  // Support & Legal
  HelpSupport: undefined;
  ContactSupport: undefined;
  Terms: undefined;
  Privacy: undefined;
  About: undefined;

  // Utility
  LocationPicker: {onSelect?: (coords: {latitude: number; longitude: number}) => void};
};
```

---

## 🎨 Design System Integration

All screens use shared components from `src/components/design-system/`:

- **GradientCard**: Pill-shaped cards with gradient borders
- **PillButton**: Rounded-full buttons (gradient, outline, variants)
- **InputField**: Rounded-2xl text inputs with labels
- **LoadingSpinner**: Pink spinner with consistent styling

### Color Palette

```typescript
Pink: #ec4899 (pink-500)
Purple: #9333ea (purple-600)
Blue: #3b82f6 (blue-500)
Background: #111827 (gray-900)
Cards: #1f2937 (gray-800)
Text: #f3f4f6 (gray-100)
```

---

## 🔗 Screen Flow Diagrams

### Booking Flow
```
Home
  → StylistDetail
    → ServiceSelection
      → DateTimePicker
        → BookingConfirmation
          → PaymentMethod (modal)
            → AddPaymentMethod
          → PaymentProcessing
            → BookingSuccess
```

### Review Flow
```
MyBookings
  → BookingDetail
    → WriteReview
      → MyReviews
```

### Profile Flow
```
Profile
  ├─→ EditProfile
  ├─→ PaymentMethods → AddPaymentMethod
  ├─→ PaymentHistory → Receipt
  ├─→ FavoritesStylists → StylistDetail
  ├─→ MyReviews
  ├─→ Settings
  ├─→ HelpSupport → ContactSupport
  ├─→ Terms
  ├─→ Privacy
  └─→ About
```

---

## 📦 Dependencies Used

```json
{
  "@react-navigation/native": "^6.x",
  "@react-navigation/native-stack": "^6.x",
  "react-native-maps": "^1.x",
  "react-native-calendars": "^1.x",
  "@stripe/stripe-react-native": "^0.x",
  "react-native-heroicons": "^4.x",
  "@react-native-community/geolocation": "^3.x",
  "@react-native-community/slider": "^4.x",
  "socket.io-client": "^4.x",
  "lottie-react-native": "^7.x"
}
```

---

## 🚀 Usage Example

```typescript
// In your navigation setup
import * as ClientScreens from './screens/client';

// Navigate to a screen
navigation.navigate('StylistDetail', {stylistId: 123});

// Navigate with callback
navigation.navigate('FilterSheet', {
  onApply: (filters) => {
    console.log('Filters applied:', filters);
  },
});

// Replace screen (for success/error states)
navigation.replace('BookingSuccess', {bookingId: 456});
```

---

## ✅ Features Implemented

### All Screens Include:
- ✅ Dark mode support (gray-900 background)
- ✅ BeautyCita design system (pink/purple/blue gradient)
- ✅ Rounded-full pill buttons
- ✅ Rounded-3xl gradient cards
- ✅ Rounded-2xl inputs
- ✅ Loading states
- ✅ Error handling with alerts
- ✅ Pull-to-refresh (where applicable)
- ✅ Empty states
- ✅ Responsive layouts
- ✅ TypeScript types
- ✅ Service layer integration

### Advanced Features:
- Real-time chat with Socket.IO
- Interactive maps with pins
- Calendar date picker
- Star rating input
- Payment processing flow
- Location tracking
- Image galleries
- FAQ accordion
- Notification center
- Review system

---

## 🔧 Customization

To customize a screen:

1. Open the screen file in `src/screens/client/`
2. Modify the component as needed
3. Ensure you maintain:
   - BeautyCita design system
   - TypeScript types
   - Error handling
   - Loading states
   - Dark mode compatibility

---

## 📝 Notes

- All screens follow BeautyCita style guide
- Navigation params are typed for safety
- Services are integrated from `src/services/`
- Screens are ready for production use
- Mobile-first responsive design
- WCAG AA accessibility compliance

---

## 🆘 Support

For issues or questions about these screens:
- Check the main project documentation at `/var/www/beautycita.com/CLAUDE.md`
- Review service documentation at `src/services/README.md`
- Contact the development team

---

**Created:** October 29, 2025
**Version:** 1.0.0
**Total Screens:** 35
**Total Lines:** ~5,500+ lines of TypeScript/React Native code
