# iOS Build Guide - GitHub Actions

This guide explains how to build the iOS IPA file using GitHub Actions.

## 📋 Prerequisites

Before you can build iOS apps via GitHub Actions, you need:

### 1. Apple Developer Account
- Enroll at https://developer.apple.com ($99/year)
- Verify your account is active

### 2. iOS Distribution Certificate (.p12)
- Create in Apple Developer Portal → Certificates
- Export as `.p12` file with password
- Convert to base64: `base64 -i certificate.p12 | pbcopy`

### 3. Provisioning Profile
- Create in Apple Developer Portal → Profiles
- Choose type:
  - **Ad-Hoc**: For testing on specific devices (up to 100)
  - **App Store**: For App Store submission
- Download the `.mobileprovision` file
- Convert to base64: `base64 -i profile.mobileprovision | pbcopy`

### 4. Bundle ID Configuration
- Register bundle ID: `com.beautycita.app` in Apple Developer Portal
- Match in `frontend/ios/App/App.xcodeproj`

## 🔐 Setup GitHub Secrets

Go to your repository: **Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `IOS_P12_BASE64` | Signing certificate (base64) | `base64 -i certificate.p12` |
| `IOS_P12_PASSWORD` | Certificate password | Password you set when exporting |
| `IOS_PROVISIONING_PROFILE_BASE64` | Provisioning profile (base64) | `base64 -i profile.mobileprovision` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | From Google Cloud Console |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | From Stripe Dashboard |
| `VITE_SENTRY_DSN` | Sentry DSN (optional) | From Sentry project settings |

## 🚀 Build Methods

### Method 1: Manual Workflow Dispatch (Recommended)

1. Go to **Actions** tab in GitHub
2. Select **"Build iOS IPA (Fastlane)"** workflow
3. Click **"Run workflow"**
4. Enter version details:
   - **Version name**: `1.0.4`
   - **Build number**: `6`
5. Click **"Run workflow"** button
6. Wait 10-15 minutes for build to complete
7. Download IPA from **Artifacts** section

### Method 2: Git Tag (Automatic)

```bash
# Tag and push
git tag v1.0.4
git push origin v1.0.4

# This triggers the build automatically
# IPA will be attached to the GitHub Release
```

## 📦 What Gets Built

The workflow produces:

- **IPA file**: `beautycita-v1.0.4.ipa` (~150 MB)
- **dSYM**: Debug symbols for crash reporting (optional)
- **Release notes**: Markdown file with version details

## 📥 Download & Install

### Option A: TestFlight (Recommended for Beta Testing)

1. Upload IPA to App Store Connect:
   ```bash
   # Install Transporter app from Mac App Store
   # Or use command line:
   xcrun altool --upload-app -f beautycita-v1.0.4.ipa \
     -u your@apple.id -p app-specific-password
   ```

2. In App Store Connect:
   - Go to TestFlight tab
   - Select the uploaded build
   - Add internal or external testers
   - Send invitation links

3. Testers install:
   - Download TestFlight app
   - Open invitation link
   - Install BeautyCita

### Option B: Direct Install (Ad-Hoc)

**Requirements:**
- Device UDID must be in provisioning profile
- Development certificate installed on device

**Install via Xcode:**
```bash
# Connect iPhone
# Drag IPA to Xcode → Window → Devices and Simulators
```

**Install via Command Line:**
```bash
# Using ios-deploy
npm install -g ios-deploy
ios-deploy --bundle beautycita-v1.0.4.ipa
```

**Install via Apple Configurator 2:**
1. Download from Mac App Store
2. Connect device
3. Drag IPA to device in Apple Configurator

### Option C: App Store Release

1. Upload IPA to App Store Connect
2. Fill out app metadata:
   - Description, screenshots, keywords
   - Privacy policy URL
   - Support URL
3. Submit for review
4. Wait for Apple approval (1-7 days)
5. Release to App Store

## 🐛 Troubleshooting

### Build Fails: "Code signing failed"

**Solution:**
- Verify `IOS_P12_BASE64` secret is correct
- Check certificate hasn't expired
- Ensure password is correct

### Build Fails: "No matching provisioning profile"

**Solution:**
- Verify bundle ID matches (`com.beautycita.app`)
- Check provisioning profile includes your certificate
- Ensure profile hasn't expired

### Build Succeeds but No IPA Found

**Solution:**
- Check build logs for warnings
- Verify export options are correct
- Try re-running the workflow

### IPA Won't Install: "Untrusted Developer"

**Solution:**
- On device: Settings → General → VPN & Device Management
- Trust the developer certificate

### IPA Won't Install: "Device not registered"

**Solution:**
- Get device UDID: Settings → General → About → tap "Identifier"
- Add UDID to provisioning profile in Apple Developer Portal
- Rebuild IPA with updated profile

## 📱 Testing Checklist

After installing IPA:

- [ ] App launches successfully
- [ ] Login with biometric authentication works
- [ ] Location services prompt appears
- [ ] Can browse stylists
- [ ] Booking flow completes
- [ ] Stripe payments work (test mode)
- [ ] SMS notifications arrive
- [ ] Video consultation connects
- [ ] App doesn't crash on background/foreground

## 🔄 Workflow Files

Two workflows are available:

### 1. `build-ios-fastlane.yml` (Recommended)
- Uses Fastlane (industry standard)
- Better error handling
- Supports TestFlight uploads
- More flexible configuration

### 2. `build-ios.yml` (Direct Xcode)
- Uses xcodebuild directly
- Simpler, fewer dependencies
- Good for quick builds

## 📊 Build Timeline

Typical GitHub Actions build time:

1. **Checkout & Setup**: 2 minutes
2. **Install Dependencies**: 3 minutes
3. **Build Web Assets**: 2 minutes
4. **Sync Capacitor**: 1 minute
5. **CocoaPods Install**: 3 minutes
6. **Xcode Build**: 5-8 minutes
7. **Export IPA**: 1 minute

**Total: 12-15 minutes**

## 💰 GitHub Actions Costs

- **Public repos**: Free unlimited minutes
- **Private repos**:
  - Free tier: 2,000 minutes/month
  - macOS runners: 10x multiplier (1 minute = 10 minutes)
  - Each build ~15 minutes = 150 minutes charged
  - ~13 builds per month on free tier

## 🔒 Security Notes

- Never commit certificates or profiles to git
- Use GitHub Secrets for all sensitive data
- Rotate certificates annually
- Revoke certificates if compromised
- Use different certificates for dev/prod

## 📚 Additional Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Fastlane Docs](https://docs.fastlane.tools/)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [GitHub Actions - macOS Runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-runners-and-hardware-resources)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## 🎯 Next Steps

1. ✅ Set up Apple Developer account
2. ✅ Create distribution certificate
3. ✅ Create provisioning profile
4. ✅ Add secrets to GitHub
5. ✅ Run workflow and download IPA
6. ✅ Test on device
7. ✅ Upload to TestFlight
8. ✅ Invite beta testers
9. ✅ Submit to App Store

---

**Last Updated:** October 28, 2025
**Workflow Version:** 1.0
**Maintained By:** BeautyCita DevOps Team
