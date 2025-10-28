#!/bin/bash

# Sync Primary to Secondary Server
# This script deploys the latest code to the secondary server (beautifulsol)

set -e

PRIMARY_DIR="/var/www/beautycita.com"
SECONDARY_HOST="beautifulsol"
SECONDARY_USER="beautycita"
LOG_FILE="$PRIMARY_DIR/logs/sync-to-secondary.log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log "Starting sync to secondary server ($SECONDARY_HOST)..."

# Test SSH connection
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SECONDARY_USER@$SECONDARY_HOST" "echo 'SSH test successful'" 2>/dev/null; then
    error "Cannot connect to secondary server via SSH"
    error "Please configure SSH keys first (see SETUP_AUTOMATED_DEPLOYMENT.md)"
    exit 1
fi

log "✅ SSH connection successful"

# Sync code via git
log "Pulling latest code on secondary server..."
ssh "$SECONDARY_USER@$SECONDARY_HOST" << 'ENDSSH'
    set -e
    cd /var/www/beautycita.com

    # Fetch latest
    git fetch origin main

    # Show what will change
    echo "Changes to be applied:"
    git log HEAD..origin/main --oneline | head -5

    # Reset to origin/main
    git reset --hard origin/main

    echo "✅ Code synced"
ENDSSH

log "✅ Code synced via git"

# Build frontend on secondary
log "Building frontend on secondary server..."
ssh "$SECONDARY_USER@$SECONDARY_HOST" << 'ENDSSH'
    set -e
    cd /var/www/beautycita.com/frontend

    # Install dependencies if package.json changed
    if [ package.json -nt node_modules ]; then
        echo "Installing dependencies..."
        npm install --legacy-peer-deps
    fi

    # Build
    npm run build

    echo "✅ Frontend built"
ENDSSH

log "✅ Frontend built"

# Restart PM2 on secondary
log "Restarting PM2 on secondary server..."
ssh "$SECONDARY_USER@$SECONDARY_HOST" "cd /var/www/beautycita.com && sudo -u www-data pm2 restart beautycita-api"

log "✅ PM2 restarted"

# Verify health
log "Checking secondary server health..."
if ssh "$SECONDARY_USER@$SECONDARY_HOST" "curl -sf http://localhost:4000/api/health" > /dev/null 2>&1; then
    log "✅ Secondary server is healthy"
else
    warning "Secondary server health check failed - API might be starting"
fi

log "🎉 Sync to secondary server completed successfully!"

# Show summary
echo ""
echo "═══════════════════════════════════════════"
echo "  Deployment Summary"
echo "═══════════════════════════════════════════"
echo "  Primary:   $(git rev-parse --short HEAD) (current server)"
echo "  Secondary: Synced to match primary"
echo "  Time:      $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════"
