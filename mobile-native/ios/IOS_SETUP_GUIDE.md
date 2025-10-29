# iOS App Configuration & Icons Guide

## Bundle Identifier Setup

The bundle identifier should be updated from `org.reactjs.native.example.BeautyCitaNative` to `com.beautycita.mobile`.

### Update in Xcode:
1. Open `ios/BeautyCitaNative.xcworkspace` in Xcode (NOT .xcodeproj)
2. Select the project in the navigator (blue icon)
3. Select the target "BeautyCitaNative"
4. Under "General" tab:
   - Change "Display Name" to: **BeautyCita**
   - Change "Bundle Identifier" to: **com.beautycita.mobile**
   - Change "Version" to: **1.0.0**
   - Change "Build" to: **1**
5. Under "Signing & Capabilities":
   - Select your development team
   - Enable "Automatically manage signing"
   - Verify provisioning profile is created

## App Icon Generation

### Required Icon Sizes (App Icons Set)

iOS requires an App Icons set with these sizes:

| Device | Size (px) | @Scale | Purpose |
|--------|-----------|--------|---------|
| iPhone Notification | 40×40 | @2x, @3x | 20pt |
| iPhone Settings | 58×58, 87×87 | @2x, @3x | 29pt |
| iPhone Spotlight | 80×80, 120×120 | @2x, @3x | 40pt |
| iPhone App | 120×120, 180×180 | @2x, @3x | 60pt |
| iPad Notification | 20×20, 40×40 | @1x, @2x | 20pt |
| iPad Settings | 29×29, 58×58 | @1x, @2x | 29pt |
| iPad Spotlight | 40×40, 80×80 | @1x, @2x | 40pt |
| iPad App | 76×76, 152×152 | @1x, @2x | 76pt |
| iPad Pro App | 167×167 | @2x | 83.5pt |
| App Store | 1024×1024 | @1x | Marketing |

### Design Requirements

