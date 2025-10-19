#!/bin/bash
################################################################################
# BeautyCita Server Migration Backup Script
# Creates a complete backup of the entire system for migration
#
# Usage:
#   ./migration-backup.sh [--dry-run] [--output-dir /path/to/backups]
#
# Features:
#   - Full PostgreSQL database dump with all schemas
#   - Complete codebase archive
#   - Media files backup
#   - Configuration files (nginx, systemd, env)
#   - SSL certificates
#   - Checksums for integrity verification
#   - Dry-run mode for testing
################################################################################

set -euo pipefail  # Exit on error, undefined vars, and pipe failures

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/var/www/beautycita.com"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEFAULT_BACKUP_DIR="${PROJECT_ROOT}/backups/migration_${TIMESTAMP}"
DRY_RUN=false

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

# Parse arguments
BACKUP_DIR="${DEFAULT_BACKUP_DIR}"
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --output-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--dry-run] [--output-dir /path/to/backups]"
            echo ""
            echo "Options:"
            echo "  --dry-run        Show what would be backed up without actually doing it"
            echo "  --output-dir     Specify custom backup directory (default: ${DEFAULT_BACKUP_DIR})"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Print banner
echo "=========================================="
echo "BeautyCita Migration Backup Script"
echo "=========================================="
echo "Timestamp: ${TIMESTAMP}"
echo "Backup Directory: ${BACKUP_DIR}"
echo "Dry Run: ${DRY_RUN}"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]] && ! sudo -n true 2>/dev/null; then
    log_error "This script requires root privileges or passwordless sudo"
    log_info "Please run with: sudo $0 $*"
    exit 1
fi

# Function to check required commands
check_requirements() {
    log_info "Checking requirements..."

    local missing_tools=()
    local required_tools=("tar" "gzip" "pg_dump" "sha256sum" "jq")

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Install with: sudo apt-get install -y postgresql-client coreutils jq"
        exit 1
    fi

    log_success "All requirements met"
}

# Function to create backup directory structure
create_backup_dirs() {
    log_info "Creating backup directory structure..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would create: ${BACKUP_DIR}"
        return 0
    fi

    mkdir -p "${BACKUP_DIR}"/{database,code,media,configs,ssl,logs}
    chmod -R 777 "${BACKUP_DIR}"
    chown -R postgres:postgres "${BACKUP_DIR}/database"

    log_success "Backup directories created at: ${BACKUP_DIR}"
}

# Function to backup database
backup_database() {
    log_info "Backing up PostgreSQL databases..."

    local db_list=("beautycita" "beautycita_db" "beautycita_dev" "beautycita_rasa")

    for db in "${db_list[@]}"; do
        log_info "  - Backing up database: ${db}"

        if [[ "$DRY_RUN" == true ]]; then
            log_info "    [DRY-RUN] Would run: pg_dump ${db} > ${db}.sql"
            continue
        fi

        # Check if database exists
        if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "${db}"; then
            # Dump database with custom format for better compression and parallel restore
            if sudo -u postgres pg_dump -Fc -Z9 -f "${BACKUP_DIR}/database/${db}.dump" "${db}" 2>&1; then
                # Also create SQL text dump for easier inspection
                sudo -u postgres pg_dump -f "${BACKUP_DIR}/database/${db}.sql" "${db}" 2>&1 || true

                # Dump schema only for quick reference
                sudo -u postgres pg_dump --schema-only -f "${BACKUP_DIR}/database/${db}_schema.sql" "${db}" 2>&1 || true

                # Get database size
                local db_size=$(sudo -u postgres psql -d "${db}" -t -c "SELECT pg_size_pretty(pg_database_size('${db}'))" | xargs 2>/dev/null || echo "unknown")
                log_success "    Backed up ${db} (Size: ${db_size})"
            else
                log_error "    Failed to backup ${db}"
            fi
        else
            log_warning "    Database ${db} does not exist, skipping"
        fi
    done

    # Backup PostgreSQL global objects (roles, tablespaces)
    if [[ "$DRY_RUN" == false ]]; then
        log_info "  - Backing up PostgreSQL global objects..."
        sudo -u postgres pg_dumpall --globals-only -f "${BACKUP_DIR}/database/globals.sql" 2>&1
        log_success "    PostgreSQL globals backed up"
    fi

    log_success "Database backup complete"
}

