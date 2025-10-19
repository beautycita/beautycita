#!/bin/bash
# BeautyCita Frontend Build Script
# Ensures builds run as www-data user with correct permissions

set -e

echo "🔨 Building BeautyCita Frontend..."
echo "────────────────────────────────────"

# Switch to www-data user and build
su - www-data -s /bin/bash -c "npm run build"

# Verify ownership is correct
echo ""
echo "✅ Verifying file ownership..."
WRONG_OWNER=$(find /var/www/beautycita.com/frontend/dist -not -user www-data -not -group www-data 2>/dev/null | wc -l)

if [ "$WRONG_OWNER" -gt 0 ]; then
    echo "⚠️  Found $WRONG_OWNER files with wrong ownership. Fixing..."
    chown -R www-data:www-data /var/www/beautycita.com/frontend/dist
    echo "✅ Ownership fixed!"
else
    echo "✅ All files owned by www-data:www-data"
fi

echo ""
echo "📦 Build Summary:"
echo "────────────────────────────────────"
ls -lh /var/www/beautycita.com/frontend/dist/assets/ | grep "index-" | tail -1

echo ""
echo "🎉 Frontend build complete!"
