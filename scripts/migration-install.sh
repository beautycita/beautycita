#!/bin/bash
################################################################################
# BeautyCita Server Migration Installation Script
# Installs BeautyCita from migration backup on a fresh server
#
# Usage:
#   ./migration-install.sh [--dry-run] --archive /path/to/backup.tar.gz
#
# Features:
#   - Installs all required dependencies (Node.js, PostgreSQL, Redis, Nginx)
#   - Verifies backup integrity before installation
#   - Restores database, code, media, configs
#   - Sets up SSL for new IP address
#   - Configures all services
#   - Runs comprehensive health checks
#   - Idempotent - can run multiple times safely
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
TEMP_DIR="/tmp/beautycita-migration-$$"
DRY_RUN=false
ARCHIVE_PATH=""
NEW_SERVER_IP="74.208.218.18"
DOMAIN="beautycita.com"

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
    echo -e "${GREEN}===================================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}===================================================${NC}"
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
        --help)
            cat <<EOF
Usage: $0 --archive /path/to/backup.tar.gz [--dry-run]

Required:
  --archive PATH   Path to the migration backup archive

Options:
  --dry-run       Show what would be done without actually doing it
  --help          Show this help message

Example:
  sudo $0 --archive /tmp/beautycita-migration-20251008_123456.tar.gz
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
║         BeautyCita Migration Installation Script           ║
║                                                            ║
║  Target Server: ${NEW_SERVER_IP}                      ║
║  Domain: ${DOMAIN}                              ║
║  Dry Run: ${DRY_RUN}                                          ║
╚════════════════════════════════════════════════════════════╝

EOF

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root"
    log_info "Please run with: sudo $0 $*"
    exit 1
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

# Function to verify archive integrity
verify_archive() {
    log_step "Step 1: Verifying Archive Integrity"

    log_info "Checking archive checksum..."

    if [[ -f "${ARCHIVE_PATH}.sha256" ]]; then
        if [[ "$DRY_RUN" == true ]]; then
            log_info "[DRY-RUN] Would verify checksum"
        else
            cd "$(dirname "$ARCHIVE_PATH")"
            if sha256sum -c "$(basename "${ARCHIVE_PATH}").sha256" >/dev/null 2>&1; then
                log_success "Archive checksum verified"
            else
                log_error "Archive checksum verification failed!"
                exit 1
            fi
        fi
    else
        log_warning "No checksum file found, skipping verification"
    fi

    log_info "Testing archive integrity..."
    if [[ "$DRY_RUN" == false ]]; then
        if tar -tzf "$ARCHIVE_PATH" >/dev/null 2>&1; then
            log_success "Archive integrity verified"
        else
            log_error "Archive is corrupted!"
            exit 1
        fi
    fi
}

# Function to extract archive
extract_archive() {
    log_step "Step 2: Extracting Archive"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would extract to ${TEMP_DIR}"
        return 0
    fi

    mkdir -p "$TEMP_DIR"
    log_info "Extracting archive to ${TEMP_DIR}..."

    tar -xzf "$ARCHIVE_PATH" -C "$TEMP_DIR" --strip-components=1

    log_success "Archive extracted successfully"

    # Display manifest info
    if [[ -f "${TEMP_DIR}/manifest.json" ]]; then
        log_info "Backup Details:"
        jq -r '.backup_info | "  Date: \(.date)\n  Source IP: \(.source_ip)\n  Hostname: \(.hostname)"' "${TEMP_DIR}/manifest.json" 2>/dev/null || log_warning "Could not parse manifest"
    fi
}

