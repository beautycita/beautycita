# BeautyCita iOS App - Build Instructions

## 📦 Build Package Ready!

**Package:** `BeautyCita-iOS-v1.3-Build5-20251021.tar.gz` (664 MB)
**Location:** `http://74.208.218.18/BeautyCita-iOS-v1.3-Build5-20251021.tar.gz`
**Version:** 1.3 (Build 5)
**Date:** October 21, 2025

---

## ✨ What's Included in v1.3

### New Features
- 🗓️ **Ultimate Booking Calendar** - Month/week/time views with availability heatmap
- 💖 **Enhanced Onboarding** - 4-step wizard with service interests + confetti
- 📧 **Email Notifications** - 11 email types with beautiful templates (backend)
- 💫 **Smooth Animations** - Framer Motion throughout the app
- 🎨 **Modern UI** - Gradient designs, glassmorphism effects

### iOS Project Details
- **Bundle ID:** `com.beautycita.app`
- **Marketing Version:** 1.3
- **Build Number:** 5
- **Capacitor Plugins:** 5 plugins synced
  - @aparajita/capacitor-biometric-auth@9.0.0
  - @capacitor/app@7.1.0
  - @capacitor/preferences@7.0.2
  - @capacitor/splash-screen@7.0.3
  - @capacitor/status-bar@7.0.3

---

## 🍎 Requirements

### macOS Requirements
- **macOS:** 13.0 (Ventura) or later
- **Xcode:** 15.0 or later
- **iOS SDK:** iOS 17.0 or later
- **CocoaPods:** Latest version
- **Apple Developer Account:** Required for distribution

### Download Xcode
```bash
# Option 1: App Store (recommended)
open -a "App Store" "macappstore://apps.apple.com/app/xcode/id497799835"

# Option 2: Direct download
# Visit https://developer.apple.com/download/all/
# Download Xcode 15.x or later
```

### Install CocoaPods
```bash
sudo gem install cocoapods
pod setup
```

---

## 📥 Step 1: Download Build Package

### From Production Server
```bash
# Download to your macOS machine
cd ~/Desktop
curl -O http://74.208.218.18/BeautyCita-iOS-v1.3-Build5-20251021.tar.gz

# Or using wget
wget http://74.208.218.18/BeautyCita-iOS-v1.3-Build5-20251021.tar.gz
```

### Extract Package
```bash
tar -xzf BeautyCita-iOS-v1.3-Build5-20251021.tar.gz
cd ios/App
```

**Package Contents:**
```
ios/
├── App/
│   ├── App/                     # iOS app source
│   │   ├── public/             # Web assets (664 MB)
│   │   ├── capacitor.config.json
│   │   ├── Info.plist
│   │   └── ...
│   ├── App.xcodeproj/          # Xcode project
│   ├── App.xcworkspace/        # Workspace (use this!)
│   └── Podfile                 # CocoaPods dependencies
└── ...
```

---

## 🔨 Step 2: Install Dependencies

### Install CocoaPods Dependencies
```bash
cd ~/Desktop/ios/App
pod install
```

**Expected output:**
```
Analyzing dependencies
Downloading dependencies
Installing Capacitor (7.1.0)
Installing CapacitorBiometricAuth (9.0.0)
...
Pod installation complete! 10 pods installed
```

**⚠️ Important:** Always use `App.xcworkspace`, NOT `App.xcodeproj` after running `pod install`!

---

## 🚀 Step 3: Open in Xcode

```bash
open App.xcworkspace
```

**Or double-click:** `App.xcworkspace` in Finder

---

## ⚙️ Step 4: Configure Signing

### 1. Select Project in Navigator
- Click "App" in the left sidebar (blue icon)

### 2. Select Target
- Select "App" target (under TARGETS)

### 3. Go to Signing & Capabilities Tab
- Click "Signing & Capabilities" at the top

### 4. Configure Automatic Signing
- ✅ Check "Automatically manage signing"
- **Team:** Select your Apple Developer team
- **Bundle Identifier:** `com.beautycita.app` (already set)

