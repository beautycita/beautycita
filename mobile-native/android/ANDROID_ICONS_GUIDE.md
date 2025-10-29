# Android App Icons & Splash Screen Guide

## App Icon Generation

### Required Icon Sizes

Android requires different icon sizes for different screen densities:

| Density | Folder | Size (px) |
|---------|--------|-----------|
| ldpi | mipmap-ldpi | 36 × 36 |
| mdpi | mipmap-mdpi | 48 × 48 |
| hdpi | mipmap-hdpi | 72 × 72 |
| xhdpi | mipmap-xhdpi | 96 × 96 |
| xxhdpi | mipmap-xxhdpi | 144 × 144 |
| xxxhdpi | mipmap-xxxhdpi | 192 × 192 |

### Design Requirements

**App Icon Design:**
- **Base Design:** Use the "Smart Mirror" logo from BeautyCita brand assets
- **Background:** Pink-to-purple gradient (#ec4899 → #9333ea)
- **Foreground:** White or light gray mirror icon
- **Safe Area:** Keep important elements within 66dp circle (inner 80%)
- **Format:** PNG-24 with transparency (adaptive icons)

**Adaptive Icon Components:**
- `ic_launcher_foreground.png` - Foreground layer (108dp, center 72dp safe)
- `ic_launcher_background.png` - Background layer (108dp)
- Round icons for older Android versions

### Generation Methods

#### Option 1: Android Studio (Recommended)
1. Open project in Android Studio
2. Right-click `res` folder → New → Image Asset
3. Select "Launcher Icons (Adaptive and Legacy)"
4. Upload your 512×512 master icon
5. Configure foreground/background layers
6. Preview on different devices
7. Click "Next" → "Finish"

#### Option 2: Online Tools
- **Android Asset Studio:** https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
- Upload 512×512 source image
- Configure shape, padding, background color
- Download generated assets ZIP
- Extract to `android/app/src/main/res/`

#### Option 3: Command Line (ImageMagick)
```bash
# Install ImageMagick
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Linux

# Generate all sizes from 512x512 source
convert icon-512.png -resize 36x36 mipmap-ldpi/ic_launcher.png
convert icon-512.png -resize 48x48 mipmap-mdpi/ic_launcher.png
convert icon-512.png -resize 72x72 mipmap-hdpi/ic_launcher.png
convert icon-512.png -resize 96x96 mipmap-xhdpi/ic_launcher.png
convert icon-512.png -resize 144x144 mipmap-xxhdpi/ic_launcher.png
convert icon-512.png -resize 192x192 mipmap-xxxhdpi/ic_launcher.png
```

### Icon Files Structure

After generation, your `res` folder should contain:

```
android/app/src/main/res/
├── mipmap-ldpi/
│   ├── ic_launcher.png (36×36)
│   └── ic_launcher_round.png (36×36)
├── mipmap-mdpi/
│   ├── ic_launcher.png (48×48)
│   └── ic_launcher_round.png (48×48)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72×72)
│   └── ic_launcher_round.png (72×72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96×96)
│   └── ic_launcher_round.png (96×96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144×144)
│   └── ic_launcher_round.png (144×144)
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png (192×192)
│   └── ic_launcher_round.png (192×192)
└── mipmap-anydpi-v26/
    └── ic_launcher.xml (adaptive icon config)
```

## Splash Screen Setup

### Create Splash Screen Theme

1. **Update `android/app/src/main/res/values/colors.xml`:**

```xml
<resources>
    <!-- BeautyCita Brand Colors -->
    <color name="brand_pink">#ec4899</color>
    <color name="brand_purple">#9333ea</color>
    <color name="brand_blue">#3b82f6</color>
    <color name="splash_background">#ffffff</color>
    <color name="primary">#ec4899</color>
</resources>
```

2. **Update `android/app/src/main/res/values/styles.xml`:**

```xml
<resources>
    <!-- Base Application Theme -->
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
        <item name="android:textColor">#000000</item>
    </style>

    <!-- Splash Screen Theme -->
    <style name="SplashTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowBackground">@drawable/splash_screen</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>
```

3. **Create `android/app/src/main/res/drawable/splash_screen.xml`:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Background gradient -->
    <item android:drawable="@drawable/splash_gradient" />

    <!-- Logo (centered) -->
    <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/ic_launcher"
            android:tileMode="disabled" />
    </item>
</layer-list>
```

4. **Create `android/app/src/main/res/drawable/splash_gradient.xml`:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <gradient
        android:type="linear"
        android:angle="135"
        android:startColor="@color/brand_pink"
        android:centerColor="@color/brand_purple"
        android:endColor="@color/brand_blue" />
</shape>
```

5. **Update `android/app/src/main/AndroidManifest.xml`:**

Change the MainActivity theme to use SplashTheme:

```xml
<activity
    android:name=".MainActivity"
    android:label="@string/app_name"
    android:theme="@style/SplashTheme"  <!-- Add this line -->
    android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
    android:launchMode="singleTask"
    android:windowSoftInputMode="adjustResize"
    android:exported="true">
```

6. **Update `MainActivity.java`:**

Change theme back to AppTheme when React Native loads:

```java
import android.os.Bundle;
import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Set the theme to AppTheme BEFORE onCreate to avoid flash
        setTheme(R.style.AppTheme);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected String getMainComponentName() {
        return "BeautyCita";
    }
}
```

## Testing

### Test on Emulator
```bash
cd /var/www/beautycita.com/mobile-native
npm run android
```

### Test on Physical Device
1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect device via USB
4. Verify device: `adb devices`
5. Run: `npm run android`

### Verify Icons
- Check home screen icon
- Check recent apps icon
- Check settings → apps icon
- Check notification icon (if applicable)

### Verify Splash Screen
- Launch app (first time and subsequent launches)
- Verify gradient displays correctly
- Verify logo is centered
- Verify smooth transition to main app
- Check on different screen sizes

## Troubleshooting

### Icon Not Updating
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Splash Screen White Flash
- Ensure `setTheme(R.style.AppTheme)` is BEFORE `super.onCreate()` in MainActivity
- Verify splash_screen.xml is in `drawable` folder (not `drawable-v24`)

### Build Errors
```bash
# Clear caches
cd android
./gradlew clean
cd ..
rm -rf android/app/build
npm run android
```

## Brand Assets Location

Reference the BeautyCita logo files:
- Web frontend: `/var/www/beautycita.com/frontend/src/components/logo/`
- Logo design doc: `/var/www/beautycita.com/frontend/LOGO_DESIGN.md`

Use the "Smart Mirror" variant for the mobile icon.

## Production Checklist

Before releasing to Play Store:

- [ ] All icon densities generated (ldpi through xxxhdpi)
- [ ] Round icons included for older devices
- [ ] Adaptive icons configured (foreground + background)
- [ ] Splash screen displays brand gradient
- [ ] Logo centered on splash screen
- [ ] No white flash on app launch
- [ ] Icons display correctly on all tested devices
- [ ] Test on devices with different screen sizes
- [ ] Test on devices with different Android versions (6.0+)
- [ ] Icons follow Material Design guidelines
- [ ] App icon recognizable at small sizes (24dp)

## Quick Start

1. Generate 512×512 master icon with Smart Mirror logo + gradient
2. Use Android Asset Studio to generate all sizes
3. Extract generated assets to `android/app/src/main/res/`
4. Create splash_screen.xml and splash_gradient.xml
5. Update MainActivity theme to SplashTheme
6. Add setTheme(R.style.AppTheme) to MainActivity.java
7. Test: `npm run android`
