#!/bin/bash

# BeautyCita Health Monitor
# Comprehensive system monitoring and alerting script

set -euo pipefail

# Configuration
MONITOR_DIR="/var/log/beautycita-monitoring"
LOG_FILE="$MONITOR_DIR/health-monitor.log"
ALERT_FILE="$MONITOR_DIR/alerts.json"
CONFIG_FILE="/var/www/beautycita.com/monitoring-config.json"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85
RESPONSE_TIME_THRESHOLD=3000  # milliseconds

mkdir -p "$MONITOR_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Get current timestamp
get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%S.%3NZ"
}

# Check system CPU usage
check_cpu() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    local cpu_percent=$(echo "$cpu_usage" | sed 's/[^0-9.]//')

    echo "{\"metric\": \"cpu_usage\", \"value\": $cpu_percent, \"threshold\": $CPU_THRESHOLD, \"status\": \"$([ $(echo "$cpu_percent > $CPU_THRESHOLD" | bc -l) -eq 1 ] && echo "critical" || echo "ok")\", \"timestamp\": \"$(get_timestamp)\"}"
}

# Check memory usage
check_memory() {
    local memory_info=$(free | grep Mem)
    local total=$(echo $memory_info | awk '{print $2}')
    local used=$(echo $memory_info | awk '{print $3}')
    local memory_percent=$(echo "scale=2; $used * 100 / $total" | bc)

    echo "{\"metric\": \"memory_usage\", \"value\": $memory_percent, \"threshold\": $MEMORY_THRESHOLD, \"status\": \"$([ $(echo "$memory_percent > $MEMORY_THRESHOLD" | bc -l) -eq 1 ] && echo "critical" || echo "ok")\", \"timestamp\": \"$(get_timestamp)\"}"
}

# Check disk usage
check_disk() {
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    echo "{\"metric\": \"disk_usage\", \"value\": $disk_usage, \"threshold\": $DISK_THRESHOLD, \"status\": \"$([ $disk_usage -gt $DISK_THRESHOLD ] && echo "critical" || echo "ok")\", \"timestamp\": \"$(get_timestamp)\"}"
}

# Check PostgreSQL database
check_database() {
    local start_time=$(date +%s%3N)

    if PGPASSWORD=$(cd /var/www/beautycita.com && node -e "
        const loader = require('./secure-env-loader');
        loader.loadSecureEnv();
        process.stdout.write(process.env.DB_PASSWORD);
    " 2>/dev/null) psql -h localhost -U beautycita_app -d beautycita -c "SELECT 1;" > /dev/null 2>&1; then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        local status=$([ $response_time -gt $RESPONSE_TIME_THRESHOLD ] && echo "warning" || echo "ok")
        echo "{\"metric\": \"database_connectivity\", \"value\": $response_time, \"threshold\": $RESPONSE_TIME_THRESHOLD, \"status\": \"$status\", \"timestamp\": \"$(get_timestamp)\"}"
    else
        echo "{\"metric\": \"database_connectivity\", \"value\": -1, \"threshold\": $RESPONSE_TIME_THRESHOLD, \"status\": \"critical\", \"timestamp\": \"$(get_timestamp)\"}"
    fi
}

# Check Redis
check_redis() {
    if redis-cli ping > /dev/null 2>&1; then
        local response_time=$(redis-cli --latency-history -i 1 -c 1 2>/dev/null | tail -1 | awk '{print $4}' || echo "1")
        echo "{\"metric\": \"redis_connectivity\", \"value\": ${response_time:-1}, \"threshold\": 100, \"status\": \"ok\", \"timestamp\": \"$(get_timestamp)\"}"
    else
        echo "{\"metric\": \"redis_connectivity\", \"value\": -1, \"threshold\": 100, \"status\": \"critical\", \"timestamp\": \"$(get_timestamp)\"}"
    fi
}

# Check web application
check_web_app() {
    local start_time=$(date +%s%3N)
    local http_code=$(curl -o /dev/null -s -w "%{http_code}" https://beautycita.com/api/health)
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))

    if [ "$http_code" = "200" ]; then
        local status=$([ $response_time -gt $RESPONSE_TIME_THRESHOLD ] && echo "warning" || echo "ok")
        echo "{\"metric\": \"web_app_response\", \"value\": $response_time, \"threshold\": $RESPONSE_TIME_THRESHOLD, \"status\": \"$status\", \"timestamp\": \"$(get_timestamp)\"}"
    else
        echo "{\"metric\": \"web_app_response\", \"value\": -1, \"threshold\": $RESPONSE_TIME_THRESHOLD, \"status\": \"critical\", \"timestamp\": \"$(get_timestamp)\"}"
    fi
}

# Check SSL certificate expiration
check_ssl_cert() {
    local cert_expiry=$(echo | openssl s_client -servername beautycita.com -connect beautycita.com:443 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
    local expiry_timestamp=$(date -d "$cert_expiry" +%s)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))

    local status="ok"
    if [ $days_until_expiry -lt 7 ]; then
        status="critical"
    elif [ $days_until_expiry -lt 30 ]; then
        status="warning"
    fi

    echo "{\"metric\": \"ssl_cert_expiry\", \"value\": $days_until_expiry, \"threshold\": 30, \"status\": \"$status\", \"timestamp\": \"$(get_timestamp)\"}"
}

