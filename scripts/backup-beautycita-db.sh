#!/bin/bash

# BeautyCita PostgreSQL Backup Script
# Automated database backup with retention policy

set -e

# Configuration
DB_NAME="beautycita"
DB_USER="beautycita_app"
DB_PASSWORD="qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk="
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="/var/www/beautycita.com/database/backups"
LOG_FILE="/var/www/beautycita.com/database/backups/backup.log"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/beautycita_${DATE}.sql.gz"

# Retention settings (days)
DAILY_RETENTION=7
WEEKLY_RETENTION=28
MONTHLY_RETENTION=365

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Start backup
log "Starting backup of database: ${DB_NAME}"

# Export password for pg_dump
export PGPASSWORD="${DB_PASSWORD}"

# Create backup with pg_dump and compress
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --format=custom | gzip > "${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log "Backup completed successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    log "ERROR: Backup failed"
    exit 1
fi

# Unset password
unset PGPASSWORD

# Retention policy - Remove old backups
log "Applying retention policy..."

# Keep only last 7 daily backups
find "${BACKUP_DIR}" -name "beautycita_*.sql.gz" -type f -mtime +${DAILY_RETENTION} -delete 2>/dev/null || true

# Count remaining backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "beautycita_*.sql.gz" -type f | wc -l)
log "Retention applied. Current backup count: ${BACKUP_COUNT}"

# Disk usage
DISK_USAGE=$(du -sh "${BACKUP_DIR}" | cut -f1)
log "Backup directory size: ${DISK_USAGE}"

log "Backup process completed"
