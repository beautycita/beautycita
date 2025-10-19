# Google Play Data Safety Form Guide for BeautyCita v1.1

**Last Updated:** October 14, 2025
**App Version:** 1.1 (Version Code 3)

---

## SECTION 1: Does your app collect or share any of the required user data types?

**Answer: YES** ✓

BeautyCita collects and shares user data to provide core functionality, improve services, and comply with legal requirements.

---

## SECTION 2: Data Collection & Sharing Details

### 📍 LOCATION

#### **Approximate location**
- **Collected:** YES ✓
- **Shared:** YES (with Google Maps API)
- **Purpose:**
  - App functionality (find nearby stylists, service areas)
  - Analytics
- **Required or Optional:** Optional (users can deny)
- **Ephemeral:** NO
- **User can request deletion:** YES

#### **Precise location**
- **Collected:** YES ✓
- **Shared:** YES (with Google Maps API)
- **Purpose:**
  - App functionality (GPS-based stylist search, service location tracking)
  - Analytics
- **Required or Optional:** Optional (users can deny)
- **Ephemeral:** NO
- **User can request deletion:** YES

---

### 👤 PERSONAL INFO

#### **Name**
- **Collected:** YES ✓
- **Shared:** YES (visible to other users in bookings, shared with payment processors)
- **Purpose:**
  - App functionality (user profiles, bookings, communication)
  - Account management
- **Required or Optional:** Required
- **Ephemeral:** NO
- **User can request deletion:** YES

#### **Email address**
- **Collected:** YES ✓
- **Shared:** YES (with email service provider for notifications)
- **Purpose:**
  - App functionality (account creation, communication)
  - Account management
  - Fraud prevention, security, and compliance
- **Required or Optional:** Required
- **Ephemeral:** NO
- **User can request deletion:** YES (account deletion required)

#### **User IDs**
- **Collected:** YES ✓
- **Shared:** YES (with analytics, payment processors)
- **Purpose:**
  - App functionality (user identification)
  - Analytics
  - Account management
- **Required or Optional:** Required
- **Ephemeral:** NO
- **User can request deletion:** YES (account deletion required)

#### **Address**
- **Collected:** YES ✓ (service addresses for stylists)
- **Shared:** YES (shown to clients who book services)
- **Purpose:**
  - App functionality (service location for mobile/home services)
- **Required or Optional:** Optional (only for stylists offering mobile services)
- **Ephemeral:** NO
- **User can request deletion:** YES

#### **Phone number**
- **Collected:** YES ✓
- **Shared:** YES (with SMS provider Twilio, visible to booking parties)
- **Purpose:**
  - App functionality (SMS notifications, booking confirmations, contact)
  - Fraud prevention, security, and compliance
- **Required or Optional:** Required
- **Ephemeral:** NO
- **User can request deletion:** YES (account deletion required)

#### **Other info** (Username, Date of Birth, Bio)
- **Collected:** YES ✓
- **Shared:** YES (username and bio visible on public profiles)
- **Purpose:**
  - App functionality (user profiles, identity)
  - Personalization
- **Required or Optional:**
  - Username: Required
  - Date of Birth: Optional
  - Bio: Optional
- **Ephemeral:** NO
- **User can request deletion:** YES

---

### 💳 FINANCIAL INFO

#### **User payment info**
- **Collected:** YES ✓
- **Shared:** YES (with Stripe payment processor, tokenized only)
- **Purpose:**
  - App functionality (payment processing for services)
- **Required or Optional:** Required (for clients making bookings)
- **Ephemeral:** NO
- **User can request deletion:** YES

#### **Purchase history**
- **Collected:** YES ✓
- **Shared:** YES (with payment processors for refunds/disputes)
- **Purpose:**
  - App functionality (booking history, invoices)
  - Analytics (business insights)
  - Fraud prevention, security, and compliance
- **Required or Optional:** Required (for clients making bookings)
- **Ephemeral:** NO
- **User can request deletion:** Partial (anonymized after 7 years for legal compliance)

#### **Credit score**
- **Collected:** NO
- **Shared:** NO

#### **Other financial info** (Bitcoin wallet addresses, payout info)
- **Collected:** YES ✓ (optional for stylists who want Bitcoin payments)
- **Shared:** YES (with BTCPay Server for cryptocurrency processing)
- **Purpose:**
  - App functionality (alternative payment method)
- **Required or Optional:** Optional
- **Ephemeral:** NO
- **User can request deletion:** YES

---

### 💬 MESSAGES

#### **Emails**
- **Collected:** YES ✓
- **Shared:** NO (stored on our servers only)
- **Purpose:**
  - App functionality (email correspondence, support tickets)
  - Fraud prevention, security, and compliance
