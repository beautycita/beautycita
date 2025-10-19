#!/bin/bash

# BeautyCita Log Viewer Script
# Provides easy access to server logs without PM2 timeout issues

set -e

LOG_DIR="/var/www/beautycita.com/backend/logs"

show_help() {
    echo "BeautyCita Log Viewer"
    echo "Usage: $0 [OPTIONS] [LOG_TYPE]"
    echo ""
    echo "LOG_TYPE:"
    echo "  combined  - Main server logs (default)"
    echo "  chat      - Chat/AI assistant logs"
    echo "  auth      - Authentication logs"
    echo "  error     - Error logs only"
    echo "  all       - Show all log files"
    echo ""
    echo "OPTIONS:"
    echo "  -f, --follow    Follow log output (like tail -f)"
    echo "  -n, --lines N   Show last N lines (default: 50)"
    echo "  -h, --help      Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                    # Show last 50 lines of combined logs"
    echo "  $0 -f chat           # Follow chat logs in real-time"
    echo "  $0 -n 100 combined   # Show last 100 lines of combined logs"
    echo "  $0 all               # Show all available logs"
}

# Default values
FOLLOW=false
LINES=50
LOG_TYPE="combined"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        combined|chat|auth|error|all)
            LOG_TYPE="$1"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Function to display formatted logs
show_logs() {
    local log_file="$1"
    local log_name="$2"

    if [[ ! -f "$log_file" ]]; then
        echo "❌ Log file not found: $log_file"
        return 1
    fi

    echo "📋 === $log_name Logs ==="
    echo "📂 File: $log_file"
    echo "📅 Last modified: $(stat -c %y "$log_file" 2>/dev/null || echo "unknown")"
    echo "📊 Size: $(du -h "$log_file" 2>/dev/null | cut -f1 || echo "unknown")"
    echo "----------------------------------------"

    if [[ "$FOLLOW" == true ]]; then
        echo "👁️  Following logs (Ctrl+C to stop)..."
        tail -f -n "$LINES" "$log_file" | while IFS= read -r line; do
            # Pretty print JSON logs
            if [[ "$line" =~ ^\{.*\}$ ]]; then
                echo "$line" | jq -r '. | "\(.timestamp // "no-time") [\(.level // "INFO")] \(.message)"' 2>/dev/null || echo "$line"
            else
                echo "$line"
            fi
        done
    else
        echo "📖 Last $LINES lines:"
        tail -n "$LINES" "$log_file" | while IFS= read -r line; do
            # Pretty print JSON logs
            if [[ "$line" =~ ^\{.*\}$ ]]; then
                echo "$line" | jq -r '. | "\(.timestamp // "no-time") [\(.level // "INFO")] \(.message)"' 2>/dev/null || echo "$line"
            else
                echo "$line"
            fi
        done
    fi
    echo ""
}

# Handle different log types
case $LOG_TYPE in
    combined)
        show_logs "$LOG_DIR/combined.log" "Combined Server"
        ;;
    chat)
        show_logs "$LOG_DIR/chat.log" "Chat/AI Assistant"
        ;;
    auth)
        show_logs "$LOG_DIR/auth.log" "Authentication"
        ;;
    error)
        if [[ -f "$LOG_DIR/error.log" ]]; then
            show_logs "$LOG_DIR/error.log" "Error"
        else
            echo "❌ No error log file found"
        fi
        ;;
    all)
        echo "🔍 Available log files in $LOG_DIR:"
        ls -la "$LOG_DIR"/*.log 2>/dev/null || echo "❌ No log files found"
        echo ""

        for log_file in "$LOG_DIR"/*.log; do
            if [[ -f "$log_file" ]] && [[ -s "$log_file" ]]; then
                log_name=$(basename "$log_file" .log)
                show_logs "$log_file" "$log_name"
            fi
        done
        ;;
    *)
        echo "❌ Unknown log type: $LOG_TYPE"
        show_help
        exit 1
        ;;
esac