# Function to backup codebase
backup_code() {
    log_info "Backing up application codebase..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would backup ${PROJECT_ROOT} to ${BACKUP_DIR}/code/"
        return 0
    fi

    # Create tarball excluding unnecessary files
    tar -czf "${BACKUP_DIR}/code/beautycita-code.tar.gz" \
        -C "$(dirname ${PROJECT_ROOT})" \
        --exclude='node_modules' \
        --exclude='frontend/node_modules' \
        --exclude='backend/node_modules' \
        --exclude='frontend/dist' \
        --exclude='frontend/build' \
        --exclude='admin/build' \
        --exclude='*.log' \
        --exclude='.git' \
        --exclude='backups' \
        --exclude='logs/*' \
        "$(basename ${PROJECT_ROOT})" 2>&1

    local code_size=$(du -sh "${BACKUP_DIR}/code/beautycita-code.tar.gz" | cut -f1)
    log_success "Codebase backed up (Size: ${code_size})"

    # Backup package.json files separately for quick reference
    find "${PROJECT_ROOT}" -name "package.json" -not -path "*/node_modules/*" -exec cp --parents {} "${BACKUP_DIR}/code/" \; 2>/dev/null || true
    log_success "Package manifests copied for reference"
}

# Function to backup media files
backup_media() {
    log_info "Backing up media files..."

    if [[ ! -d "${PROJECT_ROOT}/media" ]]; then
        log_warning "Media directory not found, skipping"
        return 0
    fi

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would backup ${PROJECT_ROOT}/media"
        return 0
    fi

    tar -czf "${BACKUP_DIR}/media/beautycita-media.tar.gz" \
        -C "${PROJECT_ROOT}" \
        media 2>&1

    local media_size=$(du -sh "${BACKUP_DIR}/media/beautycita-media.tar.gz" | cut -f1)
    log_success "Media files backed up (Size: ${media_size})"
}

