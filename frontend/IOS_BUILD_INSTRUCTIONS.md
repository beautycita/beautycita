# BeautyCita iOS App - Build Instructions

## Overview
The iOS version of BeautyCita is now ready! This guide will help you build and install it on your iOS devices using Xcode.

## Prerequisites
- macOS with Xcode installed (latest version recommended)
- iOS device(s) for testing
- USB cable to connect your device
- Apple ID (free account works for personal device testing)

## Important: Free Apple Developer Account
You DON'T need a paid Apple Developer account ($99/year) for personal testing. You can use your free Apple ID to:
- Install apps on your own devices
- Test on up to 3 devices
- Apps expire after 7 days and need to be re-installed
- Cannot distribute on App Store (requires paid account)

## Step 1: Transfer iOS Project to Your Mac

You need to copy the iOS project folder to your Mac:

```bash
# From your server, create a tarball of the iOS project
cd /var/www/beautycita.com/frontend
tar -czf beautycita-ios.tar.gz ios/

# Then download this file to your Mac
# You can use scp, sftp, or any file transfer method
# Example with scp:
# scp user@yourserver:/var/www/beautycita.com/frontend/beautycita-ios.tar.gz ~/Downloads/
```

On your Mac:
```bash
# Extract the project
cd ~/Downloads
tar -xzf beautycita-ios.tar.gz
cd ios
```

## Step 2: Install CocoaPods (if not installed)

CocoaPods manages iOS dependencies. Check if installed:
```bash
pod --version
```

If not installed:
```bash
sudo gem install cocoapods
```

## Step 3: Install iOS Dependencies

```bash
cd App
pod install
```

This will create `App.xcworkspace` file.

## Step 4: Open Project in Xcode

**IMPORTANT:** Open the `.xcworkspace` file, NOT the `.xcodeproj` file!

```bash
open App.xcworkspace
```

Or double-click `App.xcworkspace` in Finder.

## Step 5: Configure Signing & Capabilities

1. In Xcode, select the **App** project in the left sidebar
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Under **Team**, click the dropdown and select **Add Account...**
5. Sign in with your Apple ID
6. After signing in, select your Apple ID as the **Team**
7. Xcode will automatically create a provisioning profile

### Change Bundle Identifier (Important!)

The default bundle identifier might conflict. Change it:

1. In **Signing & Capabilities**, find **Bundle Identifier**
2. Change from `com.beautycita.app` to something unique like:
   - `com.yourname.beautycita`
   - `com.yourdomain.beautycita`
3. This ensures your app doesn't conflict with existing apps

## Step 6: Connect Your iOS Device

1. Connect your iPhone/iPad to your Mac via USB
2. If prompted on your device, tap **Trust This Computer**
3. Enter your device passcode
4. In Xcode, you should see your device in the device dropdown (top toolbar)

## Step 7: Build and Run

1. Select your connected device from the device dropdown (top toolbar)
2. Click the **Play** button (▶️) or press `Cmd + R`
3. Xcode will build and install the app on your device

### First Time: Trust Developer Certificate

When you run the app for the first time, it won't open. You need to trust your certificate:

1. On your iOS device, go to **Settings** → **General** → **VPN & Device Management**
2. Under **Developer App**, tap on your Apple ID
3. Tap **Trust "[Your Apple ID]"**
4. Confirm by tapping **Trust**
5. Now the app will launch!

## Step 8: Testing the App

The app should launch on your device. Test:
- Login/Registration
- Booking flow
- Payment methods
- All main features

## Project Details

### App Configuration
- **App Name:** BeautyCita
- **Bundle ID:** com.beautycita.app (change this to your own)
- **Version:** 1.0
- **Platform:** iOS 13.0+

### Included Capacitor Plugins
- @capacitor/app@7.1.0
- @capacitor/preferences@7.0.2
- @capacitor/splash-screen@7.0.3
- @capacitor/status-bar@7.0.3

### What's Included
✓ All latest frontend changes
✓ Minimal toast notifications
✓ Fixed booking form
✓ Payment methods integration
✓ Service worker with auto-update
✓ Offline support

## Updating the App

When you make changes to the web app:

1. **On the server:**
```bash
cd /var/www/beautycita.com/frontend
npm run build
npx cap sync ios
# Create new tarball and transfer to Mac
```

2. **On your Mac:**
Extract the new iOS folder and rebuild in Xcode.

## Troubleshooting

### "App installation failed"
- Make sure your device is trusted
- Check that your Apple ID is selected in Signing & Capabilities
- Try cleaning the build: Product → Clean Build Folder (Cmd + Shift + K)

### "Untrusted Developer"
- Go to Settings → General → VPN & Device Management
- Trust your developer certificate

### "Pod install failed"
```bash
cd App
pod repo update
pod install
```

### "Signing for 'App' requires a development team"
- Add your Apple ID in Xcode → Preferences → Accounts
- Select your team in Signing & Capabilities

### App expires after 7 days
This is normal with free Apple Developer accounts. To fix:
- Reconnect device and rebuild from Xcode
- Or purchase Apple Developer account ($99/year)

## Building for Simulator

If you want to test on iOS Simulator instead:

1. In Xcode device dropdown, select any iPhone simulator
2. Click Play button
3. Simulator will launch with your app

Note: Camera and some hardware features won't work in simulator.

## Next Steps

### For App Store Distribution (Requires Paid Account)
1. Enroll in Apple Developer Program ($99/year)
2. Create App Store listing
3. Configure certificates and provisioning profiles
4. Archive and upload to App Store Connect
5. Submit for review

### For TestFlight (Beta Testing)
1. Need paid Apple Developer account
2. Upload build to App Store Connect
3. Add beta testers
4. Distribute via TestFlight

## File Locations

- **iOS Project:** `/var/www/beautycita.com/frontend/ios/`
- **Xcode Workspace:** `ios/App/App.xcworkspace`
- **Info.plist:** `ios/App/App/Info.plist`
- **Web Assets:** `ios/App/App/public/`

## Support

For Capacitor iOS issues, see:
- https://capacitorjs.com/docs/ios
- https://capacitorjs.com/docs/basics/workflow

For Xcode issues, see:
- https://developer.apple.com/documentation/xcode

## Summary

✅ iOS project created
✅ Latest web assets synced
✅ Ready for Xcode
✅ All plugins configured
✅ Free Apple ID supported

Your BeautyCita iOS app is ready to build! Transfer the `ios` folder to your Mac and follow these instructions to get it running on your devices.
