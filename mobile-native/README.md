# BeautyCita Mobile App

**Version:** 1.2.0
**Platform:** iOS & Android
**Framework:** React Native 0.82.1 + TypeScript
**Status:** Production Ready 🚀

---

## 📱 Overview

BeautyCita Mobile is the native mobile companion to the BeautyCita web platform, connecting clients with professional beauty service providers. Built with React Native, it delivers a native app experience with smooth performance, offline capabilities, and deep mobile integrations.

### Key Features

- **🔐 Multi-Method Authentication:** Email/password, biometric (Face ID, Touch ID, fingerprint), Google OAuth, SMS verification
- **📍 Location-Based Discovery:** Find stylists near you with integrated maps and real-time geolocation
- **📅 Real-Time Booking:** Instant appointment scheduling with live availability
- **💬 Live Chat:** Real-time messaging between clients and stylists powered by Socket.IO
- **📸 Portfolio Management:** Camera integration for stylists to showcase their work
- **💳 Secure Payments:** Native Stripe integration with Apple Pay and Google Pay support
- **🔔 Push Notifications:** OneSignal-powered notifications for bookings, reminders, and messages
- **🌙 Dark Mode:** Full dark mode support throughout the app
- **🌍 Bilingual:** English and Spanish support (i18n ready)

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React Native 0.82.1 |
| **Language** | TypeScript 5.x |
| **Navigation** | React Navigation v6 (Native Stack + Bottom Tabs) |
| **State Management** | React Context API + Hooks |
| **Networking** | Axios 1.7.7 |
| **Real-time** | Socket.IO Client 4.8.1 |
| **Push Notifications** | React Native OneSignal 5.2.10 |
| **Maps** | React Native Maps 1.18.1 (Google Maps) |
| **Payments** | @stripe/stripe-react-native 0.41.3 |
| **Camera/Gallery** | React Native Image Picker 7.1.3 |
| **Storage** | @react-native-async-storage/async-storage 2.1.0 |
| **Biometrics** | React Native Biometrics 3.0.1 |

### Project Structure

```
mobile-native/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── design-system/   # Core design system components
│   │   ├── MapView.tsx      # Google Maps component
│   │   └── ImagePicker.tsx  # Camera/gallery picker
│   ├── navigation/          # Navigation configuration (6 stacks)
│   ├── screens/             # Screen components (40 screens)
│   │   ├── auth/            # 6 auth screens
│   │   ├── client/          # 7 client screens
│   │   ├── stylist/         # 5 stylist screens
│   │   ├── admin/           # 8 admin screens
│   │   ├── profile/         # 7 profile screens
│   │   └── public/          # 7 public screens
│   ├── services/            # Business logic & API clients
│   ├── theme/               # Design tokens (colors, typography, spacing)
│   └── types/               # TypeScript types
├── android/                 # Android native code
└── ios/                     # iOS native code
```

### Navigation Architecture

```
RootNavigator (checks authentication)
│
├─ PublicStack (non-authenticated users)
├─ ClientApp (authenticated clients - 5 bottom tabs)
├─ StylistApp (authenticated stylists - 5 bottom tabs)
└─ AdminApp (authenticated admins - 6 bottom tabs)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** 18.x or higher
- **React Native CLI:** `npm install -g react-native-cli`
- **Xcode:** 14.0+ (for iOS, macOS only)
- **Android Studio:** Latest with Android SDK 24+
- **CocoaPods:** `sudo gem install cocoapods` (for iOS)

### Installation

```bash
# Navigate to project
cd /var/www/beautycita.com/mobile-native

# Install dependencies
npm install

# iOS only: Install pods
cd ios && pod install && cd ..
```

### Configuration

Create `.env` file:

```bash
API_URL=https://beautycita.com/api
WS_URL=https://beautycita.com
ONESIGNAL_APP_ID=your_onesignal_app_id
GOOGLE_MAPS_API_KEY=your_google_maps_key
STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

See platform-specific guides:
- **Android:** `android/ANDROID_ICONS_GUIDE.md`
- **iOS:** `ios/IOS_SETUP_GUIDE.md`

---

## 🏃 Running the App

### Development Mode

**iOS:**
```bash
npm run ios
# or specific simulator:
npm run ios -- --simulator="iPhone 15 Pro"
```

**Android:**
```bash
npm run android
```

**Start Metro:**
```bash
npm start
```

### Physical Device

**iOS:**
1. Open `ios/BeautyCitaNative.xcworkspace` in Xcode
2. Connect iPhone via USB
3. Select device and click Run (⌘R)

**Android:**
1. Enable USB Debugging on device
2. Connect via USB
3. Run: `npm run android`

---

## 🎨 Design System

### Brand Colors

```typescript
const colors = {
  pink500: '#ec4899',    // Primary
  purple600: '#9333ea',  // Secondary
  blue500: '#3b82f6',    // Accent
  // Grayscale gray50-gray900
  // Semantic: success, error, warning, info
};
```

### Typography

