# BeautyCita Android APK Build & Release Workflow

## Quick Start Command
**Load this context file to quickly reference the APK build workflow**

---

## Overview
This document describes the complete workflow for building and releasing new versions of the BeautyCita Android app using Capacitor.

---

## Prerequisites

### Required Software
- **Java 21 JDK** (Eclipse Adoptium Temurin)
  - Location: `C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot`
  - Install: `winget install EclipseAdoptium.Temurin.21.JDK`
- **Android SDK**
  - Location: `C:\Users\bc\AppData\Local\Android\Sdk`
  - Configured in: `frontend/android/local.properties`
- **Node.js 20+**
- **npm/npx**

### Key Files
- **Frontend Package**: `frontend/package.json` (version field)
- **Gradle Build Config**: `frontend/android/app/build.gradle` (versionCode + versionName)
- **Capacitor Config**: `frontend/capacitor.config.json` (app settings)
- **Gradle Properties**: `frontend/android/gradle.properties` (Java version)
- **Backend Route**: `backend/src/routes/appDownloads.js` (version info + release notes)
- **Frontend Page**: `frontend/src/pages/AppDownloadPage.tsx` (downloads UI)

---

## Build Workflow

### Step 1: Update Version Numbers

#### 1a. Update `frontend/package.json`
```json
{
  "version": "X.X.X"  // e.g., "2.5.0"
}
```

#### 1b. Update `frontend/android/app/build.gradle`
```gradle
versionCode X      // Increment by 1 (e.g., 6 → 7)
versionName "X.X.X"  // Match package.json (e.g., "2.5.0")
```

### Step 2: Build Frontend
```bash
cd frontend
npm run build
```
- Builds React app to `frontend/dist/`
- Takes ~25 seconds
- Outputs production-optimized assets

### Step 3: Sync with Capacitor
```bash
cd frontend
npx cap sync android
```
- Copies web assets to `frontend/android/app/src/main/assets/public`
- Updates Android plugins
- Takes <1 second

### Step 4: Build APK
```bash
cd frontend/android
./gradlew clean assembleRelease
```
- Takes ~2-3 minutes
- Builds production-signed APK
- Output: `frontend/android/app/build/outputs/apk/release/app-release.apk`
- Size: ~33 MB (as of v2.5.0)

### Step 5: Copy APK with Version Name
```bash
cp frontend/android/app/build/outputs/apk/release/app-release.apk BeautyCita-vX.X.X.apk
```

### Step 6: Upload to Server
```bash
scp BeautyCita-vX.X.X.apk beautycita@beautycita.com:/var/www/beautycita.com/frontend/android/app/build/outputs/apk/release/app-release.apk
```
- Overwrites existing `app-release.apk` on server
- Backend serves this file at `/api/app-downloads/apk`

---

## Update Release Notes

### Edit `backend/src/routes/appDownloads.js`

Update the `/info` endpoint around lines 275-310:

```javascript
res.json({
  success: true,
  data: {
    package: 'com.beautycita.app',
    version: 'X.X.X',           // ← Update this
    versionCode: X,             // ← Update this
    releaseDate: 'YYYY-MM-DD',  // ← Update this
    releaseNotes: {
      version: 'X.X.X',         // ← Update this
      date: 'Month DD, YYYY',   // ← Update this
      changes: [                // ← Update these
        '✅ Change 1',
        '✅ Change 2',
        '✅ Change 3'
      ]
    },
    previousVersions: [
      // Add previous version here
      {
        version: 'X.X.X',
        versionCode: X,
        date: 'Month YYYY',
        notes: 'Brief summary'
      },
      // ... keep existing versions
    ],
    // ... rest of response
  }
});
```

### After Updating
```bash
ssh beautycita@beautycita.com
cd /var/www/beautycita.com
sudo -u www-data pm2 restart beautycita-api
```

---

## Version History

### v2.5.0 (Build 7) - November 11, 2025
**Changes:**
- Changed mobile app entry point to Login/Register screen instead of Welcome screen
- Improved onboarding UX for new users
- All 78 screens + services + components intact

**Previous Versions:**
- v1.0.4 (Build 6) - October 2025
- v1.0.3 (Build 5) - October 16, 2025 - QR code fixes, Press/Careers updates
- v1.0.2 (Build 4) - October 2025 - Error pages redesign
- v1.0.1 (Build 3) - October 2025 - Translation fixes
- v1.0.0 (Build 1) - September 2025 - Initial release

---

## Common Issues & Solutions

### Issue: "SDK location not found"
**Solution:**
Create `frontend/android/local.properties`:
```properties
sdk.dir=C\\:\\Users\\bc\\AppData\\Local\\Android\\Sdk
```

### Issue: "error: invalid source release: 21"
**Solution:**
Update `frontend/android/gradle.properties`:
```properties
org.gradle.java.home=C\\:\\Program Files\\Eclipse Adoptium\\jdk-21.0.9.10-hotspot
```

