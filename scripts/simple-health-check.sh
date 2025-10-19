#!/bin/bash

# Simple Health Check for BeautyCita
# Quick system status verification

set -euo pipefail

echo "🔍 BeautyCita System Health Check - $(date)"
echo "================================================"

# Check web application
echo -n "Web Application: "
if curl -s --max-time 10 https://beautycita.com/api/health >/dev/null; then
    echo "✅ Online"
else
    echo "❌ Offline"
fi

# Check database
echo -n "Database: "
if PGPASSWORD=$(cd /var/www/beautycita.com && node -e "
    const loader = require('./secure-env-loader');
    loader.loadSecureEnv();
    process.stdout.write(process.env.DB_PASSWORD);
" 2>/dev/null) timeout 10 psql -h localhost -U beautycita_app -d beautycita -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Connected"
else
    echo "❌ Connection Failed"
fi

# Check Redis
echo -n "Redis: "
if timeout 5 redis-cli ping >/dev/null 2>&1; then
    echo "✅ Connected"
else
    echo "❌ Connection Failed"
fi

# Check PM2 processes
echo -n "PM2 Processes: "
pm2_status=$(pm2 jlist 2>/dev/null | jq '[.[] | select(.pm2_env.status == "online")] | length' 2>/dev/null || echo "0")
total_processes=$(pm2 jlist 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
if [ "$pm2_status" -eq "$total_processes" ] && [ "$total_processes" -gt 0 ]; then
    echo "✅ $pm2_status/$total_processes running"
else
    echo "⚠️  $pm2_status/$total_processes running"
fi

# Check disk space
echo -n "Disk Space: "
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$disk_usage" -lt 85 ]; then
    echo "✅ ${disk_usage}% used"
else
    echo "⚠️  ${disk_usage}% used (high)"
fi

# Check SSL certificate
echo -n "SSL Certificate: "
cert_days=$(echo | openssl s_client -servername beautycita.com -connect beautycita.com:443 2>/dev/null | openssl x509 -noout -checkend $((30*24*3600)) 2>/dev/null && echo "30+" || echo "expires_soon")
if [ "$cert_days" = "30+" ]; then
    echo "✅ Valid (30+ days)"
else
    echo "⚠️  Expires soon"
fi

# Check recent backup
echo -n "Recent Backup: "
if [ -f "/var/backups/beautycita/beautycita_backup_$(date +%Y%m%d)_"*".sql.gz" ] 2>/dev/null; then
    echo "✅ Today's backup exists"
else
    latest_backup=$(find /var/backups/beautycita -name "*.sql.gz" -type f -printf '%T@ %f\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2- || echo "none")
    if [ "$latest_backup" != "none" ]; then
        echo "⚠️  Latest: $latest_backup"
    else
        echo "❌ No backups found"
    fi
fi

echo "================================================"
echo "Health check completed at $(date)"