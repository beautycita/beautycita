#!/bin/bash
#
# BeautyCita iOS Build Automation
# Monitors beautycita-ios repo, builds IPA, uploads to R2, updates downloads page
#

set -e

# Configuration
IOS_REPO_URL="https://github.com/beautycita/beautycita-ios.git"
IOS_REPO_DIR="/var/www/beautycita-ios-build"
BUILD_OUTPUT="/tmp/beautycita-ios-build"
R2_BUCKET="beautycita"
R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
FRONTEND_DIR="/var/www/beautycita.com/frontend"
LOG_FILE="/var/www/backups/ios-build.log"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +%Y-%m-%d %H:%M:%S)]${NC} $1" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${LOG_FILE}"
    exit 1
}

# 1. Clone or update iOS repo
log "Checking iOS repository..."
if [ -d "${IOS_REPO_DIR}" ]; then
    cd "${IOS_REPO_DIR}"
    CURRENT_COMMIT=$(git rev-parse HEAD)
    git pull origin main
    NEW_COMMIT=$(git rev-parse HEAD)

    if [ "${CURRENT_COMMIT}" == "${NEW_COMMIT}" ]; then
        log "No changes detected. Exiting."
        exit 0
    fi
    log "New commit detected: ${NEW_COMMIT}"
else
    log "Cloning iOS repository..."
    git clone "${IOS_REPO_URL}" "${IOS_REPO_DIR}"
    cd "${IOS_REPO_DIR}"
fi

# 2. Extract version info
VERSION=$(grep -oP 'MARKETING_VERSION = \K[^;]+' ios/App/App.xcodeproj/project.pbxproj | head -1 | tr -d ' "')
BUILD=$(grep -oP 'CURRENT_PROJECT_VERSION = \K[^;]+' ios/App/App.xcodeproj/project.pbxproj | head -1 | tr -d ' "')
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IPA_NAME="BeautyCita-iOS-v${VERSION}-Build${BUILD}-${TIMESTAMP}.ipa"

log "Building BeautyCita iOS v${VERSION} Build ${BUILD}"

# 3. Install dependencies
log "Installing dependencies..."
npm ci

# 4. Sync Capacitor
log "Syncing Capacitor..."
npx cap sync ios

# 5. Build iOS app (requires macOS with Xcode)
log "Building iOS application..."
# NOTE: This step requires macOS and Xcode Command Line Tools
# You may need to set up a macOS build server or use CI/CD like GitHub Actions

if [ "$(uname)" == "Darwin" ]; then
    # On macOS
    xcodebuild -workspace ios/App/App.xcworkspace \
        -scheme App \
        -configuration Release \
        -archivePath "${BUILD_OUTPUT}/BeautyCita.xcarchive" \
        clean archive

    xcodebuild -exportArchive \
        -archivePath "${BUILD_OUTPUT}/BeautyCita.xcarchive" \
        -exportPath "${BUILD_OUTPUT}" \
        -exportOptionsPlist ios/ExportOptions.plist

    IPA_PATH="${BUILD_OUTPUT}/${IPA_NAME}"
    mv "${BUILD_OUTPUT}/App.ipa" "${IPA_PATH}"
else
    # On Linux - requires GitHub Actions or remote macOS builder
    log "Triggering GitHub Actions workflow for iOS build..."
    # This would trigger a GitHub Actions workflow that runs on macOS
    gh workflow run ios-build.yml --ref main

    # Wait for artifact and download
    log "Waiting for build artifact..."
    # Implementation depends on your CI/CD setup
    error "iOS builds require macOS. Please configure GitHub Actions or a macOS build server."
fi

# 6. Upload to Cloudflare R2
log "Uploading ${IPA_NAME} to R2..."
# Using rclone or AWS CLI configured for R2
aws s3 cp "${IPA_PATH}" "s3://${R2_BUCKET}/downloads/ios/${IPA_NAME}" \
    --endpoint-url="${R2_ENDPOINT}" \
    --acl public-read

# Get public URL
IPA_URL="https://pub-YOUR_ID.r2.dev/downloads/ios/${IPA_NAME}"
log "IPA uploaded: ${IPA_URL}"

# 7. Update downloads page metadata
log "Updating downloads page..."
cat > "${FRONTEND_DIR}/public/downloads/ios/latest.json" <<EOF
{
  "version": "${VERSION}",
  "build": "${BUILD}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "filename": "${IPA_NAME}",
  "url": "${IPA_URL}",
  "size": "$(stat -f%z "${IPA_PATH}" 2>/dev/null || stat -c%s "${IPA_PATH}")",
  "sha256": "$(sha256sum "${IPA_PATH}" | awk '{print $1}')"
}
EOF

# 8. Rebuild frontend with new download link
log "Rebuilding frontend..."
cd "${FRONTEND_DIR}"
npm run build

# 9. Cleanup
log "Cleaning up build artifacts..."
rm -rf "${BUILD_OUTPUT}"

log "✓ iOS build automation complete!"
log "Version: ${VERSION} Build ${BUILD}"
log "Download: ${IPA_URL}"
