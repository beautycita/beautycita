# Build Instructions for BeautyCita Mobile v1.2.0

This guide explains how to build production-ready APK and IPA files for distribution.

---

## 📋 Prerequisites

### Development Environment
- **Node.js:** 18.x or higher
- **npm:** 9.x or higher
- **React Native CLI:** `npm install -g react-native-cli`
- **Android Studio:** Latest version (for Android builds)
- **Xcode:** 14.0+ (for iOS builds, macOS only)
- **CocoaPods:** `sudo gem install cocoapods` (for iOS)

### Signing Credentials

**Android:**
- Release keystore file: `beautycita-release.keystore`
- Keystore password
- Key alias and password

**iOS:**
- Apple Developer Account
- Code signing certificates
- Provisioning profiles

---

## 🤖 Android Build (APK)

### Step 1: Generate Release Keystore (First Time Only)

```bash
cd /var/www/beautycita.com/mobile-native/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore beautycita-release.keystore \
  -alias beautycita -keyalg RSA -keysize 2048 -validity 10000

# Enter passwords when prompted and save them securely
```

### Step 2: Configure Gradle Properties

Create or edit `~/.gradle/gradle.properties`:

```properties
BEAUTYCITA_RELEASE_STORE_PASSWORD=your_keystore_password
BEAUTYCITA_RELEASE_KEY_ALIAS=beautycita
BEAUTYCITA_RELEASE_KEY_PASSWORD=your_key_password
```

### Step 3: Update build.gradle

Edit `android/app/build.gradle` and uncomment the release signing config:

```gradle
signingConfigs {
    release {
        storeFile file('beautycita-release.keystore')
        storePassword BEAUTYCITA_RELEASE_STORE_PASSWORD
        keyAlias BEAUTYCITA_RELEASE_KEY_ALIAS
        keyPassword BEAUTYCITA_RELEASE_KEY_PASSWORD
    }
}
```

### Step 4: Build Release APK

```bash
cd /var/www/beautycita.com/mobile-native

# Clean previous builds
cd android
./gradlew clean
cd ..

# Build release APK
cd android
./gradlew assembleRelease
cd ..
```

**Output Location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

### Step 5: Rename and Copy to Downloads

```bash
# Rename APK
cp android/app/build/outputs/apk/release/app-release.apk \
   /var/www/beautycita.com/frontend/public/downloads/mobile-native/BeautyCita-v1.2.0.apk

# Verify size
ls -lh /var/www/beautycita.com/frontend/public/downloads/mobile-native/BeautyCita-v1.2.0.apk
```

---

## 🍎 iOS Build (IPA)

### Step 1: Install CocoaPods Dependencies

```bash
cd /var/www/beautycita.com/mobile-native/ios
pod install
cd ..
```

### Step 2: Open Xcode Workspace

```bash
open ios/BeautyCitaNative.xcworkspace
```

### Step 3: Configure Signing in Xcode

1. Select the project in the navigator (blue icon)
2. Select target "BeautyCitaNative"
3. Go to "Signing & Capabilities" tab
4. Select your development team
5. Ensure "Automatically manage signing" is checked
6. Verify bundle identifier: `com.beautycita.mobile`

### Step 4: Select Build Target

- Click the device selector dropdown (top left in Xcode)
- Select: **"Any iOS Device (arm64)"**

### Step 5: Archive the App

1. In Xcode menu: **Product → Archive**
2. Wait for archive to complete (2-5 minutes)
3. Archives window will open automatically

### Step 6: Export IPA

1. Click **"Distribute App"** button
2. Choose distribution method:
   - **Development:** For testing on registered devices
   - **Ad Hoc:** For TestFlight beta testing
   - **App Store:** For App Store submission
3. Select "Export" to save IPA locally
4. Choose destination folder
5. Click "Export"

### Step 7: Copy to Downloads

```bash
# Copy exported IPA
cp ~/Desktop/BeautyCita.ipa \
   /var/www/beautycita.com/frontend/public/downloads/mobile-native/BeautyCita-v1.2.0.ipa

# Verify size
ls -lh /var/www/beautycita.com/frontend/public/downloads/mobile-native/BeautyCita-v1.2.0.ipa
```

---

## 🔐 Build for Production (Signed Releases)

### Android (Google Play Store)

Instead of APK, build an Android App Bundle (AAB):

```bash
cd android
./gradlew bundleRelease
cd ..

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

Upload the AAB to Google Play Console.

### iOS (App Store)

Use Xcode's "Distribute App" → "App Store Connect" option to upload directly to App Store Connect.

---

## 📦 File Checklist Before Distribution

### Android APK
- [ ] Signed with release keystore
- [ ] ProGuard enabled (minified)
- [ ] Version code incremented
- [ ] Version name updated to 1.2.0
- [ ] File size ~45 MB
- [ ] Tested on physical device
- [ ] No debug logs in production

### iOS IPA
- [ ] Signed with distribution certificate
- [ ] Correct provisioning profile
- [ ] Version updated to 1.2.0
- [ ] Build number incremented
- [ ] File size ~38 MB
- [ ] Tested on physical device
- [ ] No debug symbols exposed

---

## 🧪 Testing Before Release

### Android Testing

```bash
# Install on connected device
adb install /var/www/beautycita.com/frontend/public/downloads/mobile-native/BeautyCita-v1.2.0.apk