- **Required or Optional:** Optional
- **Ephemeral:** NO
- **User can request deletion:** YES

#### **SMS or MMS**
- **Collected:** YES ✓ (logs of sent SMS notifications)
- **Shared:** YES (via Twilio SMS service)
- **Purpose:**
  - App functionality (booking confirmations, reminders, notifications)
- **Required or Optional:** Optional (users can disable SMS notifications)
- **Ephemeral:** NO
- **User can request deletion:** YES

#### **Other in-app messages** (Chat messages)
- **Collected:** YES ✓
- **Shared:** NO (only between users within the app)
- **Purpose:**
  - App functionality (client-stylist communication)
  - Fraud prevention, security, and compliance
- **Required or Optional:** Optional
- **Ephemeral:** NO
- **User can request deletion:** YES

---

### 📷 PHOTOS AND VIDEOS

#### **Photos**
- **Collected:** YES ✓
- **Shared:** YES (profile pictures and portfolio images are public)
- **Purpose:**
  - App functionality (user profiles, stylist portfolios, service showcases)
- **Required or Optional:** Optional
- **Ephemeral:** NO
- **User can request deletion:** YES

#### **Videos**
- **Collected:** NO (not currently implemented)
- **Shared:** NO

---

### 🎵 AUDIO FILES

#### **Voice or sound recordings**
- **Collected:** NO
- **Shared:** NO

#### **Music files**
- **Collected:** NO
- **Shared:** NO

#### **Other audio files**
- **Collected:** NO
- **Shared:** NO

---

### 📁 FILES AND DOCS

#### **Files and docs**
- **Collected:** YES ✓ (stylist certifications, licenses)
- **Shared:** NO (reviewed internally only)
- **Purpose:**
  - App functionality (stylist verification)
  - Fraud prevention, security, and compliance
- **Required or Optional:** Required (for stylist verification)
- **Ephemeral:** NO
- **User can request deletion:** NO (retained for legal compliance)

---

### 📅 CALENDAR

#### **Calendar events**
- **Collected:** NO
- **Shared:** NO

---

### 📞 CONTACTS

#### **Contacts**
- **Collected:** NO
- **Shared:** NO

---

### 🏃 APP ACTIVITY

#### **App interactions**
- **Collected:** YES ✓
- **Shared:** YES (with Google Analytics)
- **Purpose:**
  - Analytics (understand feature usage, improve UX)
  - App functionality (recommendations, personalization)
- **Required or Optional:** Required
- **Ephemeral:** NO
- **User can request deletion:** YES

#### **In-app search history**
- **Collected:** YES ✓
- **Shared:** NO (stored locally and on our servers)
- **Purpose:**
  - App functionality (search results, recommendations)
  - Analytics
- **Required or Optional:** Required
- **Ephemeral:** NO
- **User can request deletion:** YES

#### **Installed apps**
- **Collected:** NO
- **Shared:** NO

#### **Other user-generated content** (Reviews, ratings, AI chat history)
- **Collected:** YES ✓
- **Shared:** YES (reviews/ratings are public)
- **Purpose:**
  - App functionality (reviews visible to other users)
  - Analytics (quality control)
  - Fraud prevention, security, and compliance
- **Required or Optional:** Optional
- **Ephemeral:** NO (AI chat history retained 1 year)
- **User can request deletion:** YES

#### **Other actions** (Favorites, bookmarks)
- **Collected:** YES ✓
- **Shared:** NO
- **Purpose:**
  - App functionality (saved stylists, favorite services)
  - Personalization
- **Required or Optional:** Optional
- **Ephemeral:** NO
- **User can request deletion:** YES

---

### 🌐 WEB BROWSING

#### **Web browsing history**
- **Collected:** NO
- **Shared:** NO

---

### 🩺 APP INFO AND PERFORMANCE

#### **Crash logs**
- **Collected:** YES ✓
- **Shared:** YES (via Google Play Console with mapping file)
- **Purpose:**
  - Analytics (app stability)
  - App functionality (bug fixes)
- **Required or Optional:** Required
- **Ephemeral:** NO
- **User can request deletion:** NO (automatically deleted after 90 days)

#### **Diagnostics**
- **Collected:** YES ✓
- **Shared:** YES (with Google Analytics)
- **Purpose:**
  - Analytics (performance monitoring)
  - App functionality (debugging)
- **Required or Optional:** Required
- **Ephemeral:** NO
- **User can request deletion:** YES

#### **Other app performance data**
- **Collected:** YES ✓
- **Shared:** YES (with Google Analytics)
- **Purpose:**
  - Analytics (app performance metrics, load times)
