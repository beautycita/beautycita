# Build iOS IPA Locally

This guide explains how to build the iOS app on your Mac.

## ✅ Prerequisites

- **macOS**: Monterey (12.0) or later
- **Xcode**: 14.0 or later (from Mac App Store)
- **Node.js**: 20.x or later
- **CocoaPods**: Installed (`sudo gem install cocoapods`)
- **Apple Developer Account**: Required for signing

## 🚀 Quick Build

```bash
# 1. Navigate to frontend directory
cd /var/www/beautycita.com/frontend

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Build web assets
npm run build

# 4. Sync to iOS
npx cap sync ios

# 5. Open in Xcode
npx cap open ios

# 6. In Xcode:
#    - Select "Any iOS Device (arm64)" as target
#    - Product → Archive
#    - Distribute App → Save for Ad Hoc Deployment
#    - Export
```

## 📋 Detailed Steps

### Step 1: Build Web Assets

```bash
cd /var/www/beautycita.com/frontend
npm run build
```

**Expected output:**
```
✓ built in 15.45s
PWA v1.1.0
```

### Step 2: Sync Capacitor

```bash
npx cap sync ios
```

This copies web assets to iOS project and updates native plugins.

### Step 3: Open Xcode

```bash
npx cap open ios
```

Or manually:
```bash
open ios/App/App.xcworkspace
```

**⚠️ Important**: Always open `.xcworkspace`, NOT `.xcodeproj`

### Step 4: Configure Signing

1. Select **App** target in Xcode
2. Go to **Signing & Capabilities** tab
3. Check **"Automatically manage signing"**
4. Select your **Team** (Apple Developer account)
5. Xcode will create/download provisioning profiles

### Step 5: Update Version (if needed)

In Xcode:
- Select **App** target
- **General** tab
- **Version**: `1.0.4`
- **Build**: `6`

Or via command line:
```bash
cd ios/App
xcrun agvtool new-marketing-version 1.0.4
xcrun agvtool new-version -all 6
```

### Step 6: Archive Build

1. Select target: **Any iOS Device (arm64)**
2. Menu: **Product → Archive**
3. Wait 5-10 minutes for build
4. Archives window opens automatically

### Step 7: Export IPA

In Archives window:
1. Select the archive
2. Click **"Distribute App"**
3. Choose distribution method:
   - **Ad Hoc**: For testing (up to 100 devices)
   - **Development**: For your devices only
   - **App Store**: For submission to Apple
4. Follow wizard and click **Export**
5. Choose save location

Result: `beautycita-v1.0.4.ipa` file

## 🔧 Build Methods

### Method 1: Xcode GUI (Recommended)

Easiest method, shown above.

### Method 2: Command Line (xcodebuild)

```bash
cd /var/www/beautycita.com/frontend/ios/App

# Archive
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive

# Export
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist
```

### Method 3: Fastlane (Advanced)

```bash
# Install Fastlane
sudo gem install fastlane

cd /var/www/beautycita.com/frontend/ios

# Create Fastfile (see IOS_BUILD_GUIDE.md)
# Then run:
fastlane build
```

## 📱 Install on Device

### Via Xcode (Easiest)

1. Connect iPhone/iPad
2. Select your device in Xcode
3. Click **Run** (▶️)
4. App installs and launches

### Via Finder (macOS Catalina+)

1. Connect device
2. Open **Finder**
3. Select device in sidebar
4. Drag IPA to device window

### Via Apple Configurator 2

1. Download from Mac App Store
2. Connect device
3. Drag IPA to device

## 🐛 Common Issues

### "Code signing failed"

**Solution:**
- Ensure you're logged into Xcode with Apple ID
- Go to Xcode → Settings → Accounts → Add account
- Select your team in Signing & Capabilities

### "No provisioning profile found"

**Solution:**
- Enable "Automatically manage signing"
- Or manually create profile at developer.apple.com

### "Build input file cannot be found"

**Solution:**
```bash
cd ios/App
pod deintegrate
pod install
```

### "Swift Compiler Error"

**Solution:**
- Clean build: Shift+Cmd+K
- Clean build folder: Shift+Cmd+Option+K
- Rebuild

### App crashes on launch

**Solution:**
- Check Console app for crash logs
- Verify all Capacitor plugins are installed:
  ```bash
  npx cap sync ios
  cd ios/App && pod install
  ```

## 📊 Build Size

Expected IPA size: **~150 MB**

Breakdown:
- Web assets: ~20 MB
- Native frameworks: ~100 MB
- Capacitor plugins: ~20 MB
- App binary: ~10 MB

## 🎯 Quick Commands

```bash
# Full rebuild from scratch
cd /var/www/beautycita.com/frontend
rm -rf ios/App/Pods ios/App/Podfile.lock
npm run build
npx cap sync ios
cd ios/App && pod install
npx cap open ios

# Update version
cd ios/App
xcrun agvtool new-marketing-version 1.0.4
xcrun agvtool new-version -all 6

# Clean Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

## 🔍 Verify Build

After exporting IPA:

```bash
# Check IPA contents
unzip -l beautycita-v1.0.4.ipa

# Verify code signature
codesign -dvvv beautycita-v1.0.4.ipa

# Extract and check Info.plist
unzip beautycita-v1.0.4.ipa "Payload/*.app/Info.plist"
plutil -p Payload/BeautyCita.app/Info.plist | grep Version
```

Expected:
```
"CFBundleShortVersionString" => "1.0.4"
"CFBundleVersion" => "6"
```

## 📤 Upload to TestFlight

### Via Xcode

1. In Archive window: **Distribute App**
2. Select **App Store Connect**
3. Click **Upload**
4. Wait for processing (~5-15 minutes)
5. Check App Store Connect → TestFlight

### Via Command Line

```bash
# Install Transporter CLI
xcode-select --install

# Upload
xcrun altool --upload-app \
  -f beautycita-v1.0.4.ipa \
  -u your@apple.id \
  -p app-specific-password
```

## 🎓 Learning Resources

- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [App Distribution Guide](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)

## 📞 Support

If build fails:
1. Check build logs in Xcode
2. Clean and rebuild
3. Update CocoaPods: `pod repo update`
4. Check [GitHub Issues](https://github.com/beautycita/beautycita/issues)

---

**Last Updated:** October 28, 2025
**Version:** 1.0.4 (Build 6)
**Platform:** iOS 14.0+
