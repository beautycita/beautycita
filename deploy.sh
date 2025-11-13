#!/bin/bash
# BeautyCita Automated Deployment Script
# Triggered after git push to deploy frontend, backend, and mobile builds

set -e  # Exit on any error

echo "🚀 Starting BeautyCita automated deployment..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Build Frontend
echo -e "${BLUE}📦 Step 1/6: Building frontend...${NC}"
cd frontend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
cd ..

# Step 2: Restart Backend
echo -e "${BLUE}🔄 Step 2/6: Restarting backend...${NC}"
# Kill any existing backend processes on port 4000
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
# Start backend in background
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
sleep 5  # Wait for backend to start
cd ..

# Step 3: Health Check
echo -e "${BLUE}🏥 Step 3/6: Performing health check...${NC}"
HEALTH_CHECK=$(curl -s http://localhost:4000/api/health || echo "failed")
if [[ $HEALTH_CHECK == *"healthy"* ]] || [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
    echo "$HEALTH_CHECK"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "$HEALTH_CHECK"
    exit 1
fi

# Step 4: Build Android APK
echo -e "${BLUE}📱 Step 4/6: Building Android APK...${NC}"
# Sync Capacitor
cd frontend
npx cap sync android
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Capacitor sync failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Capacitor sync successful${NC}"

# Build APK
cd android
chmod +x ./gradlew
./gradlew assembleRelease
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ APK build successful${NC}"
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
    if [ -f "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo "APK Location: $APK_PATH"
        echo "APK Size: $APK_SIZE"
    else
        echo -e "${RED}❌ APK file not found at expected location${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ APK build failed${NC}"
    exit 1
fi
cd ../..

# Step 5: Upload to Cloudflare R2
echo -e "${BLUE}☁️  Step 5/6: Uploading APK to Cloudflare R2...${NC}"
# Get version from build.gradle
VERSION=$(grep "versionName" frontend/android/app/build.gradle | awk '{print $2}' | tr -d '"')
if [ -z "$VERSION" ]; then
    echo -e "${YELLOW}⚠️  Could not extract version, using default 2.5.1${NC}"
    VERSION="2.5.1"
fi

# Upload using existing script
node upload-apk-to-r2.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ APK uploaded to Cloudflare R2${NC}"
else
    echo -e "${RED}❌ APK upload failed${NC}"
    exit 1
fi

# Step 6: Update Downloads Page
echo -e "${BLUE}📄 Step 6/6: Downloads page auto-updates on next backend restart${NC}"
echo -e "${GREEN}✅ All deployment steps completed successfully!${NC}"

# Summary
echo ""
echo "================================================"
echo -e "${GREEN}✅ DEPLOYMENT SUMMARY${NC}"
echo "================================================"
echo "✅ Frontend: Built successfully"
echo "✅ Backend: Restarted and healthy"
echo "✅ APK: Built and uploaded (v$VERSION)"
echo "✅ Downloads: Ready at /api/app-downloads/page"
echo ""
echo "🌐 Access your app at: https://beautycita.com"
echo "📦 Download APK at: https://beautycita.com/api/app-downloads/apk"
echo "📱 APK also available at: https://r2.beautycita.com/beautycita/apps/android/BeautyCita-v${VERSION}.apk"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "1. Visit https://beautycita.com and test the auth flow"
echo "2. Verify no confirm password field in registration"
echo "3. Check popup sequence (GDPR first, then register modal)"
echo "4. Test Google One Tap sign-in"
echo ""
