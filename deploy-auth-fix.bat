@echo off
REM Windows batch version of deployment script
REM Run this from Windows: deploy-auth-fix.bat

echo.
echo ========================================
echo   BeautyCita Auth Fix Deployment
echo ========================================
echo.

echo Step 1/4: Deleting test email addresses from database...
ssh www-data@beautycita.com "PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' psql -h localhost -U beautycita_app -d beautycita -c \"DELETE FROM users WHERE email IN ('newlandkriket@gmail.com', 'beautycita.com@gmail.com'); SELECT 'Deleted users' as result;\""
if %errorlevel% neq 0 (
    echo ERROR: Failed to delete test accounts
    pause
    exit /b 1
)
echo [OK] Test accounts deleted
echo.

echo Step 2/4: Pulling latest code from GitHub...
ssh www-data@beautycita.com "cd /var/www/beautycita.com && git pull origin main"
if %errorlevel% neq 0 (
    echo ERROR: Failed to pull code
    pause
    exit /b 1
)
echo [OK] Code updated
echo.

echo Step 3/4: Building frontend (this may take 20-30 seconds)...
ssh www-data@beautycita.com "cd /var/www/beautycita.com/frontend && npm run build"
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo [OK] Frontend built
echo.

echo Step 4/4: Restarting backend API...
ssh www-data@beautycita.com "cd /var/www/beautycita.com && pm2 restart beautycita-api"
if %errorlevel% neq 0 (
    echo ERROR: Failed to restart backend
    pause
    exit /b 1
)
echo [OK] Backend restarted
echo.

echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Please test:
echo   1. Go to https://beautycita.com
echo   2. Click 'Sign Up' or try Google One Tap
echo   3. Complete registration with newlandkriket@gmail.com
echo   4. Verify you are redirected to /onboarding/client (not /login)
echo.
pause
