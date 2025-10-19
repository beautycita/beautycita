#!/bin/bash
# PM2 Security Wrapper - Prevents root execution
# This script ensures PM2 processes run only as www-data user

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "🚨 SECURITY ERROR: PM2 cannot be started as root user!"
    echo "This is a security risk. PM2 processes must run as www-data user."
    echo ""
    echo "To start PM2 properly, use:"
    echo "  sudo -u www-data /var/www/beautycita.com/scripts/pm2-security-wrapper.sh"
    echo ""
    echo "Or switch to www-data user first:"
    echo "  su - www-data"
    echo "  cd /var/www/beautycita.com"
    echo "  pm2 start ecosystem.config.js"
    echo ""
    exit 1
fi

# Check if running as www-data
if [ "$USER" != "www-data" ] && [ "$(whoami)" != "www-data" ]; then
    echo "🚨 WARNING: PM2 should be started as www-data user for security."
    echo "Current user: $(whoami)"
    echo "Switching to www-data user..."
    exec sudo -u www-data "$0" "$@"
fi

# If we get here, we're running as www-data
echo "✅ Starting PM2 as www-data user..."
cd /var/www/beautycita.com

# Start PM2 with the ecosystem configuration
pm2 start ecosystem.config.js

echo "✅ PM2 started successfully as www-data user"
pm2 status