### 5. Verify Provisioning Profile
- Should say "Xcode Managed Profile"
- Status should be green checkmark ✅

**Signing Configuration:**
```
Bundle Identifier: com.beautycita.app
Team: [Your Team Name]
Provisioning Profile: Xcode Managed Profile
Signing Certificate: Apple Development / Distribution
```

---

## 🏗️ Step 5: Build the App

### Option A: Build for Testing (Simulator)

1. **Select Simulator:**
   - Top bar: Click device selector
   - Choose: "iPhone 15 Pro" (or any iOS 17+ simulator)

2. **Build and Run:**
   ```
   Product → Run (⌘R)
   ```

3. **Test the app:**
   - App launches in simulator
   - Test booking flow, onboarding, etc.

### Option B: Build for Device Testing

1. **Connect iPhone via USB**

2. **Select Device:**
   - Top bar: Click device selector
   - Choose your connected iPhone

3. **Trust Certificate:**
   - On iPhone: Settings → General → VPN & Device Management
   - Trust your developer certificate

4. **Build and Run:**
   ```
   Product → Run (⌘R)
   ```

---

## 📦 Step 6: Archive for Distribution

### Create Archive

1. **Select Device:**
   - Top bar: Click device selector
   - Choose: **"Any iOS Device (arm64)"**
   - NOT a simulator!

2. **Clean Build Folder:**
   ```
   Product → Clean Build Folder (⇧⌘K)
   ```

3. **Archive:**
   ```
   Product → Archive (⌘B then wait)
   ```

4. **Wait for Archive:**
   - Build progress shown in top bar
   - Takes 2-5 minutes
   - Organizer window opens automatically

---

## 🚢 Step 7: Distribute to App Store

### Using Xcode Organizer

1. **In Organizer Window:**
   - Your archive appears in list
   - Select the archive
   - Click **"Distribute App"**

2. **Choose Distribution Method:**
   - **App Store Connect** - For TestFlight or App Store
   - Click "Next"

3. **Choose Destination:**
   - **Upload** - Send to App Store Connect
   - Click "Next"

4. **Configure Options:**
   - ✅ App Store Connect
   - ✅ Upload your app's symbols
   - ✅ Manage Version and Build Number
   - Click "Next"

5. **Automatic Signing:**
   - Select your team
   - Xcode will manage certificates
   - Click "Next"

6. **Review and Upload:**
   - Review app information
   - Click **"Upload"**
   - Enter Apple ID password if prompted

7. **Wait for Upload:**
   - Progress bar shown
   - Upload takes 5-15 minutes (664 MB)
   - ✅ "Upload Successful" message

---

## 🧪 Step 8: TestFlight Distribution

### Set Up TestFlight

1. **Go to App Store Connect:**
   - https://appstoreconnect.apple.com
   - Sign in with Apple ID

2. **Select Your App:**
   - My Apps → BeautyCita

3. **Go to TestFlight Tab:**
   - Wait for build to process (~10-30 minutes)
   - Build status: "Processing" → "Ready to Submit"

4. **Add Build to TestFlight:**
   - Click the build number (e.g., "1.3 (5)")
   - Fill in "What to Test" notes
   - Click "Submit for Review"

5. **Invite Testers:**
   - Internal Testing → Add testers
   - External Testing → Add testers
   - Send invitations

### Testers Install App

Testers receive email invitation:
1. Install TestFlight app from App Store
2. Open invitation email
3. Click "View in TestFlight"
4. Install BeautyCita app

---

## 📱 Step 9: Export IPA (Alternative)

### For Manual Distribution

1. **In Organizer:**
   - Select archive
   - Click "Distribute App"

2. **Choose:**
   - **Ad Hoc** - For testing on registered devices (max 100)
   - **Enterprise** - For enterprise distribution
   - **Development** - For debugging

3. **Export Options:**
   - Select distribution method
   - Configure signing
   - Choose export location (e.g., Desktop)

4. **IPA Created:**
   ```
   ~/Desktop/BeautyCita.ipa
   ```

