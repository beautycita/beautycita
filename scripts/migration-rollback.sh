#!/bin/bash
################################################################################
# BeautyCita Migration Rollback Script
# Rolls back to a previous backup in case of migration issues
#
# Usage:
#   ./migration-rollback.sh --archive /path/to/backup.tar.gz [--dry-run]
#
# Features:
#   - Validates backup integrity before rollback
#   - Gracefully stops all services
#   - Creates safety backup of current state
#   - Restores database, code, and configurations
#   - Restarts services with health checks
#   - Can be run multiple times safely
################################################################################

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/var/www/beautycita.com"
TEMP_DIR="/tmp/beautycita-rollback-$$"
SAFETY_BACKUP_DIR="${PROJECT_ROOT}/backups/pre-rollback-$(date +%Y%m%d_%H%M%S)"
DRY_RUN=false
ARCHIVE_PATH=""
SKIP_SAFETY_BACKUP=false

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${YELLOW}===================================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}===================================================${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --archive)
            ARCHIVE_PATH="$2"
            shift 2
            ;;
        --skip-safety-backup)
            SKIP_SAFETY_BACKUP=true
            shift
            ;;
        --help)
            cat <<EOF
Usage: $0 --archive /path/to/backup.tar.gz [OPTIONS]

Required:
  --archive PATH          Path to the backup archive to restore

Options:
  --dry-run              Show what would be done without doing it
  --skip-safety-backup   Skip creating safety backup of current state
  --help                 Show this help message

Example:
  sudo $0 --archive /var/www/beautycita.com/backups/migration_20251008_120000/beautycita-migration-20251008_120000.tar.gz

Safety:
  This script will create a backup of the current state before rollback
  unless --skip-safety-backup is specified.
EOF
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validation
if [[ -z "$ARCHIVE_PATH" ]]; then
    log_error "Archive path is required. Use --archive /path/to/backup.tar.gz"
    exit 1
fi

if [[ ! -f "$ARCHIVE_PATH" ]]; then
    log_error "Archive file not found: $ARCHIVE_PATH"
    exit 1
fi

# Print banner
cat <<EOF

╔════════════════════════════════════════════════════════════╗
║          BeautyCita Migration Rollback Script              ║
║                                                            ║
║  WARNING: This will replace the current installation      ║
║  with the backup from the archive.                        ║
║                                                            ║
║  Dry Run: ${DRY_RUN}                                          ║
╚════════════════════════════════════════════════════════════╝

Archive: $ARCHIVE_PATH

EOF

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root"
    log_info "Please run with: sudo $0 $*"
    exit 1
fi