- **Required or Optional:** Required
- **Ephemeral:** NO
- **User can request deletion:** YES

---

### 📱 DEVICE OR OTHER IDs

#### **Device or other IDs**
- **Collected:** YES ✓ (Android ID, device identifiers for sessions)
- **Shared:** YES (with Google Analytics, Firebase if used)
- **Purpose:**
  - Analytics (unique users, session tracking)
  - Fraud prevention, security, and compliance (device fingerprinting)
- **Required or Optional:** Required
- **Ephemeral:** NO
- **User can request deletion:** Partial (some IDs are required for fraud prevention)

---

## SECTION 3: Data Security

### Is all of the user data collected by your app encrypted in transit?
**Answer: YES** ✓

All data transmitted between the app and servers uses HTTPS/TLS encryption.

### Do you provide a way for users to request that their data is deleted?
**Answer: YES** ✓

Users can:
1. Delete their account from the app: Settings → Danger Zone → Delete Account
   - Direct URL: `https://beautycita.com/settings?category=danger`
2. Email privacy@beautycita.com to request data deletion
3. Response time: Immediate (in-app), 1 business day (for email requests)

---

## SECTION 4: Data Usage and Handling

### Data retention and deletion
Most data is deleted within 30 days of account deletion, except:
- **Financial records:** Retained 7 years (legal requirement)
- **AI conversation history:** Retained 1 year
- **Location data:** Deleted after 24 hours
- **Crash logs:** Auto-deleted after 90 days by Google Play

### Data encryption
- **In transit:** YES (HTTPS/TLS)
- **At rest:** YES (encrypted database, encrypted file storage)

---

## SECTION 5: Third-Party Services

Your app shares data with the following third parties:

1. **Google Analytics** (Analytics ID: G-TD6W79YRLJ)
   - Data shared: Device IDs, app interactions, location, demographics
   - Purpose: Analytics

2. **Stripe** (Payment processing)
   - Data shared: Name, email, payment info (tokenized)
   - Purpose: Payment processing

3. **Twilio** (SMS service)
   - Data shared: Phone numbers, SMS content
   - Purpose: Notifications, booking confirmations

4. **Google Maps API** (Map services)
   - Data shared: Location data
   - Purpose: Map display, location search

5. **BTCPay Server** (Cryptocurrency payments)
   - Data shared: Bitcoin wallet addresses, transaction data
   - Purpose: Alternative payment processing

6. **Google OAuth** (Authentication)
   - Data shared: Email, name, profile picture
   - Purpose: Social login

---

## Quick Checklist for Form Completion

✓ App collects and shares user data: **YES**
✓ Location (approximate and precise): **YES** - Optional, deletable
✓ Personal info (name, email, phone, username): **YES** - Required for core functionality
✓ Financial info (payment cards, purchase history): **YES** - Required for payments
✓ Messages (SMS logs, in-app chat, emails): **YES** - Optional/Required
✓ Photos (profile pics, portfolios): **YES** - Optional, deletable
✓ Files (certifications): **YES** - Required for stylists
✓ App activity (interactions, search, reviews): **YES** - Required/Optional
✓ App performance (crash logs, diagnostics): **YES** - Required
✓ Device IDs: **YES** - Required for analytics/fraud prevention

✓ All data encrypted in transit: **YES**
✓ Users can request deletion: **YES** (via app or email)

✓ Data shared with: Google Analytics, Stripe, Twilio, Google Maps, BTCPay, Google OAuth

---

## Important Notes

1. **Be Transparent:** Google reviews data safety declarations carefully. Undeclared data collection can result in app removal.

2. **Third-Party SDKs:** We use Google Analytics - this must be disclosed even though you're not directly collecting the data.

3. **Mapping File:** You've already included the deobfuscation mapping file, which helps Google analyze crash reports (already disclosed above).

4. **Privacy Policy Link:** Make sure your privacy policy URL is set to: `https://beautycita.com/privacy/play-store`

5. **Updates:** If you add new features that collect additional data types, you MUST update the Data Safety form before releasing the update.

---

## Contact for Review
If Google requests additional information during review, respond to:
- **Email:** privacy@beautycita.com
- **Response time:** 1 business day

---

## For Google Play Reviewers

**Data Deletion URL (for verification):**
```
https://beautycita.com/settings?category=danger
```

This URL allows direct access to the account deletion feature in our app, making it easy for reviewers to verify that users can delete their accounts and data as stated in this Data Safety declaration.

---

**Ready to Submit:** Use this guide to fill out the Data Safety questionnaire in Google Play Console accurately. ✓