### Issue: Gradle daemon using wrong Java version
**Solution:**
```bash
cd frontend/android
./gradlew --stop
./gradlew clean assembleRelease
```

---

## File Locations

### Local (Development)
- **Built APK**: `frontend/android/app/build/outputs/apk/release/app-release.apk`
- **Built AAB**: `frontend/android/app/build/outputs/bundle/release/app-release.aab`
- **Frontend Build**: `frontend/dist/`

### Server (Production)
- **APK Path**: `/var/www/beautycita.com/frontend/android/app/build/outputs/apk/release/app-release.apk`
- **AAB Path**: `/var/www/beautycita.com/frontend/android/app/build/outputs/bundle/release/app-release.aab`
- **Backend Route**: `/var/www/beautycita.com/backend/src/routes/appDownloads.js`
- **Downloads Page**: `https://beautycita.com/downloads` (Admin/Superadmin only)

---

## Access Control

### Downloads Page
- **URL**: `https://beautycita.com/downloads`
- **Required Role**: ADMIN or SUPERADMIN
- **Authentication**: JWT token required
- **Frontend**: `/src/pages/AppDownloadPage.tsx`
- **Backend**: `/src/routes/appDownloads.js`

### API Endpoints
- `GET /api/app-downloads/info` - Get app version info
- `GET /api/app-downloads/apk` - Download APK file
- `GET /api/app-downloads/aab` - Download AAB bundle
- `GET /api/app-downloads/page` - HTML download page (legacy)

---

## Build Configuration

### Capacitor Config (`frontend/capacitor.config.json`)
```json
{
  "appId": "com.beautycita.app",
  "appName": "BeautyCita",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#ec4899",
      "showSpinner": true,
      "spinnerColor": "#9333ea"
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#ec4899"
    }
  }
}
```

### Gradle Properties (`frontend/android/gradle.properties`)
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError
android.useAndroidX=true
org.gradle.java.home=C\\:\\Program Files\\Eclipse Adoptium\\jdk-21.0.9.10-hotspot
android.defaults.buildfeatures.buildconfig=true
```

### Build Gradle (`frontend/android/app/build.gradle`)
```gradle
android {
    namespace "com.beautycita.app"
    compileSdk 35
    defaultConfig {
        applicationId "com.beautycita.app"
        minSdkVersion 23
        targetSdkVersion 35
        versionCode X           // Increment with each release
        versionName "X.X.X"     // Semantic version
    }
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

---

## Complete One-Liner Build Commands

### From Project Root
```bash
cd frontend && \
npm run build && \
npx cap sync android && \
cd android && \
./gradlew clean assembleRelease && \
cd ../../.. && \
cp frontend/android/app/build/outputs/apk/release/app-release.apk BeautyCita-v2.5.0.apk && \
ls -lh BeautyCita-v2.5.0.apk
```

### Upload to Server
```bash
scp BeautyCita-v2.5.0.apk beautycita@beautycita.com:/var/www/beautycita.com/frontend/android/app/build/outputs/apk/release/app-release.apk
```

---

## Tips & Best Practices

1. **Always increment versionCode** - Google Play requires this
2. **Use semantic versioning** for versionName (MAJOR.MINOR.PATCH)
3. **Test APK locally** before uploading to server
4. **Update release notes** with user-facing changes
5. **Keep previous versions** in the previousVersions array
6. **Restart backend** after updating appDownloads.js
7. **Verify download** after uploading to server

---

## Architecture

### Capacitor App Structure
```
BeautyCita/
├── frontend/              # React + Vite web app
│   ├── src/              # React components
│   ├── dist/             # Built web assets (npm run build)
│   ├── android/          # Capacitor Android project
│   │   ├── app/
│   │   │   ├── src/main/assets/public/  # Web assets copied here
│   │   │   └── build/outputs/
│   │   │       ├── apk/release/  # APK output
│   │   │       └── bundle/release/  # AAB output
│   │   ├── build.gradle  # Root Gradle config
│   │   ├── gradle.properties  # Gradle properties
│   │   └── local.properties  # SDK location
│   ├── capacitor.config.json  # Capacitor settings
│   └── package.json      # App version
└── backend/
    └── src/routes/appDownloads.js  # Download API
```

### Build Flow
```
1. frontend/src/* (React code)
   ↓ npm run build
2. frontend/dist/* (optimized web assets)
   ↓ npx cap sync android
3. frontend/android/app/src/main/assets/public/* (web assets in Android)
   ↓ ./gradlew assembleRelease
4. frontend/android/app/build/outputs/apk/release/app-release.apk (final APK)
   ↓ scp to server
5. /var/www/beautycita.com/frontend/android/app/build/outputs/apk/release/app-release.apk
   ↓ served by backend API
6. https://beautycita.com/downloads (download page for admins)
```

---

**Last Updated:** November 11, 2025
**Maintained By:** Development Team
**Contact:** beautycita.com@gmail.com
