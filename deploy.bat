@echo off
REM BeautyCita Automated Deployment Script (Windows)
REM Triggered after git push to deploy frontend, backend, and mobile builds

echo ========================================
echo 🚀 BeautyCita Automated Deployment
echo ========================================
echo.

REM Step 1: Build Frontend
echo [Step 1/6] Building frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo ❌ Frontend build failed
    exit /b 1
)
echo ✅ Frontend build successful
cd ..

REM Step 2: Restart Backend
echo.
echo [Step 2/6] Restarting backend...
REM Kill existing Node processes on port 4000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":4000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul
timeout /t 2 /nobreak >nul

REM Start backend in background
cd backend
start /B cmd /c "npm start > ../backend.log 2>&1"
echo Backend started (check backend.log for output)
timeout /t 5 /nobreak >nul
cd ..

REM Step 3: Health Check
echo.
echo [Step 3/6] Performing health check...
curl -s http://localhost:4000/api/health
if errorlevel 1 (
    echo ❌ Backend health check failed
    exit /b 1
)
echo ✅ Backend health check passed

REM Step 4: Build Android APK
echo.
echo [Step 4/6] Building Android APK...
cd frontend

REM Sync Capacitor
echo Syncing Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ❌ Capacitor sync failed
    exit /b 1
)
echo ✅ Capacitor sync successful

REM Build APK
echo Building APK with Gradle...
cd android
call gradlew.bat assembleRelease
if errorlevel 1 (
    echo ❌ APK build failed
    exit /b 1
)
echo ✅ APK build successful

REM Check APK exists
if exist "app\build\outputs\apk\release\app-release.apk" (
    echo APK Location: app\build\outputs\apk\release\app-release.apk
    for %%A in ("app\build\outputs\apk\release\app-release.apk") do echo APK Size: %%~zA bytes
) else (
    echo ❌ APK file not found at expected location
    exit /b 1
)
cd ..\..

REM Step 5: Upload to Cloudflare R2
echo.
echo [Step 5/6] Uploading APK to Cloudflare R2...
node upload-apk-to-r2.js
if errorlevel 1 (
    echo ❌ APK upload failed
    exit /b 1
)
echo ✅ APK uploaded to Cloudflare R2

REM Step 6: Downloads page auto-updates
echo.
echo [Step 6/6] Downloads page will auto-update on next backend restart
echo ✅ All deployment steps completed successfully!

REM Summary
echo.
echo ========================================
echo ✅ DEPLOYMENT SUMMARY
echo ========================================
echo ✅ Frontend: Built successfully
echo ✅ Backend: Restarted and healthy
echo ✅ APK: Built and uploaded (v2.5.1)
echo ✅ Downloads: Ready at /api/app-downloads/page
echo.
echo 🌐 Access your app at: https://beautycita.com
echo 📦 Download APK at: https://beautycita.com/api/app-downloads/apk
echo.
echo 💡 Next steps:
echo 1. Visit https://beautycita.com and test the auth flow
echo 2. Verify no confirm password field in registration
echo 3. Check popup sequence (GDPR first, then register modal)
echo 4. Test Google One Tap sign-in
echo.
pause