# Function to backup configuration files
backup_configs() {
    log_info "Backing up configuration files..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would backup nginx, systemd, and env configs"
        return 0
    fi

    # Nginx configuration
    log_info "  - Backing up Nginx configurations..."
    mkdir -p "${BACKUP_DIR}/configs/nginx"
    cp -r /etc/nginx/sites-available/* "${BACKUP_DIR}/configs/nginx/" 2>/dev/null || true
    cp -r /etc/nginx/sites-enabled "${BACKUP_DIR}/configs/nginx/" 2>/dev/null || true
    cp /etc/nginx/nginx.conf "${BACKUP_DIR}/configs/nginx/" 2>/dev/null || true

    # Environment files
    log_info "  - Backing up environment files..."
    mkdir -p "${BACKUP_DIR}/configs/env"
    cp "${PROJECT_ROOT}/.env" "${BACKUP_DIR}/configs/env/beautycita.env" 2>/dev/null || true
    cp "${PROJECT_ROOT}/.env.production" "${BACKUP_DIR}/configs/env/beautycita.env.production" 2>/dev/null || true
    cp "${PROJECT_ROOT}/frontend/.env" "${BACKUP_DIR}/configs/env/frontend.env" 2>/dev/null || true

    # PM2 ecosystem
    log_info "  - Backing up PM2 configuration..."
    cp "${PROJECT_ROOT}/ecosystem.config.js" "${BACKUP_DIR}/configs/" 2>/dev/null || true

    # Save PM2 process list
    if command -v pm2 &> /dev/null; then
        sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 jlist" > "${BACKUP_DIR}/configs/pm2-processes.json" 2>/dev/null || true
    fi

    # Systemd services (if any)
    log_info "  - Backing up systemd services..."
    mkdir -p "${BACKUP_DIR}/configs/systemd"
    cp /etc/systemd/system/beautycita*.service "${BACKUP_DIR}/configs/systemd/" 2>/dev/null || true

    # Crontab
    log_info "  - Backing up crontabs..."
    crontab -l > "${BACKUP_DIR}/configs/root-crontab.txt" 2>/dev/null || echo "No root crontab" > "${BACKUP_DIR}/configs/root-crontab.txt"
    sudo -u www-data crontab -l > "${BACKUP_DIR}/configs/www-data-crontab.txt" 2>/dev/null || echo "No www-data crontab" > "${BACKUP_DIR}/configs/www-data-crontab.txt"

    log_success "Configuration files backed up"
}

# Function to backup SSL certificates
backup_ssl() {
    log_info "Backing up SSL certificates..."

    if [[ ! -d "/etc/letsencrypt" ]]; then
        log_warning "Let's Encrypt directory not found, skipping"
        return 0
    fi

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would backup /etc/letsencrypt"
        return 0
    fi

    tar -czf "${BACKUP_DIR}/ssl/letsencrypt.tar.gz" \
        -C /etc \
        letsencrypt 2>&1

    local ssl_size=$(du -sh "${BACKUP_DIR}/ssl/letsencrypt.tar.gz" | cut -f1)
    log_success "SSL certificates backed up (Size: ${ssl_size})"
}

# Function to collect system information
collect_system_info() {
    log_info "Collecting system information..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would collect system information"
        return 0
    fi

    local info_file="${BACKUP_DIR}/system_info.txt"

    {
        echo "=========================================="
        echo "BeautyCita Server System Information"
        echo "=========================================="
        echo "Backup Date: $(date)"
        echo "Hostname: $(hostname)"
        echo "IP Address: $(hostname -I | awk '{print $1}')"
        echo ""
        echo "--- Operating System ---"
        cat /etc/os-release
        echo ""
        echo "--- Kernel ---"
        uname -a
        echo ""
        echo "--- CPU ---"
        lscpu | grep -E "^Model name|^CPU\(s\)|^Thread|^Core"
        echo ""
        echo "--- Memory ---"
        free -h
        echo ""
        echo "--- Disk ---"
        df -h
        echo ""
        echo "--- Software Versions ---"
        echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
        echo "npm: $(npm --version 2>/dev/null || echo 'Not installed')"
        echo "PostgreSQL: $(psql --version 2>/dev/null || echo 'Not installed')"
        echo "Redis: $(redis-cli --version 2>/dev/null || echo 'Not installed')"
        echo "Nginx: $(nginx -v 2>&1 || echo 'Not installed')"
        echo "PM2: $(sudo -u www-data pm2 --version 2>/dev/null || echo 'Not installed')"
        echo ""
        echo "--- PM2 Processes ---"
        sudo -u www-data bash -c "cd ${PROJECT_ROOT} && pm2 list" 2>/dev/null || echo "PM2 not running"
        echo ""
        echo "--- Database List ---"
        sudo -u postgres psql -l 2>/dev/null || echo "Cannot connect to PostgreSQL"
        echo ""
        echo "--- Nginx Sites ---"
        ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No nginx sites"
        echo ""
    } > "$info_file"

    log_success "System information collected"
}

# Function to create manifest with checksums
create_manifest() {
    log_info "Creating backup manifest with checksums..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would create manifest.json"
        return 0
    fi

    local manifest_file="${BACKUP_DIR}/manifest.json"

    # Calculate checksums for all backup files
    local checksums_file="${BACKUP_DIR}/checksums.sha256"
    find "${BACKUP_DIR}" -type f -not -name "checksums.sha256" -not -name "manifest.json" -exec sha256sum {} \; > "$checksums_file"

    # Create JSON manifest
    cat > "$manifest_file" <<EOF
{
  "backup_info": {
    "timestamp": "${TIMESTAMP}",
    "date": "$(date -Iseconds)",
    "hostname": "$(hostname)",
    "source_ip": "$(hostname -I | awk '{print $1}')",
    "backup_dir": "${BACKUP_DIR}",
    "script_version": "1.0.0"
  },
  "components": {
    "database": {
      "databases": ["beautycita", "beautycita_db", "beautycita_dev", "beautycita_rasa"],
      "format": "PostgreSQL custom format (.dump) + SQL text",
      "location": "database/"
    },
    "code": {
      "format": "tar.gz",
      "location": "code/beautycita-code.tar.gz",
      "excludes": ["node_modules", "dist", "build", ".git", "logs"]
    },
    "media": {
      "format": "tar.gz",
      "location": "media/beautycita-media.tar.gz"
    },
    "configs": {
      "nginx": "configs/nginx/",
      "environment": "configs/env/",
      "pm2": "configs/ecosystem.config.js",
      "systemd": "configs/systemd/"
    },
    "ssl": {
      "format": "tar.gz",
      "location": "ssl/letsencrypt.tar.gz"
    }
  },
  "system": {
    "os": "$(grep '^NAME=' /etc/os-release | cut -d= -f2 | tr -d '"')",
    "os_version": "$(grep '^VERSION=' /etc/os-release | cut -d= -f2 | tr -d '"')",
    "node_version": "$(node --version 2>/dev/null || echo 'unknown')",
    "npm_version": "$(npm --version 2>/dev/null || echo 'unknown')",
    "postgres_version": "$(psql --version 2>/dev/null | awk '{print $3}' || echo 'unknown')",
    "redis_version": "$(redis-cli --version 2>/dev/null | awk '{print $2}' || echo 'unknown')"
  },
  "checksums_file": "checksums.sha256"
}
EOF

    log_success "Manifest created: ${manifest_file}"
}

# Function to create final archive
create_final_archive() {
    log_info "Creating final migration archive..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Would create final archive"
        return 0
    fi

    local archive_name="beautycita-migration-${TIMESTAMP}.tar.gz"
    local archive_path="$(dirname ${BACKUP_DIR})/${archive_name}"

    tar -czf "${archive_path}" \
        -C "$(dirname ${BACKUP_DIR})" \
        "$(basename ${BACKUP_DIR})" 2>&1

    local archive_size=$(du -sh "${archive_path}" | cut -f1)

    # Calculate checksum of final archive
    local archive_checksum=$(sha256sum "${archive_path}" | awk '{print $1}')

    log_success "Final archive created: ${archive_path}"
    log_success "Archive size: ${archive_size}"
    log_success "SHA256: ${archive_checksum}"

    # Create checksum file alongside archive
    echo "${archive_checksum}  ${archive_name}" > "${archive_path}.sha256"

    echo ""
    echo "=========================================="
    echo "Backup Complete!"
    echo "=========================================="
    echo "Archive: ${archive_path}"
    echo "Size: ${archive_size}"
    echo "Checksum: ${archive_checksum}"
    echo ""
    echo "To transfer to new server:"
    echo "  scp ${archive_path} root@74.208.218.18:/tmp/"
    echo ""
    echo "To verify integrity on new server:"
    echo "  sha256sum -c ${archive_name}.sha256"
    echo "=========================================="
}

# Main execution flow
main() {
    log_info "Starting BeautyCita migration backup..."
    echo ""

    check_requirements
    create_backup_dirs
    backup_database
    backup_code
    backup_media
    backup_configs
    backup_ssl
    collect_system_info
    create_manifest

    if [[ "$DRY_RUN" == false ]]; then
        create_final_archive
    else
        echo ""
        log_info "Dry run complete. No files were actually backed up."
        log_info "Run without --dry-run to perform actual backup."
    fi

    log_success "Migration backup process completed successfully!"
}

# Run main function
main
