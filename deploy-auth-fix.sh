#!/bin/bash
# Deployment script for auth flow fixes
# Run this on your local machine: bash deploy-auth-fix.sh

set -e  # Exit on any error

echo "🚀 Starting deployment of auth flow fixes..."
echo ""

# Step 1: Delete test user accounts
echo "📧 Step 1/4: Deleting test email addresses from database..."
ssh www-data@beautycita.com "PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' psql -h localhost -U beautycita_app -d beautycita -c \"DELETE FROM users WHERE email IN ('newlandkriket@gmail.com', 'beautycita.com@gmail.com'); SELECT 'Deleted users' as result;\""
echo "✅ Test accounts deleted"
echo ""

# Step 2: Pull latest code
echo "📥 Step 2/4: Pulling latest code from GitHub..."
ssh www-data@beautycita.com "cd /var/www/beautycita.com && git pull origin main"
echo "✅ Code updated"
echo ""

# Step 3: Rebuild frontend
echo "🔨 Step 3/4: Building frontend (this may take 20-30 seconds)..."
ssh www-data@beautycita.com "cd /var/www/beautycita.com/frontend && npm run build"
echo "✅ Frontend built"
echo ""

# Step 4: Restart backend
echo "🔄 Step 4/4: Restarting backend API..."
ssh www-data@beautycita.com "cd /var/www/beautycita.com && pm2 restart beautycita-api"
echo "✅ Backend restarted"
echo ""

# Step 5: Verify deployment
echo "🔍 Verifying deployment..."
echo "Checking API health..."
ssh www-data@beautycita.com "curl -s https://beautycita.com/api/health | head -n 5"
echo ""
echo "Checking PM2 status..."
ssh www-data@beautycita.com "pm2 status beautycita-api"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "🧪 Please test:"
echo "   1. Go to https://beautycita.com"
echo "   2. Click 'Sign Up' or try Google One Tap"
echo "   3. Complete registration with newlandkriket@gmail.com"
echo "   4. Verify you are redirected to /onboarding/client (not /login)"
echo ""