# Check PM2 processes
check_pm2_processes() {
    local pm2_status=$(pm2 jlist 2>/dev/null || echo "[]")
    local running_processes=$(echo "$pm2_status" | jq '[.[] | select(.pm2_env.status == "online")] | length')
    local total_processes=$(echo "$pm2_status" | jq '. | length')

    if [ "$running_processes" -eq "$total_processes" ] && [ "$total_processes" -gt 0 ]; then
        echo "{\"metric\": \"pm2_processes\", \"value\": $running_processes, \"threshold\": $total_processes, \"status\": \"ok\", \"timestamp\": \"$(get_timestamp)\"}"
    else
        echo "{\"metric\": \"pm2_processes\", \"value\": $running_processes, \"threshold\": $total_processes, \"status\": \"critical\", \"timestamp\": \"$(get_timestamp)\"}"
    fi
}

# Check backup status
check_backup_status() {
    local latest_backup=$(find /var/backups/beautycita -name "*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [ -n "$latest_backup" ]; then
        local backup_age_hours=$(( ($(date +%s) - $(stat -c %Y "$latest_backup")) / 3600 ))
        local status=$([ $backup_age_hours -gt 26 ] && echo "warning" || echo "ok")
        echo "{\"metric\": \"backup_status\", \"value\": $backup_age_hours, \"threshold\": 26, \"status\": \"$status\", \"timestamp\": \"$(get_timestamp)\"}"
    else
        echo "{\"metric\": \"backup_status\", \"value\": -1, \"threshold\": 26, \"status\": \"critical\", \"timestamp\": \"$(get_timestamp)\"}"
    fi
}

# Generate alerts
generate_alerts() {
    local metrics="$1"
    local alerts="[]"

    while IFS= read -r metric; do
        if [ -n "$metric" ]; then
            local status=$(echo "$metric" | jq -r '.status')
            if [ "$status" = "critical" ] || [ "$status" = "warning" ]; then
                alerts=$(echo "$alerts" | jq ". + [$metric]")
            fi
        fi
    done <<< "$metrics"

    echo "$alerts" > "$ALERT_FILE"

    # Count critical alerts
    local critical_count=$(echo "$alerts" | jq '[.[] | select(.status == "critical")] | length')
    local warning_count=$(echo "$alerts" | jq '[.[] | select(.status == "warning")] | length')

    if [ "$critical_count" -gt 0 ]; then
        log "🚨 CRITICAL: $critical_count critical alerts detected"
        return 2
    elif [ "$warning_count" -gt 0 ]; then
        log "⚠️  WARNING: $warning_count warnings detected"
        return 1
    else
        log "✅ All systems healthy"
        return 0
    fi
}

# Send notification (placeholder for future integration)
send_notification() {
    local level=$1
    local message=$2

    # Future: Integrate with email, Slack, or webhook
    log "NOTIFICATION [$level]: $message"

    # For now, just append to a notifications file
    echo "{\"level\": \"$level\", \"message\": \"$message\", \"timestamp\": \"$(get_timestamp)\"}" >> "$MONITOR_DIR/notifications.jsonl"
}

# Main monitoring function
run_monitoring() {
    log "Starting health monitoring cycle"

    local all_metrics=""

    # Collect all metrics
    all_metrics+="$(check_cpu)"$'\n'
    all_metrics+="$(check_memory)"$'\n'
    all_metrics+="$(check_disk)"$'\n'
    all_metrics+="$(check_database)"$'\n'
    all_metrics+="$(check_redis)"$'\n'
    all_metrics+="$(check_web_app)"$'\n'
    all_metrics+="$(check_ssl_cert)"$'\n'
    all_metrics+="$(check_pm2_processes)"$'\n'
    all_metrics+="$(check_backup_status)"$'\n'

    # Save metrics to file
    echo "$all_metrics" | jq -s '.' > "$MONITOR_DIR/latest-metrics.json" 2>/dev/null || true

    # Generate alerts and get status
    if ! generate_alerts "$all_metrics"; then
        local exit_code=$?
        if [ $exit_code -eq 2 ]; then
            send_notification "CRITICAL" "Critical system issues detected - immediate attention required"
        elif [ $exit_code -eq 1 ]; then
            send_notification "WARNING" "System warnings detected - monitoring recommended"
        fi
    fi

    log "Health monitoring cycle completed"
}

# CLI usage
case "${1:-monitor}" in
    "monitor"|"")
        run_monitoring
        ;;
    "status")
        if [ -f "$MONITOR_DIR/latest-metrics.json" ]; then
            echo "Latest Health Status:"
            cat "$MONITOR_DIR/latest-metrics.json" | jq '.[] | {metric: .metric, value: .value, status: .status}'
        else
            echo "No monitoring data available. Run monitoring first."
        fi
        ;;
    "alerts")
        if [ -f "$ALERT_FILE" ]; then
            echo "Current Alerts:"
            cat "$ALERT_FILE" | jq '.[]'
        else
            echo "No alerts found."
        fi
        ;;
    "install-cron")
        # Add to crontab if not already present
        if ! crontab -l 2>/dev/null | grep -q "health-monitor.sh"; then
            (crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/beautycita.com/scripts/health-monitor.sh monitor") | crontab -
            echo "Health monitoring scheduled to run every 5 minutes"
        else
            echo "Health monitoring already scheduled in crontab"
        fi
        ;;
    *)
        echo "Usage: $0 [monitor|status|alerts|install-cron]"
        echo "  monitor      - Run monitoring cycle (default)"
        echo "  status       - Show latest system status"
        echo "  alerts       - Show current alerts"
        echo "  install-cron - Install monitoring in crontab"
        ;;
esac