#!/bin/bash
# Query frontend logs from Loki
# Usage: ./query-frontend-logs.sh [search_term] [minutes_ago]

SEARCH_TERM="${1:-ONBOARDING}"
MINUTES_AGO="${2:-5}"
START_TIME=$(date -d "$MINUTES_AGO minutes ago" +%s)000000000

echo "🔍 Searching frontend logs for: $SEARCH_TERM"
echo "📅 From: $(date -d "$MINUTES_AGO minutes ago")"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -s "http://localhost:3100/loki/api/v1/query_range?query={filename=\"/var/www/beautycita.com/backend/logs/frontend.log\"}|=\"$SEARCH_TERM\"&start=${START_TIME}&limit=100" \
  | jq -r '.data.result[].values[]?[1]' 2>/dev/null \
  | while IFS= read -r line; do
      echo "$line" | jq -r '"\(.timestamp) [\(.level)] \(.message)"' 2>/dev/null || echo "$line"
    done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