# Check logs
adb logcat | grep BeautyCita
```

### iOS Testing

1. In Xcode: Select your device → Run (⌘R)
2. Or use TestFlight for beta distribution
3. Monitor crash reports in Xcode Organizer

### Critical Tests

- [ ] Login with email/password
- [ ] Biometric authentication (Face ID/Touch ID/Fingerprint)
- [ ] Google OAuth login
- [ ] SMS verification
- [ ] Map view and location services
- [ ] Camera and photo library access
- [ ] Real-time chat
- [ ] Push notifications
- [ ] Payment flow (Stripe)
- [ ] Booking creation and management
- [ ] Dark mode toggle

---

## 🚀 Deployment Workflow

### 1. Build Both Platforms

```bash
# Android
cd /var/www/beautycita.com/mobile-native/android
./gradlew assembleRelease
cd ../..

# iOS (in Xcode)
# Product → Archive → Distribute App → Export
```

### 2. Copy to Downloads

```bash
# Android
cp android/app/build/outputs/apk/release/app-release.apk \
   /var/www/beautycita.com/frontend/public/downloads/mobile-native/BeautyCita-v1.2.0.apk

# iOS (manually copy from export location)
cp ~/Desktop/BeautyCita.ipa \
   /var/www/beautycita.com/frontend/public/downloads/mobile-native/BeautyCita-v1.2.0.ipa
```

### 3. Update Web Frontend

The downloads page has already been updated with v1.2.0 entries.

### 4. Rebuild Frontend (if needed)

```bash
cd /var/www/beautycita.com/frontend
sudo -u www-data npm run build
```

### 5. Restart Backend (if API changes)

```bash
cd /var/www/beautycita.com
sudo -u www-data pm2 restart beautycita-api
```

---

## 📊 Build Verification

### Check Android APK

```bash
# Get APK info
aapt dump badging /var/www/beautycita.com/frontend/public/downloads/mobile-native/BeautyCita-v1.2.0.apk | grep -E "version|package"

# Should show:
# package: name='com.beautycita.mobile' versionCode='2' versionName='1.2.0'
```

### Check iOS IPA

```bash
# Unzip IPA
unzip -l BeautyCita-v1.2.0.ipa | head -20

# Check Info.plist
unzip -p BeautyCita-v1.2.0.ipa Payload/BeautyCita.app/Info.plist | grep -A1 "CFBundleShortVersionString"
# Should show 1.2.0
```

---

## 🐛 Troubleshooting

### Android Build Fails

```bash
# Clear caches
cd android
./gradlew clean
rm -rf build/
rm -rf app/build/
cd ..

# Reinstall dependencies
rm -rf node_modules
npm install

# Try again
cd android && ./gradlew assembleRelease && cd ..
```

### iOS Build Fails

```bash
# Clean build folder in Xcode
# Product → Clean Build Folder (Shift+Cmd+K)

# Reinstall pods
cd ios
pod deintegrate
pod cache clean --all
pod install
cd ..

# Try again in Xcode
```

### Signing Issues (iOS)

1. Open Xcode → Preferences → Accounts
2. Verify Apple ID is signed in
3. Download provisioning profiles
4. In project settings: Try toggling "Automatically manage signing" off and on
5. Ensure certificate is valid (not expired)

---

## 📝 Quick Reference

```bash
# Android release build
cd /var/www/beautycita.com/mobile-native/android
./gradlew assembleRelease

# Output
android/app/build/outputs/apk/release/app-release.apk

# iOS release build
open ios/BeautyCitaNative.xcworkspace
# Xcode → Product → Archive → Distribute App

# Copy to downloads
cp android/app/build/outputs/apk/release/app-release.apk \
   /var/www/beautycita.com/frontend/public/downloads/mobile-native/BeautyCita-v1.2.0.apk

cp ~/exported/BeautyCita.ipa \
   /var/www/beautycita.com/frontend/public/downloads/mobile-native/BeautyCita-v1.2.0.ipa
```

---

## ✅ Pre-Release Checklist

- [ ] Version updated in all files (package.json, build.gradle, Xcode)
- [ ] Release notes created and published
- [ ] Both APK and IPA built successfully
- [ ] Files copied to downloads directory
- [ ] Files tested on physical devices
- [ ] Downloads page updated
- [ ] App Store/Play Store metadata ready
- [ ] Screenshots prepared
- [ ] Privacy policy and terms updated

---

**Ready to build!** Follow these steps carefully and test thoroughly before releasing to users.
