#!/bin/bash

# BeautyCita Backend Keepalive Script
# Monitors and restarts the backend API if it goes down
# Designed to run as a cron job every 1-2 minutes

set -euo pipefail

# Configuration
SCRIPT_NAME="backend-keepalive"
LOG_FILE="/var/log/beautycita-keepalive.log"
PID_FILE="/var/run/beautycita-keepalive.pid"
API_URL="https://beautycita.com/api/health"
LOCAL_API_URL="http://localhost:4000/api/health"
FALLBACK_API_URL="http://localhost:4000"
PM2_APP_NAME="beautycita-api"
PM2_USER="www-data"
ECOSYSTEM_CONFIG="/var/www/beautycita.com/ecosystem.config.js"
MAX_RETRIES=3
RETRY_DELAY=10
HEALTH_TIMEOUT=10

# Prevent multiple instances
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "[$(date)] Another instance is already running (PID: $OLD_PID)" >> "$LOG_FILE"
        exit 0
    fi
fi
echo $$ > "$PID_FILE"
trap 'rm -f "$PID_FILE"' EXIT

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🔄 Starting backend keepalive check..."

# Check if PM2 process is running
check_pm2_status() {
    local status=$(sudo -u "$PM2_USER" pm2 jlist | jq -r ".[] | select(.name == \"$PM2_APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "not_found")
    echo "$status"
}

# Check API health endpoint
check_api_health() {
    local url="$1"
    local timeout="$2"

    if curl -s -f --max-time "$timeout" "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Restart PM2 backend process
restart_backend() {
    log "🚨 Backend is down. Attempting to restart..."

    # First try to restart existing PM2 process
    local pm2_status=$(check_pm2_status)

    if [ "$pm2_status" != "not_found" ]; then
        log "📱 Restarting existing PM2 process..."
        if sudo -u "$PM2_USER" pm2 restart "$PM2_APP_NAME" --update-env; then
            log "✅ PM2 restart successful"
            sleep 5
            return 0
        else
            log "❌ PM2 restart failed, trying full restart..."
        fi
    fi

    # Try to stop and start PM2 process
    log "🔄 Stopping PM2 process..."
    sudo -u "$PM2_USER" pm2 delete "$PM2_APP_NAME" 2>/dev/null || true

    log "🚀 Starting fresh PM2 process..."
    if sudo -u "$PM2_USER" pm2 start "$ECOSYSTEM_CONFIG"; then
        log "✅ PM2 fresh start successful"
        sleep 10
        return 0
    else
        log "❌ PM2 fresh start failed"
        return 1
    fi
}

# Kill stray processes that might interfere
cleanup_stray_processes() {
    log "🧹 Cleaning up stray processes..."

    # Kill any non-PM2 node processes running beautycita backend
    local stray_pids=$(ps aux | grep -E "node.*beautycita.*server\.js" | grep -v pm2 | grep -v grep | awk '{print $2}' || true)

    if [ ! -z "$stray_pids" ]; then
        log "⚠️  Found stray backend processes: $stray_pids"
        echo "$stray_pids" | xargs -r kill -9
        log "🔪 Killed stray processes"
        sleep 2
    fi

    # Free up port 4000 if anything else is using it
    local port_pids=$(lsof -ti:4000 | grep -v $(sudo -u "$PM2_USER" pm2 jlist | jq -r ".[] | select(.name == \"$PM2_APP_NAME\") | .pid" 2>/dev/null || echo "0") || true)

    if [ ! -z "$port_pids" ]; then
        log "⚠️  Found processes blocking port 4000: $port_pids"
        echo "$port_pids" | xargs -r kill -9
        log "🔓 Freed port 4000"
        sleep 2
    fi
}

# Main health check and recovery logic
main() {
    local attempt=1
    local backend_healthy=false

    # Check PM2 status first
    local pm2_status=$(check_pm2_status)
    log "📊 PM2 Status: $pm2_status"

    if [ "$pm2_status" != "online" ]; then
        log "⚠️  PM2 process not online (status: $pm2_status)"
        cleanup_stray_processes

        if ! restart_backend; then
            log "❌ Failed to restart backend via PM2"
            exit 1
        fi
    fi

    # Test API endpoints with retries
    while [ $attempt -le $MAX_RETRIES ] && [ "$backend_healthy" = false ]; do
        log "🩺 Health check attempt $attempt/$MAX_RETRIES"

        # Try primary health endpoint
        if check_api_health "$API_URL" "$HEALTH_TIMEOUT"; then
            log "✅ Primary API health check passed ($API_URL)"
            backend_healthy=true
            break
        fi

        # Try local health endpoint
        if check_api_health "$LOCAL_API_URL" "$HEALTH_TIMEOUT"; then
            log "✅ Local API health check passed ($LOCAL_API_URL)"
            backend_healthy=true
            break
        fi

        # Try fallback endpoint (just connection test)
        if check_api_health "$FALLBACK_API_URL" 5; then
            log "⚠️  Fallback connection successful, but health endpoint failed"
            # Backend is running but unhealthy - restart it
            cleanup_stray_processes
            restart_backend
        else
            log "❌ All API endpoints unreachable"

            if [ $attempt -lt $MAX_RETRIES ]; then
                log "⏳ Waiting ${RETRY_DELAY}s before retry..."
                sleep $RETRY_DELAY
                cleanup_stray_processes
                restart_backend
            fi
        fi

        attempt=$((attempt + 1))
    done

    if [ "$backend_healthy" = true ]; then
        log "✅ Backend is healthy and responsive"

        # Save last successful check
        echo "$(date '+%Y-%m-%d %H:%M:%S')" > "/var/log/beautycita-last-healthy.log"

        exit 0
    else
        log "🚨 CRITICAL: Backend health check failed after $MAX_RETRIES attempts!"

        # Log detailed PM2 status for debugging
        log "🔍 Detailed PM2 Status:"
        sudo -u "$PM2_USER" pm2 list >> "$LOG_FILE" 2>&1

        # Log system resources
        log "💻 System Status - Memory: $(free -m | grep Mem | awk '{printf "%.1f%%", $3*100/$2}'), CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}'), Disk: $(df -h / | awk 'NR==2{print $5}')"

        exit 1
    fi
}

# Rotate log file if it gets too large (> 10MB)
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0) -gt 10485760 ]; then
    mv "$LOG_FILE" "${LOG_FILE}.old"
    log "📜 Log file rotated"
fi

# Run the main function
main

log "🏁 Backend keepalive check completed"