**App Icon Design:**
- **Base Design:** Use the "Smart Mirror" logo from BeautyCita brand assets
- **Background:** Pink-to-purple gradient (#ec4899 → #9333ea)
- **Foreground:** White or light gray mirror icon
- **No Transparency:** iOS app icons cannot have transparent backgrounds
- **No Text:** Apple rejects icons with text
- **Safe Area:** Keep important elements within inner 80%
- **Rounded Corners:** iOS automatically rounds corners (18% radius)

### Generation Methods

#### Option 1: Xcode Asset Catalog (Recommended)
1. Open `ios/BeautyCitaNative.xcworkspace` in Xcode
2. Navigate to `BeautyCitaNative/Images.xcassets`
3. Select "AppIcon"
4. Drag and drop your icons for each size slot
5. Build and run to verify

#### Option 2: Online Tools
**App Icon Generator:** https://www.appicon.co/
- Upload 1024×1024 master icon
- Select "iPhone" and "iPad"
- Download generated AppIcon.appiconset
- Replace `ios/BeautyCitaNative/Images.xcassets/AppIcon.appiconset/`

#### Option 3: ImageMagick Command Line
```bash
# Create all sizes from 1024x1024 source
convert icon-1024.png -resize 20x20 AppIcon-20@1x.png
convert icon-1024.png -resize 40x40 AppIcon-20@2x.png
convert icon-1024.png -resize 60x60 AppIcon-20@3x.png
convert icon-1024.png -resize 29x29 AppIcon-29@1x.png
convert icon-1024.png -resize 58x58 AppIcon-29@2x.png
convert icon-1024.png -resize 87x87 AppIcon-29@3x.png
convert icon-1024.png -resize 40x40 AppIcon-40@1x.png
convert icon-1024.png -resize 80x80 AppIcon-40@2x.png
convert icon-1024.png -resize 120x120 AppIcon-40@3x.png
convert icon-1024.png -resize 76x76 AppIcon-76@1x.png
convert icon-1024.png -resize 152x152 AppIcon-76@2x.png
convert icon-1024.png -resize 167x167 AppIcon-83.5@2x.png
convert icon-1024.png -resize 120x120 AppIcon-60@2x.png
convert icon-1024.png -resize 180x180 AppIcon-60@3x.png
# Keep 1024x1024 for App Store
```

## Launch Screen (Splash Screen)

### Update LaunchScreen.storyboard

1. **Open in Xcode:**
   - Navigate to `ios/BeautyCitaNative/LaunchScreen.storyboard`
   - Select the View Controller Scene

2. **Design Options:**

#### Option A: Gradient Background with Logo (Recommended)
- Set background color to brand pink (#ec4899)
- Add UIImageView for logo (centered)
- Add gradient layer in AppDelegate

#### Option B: Simple Gradient
- Create a PNG with gradient background
- Set as launch screen image

### Add Gradient to AppDelegate

Update `ios/BeautyCitaNative/AppDelegate.mm`:

```objc
#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Create the root view
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"BeautyCita"
                                            initialProperties:nil];

  // Create gradient background
  CAGradientLayer *gradient = [CAGradientLayer layer];
  gradient.frame = self.window.bounds;
  gradient.colors = @[
    (id)[UIColor colorWithRed:0.925 green:0.286 blue:0.600 alpha:1.0].CGColor, // #ec4899
    (id)[UIColor colorWithRed:0.576 green:0.200 blue:0.918 alpha:1.0].CGColor, // #9333ea
    (id)[UIColor colorWithRed:0.231 green:0.510 blue:0.965 alpha:1.0].CGColor  // #3b82f6
  ];
  gradient.startPoint = CGPointMake(0.0, 0.0);
  gradient.endPoint = CGPointMake(1.0, 1.0);

  [rootView.layer insertSublayer:gradient atIndex:0];

  // Set root view
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return YES;
}

// ... rest of AppDelegate
@end
```

## Xcode Project Settings

### Build Settings to Verify:

1. **Product Name:** BeautyCita
2. **Product Bundle Identifier:** com.beautycita.mobile
3. **Marketing Version:** 1.0.0
4. **Current Project Version:** 1
5. **Development Team:** (Your Apple Developer Team)
6. **iOS Deployment Target:** 13.0 (minimum supported)
7. **Supported Platforms:** iOS
8. **Architecture:** arm64

### Code Signing

For development builds:
- Select "Automatically manage signing"
- Choose your development team
- Xcode will create provisioning profiles

For production builds:
- Create App ID in Apple Developer Portal: com.beautycita.mobile
- Create Distribution Certificate
- Create App Store Provisioning Profile
- Download and install in Xcode

## CocoaPods Dependencies

Ensure all native modules are properly linked:

```bash
cd ios
pod install
cd ..
```

This will install:
- React Native core
- React Native Maps
- React Native Image Picker
- OneSignal
- Stripe SDK
- Socket.IO
- Other dependencies

## Testing

### iOS Simulator
```bash
npm run ios
# or specific simulator:
npm run ios -- --simulator="iPhone 15 Pro"
```

### Physical Device
1. Connect iPhone/iPad via USB
2. Open Xcode
3. Select your device in device dropdown
4. Click Run (Cmd+R)
5. Trust the developer certificate on device

### Verify Permissions
When testing, verify that permission prompts appear:
- Camera access (when taking photo)
- Photo library access (when selecting photo)
- Location access (when using maps)
- Face ID (when using biometric login)
- Notifications (when app starts)

## Building for Distribution

### Archive Build
1. Open Xcode
2. Select "Any iOS Device (arm64)" as target
3. Product → Archive
4. Once complete, click "Distribute App"
5. Choose distribution method:
   - App Store Connect (for App Store)
   - Ad Hoc (for TestFlight beta testing)
   - Development (for internal testing)

### Fastlane (Advanced)
Set up Fastlane for automated builds:

```bash
cd ios
fastlane init
```

Create Fastfile:
```ruby
lane :beta do
  increment_build_number
  build_app(scheme: "BeautyCita")
  upload_to_testflight
end

lane :release do
  increment_build_number
  build_app(scheme: "BeautyCita")
  upload_to_app_store
end
```

## Troubleshooting

### Pod Install Fails
```bash
cd ios
pod deintegrate
pod cache clean --all
pod install
cd ..
```

### Code Signing Issues
- Verify Apple Developer account is active
- Check that bundle identifier matches App ID
- Ensure provisioning profile includes the device
- Try "Clean Build Folder" (Cmd+Shift+K in Xcode)

### Build Errors
```bash
cd ios
xcodebuild clean
rm -rf ~/Library/Developer/Xcode/DerivedData/*
cd ..
npm run ios
```

### App Name Not Updating
- Clean build folder in Xcode
- Delete app from simulator/device
- Rebuild and install

## App Store Submission Checklist

Before submitting to App Store:

- [ ] All icon sizes generated and added to Images.xcassets
- [ ] Launch screen displays brand gradient
- [ ] App display name is "BeautyCita"
- [ ] Bundle identifier is com.beautycita.mobile
- [ ] Version is 1.0.0, Build is 1
- [ ] All permission descriptions are clear and accurate
- [ ] App runs on real devices (iPhone + iPad)
- [ ] No debug code or console.log statements
- [ ] Privacy Policy URL added to App Store Connect
- [ ] Screenshots prepared (6.5" iPhone + 12.9" iPad)
- [ ] App description and keywords optimized
- [ ] Age rating set (likely 4+)
- [ ] Support URL and marketing URL added
- [ ] Test on iOS 13+ devices
- [ ] Archive build created and uploaded

## Quick Start

1. **Install CocoaPods dependencies:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Open in Xcode:**
   ```bash
   open ios/BeautyCitaNative.xcworkspace
   ```

3. **Update Settings:**
   - Bundle Identifier: com.beautycita.mobile
   - Display Name: BeautyCita
   - Select Development Team

4. **Generate App Icons:**
   - Use https://www.appicon.co/ with 1024×1024 master
   - Replace AppIcon.appiconset contents

5. **Test:**
   ```bash
   npm run ios
   ```

## Brand Assets

Reference the BeautyCita logo files:
- Web frontend: `/var/www/beautycita.com/frontend/src/components/logo/`
- Logo design doc: `/var/www/beautycita.com/frontend/LOGO_DESIGN.md`

Use the "Smart Mirror" variant for the iOS icon with no transparency.
