# BeautyCita iOS v1.0.4 Release Notes

**Release Date:** October 28, 2025
**Version:** 1.0.4 (Build 6)
**Platform:** iOS 14.0+

---

## 🎉 What's New

### ⭐ Favorite Stylists
- **Save Your Favorites:** Easily save your favorite stylists for quick access later
- **Quick Booking:** Book appointments faster with your favorite stylists
- **Smart Recommendations:** Get personalized recommendations based on your favorites
- **Sync Across Devices:** Your favorites are saved to your account and available everywhere

### 📱 SMS Notification Preferences
- **Full Control:** Customize exactly which notifications you want to receive
- **Privacy First:** GDPR-compliant notification consent management
- **Granular Settings:** Control preferences for:
  - Booking requests and confirmations
  - Proximity alerts (when you're en route)
  - Payment notifications
  - Appointment reminders
  - Cancellation notices
  - Marketing messages
- **Easy Access:** Manage preferences from your profile settings

---

## ✨ Complete Feature Set

With this release, BeautyCita now includes all 18 core platform features:

### For Clients
1. ✅ Biometric authentication (Touch ID, Face ID)
2. ✅ Location-based stylist discovery
3. ✅ Advanced search and filters
4. ✅ Real-time booking calendar
5. ✅ Favorite stylists management
6. ✅ Complete booking history
7. ✅ SMS notification preferences
8. ✅ Video consultations
9. ✅ En route tracking with proximity alerts

### For Stylists
10. ✅ Multi-step onboarding wizard
11. ✅ Phone verification with SMS
12. ✅ Stripe Connect payment integration
13. ✅ Portfolio management (Cloudflare R2)
14. ✅ Service catalog management
15. ✅ Booking calendar with Syncfusion
16. ✅ Revenue dashboard
17. ✅ Client communication system
18. ✅ Email notifications

---

## 🔧 Improvements

### Performance
- Optimized build size: 151MB (includes all features and assets)
- Faster app startup with improved asset loading
- Enhanced WebAuthn biometric authentication flow

### Security
- Updated security protocols for SMS verification
- Enhanced JWT token management
- Improved API rate limiting

### UI/UX
- Consistent dark mode support across all new features
- Smooth animations and transitions
- Mobile-first responsive design
- WCAG AA accessibility compliance

---

## 🐛 Bug Fixes

- Fixed location picker mobile touch events
- Resolved SMS notification delivery issues
- Improved biometric authentication reliability
- Fixed booking calendar date picker on mobile
- Corrected timezone handling for appointments

---

## 📦 Technical Details

- **Bundle ID:** com.beautycita.app
- **Version:** 1.0.4
- **Build Number:** 6
- **Minimum iOS:** 14.0
- **Supported Devices:** iPhone, iPad, iPod touch
- **Size:** ~150 MB
- **Architecture:** arm64

### Included Capacitor Plugins
- @aparajita/capacitor-biometric-auth@9.0.0
- @capacitor/app@7.1.0
- @capacitor/preferences@7.0.2
- @capacitor/splash-screen@7.0.3
- @capacitor/status-bar@7.0.3

---

## 🚀 Getting Started

### Installation Options

#### TestFlight (Beta - Recommended)
1. Install TestFlight app from App Store
2. Use invitation link (request from team)
3. Install BeautyCita beta
4. Provide feedback directly in TestFlight

#### Direct Install (Coming Soon)
- IPA file for ad-hoc distribution
- Requires Apple Developer certificate
- See BUILD_IOS_LOCALLY.md for instructions

#### App Store (Coming Soon)
- Currently in review process
- Expected approval: 1-2 weeks
- Will be available worldwide

### First Launch
1. Open BeautyCita
2. Allow location permissions
3. Create account with phone verification
4. Set up Face ID / Touch ID
5. Browse stylists and book appointments!

---

## 🔮 Coming Soon

- Push notifications (in-app alerts)
- Gift card system
- Loyalty points program
- Referral rewards
- Multi-language support expansion
- iOS version

---

## 📞 Support

- **Website:** https://beautycita.com
- **Email:** support@beautycita.com
- **API Status:** https://beautycita.com/api/health

---

## 🙏 Thank You

Thank you to our beta testers and early adopters for your valuable feedback. This release represents a major milestone with all core features now complete and ready for production use.

---

**Previous Versions:**
- v1.0.3 (Build 5) - October 26, 2025
- v1.0.2 (Build 4) - October 20, 2025
- v1.0.1 (Build 3) - October 15, 2025
- v1.0.0 (Build 2) - October 10, 2025
