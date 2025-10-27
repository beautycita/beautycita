#!/bin/bash
# Fix file ownership issues in BeautyCita project
# All files should be www-data:www-data for PM2 to access them
# Run this as: sudo bash FIX_PERMISSIONS.sh

echo "=== BeautyCita Permission Fix Script ==="
echo ""
echo "Fixing backend source files..."
chown -R www-data:www-data /var/www/beautycita.com/backend/src/
chown -R www-data:www-data /var/www/beautycita.com/backend/migrations/

echo "Fixing frontend source files..."
chown -R www-data:www-data /var/www/beautycita.com/frontend/src/
chown -R www-data:www-data /var/www/beautycita.com/frontend/public/

echo "Fixing documentation..."
chown -R www-data:www-data /var/www/beautycita.com/docs/

echo "Fixing root-level configs..."
chown www-data:www-data /var/www/beautycita.com/package.json
chown www-data:www-data /var/www/beautycita.com/package-lock.json
chown www-data:www-data /var/www/beautycita.com/.env
chown www-data:www-data /var/www/beautycita.com/ecosystem.config.js

echo ""
echo "Checking for remaining root-owned files in backend..."
find /var/www/beautycita.com/backend/src -user root -ls 2>/dev/null | wc -l
echo "root-owned files found (should be 0)"

echo ""
echo "Checking for remaining beautycita-owned files in backend..."
find /var/www/beautycita.com/backend/src -user beautycita -ls 2>/dev/null | wc -l
echo "beautycita-owned files found (should be 0)"

echo ""
echo "=== Permission fix complete ==="
echo ""
echo "✅ All files should now be www-data:www-data"
echo ""
echo "Note: Claude Code Write tool creates files as 'beautycita:beautycita'"
echo "This is a limitation of the tool - it uses the shell user, not www-data."
echo ""
echo "Workaround: Run this script after Claude creates new files, OR"
echo "manually fix ownership: sudo chown www-data:www-data /path/to/new/file"