### Install IPA on Device

**Using Apple Configurator:**
```bash
# Download Apple Configurator 2 from App Store
# Connect iPhone
# Drag and drop IPA file to device
```

**Using Xcode Devices:**
```
Window → Devices and Simulators
Select device → Add (+ button)
Choose BeautyCita.ipa
```

---

## 🎯 Quick Start Summary

```bash
# 1. Download package
cd ~/Desktop
curl -O http://74.208.218.18/BeautyCita-iOS-v1.3-Build5-20251021.tar.gz

# 2. Extract
tar -xzf BeautyCita-iOS-v1.3-Build5-20251021.tar.gz
cd ios/App

# 3. Install dependencies
pod install

# 4. Open in Xcode
open App.xcworkspace

# 5. Configure signing (in Xcode UI)
# 6. Select "Any iOS Device (arm64)"
# 7. Product → Archive
# 8. Distribute → App Store Connect
# 9. Upload to TestFlight
```

---

## 🐛 Troubleshooting

### Issue: "CocoaPods not installed"

**Fix:**
```bash
sudo gem install cocoapods
pod setup
```

### Issue: "No valid code signing identity found"

**Fix:**
1. Xcode → Preferences → Accounts
2. Add Apple ID if not present
3. Select team → Download Manual Profiles
4. Back to project → Select correct team

### Issue: "Build input file cannot be found"

**Fix:**
```bash
cd ~/Desktop/ios/App
rm -rf Pods/ Podfile.lock
pod install
```

### Issue: "Module not found: Capacitor"

**Fix:**
```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clean build in Xcode
Product → Clean Build Folder (⇧⌘K)

# Rebuild
Product → Build (⌘B)
```

### Issue: Archive fails with "No such module"

**Fix:**
1. Close Xcode
2. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
   ```
3. Reopen App.xcworkspace
4. Product → Clean Build Folder
5. Try Archive again

### Issue: Splash screen stuck

**Fix:** This is normal on first launch. The splash screen shows while loading 664 MB of assets. Wait 10-30 seconds.

---

## 📊 Build Checklist

Before uploading to App Store:

- [ ] Version number updated (1.3) ✅ Done
- [ ] Build number incremented (5) ✅ Done
- [ ] Bundle ID correct (`com.beautycita.app`) ✅ Done
- [ ] App icons added (all sizes)
- [ ] Launch screen configured ✅ Done
- [ ] Privacy permissions in Info.plist (camera, location, etc.)
- [ ] App works on real device
- [ ] No debug code or console.logs
- [ ] Backend API pointing to production (https://beautycita.com)
- [ ] Push notification certificates configured
- [ ] TestFlight tested by at least 2 people
- [ ] Screenshots prepared for App Store
- [ ] App description written
- [ ] Keywords selected
- [ ] Privacy policy URL ready

---

## 🔐 Code Signing

### Required Certificates

**Development:**
- Apple Development Certificate (automatic)

**Distribution:**
- Apple Distribution Certificate (automatic with Xcode-managed signing)

**Provisioning Profiles:**
- App Store profile (automatic)
- Development profile (automatic)

### Manual Signing (Advanced)

If you need manual signing:

1. **Developer Portal:**
   - https://developer.apple.com/account/resources/certificates

2. **Create Certificates:**
   - iOS Distribution Certificate

3. **Create App ID:**
   - Identifier: `com.beautycita.app`
   - Capabilities: Push Notifications, Sign in with Apple, etc.

4. **Create Provisioning Profiles:**
   - App Store profile
   - Development profile

5. **Download and Install:**
   - Double-click .cer files
   - Double-click .mobileprovision files

6. **In Xcode:**
   - Uncheck "Automatically manage signing"
   - Select manual profiles

---

## 📱 App Store Submission

### Metadata Required

**App Information:**
- Name: BeautyCita
- Subtitle: Tu salón de belleza, donde quieras
- Category: Health & Fitness / Lifestyle
- Age Rating: 4+

**Version Information:**
- Version: 1.3
- Build: 5
- What's New: (see below)

**What's New in 1.3:**
```
¡Nueva versión con increíbles mejoras! 🎉

