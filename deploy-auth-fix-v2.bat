@echo off
echo ========================================
echo BeautyCita Auth Fix Deployment v2
echo ========================================
echo.

echo [1/6] Connecting to production server...
ssh beautycita@74.208.218.18 "cd /var/www/beautycita.com && echo 'Connected successfully' && git status && echo '---' && git log --oneline -3"

echo.
echo [2/6] Pulling latest code from GitHub...
ssh beautycita@74.208.218.18 "cd /var/www/beautycita.com && git pull origin main"

echo.
echo [3/6] Checking AuthModal.tsx has the import...
ssh beautycita@74.208.218.18 "cd /var/www/beautycita.com && grep -n 'useAuthStore' frontend/src/components/auth/AuthModal.tsx"

echo.
echo [4/6] Building frontend...
ssh beautycita@74.208.218.18 "cd /var/www/beautycita.com/frontend && npm run build"

echo.
echo [5/6] Restarting PM2...
ssh beautycita@74.208.218.18 "sudo -u www-data pm2 restart beautycita-api && sudo -u www-data pm2 list"

echo.
echo [6/6] Verifying deployment...
ssh beautycita@74.208.218.18 "ls -lh /var/www/beautycita.com/frontend/dist/assets/index-*.js | tail -1"

echo.
echo ========================================
echo Deployment complete!
echo Please hard refresh browser: Ctrl+Shift+R
echo ========================================
pause
