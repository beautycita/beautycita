#!/bin/bash

echo "🧹 BeautyCita Process Cleanup Script"
echo "====================================="
echo ""

# Check for stray Node processes
echo "📍 Checking for stray Node.js processes..."
STRAY_PROCESSES=$(ps aux | grep -E "node.*beautycita" | grep -v "pm2" | grep -v grep | grep -v "root")

if [ ! -z "$STRAY_PROCESSES" ]; then
    echo "⚠️  Found stray processes:"
    echo "$STRAY_PROCESSES"

    # Kill www-data processes
    echo "🔪 Killing www-data Node processes..."
    pkill -9 -u www-data node

    # Kill any test servers
    echo "🔪 Killing test servers on port 5555..."
    fuser -k 5555/tcp 2>/dev/null || true

    echo "✅ Stray processes killed"
else
    echo "✅ No stray processes found"
fi

echo ""

# Check port usage
echo "📍 Checking port usage..."
echo "Port 3000 (Docker):"
ss -tlnp | grep :3000 || echo "  - Not in use"
echo ""
echo "Port 4000 (API):"
ss -tlnp | grep :4000 || echo "  - Not in use"
echo ""
echo "Port 5555 (Test):"
ss -tlnp | grep :5555 || echo "  - Not in use"

echo ""

# Check PM2 status
echo "📍 PM2 Status:"

# Security: Always run PM2 commands as www-data user
if [ "$EUID" -eq 0 ]; then
    echo "🚨 SECURITY BLOCK: PM2 cannot be executed as root user!"
    echo "Running PM2 as root is a serious security risk."
    echo ""
    echo "BLOCKED COMMAND: pm2 list"
    echo ""
    echo "To run PM2 safely for BeautyCita:"
    echo "  sudo -u www-data bash -c 'cd /var/www/beautycita.com && pm2 list'"
    echo ""
    echo "Or switch to www-data user first:"
    echo "  su - www-data"
    echo "  cd /var/www/beautycita.com"
    echo "  pm2 list"
else
    pm2 list
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
if [ "$EUID" -eq 0 ]; then
    echo "💡 Tip: Run 'sudo -u www-data bash -c \"cd /var/www/beautycita.com && pm2 restart beautycita-api\"' to restart the API after cleanup"
else
    echo "💡 Tip: Run 'pm2 restart beautycita-api' to restart the API after cleanup"
fi