- **Headings:** Playfair Display (serif)
- **Body:** Inter (sans-serif)
- **Sizes:** xs(12) → 4xl(36)

### Components

- **PillButton:** Rounded-full buttons with gradients
- **GradientCard:** Cards with pink-purple overlays
- **Input:** Rounded-2xl with focus rings
- **Touch Targets:** Minimum 48×48px (accessibility)

---

## 🔌 Native Integrations

### Authentication (Biometrics)
```typescript
import { authService } from './services/auth/authService';
await authService.loginWithBiometric();
```

### Maps & Location
```typescript
import { locationService } from './services/locationService';
const location = await locationService.getCurrentLocation();
const distance = locationService.calculateDistance(from, to);
```

### Camera & Gallery
```typescript
import { imagePickerService } from './services/imagePickerService';
const photo = await imagePickerService.takePhoto();
const photos = await imagePickerService.selectMultiplePhotos(10);
```

### Real-Time Chat
```typescript
import { socketService } from './services/socketService';
socketService.connect(userId, token);
socketService.sendMessage(conversationId, receiverId, message);
```

### Push Notifications
```typescript
import { notificationService } from './services/notificationService';
notificationService.initialize();
await notificationService.setUser(userId);
```

### Payments (Stripe)
```typescript
import { initPaymentSheet } from '@stripe/stripe-react-native';
await initPaymentSheet({ merchantDisplayName: 'BeautyCita', ... });
```

---

## 🏗️ Build & Release

### Android Release

```bash
# Generate signing key
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore beautycita-release.keystore \
  -alias beautycita -keyalg RSA -keysize 2048 -validity 10000

# Build APK
cd android && ./gradlew assembleRelease

# Build AAB (for Google Play)
cd android && ./gradlew bundleRelease
```

Output:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS Release

```bash
open ios/BeautyCitaNative.xcworkspace
```

1. Select "Any iOS Device (arm64)"
2. Product → Archive
3. Distribute App → App Store Connect

### Version Management

**Android:** `android/app/build.gradle`
```gradle
versionCode 2
versionName "1.0.1"
```

**iOS:** Xcode → General Tab
- Version: 1.0.1
- Build: 2

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual Testing Checklist

**Authentication:**
- [ ] Email/password login
- [ ] Biometric login (Face ID/Touch ID/Fingerprint)
- [ ] Google OAuth
- [ ] SMS verification
- [ ] Password reset

**Client Flow:**
- [ ] Search stylists (with map)
- [ ] View profiles & portfolios
- [ ] Book appointment
- [ ] Make payment (Apple/Google Pay)
- [ ] Chat with stylist
- [ ] Cancel booking
- [ ] Leave review

**Stylist Flow:**
- [ ] View dashboard
- [ ] Manage services
- [ ] Upload portfolio
- [ ] Accept/decline bookings
- [ ] Chat with clients

**Permissions:**
- [ ] Camera access
- [ ] Photo library access
- [ ] Location access
- [ ] Push notifications
- [ ] Biometric authentication

---

## 🐛 Troubleshooting

### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

### iOS Build Fails
```bash
cd ios
pod deintegrate && pod cache clean --all && pod install
cd ..
```

### Android Build Fails
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

### App Not Updating
```bash
# Clear caches
npm start -- --reset-cache
cd android && ./gradlew clean && cd ..
# iOS: Xcode → Product → Clean Build Folder (Shift+Cmd+K)
```

---

## 📚 Documentation

- **Android Setup:** `android/ANDROID_ICONS_GUIDE.md`
- **iOS Setup:** `ios/IOS_SETUP_GUIDE.md`
- **API Docs:** `/var/www/beautycita.com/backend/API_DOCS.md`
- **Web App:** `/var/www/beautycita.com/frontend/README.md`
- **Project Guide:** `/var/www/beautycita.com/CLAUDE.md`

---

## 🎯 Roadmap

### v1.1.0 (Q2 2025)
- Offline mode
- Advanced search filters
- Favorite stylists
- Booking history export

### v1.2.0 (Q3 2025)
- Video consultations
- In-app wallet
- Referral system
- Multi-language (ES, FR)

### v2.0.0 (Q4 2025)
- AI-powered recommendations
- AR virtual try-on
- Subscription plans
- Advanced analytics

---

## 📞 Support

**Email:** support@beautycita.com
**Phone:** +52 322 142 9800
**Web:** https://beautycita.com

---

## Quick Reference

```bash
# Install
npm install
cd ios && pod install && cd ..

# Run
npm run ios                    # iOS simulator
npm run android                # Android emulator

# Build Release
cd android && ./gradlew assembleRelease    # Android APK
cd android && ./gradlew bundleRelease      # Android AAB
# iOS: Xcode → Product → Archive

# Clear Cache
npm start -- --reset-cache
cd android && ./gradlew clean
cd ios && pod deintegrate && pod install
```

---

**Last Updated:** October 2025
**Status:** ✅ Production Ready

🚀 **Ready to build the future of beauty services!**
