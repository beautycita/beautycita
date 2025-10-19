#!/bin/bash

# BeautyCita Auto-Fix Script
# Detects and remediates common system issues

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="/var/log/beautycita/auto-fix.log"
mkdir -p /var/log/beautycita
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔧 BeautyCita Auto-Fix - $(date)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Auto-fix flag (default: check only, use --fix to auto-remediate)
AUTO_FIX=false
if [[ "${1:-}" == "--fix" ]]; then
    AUTO_FIX=true
    echo -e "${YELLOW}⚠️  AUTO-FIX MODE ENABLED${NC}"
fi

ISSUES_FOUND=0
ISSUES_FIXED=0

# ============================================================================
# 1. CHECK PM2 PROCESSES
# ============================================================================
echo ""
echo -e "${BLUE}[1/8] Checking PM2 processes...${NC}"

# Check PM2 as www-data (the user running the processes)
pm2_online=$(su - www-data -s /bin/bash -c "pm2 jlist 2>/dev/null | jq '[.[] | select(.pm2_env.status == \"online\")] | length' 2>/dev/null" || echo "0")
pm2_total=$(su - www-data -s /bin/bash -c "pm2 jlist 2>/dev/null | jq '. | length' 2>/dev/null" || echo "0")

if [ "$pm2_online" -eq "$pm2_total" ] && [ "$pm2_total" -gt 0 ]; then
    echo -e "${GREEN}✅ PM2: $pm2_online/$pm2_total processes running${NC}"
else
    echo -e "${RED}❌ PM2: Only $pm2_online/$pm2_total processes running${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))

    if [ "$AUTO_FIX" = true ]; then
        echo "   🔧 Restarting PM2 processes as www-data..."
        su - www-data -s /bin/bash -c "pm2 restart all" || true
        sleep 2
        pm2_check=$(su - www-data -s /bin/bash -c "pm2 jlist 2>/dev/null | jq '[.[] | select(.pm2_env.status == \"online\")] | length' 2>/dev/null" || echo "0")
        if [ "$pm2_check" -gt "$pm2_online" ]; then
            echo -e "${GREEN}   ✓ Fixed: $pm2_check processes now online${NC}"
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        else
            echo -e "${RED}   ✗ Fix failed${NC}"
        fi
    fi
fi

# ============================================================================
# 2. CHECK FOR STRAY PROCESSES
# ============================================================================
echo ""
echo -e "${BLUE}[2/8] Checking for stray Node processes...${NC}"

# Check for stray www-data node processes (exclude legitimate system processes)
# Legitimate processes to exclude:
# - node_exporter (monitoring)
# - Python/uvicorn (AI backend)
# - npm update checks (temporary)
# - Processes with PM2 context
stray_count=$(ps aux | grep www-data | grep -E "node" | grep -v grep | grep -v pm2 | grep -v "PM2" | grep -v "node_exporter" | wc -l || echo "0")

# Check if PM2 is managing processes - if PM2 is running, www-data node processes are expected
pm2_running=$(su - www-data -s /bin/bash -c "pm2 list 2>/dev/null | grep -c online" || echo "0")

if [ "$pm2_running" -gt 0 ]; then
    # PM2 is managing processes, so www-data node processes are expected
    echo -e "${GREEN}✅ PM2 managing $pm2_running process(es) - Node processes under PM2 control${NC}"
elif [ "$stray_count" -eq 0 ]; then
    echo -e "${GREEN}✅ No stray Node processes${NC}"
