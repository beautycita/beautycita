# BeautyCita Official App Icon Guide

## Official Logo
The official BeautyCita app icon is located at:
`/var/www/beautycita.com/frontend/public/media/brand/official-logo.svg`

**Description**: Pink-to-purple-to-blue gradient rounded square with white "BC" text
**Format**: SVG (scalable)
**Design**: iOS-style rounded square with 22.5% radius (67.5px on 300px canvas)

---

## Android Icons ✅ COMPLETED

### Icon Sizes Generated
All Android launcher icons have been generated from the official logo:

- **mdpi**: 48x48px (ic_launcher.png, ic_launcher_round.png, 108x108 foreground)
- **hdpi**: 72x72px (ic_launcher.png, ic_launcher_round.png, 162x162 foreground)
- **xhdpi**: 96x96px (ic_launcher.png, ic_launcher_round.png, 216x216 foreground)
- **xxhdpi**: 144x144px (ic_launcher.png, ic_launcher_round.png, 324x324 foreground)
- **xxxhdpi**: 192x192px (ic_launcher.png, ic_launcher_round.png, 432x432 foreground)

### Location
`/var/www/beautycita.com/frontend/android/app/src/main/res/mipmap-*/`

### How to Regenerate
```bash
cd /var/www/beautycita.com/frontend

# Source SVG
SVG="public/media/brand/official-logo.svg"

# Generate all sizes
convert "$SVG" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert "$SVG" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert "$SVG" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert "$SVG" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert "$SVG" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
# ... and foreground/round variants
```

---

## iOS Icons ⏳ TO DO

### Required Sizes
When building the iOS app, generate these icon sizes from official-logo.svg:

- **iPhone/iPad**:
  - App Icon: 1024x1024px (App Store)
  - 180x180px (@3x for iPhone)
  - 167x167px (@2x for iPad Pro)
  - 152x152px (@2x for iPad)
  - 120x120px (@3x for iPhone, @2x for iPad)
  - 87x87px (@3x for Settings)
  - 80x80px (@2x for Spotlight)
  - 76x76px (@1x for iPad)
  - 60x60px (@3x for Notifications)
  - 58x58px (@2x for Settings)
  - 40x40px (@2x for Spotlight)
  - 29x29px (@1x for Settings)
  - 20x20px (@1x for Notifications)

### Generation Command
```bash
SVG="public/media/brand/official-logo.svg"
convert "$SVG" -resize 1024x1024 ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-1024.png
convert "$SVG" -resize 180x180 ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-180.png
# ... etc for all sizes
```

### Location
`/var/www/beautycita.com/frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/`

---

## Windows Icons ⏳ TO DO

### Required Formats
When building the Windows app, generate:

- **App Icon**: 256x256px PNG with transparency
- **Tile Icons**:
  - Small: 71x71px
  - Medium: 150x150px
  - Wide: 310x150px
  - Large: 310x310px
- **ICO file**: Multi-resolution (16, 32, 48, 256px in one .ico file)

### Generation Commands
```bash
SVG="public/media/brand/official-logo.svg"

# App icon
convert "$SVG" -resize 256x256 windows/icon.png

# Tiles
convert "$SVG" -resize 71x71 windows/SmallTile.png
convert "$SVG" -resize 150x150 windows/MediumTile.png
convert "$SVG" -resize 310x310 windows/LargeTile.png

# ICO file (multi-resolution)
convert "$SVG" -resize 256x256 /tmp/icon256.png
convert "$SVG" -resize 48x48 /tmp/icon48.png
convert "$SVG" -resize 32x32 /tmp/icon32.png
convert "$SVG" -resize 16x16 /tmp/icon16.png
convert /tmp/icon16.png /tmp/icon32.png /tmp/icon48.png /tmp/icon256.png windows/app.ico
```

---

## Current Status

### ✅ Completed Platforms
- **Android**: Official logo applied to all launcher icons (v1.0.1)
- **Web**: Using official logo in PWA manifest

### ⏳ Pending Platforms
- **iOS**: Not yet built (will use official logo when created)
- **Windows**: Not yet built (will use official logo when created)

---

## Version History

### v1.0.1 (2025-10-15)
- ✅ Updated Android app icon to official BeautyCita logo
- All icon densities regenerated from official-logo.svg
- Replaced previous inconsistent icons

### v1.0.0 (2025-10-15)
- Initial release with temporary icon

---

## Notes

- **Always use** `official-logo.svg` as the source
- **Never** create custom icons or variations
- The official logo maintains brand consistency across all platforms
- When generating icons, preserve the gradient and rounded corners
- For transparency-required formats, the gradient background is part of the logo