✨ Calendario de Reservas Mejorado
• Vista mensual con disponibilidad en tiempo real
• Vista semanal con selección de días
• Horarios populares destacados
• Animaciones suaves y elegantes

💖 Nueva Experiencia de Bienvenida
• Asistente de 4 pasos mejorado
• Selección de intereses personalizados
• Celebración con confeti 🎊
• Diseño moderno y atractivo

📧 Sistema de Notificaciones
• Confirmaciones de reserva mejoradas
• Recordatorios automáticos
• Alertas de proximidad

🎨 Mejoras de Diseño
• Gradientes modernos
• Efectos de cristal (glassmorphism)
• Experiencia visual premium

¡Descarga ahora y vive la experiencia BeautyCita renovada!
```

**Screenshots Needed:**
- 6.7" Display (iPhone 15 Pro Max): 3-10 screenshots
- 5.5" Display (iPhone 8 Plus): 3-10 screenshots
- iPad Pro (6th Gen): 3-10 screenshots (optional)

**App Icon:**
- 1024x1024 PNG (no transparency, no alpha channel)

**Privacy Policy URL:**
- https://beautycita.com/privacy

**Support URL:**
- https://beautycita.com/support

---

## 🎉 Success Indicators

**Build Successful:**
- ✅ Archive created without errors
- ✅ Upload to App Store Connect successful
- ✅ Build appears in TestFlight (after processing)
- ✅ TestFlight installation works
- ✅ App launches and functions correctly

**Ready for Review:**
- ✅ All metadata filled in App Store Connect
- ✅ Screenshots uploaded (all required sizes)
- ✅ Privacy policy accessible
- ✅ TestFlight tested by internal testers
- ✅ No crashes or major bugs
- ✅ Complies with App Store guidelines

---

## 📞 Support Resources

**Apple Developer:**
- Developer Portal: https://developer.apple.com
- App Store Connect: https://appstoreconnect.apple.com
- Guidelines: https://developer.apple.com/app-store/review/guidelines/

**Capacitor Docs:**
- iOS Guide: https://capacitorjs.com/docs/ios
- Deploying: https://capacitorjs.com/docs/ios/deploying-to-app-store

**Xcode Help:**
- Xcode Help: Help → Xcode Help
- Apple Developer Forums: https://developer.apple.com/forums/

---

## ⏱️ Expected Timeline

| Task | Time |
|------|------|
| Download package | 2-5 minutes (664 MB) |
| Extract package | 1 minute |
| Install pods | 2-3 minutes |
| Configure signing | 2 minutes |
| Build & test (simulator) | 3-5 minutes |
| Archive | 3-5 minutes |
| Upload to App Store | 5-15 minutes |
| **Total:** | **~30-45 minutes** |

**App Store Review:**
- Processing: 10-30 minutes
- TestFlight review: Automatic, <1 day
- App Store review: 1-3 days typically

---

## ✅ Final Checklist

**Before Archive:**
- [ ] Latest code synced (npx cap sync ios) ✅
- [ ] Version 1.3, Build 5 ✅
- [ ] Signing configured ✅
- [ ] Test on simulator ✅
- [ ] Test on real device
- [ ] No console warnings

**After Archive:**
- [ ] Uploaded to App Store Connect
- [ ] Added to TestFlight
- [ ] Internal testing completed
- [ ] External testing invited
- [ ] Screenshots uploaded
- [ ] Metadata completed
- [ ] Submitted for review

---

## 🎊 You're Ready!

The BeautyCita iOS app v1.3 is **ready to build and deploy!**

**Download:** http://74.208.218.18/BeautyCita-iOS-v1.3-Build5-20251021.tar.gz

**Build with Xcode and submit to the App Store!** 🚀

---

**Package Created:** October 21, 2025
**Version:** 1.3 (Build 5)
**Size:** 664 MB
**Status:** Ready for Xcode