else
    echo -e "${YELLOW}⚠️  Found $stray_count stray www-data Node process(es) (PM2 not managing)${NC}"
    ps aux | grep www-data | grep -E "node" | grep -v grep | grep -v pm2 | grep -v "PM2" | grep -v "node_exporter" | awk '{print "   PID "$2": "$11" "$12" "$13}'
    ISSUES_FOUND=$((ISSUES_FOUND + 1))

    if [ "$AUTO_FIX" = true ]; then
        echo "   🔧 Killing stray www-data processes..."
        pkill -9 -u www-data node 2>/dev/null || true
        sleep 1
        stray_check=$(ps aux | grep www-data | grep -E "node" | grep -v grep | grep -v pm2 | grep -v "PM2" | grep -v "node_exporter" | wc -l || echo "0")
        if [ "$stray_check" -eq 0 ]; then
            echo -e "${GREEN}   ✓ Fixed: Stray processes killed${NC}"
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
            # Restart PM2 to ensure proper processes are running
            su - www-data -s /bin/bash -c "pm2 restart all" || true
        else
            echo -e "${RED}   ✗ Fix failed: $stray_check processes remain${NC}"
        fi
    fi
fi

# ============================================================================
# 3. CHECK DATABASE CONNECTION
# ============================================================================
echo ""
echo -e "${BLUE}[3/8] Checking PostgreSQL database...${NC}"

if PGPASSWORD=postgres psql -U postgres -h localhost -d beautycita -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database: Connected${NC}"
else
    echo -e "${RED}❌ Database: Connection failed${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))

    if [ "$AUTO_FIX" = true ]; then
        echo "   🔧 Restarting PostgreSQL..."
        systemctl restart postgresql
        sleep 3
        if PGPASSWORD=postgres psql -U postgres -h localhost -d beautycita -c "SELECT 1;" >/dev/null 2>&1; then
            echo -e "${GREEN}   ✓ Fixed: Database reconnected${NC}"
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        else
            echo -e "${RED}   ✗ Fix failed${NC}"
        fi
    fi
fi

# ============================================================================
# 4. CHECK REDIS
# ============================================================================
echo ""
echo -e "${BLUE}[4/8] Checking Redis...${NC}"

if timeout 5 redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis: Connected${NC}"
else
    echo -e "${RED}❌ Redis: Connection failed${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))

    if [ "$AUTO_FIX" = true ]; then
        echo "   🔧 Restarting Redis..."
        systemctl restart redis-server
        sleep 2
        if timeout 5 redis-cli ping >/dev/null 2>&1; then
            echo -e "${GREEN}   ✓ Fixed: Redis reconnected${NC}"
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        else
            echo -e "${RED}   ✗ Fix failed${NC}"
        fi
    fi
fi

# ============================================================================
# 5. CHECK BACKEND API RESPONSE
# ============================================================================
echo ""
echo -e "${BLUE}[5/8] Checking backend API...${NC}"