# Confirmation prompt
if [[ "$DRY_RUN" == false ]]; then
    log_warning "This will stop all services and restore from backup!"
    read -p "Are you sure you want to continue? (yes/no): " confirmation
    if [[ "$confirmation" != "yes" ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi
fi

# Trap to cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ -d "$TEMP_DIR" ]]; then
        log_info "Cleaning up temporary files..."
        rm -rf "$TEMP_DIR"
    fi
    exit $exit_code
}
trap cleanup EXIT INT TERM

# Function to verify archive
verify_archive() {
    log_step "Step 1: Verifying Backup Archive"

    log_info "Checking archive exists and is readable..."
    if [[ ! -r "$ARCHIVE_PATH" ]]; then
        log_error "Cannot read archive file: $ARCHIVE_PATH"
        exit 1
    fi

    log_info "Verifying archive integrity..."
    if [[ "$DRY_RUN" == false ]]; then
        if tar -tzf "$ARCHIVE_PATH" >/dev/null 2>&1; then
            log_success "Archive integrity verified"
        else
            log_error "Archive is corrupted!"
            exit 1
        fi
    fi

    # Check checksum if available
    if [[ -f "${ARCHIVE_PATH}.sha256" ]]; then
        log_info "Verifying checksum..."
        if [[ "$DRY_RUN" == false ]]; then
            cd "$(dirname "$ARCHIVE_PATH")"
            if sha256sum -c "$(basename "${ARCHIVE_PATH}").sha256" >/dev/null 2>&1; then
                log_success "Checksum verified"
            else
                log_error "Checksum verification failed!"
                exit 1
            fi
        fi
    else
        log_warning "No checksum file found"
    fi

    log_success "Archive verification complete"
}

# Function to extract archive
extract_archive() {
    log_step "Step 2: Extracting Backup Archive"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would extract to ${TEMP_DIR}"
        return 0
    fi

    mkdir -p "$TEMP_DIR"
    log_info "Extracting archive..."

    tar -xzf "$ARCHIVE_PATH" -C "$TEMP_DIR" --strip-components=1

    log_success "Archive extracted to ${TEMP_DIR}"

    # Display backup info
    if [[ -f "${TEMP_DIR}/manifest.json" ]]; then
        log_info "Backup Information:"
        jq -r '.backup_info | "  Date: \(.date)\n  Source: \(.hostname) (\(.source_ip))\n  Timestamp: \(.timestamp)"' "${TEMP_DIR}/manifest.json" 2>/dev/null || log_warning "Could not parse manifest"
    fi
}

# Function to create safety backup
create_safety_backup() {
    log_step "Step 3: Creating Safety Backup of Current State"

    if [[ "$SKIP_SAFETY_BACKUP" == true ]]; then
        log_warning "Skipping safety backup (--skip-safety-backup specified)"
        return 0
    fi

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would create safety backup at ${SAFETY_BACKUP_DIR}"
        return 0
    fi

    log_info "Creating backup of current state..."
    mkdir -p "${SAFETY_BACKUP_DIR}"

    # Backup current database
    log_info "  - Backing up current database..."
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "beautycita"; then
        sudo -u postgres pg_dump -Fc -f "${SAFETY_BACKUP_DIR}/beautycita_current.dump" beautycita
        log_success "    Current database backed up"
    fi

    # Backup current code (just the critical files)
    log_info "  - Backing up current configuration files..."
    mkdir -p "${SAFETY_BACKUP_DIR}/configs"
    cp "${PROJECT_ROOT}/.env" "${SAFETY_BACKUP_DIR}/configs/" 2>/dev/null || true
    cp "${PROJECT_ROOT}/ecosystem.config.js" "${SAFETY_BACKUP_DIR}/configs/" 2>/dev/null || true
    cp -r /etc/nginx/sites-available/*.conf "${SAFETY_BACKUP_DIR}/configs/" 2>/dev/null || true

    # Save PM2 state
    if command -v pm2 &> /dev/null; then
        sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 jlist" > "${SAFETY_BACKUP_DIR}/pm2-state.json" 2>/dev/null || true
    fi

    log_success "Safety backup created at: ${SAFETY_BACKUP_DIR}"
    log_info "If rollback fails, you can restore from this backup"
}

# Function to stop services
stop_services() {
    log_step "Step 4: Stopping Services"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would stop PM2, Nginx"
        return 0
    fi

    # Stop PM2 processes
    log_info "Stopping PM2 processes..."
    if command -v pm2 &> /dev/null; then
        sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 stop all" 2>/dev/null || log_warning "PM2 stop failed"
        log_success "PM2 processes stopped"
    fi

    # Stop Nginx
    log_info "Stopping Nginx..."
    systemctl stop nginx 2>/dev/null || log_warning "Nginx stop failed"
    log_success "Nginx stopped"

    # Give services time to stop gracefully
    sleep 2

    log_success "All services stopped"
}

# Function to restore database
restore_database() {
    log_step "Step 5: Restoring Database"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would restore database from backup"
        return 0
    fi

    # Restore globals first
    if [[ -f "${TEMP_DIR}/database/globals.sql" ]]; then
        log_info "Restoring PostgreSQL global objects..."
        sudo -u postgres psql -f "${TEMP_DIR}/database/globals.sql" 2>&1 | grep -v "ERROR.*already exists" || true
    fi

    # Restore main database
    if [[ -f "${TEMP_DIR}/database/beautycita.dump" ]]; then
        log_info "Restoring beautycita database..."

        # Terminate existing connections
        sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='beautycita' AND pid <> pg_backend_pid();" 2>/dev/null || true

        # Drop and recreate database
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS beautycita;" 2>&1 || true
        sudo -u postgres psql -c "CREATE DATABASE beautycita OWNER beautycita_app;" 2>&1 || true

        # Restore from dump
        sudo -u postgres pg_restore -d beautycita "${TEMP_DIR}/database/beautycita.dump" 2>&1 | grep -v "ERROR.*already exists" || true

        # Fix permissions
        sudo -u postgres psql -d beautycita -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO beautycita_app;" 2>&1 || true
        sudo -u postgres psql -d beautycita -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO beautycita_app;" 2>&1 || true

        log_success "Database restored"
    else
        log_error "Database dump not found in backup!"
        exit 1
    fi
}

# Function to restore code
restore_code() {
    log_step "Step 6: Restoring Codebase"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would restore code to ${PROJECT_ROOT}"
        return 0
    fi

    if [[ -f "${TEMP_DIR}/code/beautycita-code.tar.gz" ]]; then
        log_info "Removing current codebase..."

        # Backup current code just in case
        if [[ -d "${PROJECT_ROOT}" ]]; then
            mv "${PROJECT_ROOT}" "${PROJECT_ROOT}.rollback-old-$(date +%s)" 2>/dev/null || true
        fi

        log_info "Extracting codebase from backup..."
        tar -xzf "${TEMP_DIR}/code/beautycita-code.tar.gz" -C /var/www/

        # Set permissions
        chown -R www-data:www-data "${PROJECT_ROOT}"
        chmod -R 755 "${PROJECT_ROOT}"

        log_success "Codebase restored"

        # Install dependencies
        log_info "Installing dependencies..."
        cd "${PROJECT_ROOT}"

        if [[ -f "package.json" ]]; then
            sudo -u www-data npm install --production 2>&1 | tail -5
        fi

        if [[ -f "frontend/package.json" ]]; then
            cd frontend
            sudo -u www-data npm install 2>&1 | tail -5
            cd ..
        fi

        log_success "Dependencies installed"
    else
        log_error "Code archive not found in backup!"
        exit 1
    fi
}

# Function to restore media
restore_media() {
    log_step "Step 7: Restoring Media Files"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would restore media files"
        return 0
    fi

    if [[ -f "${TEMP_DIR}/media/beautycita-media.tar.gz" ]]; then
        log_info "Restoring media files..."

        # Remove existing media
        rm -rf "${PROJECT_ROOT}/media" 2>/dev/null || true

        # Extract media
        tar -xzf "${TEMP_DIR}/media/beautycita-media.tar.gz" -C "${PROJECT_ROOT}/"
        chown -R www-data:www-data "${PROJECT_ROOT}/media"

        log_success "Media files restored"
    else
        log_warning "No media files in backup"
        mkdir -p "${PROJECT_ROOT}/media"
        chown -R www-data:www-data "${PROJECT_ROOT}/media"
    fi
}

# Function to restore configurations
restore_configs() {
    log_step "Step 8: Restoring Configurations"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would restore nginx, env, and PM2 configs"
        return 0
    fi

    # Restore environment files
    log_info "Restoring environment files..."
    if [[ -f "${TEMP_DIR}/configs/env/beautycita.env" ]]; then
        cp "${TEMP_DIR}/configs/env/beautycita.env" "${PROJECT_ROOT}/.env"
        chmod 600 "${PROJECT_ROOT}/.env"
        chown www-data:www-data "${PROJECT_ROOT}/.env"
        log_success "Environment files restored"
    fi

    # Restore PM2 config
    if [[ -f "${TEMP_DIR}/configs/ecosystem.config.js" ]]; then
        cp "${TEMP_DIR}/configs/ecosystem.config.js" "${PROJECT_ROOT}/"
        chown www-data:www-data "${PROJECT_ROOT}/ecosystem.config.js"
        log_success "PM2 configuration restored"
    fi

    # Restore Nginx config
    log_info "Restoring Nginx configuration..."
    if [[ -d "${TEMP_DIR}/configs/nginx" ]]; then
        cp "${TEMP_DIR}/configs/nginx/"*.conf /etc/nginx/sites-available/ 2>/dev/null || true

        # Re-enable sites
        for conf in /etc/nginx/sites-available/*.conf; do
            if [[ -f "$conf" ]]; then
                site_name=$(basename "$conf")
                ln -sf "$conf" "/etc/nginx/sites-enabled/${site_name}" 2>/dev/null || true
            fi
        done

        log_success "Nginx configuration restored"
    fi
}

# Function to rebuild frontend
rebuild_frontend() {
    log_step "Step 9: Rebuilding Frontend"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would rebuild frontend"
        return 0
    fi

    if [[ -d "${PROJECT_ROOT}/frontend" ]]; then
        log_info "Building frontend..."
        cd "${PROJECT_ROOT}/frontend"
        sudo -u www-data npm run build 2>&1 | tail -10
        log_success "Frontend rebuilt"
    else
        log_warning "Frontend directory not found"
    fi
}

# Function to restart services
restart_services() {
    log_step "Step 10: Restarting Services"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would restart all services"
        return 0
    fi

    # Start PostgreSQL (should already be running)
    log_info "Ensuring PostgreSQL is running..."
    systemctl start postgresql 2>/dev/null || true

    # Start Redis
    log_info "Ensuring Redis is running..."
    systemctl start redis-server 2>/dev/null || true

    # Start PM2
    log_info "Starting PM2 processes..."
    cd "${PROJECT_ROOT}"
    sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 delete all" 2>/dev/null || true
    sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 start ecosystem.config.js"
    sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 save"

    # Test and start Nginx
    log_info "Testing Nginx configuration..."
    if nginx -t 2>&1; then
        log_info "Starting Nginx..."
        systemctl start nginx
        log_success "Nginx started"
    else
        log_error "Nginx configuration test failed!"
        return 1
    fi

    log_success "All services restarted"
}

# Function to run health checks
run_health_checks() {
    log_step "Step 11: Running Health Checks"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would run health checks"
        return 0
    fi

    local all_passed=true

    # Check PostgreSQL
    log_info "Checking PostgreSQL..."
    if sudo -u postgres psql -c '\l' >/dev/null 2>&1; then
        log_success "✓ PostgreSQL is running"
    else
        log_error "✗ PostgreSQL check failed"
        all_passed=false
    fi

    # Check Redis
    log_info "Checking Redis..."
    if redis-cli ping >/dev/null 2>&1; then
        log_success "✓ Redis is running"
    else
        log_error "✗ Redis check failed"
        all_passed=false
    fi

    # Check PM2
    log_info "Checking PM2 processes..."
    sleep 3  # Give PM2 time to start
    if sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 list" | grep -q "online"; then
        log_success "✓ PM2 processes are online"
    else
        log_error "✗ PM2 processes are not running"
        all_passed=false
    fi

    # Check Nginx
    log_info "Checking Nginx..."
    if systemctl is-active --quiet nginx; then
        log_success "✓ Nginx is running"
    else
        log_error "✗ Nginx is not running"
        all_passed=false
    fi

    # Check Backend API
    log_info "Checking Backend API..."
    sleep 5  # Give backend time to initialize
    if curl -s http://localhost:4000/api/health >/dev/null 2>&1; then
        log_success "✓ Backend API is responding"
    else
        log_warning "⚠ Backend API not responding (may need more time)"
    fi

    if [[ "$all_passed" == true ]]; then
        log_success "All health checks passed!"
        return 0
    else
        log_error "Some health checks failed"
        return 1
    fi
}

# Function to show rollback summary
show_summary() {
    log_step "Rollback Complete!"

    cat <<EOF

╔════════════════════════════════════════════════════════════╗
║              Rollback Successfully Completed               ║
╚════════════════════════════════════════════════════════════╝

✅ The system has been rolled back to the backup

📋 What was restored:
   - Database (beautycita)
   - Application code
   - Media files
   - Nginx configuration
   - Environment files
   - PM2 configuration

💾 Safety backup location:
   ${SAFETY_BACKUP_DIR}

🔍 Verify the rollback:
   - Visit your website: https://beautycita.com
   - Check backend: curl http://localhost:4000/api/health
   - View logs: sudo -u www-data pm2 logs
   - Check PM2: sudo -u www-data pm2 status

⚠️  If something is wrong:
   - Check logs: /var/www/beautycita.com/backend/logs/
   - Restart services: sudo -u www-data pm2 restart all
   - Nginx reload: sudo systemctl reload nginx

📚 For more help, see:
   ${PROJECT_ROOT}/CLAUDE.md

EOF
}

# Main execution
main() {
    verify_archive
    extract_archive
    create_safety_backup
    stop_services
    restore_database
    restore_code
    restore_media
    restore_configs
    rebuild_frontend
    restart_services
    run_health_checks

    if [[ "$DRY_RUN" == false ]]; then
        show_summary
    else
        log_info ""
        log_info "Dry run complete. No changes were made."
        log_info "Run without --dry-run to perform actual rollback."
    fi

    log_success "Rollback process completed!"
}

# Execute
main
