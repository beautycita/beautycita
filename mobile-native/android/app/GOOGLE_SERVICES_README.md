# Google Services Configuration

## Current Status: PLACEHOLDER CONFIGURATION

The `google-services.json` file in this directory contains **placeholder values** that allow the Android build to succeed, but **will not work at runtime** for Google Sign-In or Firebase services.

## What This Means

- **Build Success**: The APK will build successfully on GitHub Actions
- **Runtime Failure**: Google Sign-In and Firebase features will NOT work until a real configuration is added
- **OneSignal**: Should work independently (uses its own configuration)

## To Enable Google Services

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing "beautycita" project
3. Add an Android app with package name: `com.beautycitaminimal`

### 2. Download Real Configuration

1. In Firebase Console, go to Project Settings
2. Scroll to "Your apps" section
3. Click on the Android app
4. Download the `google-services.json` file

### 3. Replace Placeholder File

```bash
# Replace the placeholder file with the real one
cp ~/Downloads/google-services.json /var/www/beautycita.com/mobile-native/android/app/google-services.json
sudo chown www-data:www-data /var/www/beautycita.com/mobile-native/android/app/google-services.json
```

### 4. Enable Required APIs

In Google Cloud Console, enable these APIs:
- Google Sign-In API
- Maps SDK for Android
- Places API

### 5. Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > OAuth consent screen
3. Configure the consent screen with app details
4. Add test users if in development mode

### 6. Create OAuth 2.0 Credentials

1. Go to APIs & Services > Credentials
2. Create OAuth 2.0 Client IDs:
   - **Android**: Package name `com.beautycitaminimal` + SHA-1 certificate fingerprint
   - **Web**: For backend authentication verification

### 7. Update App Code

Update the Web Client ID in the app code:

**File**: `src/services/authService.ts`

```typescript
GoogleSignin.configure({
  webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
  offlineAccess: true,
});
```

### 8. Get SHA-1 Certificate Fingerprint

For debug builds:
```bash
cd android
./gradlew signingReport
```

For release builds (after creating release keystore):
```bash
keytool -list -v -keystore android/app/my-release-key.keystore
```

## OneSignal Configuration

OneSignal is separate from Google Services. To configure:

1. Create account at [OneSignal.com](https://onesignal.com/)
2. Create a new app
3. Get the App ID
4. Update in `src/services/notificationService.ts`:

```typescript
const ONESIGNAL_APP_ID = 'your-onesignal-app-id-here';
```

5. Add `google-services.json` from Firebase (OneSignal uses FCM)

## Current Placeholder Values

The current `google-services.json` contains these placeholder values:
- Project Number: `123456789000`
- Project ID: `beautycita-minimal`
- App ID: `1:123456789000:android:abcdef1234567890`
- API Key: `AIzaSyDummyKeyForBuildPurposesOnly123456`

**DO NOT USE IN PRODUCTION**

## Security Notes

- **Never commit real google-services.json to public repositories**
- Add to `.gitignore` if repository is public
- Use GitHub Secrets for CI/CD pipelines
- Rotate keys if accidentally exposed

## Questions?

See Firebase documentation: https://firebase.google.com/docs/android/setup