api_response=$(curl -s --max-time 10 https://beautycita.com/api/health || echo "FAILED")

if [[ "$api_response" == *"ok"* ]] || [[ "$api_response" == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Backend API: Responding${NC}"
else
    echo -e "${RED}❌ Backend API: Not responding${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))

    if [ "$AUTO_FIX" = true ]; then
        echo "   🔧 Restarting backend (kill stray processes + PM2 restart)..."
        pkill -9 -u www-data node 2>/dev/null || true
        sleep 2
        su - www-data -s /bin/bash -c "pm2 restart beautycita-api" || true
        sleep 5
        api_check=$(curl -s --max-time 10 https://beautycita.com/api/health || echo "FAILED")
        if [[ "$api_check" == *"ok"* ]] || [[ "$api_check" == *"healthy"* ]]; then
            echo -e "${GREEN}   ✓ Fixed: Backend API now responding${NC}"
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        else
            echo -e "${RED}   ✗ Fix failed${NC}"
        fi
    fi
fi

# ============================================================================
# 6. CHECK DISK SPACE
# ============================================================================
echo ""
echo -e "${BLUE}[6/8] Checking disk space...${NC}"

disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$disk_usage" -lt 85 ]; then
    echo -e "${GREEN}✅ Disk space: ${disk_usage}% used${NC}"
elif [ "$disk_usage" -lt 95 ]; then
    echo -e "${YELLOW}⚠️  Disk space: ${disk_usage}% used (high)${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))

    if [ "$AUTO_FIX" = true ]; then
        echo "   🔧 Cleaning up old logs and temp files..."
        journalctl --vacuum-time=7d >/dev/null 2>&1 || true
        find /tmp -type f -atime +7 -delete 2>/dev/null || true
        find /var/log -type f -name "*.log.*" -mtime +30 -delete 2>/dev/null || true
        pm2 flush 2>/dev/null || true
        disk_check=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
        freed=$((disk_usage - disk_check))
        if [ "$freed" -gt 0 ]; then
            echo -e "${GREEN}   ✓ Fixed: Freed ${freed}% disk space (now ${disk_check}%)${NC}"
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        else
            echo -e "${YELLOW}   ⚠ Minimal space freed${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Disk space: ${disk_usage}% used (CRITICAL)${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))

    if [ "$AUTO_FIX" = true ]; then
        echo -e "${RED}   ⚠️  CRITICAL disk space - manual intervention required${NC}"
    fi
fi

# ============================================================================
# 7. CHECK NGINX STATUS
# ============================================================================
echo ""
echo -e "${BLUE}[7/8] Checking Nginx...${NC}"

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx: Running${NC}"
else
    echo -e "${RED}❌ Nginx: Not running${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))

    if [ "$AUTO_FIX" = true ]; then
        echo "   🔧 Starting Nginx..."
        systemctl start nginx
        sleep 1
        if systemctl is-active --quiet nginx; then
            echo -e "${GREEN}   ✓ Fixed: Nginx started${NC}"
            ISSUES_FIXED=$((ISSUES_FIXED + 1))
        else
            echo -e "${RED}   ✗ Fix failed${NC}"
        fi
    fi
fi

# ============================================================================
# 8. CHECK FILE OWNERSHIP (WEBAPP FILES)
# ============================================================================
echo ""
echo -e "${BLUE}[8/8] Checking critical file ownership...${NC}"

ownership_issues=0
critical_files=(
    "/var/www/beautycita.com/.env"
    "/var/www/beautycita.com/ecosystem.config.js"
    "/var/www/beautycita.com/backend/server.js"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        owner=$(stat -c '%U:%G' "$file")
        if [ "$owner" != "www-data:www-data" ]; then
            echo -e "${YELLOW}   ⚠️  $file owned by $owner (should be www-data:www-data)${NC}"
            ownership_issues=$((ownership_issues + 1))
        fi
    fi
done

if [ "$ownership_issues" -eq 0 ]; then
    echo -e "${GREEN}✅ File ownership: All critical files correct${NC}"
else
    echo -e "${YELLOW}⚠️  File ownership: $ownership_issues issues found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))

    if [ "$AUTO_FIX" = true ]; then
        echo "   🔧 Fixing file ownership..."
        for file in "${critical_files[@]}"; do
            if [ -f "$file" ]; then
                chown www-data:www-data "$file"
            fi
        done
        echo -e "${GREEN}   ✓ Fixed: Critical files now owned by www-data:www-data${NC}"
        ISSUES_FIXED=$((ISSUES_FIXED + 1))
    fi
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Issues found: $ISSUES_FOUND"

if [ "$AUTO_FIX" = true ]; then
    echo "Issues fixed: $ISSUES_FIXED"
    if [ "$ISSUES_FIXED" -eq "$ISSUES_FOUND" ]; then
        echo -e "${GREEN}✅ All issues resolved${NC}"
        exit 0
    elif [ "$ISSUES_FIXED" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Some issues remain - manual intervention required${NC}"
        exit 1
    else
        echo -e "${RED}❌ Auto-fix failed - manual intervention required${NC}"
        exit 2
    fi
else
    if [ "$ISSUES_FOUND" -eq 0 ]; then
        echo -e "${GREEN}✅ System healthy${NC}"
        exit 0
    else
        echo ""
        echo -e "${YELLOW}Run with --fix to auto-remediate issues:${NC}"
        echo "  sudo /var/www/beautycita.com/scripts/auto-fix.sh --fix"
        exit 1
    fi
fi