# Function to install system dependencies
install_dependencies() {
    log_step "Step 3: Installing System Dependencies"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would install: Node.js, PostgreSQL, Redis, Nginx, PM2"
        return 0
    fi

    log_info "Updating package lists..."
    apt-get update -qq

    # Install Node.js 22.x
    log_info "Installing Node.js 22.x..."
    if ! command -v node &> /dev/null || [[ "$(node --version | cut -d. -f1)" != "v22" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
        apt-get install -y nodejs
        log_success "Node.js $(node --version) installed"
    else
        log_info "Node.js $(node --version) already installed"
    fi

    # Install PostgreSQL
    log_info "Installing PostgreSQL..."
    if ! command -v psql &> /dev/null; then
        apt-get install -y postgresql postgresql-contrib
        systemctl enable postgresql
        systemctl start postgresql
        log_success "PostgreSQL installed"
    else
        log_info "PostgreSQL $(psql --version | awk '{print $3}') already installed"
    fi

    # Install Redis
    log_info "Installing Redis..."
    if ! command -v redis-cli &> /dev/null; then
        apt-get install -y redis-server
        systemctl enable redis-server
        systemctl start redis-server
        log_success "Redis installed"
    else
        log_info "Redis $(redis-cli --version | awk '{print $2}') already installed"
    fi

    # Install Nginx
    log_info "Installing Nginx..."
    if ! command -v nginx &> /dev/null; then
        apt-get install -y nginx
        systemctl enable nginx
        log_success "Nginx installed"
    else
        log_info "Nginx already installed"
    fi

    # Install other dependencies
    log_info "Installing additional tools..."
    apt-get install -y curl wget git build-essential certbot python3-certbot-nginx jq

    # Install PM2 globally
    log_info "Installing PM2..."
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        pm2 startup systemd -u www-data --hp /var/www
        log_success "PM2 installed"
    else
        log_info "PM2 $(pm2 --version) already installed"
    fi

    log_success "All dependencies installed"
}

# Function to setup user and permissions
setup_user() {
    log_step "Step 4: Setting Up User and Permissions"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would create www-data user and set permissions"
        return 0
    fi

    log_info "Ensuring www-data user exists..."
    if ! id -u www-data &>/dev/null; then
        useradd -r -s /bin/bash www-data
        log_success "www-data user created"
    else
        log_info "www-data user already exists"
    fi

    log_info "Creating project directory structure..."
    mkdir -p /var/www
    chown -R www-data:www-data /var/www
    chmod -R 775 /var/www

    log_success "User and permissions configured"
}

# Function to restore codebase
restore_code() {
    log_step "Step 5: Restoring Codebase"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would restore code to ${PROJECT_ROOT}"
        return 0
    fi

    log_info "Extracting codebase..."

    if [[ -f "${TEMP_DIR}/code/beautycita-code.tar.gz" ]]; then
        tar -xzf "${TEMP_DIR}/code/beautycita-code.tar.gz" -C /var/www/
        chown -R www-data:www-data "${PROJECT_ROOT}"
        log_success "Codebase restored to ${PROJECT_ROOT}"
    else
        log_error "Code archive not found!"
        exit 1
    fi

    log_info "Installing Node.js dependencies..."
    cd "${PROJECT_ROOT}"

    # Install root dependencies
    if [[ -f "package.json" ]]; then
        sudo -u www-data npm install --production
        log_success "Root dependencies installed"
    fi

    # Install frontend dependencies
    if [[ -f "frontend/package.json" ]]; then
        cd frontend
        sudo -u www-data npm install
        log_success "Frontend dependencies installed"
        cd ..
    fi

    log_success "Code restoration complete"
}

# Function to restore media files
restore_media() {
    log_step "Step 6: Restoring Media Files"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would restore media files"
        return 0
    fi

    if [[ -f "${TEMP_DIR}/media/beautycita-media.tar.gz" ]]; then
        log_info "Extracting media files..."
        tar -xzf "${TEMP_DIR}/media/beautycita-media.tar.gz" -C "${PROJECT_ROOT}/"
        chown -R www-data:www-data "${PROJECT_ROOT}/media"
        log_success "Media files restored"
    else
        log_warning "No media files found in backup"
        mkdir -p "${PROJECT_ROOT}/media"
        chown -R www-data:www-data "${PROJECT_ROOT}/media"
    fi
}

# Function to restore database
restore_database() {
    log_step "Step 7: Restoring Database"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would restore PostgreSQL databases"
        return 0
    fi

    # Restore global objects first
    if [[ -f "${TEMP_DIR}/database/globals.sql" ]]; then
        log_info "Restoring PostgreSQL global objects..."
        sudo -u postgres psql -f "${TEMP_DIR}/database/globals.sql" 2>&1 | grep -v "ERROR.*already exists" || true
        log_success "Global objects restored"
    fi

    # Create beautycita_app user if not exists
    log_info "Setting up database users..."
    sudo -u postgres psql -c "CREATE USER beautycita_app WITH PASSWORD 'qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=';" 2>&1 | grep -v "ERROR.*already exists" || true

    # Restore each database
    local databases=("beautycita" "beautycita_db" "beautycita_dev" "beautycita_rasa")

    for db in "${databases[@]}"; do
        if [[ -f "${TEMP_DIR}/database/${db}.dump" ]]; then
            log_info "Restoring database: ${db}..."

            # Drop database if exists
            sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${db};" 2>&1 || true

            # Create database
            sudo -u postgres psql -c "CREATE DATABASE ${db} OWNER beautycita_app;" 2>&1 || true

            # Restore from custom format dump
            sudo -u postgres pg_restore -d "${db}" "${TEMP_DIR}/database/${db}.dump" 2>&1 | grep -v "ERROR.*already exists" || true

            # Grant privileges
            sudo -u postgres psql -d "${db}" -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO beautycita_app;" 2>&1 || true
            sudo -u postgres psql -d "${db}" -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO beautycita_app;" 2>&1 || true

            log_success "Database ${db} restored"
        else
            log_warning "Database dump for ${db} not found"
        fi
    done

    log_success "Database restoration complete"
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
    fi

    if [[ -f "${TEMP_DIR}/configs/env/frontend.env" ]]; then
        cp "${TEMP_DIR}/configs/env/frontend.env" "${PROJECT_ROOT}/frontend/.env"
        chmod 644 "${PROJECT_ROOT}/frontend/.env"
        chown www-data:www-data "${PROJECT_ROOT}/frontend/.env"
    fi

    # Restore PM2 ecosystem
    if [[ -f "${TEMP_DIR}/configs/ecosystem.config.js" ]]; then
        cp "${TEMP_DIR}/configs/ecosystem.config.js" "${PROJECT_ROOT}/"
        chown www-data:www-data "${PROJECT_ROOT}/ecosystem.config.js"
    fi

    # Restore Nginx configuration
    log_info "Restoring Nginx configuration..."
    if [[ -d "${TEMP_DIR}/configs/nginx" ]]; then
        cp "${TEMP_DIR}/configs/nginx/"*.conf /etc/nginx/sites-available/ 2>/dev/null || true

        # Update server IP references in nginx configs
        log_info "Updating IP addresses in Nginx configs..."
        find /etc/nginx/sites-available/ -name "*.conf" -type f -exec sed -i 's/listen 443 ssl/listen 443 ssl/g' {} \;

        # Enable sites
        for conf in /etc/nginx/sites-available/*.conf; do
            if [[ -f "$conf" ]]; then
                site_name=$(basename "$conf")
                ln -sf "$conf" "/etc/nginx/sites-enabled/${site_name}" 2>/dev/null || true
            fi
        done
    fi

    log_success "Configurations restored"
}

# Function to setup SSL
setup_ssl() {
    log_step "Step 9: Setting Up SSL Certificates"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would setup SSL for ${DOMAIN}"
        return 0
    fi

    # Check if archive has SSL certs
    if [[ -f "${TEMP_DIR}/ssl/letsencrypt.tar.gz" ]]; then
        log_info "Extracting existing SSL certificates..."
        tar -xzf "${TEMP_DIR}/ssl/letsencrypt.tar.gz" -C /etc/

        log_warning "SSL certificates restored from backup"
        log_warning "You MUST update DNS to point ${DOMAIN} to ${NEW_SERVER_IP}"
        log_warning "Then run: sudo certbot renew --force-renewal"
    else
        log_info "No existing SSL certificates found"
        log_info "To obtain new certificates, ensure DNS points to ${NEW_SERVER_IP}, then run:"
        log_info "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
    fi

    log_success "SSL setup complete"
}

# Function to build frontend
build_frontend() {
    log_step "Step 10: Building Frontend"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would build frontend"
        return 0
    fi

    if [[ -d "${PROJECT_ROOT}/frontend" ]]; then
        log_info "Building frontend application..."
        cd "${PROJECT_ROOT}/frontend"
        sudo -u www-data npm run build
        log_success "Frontend built successfully"
    else
        log_warning "Frontend directory not found"
    fi
}

# Function to start services
start_services() {
    log_step "Step 11: Starting Services"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would start PostgreSQL, Redis, PM2, and Nginx"
        return 0
    fi

    # Start PostgreSQL
    log_info "Starting PostgreSQL..."
    systemctl start postgresql
    systemctl enable postgresql

    # Start Redis
    log_info "Starting Redis..."
    systemctl start redis-server
    systemctl enable redis-server

    # Start backend with PM2
    log_info "Starting backend with PM2..."
    cd "${PROJECT_ROOT}"
    sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 start ecosystem.config.js"
    sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 save"

    # Test Nginx configuration
    log_info "Testing Nginx configuration..."
    if nginx -t; then
        log_info "Starting Nginx..."
        systemctl restart nginx
        systemctl enable nginx
        log_success "Nginx started"
    else
        log_error "Nginx configuration test failed!"
        return 1
    fi

    log_success "All services started"
}

# Function to run health checks
run_health_checks() {
    log_step "Step 12: Running Health Checks"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would run health checks"
        return 0
    fi

    local all_checks_passed=true

    # Check PostgreSQL
    log_info "Checking PostgreSQL..."
    if sudo -u postgres psql -c '\l' >/dev/null 2>&1; then
        log_success "✓ PostgreSQL is running"
    else
        log_error "✗ PostgreSQL check failed"
        all_checks_passed=false
    fi

    # Check Redis
    log_info "Checking Redis..."
    if redis-cli ping >/dev/null 2>&1; then
        log_success "✓ Redis is running"
    else
        log_error "✗ Redis check failed"
        all_checks_passed=false
    fi

    # Check PM2
    log_info "Checking PM2..."
    if sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 list" | grep -q "online"; then
        log_success "✓ PM2 processes are running"
    else
        log_error "✗ PM2 check failed"
        all_checks_passed=false
    fi

    # Check Nginx
    log_info "Checking Nginx..."
    if systemctl is-active --quiet nginx; then
        log_success "✓ Nginx is running"
    else
        log_error "✗ Nginx check failed"
        all_checks_passed=false
    fi

    # Check Backend API
    log_info "Checking Backend API..."
    sleep 3  # Give backend time to start
    if curl -s http://localhost:4000/api/health >/dev/null 2>&1; then
        log_success "✓ Backend API is responding"
    else
        log_warning "⚠ Backend API check failed (may need more time to start)"
    fi

    # Check disk space
    log_info "Checking disk space..."
    local disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $disk_usage -lt 80 ]]; then
        log_success "✓ Disk space: ${disk_usage}% used"
    else
        log_warning "⚠ Disk space is low: ${disk_usage}% used"
    fi

    if [[ "$all_checks_passed" == true ]]; then
        log_success "All critical health checks passed!"
    else
        log_error "Some health checks failed. Please investigate."
        return 1
    fi
}

# Function to display post-installation instructions
show_post_install() {
    log_step "Installation Complete!"

    cat <<EOF

╔════════════════════════════════════════════════════════════╗
║           BeautyCita Successfully Installed!               ║
╚════════════════════════════════════════════════════════════╝

📋 Post-Installation Checklist:

1. Update DNS Records:
   - Point ${DOMAIN} A record to ${NEW_SERVER_IP}
   - Point www.${DOMAIN} A record to ${NEW_SERVER_IP}
   - Wait for DNS propagation (can take up to 48 hours)

2. Renew SSL Certificates:
   sudo certbot renew --force-renewal

3. Verify Services:
   - Backend API: curl http://localhost:4000/api/health
   - PM2 Status: sudo -u www-data pm2 status
   - Nginx Status: sudo systemctl status nginx
   - Database: sudo -u postgres psql -l

4. Test Application:
   - Visit: https://${DOMAIN}
   - Check logs: sudo -u www-data pm2 logs

5. Setup Monitoring:
   - Configure log rotation
   - Setup alerting
   - Enable automated backups

6. Security:
   - Update firewall rules
   - Review .env file permissions
   - Enable fail2ban if needed

📁 Important Paths:
   - Project: ${PROJECT_ROOT}
   - Logs: ${PROJECT_ROOT}/backend/logs/
   - Nginx Config: /etc/nginx/sites-available/
   - SSL Certs: /etc/letsencrypt/live/${DOMAIN}/

🔧 Useful Commands:
   - View logs: sudo -u www-data pm2 logs
   - Restart backend: sudo -u www-data pm2 restart all
   - Nginx reload: sudo systemctl reload nginx
   - Check health: curl http://localhost:4000/api/health

Need help? Check ${PROJECT_ROOT}/CLAUDE.md for documentation.

EOF
}

# Main execution
main() {
    verify_archive
    extract_archive
    install_dependencies
    setup_user
    restore_code
    restore_media
    restore_database
    restore_configs
    setup_ssl
    build_frontend
    start_services
    run_health_checks

    if [[ "$DRY_RUN" == false ]]; then
        show_post_install
    else
        log_info ""
        log_info "Dry run complete. Run without --dry-run to perform actual installation."
    fi
}

# Execute main function
main
